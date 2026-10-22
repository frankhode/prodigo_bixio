# Pródigo — Bixio · Catalogador local para XAMPP

## Instalación en Windows

1. Copiar esta carpeta como `C:\xampp\htdocs\bixio`.
2. Iniciar Apache desde XAMPP. No necesita MySQL: guarda los registros en JSON con bloqueo de escritura y respaldo anterior.
3. Abrir `http://localhost/bixio/`.
4. Pulsar **Agregar carpeta** y pegar la ruta completa donde están los TIF, por ejemplo `D:\Fotos Bixio`. Incluye subcarpetas.
5. Las vistas se generan automáticamente al aparecer las imágenes en pantalla, usando el mismo decodificador del catalogador de montadas. La primera apertura de un TIF pesado puede tardar unos segundos; las vistas se guardan en `datos/vistas` para las siguientes aperturas. No necesita Python, Pillow ni extensiones TIFF de PHP.

Al agregar más archivos, volver a leer la misma carpeta. No duplica imágenes ni pisa catalogaciones. Mantener la ruta de la carpeta; moverla requiere una migración de rutas. Conserva los TIF originales y muestra la primera página de cada archivo multipágina. El procesamiento se realiza de a una imagen en un Web Worker para mantener los formularios disponibles. También acepta JPG, PNG y WEBP.

## Actualizar la instalación existente

Copiar `api.php`, `index.php`, `signatures.json` y la carpeta `assets` completa sobre la instalación anterior, y recargar con **Ctrl+F5**. No reemplazar ni borrar `datos`: allí están los registros. No hace falta volver a agregar la carpeta que ya se leyó. El script `preparar_vistas.py` sigue incluido como alternativa opcional; las vistas anteriores también se aprovechan.

## Carga

Miniaturas → seleccionar imagen o **Continuar carga** → identificación → tipo → personas → objetos → destacados → firma del estudio → revisión. La imagen queda visible, con zoom. Se separan tipo de retrato, encuadre y orientación porque son dimensiones combinables.

- Enter avanza; Tab recorre campos; Espacio marca opciones. Las opciones múltiples permanecen abiertas hasta avanzar.
- Esc retrocede un paso; en el primero solicita descartar si hay cambios.
- Ctrl+Enter guarda como catalogada y abre la siguiente pendiente o borrador dentro de los filtros. Exige seleccionar la parte del documento.
- Guardar borrador permite interrumpir y retomar; no marca como catalogada.
- Objetos, personas y destacados admiten términos nuevos. Los términos quedan disponibles al guardar.
- Fecha libre: `1905`, `ca. 1910`, `1900–1910`, etc. No se asignan fechas de demostración.
- Reverso/tapa/otros se pueden vincular a un frente ya guardado desde Identificación. Cada archivo conserva su descripción.
- Filtros por carpeta, estado y texto. Exportación JSON completa para respaldo e integración posterior. No publica automáticamente en el sitio demostrativo.

## Firmas del estudio

La pantalla Firma del estudio permite elegir una variante BIX-01 a BIX-13, Sin firma o Por identificar. Las descripciones iniciales se transcribieron de la captura del catalogador anterior proporcionada por el usuario. El detalle completo aparece debajo del combo.

Con **Nueva firma** se abre un campo de descripción; Enter agrega y selecciona la firma. El código correlativo se asigna automáticamente (BIX-14, etc.). Se conserva en el catálogo local inmediatamente y queda disponible para los siguientes registros. Si ya existe una descripción igual, se reutiliza. La selección de cada imagen se guarda con su registro o borrador. En revisión y exportación JSON se incluye la firma; el catálogo exportado contiene también el repertorio completo.

Las fichas anteriores permanecen sin firma consignada hasta que se seleccione una; no se les asigna automáticamente Sin firma. Actualizar `signatures.json` no pisa las firmas añadidas por el usuario, que se conservan en `datos/catalogo.json`.

## Respaldo y alcance

Respaldar toda la carpeta `datos` junto con las imágenes y sus vistas. `catalogo.json` es la base; `catalogo.anterior.json` conserva solo la versión anterior, no un historial completo. Exportar periódicamente y guardar copias fechadas. No reemplazar `datos` al actualizar código.

PHP 7.4+ / 8.x y Apache; navegador moderno con Web Workers. Sin extensiones TIFF, Composer ni dependencias web externas. Diseñado para uso local en la computadora con XAMPP. Bloquea accesos que no sean localhost; no desplegar como panel público. No incluye autenticación, publicación, ni migración a MySQL.

## Decodificador

`assets/tiff-decoder.js` se conserva sin modificaciones desde el ZIP de relevamiento-montadas-mysql provisto por el usuario. Incluye UTIF y pako.

## Ver la catalogación en el sitio web

En XAMPP, pulsar **Exportar para visor**. Se genera `bixio-visor.json` con las fichas completas y las vistas de sus imágenes, incluidas las de reversos catalogados. No incluye rutas absolutas del disco. Mientras prepara los TIF puede tardar; muestra el progreso.

Abrir https://frankhode.github.io/prodigo_bixio/ y usar **Importar JSON**. Seleccionar `bixio-visor.json`: ya contiene las imágenes, no requiere subir TIF a GitHub. La importación es local a esa sesión del navegador; no modifica el catálogo público ni envía el archivo a un servidor. Para compartir esta vista, compartir el JSON y la URL; cada persona lo importa. Para publicarlo como catálogo predeterminado se requiere una carga posterior al repositorio.

También admite el **Respaldo JSON** existente (`bixio-catalogo.json`). En ese caso usar **Vincular imágenes** y seleccionar la carpeta de los TIF o JPG originales. El navegador solicita permiso para leer los archivos elegidos y genera sus vistas con el decodificador incluido. Si hay nombres repetidos y no se puede determinar una ruta única, informa el problema sin asignar una imagen dudosa. Al recargar la página hay que volver a importar y vincular.

El visor muestra las fichas completas; las pendientes y los borradores no se incluyen. Las fechas sin consignar se mantienen visibles al no aplicar un filtro de período. Se conservan firmas nuevas, términos propios y las relaciones frente/reverso. **Volver a la muestra** restaura la demostración.
