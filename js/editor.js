// UI de creacion sin programacion. Compila todas las fotos en un unico targets.mind
// y empaqueta el mismo formato que leera el visor web y la Raspberry Pi.
import { Compiler } from 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js';
import { MAX_ITEMS, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, SCHEMA_VERSION, createItem,
         downloadBlob, blobToURL, normalizeImage, setStatus } from './common.js';

export function setupEditor(onPreview) {
  const list = document.getElementById('pair-list');
  const add = document.getElementById('add-pair');
  const prepare = document.getElementById('prepare');
  const download = document.getElementById('download');
  const preview = document.getElementById('preview');
  const stateEl = document.getElementById('builder-status');
  const guide = document.getElementById('prepared-guide');
  let built = null;
  let rowCounter = 0;

  function invalidate() {
    built = null;
    download.disabled = true;
    preview.disabled = true;
    guide.hidden = true;
  }
  function appendPair() {
    if (list.children.length >= MAX_ITEMS) { setStatus(stateEl, `Máximo ${MAX_ITEMS} recuerdos en este prototipo.`, true); return; }
    invalidate();
    const row = document.createElement('section');
    row.className = 'pair';
    row.dataset.row = String(++rowCounter);
    row.innerHTML = `<div class="pair-header"><span class="pair-title">Nuevo recuerdo</span><button class="pair-remove" type="button">Eliminar</button></div>
      <input type="text" class="pair-name" maxlength="80" placeholder="Nombre del recuerdo (opcional)" aria-label="Nombre del recuerdo">
      <div class="pair-grid">
        <label>Fotografía que vas a imprimir<input class="pair-photo" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" required></label>
        <label>Video asociado (MP4 H.264)<input class="pair-video" type="file" accept=".mp4,video/mp4" required></label>
      </div>`;
    row.querySelector('.pair-remove').addEventListener('click', () => { row.remove(); invalidate(); renumber(); });
    row.querySelectorAll('input').forEach(input => input.addEventListener('change', invalidate));
    list.appendChild(row);
    renumber();
  }
  function renumber() {
    [...list.children].forEach((node, index) => node.querySelector('.pair-title').textContent = `Recuerdo ${index + 1}`);
    add.disabled = list.children.length >= MAX_ITEMS;
  }
  add.addEventListener('click', appendPair);
  appendPair();
  document.getElementById('album-title').addEventListener('input', invalidate);

  prepare.addEventListener('click', async () => {
    if (!window.JSZip) { setStatus(stateEl, 'No cargó JSZip. Comprueba tu conexión y vuelve a abrir la página.', true); return; }
    const rows = [...list.children];
    if (!rows.length) { setStatus(stateEl, 'Añade al menos una fotografía.', true); return; }
    const pairs = [];
    for (const [index, row] of rows.entries()) {
      const photo = row.querySelector('.pair-photo').files[0];
      const video = row.querySelector('.pair-video').files[0];
      const title = row.querySelector('.pair-name').value.trim();
      if (!photo || !video) { setStatus(stateEl, `Faltan archivos en el recuerdo ${index + 1}.`, true); return; }
      const imgOk = /\.(jpg|jpeg|png)$/i.test(photo.name);
      const videoOk = /\.mp4$/i.test(video.name);
      if (!imgOk || !videoOk) { setStatus(stateEl, 'Utiliza fotos JPG/PNG y videos MP4 (H.264 recomendado).', true); return; }
      if (photo.size > MAX_IMAGE_BYTES || video.size > MAX_VIDEO_BYTES) {
        setStatus(stateEl, `El recuerdo ${index + 1} supera 12 MiB por foto o 24 MiB por video. Reduce su tamaño.`, true); return;
      }
      pairs.push({photo, video, title});
    }

    invalidate();
    prepare.disabled = true;
    try {
      setStatus(stateEl, 'Procesando las fotografías (puede tomar un poco en imágenes complejas)…');
      const canvases = [];
      for (const [i, pair] of pairs.entries()) {
        const data = await normalizeImage(pair.photo);
        canvases.push(data.canvas);
        pair.aspect = data.aspect;
        setStatus(stateEl, `Fotografías preparadas: ${i + 1} de ${pairs.length}.`);
      }
      const compiler = new Compiler();
      await compiler.compileImageTargets(canvases, fraction => {
        const pct = fraction <= 1 ? Math.round(fraction * 100) : Math.round(fraction);
        setStatus(stateEl, `Creando reconocimiento de imágenes: ${Math.max(0, Math.min(100, pct))}%`);
      });
      const targetData = await Promise.resolve(compiler.exportData());
      if (!targetData || !targetData.byteLength) throw new Error('MindAR no produjo el archivo de reconocimiento.');
      const title = document.getElementById('album-title').value.trim() || 'Mis recuerdos';
      const manifest = {schemaVersion:SCHEMA_VERSION, title, createdAt:new Date().toISOString(),
                        targets:'targets.mind', items:pairs.map(createItem)};
      const zip = new window.JSZip();
      const folder = zip.folder('album');
      folder.file('targets.mind', targetData);
      folder.file('manifest.json', JSON.stringify(manifest, null, 2));
      pairs.forEach((pair, index) => {
        folder.file(manifest.items[index].photo, pair.photo);
        folder.file(manifest.items[index].video, pair.video);
      });
      folder.file('COMO_PUBLICAR.txt', '1. Extrae este ZIP.\n2. Abre la carpeta album.\n3. Sube los archivos a la carpeta album/ de tu repositorio album-vivo en GitHub.\n4. Los videos seran PUBLICOS en GitHub Pages.\n');
      setStatus(stateEl, 'Empaquetando fotografías, videos y targets.mind…');
      const blob = await zip.generateAsync({type:'blob', compression:'STORE'});
      const targetsURL = blobToURL(targetData, 'application/octet-stream');
      const mediaURLs = pairs.map(pair => URL.createObjectURL(pair.video));
      built = {blob, manifest, imageTargetSrc:targetsURL,
               items:manifest.items.map((it, index) => ({...it, videoURL:mediaURLs[index]}))};
      download.disabled = false;
      preview.disabled = false;
      guide.hidden = false;
      setStatus(stateEl, `${pairs.length} recuerdo(s) preparados. El paquete pesa ${(blob.size/1048576).toFixed(1)} MiB. Ahora puedes descargarlo o probar la cámara.`);
    } catch(err) {
      console.error(err);
      setStatus(stateEl, `No se pudo preparar el álbum: ${err.message || String(err)}`, true);
    } finally { prepare.disabled = false; }
  });

  download.addEventListener('click', () => {
    if (built) downloadBlob(built.blob, 'album-vivo-contenido.zip');
  });
  preview.addEventListener('click', () => {
    if (built) onPreview(built);
  });
}
