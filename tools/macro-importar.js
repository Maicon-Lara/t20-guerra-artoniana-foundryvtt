// Guerra Artoniana — importador (Foundry v13, Tormenta20 1.5.x)
// Crie uma Macro do tipo "Script", cole este texto e execute como Mestre.
// Ela pede o arquivo guerra-artoniana-dados.json, envia os tokens para a pasta indicada
// e cria os compêndios do mundo com todos os atores, itens, tabelas e macros, mais o
// compêndio de Aventuras (um por arco, com o botão "Importar Aventura").
(async () => {
	if (!game.user.isGM) return ui.notifications.error("Só o Mestre pode importar.");
	const DialogV2 = foundry.applications.api.DialogV2;
	const FP = foundry.applications.apps?.FilePicker?.implementation ?? FilePicker;
	const Compendio = foundry.documents.collections?.CompendiumCollection ?? CompendiumCollection;
	const forge = typeof ForgeVTT !== "undefined" && ForgeVTT.usingTheForge;
	const origem = forge ? "forgevtt" : "data";

	const escolha = await DialogV2.prompt({
		window: { title: "Importar Guerra Artoniana" },
		content: `
			<p>Arquivo <b>guerra-artoniana-dados.json</b>:</p>
			<input type="file" name="arquivo" accept=".json" required>
			<p>Pasta onde os tokens serão gravados:</p>
			<input type="text" name="pasta" value="guerra-artoniana/tokens">`,
		ok: {
			label: "Importar",
			callback: (ev, botao) => ({
				arquivo: botao.form.elements.arquivo.files[0],
				pasta: botao.form.elements.pasta.value.trim().replace(/^\/+|\/+$/g, "")
			})
		},
		rejectClose: false
	});
	if (!escolha?.arquivo) return;

	ui.notifications.info("Lendo o arquivo… (pode levar alguns segundos)");
	const dados = JSON.parse(await escolha.arquivo.text());

	// 1. Tokens
	let parcial = "";
	for (const parte of escolha.pasta.split("/")) {
		parcial = parcial ? `${parcial}/${parte}` : parte;
		try { await FP.createDirectory(origem, parcial, {}); } catch (e) { /* já existe */ }
	}
	let existentes = new Set();
	try {
		existentes = new Set((await FP.browse(origem, escolha.pasta)).files.map((f) => decodeURIComponent(f.split("/").pop())));
	} catch (e) { /* pasta vazia */ }
	const nomes = Object.keys(dados.tokens);
	let base = null;
	let enviados = 0;
	for (const nome of nomes) {
		if (existentes.has(nome) && !forge) continue;
		const bin = Uint8Array.from(atob(dados.tokens[nome]), (c) => c.charCodeAt(0));
		const tipo = nome.endsWith(".png") ? "image/png" : nome.endsWith(".webp") ? "image/webp" : "image/jpeg";
		const r = await FP.upload(origem, escolha.pasta, new File([bin], nome, { type: tipo }), {}, { notify: false });
		if (r?.path && !base) base = r.path.slice(0, r.path.length - nome.length - 1);
		enviados++;
		if (enviados % 25 === 0) ui.notifications.info(`Tokens enviados: ${enviados}/${nomes.length}`);
	}
	base ??= escolha.pasta;

	// 2. Compêndios
	const texto = JSON.stringify(dados.packs).replaceAll("@@TOKENS@@/", `${base}/`);
	const packs = JSON.parse(texto);
	let pastaCompendios = game.folders.find((f) => f.type === "Compendium" && f.name === "Guerra Artoniana");
	if (!pastaCompendios) pastaCompendios = await Folder.create({ name: "Guerra Artoniana", type: "Compendium" });

	for (const p of packs) {
		let pack = game.packs.get(`world.${p.nome}`);
		if (pack?.index.size) {
			ui.notifications.warn(`"${p.label}" já existe e não está vazio; pulei. Apague-o para importar de novo.`);
			continue;
		}
		pack ??= await Compendio.createCompendium({ name: p.nome, label: p.label, type: p.type });
		try { await pack.setFolder(pastaCompendios); } catch (e) { /* versão sem pastas de compêndio */ }
		const opcoes = { pack: pack.collection, keepId: true };

		const porId = new Map(p.pastas.map((f) => [f._id, f]));
		const nivel = (f) => (f.folder && porId.has(f.folder) ? 1 + nivel(porId.get(f.folder)) : 0);
		const pastas = [...p.pastas].sort((a, b) => nivel(a) - nivel(b));
		for (const n of [...new Set(pastas.map(nivel))]) {
			await Folder.createDocuments(pastas.filter((f) => nivel(f) === n), opcoes);
		}

		const Classe = getDocumentClass(p.type);
		for (let i = 0; i < p.docs.length; i += 40) {
			await Classe.createDocuments(p.docs.slice(i, i + 40), opcoes);
		}
		ui.notifications.info(`${p.label}: ${p.docs.length} importados.`);
	}
	ui.notifications.info("Guerra Artoniana importada. Veja a aba Compêndios.", { permanent: true });
})();
