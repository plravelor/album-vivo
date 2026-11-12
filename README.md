# Álbum Vivo · v2

Aplicación web de realidad aumentada: cada fotografía impresa activa el video que tiene asociado.

## Características

- Editor sin programación: sube un MP4 y extrae una fotografía imprimible automáticamente a resolución original.
- Permite escoger otro fotograma y usarlo como punto de inicio del video.
- Varios recuerdos por álbum con un `manifest.json` y un `targets.mind` común.
- Arranque cinematográfico a baja velocidad (configurable).
- Tres ajustes de estabilidad del seguimiento AR.
- Exportación ZIP compatible con GitHub Pages y con un futuro servidor Raspberry Pi.
- Compatibilidad con álbumes preparados con la versión 1.

## Para empezar

Lee [GUIA-ACTUALIZACION-v2.md](./GUIA-ACTUALIZACION-v2.md).

No subas videos privados o íntimos a GitHub Pages: las rutas del material publicado son públicas.

## Tecnología

- MindAR 1.2.5, Three.js 0.160.1, JSZip 3.10.1 (vía CDN).
- Archivos estáticos de HTML, CSS, JavaScript. No necesita Node.js, compiladores externos ni un servidor propio para probar la versión web.
- La realidad aumentada necesita HTTPS y permiso de cámara.
- Para la versión autónoma en Raspberry Pi también habrá que servir las dependencias localmente y resolver HTTPS confiable.

## Licencias

Consulta `LICENCIAS_Y_DEPENDENCIAS.md`. Respeta las licencias de las bibliotecas si comercializas un producto.
