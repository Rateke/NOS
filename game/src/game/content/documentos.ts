import type { Documento, Pagina } from '../systems/leitor'

/**
 * O que dá para ler na demo.
 *
 * Nada aqui é o roteiro escrito; são os papéis que essa família deixaria
 * pela casa. Cada pessoa tem a sua letra — o jogador aprende a reconhecer a
 * de Liam, a de Evelyn, a de Lia, a firme de Adrian. E uma quarta letra, a
 * lápis roxo, que aparece onde não devia: nas receitas, no verso da
 * autorização, nas palavras cruzadas, no fim do caderno da bisavó.
 */

// --- Quarto: o diário de Liam -------------------------------------------------

const DIARIO_PAGINAS: Pagina[] = [
  {
    blocos: [
      { texto: 'terça', letra: 'data' },
      { texto: 'Regras pra quando ele chega:', letra: 'liam' },
      { texto: '1. Sapato alinhado na porta, com o bico pra fora.', letra: 'liam' },
      { texto: '2. Nenhum copo na pia. Nem o meu, nem o da Lia.', letra: 'liam' },
      { texto: '3. Se a mãe estiver cansada, eu respondo por ela.', letra: 'liam' },
      { texto: '4. Se a Lia começar, eu mudo de assunto.', letra: 'liam' },
      { texto: '5. Não chorar.', letra: 'liam', riscado: true },
      { texto: '5. Não chorar na frente.', letra: 'liam' },
    ],
  },
  {
    blocos: [
      { texto: 'quinta', letra: 'data' },
      { texto: 'Sonhei de novo com a briga do corredor. Com as palavras certinhas, na ordem.', letra: 'liam' },
      { texto: 'Só que eu estava dormindo quando ela aconteceu. A Lia disse que foi às duas da manhã e que eu não saí do quarto.', letra: 'liam' },
      { texto: 'Então como eu sei o que ele disse?', letra: 'liam' },
      { texto: 'Acordei com raiva. Não sei de quem.', letra: 'liam', respiro: 0.6 },
    ],
  },
  {
    blocos: [
      { texto: 'sábado', letra: 'data' },
      { texto: 'Chegou a carta do concurso de desenho. "A casa que eu queria ter."', letra: 'liam' },
      { texto: 'Eu fiz uma planta com um cômodo a mais. Sempre faço.', letra: 'liam' },
      { texto: 'O pai viu o valor da inscrição e ficou quieto o jantar inteiro. A mãe disse que dava um jeito. Aí começou.', letra: 'liam' },
      { texto: 'Eu disse que não queria ir. Os dois pararam na hora.', letra: 'liam' },
      { texto: 'Viu? Deu certo.', letra: 'liam', respiro: 0.6 },
    ],
  },
  {
    blocos: [
      { texto: 'hoje', letra: 'data' },
      { texto: 'Preciso arrumar meu quarto antes que Adrian chegue.', letra: 'liam' },
      { texto: 'Preciso ser melhor.', letra: 'liam' },
      { texto: 'Se eu ficar quieto, eles não brigam.', letra: 'liam', respiro: 1.2 },
      { texto: 'Se eu ficar no meio, eles param.', letra: 'liam' },
    ],
  },
]

export const DOC_DIARIO: Documento = {
  id: 'diario',
  tipo: 'diario',
  titulo: 'Diário de Liam',
  paginas: DIARIO_PAGINAS,
}

/** Na segunda leitura, a contracapa: um papel dobrado que não estava ali. */
export const DOC_DIARIO_CONTRACAPA: Documento = {
  id: 'diario+',
  tipo: 'diario',
  titulo: 'Diário de Liam',
  paginas: [
    ...DIARIO_PAGINAS,
    {
      segredo: 'bilhete',
      flor: true,
      blocos: [
        { texto: '(colado na contracapa, dobrado em quatro)', letra: 'pequeno' },
        { texto: 'Liam,', letra: 'elisa', respiro: 0.8 },
        { texto: 'Você não precisa ser melhor. Você já é.', letra: 'elisa' },
        { texto: 'Quando a casa apertar, a gente inventa outra. Lembra?', letra: 'elisa' },
        { texto: '— E.', letra: 'elisa', alinhar: 'dir', respiro: 0.6 },
      ],
    },
  ],
}

