import { WORLD_H } from '../../engine/constants'
import type { Line } from './types'
import type { Documento } from '../systems/leitor'
import {
  DOC_DIARIO, DOC_DIARIO_CONTRACAPA, DOC_RECEITAS, DOC_JORNAL, DOC_CARTA_ESCOLA, DOC_CADERNO_LIA,
} from '../content/documentos'
import type { RGB } from './arte'
import {
  rgb, clarear, ret, sorteio, papelDeParede, lambri, assoalho, porta, quadro, cantos,
} from './arte'
import {
  sanca, rodape, interruptor, calendario, sapatos, desenhoNaPorta, cestoRoupa, criadoMudo,
  pilhaLivros, mochilaEscola, marcaDeQuadro, sombraDeContato, luarNoChao,
} from './detalhes'
import {
  drawSalaFundo, drawSalaFrente, drawLuzSala,
  SALA_W, SALA_PORTA, CHAO_Y as SALA_CHAO, PASSO_Y as SALA_PASSO, ABAJUR, PIANO,
} from './sala'

/**
 * A casa explorável.
 *
 * Cada cômodo é um dado: largura, chão, limites, portas e vestígios. A cena
 * de exploração só lê isto — assim dá para acrescentar cômodo sem mexer em
 * lógica nenhuma.
 *
 * Regra de ouro desta versão: **todo vestígio está em cima de uma coisa
 * desenhada**. Se Liam fala do casaco, o casaco está no cabide; se fala das
 * marcas de altura, os riscos estão no batente. E toda parede é parede: Liam
 * não sai do cômodo por onde não há porta.
 */

export interface Porta {
  /** Centro da porta, em coordenadas do cômodo. */
  x: number
  /** Cômodo de destino. */
  para: string
  /** Onde Liam aparece no destino. */
  entraEm: number
  rotulo: string
  /** Porta que não abre: a cena decide o que acontece ao tentar. */
  travada?: boolean
  /** O que Liam pensa ao tentar uma porta trancada que não é a do fim. */
  fala?: Line[]
}

export interface VestigioCasa {
  id: string
  x: number
  rotulo: string
  linhas: Line[]
  /** Olhar de novo mostra outra coisa. Nada avisa que isso existe. */
  deNovo?: Line[]
  /** Segredo marcado quando `deNovo` é lido (ou na primeira leitura, sem ele). */
  segredo?: string
  /** Está na parede do fundo: Liam vira de costas para a câmera para olhar. */
  naParede?: boolean
  /** Em vez de só ler: sentar ao piano, entrar na cabana, ouvir o recado. */
  acao?: 'piano' | 'cabana' | 'secretaria' | 'conversaLia' | 'no'
  /** O que Liam fica sabendo ao olhar (vira linha no caderno). */
  aprende?: string
  /** Só existe quando o corredor já esticou até este comprimento. */
  minLargura?: number
  /** Algo para ler de verdade: abre o leitor depois de `linhas`. */
  documento?: Documento
  /** Na segunda leitura, depois de `deNovo`, abre esta versão. */
  documentoDeNovo?: Documento
  /** Dito ao fechar o documento, na primeira leitura. */
  depois?: Line[]
}

/** O que muda de quadro para quadro e o desenho precisa saber. */
export interface EstadoComodo {
  t: number
  /** Tecla do piano acesa (sala), ou -1. */
  tecla: number
  brilhoTecla: number
  /** Vestígios já vistos; `id+` quando visto de novo. */
  vistos: ReadonlySet<string>
  /** 0..1: alguém do outro lado da porta do fim. */
  sinal: number
  /** A hora no relógio do corredor. Parado: depois do grito, 22:40 para sempre. */
  hora?: { h: number; m: number; parado: boolean }
  /** 0..1: alguém embaixo do poste, lá fora (só a sala mostra). */
  vulto?: number
  /** O retrato grande da sala, torto (radianos). */
  retratoTorto?: number
}

export interface Comodo {
  id: string
  nome: string
  largura: number
  /** Linha do rodapé, onde a parede encontra o chão. */
  chaoY: number
  /** Linha dos pés de Liam, na frente dos móveis. */
  passoY: number
  /** Até onde Liam anda. Além disso é parede. */
  limiteEsq: number
  limiteDir: number
  /** De onde vem a luz que recorta a silhueta de Liam. */
  luzX: number
  portas: Porta[]
  vestigios: VestigioCasa[]
  desenharFundo(c: CanvasRenderingContext2D, e: EstadoComodo): void
  /** Luz e névoa: depois do fundo, antes de Liam — para não engoli-lo. */
  atmosfera?(c: CanvasRenderingContext2D, e: EstadoComodo): void
  /** Móveis entre Liam e a câmera. */
  desenharFrente?(c: CanvasRenderingContext2D, e: EstadoComodo): void
}

const CHAO = 156
const PASSO = 167

/** Brilho que soma luz, sem apagar o que há embaixo. */
function brilho(
  c: CanvasRenderingContext2D, x: number, y: number, r: number, cor: string, a: number,
): void {
  c.save()
  c.globalCompositeOperation = 'lighter'
  const g = c.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, `rgba(${cor},${a})`)
  g.addColorStop(1, `rgba(${cor},0)`)
  c.fillStyle = g
  c.fillRect(x - r, y - r, r * 2, r * 2)
  c.restore()
}

/**
 * Escurece o cômodo inteiro por multiplicação. As fontes de luz entram
 * depois, somando — assim a textura das paredes continua embaixo da sombra.
 */
function sombra(c: CanvasRenderingContext2D, largura: number, fundo: string): void {
  c.save()
  c.globalCompositeOperation = 'multiply'
  c.fillStyle = fundo
  c.fillRect(0, 0, largura, WORLD_H)
  c.restore()
}

// --- Sala -------------------------------------------------------------------

/** Calor da sala na exploração: o prólogo já passou, sobrou um resto. */
const K_SALA = 0.34

export function comodoSala(depois = false): Comodo {
  const estado = (e: EstadoComodo) => ({
    k: depois ? 0.12 : K_SALA, t: e.t, tecla: e.tecla, brilhoTecla: e.brilhoTecla, vulto: e.vulto,
    // Depois do grito ninguém endireita mais nada.
    retratoTorto: depois ? 0.2 : e.retratoTorto,
  })
  return {
    id: 'sala',
    nome: 'Sala',
    largura: SALA_W,
    chaoY: SALA_CHAO,
    passoY: SALA_PASSO,
    limiteEsq: 24,
    limiteDir: SALA_W - 24,
    luzX: ABAJUR.x,
    portas: [{ x: SALA_PORTA, para: 'corredor', entraEm: 42, rotulo: 'Corredor' }],
    vestigios: [
      {
        id: 'janela', x: 68, rotulo: 'Olhar', naParede: true,
        linhas: [
          { text: 'Lá fora é noite. Aqui dentro também.' },
          { text: 'O poste da rua pisca. Três curtas, três longas, três curtas. Para. Começa de novo.' },
          { text: 'Faz anos que pisca assim e ninguém da prefeitura vem consertar.' },
        ],
        deNovo: [
          { text: 'Três curtas, três longas, três curtas.' },
          { text: 'Era assim que a gente batia na porta um do outro, quando não dava pra falar alto.' },
          { text: 'Eu e...' },
          { text: 'Eu e quem?' },
        ],
      },
      {
        id: 'piano', x: PIANO.cx, rotulo: 'Tocar', acao: 'piano',
        linhas: [
          { text: 'O piano continua aberto.' },
          { text: 'A partitura é a mesma. Na margem, na letra dele: "devagar — ela não fecha".' },
          { text: 'Era do avô dele. Ninguém mais nesta casa sabe tocar. Só eu.' },
        ],
      },
      {
        id: 'retratos-sala', x: 243, rotulo: 'Olhar', naParede: true,
        linhas: [
          { text: 'Os retratos da sala são os bons. Os de festa, os de praia.' },
          { text: 'Quatro pessoas. Duas. Três.' },
          { text: 'Em nenhum deles tem cinco. Mas em todos sobra espaço na ponta, como se alguém tivesse saído do enquadramento.' },
        ],
        deNovo: [
          { text: 'No maior, o vidro está limpo só num canto.' },
          { text: 'Como se alguém passasse o dedo ali todo dia, no mesmo lugar.' },
        ],
      },
      {
        id: 'cobertor', x: 380, rotulo: 'Olhar',
        linhas: [
          { text: 'O cobertor dobrado no braço do sofá.' },
          { text: 'Minha mãe dorme aqui quando ele chega tarde.' },
          { text: 'De manhã ela dobra antes de ele acordar. Pra não parecer.' },
          { text: 'Ele sabe. Ele dobra também, quando ela esquece. É o único jeito que eles têm de concordar em alguma coisa.' },
        ],
      },
      {
        id: 'jornal', x: 320, rotulo: 'Ler',
        linhas: [
          { text: 'O jornal de hoje, dobrado na mesinha. Ele sempre lê primeiro e devolve dobrado do jeito que veio.' },
          { text: 'Tem café derramado na primeira página.' },
        ],
        documento: DOC_JORNAL,
        depois: [
          { text: 'Alguém circulou um anúncio a caneta. A letra é da minha mãe.' },
          { text: 'E alguém respondeu uma palavra das cruzadas a lápis.' },
          { text: 'Não fui eu.' },
        ],
      },
      {
        id: 'livro', x: 438, rotulo: 'Abrir',
        linhas: [
          { text: 'O livro de receitas. Minha mãe guarda as contas dentro dele.' },
        ],
        documento: DOC_RECEITAS,
        depois: [
          { text: 'Na página do bolo tem três letras: a dela, a minha e a da Lia.' },
          { text: 'Deu tudo errado naquele dia. Ninguém precisou ser corrigido.' },
        ],
        deNovo: [
          { text: 'Abro de novo na página do bolo.' },
          { text: 'Eu sempre disse que ali tinha três letras.' },
          { text: 'Tem quatro.' },
          { text: '"e granulado por cima!!" — a lápis roxo, letra redonda, de criança.' },
          { text: 'Ninguém nesta casa escreve assim.' },
        ],
        segredo: 'receita',
      },
    ],
    desenharFundo(c, e) {
      drawSalaFundo(c, estado(e))
      if (depois) baguncaSala(c)
    },
    atmosfera(c, e) {
      drawLuzSala(c, estado(e), 'sala')
      if (depois) dessaturar(c, SALA_W)
    },
    desenharFrente(c, e) {
      drawSalaFrente(c, estado(e))
    },
    ...(depois ? { vestigios: SALA_DEPOIS } : {}),
  }
}

/**
 * A casa depois do grito. Ninguém arrumou nada, e nada pede para ser
 * arrumado: Liam pode olhar tudo, e a escolha é deixar como está.
 */
const SALA_DEPOIS: VestigioCasa[] = [
  {
    id: 'd-janela', x: 68, rotulo: 'Olhar', naParede: true,
    linhas: [
      { text: 'O poste continua piscando. Três curtas, três longas, três curtas.' },
      { text: 'Antes eu achava que era defeito.' },
      { text: 'Agora parece que é pra mim.' },
    ],
  },
  {
    id: 'd-piano', x: PIANO.cx, rotulo: 'Olhar',
    linhas: [
      { text: 'O piano está fechado. A partitura está no chão, rasgada no meio da terceira frase.' },
      { text: 'Bem onde ela desce até o começo.' },
      { text: 'Eu não abro.' },
    ],
  },
  {
    id: 'd-retratos', x: 243, rotulo: 'Olhar', aprende: 'nao-arrumou',
    linhas: [
      { text: 'Os retratos da sala caíram. O vidro do maior trincou bem no meio da família.' },
      { text: 'A minha mão já está indo.' },
      { sombra: true, text: 'Deixa. Se você arrumar agora, é pra ninguém ver que caiu. É a mesma coisa de sempre, só que com vidro.', style: 'speech' },
      { text: 'Eu deixo no chão.' },
      { text: 'É a coisa mais difícil que eu já fiz nesta sala.' },
    ],
  },
  {
    id: 'd-garrafa', x: 410, rotulo: 'Olhar', aprende: 'garrafa',
    linhas: [
      { text: 'Uma garrafa de conhaque rolou pra debaixo do sofá.' },
      { text: 'Está cheia até o gargalo. Ainda tem a etiqueta de preço do Natal.' },
      { text: 'O pai sempre diz que é dela. Que ela bebe escondida.' },
      { text: 'Ninguém bebe escondido de uma garrafa cheia.' },
    ],
  },
  {
    id: 'd-cobertor', x: 380, rotulo: 'Olhar',
    linhas: [
      { text: 'O cobertor que a mãe dobrava antes de ele acordar está no chão, aberto.' },
      { text: 'Ninguém dobrou.' },
      { text: 'Ninguém vai dobrar.' },
    ],
  },
  {
    id: 'd-livro', x: 438, rotulo: 'Abrir',
    linhas: [
      { text: 'O livro de receitas, aberto no chão na página do bolo de chocolate.' },
      { text: 'As contas caíram de dentro dele. Ninguém juntou.' },
    ],
    documento: DOC_RECEITAS,
  },
]

