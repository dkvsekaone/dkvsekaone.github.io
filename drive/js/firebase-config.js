// ISI dengan config project Firebase Anda sendiri.
// Cara ambil: Firebase Console > Project Settings > General > Your apps > Web app (</>) > SDK setup and configuration.
export const firebaseConfig = {
  apiKey: "AIzaSyDFfJUrk6W70PZNtsyMjl6oCUzjk26Mb68",
  authDomain: "drive-1c594.firebaseapp.com",
  projectId: "drive-1c594",
  storageBucket: "drive-1c594.firebasestorage.app",
  messagingSenderId: "124899070376",
  appId: "1:124899070376:web:b461f221a61122fdc74d9d"
};

// Ganti nama file di Storage kalau perlu (folder tempat semua unggahan disimpan)
export const UPLOAD_FOLDER = "uploads";

// Batas ukuran file (bytes) — samakan juga angkanya di storage.rules
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
