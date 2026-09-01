# Berkas — penyimpanan file tanpa akun untuk dkvsekaone.github.io

Situs statis (HTML/CSS/JS murni, tanpa framework) yang berfungsi seperti "Google Drive mini":
upload, download, preview thumbnail untuk berbagai jenis file, dan gerbang kode akses yang bisa
diatur manual maupun berganti otomatis secara berkala — semua tanpa sistem login.

## Kenapa perlu Firebase?

GitHub Pages hanya menyajikan file statis — tidak ada server untuk menyimpan file upload agar
bisa diakses dari perangkat lain. Karena itu aplikasi ini memakai **Firebase** (paket gratis
"Spark" cukup untuk pemakaian personal/tim kecil) sebagai tempat penyimpanan file (Storage) dan
data (Firestore). Prosesnya sepenuhnya berjalan di browser pengunjung — Anda tidak perlu
mengelola server.

## Langkah setup

### 1. Buat project Firebase
1. Buka [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Ikuti wizard-nya (Google Analytics boleh dimatikan, tidak dipakai di sini).

### 2. Aktifkan Anonymous Authentication
1. Di sidebar: **Build → Authentication → Get started**.
2. Tab **Sign-in method** → aktifkan **Anonymous**.
   (Ini membuat pengunjung otomatis "masuk" tanpa melihat form login apa pun.)

### 3. Aktifkan Firestore Database
1. **Build → Firestore Database → Create database** → pilih mode **production**.
2. Setelah dibuat, buka tab **Rules**, hapus isinya, lalu tempel isi file `firestore.rules`
   dari folder ini. Klik **Publish**.

### 4. Aktifkan Storage
1. **Build → Storage → Get started** (pilih lokasi server terdekat, mis. `asia-southeast1`).
2. Buka tab **Rules**, tempel isi file `storage.rules` dari folder ini. Klik **Publish**.

### 5. Ambil konfigurasi Web App
1. **Project settings** (ikon gerigi) → scroll ke **Your apps** → klik ikon **</>** (Web).
2. Beri nama app, lalu Firebase menampilkan objek `firebaseConfig`.
3. Salin nilai-nilainya ke `js/firebase-config.js` di proyek ini (ganti semua `ISI_...`).

### 6. Ganti kata sandi admin
File `js/admin.js` memakai kata sandi dalam bentuk hash (bukan teks biasa) agar tidak
langsung terbaca di kode sumber. Bikin hash baru dengan menjalankan ini di **Console
browser** mana saja (tekan F12):

```js
crypto.subtle.digest('SHA-256', new TextEncoder().encode('kata_sandi_baru_anda'))
  .then(buf => console.log([...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('')))
```

Salin hasilnya (64 karakter huruf-angka), tempel sebagai nilai `ADMIN_PASSWORD_HASH` di
`js/admin.js`, menggantikan hash bawaan (yang merupakan hash dari kata sandi contoh
`ubahsaya` — **wajib diganti sebelum dipakai serius**).

### 7. Upload ke repo dan aktifkan GitHub Pages
1. Masukkan semua isi folder ini ke repo `dkvsekaone.github.io` (root repo, bukan subfolder,
   supaya `index.html` langsung terbuka di `https://dkvsekaone.github.io/`).
2. **Settings → Pages** → pastikan sumbernya branch utama (`main`) folder `/root`.
3. Tunggu beberapa menit, lalu buka `https://dkvsekaone.github.io/admin.html` untuk
   mengatur kode akses pertama kali (aplikasi otomatis membuat kode acak pertama saat
   panel admin pertama kali dibuka).
4. Bagikan alamat utama (`https://dkvsekaone.github.io/`) beserta kode aksesnya ke
   orang-orang yang Anda percaya.

## Cara pakai

- **Halaman utama**: masukkan kode akses → seret file ke area unggah atau klik untuk
  memilih file → file langsung muncul di semua perangkat lain yang membuka halaman ini.
  Gambar, video, dan PDF tampil dengan thumbnail asli; jenis file lain tampil dengan
  lencana ikon berwarna sesuai ekstensinya.
- **Halaman admin** (`admin.html`): lihat kode aktif saat ini, buat kode acak baru kapan
  saja, atur kode secara manual, atau ubah interval rotasi otomatis (dalam menit).

## Cara kerja rotasi otomatis

Karena situs ini statis (tidak ada server yang selalu menyala), rotasi otomatis diperiksa
**saat panel admin dibuka**, dan terus dicek tiap detik selama panel admin itu terbuka di
tab browser. Begitu waktunya habis, kode baru langsung dibuat dan ditampilkan. Kalau tidak
ada yang membuka `admin.html` saat waktu rotasi lewat, kode lama tetap berlaku sampai
panel admin dibuka lagi. Untuk rotasi yang benar-benar berjalan di latar belakang tanpa
perlu membuka apa pun, dibutuhkan Cloud Function terjadwal (paket berbayar Firebase
"Blaze") — di luar cakupan setup gratis ini, tapi bisa ditambahkan belakangan.

## Catatan jujur soal keamanan

Ini bukan sistem login sungguhan, dan situsnya statis tanpa server sendiri, jadi ada
batasan yang perlu Anda tahu:

- Kode akses **tidak disimpan dalam bentuk teks biasa** di database (hanya hash-nya),
  supaya orang yang mengintip data Firestore tidak langsung tahu kodenya. Tapi ini bukan
  jaminan tingkat enterprise — seseorang yang cukup paham teknis tetap berpotensi mencoba
  banyak kombinasi (brute-force) terhadap hash tersebut.
- Yang benar-benar dipaksakan oleh aturan Firebase adalah: hanya pengguna yang sudah masuk
  secara anonim lewat aplikasi ini yang boleh menulis data/file. Kode akses berfungsi
  sebagai lapisan etika/kenyamanan di atasnya (mencegah pengunjung iseng), bukan pengganti
  keamanan tingkat sistem.
- Cocok untuk kebutuhan personal atau tim kecil yang saling percaya. Untuk data sangat
  sensitif, sebaiknya tambahkan verifikasi kode di sisi server (Cloud Function).
- Jaga link `admin.html` tidak disebar sembarangan — anggap seperti kunci cadangan rumah.

## Struktur file

```
index.html          halaman utama (publik)
admin.html           panel admin
css/style.css        semua styling
js/firebase-config.js   ISI dengan config Firebase Anda
js/firebase-init.js     inisialisasi Firebase + auth anonim
js/crypto-utils.js      hashing, format ukuran/tanggal/hitung mundur
js/thumbnails.js        pembuat preview thumbnail per jenis file
js/app.js               logika halaman publik
js/admin.js             logika panel admin
firestore.rules         aturan keamanan Firestore (tempel di console)
storage.rules           aturan keamanan Storage (tempel di console)
```
