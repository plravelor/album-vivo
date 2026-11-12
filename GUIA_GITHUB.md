# Guía de instalación y publicación de Álbum Vivo

**Objetivo:** crear en tu cuenta `plravelor` un sitio independiente `https://plravelor.github.io/album-vivo/`, al que cualquier teléfono pueda acceder y donde cada fotografía impresa active un video diferente.

## A. Qué necesitas

- Una cuenta de GitHub con acceso a `https://github.com/plravelor`.
- Un computador Windows, macOS o Linux con internet.
- Un teléfono iPhone o Android con Safari o Chrome actualizado y acceso a cámara.
- De una a tres fotografías **JPG o PNG** para la primera prueba (imprimir o mostrar en otra pantalla).
- Un video **MP4 H.264** por fotografía; para empezar, 5–15 segundos y menos de 24 MiB por video.
- Este ZIP de proyecto, descomprimido.

**No necesitas instalar Node.js, npm, Python, MindAR ni Three.js.** La web carga las bibliotecas automáticamente desde CDN. Recomendamos **GitHub Desktop**, gratuito, para evitar usar comandos.

## B. Crear el repositorio con GitHub Desktop (recomendado)

1. Ve a https://desktop.github.com/ e instala GitHub Desktop en tu computador. Inicia sesión con tu cuenta `plravelor`.
2. Abre GitHub Desktop y elige **File > New repository**.
3. Nombre del repositorio: `album-vivo`. Selecciona una carpeta local donde guardarlo; pulsa **Create repository**.
4. En GitHub Desktop, selecciona **Repository > Show in Explorer** (Windows) o **Show in Finder** (Mac) para abrir la carpeta local del repositorio.
5. Abre la carpeta descomprimida `album-vivo-prototipo` que recibiste. **Copia TODO su contenido dentro de la carpeta del repositorio**, no la carpeta contenedora. Deben quedar `index.html`, `styles.css`, `js/`, `album/`, `README.md`, `.nojekyll`, etc. en la raíz del repositorio. Puedes aceptar reemplazar el README automático de GitHub Desktop.
6. Regresa a GitHub Desktop. Verás los archivos nuevos en **Changes**.
7. Escribe en **Summary**: `Primer prototipo de Álbum Vivo`. Pulsa **Commit to main**.
8. Pulsa **Publish repository**. Marca que será **Public** y publica. Si ya existía un repositorio `album-vivo`, usa **Push origin** en su lugar.

**Importante:** todavía no has añadido fotografías privadas; los archivos de la aplicación serán públicos.

## C. Activar GitHub Pages

1. Abre `https://github.com/plravelor/album-vivo`.
2. Entra en **Settings** del repositorio.
3. En el menú lateral selecciona **Pages**.
4. En **Build and deployment**, elige **Deploy from a branch**.
5. Selecciona la rama `main` y la carpeta `/(root)`; pulsa **Save**.
6. Cuando GitHub termine de publicar, abre `https://plravelor.github.io/album-vivo/`.
7. Debe mostrarse la portada **Álbum Vivo** y las dos pestañas **Ver álbum** y **Crear álbum**.
8. La pestaña **Ver álbum** dirá que todavía no hay uno publicado; esto es correcto.

Si aparece un error 404, comprueba la rama, la carpeta root y que existe `index.html` en la raíz. Espera a que GitHub termine la publicación y recarga.

## D. Crear tus primeras asociaciones

1. Desde el computador, abre tu página publicada.
2. Pulsa la pestaña **Crear álbum**.
3. Introduce un título.
4. En **Recuerdo 1**, selecciona la fotografía JPG/PNG y el MP4 asociado.
5. Pulsa **Añadir otra fotografía** y repite para una segunda o tercera pareja (opcional).
6. Pulsa **Preparar álbum**. MindAR procesará todas las imágenes para crear `targets.mind`. No cierres la página durante el proceso.
7. Aparecerán dos opciones: **Descargar paquete ZIP** y **Probar con cámara**.
8. Descarga el paquete `album-vivo-contenido.zip`.

La opción **Probar con cámara** sirve para experimentar en ese mismo dispositivo sin publicar aún. Debes colocar la fotografía delante de la cámara; por ejemplo, imprimirla o mostrarla en una segunda pantalla.

## E. Publicar tus fotos y videos en GitHub

