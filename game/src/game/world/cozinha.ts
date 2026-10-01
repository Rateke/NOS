import { WORLD_W, WORLD_H } from '../../engine/constants'
import type { RGB } from './arte'
import { rgb, clarear, ret, sorteio, papelDeParede, cantos } from './arte'

/**
 * A cozinha da noite da fuga.
 *
 * Tudo que o roteiro põe nesta noite está aqui, no lugar em que Liam pode
 * examinar: as malas no chão, o casaco de Evelyn na cadeira com o bilhete da
 * tia no bolso, a panela no fogo com o pano apoiado na tampa, o rádio que
 * Adrian ligou, o telefone fora do gancho, a porta da frente trancada — e o
 * gancho vazio onde a chave devia estar. E cinco pratos na mesa.
 */

export const COZ_CHAO = 160
export const FOGAO = { x0: 184, x1: 218, cx: 201 }
export const PANELA = { x: 194, y: 110 }
export const LAMPADA = { x: 234, y: 40 }
export const ALCAPAO_X = 214

export interface EstadoCozinha {
  t: number
  tensao: number
  panoTirado: boolean
}

const PAREDE: RGB = [30, 34, 44]
const AZULEJO: RGB = [62, 70, 78]
const MADEIRA: RGB = [58, 44, 40]
const ESMALTE: RGB = [150, 156, 162]

export function drawCozinhaFundo(c: CanvasRenderingContext2D, e: EstadoCozinha): void {
  const t = e.t
  ret(c, 0, 0, WORLD_W, WORLD_H, '#07090e')
  papelDeParede(c, 0, WORLD_W, 0, 74, PAREDE, 2)
  ret(c, 0, 0, WORLD_W, 4, rgb(clarear(PAREDE, 10)))
  azulejos(c, 0, WORLD_W, 74, COZ_CHAO)
  piso(c)
  cantos(c, WORLD_W, COZ_CHAO, WORLD_H, PAREDE)

  janela(c, 22, 38, t)
  pia(c, 16, t)
  relogio(c, 104, 34, t)
  armariosAltos(c, 146, 182)
  armariosAltos(c, 222, 272)
  coifa(c)
  bancada(c, 146, FOGAO.x0)
  bancada(c, FOGAO.x1, 274)
  fogao(c, e)
  telefone(c, 262, t)
  geladeira(c, 284)
  radio(c, 288, 64, t, e.tensao)
  chaveiro(c, 322, 84)
  portaDaFrente(c, 353)
  malas(c)
  cadeiraComCasaco(c, 158)
  alcapao(c, t, e.tensao)
}

/** Mesa em primeiro plano, entre Liam e a câmera. Cinco pratos. */
export function drawCozinhaFrente(c: CanvasRenderingContext2D, pratosX: number): void {
  const y = 176
  const x0 = 116
  const x1 = 276
  // Tampo e toalha xadrez caindo na frente
  ret(c, x0, y, x1 - x0, 3, '#2a303e')
  for (let x = x0; x < x1; x += 6) {
    for (let yy = y + 2; yy < y + 12; yy += 5) {
      const escuro = ((x - x0) / 6 + (yy - y) / 5) % 2 < 1
      ret(c, x, yy, 6, 5, escuro ? '#6a2e30' : '#9a8e82')
    }
  }
  // Barra da toalha, com franja
  for (let x = x0; x < x1; x += 2) ret(c, x, y + 12, 1, 2, '#7a6a60')
  ret(c, x0 + 12, y + 14, 5, 26, '#141a26')
  ret(c, x1 - 17, y + 14, 5, 26, '#141a26')

  // Cinco pratos. Somos quatro.
  const posicoes = [134, 160, 186, 212, pratosX + 6]
  for (const [i, px] of posicoes.entries()) {
    ret(c, px - 6, y - 3, 13, 3, '#8a92a4')
    ret(c, px - 5, y - 3, 11, 1, '#b4bccc')
    ret(c, px - 3, y - 2, 7, 1, '#6a7286')
    ret(c, px - 8, y - 4, 1, 4, '#9aa2b4')
    ret(c, px + 8, y - 4, 1, 4, '#9aa2b4')
    if (i === 4) {
      // O quinto tem um copo virado para baixo: ninguém bebe nele.
      ret(c, px + 11, y - 7, 4, 6, '#6a7a92')
      ret(c, px + 11, y - 7, 4, 1, '#9aaac4')
    } else {
      ret(c, px + 10, y - 6, 3, 5, 'rgba(170,190,220,0.5)')
    }
  }
  // Travessa de comida no meio, esfriando
  ret(c, 176, y - 6, 26, 4, '#5a4a3e')
  ret(c, 178, y - 8, 22, 2, '#8a6a42')
  // Cesta de pão
  ret(c, 240, y - 6, 12, 5, '#6a4e32')
  ret(c, 242, y - 8, 8, 2, '#b08a52')
}

