/**
 * Segredos da demo.
 *
 * Nenhum deles é anunciado. Alguns pedem insistência (olhar de novo uma coisa
 * já vista), outros pedem paciência (esperar), um pede que o jogador pense ao
 * contrário. O fecho mostra quantos foram achados — é a única pista de que
 * existem.
 */
export const SEGREDOS = [
  'porta-menu',   // esperar no menu até a porta do fim do corredor abrir
  'melodia',      // tocar o tema ao contrário no piano da sala
  'nome',         // olhar de novo as marcas de altura no corredor
  'bater',        // bater três vezes na porta que não abre
  'ninguem',      // o último retrato, no fim do corredor esticado
  'cabana',       // entrar na cabana de cobertor do quarto
  'bilhete',      // ler de novo o diário
  'pratos',       // reparar nos pratos da mesa da cozinha
  'cruzadas',     // ler o jornal até as palavras cruzadas
  'receita',      // abrir de novo o livro de receitas e contar as letras
  'caderno',      // esperar na última página, em branco, do caderno de Amélia
  'marcas',       // esperar na folha arrancada do diário: ficou a marca da caneta
  'radio',        // abaixar o rádio da cozinha, que já sabe do incêndio
] as const

export type Segredo = (typeof SEGREDOS)[number]
