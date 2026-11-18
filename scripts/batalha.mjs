// Painel de Batalha em Massa (Apêndice B de Jornada Heroica: Guerra Artoniana) para Foundry v13.
// Abra com a macro "É Guerra!" ou: game.modules.get("guerra-artoniana").api.abrirBatalha()
import { BATALHAS, EVENTOS, MECANICAS, POSICOES, TAMANHOS } from "./batalhas-dados.mjs";
import { abrirParceiros, darParceiro, PARCEIROS, registrarParceiros } from "./parceiros.mjs";

const ID = "guerra-artoniana";
const CHAVE = "batalha";
const ApplicationV2 = foundry.applications.api.ApplicationV2;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const d20 = (mod) => `1d20 ${mod >= 0 ? "+" : "-"} ${Math.abs(mod)}`;
const sinal = (n) => (n >= 0 ? `+${n}` : `${n}`);
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(copy\)/gi, "").trim().toLowerCase();
const preset = (estado) => BATALHAS.find((b) => b.id === estado.batalha);
const tamanho = (estado) => TAMANHOS[estado.tamanho];

/* ---------------- estado ---------------- */

function lerEstado() {
	const v = game.settings.get(ID, CHAVE);
	if (!v?.batalha) return null;
	const estado = foundry.utils.deepClone(v);
	// Batalhas salvas antes dos Lobos Solitários (2.2.x): converte para uma frente só.
	if (!estado.frentes) {
		const e = estado.entrada ?? {};
		estado.frentes = [novaFrente("grupo", "Grupo", null, estado.posicao)];
		Object.assign(estado.frentes[0], { evento: estado.evento ?? null, dano: e.dano ?? 0, danoCapitao: e.danoCapitao ?? 0, pericia: !!e.pericia, ajuste: e.ajuste ?? 0 });
		estado.outros = e.outros ?? 0;
		estado.lobos = false;
		delete estado.posicao; delete estado.evento; delete estado.entrada;
	}
	return estado;
}

function novaFrente(id, nome, ator, posicao = "retaguarda") {
	return { id, nome, ator, posicao, ajuste: 0, evento: null, dano: 0, danoCapitao: 0, pericia: false };
}

// Personagens dos jogadores: o personagem atribuído a cada usuário; sem isso, atores de jogador.
function herois() {
	let atores = game.users.filter((u) => !u.isGM && u.character).map((u) => u.character);
	if (!atores.length) atores = game.actors.filter((a) => a.type === "character" && a.hasPlayerOwner);
	return [...new Map(atores.map((a) => [a.id, a])).values()];
}

function frentesDosHerois(posicao) {
	const lista = herois().map((a) => novaFrente(a.id, a.name, a.uuid, posicao));
	return lista.length ? lista : [novaFrente("heroi1", "Herói 1", null, posicao)];
}

async function gravarEstado(estado) {
	await game.settings.set(ID, CHAVE, estado ?? {});
}

function novoEstado(b, opcoesMarcadas, limiarVariado, lobos) {
	const opcoes = (b.opcoes ?? []).filter((o) => opcoesMarcadas.includes(o.id));
	const somar = (campo) => opcoes.reduce((t, o) => t + (o[campo] ?? 0), 0);
	return {
		batalha: b.id,
		tamanho: b.tamanho,
		limiarVariado,
		opcoes: opcoes.map((o) => o.id),
		curandeiroNoAcampamento: opcoes.some((o) => o.curandeiroNoAcampamento),
		rodada: 1,
		pv: { aliado: somar("pvAliado"), inimigo: somar("pvInimigo") },
		fuga: null,
		aliado: { nome: b.aliado.nome, guerra: b.aliado.guerra + somar("guerraAliado"), substituido: false },
		inimigo: { nome: b.inimigo.nome, guerra: b.inimigo.guerra + somar("guerraInimigo"), substituido: false },
		lobos,
		frentes: lobos ? frentesDosHerois("retaguarda") : [novaFrente("grupo", "Grupo")],
		estandartes: 0,
		outros: 0,
		fim: null,
		historico: []
	};
}

function guardar(estado) {
	const copia = foundry.utils.deepClone({ ...estado, historico: [] });
	estado.historico = [...(estado.historico ?? []), copia].slice(-15);
}

/* ---------------- cálculos ---------------- */

function posicoes(estado) {
	const b = preset(estado);
	const lista = POSICOES.map((p) => ({ ...p, zona: b.zonas[p.id] }));
	if (b.ceus) lista.push({ id: "ceus", nome: "Sob os céus", mod: b.ceus.mod, zona: b.ceus.nome });
	return lista;
}

