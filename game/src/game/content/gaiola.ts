import type { Line } from '../world/types'

/**
 * A primeira sala de dentro da cabeça de Liam: uma gaiola aberta no meio, e
 * em volta uma pena, uma corrente quebrada, uma chave enferrujada e uma
 * porta fechada. O poema na parede diz o que é. A porta não tem fechadura:
 * a saída é não pegar nada e só atravessar. Quem pega as coisas carrega —
 * e, carregando, a porta não abre.
 */

export const GAIOLA_ENTRADA: Line[] = [
  { text: 'Um quarto que eu não conheço. Ou que eu conheço de dentro.' },
  { text: 'No meio, uma gaiola. Aberta.' },
]

export const POEMA: Line[] = [
  { text: 'Tem um poema escrito na parede, à mão:' },
  { text: '"Nasci atrás das grades,', style: 'read' },
  { text: 'aprendi a amar meu chão.', style: 'read' },
  { text: 'Quando o ferro desapareceu,', style: 'read' },
  { text: 'descobri que era eu', style: 'read' },
  { text: 'quem segurava a prisão."', style: 'read' },
]

export type ObjetoGaiola = 'pena' | 'corrente' | 'chave' | 'gaiola'

/** Pegar cada coisa. Ninguém manda: a mão vai sozinha. */
export const PEGAR: Record<ObjetoGaiola, Line[]> = {
  pena: [
    { text: 'Uma pena branca. Eu pego.' },
    { text: 'Não pesa nada. Eu seguro mesmo assim.' },
  ],
  corrente: [
    { text: 'Uma corrente quebrada no meio.' },
    { text: 'Quando eu pego, a ponta fecha no meu pulso. Quebrada, e fecha.' },
  ],
  chave: [
    { text: 'Uma chave enferrujada, pendurada num prego.' },
    { text: 'Deve abrir a porta. Eu guardo no bolso.' },
  ],
  gaiola: [
    { text: 'A portinha da gaiola está aberta.' },
    { text: 'Eu fecho. Por costume. Coisa aberta nesta casa sempre deu problema.' },
  ],
}

/** Devolver. */
export const LARGAR: Record<ObjetoGaiola, Line[]> = {
  pena: [{ text: 'Eu ponho a pena de volta no chão.' }],
  corrente: [{ text: 'Eu abro a ponta do pulso e deixo a corrente onde estava.' }],
  chave: [{ text: 'Eu penduro a chave de volta no prego.' }],
  gaiola: [{ text: 'Eu abro a portinha de novo.' }],
}

/** Contra a porta, carregando alguma coisa. */
export const PORTA_NAO_ABRE: Line[][] = [
  [{ text: 'A porta não abre.' }],
  [{ text: 'Não tem trinco. Não tem fechadura. Só não abre.' }],
  [{ text: 'Eu empurro com o ombro. Nada.' }],
]

/** Tentando a chave na porta. */
export const PORTA_CHAVE: Line[] = [
  { text: 'Procuro onde enfiar a chave.' },
  { text: 'A porta não tem fechadura. Nunca teve.' },
]

export const PORTA_ABRE: Line[] = [
  { text: 'A porta abre sozinha. Não tinha nada trancado.' },
]

/**
 * Quem demora muito, de verdade, recebe ajuda da própria sala — nunca
 * escrita na tela como dica.
 */
export const GAIOLA_DICA_PENA_CHAO: Line[] = [
  { text: 'Um vento que não vem de lugar nenhum levanta a pena do chão.' },
  { text: 'Ela atravessa o quarto e passa por baixo da porta. Sozinha. Sem chave nenhuma.' },
]
export const GAIOLA_DICA_PENA_MAO: Line[] = [
  { text: 'A pena escapa da minha mão.' },
  { text: 'Ela atravessa o quarto e passa por baixo da porta. Sozinha. Sem chave nenhuma.' },
]
export const GAIOLA_DICA_POEMA: Line[] = [
  { text: 'O fim do poema acende na parede, como se alguém tivesse passado o dedo nas letras:' },
  { text: '"descobri que era eu quem segurava a prisão."', style: 'read' },
]
export const GAIOLA_DICA_SOMBRA: Line[] = [
  { sombra: true, text: 'Ninguém trancou essa porta. Você é que não solta.', style: 'speech' },
  { text: 'Tudo o que eu segurava cai da minha mão e volta pro lugar.' },
]

/** Atravessou sem tocar em nada: a sombra repara. */
export const GAIOLA_LIMPA: Line[] = [
  { sombra: true, text: 'Você não pegou nada. Primeira vez.', style: 'speech' },
]
