import type { Line } from '../world/types'

/**
 * O violoncelo, na casa depois do grito.
 *
 * Embaixo dele, no chão do quarto, uma partitura a lápis roxo que Liam não
 * lembra de ter: a frase que a mãe tocava subindo, para ele dormir, e um
 * fim que ninguém nesta casa tocou — que fica lá em cima, sem descer.
 * Quem toca até o fim ouve o piano da sala responder sozinho, e o quinto
 * retrato volta para o prego.
 */

/** Em graus da escala: a frase de baixo para cima, e o fim que não desce. */
export const PARTITURA = [0, 1, 3, 2, 4, 5, 7, 4, 5, 7]

export const PARTITURA_TITULO = 'pra quando você não conseguir dormir — E.'

export const VIOLONCELO_PEGAR: Line[] = [
  { text: 'O violoncelo ficou torto no gancho. Ninguém endireitou.' },
  { text: 'Embaixo dele, no chão, uma partitura que eu não lembrava de ter. A lápis roxo.' },
  { text: 'Eu tiro ele da parede. É mais pesado do que eu lembrava.' },
]

export const VIOLONCELO_DE_NOVO: Line[] = [
  { text: 'O violoncelo de novo. A partitura eu já sei de cor.' },
]

export const VIOLONCELO_TERMINOU: Line[] = [
  { text: 'A última nota fica no quarto. Não desce.' },
  { text: '...' },
  { text: 'Lá embaixo, na sala, o piano responde. Sozinho. Em maior, como ninguém nunca tocou.' },
]

export const QUINTO_RETRATO_VAZIO: Line[] = [
  { text: 'A marca mais clara na parede, onde ficava um quinto retrato.' },
  { text: 'O prego continua lá. Esperando.' },
]

export const QUINTO_RETRATO: Line[] = [
  { text: 'O quinto retrato voltou para o prego.' },
  { text: 'Uma mulher que eu nunca vi. Ela segura as mãos do mesmo jeito que eu seguro.' },
  { text: 'Atrás, a lápis roxo:', },
  { text: 'você tocou até o fim. eu escutei. — E.', style: 'read' },
]
