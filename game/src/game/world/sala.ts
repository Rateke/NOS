import { WORLD_H } from '../../engine/constants'
import type { RGB } from './arte'
import {
  mix, rgb, clarear, ret, papelDeParede, lambri, assoalho, porta, quadro, cantos,
} from './arte'
import {
  sanca, rodape, lustre, radiador, violeta, plantaAlta, cestoTrico, chinelos, quadroMar,
  relogioParado, interruptor, marcaDeQuadro, sombraDeContato, luarNoChao,
} from './detalhes'

/**
 * A sala.
 *
 * Serve às duas cenas que acontecem nela: o prólogo (a aula de piano, com a
 * câmera fechada no piano) e a exploração da casa (Liam andando pela sala
 * inteira). Tudo que Liam comenta aqui existe desenhado, no lugar em que ele
 * comenta — o piano, os retratos, o cobertor, o livro de receitas.
 *
 * `k` é o calor da cena: 1 no prólogo, quando a sala ainda é o único lugar
 * quente da obra; mais baixo na exploração, depois que o calor foi embora.
 */

export const SALA_W = 516
/** Porta da sala para o corredor. */
export const SALA_PORTA = 484
export const CHAO_Y = 150
/** Linha onde Liam anda: na frente dos móveis encostados na parede. */
export const PASSO_Y = 163
/** Assento do banco do piano, onde pai e filho se sentam no prólogo. */
export const BANCO_Y = 132

export const PIANO = { x0: 112, x1: 200, cx: 156 }
/** Luminária em cima do piano: a luz do prólogo. */
export const LUZ_PIANO = { x: 188, y: 78 }
/** Abajur de pé ao lado do sofá: a luz da sala à noite. */
export const ABAJUR = { x: 404, y: 60 }

export interface EstadoSala {
  k: number
  t: number
  /** Tecla do piano da cena acesa agora (0..7), ou -1. */
  tecla?: number
  brilhoTecla?: number
}

const PAREDE_FRIA: RGB = [22, 26, 38]
const PAREDE_QUENTE: RGB = [46, 33, 36]
const MADEIRA_FRIA: RGB = [26, 30, 42]
const MADEIRA_QUENTE: RGB = [54, 36, 32]

function tom(frio: RGB, quente: RGB, k: number): RGB {
  return [
    Math.round(frio[0] + (quente[0] - frio[0]) * k),
    Math.round(frio[1] + (quente[1] - frio[1]) * k),
    Math.round(frio[2] + (quente[2] - frio[2]) * k),
  ]
}

export function drawSalaFundo(c: CanvasRenderingContext2D, e: EstadoSala): void {
  const k = e.k
  const parede = tom(PAREDE_FRIA, PAREDE_QUENTE, k)
  papelDeParede(c, 0, SALA_W, 0, 102, parede, 3)
  sanca(c, 0, SALA_W, parede)
  // Friso que separa o papel de parede do lambri
  ret(c, 0, 101, SALA_W, 3, rgb(clarear(parede, 10)))
  ret(c, 0, 101, SALA_W, 1, rgb(clarear(parede, 22)))
  lambri(c, 0, SALA_W, 104, CHAO_Y, tom([18, 22, 33], [38, 27, 29], k))
  assoalho(c, 0, SALA_W, CHAO_Y, WORLD_H, tom([24, 28, 40], [50, 35, 33], k))
  rodape(c, 0, SALA_W, CHAO_Y, tom([26, 30, 42], [60, 40, 36], k))
  cantos(c, SALA_W, CHAO_Y, WORLD_H, parede)

  drawJanela(c, k, e.t)
  luarNoChao(c, 44, CHAO_Y + 1, 60)
  radiador(c, 42, 112, 52, k)
  // Onde ficava o quinto retrato: só o papel mais claro e o prego.
  marcaDeQuadro(c, 252, 56, 18, 22)
  drawRetratos(c, k)
  quadroMar(c, 292, 36, 76, 28, k)
  // O relógio da sala parou nas dez e quarenta. Ninguém comentou.
  relogioParado(c, 441, 52, 8, 10, 40, k)
  lustre(c, 318, k)
  drawTapete(c, k)
  sombraDeContato(c, PIANO.x0, CHAO_Y, PIANO.x1 - PIANO.x0)
  sombraDeContato(c, 229, CHAO_Y, 166)
  sombraDeContato(c, 418, CHAO_Y, 46)
  drawPiano(c, e)
  drawBanco(c, k)
  plantaAlta(c, 214, CHAO_Y, k)
  drawSofa(c, k)
  drawAbajur(c, k)
  drawEstante(c, k)
  porta(c, SALA_PORTA, CHAO_Y, { cor: tom([34, 42, 58], [62, 44, 40], k), luz: true })
  interruptor(c, 506, 100, k)
  cestoTrico(c, 222, CHAO_Y + 8, k)
  chinelos(c, 300, CHAO_Y + 4, rgb(tom([58, 54, 70], [110, 70, 60], k)))
}

