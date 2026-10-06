# Shift Cipher — Kriptosistem Sederhana (GUI Berbasis Web)

Tugas 1 Mata Kuliah Kriptografi  
Program Studi Informatika — Fakultas Teknologi Informasi dan Sains Data  
Universitas Sebelas Maret | Semester Ganjil 2026/2027

---

## Deskripsi

Aplikasi web untuk mengenkripsi dan mendekripsi pesan menggunakan **Shift Cipher** (Caesar Cipher).  
Mendukung input teks dari papan ketik maupun file sembarang (teks atau biner).

---

## Teknologi

- HTML5
- CSS3
- JavaScript (Vanilla, tanpa framework)

---

## Cara Menjalankan

Tidak memerlukan instalasi atau server backend.

1. Clone atau unduh repository ini.

   ```bash
   git clone https://github.com/<username>/<repo>.git
   cd <repo>
   ```

2. Pastikan tiga file berada dalam satu folder:

   ```
   index.html
   style.css
   script.js
   ```

3. Buka `index.html` langsung di browser (Chrome, Firefox, Edge, atau Safari versi terbaru).
   ```
   Klik kanan → Open with → Browser
   — atau —
   Klik kanan → Open with Live Server (Rekomendasi)
   ```

> Tidak perlu `npm install`, `composer`, atau perintah apapun. Cukup buka file HTML.

---

## Cara Menggunakan

### Enkripsi / Dekripsi Teks

1. Pilih jenis input **Teks (papan ketik)**.
2. Pilih operasi **Enkripsi** atau **Dekripsi**.
3. Masukkan kunci berupa bilangan bulat (contoh: `3`).
4. Ketik pesan di kotak input.
5. Klik **Enkripsi** / **Dekripsi**.
6. Hasil muncul di kotak bawah. Bisa disalin atau disimpan ke file `.txt`.

> Hanya huruf A–Z yang diproses. Angka, spasi, dan tanda baca dibuang dari hasil.  
> Tampilan cipherteks bisa dipilih: tanpa spasi atau kelompok 5 huruf.

### Enkripsi / Dekripsi File

1. Pilih jenis input **File (teks / biner)**.
2. Pilih operasi **Enkripsi** atau **Dekripsi**.
3. Masukkan kunci (bilangan bulat, dihitung mod 256).
4. Pilih file yang ingin diproses.
5. Klik **Enkripsi** / **Dekripsi**.
6. Klik **Simpan ke file** untuk mengunduh hasilnya.

> - Hasil enkripsi disimpan sebagai `.dat`. Nama dan ekstensi file asli tersimpan di dalamnya.
> - Saat dekripsi, nama file asli dipulihkan otomatis. Pastikan kunci yang digunakan sama.

---

## Spesifikasi yang Diimplementasikan

| No  | Spesifikasi                                         | Status |
| --- | --------------------------------------------------- | ------ |
| 1   | Input dari papan ketik dan file (teks/biner)        | ✅     |
| 2   | Enkripsi plainteks (hanya huruf A–Z untuk teks)     | ✅     |
| 4   | Dekripsi cipherteks menjadi plainteks               | ✅     |
| 5   | Tampilan cipherteks: tanpa spasi / kelompok 5 huruf | ✅     |
| 6   | Simpan cipherteks ke file                           | ✅     |
| 7   | Kunci dimasukkan pengguna                           | ✅     |
| 8   | Enkripsi file per byte termasuk header              | ✅     |
| 9   | File cipherteks `.dat` menyimpan nama/ekstensi asli | ✅     |

---

## Catatan

- Program ini hanya menangani **Shift Cipher**. Cipher lain ditangani oleh anggota kelompok lain.
- Logika cipher ada di `script.js` pada fungsi `shiftText` (teks) dan `shiftBytes` (file).
- Tidak ada data yang dikirim ke server — semua proses berjalan di browser.