1. En el computador, localiza `album-vivo-contenido.zip` y descomprímelo.
2. Verás una carpeta interior llamada `album` con `manifest.json`, `targets.mind`, `foto-001.jpg`, `video-001.mp4`, etc.
3. Abre la carpeta LOCAL de tu repositorio `album-vivo` desde GitHub Desktop.
4. Dentro de esa carpeta existe `album/`. Copia **el contenido de la carpeta `album` del ZIP**, no la carpeta entera, dentro de `album/` de tu repositorio. Sustituye archivos previos si te lo solicita.
5. Vuelve a GitHub Desktop. En **Summary** escribe `Publicar primer álbum`.
6. Pulsa **Commit to main** y luego **Push origin**.
7. Abre tu página `https://plravelor.github.io/album-vivo/` desde el iPhone o Android y recarga.
8. En **Ver álbum** debería aparecer el título, las miniaturas y el botón **Iniciar cámara**.

**Advertencia:** los videos de la carpeta `album/` quedarán públicamente accesibles mediante sus enlaces. Usa material sin datos privados hasta que pasemos a Raspberry o a un alojamiento protegido.

## F. Comprobar que las fotografías cobran vida

1. Imprime las fotos originales (sin editar ni recortar después de crear el paquete) o muéstralas en otra pantalla.
2. Abre el sitio desde el móvil, conectado a internet.
3. En **Ver álbum** pulsa **Iniciar cámara**.
4. Concede permiso para usar la cámara.
5. Enfoca la fotografía 1, en plano y con buena luz. Debe aparecer **su video 1 sobre la fotografía**.
6. Pulsa **Activar sonido** si deseas escuchar audio. La reproducción automática comienza silenciada por restricciones habituales del navegador.
7. Enfoca la foto 2. Debe aparecer **su video 2**.
8. Pulsa **Cerrar** cuando termines. Esto libera la cámara.

Para lograr la ilusión de una foto que cobra vida, imprime un fotograma próximo al **inicio** del video y utiliza el mismo encuadre y proporción. En esta versión el video empieza desde el primer fotograma al reconocer la foto.

## G. Para modificar fotos o videos

Vuelve a **Crear álbum**, prepara de nuevo el conjunto completo de fotografías y videos que desees y descarga un ZIP nuevo. En esta versión se genera un `targets.mind` único para todas las fotos. **No es suficiente reemplazar solo el MP4 si cambias el orden o las imágenes**. Sustituye el conjunto completo dentro de `album/` y vuelve a publicar.

## H. Si tus videos provienen de un iPhone

Muchos iPhone graban archivos MOV con HEVC/H.265. Para máxima compatibilidad con teléfonos Android y iOS, convierte esos videos a **MP4 con video H.264 y audio AAC** antes de importarlos. Una opción gráfica gratuita es **HandBrake**, en https://handbrake.fr/ . Selecciona un preajuste 720p H.264 y exporta MP4. Los clips cortos se procesan más rápidamente y se cargan mejor.

También puedes recortar previamente el video para que la parte que deseas convertir en foto aparezca al comienzo.

## I. Problemas habituales

| Síntoma | Qué hacer |
|---|---|
| Página en blanco | Revisa que `index.html` esté en la raíz, `js/` exista, y haya internet para cargar los CDN. |
| No aparece la cámara | Usa la dirección HTTPS de GitHub Pages; comprueba permisos del navegador y que otra app no use la cámara. |
| Dice «Todavía no hay un álbum publicado» | Aún falta subir `album/manifest.json` y los archivos del ZIP a GitHub y hacer Push. |
| El video no aparece | Verifica la luz, evita reflejos, presenta la foto completa y usa exactamente la foto cargada al editor. |
| No se oye el video | Pulsa «Activar sonido» cuando esté reconocida la imagen. |
| La cámara reconoce mal | Elige una foto con contrastes, texturas y detalles, evitando paredes lisas y fotos muy parecidas entre sí. |
| El MP4 no reproduce | Reconviértelo a H.264/AAC. |
| GitHub no deja subir un video | La interfaz web limita los archivos a 25 MiB. Recorta o comprime el video. |
| No se actualiza la galería | Comprueba Push origin y que GitHub Pages haya publicado los archivos nuevos; recarga la página. |

## J. Importante para los siguientes prototipos

El paquete de datos exportado aquí (**manifest.json + targets.mind + fotos + videos**) también es el que leerá la Raspberry. Para convertir el producto en un álbum autónomo tendremos que instalar un servidor local, proteger el panel de edición con contraseña, configurar Wi-Fi/AP, HTTPS con certificado confiable en teléfonos ajenos y **copiar todas las bibliotecas al dispositivo** para que funcione sin internet.
