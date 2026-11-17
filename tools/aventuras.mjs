// Compêndio do tipo Adventure, no formato do módulo "Aventura - Coração de Rubi":
// um documento Adventure por arco, com capa, legenda, descrição e os atores, itens,
// tabelas e macros já organizados em pastas. No Foundry: abrir o compêndio, clicar na
// aventura e em "Importar Aventura"; tudo vai para o mundo nas pastas definidas aqui.
//
// Os documentos vêm de dist/src (já tratados pelo build: imagens trocadas etc.).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

// Onde cada coisa entra. Atores: pasta-raiz do arco no compêndio "personagens".
// Itens e tabelas: pastas (ou documentos soltos) dos compêndios "itens" e "tabelas-de-encontros".
export const AVENTURAS = [
	{
		nome: "Guerra Artoniana — Arco 1",
		legenda: "Arco 1: aventuras 1 a 7 e os NPCs de Karst.",
		capa: "token-g-coronel-reggar-wortric.webp",
		atores: "dyhAvmSziVnbH7GW",
		itens: ["FwXbeT79yKEBTcPG", "NmHxY7V9FvrNkimP", "kJOB7pr21cVwo74x", "kAwvIXe2kPRtXFix"],
		tabelas: ["uWSW83V11BXOyheu"]
	},
	{
		nome: "Guerra Artoniana — Arco 2",
		legenda: "Arco 2: aventuras 11 a 16, com as batalhas de Norm, Hippiontar, Zakharin e do Iörvaen.",
		capa: "token-m-rainha-imperatriz-shivara.webp",
		atores: "uEuy5vhWkyWomx6B",
		itens: ["SxwjKt8w6OQ14TrK", "ZJl6C9gy6Oll6zsh", "QJO8B2UlyM80vMWM", "vSKMKnHxbR1JziMX", "7znCNJ3hNbcngkUV"],
		tabelas: ["6EFhHD5mKH1Knj2D", "kYGxwkOTer0tIyt3"]
	},
	{
		nome: "Guerra Artoniana — Arco 3",
		legenda: "Arco 3: aventuras 17 a 20, até o Cerco de Valkaria.",
		capa: "token-m-hermann-von-krauser.webp",
		atores: "Gto91ZOQ1piGJGCM",
		itens: ["6lMqL05NKGwrSi7q", "eMw24vyz4uVbE4Q6"],
		tabelas: []
	},
	{
		nome: "Guerra Artoniana — Interlúdio",
		legenda: "Interlúdio: Artefato de Cross, O Retorno dos Mortos e Piratas de Khubar.",
		capa: "token-g-bando-pirata.webp",
		atores: "hT4Wy308vLfW5A2G",
		itens: ["FWzb81B6H4mbYOXU"],
		tabelas: []
	},
	{
		nome: "Guerra Artoniana — Batalhas em Massa e Extras",
		legenda: "Tabelas de eventos de batalha, a macro \"É Guerra!\" e itens usados em vários arcos.",
		capaFixa: "icons/environment/people/infantry-army.webp",
		atores: null,
		itens: ["rwWEolS3jX8b9wu9", "3FQoVWxdKvK6kNUq"],
		tabelas: ["2INq4Ge5gYyS4dJ9", "XCNldSHNt8P8CO9O", "l3sUAI3lTomjkKag", "bdOJOfultA9Lhwqy", "uWedfkqBtcbAM0Ga"],
		macros: ["sqQaXE7GZfXgKRs3"],
		aviso: "A macro \"É Guerra!\" abre o painel de Batalha em Massa (Apêndice B): escolha a batalha, mova os heróis entre as posições, role eventos e inimigos e os testes dos generais, com placar de pontos de vitória."
	}
];

const COR = "#7a1f1f";

function arquivos(dir) {
	return readdirSync(dir).flatMap((f) => {
		const p = path.join(dir, f);
		return statSync(p).isDirectory() ? arquivos(p) : p.endsWith(".json") ? [p] : [];
	});
}

// Id de 16 caracteres estável (o mesmo a cada build), para as pastas e aventuras novas.
function idFixo(texto) {
	const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	return [...createHash("sha256").update(`guerra-artoniana:${texto}`).digest()]
		.slice(0, 16)
		.map((b) => abc[b % abc.length])
		.join("");
}

function semChave(no) {
	if (Array.isArray(no)) return no.forEach(semChave);
	if (!no || typeof no !== "object") return;
	delete no._key;
	Object.values(no).forEach(semChave);
}

function carregar(dir) {
	const pastas = new Map();
	const docs = new Map();
	for (const arq of arquivos(dir)) {
		const doc = JSON.parse(readFileSync(arq, "utf8"));
		(doc._key?.startsWith("!folders!") ? pastas : docs).set(doc._id, doc);
	}
	return { pastas, docs };
}

// Pasta (ou documento solto) e tudo que está dentro dela, em qualquer nível.
function coletar({ pastas, docs }, ids) {
	const dentro = (folder, alvo) => {
		for (let f = folder; f; f = pastas.get(f)?.folder) if (f === alvo) return true;
		return false;
	};
	const fs = [];
	const ds = [];
	for (const id of ids) {
		if (pastas.has(id)) {
			fs.push(...[...pastas.values()].filter((f) => dentro(f._id, id)));
			ds.push(...[...docs.values()].filter((d) => dentro(d.folder, id)));
		} else if (docs.has(id)) ds.push(docs.get(id));
		else throw new Error(`aventuras.mjs: id ${id} não encontrado`);
	}
	return { pastas: fs, docs: ds };
}

