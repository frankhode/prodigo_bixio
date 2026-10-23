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

## Autor, personas identificadas e identificador de la pieza

- **Autor / fotógrafo**: combo por colección, con opción para agregar nombres. Una colección puede contener obras de distintos autores. Un autor nuevo se incorpora al repertorio al guardar la ficha o el campo.
- **Personas identificadas**: nombres propios, uno por línea. Es independiente de las categorías Hombres/Mujeres/Niños/etc. Admite formas como `Apellido, Nombre`.
- **Identificador único**: valor de texto para conservar ceros iniciales y prefijos; tipo Barcode Aleph, Inventario u Otro. Se distingue del número original que figura en la fotografía. Se comprueba que el identificador no esté asignado a piezas distintas de la misma colección; los archivos frente/reverso vinculados a una pieza pueden compartirlo.

Las fichas anteriores conservan sus datos. Los campos nuevos se muestran vacíos hasta que se completen; no se infiere un autor a partir del nombre de la colección.

## Completar / revisar un campo

Abrir el panel **Completar / revisar un campo**, encima de la grilla. Sus cantidades y listas respetan la colección y los filtros actuales de carpeta, estado y búsqueda.

Las tarjetas muestran cobertura de autor, personas identificadas e identificador. El selector **Campo** también permite recorrer los demás campos: fecha, número original, retrato, encuadre, categorías de personas, objetos, destacados, firma y notas. Para los campos exclusivos de retratos se consideran las fichas de tipo Retrato.

Elegir qué revisar: **Vacíos sin revisar**, **Sin revisar (con o sin dato)**, **Con dato** o **Todas las imágenes**. La lista presenta el valor actual junto a una miniatura. Pulsar una fila para empezar allí, o **Empezar recorrido** para comenzar por la primera. Se muestran hasta 50 filas; el recorrido incluye todas las coincidencias.

Durante el recorrido se muestra la imagen y únicamente el campo elegido:

- **Guardar y siguiente imagen** (o Enter/Ctrl+Enter): guarda ese campo, lo marca como revisado y avanza.
- **Guardar y cerrar**: guarda ese campo y termina la sesión.
- **Saltar imagen**: avanza sin guardar ni marcar revisado.
- **Imagen anterior**: vuelve a la anterior. Solicita confirmación si hay un cambio sin guardar.

Se puede guardar un campo vacío como revisado si el dato no está disponible; así deja de aparecer entre los vacíos sin revisar. Para volver a recorrerlo, elegir Todas las imágenes o Con dato, según corresponda. Los nombres propios se escriben uno por línea, por lo que Enter agrega una línea en ese campo; Ctrl+Enter guarda y avanza.

El guardado puntual conserva todos los demás campos, las vistas y el estado de la ficha: no convierte automáticamente un borrador en catalogado ni reabre una ficha completa. Cada operación conserva el control de revisiones y se registra en GitHub. Las marcas de revisión se almacenan en `fieldReviews`, fuera de los datos descriptivos de la imagen. El panel se genera desde las definiciones de `assets/record-fields.js`, donde pueden incorporarse futuros campos.

El visor público muestra autor, identificador y personas identificadas, y ofrece filtros por autor y por nombres cuando hay datos.

### Piezas con varias imágenes
En el paso Identificación se puede vincular cualquier imagen con otra de la misma pieza, incluso formando cadenas (tapa → otros → frente → reverso). No se admiten ciclos. Las vinculaciones anteriores siguen funcionando.

Cada imagen tiene un «Orden de visualización», también disponible en Completar / revisar un campo. Usar 1, 2, 3… para fijar la secuencia; sin orden explícito se usa frente, reverso, tapa, otros y nombre de archivo para desempatar. El visor muestra una tarjeta por frente completo. Las partes sin un frente vinculado no generan tarjetas. Dentro de la ficha solo se publican las imágenes completas; autor y personas identificadas se reúnen de todas sus partes para filtros y detalle.


