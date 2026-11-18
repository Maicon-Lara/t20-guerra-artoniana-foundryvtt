// Dados dos parceiros: tipos do Tormenta20 (JdA p. 260) e os parceiros de Guerra Artoniana.
// Chaves de efeito: "fixos" = [caminho, valor, modo?] (modo 2 soma, 5 substitui), sempre ativos;
// "usos" = { tipo: "attack" | "skill" | "spell", mudancas: [[chave, valor]], custo? }, que o
// jogador marca na janela de rolagem (efeito "ao usar" do sistema).

export const NIVEIS = ["iniciante", "veterano", "mestre"];

export const PERICIAS = {
	acro: "Acrobacia", ades: "Adestramento", atle: "Atletismo", atua: "Atuação", cava: "Cavalgar",
	conh: "Conhecimento", cura: "Cura", dipl: "Diplomacia", enga: "Enganação", fort: "Fortitude",
	furt: "Furtividade", guer: "Guerra", inic: "Iniciativa", inti: "Intimidação", intu: "Intuição",
	inve: "Investigação", joga: "Jogatina", ladi: "Ladinagem", luta: "Luta", mist: "Misticismo",
	nobr: "Nobreza", ofic: "Ofício", perc: "Percepção", pilo: "Pilotagem", pont: "Pontaria",
	refl: "Reflexos", reli: "Religião", sobr: "Sobrevivência", vont: "Vontade"
};

const porNivel = (nivel, ini, vet, mes) => ({ iniciante: ini, veterano: vet, mestre: mes })[nivel];
const pericia = (id, v) => [`system.pericias.${id}.bonus`, v];
export const defesa = (v) => ["system.attributes.defesa.bonus", v];
export const ataque = (v) => ["system.modificadores.ataque.geral", v];
export const resistencias = (v) => ["fort", "refl", "vont"].map((id) => pericia(id, v));
export const pericias = (ids, v) => ids.map((id) => pericia(id, v));
export const deslocamento = (m, tipo = "walk") => [`system.attributes.movement.${tipo}`, m, 5];
export const danoUso = (dado, tipo = "attack") => ({ tipo, mudancas: [["dano", dado]] });

