# Guerra Artoniana — NPCs e Ameaças (Foundry v13)

Módulo de uso pessoal da mesa. Ele moderniza o módulo antigo `guerra-artoniana` (Foundry v11, Tormenta20 1.4.213) para o **Foundry v13 com o Tormenta20 1.5.x** e embute os tokens dos handouts do Drive.

Produção de fã, sem afiliação com a Jambô Editora. Para jogar é preciso o livro *Jornada Heroica: Guerra Artoniana* (Jambô) e o *Tormenta20*; o módulo traz só fichas, itens, tabelas e tokens, não a história.

## Instalação no Foundry

Em **Módulos → Instalar Módulo**, cole o manifesto:

```
https://github.com/Maicon-Lara/t20-guerra-artoniana-foundryvtt/releases/latest/download/module.json
```

No mundo, ative o módulo, abra o compêndio **Aventuras (importar por arco)**, clique no arco e em **Importar Aventura**.

## Publicar uma versão

1. Suba `VERSAO` em `tools/build.mjs` e rode `npm run build`.
2. `python -I tools/zip.py`
3. `gh release create vX.Y.Z dist/guerra-artoniana.zip module/module.json`

## Estrutura

| Caminho | O que é |
|---|---|
| `original/` | O módulo antigo, como veio no `guerra-artoniana.rar` |
| `src/<pack>/` | Os compêndios do original em JSON (`npm run unpack -- original/packs src`) |
| `tools/drive-arquivos.json` | Listagem da pasta de handouts do Drive (caminho, id, nome) |
| `tools/imagens.py` | Baixa os tokens usados para `module/assets/tokens` e grava `tools/imagens-mapa.json` |
| `tools/build.mjs` | Troca as imagens, compila os packs em `module/packs` e grava o `module.json` |
| `tools/aventuras.mjs` | Monta o compêndio **Aventuras** (tipo Adventure, um por arco, no estilo do módulo *Coração de Rubi*); o mapa arco → pastas de atores/itens/tabelas fica em `AVENTURAS` |
| `module/` | O módulo pronto (a pasta que vai para `Data/modules/guerra-artoniana`) |

## Gerar de novo

```
python -I tools/imagens.py tools/drive-arquivos.json src module/assets/tokens
python -I tools/webp.py
npm run build
```

As imagens que não existem no Drive ficam com o ícone padrão do Foundry. O build lista quais são.
O mapeamento de nomes divergentes está em `APELIDOS`, no `tools/imagens.py`.

## Sem acesso às pastas do servidor

`node tools/pacote.mjs` (depois do build) gera `dist/guerra-artoniana-dados.json`, com os documentos e os tokens em base64.
A macro `tools/macro-importar.js`, colada numa Macro de Script e executada pelo Mestre, lê esse arquivo,
envia os tokens pelo navegador para `guerra-artoniana/tokens` e cria os compêndios do mundo (`world.ga-*`).

## Batalha em Massa

A macro **É Guerra!** abre o painel de batalha (`scripts/batalha.mjs`), com as regras do Apêndice B:
escolha da batalha (Karst, Svalas, Norm, Hippiontar, Zakharin, Iörvaen ×2, Cerco de Valkaria ou personalizada),
posição dos heróis, rolagem de evento e inimigo, bônus por dano/perícia/estandarte, teste dos generais,
pontos de vitória, fuga, destruição e baixas. Os dados de cada batalha ficam em `scripts/batalhas-dados.mjs`.
Regra opcional **Lobos Solitários**: cada personagem de jogador vira uma frente, com posição, evento e bônus próprios (dá para alternar no meio da batalha).
O estado fica salvo no mundo; "Desfazer" volta a última ação do painel.

## Parceiros

A macro **Parceiros** abre o painel de parceiros (`scripts/parceiros.mjs`, dados em `scripts/parceiros-dados.mjs`).
Ele lista os 39 parceiros do livro por arco, com recrutamento, evolução e página. Para cada um, escolha o nível (ou a fase,
como Ayleth na Aventura 5/6/16) e o herói, e clique em **Dar ao herói**. O poder "Parceiro: Nome" vai para a ficha:
bônus fixos (perícias, Defesa, ataque, deslocamento, atributo) como efeito ativo, e bônus de uso ("uma vez por rodada
+1d6 de dano") como efeito "ao usar", que o jogador marca na janela de rolagem. Esses efeitos de uso são copiados
do compêndio `tormenta20.parceiros` do sistema. **Passar / atualizar** move o parceiro de herói (ou muda o nível).
O botão de dispensar tira o parceiro da ficha. Os ajudantes têm as perícias marcáveis no painel.
