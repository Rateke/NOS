import { WORLD_W, WORLD_H } from '../../engine/constants'
import type { RGB } from './arte'
import { rgb, clarear, ret, sorteio } from './arte'
import { desenharReliquia } from './reliquias'
import type { TipoReliquia } from './reliquias'

/**
 * A câmara sob o assoalho, e o Tear.
 *
 * O Tear é um tear de verdade: moldura de madeira, urdidura esticada de cima
 * a baixo, liços, pente, lançadeira, e o tecido crescendo de baixo para cima.
 * O que ele tece é a família — uma casa, cinco figuras de mãos dadas. Cada fio
 * que Liam toca vira uma carreira desse tecido: a imagem fica mais bonita
 * enquanto ele fica pior. Quando o tecido fica pronto, aparece o que faltava:
 * um buraco do tamanho de uma pessoa, e um fio da urdidura cortado.
 */

export const TEAR = { x0: 64, x1: 320, topo: 22, base: 160 }
/** Urdidura: de onde a onde vão os fios verticais. */
export const URD = { x0: 80, colunas: 75, passo: 3, topo: 32, base: 132 }
/** Carreiras de tecido: 2px cada, de baixo para cima. */
export const CARREIRAS = 40
export const CHAO_CAMARA = 160
export const LIAM_CAMARA = { x: WORLD_W / 2, y: 166 }

/** Coluna da urdidura que alguém cortou. */
const CORTADA = 58
/** O lugar vazio na tapeçaria: colunas e carreiras da figura que falta. */
const VAZIO = { c0: 57, c1: 59, r0: 7, r1: 15 }

export interface FioTear {
  cor: string
  absorvido: boolean
  /** 0..1: quanto já foi tecido. */
  puxado: number
  reliquia: TipoReliquia
  balanco: number
}

export interface EstadoTear {
  t: number
  intensidade: number
  /** Carreiras tecidas até agora (fracionário). */
  tecido: number
  fios: FioTear[]
  sel: number
  /** Lançadeira: posição 0..1 atravessando, e se está correndo. */
  lancadeira: number
  lancando: boolean
  /** 0..1: o pente batendo a carreira. */
  batedor: number
  /** Liços: sobe e desce a cada passada. */
  cala: number
  /** 0..1: o fio cortado brilhando depois da lembrança dela. */
  brilhoCorte: number
  /** Quando tudo se rompe no fim. */
  rompido: boolean
}

/** Onde fica cada carretel: três de cada lado da moldura. */
export function posCarretel(i: number): { x: number; y: number; lado: number } {
  const esquerda = i < 3
  return { x: esquerda ? 50 : 334, y: 44 + (i % 3) * 30, lado: esquerda ? -1 : 1 }
}

export function linhaDoTecido(tecido: number): number {
  return URD.base - Math.min(CARREIRAS, tecido) * 2
}

// --- Câmara -------------------------------------------------------------------

export function drawCamara(c: CanvasRenderingContext2D, e: EstadoTear): void {
  const t = e.t
  ret(c, 0, 0, WORLD_W, WORLD_H, '#040509')
  paredesDePedra(c)
  tetoDeTabuas(c, t, e.intensidade)
  chaoDeTerra(c)
  escada(c)
  prateleira(c, 346)
  cadernosNoChao(c)
  velas(c, t)
}

function paredesDePedra(c: CanvasRenderingContext2D): void {
  const r = sorteio(5)
  const base: RGB = [20, 20, 28]
  ret(c, 0, 22, WORLD_W, CHAO_CAMARA - 22, rgb(base))
  for (let y = 22; y < CHAO_CAMARA; y += 7) {
    const desl = ((y - 22) / 7) % 2 ? 6 : 0
    for (let x = -desl; x < WORLD_W; x += 13) {
      const tom = Math.floor(r() * 9) - 4
      ret(c, x + 1, y + 1, 11, 5, rgb(clarear(base, tom + 4)))
      ret(c, x + 1, y + 1, 11, 1, rgb(clarear(base, tom + 9)))
    }
  }
  // Umidade escorrendo e raízes descendo do teto
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(r() * WORLD_W)
    ret(c, x, 22, 1, 20 + Math.floor(r() * 40), 'rgba(40,52,48,0.5)')
  }
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(r() * WORLD_W)
    const comp = 6 + Math.floor(r() * 18)
    ret(c, x, 22, 1, comp, '#2a2018')
    ret(c, x + 1, 22 + comp - 3, 1, 3, '#2a2018')
  }
}

