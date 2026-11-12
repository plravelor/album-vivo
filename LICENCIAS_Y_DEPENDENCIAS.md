# Bibliotecas externas y conservación

La aplicación usa dependencias públicas con versiones fijadas:

- MindAR 1.2.5, https://github.com/hiukim/mind-ar-js , licencia MIT según su repositorio.
- Three.js 0.160.1, https://github.com/mrdoob/three.js , licencia MIT.
- JSZip 3.10.1, https://stuk.github.io/jszip/ , licencias MIT o GPLv3.

Este prototipo **carga** esos recursos de CDN; no los incluye en el ZIP. Para una Raspberry que funcione enteramente desconectada se deben conservar copias locales de las bibliotecas, de los módulos que importan, de los avisos de licencia correspondientes y probar su ejecución desde el servidor HTTPS local.

Se recomienda incluir también la versión original del código de Álbum Vivo y un archivo de recuperación en la memoria del producto.
