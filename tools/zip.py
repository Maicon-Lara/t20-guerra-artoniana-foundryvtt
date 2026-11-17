# Gera dist/guerra-artoniana.zip a partir de module/ (module.json na raiz do zip).
# Uso: python -I tools/zip.py
# Não usar "tar -a": o tar do Git Bash é o GNU tar e grava um .tar com nome de .zip.
import pathlib, zipfile

raiz = pathlib.Path(__file__).resolve().parent.parent
mod = raiz / "module"
saida = raiz / "dist" / "guerra-artoniana.zip"
saida.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(saida, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for p in sorted(mod.rglob("*")):
        if p.is_file() and p.name != "LOCK":
            z.write(p, p.relative_to(mod).as_posix())
with zipfile.ZipFile(saida) as z:
    assert z.testzip() is None and "module.json" in z.namelist()
    print(f"{saida}: {len(z.namelist())} arquivos, {saida.stat().st_size / 1048576:.1f} MB")
