import { WORLD_H } from '../../engine/constants'
import type { Line } from './types'
import type { Documento } from '../systems/leitor'
import {
  DOC_DIARIO, DOC_DIARIO_CONTRACAPA, DOC_RECEITAS, DOC_JORNAL, DOC_CARTA_ESCOLA,
} from '../content/documentos'
import type { RGB } from './arte'
import {
  rgb, clarear, ret, sorteio, papelDeParede, lambri, assoalho, porta, quadro, cantos,
} from './arte'
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
  /** Em vez de só ler: sentar ao piano, entrar na cabana. */
  acao?: 'piano' | 'cabana'
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

export function comodoSala(): Comodo {
  const estado = (e: EstadoComodo) => ({ k: K_SALA, t: e.t, tecla: e.tecla, brilhoTecla: e.brilhoTecla })
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
          { text: 'O poste da rua pisca. Três vezes curtas, uma longa.' },
        ],
        deNovo: [
          { text: 'Três curtas. Uma longa.' },
          { text: 'Era assim que a gente batia na porta um do outro.' },
          { text: 'Eu e...' },
          { text: 'Eu e quem?' },
        ],
      },
      {
        id: 'piano', x: PIANO.cx, rotulo: 'Tocar', acao: 'piano',
        linhas: [
          { text: 'O piano continua aberto.' },
          { text: 'A partitura é a mesma. A letra na margem é dele.' },
        ],
      },
      {
        id: 'retratos-sala', x: 243, rotulo: 'Olhar', naParede: true,
        linhas: [
          { text: 'Os retratos da sala são os bons.' },
          { text: 'Quatro pessoas. Duas. Três.' },
          { text: 'Em nenhum deles tem cinco.' },
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
        ],
      },
      {
        id: 'jornal', x: 320, rotulo: 'Ler',
        linhas: [
          { text: 'O jornal de hoje, dobrado na mesinha. Ele sempre lê primeiro.' },
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
          { text: '"e canela por cima!!" — a lápis roxo, letra redonda, de criança.' },
          { text: 'Ninguém nesta casa escreve assim.' },
        ],
        segredo: 'receita',
      },
    ],
    desenharFundo(c, e) {
      drawSalaFundo(c, estado(e))
    },
    atmosfera(c, e) {
      drawLuzSala(c, estado(e), 'sala')
    },
    desenharFrente(c, e) {
      drawSalaFrente(c, estado(e))
    },
  }
}

// --- Corredor ---------------------------------------------------------------

/** Cresce conforme Liam anda. Começa curto e vira túnel. */
export const CORREDOR_BASE = 470
export const CORREDOR_MAX = 1180

const PAREDE_CORR: RGB = [23, 27, 39]
const LAMBRI_CORR: RGB = [19, 23, 34]
const CHAO_CORR: RGB = [26, 29, 40]

