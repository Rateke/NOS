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
      { texto: 'Regras da casa (pra quando ele chega):', letra: 'liam' },
      { texto: '1. Sapato alinhado na porta, com o bico pra fora.', letra: 'liam' },
      { texto: '2. Nenhum copo na pia. Nem o meu, nem o da Lia.', letra: 'liam' },
      { texto: '3. Se a mãe estiver cansada, eu respondo por ela.', letra: 'liam' },
      { texto: '4. Se eles brigarem, eu fico no meio. Aí eles param.', letra: 'liam' },
      { texto: '5. Não chorar.', letra: 'liam', riscado: true },
      { texto: '5. Não chorar na frente.', letra: 'liam' },
    ],
  },
  {
    blocos: [
      { texto: 'quarta', letra: 'data' },
      { texto: 'Minha família', letra: 'liam' },
      { texto: 'Pai — Adrian. Me ensinou piano. Diz que eu escuto melhor que todo mundo.', letra: 'liam', respiro: 0.4 },
      { texto: 'Mãe — Evelyn. Trabalha de dia e de noite. Chega cansada e mesmo assim deixa comida pronta.', letra: 'liam' },
      { texto: 'Lia — minha irmã. Mesma idade, mesma altura. Ela fala tudo o que pensa. Eu penso tudo o que não falo.', letra: 'liam' },
      { texto: 'Eu — Liam.', letra: 'liam' },
      { texto: 'Eli', letra: 'liam', riscado: true, respiro: 0.4 },
      { texto: 'Somos quatro. Eu sempre escrevo cinco linhas e não sei por quê.', letra: 'liam', respiro: 0.6 },
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
      { texto: 'A professora de português pediu uma redação: "Minha família". Tirei dez.', letra: 'liam' },
      { texto: 'Mesmo assim ela pediu pra eu ficar depois da aula. Perguntou se estava tudo bem em casa.', letra: 'liam' },
      { texto: 'Eu disse que sim. Enquanto eu falava, arrumei a pilha de cadernos da mesa dela.', letra: 'liam' },
      { texto: 'Ela ficou olhando pras minhas mãos e não pro que eu dizia.', letra: 'liam', respiro: 0.6 },
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
  {
    // A folha de cima foi arrancada. Quem espera, vê o que ficou marcado.
    blocos: [],
    paciencia: {
      apos: 5,
      segredo: 'marcas',
      blocos: [
        { texto: '(a folha de cima foi arrancada; ficou a marca da caneta)', letra: 'pequeno' },
        { texto: 'não me deixem cair', letra: 'marca', respiro: 1.2 },
      ],
    },
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
        { texto: 'Bolo de chocolate', letra: 'titulo' },
        { texto: '3 ovos · 2 xícaras de farinha · 1 ½ de açúcar · 1 de chocolate em pó · 1 de leite morno · ½ de óleo · 1 colher de fermento.', letra: 'evelyn', respiro: 0.6 },
        { texto: 'Bate tudo, menos a farinha e o fermento. Esses vão na mão, devagar. Forno médio, 40 minutos. Não abre o forno antes.', letra: 'evelyn' },
        { texto: 'Calda: 4 colheres de chocolate, 1 de manteiga, meia xícara de leite. Ferve até engrossar e joga quente, com o bolo ainda na forma.', letra: 'evelyn' },
        { texto: 'Forno médio = 180 graus. Eu medi. 40 min exatos.', letra: 'liam', respiro: 0.5 },
        { texto: 'o Liam abriu o forno pra ver kkkkk', letra: 'lia' },
        { texto: 'Só uma vez.', letra: 'liam' },
        { texto: 'e granulado por cima!!', letra: 'elisa', alinhar: 'dir', respiro: 1.2 },
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
        { texto: 'Remédio de dor de cabeça (L.) .. 18,50', letra: 'evelyn' },
        { texto: 'Psicóloga da escola ............. 0,00', letra: 'evelyn', riscado: true },
        { texto: 'Entrou: 1.340,00 · Sobra: 0', letra: 'evelyn', respiro: 0.6 },
        { texto: 'A. disse que psicólogo é pra quem não tem família.', letra: 'evelyn', respiro: 0.6 },
        { texto: 'Não comentar com A.', letra: 'evelyn', respiro: 0.4 },
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

/**
 * A carta da escola e a redação que voltou junto. A redação tem dez, nenhum
 * erro e uma coisa que a professora não viu: as primeiras letras de cada
 * frase, lidas de cima para baixo. Nenhum texto do jogo aponta para isso.
 */
export const DOC_CARTA_ESCOLA: Documento = {
  id: 'carta-escola',
  tipo: 'carta',
  titulo: 'Correspondência',
  paginas: [
    {
      blocos: [
        { texto: 'Escola Municipal Jardim das Acácias', letra: 'titulo' },
        { texto: 'Senhores pais ou responsáveis,', letra: 'impresso', respiro: 0.8 },
        { texto: 'Solicitamos o comparecimento de um responsável pelo aluno LIAM, do 9º ano, para uma conversa com a coordenação e com a professora de Língua Portuguesa.', letra: 'impresso' },
        { texto: 'O aluno tem apresentado sono em sala, dores de cabeça frequentes e um comportamento que nos preocupa: pede desculpas por tudo, inclusive pelo que não fez.', letra: 'impresso' },
        { texto: 'Não se trata de questão disciplinar. Queremos apenas entender como podemos ajudar.', letra: 'impresso' },
        { texto: 'Atenciosamente, a Coordenação.', letra: 'impresso', alinhar: 'dir' },
        { texto: 'Resolvido por telefone. Não precisa ir ninguém.', letra: 'adrian', respiro: 0.8 },
      ],
    },
    {
      blocos: [
        { texto: 'Redação — Minha família', letra: 'titulo' },
        { texto: 'Liam · 9º ano B', letra: 'data' },
        { texto: 'Pra mim, a minha família é a coisa mais importante que existe.', letra: 'liam', respiro: 0.4 },
        { texto: 'Reunidos no jantar a gente é quatro, e às vezes parece mais.', letra: 'liam' },
        { texto: 'Esse ano meu pai me ensinou piano, e ele diz que eu escuto melhor que todo mundo.', letra: 'liam' },
        { texto: 'Com a minha mãe eu aprendi o bolo de chocolate, que é o melhor bolo.', letra: 'liam' },
        { texto: 'Irmã eu tenho uma, a Lia, que tem a minha idade e fala tudo o que pensa.', letra: 'liam' },
        { texto: 'Se alguém briga lá em casa, eu ajudo a acalmar, porque eu sou calmo.', letra: 'liam' },
        { texto: 'O jantar é às oito, e ninguém levanta antes de todo mundo terminar.', letra: 'liam' },
      ],
    },
    {
      blocos: [
        { texto: 'Domingo a gente almoça na casa da minha avó, quando dá.', letra: 'liam' },
        { texto: 'Eu gosto quando a casa fica em silêncio.', letra: 'liam' },
        { texto: 'A minha mãe trabalha muito, mas mesmo cansada ela deixa comida pronta.', letra: 'liam' },
        { texto: 'Juntos nós somos fortes, como o meu pai fala.', letra: 'liam' },
        { texto: 'Um dia eu quero ter uma casa igual a essa, com um quarto a mais.', letra: 'liam' },
        { texto: 'Deve ser por isso que eu sempre desenho um quarto a mais.', letra: 'liam' },
        { texto: 'Acho que é isso. A minha família é normal.', letra: 'liam' },
        { texto: '10', letra: 'professora', alinhar: 'dir', respiro: 0.8 },
        { texto: 'Liam, texto lindo e sem nenhum erro. Mas você escreveu sobre todo mundo e quase nada sobre você. Quer conversar depois da aula? Eu fico até as seis. — Prof.ª Márcia', letra: 'professora' },
      ],
    },
    {
      planta: true,
      blocos: [
        { texto: '(no verso da redação, um desenho a lápis)', letra: 'pequeno' },
        { texto: 'Por que tem um quarto a mais?', letra: 'professora' },
        { texto: 'Não sei. Sempre tem.', letra: 'liam', alinhar: 'dir' },
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
        { texto: 'ALUGA-SE kitnet mobiliada perto da rodoviária. Dois quartos pequenos, quintal. Entrada imediata, sem fiador. Tratar c/ Catarina.', letra: 'impresso', circulado: true, respiro: 0.4 },
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
        '..D....._',
        '..E....._',
        'FAMILIA._',
        '........_',
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
        { texto: '6. O que ninguém nesta casa pede em voz alta (5)', letra: 'impresso' },
        { texto: 'ninguém respondeu a 4. nem a 6.', letra: 'lia', respiro: 1.2 },
      ],
    },
  ],
}

// --- Cozinha: o bilhete da tia Catarina ------------------------------------------------

export const DOC_BILHETE_CATARINA: Documento = {
  id: 'bilhete-catarina',
  tipo: 'bilhete',
  titulo: 'Bilhete no bolso do casaco',
  paginas: [
    {
      dobras: true,
      blocos: [
        { texto: 'Eve,', letra: 'catarina' },
        { texto: '23h. Estarei na esquina da padaria, carro prata. Não precisa explicar nada, nem pra mim, nem pra ninguém.', letra: 'catarina' },
        { texto: 'Traz as crianças. Só o que couber no carro.', letra: 'catarina' },
        { texto: 'P.S.: ela perguntou de você. Disse que o Liam ainda guarda a chave.', letra: 'catarina', respiro: 0.6 },
        { texto: '— C.', letra: 'catarina', alinhar: 'dir' },
      ],
    },
  ],
}

// --- Corredor: o caderno da Lia ----------------------------------------------

/**
 * Caneta vermelha, letra apertada. Ela sabe tudo o que Liam finge não saber
 * — e ninguém nunca perguntou nada a ela.
 */
export const DOC_CADERNO_LIA: Documento = {
  id: 'caderno-lia',
  tipo: 'diario',
  titulo: 'Caderno da Lia',
  paginas: [
    {
      blocos: [
        { texto: 'coisas que eu sei e ninguém pergunta', letra: 'lia' },
        { texto: '1. O pai só é gentil quando tem alguém olhando.', letra: 'lia', respiro: 0.5 },
        { texto: '2. A mãe chora no banho pra ninguém ouvir. Eu ouço.', letra: 'lia' },
        { texto: '3. Tem um prato a mais na mesa e todo mundo finge que é pra visita. Nunca vem visita.', letra: 'lia' },
        { texto: '4. Quando o Liam mente, ele arruma alguma coisa. Hoje ele arrumou a sala inteira.', letra: 'lia' },
        { texto: '5. Ele acha que eu não percebo.', letra: 'lia' },
      ],
    },
    {
      blocos: [
        { texto: 'coisas que eu queria perguntar', letra: 'lia' },
        { texto: 'pro pai: por que a porta da frente fica trancada de noite, e a chave fica no seu bolso?', letra: 'lia', respiro: 0.5 },
        { texto: 'pra mãe: por que você ainda tá aqui?', letra: 'lia', riscado: true },
        { texto: 'pra mãe: você tá bem?', letra: 'lia' },
        { texto: 'pro Liam: por que você sempre fica do lado dele?', letra: 'lia' },
        { texto: 'pra quem escreveu de lápis roxo no livro de receitas: quem é você? não é ninguém daqui de casa. eu conheço a letra de todo mundo.', letra: 'lia' },
      ],
    },
    {
      blocos: [
        { texto: 'se alguém ler isso:', letra: 'lia', respiro: 2 },
        { texto: 'não é rebeldia. é que alguém nessa casa tem que falar.', letra: 'lia' },
        { texto: 'e se eu parar de falar, sobra só ele.', letra: 'lia', respiro: 0.6 },
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
