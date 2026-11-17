// É Guerra! — abre o painel de Batalha em Massa do módulo Guerra Artoniana (Foundry v13).
// Sem o módulo ativo, cai no modo simples: sorteia um Evento de Batalha pela posição.
const api = game.modules.get("guerra-artoniana")?.active && game.modules.get("guerra-artoniana").api;
if (api?.abrirBatalha) return api.abrirBatalha();

const TABELAS = [
	"Eventos de Batalha (Acampamento)",
	"Eventos de Batalha (Retaguarda)",
	"Eventos de Batalha (Front)",
	"Eventos de Batalha (Atrás das Linhas)"
];
new foundry.applications.api.DialogV2({
	window: { title: "É GUERRA!", icon: "fa-solid fa-chess-rook" },
	position: { width: 340 },
	content: `<p>Role um evento:</p><div style="display:flex;flex-direction:column;gap:4px">
		${TABELAS.map((t) => `<button type="button" data-action="rolar" data-tabela="${t}">${t.replace("Eventos de Batalha ", "")}</button>`).join("")}</div>`,
	buttons: [{ action: "fechar", label: "Fechar", default: true }],
	actions: {
		async rolar(evento, alvo) {
			const nome = alvo.dataset.tabela;
			const tabela = game.tables.getName(nome);
			if (!tabela) return ui.notifications.warn(`Tabela "${nome}" não encontrada no mundo.`);
			await tabela.draw();
		}
	}
}).render({ force: true });
