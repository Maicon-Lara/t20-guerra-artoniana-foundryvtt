// Dados das batalhas em massa de Jornada Heroica: Guerra Artoniana (Apêndice B e capítulos de cada batalha).
// "ficha" = _id do ator no compêndio "personagens" (o mesmo id fica no mundo quando a aventura é importada).
// Sem "ficha", o painel procura um ator com o mesmo nome no mundo e depois no compêndio.
// "sistema" = nome da ficha no compêndio Ameaças do sistema Tormenta20 (livro básico).
// "aproximada" = a ficha ligada é a versão base; os valores da tabela da batalha valem mais.

export const TAMANHOS = {
	escaramuca: { nome: "Escaramuça", cd: 20, limiar: 20, vitoria: 5 },
	pequena: { nome: "Batalha pequena", cd: 25, limiar: 50, vitoria: 8 },
	media: { nome: "Batalha média", cd: 30, limiar: 50, vitoria: 10 },
	grande: { nome: "Batalha grande", cd: 35, limiar: 50, vitoria: 15 },
	epica: { nome: "Batalha épica", cd: 40, limiar: 100, vitoria: 20 }
};

// Ordem do campo: do mais seguro para o mais perigoso.
export const POSICOES = [
	{ id: "acampamento", nome: "Acampamento", mod: -10 },
	{ id: "retaguarda", nome: "Retaguarda", mod: 0 },
	{ id: "front", nome: "Front", mod: 5 },
	{ id: "atras", nome: "Atrás das linhas inimigas", mod: 10 }
];

export const MECANICAS = {
	semTeste: "Sem teste.",
	pericia: "Teste de perícia (CD {cd}) feito por um herói à escolha do grupo; os outros podem ajudar. Se passar: +2 ao general.",
	atacar: "Atacar: cada herói tem uma rodada de combate; some o dano causado. Para cada ataque que errar, o herói sofre um ataque do inimigo.",
	atacar2: "Atacar contra dois: como Atacar, mas o herói que sofrer dano do inimigo sofre dano dobrado.",
	defender: "Defender: os inimigos atacam. Cada ataque que errar (ou resistência em que o herói passar) faz o herói causar o dano de uma rodada de combate, que soma para o bônus.",
	defender2: "Defender contra dois: como Defender, mas cada inimigo causa o dobro de dano.",
	atacarPericia: "Atacar, e um herói pode trocar o ataque por um teste de {pericia} (CD {cd}). Se passar: +2 ao general, somado ao bônus por dano.",
	combate: "Resolva com as regras normais de combate."
};