export const TIPOS = {
	adepto: {
		nome: "Adepto",
		texto: "Iniciante: o custo para lançar suas magias de 1º círculo diminui –1 PM. Veterano: também reduz o custo das magias de 2º círculo. Mestre: a redução se torna cumulativa com outras reduções.",
		nivel: () => ({ usos: [{ tipo: "spell", mudancas: [], custo: -1 }] })
	},
	ajudante: {
		nome: "Ajudante",
		texto: "Iniciante: +2 em duas perícias. Veterano: +2 em três perícias. Mestre: +4 em três perícias. Não pode dar bônus em Luta ou Pontaria.",
		nivel: (n, { pericias: ids = [] }) => ({
			fixos: pericias(ids.slice(0, n === "iniciante" ? 2 : 3), n === "mestre" ? 4 : 2)
		})
	},
	assassino: {
		nome: "Assassino",
		texto: "Iniciante: Ataque Furtivo +1d6 (cumulativo). Veterano: também dá bônus por flanquear contra um inimigo por rodada. Mestre: Ataque Furtivo muda para +2d6.",
		nivel: (n) => ({
			usos: [{ tipo: "attack", mudancas: porNivel(n, [["dano", "1d6"]], [["dano", "1d6"], ["ataque", 2]], [["dano", "2d6"], ["ataque", 2]]) }]
		})
	},
	atirador: {
		nome: "Atirador",
		texto: "Iniciante: uma vez por rodada, +1d6 em uma rolagem de dano à distância. Veterano: muda para +1d10. Mestre: muda para +2d8.",
		nivel: (n) => ({ usos: [danoUso(porNivel(n, "1d6", "1d10", "2d8"))] })
	},
	combatente: {
		nome: "Combatente",
		texto: "Iniciante: +2 em testes de ataque. Veterano: +3. Mestre: +4 e, uma vez por rodada, pode gastar 5 PM para fazer um ataque extra.",
		nivel: (n) => ({ fixos: [ataque(porNivel(n, 2, 3, 4))] })
	},
	destruidor: {
		nome: "Destruidor",
		texto: "Iniciante: uma vez por rodada, ação livre, 1 PM para causar 2d6 de dano (ácido, eletricidade, fogo ou frio) em um alvo em alcance curto. Veterano: também 2 PM para 4d6. Mestre: também 4 PM para 6d6 numa área de 6m de raio em alcance médio.",
		nivel: () => ({})
	},
	fortao: {
		nome: "Fortão",
		nomeSistema: "Fortão",
		texto: "Iniciante: uma vez por rodada, +1d8 em uma rolagem de dano corpo a corpo. Veterano: muda para +1d12. Mestre: muda para +3d6.",
		nivel: (n) => ({ usos: [danoUso(porNivel(n, "1d8", "1d12", "3d6"))] })
	},
	guardiao: {
		nome: "Guardião",
		texto: "Iniciante: +2 na Defesa. Veterano: +3. Mestre: +4 na Defesa e +2 em testes de resistência.",
		nivel: (n) => ({ fixos: n === "mestre" ? [defesa(4), ...resistencias(2)] : [defesa(porNivel(n, 2, 3))] })
	},
	magivocador: {
		nome: "Magivocador",
		texto: "Iniciante: o dano de suas magias aumenta em +1 dado do mesmo tipo. Veterano: também +1 na CD das suas magias. Mestre: dobra os bônus (+2 dados de dano e +2 na CD).",
		nivel: (n) => (n === "iniciante" ? {} : { usos: [{ tipo: "spell", mudancas: [["cd", n === "mestre" ? 2 : 1]] }] })
	},
	medico: {
		nome: "Médico",
		texto: "Iniciante: uma vez por rodada, 1 PM para curar 1d8+1 PV de uma criatura adjacente. Veterano: também 3 PM para curar 3d8+3 PV ou remover uma condição prejudicial. Mestre: também 5 PM para curar 6d8+6 PV.",
		nivel: () => ({})
	},
	montaria: {
		nome: "Montaria",
		nomeSistema: "Montaria: Cavalo",
		texto: "Para usar um parceiro montaria você precisa montar nele (ação de movimento) e, se não for treinado em Cavalgar, guiar com um teste de Cavalgar (CD 10) por turno. Ataques à distância montado sofrem –2 (sem o poder Ginete).",
		nivel: () => ({})
	},
	perseguidor: {
		nome: "Perseguidor",
		texto: "Um batedor ou rastreador (veja Tormenta20, p. 260).",
		nivel: () => ({})
	},
	vigilante: {
		nome: "Vigilante",
		texto: "Um sentinela atento (veja Tormenta20, p. 260).",
		nivel: () => ({})
	}
};

const atributo = (id, v) => [`system.atributos.${id}.bonus`, v];
const A1 = "Arco 1";
const INT = "Interlúdio";
const A2 = "Arco 2";
const A3 = "Arco 3";
const KARST = "Recrutado na Aventura 3 ajudando nas defesas de Karst (NPCs não recrutados morrem no cerco).";
const KARST6 = "Na Aventura 6 (p. 102) pode virar veterano:";

