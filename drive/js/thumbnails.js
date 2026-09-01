// pdf.js dimuat lewat <script> tag di index.html sebagai window.pdfjsLib
const PALETTE = ["#E8A33D", "#4CAF8C", "#5C8DE8", "#C77DE0", "#E2604F", "#3FB6C9"];

function colorForExt(ext) {
  let hash = 0;
  for (const ch of ext) hash = (hash * 31 + ch.charCodeAt(0)) % PALETTE.length;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function badge(ext, glyphSvg) {
  const el = document.createElement("div");
  el.className = "thumb thumb--badge";
  el.style.background = colorForExt(ext);
  el.innerHTML = glyphSvg || `<span class="thumb__ext">${ext.slice(0, 4)}</span>`;
  return el;
}

const DOC_GLYPH = `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="white" stroke-width="1.6"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4"/><path d="M9 12h6M9 16h6"/></svg>`;
const SHEET_GLYPH = `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="white" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M9 4v16"/></svg>`;
const ZIP_GLYPH = `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="white" stroke-width="1.6"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v3M12 8v2M12 12v2M12 16v2"/></svg>`;
const CODE_GLYPH = `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="white" stroke-width="1.6"><path d="M8 8 3 12l5 4M16 8l5 4-5 4"/></svg>`;
const AUDIO_GLYPH = `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="white" stroke-width="1.6"><path d="M4 14v-3l14-3v11"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="16" r="2"/></svg>`;
const PLAY_GLYPH = `<svg viewBox="0 0 24 24" width="28" height="28" fill="white"><circle cx="12" cy="12" r="11" fill="black" fill-opacity=".35"/><path d="M10 8l6 4-6 4z"/></svg>`;
const GENERIC_GLYPH = `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="white" stroke-width="1.6"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4"/></svg>`;

const EXT_GROUPS = {
  doc: ["doc", "docx", "txt", "rtf", "md", "odt"],
  sheet: ["xls", "xlsx", "csv", "ods"],
  zip: ["zip", "rar", "7z", "tar", "gz"],
  code: ["js", "ts", "py", "html", "css", "json", "java", "c", "cpp", "php", "rb", "go"],
};

function glyphForExt(ext) {
  for (const [group, list] of Object.entries(EXT_GROUPS)) {
    if (list.includes(ext)) {
      return { doc: DOC_GLYPH, sheet: SHEET_GLYPH, zip: ZIP_GLYPH, code: CODE_GLYPH }[group];
    }
  }
  return GENERIC_GLYPH;
}

async function renderPdfThumb(url) {
  try {
    if (!window.pdfjsLib) return null;
    const pdf = await window.pdfjsLib.getDocument(url).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    const wrap = document.createElement("div");
    wrap.className = "thumb thumb--pdf";
    wrap.appendChild(canvas);
    return wrap;
  } catch (e) {
    return null;
  }
}

export async function buildThumbnail(file) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const type = file.type || "";

  if (type.startsWith("image/")) {
    const wrap = document.createElement("div");
    wrap.className = "thumb";
    const img = document.createElement("img");
    img.src = file.url;
    img.loading = "lazy";
    img.alt = file.name;
    wrap.appendChild(img);
    return wrap;
  }

  if (type.startsWith("video/")) {
    const wrap = document.createElement("div");
    wrap.className = "thumb thumb--video";
    const vid = document.createElement("video");
    vid.src = file.url + "#t=0.5";
    vid.muted = true;
    vid.preload = "metadata";
    wrap.appendChild(vid);
    const overlay = document.createElement("div");
    overlay.className = "thumb__overlay";
    overlay.innerHTML = PLAY_GLYPH;
    wrap.appendChild(overlay);
    return wrap;
  }

  if (type === "application/pdf" || ext === "pdf") {
    const pdfThumb = await renderPdfThumb(file.url);
    if (pdfThumb) return pdfThumb;
    return badge("pdf", DOC_GLYPH);
  }

  if (type.startsWith("audio/")) {
    return badge(ext || "audio", AUDIO_GLYPH);
  }

  return badge(ext || "file", glyphForExt(ext));
}
