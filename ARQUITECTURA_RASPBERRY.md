# Arquitectura propuesta para el prototipo Raspberry Pi (siguiente etapa)

Esta carpeta documenta el diseño; **todavía no contiene el software de servidor/administración Raspberry**. El prototipo GitHub sí contiene el frontend compartido.

## Objetivo comercial

1. Conectar alimentación a una Raspberry Pi oculta dentro del álbum.
2. El álbum se inicia automáticamente y ofrece dos modalidades de Wi-Fi: conectarse al router de la casa o crear su propia red.
3. El comprador entra con su contraseña de administrador, selecciona imágenes y videos y pulsa «Preparar álbum» sin escribir código.
4. Los familiares conectados al álbum abren una dirección HTTPS confiable, permiten la cámara y ven cada video sobre su fotografía; no se conectan a USB ni importan archivos.

## Discos y archivos

```text
Raspberry Pi
├── microSD de arranque (Raspberry Pi OS Lite)
│   ├── servidor HTTPS local
│   ├── frontend Album Vivo (copia de index.html, styles.css, js/)
│   ├── bibliotecas MindAR / Three.js / JSZip locales
│   └── servicio systemd para inicio automatico
└── USB removible (datos)
    ├── album/
    │   ├── manifest.json
    │   ├── targets.mind
    │   ├── foto-001.jpg
    │   ├── video-001.mp4
    │   └── ...
    └── respaldo/
        ├── codigo_fuente/
        └── instrucciones_de_recuperacion.md
```

La USB guarda recuerdos y respaldo recuperable. **Una Raspberry no suele arrancar de una USB de datos como si fuera un sistema operativo autónomo**: en una Zero 2 W la microSD es la elección sencilla para el arranque y el sistema. El álbum puede tener también una imagen de recuperación del sistema.

## El código compartido

El mismo `js/viewer.js` reconoce los objetivos y coloca el video adecuado. `js/common.js` establece el contrato de datos. En GitHub `album/` es una carpeta del sitio; en Raspberry es una ruta servida desde USB. No cambia el formato del archivo ni el modo de realidad aumentada.

Se añadirá un **backend de administración** para cargar y borrar fotos y videos y escribir en USB; GitHub Pages no puede hacerlo porque es un alojamiento estático. El backend también gestionará autenticación, límites de almacenamiento y actualizaciones.

## Red y cámara

- Modo «casa»: Raspberry se une a la Wi-Fi local. Los teléfonos conectados a esa misma Wi-Fi ven el álbum.
- Modo «portátil»: Raspberry anuncia su propio punto de acceso Wi-Fi. Los visitantes se conectan usando un QR de configuración Wi-Fi y abren la página del álbum.
- Modo «ambos»: dos adaptadores Wi-Fi o configuración de red cuidadosamente probada. El álbum puede crear su red y utilizar la Wi-Fi externa para tener salida a internet cuando exista.
- **Requisito crítico:** la cámara del navegador necesita origen seguro. En teléfonos de terceros, HTTP por IP local no sirve. Se requiere un **nombre de dominio con HTTPS reconocido y resolución DNS local**, y renovar el certificado mientras se pueda acceder a internet, o una alternativa nativa instalada. La certificación y su mantenimiento son un requisito de producto, no un detalle opcional.
- Un QR o NFC facilita abrir la página, pero los usuarios deben unirse a la red pertinente y permitir acceso a cámara.

## Alimentación reemplazable

- Raspberry Pi Zero 2 W: fuente **5 V, al menos 2 A** conforme a documentación actual. Usa el conector micro-USB de alimentación.
- Para las primeras pruebas: fuente mural oficial/compatible y luego batería USB externa de calidad, removible desde un compartimento accesible.
- Comprobar si el banco de energía soporta carga y descarga simultánea; muchos no o se apagan con cargas bajas.
- Añadir control de apagado seguro, indicador de encendido y un modo para retirar el almacenamiento sin corrupción de datos.
- Evitar baterías de litio sin protección o soldadas permanentemente en el papel. Mantener celda, cableado y disipación en recinto adecuado y accesible.

## De prototipo a producto

1. Probar reconocimiento de 3–5 imágenes en móviles iOS y Android, usando GitHub.
2. Copiar el frontend y sus dependencias a Raspberry e implementar servidor HTTPS local.
3. Probar dos modos de Wi-Fi y conexiones simultáneas de varios visitantes.
4. Implementar editor web autenticado + compilación de fotos, guarda en USB y exportación de copia de seguridad.
5. Probar reemplazo de batería, apagado seguro, recuperación de microSD/USB y pérdida/reconexión de Wi-Fi.
6. Diseñar cubierta rígida y compartimento, sin comprimir la batería ni bloquear la antena.
7. Solo entonces explorar ventas: fiabilidad, soporte, seguridad, mantenimiento de certificados, privacidad y licencias.

## Conservación del archivo

Guardar tres copias de los videos originales y de los archivos del álbum: USB del álbum, disco externo independiente y nube. La USB se revisará y migrará periódicamente. Un archivo PDF con las asociaciones foto↔video y una copia del código fuente debe acompañar cada unidad.