// Tabela B-5. "ate" = limite superior da faixa (o último evento cobre 29 ou mais).
export const EVENTOS = [
	{ id: "curandeiro", ate: 2, nome: "Curandeiro", mecanica: "semTeste",
		texto: "O grupo encontra curandeiros aliados. Cada personagem recupera 1d8+1 PV e 1 PM por patamar (um veterano recupera 2d8+2 PV e 2 PM)." },
	{ id: "ordens", ate: 4, nome: "Levar ordens", mecanica: "pericia", pericia: "Atletismo (Cavalgar se montado, Pilotagem se em veículo)",
		texto: "O grupo precisa levar ordens a uma unidade aliada." },
	{ id: "erguer", ate: 6, nome: "Erguer estandarte", mecanica: "semTeste", estandarte: true,
		texto: "Um estandarte aliado caiu. Um herói pode erguê-lo e segurá-lo: +2 nos testes do general enquanto o segurar, mas vira alvo (nos próximos eventos, ataques contra ele recebem +5 e a CD de efeitos inimigos contra ele aumenta em +5)." },
	{ id: "manter", ate: 10, nome: "Manter posição", mecanica: "defender", combate: true,
		texto: "Os heróis precisam defender um ponto estratégico." },
	{ id: "quebrar", ate: 14, nome: "Quebrar formação", mecanica: "atacar2", combate: true,
		texto: "Os heróis precisam atacar uma formação inimiga." },
	{ id: "ferido", ate: 16, nome: "Resgatar aliado ferido", mecanica: "atacarPericia", pericia: "Cura", combate: true,
		texto: "Um aliado importante, como um oficial, está caído, ferido e cercado. Um herói pode, em vez de atacar, tentar curá-lo." },
	{ id: "interceptar", ate: 18, nome: "Interceptar ordens", mecanica: "atacarPericia", pericia: "Acrobacia, Atletismo, Cavalgar ou Pilotagem", combate: true,
		texto: "Um mensageiro inimigo leva ordens para as tropas. Um herói pode, em vez de atacar, tentar alcançá-lo e impedir a entrega." },
	{ id: "isca", ate: 20, nome: "Servir de isca", mecanica: "defender2", combate: true,
		texto: "O grupo precisa atrair inimigos para uma posição específica." },
	{ id: "livre", ate: 22, nome: "Ataque livre", mecanica: "atacar", danoDobrado: true, combate: true,
		texto: "O grupo se aproxima de um oficial inimigo. Um personagem, à escolha do grupo, ataca o líder (Defesa +5, causa dano dobrado). Todo dano causado no líder conta em dobro para o bônus de Guerra." },
	{ id: "capturar", ate: 24, nome: "Capturar estandarte", mecanica: "atacar2", estandarte: true, combate: true,
		texto: "O grupo se aproxima de um estandarte inimigo. Após os ataques, um herói pode capturá-lo: +2 nos testes do general enquanto o segurar, mas vira alvo (+5 nos ataques e +5 na CD de efeitos inimigos contra ele)." },
	{ id: "capitao", ate: 28, nome: "Enfrentar capitão", mecanica: "atacar2", capitao: true, combate: true,
		texto: "Um oficial inimigo e seus guarda-costas. O oficial também ataca um personagem escolhido pelo mestre; o dano que ele causar é descontado do dano dos heróis. Se o bônus por dano chegar a +2, ganha mais +2." },
	{ id: "general", ate: Infinity, nome: "Enfrentar general", mecanica: "combate", general: true, combate: true,
		texto: "O grupo começa em alcance curto do general inimigo, que tem dois guarda-costas da tabela do exército por personagem. Derrotar o general dá 1d4+1 pontos de vitória; um oficial assume (Guerra do anterior –1d6–1, salvo indicação da aventura). Às vezes leva a uma tenda de comando com desafios antes do general." }
];

const DANCARINO = { nome: "Dançarino de guerra veterano", def: 28, res: "Fort +12, Ref +16, Von +8, evasão, imunidade a medo, resistência a movimento +5", ataque: "Dois machados de batalha +20 (3d8+15, 19/x3)" };
const ASSALTO_ELITE = { nome: "Grupo de assalto de elite", def: 28, res: "Fort +17, Ref +12, Von +7", ataque: "Espada bastarda +22 (2d12+20, 19, dobro de dano se acertar por 10 ou mais)" };
const GINETE = { nome: "Ginete purista veterano", def: 31, res: "Fort +14, Ref +20, Von +7, evasão", ataque: "Lança montada x2 +24 (3d8+14, x3)" };
const CACADOR = { nome: "Caçador de impuros", def: 34, res: "Fort +4, Ref +17, Von +9", ataque: "Besta leve x2 +23 (1d8+10, 19)" };
const GOLEM = { nome: "Golem de reconhecimento", def: 26, res: "Fort +13, Ref +17, Von +7, imunidade a eletricidade, RD 10", ataque: "Besta embutida x2 +26 (2d10+18, 19, alcance médio)" };
const BLINDADA_ELITE = { nome: "Companhia blindada de elite", def: 36, res: "Fort +17, Ref +8, Von +16, RD 5/mágico", ataque: "Martelo de guerra x2 +27 (2d8+12, x3, dobro de dano se acertar por 10 ou mais)" };
const LEOPARDO = { nome: "Cavaleiro do Leopardo Sangrento", def: 36, res: "Fort +21, Ref +11, Von +17, imunidade a medo, RD 5", ataque: "Espada bastarda +28 (3d6+15, 19, mais 8d8+8 eletricidade); faz dois testes de ataque e usa o melhor" };
const SERPE = { nome: "Cavaleiro de serpe", def: 41, res: "Fort +18, Ref +24, Von +11, evasão, imunidade a medo", ataque: "Lança montada x2 +34 (3d8+30, x3) e ferrão +34 (2d12+30, x3)" };
const MESTRE_CACADOR = { nome: "Mestre caçador de impuros", def: 39, res: "Fort +11, Ref +24, Von +18, evasão", ataque: "Besta leve x2 +31 (2d8+20, 19, mais 4d8 ácido)" };
const COMANDANTE = { nome: "Comandante do Leopardo Sangrento", def: 43, res: "Fort +26, Ref +12, Von +20, imunidade a medo, RD 10", ataque: "Espada bastarda +37 (3d12+30, 19, mais 12d8+12 eletricidade); faz dois testes de ataque e usa o melhor" };
const GOLEM_ASSALTO = { nome: "Golem de assalto avançado", def: 42, res: "Fort +26, Ref +20, Von +12, imunidade a eletricidade, RD 10", ataque: "Besta embutida x2 +36 (4d12+30, 19, mais 4d6 fogo, alcance médio)" };
const BLINDADO_PESADO = { nome: "Cavaleiro blindado pesado", def: 44, res: "Fort +24, Ref +17, Von +30, imunidade a medo, RD 10", ataque: "Espada bastarda x2 +47 (4d12+60, 19/x3, mais 4d8 eletricidade) e escudo pesado +47 (4d6+60)" };
const COLOSSO = { nome: "Colosso supremo", def: 46, res: "Fort +31, Ref +19, Von +20, RD 10, resistência a magia +5", ataque: "Espada titânica +39 (4d12+30, 19) e duas balistas +39 (6d8, 19, alcance médio)" };