/** O assoalho da cozinha visto de baixo. A briga passa pelas frestas. */
function tetoDeTabuas(c: CanvasRenderingContext2D, t: number, i: number): void {
  ret(c, 0, 0, WORLD_W, 22, '#0c0d14')
  for (let x = 0; x < WORLD_W; x += 24) {
    ret(c, x, 0, 20, 20, '#15161f')
    ret(c, x, 19, 20, 1, '#1d1e28')
    // Fresta de luz entre as tábuas, pulsando com as vozes lá em cima
    const a = (0.08 + Math.max(0, Math.sin(t * 7 + x)) * 0.1) * (1 - i * 0.6)
    ret(c, x + 20, 0, 4, 20, `rgba(230,190,130,${a})`)
  }
  // Vigas
  for (const x of [8, 140, 244, 370]) ret(c, x - 3, 0, 7, 24, '#1a1410')
  ret(c, 0, 20, WORLD_W, 3, '#1a1410')
}

function chaoDeTerra(c: CanvasRenderingContext2D): void {
  const r = sorteio(12)
  ret(c, 0, CHAO_CAMARA, WORLD_W, WORLD_H - CHAO_CAMARA, '#0b0a0e')
  for (let i = 0; i < 160; i++) {
    const x = Math.floor(r() * WORLD_W)
    const y = CHAO_CAMARA + Math.floor(r() * (WORLD_H - CHAO_CAMARA))
    ret(c, x, y, 2, 1, r() > 0.5 ? '#14121a' : '#0f0d12')
  }
  // Fios soltos pelo chão, de tentativas antigas
  const cores = ['#4a3a5a', '#3a4a5a', '#5a3a3a']
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(r() * WORLD_W)
    const y = CHAO_CAMARA + 6 + Math.floor(r() * 40)
    for (let k = 0; k < 14; k++) ret(c, x + k, y + Math.round(Math.sin(k * 0.8 + i) * 1.5), 1, 1, cores[i % 3] ?? '#444')
  }
  ret(c, 0, CHAO_CAMARA, WORLD_W, 2, 'rgba(0,0,0,0.5)')
}

function escada(c: CanvasRenderingContext2D): void {
  ret(c, 10, 0, 3, CHAO_CAMARA, '#1e1812')
  ret(c, 24, 0, 3, CHAO_CAMARA, '#1e1812')
  for (let y = 8; y < CHAO_CAMARA; y += 12) ret(c, 10, y, 17, 2, '#2a2218')
  // A luz do alçapão aberto, lá em cima
  const g = c.createLinearGradient(0, 0, 0, 90)
  g.addColorStop(0, 'rgba(236,200,150,0.25)')
  g.addColorStop(1, 'rgba(236,200,150,0)')
  c.fillStyle = g
  c.fillRect(6, 0, 26, 90)
}

/** Prateleira com os cadernos de Amélia, potes, uma foto virada. */
function prateleira(c: CanvasRenderingContext2D, x: number): void {
  for (const y of [58, 92, 126]) {
    ret(c, x, y, 34, 3, '#2a2018')
    ret(c, x + 2, y + 3, 2, 4, '#1a140e')
    ret(c, x + 30, y + 3, 2, 4, '#1a140e')
  }
  const lombadas = ['#4a3a2e', '#3a2e2a', '#5a4632', '#3e3226', '#4e3e2e']
  for (let i = 0; i < 7; i++) ret(c, x + 2 + i * 4, 44, 3, 14, lombadas[i % 5] ?? '#333')
  ret(c, x + 30, 48, 3, 10, '#2e2a2e')
  // Potes com coisas dentro: botões, chaves, pedras
  for (let i = 0; i < 3; i++) {
    ret(c, x + 3 + i * 10, 82, 7, 10, 'rgba(120,140,150,0.3)')
    ret(c, x + 3 + i * 10, 81, 7, 2, '#3a3a40')
    ret(c, x + 5 + i * 10, 88, 3, 3, ['#8a6a3a', '#6a6a7a', '#3a5a8a'][i] ?? '#555')
  }
  // Foto virada para a parede
  ret(c, x + 6, 112, 12, 14, '#8a8272')
  ret(c, x + 7, 113, 10, 12, '#6a6254')
  ret(c, x + 22, 118, 8, 8, '#3a2e24')
}

