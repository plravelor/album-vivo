// Álbum Vivo v2.4 — editor de recuerdos multipropósito.
// Acepta archivos originales MOV, MP4, M4V, WebM, AVI y MKV.
// Se prioriza extraer el fotograma del archivo ORIGINAL, antes de cualquier conversión.
import { Compiler } from 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js';
import { MAX_ITEMS, MAX_IMAGE_BYTES, SCHEMA_VERSION,
  createItem, downloadBlob, blobToURL, normalizeImage, setStatus } from './common.js?v=24';
import { convertToMP4 } from './media-converter.js?v=24';
const $ = (selector, node) => node.querySelector(selector);
const MI_B = 1024*1024;
const GITHUB_MAX = 100*MI_B; // límite para un solo archivo en git push
const ACCEPT_EXT = /\.(mp4|m4v|mov|webm|avi|mkv)$/i;
const mp4Compatible = (name) => /\.mp4$/i.test(name);
const niceSize = (bytes) => `${(bytes / MI_B).toFixed(1)} MiB`;

function loadMedia(video, sourceURL, timeout=24000) {
  return new Promise((resolve, reject) => {
    let done=false;
    const finish=(error) => {
      if(done)return;
      done=true; clearTimeout(timer);
      ['loadeddata','canplay','error'].forEach(ev=>video.removeEventListener(ev,onEvent));
      error?reject(error):resolve();
    };
    const onEvent=(event) => {
      if(event.type==='error') finish(new Error('Este navegador no puede abrir directamente el códec de este video.'));
      else if(video.videoWidth && video.videoHeight && video.readyState>=2) finish();
    };
    const timer=setTimeout(()=>finish(new Error('El navegador tardó demasiado en abrir este video.')),timeout);
    ['loadeddata','canplay','error'].forEach(ev=>video.addEventListener(ev,onEvent));
    video.src=sourceURL; video.load();
  });
}
function awaitEvent(el, name, timeout=18000) {
  return new Promise((resolve,reject)=>{
    let finished=false;
    const clear=()=>{el.removeEventListener(name,ok);el.removeEventListener('error',fail);clearTimeout(timer);};
    const ok=()=>{if(finished)return;finished=true;clear();resolve();};
    const fail=()=>{if(finished)return;finished=true;clear();reject(new Error('Error al leer el video.'));};
    const timer=setTimeout(()=>{if(finished)return;finished=true;clear();reject(new Error('Tiempo de espera al elegir el fotograma.'));},timeout);
    el.addEventListener(name,ok,{once:true}); el.addEventListener('error',fail,{once:true});
  });
}
async function captureVideoFrame(video, seconds) {
  if(!video.videoWidth||!video.videoHeight) throw new Error('El navegador no pudo decodificar este video.');
  video.pause();
  const duration=Number.isFinite(video.duration)?video.duration:seconds+1;
  const actual=Math.max(0,Math.min(seconds,Math.max(0,duration-.03)));
  if(Math.abs(video.currentTime-actual)>.01) {
    const waiting=awaitEvent(video,'seeked'); video.currentTime=actual; await waiting;
  } else if(video.seeking) await awaitEvent(video,'seeked');
  if(video.readyState<2) await awaitEvent(video,'loadeddata');
  const width=video.videoWidth,height=video.videoHeight;
  const canvas=document.createElement('canvas'); canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx) throw new Error('No se pudo crear el lienzo del fotograma.');
  ctx.drawImage(video,0,0,width,height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.97));
  canvas.width=0;canvas.height=0;
  if(!blob)throw new Error('No se pudo guardar la fotografía.');
  return {blob,width,height,at:actual};
}

