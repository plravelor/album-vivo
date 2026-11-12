# Álbum Vivo — Prototipo GitHub Pages (v1.0)

Una fotografía impresa puede activar su video correspondiente mediante la cámara del teléfono. La experiencia usa seguimiento de imágenes MindAR: el video se dibuja **encima de la fotografía** y sigue su perspectiva.

## Qué incluye

- `index.html` — una sola web con pestañas **Ver álbum** y **Crear álbum**.
- `styles.css` — diseño adaptable a móvil.
- `js/common.js` — **contrato de datos compartido** entre GitHub y la futura Raspberry.
- `js/editor.js` — crea asociaciones fotografía ↔ video, compila varias fotos con MindAR, exporta un ZIP.
- `js/viewer.js` — reconoce cada foto (`targetIndex`) y reproduce su video como textura AR.
- `js/app.js` — conecta editor y visor.
- `album/` — carpeta donde se publican los recuerdos.
- `GUIA_GITHUB.md` — instrucciones completas para crear el repositorio, publicar y probar.
- `ARQUITECTURA_RASPBERRY.md` — camino para reutilizar este mismo código en un álbum autónomo con memoria extraíble.

## Empieza aquí

Lee **GUIA_GITHUB.md**. No necesitas Node, npm, Python ni programar para el primer prototipo. Para gestionar archivos y publicarlos cómodamente, recomendamos instalar GitHub Desktop.

## Cómo se estructura el paquete que genera el editor

```text
album/
  manifest.json             <-- información y asociaciones
  targets.mind              <-- reconocimiento de todas las fotografías
  foto-001.jpg              <-- foto que se imprime
  video-001.mp4             <-- su video
  foto-002.jpg
  video-002.mp4
  COMO_PUBLICAR.txt
```

El índice `targetIndex` 0 pertenece a la primera fotografía y su primer video; el índice 1, a la segunda; etc. El visor no necesita saber dónde están los videos: lee `manifest.json`. La Raspberry recibirá exactamente esta estructura.

## Para probar

1. Abre el sitio web publicado en **HTTPS**.
2. Entra a Crear álbum, selecciona JPG/PNG y MP4 (H.264).
3. Pulsa Preparar álbum, luego Descargar paquete ZIP.
4. Descomprime y copia los archivos del directorio `album/` del ZIP a la carpeta `album/` del repositorio.
5. Publica cambios en GitHub y abre el sitio en tu teléfono.
6. Da permiso a la cámara y apunta a la fotografía **impresa** (o visible en una pantalla distinta).

El editor permite probar en el dispositivo que está creando el álbum, pero la visualización desde **otros teléfonos** requiere publicar el paquete en GitHub o disponer del futuro servidor Raspberry.

## Límites de esta versión

- Hasta 12 parejas de fotos y videos por paquete (límite preventivo del editor para evitar consumo excesivo de memoria).
- JPG/PNG; videos MP4 con códec H.264/AAC recomendados. Los archivos MOV/HEVC suelen requerir conversión.
- El editor limita a 12 MiB por fotografía y 24 MiB por video. GitHub admite archivos de hasta 25 MiB mediante su interfaz web.
- La primera descarga requiere internet: Three.js, MindAR y JSZip se cargan de servicios CDN. En la Raspberry futura se copiarán localmente todas las bibliotecas necesarias.
- La reproducción empieza sin sonido para cumplir las restricciones de los navegadores móviles. Pulsa Activar sonido cuando la imagen está reconocida.
- Puede que MindAR pierda momentáneamente el seguimiento si la foto es poco detallada o hay poca luz.
- Sin contraseña ni administración multiusuario: el editor está abierto en el prototipo. **No guardar fotos familiares privadas en el repositorio web público.**
- El repositorio de GitHub Pages no constituye almacenamiento privado para recuerdos. La futura Raspberry tendrá una interfaz de administración protegida y guardará los datos localmente.
- El visor y el editor implementados son un prototipo inicial: no se han podido ejecutar pruebas físicas con cámaras iOS/Android en este entorno. Probarlos en los dispositivos reales es el siguiente paso.

## Tecnologías

MindAR 1.2.5; Three.js 0.160.1; JSZip 3.10.1; JavaScript, HTML y CSS sin compilador. La implementación usa las APIs documentadas por MindAR para compilación de imágenes y múltiples objetivos. Se cargan desde CDN con versiones fijadas.

Documentación de MindAR: https://hiukim.github.io/mind-ar-js-doc/

Multiobjetivo: https://hiukim.github.io/mind-ar-js-doc/examples/multi-targets/

GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
