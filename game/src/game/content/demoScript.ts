/**
 * Texto da demo "Só mais um".
 *
 * A demo comprime o arco da obra em dois momentos: Adrian ensinando música
 * (o afeto é verdadeiro — e é no mesmo fôlego que a função é instalada) e a
 * câmara do Tear (o mesmo afeto virando instrumento).
 */
import type { Line } from '../world/types'

// --- Prólogo: A Música ------------------------------------------------------

export const PROLOGO_ABERTURA: Line[] = [
  { speaker: 'Adrian', text: 'Senta aqui. Deixa eu te mostrar uma coisa.', style: 'speech' },
  { speaker: 'Adrian', text: 'Escuta primeiro. Depois você faz.', style: 'speech' },
]

/** Uma linha por frase do tema, dita antes de Adrian tocá-la. */
export const PROLOGO_FRASES: Line[][] = [
  [{ speaker: 'Adrian', text: 'Essa é a primeira parte.', style: 'speech' }],
  [{ speaker: 'Adrian', text: 'Agora cresce. Presta atenção no fim.', style: 'speech' }],
  [{ speaker: 'Adrian', text: 'E essa desce tudo. Até onde começou.', style: 'speech' }],
]

export const PROLOGO_ACERTOU_FRASE: Line[][] = [
  [{ speaker: 'Adrian', text: 'Isso. Sem pressa.', style: 'speech' }],
  [{ speaker: 'Adrian', text: 'Você pega rápido.', style: 'speech' }],
  [{ speaker: 'Adrian', text: 'Inteira. Na primeira noite.', style: 'speech' }],
]

export const PROLOGO_ERRO: Line[][] = [
  [{ speaker: 'Adrian', text: 'Calma. De novo, do começo.', style: 'speech' }],
  [{ speaker: 'Adrian', text: 'Quase. Escuta mais uma vez.', style: 'speech' }],
  [{ text: 'Ele não levanta a voz. Nunca levanta aqui.' }],
]

/** O elogio e a função instalada na mesma frase. */
export const PROLOGO_ACERTO: Line[] = [
  { speaker: 'Adrian', text: 'Pronto. Agora é sua.', style: 'speech' },
  { speaker: 'Adrian', text: 'Sua mãe não tem paciência pra isso. Você tem.', style: 'speech' },
  { speaker: 'Adrian', text: 'Por isso eu conto com você.', style: 'speech' },
]

export const PROLOGO_LIVRE = 'toque à vontade'

export const PROLOGO_FECHO: Line[] = [
  { text: 'Eu gostava quando ele falava assim.' },
  { text: 'Eu ainda gosto.' },
]

// --- O Tear -----------------------------------------------------------------

export const TEAR_CHEGADA: Line[] = [
  { text: 'A discussão atravessa o assoalho.' },
  { text: 'Se eu juntar os fios, eles param.' },
  { text: 'Sempre para.' },
]

/**
 * O piano reaparece aqui. É a virada da demo: a mesma interface que era
 * carinho vira ferramenta. Adrian não precisa explicar nada — só lembrar.
 */
export const TEAR_PIANO: Line[] = [
  { speaker: 'Adrian', text: 'Você lembra da música?', style: 'speech' },
  { speaker: 'Adrian', text: 'É só tocar. Igual eu te ensinei.', style: 'speech' },
]

export const TEAR_ERRO: string[] = [
  'De novo, do começo.',
  'Calma. Você sabe essa.',
  'Escuta o fio. Ele te dá a nota.',
]

/** Adrian entre uma absorção e outra. Nunca grita: é essa a questão. */
export const ADRIAN_DURANTE: string[] = [
  'Isso. Você consegue.',
  'Mais um, filho.',
  'Tá ouvindo? Já está mais calmo lá em cima.',
  'Ninguém mais nessa casa faz isso.',
  'Só mais um. Junta todos.',
  'Eu sei. Depois passa.',
]

/** Quando o jogador para de absorver, a pressão sobe em vez de aliviar. */
export const ADRIAN_INSISTE: string[] = [
  'Liam.',
  'Não para agora.',
  'Você quer que ela vá embora?',
  'Olha pra mim. Só mais um.',
]

/**
 * O que entra em Liam a cada fio. Nunca é sentimento dele — é de outra
 * pessoa, e vem sem contexto. É isso que o jogador deve sentir: lembrança
 * sem dono.
 */
export const FRAGMENTOS: { fala: string; dono: string }[] = [
  { fala: 'você prometeu', dono: 'medo' },
  { fala: 'não na frente das crianças', dono: 'vergonha' },
  { fala: 'eu não aguento mais', dono: 'cansaço' },
  { fala: 'olha o que você me fez fazer', dono: 'culpa' },
  { fala: 'eu devia ter saído antes', dono: 'raiva' },
  { fala: 'a culpa é minha a culpa é minha', dono: 'culpa' },
]

export const CORPO: string[] = [
  'não é meu',
  'isso não é meu',
  'de quem é isso',
  'eu não estava lá',
]

export const TEAR_FIM: Line[] = [
  { speaker: 'Liam', text: 'Pai...', style: 'speech' },
  { speaker: 'Adrian', text: 'Eu sei. Depois passa.', style: 'speech' },
]

export const ELISA_CORTE: Line[] = [
  { speaker: 'Elisa', text: 'Liam.', style: 'speech' },
]

export const EPILOGO: string[] = [
  'A paz da família sempre precisou adoecer alguém.',
]

export const DEMO_FIM = 'Fim da demo'

// --- A Mesa -----------------------------------------------------------------

export const MESA_ABERTURA: Line[] = [
  { text: 'As malas estão no chão da cozinha.' },
  { text: 'Se eu ficar no meio, eles param.' },
  { text: 'Sempre para.' },
]