/**
 * Luz: a lâmpada pendurada sobre a mesa, que balança mais conforme a briga
 * cresce, e o luar frio pela janela. O resto da cozinha afunda no escuro.
 */
export function drawCozinhaLuz(c: CanvasRenderingContext2D, e: EstadoCozinha): void {
  const balanco = Math.sin(e.t * 1.3) * (1.5 + e.tensao * 6)
  const lx = LAMPADA.x + balanco
  c.save()
  c.globalCompositeOperation = 'multiply'
  const g = c.createRadialGradient(lx, LAMPADA.y + 50, 20, lx, LAMPADA.y + 50, 240)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.45, '#aab0c0')
  g.addColorStop(1, '#3c4254')
  c.fillStyle = g
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  c.restore()

  c.save()
  c.globalCompositeOperation = 'lighter'
  const q = c.createRadialGradient(lx, LAMPADA.y + 8, 2, lx, LAMPADA.y + 8, 130)
  q.addColorStop(0, 'rgba(255,220,170,0.22)')
  q.addColorStop(0.5, 'rgba(230,170,110,0.06)')
  q.addColorStop(1, 'rgba(230,170,110,0)')
  c.fillStyle = q
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  // Cone de luz da lâmpada até a mesa
  c.fillStyle = 'rgba(255,226,180,0.035)'
  c.beginPath()
  c.moveTo(lx - 6, LAMPADA.y + 6)
  c.lineTo(lx + 6, LAMPADA.y + 6)
  c.lineTo(lx + 70, 190)
  c.lineTo(lx - 70, 190)
  c.fill()
  // Luar pela janela, no chão
  c.fillStyle = 'rgba(150,176,230,0.05)'
  c.beginPath()
  c.moveTo(22, 90)
  c.lineTo(74, 90)
  c.lineTo(110, WORLD_H)
  c.lineTo(40, WORLD_H)
  c.fill()
  // A chama do fogão
  {
    const f = 0.12 + Math.sin(e.t * 17) * 0.03 + e.tensao * 0.05
    const h = c.createRadialGradient(PANELA.x, PANELA.y + 8, 0, PANELA.x, PANELA.y + 8, 26)
    h.addColorStop(0, `rgba(255,150,80,${f})`)
    h.addColorStop(1, 'rgba(255,150,80,0)')
    c.fillStyle = h
    c.fillRect(PANELA.x - 26, PANELA.y - 18, 52, 52)
  }
  // O alçapão vaza uma luz que não é de lâmpada nenhuma
  const a = 0.05 + e.tensao * 0.16 + Math.sin(e.t * 2.2) * 0.02
  const p = c.createRadialGradient(ALCAPAO_X, COZ_CHAO + 9, 0, ALCAPAO_X, COZ_CHAO + 9, 40)
  p.addColorStop(0, `rgba(190,160,240,${a})`)
  p.addColorStop(1, 'rgba(190,160,240,0)')
  c.fillStyle = p
  c.fillRect(ALCAPAO_X - 40, COZ_CHAO - 30, 80, 70)
  c.restore()

  // A lâmpada propriamente dita, por cima de tudo
  ret(c, Math.round(LAMPADA.x + balanco * 0.3), 0, 1, LAMPADA.y - 6, '#1a1c24')
  const bx = Math.round(lx)
  for (let i = 0; i < 7; i++) {
    const meia = 3 + Math.round(i * 0.9)
    ret(c, bx - meia, LAMPADA.y - 6 + i, meia * 2 + 1, 1, i < 2 ? '#3a3e4c' : '#2e323e')
  }
  ret(c, bx - 3, LAMPADA.y + 1, 7, 1, 'rgba(255,236,196,0.95)')
}

