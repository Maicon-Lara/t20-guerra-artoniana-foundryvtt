// Painel de Parceiros (Tormenta20 JdA p. 260) para os NPCs de Guerra Artoniana — Foundry v13.
// Abra com a macro "Parceiros" ou: game.modules.get("guerra-artoniana").api.abrirParceiros()
// O parceiro vira um poder "Parceiro: Nome" na ficha do herói, com os bônus do nível escolhido.
// Bônus fixos (perícias, Defesa, ataque, deslocamento) entram como efeito ativo; bônus de uso
// ("uma vez por rodada +1d6 de dano") entram como efeito "ao usar", que o jogador marca na rolagem.
import { NIVEIS, PARCEIROS, PERICIAS, TIPOS } from "./parceiros-dados.mjs";

const ID = "guerra-artoniana";
const CHAVE = "parceiros";
const ApplicationV2 = foundry.applications.api.ApplicationV2;
const ICONE = "systems/tormenta20/icons/itens/gerais/parceiros.webp";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const rotuloNivel = (n, p) => p?.rotulos?.[n] ?? ({ iniciante: "Iniciante", veterano: "Veterano", mestre: "Mestre" })[n] ?? n;
const temAjudante = (p) => (p.tipos ?? []).includes("ajudante");

/* ---------------- escolhas salvas (nível e perícias por parceiro) ---------------- */

function escolhas() {
	return foundry.utils.deepClone(game.settings.get(ID, CHAVE) ?? {});
}

function escolhaDe(p) {
	const e = escolhas()[p.id] ?? {};
	return {
		nivel: NIVEIS.includes(e.nivel) ? e.nivel : p.nivel,
		pericias: Array.isArray(e.pericias) ? e.pericias : [...(p.pericias ?? [])]
	};
}

async function salvarEscolha(id, dados) {
	const todas = escolhas();
	todas[id] = { ...(todas[id] ?? {}), ...dados };
	await game.settings.set(ID, CHAVE, todas);
}

// Quantas perícias o ajudante cobre (o especial pode fixar o nível do ajudante).
function maxPericias(p, nivel) {
	const n = especialNoNivel(p, nivel)?.tipos?.find(([t]) => t === "ajudante")?.[1] ?? nivel;
	return n === "iniciante" ? 2 : 3;
}

/* ---------------- quem está com quem ---------------- */

function personagens() {
	return game.actors.filter((a) => a.type === "character");
}

function herois() {
	let atores = game.users.filter((u) => !u.isGM && u.character).map((u) => u.character);
	if (!atores.length) atores = game.actors.filter((a) => a.type === "character" && a.hasPlayerOwner);
	if (!atores.length) atores = personagens();
	return [...new Map(atores.map((a) => [a.id, a])).values()];
}

// Itens "Parceiro: X" já dados (em qualquer ator do mundo).
function acompanhando(p) {
	const lista = [];
	for (const ator of game.actors) {
		for (const item of ator.items) if (item.getFlag(ID, "parceiro") === p.id) lista.push({ ator, item });
	}
	return lista;
}

/* ---------------- efeitos ---------------- */

let modelos = null;

// Efeitos "ao usar" do compêndio de parceiros do sistema, usados como molde (assim o formato
// segue a versão do Tormenta20 instalada).
async function carregarModelos() {
	if (modelos) return modelos;
	modelos = {};
	const pack = game.packs.get("tormenta20.parceiros");
	if (!pack) return modelos;
	try {
		for (const item of await pack.getDocuments()) {
			modelos.descricoes ??= {};
			modelos.descricoes[norm(item.name)] = item.system?.description?.value ?? "";
			for (const ef of item.effects) {
				if (!ehUso(ef)) continue;
				for (const t of tiposUso(ef)) modelos[t] ??= ef;
			}
		}
	} catch (err) {
		console.warn(`${ID} | não consegui ler tormenta20.parceiros`, err);
	}
	return modelos;
}

function ehUso(ef) {
	return !!(ef.system?.onuse ?? ef.flags?.tormenta20?.onuse);
}

function tiposUso(ef) {
	const t = ef.system?.abilityUse?.types;
	if (t?.size || t?.length) return [...t];
	const f = ef.flags?.tormenta20 ?? {};
	return ["self", "attack", "skill", "spell", "power", "ability", "equipment", "consumable"].filter((k) => f[k]);
}

function mudancas(lista) {
	return lista.map(([key, value, mode = 2]) => ({ key, mode, value: String(value), priority: null }));
}

function efeitoFixo(nome, img, lista) {
	return { name: nome, img, transfer: true, disabled: false, changes: mudancas(lista) };
}

