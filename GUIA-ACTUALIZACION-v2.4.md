# Álbum Vivo 2.4 — corrección para iPhone/Brave y pruebas privadas

## Qué se corrigió

- En v2.3, FFmpeg WebAssembly intentaba cargar un módulo `blob:` que podía fallar en Brave para iPhone. En v2.4 ya **no se usa FFmpeg** para generar el álbum.
- **Convertir a MP4** aparece **desmarcado por defecto**, incluso al elegir un archivo MOV.
- Se pueden seleccionar videos MOV del iPhone; cuando Brave puede reproducirlos y extraer un fotograma, el álbum se genera **sin convertir el video**. El paquete incluye el MOV original.
- Si quieres convertir, la opción **opcional** utiliza `MediaRecorder` y `canvas.captureStream` para generar una copia MP4 **en tiempo real**, solo si el navegador informa que es compatible. Puede no funcionar en todos los teléfonos y puede alterar el audio o la calidad.
- Los límites de duración de 30/45 s funcionan durante la reproducción aunque el archivo conservado sea más largo.
- Un archivo mayor de 100 MiB todavía puede prepararse en un ZIP local; **no** podrás publicarlo directamente en GitHub (límite de Git por archivo).
- Nueva opción en **Ver álbum**: **Abrir un álbum privado desde este teléfono (ZIP)**. El paquete se procesa en el navegador, sin subir fotos y videos a GitHub. Para verlo en otros teléfonos habría que compartir ese ZIP; en la versión Raspberry Pi los archivos serán servidos desde el álbum físico.

## Instalar v2.4

1. Descomprime `Album_Vivo_Correccion_v2.4.zip`.
2. En GitHub Desktop, entra a `album-vivo` y abre **Repository → Show in Finder**.
3. Copia **el contenido** de la carpeta descomprimida sobre la raíz del repositorio: `index.html`, `styles.css`, `js/`, documentos y los otros archivos correspondientes.
4. **NO borres ni reemplaces la carpeta `album/`**. El ZIP de actualización no incluye los recuerdos actuales.
5. En GitHub Desktop, comprueba que aparecen cambios de `index.html`, `js/editor.js`, `js/app.js`, `js/viewer.js`, `js/common.js`, `js/media-converter.js` y `styles.css`.
6. Escribe `Álbum Vivo 2.4 - MOV y álbum privado` en Summary → **Commit to main** → **Push origin**.
7. Abre `https://plravelor.github.io/album-vivo/?v=24` y confirma que arriba dice **Prototipo 2.4**. Si no, prueba recarga completa (en Mac `Cmd+Shift+R`).

## Primera prueba recomendada desde Brave en iPhone

1. Abre Álbum Vivo, **Crear álbum**.
2. Selecciona **un MOV original** desde Fotos/Archivos. Debe aparecer el fotograma y el selector de segundo.
3. Mantén **DESMARCADA** la casilla de convertir a MP4.
4. Pulsa **Preparar álbum**; debe habilitarse **Descargar paquete ZIP**.
5. Guarda ese ZIP en la app Archivos del iPhone.
6. En **Ver álbum**, usa **Abrir un álbum privado desde este teléfono (ZIP)** y selecciona el ZIP. Pulsa **Iniciar cámara** mientras tienes la foto mostrada en otra pantalla o impresa.
7. **No hace falta publicar el ZIP en GitHub.** Si conservas el MOV, el video está optimizado para dispositivos Apple y su reproducción en Android puede fallar.

## Para probar MP4 en Brave

Después de comprobar el proceso básico anterior, en otro recuerdo **marca** la opción de convertir y elige 30 s/720p. Si Brave permite grabar MP4 por `MediaRecorder`, preparará una copia de forma local y tardará aproximadamente la duración elegida, con la pantalla encendida. Si da un mensaje de incompatibilidad, **desmarca** la conversión y exporta el MOV. Para un MP4 H.264 compatible entre plataformas, utiliza [HandBrake](https://handbrake.fr/) en un Mac o PC y súbelo directamente a Álbum Vivo.

## Privacidad

- **No subas recuerdos privados a `album/` de GitHub Pages**. Los enlaces son públicos, aunque la página exija reconocer una foto.
- El ZIP privado permite ver los recuerdos en el mismo teléfono después de importarlo; **no** publica los archivos. Es una solución de prueba, no un modo automático para visitantes.
- El producto con Raspberry Pi almacenará las fotos y videos localmente y permitirá que los visitantes se conecten a la red del álbum. Necesitará autenticación/controles de acceso y HTTPS local para la cámara.
- Si ya subiste fotos privadas al repositorio público, quitarlas de la carpeta publicada no elimina las copias de la historia de Git. Conviene migrar a un repositorio nuevo sin esos archivos y retirar la publicación previa antes de considerar que se ha reducido la exposición.

## Limitaciones actuales

- No se ha verificado físicamente la conversión con Brave en un iPhone. El editor sin conversión debería permitir preparar el paquete si el MOV se reproduce y se puede extraer la fotografía, como ocurrió en las capturas.
- Convertir mediante MediaRecorder es una alternativa ligera, pero no garantiza conservar audio, resolución, FPS ni sincronización exacta; los videos de archivo deben guardarse por separado.
- No se ha integrado todavía un servidor privado multiusuario ni la Raspberry Pi.