// --- Peças -------------------------------------------------------------------

function azulejos(c: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number): void {
  ret(c, x0, y0, x1 - x0, y1 - y0, rgb(AZULEJO))
  const r = sorteio(41)
  for (let y = y0; y < y1; y += 8) {
    for (let x = x0; x < x1; x += 8) {
      const tom = Math.floor(r() * 7) - 3
      ret(c, x + 1, y + 1, 7, 7, rgb(clarear(AZULEJO, tom)))
      ret(c, x + 1, y + 1, 7, 1, rgb(clarear(AZULEJO, tom + 7)))
    }
  }
  // Rejunte
  for (let y = y0; y < y1; y += 8) ret(c, x0, y, x1 - x0, 1, rgb(clarear(AZULEJO, -18)))
  for (let x = x0; x < x1; x += 8) ret(c, x, y0, 1, y1 - y0, rgb(clarear(AZULEJO, -18)))
  // Faixa de azulejo decorado, azul
  const fy = y0 + 24
  for (let x = x0; x < x1; x += 8) {
    ret(c, x + 1, fy + 1, 7, 7, '#3a4a6e')
    ret(c, x + 4, fy + 2, 1, 5, '#8a9ac0')
    ret(c, x + 2, fy + 4, 5, 1, '#8a9ac0')
    ret(c, x + 4, fy + 4, 1, 1, '#c4ccdc')
  }
  // Uma rachadura
  ret(c, 96, y0 + 6, 1, 4, 'rgba(0,0,0,0.4)')
  ret(c, 97, y0 + 9, 1, 5, 'rgba(0,0,0,0.4)')
}

/** Piso de linóleo xadrez, gasto no caminho entre o fogão e a mesa. */
function piso(c: CanvasRenderingContext2D): void {
  const y0 = COZ_CHAO
  let linha = 0
  for (let y = y0; y < WORLD_H; y += 7) {
    const larg = 10 + linha * 1.4
    const desl = (linha % 2) * larg * 0.5
    for (let x = -larg + desl; x < WORLD_W; x += larg) {
      const par = Math.floor((x - desl) / larg + linha) % 2 === 0
      ret(c, x, y, larg, 7, par ? '#2e3240' : '#1c1f2a')
    }
    linha++
  }
  ret(c, 0, y0, WORLD_W, 2, 'rgba(0,0,0,0.4)')
  // Gasto: o caminho entre o fogão e a mesa
  c.fillStyle = 'rgba(120,120,130,0.05)'
  c.fillRect(170, y0 + 2, 70, 40)
}

function janela(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const w = 52
  const h = 50
  ret(c, x - 4, y - 4, w + 8, h + 8, '#262a36')
  const g = c.createLinearGradient(0, y, 0, y + h)
  g.addColorStop(0, '#0c1426')
  g.addColorStop(1, '#1a2640')
  c.fillStyle = g
  c.fillRect(x, y, w, h)
  // Casas do outro lado da rua, uma janela acesa
  ret(c, x, y + 32, 20, 18, '#070a12')
  ret(c, x + 26, y + 28, 26, 22, '#080b14')
  ret(c, x + 32, y + 34, 3, 4, 'rgba(236,200,130,0.7)')
  // Chuva escorrendo no vidro
  const r = sorteio(9)
  for (let i = 0; i < 14; i++) {
    const cx = x + Math.floor(r() * w)
    const vel = 10 + r() * 16
    const cy = y + ((t * vel + r() * h) % h)
    ret(c, cx, cy, 1, 3, 'rgba(170,190,230,0.35)')
  }
  for (let i = 0; i < 8; i++) {
    const cx = x + Math.floor(r() * w)
    const cy = y + Math.floor(r() * h)
    ret(c, cx, cy, 1, 1, 'rgba(200,215,240,0.4)')
  }
  // Caixilho em cruz
  ret(c, x + w / 2 - 1, y, 2, h, '#262a36')
  ret(c, x, y + h / 2 - 1, w, 2, '#262a36')
  // Cortina de café, curta
  for (let i = 0; i < 8; i++) {
    ret(c, x + i * 7 - 3, y - 6, 6, 10 + (i % 2), i % 2 ? '#6a5a48' : '#7a6a56')
  }
  ret(c, x - 6, y - 7, w + 12, 2, '#3a3a44')
  // Vasinho no peitoril
  ret(c, x + 38, y + h + 1, 6, 4, '#7a4a36')
  ret(c, x + 39, y + h - 4, 1, 5, '#3a5a3a')
  ret(c, x + 41, y + h - 6, 1, 7, '#3a5a3a')
  ret(c, x + 42, y + h - 3, 2, 1, '#4a6a44')
}