/** As quatro falas da noite, na ordem em que o roteiro as fixa. */
export const MESA_CONFRONTO: Line[] = [
  { speaker: 'Adrian', text: 'Ninguém vai sair antes de a gente conversar.', style: 'speech' },
  { speaker: 'Evelyn', text: 'Eu não estou pedindo.', style: 'speech' },
  { speaker: 'Adrian', text: 'Você está levando meus filhos.', style: 'speech' },
  { speaker: 'Evelyn', text: 'Eu estou levando os meus para fora daqui.', style: 'speech' },
]

/** Quando Liam se aproxima da mãe, o pai puxa. E vice-versa. */
export const PUXAO_ADRIAN: string[] = [
  'Liam. Vem cá.',
  'Fala pra ela, filho.',
  'Você sabe que eu tenho razão.',
  'Eu conto com você.',
]

export const PUXAO_EVELYN: string[] = [
  'Liam, olha pra mim.',
  'Você não precisa resolver isso.',
  'Isso não é seu pra carregar.',
  'Filho, pega sua irmã.',
]

export const PUXAO_LIA: string[] = [
  'Não escuta ele.',
  'Liam, anda.',
]

/** O que ele pensa enquanto tenta ficar no meio. Vai desmoronando. */
export const MESA_PENSAMENTO: Line[][] = [
  [{ text: 'Eu consigo.' }],
  [{ text: 'É só achar o lado certo.' }],
  [{ text: 'Não tem lado certo.' }],
]

export const MESA_FUGA: Line[] = [
  { text: 'Eu não consigo.' },
  { text: 'Mas lá embaixo eu consigo.' },
]

/**
 * O que Liam pode encontrar na cozinha enquanto os pais discutem. Nada disso
 * muda o que vai acontecer — muda o que ele sabe quando acontecer. É a única
 * agência real da cena, e é de propósito que ela não salva ninguém.
 */
export interface Vestigio {
  id: string
  x: number
  rotulo: string
  linhas: Line[]
}

export const MESA_VESTIGIOS: Vestigio[] = [
  {
    id: 'malas', x: 116, rotulo: 'Olhar',
    linhas: [
      { text: 'Documentos, remédios, dinheiro contado.' },
      { text: 'Tem uma pulseira de hospital no meio. Com outro sobrenome.' },
      { text: 'Não é o meu. Nem o da minha mãe.' },
    ],
  },
  {
    id: 'bilhete', x: 158, rotulo: 'Ler',
    linhas: [
      { text: 'Um bilhete dobrado no bolso do casaco dela.' },
      { text: 'É a letra da tia Fernanda.', style: 'read' },
      { text: '23h. Estarei na esquina. Não precisa explicar nada.', style: 'read' },
      { text: 'Ela ia mesmo.' },
    ],
  },
  {
    id: 'fogao', x: 200, rotulo: 'Tirar o pano',
    linhas: [
      { text: 'Tem um pano apoiado na tampa da panela.' },
      { text: 'Eu tiro. Minha mãe sempre fala pra não deixar ali.' },
      { text: 'Ninguém olha.' },
    ],
  },
  {
    id: 'telefone', x: 262, rotulo: 'Pegar',
    linhas: [
      { text: 'O telefone está fora do gancho.' },
      { text: 'Fui eu que liguei pra ele.' },
      { text: 'Eu achei que estava pedindo ajuda.' },
    ],
  },
]

/** O fecho muda conforme quanto ele viu. Nunca muda o que acontece. */
export const MESA_FECHO: Record<number, Line[]> = {
  0: [{ text: 'Eu não consigo.' }, { text: 'Mas lá embaixo eu consigo.' }],
  2: [
    { text: 'Tem coisa demais nessa cozinha que eu não sabia.' },
    { text: 'E nada disso me diz o que fazer.' },
    { text: 'Lá embaixo eu sei.' },
  ],
  4: [
    { text: 'Eu vi tudo.' },
    { text: 'A pulseira, o bilhete, o telefone fora do gancho.' },
    { text: 'E continua não sendo escolha minha.' },
    { text: 'Só tem um lugar onde eu resolvo alguma coisa.' },
  ],
}

// --- A Casa -----------------------------------------------------------------

export const CASA_ABERTURA: Line[] = [
  { speaker: 'Adrian', text: 'Vai guardar suas coisas. Já está tarde.', style: 'speech' },
  { text: 'A casa parece maior de noite.' },
  { text: 'Ou eu que ando mais devagar.' },
]

/** Dito quando Liam chega ao fim do corredor e ele ainda não acabou. */
export const CASA_CORREDOR: Line[][] = [
  [{ text: 'Esse corredor é mais comprido do que eu lembro.' }],
  [
    { text: 'Eu já devia ter chegado na porta.' },
    { text: 'Toda vez que eu olho, ela está mais longe.' },
  ],
  [
    { text: 'A casa não é grande assim.' },
    { text: 'A casa não pode ser grande assim.' },
  ],
]

/** Objetivo mostrado no canto, que muda conforme ele explora. */
export const CASA_OBJETIVO_INICIAL = 'guardar as coisas'
export const CASA_OBJETIVO_COZINHA = 'ir até a cozinha'

export const CASA_ANTES_DA_COZINHA: Line[] = [
  { text: 'Tem voz na cozinha.' },
  { text: 'Os dois ao mesmo tempo.' },
]

/** Quando ele já viu o bastante e decide descer. */
export const CASA_PRONTO: Line[] = [
  { text: 'Não tem quarto nenhum no fim daquele corredor.' },
  { text: 'Então por que eu desenhei um?' },
]