function cdPericia(estado, f) {
	const b = preset(estado);
	return tamanho(estado).cd + (f?.posicao === "ceus" ? b.ceus?.cd ?? 0 : 0);
}

function bonusFrente(estado, f) {
	const ev = EVENTOS.find((e) => e.id === f.evento?.id);
	const t = tamanho(estado);
	const partes = [];
	let bonus = 0;
	if (ev) {
		const dano = (Number(f.dano) || 0) * (ev.danoDobrado ? 2 : 1) - (ev.capitao ? Number(f.danoCapitao) || 0 : 0);
		const porDano = Math.floor(Math.max(0, dano) / t.limiar);
		if (porDano) partes.push(`${sinal(porDano)} dano (${Math.max(0, dano)} ÷ ${t.limiar})`);
		bonus += porDano;
		if (ev.capitao && porDano >= 2) { bonus += 2; partes.push("+2 capitão"); }
		if (f.pericia && ["pericia", "atacarPericia"].includes(ev.mecanica)) { bonus += 2; partes.push("+2 perícia"); }
		if (f.posicao === "ceus" && bonus > 0) { bonus += preset(estado).ceus.bonus; partes.push(`+${preset(estado).ceus.bonus} sob os céus`); }
	}
	return { bonus, partes };
}

function bonusEvento(estado) {
	const partes = [];
	let bonus = 0;
	for (const f of estado.frentes) {
		const r = bonusFrente(estado, f);
		bonus += r.bonus;
		if (r.partes.length) partes.push(estado.lobos ? `${f.nome}: ${r.partes.join(", ")}` : r.partes.join(", "));
	}
	const outros = Number(estado.outros) || 0;
	if (outros) { bonus += outros; partes.push(`${sinal(outros)} outros`); }
	if (estado.estandartes) { bonus += 2 * estado.estandartes; partes.push(`+${2 * estado.estandartes} estandarte(s)`); }
	return { bonus, partes };
}

const limiarVitoria = (estado) => (estado.limiarVariado ? tamanho(estado).vitoria : 10);

/* ---------------- fichas ---------------- */

function uuidInimigo(inimigo) {
	if (!inimigo) return null;
	if (inimigo.ficha && game.actors.get(inimigo.ficha)) return game.actors.get(inimigo.ficha).uuid;
	const nome = norm(inimigo.nome);
	const doMundo = game.actors.find((a) => norm(a.name) === nome);
	if (doMundo) return doMundo.uuid;
	const pack = game.packs.get(`${ID}.personagens`);
	if (pack) {
		if (inimigo.ficha && pack.index.has(inimigo.ficha)) return pack.getUuid(inimigo.ficha);
		const entrada = pack.index.find((e) => norm(e.name) === nome);
		if (entrada) return pack.getUuid(entrada._id);
	}
	// Ficha base do livro básico, no compêndio Ameaças do sistema Tormenta20.
	if (inimigo.sistema) {
		const base = norm(inimigo.sistema);
		const doMundoBase = game.actors.find((a) => norm(a.name) === base);
		if (doMundoBase) return doMundoBase.uuid;
		const ameacas = game.packs.get("tormenta20.ameacas");
		const e = ameacas?.index.find((x) => norm(x.name) === base);
		if (e) return ameacas.getUuid(e._id);
	}
	return null;
}

/* ---------------- chat ---------------- */

async function postar(titulo, corpo, rolls = [], soMestre = false) {
	return ChatMessage.create({
		speaker: { alias: "Batalha em Massa" },
		content: `<div class="ga-cartao"><h3><i class="fa-solid fa-chess-rook"></i> ${titulo}</h3>${corpo}</div>`,
		rolls,
		sound: rolls.length ? CONFIG.sounds.dice : undefined,
		whisper: soMestre ? game.users.filter((u) => u.isGM).map((u) => u.id) : []
	});
}

// Para os jogadores: só o nome do inimigo sorteado (estatísticas vão sussurradas ao Mestre).
function htmlInimigoPublico(inimigo, dado) {
	if (!inimigo) return "";
	return `<p><b>Inimigo (${dado}):</b> ${esc(inimigo.nome)}</p>`;
}

function htmlInimigo(inimigo, dado) {
	if (!inimigo) return "";
	const uuid = uuidInimigo(inimigo);
	const nome = uuid ? `@UUID[${uuid}]{${inimigo.nome}}` : `<b>${esc(inimigo.nome)}</b>`;
	const aviso = uuid && inimigo.aproximada ? `<br><small>A ficha ligada é a versão base (${esc(inimigo.sistema ?? "")}); nesta batalha valem os números abaixo.</small>` : "";
	return `<p><b>Inimigo (${dado}):</b> ${nome}${aviso}<br>Defesa ${inimigo.def} · ${esc(inimigo.res)}<br>${esc(inimigo.ataque)}</p>`;
}

