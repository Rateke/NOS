import type { Line } from '../world/types'

/**
 * A crise. Não vem de um susto: vem de saber demais. Cada coisa que Liam
 * olha nesta casa tem outra embaixo, e uma hora o peito não aguenta.
 */
export const CRISE_ABRE: Line[] = [
  { text: 'Tudo que eu olho nesta casa tem alguma coisa escondida embaixo.' },
  { text: 'O peito fecha. As mãos formigam.' },
  { text: 'Respira. Quatro pra dentro, quatro pra fora. Do jeito que a mãe ensinou.' },
]

export const CRISE_PASSOU: Line[] = [
  { text: 'Passou.' },
  { text: 'Ainda tá aqui. Mas passou.' },
]

export const CRISE_NAO_PASSOU: Line[] = [
  { text: 'Não entra. Não entra.' },
  { text: '...' },
  { text: 'Passou sozinho. Sempre passa sozinho, uma hora.' },
  { text: 'Ninguém nesta casa percebe quando acontece. Melhor assim.' },
]