function cadernosNoChao(c: CanvasRenderingContext2D): void {
  ret(c, 344, CHAO_CAMARA + 4, 18, 4, '#4a3a2e')
  ret(c, 346, CHAO_CAMARA + 1, 16, 3, '#5a4632')
  ret(c, 343, CHAO_CAMARA - 2, 17, 3, '#3a2e2a')
  // Um aberto: a letra dela
  ret(c, 318, CHAO_CAMARA + 10, 20, 7, '#b8ae96')
  ret(c, 327, CHAO_CAMARA + 10, 1, 7, '#8a8272')
  for (let i = 0; i < 3; i++) {
    ret(c, 320, CHAO_CAMARA + 12 + i * 2, 6, 1, 'rgba(40,30,30,0.6)')
    ret(c, 329, CHAO_CAMARA + 12 + i * 2, 7, 1, 'rgba(40,30,30,0.6)')
  }
}

function velas(c: CanvasRenderingContext2D, t: number): void {
  for (const [x, h] of [[60, 8], [70, 5], [300, 7], [360, 6]] as const) {
    ret(c, x, CHAO_CAMARA - h, 3, h, '#c8bea4')
    ret(c, x, CHAO_CAMARA - h, 3, 1, '#e4dcc4')
    const f = Math.sin(t * 11 + x) > 0 ? 1 : 0
    ret(c, x + 1, CHAO_CAMARA - h - 3 - f, 1, 3, '#ffd28a')
    ret(c, x + 1, CHAO_CAMARA - h - 1, 1, 1, '#ff9a4a')
  }
}

// --- O Tear -------------------------------------------------------------------

export function drawTear(c: CanvasRenderingContext2D, e: EstadoTear): void {
  const fell = linhaDoTecido(e.tecido)
  moldura(c)
  urdidura(c, e, fell)
  tapecaria(c, e.tecido)
  licos(c, e)
  pente(c, e, fell)
  carreteis(c, e, fell)
  lancadeira(c, e, fell)
}

function moldura(c: CanvasRenderingContext2D): void {
  const m: RGB = [58, 40, 30]
  const { x0, x1, topo, base } = TEAR
  // Montantes, com pés e escoras
  for (const x of [x0, x1 - 8]) {
    ret(c, x, topo, 8, base - topo, rgb(m))
    ret(c, x, topo, 2, base - topo, rgb(clarear(m, 12)))
    ret(c, x + 6, topo, 2, base - topo, rgb(clarear(m, -14)))
    ret(c, x - 6, base - 4, 20, 4, rgb(clarear(m, -8)))
  }
  // Escoras diagonais
  c.strokeStyle = rgb(clarear(m, -10))
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(x0 + 8, base - 30)
  c.lineTo(x0 + 22, base - 4)
  c.moveTo(x1 - 8, base - 30)
  c.lineTo(x1 - 22, base - 4)
  c.stroke()
  // Rolo de cima, com as pontas torneadas
  ret(c, x0 - 4, topo, x1 - x0 + 8, 9, rgb(clarear(m, 6)))
  ret(c, x0 - 4, topo, x1 - x0 + 8, 2, rgb(clarear(m, 20)))
  ret(c, x0 - 4, topo + 8, x1 - x0 + 8, 1, rgb(clarear(m, -18)))
  for (const x of [x0 - 8, x1 + 4]) {
    ret(c, x, topo - 1, 5, 11, rgb(clarear(m, 10)))
    ret(c, x + 1, topo + 2, 3, 5, rgb(clarear(m, -6)))
  }
  // Entalhe no rolo: nós, um ao lado do outro
  for (let x = x0 + 10; x < x1 - 10; x += 16) {
    ret(c, x, topo + 3, 3, 3, rgb(clarear(m, -12)))
    ret(c, x + 1, topo + 4, 1, 1, rgb(clarear(m, 18)))
  }
  // Rolo de baixo, onde o tecido pronto enrola
  ret(c, x0 - 2, URD.base, x1 - x0 + 4, 10, rgb(clarear(m, 2)))
  ret(c, x0 - 2, URD.base, x1 - x0 + 4, 2, rgb(clarear(m, 16)))
  for (let i = 0; i < 3; i++) ret(c, URD.x0, URD.base + 3 + i * 2, URD.colunas * URD.passo, 1, 'rgba(60,40,80,0.6)')
  // Catraca do rolo
  c.fillStyle = rgb(clarear(m, 12))
  c.beginPath()
  c.arc(x1 + 2, URD.base + 5, 5, 0, Math.PI * 2)
  c.fill()
  ret(c, x1 + 1, URD.base + 1, 2, 8, rgb(clarear(m, -14)))
}