// uso: { tipo: "attack" | "skill" | "spell", mudancas: [[chave, valor]], custo }
function efeitoUso(nome, uso) {
	const modelo = modelos?.[uso.tipo];
	if (!modelo) return null;
	const o = modelo.toObject();
	delete o._id;
	delete o._stats;
	o.name = nome;
	o.disabled = false;
	o.origin = null;
	const novas = (uso.mudancas ?? []).map(([key, value]) => ({ key, value }));
	if (Array.isArray(o.system?.changes)) {
		const base = o.system.changes[0] ?? { type: "add", priority: 0, phase: "initial" };
		o.system.changes = novas.map((c) => ({ ...base, ...c }));
	} else {
		const base = o.changes?.[0] ?? { mode: 2, priority: 0 };
		o.changes = novas.map((c) => ({ ...base, ...c, value: String(c.value) }));
	}
	const custo = uso.custo ?? null;
	if (o.system?.abilityUse) {
		o.system.abilityUse.custo = custo;
		o.system.abilityUse.automatic = false;
	}
	if (o.flags?.tormenta20 && "custo" in o.flags.tormenta20) o.flags.tormenta20.custo = String(custo ?? 0);
	return o;
}

// Junta os benefícios dos tipos do parceiro e os especiais dele no nível escolhido.
function beneficios(p, nivel, pericias) {
	const fixos = [];
	const usos = [];
	const textos = [];
	const esp0 = especialNoNivel(p, nivel);
	// Tipos aplicados: os do especial (cada um com seu nível) ou os do parceiro no nível escolhido.
	const aplicados = esp0?.tipos ?? (esp0?.substitui ? [] : (p.tipos ?? []).map((t) => [t, nivel]));
	for (const [t, n] of aplicados) {
		const tipo = TIPOS[t];
		if (!tipo) continue;
		const b = tipo.nivel?.(n, { pericias }) ?? {};
		if (b.fixos?.length) fixos.push(...b.fixos);
		if (b.usos?.length) usos.push(...b.usos.map((u) => ({ ...u, nome: u.nome ?? `${p.nome} (${tipo.nome})` })));
	}
	const esp = esp0;
	if (esp) {
		if (esp.fixos?.length) fixos.push(...esp.fixos);
		if (esp.usos?.length) usos.push(...esp.usos.map((u) => ({ ...u, nome: u.nome ?? p.nome })));
		if (esp.texto) textos.push(esp.texto);
	}
	return { fixos, usos, textos };
}

// Especial do nível pedido; sem ele, o do maior nível abaixo.
function especialNoNivel(p, nivel) {
	if (!p.especial) return null;
	const ate = NIVEIS.slice(0, NIVEIS.indexOf(nivel) + 1).reverse();
	for (const n of ate) if (p.especial[n]) return p.especial[n];
	return p.especial.todos ?? null;
}

function descricao(p, nivel, b, pericias) {
	const esp = especialNoNivel(p, nivel);
	const tipos = esp?.tipos
		? esp.tipos.map(([t, n]) => `${TIPOS[t]?.nome ?? t} ${rotuloNivel(n).toLowerCase()}`).join(" e ")
		: `${(p.tipos ?? []).map((t) => TIPOS[t]?.nome ?? t).join(" e ") || "especial"} ${rotuloNivel(nivel).toLowerCase()}`;
	const partes = [`<p><b>${esc(p.nome)}</b> — parceiro ${esc(tipos)}${p.rotulos?.[nivel] ? ` (${esc(p.rotulos[nivel])})` : ""}${p.tamanho ? `, ${esc(p.tamanho)}` : ""}.</p>`];
	for (const t of b.textos) partes.push(`<p>${t}</p>`);
	if (temAjudante(p) && pericias.length)
		partes.push(`<p>Perícias: ${pericias.map((x) => esc(PERICIAS[x] ?? x)).join(", ")}.</p>`);
	if (p.notas) partes.push(`<p><i>${p.notas}</i></p>`);
	if (p.evolucao) partes.push(`<p><small>Evolução: ${p.evolucao}</small></p>`);
	for (const t of p.tipos ?? []) {
		const tipo = TIPOS[t];
		if (!tipo) continue;
		const doSistema = modelos?.descricoes?.[norm(tipo.nomeSistema ?? tipo.nome)];
		partes.push(`<details><summary>${esc(tipo.nome)} (Tormenta20, p. 260)</summary>${doSistema || `<p>${tipo.texto}</p>`}</details>`);
	}
	partes.push(
		"<p><small>Cada parceiro ajuda apenas um personagem por vez. No início do seu turno, você pode gastar uma ação de movimento para passar o parceiro para outro personagem em alcance curto até o fim da cena.</small></p>"
	);
	if (p.pagina) partes.push(`<p><small>Guerra Artoniana, p. ${p.pagina}.</small></p>`);
	return partes.join("");
}

