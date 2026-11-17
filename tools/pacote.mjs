// Gera um pacote de importação para quem não tem acesso às pastas do Foundry.
// Saída: dist/guerra-artoniana-dados.json, com os documentos já tratados pelo build
// e os tokens embutidos em base64. A macro tools/macro-importar.js lê esse arquivo,
// sobe os tokens pelo navegador e cria compêndios do mundo.
// Rode depois do "npm run build".
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const TMP = path.join(RAIZ, "dist", "src");
const TOKENS = path.join(RAIZ, "module", "assets", "tokens");
const PREFIXO = "modules/guerra-artoniana/assets/tokens/";

const rotulos = {
	aventuras: ["Guerra Artoniana — Aventuras", "Adventure"],
	personagens: ["Guerra Artoniana — Personagens e Ameaças", "Actor"],
	itens: ["Guerra Artoniana — Itens", "Item"],
	"tabelas-de-encontros": ["Guerra Artoniana — Tabelas de Encontros", "RollTable"],
	macros: ["Guerra Artoniana — Macros", "Macro"]
};

function arquivos(dir) {
	return readdirSync(dir).flatMap((f) => {
		const p = path.join(dir, f);
		return statSync(p).isDirectory() ? arquivos(p) : p.endsWith(".json") ? [p] : [];
	});
}

function semChave(no) {
	if (Array.isArray(no)) return no.forEach(semChave);
	if (!no || typeof no !== "object") return;
	delete no._key;
	Object.values(no).forEach(semChave);
}

const usadas = new Set();
const packs = [];
for (const nome of readdirSync(TMP)) {
	const [label, type] = rotulos[nome];
	const pastas = [];
	const docs = [];
	for (const arq of arquivos(path.join(TMP, nome))) {
		let texto = readFileSync(arq, "utf8").replaceAll("Compendium.guerra-artoniana.", "Compendium.world.ga-");
		for (const m of texto.matchAll(/modules\/guerra-artoniana\/assets\/tokens\/([^"]+)/g)) usadas.add(m[1]);
		texto = texto.replaceAll(PREFIXO, "@@TOKENS@@/");
		const doc = JSON.parse(texto);
		const pasta = doc._key?.startsWith("!folders!");
		semChave(doc);
		(pasta ? pastas : docs).push(doc);
	}
	packs.push({ nome: `ga-${nome}`, label, type, pastas, docs });
}

const tokens = {};
for (const f of [...usadas].sort()) tokens[f] = readFileSync(path.join(TOKENS, f)).toString("base64");

const saida = path.join(RAIZ, "dist", "guerra-artoniana-dados.json");
writeFileSync(saida, JSON.stringify({ versao: 1, packs, tokens }));
console.log(packs.map((p) => `${p.nome}: ${p.docs.length} docs, ${p.pastas.length} pastas`).join("\n"));
console.log(`tokens: ${Object.keys(tokens).length}; arquivo: ${(statSync(saida).size / 1048576).toFixed(1)} MB`);
