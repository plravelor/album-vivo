import {setupEditor} from './editor.js?v=24';
import {loadPublishedAlbum, startAR} from './viewer.js?v=24';
import {setStatus, validateManifest} from './common.js?v=24';

const tabWatch = document.getElementById('tab-watch');
const tabCreate = document.getElementById('tab-create');
const watchSection = document.getElementById('watch-section');
const createSection = document.getElementById('create-section');
const publishedState = document.getElementById('published-state');
const publishedSummary = document.getElementById('published-summary');
const watchButton = document.getElementById('watch-published');
let published = null;

function selectTab(tab) {
  const isWatch = tab === 'watch';
  watchSection.hidden = !isWatch;
  createSection.hidden = isWatch;
  tabWatch.classList.toggle('active', isWatch);
  tabCreate.classList.toggle('active', !isWatch);
  tabWatch.setAttribute('aria-selected', isWatch ? 'true':'false');
  tabCreate.setAttribute('aria-selected', isWatch ? 'false':'true');
}

tabWatch.addEventListener('click', () => selectTab('watch'));
tabCreate.addEventListener('click', () => selectTab('create'));
document.getElementById('open-create').addEventListener('click', () => selectTab('create'));
watchButton.addEventListener('click', () => { if (published) startAR(published); });
try {
  setupEditor(startAR);
} catch (err) {
  console.error('Error al iniciar el editor:', err);
  setStatus(document.getElementById('builder-status'),
    `No se pudo iniciar el editor: ${err.message}. Recarga la página y, si persiste, comparte este mensaje.`, true);
}

// Importación privada: el ZIP nunca se sube a GitHub; se abre desde el teléfono.
// Los enlaces blob: sólo existen mientras el usuario mantiene abierta esta pestaña.
const privateInput = document.getElementById('private-album-input');
let privateUrls = [];
function clearPrivateURLs() {
  for (const url of privateUrls) URL.revokeObjectURL(url);
  privateUrls = [];
}
function localURL(blob) {
  const url = URL.createObjectURL(blob);
  privateUrls.push(url);
  return url;
}
function renderAlbumSummary(album, privateMode=false) {
  publishedSummary.replaceChildren();
  for (const item of album.items) {
    const card = document.createElement('div');
    card.className = 'preview-item';
    const image = document.createElement('img');
    image.src = item.photoURL;
    image.alt = item.title;
    image.loading = 'lazy';
    const caption = document.createElement('p');
    caption.textContent = item.title;
    card.append(image, caption);
    publishedSummary.appendChild(card);
  }
  publishedSummary.hidden = false;
  watchButton.disabled = false;
  setStatus(publishedState,
    `${privateMode ? 'Álbum privado, únicamente en este dispositivo: ' : ''}${album.manifest.title} — ${album.items.length} fotografía(s) interactivas listas.`);
}
privateInput.addEventListener('change', async () => {
  const file = privateInput.files?.[0];
  if (!file) return;
  if (!window.JSZip) {setStatus(publishedState,'No se pudo cargar la biblioteca de archivos ZIP. Comprueba tu conexión.',true);return;}
  setStatus(publishedState,`Abriendo ZIP privado (${(file.size/1048576).toFixed(1)} MiB)…`);
  try {
    const archive = await window.JSZip.loadAsync(file);
    const entry = archive.file('album/manifest.json');
    if (!entry) throw new Error('El ZIP no tiene album/manifest.json. Utiliza un paquete creado por Álbum Vivo.');
    const manifest = validateManifest(JSON.parse(await entry.async('string')));
    const targets = archive.file('album/targets.mind');
    if (!targets) throw new Error('Falta album/targets.mind dentro del ZIP.');
    // Preparar completamente el ZIP antes de reemplazar la sesión actual.
    const next = [];
    for (const item of manifest.items) {
      const photo=archive.file(`album/${item.photo}`);
      const video=archive.file(`album/${item.video}`);
      if (!photo || !video) throw new Error(`Falta un archivo de ${item.title} dentro del ZIP.`);
      const [photoBlob, videoBlob] = await Promise.all([photo.async('blob'),video.async('blob')]);
      const imageMime=item.photo.toLowerCase().endsWith('.png')?'image/png':'image/jpeg';
      const videoMime=item.videoMime || (item.video.toLowerCase().endsWith('.mov')?'video/quicktime':'video/mp4');
      next.push({...item,photoBlob:new Blob([photoBlob],{type:imageMime}),videoBlob:new Blob([videoBlob],{type:videoMime})});
    }
    const targetBytes = await targets.async('uint8array');
    clearPrivateURLs();
    published = {
      manifest,
      imageTargetSrc:localURL(new Blob([targetBytes],{type:'application/octet-stream'})),
      items:next.map(item=>({...item,photoURL:localURL(item.photoBlob),videoURL:localURL(item.videoBlob)}))
    };
    renderAlbumSummary(published,true);
  } catch(error) {
    console.error('Error al abrir ZIP privado:',error);
    setStatus(publishedState,`No se pudo abrir el ZIP: ${error.message||String(error)}`,true);
  }
});

async function load() {
  try {
    published = await loadPublishedAlbum();
    if (!published) {
      setStatus(publishedState, 'Todavía no hay un álbum publicado. Entra a «Crear álbum», elige tus fotos y videos y descarga el paquete.');
      return;
    }
    renderAlbumSummary(published,false);
  } catch (err) {
    console.error(err);
    setStatus(publishedState, `Error al cargar álbum publicado: ${err.message}`, true);
  }
}
load();