/* ---------------- ações ---------------- */

async function rolarEventoFrente(estado, f) {
	const b = preset(estado);
	const pos = posicoes(estado).find((p) => p.id === f.posicao) ?? posicoes(estado)[1];
	const ajuste = Number(f.ajuste) || 0;
	const roll = await new Roll(d20(pos.mod + ajuste)).evaluate();
	let ev = EVENTOS.find((e) => roll.total <= e.ate);
	let obs = "";
	if (estado.curandeiroNoAcampamento && f.posicao === "acampamento") {
		ev = EVENTOS[0];
		obs = "<p><i>Opção da batalha: no acampamento o evento é sempre Curandeiro.</i></p>";
	}
	let inimigo = null;
	let rollInimigo = null;
	if (ev.combate && b.inimigos.length) {
		rollInimigo = await new Roll(`1d${b.inimigos.length}`).evaluate();
		inimigo = b.inimigos[rollInimigo.total - 1];
	}
	Object.assign(f, { evento: { id: ev.id, total: roll.total, inimigo: rollInimigo ? rollInimigo.total - 1 : null }, dano: 0, danoCapitao: 0, pericia: false });

	const cd = cdPericia(estado, f);
	const mec = MECANICAS[ev.mecanica].replace("{cd}", cd).replace("{pericia}", ev.pericia ?? "");
	const quem = estado.lobos ? (f.ator ? `@UUID[${f.ator}]{${f.nome}}` : esc(f.nome)) + ": " : "";
	await postar(
		`Rodada ${estado.rodada}: ${estado.lobos ? esc(f.nome) + " — " : ""}${ev.nome}`,
		`<p>${quem}<b>${esc(pos.zona)}</b> (${pos.nome}, ${sinal(pos.mod)}${ajuste ? `, ajuste ${sinal(ajuste)}` : ""}) → ${roll.total}</p>
		${obs}<p>${esc(ev.texto)}</p><p><i>${esc(mec)}</i></p>
		${ev.mecanica === "pericia" ? `<p><b>Perícia:</b> ${esc(ev.pericia)} — CD ${cd}</p>` : ""}
		${htmlInimigoPublico(inimigo, rollInimigo ? `1d${b.inimigos.length} = ${rollInimigo.total}` : "")}`,
		[roll, rollInimigo].filter(Boolean)
	);
	if (inimigo)
		await postar(
			`${estado.lobos ? esc(f.nome) + " — " : ""}Ficha do inimigo`,
			`${htmlInimigo(inimigo, rollInimigo.total)}
			${ev.combate && ev.mecanica !== "combate" ? `<p><small>Bônus: +1 a cada ${tamanho(estado).limiar} de dano. Magias em área causam 1,5× o dano.</small></p>` : ""}`,
			[],
			true
		);
}

async function rolarEvento(app, indice) {
	const estado = lerEstado();
	if (estado.fim) return;
	guardar(estado);
	const alvos = indice == null ? estado.frentes : [estado.frentes[indice]];
	for (const f of alvos) await rolarEventoFrente(estado, f);
	await gravarEstado(estado);
	app.render();
}