/** As cores reais das coisas: sem a narração do Adrian, a casa perde o filtro. */
function dessaturar(c: CanvasRenderingContext2D, largura: number): void {
  c.save()
  c.globalCompositeOperation = 'saturation'
  c.globalAlpha = 0.82
  c.fillStyle = 'rgb(128,128,128)'
  c.fillRect(0, 0, largura, WORLD_H)
  c.restore()
}

/** A sala depois da onda: retratos no chão, partitura rasgada, garrafa. */
function baguncaSala(c: CanvasRenderingContext2D): void {
  const chao = SALA_CHAO
  // Retratos caídos, um com o vidro trincado
  ret(c, 228, chao + 4, 16, 3, '#4a3e36')
  ret(c, 230, chao + 3, 12, 1, 'rgba(190,200,220,0.4)')
  ret(c, 247, chao + 6, 12, 3, '#3e342e')
  c.fillStyle = 'rgba(220,226,240,0.55)'
  for (let i = 0; i < 6; i++) c.fillRect(233 + i, chao + 4 + (i % 2), 1, 1)
  // Folhas da partitura espalhadas
  for (const [x, y, w] of [[120, 6, 7], [134, 9, 6], [168, 5, 8], [182, 10, 5]] as const) {
    ret(c, x, chao + y, w, 3, '#cfc8b8')
    ret(c, x + 1, chao + y + 1, w - 2, 1, 'rgba(40,40,50,0.35)')
  }
  // O cobertor aberto no chão
  ret(c, 362, chao + 6, 30, 4, '#55485a')
  ret(c, 366, chao + 5, 18, 1, '#685a6e')
  // A garrafa deitada debaixo do sofá
  ret(c, 404, chao + 8, 10, 3, '#5a4a30')
  ret(c, 414, chao + 9, 3, 1, '#4a3c26')
  ret(c, 405, chao + 8, 6, 1, 'rgba(230,220,190,0.35)')
}

// --- Corredor ---------------------------------------------------------------

/** Cresce conforme Liam anda. Começa curto e vira túnel. */
export const CORREDOR_BASE = 520
export const CORREDOR_MAX = 1180

const PAREDE_CORR: RGB = [23, 27, 39]
const LAMBRI_CORR: RGB = [19, 23, 34]
const CHAO_CORR: RGB = [26, 29, 40]

export function comodoCorredor(largura: number, depois = false): Comodo {
  const portaFim = largura - 46
  const ultimoRetrato = largura - 112
  const esticado = largura >= CORREDOR_MAX

  return {
    id: 'corredor',
    nome: 'Corredor',
    largura,
    chaoY: CHAO,
    passoY: PASSO,
    limiteEsq: 24,
    limiteDir: largura - 24,
    luzX: 70,
    portas: [
      { x: 42, para: 'sala', entraEm: SALA_PORTA, rotulo: 'Sala' },
      { x: 150, para: 'quarto', entraEm: 300, rotulo: 'Meu quarto' },
      depois
        ? {
          x: 268, para: 'cozinha', entraEm: 0, rotulo: 'Cozinha', travada: true,
          fala: [
            { text: 'A porta da cozinha não abre.' },
            { text: 'Por baixo dela não sai luz nenhuma. Só um cheiro de pano queimado.' },
            { text: 'E o rádio, lá dentro, ainda ligado. Agora dá pra ouvir o boletim inteiro.' },
            { text: '"...o adolescente de treze anos segue internado, em estado grave, sem previsão de alta..."', style: 'read' },
            { text: 'Treze anos.' },
          ],
        }
        : { x: 268, para: 'cozinha', entraEm: 0, rotulo: 'Cozinha' },
      { x: LIA_PORTA, para: 'lia', entraEm: 44, rotulo: 'Quarto da Lia' },
      { x: portaFim, para: 'impossivel', entraEm: 0, rotulo: 'Abrir', travada: true },
    ],
    vestigios: [
      {
        id: 'escova', x: 86, rotulo: 'Abrir a gaveta',
        linhas: [
          { text: 'Na gaveta do aparador, uma escova de cabelo pequena.' },
          { text: 'Tem fios presos nela. Compridos e claros.' },
          { text: 'Ninguém nesta casa tem cabelo claro.' },
        ],
      },
      {
        id: 'cartas', x: 118, rotulo: 'Ler',
        linhas: [
          { text: 'Cartas em cima do aparador. A de cima já foi aberta.' },
          { text: 'É da minha escola. A minha redação veio junto, com nota.' },
        ],
        aprende: 'carta-escola',
        documento: DOC_CARTA_ESCOLA,
        depois: [
          { text: 'Ele ligou pra escola e disse que estava tudo bem.' },
          { text: 'A redação tirou dez. Ninguém aqui em casa leu.' },
        ],
      },
      {
        id: 'retratos', x: 202, rotulo: 'Olhar', naParede: true,
        linhas: [
          { text: 'O retrato grande do corredor.' },
          { text: 'Minha mãe, meu pai. A Lia e eu, do mesmo tamanho.' },
          { text: 'E um espaço entre mim e a minha mãe. Do tamanho de uma pessoa.' },
          { text: 'Ninguém recortou a foto. A gente é que ficou longe.' },
        ],
      },
      {
        id: 'caderno-lia', x: 176, rotulo: 'Pegar', aprende: 'lia-caderno',
        linhas: [
          { text: 'O caderno da Lia, esquecido no chão do corredor. Caneta vermelha, letra apertada.' },
          { text: 'Ela não deixa ninguém ler. Ela também não deixa nada no chão.' },
        ],
        documento: DOC_CADERNO_LIA,
        depois: [
          { text: 'Número quatro.' },
          { text: 'Eu olho pras minhas mãos. Estão arrumando a alça da mochila dela.' },
        ],
      },
      {
        id: 'casaco', x: 232, rotulo: 'Olhar',
        linhas: [
          { text: 'Um casaco no cabide que não serve em ninguém daqui.' },
          { text: 'Grande demais pra mim. Pequeno demais pra minha mãe.' },
          { text: 'No bolso, papel de bala de hortelã. Ninguém aqui gosta de hortelã.' },
        ],
      },
      {
        id: 'marcas', x: 306, rotulo: 'Olhar', naParede: true,
        linhas: [
          { text: 'Riscos de altura no batente da rouparia. Um por ano.' },
          { text: 'LIAM e LIA, lado a lado, quase na mesma altura.' },
          { text: 'E uma fileira mais alta que a nossa, sem nome. Lixaram o nome.' },
        ],
        deNovo: [
          { text: 'De perto dá pra ler o que a lixa não pegou.' },
          { text: 'E. L. I.', style: 'read' },
          { text: 'Alguém mediu essa pessoa todo ano. Até ela ficar mais alta que a porta da minha memória.' },
        ],
        segredo: 'nome',
      },
      {
        id: 'ninguem', x: ultimoRetrato, rotulo: 'Olhar', naParede: true,
        minLargura: CORREDOR_MAX,
        linhas: [
          { text: 'O último retrato do corredor.' },
          { text: 'Não tem ninguém nele. Só o corredor, de dia, com sol entrando.' },
          { text: 'Quem tirou a foto não aparece.' },
          { text: 'Alguém sempre ficava do outro lado da câmera.' },
        ],
        segredo: 'ninguem',
      },
    ],
    ...(depois ? { vestigios: CORREDOR_DEPOIS } : {}),

    desenharFundo(c, e) {
      const t = e.t
      papelDeParede(c, 0, largura, 0, 98, PAREDE_CORR, 5)
      floresta(c, 520, largura - 70)
      ret(c, 0, 0, largura, 4, rgb(clarear(PAREDE_CORR, 10)))
      ret(c, 0, 4, largura, 1, 'rgba(0,0,0,0.3)')
      lambri(c, 0, largura, 100, CHAO, LAMBRI_CORR)
      assoalho(c, 0, largura, CHAO, WORLD_H, CHAO_CORR)
      sanca(c, 0, largura, PAREDE_CORR)
      rodape(c, 0, largura, CHAO, LAMBRI_CORR)
      passadeira(c, 30, largura - 150)
      folhas(c, 640, largura - 20)
      cantos(c, largura, CHAO, WORLD_H, PAREDE_CORR)

      // Arandelas: cada vez mais espaçadas e mais fracas. A terceira pisca.
      for (let i = 0; ; i++) {
        const lx = 96 + i * 150
        if (lx > largura - 90) break
        arandela(c, lx, i === 2 ? (Math.sin(t * 13) > 0.7 ? 0.2 : 1) : 1 - Math.min(0.7, i * 0.1))
      }

      aparador(c, 72)
      if (depois) secretaria(c, 72)
      porta(c, 42, CHAO, { luz: true, cor: [40, 42, 56] })
      porta(c, 150, CHAO, { cor: [34, 42, 60] })
      // O desenho colado na porta do quarto dele
      desenhoNaPorta(c, 146, 104)
      // Dois pregos sem quadro entre as portas
      marcaDeQuadro(c, 112, 30, 16, 20)
      marcaDeQuadro(c, 246, 34, 14, 18)
      sombraDeContato(c, 72, CHAO, 56)
      interruptor(c, 62, 92, 0)
      interruptor(c, 170, 92, 0)
      interruptor(c, 288, 92, 0)
      calendario(c, 296, 46)
      if (!depois) sapatos(c, 74, CHAO + 9)

      // O retrato grande, com o vão entre Liam e a mãe. Depois do grito, torto.
      if (depois) {
        quadro(c, 182, 30, 44, 32, { figuras: 4, vazios: [2], moldura: [82, 66, 52], foto: [30, 28, 34] })
        ret(c, 180, 60, 48, 3, 'rgba(0,0,0,0.35)')
      } else {
        quadro(c, 180, 26, 44, 32, { figuras: 4, vazios: [2], moldura: [82, 66, 52], foto: [30, 28, 34] })
      }
      ret(c, 201, 20, 1, 6, 'rgba(0,0,0,0.5)')
      cadernoNoChao(c, 176)
      cabideiro(c, 232)
      if (depois) ret(c, 224, CHAO + 6, 18, 4, '#5a4a2e')

      porta(c, 268, CHAO, { luz: !depois, cor: [38, 42, 58] })
      // A briga na cozinha escapa por baixo da porta, em pulsos.
      if (!depois) {
        const briga = 0.18 + Math.max(0, Math.sin(t * 2.3)) * 0.22
        ret(c, 253, CHAO - 2, 30, 2, `rgba(236,176,112,${briga})`)
      }

      rouparia(c, 326, e.vistos.has('marcas+'))
      cestoRoupa(c, 352, CHAO + 2)
      relogio(c, 366, 34, t, e.hora)
      // A porta da Lia: adesivos, e a placa que ela mesma fez.
      porta(c, LIA_PORTA, CHAO, { cor: [52, 34, 44], luz: !depois })
      ret(c, LIA_PORTA - 9, 104, 18, 7, '#d8ccb4')
      ret(c, LIA_PORTA - 7, 106, 14, 1, '#7a2a36')
      ret(c, LIA_PORTA - 5, 108, 10, 1, '#7a2a36')
      ret(c, LIA_PORTA - 10, 120, 4, 4, '#c85a6a')
      ret(c, LIA_PORTA + 6, 128, 3, 3, '#e0c060')

      // Retratos do fundo: a família vai sumindo de um quadro para o outro.
      for (let i = 0; ; i++) {
        const qx = 452 + i * 76
        if (qx > ultimoRetrato - 60) break
        const r = sorteio(i * 31 + 7)
        const w = 22 + Math.floor(r() * 10)
        const h = 18 + Math.floor(r() * 8)
        const y = 26 + Math.floor(r() * 14)
        const figuras = Math.max(1, 4 - Math.floor(i / 2))
        quadro(c, qx, y, w, h, {
          figuras, vazios: i >= 1 ? [1] : [], moldura: [66 - i * 3, 58 - i * 2, 56],
        })
      }
      if (esticado) retratoVazio(c, ultimoRetrato - 14, 30)

      portaDoFim(c, portaFim, e.sinal, t)
    },

    atmosfera(c, e) {
      sombra(c, largura, 'rgb(182,186,204)')
      for (let i = 0; ; i++) {
        const lx = 96 + i * 150
        if (lx > largura - 90) break
        const acesa = i === 2 ? (Math.sin(e.t * 13) > 0.7 ? 0.2 : 1) : 1 - Math.min(0.7, i * 0.1)
        brilho(c, lx, 50, 70, '255,214,160', 0.16 * acesa * (depois ? 0.5 : 1))
      }
      brilho(c, 42, CHAO - 4, 40, '236,190,130', 0.12)
      if (!depois) brilho(c, 268, CHAO - 4, 44, '236,170,110', 0.1 + Math.max(0, Math.sin(e.t * 2.3)) * 0.08)
      if (depois) {
        dessaturar(c, largura)
        // A luz âmbar da secretária: a única cor da casa. É da mãe.
        const liga = Math.sin(e.t * 3.2) > 0 ? 1 : 0.15
        brilho(c, 72 + 47, CHAO - 39, 10, '255,180,90', 0.6 * liga)
        ret(c, 72 + 46, CHAO - 40, 2, 2, `rgba(255,184,96,${0.4 + liga * 0.6})`)
      }
      if (e.sinal > 0) brilho(c, portaFim, CHAO - 6, 60, '200,210,255', e.sinal * 0.35)

      // O fundo do corredor engole a luz: quanto mais longe, mais escuro.
      // Forte o bastante para a porta do fim parecer longe, fraco o bastante
      // para Liam continuar visível quando chegar lá.
      const g = c.createLinearGradient(largura - 260, 0, largura, 0)
      g.addColorStop(0, 'rgba(4,6,10,0)')
      g.addColorStop(1, 'rgba(4,6,10,0.5)')
      c.fillStyle = g
      c.fillRect(largura - 260, 0, 260, WORLD_H)
    },
  }
}