/** O que fica entre Liam e a câmera. */
export function drawSalaFrente(c: CanvasRenderingContext2D, e: EstadoSala): void {
  drawMesinha(c, e.k)
}

function drawJanela(c: CanvasRenderingContext2D, k: number, t: number): void {
  const x = 36
  const y = 20
  const w = 64
  const h = 66
  const moldura = tom([34, 41, 60], [70, 52, 50], k)
  ret(c, x - 4, y - 4, w + 8, h + 10, rgb(moldura))
  ret(c, x - 4, y + h + 2, w + 8, 3, rgb(clarear(moldura, 14)))   // peitoril
  // Noite: nesta casa nunca é dia.
  const g = c.createLinearGradient(0, y, 0, y + h)
  g.addColorStop(0, '#070b18')
  g.addColorStop(1, '#141b2e')
  c.fillStyle = g
  c.fillRect(x, y, w, h)
  // Lua
  ret(c, x + 44, y + 9, 7, 7, 'rgba(214,222,238,0.8)')
  ret(c, x + 45, y + 8, 5, 9, 'rgba(214,222,238,0.8)')
  ret(c, x + 47, y + 10, 3, 3, 'rgba(160,170,196,0.6)')
  // Galho seco atravessando
  c.fillStyle = 'rgba(4,6,10,0.85)'
  c.fillRect(x, y + 34, 24, 2)
  c.fillRect(x + 14, y + 28, 2, 7)
  c.fillRect(x + 20, y + 36, 9, 1)
  // Poste lá fora: a única luz da rua, que pisca sempre na mesma ordem.
  const pisca = posteAceso(t) ? 0.38 : 0.08
  ret(c, x + 6, y + 50, 2, 16, 'rgba(4,6,10,0.8)')
  ret(c, x + 4, y + 47, 6, 3, `rgba(236,196,120,${pisca})`)
  // Caixilho
  const caixilho = tom([26, 32, 48], [52, 38, 38], k)
  ret(c, x + w / 2 - 1, y, 2, h, rgb(caixilho))
  ret(c, x, y + h / 2 - 1, w, 2, rgb(caixilho))
  // Cortinas, balançando de leve
  const sw = Math.sin(t * 0.8) * 1.2
  const cortina = tom([32, 38, 56], [70, 42, 44], k)
  ret(c, x - 12, y - 8, 14 + sw, h + 16, rgb(cortina))
  ret(c, x + w - 2 - sw, y - 8, 14 + sw, h + 16, rgb(cortina))
  for (const cx of [x - 8, x - 3, x + w + 3, x + w + 8]) {
    ret(c, cx, y - 8, 1, h + 16, rgb(clarear(cortina, -10)))
  }
  ret(c, x - 14, y - 10, w + 28, 3, rgb(clarear(moldura, -8)))   // varão
  ret(c, x - 16, y - 11, 3, 5, rgb(clarear(moldura, 10)))           // ponteiras
  ret(c, x + w + 13, y - 11, 3, 5, rgb(clarear(moldura, 10)))
  // Prendedores das cortinas, na altura do peitoril
  ret(c, x - 12, y + h - 10, 14, 2, rgb(clarear(cortina, 22)))
  ret(c, x + w - 2, y + h - 10, 14, 2, rgb(clarear(cortina, 22)))
  // O vaso de violeta no peitoril, virado para a rua
  violeta(c, x + 6, y + h + 2)
}

