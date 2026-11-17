// É Guerra! — sorteia um Evento de Batalha (Foundry v13, sem módulos extras).
// Procura a tabela no mundo (Aventura importada) e, se não achar, no compêndio do módulo.
const TABELAS = [
	"Eventos de Batalha (Acampamento)",
	"Eventos de Batalha (Retaguarda)",
	"Eventos de Batalha (Front)",
	"Eventos de Batalha (Atrás das Linhas)"
];

async function acharTabela(nome) {
	const doMundo = game.tables.getName(nome);
	if (doMundo) return doMundo;
	const pack = game.packs.get("guerra-artoniana.tabelas-de-encontros");
	const entrada = pack?.index.find((e) => e.name === nome);
	return entrada ? pack.getDocument(entrada._id) : null;
}

new foundry.applications.api.DialogV2({
	window: { title: "É GUERRA!", icon: "fa-solid fa-chess-rook" },
	position: { width: 340 },
	content: `<p>Role um evento:</p>
		<div style="display:flex;flex-direction:column;gap:4px">
		${TABELAS.map((t) => `<button type="button" data-action="rolar" data-tabela="${t}">${t.replace("Eventos de Batalha ", "")}</button>`).join("")}
		</div>`,
	buttons: [{ action: "fechar", label: "Fechar", default: true }],
	actions: {
		async rolar(evento, alvo) {
			const nome = alvo.dataset.tabela;
			const tabela = await acharTabela(nome);
			if (!tabela) return ui.notifications.warn(`Tabela "${nome}" não encontrada. Importe a aventura "Batalhas em Massa e Extras".`);
			await tabela.draw();
		}
	}
}).render({ force: true });