/** Árvores fantasmas no papel de parede: o corredor que virava floresta. */
function floresta(c: CanvasRenderingContext2D, x0: number, x1: number): void {
  if (x1 <= x0) return
  const r = sorteio(77)
  for (let x = x0; x < x1; x += 22 + Math.floor(r() * 28)) {
    const a = Math.min(0.5, ((x - x0) / 480) * 0.5)
    const alt = 44 + Math.floor(r() * 46)
    c.fillStyle = `rgba(8,18,16,${a})`
    c.fillRect(x, 98 - alt, 2 + Math.floor(r() * 2), alt)
    for (let g = 0; g < 5; g++) {
      const gy = 98 - alt + 4 + g * 9
      const len = 4 + Math.floor(r() * 9)
      c.fillRect(g % 2 === 0 ? x + 2 : x - len, gy, len, 1)
      c.fillRect(g % 2 === 0 ? x + 1 + len : x - len - 1, gy - 1, 1, 1)
    }
  }
}

/** Folhas secas no chão do fundo. Ninguém varre o que não existe. */
function folhas(c: CanvasRenderingContext2D, x0: number, x1: number): void {
  if (x1 <= x0) return
  const r = sorteio(19)
  const cores = ['#3a3326', '#2e3324', '#43321f', '#2a2a22']
  for (let x = x0; x < x1; x += 3 + Math.floor(r() * 14)) {
    const dens = Math.min(1, (x - x0) / 400)
    if (r() > dens) continue
    const y = CHAO + 6 + Math.floor(r() * (WORLD_H - CHAO - 12))
    ret(c, x, y, 2 + Math.floor(r() * 2), 1, cores[Math.floor(r() * cores.length)] ?? '#333')
  }
}

function passadeira(c: CanvasRenderingContext2D, x0: number, x1: number): void {
  if (x1 <= x0) return
  const y = CHAO + 12
  const base: RGB = [52, 30, 36]
  ret(c, x0, y, x1 - x0, 24, rgb(base))
  ret(c, x0 + 3, y + 3, x1 - x0 - 6, 18, rgb(clarear(base, 8)))
  ret(c, x0 + 5, y + 5, x1 - x0 - 10, 14, rgb(clarear(base, -4)))
  // Barra com losangos
  for (let x = x0 + 12; x < x1 - 10; x += 16) {
    ret(c, x, y + 11, 3, 1, rgb(clarear(base, 26)))
    ret(c, x + 1, y + 10, 1, 3, rgb(clarear(base, 26)))
  }
  // Franjas nas pontas; a do fundo está desfiada
  for (let yy = y + 1; yy < y + 24; yy += 2) {
    ret(c, x0 - 3, yy, 3, 1, rgb(clarear(base, 30)))
    ret(c, x1, yy, 2 + (yy % 3), 1, rgb(clarear(base, 20)))
  }
}

function arandela(c: CanvasRenderingContext2D, x: number, acesa: number): void {
  ret(c, x - 1, 44, 3, 8, '#2d3140')
  ret(c, x - 3, 51, 7, 2, '#3a3f52')
  for (let i = 0; i < 7; i++) {
    const meio = 3 + Math.round(i * 0.6)
    ret(c, x - meio, 37 + i, meio * 2 + 1, 1, `rgba(${200 + i * 4},${170 + i * 3},${126},${0.3 + acesa * 0.55})`)
  }
}

/** Aparador com a tigela de chaves e flores secas. A gaveta tem a escova. */
function aparador(c: CanvasRenderingContext2D, x: number): void {
  const m: RGB = [48, 40, 42]
  ret(c, x, CHAO - 32, 56, 5, rgb(clarear(m, 10)))
  ret(c, x + 2, CHAO - 27, 52, 11, rgb(m))
  ret(c, x + 6, CHAO - 24, 16, 6, rgb(clarear(m, -8)))
  ret(c, x + 12, CHAO - 22, 4, 1, '#b8964e')
  ret(c, x + 4, CHAO - 16, 3, 16, rgb(clarear(m, -10)))
  ret(c, x + 49, CHAO - 16, 3, 16, rgb(clarear(m, -10)))
  // Vaso com flores secas
  ret(c, x + 8, CHAO - 42, 7, 10, '#3d4a5e')
  ret(c, x + 9, CHAO - 43, 5, 1, '#56647c')
  const hastes = [[-3, 14], [0, 18], [3, 12], [5, 16]]
  for (const [dx, h] of hastes) {
    ret(c, x + 11 + (dx ?? 0), CHAO - 42 - (h ?? 0), 1, h ?? 0, '#5a4a36')
    ret(c, x + 10 + (dx ?? 0), CHAO - 43 - (h ?? 0), 3, 2, '#7a5a44')
  }
  // Tigela com as chaves: falta uma.
  ret(c, x + 22, CHAO - 36, 12, 4, '#56607a')
  ret(c, x + 24, CHAO - 38, 3, 2, '#c2a45e')
  ret(c, x + 29, CHAO - 38, 2, 3, '#a8a8b8')
  // Cartas empilhadas; a de cima, aberta, com o timbre da escola
  ret(c, x + 38, CHAO - 34, 14, 2, '#c8c2b0')
  ret(c, x + 39, CHAO - 36, 13, 2, '#dcd6c4')
  ret(c, x + 40, CHAO - 38, 12, 2, '#ece6d4')
  ret(c, x + 41, CHAO - 38, 3, 1, '#3a5a8a')
  ret(c, x + 46, CHAO - 39, 5, 1, '#ece6d4')
  // Espelho oval por cima
  ret(c, x + 18, 48, 20, 28, '#3e3a38')
  ret(c, x + 20, 50, 16, 24, '#1c2436')
  ret(c, x + 22, 52, 3, 12, 'rgba(180,200,230,0.14)')
}

function cabideiro(c: CanvasRenderingContext2D, x: number): void {
  ret(c, x - 1, 60, 3, CHAO - 60, '#3a2e2c')
  ret(c, x - 7, CHAO - 2, 15, 3, '#2c2224')
  ret(c, x - 6, 62, 13, 2, '#4a3a36')
  // O casaco: mostarda, pequeno demais para um adulto.
  const cor: RGB = [112, 88, 44]
  ret(c, x - 7, 64, 14, 30, rgb(cor))
  ret(c, x - 8, 66, 3, 22, rgb(clarear(cor, -14)))
  ret(c, x + 5, 66, 3, 22, rgb(clarear(cor, -14)))
  ret(c, x - 1, 66, 1, 26, rgb(clarear(cor, -22)))
  ret(c, x - 5, 80, 4, 5, rgb(clarear(cor, -10)))
  ret(c, x - 3, 64, 6, 4, rgb(clarear(cor, 12)))
  // Cachecol listrado caindo
  for (let i = 0; i < 6; i++) ret(c, x + 3, 64 + i * 3, 3, 3, i % 2 ? '#6a2c30' : '#b0a28a')
}

/** Rouparia estreita; no batente, os riscos de altura. */
function rouparia(c: CanvasRenderingContext2D, x: number, deNovo: boolean): void {
  const cor: RGB = [40, 44, 58]
  ret(c, x - 14, CHAO - 72, 28, 72, rgb(clarear(cor, -16)))
  ret(c, x - 11, CHAO - 69, 22, 69, rgb(cor))
  for (let y = CHAO - 64; y < CHAO - 10; y += 4) ret(c, x - 8, y, 16, 1, rgb(clarear(cor, -10)))
  ret(c, x + 6, CHAO - 36, 2, 4, '#b8964e')
  // Riscos: dois nomes quase juntos e uma fileira mais alta, lixada.
  const bx = x - 22
  ret(c, bx, CHAO - 76, 6, 76, rgb(clarear(cor, -6)))
  for (let i = 0; i < 7; i++) {
    const y = CHAO - 22 - i * 5
    ret(c, bx, y, 5, 1, 'rgba(210,200,176,0.7)')
    ret(c, bx + 1, y + 2, 4, 1, 'rgba(170,190,210,0.5)')
  }
  for (let i = 0; i < 6; i++) {
    ret(c, bx, CHAO - 58 - i * 3, 6, 1, 'rgba(220,210,190,0.55)')
  }
  // A mancha clara onde lixaram
  ret(c, bx, CHAO - 76, 6, 20, `rgba(200,190,170,${deNovo ? 0.28 : 0.16})`)
}

/** Relógio do corredor. Anda para trás — ninguém nunca comenta. */
function relogio(c: CanvasRenderingContext2D, x: number, y: number, t: number, hora?: { h: number; m: number; parado: boolean }): void {
  ret(c, x - 8, y - 8, 17, 17, '#3a3230')
  ret(c, x - 7, y - 7, 15, 15, '#a8a292')
  ret(c, x - 6, y - 6, 13, 13, '#c2bba8')
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ret(c, x + Math.round(Math.sin(a) * 5), y - Math.round(Math.cos(a) * 5), 1, 1, '#3a3632')
  }
  const ponteiro = (ang: number, len: number, cor: string) => {
    for (let i = 0; i <= len; i++) {
      ret(c, x + Math.round(Math.sin(ang) * i), y - Math.round(Math.cos(ang) * i), 1, 1, cor)
    }
  }
  if (hora) {
    // A hora de verdade da noite: anda até as 22:40, e lá fica.
    const angM = (hora.m / 60) * Math.PI * 2
    const angH = (((hora.h % 12) + hora.m / 60) / 12) * Math.PI * 2
    ponteiro(angM, 5, '#2a2624')
    ponteiro(angH, 3, '#1a1614')
  } else {
    ponteiro(-t * 0.9, 5, '#2a2624')
    ponteiro(-t * 0.075 + 1.2, 3, '#1a1614')
  }
  // Pêndulo (parado, quando o relógio parou)
  const p = hora?.parado ? 0 : Math.sin(t * 2.2) * 2
  ret(c, x - 3, y + 9, 7, 10, '#2e2826')
  ret(c, x + Math.round(p), y + 10, 1, 6, '#8a7a52')
  ret(c, x + Math.round(p) - 1, y + 15, 3, 3, '#b8964e')
}

/**
 * O último retrato: ninguém dentro, só o próprio corredor, de dia — uma foto
 * de verdade, em perspectiva. O teto com a luminária, as paredes com o
 * lambri e os quadros, as portas dos quartos, o tapete comprido no
 * assoalho e, no fundo, a porta do fim, clara, fechada. Foi tirada de onde
 * o Liam está agora.
 */
