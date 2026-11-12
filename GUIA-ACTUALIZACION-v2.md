# Álbum Vivo · Actualización 2.0

## Qué cambia

- Un video MP4 basta para crear un recuerdo: el editor extrae automáticamente un JPG de su primer fotograma.
- Puedes deslizar la barra de tiempo y elegir otro instante si el inicio está borroso u oscuro.
- Puedes descargar cada JPG imprimible sin hacer pantallazos.
- Los JPG se generan a la resolución que ofrece el video original. No se añaden píxeles falsos.
- Al preparar el álbum, el mismo fotograma se usa para el reconocimiento AR y el video empieza desde el instante escogido.
- Transición de arranque a baja velocidad durante 400/700/1000 ms o inicio normal.
- Modos de seguimiento: equilibrado, más estable, más rápido.
- Icono y manifiesto para añadir el sitio a la pantalla de inicio del iPhone.
- Se pueden seguir cargando álbumes v1 publicados anteriormente.

## Actualizar tu repositorio sin perder las fotos y los videos

1. Descarga `Album_Vivo_Actualizacion_v2.zip` y descomprímelo.
2. En GitHub Desktop, abre el repositorio `album-vivo`.
3. Pulsa `Repository` → `Show in Finder`.
4. Abre el ZIP descomprimido y **copia su contenido** dentro de la carpeta de tu repositorio.
5. Cuando macOS pregunte si quieres reemplazar los archivos existentes, acepta reemplazar `index.html`, `styles.css` y los archivos JavaScript de la carpeta `js/`.
6. **No elimines ni sustituyas la carpeta `album/`**: contiene tus recuerdos ya publicados. El ZIP de actualización no incluye esa carpeta.
7. En GitHub Desktop escribe el Summary `Álbum Vivo v2 - fotogramas y estabilidad`.
8. Pulsa `Commit to main` y después `Push origin`.
9. Abre `https://plravelor.github.io/album-vivo/` y recarga la página. Si aparece el contenido anterior, prueba una ventana privada o borra caché de ese sitio.

El primer paso se puede hacer sin videos nuevos. Tus cuatro recuerdos publicados deben seguir disponibles en el visor. No vuelvas a subir sus videos para probar el nuevo visor.

## Crear un nuevo álbum solo con videos

1. Entra a `Crear álbum`.
2. Selecciona el primer video MP4 H.264, inferior a 24 MiB.
3. La página extrae un fotograma JPG automáticamente. Si prefieres un momento posterior, usa la barra de tiempo y el botón `Elegir este fotograma`.
4. Descarga el JPG individual con `Descargar JPG para imprimir` si quieres revisarlo antes de preparar el paquete.
5. Repite para los demás videos. Ajusta la duración de la transición inicial (700 ms por defecto).
6. Pulsa `Preparar álbum`, luego `Descargar paquete ZIP`.
7. Descomprime el ZIP de contenido. Su carpeta `album/` contiene `foto-001.jpg`, `video-001.mp4`, ..., `manifest.json` y `targets.mind`.
8. Copia **los archivos dentro de esa carpeta `album/`** a la carpeta `album/` del repositorio, sustituyendo los anteriores si quieres publicar el nuevo álbum en lugar del actual.
9. Haz `Commit` y `Push origin`. GitHub Pages actualizará el álbum después de publicar el cambio.

**Imprime exactamente los JPG del ZIP.** Si recortas la imagen, colocas marcos, la giras o alteras el contraste antes de imprimir, el reconocimiento puede empeorar. Para fotos verticales de un video 9:16, solicita impresión sin recorte o un tamaño con la misma proporción.

## Sobre la calidad de impresión

Un MP4 de 1920 × 1080 entrega un fotograma de hasta 1920 × 1080 píxeles (en orientación vertical, 1080 × 1920). Un video 4K UHD entrega hasta 3840 × 2160. El JPG está comprimido con calidad alta (`0.98`) y sin redimensionamiento. La calidad real depende de la nitidez, compresión y exposición de la grabación. Un fotograma original borroso seguirá borroso; elegir otro momento suele funcionar mejor que ampliarlo.

## Mejorar seguimiento y alineación

- Prueba primero `Equilibrado`; si vibra cuando sostienes el móvil, selecciona `Más estable` antes de iniciar la cámara.
- `Más estable` puede quedarse ligeramente atrás al mover el teléfono. `Más rápido` reacciona mejor a movimientos rápidos pero puede vibrar.
- Usa fotos planas, bien iluminadas y sin reflejos. Al imprimir, evita recortar o deformar el archivo creado.
- Se aplica un margen de cobertura del 1,2 % para disimular bordes claros en el papel. No corrige todos los errores de posicionamiento.
- Las fotos tomadas de un momento distinto del video no ofrecen una transición visual tan convincente como un fotograma exacto.

## Uso como aplicación sin abrir el navegador manualmente

En iPhone, abre el sitio en Safari, pulsa Compartir → Añadir a pantalla de inicio → Abrir como app. Desde entonces puedes abrirlo desde su icono. La primera vez un visitante debe acceder por URL, QR o etiqueta NFC. El navegador sigue necesitando autorización para usar la cámara. Instalarlo en la pantalla de inicio no descarga automáticamente todos los videos para verlos sin conexión.

## Privacidad

GitHub Pages publica las fotos y videos del directorio `album/` mediante URLs accesibles públicamente. No lo uses como almacenamiento privado definitivo. Para el prototipo Raspberry, reutilizaremos el mismo `manifest.json`, `targets.mind` y visor, pero alojaremos los videos en la memoria local del álbum y les daremos acceso desde un servidor protegido con HTTPS.
