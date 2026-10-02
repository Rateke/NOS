import type { Line } from '../world/types'

/**
 * A segunda partida.
 *
 * Quem termina a demo e aperta "Só mais um" de novo não volta para a mesma
 * casa: volta para uma casa que lembra. Pouca coisa muda — uma fala aqui,
 * um relógio ali —, e é isso que incomoda. O jogo sabe que você já esteve
 * aqui. Algumas pessoas dentro dele também.
 */

/** O pai, antes de a aula começar. */
export const DE_NOVO_PROLOGO: Line[] = [
  { speaker: 'Adrian', text: 'De novo, filho?', style: 'speech' },
  { text: '...' },
]

/** Quando Liam acerta a primeira frase de primeira. */
export const DE_NOVO_ACERTOU: Line[] = [
  { speaker: 'Adrian', text: 'Você já sabe essa.', style: 'speech' },
  { speaker: 'Adrian', text: 'Eu sei que sabe.', style: 'speech' },
  { text: 'A mão dele no meu ombro. Mais pesada que da outra vez.' },
]

/** Lia, no hospital, entre uma frase e outra. */
export const DE_NOVO_LIA: Line = {
  speaker: 'Lia',
  text: 'Eu já te falei tudo isso, né? Ontem. Anteontem. Eu falo a mesma coisa todo dia, pra ver se uma hora você responde.',
  style: 'speech',
}

/** Na casa, logo que a sala abre. Ela ainda não devia estar aqui. */
export const DE_NOVO_CASA: Line[] = [
  { sombra: true, text: 'Você já esteve aqui.', style: 'speech' },
]

/** A janela da sala, na segunda vez: o poste está vazio. */
export const DE_NOVO_JANELA: Line[] = [
  { text: 'Hoje não tem ninguém embaixo do poste.' },
  { text: 'Da outra vez tinha.' },
]

/** A janela da sala, na primeira vez, para quem viu o vulto antes de chegar perto. */
export const VULTO_SUMIU: Line[] = [
  { text: 'Tinha alguém lá embaixo do poste. Parado na chuva, olhando pra cá.' },
  { text: '...' },
  { text: 'Não tem ninguém.' },
]

/** A cozinha, na segunda vez. */
export const DE_NOVO_MESA: Line[] = [
  { text: 'Eu sei o que vem agora.' },
  { text: 'Saber não ajuda em nada.' },
]

/** Dentro, depois do fogo, na segunda vez. */
export const DE_NOVO_DENTRO: Line[] = [
  { sombra: true, text: 'Você já sabe como termina.', style: 'speech' },
  { sombra: true, text: 'Mesmo assim apertou "começar".', style: 'speech' },
]

/** O que a sombra lembra da escolha da outra vez. */
export const DE_NOVO_ESCOLHA: Record<'mae' | 'lia' | 'nenhuma', string> = {
  mae: 'Da outra vez você salvou a sua mãe.',
  lia: 'Da outra vez você salvou a Lia.',
  nenhuma: 'Da outra vez você não salvou ninguém.',
}
export const DE_NOVO_IGUAL = 'E fez igual. Você sempre faz igual.'
export const DE_NOVO_DIFERENTE = 'Achou que trocar ia mudar alguma coisa?'

/** Para quem passa as falas sem ler. A sombra percebe — e não deixa pular. */
export const SOMBRA_APRESSADO: Line[] = [
  { sombra: true, text: 'Você nem lê mais.', style: 'speech', devagar: 0.6 },
  { sombra: true, text: 'Só quer que acabe.', style: 'speech', devagar: 0.6 },
  { sombra: true, text: 'Igual a ele.', style: 'speech', devagar: 1.2 },
]

/** Parado tempo demais na casa. Ele senta no chão. */
export const NINGUEM_VEIO: Line[] = [
  { text: 'Se eu ficar quieto aqui, alguém vem me procurar.' },
  { text: '...' },
  { text: 'Ninguém veio.' },
]

/** Na casa, antes do jantar, entrando nos cômodos. Ninguém está cozinhando nada queimado. */
export const CHEIRO_QUEIMADO: Line[][] = [
  [{ text: 'Tem cheiro de queimado.' }],
  [{ text: 'O cheiro de queimado de novo. Mais forte.' }, { text: 'Ninguém mais sente?' }],
  [{ text: 'Queimado.' }, { text: 'Não vem da cozinha. Vem de perto. Vem de mim.' }],
]
