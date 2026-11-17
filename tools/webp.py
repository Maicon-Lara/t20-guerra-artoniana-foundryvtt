# Converte os tokens de module/assets/tokens para WebP (qualidade 85) e atualiza tools/imagens-mapa.json.
# Rode depois do imagens.py e antes do "npm run build". Os PNG originais são apagados.
# Motivo: com PNG o zip passava de 59 MB e a instalação pelo manifesto falhava (FILE_ENDED).
import json, pathlib
from PIL import Image

raiz = pathlib.Path(__file__).resolve().parent.parent
tokens = raiz / "module" / "assets" / "tokens"
mapa_arq = raiz / "tools" / "imagens-mapa.json"

antes = depois = 0
for f in sorted(tokens.glob("*.png")) + sorted(tokens.glob("*.jpg")) + sorted(tokens.glob("*.jpeg")):
    novo = f.with_suffix(".webp")
    antes += f.stat().st_size
    Image.open(f).save(novo, "WEBP", quality=85, method=6)
    depois += novo.stat().st_size
    f.unlink()

mapa = json.loads(mapa_arq.read_text(encoding="utf8"))
for k, v in mapa.items():
    if v: mapa[k] = pathlib.PurePosixPath(v).with_suffix(".webp").as_posix()
faltando = [v for v in mapa.values() if v and not (tokens / v).exists()]
mapa_arq.write_text(json.dumps(mapa, ensure_ascii=False, indent=2), encoding="utf8")
print(f"convertidos: {antes / 1e6:.1f} MB -> {depois / 1e6:.1f} MB; sem arquivo no mapa: {faltando or 'nenhum'}")
