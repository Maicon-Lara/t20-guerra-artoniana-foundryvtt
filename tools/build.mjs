// Monta o módulo "guerra-artoniana" para Foundry v13 / Tormenta20 1.5.x.
// 1. lê src/<pack>/**.json (extraído do módulo original);
// 2. troca as imagens soltas pelos tokens baixados em module/assets/tokens;
// 3. compila cada pack em module/packs/<pack> e grava o module.json.
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, cpSync } from "node:fs";
import path from "node:path";
import { montarAventuras, conferirCobertura } from "./aventuras.mjs";

const ID = "guerra-artoniana";
const VERSAO = "2.4.1";
const REPO = "https://github.com/Maicon-Lara/t20-guerra-artoniana-foundryvtt";
const RAIZ = path.resolve(import.meta.dirname, "..");
const SRC = path.join(RAIZ, "src");
const TMP = path.join(RAIZ, "dist", "src");
const MOD = path.join(RAIZ, "module");
const mapa = JSON.parse(readFileSync(path.join(RAIZ, "tools", "imagens-mapa.json"), "utf8"));

const PADRAO_ATOR = "icons/svg/mystery-man.svg";
const PADRAO_ITEM = "icons/svg/item-bag.svg";
const relatorio = { trocadas: 0, padrao: new Set(), nomes: 0 };

function imagem(valor, padrao) {
	if (typeof valor !== "string" || !valor) return valor;
	const solta = !valor.includes("/") || valor.startsWith("objetos/");
	const deOutroSistema = /^systems\/(?!tormenta20\/)/.test(valor);
	if (!solta && !deOutroSistema) return valor;
	const nome = decodeURIComponent(valor.split("/").pop());
	if (solta && mapa[nome]) {
		relatorio.trocadas++;
		return `modules/${ID}/assets/tokens/${mapa[nome]}`;
	}
	relatorio.padrao.add(nome);
	return padrao;
}

function corrigir(no, padrao) {
	if (Array.isArray(no)) return no.forEach((x) => corrigir(x, padrao));
	if (!no || typeof no !== "object") return;
	const tipo = no._key?.startsWith("!actors!") && !no._key.includes(".") ? PADRAO_ATOR : padrao;
	for (const [k, v] of Object.entries(no)) {
		if ((k === "img" || k === "src") && typeof v === "string") no[k] = imagem(v, tipo);
		else if (k === "texture" && v && typeof v === "object") v.src = imagem(v.src, PADRAO_ATOR);
		else corrigir(v, k === "items" ? PADRAO_ITEM : tipo);
	}
}

function arquivos(dir) {
	return readdirSync(dir).flatMap((f) => {
		const p = path.join(dir, f);
		return statSync(p).isDirectory() ? arquivos(p) : p.endsWith(".json") ? [p] : [];
	});
}

rmSync(TMP, { recursive: true, force: true });
rmSync(path.join(MOD, "packs"), { recursive: true, force: true });

const packs = [];
const rotulos = {
	personagens: ["Personagens e Ameaças", "Actor"],
	itens: ["Itens", "Item"],
	"tabelas-de-encontros": ["Tabelas de Encontros", "RollTable"],
	macros: ["Macros", "Macro"]
};

for (const pack of readdirSync(SRC)) {
	const destino = path.join(TMP, pack);
	for (const arq of arquivos(path.join(SRC, pack))) {
		const doc = JSON.parse(readFileSync(arq, "utf8"));
		corrigir(doc, PADRAO_ITEM);
		if (typeof doc.name === "string" && / \(Copy\)/.test(doc.name)) {
			doc.name = doc.name.replaceAll(" (Copy)", "");
			relatorio.nomes++;
		}
		const rel = path.relative(path.join(SRC, pack), arq);
		mkdirSync(path.dirname(path.join(destino, rel)), { recursive: true });
		writeFileSync(path.join(destino, rel), JSON.stringify(doc, null, 2));
	}
	await compilePack(destino, path.join(MOD, "packs", pack), { log: false, recursive: true });
	const [label, type] = rotulos[pack];
	packs.push({
		name: pack,
		label,
		path: `packs/${pack}`,
		type,
		system: "tormenta20",
		ownership: { PLAYER: "OBSERVER", ASSISTANT: "OWNER" }
	});
}

// Compêndio de Aventuras (um Adventure por arco), montado a partir dos packs acima.
const aventuras = montarAventuras(TMP, ID);
const dirAventuras = path.join(TMP, "aventuras");
mkdirSync(dirAventuras, { recursive: true });
for (const a of aventuras) writeFileSync(path.join(dirAventuras, `${a._id}.json`), JSON.stringify(a, null, 2));
await compilePack(dirAventuras, path.join(MOD, "packs", "aventuras"), { log: false });
packs.unshift({
	name: "aventuras",
	label: "Aventuras (importar por arco)",
	path: "packs/aventuras",
	type: "Adventure",
	system: "tormenta20",
	ownership: { PLAYER: "NONE", ASSISTANT: "OWNER" }
});
const fora = conferirCobertura(TMP, aventuras);
if (fora.length) console.log(`fora de qualquer aventura: ${fora.join(" | ")}`);

// Scripts do módulo (painel de Batalha em Massa).
rmSync(path.join(MOD, "scripts"), { recursive: true, force: true });
cpSync(path.join(RAIZ, "scripts"), path.join(MOD, "scripts"), { recursive: true });

const manifesto = {
	id: ID,
	title: "Guerra Artoniana — NPCs e Ameaças",
	description:
		"NPCs, ameaças, itens e tabelas de encontro da campanha Jornada Heroica: Guerra Artoniana, com os tokens dos handouts. Uso pessoal da mesa.",
	version: VERSAO,
	url: REPO,
	manifest: `${REPO}/releases/latest/download/module.json`,
	download: `${REPO}/releases/download/v${VERSAO}/guerra-artoniana.zip`,
	compatibility: { minimum: "13", verified: "13" },
	relationships: {
		systems: [{ id: "tormenta20", type: "system", compatibility: { minimum: "1.5.0" } }]
	},
	esmodules: ["scripts/batalha.mjs"],
	packs,
	packFolders: [
		{
			name: "Guerra Artoniana",
			sorting: "m",
			packs: packs.map((p) => p.name)
		}
	]
};
writeFileSync(path.join(MOD, "module.json"), JSON.stringify(manifesto, null, 2));

console.log(`packs: ${packs.map((p) => p.name).join(", ")}`);
console.log(`imagens trocadas: ${relatorio.trocadas}; nomes "(Copy)" limpos: ${relatorio.nomes}`);
console.log(`sem imagem (ficaram com ícone padrão): ${[...relatorio.padrao].sort().join(" | ")}`);
