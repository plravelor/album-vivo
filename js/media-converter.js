/** Álbum Vivo 2.4 - conversión opcional, sin FFmpeg ni importaciones blob:.
 * Usa MediaRecorder sobre un canvas (con soporte comprobado en ejecución).
 * Los archivos se procesan localmente. La conversión transcurre a tiempo real.
 * Cuando la API no puede producir MP4 se informa y se mantiene el original.
 */
const MIB = 1024 * 1024;

function selectMP4Mime() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return null;
  return [
    'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
    'video/mp4;codecs="avc1.42E01E"',
    'video/mp4'
  ].find(mime => MediaRecorder.isTypeSupported(mime)) || null;
}

function waitFor(element, name, timeoutMs=20000) {
  return new Promise((resolve,reject)=>{
    let done=false;
    const clean=()=>{ element.removeEventListener(name,ok);element.removeEventListener('error',fail);clearTimeout(timer); };
    const ok=()=>{if(done)return;done=true;clean();resolve();};
    const fail=()=>{if(done)return;done=true;clean();reject(new Error('No se pudo reproducir el archivo durante la conversión.'));};
    const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error('El navegador tardó demasiado en leer el video.'));},timeoutMs);
    element.addEventListener(name,ok,{once:true});element.addEventListener('error',fail,{once:true});
  });
}

/** Convierte, de manera opcional, un video local a MP4 grabando el canvas.
 * Dado que usa MediaRecorder, el tiempo de conversión es ~la duración elegida.
 * El fotograma imprimible se genera antes y nunca se toma de este resultado.
 */
