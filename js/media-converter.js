// Álbum Vivo: conversión opcional en el navegador con FFmpeg WebAssembly.
// La fotografía se obtiene del video original en el editor antes de usar este módulo.
// ffmpeg.wasm puede ser muy exigente con videos 4K o archivos grandes; damos errores recuperables.
const BASE_MAIN = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd';
const BASE_CORE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';
let ffmpegPromise = null;
let converter = null;

async function asBlobURL(url, type) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo descargar el conversor (${response.status}).`);
  const buffer = await response.arrayBuffer();
  return URL.createObjectURL(new Blob([buffer], {type}));
}
async function loadScript(url) {
  if (window.FFmpegWASM?.FFmpeg) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error('No se pudo descargar el módulo FFmpeg. Comprueba la conexión a internet.'));
    document.head.appendChild(script);
  });
}
async function getFFmpeg(report=()=>{}) {
  if (converter) return converter;
  if (!ffmpegPromise) ffmpegPromise = (async () => {
    report('Descargando conversor de video para usarlo en tu equipo (primera vez)…');
    await loadScript(`${BASE_MAIN}/ffmpeg.js`);
    const FFmpeg = window.FFmpegWASM?.FFmpeg;
    if (!FFmpeg) throw new Error('No se pudo inicializar FFmpeg WebAssembly.');
    const workerURL = await asBlobURL(`${BASE_MAIN}/814.ffmpeg.js`, 'text/javascript');
    const coreURL = await asBlobURL(`${BASE_CORE}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await asBlobURL(`${BASE_CORE}/ffmpeg-core.wasm`, 'application/wasm');
    const engine = new FFmpeg();
    engine.on('progress', ({progress}) => {
      if (Number.isFinite(progress) && progress >= 0 && progress <= 1) {
        report(`Convirtiendo video… ${Math.round(progress*100)} %`);
      }
    });
    try {
      await engine.load({classWorkerURL:workerURL, coreURL, wasmURL});
    } catch (e) {
      throw new Error(`No se pudo iniciar el conversor en este navegador: ${e.message||e}`);
    } finally {
      // ffmpeg ya cargó los recursos; las URL blob se pueden liberar.
      // Se mantienen para compatibilidad con las cargas diferidas del motor.
    }
    converter = engine;
    return engine;
  })().catch(e => {ffmpegPromise=null;throw e;});
  return ffmpegPromise;
}

/** Convierte un video MOV/MP4/WebM/... a MP4 H.264+AAC. También puede recortar el archivo realmente.
 * startSec corresponde al fotograma de la fotografía impresa.
 * durationSec null deja todo desde ese instante.
 * maxSide = 0 conserva dimensiones; 1920 limita el lado largo para reproducción.
 */
export async function convertToMP4(file, {startSec=0, durationSec=null, maxSide=1920, onStatus=()=>{}}={}) {
  const ffmpeg = await getFFmpeg(onStatus);
  const extension = (file.name.match(/\.([a-z0-9]+)$/i)?.[1]||'mov').toLowerCase();
  const input = `entrada.${extension}`;
  const output = 'salida.mp4';
  let written = false;
  try {
    onStatus(`Preparando ${file.name} (${(file.size/1048576).toFixed(1)} MiB)…`);
    await ffmpeg.writeFile(input, new Uint8Array(await file.arrayBuffer()));
    written = true;
    const args = ['-hide_banner','-y','-i',input];
    if (startSec > 0.01) args.push('-ss', String(startSec));
    if (durationSec != null && Number.isFinite(durationSec)) args.push('-t',String(Math.max(0.1,durationSec)));
    args.push('-map','0:v:0','-map','0:a:0?');
    if (maxSide > 0) {
      // Nunca aumenta la resolución y mantiene la orientación vertical/horizontal.
      const limit = Math.max(480, Math.round(maxSide/2)*2);
      args.push('-vf',`scale=min(${limit}\\,iw):min(${limit}\\,ih):force_original_aspect_ratio=decrease:force_divisible_by=2`);
    }
    args.push('-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p',
      '-c:a','aac','-b:a','160k','-movflags','+faststart','-threads','1',output);
    onStatus('Convirtiendo a MP4 H.264; puede tardar si es un video grande…');
    const exitCode = await ffmpeg.exec(args, 0);
    if (exitCode !== 0) throw new Error(`FFmpeg no terminó correctamente (código ${exitCode}).`);
    const bytes = await ffmpeg.readFile(output);
    if (!bytes?.byteLength) throw new Error('La conversión no produjo un MP4 válido.');
    const blob = new Blob([bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)], {type:'video/mp4'});
    return new File([blob],file.name.replace(/\.[^.]+$/, '')+'-album-vivo.mp4',{type:'video/mp4'});
  } catch (e) {
    throw new Error(`No se pudo convertir ${file.name}. ${e.message||e}. Si el navegador se queda sin memoria, convierte ese archivo a MP4 H.264 con HandBrake en tu Mac y vuelve a seleccionarlo.`);
  } finally {
    // Liberar memoria del sistema de archivos WebAssembly.
    if (written) {try {await ffmpeg.deleteFile(input);}catch(_){}}
    try {await ffmpeg.deleteFile(output);}catch(_){}
  }
}
