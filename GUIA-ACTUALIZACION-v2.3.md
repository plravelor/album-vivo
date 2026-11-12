# Álbum Vivo 2.3 — instalación y utilización

Este ZIP es una actualización acumulativa. Incluye la corrección 2.2, la extracción automática de fotografías, la transición de movimiento, los ajustes de seguimiento y el nuevo editor con soporte para formatos de video adicionales. No incluye la carpeta `album/` con tus recuerdos.

## Instalar en GitHub Desktop sin borrar tus cuatro recuerdos

1. Descarga y descomprime `Album_Vivo_Actualizacion_v2.3.zip`.
2. Abre GitHub Desktop, selecciona `album-vivo` y entra a **Repository > Show in Finder**.
3. Copia **el contenido** de la carpeta descomprimida (no la carpeta como una subcarpeta) encima de `album-vivo/`. Acepta reemplazar archivos como `index.html`, `styles.css` y los de `js/`.
4. **No borres, vacíes ni reemplaces la carpeta `album/` de tu repositorio**. La actualización no contiene esa carpeta.
5. En GitHub Desktop, escribe el resumen `Álbum Vivo 2.3 — MOV, calidad y duración`, pulsa **Commit to main** y luego **Push origin**.
6. Abre `https://plravelor.github.io/album-vivo/?v=23`. Arriba debe decir **Prototipo 2.3**. Abre la pestaña **Crear álbum**: debe aparecer **Recuerdo 1**, con selector de video.

## Trabajar con un MOV del iPhone, sin WhatsApp

1. En iPhone, desde **Fotos** puedes seleccionar el video original. O pásalo al Mac por **AirDrop** y elige el archivo original.
2. Abre **Crear álbum**, pulsa **Seleccionar archivo** en el primer recuerdo y elige el video MOV, MP4, M4V, WebM, AVI o MKV.
3. Si el navegador puede leer el video, generará un JPG del primer instante desde **el original**, sin pantallazo. Puedes mover el selector y pulsar **Elegir este fotograma**, o descargar el JPG.
4. Si el navegador no puede decodificar el códec, el editor intentará generar un MP4 compatible con FFmpeg WebAssembly. Esto requiere internet para descargar el motor por primera vez y puede consumir mucha memoria. Si la conversión falla, convierte el original con **HandBrake** en el Mac, seleccionando MP4/H.264 a alta calidad, y vuelve a subir el MP4. **Conserva siempre el MOV original.**
5. Selecciona **Hasta 30 segundos**, **Hasta 45 segundos** o **Video completo**. El tiempo cuenta desde el fotograma elegido.
6. Si deseas que **el archivo del video dentro del ZIP quede físicamente recortado**, activa **Convertir a MP4 H.264 y recortar físicamente**. Si no, la versión publicada se detendrá a los 30/45 segundos aunque el MP4 original siga completo.
7. Pulsa **Preparar álbum**. A continuación descarga el ZIP y publícalo copiando su subcarpeta `album/` a la subcarpeta `album/` del repositorio. Guarda primero una copia del álbum anterior si quieres conservar ambas versiones: publicar el nuevo ZIP sobre el mismo álbum sustituye `manifest.json` y `targets.mind`.

## Duración recomendada

- **30 segundos** por defecto, porque el momento AR suele ser breve y se puede cambiar rápidamente de fotografía.
- **45 segundos** para recuerdos con una secuencia relevante.
- **Completo** para clips que quieras preservar íntegros como parte de la experiencia.

Elegir 30 o 45 segundos por sí solo **limita la reproducción**, pero **no reduce el peso del archivo**. Para reducir realmente el tamaño, marca la conversión y recorte. Esto puede tardar, especialmente con archivos MOV 4K.

## Tamaño de los archivos

El editor ya no tiene la restricción de 24 MiB, pero el navegador puede agotar memoria al procesar videos grandes. GitHub permite archivos de hasta 25 MiB desde su interfaz web y admite con GitHub Desktop archivos mayores, con advertencia desde 50 MiB, bloqueando los que **superen los 100 MiB**. GitHub Pages limita el tamaño total del sitio publicado a **1 GB**.

Por eso el editor comprueba que **cada MP4 exportado** no supere los 100 MiB. Si uno supera ese tamaño, selecciona 30/45 segundos, activa la conversión y prueba 1080p o 720p. Para guardar grandes videos originales, utiliza tu copia privada en Drive y/o un disco externo; después, la Raspberry Pi podrá almacenarlos fuera de GitHub Pages.

## Fotografía de impresión

La foto del video original se extrae al tamaño en píxeles del video que el navegador decodifique. Un video 4K 3840×2160 permite una foto de 3840×2160 píxeles (proporción panorámica). No se generan píxeles adicionales. Si el navegador no abre el original y exige una conversión previa a 1080p, el JPG se generará desde esa copia, con menor resolución. En ese caso recomendamos usar el Mac para extraer o procesar el video original si necesitas una impresión grande.

## Compatibilidad con el álbum anterior

`manifest.json` mantiene `schemaVersion: 1`. El nuevo campo opcional `endAt` permite que los clips se detengan a los 30/45 segundos. Los álbumes sin este campo conservan la reproducción repetida de la versión anterior. El editor, el visor y los datos de la futura Raspberry usan la misma estructura.

## Si el navegador no abre el conversor

La conversión integrada usa FFmpeg WebAssembly cargado en el navegador cuando hace falta. No se ha validado aún en todas las combinaciones iPhone/Safari y Mac/Chrome. Las conversiones de MOV HEVC 4K muy grandes pueden fallar por memoria. Alternativa práctica en el Mac: [HandBrake](https://handbrake.fr/) > abrir MOV original > preset de alta calidad > formato MP4, video H.264 > exportar. Para no perder calidad de impresión, conserva el MOV original y, si Chrome no lo abre, intenta generar el JPG desde Safari en el Mac o directamente en Safari en el iPhone.
