import type { Line } from '../world/types'

/**
 * A crise. Não vem de um susto: vem de saber demais. Cada coisa que Liam
 * olha nesta casa tem outra embaixo, e uma hora o peito não aguenta.
 *
 * Aqui ela só acontece — não se joga. Respirar no ritmo, com erro que
 * custa, é coisa da cozinha.
 */
export const CRISE_ABRE: Line[] = [
  { text: 'Tudo que eu olho nesta casa tem alguma coisa escondida embaixo.' },
  { text: 'O peito fecha. As mãos formigam.' },
  { text: 'Quatro pra dentro, quatro pra fora. Do jeito que a mãe ensinou.' },
]

export const CRISE_PASSOU: Line[] = [
  { text: '...' },
  { text: 'Passou. Ainda tá aqui. Mas passou.' },
  { text: 'Ninguém nesta casa percebe quando acontece. Melhor assim.' },
]