function drawRetratos(c: CanvasRenderingContext2D, k: number): void {
  const moldura: RGB = k > 0.5 ? [92, 70, 52] : [60, 58, 64]
  quadro(c, 214, 24, 30, 24, { figuras: 4, moldura })
  quadro(c, 252, 30, 22, 18, { figuras: 2, moldura })
  quadro(c, 222, 56, 26, 22, { figuras: 3, moldura })
}

function drawPiano(c: CanvasRenderingContext2D, e: EstadoSala): void {
  const k = e.k
  const madeira = tom(MADEIRA_FRIA, MADEIRA_QUENTE, k)
  const { x0, x1 } = PIANO
  const w = x1 - x0

  // Corpo
  ret(c, x0, 92, w, CHAO_Y - 92, rgb(madeira))
  ret(c, x0 - 3, 86, w + 6, 7, rgb(clarear(madeira, 10)))     // tampo
  ret(c, x0 - 3, 86, w + 6, 1, rgb(clarear(madeira, 24)))
  ret(c, x0 + 2, 94, 4, CHAO_Y - 96, rgb(clarear(madeira, -10)))  // pilastras
  ret(c, x1 - 6, 94, 4, CHAO_Y - 96, rgb(clarear(madeira, -10)))

  // Estante com a partitura aberta
  ret(c, x0 + 22, 96, w - 44, 16, rgb(clarear(madeira, -12)))
  ret(c, x0 + 26, 97, w - 52, 14, 'rgba(226,216,196,0.78)')
  c.fillStyle = 'rgba(40,32,30,0.55)'
  for (let i = 0; i < 4; i++) c.fillRect(x0 + 28, 99 + i * 3, w - 56, 1)
  // Notas na pauta
  for (let i = 0; i < 7; i++) {
    c.fillRect(x0 + 30 + i * 5, 99 + ((i * 2) % 7), 2, 2)
  }

  // Teclado: 19 teclas brancas, pretas por cima, e a nota da vez acesa.
  const ky = 116
  ret(c, x0 + 4, ky - 3, w - 8, 3, rgb(clarear(madeira, -16)))
  for (let i = 0; i < 19; i++) {
    const tx = x0 + 6 + i * 4
    ret(c, tx, ky, 3, 8, k > 0.5 ? '#e8e0cf' : '#b6b4bb')
  }
  const acesa = e.tecla ?? -1
  if (acesa >= 0) {
    const tx = x0 + 6 + (5 + acesa) * 4
    ret(c, tx, ky, 3, 8, `rgba(255,214,140,${0.45 + (e.brilhoTecla ?? 0) * 0.55})`)
  }
  const pretas = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14, 15, 17]
  for (const i of pretas) ret(c, x0 + 8 + i * 4, ky, 2, 5, '#141014')
  ret(c, x0 + 4, ky + 8, w - 8, 2, rgb(clarear(madeira, -18)))

  // Painéis de baixo e pedais
  ret(c, x0 + 10, 128, w / 2 - 14, 16, rgb(clarear(madeira, -6)))
  ret(c, x0 + w / 2 + 4, 128, w / 2 - 14, 16, rgb(clarear(madeira, -6)))
  ret(c, x0 + 10, 128, w / 2 - 14, 1, rgb(clarear(madeira, 8)))
  ret(c, x0 + w / 2 + 4, 128, w / 2 - 14, 1, rgb(clarear(madeira, 8)))
  for (const px of [x0 + w / 2 - 8, x0 + w / 2 - 1, x0 + w / 2 + 6]) {
    ret(c, px, CHAO_Y - 3, 3, 2, '#a88a4a')
  }

  // Veios da madeira e a placa com o nome do fabricante
  for (const vy of [96, 104, 132, 140]) {
    c.fillStyle = rgb(clarear(madeira, -4))
    c.fillRect(x0 + 6, vy, 6, 1)
    c.fillRect(x1 - 12, vy + 2, 6, 1)
  }
  ret(c, x0 + w / 2 - 6, 113, 12, 1, k > 0.5 ? '#c8a860' : '#7a7468')
  // Arandelas de latão na frente, com tocos de vela que ninguém acende
  for (const ax of [x0 + 7, x1 - 10]) {
    ret(c, ax, 100, 3, 2, '#a88a4a')
    ret(c, ax + 1, 96, 1, 4, '#a88a4a')
    ret(c, ax, 92, 3, 4, '#d8d0bc')
    ret(c, ax + 1, 91, 1, 1, '#2a2020')
  }

  // Em cima: metrônomo, um retrato pequeno e a luminária do piano.
  c.fillStyle = rgb(clarear(madeira, -20))
  for (let i = 0; i < 12; i++) c.fillRect(x0 + 10 + Math.floor(i / 3), 74 + i, 10 - Math.floor(i / 3) * 2, 1)
  const pend = Math.sin(e.t * 3) * 3
  ret(c, x0 + 14 + Math.round(pend * 0.4), 76, 1, 8, '#c8b27a')

  quadro(c, x0 + 32, 72, 14, 12, { figuras: 2, moldura: k > 0.5 ? [110, 86, 60] : [70, 68, 72] })
  // Vaso de flores secas e a pilha de partituras
  ret(c, x0 + 54, 78, 5, 8, k > 0.5 ? '#7a6a8a' : '#4a4a5e')
  ret(c, x0 + 54, 78, 5, 1, k > 0.5 ? '#9a8aaa' : '#5e5e72')
  for (const [dx, hh] of [[0, 9], [2, 12], [4, 8], [3, 10]] as const) {
    ret(c, x0 + 55 + dx * 0.5, 78 - hh, 1, hh, '#6a5a3a')
    ret(c, x0 + 54 + dx * 0.5, 77 - hh, 3, 2, k > 0.5 ? '#a86a4a' : '#6a5a5a')
  }
  for (let i = 0; i < 3; i++) ret(c, x0 + 62, 82 - i * 2, 14, 2, i % 2 ? '#d8cfbc' : '#c8bfac')

  const lx = LUZ_PIANO.x
  ret(c, lx - 1, 80, 3, 7, '#6a5438')
  ret(c, lx - 8, 70, 16, 8, k > 0.5 ? '#6e5a3c' : '#454b5c')
  ret(c, lx - 6, 77, 12, 2, `rgba(255,232,190,${0.35 + k * 0.6})`)
}