async function testeGenerais(app) {
	const estado = lerEstado();
	if (estado.fim) return;
	guardar(estado);
	const { bonus, partes } = bonusEvento(estado);
	const rA = await new Roll(d20(estado.aliado.guerra + bonus)).evaluate();
	const rI = await new Roll(d20(estado.inimigo.guerra)).evaluate();
	let vencedor = null;
	if (rA.total !== rI.total) vencedor = rA.total > rI.total ? "aliado" : "inimigo";
	else if (estado.aliado.guerra + bonus !== estado.inimigo.guerra) vencedor = estado.aliado.guerra + bonus > estado.inimigo.guerra ? "aliado" : "inimigo";
	const pontos = vencedor ? 1 + Math.floor(Math.abs(rA.total - rI.total) / 5) : 0;
	if (vencedor) estado.pv[vencedor] += pontos;

	const linhas = [];
	const limiar = limiarVitoria(estado);
	const b = preset(estado);
	const dif = estado.pv.aliado - estado.pv.inimigo;
	const atras = dif >= 5 ? "inimigo" : dif <= -5 ? "aliado" : null;
	if (estado.pv.aliado >= limiar || estado.pv.inimigo >= limiar) {
		const v = estado.pv.aliado >= limiar ? "aliado" : "inimigo";
		estado.fim = `${estado[v].nome} alcançou ${limiar} pontos de vitória: o exército adversário foi destruído.`;
	} else if (estado.fuga && atras === estado.fuga) {
		estado.fim = `O exército de ${estado[estado.fuga].nome} terminou de fugir.`;
	} else if (atras) {
		if (estado.fuga !== atras) linhas.push(`<p><b>O exército de ${esc(estado[atras].nome)} começa a fugir!</b> Se não reduzir a diferença para menos de 5 na próxima rodada, a batalha acaba.</p>`);
		estado.fuga = atras;
	} else if (estado.fuga) {
		linhas.push(`<p>O exército de ${esc(estado[estado.fuga].nome)} interrompeu a fuga.</p>`);
		estado.fuga = null;
	}
	if (!estado.fim && b.rodadasMax && estado.rodada >= b.rodadasMax) estado.fim = `Fim da ${b.rodadasMax}ª rodada: a cena termina (veja as notas da batalha).`;
	if (estado.fim) {
		linhas.push(`<p><b>Fim da batalha.</b> ${esc(estado.fim)}</p>`);
		linhas.push(`<p>Baixas: ${esc(estado.aliado.nome)} ${estado.pv.inimigo * 5}% · ${esc(estado.inimigo.nome)} ${estado.pv.aliado * 5}% (metade feridos, metade mortos).</p>`);
	}

	await postar(
		`Rodada ${estado.rodada}: teste dos generais`,
		`<p>${esc(estado.aliado.nome)}: <b>${rA.total}</b> (Guerra ${sinal(estado.aliado.guerra)}${bonus ? `, heróis ${sinal(bonus)}` : ""})
		${partes.length ? `<br><small>${esc(partes.join(" · "))}</small>` : ""}</p>
		<p>${esc(estado.inimigo.nome)}: <b>${rI.total}</b> (Guerra ${sinal(estado.inimigo.guerra)})</p>
		<p>${vencedor ? `<b>${esc(estado[vencedor].nome)}</b> vence e ganha <b>${pontos}</b> ponto(s) de vitória.` : "Empate total: ninguém pontua."}</p>
		<p>Placar: ${esc(estado.aliado.nome)} <b>${estado.pv.aliado}</b> × <b>${estado.pv.inimigo}</b> ${esc(estado.inimigo.nome)} (vitória com ${limiar})</p>
		${linhas.join("")}`,
		[rA, rI]
	);
	if (!estado.fim) {
		estado.rodada++;
		estado.outros = 0;
		for (const f of estado.frentes) Object.assign(f, { evento: null, dano: 0, danoCapitao: 0, pericia: false, ajuste: 0 });
	}
	await gravarEstado(estado);
	app.render();
}

async function generalCaiu(app, lado) {
	const estado = lerEstado();
	guardar(estado);
	const b = preset(estado);
	const g = estado[lado];
	const antes = `${g.nome} (Guerra ${sinal(g.guerra)})`;
	const rolls = [];
	if (!g.substituido) {
		g.nome = b[lado].substituto.nome;
		g.guerra = b[lado].substituto.guerra;
		g.substituido = true;
	} else {
		const r = await new Roll("1d6 + 1").evaluate();
		rolls.push(r);
		g.nome = `Oficial (no lugar de ${g.nome})`;
		g.guerra -= r.total;
	}
	let extra = "";
	if (lado === "inimigo") {
		const r = await new Roll("1d4 + 1").evaluate();
		rolls.push(r);
		estado.pv.aliado += r.total;
		extra = `<p>O exército de ${esc(estado.aliado.nome)} ganha <b>${r.total}</b> pontos de vitória (1d4+1).</p>`;
	}
	await gravarEstado(estado);
	await postar(
		lado === "inimigo" ? "General inimigo derrotado!" : "General aliado caiu!",
		`<p>${esc(antes)} sai de cena. Assume <b>${esc(g.nome)}</b>, Guerra ${sinal(g.guerra)}.</p>${extra}
		<p>Placar: ${estado.pv.aliado} × ${estado.pv.inimigo}</p>`,
		rolls
	);
	app.render();
}

/* ---------------- painel ---------------- */