async function imagemDe(p) {
	if (!p.ator) return ICONE;
	const pack = game.packs.get(`${ID}.personagens`);
	return pack?.index.get(p.ator)?.img ?? ICONE;
}

async function montarItem(p, nivel, pericias) {
	await carregarModelos();
	const b = beneficios(p, nivel, pericias);
	const img = await imagemDe(p);
	const effects = [];
	if (b.fixos.length) effects.push(efeitoFixo(`${p.nome} (${rotuloNivel(nivel, p)})`, img, b.fixos));
	const semModelo = [];
	for (const u of b.usos) {
		const ef = efeitoUso(u.nome, u);
		if (ef) effects.push(ef);
		else semModelo.push(u.nome);
	}
	if (semModelo.length)
		ui.notifications.warn(`Compêndio de parceiros do Tormenta20 não encontrado: os bônus de uso de ${p.nome} ficaram só na descrição.`);
	return {
		name: `Parceiro: ${p.nome}`,
		type: "poder",
		img,
		system: { description: { value: descricao(p, nivel, b, pericias) } },
		effects,
		flags: { [ID]: { parceiro: p.id, nivel } }
	};
}

/* ---------------- ações ---------------- */

async function darParceiro(p, heroi, nivel, pericias) {
	const antes = acompanhando(p);
	for (const { ator, item } of antes) await ator.deleteEmbeddedDocuments("Item", [item.id]);
	if (!heroi) {
		if (antes.length) await avisar(`<p><b>${esc(p.nome)}</b> deixa o grupo de ${esc(antes.map((x) => x.ator.name).join(", "))}.</p>`);
		return;
	}
	await heroi.createEmbeddedDocuments("Item", [await montarItem(p, nivel, pericias)]);
	const de = antes.filter((x) => x.ator.id !== heroi.id).map((x) => x.ator.name);
	await avisar(
		`<p><b>${esc(p.nome)}</b> ${de.length ? `passa de ${esc(de.join(", "))} para` : "agora acompanha"} <b>${esc(heroi.name)}</b> — ${esc(p.rotulos?.[nivel] ?? `parceiro ${rotuloNivel(nivel).toLowerCase()}`)}.</p>`
	);
}

async function avisar(conteudo) {
	await ChatMessage.create({ speaker: { alias: "Parceiros" }, content: `<div class="ga-parceiros-chat">${conteudo}</div>` });
}

/* ---------------- painel ---------------- */

class PainelParceiros extends ApplicationV2 {
	static DEFAULT_OPTIONS = {
		id: "ga-parceiros",
		classes: ["ga-parceiros"],
		window: { title: "Parceiros", icon: "fa-solid fa-people-group", resizable: true },
		position: { width: 720, height: 680 },
		actions: {
			aplicar: PainelParceiros.#aplicar,
			dispensar: PainelParceiros.#dispensar,
			ficha: PainelParceiros.#ficha,
			atualizarTodos: PainelParceiros.#atualizarTodos
		}
	};

	filtro = { texto: "", soAtivos: false };