/**
 * Os fios da urdidura. Tremem com a intensidade e vibram a cada batida do
 * pente. Um deles está cortado: pende solto do rolo de cima.
 */
function urdidura(c: CanvasRenderingContext2D, e: EstadoTear, fell: number): void {
  const vib = e.batedor * 1.2 + e.intensidade * 0.6
  for (let col = 0; col < URD.colunas; col++) {
    const x = URD.x0 + col * URD.passo + 1
    const par = col % 2 === 0
    const a = 0.28 + (par ? e.cala * 0.1 : 0)
    if (col === CORTADA) {
      // A ponta de cima pende e enrola; a de baixo some no tecido.
      const pende = 30 + Math.sin(e.t * 1.1) * 2
      const brilho = e.brilhoCorte
      c.fillStyle = brilho > 0 ? `rgba(200,170,255,${0.4 + brilho * 0.6})` : `rgba(210,200,176,${a})`
      c.fillRect(x, URD.topo, 1, pende)
      c.fillRect(x + 1, URD.topo + pende, 1, 2)
      c.fillRect(x + 2, URD.topo + pende + 1, 1, 1)
      continue
    }
    c.fillStyle = `rgba(210,200,176,${a})`
    if (vib > 0.05) {
      // Vibra como corda: desenha em segmentos deslocados
      for (let y = URD.topo; y < fell; y += 6) {
        const d = Math.round(Math.sin(e.t * 40 + col + y * 0.2) * vib)
        c.fillRect(x + d, y, 1, Math.min(6, fell - y))
      }
    } else {
      c.fillRect(x, URD.topo, 1, fell - URD.topo)
    }
  }
}

/** Liços: a barra que abre a cala, com os laços em fios alternados. */
function licos(c: CanvasRenderingContext2D, e: EstadoTear): void {
  const y = 38 + Math.round(e.cala * 3)
  const m: RGB = [74, 52, 38]
  ret(c, TEAR.x0 + 8, y, TEAR.x1 - TEAR.x0 - 16, 3, rgb(m))
  ret(c, TEAR.x0 + 8, y, TEAR.x1 - TEAR.x0 - 16, 1, rgb(clarear(m, 18)))
  for (let col = 0; col < URD.colunas; col += 2) {
    ret(c, URD.x0 + col * URD.passo + 1, y + 3, 1, 2, 'rgba(220,210,190,0.55)')
  }
  // Cordas que prendem os liços ao alto
  ret(c, TEAR.x0 + 14, TEAR.topo + 9, 1, y - TEAR.topo - 9, '#6a5a44')
  ret(c, TEAR.x1 - 15, TEAR.topo + 9, 1, y - TEAR.topo - 9, '#6a5a44')
}