class PainelBatalha extends ApplicationV2 {
	static DEFAULT_OPTIONS = {
		id: "ga-batalha",
		classes: ["ga-batalha"],
		window: { title: "Batalha em Massa", icon: "fa-solid fa-chess-rook", resizable: true },
		position: { width: 600, height: "auto" },
		actions: {
			comecar: PainelBatalha.#comecar,
			posicao: PainelBatalha.#posicao,
			evento: function (ev, alvo) { return rolarEvento(this, alvo.dataset.frente == null ? null : Number(alvo.dataset.frente)); },
			remover: PainelBatalha.#remover,
			sincronizar: PainelBatalha.#sincronizar,
			modo: PainelBatalha.#modo,
			generais: function () { return testeGenerais(this); },
			caiuInimigo: function () { return generalCaiu(this, "inimigo"); },
			caiuAliado: function () { return generalCaiu(this, "aliado"); },
			estandarte: PainelBatalha.#estandarte,
			pontos: PainelBatalha.#pontos,
			desfazer: PainelBatalha.#desfazer,
			encerrar: PainelBatalha.#encerrar
		}
	};

	escolha = { batalha: BATALHAS[0].id, opcoes: [], limiarVariado: false, lobos: false };

	async _renderHTML() {
		const estado = lerEstado();
		return `<style>
			.ga-batalha .window-content{padding:8px;gap:6px;overflow-y:auto}
			.ga-batalha section{border:1px solid var(--color-border, #7a7971);border-radius:4px;padding:6px 8px}
			.ga-batalha h4{margin:0 0 4px;font-weight:bold}
			.ga-batalha .linha{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
			.ga-batalha .pos{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:4px}
			.ga-batalha .pos button{line-height:1.2;padding:4px;height:auto;white-space:normal}
			.ga-batalha .pos button.ativo{outline:2px solid var(--color-warm-1, #ff6400);font-weight:bold}
			.ga-batalha .placar{font-size:1.3em;text-align:center}
			.ga-batalha input[type=number]{width:70px}
			.ga-batalha small, .ga-batalha .nota{opacity:.85}
			.ga-batalha .frente{border-top:1px dashed var(--color-border, #7a7971);padding-top:6px;margin-top:6px}
			.ga-batalha .frente:first-of-type{border-top:0;margin-top:0;padding-top:0}
			.ga-batalha .frente h5{margin:0 0 4px;font-weight:bold;display:flex;justify-content:space-between}
		</style>${estado ? this.#htmlBatalha(estado) : this.#htmlEscolha()}`;
	}

	_replaceHTML(resultado, conteudo) {
		conteudo.innerHTML = resultado;
	}

	_onRender() {
		this.element.querySelectorAll("[data-campo]").forEach((el) =>
			el.addEventListener("change", (ev) => this.#mudou(ev.currentTarget))
		);
	}

	#htmlEscolha() {
		const b = BATALHAS.find((x) => x.id === this.escolha.batalha);
		const t = TAMANHOS[b.tamanho];
		return `<section>
			<h4>Nova batalha</h4>
			<div class="linha"><label>Batalha</label>
				<select data-campo="escolha.batalha">${BATALHAS.map((x) => `<option value="${x.id}" ${x.id === b.id ? "selected" : ""}>${esc(x.nome)} — ${esc(x.aventura)}</option>`).join("")}</select></div>
			<p>${t.nome}: CD ${t.cd} nas perícias, +1 a cada ${t.limiar} de dano. Inimigos: ${b.inimigos.length ? `1d${b.inimigos.length}` : "sem tabela"}.</p>
			<p><b>${esc(b.aliado.nome)}</b> Guerra ${sinal(b.aliado.guerra)} <small>(${esc(b.aliado.detalhe)})</small><br>
			vs. <b>${esc(b.inimigo.nome)}</b> Guerra ${sinal(b.inimigo.guerra)} <small>(${esc(b.inimigo.detalhe)})</small></p>
			${b.notas ? `<p class="nota">${esc(b.notas)}</p>` : ""}
			${(b.opcoes ?? []).map((o) => `<label class="linha"><input type="checkbox" data-campo="escolha.opcao" value="${o.id}" ${this.escolha.opcoes.includes(o.id) ? "checked" : ""}> ${esc(o.rotulo)}</label>`).join("")}
			<label class="linha"><input type="checkbox" data-campo="escolha.lobos" ${this.escolha.lobos ? "checked" : ""}> Regra opcional: Lobos Solitários (cada herói escolhe sua posição e enfrenta o próprio evento)</label>
			${this.escolha.lobos ? `<p class="nota"><small>Heróis: ${esc(herois().map((a) => a.name).join(", ") || "nenhum personagem de jogador encontrado — atribua um personagem a cada jogador")}</small></p>` : ""}
			<label class="linha"><input type="checkbox" data-campo="escolha.limiarVariado" ${this.escolha.limiarVariado ? "checked" : ""}> Regra opcional: limiar de vitória pelo tamanho (${t.vitoria} pontos em vez de 10)</label>
			<button type="button" data-action="comecar"><i class="fa-solid fa-flag"></i> Começar batalha</button>
		</section>`;
	}