function drawBanco(c: CanvasRenderingContext2D, k: number): void {
  const madeira = tom(MADEIRA_FRIA, MADEIRA_QUENTE, k)
  ret(c, 126, BANCO_Y, 60, 5, rgb(clarear(madeira, 6)))
  ret(c, 126, BANCO_Y, 60, 1, rgb(clarear(madeira, 20)))
  ret(c, 129, BANCO_Y + 5, 3, CHAO_Y - BANCO_Y - 5, rgb(clarear(madeira, -10)))
  ret(c, 180, BANCO_Y + 5, 3, CHAO_Y - BANCO_Y - 5, rgb(clarear(madeira, -10)))
}

function drawSofa(c: CanvasRenderingContext2D, k: number): void {
  const x = 238
  const larg = 148
  const tecido = tom([34, 41, 58], [74, 50, 50], k)
  ret(c, x, 108, larg, 26, rgb(tecido))                       // encosto
  ret(c, x + 4, 111, larg / 2 - 6, 18, rgb(clarear(tecido, 6)))   // almofadas
  ret(c, x + larg / 2 + 2, 111, larg / 2 - 6, 18, rgb(clarear(tecido, 6)))
  ret(c, x, 132, larg, 18, rgb(clarear(tecido, -4)))          // assento
  ret(c, x, 132, larg, 2, rgb(clarear(tecido, 10)))
  ret(c, x + larg / 2, 134, 1, 14, 'rgba(0,0,0,0.25)')
  ret(c, x - 9, 118, 12, 32, rgb(clarear(tecido, 4)))         // braços
  ret(c, x + larg - 3, 118, 12, 32, rgb(clarear(tecido, 4)))
  ret(c, x - 9, 118, 12, 3, rgb(clarear(tecido, 16)))
  ret(c, x + larg - 3, 118, 12, 3, rgb(clarear(tecido, 16)))
  // Capitonê no encosto e costuras do assento
  for (let i = 0; i < 9; i++) {
    for (const yy of [114, 122]) ret(c, x + 10 + i * 16 + (yy === 122 ? 8 : 0), yy, 1, 1, rgb(clarear(tecido, -14)))
  }
  ret(c, x + 2, 140, larg - 4, 1, rgb(clarear(tecido, -12)))
  ret(c, x, 148, larg, 2, rgb(clarear(tecido, -16)))
  // Duas almofadas soltas, uma bordada
  const alm1 = k > 0.5 ? [150, 110, 70] as RGB : [80, 76, 92] as RGB
  ret(c, x + 8, 120, 16, 13, rgb(alm1))
  ret(c, x + 8, 120, 16, 1, rgb(clarear(alm1, 18)))
  for (let i = 0; i < 3; i++) ret(c, x + 11 + i * 4, 125, 2, 2, rgb(clarear(alm1, -22)))
  const alm2 = k > 0.5 ? [96, 70, 86] as RGB : [58, 62, 80] as RGB
  ret(c, x + 28, 122, 14, 11, rgb(alm2))
  ret(c, x + 28, 122, 14, 1, rgb(clarear(alm2, 16)))
  for (let i = 0; i < 7; i++) ret(c, x + 28 + i * 2, 133, 1, 2, rgb(clarear(alm2, 10)))
  // Um livro aberto, de bruços, no assento
  ret(c, x + 62, 129, 14, 3, k > 0.5 ? '#5a3a3a' : '#3a3a4a')
  ret(c, x + 62, 128, 14, 1, '#d8d0bc')
  ret(c, x + 69, 128, 1, 4, 'rgba(0,0,0,0.4)')

  // O cobertor dobrado no braço: é onde ela dorme, às vezes.
  const cob: RGB = k > 0.5 ? [120, 78, 64] : [70, 62, 84]
  ret(c, x + larg - 16, 112, 22, 10, rgb(cob))
  ret(c, x + larg - 12, 122, 14, 18, rgb(clarear(cob, -12)))
  for (let i = 0; i < 4; i++) ret(c, x + larg - 14 + i * 4, 113, 1, 8, rgb(clarear(cob, 14)))
  // Pés
  ret(c, x - 5, CHAO_Y, 4, 3, '#140f10')
  ret(c, x + larg + 3, CHAO_Y, 4, 3, '#140f10')
}

