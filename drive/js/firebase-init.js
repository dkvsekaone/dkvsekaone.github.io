import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let authReadyResolve;
export const authReady = new Promise((res) => (authReadyResolve = res));

onAuthStateChanged(auth, (user) => {
  if (user) authReadyResolve(user);
});

// Masuk secara anonim — pengguna tidak melihat form login apa pun.
signInAnonymously(auth).catch((err) => {
  console.error("Gagal masuk anonim, cek konfigurasi Firebase Anda:", err);
});