function pia(c: CanvasRenderingContext2D, x: number, t: number): void {
  const w = 64
  const topo = COZ_CHAO - 36
  ret(c, x, topo, w, 4, '#5a6270')
  ret(c, x, topo, w, 1, '#7a8290')
  ret(c, x + 2, topo + 4, w - 4, 32, rgb(MADEIRA))
  // Portas do gabinete
  ret(c, x + 5, topo + 8, 26, 24, rgb(clarear(MADEIRA, -6)))
  ret(c, x + 33, topo + 8, 26, 24, rgb(clarear(MADEIRA, -6)))
  ret(c, x + 28, topo + 18, 1, 4, '#b8964e')
  ret(c, x + 36, topo + 18, 1, 4, '#b8964e')
  // Cuba e torneira pingando
  ret(c, x + 18, topo - 1, 26, 2, '#3a4250')
  ret(c, x + 30, topo - 12, 2, 11, '#8a92a2')
  ret(c, x + 30, topo - 12, 7, 2, '#8a92a2')
  const gota = (t * 1.4) % 1
  if (gota < 0.7) ret(c, x + 35, topo - 10 + Math.round(gota * 12), 1, 1, 'rgba(180,200,240,0.8)')
  // Louça empilhada ao lado, e um pano de prato
  ret(c, x + 48, topo - 5, 10, 5, '#8a92a4')
  ret(c, x + 49, topo - 7, 8, 2, '#a4acbe')
  ret(c, x + 4, topo - 3, 9, 3, '#5a6a8a')
}

function relogio(c: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  // Dez e quarenta e poucos. A tia chega às 23h.
  ret(c, x - 7, y - 7, 15, 15, '#3a3230')
  c.fillStyle = '#c8c2b0'
  c.beginPath()
  c.arc(x + 0.5, y + 0.5, 6, 0, Math.PI * 2)
  c.fill()
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ret(c, x + Math.round(Math.sin(a) * 5), y - Math.round(Math.cos(a) * 5), 1, 1, '#4a4440')
  }
  const minuto = 42 + t / 20
  const angM = (minuto / 60) * Math.PI * 2
  const angH = ((22 + minuto / 60) / 12) * Math.PI * 2
  for (let i = 0; i <= 5; i++) ret(c, x + Math.round(Math.sin(angM) * i), y - Math.round(Math.cos(angM) * i), 1, 1, '#1a1614')
  for (let i = 0; i <= 3; i++) ret(c, x + Math.round(Math.sin(angH) * i), y - Math.round(Math.cos(angH) * i), 1, 1, '#1a1614')
  ret(c, x, y, 1, 1, '#a83a30')
}

function armariosAltos(c: CanvasRenderingContext2D, x0: number, x1: number): void {
  const y = 40
  const h = 32
  ret(c, x0, y, x1 - x0, h, rgb(MADEIRA))
  ret(c, x0 - 1, y - 2, x1 - x0 + 2, 2, rgb(clarear(MADEIRA, 14)))
  const portas = Math.max(1, Math.round((x1 - x0) / 18))
  const lp = (x1 - x0) / portas
  for (let i = 0; i < portas; i++) {
    const px = x0 + i * lp
    ret(c, px + 2, y + 3, lp - 4, h - 6, rgb(clarear(MADEIRA, -7)))
    ret(c, px + 2, y + 3, lp - 4, 1, rgb(clarear(MADEIRA, 8)))
    ret(c, i % 2 ? px + 3 : px + lp - 4, y + h - 9, 1, 4, '#b8964e')
  }
  ret(c, x0, y + h, x1 - x0, 2, 'rgba(0,0,0,0.4)')
}

