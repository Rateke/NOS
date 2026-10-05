/**
 * Segredos da demo.
 *
 * Nenhum deles é anunciado — nem som, nem estrela, nem aviso. Achar um
 * segredo é ver uma coisa que estava escondida, e só. Olhar de novo um
 * objeto não conta: segredo é o que pede paciência (esperar), atenção
 * (reparar no que ninguém comenta) ou coragem de fazer o que o jogo não
 * pede. O fecho mostra quantos foram achados — é a única pista de que
 * existem.
 */
export const SEGREDOS = [
  'porta-menu',   // esperar no menu até a porta do fim do corredor abrir
  'poste',        // reparar no vulto embaixo do poste e ir até a janela
  'melodia',      // tocar o tema ao contrário no piano da sala
  'bater',        // bater três vezes na porta que não abre
  'pratos',       // reparar que a mesa da cozinha tem cinco pratos
  'radio',        // abaixar o rádio da cozinha, que já sabe do incêndio
  'caderno',      // esperar na última página, em branco, do caderno de Amélia
  'marcas',       // esperar na folha arrancada do diário: ficou a marca da caneta
  'lata',         // depois do grito, entrar pela luz da cabana e escutar a lata
  'floresta',     // pela fresta do armário, ficar olhando até ver a Lia no mato
  'partitura',    // depois do grito, tocar a partitura roxa no violoncelo até o fim
  'gaiola',       // dentro da cabeça, atravessar a porta sem pegar nada
  'relogio',      // acertar o relógio do corredor na hora em que o fogo começou
] as const

export type Segredo = (typeof SEGREDOS)[number]