### Editar las listas de catalogación
El archivo **[options.json](https://github.com/frankhode/prodigo-catalogador/edit/main/options.json)** es la fuente única de las listas fijas, tanto para la ficha como para el panel de revisión y la validación del guardado. Se lee siempre desde `prodigo-catalogador`, incluso al usar la copia del catalogador alojada en `prodigo_bixio/catalogador/`.

En GitHub: abrir el enlace, editar, guardar con **Commit changes** y recargar el catalogador. Mantener las claves; agregar, quitar o reordenar los textos dentro de cada lista. JSON requiere comillas dobles y comas entre elementos, sin coma después del último.

| Clave | Lista |
| --- | --- |
| `options.side` | Parte del documento |
| `options.kind` | Tipo de imagen |
| `options.portrait` | Tipo de retrato |
| `options.frame` | Encuadre |
| `options.direction` | Orientación |
| `options.environment` | Ambiente |
| `options.color` | Color: byn, col, sepia, iluminado, otros |
| `terms.people` | Categorías de personas |
| `terms.objects` | Objetos |
| `terms.highlights` | Destacados |

Ejemplo: `"side": ["Frente", "Reverso", "Tapa", "Interior", "Otros"]`.

Los cambios se aplican al recargar; GitHub puede tardar brevemente en propagarlos. Una configuración inválida muestra un error y bloquea la carga para evitar trabajar con listas inconsistentes. Los valores quitados se conservan en las fichas anteriores y se muestran como «valor anterior»: no se borran ni se renombran automáticamente. Los términos ya agregados a una colección también se conservan en `terms` de su JSON.

**Frente** determina las tarjetas públicas y **Retrato** habilita los campos de retrato: conservar esos textos mientras se use ese comportamiento. Las partes nuevas se muestran dentro de la ficha vinculada a un frente, con su orden de visualización.

Autores, firmas, colecciones y carpetas ya se construyen desde datos JSON: los autores (`authors`), firmas (`signatures`) y términos incorporados (`terms`) están en `data/collections/<coleccion>.json`. El registro de colecciones está en `data/index.json`. No editar estos archivos mientras haya una sesión con cambios sin guardar; después de una edición manual, recargar la colección antes de seguir catalogando. Los combos de estado y alcance de revisión son controles del sistema, no vocabularios documentales.


### Color y edición global por campo
«Color» se carga en el paso Tipo de imagen y en Completar / revisar un campo. Las fichas anteriores quedan sin dato hasta que se completen; no se asigna un color automáticamente.

El panel permite recorrer todos los campos de una ficha, incluida Imagen vinculada. Para una corrección masiva, elegir el campo, ajustar los filtros de carpeta/estado/búsqueda y el alcance (Vacíos sin revisar, Sin revisar, Con dato o Todas las imágenes). **Editar seleccionadas…** se ofrece para los combos de clasificación, color, autor y firma. El panel muestra una grilla de miniaturas: marcar las imágenes que deben recibir el cambio y abrir **Editar seleccionadas…**. La ventana muestra exclusivamente ese conjunto; elegir un valor y pulsar **Aplicar a N imágenes**. La selección se fija al abrir esa ventana. No hay imágenes preseleccionadas ni un límite de 50 tarjetas.

El guardado global usa un único commit: modifica exclusivamente el campo elegido, marca ese campo revisado y conserva los demás datos, las vinculaciones, los medios y el estado de catalogación. Si una ficha cambió o el repositorio rechaza la escritura, no se aplica ninguna parte de la operación. Los subcampos de retrato solo incluyen imágenes clasificadas como Retrato. Los campos libres, identificadores y vínculos se revisan individualmente.


### Selección visual para cambios globales
Cada miniatura del panel por campo tiene una casilla. Clic sobre la miniatura o su texto marca/desmarca la imagen; el botón **Revisar imagen** abre la revisión individual. Las casillas también se operan con Tab y Espacio.

Usar **Seleccionar todas las visibles**, **Quitar selección** o **Invertir selección** para trabajar por conjuntos. El contador informa seleccionadas / visibles. El filtro **Parte** permite trabajar solo con frentes, reversos, tapas u otras partes, además de los filtros existentes. Al ocultar imágenes con filtros salen de la selección; al cambiar de campo o colección se limpia toda la selección.

Ejemplo: elegir Color y Vacíos sin revisar, filtrar Parte a Frente si corresponde, marcar solo las fotografías sepia y pulsar Editar seleccionadas… → sepia → Aplicar a N imágenes. Los reversos sin marcar conservan su valor vacío. El botón global se habilita únicamente con imágenes marcadas. Después de guardar se limpia la selección aplicada; las restantes fichas quedan intactas.

**Empezar recorrido** recorre las imágenes marcadas cuando hay selección; si no hay ninguna, recorre todas las visibles. **Revisar imagen** abre únicamente la tarjeta elegida.


### Tamaño y contenido de la grilla
En el panel de revisión, activar **Solo imágenes** para ocultar textos y datos de las tarjetas. Las casillas de selección se mantienen disponibles y el acceso de revisión aparece al pasar el mouse o enfocar la tarjeta; en pantallas táctiles permanece visible. **Columnas** permite elegir de 2 a 12 imágenes por fila o ajuste automático. Las miniaturas se adaptan al ancho y se muestran completas, sin recortar. Estos cambios no alteran la selección ni los datos. La preferencia se recuerda en este navegador; si el almacenamiento local no está disponible, los controles siguen funcionando durante la sesión.