function coifa(c: CanvasRenderingContext2D): void {
  const { x0, x1 } = FOGAO
  ret(c, x0 + 6, 30, x1 - x0 - 12, 26, '#3e4450')
  c.fillStyle = '#4a505e'
  c.beginPath()
  c.moveTo(x0 - 2, 70)
  c.lineTo(x1 + 2, 70)
  c.lineTo(x1 - 6, 56)
  c.lineTo(x0 + 6, 56)
  c.fill()
  ret(c, x0 - 2, 70, x1 - x0 + 4, 2, '#2a2e38')
  ret(c, x0 + 8, 71, x1 - x0 - 16, 1, 'rgba(255,220,170,0.6)')
}

function bancada(c: CanvasRenderingContext2D, x0: number, x1: number): void {
  const topo = COZ_CHAO - 38
  ret(c, x0, topo, x1 - x0, 4, '#4e5462')
  ret(c, x0, topo, x1 - x0, 1, '#6e7482')
  ret(c, x0 + 1, topo + 4, x1 - x0 - 2, 34, rgb(MADEIRA))
  // Gavetas em cima, portas embaixo
  const n = Math.max(1, Math.round((x1 - x0) / 18))
  const l = (x1 - x0 - 2) / n
  for (let i = 0; i < n; i++) {
    const px = x0 + 1 + i * l
    ret(c, px + 2, topo + 7, l - 4, 6, rgb(clarear(MADEIRA, -6)))
    ret(c, px + l / 2 - 2, topo + 9, 4, 1, '#b8964e')
    ret(c, px + 2, topo + 16, l - 4, 18, rgb(clarear(MADEIRA, -6)))
    ret(c, px + l / 2 - 1, topo + 20, 1, 4, '#b8964e')
  }
  ret(c, x0, COZ_CHAO - 3, x1 - x0, 3, rgb(clarear(MADEIRA, -16)))
}

/**
 * O fogão: quatro bocas, forno com vidro, botões. Na boca da frente, a panela
 * com o pano apoiado na tampa — o pano que, no roteiro, vai pegar fogo.
 */