// --- Sala: o livro de receitas, que guarda as contas -------------------------

export const DOC_RECEITAS: Documento = {
  id: 'receitas',
  tipo: 'livro',
  titulo: 'Livro de receitas',
  paginas: [
    {
      mancha: true,
      blocos: [
        { texto: 'Bolo de fubá', letra: 'titulo' },
        { texto: '3 ovos · 2 xícaras de fubá · 1 de açúcar · 1 de leite · ½ de óleo · 1 colher de fermento.', letra: 'evelyn', respiro: 0.6 },
        { texto: 'Bate tudo. Forno médio, 40 minutos. Não abre o forno antes.', letra: 'evelyn' },
        { texto: 'Forno médio = 180 graus. Eu medi. 40 min exatos.', letra: 'liam', respiro: 0.5 },
        { texto: 'o Liam abriu o forno pra ver kkkkk', letra: 'lia' },
        { texto: 'Só uma vez.', letra: 'liam' },
        { texto: 'e canela por cima!!', letra: 'elisa', alinhar: 'dir', respiro: 1.2 },
      ],
    },
    {
      blocos: [
        { texto: 'Outubro', letra: 'titulo' },
        { texto: 'Luz ................................. 187,40', letra: 'evelyn', respiro: 0.4 },
        { texto: 'Água .............................. 96,10', letra: 'evelyn' },
        { texto: 'Mercado ........................ 612,00', letra: 'evelyn' },
        { texto: 'Farmácia ........................ 74,90', letra: 'evelyn' },
        { texto: 'Material da escola ......... 58,00', letra: 'evelyn' },
        { texto: 'Inscrição do concurso ..... 120,00', letra: 'evelyn', riscado: true },
        { texto: 'Entrou: 1.340,00 · Sobra: 0', letra: 'evelyn', respiro: 0.6 },
        { texto: 'Não comentar com A.', letra: 'evelyn', respiro: 0.8 },
      ],
    },
    {
      blocos: [
        { texto: '(um recorte de jornal, preso com clipe)', letra: 'pequeno' },
        { texto: 'VAGA: SUPERVISORA DE TURNO', letra: 'titulo', respiro: 0.6 },
        { texto: 'Indústria de embalagens contrata para o turno da noite. Carteira assinada, vale-transporte, início imediato.', letra: 'impresso' },
        { texto: 'Liguei. Passei na entrevista.', letra: 'evelyn', respiro: 0.8 },
        { texto: 'Vou aceitar.', letra: 'evelyn', riscado: true },
        { texto: 'A. disse que as crianças precisam de mim em casa. Que à noite a casa desanda.', letra: 'evelyn' },
        { texto: 'Talvez ele tenha razão.', letra: 'evelyn' },
      ],
    },
  ],
}

// --- Corredor: a correspondência no aparador ---------------------------------

