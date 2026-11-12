// Un solo motor AR para GitHub Pages y para el futuro servidor Raspberry Pi.
// Recibe un manifest y rutas locales o remotas, sin saber donde esta alojado el album.
import * as THREE from 'three';
import { MindARThree } from 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js';
import {validateManifest} from './common.js';

const overlay = document.getElementById('ar-overlay');
const stage = document.getElementById('ar-stage');
const hint = document.getElementById('ar-hint');
const bottomStatus = document.getElementById('ar-status');
const soundButton = document.getElementById('sound-ar');
const closeButton = document.getElementById('close-ar');
let active = null;
let busy = false;

export async function loadPublishedAlbum() {
  const base = new URL('./album/', window.location.href);
  const response = await fetch(new URL('manifest.json', base), {cache:'no-store'});
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`No se pudo leer el álbum publicado (HTTP ${response.status}).`);
  }
  const manifest = validateManifest(await response.json());
  if (manifest.targets !== 'targets.mind') throw new Error('Archivo de reconocimiento inesperado.');
  return {manifest, imageTargetSrc:new URL(manifest.targets, base).href,
          items:manifest.items.map(it => ({...it, videoURL:new URL(it.video, base).href,
                                          photoURL:new URL(it.photo, base).href}))};
}

function createHiddenVideo(url) {
  const v = document.createElement('video');
  v.src = url;
  v.preload = 'metadata';
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');
  v.loop = true;
  v.muted = true;
  v.setAttribute('muted', '');
  v.disablePictureInPicture = true;
  v.controls = false;
  v.style.position = 'absolute';
  v.style.width = '1px'; v.style.height = '1px';
  v.style.opacity = '0'; v.style.pointerEvents = 'none';
  document.body.appendChild(v);
  return v;
}

function coverCrop(texture, video, aspect) {
  // Recorte centrado cuando el video y la foto tienen proporciones distintas.
  // No distorsiona rostros al llenar el plano AR.
  const vw = video.videoWidth || 16;
  const vh = video.videoHeight || 9;
  const videoAspect = vw / vh;
  if (videoAspect > aspect) {
    const frac = aspect / videoAspect;
    texture.repeat.set(frac, 1);
    texture.offset.set((1 - frac) / 2, 0);
  } else {
    const frac = videoAspect / aspect;
    texture.repeat.set(1, frac);
    texture.offset.set(0, (1 - frac) / 2);
  }
  texture.needsUpdate = true;
}

export async function closeAR() {
  if (busy) return;
  const old = active;
  active = null;
  overlay.hidden = true;
  bottomStatus.textContent = 'Apunta a una fotografía del álbum';
  soundButton.hidden = true;
  if (!old) return;
  try {
    old.mindar.renderer.setAnimationLoop(null);
    await old.mindar.stop();
  } catch(err) { console.warn('Al detener la cámara:', err); }
  for (const item of old.entries) {
    item.video.pause();
    item.video.removeAttribute('src');
    item.video.load();
    item.video.remove();
    item.texture.dispose();
    item.geometry.dispose();
    item.material.dispose();
  }
  try { old.mindar.renderer.dispose(); } catch(_) {}
  stage.replaceChildren();
}

closeButton.addEventListener('click', () => closeAR());

export async function startAR(album) {
  if (busy) return;
  busy = true;
  if (active) { busy = false; await closeAR(); busy = true; }
  let mindar = null;
  const entries = [];
  try {
    const manifest = validateManifest(album.manifest);
    overlay.hidden = false;
    hint.textContent = 'Preparando cámara y fotografías…';
    bottomStatus.textContent = `Álbum: ${manifest.title}`;
    soundButton.hidden = true;
    mindar = new MindARThree({container:stage,
                              imageTargetSrc:album.imageTargetSrc,
                              maxTrack:1,
                              uiLoading:'no', uiScanning:'no', uiError:'no'});
    const {renderer, scene, camera} = mindar;
    let current = null;
    for (const it of album.items) {
      const video = createHiddenVideo(it.videoURL);
      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      const geometry = new THREE.PlaneGeometry(1, 1 / it.aspect);
      const material = new THREE.MeshBasicMaterial({map:texture, side:THREE.DoubleSide, depthTest:false});
      const anchor = mindar.addAnchor(it.targetIndex);
      anchor.group.add(new THREE.Mesh(geometry, material));
      const entry = {it, video, texture, geometry, material};
      entries.push(entry);
      video.addEventListener('loadedmetadata', () => coverCrop(texture, video, it.aspect));
      video.addEventListener('error', () => {
        if (current === entry) bottomStatus.textContent = `No se pudo reproducir ${it.video}. Prueba MP4 H.264.`;
      });
      anchor.onTargetFound = () => {
        if (current && current !== entry) {
          current.video.pause();
          current.video.currentTime = 0;
        }
        current = entry;
        video.currentTime = 0;
        video.muted = true; // compatibilidad inicial con autoplay en móviles
        video.play().catch(() => { bottomStatus.textContent = 'Toca «Activar sonido» para iniciar el video.'; });
        hint.textContent = it.title;
        bottomStatus.textContent = 'El video se reproduce sobre la fotografía';
        soundButton.hidden = false;
      };
      anchor.onTargetLost = () => {
        video.pause();
        if (current === entry) {
          current = null;
          hint.textContent = 'Apunta a otra fotografía';
          bottomStatus.textContent = 'Buscando un recuerdo…';
          soundButton.hidden = true;
        }
      };
    }
    soundButton.onclick = () => {
      if (!current) return;
      current.video.muted = false;
      current.video.play().then(() => {
        soundButton.hidden = true;
      }).catch(() => {
        current.video.muted = true;
        bottomStatus.textContent = 'El navegador bloqueó el audio. Pulsa otra vez «Activar sonido».';
      });
    };
    await mindar.start();
    renderer.setAnimationLoop(() => renderer.render(scene, camera));
    hint.textContent = 'Apunta a una fotografía impresa';
    active = {mindar, entries};
  } catch(err) {
    console.error('Error iniciando realidad aumentada',err);
    if (mindar) { try { await mindar.stop(); } catch(_) {} }
    entries.forEach(x => {x.video.pause(); x.video.remove();});
    stage.replaceChildren();
    overlay.hidden = true;
    alert(`No se pudo iniciar la cámara: ${err.message || String(err)}\n\nAbre la página en HTTPS y concede permiso de cámara. Comprueba también el formato del video.`);
  } finally { busy = false; }
}
