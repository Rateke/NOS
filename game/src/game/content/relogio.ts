import type { Line } from '../world/types'
import type { Documento } from '../systems/leitor'

/**
 * O relógio do corredor: um puzzle que ninguém pede.
 *
 * O relógio anda; o da sala parou faz tempo, nas dez e quarenta. O rádio do
 * começo disse que o fogo começou "por volta das dez e quarenta". Quem
 * acerta o relógio do corredor nessa hora faz ele parar — e a portinha do
 * pêndulo abre. Lá dentro, dobrado em oito, o desenho que a mãe escondeu
 * onde o pai nunca mexe.
 *
 * Não tem dica nenhuma além disso. Quem não ligar as duas coisas nunca vai
 * saber que tinha alguma coisa ali.
 */

export const RELOGIO_OLHAR: Line[] = [
  { text: 'O relógio do corredor. De noite o tique-taque dele toma a casa inteira.' },
  { text: 'O da sala parou faz tempo. Ninguém nunca acertou um pelo outro.' },
  { text: 'Eu abro o vidro. Os ponteiros giram com o dedo.' },
]

export const RELOGIO_DE_NOVO: Line[] = [
  { text: 'Eu abro o vidro do relógio de novo.' },
]

/** Soltou numa hora qualquer: o relógio só continua dali. */
export const RELOGIO_CONTINUA: Line[] = [
  { text: 'O relógio continua andando, dali.' },
]

export const RELOGIO_ABRIU: Line[] = [
  { text: 'O ponteiro grande encosta no oito. O tique-taque para.' },
  { text: 'Um clique lá embaixo: a portinha do pêndulo abriu sozinha.' },
  { text: 'Tem um papel dobrado em oito, preso atrás do pêndulo.' },
]

export const RELOGIO_DEPOIS: Line[] = [
  { text: 'Elisa.' },
  { text: 'Eu falo o nome baixinho. A casa inteira fica quieta pra ouvir.' },
]

/** Voltando depois de achar o desenho: ele continua lá. */
export const RELOGIO_ACHADO: Line[] = [
  { text: 'O relógio parou nas dez e quarenta. Ninguém vai reparar.' },
]

export const DOC_DESENHO_ELISA: Documento = {
  id: 'desenho-elisa',
  tipo: 'bilhete',
  titulo: 'Atrás do pêndulo',
  paginas: [
    {
      dobras: true,
      blocos: [
        { texto: 'um desenho de giz de cera, dobrado em oito', letra: 'data' },
        { texto: 'PAI   MÃE   EU   LIAM   LIA', letra: 'elisa', respiro: 0.8, alinhar: 'centro' },
        { texto: 'eu seguro a mão do Liam porque ele tem medo do escuro', letra: 'elisa', respiro: 0.6 },
        { texto: 'a Lia não quis dar a mão, ela é brava', letra: 'elisa' },
        { texto: 'ELISA, 8 ANOS', letra: 'elisa', alinhar: 'dir', respiro: 0.6 },
      ],
    },
    {
      dobras: true,
      blocos: [
        { texto: 'no verso, a caneta', letra: 'data' },
        { texto: 'Guardei aqui porque ele tira tudo dela das paredes.', letra: 'evelyn', respiro: 0.8 },
        { texto: 'O relógio ele não abre. Ele não gosta de saber que horas são quando chega.', letra: 'evelyn' },
        { texto: 'Um dia eu conto pro Liam. Quando ele aguentar.', letra: 'evelyn', respiro: 0.6 },
      ],
    },
  ],
}