/** O pente, logo acima da linha do tecido. Bate a cada nota certa. */
function pente(c: CanvasRenderingContext2D, e: EstadoTear, fell: number): void {
  const y = fell - 9 + Math.round(e.batedor * 6)
  const m: RGB = [80, 58, 42]
  ret(c, TEAR.x0 + 6, y, TEAR.x1 - TEAR.x0 - 12, 3, rgb(m))
  ret(c, TEAR.x0 + 6, y, TEAR.x1 - TEAR.x0 - 12, 1, rgb(clarear(m, 20)))
  for (let x = URD.x0; x < URD.x0 + URD.colunas * URD.passo; x += URD.passo) {
    ret(c, x, y + 3, 1, 3, 'rgba(140,120,100,0.6)')
  }
}

/**
 * A tapeçaria. É desenhada célula a célula — uma célula por fio de urdidura
 * e carreira — com o brilho alternando, que é o que faz parecer trama.
 */
function tapecaria(c: CanvasRenderingContext2D, tecido: number): void {
  const inteiras = Math.floor(Math.min(CARREIRAS, tecido))
  for (let row = 0; row < inteiras; row++) {
    const y = URD.base - (row + 1) * 2
    for (let col = 0; col < URD.colunas; col++) {
      const cor = motivo(col, row)
      if (!cor) continue
      const x = URD.x0 + col * URD.passo
      c.fillStyle = cor
      c.fillRect(x, y, URD.passo, 2)
      // Trama: um pixel mais claro alternando, como fio passando por cima
      if ((col + row) % 2 === 0) {
        c.fillStyle = 'rgba(255,255,255,0.08)'
        c.fillRect(x, y, URD.passo, 1)
      } else {
        c.fillStyle = 'rgba(0,0,0,0.14)'
        c.fillRect(x, y + 1, URD.passo, 1)
      }
    }
  }
  // A carreira sendo tecida agora, pela metade
  const parcial = Math.min(CARREIRAS, tecido) - inteiras
  if (parcial > 0 && inteiras < CARREIRAS) {
    const y = URD.base - (inteiras + 1) * 2
    const ate = Math.floor(URD.colunas * parcial)
    for (let col = 0; col < ate; col++) {
      const cor = motivo(col, inteiras)
      if (!cor) continue
      c.fillStyle = cor
      c.fillRect(URD.x0 + col * URD.passo, y, URD.passo, 2)
    }
  }
}

const FUNDO = ['#221e38', '#262240']
const FIGURAS: { col: number; cor: string; alt: number }[] = [
  { col: 8, cor: '#7a90b4', alt: 10 },   // pai
  { col: 14, cor: '#b07a90', alt: 8 },   // Lia
  { col: 52, cor: '#d8d0bc', alt: 8 },   // Liam
  { col: 58, cor: '', alt: 10 },         // quem falta
  { col: 64, cor: '#b88a70', alt: 9 },   // mãe
]

