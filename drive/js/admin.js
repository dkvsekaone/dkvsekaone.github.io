import { db, storage, authReady } from "./firebase-init.js";
import {
  doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, orderBy, deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { sha256Hex, randomToken, formatBytes, formatDate, formatCountdown } from "./crypto-utils.js";
import { buildThumbnail } from "./thumbnails.js";

// GANTI INI sebelum deploy! Cara membuat hash baru ada di README.md.
// Nilai default ini adalah hash dari kata sandi contoh "ubahsaya" — WAJIB diganti.
const ADMIN_PASSWORD_HASH = "657b5f95a4f31683cc28aa261600b12a3b362e5f1feac64c021ebc4f946a4687";

const $ = (id) => document.getElementById(id);
const gate = $("gate"), gateForm = $("gateForm"), gateInput = $("gateInput"), gateError = $("gateError");
const content = $("content");
const tokenDisplay = $("tokenDisplay"), tokenMeta = $("tokenMeta");
const copyBtn = $("copyBtn"), regenBtn = $("regenBtn");
const manualToken = $("manualToken"), setManualBtn = $("setManualBtn");
const intervalInput = $("intervalInput"), setIntervalBtn = $("setIntervalBtn");
const grid = $("grid"), emptyState = $("emptyState");

const ACCESS_REF = () => doc(db, "system", "access");
let currentPlainToken = null; // hanya diketahui tab admin ini sejak dibuat/dibaca ulang
let currentData = null;

gateForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const hash = await sha256Hex(gateInput.value);
  if (hash === ADMIN_PASSWORD_HASH) {
    gate.style.display = "none";
    content.style.display = "block";
    await authReady;
    initAdmin();
  } else {
    gateError.textContent = "Kata sandi salah.";
  }
});

async function initAdmin() {
  await checkAndRotateIfExpired();
  startCountdown();
  startFileListener();
}

async function loadAccessDoc() {
  const snap = await getDoc(ACCESS_REF());
  if (!snap.exists()) return null;
  currentData = snap.data();
  return currentData;
}

async function writeNewToken(plainToken, intervalMinutes) {
  const hash = await sha256Hex(plainToken);
  await setDoc(ACCESS_REF(), {
    tokenHash: hash,
    updatedAt: serverTimestamp(),
    intervalMinutes: intervalMinutes ?? currentData?.intervalMinutes ?? 60,
  });
  currentPlainToken = plainToken;
  await loadAccessDoc();
  renderToken();
}

async function checkAndRotateIfExpired() {
  const data = await loadAccessDoc();
  if (!data) {
    // Belum pernah diatur — buat kode acak pertama
    await writeNewToken(randomToken(), 60);
    intervalInput.value = 60;
    return;
  }
  intervalInput.value = data.intervalMinutes || 60;
  const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
  const intervalMs = (data.intervalMinutes || 60) * 60000;
  if (Date.now() - updatedAt.getTime() >= intervalMs) {
    await writeNewToken(randomToken());
  } else {
    renderToken();
  }
}

function renderToken() {
  if (currentPlainToken) {
    tokenDisplay.textContent = currentPlainToken;
  } else {
    tokenDisplay.textContent = "•• tersimpan ••";
  }
}

function startCountdown() {
  setInterval(async () => {
    if (!currentData) return;
    const updatedAt = currentData.updatedAt?.toDate ? currentData.updatedAt.toDate() : new Date();
    const intervalMs = (currentData.intervalMinutes || 60) * 60000;
    const remaining = intervalMs - (Date.now() - updatedAt.getTime());
    if (remaining <= 0) {
      await writeNewToken(randomToken());
      tokenMeta.textContent = `berganti otomatis dalam ${formatCountdown((currentData.intervalMinutes || 60) * 60000)}`;
    } else {
      tokenMeta.textContent = `berganti otomatis dalam ${formatCountdown(remaining)}`;
    }
  }, 1000);
}

copyBtn.addEventListener("click", () => {
  if (!currentPlainToken) {
    alert("Kode ini dibuat sebelumnya di tab/perangkat lain sehingga tidak tersimpan di sini. Klik 'Buat kode acak sekarang' untuk membuat kode baru yang bisa disalin.");
    return;
  }
  navigator.clipboard.writeText(currentPlainToken);
  copyBtn.textContent = "Tersalin!";
  setTimeout(() => (copyBtn.textContent = "Salin kode"), 1200);
});

regenBtn.addEventListener("click", async () => {
  await writeNewToken(randomToken());
});

setManualBtn.addEventListener("click", async () => {
  const val = manualToken.value.trim().toUpperCase();
  if (!val) return;
  await writeNewToken(val);
  manualToken.value = "";
});

setIntervalBtn.addEventListener("click", async () => {
  const minutes = parseInt(intervalInput.value, 10);
  if (!minutes || minutes < 1) return;
  await updateDoc(ACCESS_REF(), { intervalMinutes: minutes });
  await loadAccessDoc();
  alert(`Interval rotasi diatur ke ${minutes} menit.`);
});

// ---------- Daftar file (sama seperti halaman publik, plus hapus) ----------
function startFileListener() {
  const q = query(collection(db, "files"), orderBy("uploadedAt", "desc"));
  onSnapshot(q, (snap) => {
    grid.innerHTML = "";
    emptyState.style.display = snap.empty ? "block" : "none";
    snap.forEach((docSnap) => renderCard(docSnap.id, docSnap.data()));
  });
}

async function renderCard(id, data) {
  const card = document.createElement("div");
  card.className = "card";
  card.appendChild(await buildThumbnail(data));

  const info = document.createElement("div");
  info.className = "card__info";
  const uploadedAt = data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date();
  info.innerHTML = `<div class="card__name" title="${data.name}">${data.name}</div><div class="card__meta">${formatBytes(data.size)} • ${formatDate(uploadedAt)}</div>`;
  card.appendChild(info);

  const actions = document.createElement("div");
  actions.className = "card__actions";
  const delBtn = document.createElement("button");
  delBtn.textContent = "Hapus";
  delBtn.className = "danger-text";
  delBtn.addEventListener("click", async () => {
    if (!confirm(`Hapus "${data.name}"?`)) return;
    await deleteDoc(doc(db, "files", id));
    await deleteObject(ref(storage, data.path));
  });
  actions.appendChild(delBtn);
  card.appendChild(actions);
  grid.appendChild(card);
}