export function setupEditor(onPreview) {
  const list=document.getElementById('pair-list');
  const add=document.getElementById('add-pair');
  const prepare=document.getElementById('prepare');
  const download=document.getElementById('download');
  const preview=document.getElementById('preview');
  const stateEl=document.getElementById('builder-status');
  const guide=document.getElementById('prepared-guide');
  let built=null,rowCounter=0;
  const objectURLs=new Set();

  function invalidate() {
    built=null;download.disabled=true;preview.disabled=true;guide.hidden=true;
  }
  function ownURL(blob) {const u=URL.createObjectURL(blob);objectURLs.add(u);return u;}
  function revoke(u) {if(u){URL.revokeObjectURL(u);objectURLs.delete(u);}}
  function disposeRow(row) {
    const s=row._state;s.version++;
    revoke(s.videoURL);revoke(s.photoURL);revoke(s.previewURL);
    s.videoURL=s.photoURL=s.previewURL=null;
  }
  function setRowInfo(row,message,error=false) {
    const el=$('.video-hint',row);el.textContent=message;el.classList.toggle('error-hint',error);
  }
  function showFrame(row,frame) {
    const s=row._state;revoke(s.photoURL);
    s.frame=frame; s.photoURL=ownURL(frame.blob);
    $('.frame-image',row).src=s.photoURL;
    $('.frame-box',row).hidden=false;
    $('.frame-info',row).textContent=`${frame.width} × ${frame.height} píxeles · ${frame.at.toFixed(2)} s · JPG extraído sin captura de pantalla`;
    $('.save-photo',row).disabled=false;
  }
  async function capture(row,at,version=row._state.version) {
    const s=row._state;
    if(!s.playableFile)throw new Error('Selecciona un video y comprueba que pueda abrirse.');
    const frame=await captureVideoFrame($('.source-player',row),at);
    if(s.version!==version||!row.isConnected)return null;
    showFrame(row,frame);return frame;
  }
  function renumber() {
    [...list.children].forEach((row,i)=>$('.pair-title',row).textContent=`Recuerdo ${i+1}`);
    add.disabled=list.children.length>=MAX_ITEMS;
  }
  function appendPair() {
    if(list.children.length>=MAX_ITEMS){setStatus(stateEl,`Máximo ${MAX_ITEMS} recuerdos por paquete.`,true);return;}
    invalidate();const row=document.createElement('section');row.className='pair';row.dataset.row=String(++rowCounter);
    row._state={version:0,sourceFile:null,playableFile:null,videoURL:null,previewURL:null,photoURL:null,frame:null,duration:0,convertedForPreview:false};
    row.innerHTML=`<div class="pair-header"><span class="pair-title">Nuevo recuerdo</span><button class="pair-remove" type="button">Eliminar</button></div>
      <input type="text" class="pair-name" maxlength="80" placeholder="Nombre del recuerdo (opcional)" aria-label="Nombre del recuerdo">
      <label class="video-field">Video original (MOV de iPhone, MP4 u otro video compatible)
        <input class="pair-video" type="file" accept="video/*,.mov,.mp4,.m4v,.webm,.avi,.mkv" required>
      </label>
      <p class="mini-hint video-hint">Selecciona el video directamente desde Fotos o desde tu computador. No hace falta convertirlo mediante WhatsApp.</p>
      <div class="video-tools" hidden>
        <video class="source-player" muted playsinline preload="auto" controls></video>
        <div class="scrub-row"><input class="frame-time" type="range" min="0" max="0" step="0.05" value="0" aria-label="Escoger fotograma"><output class="frame-seconds">0.00 s</output></div>
        <div class="small-actions"><button class="secondary capture-frame" type="button">Elegir este fotograma</button><button class="secondary save-photo" type="button" disabled>Descargar JPG para imprimir</button></div>
        <div class="frame-box" hidden><img class="frame-image" alt="Fotograma extraído para imprimir"><p class="frame-info"></p></div>
        <div class="video-settings">
          <label class="setting-label">Duración al mirar la foto
            <select class="clip-duration"><option value="30" selected>Hasta 30 segundos (recomendado)</option><option value="45">Hasta 45 segundos</option><option value="full">Video completo</option></select>
          </label>
          <label class="check-option"><input type="checkbox" class="make-mp4"> Crear copia MP4 para Android / recortar archivo (opcional: tarda aproximadamente lo que dure el video)</label>
          <label class="setting-label">Resolución del video convertido (no afecta la fotografía del original)
            <select class="convert-size"><option value="1920" selected>Hasta Full HD 1080p</option><option value="0">Mantener resolución de origen (más pesado)</option><option value="1280">Hasta 720p (más ligero)</option></select>
          </label>
          <p class="mini-hint">Sin conversión, guardaremos el MOV o MP4 original y los 30/45 s se aplicarán al verlo. El MOV funciona en iPhone, pero puede fallar en Android. La conversión es opcional y utiliza el grabador del navegador; se comprobará su compatibilidad antes de utilizarla.</p>
        </div>
      </div>
      <details class="advanced-photo"><summary>Avanzado: utilizar otra fotografía (JPG/PNG)</summary>
        <p class="mini-hint">El fotograma del propio video suele dar el efecto más natural.</p>
        <label>Foto alternativa <input class="pair-photo" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png"></label>
      </details>`;
    const s=row._state;
    const fileInput=$('.pair-video',row),player=$('.source-player',row),tools=$('.video-tools',row);
    const timeInput=$('.frame-time',row),stamp=$('.frame-seconds',row);
    fileInput.addEventListener('change',async()=>{
      invalidate();s.version++;const token=s.version;
      revoke(s.videoURL);revoke(s.previewURL);revoke(s.photoURL);
      s.videoURL=s.previewURL=s.photoURL=null;s.frame=null;s.playableFile=null;s.sourceFile=null;s.convertedForPreview=false;
      $('.frame-box',row).hidden=true;$('.save-photo',row).disabled=true;
      const f=fileInput.files?.[0];
      if(!f){tools.hidden=true;player.removeAttribute('src');return;}
      if(!ACCEPT_EXT.test(f.name)&&!f.type.startsWith('video/')){
        setRowInfo(row,'Formato desconocido. Selecciona MOV, MP4, M4V, WebM, AVI o MKV.',true);return;
      }
      s.sourceFile=f;s.playableFile=f;
      s.videoURL=ownURL(f);
      setRowInfo(row,`Leyendo ${f.name} (${niceSize(f.size)})…`);
      tools.hidden=false;
      $('.make-mp4',row).checked=false; // No iniciar conversión al seleccionar MOV.
      try {
        await loadMedia(player,s.videoURL);
        if(token!==s.version)return;
        s.duration=Number.isFinite(player.duration)?player.duration:0;
        const end=Math.max(0,s.duration-0.04);
        timeInput.max=String(end);timeInput.value='0';stamp.textContent='0.00 s';
        await capture(row,0,token);
        setRowInfo(row,`Original leído: ${player.videoWidth} × ${player.videoHeight} · ${s.duration.toFixed(1)} s · ${niceSize(f.size)}. Foto extraída del archivo original.`);
      } catch(error) {
        if(token!==s.version)return;
        s.playableFile=null;
        tools.hidden=true;
        setRowInfo(row,`Este navegador no pudo abrir el original (${error.message}). Prueba desde Fotos de iPhone o convierte el archivo en el Mac con HandBrake; para crear la fotografía necesitamos poder leerlo.`,true);
      }
      if(f.size>GITHUB_MAX)setRowInfo(row,`El video pesa ${niceSize(f.size)}. Puedes preparar el ZIP localmente, pero GitHub no permite subir un archivo de más de 100 MiB. Para publicar, prepara una copia menor desde el Mac o convierte en este navegador si lo admite.`,false);
    });
    timeInput.addEventListener('input',()=>{
      invalidate();const t=Number(timeInput.value);stamp.textContent=`${t.toFixed(2)} s`;
      player.pause();if(player.readyState>=1)player.currentTime=t;
    });
    $('.capture-frame',row).addEventListener('click',async()=>{
      invalidate();const button=$('.capture-frame',row);button.disabled=true;
      try{await capture(row,Number(timeInput.value));}
      catch(e){setRowInfo(row,e.message,true);}finally{button.disabled=false;}
    });
    $('.save-photo',row).addEventListener('click',async()=>{
      if(!s.frame||Math.abs(s.frame.at-Number(timeInput.value))>.04){
        try{await capture(row,Number(timeInput.value));}catch(e){setRowInfo(row,e.message,true);return;}
      }
      const id=String([...list.children].indexOf(row)+1).padStart(3,'0');
      downloadBlob(s.frame.blob,`foto-${id}-para-imprimir.jpg`);
    });
    for(const selector of ['.pair-name','.pair-photo','.clip-duration','.make-mp4','.convert-size']){
      $(selector,row).addEventListener(selector==='.pair-name'?'input':'change',invalidate);
    }
    $('.pair-remove',row).addEventListener('click',()=>{disposeRow(row);row.remove();invalidate();renumber();});
    list.appendChild(row);renumber();
  }
  add.addEventListener('click',appendPair);appendPair();
  document.getElementById('album-title').addEventListener('input',invalidate);
  document.getElementById('intro-duration').addEventListener('change',invalidate);

  prepare.addEventListener('click',async()=>{
    if(!window.JSZip){setStatus(stateEl,'No se pudo cargar JSZip. Revisa la conexión.',true);return;}
    const rows=[...list.children];
    if(!rows.length){setStatus(stateEl,'Añade por lo menos un video.',true);return;}
    const pairs=[];invalidate();prepare.disabled=true;
    try {
      for(const [index,row] of rows.entries()) {
        const s=row._state;const source=s.sourceFile;
        if(!source)throw new Error(`Recuerdo ${index+1}: selecciona un archivo de video.`);
        if(!s.playableFile||!s.frame)throw new Error(`Recuerdo ${index+1}: el video todavía no se ha podido leer. Revisa el mensaje bajo el selector.`);
        const alternative=$('.pair-photo',row).files[0];
        if(alternative&&(alternative.size>MAX_IMAGE_BYTES||!/\.(jpg|jpeg|png)$/i.test(alternative.name)))throw new Error(`Recuerdo ${index+1}: la fotografía alternativa debe ser JPG/PNG de menos de 12 MiB.`);
        const selectedTime=Number($('.frame-time',row).value);
        let frame=s.frame;
        if(Math.abs(frame.at-selectedTime)>.04){
          setStatus(stateEl,`Extrayendo fotograma ${index+1}/${rows.length}…`);
          frame=await capture(row,selectedTime);
        }
        if(!frame)throw new Error(`Recuerdo ${index+1}: no se pudo extraer la foto.`);
        const printPhoto=alternative||new File([frame.blob],'fotograma.jpg',{type:'image/jpeg'});
        const selectedClip=$('.clip-duration',row).value;
        const maxSeconds=selectedClip==='full'?null:Number(selectedClip);
        // Se seleccionan los primeros 30/45 segundos A PARTIR del fotograma.
        const remaining=Math.max(0.1,(s.duration||selectedTime+3600)-selectedTime);
        const seconds=maxSeconds===null?null:Math.min(maxSeconds,remaining);
        const userWantsConvert=$('.make-mp4',row).checked;
        // En iPhone se puede guardar MOV sin conversión. Eso mantiene calidad y evita
        // que un conversor no compatible bloquee todo el álbum.
        const convert=userWantsConvert;
        let publishVideo=source;
        let videoStart=selectedTime;
        let videoEnd=seconds===null?null:selectedTime+seconds;
        if(convert){
          setStatus(stateEl,`Convirtiendo recuerdo ${index+1}/${rows.length}. Puede tardar con videos originales grandes…`);
          // Si el origen no pudo decodificarse, el fotograma elegido ya está en la copia compatible;
          // para evitar desplazamientos se utiliza esa copia como origen al preparar la versión publicada.
          const basis=s.convertedForPreview?s.playableFile:source;
          publishVideo=await convertToMP4(basis,{
            startSec:selectedTime,
            durationSec:seconds,
            maxSide:Number($('.convert-size',row).value),
            onStatus:message=>setStatus(stateEl,`Recuerdo ${index+1}: ${message}`)
          });
          videoStart=0;videoEnd=null; // El video exportado ya está recortado físicamente.
        }
        if(publishVideo.size>GITHUB_MAX) {
          setStatus(stateEl,`Aviso: recuerdo ${index+1} pesa ${niceSize(publishVideo.size)}. Se incluirá en el ZIP, pero GitHub no admitirá ese archivo. Guarda el paquete localmente o prepara una copia más pequeña.`,false);
        }
        pairs.push({photo:printPhoto,video:publishVideo,title:$('.pair-name',row).value.trim(),
          startAt:videoStart,endAt:videoEnd,printWidth:frame.width,printHeight:frame.height});
      }
      const targets=[];
      for(const [index,pair] of pairs.entries()){
        const image=await normalizeImage(pair.photo);targets.push(image.canvas);pair.aspect=image.aspect;
        setStatus(stateEl,`Preparando imagen ${index+1}/${pairs.length} para MindAR…`);
      }
      const compiler=new Compiler();
      await compiler.compileImageTargets(targets, fraction=>{
        const pct=fraction<=1?Math.round(fraction*100):Math.round(fraction);
        setStatus(stateEl,`Compilando reconocimiento: ${Math.max(0,Math.min(100,pct))}%`);
      });
      const data=await Promise.resolve(compiler.exportData());
      if(!data?.byteLength)throw new Error('No se pudo crear targets.mind.');
      const title=document.getElementById('album-title').value.trim()||'Mis recuerdos';
      const introMs=Number(document.getElementById('intro-duration').value)||0;
      const manifest={schemaVersion:SCHEMA_VERSION,title,createdAt:new Date().toISOString(),
        targets:'targets.mind',introMs,items:pairs.map(createItem)};
      const zip=new window.JSZip();const folder=zip.folder('album');
      folder.file('targets.mind',data);folder.file('manifest.json',JSON.stringify(manifest,null,2));
      for(let index=0;index<pairs.length;index++){
        folder.file(manifest.items[index].photo,pairs[index].photo);
        folder.file(manifest.items[index].video,pairs[index].video);
      }
      folder.file('COMO_PUBLICAR.txt',`ÁLBUM VIVO 2.4\n1. Descomprime este ZIP.\n2. Copia el contenido de su carpeta album/ en album/ del repositorio.\n3. Publica con GitHub Desktop.\n4. Imprime los JPG incluidos.\n5. Videos mayores de 100 MiB no se pueden publicar con GitHub; conserva el ZIP local.\n6. Los videos MOV originales pueden reproducirse en iPhone pero no necesariamente en Android. Para máxima compatibilidad usa MP4 H.264.
7. Para privacidad NO publiques este ZIP en GitHub Pages; ábrelo localmente con la función Importar ZIP privado.\n`);
      setStatus(stateEl,'Creando ZIP. Si los archivos son grandes puede tardar y consumir memoria…');
      const blob=await zip.generateAsync({type:'blob',compression:'STORE',streamFiles:true});
      built={blob,manifest,imageTargetSrc:blobToURL(data,'application/octet-stream'),
        items:manifest.items.map((it,i)=>({...it,videoURL:ownURL(pairs[i].video)}))};
      download.disabled=false;preview.disabled=false;guide.hidden=false;
      setStatus(stateEl,`${pairs.length} recuerdo(s) preparados · ZIP ${niceSize(blob.size)}. Foto(s) imprimibles y video(s) originales o convertidos. Los MOV podrían no funcionar en Android.`);
    }catch(e){console.error(e);setStatus(stateEl,`No se pudo preparar: ${e.message||e}`,true);}
    finally{prepare.disabled=false;}
  });
  download.addEventListener('click',()=>{if(built)downloadBlob(built.blob,'album-vivo-contenido-v2.4.zip');});
  preview.addEventListener('click',()=>{if(built)onPreview(built);});
}