// Cada parceiro: tipos (chaves de TIPOS), nivel inicial, ator (id em guerra-artoniana.personagens),
// pericias (ajudante), rotulos (nome de cada "nível" quando o livro usa fases em vez de patamares)
// e especial[nível] = { texto, fixos, usos, tipos: [[tipo, nível]], substitui }.
export const PARCEIROS = [
	/* ---------------- Arco 1 ---------------- */
	{
		id: "almuth", nome: "Almuth Benkhart", arco: A1, aventura: "Aventura 3", pagina: 51, ator: "4nCNaF5lGdmZfA0b",
		tipos: ["atirador"], nivel: "iniciante",
		resumo: `A taverneira arqueira. ${KARST} Ajudar a treinar arqueiros (Pontaria ou Guerra CD 15).`,
		evolucao: `${KARST6} beber o hidromel com ela e passar numa perícia social treinada (exceto Intimidação) CD 25.`
	},
	{
		id: "loras", nome: "Loras", arco: A1, aventura: "Aventura 3", pagina: 51, ator: "g2AYL7t6N43c8Lpi",
		tipos: ["ajudante"], nivel: "iniciante", pericias: ["inic", "refl", "vont"],
		resumo: `A castelã. ${KARST} Achar fungos curativos nas masmorras (Cura ou Sobrevivência CD 15).`,
		evolucao: `${KARST6} passar em Atuação, Cura ou Enganação na colina (+2 em Iniciativa, Reflexos e Vontade).`,
		notas: "Recrutada, os eventos no acampamento da Batalha de Karst viram Curandeiro."
	},
	{
		id: "isilgro", nome: "Isilgro Coração de Ouro", arco: A1, aventura: "Aventura 3", pagina: 51, ator: "VHxjjSV60aI2HtLx",
		tipos: ["medico"], nivel: "iniciante",
		resumo: `O tesoureiro. ${KARST} Distribuir com honestidade o tesouro de Karst aos camponeses.`,
		evolucao: `${KARST6} um personagem recusar o dinheiro do baú (Diplomacia ou Enganação CD 25).`
	},
	{
		id: "phryxos", nome: "Phryxos Filho de Goblin", arco: A1, aventura: "Aventura 3", pagina: 52, ator: "lcqTSxsX76pj4vuy",
		tipos: ["guardiao"], nivel: "iniciante",
		resumo: `O guarda-costas. ${KARST} Perceber que pensa em desertar (Intuição CD 15) e convencê-lo (Diplomacia CD 15 ou Intimidação CD 20).`,
		evolucao: `${KARST6} treinar com ele nos muros (Luta ou Pontaria CD 25).`
	},
	{
		id: "lasus", nome: "Lasus Galien", arco: A1, aventura: "Aventura 3", pagina: 52, ator: "15kUz7zpJkmB1ULm",
		tipos: ["destruidor"], nivel: "iniciante",
		resumo: `O alquimista (destruidor de fogo). ${KARST} Fabricar flechas incendiárias (Ofício alquimista ou armeiro CD 15).`,
		evolucao: `${KARST6} pescar com ele no barco (Sobrevivência ou Conhecimento CD 25).`,
		notas: "O dano do destruidor de Lasus é de fogo."
	},
	{
		id: "klunc", nome: "Klunc", arco: A1, aventura: "Aventura 4", pagina: 71, ator: "zpH0qaSH29yqHqWG",
		tipos: ["fortao"], nivel: "iniciante",
		resumo: "Vencê-lo na Arena sem machucá-lo gravemente e oferecer presunto. Precisa de dois presuntos por aventura, ou volta para a Arena.",
		evolucao: "Veterano no 5º nível dos heróis; mestre no 11º."
	},
	{
		id: "cocatriz", nome: "Cocatriz", arco: A1, aventura: "Aventura 4", pagina: 73, ator: "gID8J9p341uKDXmQ",
		tipos: ["adepto"], nivel: "iniciante",
		resumo: "Parceiro especial (adepto) do Torneio dos Lordes. O livro não diz como obtê-la nem o nível.",
		especial: {
			iniciante: { substitui: true, texto: "Iniciante: suas habilidades mágicas que causam condições de movimento custam –1 PM." },
			veterano: { substitui: true, texto: "Iniciante: suas habilidades mágicas que causam condições de movimento custam –1 PM. Veterano: a CD para resistir a essas habilidades aumenta em +2." },
			mestre: { substitui: true, texto: "Habilidades mágicas que causam condições de movimento custam –1 PM (cumulativo com outras reduções) e a CD para resistir a elas aumenta em +2." }
		}
	},
	{
		id: "dai-kabuto", nome: "Dai-kabuto", arco: A1, aventura: "Aventura 4", pagina: 74, ator: "mj8cpfcrof9A1jp3",
		tipos: ["montaria"], nivel: "iniciante", tamanho: "Grande",
		resumo: "Besta do Torneio dos Lordes. O livro não diz como obtê-lo nem o nível.",
		especial: {
			iniciante: { fixos: [deslocamento(9)], texto: "Deslocamento 9m, +2 em testes de agarrar e derrubar e uma ação de movimento extra por turno (só para se deslocar)." },
			veterano: { fixos: [deslocamento(9), deslocamento(6, "fly")], texto: "Como iniciante, e deslocamento de voo 6m." },
			mestre: { fixos: [deslocamento(9), deslocamento(6, "fly"), defesa(2)], texto: "Como veterano; o bônus em agarrar vale para todas as manobras e +2 na Defesa." }
		}
	},
	{
		id: "ayleth", nome: "Lady Ayleth", arco: A1, aventura: "Aventuras 5, 6 e 16", pagina: 81, ator: "mjBLu1UQ9e4Cmcay",
		tipos: ["combatente"], nivel: "iniciante",
		rotulos: { iniciante: "Aventura 5 (ferida)", veterano: "Aventura 6 (espada baronial)", mestre: "Aventura 16 (combatente mestre)" },
		resumo: "Acompanha quem aceita a missão sem pedir recompensa; fica com o personagem de maior atitude com ela.",
		notas: "Na Aventura 17 só acompanha dependendo do destino de Svalas (p. 295).",
		especial: {
			iniciante: {
				substitui: true, fixos: [ataque(1), defesa(1)],
				usos: [{ tipo: "skill", mudancas: [["roll", 4]], nome: "Ayleth: +4 (uma vez por cena)" }],
				texto: "+2 em ataque e Defesa, reduzidos para +1 enquanto está ferida. Uma vez por cena, +4 em um teste à escolha do personagem."
			},
			veterano: {
				substitui: true, fixos: [ataque(4), defesa(2)],
				usos: [{ tipo: "skill", mudancas: [["roll", 4]], nome: "Ayleth: +4 (uma vez por cena)" }],
				texto: "Depois da cena da espada: +4 em ataque e, uma vez por rodada, 3 PM para um ataque corpo a corpo extra. Uma vez por aventura, Augúrio sem gastar PM (conselho do Barão Abelard). Mantém +2 na Defesa e o +4 por cena."
			},
			mestre: {
				tipos: [["combatente", "mestre"]], fixos: [defesa(2)],
				usos: [{ tipo: "skill", mudancas: [["roll", 4]], nome: "Ayleth: +4 (uma vez por cena)" }],
				texto: "Combatente mestre que também dá +2 na Defesa e, uma vez por cena, +4 em um teste à escolha do personagem."
			}
		}
	},
	{
		id: "kadeen", nome: "Kadeen", arco: A1, aventura: "Aventura 5", pagina: 85, ator: "MIoTNSIqrpGjH8lH",
		tipos: [], nivel: "veterano",
		resumo: "O bardo. Quem fez o dueto com Ayleth passa em Atuação CD 20 contando a jornada do grupo.",
		evolucao: "Mestre quando os heróis chegam ao 11º nível (bônus sobem para +4).",
		especial: {
			veterano: { fixos: pericias(["atua", "conh"], 2), texto: "+2 em Atuação e Conhecimento e +2 pontos de mana." },
			mestre: { fixos: pericias(["atua", "conh"], 4), texto: "+4 em Atuação e Conhecimento e pontos de mana extras (o livro não diz se os +2 PM também sobem)." }
		}
	},
	{
		id: "kasumi", nome: "Kasumi", arco: A1, aventura: "Aventura 5", pagina: 87, ator: "Fck68nL4KzNBXczb",
		tipos: ["combatente"], nivel: "mestre",
		resumo: "Se ainda estiver de pé na luta do armazém, passa para o lado do grupo contra o Clã da Lótus. Só nessa luta."
	},
	{
		id: "nargom", nome: "Nargom Mandíbula", arco: A1, aventura: "Aventura 6 e 14", pagina: 99, ator: "TvONKDbT6iVC6Kua",
		tipos: [], nivel: "iniciante",
		rotulos: { iniciante: "Aventura 6 (veterano)", veterano: "Aventura 14 (combatente veterano)", mestre: "Aventura 14 (combatente mestre)" },
		resumo: "Capitão do navio que leva o grupo a Karst.",
		notas: "Sempre que o grupo entra em combate, há 50% de chance de ele sumir misteriosamente (volta depois com uma desculpa).",
		especial: {
			iniciante: { fixos: [...pericias(["enga", "pilo"], 2), ...resistencias(2)], texto: "+2 em Enganação, Pilotagem e testes de resistência. Uma vez por rodada dá bônus de flanquear em um ataque." },
			veterano: { tipos: [["combatente", "veterano"]], fixos: [...pericias(["enga", "pilo"], 2), ...resistencias(2)], texto: "Na Aventura 14, com Espinha vivo, luta de verdade como combatente veterano." },
			mestre: { tipos: [["combatente", "mestre"]], fixos: pericias(["acro", "enga", "pilo"], 4), texto: "Depois de liquidarem Espinha: combatente mestre que participa dos combates e dá +4 em Acrobacia, Enganação e Pilotagem." }
		}
	},
	{
		id: "syphus", nome: "Senhor Porrada (Syphus)", arco: A1, aventura: "Aventura 6", pagina: 101, ator: "DRE6HqfRAPUlUzYc",
		tipos: ["fortao"], nivel: "mestre",
		resumo: "Clérigo orc de Keenn encontrado nos ermos. Junta-se ao grupo se ele tiver até dois aliados; com mais, Diplomacia CD 20."
	},
	{
		id: "lothar", nome: "Lothar Algherulff", arco: A1, aventura: "Aventuras 6 e 15", pagina: 103, ator: "trlK3orQEx12qp1Y",
		tipos: ["guardiao", "ajudante"], nivel: "iniciante",
		rotulos: { iniciante: "Arco 1", veterano: "Aventura 15 (barão)", mestre: "Aventura 15 (com Carthalkan)" },
		resumo: "Tratar suas feridas depois do gigante (teste estendido de Cura CD 25); o número de sucessos define quando ele se junta.",
		notas: "Segue um código de honra. Doma Trebuchet se ninguém o fizer. O livro não diz as perícias do ajudante.",
		especial: {
			iniciante: { substitui: true, fixos: [defesa(2)], texto: "+2 na Defesa e permite usar Golpe Divino como um paladino de 1º nível (se já tiver o poder, custa –1 PM)." },
			veterano: { tipos: [["guardiao", "veterano"], ["ajudante", "iniciante"]], texto: "Como barão, com o golenzinho Pimp: guardião veterano e ajudante iniciante." },
			mestre: { tipos: [["guardiao", "mestre"], ["ajudante", "veterano"]], texto: "Persuadido a empunhar Carthalkan (Diplomacia CD 25): guardião mestre e ajudante veterano." }
		}
	},
	{
		id: "trebuchet", nome: "Trebuchet", arco: A1, aventura: "Aventura 7", pagina: 111,
		tipos: ["montaria"], nivel: "mestre",
		resumo: "Cavalo indomável: teste estendido (2 de Adestramento e o último de Cavalgar). Obedece só a quem o domou.",
		notas: "Se o cavaleiro sofrer dano que o mataria, Trebuchet o arremessa e morre no lugar; se ele ficar inconsciente, leva-o para longe do perigo.",
		especial: {
			mestre: {
				fixos: [deslocamento(15), ["system.modificadores.ataque.cac", 2]],
				texto: "Cavalo mestre: deslocamento 15m, posição elevada (+2 em ataques corpo a corpo) e duas ações de movimento extras por turno (só para se deslocar)."
			}
		}
	},
	{
		id: "alyssa", nome: "Lady Alyssa", arco: A1, aventura: "Aventura 7", pagina: 116, ator: "QyfaH4GPzL2AtsPM",
		tipos: [], nivel: "mestre",
		resumo: "Convencê-la a se render (Diplomacia ou perícia social contra a Vontade dela, com atitude ao menos inamistosa).",
		especial: {
			mestre: {
				fixos: pericias(["inic", "perc", "refl"], 2),
				usos: [danoUso("1d12")],
				texto: "+2 em Iniciativa, Percepção e Reflexos, +1d12 em uma rolagem de dano à distância por rodada e +1 na margem de ameaça de ataques à distância."
			}
		}
	},

	/* ---------------- Interlúdio ---------------- */
	{
		id: "iskandor", nome: "Iskandor", arco: INT, aventura: "Piratas de Khubar", pagina: 139, ator: "PdciXTWAnXFwppgY",
		tipos: ["fortao"], nivel: "veterano",
		resumo: "Acompanha o grupo só durante Piratas de Khubar, para enfrentar Typhonn."
	},

	/* ---------------- Arco 2 ---------------- */
	{
		id: "shivara", nome: "Rainha-imperatriz Shivara I", arco: A2, aventura: "Aventuras 11 e 19a", pagina: 152, ator: "whpFaTnSmIeEPUHG",
		tipos: [], nivel: "mestre",
		resumo: "Parceira de quem tiver mais afinidade com ela (ou de um paladino) na luta contra os trolls; volta contra Mizra.",
		especial: {
			mestre: {
				fixos: [defesa(4), atributo("car", 9)],
				texto: "Defesa +4; em Diplomacia, Guerra, Nobreza e Vontade rola dois dados e usa o melhor; soma o Carisma dela (9) ao seu; uma vez por rodada, ao agredir, 3 PM para um ataque adicional. No início de cada combate, você e aliados em alcance médio recebem +5 em testes de perícia e 2d6 PM temporários. Na Aventura 11, +10 PV temporários por sucesso na cena 4."
			}
		}
	},
	{
		id: "dondala", nome: "Dondala", arco: A2, aventura: "Aventura 11", pagina: 155, ator: "gopq13d1Jo7XFiSE",
		tipos: [], nivel: "veterano",
		resumo: "Acompanha os heróis pelo complexo finntroll.",
		especial: {
			veterano: {
				usos: [{ tipo: "skill", mudancas: [["roll", 4]], nome: "Dondala: +4 no subterrâneo (Percepção e Sobrevivência)" }],
				texto: "+4 em Percepção e Sobrevivência no subterrâneo, 20 PM adicionais e as magias Armadura Arcana, Flecha Ácida e Controlar Terra (com seu atributo-chave; sem um, Sab)."
			}
		}
	},
	{
		id: "anao-guia", nome: "Recruta anão (guia)", arco: A2, aventura: "Aventura 11", pagina: 157,
		tipos: ["perseguidor"], nivel: "iniciante",
		resumo: "Diplomacia CD 30 na Subguilda de Exploradores, em Thanzar.",
		notas: "Os bônus dele são dobrados no subterrâneo."
	},
	{
		id: "tropas-feudais", nome: "Tropas Feudais", arco: A2, aventura: "Aventura 12", pagina: 164,
		tipos: [], nivel: "veterano",
		resumo: "Batalha de Svalas. Conta como parceiro veterano de um personagem, mas o benefício vale para todo o grupo.",
		especial: { veterano: { texto: "Cada personagem faz um ataque adicional ao usar a ação agredir." } }
	},
	{
		id: "aldeoes-svalanos", nome: "Aldeões Svalanos", arco: A2, aventura: "Aventura 12", pagina: 164,
		tipos: [], nivel: "veterano",
		resumo: "Batalha de Svalas. Conta como parceiro veterano de um personagem, mas o benefício vale para todo o grupo.",
		especial: { veterano: { texto: "Cada personagem recebe +2 em uma perícia à sua escolha." } }
	},
	{
		id: "tropas-osteon", nome: "Tropas Osteon", arco: A2, aventura: "Aventura 12", pagina: 164,
		tipos: [], nivel: "veterano",
		resumo: "Só se os mortos-vivos da Floresta de Svalas foram recrutados antes. O benefício vale para todo o grupo.",
		especial: { veterano: { texto: "Concedem redução de dano 5 aos personagens." } }
	},
	{
		id: "taulin", nome: "Taulin", arco: A2, aventura: "Aventura 13a", pagina: 178,
		tipos: ["combatente"], nivel: "iniciante",
		resumo: "Ajuda a segurar os puristas enquanto a vila foge.",
		notas: "Use a regra de parceiros vulneráveis (Tormenta20, p. 262)."
	},
	{
		id: "ellete", nome: "Ellete", arco: A2, aventura: "Aventura 13a", pagina: 178,
		tipos: ["medico"], nivel: "iniciante",
		resumo: "Irmã de Taulin, abençoada por Lena; junta-se a ele se o grupo aceitar a ajuda.",
		notas: "Use a regra de parceiros vulneráveis (Tormenta20, p. 262)."
	},
	{
		id: "knox", nome: "Knox Quíron", arco: A2, aventura: "Aventura 13b", pagina: 193, ator: "5FK7unjMfLk5qLwy",
		tipos: [], nivel: "veterano",
		resumo: "Ajuda o grupo se ele somar mais de 31 sucessos no salvamento.",
		especial: {
			veterano: {
				fixos: pericias(["cava", "perc", "sobr"], 2),
				texto: "+2 em Cavalgar, Percepção e Sobrevivência, e +2 em testes de resistência enquanto montado."
			}
		}
	},
	{
		id: "namalkah", nome: "Cavalo de Namalkah", arco: A2, aventura: "Aventura 13b", pagina: 195,
		tipos: ["montaria"], nivel: "veterano", tamanho: "Grande",
		resumo: "Domar o Corcel Indomável (Adestramento CD 30 e teste estendido CD 25); com mais de 31 sucessos no salvamento, cada herói ganha um.",
		especial: {
			iniciante: { fixos: [deslocamento(15)], texto: "Deslocamento 15m e uma ação de movimento extra por turno (só para se deslocar)." },
			veterano: { fixos: [deslocamento(18), ["system.modificadores.ataque.cac", 2]], texto: "Deslocamento 18m, +2 em ataques corpo a corpo e uma ação de movimento extra por turno." },
			mestre: {
				fixos: [deslocamento(18), ["system.modificadores.ataque.cac", 2]], usos: [danoUso("2d6")],
				texto: "Como veterano, duas ações de movimento extras por turno e, uma vez por rodada, +2d6 em uma rolagem de dano corpo a corpo."
			}
		}
	},
	{
		id: "grifos", nome: "Grifo dos Montes Nublados", arco: A2, aventura: "Aventura 13b", pagina: 200,
		tipos: ["montaria"], nivel: "veterano",
		resumo: "Montaria do voo com Zallia e da batalha aérea. Para cavalgar, treinado em Adestramento, Acrobacia e Cavalgar.",
		especial: {
			iniciante: { fixos: [defesa(1)], usos: [danoUso("1d6")], texto: "+1 na Defesa e, uma vez por rodada, +1d6 em uma rolagem de dano corpo a corpo (filhote: não serve de montaria)." },
			veterano: { fixos: [defesa(1), deslocamento(18, "fly")], usos: [danoUso("1d6")], texto: "Como iniciante, e pode ser montado: voo 18m." },
			mestre: { fixos: [defesa(2), deslocamento(18, "fly")], usos: [danoUso("1d8")], texto: "Defesa +2, +1d8 de dano corpo a corpo uma vez por rodada, voo 18m e uma ação de movimento extra por turno." }
		}
	},
	{
		id: "serpes", nome: "Serpe do Bosque dos Centauros", arco: A2, aventura: "Aventura 13b", pagina: 204,
		tipos: ["montaria"], nivel: "veterano",
		resumo: "Montaria escolhida para a batalha aérea contra as aeronaves puristas.",
		especial: {
			iniciante: { texto: "Uma vez por rodada, ao causar dano com um ataque, o alvo perde 1d12 PV por veneno (filhote: não serve de montaria)." },
			veterano: { fixos: [deslocamento(18, "fly")], texto: "Veneno 1d12 uma vez por rodada; pode ser montada: voo 18m." },
			mestre: { fixos: [deslocamento(18, "fly")], texto: "Como veterano e, uma vez por rodada, 5 PM para um ataque corpo a corpo extra." }
		}
	},
	{
		id: "gargulas", nome: "Gárgula do Templo Hippionte", arco: A2, aventura: "Aventura 13b", pagina: 205,
		tipos: ["montaria"], nivel: "veterano",
		resumo: "Montaria escolhida para a batalha aérea contra as aeronaves puristas.",
		especial: {
			iniciante: { fixos: [deslocamento(12, "fly")], texto: "Voo 12m e uma ação de movimento extra por turno (só para se deslocar)." },
			veterano: { fixos: [deslocamento(15, "fly")], texto: "Voo 15m, ação de movimento extra e redução de dano 2." },
			mestre: { fixos: [deslocamento(15, "fly")], texto: "Voo 15m, ação de movimento extra e redução de dano 5." }
		}
	},
	{
		id: "hippion", nome: "Hippion", arco: A2, aventura: "Aventura 13b", pagina: 205, ator: "2gZNUWNoD5YF0LOE",
		tipos: ["montaria"], nivel: "mestre", tamanho: "Grande",
		resumo: "Deixa-se montar por quem emparelhou com ele na corrida (exige o poder Ginete ou o poder concedido de Hippion). Vai embora ao fim da batalha.",
		especial: {
			mestre: { fixos: [deslocamento(24), atributo("for", 10)], texto: "Deslocamento 24m, duas ações de movimento extras por turno (só para se deslocar) e soma a Força de Hippion à sua (+10)." }
		}
	},
	{
		id: "calienna", nome: "Calienna", arco: A2, aventura: "Aventura 14", pagina: 230, ator: "xyRNnMmlqF10SJJA",
		tipos: ["combatente"], nivel: "veterano",
		resumo: "Elfa perseguida por soldados golens; ajuda assim que o grupo intervém (só nesse combate, ferida)."
	},

	/* ---------------- Arco 3 ---------------- */
	{
		id: "aeripharian", nome: "Aeripharian", arco: A3, aventura: "Aventura 17", pagina: 295, ator: "kJ5WnKCnvBgD6oca",
		tipos: ["magivocador", "ajudante"], nivel: "veterano", pericias: ["conh", "mist", "ofic"],
		resumo: "Parte com o grupo para resgatar Shivara.",
		notas: "Ofício (alquimista)."
	},
	{
		id: "glong", nome: "Glong", arco: A3, aventura: "Aventura 17", pagina: 299,
		tipos: ["ajudante"], nivel: "veterano", pericias: ["ofic", "pilo"],
		resumo: "Ajuda a energizar a matriz (–2 PM); Diplomacia CD 30 para acompanhar a jornada pelo éter.",
		notas: "Ofício (alquimista e artesão) e Pilotagem — o terceiro bônus é outro Ofício."
	},
	{
		id: "amrynn", nome: "Amrynn", arco: A3, aventura: "Aventura 17", pagina: 302, ator: "5jwccmGS4OKYOOOg",
		tipos: ["magivocador", "ajudante"], nivel: "mestre", pericias: ["conh", "mist", "pilo"],
		resumo: "Se o grupo escolher reparação em vez de punição, junta-se à luta contra os puristas.",
		especial: { mestre: { tipos: [["magivocador", "mestre"], ["ajudante", "veterano"]] } }
	},
	{
		id: "drannor", nome: "Drannor Divinauta", arco: A3, aventura: "Aventura 18", pagina: 311, ator: "esIXLmp7QY5FqKHs",
		tipos: ["medico", "atirador"], nivel: "veterano",
		rotulos: { veterano: "Médico mestre + atirador veterano", mestre: "Médico + atirador mestres (braço curado)" },
		resumo: "Resgatado à deriva no éter. Estende a suspensão cronomântica ao personagem (dispensa o escafandro).",
		evolucao: "Atirador mestre se sobreviver ao Fantasma de Aço e curarem o braço decepado.",
		especial: {
			iniciante: { tipos: [["medico", "mestre"], ["atirador", "veterano"]] },
			veterano: { tipos: [["medico", "mestre"], ["atirador", "veterano"]] },
			mestre: { tipos: [["medico", "mestre"], ["atirador", "mestre"]] }
		}
	},
	{
		id: "amazonas", nome: "Amazona de Odisseia", arco: A3, aventura: "Aventura 18", pagina: 312,
		tipos: ["guardiao", "combatente"], nivel: "veterano",
		resumo: "Aede, Phoebe, Niobe, Laodice e Merope: Diplomacia CD 25 e T$ 20.000 no Tavernáculo do Nyliann. Cada uma é uma parceira.",
		notas: "Para dar várias amazonas, use “Dar ao herói” uma vez e copie o poder para os outros heróis."
	},
	{
		id: "qinalla", nome: "Qinalla", arco: A3, aventura: "Aventura 19a", pagina: 322,
		tipos: ["combatente"], nivel: "mestre",
		resumo: "Convencê-la de que os heróis podem acabar com Krazag (Diplomacia ou Intimidação CD 30). Só em Chacina.",
		especial: { mestre: { texto: "Também dá +4 em testes para agarrar." } }
	},
	{
		id: "exotropa", nome: "Exotropa Svalana", arco: A3, aventura: "Aventura 19b", pagina: 337,
		tipos: ["combatente"], nivel: "mestre",
		resumo: "Surge na Cena 7 se as vítimas do ritual de Wortric foram para Sombria. Conta como combatente mestre para até dois personagens.",
		notas: "Para dar a dois heróis, copie o poder para o segundo."
	}
];