function drawTapete(c: CanvasRenderingContext2D, k: number): void {
  const x = 226
  const y = CHAO_Y + 3
  const w = 172
  const h = 46
  const base = tom([30, 34, 50], [70, 40, 42], k)
  ret(c, x, y, w, h, rgb(base))
  ret(c, x + 4, y + 3, w - 8, h - 6, rgb(clarear(base, 8)))
  ret(c, x + 10, y + 8, w - 20, h - 16, rgb(clarear(base, -4)))
  // Losangos do centro
  for (let i = 0; i < 6; i++) {
    const cx = x + 26 + i * 24
    const cy = y + h / 2
    c.fillStyle = rgb(clarear(base, 16))
    c.fillRect(cx, cy - 3, 1, 7)
    c.fillRect(cx - 3, cy, 7, 1)
  }
  for (let i = 0; i < w; i += 5) {
    ret(c, x + i, y - 2, 2, 2, rgb(clarear(base, 12)))
    ret(c, x + i, y + h, 2, 2, rgb(clarear(base, 12)))
  }
}

function drawAbajur(c: CanvasRenderingContext2D, k: number): void {
  const { x } = ABAJUR
  const metal = tom([40, 46, 62], [84, 66, 52], k)
  ret(c, x - 1, 76, 3, CHAO_Y - 76, rgb(metal))
  ret(c, x - 9, CHAO_Y - 3, 19, 4, rgb(metal))
  const cupula = tom([62, 70, 92], [140, 108, 76], k)
  for (let i = 0; i < 18; i++) {
    const meio = 8 + Math.round(i * 0.5)
    c.fillStyle = rgb(clarear(cupula, i < 3 ? 10 : 0))
    c.fillRect(x - meio, 58 + i, meio * 2, 1)
  }
  ret(c, x - 16, 75, 32, 2, `rgba(255,236,196,${0.35 + k * 0.4})`)
}

