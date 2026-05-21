firebase-config.js

// 1. Ini Konfigurasi Asli Proyek Anda dari Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCy3Rvyh2MArH3fO6S9JZBs88Bj0nHFM5M",
  authDomain: "kuis-dkv-smk.firebaseapp.com",
  projectId: "kuis-dkv-smk",
  storageBucket: "kuis-dkv-smk.firebasestorage.app",
  messagingSenderId: "534309125240",
  appId: "1:534309125240:web:3dcefa2e44a0eb0576018d",
  measurementId: "G-9BMQN9K9BS"
};

// 2. Alamat Link CDN SDK Firebase agar Bisa Dibaca Langsung oleh Browser/GitHub Pages
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 3. Inisialisasi Sistem dan Eksport agar Bisa Dipakai di index.html & admin.html
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);