function fogao(c: CanvasRenderingContext2D, e: EstadoCozinha): void {
  const { x0, x1 } = FOGAO
  const w = x1 - x0
  const topo = COZ_CHAO - 40
  const esm = rgb(clarear(ESMALTE, -40))
  // Espelho traseiro com os botões
  ret(c, x0, topo - 8, w, 8, rgb(clarear(ESMALTE, -52)))
  ret(c, x0, topo - 8, w, 1, rgb(clarear(ESMALTE, -30)))
  for (let i = 0; i < 4; i++) {
    const bx = x0 + 5 + i * 8
    ret(c, bx, topo - 6, 4, 4, '#1c1e24')
    ret(c, bx + 1, topo - 6, 1, 2, '#9aa0aa')
  }
  // Tampo com as grelhas
  ret(c, x0, topo, w, 5, '#1a1c22')
  ret(c, x0, topo, w, 1, '#4a4e58')
  for (const bx of [x0 + 9, x0 + 25]) {
    ret(c, bx - 6, topo - 1, 12, 1, '#2e3038')
    ret(c, bx - 1, topo - 2, 2, 2, '#2e3038')
  }
  // Corpo e forno
  ret(c, x0, topo + 5, w, 35, esm)
  ret(c, x0 + 3, topo + 10, w - 6, 22, rgb(clarear(ESMALTE, -62)))
  ret(c, x0 + 6, topo + 13, w - 12, 12, '#0c0e14')
  // Luz do forno aceso: tem assado lá dentro
  ret(c, x0 + 7, topo + 21, w - 14, 3, `rgba(230,120,60,${0.35 + Math.sin(e.t * 3) * 0.08})`)
  ret(c, x0 + 7, topo + 14, 5, 1, 'rgba(255,255,255,0.18)')
  ret(c, x0 + 4, topo + 8, w - 8, 1, '#c4c8d0')
  ret(c, x0 + 1, topo + 34, w - 2, 4, rgb(clarear(ESMALTE, -56)))
  ret(c, x0, COZ_CHAO - 2, w, 2, '#101218')

  // Frigideira na boca de trás
  ret(c, x0 + 20, topo - 3, 12, 3, '#26282e')
  ret(c, x0 + 32, topo - 2, 6, 1, '#3a2a22')

  // A panela na boca da frente, com a chama azul por baixo
  const px = PANELA.x
  const py = PANELA.y
  const chama = Math.sin(e.t * 19) > 0 ? 1 : 0
  ret(c, px - 6, py + 9, 12, 1, 'rgba(90,140,255,0.8)')
  ret(c, px - 5 + chama, py + 8, 3, 1, 'rgba(120,170,255,0.7)')
  ret(c, px + 2 - chama, py + 8, 3, 1, 'rgba(120,170,255,0.7)')
  ret(c, px - 8, py, 16, 8, '#4a505e')
  ret(c, px - 8, py, 16, 1, '#6a7080')
  ret(c, px - 10, py + 2, 2, 2, '#2a2e38')
  ret(c, px + 8, py + 2, 2, 2, '#2a2e38')
  ret(c, px - 9, py - 2, 18, 2, '#5a6070')
  ret(c, px - 1, py - 4, 3, 2, '#2a2e38')
  if (!e.panoTirado) {
    // O pano de prato xadrez, caído sobre a tampa e pendendo pela borda.
    for (let i = 0; i < 5; i++) ret(c, px + i * 2, py - 3, 2, 2, i % 2 ? '#c8c0b4' : '#a83a34')
    ret(c, px + 8, py - 1, 3, 6, '#a83a34')
    ret(c, px + 8, py + 1, 3, 1, '#c8c0b4')
    ret(c, px + 8, py + 4, 3, 1, '#c8c0b4')
  } else {
    // Dobrado no balcão, longe do fogo.
    ret(c, x1 + 4, topo - 2, 8, 2, '#a83a34')
    ret(c, x1 + 4, topo - 2, 8, 1, '#c8c0b4')
  }
}

/** O rádio em cima da geladeira, tocando música alegre sozinho. */
function radio(c: CanvasRenderingContext2D, x: number, topo: number, t: number, tensao: number): void {
  ret(c, x, topo - 12, 20, 12, '#5a3e2e')
  ret(c, x, topo - 12, 20, 1, '#7a5a42')
  // Alto-falante com a grade
  ret(c, x + 2, topo - 10, 9, 8, '#2a2220')
  for (let i = 0; i < 4; i++) ret(c, x + 3, topo - 9 + i * 2, 7, 1, '#4a3a30')
  // Mostrador aceso
  const a = 0.5 + Math.sin(t * 7) * 0.15
  ret(c, x + 12, topo - 10, 6, 3, `rgba(236,190,110,${a})`)
  ret(c, x + 14 + Math.round(Math.sin(t * 0.3) * 1.5), topo - 10, 1, 3, '#3a2a1a')
  ret(c, x + 13, topo - 5, 2, 2, '#8a7a5a')
  ret(c, x + 16, topo - 5, 2, 2, '#8a7a5a')
  // Antena
  ret(c, x + 17, topo - 26, 1, 14, '#9aa0aa')
  // Chiado: notinhas saindo, mais tortas quando a briga sobe
  const k = (t * 0.8) % 1
  const tort = Math.round(Math.sin(t * 13) * tensao * 3)
  ret(c, x + 6 + Math.round(k * 4) + tort, topo - 16 - Math.round(k * 10), 1, 2, `rgba(236,210,160,${0.5 * (1 - k)})`)
  ret(c, x + 7 + Math.round(k * 4) + tort, topo - 16 - Math.round(k * 10), 1, 1, `rgba(236,210,160,${0.5 * (1 - k)})`)
}