/** O desenho do tecido: casa, família de mãos dadas, céu com lua. */
function motivo(col: number, row: number): string | null {
  const borda = row <= 2 || row >= CARREIRAS - 3
  if (borda) return (col + row) % 4 < 2 ? '#8a6a3a' : '#5a3634'
  if (row === 3 || row === CARREIRAS - 4) return '#c4a45e'

  // O vazio: ninguém teceu esta figura. Só a urdidura aparece.
  if (col >= VAZIO.c0 && col <= VAZIO.c1 && row >= VAZIO.r0 && row <= VAZIO.r1) return null

  if (row <= 6) return (col * 7 + row) % 5 === 0 ? '#4a5a36' : '#3a4a2e'

  // Casa
  if (col >= 30 && col <= 44 && row >= 7 && row <= 20) {
    if (col >= 36 && col <= 38 && row <= 11) return '#3a2226'
    if (((col >= 32 && col <= 34) || (col >= 40 && col <= 42)) && row >= 13 && row <= 16) return '#e8c070'
    if (col === 32 || col === 34 || col === 40 || col === 42) {
      if (row >= 13 && row <= 16) return '#e8c070'
    }
    return (row % 3 === 0) ? '#8a5a40' : '#9a6a4a'
  }
  if (row >= 21 && row <= 28) {
    const r = row - 21
    if (col >= 29 + r && col <= 45 - r) return '#7a3a34'
    if (col >= 41 && col <= 42 && row <= 26) return '#5a2e2a'
  }

  // Figuras de mãos dadas
  for (const f of FIGURAS) {
    if (col >= f.col - 1 && col <= f.col + 1 && row >= 7 && row < 7 + f.alt) {
      if (!f.cor) return null
      const cabeca = row >= 7 + f.alt - 3
      if (cabeca && (col === f.col - 1 || col === f.col + 1) && row === 7 + f.alt - 1) return FUNDO[0] ?? null
      return cabeca ? '#d8b89a' : f.cor
    }
  }
  // Mãos: uma linha dourada ligando vizinhos, menos em volta do vazio
  if (row === 11) {
    if ((col > 9 && col < 13) || (col > 53 && col < 56) || (col > 60 && col < 63)) {
      return col > 53 && col < 63 ? '#6a5a44' : '#c4a45e'
    }
  }

  // Céu: estrelas e lua
  if (col >= 60 && col <= 64 && row >= 30 && row <= 34) {
    if (!(col === 60 && (row === 30 || row === 34)) && !(col === 64 && (row === 30 || row === 34))) {
      return col >= 63 && row >= 31 && row <= 33 ? '#262240' : '#e8e0c8'
    }
  }
  if ((col * 13 + row * 7) % 53 === 0 && row > 22) return '#e8e0c8'
  return FUNDO[(col + row) % 2] ?? '#222'
}

/**
 * Os carretéis de cada fio, três de cada lado, com a relíquia pendurada.
 * O fio sai do carretel e entra no tear na altura da carreira de agora.
 */
function carreteis(c: CanvasRenderingContext2D, e: EstadoTear, fell: number): void {
  // Os postes
  ret(c, 48, 36, 3, CHAO_CAMARA - 36, '#2e2218')
  ret(c, 333, 36, 3, CHAO_CAMARA - 36, '#2e2218')
  for (const [i, f] of e.fios.entries()) {
    const p = posCarretel(i)
    const sel = i === e.sel && !f.absorvido
    // Fio até o tear, com barriga. O selecionado brilha e vai até a lançadeira.
    if (!f.absorvido) {
      const bordaX = p.lado < 0 ? URD.x0 : URD.x0 + URD.colunas * URD.passo
      const alvoX = sel ? URD.x0 + e.lancadeira * URD.colunas * URD.passo : bordaX
      c.strokeStyle = f.cor
      c.globalAlpha = sel ? 0.95 : 0.4
      c.lineWidth = sel ? 1.4 : 1
      c.beginPath()
      c.moveTo(p.x + 1, p.y + 4)
      const meioX = (p.x + bordaX) / 2
      const barriga = 10 + Math.sin(e.t * 0.9 + i) * 2 - f.puxado * 8
      c.quadraticCurveTo(meioX, Math.max(p.y, fell) + barriga, bordaX, fell - 1)
      if (sel) c.lineTo(alvoX, fell - 1)
      c.stroke()
      c.globalAlpha = 1
    }
    // O carretel: flanges de madeira e a linha enrolada no meio
    const cheio = f.absorvido ? 0 : 1 - f.puxado * 0.6
    ret(c, p.x - 4, p.y - 6, 10, 2, '#6a4a32')
    ret(c, p.x - 4, p.y + 5, 10, 2, '#6a4a32')
    ret(c, p.x, p.y - 4, 2, 9, '#3a2a1e')
    const larg = Math.round(1 + cheio * 3)
    if (cheio > 0) {
      ret(c, p.x + 1 - larg, p.y - 4, larg * 2, 9, f.cor)
      for (let k = 0; k < 4; k++) ret(c, p.x + 1 - larg, p.y - 3 + k * 2, larg * 2, 1, 'rgba(0,0,0,0.25)')
    }
    if (sel) {
      const a = 0.45 + Math.sin(e.t * 6) * 0.3
      c.strokeStyle = `rgba(217,178,95,${a})`
      c.lineWidth = 1
      c.strokeRect(p.x - 5.5, p.y - 7.5, 13, 16)
    }
    // A relíquia pendurada embaixo do carretel
    const osc = f.absorvido ? 0 : Math.sin(f.balanco) * 2
    const rx = Math.round(p.x + 1 + osc)
    c.fillStyle = 'rgba(140,130,150,0.4)'
    c.fillRect(p.x + 1, p.y + 7, 1, 5)
    c.save()
    c.globalAlpha = f.absorvido ? 0.25 : 0.85
    desenharReliquia(c, f.reliquia, rx, p.y + 12, f.absorvido ? '#2a2e3a' : f.cor, 'rgba(10,10,16,0.7)')
    c.restore()
  }
}

