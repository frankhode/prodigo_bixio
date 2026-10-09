# Prodigo — Bixio · Demo

Galería fotográfica estática para GitHub Pages. No requiere backend, base de datos ni compilación.

## Publicación

Subir **el contenido de esta carpeta** a la raíz del repositorio `frankhode/prodigo_bixio`, conservando `assets/full` y `assets/thumbs`. En Settings → Pages, seleccionar **Deploy from a branch**, rama `main`, carpeta `/(root)`.

Sitio esperado: https://frankhode.github.io/prodigo_bixio/

## Archivo documental

`data.json` almacena las fotografías visibles, etiquetas, marcas, asociación con reversos y fechas simuladas. Las etiquetas son experimentales, editables y no representan una catalogación rigurosa. 1899–1930 es una cronología demostrativa derivada del orden de escaneo. Los reversos se asocian provisoriamente por secuencia y deben cotejarse individualmente.

El archivo `img102` se excluye al ser una digitalización de mayor resolución del mismo objeto que `img103`. Reversos aparecen en el visor, no en el mosaico.

## Desarrollo

Para probar localmente ejecutar `python -m http.server 8000` dentro de esta carpeta y abrir `http://localhost:8000`.