function drawEstante(c: CanvasRenderingContext2D, k: number): void {
  const x = 418
  const y = 90
  const w = 46
  const madeira = tom([30, 36, 52], [60, 42, 38], k)
  ret(c, x, y, w, CHAO_Y - y, rgb(madeira))
  const prateleiras = [y + 3, y + 22, y + 41]
  const cores = ['#5a4740', '#3f4a5e', '#6b5340', '#454f66', '#5d4348', '#4a5a4a', '#6a5a3c']
  for (const [n, py] of prateleiras.entries()) {
    ret(c, x + 2, py, w - 4, 17, rgb(clarear(madeira, -12)))
    let bx = x + 4
    let i = n * 3
    while (bx < x + w - 6) {
      const bw = 3 + (i % 3)
      const bh = 12 + ((i * 5) % 5)
      ret(c, bx, py + 17 - bh, bw, bh, cores[i % cores.length] ?? '#4a4a4a')
      bx += bw + 1
      i++
    }
  }
  // Em cima da estante: retratinho, um pássaro de cerâmica e uma caixa
  ret(c, x + 3, y - 10, 9, 10, rgb(clarear(madeira, 20)))
  ret(c, x + 4, y - 9, 7, 8, k > 0.5 ? '#8a7a6a' : '#4e5262')
  ret(c, x + 6, y - 6, 2, 4, 'rgba(20,16,16,0.6)')
  ret(c, x + 18, y - 5, 6, 5, '#c8c0b0')
  ret(c, x + 23, y - 7, 3, 3, '#c8c0b0')
  ret(c, x + 26, y - 6, 2, 1, '#c89a4a')
  ret(c, x + 30, y - 6, 12, 6, k > 0.5 ? '#6a4a3a' : '#3e3e4e')
  ret(c, x + 30, y - 6, 12, 1, k > 0.5 ? '#8a6a52' : '#55556a')
  ret(c, x, y - 1, w, 2, rgb(clarear(madeira, 14)))

  // O livro de receitas, deitado e saindo da prateleira: é o das contas.
  ret(c, x + 6, y + 58, 24, 5, '#8a6a3e')
  ret(c, x + 6, y + 58, 24, 1, '#b08a52')
  ret(c, x + 26, y + 57, 2, 7, 'rgba(226,216,196,0.7)')
}