/** Telefone de parede, com o fone pendurado pelo fio, balançando. */
function telefone(c: CanvasRenderingContext2D, x: number, t: number): void {
  ret(c, x - 4, 78, 9, 16, '#b8b0a0')
  ret(c, x - 4, 78, 9, 1, '#d4ccbc')
  ret(c, x - 2, 82, 5, 6, '#8a8272')
  for (let i = 0; i < 3; i++) ret(c, x - 2 + i * 2, 89, 1, 1, '#4a4438')
  // O gancho vazio
  ret(c, x - 5, 80, 1, 5, '#6a6254')
  // O fio enrolado descendo até o fone
  const osc = Math.sin(t * 1.6) * 3
  const fx = Math.round(x + 2 + osc)
  for (let i = 0; i < 12; i++) {
    const yy = 94 + i * 2.6
    const xx = x + (fx - x) * (i / 12) + (i % 2 ? 1 : -1)
    ret(c, Math.round(xx), Math.round(yy), 1, 2, '#6a6254')
  }
  ret(c, fx - 3, 124, 7, 3, '#b8b0a0')
  ret(c, fx - 4, 122, 2, 4, '#b8b0a0')
  ret(c, fx + 3, 122, 2, 4, '#b8b0a0')
}

function geladeira(c: CanvasRenderingContext2D, x: number): void {
  const w = 28
  const topo = 64
  ret(c, x, topo, w, COZ_CHAO - topo, '#8a909c')
  ret(c, x, topo, w, 2, '#aab0bc')
  ret(c, x + w - 3, topo, 3, COZ_CHAO - topo, '#6a707c')
  ret(c, x, topo + 30, w - 3, 1, '#4a505c')
  ret(c, x + 2, topo + 12, 1, 12, '#5a606c')
  ret(c, x + 2, topo + 36, 1, 16, '#5a606c')
  // Ímãs, uma conta, e o desenho de criança: MAMÃE E EU.
  ret(c, x + 6, topo + 6, 10, 12, '#d8d0bc')
  ret(c, x + 8, topo + 12, 2, 5, 'rgba(160,60,60,0.8)')
  ret(c, x + 8, topo + 10, 2, 2, 'rgba(160,60,60,0.8)')
  ret(c, x + 12, topo + 13, 2, 4, 'rgba(60,90,160,0.8)')
  ret(c, x + 12, topo + 11, 2, 2, 'rgba(60,90,160,0.8)')
  ret(c, x + 7, topo + 7, 8, 1, 'rgba(60,60,60,0.6)')
  ret(c, x + 10, topo + 5, 3, 2, '#c24a3a')
  ret(c, x + 16, topo + 40, 8, 10, '#e4e0d4')
  for (let i = 0; i < 4; i++) ret(c, x + 17, topo + 42 + i * 2, 6, 1, 'rgba(60,60,80,0.5)')
  ret(c, x + 19, topo + 38, 2, 2, '#3a8a4a')
  // Calendário com um dia circulado
  ret(c, x + 6, topo + 40, 8, 9, '#c8c0ac')
  ret(c, x + 6, topo + 40, 8, 2, '#a83a34')
  ret(c, x + 10, topo + 45, 3, 2, 'rgba(200,40,40,0.9)')
}

/** Chaveiro de parede. Três ganchos, duas chaves. A da porta não está. */
function chaveiro(c: CanvasRenderingContext2D, x: number, y: number): void {
  ret(c, x, y, 12, 4, '#5a4a3a')
  for (let i = 0; i < 3; i++) ret(c, x + 2 + i * 4, y + 4, 1, 2, '#9aa0aa')
  ret(c, x + 1, y + 6, 3, 4, '#c4a45e')
  ret(c, x + 9, y + 6, 3, 4, '#a8a8b8')
}

function portaDaFrente(c: CanvasRenderingContext2D, cx: number): void {
  const w = 34
  const x = cx - w / 2
  const topo = 56
  ret(c, x - 4, topo - 4, w + 8, COZ_CHAO - topo + 4, '#1a1c24')
  ret(c, x, topo, w, COZ_CHAO - topo, '#2e2830')
  ret(c, x + 4, topo + 6, w - 8, 36, '#282228')
  ret(c, x + 4, topo + 48, w - 8, 44, '#282228')
  ret(c, x + 4, topo + 6, w - 8, 1, '#3e363e')
  // Olho mágico, trinco, corrente passada
  ret(c, cx - 1, topo + 24, 2, 2, '#b8964e')
  ret(c, x + 4, topo + 54, 4, 6, '#b8964e')
  ret(c, x + 5, topo + 57, 2, 1, '#2a2020')
  ret(c, x + 24, topo + 44, 6, 3, '#9aa0aa')
  for (let i = 0; i < 5; i++) ret(c, x + 22 - i * 3, topo + 46 + i % 2, 2, 1, '#9aa0aa')
  // Capacho
  ret(c, x - 2, COZ_CHAO + 2, w + 4, 4, '#3a2e24')
  // Fresta fria por baixo: é noite lá fora, e chove.
  ret(c, x, COZ_CHAO - 2, w, 2, 'rgba(150,176,230,0.25)')
}

