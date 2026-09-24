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
]

/**
 * A frase que Adrian toca e Liam precisa repetir.
 * Cada número é uma das quatro teclas: 0=←  1=↑  2=→  3=↓
 * Valores fora de 0..3 travariam a cena, porque não haveria tecla para eles.
 */
export const FRASE_MUSICAL = [0, 2, 3, 1] as const

export const PROLOGO_ENSINO: Line[] = [
  { speaker: 'Adrian', text: 'Assim. Sem pressa. Agora você.', style: 'speech' },
]

/** Fica na tela enquanto é a vez do jogador — não bloqueia como fala. */
export const PROLOGO_DICA = 'repita a sequência  ·  clique, setas ou WASD'

export const PROLOGO_ERRO: Line[] = [
  { speaker: 'Adrian', text: 'Calma. De novo, do começo.', style: 'speech' },
]

/**
 * O elogio e o veneno na mesma frase. É o coração da obra: não existe momento
 * em que Adrian deixa de amar — existe o momento em que amar vira encargo.
 */
export const PROLOGO_ACERTO: Line[] = [
  { speaker: 'Adrian', text: 'Viu? Você pega rápido.', style: 'speech' },
  { speaker: 'Adrian', text: 'Sua mãe não tem paciência pra isso. Você tem.', style: 'speech' },
  { speaker: 'Adrian', text: 'Por isso eu conto com você.', style: 'speech' },
  { text: 'Eu gostava quando ele falava assim.' },
  { text: 'Eu ainda gosto.' },
]

// --- O Tear -----------------------------------------------------------------

export const TEAR_CHEGADA: Line[] = [
  { text: 'A discussão atravessa o assoalho.' },
  { text: 'Se eu juntar os fios, eles param.' },
  { text: 'Sempre para.' },
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
