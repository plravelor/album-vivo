# Dependencias de Álbum Vivo 2.4

- [MindAR 1.2.5](https://github.com/hiukim/mind-ar-js): seguimiento de fotografías mediante cámara.
- [Three.js 0.160.1](https://github.com/mrdoob/three.js): visualización del video superpuesto.
- [JSZip 3.10.1](https://stuk.github.io/jszip/): creación e importación local del paquete ZIP.
- APIs estándar del navegador `HTMLVideoElement`, `Canvas`, `MediaRecorder` y `MediaStream`: vista previa, fotograma, exportación opcional a MP4 y captura local de video.

**Esta versión no incorpora FFmpeg WebAssembly**, para evitar la falla al cargar módulos `blob:` observada en Brave para iPhone. Cuando se solicita conversión, se intenta con MediaRecorder sólo si el navegador declara soporte MP4. La pista de audio puede variar según la implementación.

Para distribución comercial hay que revisar las licencias de las bibliotecas, los códecs y las obligaciones aplicables. El código compartido del álbum y los originales del propietario deben conservarse independientemente.
