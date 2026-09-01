import { db, storage, authReady } from "./firebase-init.js";
import {
  doc, getDoc, collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { sha256Hex, formatBytes, formatDate } from "./crypto-utils.js";
import { buildThumbnail } from "./thumbnails.js";
import { UPLOAD_FOLDER, MAX_FILE_SIZE } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const gate = $("gate"), gateForm = $("gateForm"), gateInput = $("gateInput"), gateError = $("gateError");
const content = $("content"), lockBtn = $("lockBtn");
const dropzone = $("dropzone"), fileInput = $("fileInput"), uploadsEl = $("uploads");
const grid = $("grid"), emptyState = $("emptyState"), fileCount = $("fileCount");

const SESSION_KEY = "berkas_unlocked";

function unlock() {
  sessionStorage.setItem(SESSION_KEY, "true");
  gate.style.display = "none";
  content.style.display = "block";
  lockBtn.style.display = "inline-block";
  startFileListener();
}

function lock() {
  sessionStorage.removeItem(SESSION_KEY);
  gate.style.display = "block";
  content.style.display = "none";
  lockBtn.style.display = "none";
  gateInput.value = "";
}

lockBtn.addEventListener("click", lock);

gateForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  gateError.textContent = "";
  const input = gateInput.value.trim().toUpperCase();
  if (!input) return;
  try {
    const snap = await getDoc(doc(db, "system", "access"));
    if (!snap.exists()) {
      gateError.textContent = "Kode akses belum diatur. Hubungi admin.";
      return;
    }
    const hash = await sha256Hex(input);
    if (hash === snap.data().tokenHash) {
      unlock();
    } else {
      gateError.textContent = "Kode salah, coba lagi.";
      gate.classList.add("shake");
      setTimeout(() => gate.classList.remove("shake"), 300);
    }
  } catch (err) {
    console.error(err);
    gateError.textContent = "Gagal memeriksa kode. Cek koneksi atau konfigurasi Firebase.";
  }
});

// Buka otomatis kalau sudah unlock di sesi ini
if (sessionStorage.getItem(SESSION_KEY) === "true") {
  gate.style.display = "none";
  content.style.display = "block";
  lockBtn.style.display = "inline-block";
}

// ---------- Upload ----------
dropzone.addEventListener("click", () => fileInput.click());
["dragenter", "dragover"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add("dragover"); })
);
["dragleave", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove("dragover"); })
);
dropzone.addEventListener("drop", (e) => handleFiles(e.dataTransfer.files));
fileInput.addEventListener("change", (e) => { handleFiles(e.target.files); fileInput.value = ""; });

async function handleFiles(fileList) {
  await authReady;
  for (const file of Array.from(fileList)) {
    if (file.size > MAX_FILE_SIZE) {
      alert(`"${file.name}" melebihi batas ${formatBytes(MAX_FILE_SIZE)}.`);
      continue;
    }
    uploadOne(file);
  }
}

function uploadOne(file) {
  const safeName = file.name.replace(/[^\w.\-() ]/g, "_");
  const path = `${UPLOAD_FOLDER}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

  const row = document.createElement("div");
  row.className = "upload-row";
  row.innerHTML = `<div class="name"><span>${safeName}</span><span class="pct">0%</span></div><div class="bar"><div style="width:0%"></div></div>`;
  uploadsEl.appendChild(row);
  const pctEl = row.querySelector(".pct"), barEl = row.querySelector(".bar > div");

  task.on(
    "state_changed",
    (snap) => {
      const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
      pctEl.textContent = `${pct}%`;
      barEl.style.width = `${pct}%`;
    },
    (err) => {
      console.error(err);
      row.querySelector(".name span:last-child").textContent = "Gagal";
      row.style.borderColor = "var(--danger)";
    },
    async () => {
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, "files"), {
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        path,
        url,
        uploadedAt: serverTimestamp(),
      });
      row.remove();
    }
  );
}

// ---------- Daftar file real-time ----------
let listenerStarted = false;
function startFileListener() {
  if (listenerStarted) return;
  listenerStarted = true;
  const q = query(collection(db, "files"), orderBy("uploadedAt", "desc"));
  onSnapshot(q, (snap) => {
    grid.innerHTML = "";
    if (snap.empty) {
      emptyState.style.display = "block";
      fileCount.textContent = "";
      return;
    }
    emptyState.style.display = "none";
    fileCount.textContent = `${snap.size} file`;
    snap.forEach((docSnap) => renderCard(docSnap.id, docSnap.data()));
  });
}

async function renderCard(id, data) {
  const card = document.createElement("div");
  card.className = "card";

  const thumb = await buildThumbnail(data);
  card.appendChild(thumb);

  const info = document.createElement("div");
  info.className = "card__info";
  const uploadedAt = data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date();
  info.innerHTML = `
    <div class="card__name" title="${data.name}">${data.name}</div>
    <div class="card__meta">${formatBytes(data.size)} • ${formatDate(uploadedAt)}</div>
  `;
  card.appendChild(info);

  const actions = document.createElement("div");
  actions.className = "card__actions";

  const dlBtn = document.createElement("button");
  dlBtn.textContent = "Unduh";
  dlBtn.addEventListener("click", () => downloadFile(data.url, data.name));
  actions.appendChild(dlBtn);

  const delBtn = document.createElement("button");
  delBtn.textContent = "Hapus";
  delBtn.addEventListener("click", () => removeFile(id, data.path));
  actions.appendChild(delBtn);

  card.appendChild(actions);
  grid.appendChild(card);
}

async function downloadFile(url, name) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    window.open(url, "_blank");
  }
}

async function removeFile(id, path) {
  if (!confirm("Hapus file ini untuk semua orang?")) return;
  try {
    await deleteDoc(doc(db, "files", id));
    await deleteObject(ref(storage, path));
  } catch (e) {
    console.error(e);
    alert("Gagal menghapus. Cek konsol untuk detail.");
  }
}
