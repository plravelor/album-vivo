# Álbum Vivo v2.4

Aplicación web de realidad aumentada con MindAR y Three.js. Permite asociar **varios videos a fotografías distintas** y extraer de cada video un fotograma JPG de máxima resolución decodificable para imprimir.

## Funciones

- Editor de recuerdos desde MOV/MP4/M4V/WebM u otro video que pueda abrir el navegador.
- Extrae fotograma del video original cuando es reproducible; no necesita WhatsApp.
- Admite archivos originales de más de 24 MiB para crear un ZIP local; GitHub tiene sus propios límites.
- **No convierte por defecto**. Guarda el video original (MOV/MP4). La conversión opcional a MP4 usa MediaRecorder cuando el navegador lo admite; evita el error `Cannot find module 'blob:'` del FFmpeg WebAssembly anterior.
- Hasta 30 s, 45 s o video completo durante la reproducción; conversión opcional para recortar físicamente el archivo.
- Exporta ZIP con `album/manifest.json`, `album/targets.mind`, videos y fotografías.
- Visualiza **un ZIP privado local** desde `Ver álbum` sin subir sus fotos/videos al servidor (se requiere importar el ZIP en cada dispositivo).
- Sigue admitiendo el formato de álbum v1 y v2.3.

## Requisitos

GitHub Pages para el editor y, para comenzar, archivos locales en el navegador. Los videos MOV sin convertir pueden no funcionar en Android. Para compartir archivos entre dispositivos sin publicarlos, desarrollaremos el servidor Raspberry Pi.

**Privacidad:** GitHub Pages es público. No alojes allí las imágenes y videos privados, ni confíes en que el código QR o el reconocimiento de la foto constituyan una protección de acceso.

Consulta `GUIA-ACTUALIZACION-v2.4.md` para instalar el proyecto.
