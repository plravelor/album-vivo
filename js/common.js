// Contrato de datos compartido entre GitHub Pages y el futuro servidor Raspberry Pi.
export const SCHEMA_VERSION = 1;
export const MAX_ITEMS = 12;
export const MAX_VIDEO_BYTES = 24 * 1024 * 1024; // limite practico de carga via web GitHub (<25 MiB)
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export function validateManifest(m) {
  if (!m || m.schemaVersion !== SCHEMA_VERSION || !Array.isArray(m.items) || !m.items.length) {
    throw new Error('El álbum no tiene un manifest.json válido o compatible.');
  }
  if (m.items.length > 200) throw new Error('La cantidad de recuerdos supera el máximo admitido.');
  for (const [index, it] of m.items.entries()) {
    if (it.targetIndex !== index || typeof it.aspect !== 'number' || it.aspect <= 0 ||
        !isPlainFilename(it.video) || !isPlainFilename(it.photo)) {
      throw new Error(`El recuerdo ${index + 1} tiene datos inválidos.`);
    }
  }
  return m;
}

function isPlainFilename(v) {
  return typeof v === 'string' && /^[a-zA-Z0-9_.-]+$/.test(v) && v !== '..';
}

export function setStatus(element, text, isError = false) {
  element.textContent = text;
  element.style.background = isError ? '#fff0ee' : '#edf3f3';
  element.style.color = isError ? '#8a3432' : '#34525a';
}

export function blobToURL(data, mime) {
  return URL.createObjectURL(new Blob([data], { type: mime }));
}

export function normalizeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth, h = img.naturalHeight;
        const f = Math.min(1, 1024 / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w * f));
        canvas.height = Math.max(1, Math.round(h * f));
        canvas.getContext('2d', {willReadFrequently: true}).drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({ canvas, aspect: canvas.width / canvas.height, width: w, height: h });
      } catch (e) { reject(e); }
      finally { URL.revokeObjectURL(url); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`No se pudo abrir ${file.name}. Prueba con JPG o PNG.`)); };
    img.src = url;
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function createItem({title, photo, video, aspect}, index) {
  const number = String(index + 1).padStart(3, '0');
  const suffix = photo.name.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
  return {id:number, title:title || `Recuerdo ${index + 1}`, targetIndex:index,
          photo:`foto-${number}.${suffix}`, video:`video-${number}.mp4`,
          aspect, videoMime:'video/mp4'};
}
