// ISI dengan config project Firebase Anda sendiri.
// Cara ambil: Firebase Console > Project Settings > General > Your apps > Web app (</>) > SDK setup and configuration.
export const firebaseConfig = {
  apiKey: "ISI_API_KEY_ANDA",
  authDomain: "ISI_PROJECT_ID.firebaseapp.com",
  projectId: "ISI_PROJECT_ID",
  storageBucket: "ISI_PROJECT_ID.appspot.com",
  messagingSenderId: "ISI_SENDER_ID",
  appId: "ISI_APP_ID",
};

// Ganti nama file di Storage kalau perlu (folder tempat semua unggahan disimpan)
export const UPLOAD_FOLDER = "uploads";

// Batas ukuran file (bytes) — samakan juga angkanya di storage.rules
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