export async function convertToMP4(file, {startSec=0,durationSec=null,maxSide=1280,onStatus=()=>{}}={}) {
  const mimeType = selectMP4Mime();
  if (!mimeType || typeof HTMLCanvasElement.prototype.captureStream !== 'function') {
    throw new Error('Este navegador no permite crear MP4 con MediaRecorder. Desmarca la conversión para conservar el MOV original, o conviértelo con HandBrake en el Mac.');
  }
  const source = document.createElement('video');
  source.playsInline = true;
  source.setAttribute('playsinline','');
  source.setAttribute('webkit-playsinline','');
  source.preload = 'auto';
  source.muted = false;
  source.volume = 1;
  source.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0.01;pointer-events:none;bottom:0;right:0;z-index:-1;';
  document.body.appendChild(source);
  const srcURL = URL.createObjectURL(file);
  source.src = srcURL;
  let stream=null,canvas=null,audioCtx=null,raf=null,recorder=null,stopped=false;
  const cleanup=async()=>{
    stopped=true;
    if(raf!==null)cancelAnimationFrame(raf);
    if(recorder?.state==='recording')try{recorder.stop();}catch(_){}
    if(stream)for(const track of stream.getTracks())track.stop();
    source.pause();source.removeAttribute('src');source.load();source.remove();URL.revokeObjectURL(srcURL);
    if(canvas){canvas.width=0;canvas.height=0;canvas.remove();}
    if(audioCtx)try{await audioCtx.close();}catch(_){}
  };
  try {
    onStatus('Abriendo video original para crear la copia MP4…');
    if(source.readyState<1)await waitFor(source,'loadedmetadata',30000);
    if(!source.videoWidth||!source.videoHeight)throw new Error('No se pudo leer la resolución del video.');
    const originalDuration=Number.isFinite(source.duration)?source.duration:null;
    const initial=Math.max(0,Number(startSec)||0);
    if(originalDuration!==null && initial>=originalDuration-.02)throw new Error('El fotograma elegido está después del final del video.');
    const available=originalDuration===null?Infinity:Math.max(.1,originalDuration-initial);
    const requested=durationSec===null?available:Math.min(Math.max(.1,Number(durationSec)||.1),available);
    if(!Number.isFinite(requested) || requested>600)throw new Error('Para convertir videos completos muy largos utiliza HandBrake en el computador; aquí se admiten hasta 10 minutos.');
    const shrink=maxSide>0?Math.min(1,Math.max(256,maxSide)/Math.max(source.videoWidth,source.videoHeight)):1;
    const even=v=>Math.max(2,Math.round(v/2)*2);
    canvas=document.createElement('canvas');
    canvas.width=even(source.videoWidth*shrink);canvas.height=even(source.videoHeight*shrink);
    canvas.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;right:0';
    document.body.appendChild(canvas);
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('No se pudo crear el canvas para convertir.');
    const fps=24;
    stream=canvas.captureStream(fps);
    // Intentar conservar el audio del original. En WebKit algunas rutas lo impiden:
    // en ese caso no fingimos que la copia conserve su pista de audio.
    let audioIncluded=false;
    try {
      const AC=window.AudioContext||window.webkitAudioContext;
      if(AC){
        audioCtx=new AC();
        const media=audioCtx.createMediaElementSource(source);
        const dest=audioCtx.createMediaStreamDestination();
        media.connect(dest);
        await audioCtx.resume();
        for(const track of dest.stream.getAudioTracks()){stream.addTrack(track);audioIncluded=true;}
      }
    }catch(e){onStatus('Audio del original no disponible para este navegador; se intentará crear la copia con video.');}
    if(initial>.02){
      const seek=waitFor(source,'seeked',20000);source.currentTime=initial;await seek;
    }
    ctx.drawImage(source,0,0,canvas.width,canvas.height);
    const bitRate=Math.max(1_500_000,Math.min(10_000_000,Math.round(canvas.width*canvas.height*4)));
    try{recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:bitRate,audioBitsPerSecond:128000});}
    catch(e){throw new Error(`No se pudo abrir MediaRecorder para MP4: ${e.message}`);}
    const chunks=[];
    const recording=new Promise((resolve,reject)=>{
      recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
      recorder.onerror=e=>reject(new Error(`Error de grabación MP4: ${e.error?.message || 'sin detalles'}`));
      recorder.onstop=()=>resolve(new Blob(chunks,{type:'video/mp4'}));
    });
    const startClock=performance.now();
    const stopTime=initial+requested;
    const draw=()=>{
      if(stopped)return;
      if(source.readyState>=2){try{ctx.drawImage(source,0,0,canvas.width,canvas.height);}catch(_){}}
      const elapsed=(performance.now()-startClock)/1000;
      if(elapsed>1)onStatus(`Convirtiendo localmente… ${Math.min(100,Math.round(elapsed/requested*100))} % (mantén esta página abierta)`);
      if(source.ended || source.currentTime>=stopTime-.04 || elapsed>requested+12){
        stopped=true; source.pause();try{if(recorder.state==='recording')recorder.stop();}catch(_){}
        return;
      }
      raf=requestAnimationFrame(draw);
    };
    onStatus(`Grabando una copia MP4 de hasta ${Math.round(requested)} segundos. Mantén Brave abierto y la pantalla activa.`);
    recorder.start(500);
    try{await source.play();}
    catch(e){try{recorder.stop();}catch(_){} throw new Error(`El navegador no dejó reproducir el MOV para convertirlo: ${e.message}`);}
    raf=requestAnimationFrame(draw);
    const result=await Promise.race([
      recording,
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('La grabación MP4 excedió el tiempo previsto.')),Math.ceil((requested+50)*1000)))
    ]);
    if(result.size<1024)throw new Error('MediaRecorder generó un archivo vacío.');
    const sample=new Uint8Array(await result.slice(4,12).arrayBuffer());
    const head=String.fromCharCode(...sample);
    if(!head.includes('ftyp'))throw new Error('La grabación no tiene un contenedor MP4 válido.');
    if(!audioIncluded)onStatus('Video convertido. Comprueba si incluye audio: este navegador no permitió asegurarlo durante la conversión.');
    else onStatus(`Copia MP4 creada (${(result.size/MIB).toFixed(1)} MiB).`);
    return new File([result],(file.name.replace(/\.[^.]+$/,'')||'video')+'-album-vivo.mp4',{type:'video/mp4'});
  } catch(e){
    throw new Error(`No se pudo convertir en este navegador. ${e.message||e}. Puedes desmarcar la conversión y exportar el MOV, sin perder la fotografía.`);
  } finally {await cleanup();}
}