function clonar(x) {
	const c = structuredClone(x);
	semChave(c);
	return c;
}

// Põe as pastas e documentos sob uma pasta-raiz nova do tipo indicado.
function agrupar(colhido, tipo, nome, sort) {
	if (!colhido.docs.length) return { pastas: [], docs: [] };
	const raiz = { _id: idFixo(`${tipo}:${nome}`), name: nome, type: tipo, folder: null, sorting: "a", sort, color: COR, description: "", flags: {} };
	const ids = new Set(colhido.pastas.map((f) => f._id));
	const pastas = colhido.pastas.map((f) => {
		const c = clonar(f);
		if (!ids.has(c.folder)) c.folder = raiz._id;
		return c;
	});
	const docs = colhido.docs.map((d) => {
		const c = clonar(d);
		if (!ids.has(c.folder)) c.folder = raiz._id;
		return c;
	});
	return { pastas: [raiz, ...pastas], docs };
}

// Documentos dos packs que não entraram em nenhuma aventura (para o relatório do build).
export function conferirCobertura(TMP, aventuras) {
	const usados = new Set(aventuras.flatMap((a) => [...a.actors, ...a.items, ...a.tables, ...a.macros].map((d) => d._id)));
	const fora = [];
	for (const pack of ["personagens", "itens", "tabelas-de-encontros", "macros"]) {
		for (const d of carregar(path.join(TMP, pack)).docs.values()) if (!usados.has(d._id)) fora.push(`${pack}/${d.name}`);
	}
	return fora;
}

const lista = (titulo, nomes) =>
	nomes.length ? `<h3>${titulo}</h3><ul>${nomes.map((n) => `<li>${n}</li>`).join("")}</ul>` : "";

export function montarAventuras(TMP, ID) {
	const fontes = {
		personagens: carregar(path.join(TMP, "personagens")),
		itens: carregar(path.join(TMP, "itens")),
		tabelas: carregar(path.join(TMP, "tabelas-de-encontros")),
		macros: carregar(path.join(TMP, "macros"))
	};
	const saida = [];
	AVENTURAS.forEach((a, i) => {
		const curto = a.nome.replace("Guerra Artoniana — ", "GA — ");
		let atores = { pastas: [], docs: [] };
		if (a.atores) {
			const c = coletar(fontes.personagens, [a.atores]);
			atores = { pastas: c.pastas.map(clonar), docs: c.docs.map(clonar) };
			const raiz = atores.pastas.find((f) => f._id === a.atores);
			raiz.name = curto;
			raiz.color = COR;
		}
		const itens = agrupar(coletar(fontes.itens, a.itens), "Item", `${curto} (Itens)`, i);
		const tabelas = agrupar(coletar(fontes.tabelas, a.tabelas), "RollTable", `${curto} (Tabelas)`, i);
		const macros = agrupar(coletar(fontes.macros, a.macros ?? []), "Macro", `${curto} (Macros)`, i);

		// Capítulos = subpastas diretas da raiz do arco.
		const capitulos = atores.pastas
			.filter((f) => f.folder === a.atores)
			.sort((x, y) => x.name.localeCompare(y.name, "pt-BR", { numeric: true }))
			.map((f) => f.name);
		const descricao = [
			`<p>${a.legenda}</p>`,
			lista("Capítulos", capitulos),
			`<h3>Conteúdo</h3><ul>`,
			atores.docs.length ? `<li>${atores.docs.length} personagens e ameaças</li>` : "",
			itens.docs.length ? `<li>${itens.docs.length} ${itens.docs.length > 1 ? "itens" : "item"}: ${itens.docs.map((d) => d.name).join(", ")}</li>` : "",
			tabelas.docs.length ? `<li>${tabelas.docs.length} ${tabelas.docs.length > 1 ? "tabelas" : "tabela"}: ${tabelas.docs.map((d) => d.name).join(", ")}</li>` : "",
			macros.docs.length ? `<li>${macros.docs.length} macro: ${macros.docs.map((d) => d.name).join(", ")}</li>` : "",
			`</ul>`,
			a.aviso ? `<p>${a.aviso}</p>` : "",
			`<p><i>Conteúdo de apoio para a mesa. A história está no livro <b>Jornada Heroica: Guerra Artoniana</b> (Jambô).</i></p>`
		].join("");

		const _id = idFixo(`adventure:${a.nome}`);
		saida.push({
			_id,
			_key: `!adventures!${_id}`,
			name: a.nome,
			img: a.capaFixa ?? `modules/${ID}/assets/tokens/${a.capa}`,
			caption: `<p>${a.legenda}</p>`,
			description: descricao,
			sort: (i + 1) * 100000,
			folder: null,
			folders: [...atores.pastas, ...itens.pastas, ...tabelas.pastas, ...macros.pastas],
			actors: atores.docs,
			items: itens.docs,
			tables: tabelas.docs,
			macros: macros.docs,
			scenes: [],
			journal: [],
			playlists: [],
			cards: [],
			combats: [],
			flags: {}
		});
	});
	return saida;
}