function retratoVazio(c: CanvasRenderingContext2D, x: number, y: number): void {
  const W = 24
  const H = 18
  // Moldura escura e larga, filete, passe-partout creme
  ret(c, x - 5, y - 5, W + 10, H + 10, '#2e2622')
  ret(c, x - 4, y - 4, W + 8, H + 8, '#5a4c44')
  ret(c, x - 4, y - 4, W + 8, 1, '#7a6a5e')
  ret(c, x - 4, y - 4, 1, H + 8, '#6c5c50')
  ret(c, x - 4, y + H + 3, W + 8, 1, '#3a302a')
  ret(c, x - 3, y - 3, W + 6, H + 6, 'rgba(176,146,92,0.6)')
  ret(c, x - 2, y - 2, W + 4, H + 4, '#d2c8ae')
  ret(c, x - 1, y - 1, W + 2, 1, 'rgba(0,0,0,0.18)')

  // Fundo da perspectiva: a parede do fim entre (8,3) e (16,12)
  const fx0 = 8
  const fx1 = 16
  const fy0 = 3
  const fy1 = 12
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      let cor: string
      if (px >= fx0 && px < fx1 && py >= fy0 && py < fy1) {
        // A parede do fim e a porta, clara, com o batente e a maçaneta
        const naPorta = px >= 10 && px < 14 && py >= 5
        cor = naPorta ? (px === 10 || py === 5 ? '#c8bc9c' : '#f2ead2') : '#ddd2b4'
        if (naPorta && px === 13 && py === 9) cor = '#8a7a52'
      } else if (py >= fy1 && px >= fx0 - (py - fy1) * (8 / 6) && px < fx1 + (py - fy1) * (8 / 6)) {
        // Assoalho: tábuas que fogem para o fundo, e o tapete no meio
        const xl = fx0 - (py - fy1) * (8 / 6)
        const xr = fx1 + (py - fy1) * (8 / 6)
        const rel = (px + 0.5 - xl) / (xr - xl)
        if (rel > 0.36 && rel < 0.64) cor = rel < 0.4 || rel > 0.6 ? '#9a5c48' : '#7e443a'
        else cor = Math.floor(rel * 9) % 2 === 0 ? '#8e7254' : '#80664a'
      } else if (py < fy0 && px >= fx0 - (fy0 - py) * (8 / 3) && px < fx1 + (fy0 - py) * (8 / 3)) {
        cor = '#e2dac4'
      } else {
        // Paredes laterais, com o lambri embaixo
        const esq = px < fx0
        const prof = esq ? (fx0 - px) / fx0 : (px + 1 - fx1) / (W - fx1)
        const topo = fy0 - prof * fy0
        const piso = fy1 + prof * (H - fy1)
        const lambri = py > piso - (piso - topo) * 0.34
        const base = esq ? [196, 184, 152] : [180, 168, 138]
        const d = Math.round(prof * 14)
        cor = lambri
          ? `rgb(${base[0] - 52 - d},${base[1] - 54 - d},${base[2] - 48 - d})`
          : `rgb(${base[0] - d},${base[1] - d},${base[2] - d})`
        // A porta de um quarto em cada parede
        if ((esq && (px === 4 || px === 5) && py > topo + (piso - topo) * 0.2 && py < piso) ||
          (!esq && (px === 19 || px === 20) && py > topo + (piso - topo) * 0.2 && py < piso)) cor = '#6c5a46'
        // Quadrinhos na parede
        if ((esq && px === 2 && (py === 6 || py === 7)) || (!esq && px === 22 && (py === 5 || py === 6))) cor = '#4a3e36'
      }
      ret(c, x + px, y + py, 1, 1, cor)
    }
  }
  // A luminária do teto e o halo que ela faz
  ret(c, x + 11, y + 1, 2, 1, '#fff6dc')
  ret(c, x + 10, y + 2, 4, 1, 'rgba(255,240,200,0.35)')
  // A luz de uma janela que não aparece, caída no assoalho da esquerda
  ret(c, x + 3, y + 15, 3, 1, 'rgba(255,244,214,0.3)')
  ret(c, x + 2, y + 16, 4, 1, 'rgba(255,244,214,0.22)')
  // Foto velha: cantos mais escuros
  ret(c, x, y, 1, 1, 'rgba(60,40,20,0.3)')
  ret(c, x + W - 1, y, 1, 1, 'rgba(60,40,20,0.3)')
  ret(c, x, y + H - 1, 1, 1, 'rgba(60,40,20,0.3)')
  ret(c, x + W - 1, y + H - 1, 1, 1, 'rgba(60,40,20,0.3)')
  // Vidro: o reflexo em diagonal
  for (let i = 0; i < 7; i++) ret(c, x + 14 + i, y + i, 2, 1, 'rgba(255,255,255,0.1)')
  ret(c, x + 1, y + 1, 6, 1, 'rgba(255,255,255,0.18)')
}

/** A porta que não deveria existir. Mais velha, mais clara, com um desenho. */
function portaDoFim(c: CanvasRenderingContext2D, x: number, sinal: number, t: number): void {
  porta(c, x, CHAO, { cor: [58, 56, 66], alt: 72 })
  // Luz fria por baixo, que respira. Quando alguém está do outro lado, sobe.
  const a = 0.1 + Math.sin(t * 0.8) * 0.04 + sinal * 0.5
  ret(c, x - 15, CHAO - 2, 30, 2, `rgba(196,208,255,${a})`)
  // Um desenho de criança colado na altura dos olhos de Liam.
  ret(c, x - 6, CHAO - 44, 12, 14, 'rgba(210,202,182,0.78)')
  ret(c, x - 6, CHAO - 44, 12, 1, 'rgba(240,232,200,0.5)')
  ret(c, x - 4, CHAO - 38, 8, 6, 'rgba(160,60,60,0.55)')
  c.fillStyle = 'rgba(160,60,60,0.55)'
  c.beginPath()
  c.moveTo(x - 5, CHAO - 38)
  c.lineTo(x, CHAO - 42)
  c.lineTo(x + 5, CHAO - 38)
  c.fill()
  ret(c, x - 3, CHAO - 33, 1, 3, 'rgba(40,40,60,0.8)')
  ret(c, x + 2, CHAO - 33, 1, 2, 'rgba(40,40,60,0.8)')
  ret(c, x - 2, CHAO - 32, 4, 1, 'rgba(40,40,60,0.8)')
  // Fita crepe nos cantos
  ret(c, x - 7, CHAO - 45, 3, 2, 'rgba(220,200,140,0.6)')
  ret(c, x + 4, CHAO - 45, 3, 2, 'rgba(220,200,140,0.6)')
}

// --- Quarto de Liam ---------------------------------------------------------

/** Onde fica a porta do quarto da Lia no corredor. */
export const LIA_PORTA = 404

const QUARTO_W = 420
const PAREDE_QUARTO: RGB = [25, 31, 48]
const LAMBRI_QUARTO: RGB = [21, 27, 42]
const CHAO_QUARTO: RGB = [30, 30, 42]
const LUMINARIA = { x: 352, y: 116 }

export function comodoQuarto(depois = false): Comodo {
  return {
    id: 'quarto',
    nome: 'Quarto de Liam',
    largura: QUARTO_W,
    chaoY: CHAO,
    passoY: PASSO,
    limiteEsq: 24,
    limiteDir: QUARTO_W - 22,
    luzX: LUMINARIA.x,
    portas: [{ x: 300, para: 'corredor', entraEm: 150, rotulo: 'Sair' }],
    vestigios: [
      {
        id: 'cabana', x: 58, rotulo: 'Olhar', acao: 'cabana',
        linhas: [
          { text: 'Uma cabana de cobertor entre duas cadeiras.' },
          { text: 'Eu não monto mais isso. Não lembro de ter montado.' },
          { text: 'A lanterna lá dentro está acesa.' },
        ],
        deNovo: [
          { text: 'Eu entro. Ainda cabe.' },
          { speaker: 'Voz', text: 'Quando a casa apertar...', style: 'speech' },
          { text: '...a gente inventa outra.' },
          { speaker: 'Voz', text: 'Lembra quando você não conseguia dormir e vinha pra cá? Eu tocava aquela música pra você, só que ao contrário.', style: 'speech' },
          { speaker: 'Voz', text: 'Subindo. Pra ela não acabar lá embaixo. Você ria disso.', style: 'speech' },
        ],
        segredo: 'cabana',
      },
      {
        id: 'plantas', x: 146, rotulo: 'Olhar', naParede: true,
        linhas: [
          { text: 'Minhas plantas de casas. Uma parede inteira.' },
          { text: 'Todas têm um cômodo a mais do que a nossa. Sempre no fim do corredor.' },
          { text: 'Algumas têm árvores de giz de cera por cima. Não é a minha letra.' },
        ],
        deNovo: [
          { text: 'Numa delas o cômodo a mais está circulado de vermelho.' },
          { text: 'Embaixo, na letra que não é minha:' },
          { text: 'aqui começa a floresta', style: 'read' },
        ],
      },
      {
        id: 'caixa', x: 214, rotulo: 'Abrir',
        linhas: [
          { text: 'A caixa debaixo da cama.' },
          { text: 'Botão. Passagem vencida. Pedra pintada de azul. Chave sem porta.' },
          { text: 'Nada disso é meu, e eu não consigo jogar fora.' },
          { text: 'Se eu jogar fora, é como dizer que nunca foi de ninguém.' },
        ],
      },
      {
        id: 'coelho', x: 262, rotulo: 'Pegar',
        linhas: [
          { text: 'Um coelho de pano com um olho só.' },
          { text: 'O outro caiu faz tempo. Ninguém costurou.' },
          { text: 'Eu durmo com ele virado pra parede. Pra ele não ouvir.' },
        ],
      },
      {
        id: 'diario', x: 342, rotulo: 'Ler',
        linhas: [
          { text: 'Meu diário. Eu escrevo com a letra mais bonita que eu consigo.' },
          { text: 'Pra ninguém achar que eu estava nervoso.' },
        ],
        documento: DOC_DIARIO,
        depois: [
          { text: 'Eu não lembro de ter escrito metade disso.' },
          { text: 'Mas a letra é minha.' },
        ],
        deNovo: [
          { text: 'A contracapa está mais grossa do que devia.' },
          { text: 'Tem alguma coisa colada por dentro.' },
        ],
        documentoDeNovo: DOC_DIARIO_CONTRACAPA,
      },
      {
        id: 'violoncelo', x: 246, rotulo: 'Olhar', naParede: true,
        linhas: [
          { text: 'O violoncelo do meu bisavô, pendurado em cima da cama. O pai disse que é aí que ele fica.' },
          { text: 'Eu toco os três. O piano, porque ele ensinou. O violino, porque ele quis.' },
          { text: 'O violoncelo, porque ninguém pediu. Esse eu toco quando a casa está vazia.' },
          { text: 'É o único que ninguém corrige.' },
        ],
        deNovo: [
          { text: 'A corda lá está frouxa.' },
          { text: 'Eu não afino. Se afinar, alguém vai querer ouvir.' },
        ],
      },
      {
        id: 'armario', x: 392, rotulo: 'Abrir',
        linhas: [
          { text: 'Eu caibo aqui dentro, se dobrar os joelhos.' },
          { text: 'E sei exatamente quanto tempo dá pra ficar antes de alguém notar.' },
        ],
        deNovo: [
          { text: 'No fundo do armário tem uma porta desenhada a giz.' },
          { text: 'Pequena. Do meu tamanho.' },
          { text: 'Do lado, uma seta e uma palavra: passagem.' },
        ],
      },
    ],

    desenharFundo(c, e) {
      const t = e.t
      papelDeParede(c, 0, QUARTO_W, 0, 100, PAREDE_QUARTO, 2)
      ret(c, 0, 0, QUARTO_W, 4, rgb(clarear(PAREDE_QUARTO, 10)))
      lambri(c, 0, QUARTO_W, 102, CHAO, LAMBRI_QUARTO)
      assoalho(c, 0, QUARTO_W, CHAO, WORLD_H, CHAO_QUARTO)
      sanca(c, 0, QUARTO_W, PAREDE_QUARTO)
      rodape(c, 0, QUARTO_W, CHAO, LAMBRI_QUARTO)
      cantos(c, QUARTO_W, CHAO, WORLD_H, PAREDE_QUARTO)

      estrelas(c, t)
      tapeteQuarto(c)
      if (depois) cabanaCaida(c)
      else cabana(c, t)
      paredeDePlantas(c, 100, 26, e.vistos.has('plantas+'))
      violoncelo(c, 246, 24, depois)
      luarNoChao(c, 330, CHAO + 1, 56)
      sombraDeContato(c, 194, CHAO, 84)
      sombraDeContato(c, 324, CHAO, 54)
      criadoMudo(c, 174, CHAO, t)
      mochilaEscola(c, 160, CHAO)
      cama(c, 196)
      pilhaLivros(c, 106, CHAO + 2)
      porta(c, 300, CHAO, { cor: [36, 44, 64], luz: true })
      interruptor(c, 322, 92, 0)
      janelaQuarto(c, 326, 26, t)
      escrivaninha(c, 324, t)
      armario(c, 380, e.vistos.has('armario+'))
      // Onde ele dorme às vezes: no chão, perto da porta.
      ret(c, 280, CHAO + 2, 14, 5, '#3a4460')
      ret(c, 280, CHAO + 2, 14, 1, '#4c5878')
      // Chinelos, alinhados
      ret(c, 318, CHAO + 4, 6, 3, '#5a3e48')
      ret(c, 326, CHAO + 4, 6, 3, '#5a3e48')
    },

    ...(depois ? { vestigios: QUARTO_DEPOIS } : {}),
    atmosfera(c, e) {
      sombra(c, QUARTO_W, 'rgb(172,176,200)')
      if (depois) dessaturar(c, QUARTO_W)
      // Luminária da escrivaninha
      brilho(c, LUMINARIA.x, LUMINARIA.y, 90, '255,210,150', 0.2)
      // Lua pela janela
      brilho(c, 352, 40, 70, '170,190,240', 0.1)
      // Lanterna dentro da cabana, que treme como pilha fraca
      const pisca = 0.16 + Math.sin(e.t * 9) * 0.02 + (Math.sin(e.t * 1.3) > 0.96 ? -0.1 : 0)
      brilho(c, 60, CHAO - 12, 44, '255,196,120', pisca)
      // Estrelas que brilham no escuro
      for (const [sx, sy] of ESTRELAS) {
        brilho(c, sx, sy, 5, '190,240,170', 0.12 + Math.sin(e.t * 1.4 + sx) * 0.05)
      }
    },
  }
}