export const DOC_CARTA_ESCOLA: Documento = {
  id: 'carta-escola',
  tipo: 'carta',
  titulo: 'Correspondência',
  paginas: [
    {
      blocos: [
        { texto: 'Escola Municipal Jardim das Acácias', letra: 'titulo' },
        { texto: 'Senhores pais ou responsáveis,', letra: 'impresso', respiro: 0.8 },
        { texto: 'Temos a alegria de informar que o aluno LIAM, do 9º ano, foi selecionado para representar a escola no Concurso Regional de Desenho Jovem, com o tema "A casa que eu queria ter".', letra: 'impresso' },
        { texto: 'A etapa final acontece na capital. O transporte é custeado pela organização; a taxa de inscrição, de R$ 120,00, deve ser paga até sexta-feira.', letra: 'impresso' },
        { texto: 'A professora de Artes destaca a "imaginação arquitetônica incomum" do aluno.', letra: 'impresso' },
        { texto: 'Atenciosamente, a Coordenação.', letra: 'impresso', alinhar: 'dir' },
        { texto: 'Quem leva? Quem busca? Com que dinheiro?', letra: 'adrian', respiro: 0.8 },
      ],
    },
    {
      rasgada: true,
      blocos: [
        { texto: 'AUTORIZAÇÃO', letra: 'titulo' },
        { texto: 'Eu, ____________________, responsável pelo aluno acima, autorizo sua participação no Concurso Regional de Desenho Jovem e sua viagem na data...', letra: 'impresso', respiro: 0.6 },
        { texto: 'Eu não quero ir.', letra: 'liam', respiro: 1.4 },
        { texto: '— Liam', letra: 'liam', alinhar: 'dir' },
      ],
    },
    {
      planta: true,
      blocos: [
        { texto: '(no verso da autorização, a lápis)', letra: 'pequeno' },
        { texto: 'Se não deixarem você ir, a gente constrói aqui.', letra: 'elisa' },
        { texto: 'o quarto a mais é o nosso →', letra: 'elisa', alinhar: 'dir' },
      ],
    },
  ],
}

// --- Sala: o jornal na mesinha ------------------------------------------------

export const DOC_JORNAL: Documento = {
  id: 'jornal',
  tipo: 'jornal',
  titulo: 'Folha do Vale',
  paginas: [
    {
      blocos: [
        { texto: 'FOLHA DO VALE', letra: 'manchete' },
        { texto: 'terça-feira, 14 de outubro · edição 4.127 · R$ 3,00', letra: 'data', alinhar: 'centro' },
        { texto: 'Frente fria traz chuva forte para o fim de semana', letra: 'titulo', respiro: 0.8 },
        { texto: 'Defesa Civil pede atenção a encostas e ruas alagáveis da parte baixa da cidade. A temperatura pode cair a nove graus na madrugada de sábado.', letra: 'impresso' },
        { texto: 'Tecelagem centenária fecha as portas', letra: 'titulo', respiro: 0.6 },
        { texto: 'A antiga Tecelagem Amélia, primeira indústria do bairro, encerra as atividades depois de 97 anos. "Minha avó dizia que ali se tecia a cidade inteira", lembra um ex-funcionário. O prédio deve virar estacionamento.', letra: 'impresso' },
        { texto: 'Classificados, pág. 2 · Passatempos, pág. 3', letra: 'pequeno', alinhar: 'dir', respiro: 0.6 },
      ],
    },
    {
      blocos: [
        { texto: 'CLASSIFICADOS', letra: 'titulo' },
        { texto: 'VENDE-SE bicicleta aro 20, pouco uso, pneu novo. Tratar à tarde.', letra: 'impresso', respiro: 0.6 },
        { texto: 'PROCURA-SE cachorro caramelo, atende por Biscoito. Muito querido. Recompensa.', letra: 'impresso' },
        { texto: 'ALUGA-SE kitnet mobiliada perto da rodoviária. Dois quartos pequenos, quintal. Entrada imediata, sem fiador. Tratar c/ Fernanda.', letra: 'impresso', circulado: true, respiro: 0.4 },
        { texto: 'AULAS de piano para iniciantes, todas as idades. Paciência garantida.', letra: 'impresso', respiro: 0.4 },
        { texto: 'COMPRO fios, lãs e retalhos em qualquer quantidade. Pago bem.', letra: 'impresso' },
        { texto: 'ligar amanhã cedo, antes dele acordar', letra: 'evelyn', respiro: 0.8 },
      ],
    },
    {
      segredo: 'cruzadas',
      blocos: [
        { texto: 'PALAVRAS CRUZADAS', letra: 'titulo' },
      ],
      cruzadas: [
        '..O......',
        '.URDIDURA',
        '..D......',
        '..E......',
        'FAMILIA..',
        '.........',
        '.._......',
        'floresta.',
      ],
    },
    {
      blocos: [
        { texto: 'PALAVRAS CRUZADAS — pistas', letra: 'titulo' },
        { texto: 'HORIZONTAIS', letra: 'pequeno', respiro: 0.6 },
        { texto: '2. O que o tecelão estica antes de começar (8)', letra: 'impresso' },
        { texto: '3. Vem antes de tudo, dizem (7)', letra: 'impresso' },
        { texto: '5. Lugar de se perder de propósito (8)', letra: 'impresso' },
        { texto: 'VERTICAIS', letra: 'pequeno', respiro: 0.6 },
        { texto: '1. O contrário de bagunça (5)', letra: 'impresso' },
        { texto: '4. O que prende dois fios (2)', letra: 'impresso' },
        { texto: 'ninguém respondeu a 4', letra: 'lia', respiro: 1.2 },
      ],
    },
  ],
}

