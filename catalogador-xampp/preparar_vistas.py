"""Genera vistas JPEG de los TIF sin modificar originales. Requiere Pillow."""
from pathlib import Path
import argparse
import sys
try:
    from PIL import Image, ImageOps
except ImportError:
    raise SystemExit('Falta Pillow. Instalalo con: python -m pip install Pillow')

def prepare(root):
    failed = 0
    for source in sorted(root.rglob('*')):
        if not source.is_file() or source.suffix.lower() not in ('.tif', '.tiff') or '.bixio-vistas' in source.parts:
            continue
        target = root / '.bixio-vistas' / (str(source.relative_to(root)) + '.jpg')
        if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
            continue
        tmp = target.with_suffix('.tmp')
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            with Image.open(source) as original:
                original.seek(0)
                image = ImageOps.exif_transpose(original)
                image.thumbnail((2200, 2200))
                image.convert('RGB').save(tmp, 'JPEG', quality=90)
            tmp.replace(target)
            print('OK', source.relative_to(root))
        except Exception as exc:
            failed += 1
            tmp.unlink(missing_ok=True)
            print('ERROR', source, exc)
    return failed

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('carpeta', nargs='?', help='Carpeta de TIF; sin argumento abre selector')
    args = parser.parse_args()
    folder = args.carpeta
    if not folder:
        from tkinter import Tk, filedialog
        window = Tk(); window.withdraw()
        folder = filedialog.askdirectory(title='Carpeta con los TIF de Bixio')
        window.destroy()
    if not folder:
        sys.exit(0)
    root = Path(folder).resolve()
    if not root.is_dir():
        raise SystemExit('No existe la carpeta indicada.')
    failed = prepare(root)
    print('Terminado. Errores:', failed)
    sys.exit(bool(failed))