/**
 * O violoncelo na parede, num gancho, com o arco pendurado do lado. Depois
 * do grito ele ficou torto no gancho, e ninguém endireitou.
 */
function violoncelo(c: CanvasRenderingContext2D, cx: number, topo: number, torto: boolean): void {
  c.save()
  if (torto) {
    c.translate(cx, topo)
    c.rotate(0.12)
    c.translate(-cx, -topo)
  }
  const madeira = '#6a3416'
  const clara = '#9a5a26'
  const escura = '#3a1a0a'
  // O gancho na parede.
  ret(c, cx - 2, topo - 2, 4, 2, '#8a8478')
  // Voluta e cravelhas.
  ret(c, cx - 2, topo, 4, 4, escura)
  ret(c, cx - 1, topo + 1, 2, 2, madeira)
  ret(c, cx - 4, topo + 4, 2, 1, escura)
  ret(c, cx + 2, topo + 5, 2, 1, escura)
  // O braço, de ébano, até o corpo.
  ret(c, cx - 1, topo + 4, 3, 22, '#141010')
  // O corpo: a parte de cima, a cintura, a parte de baixo.
  c.fillStyle = madeira
  c.beginPath()
  c.ellipse(cx, topo + 32, 9, 7, 0, 0, Math.PI * 2)
  c.ellipse(cx, topo + 50, 12, 10, 0, 0, Math.PI * 2)
  c.fill()
  ret(c, cx - 7, topo + 36, 14, 8, madeira)
  ret(c, cx - 8, topo + 39, 2, 3, escura)
  ret(c, cx + 6, topo + 39, 2, 3, escura)
  // O brilho do verniz e a borda.
  c.fillStyle = clara
  c.beginPath()
  c.ellipse(cx - 4, topo + 47, 4, 6, 0.2, 0, Math.PI * 2)
  c.fill()
  // O espelho continua sobre o corpo; os efes; o cavalete; o estandarte.
  ret(c, cx - 1, topo + 26, 3, 14, '#141010')
  ret(c, cx - 5, topo + 42, 1, 6, escura)
  ret(c, cx + 5, topo + 42, 1, 6, escura)
  ret(c, cx - 3, topo + 46, 7, 1, '#d8c8a0')
  ret(c, cx - 1, topo + 50, 3, 7, '#141010')
  // As quatro cordas, finas, do cavalete até a voluta.
  c.fillStyle = 'rgba(226,218,200,0.6)'
  for (const dx of [-1, 0, 1, 2]) c.fillRect(cx + dx - 0.5, topo + 5, 0.5, 42)
  // O espigão embaixo.
  ret(c, cx, topo + 60, 1, 4, '#8a8478')
  c.restore()
  // O arco, pendurado num prego do lado, na diagonal.
  c.strokeStyle = 'rgba(40,26,18,0.95)'
  c.lineWidth = 1
  c.beginPath()
  c.moveTo(cx + 16, topo + 6)
  c.lineTo(cx + 24, topo + 58)
  c.stroke()
  c.strokeStyle = 'rgba(230,220,196,0.55)'
  c.beginPath()
  c.moveTo(cx + 17, topo + 7)
  c.lineTo(cx + 25, topo + 57)
  c.stroke()
  ret(c, cx + 15, topo + 4, 2, 2, '#8a8478')
}

const ESTRELAS: [number, number][] = [
  [24, 30], [42, 26], [60, 36], [78, 28], [92, 40], [34, 50], [70, 54], [52, 66], [88, 70],
]

function estrelas(c: CanvasRenderingContext2D, t: number): void {
  for (const [x, y] of ESTRELAS) {
    const a = 0.45 + Math.sin(t * 1.4 + x) * 0.15
    ret(c, x - 1, y, 3, 1, `rgba(200,236,170,${a})`)
    ret(c, x, y - 1, 1, 3, `rgba(200,236,170,${a})`)
  }
  // Uma lua de papel colada torta
  c.fillStyle = 'rgba(214,220,170,0.5)'
  c.beginPath()
  c.arc(22, 84, 4, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = rgb(PAREDE_QUARTO)
  c.beginPath()
  c.arc(24, 83, 3.5, 0, Math.PI * 2)
  c.fill()
}

/** Cabana de cobertor entre duas cadeiras, com a lanterna acesa lá dentro. */
function cabana(c: CanvasRenderingContext2D, t: number): void {
  // Cadeiras
  for (const x of [26, 88]) {
    ret(c, x, CHAO - 44, 3, 44, '#3c3038')
    ret(c, x - 2, CHAO - 20, 7, 2, '#4a3c44')
  }
  // Cobertor de retalhos, caído num trapézio
  const topo = CHAO - 44
  const cores = ['#6a3e3a', '#7a5a3e', '#4a4e6a', '#5e3a4a', '#6e6242']
  for (let y = topo; y < CHAO; y++) {
    const abre = Math.round(((y - topo) / (CHAO - topo)) * 10)
    const x0 = 26 - abre
    const x1 = 92 + abre
    for (let x = x0; x < x1; x += 8) {
      const idx = (Math.floor((x - x0) / 8) + Math.floor((y - topo) / 8)) % cores.length
      ret(c, x, y, Math.min(8, x1 - x), 1, cores[idx] ?? '#555')
    }
  }
  // Costuras
  for (let y = topo + 8; y < CHAO; y += 8) ret(c, 18, y, 84, 1, 'rgba(0,0,0,0.18)')
  // A entrada: uma fresta escura com luz dentro
  c.fillStyle = '#0c0a10'
  c.beginPath()
  c.moveTo(58, topo + 10)
  c.lineTo(46, CHAO)
  c.lineTo(72, CHAO)
  c.closePath()
  c.fill()
  const pisca = 0.5 + Math.sin(t * 9) * 0.06
  c.fillStyle = `rgba(255,200,130,${pisca * 0.5})`
  c.beginPath()
  c.moveTo(58, topo + 20)
  c.lineTo(52, CHAO)
  c.lineTo(66, CHAO)
  c.closePath()
  c.fill()
  // Varal de luzinhas na borda de cima
  for (let i = 0; i < 9; i++) {
    const on = Math.sin(t * 2 + i * 1.7) > -0.3
    ret(c, 28 + i * 7, topo + 1 + (i % 2), 1, 1, on ? '#f2d28a' : '#6a5a3a')
  }
  // Gizes espalhados na frente: a única bagunça do quarto é dela.
  const gizes = ['#c24a3a', '#3a8a4a', '#d8b43a', '#3a5ac2', '#8a4ac2']
  for (let i = 0; i < gizes.length; i++) {
    ret(c, 36 + i * 9 + (i % 2) * 3, CHAO + 4 + (i % 3), 3, 1, gizes[i] ?? '#fff')
  }
  // Uma folha com uma casa desenhada, no chão
  ret(c, 78, CHAO + 3, 10, 7, 'rgba(210,204,186,0.7)')
  ret(c, 80, CHAO + 6, 5, 3, 'rgba(60,120,70,0.7)')
  ret(c, 81, CHAO + 4, 3, 2, 'rgba(180,60,50,0.7)')
}

/**
 * A parede de plantas. Cada planta é diferente, com fita crepe nos cantos;
 * todas têm o mesmo cômodo a mais no fim do corredor. Algumas têm árvores
 * desenhadas por cima — a segunda caligrafia.
 */
function paredeDePlantas(c: CanvasRenderingContext2D, x0: number, y0: number, vistaDeNovo: boolean): void {
  const colunas = 3
  for (let i = 0; i < 6; i++) {
    const col = i % colunas
    const lin = Math.floor(i / colunas)
    const px = x0 + col * 31 + (lin % 2) * 3
    const py = y0 + lin * 34 + (col === 1 ? 3 : 0)
    planta(c, px, py, 26, 28, i, i === 4, i === 1 || i === 3 || i === 5)
  }
  if (vistaDeNovo) {
    // Depois de reparar, o círculo vermelho parece mais vivo.
    ret(c, x0 + 54, y0 + 64, 8, 1, 'rgba(210,70,60,0.6)')
  }
}

function planta(
  c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  semente: number, circulada: boolean, comArvores: boolean,
): void {
  const r = sorteio(semente * 97 + 13)
  // Três papéis: sulfite, quadriculado e uma cópia azul, de arquiteto.
  const tipo = semente % 3
  const azul = tipo === 2
  const papel = azul ? '#3c5276' : '#a7a08c'
  const tinta = azul ? 'rgba(214,226,244,0.9)' : 'rgba(30,38,62,0.9)'
  const traco = azul ? 'rgba(214,226,244,0.5)' : 'rgba(30,38,62,0.45)'
  ret(c, x + 1, y + 1, w, h, 'rgba(0,0,0,0.3)')
  ret(c, x, y, w, h, papel)
  ret(c, x, y, w, 1, azul ? '#52688c' : '#bdb6a2')
  if (tipo === 1) {
    for (let i = 3; i < w; i += 3) ret(c, x + i, y + 1, 1, h - 1, 'rgba(70,90,130,0.12)')
    for (let j = 3; j < h; j += 3) ret(c, x, y + j, w, 1, 'rgba(70,90,130,0.12)')
  }
  // Título e escala, numa faixa em cima
  ret(c, x + 2, y + 2, 8, 1, traco)
  ret(c, x + w - 6, y + 2, 4, 1, traco)

  const cx = x + 2
  const cy = y + 5
  const cw = w - 9
  const ch = h - 8
  // Paredes de fora grossas (dois pixels), as de dentro finas
  ret(c, cx, cy, cw, 2, tinta)
  ret(c, cx, cy + ch - 2, cw, 2, tinta)
  ret(c, cx, cy, 2, ch, tinta)
  ret(c, cx + cw - 2, cy, 2, ch, tinta)
  // Janelas: o traço grosso vira dois finos
  const janela = (jx: number, jy: number, horizontal: boolean) => {
    ret(c, jx, jy, horizontal ? 4 : 2, horizontal ? 2 : 4, papel)
    ret(c, jx, jy, horizontal ? 4 : 1, horizontal ? 1 : 4, traco)
    ret(c, horizontal ? jx : jx + 1, horizontal ? jy + 1 : jy, horizontal ? 4 : 1, horizontal ? 1 : 4, traco)
  }
  janela(cx + 3 + Math.floor(r() * 4), cy, true)
  janela(cx + cw - 8 + Math.floor(r() * 2), cy + ch - 2, true)
  janela(cx, cy + 4 + Math.floor(r() * 4), false)

  // Corredor no meio, de ponta a ponta, e os cômodos dos dois lados
  const corrY = cy + Math.floor(ch * 0.42) + Math.floor(r() * 3)
  ret(c, cx + 2, corrY, cw - 4, 1, tinta)
  ret(c, cx + 2, corrY + 4, cw - 4, 1, tinta)
  const divCima = cx + 5 + Math.floor(r() * (cw - 10))
  ret(c, divCima, cy + 2, 1, corrY - cy - 2, tinta)
  const divsBaixo = [cx + 4 + Math.floor(r() * 3), cx + Math.floor(cw / 2) + Math.floor(r() * 3)]
  for (const dx of divsBaixo) ret(c, dx, corrY + 5, 1, cy + ch - corrY - 7, tinta)
  // Portas: o vão na parede do corredor e a folha aberta em diagonal
  const portas = [cx + 3, divCima + 2, divsBaixo[0]! + 1, divsBaixo[1]! + 1]
  for (const [i, pxp] of portas.entries()) {
    const yy = i < 2 ? corrY : corrY + 4
    ret(c, pxp, yy, 2, 1, papel)
    ret(c, pxp, i < 2 ? yy - 1 : yy + 1, 1, 1, traco)
  }
  // Móveis: camas, a mesa da cozinha com as cadeiras, o piano
  ret(c, cx + 3, cy + ch - 6, 3, 3, traco)
  ret(c, divsBaixo[1]! + 2, cy + ch - 6, 2, 3, traco)
  const mx = divCima + 2 + Math.floor(r() * 2)
  ret(c, mx, cy + 4, 3, 2, traco)
  ret(c, mx - 1, cy + 4, 1, 1, traco)
  ret(c, mx + 3, cy + 5, 1, 1, traco)
  ret(c, cx + 3, cy + 3, 4, 1, traco)
  // A porta do fim, fechada, e o cômodo a mais, sempre ali
  const ex = cx + cw
  const ey = corrY - 2
  ret(c, ex - 2, corrY + 1, 2, 3, papel)
  ret(c, ex - 1, corrY + 1, 1, 3, tinta)
  for (let i = 0; i < 7; i += 2) {
    ret(c, ex + i, ey, 1, 1, tinta)
    ret(c, ex + i, ey + 8, 1, 1, tinta)
  }
  for (let j = 0; j < 9; j += 2) ret(c, ex + 6, ey + j, 1, 1, tinta)
  ret(c, ex + 2, ey + 3, 2, 1, traco)
  ret(c, ex + 3, ey + 4, 1, 1, traco)
  ret(c, ex + 3, ey + 6, 1, 1, traco)

  if (comArvores) {
    // Giz de cera, de outra mão: árvores redondas e tortas por cima do
    // corredor, e um sol no canto.
    for (let i = 0; i < 3; i++) {
      const tx = cx + 3 + i * 5 + Math.floor(r() * 2)
      const ty = corrY - 1 + Math.floor(r() * 2)
      ret(c, tx, ty + 2, 1, 3, 'rgba(126,80,44,0.85)')
      ret(c, tx - 1, ty - 1, 3, 3, 'rgba(70,150,72,0.8)')
      ret(c, tx, ty - 2, 1, 1, 'rgba(70,150,72,0.8)')
      ret(c, tx + 1, ty, 1, 1, 'rgba(110,190,96,0.7)')
    }
    ret(c, x + w - 5, y + 4, 3, 3, 'rgba(232,186,60,0.85)')
    ret(c, x + w - 6, y + 5, 1, 1, 'rgba(232,186,60,0.6)')
    ret(c, x + w - 2, y + 5, 1, 1, 'rgba(232,186,60,0.6)')
  }
  if (circulada) {
    c.strokeStyle = 'rgba(200,60,50,0.8)'
    c.lineWidth = 1
    c.beginPath()
    c.ellipse(ex + 3.5, ey + 4.5, 6, 6.5, 0, 0, Math.PI * 2)
    c.stroke()
  }
  // Fita crepe nos cantos de cima
  ret(c, x - 1, y - 1, 4, 3, 'rgba(222,204,150,0.7)')
  ret(c, x + w - 3, y - 1, 4, 3, 'rgba(222,204,150,0.7)')
}

/** A cama arrumada demais, a caixa embaixo, o coelho no travesseiro. */
function cama(c: CanvasRenderingContext2D, x: number): void {
  const w = 80
  const madeira: RGB = [52, 40, 44]
  // Cabeceira do lado direito
  ret(c, x + w - 4, CHAO - 46, 6, 46, rgb(madeira))
  ret(c, x + w - 4, CHAO - 46, 6, 2, rgb(clarear(madeira, 14)))
  ret(c, x - 2, CHAO - 30, 4, 30, rgb(madeira))
  // Colchão e colcha de retalhos, esticada sem uma dobra
  ret(c, x, CHAO - 28, w - 4, 6, '#c0b8a8')
  const quad = ['#3e4a6e', '#48587e', '#3a4466', '#52608a']
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 2; j++) {
      ret(c, x + i * 8, CHAO - 23 + j * 8, 8, 8, quad[(i + j) % quad.length] ?? '#444')
    }
  }
  ret(c, x, CHAO - 23, w - 4, 1, 'rgba(255,255,255,0.1)')
  ret(c, x, CHAO - 7, w - 4, 3, '#1a1e2a')
  // Travesseiro
  ret(c, x + w - 24, CHAO - 34, 18, 7, '#d0c8b8')
  ret(c, x + w - 24, CHAO - 34, 18, 1, '#e4dccc')
  // Coelho de um olho só, sentado no travesseiro
  const cx = x + w - 18
  ret(c, cx, CHAO - 42, 8, 8, '#a89494')
  ret(c, cx + 1, CHAO - 49, 2, 7, '#a89494')
  ret(c, cx + 5, CHAO - 48, 2, 6, '#9a8686')
  ret(c, cx + 2, CHAO - 39, 1, 1, '#141014')
  ret(c, cx + 5, CHAO - 39, 1, 1, '#c4b4b4')
  ret(c, cx + 3, CHAO - 37, 2, 1, '#6a4a4a')
  // A caixa, meio para fora, debaixo da cama
  ret(c, x + 8, CHAO - 4, 22, 2, '#08090e')
  ret(c, x + 10, CHAO - 9, 18, 9, '#5a4a3a')
  ret(c, x + 10, CHAO - 9, 18, 2, '#6e5c48')
  ret(c, x + 18, CHAO - 7, 3, 2, '#2a2220')
}