/** A lançadeira: um barquinho de madeira que atravessa a cala. */
function lancadeira(c: CanvasRenderingContext2D, e: EstadoTear, fell: number): void {
  const fio = e.fios[e.sel]
  const x = Math.round(URD.x0 + e.lancadeira * (URD.colunas * URD.passo) - 6)
  const y = fell - 4
  ret(c, x + 1, y, 10, 3, '#9a7446')
  ret(c, x, y + 1, 1, 1, '#9a7446')
  ret(c, x + 11, y + 1, 1, 1, '#9a7446')
  ret(c, x + 2, y, 8, 1, '#c49a62')
  ret(c, x + 4, y + 1, 4, 1, fio && !fio.absorvido ? fio.cor : '#6a5a4a')
  if (e.lancando) {
    // Rastro de luz de quem passa depressa
    ret(c, x - 8, y + 1, 8, 1, 'rgba(255,230,190,0.25)')
  }
}

/**
 * Os fios já tecidos continuam presos em Liam: saem da linha do tecido e
 * entram no peito dele. É assim que se vê que o tecido bonito custa alguém.
 */
export function drawAmarras(c: CanvasRenderingContext2D, e: EstadoTear, peitoY: number): void {
  const fell = linhaDoTecido(e.tecido)
  const feitos = e.fios.filter((f) => f.absorvido)
  const { x } = LIAM_CAMARA
  c.save()
  for (const [k, f] of feitos.entries()) {
    const sx = URD.x0 + 14 + k * 38
    c.strokeStyle = f.cor
    c.globalAlpha = e.rompido ? 0 : 0.55 + Math.sin(e.t * 3 + k) * 0.2
    c.lineWidth = 1
    c.beginPath()
    c.moveTo(sx, fell + 1)
    const meio = (sx + x) / 2 + Math.sin(e.t * 1.7 + k) * 6
    c.quadraticCurveTo(meio, peitoY - 26, x + (k - feitos.length / 2) * 0.6, peitoY)
    c.stroke()
  }
  c.restore()
}

/** A luz do Tear: cresce roxa conforme Liam enche. */
export function drawLuzCamara(c: CanvasRenderingContext2D, e: EstadoTear): void {
  c.save()
  c.globalCompositeOperation = 'multiply'
  const g = c.createRadialGradient(WORLD_W / 2, 100, 30, WORLD_W / 2, 100, 250)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.5, '#8a8aa0')
  g.addColorStop(1, '#2a2a38')
  c.fillStyle = g
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  c.restore()
  c.save()
  c.globalCompositeOperation = 'lighter'
  const { x, y } = LIAM_CAMARA
  const l = c.createRadialGradient(x, y - 20, 2, x, y - 20, 110)
  l.addColorStop(0, `rgba(196,170,236,${0.1 + e.intensidade * 0.3})`)
  l.addColorStop(1, 'rgba(196,170,236,0)')
  c.fillStyle = l
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  // Velas
  for (const vx of [61, 71, 301, 361]) {
    const v = c.createRadialGradient(vx, CHAO_CAMARA - 10, 0, vx, CHAO_CAMARA - 10, 26)
    v.addColorStop(0, 'rgba(255,190,120,0.16)')
    v.addColorStop(1, 'rgba(255,190,120,0)')
    c.fillStyle = v
    c.fillRect(vx - 26, CHAO_CAMARA - 36, 52, 52)
  }
  c.restore()
}
