// Konfigurasi Proyek Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyCy3Rvyh2MArH3fO6S9JZBs88Bj0nHFM5M",
  authDomain: "kuis-dkv-smk.firebaseapp.com",
  projectId: "kuis-dkv-smk",
  storageBucket: "kuis-dkv-smk.firebasestorage.app",
  messagingSenderId: "534309125240",
  appId: "1:534309125240:web:3dcefa2e44a0eb0576018d",
  measurementId: "G-9BMQN9K9BS"
};

// Alamat Link CDN SDK Firebase yang Konsisten
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, updatePassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Inisialisasi Sistem
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Ekspor semua komponen yang dibutuhkan oleh index.html
export { db, auth, collection, addDoc, signInWithEmailAndPassword, updatePassword };