function janelaQuarto(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const w = 52
  const h = 46
  ret(c, x - 3, y - 3, w + 6, h + 6, '#2a2c3a')
  const g = c.createLinearGradient(0, y, 0, y + h)
  g.addColorStop(0, '#0e1630')
  g.addColorStop(1, '#1e2a48')
  c.fillStyle = g
  c.fillRect(x, y, w, h)
  // Estrelas lá fora e a lua escondida atrás do caixilho
  const r = sorteio(5)
  for (let i = 0; i < 12; i++) {
    const sx = x + Math.floor(r() * w)
    const sy = y + Math.floor(r() * h * 0.7)
    const a = 0.3 + Math.sin(t * 2 + i) * 0.2
    ret(c, sx, sy, 1, 1, `rgba(220,226,255,${a})`)
  }
  ret(c, x + 34, y + 8, 9, 9, '#d8dcc8')
  ret(c, x + 34, y + 8, 3, 3, '#1a2440')
  // Telhado da casa vizinha, com uma janela acesa
  c.fillStyle = '#080a12'
  c.beginPath()
  c.moveTo(x, y + h)
  c.lineTo(x, y + 34)
  c.lineTo(x + 18, y + 26)
  c.lineTo(x + 36, y + 34)
  c.lineTo(x + 36, y + h)
  c.fill()
  ret(c, x + 14, y + 36, 4, 4, 'rgba(236,196,120,0.7)')
  ret(c, x + w / 2 - 1, y, 2, h, '#2a2c3a')
  ret(c, x, y + h / 2 - 1, w, 2, '#2a2c3a')
  ret(c, x - 5, y + h + 3, w + 10, 3, '#3a3c4c')
}

/** Escrivaninha: diário aberto, luminária, globo de neve, lápis. */
function escrivaninha(c: CanvasRenderingContext2D, x: number, t: number): void {
  const w = 54
  const m: RGB = [58, 44, 42]
  ret(c, x, CHAO - 30, w, 4, rgb(clarear(m, 12)))
  ret(c, x + 2, CHAO - 26, w - 4, 8, rgb(m))
  ret(c, x + 30, CHAO - 24, 18, 4, rgb(clarear(m, -8)))
  ret(c, x + 38, CHAO - 23, 3, 1, '#b8964e')
  ret(c, x + 3, CHAO - 18, 3, 18, rgb(clarear(m, -10)))
  ret(c, x + w - 6, CHAO - 18, 3, 18, rgb(clarear(m, -10)))
  // Cadeira
  ret(c, x + 10, CHAO - 34, 3, 34, '#3a2e30')
  ret(c, x + 10, CHAO - 14, 16, 3, '#46383a')
  ret(c, x + 24, CHAO - 14, 2, 14, '#3a2e30')
  // Diário aberto
  ret(c, x + 12, CHAO - 34, 16, 4, '#d4ccb8')
  ret(c, x + 19, CHAO - 34, 1, 4, '#8a8272')
  for (let i = 0; i < 3; i++) {
    ret(c, x + 13, CHAO - 33 + i, 5, 1, 'rgba(40,40,60,0.5)')
    ret(c, x + 21, CHAO - 33 + i, 5, 1, 'rgba(40,40,60,0.5)')
  }
  ret(c, x + 28, CHAO - 33, 6, 1, '#c24a3a')
  // Luminária de braço
  const lx = LUMINARIA.x - 324 + x
  ret(c, lx - 4, CHAO - 32, 9, 2, '#3a4052')
  ret(c, lx, CHAO - 44, 2, 12, '#4a5066')
  ret(c, lx - 2, CHAO - 46, 8, 2, '#4a5066')
  ret(c, lx + 4, CHAO - 48, 7, 5, '#5a6078')
  ret(c, lx + 5, CHAO - 43, 5, 1, 'rgba(255,230,180,0.9)')
  // Globo de neve: a casa lá dentro, e a neve que nunca para de cair.
  const gx = x + 46
  const gy = CHAO - 38
  ret(c, gx - 5, gy + 4, 11, 4, '#4a3830')
  c.fillStyle = 'rgba(180,200,230,0.22)'
  c.beginPath()
  c.arc(gx, gy, 5, 0, Math.PI * 2)
  c.fill()
  ret(c, gx - 2, gy + 1, 4, 3, '#6a4a3a')
  ret(c, gx - 2, gy, 4, 1, '#8a3a34')
  for (let i = 0; i < 5; i++) {
    const fy = ((t * 3 + i * 2.1) % 9) - 4
    const fx = Math.round(Math.sin(t + i) * 3)
    ret(c, gx + fx, gy + Math.round(fy), 1, 1, 'rgba(255,255,255,0.8)')
  }
  ret(c, gx - 3, gy - 4, 2, 1, 'rgba(255,255,255,0.5)')
  // Lápis no copo
  ret(c, x + 4, CHAO - 38, 5, 8, '#3e4a62')
  ret(c, x + 5, CHAO - 42, 1, 4, '#d8b43a')
  ret(c, x + 7, CHAO - 41, 1, 3, '#c24a3a')
}

function armario(c: CanvasRenderingContext2D, x: number, vistoDeNovo: boolean): void {
  const w = 30
  const cor: RGB = [40, 42, 58]
  ret(c, x, CHAO - 76, w, 76, rgb(cor))
  ret(c, x - 1, CHAO - 78, w + 2, 3, rgb(clarear(cor, 12)))
  // Porta esquerda fechada
  ret(c, x + 2, CHAO - 72, 12, 66, rgb(clarear(cor, 4)))
  ret(c, x + 4, CHAO - 68, 8, 26, rgb(clarear(cor, -4)))
  ret(c, x + 4, CHAO - 38, 8, 26, rgb(clarear(cor, -4)))
  ret(c, x + 11, CHAO - 42, 1, 4, '#b8964e')
  // Porta direita entreaberta: escuro lá dentro
  ret(c, x + 15, CHAO - 72, 13, 66, '#07080d')
  ret(c, x + 27, CHAO - 72, 4, 66, rgb(clarear(cor, 10)))
  // Uma manga de roupa pendurada aparecendo
  ret(c, x + 17, CHAO - 66, 4, 18, '#2e3446')
  // A porta de giz no fundo: quase não se vê. Depois de olhar de novo, sim.
  const a = vistoDeNovo ? 0.55 : 0.14
  const px = x + 18
  const py = CHAO - 24
  ret(c, px, py, 7, 1, `rgba(230,230,220,${a})`)
  ret(c, px, py, 1, 16, `rgba(230,230,220,${a})`)
  ret(c, px + 6, py, 1, 16, `rgba(230,230,220,${a})`)
  ret(c, px + 4, py + 8, 1, 1, `rgba(230,230,220,${a})`)
  ret(c, x, CHAO - 4, w, 4, rgb(clarear(cor, -14)))
}

function tapeteQuarto(c: CanvasRenderingContext2D): void {
  const x = 120
  const y = CHAO + 5
  const w = 160
  ret(c, x, y, w, 16, '#34304a')
  ret(c, x + 3, y + 2, w - 6, 12, '#3e3a58')
  for (let i = 0; i < 9; i++) {
    const cx = x + 12 + i * 17
    ret(c, cx, y + 7, 5, 1, '#5a5478')
    ret(c, cx + 2, y + 5, 1, 5, '#5a5478')
  }
  // Uma pista de carrinho desenhada no tapete, com um carrinho parado
  ret(c, x + 20, y + 12, 120, 1, '#4a4668')
  ret(c, x + 98, y + 10, 6, 3, '#a83a34')
  ret(c, x + 99, y + 9, 3, 1, '#8ab4d8')
}

// --- Depois do grito ---------------------------------------------------------

