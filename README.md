# Álbum Vivo 2.3

Aplicación estática para convertir una serie de fotos impresas en videos superpuestos con MindAR y Three.js.

## Estado del proyecto

- **Visor AR**: reconoce varias fotografías y reproduce un video distinto sobre cada una.
- **Editor**: incorpora un primer recuerdo automáticamente y permite subir el archivo original MOV/MP4/M4V/WebM/AVI/MKV.
- **Fotografía para imprimir**: fotograma JPEG extraído del video sin captura de pantalla. Selección temporal y descarga JPG.
- **Duración**: video completo, hasta 30 s o hasta 45 s. Limitación de reproducción mediante `endAt` en el manifiesto.
- **Conversión opcional**: usa FFmpeg WebAssembly para crear MP4 H.264 + AAC y recortar físicamente el archivo. Se descarga el motor solo cuando es necesario; operaciones grandes pueden fallar por memoria. En navegadores que no puedan decodificar el formato original, el editor intenta convertirlo para generar una vista previa.
- **GitHub**: acepta archivos mayores que 24 MiB en el editor, pero se comprueba que los MP4 finales no superen los 100 MiB de GitHub.
- **Álbum Raspberry**: el formato `album/manifest.json` + `album/targets.mind` + fotos/videos es portable a un servidor local posterior.

## Actualizar un repositorio anterior

Lee [GUIA-ACTUALIZACION-v2.3.md](./GUIA-ACTUALIZACION-v2.3.md). La actualización **no incluye** ni sobrescribe tu carpeta `album/` con recuerdos.

## Dependencias

MindAR 1.2.5, Three.js 0.160.1 y JSZip 3.10.1 se cargan desde CDN. FFmpeg WebAssembly 0.12.15 + core 0.12.10 se descarga desde CDN únicamente para conversiones de video; necesita conexión y memoria disponibles. El `@ffmpeg/core` tiene obligaciones de licencia GPL que deben revisarse antes de distribuir un producto comercial con esa tecnología.

## Privacidad

Los archivos elegidos se procesan en el navegador, pero los que se copian a un repositorio público y se publican mediante GitHub Pages serán accesibles a otras personas que conozcan sus direcciones. Conserva los originales fuera de GitHub para preservación.
