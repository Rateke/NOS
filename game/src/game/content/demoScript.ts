/**
 * Texto da demo "Só mais um".
 *
 * A demo comprime o arco da obra em dois momentos: Adrian ensinando música
 * (o afeto é verdadeiro — e é no mesmo fôlego que a função é instalada) e a
 * câmara do Tear (o mesmo afeto virando instrumento).
 */
import type { Line } from '../world/types'
import type { Documento } from '../systems/leitor'
import { DOC_BILHETE_FERNANDA } from './documentos'

// --- Prólogo: A Música ------------------------------------------------------

export const PROLOGO_ABERTURA: Line[] = [
  { text: 'A sala é o único lugar quente da casa. Principalmente quando ele está de bom humor.' },
  { speaker: 'Adrian', text: 'Senta aqui. Não, mais perto. Assim.', style: 'speech' },
  { speaker: 'Adrian', text: 'Meu avô tocava isso pra minha mãe dormir. Ninguém nunca me ensinou direito — eu aprendi escutando atrás da porta.', style: 'speech' },
  { speaker: 'Adrian', text: 'Então escuta primeiro. Depois você faz.', style: 'speech' },
]

/** Uma linha por frase do tema, dita antes de Adrian tocá-la. */
export const PROLOGO_FRASES: Line[][] = [
  [{ speaker: 'Adrian', text: 'Essa é a primeira parte. Ela sobe e para, como quem vai perguntar alguma coisa.', style: 'speech' }],
  [{ speaker: 'Adrian', text: 'Agora ela cresce. Presta atenção no fim: ela não fecha.', style: 'speech' }],
  [{ speaker: 'Adrian', text: 'E essa desce tudo, até onde começou. É aqui que ela descansa.', style: 'speech' }],
]

export const PROLOGO_ACERTOU_FRASE: Line[][] = [
  [
    { speaker: 'Adrian', text: 'Isso. Sem pressa.', style: 'speech' },
    { text: 'A mão dele no meu ombro. Leve.' },
  ],
  [
    { speaker: 'Adrian', text: 'Você pega rápido. Mais rápido que eu, na sua idade.', style: 'speech' },
  ],
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
  { speaker: 'Adrian', text: 'Sabe o que eu gosto em você? Você escuta. Ninguém mais nessa casa escuta.', style: 'speech' },
  { speaker: 'Adrian', text: 'Sua mãe não tem paciência pra isso. A Lia não tem. Você tem.', style: 'speech' },
  { speaker: 'Adrian', text: 'Por isso eu conto com você.', style: 'speech' },
]

export const PROLOGO_LIVRE = 'toque à vontade'

export const PROLOGO_FECHO: Line[] = [
  { text: 'Eu gostava quando ele falava assim.' },
  { text: 'Como se eu fosse a única pessoa da casa que entendia.' },
  { text: 'Eu ainda gosto.' },
]

/** Se o jogador toca o tema de trás para a frente no prólogo. */
export const PROLOGO_SUBINDO: Line[] = [
  { speaker: 'Adrian', text: '...Onde você aprendeu isso?', style: 'speech' },
  { text: 'Não sei. Estava na minha mão.' },
  { speaker: 'Adrian', text: 'Não é assim. Ela desce. Toca do jeito certo.', style: 'speech' },
]

// --- O Tear -----------------------------------------------------------------

export const TEAR_CHEGADA: Line[] = [
  { text: 'Embaixo da cozinha tem um tear.' },
  { text: 'Seis carretéis. Em cada um, amarrada, uma coisa de alguém.' },
  { text: 'Um fio da urdidura está cortado. Alguém cortou.' },
  { text: 'A discussão atravessa as tábuas.' },
  { text: 'Se eu tecer os fios, eles param.' },
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
  'Pronto. Escuta. Silêncio lá em cima.',
]

/** Quando o jogador para de absorver, a pressão sobe em vez de aliviar. */
export const ADRIAN_INSISTE: string[] = [
  'Liam.',
  'Não para agora.',
  'Você quer que ela vá embora?',
  'Olha pra mim. Só mais um.',
  'Sua bisavó fazia isso. Segurava todo mundo. Era um dom.',
  'Escuta lá em cima. Tá vendo? Por sua causa.',
]

export const CORPO: string[] = [
  'não é meu',
  'isso não é meu',
  'de quem é isso',
  'eu não estava lá',
]

/** Antes do piano: o caderno aberto no chão, perto das velas. */
export const TEAR_CADERNO: Line[] = [
  { text: 'Perto das velas tem uma pilha de cadernos. Um está aberto.' },
  { text: 'A letra é antiga, inclinada. Na capa, a lápis: Amélia.' },
]

export const TEAR_FIM: Line[] = [
  { speaker: 'Liam', text: 'Pai...', style: 'speech' },
  { speaker: 'Liam', text: 'Eu não quero.', style: 'speech' },
  { speaker: 'Adrian', text: 'Você consegue fazer o que ninguém mais consegue.', style: 'speech' },
  { speaker: 'Adrian', text: 'Eu sei. Depois passa.', style: 'speech' },
]

export const ELISA_CORTE: Line[] = [
  { speaker: 'Elisa', text: 'Liam.', style: 'speech' },
]