	#htmlBatalha(estado) {
		const b = preset(estado);
		const t = tamanho(estado);
		const { bonus, partes } = bonusEvento(estado);
		const fim = estado.fim;
		const dis = fim ? "disabled" : "";
		return `
		<section>
			<div class="linha" style="justify-content:space-between"><h4>${esc(b.nome)} — rodada ${estado.rodada}${b.rodadasMax ? ` de ${b.rodadasMax}` : ""}</h4><small>${t.nome} · CD ${cdPericia(estado)} nas perícias · +1/${t.limiar} dano</small></div>
			<div class="placar">${esc(estado.aliado.nome)} <b>${estado.pv.aliado}</b> × <b>${estado.pv.inimigo}</b> ${esc(estado.inimigo.nome)}</div>
			<div class="linha" style="justify-content:center">
				<button type="button" data-action="pontos" data-lado="aliado" data-valor="-1" title="Ajustar pontos do aliado">−</button>
				<button type="button" data-action="pontos" data-lado="aliado" data-valor="1">+</button>
				<small>vitória com ${limiarVitoria(estado)}${estado.fuga ? ` · <b>${esc(estado[estado.fuga].nome)} em fuga</b>` : ""}</small>
				<button type="button" data-action="pontos" data-lado="inimigo" data-valor="-1" title="Ajustar pontos do inimigo">−</button>
				<button type="button" data-action="pontos" data-lado="inimigo" data-valor="1">+</button>
			</div>
			${fim ? `<p><b>Fim da batalha:</b> ${esc(fim)}</p>` : ""}
			${b.notas ? `<p class="nota"><small>${esc(b.notas)}</small></p>` : ""}
		</section>
		<section>
			<h4>Generais</h4>
			<div class="linha"><label>${esc(estado.aliado.nome)}</label><input type="number" data-campo="aliado.guerra" value="${estado.aliado.guerra}">
				<button type="button" data-action="caiuAliado" ${dis} title="O general aliado sai de cena; assume o substituto">Caiu</button></div>
			<div class="linha"><label>${esc(estado.inimigo.nome)}</label><input type="number" data-campo="inimigo.guerra" value="${estado.inimigo.guerra}">
				<button type="button" data-action="caiuInimigo" ${dis} title="Heróis derrotaram o general inimigo: +1d4+1 pontos e assume o substituto">Derrotado pelos heróis</button></div>
		</section>
		<section>
			<div class="linha" style="justify-content:space-between">
				<h4>1–2. ${estado.lobos ? "Heróis (Lobos Solitários)" : "Heróis"}</h4>
				<span class="linha">
					${estado.lobos ? `<button type="button" data-action="sincronizar" title="Incluir personagens de jogadores que não estão na lista"><i class="fa-solid fa-user-plus"></i></button>
					<button type="button" data-action="evento" ${dis}><i class="fa-solid fa-dice-d20"></i> Rolar todos</button>` : ""}
					<button type="button" data-action="modo" ${dis} title="Alternar entre o grupo junto e Lobos Solitários">${estado.lobos ? "Juntar o grupo" : "Lobos Solitários"}</button>
				</span>
			</div>
			${estado.frentes.map((f, i) => this.#htmlFrente(estado, f, i, dis)).join("")}
		</section>
		<section>
			<div class="linha"><span>Estandartes com os heróis: <b>${estado.estandartes}</b></span>
				<button type="button" data-action="estandarte" data-valor="-1">−</button><button type="button" data-action="estandarte" data-valor="1">+</button>
				<label>Outros bônus</label><input type="number" data-campo="outros" value="${estado.outros}"></div>
			<p>Bônus dos heróis para o general: <b>${sinal(bonus)}</b> ${partes.length ? `<small>(${esc(partes.join(" · "))})</small>` : ""}</p>
		</section>
		<section>
			<h4>3. Teste dos generais</h4>
			<p>${esc(estado.aliado.nome)} 1d20 ${sinal(estado.aliado.guerra + bonus)} contra ${esc(estado.inimigo.nome)} 1d20 ${sinal(estado.inimigo.guerra)}</p>
			<div class="linha">
				<button type="button" data-action="generais" ${dis}><i class="fa-solid fa-swords"></i> Rolar teste dos generais</button>
				<button type="button" data-action="desfazer" ${estado.historico?.length ? "" : "disabled"}><i class="fa-solid fa-rotate-left"></i> Desfazer</button>
				<button type="button" data-action="encerrar"><i class="fa-solid fa-xmark"></i> Encerrar batalha</button>
			</div>
		</section>`;
	}

	#htmlFrente(estado, f, i, dis) {
		const b = preset(estado);
		const ev = EVENTOS.find((e) => e.id === f.evento?.id);
		const inimigo = f.evento?.inimigo != null ? b.inimigos[f.evento.inimigo] : null;
		const cd = cdPericia(estado, f);
		const p = `frentes.${i}`;
		const { bonus } = bonusFrente(estado, f);
		const posicaoHtml = estado.lobos
			? `<select data-campo="${p}.posicao" ${dis}>${posicoes(estado).map((x) => `<option value="${x.id}" ${x.id === f.posicao ? "selected" : ""}>${esc(x.zona)} (${x.nome} ${sinal(x.mod)})</option>`).join("")}</select>`
			: `<div class="pos">${posicoes(estado).map((x) => `<button type="button" data-action="posicao" data-frente="${i}" data-pos="${x.id}" class="${x.id === f.posicao ? "ativo" : ""}" ${dis}>${esc(x.zona)}<br><small>${x.nome} ${sinal(x.mod)}</small></button>`).join("")}</div>`;
		return `<div class="frente">
			${estado.lobos ? `<h5><span>${esc(f.nome)}</span><span>${bonus ? `bônus ${sinal(bonus)} ` : ""}<a data-action="remover" data-frente="${i}" title="Tirar da batalha"><i class="fa-solid fa-xmark"></i></a></span></h5>` : ""}
			${posicaoHtml}
			${f.posicao === "ceus" ? `<p class="nota"><small>${esc(b.ceus.regra)}</small></p>` : ""}
			<div class="linha">
				<label title="Regra opcional: teste de Guerra contra a CD da batalha">Posicionamento avançado</label>
				<select data-campo="${p}.ajuste" data-numero>${[-2, 0, 2].map((v) => `<option value="${v}" ${Number(f.ajuste) === v ? "selected" : ""}>${v ? sinal(v) : "nenhum"}</option>`).join("")}</select>
				<button type="button" data-action="evento" data-frente="${i}" ${dis}><i class="fa-solid fa-dice-d20"></i> Rolar evento</button>
			</div>
			${ev ? `<p><b>${esc(ev.nome)}</b> (${f.evento.total}) — <small>${esc(MECANICAS[ev.mecanica].replace("{cd}", cd).replace("{pericia}", ev.pericia ?? ""))}</small></p>` : ""}
			${inimigo ? `<p><small><b>${esc(inimigo.nome)}</b> — Defesa ${inimigo.def} · ${esc(inimigo.res)} · ${esc(inimigo.ataque)}</small></p>` : ""}
			${ev ? `<div class="linha">
				${ev.combate && ev.mecanica !== "combate" ? `<label>Dano${estado.lobos ? "" : " dos heróis"}${ev.danoDobrado ? " (no líder; conta em dobro)" : ""}</label><input type="number" min="0" data-campo="${p}.dano" value="${f.dano}">` : ""}
				${ev.capitao ? `<label>Dano do capitão</label><input type="number" min="0" data-campo="${p}.danoCapitao" value="${f.danoCapitao}">` : ""}
				${["pericia", "atacarPericia"].includes(ev.mecanica) ? `<label><input type="checkbox" data-campo="${p}.pericia" ${f.pericia ? "checked" : ""}> passou na perícia</label>` : ""}
			</div>` : ""}
		</div>`;
	}

	async #mudou(el) {
		const campo = el.dataset.campo;
		if (campo.startsWith("escolha.")) {
			if (campo === "escolha.batalha") this.escolha = { ...this.escolha, batalha: el.value, opcoes: [] };
			else if (campo === "escolha.lobos") this.escolha.lobos = el.checked;
			else if (campo === "escolha.opcao") {
				const s = new Set(this.escolha.opcoes);
				el.checked ? s.add(el.value) : s.delete(el.value);
				this.escolha.opcoes = [...s];
			} else if (campo === "escolha.limiarVariado") this.escolha.limiarVariado = el.checked;
			return this.render();
		}
		const estado = lerEstado();
		const valor = el.type === "checkbox" ? el.checked : el.type === "number" || el.dataset.numero != null ? Number(el.value) || 0 : el.value;
		foundry.utils.setProperty(estado, campo, valor);
		await gravarEstado(estado);
		this.render();
	}

	static async #comecar() {
		const b = BATALHAS.find((x) => x.id === this.escolha.batalha);
		const estado = novoEstado(b, this.escolha.opcoes, this.escolha.limiarVariado, this.escolha.lobos);
		await gravarEstado(estado);
		const t = TAMANHOS[b.tamanho];
		await postar(
			`${b.nome} começa!`,
			`<p><b>${esc(estado.aliado.nome)}</b> vs. <b>${esc(estado.inimigo.nome)}</b></p>
			<p>${t.nome}: CD ${t.cd} nas perícias de eventos, +1 ao general a cada ${t.limiar} de dano. Vence quem chegar a ${limiarVitoria(estado)} pontos de vitória.</p>
			${estado.pv.inimigo || estado.pv.aliado ? `<p>Placar inicial: ${estado.pv.aliado} × ${estado.pv.inimigo}</p>` : ""}
			<p>Os heróis começam na <b>${esc(b.zonas.retaguarda)}</b> (retaguarda).${estado.lobos ? " Regra Lobos Solitários: cada herói escolhe sua posição e enfrenta o próprio evento." : ""}</p>`
		);
		// Só para o Mestre: modificadores dos generais e a tabela de inimigos.
		await postar(
			`${b.nome}: notas do Mestre`,
			`<p>${esc(estado.aliado.nome)}: Guerra ${sinal(estado.aliado.guerra)} · ${esc(estado.inimigo.nome)}: Guerra ${sinal(estado.inimigo.guerra)}</p>
			${b.inimigos.length ? `<p><b>Inimigos (1d${b.inimigos.length}):</b> ${b.inimigos.map((x, i) => `${i + 1}. ${esc(x.nome)}`).join(" · ")}</p>` : ""}`,
			[],
			true
		);
		this.render();
	}

	static async #posicao(ev, alvo) {
		const estado = lerEstado();
		estado.frentes[Number(alvo.dataset.frente ?? 0)].posicao = alvo.dataset.pos;
		await gravarEstado(estado);
		this.render();
	}

	static async #remover(ev, alvo) {
		const estado = lerEstado();
		if (estado.frentes.length <= 1) return ui.notifications.warn("Precisa haver pelo menos um herói.");
		guardar(estado);
		estado.frentes.splice(Number(alvo.dataset.frente), 1);
		await gravarEstado(estado);
		this.render();
	}

	// Inclui personagens de jogadores que ainda não estão na batalha (mantém os que já estão).
	static async #sincronizar() {
		const estado = lerEstado();
		const ids = new Set(estado.frentes.map((f) => f.id));
		const novos = herois().filter((a) => !ids.has(a.id)).map((a) => novaFrente(a.id, a.name, a.uuid, "retaguarda"));
		if (!novos.length) return ui.notifications.info("Nenhum personagem de jogador novo.");
		estado.frentes = estado.frentes.filter((f) => !/^heroi\d+$/.test(f.id)).concat(novos);
		await gravarEstado(estado);
		this.render();
	}

	static async #modo() {
		const estado = lerEstado();
		guardar(estado);
		const posicao = estado.frentes[0]?.posicao ?? "retaguarda";
		estado.lobos = !estado.lobos;
		estado.frentes = estado.lobos ? frentesDosHerois(posicao) : [novaFrente("grupo", "Grupo", null, posicao)];
		await gravarEstado(estado);
		this.render();
	}

	static async #estandarte(ev, alvo) {
		const estado = lerEstado();
		estado.estandartes = Math.max(0, estado.estandartes + Number(alvo.dataset.valor));
		await gravarEstado(estado);
		this.render();
	}

	static async #pontos(ev, alvo) {
		const estado = lerEstado();
		guardar(estado);
		estado.pv[alvo.dataset.lado] += Number(alvo.dataset.valor);
		await gravarEstado(estado);
		this.render();
	}

	static async #desfazer() {
		const estado = lerEstado();
		const anterior = estado.historico?.pop();
		if (!anterior) return;
		anterior.historico = estado.historico;
		await gravarEstado(anterior);
		ui.notifications.info("Última ação desfeita (as mensagens do chat continuam lá).");
		this.render();
	}

	static async #encerrar() {
		const ok = await foundry.applications.api.DialogV2.confirm({
			window: { title: "Encerrar batalha" },
			content: "<p>Apagar o estado desta batalha e voltar à escolha de batalha?</p>"
		});
		if (!ok) return;
		await gravarEstado(null);
		this.render();
	}
}

let painel = null;

function abrirBatalha() {
	if (!game.user.isGM) return ui.notifications.warn("Só o Mestre controla a batalha em massa.");
	painel ??= new PainelBatalha();
	painel.render({ force: true });
	return painel;
}

Hooks.once("init", () => {
	game.settings.register(ID, CHAVE, { scope: "world", config: false, type: Object, default: {} });
	registrarParceiros();
});

Hooks.once("ready", () => {
	const mod = game.modules.get(ID);
	if (mod) mod.api = { abrirBatalha, BATALHAS, EVENTOS, abrirParceiros, PARCEIROS, darParceiro };
});