// --- Quarto da Lia ---------------------------------------------------------

export const LIA_W = 400
const PAREDE_LIA: RGB = [40, 26, 38]
const LAMBRI_LIA: RGB = [32, 22, 32]
const CHAO_LIA: RGB = [34, 28, 34]
/** O espelho da porta do armário, em pixels de mundo. */
export const ESPELHO = { x: 326, y: 64, w: 20, h: 72 }
/** Onde a Lia fica, arrumando a mala. */
export const LIA_MALA_X = 160

/**
 * O quarto da Lia. Ela está fugindo do jeito dela: a mala aberta em cima
 * da cama, o fone, os pôsteres de quem ouve música alta para não ouvir a
 * casa. O espelho do armário mostra o Liam — quase sempre na hora certa.
 */
export function comodoLia(depois = false, temBilhete = false): Comodo {
  const vestigios: VestigioCasa[] = depois
    ? [
      {
        id: 'lia-fone-depois', x: 150, rotulo: 'Pegar',
        linhas: [
          { text: 'O fone dela, em cima da cama desarrumada. Ainda tocando, baixinho.' },
          { speaker: 'Lia', text: 'Eu trouxe o seu fone, seu idiota. Tá tocando aquela.', style: 'speech', onde: 'no fone' },
          { speaker: 'Lia', text: 'A enfermeira disse que você pode estar ouvindo. Então ouve.', style: 'speech', onde: 'no fone' },
        ],
      },
      ...(temBilhete
        ? [{
          id: 'lia-bilhete', x: 196, rotulo: 'Ler o bilhete',
          linhas: [
            { text: 'O papel que ela enfiou no meu bolso. Eu nunca abri.' },
            { text: 'se mudar de ideia, a gente tá na tia Catarina. — L.', style: 'read' as const },
            { text: 'Ela deixou a porta aberta pra mim. Eu não fui.' },
          ],
        }]
        : []),
      {
        id: 'lia-espelho-depois', x: ESPELHO.x + ESPELHO.w / 2, rotulo: 'Olhar', naParede: true,
        linhas: [
          { text: 'Alguém cobriu o espelho com um lençol.' },
          { text: 'Eu não vou tirar.' },
        ],
      },
    ]
    : [
      {
        id: 'lia-conversa', x: LIA_MALA_X + 14, rotulo: 'Falar com a Lia', acao: 'conversaLia',
        linhas: [{ speaker: 'Lia', text: 'Sai, Liam.', style: 'speech' }],
      },
      {
        id: 'lia-posters', x: 86, rotulo: 'Olhar', naParede: true,
        linhas: [
          { text: 'Pôsteres de banda. Ela ouve tudo no volume máximo.' },
          { text: 'Eu achava que era pra irritar o pai. É pra não ouvir a casa.' },
        ],
      },
      {
        id: 'lia-desenho', x: 236, rotulo: 'Olhar', naParede: true, aprende: 'lia-desenho',
        linhas: [
          { text: 'Um desenho da família. Meu, de quando eu tinha sete anos.' },
          { text: 'Ela guardou. Eu nem sabia.' },
        ],
        deNovo: [
          { text: 'De perto: o pai foi apagado com borracha.' },
          { text: 'O papel ficou mais fino no lugar dele. Quase rasgou.' },
        ],
      },
      {
        id: 'lia-janela', x: 284, rotulo: 'Olhar', naParede: true,
        linhas: [
          { text: 'A rua, molhada. O poste pisca do mesmo jeito de sempre.' },
          { text: 'Daqui dá pra ver se o carro do pai está na garagem. Ela deve olhar toda noite.' },
        ],
      },
      {
        id: 'lia-espelho', x: ESPELHO.x + ESPELHO.w / 2, rotulo: 'Olhar', naParede: true,
        linhas: [
          { text: 'Eu no espelho. Cara de quem não dorme.' },
        ],
      },
    ]

  return {
    id: 'lia',
    nome: 'Quarto da Lia',
    largura: LIA_W,
    chaoY: CHAO,
    passoY: PASSO,
    limiteEsq: 24,
    limiteDir: LIA_W - 24,
    luzX: 232,
    portas: [{ x: 44, para: 'corredor', entraEm: LIA_PORTA, rotulo: 'Sair' }],
    vestigios,

    desenharFundo(c, e) {
      const t = e.t
      papelDeParede(c, 0, LIA_W, 0, 100, PAREDE_LIA, 9)
      ret(c, 0, 0, LIA_W, 4, rgb(clarear(PAREDE_LIA, 10)))
      lambri(c, 0, LIA_W, 102, CHAO, LAMBRI_LIA)
      assoalho(c, 0, LIA_W, CHAO, WORLD_H, CHAO_LIA)
      sanca(c, 0, LIA_W, PAREDE_LIA)
      rodape(c, 0, LIA_W, CHAO, LAMBRI_LIA)
      cantos(c, LIA_W, CHAO, WORLD_H, PAREDE_LIA)
      porta(c, 44, CHAO, { cor: [52, 34, 44], luz: true })
      varalDeLuzes(c, t, depois)
      posteres(c, 66)
      tapeteLia(c)
      camaLia(c, 104, depois)
      if (!depois) malaAberta(c, LIA_MALA_X - 26)
      else {
        // O fone esquecido na cama, com a luzinha acesa.
        ret(c, 146, CHAO - 31, 8, 2, '#1a1a20')
        ret(c, 145, CHAO - 33, 2, 3, '#26262e')
        ret(c, 153, CHAO - 33, 2, 3, '#26262e')
        ret(c, 149, CHAO - 32, 1, 1, Math.sin(t * 3) > 0 ? '#60e0a0' : '#205040')
      }
      escrivaninhaLia(c, 218, t, depois)
      if (!depois) desenhoFamilia(c, 228, 34, e.vistos.has('lia-desenho+'))
      else ret(c, 230, 36, 16, 20, 'rgba(0,0,0,0.25)')
      janelaLia(c, 266, 24, t)
      armarioLia(c, 312, depois)
      sombraDeContato(c, 150, CHAO, 90)
      sombraDeContato(c, 330, CHAO, 50)
    },

    atmosfera(c, e) {
      sombra(c, LIA_W, 'rgb(190,170,190)')
      if (depois) dessaturar(c, LIA_W)
      brilho(c, 232, 96, 80, '255,200,170', depois ? 0.06 : 0.18)
      brilho(c, 290, 40, 60, '170,190,240', 0.08)
      // As luzinhas do varal acendem umas depois das outras.
      for (let i = 0; i < 12; i++) {
        const a = 0.5 + 0.5 * Math.sin(e.t * 2.2 + i * 0.9)
        brilho(c, 70 + i * 22, 14 + Math.sin(i * 1.3) * 3, 8, CORES_LUZES[i % CORES_LUZES.length] ?? '255,220,180', (depois ? 0.05 : 0.16) * a)
      }
    },
  }
}

const CORES_LUZES = ['255,190,120', '255,140,170', '170,210,255', '200,255,170']

function varalDeLuzes(c: CanvasRenderingContext2D, t: number, depois: boolean): void {
  c.strokeStyle = 'rgba(20,16,20,0.9)'
  c.lineWidth = 1
  c.beginPath()
  for (let x = 62; x <= 330; x += 2) {
    const y = 12 + Math.sin((x - 62) / 268 * Math.PI * 3) * 4
    if (x === 62) c.moveTo(x, y)
    else c.lineTo(x, y)
  }
  c.stroke()
  for (let i = 0; i < 12; i++) {
    const x = 70 + i * 22
    const y = 14 + Math.sin(i * 1.3) * 3
    const a = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 0.9)
    const cor = CORES_LUZES[i % CORES_LUZES.length] ?? '255,220,180'
    ret(c, x, Math.round(y), 2, 2, `rgba(${cor},${depois ? 0.25 : 0.4 + a * 0.6})`)
  }
}