/** O fecho, em três tempos. Cada linha ganha a tela sozinha. */
export const EPILOGO: string[] = [
  'A paz da família sempre precisou adoecer alguém.',
  'E alguém era sempre o mesmo.',
]

/** Só para quem achou a melodia ao contrário no piano da sala. */
export const EPILOGO_SUBINDO = 'Mas alguém ensinou a música subindo.'

export const EPILOGO_CREDITO = 'Fernando Rateke Neto  ·  Luana Lupi Vergara'
export const DEMO_FIM = 'fim da demo'

// --- A Mesa -----------------------------------------------------------------

export const MESA_ABERTURA: Line[] = [
  { text: 'As malas estão no chão da cozinha.' },
  { text: 'Ninguém serviu o jantar. O rádio continua tocando uma música alegre, sozinho.' },
  { text: 'A Lia está de mochila nas costas. A mãe, de uniforme, como se fosse trabalhar.' },
  { text: 'Se eu ficar no meio, eles param.' },
  { text: 'Sempre para.' },
]

/** As falas da noite: primeiro os dois, depois Lia, depois a função de Liam. */
export const MESA_CONFRONTO: Line[] = [
  { speaker: 'Adrian', text: 'Ninguém vai sair antes de a gente conversar.', style: 'speech' },
  { speaker: 'Evelyn', text: 'Eu não estou pedindo.', style: 'speech' },
  { speaker: 'Adrian', text: 'Você está levando meus filhos.', style: 'speech' },
  { speaker: 'Evelyn', text: 'Eu estou levando os meus para fora daqui.', style: 'speech' },
  { speaker: 'Lia', text: 'Fala a verdade pelo menos uma vez. Fala por que a porta tá trancada.', style: 'speech' },
  { speaker: 'Adrian', text: 'Liam. Explica pra sua irmã por que a gente precisa ficar junto.', style: 'speech' },
  { text: 'Ele olha pra mim como se eu soubesse a resposta.' },
  { text: 'Eu sempre sei a resposta.' },
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
  /** Papel para ler de verdade, aberto depois de `linhas`. */
  documento?: Documento
  depois?: Line[]
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
      { text: 'O casaco da minha mãe, na cadeira. Tem um papel saindo do bolso.' },
      { text: 'É a letra da tia Fernanda. Faz anos que elas não se falam.' },
    ],
    documento: DOC_BILHETE_FERNANDA,
    depois: [
      { text: 'Ela ia mesmo. Hoje.' },
      { text: '"Ela perguntou de você." Ela quem?' },
      { text: 'E que chave?' },
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

/** Os cinco pratos. Não é vestígio, não muda nada — só está ali. */
export const MESA_PRATOS: Line[] = [
  { text: 'Tem cinco pratos na mesa.' },
  { text: 'Minha mãe pôs cinco. Eu vi ela contar.' },
  { text: 'Somos quatro.' },
  { text: 'Ela olhou pro quinto como quem esquece uma palavra no meio da frase.' },
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
  { text: 'Da cozinha vem o barulho da panela e o rádio baixinho. Ninguém está falando.' },
  { text: 'Isso é pior do que quando falam.' },
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
    { speaker: 'Voz', text: 'Lembra? Aqui era a floresta.', style: 'speech' },
  ],
]

/** A porta do fim, a cada vez que Liam insiste. Na terceira, alguém responde. */
export const CASA_PORTA_FIM: Line[][] = [
  [
    { text: 'A maçaneta gira. A porta não abre.' },
    { text: 'Nunca abriu.' },
    { text: 'Eu desenhei um quarto aqui. Eu lembro de desenhar.' },
  ],
  [{ text: 'Eu bato.' }, { text: 'Nada.' }],
  [
    { text: 'Eu bato de novo. Três vezes curtas.' },
    { text: 'Do jeito que alguém me ensinou.' },
  ],
  [{ text: 'A porta não abre.' }, { text: 'Mas agora eu sei que tem alguém ali.' }],
]

/** O tema de trás para a frente, no piano da sala. */
export const CASA_MELODIA: Line[] = [
  { speaker: 'Voz', text: 'Isso.', style: 'speech' },
  { speaker: 'Voz', text: 'Ele te ensinou descendo. Eu te ensinei subindo.', style: 'speech' },
  { text: 'Assim a música não termina no chão.' },
]

/** A frase do jeito que Adrian ensinou. */
export const CASA_MELODIA_DELE: Line[] = [
  { text: 'Do jeito que ele ensinou.' },
  { text: 'Termina lá embaixo. Sempre termina lá embaixo.' },
]

/** Objetivo mostrado no canto, que muda conforme ele explora. */
export const CASA_OBJETIVO_INICIAL = 'guardar as coisas'
export const CASA_OBJETIVO_COZINHA = 'ir até a cozinha'

export const CASA_ANTES_DA_COZINHA: Line[] = [
  { text: 'Tem voz na cozinha.' },
  { text: 'Os dois ao mesmo tempo, baixinho, do jeito que eles acham que a gente não escuta.' },
  { text: 'Se eu entrar agora, eles param. Sempre param.' },
  { text: 'Ainda dá tempo de olhar o resto da casa.' },
]

/** Quando ele já viu o bastante e decide descer. */
export const CASA_PRONTO: Line[] = [
  { text: 'Não tem quarto nenhum no fim daquele corredor.' },
  { text: 'Então por que eu desenhei um?' },
]
