"""Resolve as imagens dos atores contra a pasta de handouts do Drive e baixa os tokens.

Uso: python -I tools/imagens.py <files.json do Drive> <src/personagens> <pasta de saída dos tokens>
Gera tools/imagens-mapa.json: nome original (sem %xx) -> nome do arquivo local (ou null).
"""
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

drive_list, src, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)


def norm(s):
    s = unicodedata.normalize('NFKD', urllib.parse.unquote(s)).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'\.(png|jpe?g|webp)$', '', s)
    return re.sub(r'[^a-z0-9]+', '', s)


def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    base, ext = os.path.splitext(s)
    return re.sub(r'[^A-Za-z0-9]+', '-', base).strip('-').lower() + ext.lower()


drive = {}
for path, fid, tip in json.load(open(drive_list, encoding='utf-8')):
    name = tip.rsplit(' ', 1)[0]
    if not re.search(r'\.(png|jpe?g|webp)$', name, re.I):
        continue
    # preferir pastas de ameaças/NPC a mapas, se houver nomes repetidos
    k = norm(name)
    if k not in drive or 'MAPA' in drive[k][0].upper():
        drive[k] = (path, fid, name)

wanted = set()
for root, _, files in os.walk(src):
    for f in files:
        if f.endswith('.json'):
            raw = open(os.path.join(root, f), encoding='utf-8').read()
            for v in re.findall(r'"(?:img|src)": "([^"]+)"', raw):
                if '/' not in v or v.startswith('objetos/'):
                    wanted.add(urllib.parse.unquote(v).split('/')[-1])

# nomes que o módulo antigo usava e que no Drive estão com outro nome
APELIDOS = {
    'Coronel-Reggar-Wortric.png': 'Token_G_-_Coronel-Reggar-Wortric.png',
    'Token_M_-_Coronel-Reggar-Wortric-2.png': 'Token_G_-_Coronel-Reggar-Wortric-2.png',
    'Lady_Alyssa.png': 'Token_M_-_Alyssa.png',
    'Malfeito.png': 'Token_M_-_Defeituoso.png',
    'Token - Sacerdote Finntroll.png': 'Token - Arcanista Finntroll.png',
    'Token_C_-_Colosso-Supremo.png': 'Token_C_-_Colosso-Supremo-2.png',
    'Token_G_-_Gigante-Bicéfalo.png': 'Token_E_-_Gigante-Bicéfalo.png',
    'Token_M_-_Sir-Thuranald.png': 'Token_G_-_Sir-Thuranald.png',
    'Token-G---Tropa-Yudennach-2.png': 'Token-G---Tropa-Yudennach.png',
    'Token_M_-_KROZZYN-2.png': 'Token_M_-_KROZZYN.png',
}

APELIDOS_N = {norm(k): v for k, v in APELIDOS.items()}

mapa = {}
for img in sorted(wanted):
    hit = drive.get(norm(APELIDOS_N.get(norm(img), img)))
    if not hit:
        mapa[img] = None
        continue
    path, fid, name = hit
    local = slug(name)
    dest = os.path.join(out, local)
    if not os.path.exists(dest):
        url = f'https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t'
        data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})).read()
        if not data[:8].startswith((b'\x89PNG', b'\xff\xd8', b'RIFF')):
            mapa[img] = None
            print('não é imagem:', name)
            continue
        open(dest, 'wb').write(data)
    mapa[img] = local

json.dump(mapa, open(os.path.join(os.path.dirname(__file__), 'imagens-mapa.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
ok = sum(1 for v in mapa.values() if v)
print(f'{ok}/{len(mapa)} imagens resolvidas')
print('faltando:', [k for k, v in mapa.items() if not v])
