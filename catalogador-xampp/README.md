# Pródigo — Bixio · Catalogador local para XAMPP

## Instalación en Windows

1. Copiar esta carpeta como `C:\xampp\htdocs\bixio`.
2. Iniciar Apache desde XAMPP. No necesita MySQL: guarda los registros en JSON con bloqueo de escritura y respaldo anterior.
3. Abrir `http://localhost/bixio/`.
4. Para ver TIF: instalar Pillow una sola vez con el Python habitual: `python -m pip install Pillow`. Ejecutar `python preparar_vistas.py`; abre un selector de carpeta. También admite `python preparar_vistas.py "D:\Fotos Bixio"`. Genera vistas en `.bixio-vistas` dentro de la carpeta elegida. Conserva los TIF; muestra la primera página de cada TIF multipágina. Si el Python portable tiene otro ejecutable, usar su ruta en lugar de `python`.
5. En el catalogador, pulsar **Agregar carpeta** y pegar la misma ruta completa, por ejemplo `D:\Fotos Bixio`. Lee subcarpetas. No sube ni copia originales. JPG/PNG/WEBP no requieren preparación.

Al agregar más archivos, volver a ejecutar el generador y leer la misma carpeta. No duplica imágenes ni pisa catalogaciones. Mantener la ruta de la carpeta; moverla requiere una migración de rutas.

## Carga

Miniaturas → seleccionar imagen o **Continuar carga** → identificación → tipo → personas → objetos → destacados → revisión. La imagen queda visible, con zoom. Se separan tipo de retrato, encuadre y orientación porque son dimensiones combinables.

- Enter avanza; Tab recorre campos; Espacio marca opciones. Las opciones múltiples permanecen abiertas hasta avanzar.
- Esc retrocede un paso; en el primero solicita descartar si hay cambios.
- Ctrl+Enter guarda como catalogada y abre la siguiente pendiente o borrador dentro de los filtros. Exige seleccionar la parte del documento.
- Guardar borrador permite interrumpir y retomar; no marca como catalogada.
- Objetos, personas y destacados admiten términos nuevos. Los términos quedan disponibles al guardar.
- Fecha libre: `1905`, `ca. 1910`, `1900–1910`, etc. No se asignan fechas de demostración.
- Reverso/tapa/otros se pueden vincular a un frente ya guardado desde Identificación. Cada archivo conserva su descripción.
- Filtros por carpeta, estado y texto. Exportación JSON completa para respaldo e integración posterior. No publica automáticamente en el sitio demostrativo.

## Respaldo y alcance

Respaldar toda la carpeta `datos` junto con las imágenes y sus vistas. `catalogo.json` es la base; `catalogo.anterior.json` conserva solo la versión anterior, no un historial completo. Exportar periódicamente y guardar copias fechadas. No reemplazar `datos` al actualizar código.

PHP 7.4+ / 8.x y Apache; sin extensiones TIFF, Composer ni dependencias web externas. Python 3 con Pillow solo para preparar TIF. Diseñado para uso local en la computadora con XAMPP. Bloquea accesos que no sean localhost; no desplegar como panel público. No incluye autenticación, publicación, ni migración a MySQL.
