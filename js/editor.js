// Álbum Vivo v2 — editor sin programar: un video produce la foto imprimible,
// el target AR y la asociación. La imagen de impresión conserva los píxeles
// que el navegador logra decodificar del video original.
import { Compiler } from 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js';
import { MAX_ITEMS, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, SCHEMA_VERSION,
  createItem, downloadBlob, blobToURL, normalizeImage, setStatus } from './common.js';

const $ = (node, selector) => node.querySelector(selector);

function waitEvent(node, events, timeoutMs = 14000) {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (err) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      events.forEach(ev => node.removeEventListener(ev, ok));
      node.removeEventListener('error', fail);
      err ? reject(err) : resolve();
    };
    const ok = () => finish();
    const fail = () => finish(new Error('El navegador no pudo decodificar el video. Prueba MP4 H.264.'));
    const timer = setTimeout(() => finish(new Error('Se agotó el tiempo al leer el fotograma del video.')), timeoutMs);
    events.forEach(ev => node.addEventListener(ev, ok, {once: true}));
    node.addEventListener('error', fail, {once: true});
  });
}

async function seekFrame(video, time) {
  if (video.readyState < 1) await waitEvent(video, ['loadedmetadata']);
  const maxTime = Number.isFinite(video.duration) ? Math.max(0, video.duration - 0.04) : time;
  const requested = Math.max(0, Math.min(time, maxTime));
  video.pause();
  if (Math.abs(video.currentTime - requested) > 0.015) {
    // Se adjunta el listener antes de cambiar la posición para evitar carreras.
    const promise = waitEvent(video, ['seeked']);
    video.currentTime = requested;
    await promise;
  } else if (video.seeking) {
    await waitEvent(video, ['seeked']);
  }
  if (video.readyState < 2) await waitEvent(video, ['loadeddata', 'canplay']);
  return requested;
}

