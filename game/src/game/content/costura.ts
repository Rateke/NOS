import type { Line } from '../world/types'
import type { Documento } from '../systems/leitor'

/**
 * O quarto de costura da mãe, do lado da sala.
 *
 * É a primeira coisa que o jogo pede de verdade: abrir a caixa de costura
 * dela. A tranca são quatro carretéis que giram; a resposta está espalhada
 * pelo quarto — a foto diz a ordem, as roupas dizem a cor de cada um. Lá
 * dentro está o recado que diz o que fazer em seguida (ir para a cozinha),
 * sem fechar o resto da casa: o recado pede "quando você estiver pronto".
 */

/** As cores dos carretéis, na ordem em que giram. */
export const CORES_LINHA = [
  { nome: 'azul', cor: '#5f86c4' },
  { nome: 'âmbar', cor: '#e2a95e' },
  { nome: 'cinza', cor: '#9a9ca6' },
  { nome: 'rosa', cor: '#d8708a' },
  { nome: 'lilás', cor: '#b49ade' },
] as const

/** Ele, ela, eu, a Lia — do jeito que a gente sai na foto. */
export const SEGREDO_CAIXA = [0, 1, 2, 3]

/** O que está bordado na tampa. */
export const TAMPA_BORDADO = 'do jeito que a gente sai na foto'

export const CAIXA_COSTURA: Line[] = [
  { text: 'A caixa de costura da minha mãe.' },
  { text: 'Ela tranca com quatro carretéis lado a lado. Cada um gira e muda de cor.' },
  { text: 'Bordado na tampa, com a linha dela: "do jeito que a gente sai na foto".' },
  { text: 'Quando ela não pode falar alto, ela deixa recado aqui dentro.' },
]

/** Voltando à caixa ainda trancada. */
export const CAIXA_DE_NOVO: Line[] = [
  { text: '"Do jeito que a gente sai na foto."' },
]

/**
 * Dicas do quarto, para quem está preso na caixa há muito tempo. Nenhuma é
 * escrita como dica: é o quarto que se mexe. Primeiro a foto cai e mostra o
 * verso; depois o chá derrama e as linhas ficam vivas no pano molhado; por
 * último a prateleira cede e quatro carretéis rolam em fila até a caixa.
 */
export const PISTAS_COSTURA: Line[][] = [
  [
    { text: 'Um estalo atrás de mim. A foto da parede escorregou do prego e caiu de pé no chão.' },
    { text: 'O vidro trincou. Eu viro pra ver se rasgou.' },
    { text: 'Atrás, a lápis, na letra dela: "nós quatro, do jeito de sempre — Adrian, Evelyn, Liam, Lia."' },
  ],
  [
    { text: 'A xícara de chá que ela esqueceu na prateleira tomba sozinha.' },
    { text: 'O chá pinga no cesto. No pano molhado, os pontos de linha ficam vivos: cinza no meu uniforme, rosa na jaqueta da Lia.' },
    { text: 'E aí eu vejo o resto: a barra âmbar do avental dela, o ponto azul no paletó dele. Cada um tem a sua cor.' },
  ],
  [
    { text: 'A prateleira de carretéis cede de um lado.' },
    { text: 'Quatro rolam pelo chão e param em fila na frente da caixa: azul, âmbar, cinza, rosa.' },
    { text: 'O lilás fica lá em cima, sozinho.' },
  ],
]

/** Quantos carretéis já estão certos, depois de uma tentativa. */
export function encaixam(n: number): string {
  if (n <= 0) return 'Nenhum carretel encaixa.'
  if (n === 1) return 'Um carretel encaixa. Os outros, não.'
  if (n === 4) return 'Os quatro encaixam.'
  return `${['', '', 'Dois', 'Três'][n]} carretéis encaixam. Os outros, não.`
}

export const CAIXA_ABRIU: Line[] = [
  { text: 'Clique. A tampa solta.' },
  { text: 'Por cima das linhas, dobrado em quatro, um papel com a letra dela.' },
]

export const DOC_RECADO_MAE: Documento = {
  id: 'recado-mae',
  tipo: 'bilhete',
  titulo: 'Na caixa de costura',
  paginas: [
    {
      dobras: true,
      blocos: [
        { texto: 'manga do paletó — 2 cm (ele quer pra sexta)', letra: 'pequeno', riscado: true },
        { texto: 'jaqueta da Lia — cotovelo. Rosa, ela disse. Rosa-choque.', letra: 'pequeno' },
        { texto: 'uniforme do L. — botão da gola', letra: 'pequeno' },
        { texto: 'linha lilás — NÃO jogar fora', letra: 'pequeno' },
        { texto: 'Liam,', letra: 'evelyn', respiro: 1 },
        { texto: 'se você abriu, é porque lembrou da foto. Eu sabia que ia lembrar.', letra: 'evelyn' },
        { texto: 'Quando você estiver pronto, vem pra cozinha. Senta do meu lado — não do lado dele.', letra: 'evelyn', respiro: 0.5 },
        { texto: 'Do meu lado ele fala mais baixo. Você não precisa dizer nada. Só vem.', letra: 'evelyn' },
        { texto: 'Depois do jantar eu tenho uma coisa pra te contar. É coisa boa.', letra: 'evelyn', respiro: 0.5 },
        { texto: '— Mãe', letra: 'evelyn', alinhar: 'dir' },
      ],
    },
  ],
}

/** Ao fechar o recado. O caminho fica dito, e a casa continua aberta. */
export const RECADO_DEPOIS: Line[] = [
  { text: 'A cozinha. Do lado dela.' },
  { text: 'Ela disse "quando você estiver pronto". Ainda dá pra olhar o resto da casa antes.' },
]

/** Na abertura, para o jogador saber por onde começar. */
export const CASA_LUZ_COSTURA: Line[] = [
  { text: 'A luz da costura está acesa, do lado da sala.' },
  { text: 'Quando ela não pode falar, ela deixa recado lá.' },
]

/** Depois do grito, a porta da costura não abre. */
export const COSTURA_TRANCADA: Line[] = [
  { text: 'A porta da costura não abre.' },
  { text: 'Do outro lado, a máquina dela está quieta. Eu nunca tinha ouvido ela quieta.' },
]

/**
 * Quem anda muito tempo sem rumo ouve o próprio Liam lembrar do próximo
 * passo. Uma linha só, e só duas vezes por etapa: é um empurrão, não uma
 * ordem.
 */
export const LEMBRETE_RECADO: Line[][] = [
  [{ text: 'A luz da costura continua acesa, do lado da sala. O recado dela deve estar lá.' }],
  [{ text: 'A caixa de costura dela, do lado da sala. O recado deve estar lá dentro.' }],
]
export const LEMBRETE_COZINHA: Line[][] = [
  [{ text: 'Ela pediu pra eu ir pra cozinha. A porta é no corredor.' }],
  [{ text: 'Do lado dela ele grita menos. A cozinha, no corredor.' }],
]
