/**
 * Todo o texto do jogo mora aqui.
 *
 * Este arquivo é o único que precisa ser aberto para reescrever falas: nada
 * aqui é código de jogo, só dados. `speaker` ausente significa pensamento de
 * Liam; `style: 'read'` é texto lido de um objeto; `style: 'speech'` é alguém
 * falando.
 */
import type { Line } from '../world/types'

export const OPENING: { text: string; hold: number }[] = [
  { text: 'Liam... lembra da nossa regra?', hold: 2.2 },
  { text: 'Quando a casa apertar...', hold: 1.9 },
  { text: '...a gente inventa outra.', hold: 2.6 },
]

export const WAKE: Line[] = [
  { text: 'Eu estava dormindo.' },
  { text: 'Acho que eu estava dormindo.' },
]

export const SCRIPT: Record<string, Line[]> = {
  diario: [
    { text: 'Uma página solta, na minha letra.' },
    { text: 'Preciso arrumar meu quarto antes que Adrian chegue.', style: 'read' },
    { text: 'Preciso ser melhor.', style: 'read' },
    { text: 'Eu não lembro de ter escrito isso.' },
  ],

  janela: [
    { text: 'A manhã está parada.' },
    { text: 'As folhas não mexem. O pó no vidro não cai.' },
    { text: 'Faz quanto tempo que está assim?' },
  ],

  planta: [
    { text: 'A planta da casa. Eu desenhei.' },
    { text: 'Tem um quarto aqui, no fim do corredor.' },
    { text: 'A gente não tem um quarto no fim do corredor.' },
  ],

  cama: [
    { text: 'Arrumada. Eu arrumo antes de dormir, sempre.' },
    { text: 'Às vezes eu durmo no chão, aqui do lado.' },
    { text: 'É mais perto da porta.' },
  ],

  armario: [
    { text: 'Eu caibo aqui dentro, se dobrar os joelhos.' },
    { text: 'E sei exatamente quanto tempo dá pra ficar antes de alguém notar.' },
  ],

  luminaria: [
    { text: 'A única luz acesa da casa.' },
  ],

  roupa1: [
    { text: 'Dobrada. Do jeito que ele gosta.' },
  ],

  roupa2: [
    { text: 'Essa estava debaixo da cama.' },
    { text: 'Ninguém ia ver. Mas conta do mesmo jeito.' },
  ],

  desenho1: [
    { text: 'Outra casa. Essa tem um jardim dentro da sala.' },
  ],

  desenho2: [
    { text: 'Essa eu não terminei.' },
  ],

  // Os cinco objetos que Liam não consegue jogar fora.
  botao: [
    { text: 'Um botão. Não é de nenhuma roupa minha.' },
    { text: 'Se eu jogar fora, é como dizer que nunca foi de ninguém.' },
  ],

  passagem: [
    { text: 'Uma passagem de ônibus. Venceu faz tempo.' },
    { text: 'A gente ia a algum lugar.' },
  ],

  pedra: [
    { text: 'Uma pedra pintada de azul.' },
    { text: 'Alguém pintou junto comigo.' },
    { text: 'Eu lembro das mãos. Não lembro do rosto.' },
  ],

  chave: [
    { text: 'Uma chave. Não abre nada daqui.' },
    { text: 'Eu já testei todas as portas.' },
  ],

  papel: [
    { text: 'Um papel dobrado muitas vezes.' },
    { text: 'Está dobrado demais pra abrir sem rasgar.' },
  ],
}

/** A porta antes de Liam encontrar o diário: ele nem sabe o que falta. */
export const DOOR_BEFORE_DIARY: Line[] = [
  { text: '...' },
  { text: 'Tem alguma coisa que eu preciso fazer antes.' },
  { text: 'Eu só não lembro o quê.' },
]

/**
 * A porta com o quarto ainda bagunçado. Escala a cada tentativa — a terceira
 * é a tese da obra: a porta nunca esteve trancada.
 */
export const DOOR_REFUSALS: Line[][] = [
  [{ text: 'Ainda tem coisa fora do lugar.' }],
  [
    { text: 'Ele vai ver.' },
    { text: 'Ele sempre vê.' },
  ],
  [
    { text: 'Não é que eu não possa sair.' },
    { text: 'É que eu não consigo imaginar sair assim.' },
  ],
]

export const ROOM_TIDY: Line[] = [
  { text: 'Pronto.' },
  { text: 'Está tudo no lugar.' },
]

export const DOOR_OPEN: Line[] = [
  { text: 'Agora eu posso.' },
]

export const CHAPTER_TITLE = 'A Casa Grande Demais'
export const CHAPTER_LABEL = 'Capítulo 1'

export const SLICE_END: string[] = [
  'Fim da fatia jogável.',
  'A casa continua além desta porta.',
]
