# Pródigo · Catalogador online

Catalogación de varias colecciones desde el navegador, con lectura de TIF locales, vistas WEBP y guardado directo en este repositorio. No requiere XAMPP, Python ni subir los TIF originales.

## Abrir

- URL de GitHub Pages, una vez habilitada: https://frankhode.github.io/prodigo-catalogador/
- Acceso alternativo alojado en el visor existente: https://frankhode.github.io/prodigo_bixio/catalogador/
- Visor conectado: https://frankhode.github.io/prodigo_bixio/

Para habilitar la primera URL: **Settings → Pages → Deploy from a branch → main → / (root) → Save**. Todos los datos y las vistas se guardan en `frankhode/prodigo-catalogador`, cualquiera sea el acceso utilizado.

## Autorizar el guardado

Pulsar **Conectar GitHub** y usar un token de acceso limitado (fine-grained personal access token): seleccionar únicamente `prodigo-catalogador`, permiso de repositorio **Contents: Read and write**. No se necesitan permisos de administración, workflows ni acceso a los demás repositorios.

El token permanece en memoria durante esta sesión. No se guarda en JSON, localStorage, IndexedDB ni archivos del proyecto; se envía exclusivamente a `api.github.com`. Al recargar la página hay que volver a conectar para escribir. **Desconectar GitHub** lo elimina de memoria. Nunca pegarlo en el chat ni agregarlo al repositorio.

El repositorio es público. Los datos guardados, incluyendo borradores, notas y vistas, podrán ser leídos desde GitHub. El visor solo presenta fichas completas que ya tengan imágenes publicadas. Esta aplicación no ofrece datos privados ni una pantalla de login independiente de GitHub.

## Empezar y retomar Bixio

1. Elegir la colección Bixio y conectar GitHub.
2. Para continuar trabajo existente: **Retomar JSON de XAMPP** y elegir el respaldo (`bixio-catalogo.json`) o la exportación portátil (`bixio-visor.json`). Recupera las fichas y sus vínculos. No sube las imágenes embebidas del JSON: se preparan desde la carpeta original en el siguiente paso.
3. **Leer carpeta de imágenes** y seleccionar la carpeta de TIF/JPG/PNG/WEBP. Lee subcarpetas. Procesa una imagen a la vez, genera una miniatura de 360 px y una vista de hasta 2200 px y las sube a GitHub. Los TIF originales no se modifican ni se publican.
4. Las imágenes se guardan en lotes de hasta cinco. Si se interrumpe la carga, elegir nuevamente la misma carpeta: omite los archivos ya publicados cuyo tamaño y fecha no cambiaron. Las vistas auxiliares `.bixio-vistas` se omiten.
5. Abrir una miniatura o **Continuar carga**. La carga conserva las pantallas, Enter/Espacio/Esc, zoom, firmas y términos nuevos del catalogador local.
6. **Guardar borrador** o **Guardar y siguiente imagen** escribe un commit con el JSON de la colección y el índice. El visor consulta el índice cada 30 segundos y permite **Actualizar** manualmente. Las cachés de GitHub pueden agregar una demora; no es una conexión WebSocket instantánea.

El alta de firmas se guarda inmediatamente. Los cambios de una ficha se guardan al usar los botones de guardar. Las vistas ya publicadas se usan también desde otra computadora, sin volver a seleccionar TIF.

## Colecciones

**Nueva colección** crea un catálogo independiente con sus términos y firmas. Cada colección tiene su propio JSON. Bixio incluye el repertorio BIX-01 a BIX-13; en otras colecciones se comienza con Sin firma y Por identificar, y las nuevas variantes usan FIR-01, FIR-02, etc. Los nuevos nombres de colección generan identificadores de ruta normalizados.

No se mezclan fichas entre colecciones. Los JSON de XAMPP agregan las fichas que no existan y conservan las existentes. Si un código de firma del respaldo ya tiene otro significado en el catálogo de destino, se rechaza la importación para evitar cambiar su identidad.

## Datos y actualizaciones

- `data/index.json`: colecciones, revisiones y cantidades.
- `data/collections/<coleccion>.json`: fichas, firmas y términos.
- `media/<coleccion>/`: miniaturas y vistas separadas del JSON.

Cada guardado crea un único commit que actualiza los datos relacionados. Antes de escribir se verifica la revisión de la colección y se actualiza la rama sin forzar. Si otra ventana modificó la misma colección, se detiene el guardado y se conserva el contenido en pantalla. **Respaldo de cambios**, dentro del editor, incluye también la ficha en edición. **Actualizar** vuelve a cargar la versión de GitHub después de cerrar la ficha.

Una colección de varios cientos de imágenes es viable, pero la primera subida puede llevar minutos y está sujeta a límites de GitHub. La carga informa el progreso y permite retomar por lotes después de un error. Las actualizaciones de fichas no vuelven a subir las imágenes. Si cambia un original, se publican vistas con un nombre nuevo, para evitar imágenes viejas en caché; las vistas antiguas quedan en el repositorio y pueden limpiarse posteriormente.

El visor descarga miniaturas y abre la imagen grande al consultar una ficha. La conexión pública con el visor lee los JSON y las imágenes desde este repositorio, sin token. Solo se publican visualmente las fichas completas con vistas; los borradores y pendientes se conservan en los JSON públicos.

## Validación

`node tests/store.cjs` (desde la carpeta padre, donde el proyecto se llama `prodigo-catalogador`) prueba guardado atómico, protección de conflictos, colecciones independientes y el manejo del token mediante un servidor GitHub simulado. No usa credenciales ni modifica datos reales.