export function comodoCorredor(largura: number): Comodo {
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
      { x: 268, para: 'cozinha', entraEm: 0, rotulo: 'Cozinha' },
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
          { text: 'É da minha escola.' },
        ],
        documento: DOC_CARTA_ESCOLA,
        depois: [
          { text: 'Eu rasguei a autorização. Alguém guardou mesmo assim.' },
          { text: 'E desenhou no verso.' },
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

    desenharFundo(c, e) {
      const t = e.t
      papelDeParede(c, 0, largura, 0, 98, PAREDE_CORR, 5)
      floresta(c, 520, largura - 70)
      ret(c, 0, 0, largura, 4, rgb(clarear(PAREDE_CORR, 10)))
      ret(c, 0, 4, largura, 1, 'rgba(0,0,0,0.3)')
      lambri(c, 0, largura, 100, CHAO, LAMBRI_CORR)
      assoalho(c, 0, largura, CHAO, WORLD_H, CHAO_CORR)
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
      porta(c, 42, CHAO, { luz: true, cor: [40, 42, 56] })
      porta(c, 150, CHAO, { cor: [34, 42, 60] })

      // O retrato grande, com o vão entre Liam e a mãe.
      quadro(c, 180, 26, 44, 32, { figuras: 4, vazios: [2], moldura: [82, 66, 52], foto: [30, 28, 34] })
      ret(c, 201, 20, 1, 6, 'rgba(0,0,0,0.5)')
      cabideiro(c, 232)

      porta(c, 268, CHAO, { luz: true, cor: [38, 42, 58] })
      // A briga na cozinha escapa por baixo da porta, em pulsos.
      const briga = 0.18 + Math.max(0, Math.sin(t * 2.3)) * 0.22
      ret(c, 253, CHAO - 2, 30, 2, `rgba(236,176,112,${briga})`)

      rouparia(c, 326, e.vistos.has('marcas+'))
      relogio(c, 366, 34, t)

      // Retratos do fundo: a família vai sumindo de um quadro para o outro.
      for (let i = 0; ; i++) {
        const qx = 404 + i * 76
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
        brilho(c, lx, 50, 70, '255,214,160', 0.16 * acesa)
      }
      brilho(c, 42, CHAO - 4, 40, '236,190,130', 0.12)
      brilho(c, 268, CHAO - 4, 44, '236,170,110', 0.1 + Math.max(0, Math.sin(e.t * 2.3)) * 0.08)
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
function relogio(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
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
  ponteiro(-t * 0.9, 5, '#2a2624')
  ponteiro(-t * 0.075 + 1.2, 3, '#1a1614')
  // Pêndulo
  const p = Math.sin(t * 2.2) * 2
  ret(c, x - 3, y + 9, 7, 10, '#2e2826')
  ret(c, x + Math.round(p), y + 10, 1, 6, '#8a7a52')
  ret(c, x + Math.round(p) - 1, y + 15, 3, 3, '#b8964e')
}

/** O último retrato: ninguém dentro, só o próprio corredor, de dia. */
function retratoVazio(c: CanvasRenderingContext2D, x: number, y: number): void {
  const w = 28
  const h = 22
  ret(c, x - 2, y - 2, w + 4, h + 4, '#5a4c44')
  ret(c, x - 1, y - 1, w + 2, h + 2, '#3c322e')
  ret(c, x, y, w, h, '#b4aa8e')
  // Um corredor em perspectiva, de dia
  ret(c, x + 10, y + 6, 8, 10, '#e2d8b8')
  c.fillStyle = '#8e846c'
  for (let i = 0; i < 10; i++) {
    c.fillRect(x + i, y + i * 0.6, 1, h - i * 1.2)
    c.fillRect(x + w - 1 - i, y + i * 0.6, 1, h - i * 1.2)
  }
  ret(c, x, y + h - 3, w, 3, '#9a8a6a')
  ret(c, x + 1, y + 1, 8, 1, 'rgba(255,255,255,0.2)')
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

const QUARTO_W = 420
const PAREDE_QUARTO: RGB = [25, 31, 48]
const LAMBRI_QUARTO: RGB = [21, 27, 42]
const CHAO_QUARTO: RGB = [30, 30, 42]
const LUMINARIA = { x: 352, y: 116 }

export function comodoQuarto(): Comodo {
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
          { speaker: 'Voz', text: 'Ele te ensinou aquela música descendo.', style: 'speech' },
          { speaker: 'Voz', text: 'Eu te ensinava subindo. Lembra?', style: 'speech' },
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
      cantos(c, QUARTO_W, CHAO, WORLD_H, PAREDE_QUARTO)

      estrelas(c, t)
      tapeteQuarto(c)
      cabana(c, t)
      paredeDePlantas(c, 100, 26, e.vistos.has('plantas+'))
      cama(c, 196)
      porta(c, 300, CHAO, { cor: [36, 44, 64], luz: true })
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

    atmosfera(c, e) {
      sombra(c, QUARTO_W, 'rgb(172,176,200)')
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
  ret(c, x + 1, y + 1, w, h, 'rgba(0,0,0,0.3)')
  ret(c, x, y, w, h, '#9c9684')
  ret(c, x, y, w, 1, '#b4ae9a')
  const tinta = 'rgba(34,44,72,0.85)'
  // Contorno da casa
  const cx = x + 3
  const cy = y + 4
  const cw = w - 10
  const ch = h - 9
  ret(c, cx, cy, cw, 1, tinta)
  ret(c, cx, cy + ch, cw, 1, tinta)
  ret(c, cx, cy, 1, ch, tinta)
  ret(c, cx + cw, cy, 1, ch + 1, tinta)
  // Paredes internas, diferentes em cada planta
  const vx = cx + 4 + Math.floor(r() * (cw - 8))
  ret(c, vx, cy, 1, ch, tinta)
  const hy = cy + 4 + Math.floor(r() * (ch - 8))
  ret(c, r() > 0.5 ? cx : vx, hy, r() > 0.5 ? vx - cx : cw - (vx - cx), 1, tinta)
  // Porta: um vão
  ret(c, vx, hy + 2, 1, 2, '#9c9684')
  // O cômodo a mais, sempre à direita, pendurado no fim do corredor
  const ex = cx + cw
  const ey = cy + Math.floor(ch * 0.3)
  for (let i = 0; i < 6; i += 2) {
    ret(c, ex + i, ey, 1, 1, tinta)
    ret(c, ex + i, ey + 7, 1, 1, tinta)
  }
  ret(c, ex + 6, ey, 1, 8, tinta)
  if (comArvores) {
    // Giz de cera: árvores verdes e um sol, desenhados por outra mão.
    for (let i = 0; i < 3; i++) {
      const tx = cx + 2 + Math.floor(r() * (cw - 4))
      const ty = cy + 2 + Math.floor(r() * (ch - 5))
      ret(c, tx, ty, 1, 3, 'rgba(60,130,70,0.8)')
      ret(c, tx - 1, ty + 1, 3, 1, 'rgba(60,130,70,0.8)')
    }
    ret(c, x + w - 5, y + 2, 3, 3, 'rgba(220,180,60,0.8)')
  }
  if (circulada) {
    c.strokeStyle = 'rgba(200,60,50,0.8)'
    c.lineWidth = 1
    c.beginPath()
    c.ellipse(ex + 4, ey + 4, 6, 6, 0, 0, Math.PI * 2)
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
