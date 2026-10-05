"use strict";

(() => {
  // ====== Konfigurasi & batas keamanan ======
  const MAX_TEXT = 100000; // karakter
  const MAX_FILE = 10 * 1024 * 1024; // 10 MB
  const MAX_NAME = 100; // panjang nama file asli yang disimpan
  const MAGIC = [0x53, 0x43, 0x30, 0x31]; // "SC01": penanda format file cipherteks
  const KEY_PATTERN = /^-?\d{1,9}$/;

  const $ = (id) => document.getElementById(id);
  const el = {
    inputType: $("inputType"),
    key: $("key"),
    keyHint: $("keyHint"),
    textBox: $("textBox"),
    fileBox: $("fileBox"),
    inputText: $("inputText"),
    inputTextLabel: $("inputTextLabel"),
    counter: $("counter"),
    groupRow: $("groupRow"),
    groupMode: $("groupMode"),
    inputFile: $("inputFile"),
    inputFileLabel: $("inputFileLabel"),
    fileInfo: $("fileInfo"),
    run: $("run"),
    reset: $("reset"),
    output: $("output"),
    outputLabel: $("outputLabel"),
    download: $("download"),
    copy: $("copy"),
    message: $("message"),
  };

  let result = null; // { blob, filename }

  // Helper UI
  const getOperation = () =>
    document.querySelector('input[name="operation"]:checked').value;

  function showMessage(text, ok = false) {
    el.message.textContent = text;
    el.message.classList.toggle("ok", ok);
    el.message.hidden = false;
  }
  function clearMessage() {
    el.message.hidden = true;
    el.message.textContent = "";
  }
  function clearResult() {
    result = null;
    el.output.value = "";
    el.download.disabled = true;
    el.copy.disabled = true;
  }

  // validation
  function readKey(modulus) {
    const raw = el.key.value.trim();
    if (!KEY_PATTERN.test(raw)) {
      el.key.classList.add("invalid");
      throw new Error(
        "Kunci harus bilangan bulat (maksimal 9 digit), contoh: 3",
      );
    }
    el.key.classList.remove("invalid");
    const n = parseInt(raw, 10);
    return ((n % modulus) + modulus) % modulus;
  }

  // hapus karakter kontrol & path, batasi panjang. Dipakai saat enkripsi dan dekripsi.
  function sanitizeFilename(name) {
    const base = String(name).split(/[\\/]/).pop();
    const clean = base
      .normalize("NFKC")
      .replace(/[^\w.\- ]/g, "_")
      .replace(/^\.+/, "")
      .slice(0, MAX_NAME)
      .trim();
    return clean || "file";
  }

  function sanitizeTextInput(value) {
    // buang karakter kontrol (kecuali tab/newline) dan batasi panjang
    return value
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .slice(0, MAX_TEXT);
  }

  // ====== Logika Shift Cipher: teks (26 huruf) ======
  function shiftText(text, k) {
    const shift = ((k % 26) + 26) % 26;
    let res = "";
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 65 && code <= 90) {
        // A-Z
        res += String.fromCharCode(((code - 65 + shift) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        // a-z
        res += String.fromCharCode(((code - 97 + shift) % 26) + 97);
      }
    }
    return res;
  }

  function groupBy5(s) {
    return (s.match(/.{1,5}/g) || []).join(" ");
  }

  // Logika Shift Cipher: file (byte 0-255)
  function shiftBytes(bytes, k) {
    const shift = ((k % 256) + 256) % 256;
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = (bytes[i] + shift) & 0xff;
    }
    return out;
  }

  // Format file cipherteks: MAGIC(4) | panjang nama(1) | nama asli | data terenkripsi
  function buildCipherFile(name, encrypted) {
    const cleanName = sanitizeFilename(name);
    const nameBytes = new TextEncoder().encode(cleanName);
    const safeNameBytes = nameBytes.slice(0, 255);
    const headerLen = 4 + 1 + safeNameBytes.length;
    const packet = new Uint8Array(headerLen + encrypted.length);

    // MAGIC header
    packet.set(MAGIC, 0);
    // Panjang nama file
    packet[4] = safeNameBytes.length;
    // Nama file UTF-8
    packet.set(safeNameBytes, 5);
    // Payload byte terenkripsi
    packet.set(encrypted, headerLen);

    return packet;
  }

  function parseCipherFile(bytes) {
    if (bytes.length < 5) {
      throw new Error("File cipherteks tidak valid atau terlalu kecil.");
    }
    // Periksa MAGIC header
    for (let i = 0; i < MAGIC.length; i++) {
      if (bytes[i] !== MAGIC[i]) {
        throw new Error(
          "Format file tidak dikenali. Pastikan file merupakan cipherteks .dat yang valid.",
        );
      }
    }

    const nameLen = bytes[4];
    if (bytes.length < 5 + nameLen) {
      throw new Error("File cipherteks rusak atau terpotong.");
    }

    const nameBytes = bytes.subarray(5, 5 + nameLen);
    const name = sanitizeFilename(new TextDecoder().decode(nameBytes)) || "file_pulih";
    const data = bytes.subarray(5 + nameLen);

    return { name, data };
  }

  // inti program
  async function handleRun() {
    clearMessage();
    clearResult();
    const encrypt = getOperation() === "encrypt";

    try {
      if (el.inputType.value === "text") {
        const k = readKey(26);
        const text = sanitizeTextInput(el.inputText.value);
        if (!/[A-Za-z]/.test(text))
          throw new Error("Masukkan teks yang berisi huruf A–Z.");

        let out;
        if (encrypt) {
          out = shiftText(text, k).toUpperCase();
          if (el.groupMode.value === "five") out = groupBy5(out);
        } else {
          out = shiftText(text, (26 - k) % 26).toLowerCase();
        }
        el.output.value = out;
        result = {
          blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
          filename: encrypt ? "cipherteks.txt" : "plainteks.txt",
        };
      } else {
        const k = readKey(256);
        const file = el.inputFile.files[0];
        if (!file) throw new Error("Pilih file terlebih dahulu.");
        if (file.size === 0) throw new Error("File kosong.");
        if (file.size > MAX_FILE)
          throw new Error("Ukuran file melebihi 10 MB.");

        const bytes = new Uint8Array(await file.arrayBuffer());
        if (encrypt) {
          const encrypted = shiftBytes(bytes, k);
          const packed = buildCipherFile(file.name, encrypted);
          result = {
            blob: new Blob([packed], { type: "application/octet-stream" }),
            filename: "cipherteks.dat",
          };
          el.output.value = `Terenkripsi: ${sanitizeFilename(file.name)} (${bytes.length} byte). Klik "Simpan ke file".`;
        } else {
          const { name, data } = parseCipherFile(bytes);
          const decrypted = shiftBytes(data, (256 - k) % 256);
          result = {
            blob: new Blob([decrypted], {
              type: "application/octet-stream",
            }),
            filename: name,
          };
          el.output.value = `Terdekripsi: ${name} (${data.length} byte). Klik "Simpan ke file". Jika kunci salah, file tidak akan bisa dibuka.`;
        }
      }
      el.download.disabled = false;
      el.copy.disabled = el.inputType.value !== "text";
      showMessage("Berhasil diproses.", true);
    } catch (err) {
      showMessage(err.message || "Terjadi kesalahan.");
    }
  }

  function handleDownload() {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = sanitizeFilename(result.filename);
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(el.output.value);
      showMessage("Hasil disalin.", true);
    } catch {
      showMessage("Gagal menyalin. Salin manual dari kotak hasil.");
    }
  }

  // sinkronisasi tampilan
  function updateUI() {
    const isText = el.inputType.value === "text";
    const encrypt = getOperation() === "encrypt";
    el.textBox.hidden = !isText;
    el.fileBox.hidden = isText;
    el.groupRow.hidden = !(isText && encrypt);
    el.inputTextLabel.textContent = encrypt ? "Plainteks" : "Cipherteks";
    el.inputFileLabel.textContent = encrypt
      ? "Pilih file plainteks"
      : "Pilih file cipherteks (.dat)";
    el.fileInfo.textContent = encrypt
      ? "Maksimal 10 MB. Hasil enkripsi disimpan sebagai .dat."
      : "Maksimal 10 MB. Nama dan ekstensi file asli dipulihkan otomatis.";
    el.keyHint.textContent = isText
      ? "Teks: dihitung mod 26."
      : "File: dihitung mod 256.";
    el.run.textContent = encrypt ? "Enkripsi" : "Dekripsi";
    el.outputLabel.textContent = isText
      ? encrypt
        ? "Cipherteks"
        : "Plainteks"
      : "Hasil";
    clearResult();
    clearMessage();
  }

  function handleReset() {
    el.key.value = "";
    el.key.classList.remove("invalid");
    el.inputText.value = "";
    el.inputFile.value = "";
    el.counter.textContent = "0";
    clearResult();
    clearMessage();
  }

  // ====== Event ======
  el.key.addEventListener("input", () => {
    // hanya angka dan tanda minus di awal
    el.key.value = el.key.value.replace(/(?!^-)[^\d]/g, "").slice(0, 10);
    el.key.classList.remove("invalid");
  });
  el.inputText.addEventListener("input", () => {
    el.counter.textContent = String(el.inputText.value.length);
  });
  el.inputFile.addEventListener("change", () => {
    const f = el.inputFile.files[0];
    if (f && f.size > MAX_FILE) {
      el.inputFile.value = "";
      showMessage("Ukuran file melebihi 10 MB.");
    } else {
      clearMessage();
    }
  });
  el.inputType.addEventListener("change", updateUI);
  document
    .querySelectorAll('input[name="operation"]')
    .forEach((r) => r.addEventListener("change", updateUI));
  el.run.addEventListener("click", handleRun);
  el.reset.addEventListener("click", handleReset);
  el.download.addEventListener("click", handleDownload);
  el.copy.addEventListener("click", handleCopy);

  updateUI();
})();