function posteres(c: CanvasRenderingContext2D, x: number): void {
  // Um pôster de banda: fundo preto, raio vermelho, letras grandes.
  ret(c, x, 26, 30, 40, '#121014')
  ret(c, x + 2, 28, 26, 36, '#1e1a22')
  c.fillStyle = '#c84050'
  c.beginPath()
  c.moveTo(x + 17, 32)
  c.lineTo(x + 9, 46)
  c.lineTo(x + 15, 46)
  c.lineTo(x + 11, 60)
  c.lineTo(x + 21, 42)
  c.lineTo(x + 15, 42)
  c.closePath()
  c.fill()
  ret(c, x + 4, 30, 22, 2, '#e8e0d0')
  // Outro, menor e torto, com uma lua.
  c.save()
  c.translate(x + 44, 46)
  c.rotate(0.08)
  ret(c, -11, -14, 22, 28, '#d8c8a8')
  ret(c, -9, -12, 18, 24, '#2a3a5a')
  c.fillStyle = '#f0e6c8'
  c.beginPath()
  c.arc(2, -3, 5, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#2a3a5a'
  c.beginPath()
  c.arc(4, -4, 4.5, 0, Math.PI * 2)
  c.fill()
  ret(c, -7, 6, 14, 1, '#f0e6c8')
  c.restore()
  // Fita adesiva nos cantos.
  for (const [ax, ay] of [[x - 1, 25], [x + 27, 25]] as const) ret(c, ax, ay, 4, 2, 'rgba(230,220,190,0.6)')
}

function tapeteLia(c: CanvasRenderingContext2D): void {
  ret(c, 110, CHAO + 8, 150, 14, '#3a2434')
  for (let i = 0; i < 150; i += 6) ret(c, 110 + i, CHAO + 8, 3, 14, 'rgba(255,255,255,0.03)')
  ret(c, 110, CHAO + 8, 150, 1, '#4a3042')
}

function camaLia(c: CanvasRenderingContext2D, x: number, depois: boolean): void {
  const w = 96
  ret(c, x - 2, CHAO - 40, 5, 40, '#2a1e26')
  ret(c, x, CHAO - 26, w, 6, '#c8bcb0')
  ret(c, x, CHAO - 20, w, 14, depois ? '#4a2a36' : '#5e2a3a')
  // A colcha amassada (depois, jogada para o lado)
  for (let i = 0; i < w; i += 7) ret(c, x + i, CHAO - 20 + (depois ? (i % 14) / 7 : 0), 4, 1, 'rgba(255,255,255,0.06)')
  ret(c, x, CHAO - 6, w, 3, '#1a1218')
  ret(c, x + 4, CHAO - 33, 20, 7, '#e0d4c4')
  ret(c, x + 4, CHAO - 33, 20, 1, '#f0e6d8')
}

function malaAberta(c: CanvasRenderingContext2D, x: number): void {
  // A tampa aberta, em pé contra a parede.
  ret(c, x, CHAO - 52, 44, 22, '#2e3e56')
  ret(c, x + 2, CHAO - 50, 40, 18, '#3a4c68')
  ret(c, x + 20, CHAO - 52, 4, 2, '#8a8478')
  // A base, cheia de roupa dobrada às pressas.
  ret(c, x, CHAO - 32, 44, 10, '#2e3e56')
  const roupas = ['#c85a6a', '#e8e0d0', '#33425c', '#6a2c38', '#d4b060']
  for (let i = 0; i < 6; i++) ret(c, x + 3 + i * 7, CHAO - 34 - (i % 2), 6, 3, roupas[i % roupas.length] ?? '#888')
  ret(c, x + 30, CHAO - 37, 8, 4, '#e8e0d0')
}

function escrivaninhaLia(c: CanvasRenderingContext2D, x: number, t: number, depois: boolean): void {
  ret(c, x, CHAO - 26, 40, 3, '#4a3438')
  ret(c, x + 2, CHAO - 23, 3, 23, '#3a282c')
  ret(c, x + 35, CHAO - 23, 3, 23, '#3a282c')
  // A luminária com a cúpula torta
  ret(c, x + 30, CHAO - 44, 2, 18, '#1e1a1e')
  ret(c, x + 24, CHAO - 48, 12, 5, '#d8a0a8')
  ret(c, x + 26, CHAO - 43, 8, 1, `rgba(255,220,180,${depois ? 0.3 : 0.8 + Math.sin(t * 7) * 0.05})`)
  if (!depois) {
    // O fone, enrolado no celular.
    ret(c, x + 6, CHAO - 29, 9, 3, '#1a1a20')
    ret(c, x + 5, CHAO - 32, 2, 4, '#26262e')
    ret(c, x + 14, CHAO - 32, 2, 4, '#26262e')
    ret(c, x + 18, CHAO - 28, 6, 2, '#0c0c10')
  }
  // Esmaltes e um caderno de capa vermelha
  ret(c, x + 26, CHAO - 29, 2, 3, '#c84050')
  ret(c, x + 22, CHAO - 29, 2, 3, '#8a60c0')
}

function desenhoFamilia(c: CanvasRenderingContext2D, x: number, y: number, deNovo: boolean): void {
  ret(c, x, y, 18, 22, '#e8e2d2')
  ret(c, x + 7, y - 1, 4, 2, 'rgba(230,220,190,0.7)')
  // Bonecos de palitinho de giz de cera: mãe, Lia, Liam — e um borrão.
  const bonecos: [number, string][] = [[3, '#d07050'], [8, '#c84060'], [12, '#4060a0']]
  for (const [bx, cor] of bonecos) {
    ret(c, x + bx, y + 9, 2, 2, cor)
    ret(c, x + bx, y + 11, 2, 6, cor)
  }
  // Onde estava o pai: papel mais claro e gasto de borracha.
  ret(c, x + 14, y + 6, 3, 12, deNovo ? '#f8f4ea' : '#f0ecdf')
  ret(c, x + 2, y + 19, 14, 1, '#6a9a50')
  ret(c, x + 13, y + 2, 3, 3, '#e0c040')
}

function janelaLia(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const w = 36
  const h = 40
  ret(c, x - 3, y - 3, w + 6, h + 6, '#2a2030')
  const g = c.createLinearGradient(0, y, 0, y + h)
  g.addColorStop(0, '#0c1428')
  g.addColorStop(1, '#1c2440')
  c.fillStyle = g
  c.fillRect(x, y, w, h)
  // Chuva escorrendo no vidro.
  for (let i = 0; i < 8; i++) {
    const gx = x + 3 + ((i * 11) % (w - 4))
    const gy = y + ((t * (14 + i * 3) + i * 9) % h)
    ret(c, gx, Math.round(gy), 1, 3, 'rgba(180,200,240,0.35)')
  }
  // O poste da rua, piscando.
  const aceso = Math.sin(t * 5.3) > -0.7
  ret(c, x + 26, y + 18, 1, 22, '#0a0c14')
  ret(c, x + 24, y + 16, 5, 2, aceso ? '#f0d8a0' : '#3a3428')
  ret(c, x + w / 2 - 1, y, 2, h, '#2a2030')
  ret(c, x, y + h / 2 - 1, w, 2, '#2a2030')
  // Cortina caída para um lado, mexendo com a corrente de ar.
  const v = Math.round(Math.sin(t * 0.9) * 1.2)
  ret(c, x - 6 + v, y - 4, 7, h + 10, '#6a2c3e')
  ret(c, x - 5 + v, y - 4, 1, h + 10, '#7e3a4e')
}

function armarioLia(c: CanvasRenderingContext2D, x: number, depois: boolean): void {
  ret(c, x, CHAO - 96, 48, 96, '#3a2a30')
  ret(c, x, CHAO - 96, 48, 2, '#4e3a42')
  ret(c, x + 23, CHAO - 92, 2, 88, '#2a1e24')
  // A porta da direita: madeira. A da esquerda: o espelho.
  ret(c, ESPELHO.x - 2, ESPELHO.y - 2, ESPELHO.w + 4, ESPELHO.h + 4, '#5a4650')
  if (depois) {
    // Coberto com um lençol, preso em cima.
    ret(c, ESPELHO.x - 3, ESPELHO.y - 4, ESPELHO.w + 6, ESPELHO.h + 10, '#cfc8bc')
    for (let i = 0; i < ESPELHO.w + 6; i += 4) ret(c, ESPELHO.x - 3 + i, ESPELHO.y, 1, ESPELHO.h + 6, 'rgba(0,0,0,0.08)')
  } else {
    const g = c.createLinearGradient(ESPELHO.x, ESPELHO.y, ESPELHO.x + ESPELHO.w, ESPELHO.y + ESPELHO.h)
    g.addColorStop(0, '#2c3442')
    g.addColorStop(1, '#1a1f2a')
    c.fillStyle = g
    c.fillRect(ESPELHO.x, ESPELHO.y, ESPELHO.w, ESPELHO.h)
  }
  ret(c, x + 40, CHAO - 54, 2, 6, '#b8a070')
  // Roupas penduradas para fora da porta mal fechada
  ret(c, x + 46, CHAO - 70, 3, 18, '#c85a6a')
}

/** O brilho do vidro, por cima do reflexo. */
export function brilhoDoEspelho(c: CanvasRenderingContext2D): void {
  c.fillStyle = 'rgba(200,220,255,0.08)'
  c.beginPath()
  c.moveTo(ESPELHO.x + 3, ESPELHO.y)
  c.lineTo(ESPELHO.x + 9, ESPELHO.y)
  c.lineTo(ESPELHO.x + 2, ESPELHO.y + 30)
  c.lineTo(ESPELHO.x, ESPELHO.y + 30)
  c.closePath()
  c.fill()
}

// --- Os nós, depois do grito ------------------------------------------------

export interface No {
  id: string
  comodo: string
  x: number
  /** Cor do fio: de quem é. */
  cor: string
  lembranca: Line[]
}

/**
 * Depois do grito, um fio desce do teto em cada cômodo, com um nó na altura
 * dos olhos — um de cada pessoa da família. Desatar mostra uma lembrança
 * boa, curta, que o nó estava segurando. Com os quatro soltos, a porta do
 * fim do corredor abre.
 */
export const NOS: No[] = [
  {
    id: 'no-mae', comodo: 'sala', x: 322, cor: '#e2a95e',
    lembranca: [
      { text: 'A mãe, de joelhos no chão da sala, me ensinando a amarrar o tênis.' },
      { speaker: 'Evelyn', text: 'Faz uma orelha. Agora a outra. Viu?', style: 'speech' },
      { speaker: 'Evelyn', text: 'Nó nenhum aguenta quando você sabe por onde puxa.', style: 'speech' },
    ],
  },
  {
    id: 'no-pai', comodo: 'corredor', x: 344, cor: '#93a6c6',
    lembranca: [
      { text: 'O pai me carregando no ombro pra eu ver o desfile por cima de todo mundo.' },
      { text: 'Ele cantava a música errada de propósito, alto, e eu ria.' },
      { text: 'Ele também foi isso. Eu esqueço que ele também foi isso.' },
    ],
  },
  {
    id: 'no-lia', comodo: 'quarto', x: 128, cor: '#d06e80',
    lembranca: [
      { text: 'A Lia, com seis anos, tentando me ensinar a assobiar com dois dedos.' },
      { speaker: 'Lia', text: 'Não é assim, seu burro. De novo.', style: 'speech' },
      { text: 'Eu nunca aprendi. Ela nunca desistiu.' },
    ],
  },
  {
    id: 'no-e', comodo: 'lia', x: 272, cor: '#b49ade',
    lembranca: [
      { text: 'Uma menina mais velha penteando o cabelo da Lia, no chão deste quarto.' },
      { text: 'O cabelo dela é claro. Comprido e claro.' },
      { text: 'Eu não lembro do rosto. Só da escova, e de ela cantarolar a música subindo.' },
    ],
  },
]

/** Um fio do teto até a altura dos olhos, com um nó; desatado, ele cai. */
export function desenharNo(c: CanvasRenderingContext2D, x: number, cor: string, t: number, desatado: number): void {
  const balanco = Math.sin(t * 0.8 + x) * 1.5
  const queda = desatado * 70
  c.save()
  c.globalAlpha = 1 - desatado
  c.strokeStyle = cor
  c.lineWidth = 1
  c.beginPath()
  c.moveTo(x, 0)
  c.quadraticCurveTo(x + balanco, 50 + queda, x + balanco * 1.6, 96 + queda)
  c.stroke()
  // O nó: uma volta e as pontas.
  const nx = x + balanco * 1.6
  const ny = 98 + queda
  c.beginPath()
  c.arc(nx, ny, 3, 0, Math.PI * 2)
  c.stroke()
  c.fillStyle = cor
  c.fillRect(Math.round(nx) - 1, Math.round(ny) - 1, 3, 3)
  c.beginPath()
  c.moveTo(nx, ny + 3)
  c.lineTo(nx - 2 + balanco, ny + 12)
  c.moveTo(nx, ny + 3)
  c.lineTo(nx + 3 + balanco, ny + 10)
  c.stroke()
  c.restore()
  if (desatado < 1) brilho(c, nx, ny, 14, '255,240,220', 0.12 * (1 - desatado) * (0.7 + 0.3 * Math.sin(t * 2 + x)))
}

const CORREDOR_DEPOIS: VestigioCasa[] = [
  {
    id: 'd-secretaria', x: 118, rotulo: 'Ouvir', acao: 'secretaria',
    linhas: [
      { text: 'A secretária eletrônica, no aparador. A luz âmbar piscando.' },
      { text: 'Uma mensagem. Terça-feira, dezessete e quarenta.' },
    ],
  },
  {
    id: 'd-retrato', x: 202, rotulo: 'Olhar', naParede: true,
    linhas: [
      { text: 'O retrato grande do corredor ficou torto.' },
      { text: 'O vão entre mim e a minha mãe continua do mesmo tamanho. Só que agora ninguém endireita.' },
    ],
  },
  {
    id: 'd-caderno-lia', x: 176, rotulo: 'Pegar',
    linhas: [
      { text: 'O caderno da Lia continua no chão, aberto na mesma página.' },
    ],
    documento: DOC_CADERNO_LIA,
  },
  {
    id: 'd-casaco', x: 232, rotulo: 'Olhar',
    linhas: [
      { text: 'O casaco mostarda caiu do cabide.' },
      { text: 'Pequeno demais pra um adulto. Grande demais pra mim.' },
      { text: 'Eu deixo ele onde caiu. Alguém vai precisar achar.' },
    ],
  },
]

const QUARTO_DEPOIS: VestigioCasa[] = [
  {
    id: 'd-cabana', x: 58, rotulo: 'Olhar',
    linhas: [
      { text: 'A cabana desabou. As cadeiras de lado, o cobertor no chão.' },
      { text: 'A lanterna ainda está acesa lá embaixo, fraca.' },
    ],
  },
  {
    id: 'd-caixa', x: 214, rotulo: 'Olhar',
    linhas: [
      { text: 'A caixa debaixo da cama virou. Botão, passagem vencida, pedra pintada, chave sem porta.' },
      { text: 'Pela primeira vez a chave não parece sem porta. Parece só que ninguém ainda tentou.' },
    ],
  },
  {
    id: 'd-coelho', x: 262, rotulo: 'Pegar',
    linhas: [
      { text: 'O coelho de pano está virado pra parede, como eu deixei.' },
      { text: 'Eu viro ele pro quarto.' },
      { text: 'Ele pode ouvir agora.' },
    ],
  },
  {
    id: 'd-diario', x: 342, rotulo: 'Ler',
    linhas: [
      { text: 'Meu diário. A última página tem a marca de uma folha arrancada.' },
    ],
    documento: DOC_DIARIO,
  },
]

/** O caderno da Lia no chão: capa vermelha, as folhas abertas. */
function cadernoNoChao(c: CanvasRenderingContext2D, x: number): void {
  ret(c, x - 5, CHAO + 7, 10, 3, '#7a2a34')
  ret(c, x - 4, CHAO + 6, 8, 1, '#e4dccb')
  ret(c, x - 3, CHAO + 6, 2, 1, '#b03a3a')
}

/** A secretária eletrônica em cima do aparador, onde ficavam as cartas. */
function secretaria(c: CanvasRenderingContext2D, x: number): void {
  ret(c, x + 36, CHAO - 39, 16, 6, '#26262c')
  ret(c, x + 36, CHAO - 39, 16, 1, '#3a3a42')
  ret(c, x + 38, CHAO - 37, 6, 3, '#14141a')
  ret(c, x + 39, CHAO - 36, 1, 1, '#4a4a54')
  ret(c, x + 42, CHAO - 36, 1, 1, '#4a4a54')
  // As cartas no chão, embaixo
  ret(c, x + 30, CHAO + 8, 9, 2, '#cfc9b6')
  ret(c, x + 42, CHAO + 10, 7, 2, '#dcd6c4')
}

/** A cabana depois da onda: cadeiras de lado, cobertor caído. */
function cabanaCaida(c: CanvasRenderingContext2D): void {
  ret(c, 18, CHAO - 4, 34, 3, '#3c3038')
  ret(c, 78, CHAO - 3, 30, 3, '#3c3038')
  const cores = ['#6a3e3a', '#7a5a3e', '#4a4e6a', '#5e3a4a', '#6e6242']
  for (let i = 0; i < 12; i++) {
    ret(c, 22 + i * 7, CHAO - 2 + (i % 3), 7, 3, cores[i % cores.length] ?? '#555')
  }
  ret(c, 56, CHAO - 5, 4, 3, '#2a2a30')
  ret(c, 60, CHAO - 4, 2, 1, 'rgba(255,200,130,0.5)')
}