/** As malas: uma em pé, alça puxada; outra deitada; documentos saindo. */
function malas(c: CanvasRenderingContext2D): void {
  const y = COZ_CHAO
  // Mala grande, em pé
  ret(c, 102, y - 24, 16, 24, '#3a4a5e')
  ret(c, 102, y - 24, 16, 1, '#5a6a80')
  for (let i = 0; i < 3; i++) ret(c, 104 + i * 5, y - 22, 1, 20, '#2e3c4e')
  ret(c, 108, y - 31, 1, 7, '#8a92a2')
  ret(c, 113, y - 31, 1, 7, '#8a92a2')
  ret(c, 108, y - 32, 6, 1, '#8a92a2')
  ret(c, 103, y, 2, 1, '#111')
  ret(c, 115, y, 2, 1, '#111')
  // Etiqueta
  ret(c, 118, y - 18, 3, 4, '#d8d0bc')
  // Mala menor, deitada, com o zíper meio aberto
  ret(c, 119, y - 9, 18, 9, '#5a3e3a')
  ret(c, 119, y - 9, 18, 1, '#7a5a52')
  ret(c, 122, y - 8, 10, 1, '#c4a45e')
  ret(c, 132, y - 10, 5, 2, '#e4e0d4')
  ret(c, 134, y - 11, 2, 2, '#e8c0c0')
}

/** A cadeira com o casaco de Evelyn. No bolso, o bilhete da tia. */
function cadeiraComCasaco(c: CanvasRenderingContext2D, x: number): void {
  const y = COZ_CHAO
  const m = '#3a2e2c'
  ret(c, x - 7, y - 36, 2, 36, m)
  ret(c, x + 5, y - 36, 2, 36, m)
  ret(c, x - 7, y - 36, 14, 2, '#4a3c38')
  ret(c, x - 7, y - 28, 14, 1, '#4a3c38')
  ret(c, x - 8, y - 16, 18, 3, '#4a3c38')
  ret(c, x + 8, y - 13, 2, 13, m)
  // Casaco caído no encosto
  ret(c, x - 8, y - 35, 16, 5, '#5a4652')
  ret(c, x - 8, y - 30, 5, 16, '#4e3c48')
  ret(c, x + 3, y - 30, 5, 12, '#4e3c48')
  ret(c, x - 7, y - 24, 3, 3, '#3e2e38')
  // O bilhete dobrado saindo do bolso
  ret(c, x - 6, y - 26, 3, 3, '#e4dcc8')
}

/** O alçapão do porão: tábuas, argola, e luz vazando pelas frestas. */
function alcapao(c: CanvasRenderingContext2D, t: number, tensao: number): void {
  const x = ALCAPAO_X
  const y = COZ_CHAO + 4
  ret(c, x - 15, y, 30, 11, '#1a1c26')
  for (let i = 0; i < 4; i++) ret(c, x - 14 + i * 7, y + 1, 6, 9, '#262a36')
  const a = 0.25 + tensao * 0.5 + Math.sin(t * 2.2) * 0.08
  for (let i = 1; i < 4; i++) ret(c, x - 15 + i * 7, y + 1, 1, 9, `rgba(200,170,250,${a})`)
  ret(c, x - 15, y + 10, 30, 1, `rgba(200,170,250,${a * 0.6})`)
  c.strokeStyle = '#8a8472'
  c.lineWidth = 1
  c.beginPath()
  c.arc(x + 0.5, y + 5.5, 2, 0, Math.PI * 2)
  c.stroke()
}