async function makeFrame(video, seconds) {
  const actual = await seekFrame(video, seconds);
  const width = video.videoWidth, height = video.videoHeight;
  if (!width || !height) throw new Error('El video no informó una resolución válida.');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(video, 0, 0, width, height);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.98));
  if (!blob) throw new Error('No se pudo guardar el fotograma como JPG.');
  return {blob, width, height, at:actual};
}

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
  function disposeRow(row) {
    const s = row._state;
    s.version++;
    if (s.videoURL) URL.revokeObjectURL(s.videoURL);
    if (s.photoURL) URL.revokeObjectURL(s.photoURL);
    s.videoURL = null;
    s.photoURL = null;
  }
  function showFrame(row, frame) {
    const s = row._state;
    if (s.photoURL) URL.revokeObjectURL(s.photoURL);
    s.frame = frame;
    s.photoURL = URL.createObjectURL(frame.blob);
    $('.frame-image', row).src = s.photoURL;
    $('.frame-box', row).hidden = false;
    $('.frame-info', row).textContent = `${frame.width} × ${frame.height} píxeles · Fotograma ${(frame.at).toFixed(2)} s · JPG de alta calidad`;
    $('.save-photo', row).disabled = false;
  }
  async function capture(row, when, version = row._state.version) {
    const s = row._state;
    if (!s.videoURL) throw new Error('Selecciona primero un video.');
    const frame = await makeFrame($('.source-player', row), when);
    if (s.version !== version || !row.isConnected) return null;
    showFrame(row, frame);
    return frame;
  }
  function appendPair() {
    if (list.children.length >= MAX_ITEMS) {
      setStatus(stateEl, `Máximo ${MAX_ITEMS} recuerdos en esta versión.`, true);
      return;
    }
    invalidate();
    const row = document.createElement('section');
    row.className = 'pair';
    row.dataset.row = String(++rowCounter);
    row._state = {version:0, videoURL:null, photoURL:null, frame:null};
    row.innerHTML = `<div class="pair-header"><span class="pair-title">Nuevo recuerdo</span><button class="pair-remove" type="button">Eliminar</button></div>
      <input type="text" class="pair-name" maxlength="80" placeholder="Nombre del recuerdo (opcional)" aria-label="Nombre del recuerdo">
      <label class="video-field">Video original (MP4 H.264)
        <input class="pair-video" type="file" accept=".mp4,video/mp4" required>
      </label>
      <div class="video-tools" hidden>
        <p class="mini-hint">El primer fotograma se extrae automáticamente. También puedes elegir otro instante si el comienzo está oscuro o borroso.</p>
        <video class="source-player" muted playsinline preload="auto" controls></video>
        <div class="scrub-row"><input class="frame-time" type="range" min="0" max="0" step="0.05" value="0" aria-label="Escoger fotograma"><output class="frame-seconds">0.00 s</output></div>
        <div class="small-actions"><button class="secondary capture-frame" type="button">Elegir este fotograma</button><button class="secondary save-photo" type="button" disabled>Descargar JPG para imprimir</button></div>
        <div class="frame-box" hidden><img class="frame-image" alt="Fotograma extraído para imprimir"><p class="frame-info"></p></div>
      </div>
      <details class="advanced-photo"><summary>Avanzado: usar otra fotografía en lugar del fotograma</summary>
        <p class="mini-hint">Para una ilusión más natural, la fotografía y el primer instante reproducido deberían coincidir.</p>
        <label>Fotografía alternativa (JPG/PNG)<input class="pair-photo" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png"></label>
      </details>`;
    const s = row._state;
    const fileInput = $('.pair-video', row);
    const player = $('.source-player', row);
    const tools = $('.video-tools', row);
    const timeInput = $('.frame-time', row);
    const stamp = $('.frame-seconds', row);
    fileInput.addEventListener('change', () => {
      invalidate();
      s.version++;
      if (s.videoURL) URL.revokeObjectURL(s.videoURL);
      if (s.photoURL) URL.revokeObjectURL(s.photoURL);
      s.frame = null;
      s.autoStarted = false;
      s.photoURL = null;
      $('.frame-box', row).hidden = true;
      $('.save-photo', row).disabled = true;
      const f = fileInput.files[0];
      if (!f) {tools.hidden = true; player.removeAttribute('src'); return;}
      if (!/\.mp4$/i.test(f.name) || f.size > MAX_VIDEO_BYTES) {
        tools.hidden = true;
        setStatus(stateEl, `El video debe ser MP4 y pesar menos de ${(MAX_VIDEO_BYTES/1048576).toFixed(0)} MiB para GitHub.`, true);
        return;
      }
      tools.hidden = false;
      s.videoURL = URL.createObjectURL(f);
      player.src = s.videoURL;
      player.load();
      setStatus(stateEl, `Leyendo el video de ${$('.pair-title', row).textContent.toLowerCase()}…`);
    });
    player.addEventListener('loadedmetadata', () => {
      const end = Number.isFinite(player.duration) ? Math.max(0, player.duration - 0.04) : 0;
      timeInput.max = String(end);
      timeInput.value = '0';
      stamp.textContent = '0.00 s';
    });
    player.addEventListener('loadeddata', async () => {
      if (s.frame || s.autoStarted) return;
      s.autoStarted = true;
      const version = s.version;
      try {
        await capture(row, 0, version);
        if (s.version === version) setStatus(stateEl, 'Fotograma inicial extraído. Puedes descargarlo o escoger otro instante.');
      } catch (e) {
        if (s.version === version) setStatus(stateEl, `No se pudo extraer el fotograma: ${e.message}`, true);
      } finally {s.autoStarted = false;}
    });
    timeInput.addEventListener('input', () => {
      invalidate();
      const time = Number(timeInput.value);
      stamp.textContent = `${time.toFixed(2)} s`;
      player.pause();
      if (player.readyState >= 1) player.currentTime = time;
    });
    $('.capture-frame', row).addEventListener('click', async () => {
      invalidate();
      const button = $('.capture-frame', row);
      button.disabled = true;
      try { await capture(row, Number(timeInput.value)); }
      catch(e) {setStatus(stateEl, e.message, true);}
      finally {button.disabled = false;}
    });
    $('.save-photo', row).addEventListener('click', async () => {
      // Si el usuario movió el selector después de extraer el fotograma, refrescarlo.
      if (!s.frame || Math.abs(s.frame.at - Number(timeInput.value)) > 0.04) {
        try {await capture(row, Number(timeInput.value));}
        catch(e) {setStatus(stateEl, e.message, true); return;}
      }
      const id = String([...list.children].indexOf(row)+1).padStart(3,'0');
      downloadBlob(s.frame.blob, `foto-${id}-para-imprimir.jpg`);
    });
    $('.pair-name', row).addEventListener('input', invalidate);
    $('.pair-photo', row).addEventListener('change', invalidate);
    $('.pair-remove', row).addEventListener('click', () => {disposeRow(row); row.remove(); invalidate(); renumber();});
    list.appendChild(row);
    renumber();
  }
  function renumber() {
    [...list.children].forEach((row, index) => $('.pair-title',row).textContent = `Recuerdo ${index+1}`);
    add.disabled = list.children.length >= MAX_ITEMS;
  }
  add.addEventListener('click', appendPair);
  appendPair();
  document.getElementById('album-title').addEventListener('input', invalidate);
  document.getElementById('intro-duration').addEventListener('change', invalidate);

  prepare.addEventListener('click', async () => {
    if (!window.JSZip) {setStatus(stateEl, 'No cargó JSZip. Comprueba la conexión a internet.', true); return;}
    const rows = [...list.children];
    if (!rows.length) {setStatus(stateEl, 'Añade por lo menos un video.', true); return;}
    const pairs = [];
    invalidate();
    prepare.disabled = true;
    try {
      for (const [index,row] of rows.entries()) {
        const video = $('.pair-video',row).files[0];
        if (!video || !/\.mp4$/i.test(video.name) || video.size > MAX_VIDEO_BYTES) throw new Error(`Recuerdo ${index+1}: necesitas un MP4 de menos de 24 MiB.`);
        const alternative = $('.pair-photo',row).files[0];
        if (alternative && (alternative.size > MAX_IMAGE_BYTES || !/\.(jpg|jpeg|png)$/i.test(alternative.name))) throw new Error(`Recuerdo ${index+1}: usa un JPG/PNG de menos de 12 MiB.`);
        let frame = row._state.frame;
        const selectedTime = Number($('.frame-time',row).value);
        if (!frame || Math.abs(frame.at - selectedTime) > 0.04) {
          setStatus(stateEl, `Extrayendo fotograma ${index+1} de ${rows.length}…`);
          frame = await capture(row, selectedTime);
        }
        if (!frame) throw new Error(`No se pudo crear la fotografía del recuerdo ${index+1}.`);
        const photo = alternative || new File([frame.blob], 'fotograma.jpg', {type:'image/jpeg'});
        pairs.push({video, photo, title:$('.pair-name',row).value.trim(), startAt:frame.at, printWidth:frame.width, printHeight:frame.height});
      }
      const canvases=[];
      for (const [index,pair] of pairs.entries()) {
        const data=await normalizeImage(pair.photo);
        canvases.push(data.canvas);
        pair.aspect=data.aspect;
        if ($('.pair-photo',rows[index]).files[0]) {pair.printWidth=data.width; pair.printHeight=data.height;}
        setStatus(stateEl, `Preparando imágenes ${index+1}/${pairs.length} para reconocimiento AR…`);
      }
      const compiler = new Compiler();
      await compiler.compileImageTargets(canvases, fraction => {
        const pct=fraction<=1?Math.round(fraction*100):Math.round(fraction);
        setStatus(stateEl, `Compilando reconocimiento: ${Math.min(100,Math.max(0,pct))}%`);
      });
      const data = await Promise.resolve(compiler.exportData());
      if (!data || !data.byteLength) throw new Error('MindAR no pudo crear targets.mind.');
      const title = document.getElementById('album-title').value.trim()||'Mis recuerdos';
      const introMs = Number(document.getElementById('intro-duration').value)||0;
      const manifest = {schemaVersion:SCHEMA_VERSION,title,createdAt:new Date().toISOString(),targets:'targets.mind',introMs,
        items:pairs.map(createItem)};
      const zip = new window.JSZip();
      const folder=zip.folder('album');
      folder.file('targets.mind',data);
      folder.file('manifest.json',JSON.stringify(manifest,null,2));
      pairs.forEach((pair,index)=>{
        folder.file(manifest.items[index].photo,pair.photo);
        folder.file(manifest.items[index].video,pair.video);
      });
      folder.file('COMO_PUBLICAR.txt','1. Descomprime el ZIP.\n2. Copia el contenido de album/ en la carpeta album/ de tu repositorio.\n3. Sube los cambios con GitHub Desktop.\n4. Las fotografias de este paquete ya se extrajeron de tus videos a resolucion de origen (JPG alta calidad). Imprime esas fotos.\n5. Todo el material publicado mediante GitHub Pages sera accesible por internet.\n');
      setStatus(stateEl,'Creando paquete para publicar…');
      const blob=await zip.generateAsync({type:'blob',compression:'STORE'});
      const imageTargetSrc=blobToURL(data,'application/octet-stream');
      const videoURLs=pairs.map(pair=>URL.createObjectURL(pair.video));
      built={blob,manifest,imageTargetSrc,items:manifest.items.map((it,index)=>({...it,videoURL:videoURLs[index]}))};
      download.disabled=false; preview.disabled=false; guide.hidden=false;
      setStatus(stateEl,`${pairs.length} recuerdo(s) preparados · ${(blob.size/1048576).toFixed(1)} MiB. Las fotos para imprimir están dentro del ZIP y se pueden descargar individualmente.`);
    } catch(e) {
      console.error(e);
      setStatus(stateEl,`No se pudo preparar el álbum: ${e.message||String(e)}`,true);
    } finally {prepare.disabled=false;}
  });
  download.addEventListener('click',()=>{if(built)downloadBlob(built.blob,'album-vivo-contenido-v2.zip');});
  preview.addEventListener('click',()=>{if(built)onPreview(built);});
}