const com = (base, ficha) => ({ ...base, ficha });

export const BATALHAS = [
	{
		id: "karst", nome: "Batalha de Karst", aventura: "Aventura 3 (Arco 1)", tamanho: "escaramuca",
		zonas: { acampamento: "Dentro do castelo", retaguarda: "Pátio do castelo", front: "Muros do castelo", atras: "No meio do exército purista" },
		aliado: { nome: "Barão Abelard", guerra: 19, detalhe: "+12 base, +5 castelo, +2 defendendo sua terra natal", substituto: { nome: "Lady Ayleth", guerra: 8 } },
		inimigo: { nome: "Reggar Wortric", guerra: 29, detalhe: "+17 base, +10 superioridade numérica, +2 tropas de melhor qualidade", substituto: { nome: "Lady Alyssa", guerra: 10 } },
		rodadasMax: 5,
		notas: "A cena termina no fim da 5ª rodada (os plebeus embarcam) ou se Reggar chegar a 10 pontos de vitória, o que causa muitas mortes e –2 em todos os testes de perícia dos personagens até o fim da aventura.",
		opcoes: [
			{ id: "loras", rotulo: "Loras foi recrutado (eventos no acampamento são sempre Curandeiro)", curandeiroNoAcampamento: true },
			{ id: "lasus", rotulo: "Lasus foi recrutado (Wortric começa com –1 ponto de vitória)", pvInimigo: -1 }
		],
		inimigos: [
			com({ nome: "Goblin", def: 13, res: "Fort +2, Ref +3, Von –1", ataque: "Duas adagas +7 (1d4, 19)" }, "0QVu9SxIT7BFnzBy"),
			com({ nome: "Bandido preso", def: 13, res: "Fort +1, Ref +3, Von –1", ataque: "Clava +7 (1d6+3)" }, "wChzNq9mB427gEHn"),
			{ nome: "Recruta purista", def: 16, res: "Fort +6, Ref +2, Von +0", ataque: "Alabarda +8 (1d10+5, x3)" },
			com({ nome: "Soldado purista", def: 20, res: "Fort +10, Ref +4, Von +1", ataque: "Espada bastarda +9 (1d10+9, 19)" }, "vGRXgiIQkVGsKbOm"),
			com({ nome: "Grupo de assalto alabardeiro", def: 18, res: "Fort +10, Ref +4, Von +1", ataque: "Alabarda +12 (2d8+9, 19)" }, "Fz6Jf7kLEaPm8ECO"),
			{ nome: "Sargento-mor", def: 24, res: "Fort +14, Ref +9, Von +5", ataque: "Espada bastarda +14 (1d12+15, 19)" }
		]
	},
	{
		id: "svalas", nome: "Batalha de Svalas", aventura: "Aventura 12 (Arco 2)", tamanho: "media",
		zonas: { acampamento: "Topo da colina", retaguarda: "Linhas traseiras das tropas svalanas", front: "Parede de escudos, ao pé da colina", atras: "Vale, no meio do exército purista" },
		aliado: { nome: "Rainha Ayleth", guerra: 17, detalhe: "+11 base, +2 defendendo terra natal, +2 terreno favorável, +2 tropas motivadas", substituto: { nome: "Nobre menor", guerra: 8 } },
		inimigo: { nome: "Leon Jäger", guerra: 23, detalhe: "+16 base, +5 superioridade numérica, +2 tropas de melhor qualidade", substituto: { nome: "Capitão-Baluarte", guerra: 7 } },
		notas: "Ao mesmo tempo, Karst é atacada: resolva com as batalhas simplificadas de domínio (destacamento purista com Poder 15, sargento-mor com Guerra +15).",
		inimigos: [
			com(DANCARINO, "Q5L6oQrqXS93D5Z5"),
			com(ASSALTO_ELITE, "z5jtp36NKBWq0ZH5"),
			com({ nome: "Soldado blindado veterano", def: 34, res: "Fort +16, Ref +7, Von +15, RD 5/mágico", ataque: "Martelo de guerra +23 (2d8+18, x3)" }, "U0u5wgU3MoU6cKWC"),
			com(CACADOR, "dHViLgYG1YCIyj4f"),
			GOLEM,
			com(BLINDADA_ELITE, "HUlBrNpU2pIlsEVe")
		]
	},
	{
		id: "norm", nome: "Batalha de Norm", aventura: "Aventura 13A (Arco 2)", tamanho: "media",
		zonas: { acampamento: "Pátio do castelo", retaguarda: "Ruas da cidade", front: "Campos ao redor de Norm", atras: "Acampamento dos mercenários" },
		aliado: { nome: "Sir Alenn Toren", guerra: 28, detalhe: "+22 base, +2 defendendo terra natal, +2 tropas de melhor qualidade, +2 personalidade presente", substituto: { nome: "Cavaleiro", guerra: 4 } },
		inimigo: { nome: "Harghan Trozik", guerra: 32, detalhe: "+20 base, +10 superioridade numérica, +2 personalidade presente", substituto: { nome: "Condotiero", guerra: 11 } },
		notas: "Se o grupo foi salvar Roschfallen, role só os testes dos generais.",
		opcoes: [{ id: "aramur", rotulo: "O Duque de Aramur marchou para Norm (mercenários perdem +10 de superioridade numérica)", guerraInimigo: -10 }],
		inimigos: [
			com({ nome: "Ogro caçador", def: 29, res: "Fort +20, Ref +14, Von +4, metade do dano de corte, impacto e perfuração", ataque: "Tacape x2 +24 (3d6+21)" }, "g0l74uuswYiCCahB"),
			com({ nome: "Centopeia-dragão acorrentada", def: 27, res: "Fort +15, Ref +20, Von +9", ataque: "Mordida +24 (2d8+18 mais 2d6 fogo)" }, "fMI80OLNr8noLA2E"),
			com({ nome: "Gnoll caçador de cabeças", def: 33, res: "Fort +16, Ref +7, Von +15", ataque: "Espada longa x2 +26 (1d8+15, 19) e mordida +26 (1d6+15)" }, "L5wwuLUkJ2xDyiZy"),
			com({ nome: "Quimera acorrentada", def: 33, res: "Fort +21, Ref +15, Von +8", ataque: "Três mordidas +26 (3d12+12)" }, "RJxIErBRA0nxz2Tw"),
			com({ nome: "Trog mercenário", def: 33, res: "Fort +22, Ref +6, Von +16, +1 de dano por dado de dano de frio", ataque: "Machado de guerra +26 (3d6+20, x3) e mordida +26 (2d6+18)" }, "0rpWdeAyk3MlcobX"),
			com({ nome: "Cavaleiro traidor", def: 34, res: "Fort +21, Ref +10, Von +15, RD 5", ataque: "Espada longa x2 +27 (2d8+23, 19)" }, "a9JGqMfz57O59F1l"),
			com({ nome: "Furioso púrpura", def: 31, res: "Fort +21, Ref +15, Von +9, RD 10", ataque: "Machado de batalha x2 +25 (2d12+20, x3)" }, "zd7cDM6lnyEjz0NJ"),
			com({ nome: "Agente do Graath", def: 33, res: "Fort +10, Ref +16, Von +22, resistência a magia +2", ataque: "Espada longa +27 (2d8+30, 19, mais 12d6 trevas)" }, "WwTeYZAKmDzSJAHF")
		]
	},
	{
		id: "hippiontar", nome: "Batalha de Hippiontar", aventura: "Aventura 13B (Arco 2)", tamanho: "grande",
		zonas: { acampamento: "Dentro de Hippiontar", retaguarda: "Redondezas da cidade", front: "Planície", atras: "Acampamento do general" },
		ceus: { nome: "Aeronaves puristas (sob os céus)", mod: 5, cd: 5, bonus: 2, regra: "Só para quem voa, a partir de qualquer posição exceto o acampamento. Rolagem +5, CD das perícias +5 e o bônus de Guerra do evento aumenta em +2." },
		aliado: { nome: "Eliezer Emmet", guerra: 20, detalhe: "+16 base, +2 defendendo terra natal, +2 bando dos Cascos Sangrentos", substituto: { nome: "Ginete", guerra: 4 } },
		inimigo: { nome: "Coronel Henrik Zuraw", guerra: 25, detalhe: "+18 base, +5 superioridade numérica, +2 tropas de melhor qualidade", substituto: { nome: "Capitão-baluarte", guerra: 7 } },
		inimigos: [
			com(DANCARINO, "JM9rIf3I9BepZMNR"),
			ASSALTO_ELITE,
			com(GINETE, "70z7gLEXd8fsscAy"),
			com(CACADOR, "gDv51nFVPsnGyZVo"),
			com(GOLEM, "qpk9uNLiSkMw5ydQ"),
			BLINDADA_ELITE,
			com(LEOPARDO, "cAXZMGgtJ0Fm7XWr"),
			com(SERPE, "16dDqOdXP8VLt29V")
		]
	},
	{
		id: "zakharin", nome: "Batalha de Zakharin", aventura: "Aventura 13C (Arco 2)", tamanho: "grande",
		zonas: { acampamento: "Dentro do castelo", retaguarda: "Ruas da cidade", front: "Muralhas da capital", atras: "Planície em frente à cidade" },
		aliado: { nome: "Rei Walfengarr Roggandin", guerra: 24, detalhe: "+18 base, +2 defendendo terra natal, +2 personalidade presente", substituto: { nome: "Cavaleiro", guerra: 4 } },
		inimigo: { nome: "Khand Bierhoff III", guerra: 26, detalhe: "+22 base, +2 superioridade numérica, +2 tropas motivadas, +2 personalidade presente, –2 resistência", substituto: { nome: "Khand Bierhoff IV", guerra: 14 } },
		notas: "Substituto alternativo do inimigo: Capitão-baluarte (Guerra +7). Sem Khand Bierhoff III não há bônus de personalidade.",
		inimigos: [
			DANCARINO,
			com(ASSALTO_ELITE, "X5odZSS3jvEzq6Cq"),
			GINETE,
			com(CACADOR, "tvztJtNxvQ5KOP7V"),
			com(GOLEM, "8B2PEmTUTVD9rogw"),
			com(BLINDADA_ELITE, "jIS3PtQUThJ2c4JD"),
			com(LEOPARDO, "7hzbIIR6yZVGPgGJ"),
			com(SERPE, "IPOo7Ykl4c0eXtKc")
		]
	},
	{
		id: "iorvaen-leste", nome: "Iörvaen — Arsenal do Leste", aventura: "Aventura 16 (Arco 2)", tamanho: "epica",
		zonas: { acampamento: "Acampamento aliado", retaguarda: "Junto às linhas aliadas", front: "Planície", atras: "Acampamento inimigo" },
		aliado: { nome: "General da Aliança", guerra: 22, detalhe: "Depende dos reinos da Aliança do Reinado (ex.: Sir Alenn Toren +22, Rainha Zallia +19, Rei Walfengarr +18, Magister Gerland +17), mais os bônus de cada reino. Ajuste o valor.", substituto: { nome: "Substituto do reino", guerra: 12 } },
		inimigo: { nome: "Lorde General Vikras Klinsmann", guerra: 31, detalhe: "+22 base, +2 defendendo terra natal, +2 tropas motivadas, +5 tropas de melhor qualidade", substituto: { nome: "Coronel Dietrich Kranz", guerra: 26 } },
		inimigos: [
			com(GINETE, "YkkbHRbrNw11Jtbr"),
			com(GOLEM, "6WSz1Aiefgz7CRpa"),
			com(LEOPARDO, "SvAxWzH3MiFNEZzM"),
			com({ ...SERPE, def: 37, res: "Fort +18, Ref +8, Von +22" }, "kwlKUX8POVVHzPkx"),
			{ nome: "Arcano de guerra veterano", def: 41, res: "Fort +18, Ref +24, Von +11, evasão, imunidade a medo", ataque: "Açoite flamejante x2 (6d8 fogo e fica em chamas, Ref CD 33 reduz à metade)" },
			com({ nome: "Companhia blindada (nome em branco no livro)", def: 41, res: "Fort +11, Ref +24, Von +18, RD 30 contra o primeiro dano da rodada, resistência a magia +5", ataque: "Martelo de guerra x2 +27 (2d8+12, x3)" }, "CCvlJ5cOA80HIvWY"),
			com(MESTRE_CACADOR, "cSiBbPa90sgnuCnb"),
			com(COMANDANTE, "tFaUCLeuQiY1Pc4J")
		]
	},
	{
		id: "iorvaen-primeiro", nome: "Iörvaen — Arsenal Primeiro", aventura: "Aventura 16 (Arco 2)", tamanho: "epica",
		zonas: { acampamento: "Acampamento aliado", retaguarda: "Atrás das linhas aliadas", front: "Planície", atras: "Acampamento inimigo" },
		aliado: { nome: "General da Aliança", guerra: 22, detalhe: "Depende dos reinos da Aliança do Reinado, mais os bônus de cada reino. Ajuste o valor.", substituto: { nome: "Substituto do reino", guerra: 12 } },
		inimigo: { nome: "General Supremo Hermann Von Krauser", guerra: 47, detalhe: "+31 base, +2 defendendo terra natal, +5 mapa bélico, +2 personalidade presente, +5 tropas de melhor qualidade, +2 tropas motivadas", substituto: { nome: "Dama Comandante Lady Mievna Yudennach", guerra: 34 } },
		notas: "Objetivo alternativo: chegar atrás das linhas inimigas e ficar uma rodada lá; no fim da rodada, um teste de Guerra CD 30 encontra a tenda de Von Krauser (rolar Enfrentar general atrás das linhas também encontra). Na tenda, vá para a Cena 4: os testes dos generais ficam suspensos até a luta contra Von Krauser.",
		opcoes: [{ id: "mapa", rotulo: "O mapa bélico foi roubado (Von Krauser perde +5)", guerraInimigo: -5 }],
		inimigos: [
			com({ nome: "Companhia blindada veterana", def: 36, res: "Fort +17, Ref +8, Von +16, RD 5/mágico", ataque: "Martelo de guerra x2 +27 (2d8+12, x3, dobro de dano se acertar por 10 ou mais)" }, "89Iz8NXquWTD5G5c"),
			{ nome: "Companhia blindada de elite", def: 38, res: "Fort +19, Ref +9, Von +18, RD 5/mágico", ataque: "Martelo de guerra x2 +29 (2d8+15, x3, dobro de dano se acertar por 10 ou mais)" },
			com({ nome: "Artilharia alquímica", def: 37, res: "Fort +18, Ref +8, Von +22", ataque: "Saraivada fumegante (10d12 fogo, Ref CD 30 reduz à metade)" }, "YV4nSq8MJHqYmU0A"),
			com(SERPE, "16dDqOdXP8VLt29V"),
			MESTRE_CACADOR,
			com(GOLEM_ASSALTO, "yRFCiGVIPXJHqcjT"),
			com(COMANDANTE, "ICDnuCtMyymWTX34"),
			com({ nome: "Artilharia mecanomágica", def: 42, res: "Fort +27, Ref +11, Von +21, RD 10, resistência a magia +2", ataque: "Saraivada elemental (6d12 ácido, 6d12 eletricidade, 6d12 frio, 6d12 fogo, Ref CD 37 reduz à metade)" }, "T9qPvpi8pmZIBQkZ"),
			com(BLINDADO_PESADO, "ItGCeL4wyyXWJFhI"),
			com(COLOSSO, "dciceCkxbotCyRyv")
		]
	},
	{
		id: "valkaria", nome: "Cerco de Valkaria — A Batalha Final", aventura: "Aventura 20 (Arco 3)", tamanho: "epica",
		zonas: { acampamento: "No palácio", retaguarda: "Na cidade", front: "Nas muralhas", atras: "Fora das muralhas" },
		aliado: { nome: "Rainha-Imperatriz Shivara I", guerra: 35, detalhe: "+19 base, +10 muralhas, +2 defendendo terra natal, +2 grupos de aventureiros, +2 personalidade presente", substituto: { nome: "Um regente aliado do grupo", guerra: 15 } },
		inimigo: { nome: "General Supremo Hermann Von Krauser", guerra: 38, detalhe: "+31 base, +2 personalidade presente, +5 tropas de melhor qualidade", substituto: { nome: "Dama Comandante Lady Mievna Yudennach", guerra: 20 } },
		inimigos: [
			{ nome: "Companhia blindada veterana", def: 38, res: "Fort +19, Ref +9, Von +18, RD 5/mágico", ataque: "Martelo de guerra x2 +29 (2d8+15, x3, dobro de dano se acertar por 10 ou mais)" },
			com(SERPE, "16dDqOdXP8VLt29V"),
			MESTRE_CACADOR,
			com(GOLEM_ASSALTO, "Cuh9eIj00obf97yV"),
			com(COMANDANTE, "WUMrmiUG1vhdjFmK"),
			com({ nome: "Artilharia mecanomágica pesada", def: 42, res: "Fort +27, Ref +11, Von +21, RD 10, resistência a magia +2", ataque: "Saraivada elemental (6d12 ácido, 6d12 eletricidade, 6d12 frio, 6d12 fogo, alcance longo, Ref CD 37 reduz à metade)" }, "Ga0HsqWodKXNenWr"),
			com(BLINDADO_PESADO, "sb54gLcqBcj1hNYR"),
			com(COLOSSO, "zR4XpsCaCgXkSC44"),
			com({ nome: "Bastião móvel", def: 48, res: "Fort +33, Ref +21, Von +22, RD 15, resistência a magia +5", ataque: "Quatro balistas +46 (4d12+25, 19, alcance médio)" }, "OavhcxwarfA9qbZ3"),
			com({ nome: "Soldado superior", def: 50, res: "Fort +28, Ref +28, Von +20, imunidade a doenças, efeitos mentais, medo e veneno, redução de corte, impacto e perfuração 15", ataque: "Ataque desarmado x4 +47 (2d12+30, 17/x3)" }, "m5L91dt16RI1gWTC")
		]
	},
	{
		id: "livre", nome: "Batalha personalizada", aventura: "Qualquer", tamanho: "media",
		zonas: { acampamento: "Acampamento", retaguarda: "Retaguarda", front: "Front", atras: "Atrás das linhas inimigas" },
		aliado: { nome: "General aliado", guerra: 15, detalhe: "Ajuste o valor.", substituto: { nome: "Substituto", guerra: 8 } },
		inimigo: { nome: "General inimigo", guerra: 15, detalhe: "Ajuste o valor.", substituto: { nome: "Substituto", guerra: 8 } },
		inimigos: []
	}
];