	async _renderHTML() {
		const lista = herois();
		const outros = personagens().filter((a) => !lista.includes(a));
		const opcoesHerois = (sel) =>
			`<option value="">— ninguém —</option>${[...lista, ...outros]
				.map((a) => `<option value="${a.id}" ${a.id === sel ? "selected" : ""}>${esc(a.name)}</option>`)
				.join("")}`;
		const grupos = new Map();
		const busca = norm(this.filtro.texto);
		for (const p of PARCEIROS) {
			const com = acompanhando(p);
			if (this.filtro.soAtivos && !com.length) continue;
			if (busca && !norm(`${p.nome} ${p.tipos?.join(" ")} ${p.aventura}`).includes(busca)) continue;
			if (!grupos.has(p.arco)) grupos.set(p.arco, []);
			grupos.get(p.arco).push(this.#htmlParceiro(p, com, opcoesHerois));
		}
		const corpo = [...grupos].map(([arco, linhas]) => `<h3>${esc(arco)}</h3>${linhas.join("")}`).join("") || "<p>Nenhum parceiro.</p>";
		return `<style>
			.ga-parceiros .window-content{padding:8px;gap:6px;overflow-y:auto;display:block}
			.ga-parceiros h3{margin:10px 0 4px;border-bottom:1px solid var(--color-border, #7a7971)}
			.ga-parceiros .parceiro{display:grid;grid-template-columns:40px 1fr;gap:6px;padding:4px 0;border-bottom:1px dashed var(--color-border, #7a7971)}
			.ga-parceiros .parceiro img{width:40px;height:40px;border:0;object-fit:cover;cursor:pointer}
			.ga-parceiros .linha{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
			.ga-parceiros .linha select{width:auto;flex:0 1 auto}
			.ga-parceiros small, .ga-parceiros .nota{opacity:.85}
			.ga-parceiros .com{font-weight:bold;color:var(--color-level-success, #18520b)}
			.ga-parceiros .pericias{display:flex;flex-wrap:wrap;gap:2px 8px;font-size:.9em}
			.ga-parceiros .topo{position:sticky;top:-8px;background:var(--color-bg, inherit);z-index:1;padding:4px 0}
		</style>
		<div class="topo linha">
			<input type="search" placeholder="Buscar parceiro, tipo ou aventura" data-filtro="texto" value="${esc(this.filtro.texto)}" style="flex:1">
			<label><input type="checkbox" data-filtro="soAtivos" ${this.filtro.soAtivos ? "checked" : ""}> só os que estão com alguém</label>
			<button type="button" data-action="atualizarTodos" title="Recria os poderes já dados (após mudar nível ou atualizar o módulo)"><i class="fa-solid fa-rotate"></i></button>
		</div>
		${corpo}`;
	}

	#htmlParceiro(p, com, opcoesHerois) {
		const e = escolhaDe(p);
		const atual = com[0];
		const tipos = (p.tipos ?? []).map((t) => TIPOS[t]?.nome ?? t).join(" + ") || "especial";
		const ajudante = temAjudante(p);
		const img = p.ator ? game.packs.get(`${ID}.personagens`)?.index.get(p.ator)?.img : null;
		return `<div class="parceiro" data-parceiro="${p.id}">
			<img src="${esc(img || ICONE)}" ${p.ator ? `data-action="ficha" data-parceiro="${p.id}" title="Abrir a ficha"` : ""}>
			<div>
				<div class="linha" style="justify-content:space-between">
					<span><b>${esc(p.nome)}</b> <small>${esc(tipos)} · ${esc(p.aventura ?? "")}${p.pagina ? ` · p. ${p.pagina}` : ""}</small></span>
					${atual ? `<span class="com"><i class="fa-solid fa-user-check"></i> com ${esc(com.map((x) => x.ator.name).join(", "))} (${esc(rotuloNivel(atual.item.getFlag(ID, "nivel"), p).toLowerCase())})</span>` : ""}
				</div>
				${p.resumo ? `<div class="nota"><small>${p.resumo}</small></div>` : ""}
				${p.evolucao ? `<div class="nota"><small><i class="fa-solid fa-arrow-trend-up"></i> ${p.evolucao}</small></div>` : ""}
				${ajudante ? `<div class="pericias">${this.#htmlPericias(p, e)}</div>` : ""}
				<div class="linha">
					<select data-campo="nivel" data-parceiro="${p.id}">${NIVEIS.map((n) => `<option value="${n}" ${n === e.nivel ? "selected" : ""}>${esc(rotuloNivel(n, p))}</option>`).join("")}</select>
					<select data-heroi="${p.id}">${opcoesHerois(atual?.ator.id)}</select>
					<button type="button" data-action="aplicar" data-parceiro="${p.id}"><i class="fa-solid fa-handshake"></i> ${atual ? "Passar / atualizar" : "Dar ao herói"}</button>
					${atual ? `<button type="button" data-action="dispensar" data-parceiro="${p.id}" title="Tirar o parceiro do herói"><i class="fa-solid fa-user-minus"></i></button>` : ""}
				</div>
			</div>
		</div>`;
	}

	#htmlPericias(p, e) {
		const max = maxPericias(p, e.nivel);
		// Mostra as perícias do livro e as já marcadas; as demais ficam numa lista para acrescentar.
		const visiveis = [...new Set([...(p.pericias ?? []), ...e.pericias])];
		const resto = Object.keys(PERICIAS).filter((k) => !visiveis.includes(k) && !["luta", "pont"].includes(k));
		return `<small>Perícias (${e.pericias.length}/${max}):</small> ${visiveis
			.map(
				(k) =>
					`<label><input type="checkbox" data-pericia="${k}" data-parceiro="${p.id}" ${e.pericias.includes(k) ? "checked" : ""}>${esc(PERICIAS[k] ?? k)}</label>`
			)
			.join("")}
			<select data-mais-pericia="${p.id}"><option value="">+ perícia</option>${resto.map((k) => `<option value="${k}">${esc(PERICIAS[k])}</option>`).join("")}</select>`;
	}

	_replaceHTML(resultado, conteudo) {
		conteudo.innerHTML = resultado;
	}

	_onRender() {
		const el = this.element;
		el.querySelectorAll("[data-filtro]").forEach((x) =>
			x.addEventListener(x.type === "search" ? "input" : "change", (ev) => {
				const campo = ev.currentTarget.dataset.filtro;
				this.filtro[campo] = ev.currentTarget.type === "checkbox" ? ev.currentTarget.checked : ev.currentTarget.value;
				clearTimeout(this._busca);
				this._busca = setTimeout(() => this.render().then(() => {
					const s = this.element.querySelector('[data-filtro="texto"]');
					if (campo === "texto" && s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
				}), campo === "texto" ? 250 : 0);
			})
		);
		el.querySelectorAll('select[data-campo="nivel"]').forEach((x) =>
			x.addEventListener("change", (ev) => salvarEscolha(ev.currentTarget.dataset.parceiro, { nivel: ev.currentTarget.value }).then(() => this.render()))
		);
		el.querySelectorAll("input[data-pericia]").forEach((x) =>
			x.addEventListener("change", async (ev) => {
				const p = PARCEIROS.find((q) => q.id === ev.currentTarget.dataset.parceiro);
				const e = escolhaDe(p);
				const k = ev.currentTarget.dataset.pericia;
				const pericias = ev.currentTarget.checked ? [...new Set([...e.pericias, k])] : e.pericias.filter((y) => y !== k);
				await salvarEscolha(p.id, { pericias });
				this.render();
			})
		);
		el.querySelectorAll("select[data-mais-pericia]").forEach((x) =>
			x.addEventListener("change", async (ev) => {
				const k = ev.currentTarget.value;
				if (!k) return;
				const p = PARCEIROS.find((q) => q.id === ev.currentTarget.dataset.maisPericia);
				await salvarEscolha(p.id, { pericias: [...new Set([...escolhaDe(p).pericias, k])] });
				this.render();
			})
		);
	}

	static async #aplicar(ev, alvo) {
		const p = PARCEIROS.find((q) => q.id === alvo.dataset.parceiro);
		const id = this.element.querySelector(`select[data-heroi="${p.id}"]`)?.value;
		const heroi = id ? game.actors.get(id) : null;
		if (!heroi) return ui.notifications.warn(`Escolha o herói que ${p.nome} vai acompanhar.`);
		const e = escolhaDe(p);
		if (temAjudante(p)) {
			const max = maxPericias(p, e.nivel);
			if (e.pericias.length !== max) ui.notifications.warn(`${p.nome}: um ajudante ${e.nivel} dá bônus em ${max} perícias (marcadas: ${e.pericias.length}).`);
		}
		await darParceiro(p, heroi, e.nivel, e.pericias);
		this.render();
	}

	static async #dispensar(ev, alvo) {
		const p = PARCEIROS.find((q) => q.id === alvo.dataset.parceiro);
		await darParceiro(p, null);
		this.render();
	}

	static async #ficha(ev, alvo) {
		const p = PARCEIROS.find((q) => q.id === alvo.dataset.parceiro);
		const pack = game.packs.get(`${ID}.personagens`);
		const local = game.actors.find((a) => a._stats?.compendiumSource?.endsWith(p.ator) || a.id === p.ator || norm(a.name) === norm(p.nome));
		const doc = local ?? (pack ? await pack.getDocument(p.ator) : null);
		doc?.sheet.render(true);
	}

	// Recria os poderes já entregues com o nível e as perícias atuais.
	static async #atualizarTodos() {
		let n = 0;
		for (const p of PARCEIROS) {
			for (const { ator, item } of acompanhando(p)) {
				const e = escolhaDe(p);
				const nivel = e.nivel ?? item.getFlag(ID, "nivel");
				await ator.deleteEmbeddedDocuments("Item", [item.id]);
				await ator.createEmbeddedDocuments("Item", [await montarItem(p, nivel, e.pericias)]);
				n++;
			}
		}
		ui.notifications.info(`${n} parceiro(s) atualizado(s).`);
		this.render();
	}
}

let painel = null;

export function abrirParceiros() {
	if (!game.user.isGM) return ui.notifications.warn("Só o Mestre distribui os parceiros.");
	painel ??= new PainelParceiros();
	painel.render({ force: true });
	return painel;
}

export function registrarParceiros() {
	game.settings.register(ID, CHAVE, { scope: "world", config: false, type: Object, default: {} });
}

export { PARCEIROS, darParceiro, montarItem };
