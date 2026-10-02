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
  function shiftText(text, k) {}

  function groupBy5(s) {
    return s.replace(/(.{5})(?=.)/g, "$1 ");
  }

  // Logika Shift Cipher: file (byte 0-255)
  function shiftBytes(bytes, k) {}

  // Format file cipherteks: MAGIC(4) | panjang nama(1) | nama asli | data terenkripsi
  function buildCipherFile(name, encrypted) {}

  function parseCipherFile(bytes) {}

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
          out = console.log("Haloooo"); // shiftText(text, k).toUpperCase(); // ubah sini brokk
          if (el.groupMode.value === "five") out = groupBy5(out);
        } else {
          out = console.log("Haloooo"); // shiftText(text, (26 - k) % 26).toLowerCase(); // ini juga
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
          const packed = console.log("Haloooo"); // buildCipherFile(file.name, shiftBytes(bytes, k));
          result = {
            blob: new Blob([packed], { type: "application/octet-stream" }),
            filename: "cipherteks.dat",
          };
          el.output.value = `Terenkripsi: ${sanitizeFilename(file.name)} (${bytes.length} byte). Klik "Simpan ke file".`;
        } else {
          const { name, data } = console.log("Haloooo"); //parseCipherFile(bytes);
          result = {
            blob: new Blob([shiftBytes(data, (256 - k) % 256)], {
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