function drawMesinha(c: CanvasRenderingContext2D, k: number): void {
  const x = 262
  const y = 176
  const madeira = tom([30, 37, 52], [66, 44, 40], k)
  ret(c, x, y, 96, 6, rgb(madeira))
  ret(c, x, y, 96, 2, rgb(clarear(madeira, 12)))
  ret(c, x + 6, y + 6, 4, 18, rgb(clarear(madeira, -12)))
  ret(c, x + 86, y + 6, 4, 18, rgb(clarear(madeira, -12)))
  // Duas canecas e um papel: alguém estava aqui antes.
  const louca = tom([74, 84, 108], [150, 120, 98], k)
  ret(c, x + 18, y - 7, 7, 7, rgb(louca))
  ret(c, x + 25, y - 5, 2, 3, rgb(louca))
  ret(c, x + 34, y - 6, 6, 6, rgb(louca))
  // Uma vela num pires e o controle remoto, alinhado com a borda
  ret(c, x + 80, y - 2, 8, 2, rgb(clarear(louca, -10)))
  ret(c, x + 83, y - 7, 2, 5, '#d8d0bc')
  ret(c, x + 83, y - 8, 1, 1, '#2a2020')
  ret(c, x + 6, y - 2, 9, 2, '#1e1e24')
  ret(c, x + 8, y - 2, 1, 1, '#8a2a2a')
  // O jornal de hoje, dobrado, com uma mancha de café na capa
  ret(c, x + 48, y - 3, 24, 3, 'rgba(206,202,190,0.75)')
  ret(c, x + 48, y - 3, 24, 1, 'rgba(236,232,220,0.8)')
  ret(c, x + 52, y - 2, 10, 1, 'rgba(40,40,50,0.5)')
  ret(c, x + 64, y - 2, 5, 1, 'rgba(120,80,40,0.5)')
}

/**
 * Luz. `foco` decide a fonte principal: no prólogo é a luminária do piano,
 * baixa e quente, fechando o mundo em volta dos dois; na exploração, o abajur
 * de pé ilumina a sala toda, mais fraco.
 */
export function drawLuzSala(
  c: CanvasRenderingContext2D, e: EstadoSala, foco: 'piano' | 'sala',
): void {
  const k = e.k
  const bruxo = 0.96 + Math.sin(e.t * 1.7) * 0.025 + Math.sin(e.t * 6.3) * 0.012
  const fonte = foco === 'piano' ? LUZ_PIANO : ABAJUR
  const raio = foco === 'piano' ? 190 : 300

  c.save()
  c.globalCompositeOperation = 'multiply'
  const esc = c.createRadialGradient(fonte.x, fonte.y + 30, 20, fonte.x, fonte.y + 30, raio)
  esc.addColorStop(0, '#ffffff')
  esc.addColorStop(0.42, mix([150, 158, 178], [206, 176, 152], k))
  esc.addColorStop(1, mix([48, 54, 70], [66, 48, 48], k))
  c.fillStyle = esc
  c.fillRect(0, 0, SALA_W, WORLD_H)
  c.restore()

  c.save()
  c.globalCompositeOperation = 'lighter'
  const g = c.createRadialGradient(fonte.x, fonte.y + 4, 2, fonte.x, fonte.y + 4, raio * 0.8)
  g.addColorStop(0, `rgba(255,224,176,${(0.12 + k * 0.3) * bruxo})`)
  g.addColorStop(0.35, `rgba(232,164,104,${(0.04 + k * 0.12) * bruxo})`)
  g.addColorStop(1, 'rgba(232,164,104,0)')
  c.fillStyle = g
  c.fillRect(0, 0, SALA_W, WORLD_H)
  c.restore()
}

/**
 * O poste da rua pisca três curtas, três longas, três curtas, e apaga um
 * pouco antes de recomeçar. Nenhum texto do jogo diz o que isso é.
 */
const SEQUENCIA_POSTE: [number, boolean][] = (() => {
  const seq: [number, boolean][] = []
  const ponto = 0.22
  const traco = 0.66
  for (const letra of ['...', '---', '...']) {
    for (const sinal of letra) {
      seq.push([sinal === '.' ? ponto : traco, true])
      seq.push([ponto, false])
    }
    seq.push([ponto * 2, false])
  }
  seq.push([2.4, false])
  return seq
})()
const CICLO_POSTE = SEQUENCIA_POSTE.reduce((a, [d]) => a + d, 0)

export function posteAceso(t: number): boolean {
  let r = ((t % CICLO_POSTE) + CICLO_POSTE) % CICLO_POSTE
  for (const [d, aceso] of SEQUENCIA_POSTE) {
    if (r < d) return aceso
    r -= d
  }
  return false
}