// --- Cozinha: o bilhete da tia ------------------------------------------------

export const DOC_BILHETE_FERNANDA: Documento = {
  id: 'bilhete-fernanda',
  tipo: 'bilhete',
  titulo: 'Bilhete no bolso do casaco',
  paginas: [
    {
      dobras: true,
      blocos: [
        { texto: 'Eve,', letra: 'fernanda' },
        { texto: '23h. Estarei na esquina da padaria, carro prata. Não precisa explicar nada, nem pra mim, nem pra ninguém.', letra: 'fernanda' },
        { texto: 'Traz as crianças. Só o que couber no carro.', letra: 'fernanda' },
        { texto: 'P.S.: ela perguntou de você. Disse que o Liam ainda guarda a chave.', letra: 'fernanda', respiro: 0.6 },
        { texto: '— F.', letra: 'fernanda', alinhar: 'dir' },
      ],
    },
  ],
}

// --- Porão: o caderno de Amélia ----------------------------------------------

export const DOC_CADERNO_AMELIA: Documento = {
  id: 'caderno-amelia',
  tipo: 'caderno',
  titulo: 'Caderno de Amélia',
  paginas: [
    {
      blocos: [
        { texto: 'inverno', letra: 'data' },
        { texto: 'Depois do enterro ninguém mais senta à mesa ao mesmo tempo. Helena não fala com o pai. O pai não fala com ninguém.', letra: 'amelia' },
        { texto: 'Montei o tear no porão, com a madeira da cama que ficou sobrando.', letra: 'amelia' },
        { texto: 'Se não consigo juntar a família, ao menos junto os fios.', letra: 'amelia' },
      ],
    },
    {
      blocos: [
        { texto: 'primavera', letra: 'data' },
        { texto: 'Aconteceu uma coisa que não sei escrever direito.', letra: 'amelia' },
        { texto: 'Quando teço a noite inteira, de manhã eles acordam mansos. A briga some da boca deles como se nunca tivesse estado lá.', letra: 'amelia' },
        { texto: 'Mas uma coisa assim precisa ir para algum lugar.', letra: 'amelia' },
      ],
    },
    {
      blocos: [
        { texto: 'sem data', letra: 'data' },
        { texto: 'Acordo com a raiva do César. Choro o choro da Helena. Sonho o medo do meu marido, que eu nunca vi ter medo de nada.', letra: 'amelia' },
        { texto: 'Me chamam de santa. Dizem que eu tenho um dom.', letra: 'amelia' },
        { texto: 'Não é dom.', letra: 'amelia', riscado: true, respiro: 0.6 },
      ],
    },
    {
      blocos: [
        { texto: 'Toda paz que lhes dei', letra: 'amelia', respiro: 3 },
        { texto: 'acordou dentro de mim.', letra: 'amelia' },
        { texto: 'Se alguém desta casa achar este caderno: o tear não une ninguém. Ele só escolhe quem vai carregar.', letra: 'amelia', respiro: 3 },
      ],
    },
    {
      // Página em branco. Quem espera, vê.
      blocos: [],
      paciencia: {
        apos: 4,
        segredo: 'caderno',
        blocos: [
          { texto: 'Eu li.', letra: 'elisa' },
          { texto: 'Por isso cortei o meu.', letra: 'elisa' },
          { texto: '— E.', letra: 'elisa', alinhar: 'dir' },
        ],
      },
    },
  ],
}
