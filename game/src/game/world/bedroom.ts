import { PAL, WORLD_W, WORLD_H } from '../../engine/constants'
import type { Interactable, Rect } from './types'

/** Chão caminhável. As paredes ficam fora disso. */
export const FLOOR: Rect = { x: 36, y: 44, w: 312, h: 152 }

export const LAMP = { x: 238, y: 54 }

const BED: Rect = { x: 52, y: 60, w: 44, h: 76 }
const WARDROBE: Rect = { x: 52, y: 150, w: 40, h: 38 }
const DESK: Rect = { x: 180, y: 52, w: 72, h: 26 }
const CHAIR: Rect = { x: 158, y: 74, w: 20, h: 20 }
const RUG: Rect = { x: 136, y: 104, w: 104, h: 54 }

export const SOLIDS: Rect[] = [BED, WARDROBE, DESK, CHAIR]

export const INTERACTABLES: Interactable[] = [
  { id: 'diario', rect: { x: 186, y: 50, w: 18, h: 14 }, label: 'Ler' },
  { id: 'janela', rect: { x: 96, y: 24, w: 56, h: 20 }, label: 'Olhar' },
  { id: 'planta', rect: { x: 250, y: 16, w: 50, h: 26 }, label: 'Olhar' },
  { id: 'cama', rect: BED, label: 'Examinar', solid: true },
  { id: 'armario', rect: WARDROBE, label: 'Examinar', solid: true },
  { id: 'luminaria', rect: { x: 230, y: 42, w: 16, h: 14 }, label: 'Examinar' },

  { id: 'roupa1', rect: { x: 116, y: 146, w: 16, h: 10 }, label: 'Guardar', chore: true, consumable: true },
  { id: 'roupa2', rect: { x: 192, y: 170, w: 18, h: 10 }, label: 'Guardar', chore: true, consumable: true },
  { id: 'desenho1', rect: { x: 146, y: 118, w: 14, h: 12 }, label: 'Recolher', chore: true, consumable: true },
  { id: 'desenho2', rect: { x: 264, y: 150, w: 14, h: 12 }, label: 'Recolher', chore: true, consumable: true },

  {
    id: 'botao', rect: { x: 96, y: 178, w: 8, h: 8 }, label: 'Pegar', chore: true, consumable: true,
    keepsake: { name: 'Botão', note: 'Não é de nenhuma roupa dele.' },
  },
  {
    id: 'passagem', rect: { x: 292, y: 112, w: 12, h: 9 }, label: 'Pegar', chore: true, consumable: true,
    keepsake: { name: 'Passagem vencida', note: 'Iam a algum lugar.' },
  },
  {
    id: 'pedra', rect: { x: 166, y: 178, w: 9, h: 8 }, label: 'Pegar', chore: true, consumable: true,
    keepsake: { name: 'Pedra pintada', note: 'Lembra das mãos, não do rosto.' },
  },
  {
    id: 'chave', rect: { x: 300, y: 172, w: 10, h: 8 }, label: 'Pegar', chore: true, consumable: true,
    keepsake: { name: 'Chave sem porta', note: 'Já testou todas as portas.' },
  },
  {
    id: 'papel', rect: { x: 122, y: 84, w: 10, h: 9 }, label: 'Pegar', chore: true, consumable: true,
    keepsake: { name: 'Papel dobrado', note: 'Dobrado demais para abrir sem rasgar.' },
  },

  { id: 'porta', rect: { x: 334, y: 104, w: 16, h: 40 }, label: 'Sair' },
]

function fill(c: CanvasRenderingContext2D, r: Rect, color: string): void {
  c.fillStyle = color
  c.fillRect(r.x, r.y, r.w, r.h)
}

/**
 * Objeto do cenário que participa da ordenação por profundidade: quem tem
 * `baseY` menor é desenhado antes, então Liam passa atrás da escrivaninha e
 * na frente da cama conforme anda.
 */
export interface Prop {
  baseY: number
  draw(c: CanvasRenderingContext2D): void
}

/** Fundo: paredes, chão, janela, papéis pregados, porta e tapete. */
export function drawBackground(c: CanvasRenderingContext2D, doorOpen: boolean): void {
  fill(c, { x: 0, y: 0, w: WORLD_W, h: WORLD_H }, PAL.wallDark)
  fill(c, { x: 0, y: 0, w: WORLD_W, h: FLOOR.y }, PAL.wall)

  fill(c, FLOOR, PAL.floor)
  c.fillStyle = 'rgba(0,0,0,0.13)'
  for (let y = FLOOR.y + 11; y < FLOOR.y + FLOOR.h; y += 12) {
    c.fillRect(FLOOR.x, y, FLOOR.w, 1)
  }
  c.fillStyle = 'rgba(0,0,0,0.10)'
  for (let x = FLOOR.x + 52; x < FLOOR.x + FLOOR.w; x += 104) {
    c.fillRect(x, FLOOR.y, 1, FLOOR.h)
  }

  fill(c, { x: 0, y: FLOOR.y - 3, w: WORLD_W, h: 3 }, PAL.wallLit)
  fill(c, { x: 0, y: FLOOR.y, w: WORLD_W, h: 2 }, 'rgba(0,0,0,0.30)')

  fill(c, { x: 0, y: FLOOR.y, w: FLOOR.x, h: WORLD_H - FLOOR.y }, PAL.wallDark)
  fill(c, { x: FLOOR.x + FLOOR.w, y: FLOOR.y, w: WORLD_W - FLOOR.x - FLOOR.w, h: WORLD_H - FLOOR.y }, PAL.wallDark)
  fill(c, { x: 0, y: FLOOR.y + FLOOR.h, w: WORLD_W, h: WORLD_H - FLOOR.y - FLOOR.h }, PAL.void)

  drawWindow(c)
  drawPinnedPlans(c)
  drawDoor(c, doorOpen)
  drawRug(c)
}

function drawWindow(c: CanvasRenderingContext2D): void {
  const r: Rect = { x: 96, y: 6, w: 56, h: 28 }
  fill(c, { x: r.x - 3, y: r.y - 3, w: r.w + 6, h: r.h + 6 }, PAL.wallLit)

  const g = c.createLinearGradient(0, r.y, 0, r.y + r.h)
  g.addColorStop(0, PAL.windowPale)
  g.addColorStop(1, PAL.windowCold)
  c.fillStyle = g
  c.fillRect(r.x, r.y, r.w, r.h)

  // Lá fora: uma única silhueta, e ela nunca se move.
  c.fillStyle = 'rgba(11,14,22,0.30)'
  c.fillRect(r.x + 40, r.y + 22, 14, 6)   // linha do horizonte
  c.fillStyle = 'rgba(11,14,22,0.38)'
  c.fillRect(r.x + 12, r.y + 17, 3, 11)   // tronco
  c.fillRect(r.x + 6, r.y + 9, 15, 9)     // copa
  c.fillRect(r.x + 9, r.y + 6, 9, 4)

  c.fillStyle = 'rgba(11,14,22,0.75)'
  c.fillRect(r.x + r.w / 2 - 1, r.y, 2, r.h)
  c.fillRect(r.x, r.y + r.h / 2 - 1, r.w, 2)
}

/**
 * A parede do fundo é coberta de plantas de casas desenhadas por Liam. A da
 * direita é a única examinável: é a que tem um cômodo a mais.
 */
function drawPinnedPlans(c: CanvasRenderingContext2D): void {
  const small = [
    { x: 168, y: 10, w: 20, h: 15 },
    { x: 196, y: 16, w: 16, h: 13 },
    { x: 64, y: 12, w: 18, h: 14 },
    { x: 310, y: 8, w: 15, h: 12 },
    { x: 40, y: 24, w: 14, h: 11 },
  ]
  for (const s of small) {
    c.fillStyle = 'rgba(207,198,180,0.16)'
    c.fillRect(s.x, s.y, s.w, s.h)
    c.fillStyle = 'rgba(11,14,22,0.30)'
    c.fillRect(s.x + 3, s.y + 3, s.w - 7, 1)
    c.fillRect(s.x + 3, s.y + 3, 1, s.h - 7)
    c.fillRect(s.x + 3, s.y + s.h - 4, s.w - 7, 1)
  }

  const r: Rect = { x: 250, y: 16, w: 50, h: 26 }
  c.fillStyle = 'rgba(207,198,180,0.30)'
  c.fillRect(r.x, r.y, r.w, r.h)
  c.fillStyle = 'rgba(11,14,22,0.52)'
  c.fillRect(r.x + 5, r.y + 5, 18, 1)
  c.fillRect(r.x + 5, r.y + 5, 1, 14)
  c.fillRect(r.x + 5, r.y + 19, 18, 1)
  c.fillRect(r.x + 23, r.y + 5, 1, 14)
  c.fillRect(r.x + 24, r.y + 11, 14, 1)
  // O cômodo que não existe, no fim do corredor.
  c.fillRect(r.x + 38, r.y + 6, 1, 14)
  c.fillRect(r.x + 38, r.y + 6, 8, 1)
  c.fillRect(r.x + 45, r.y + 6, 1, 14)
  c.fillRect(r.x + 38, r.y + 19, 8, 1)
}

function drawDoor(c: CanvasRenderingContext2D, open: boolean): void {
  fill(c, { x: 340, y: 100, w: 12, h: 48 }, PAL.wallLit)
  const inner: Rect = { x: 342, y: 104, w: 8, h: 40 }
  fill(c, inner, open ? '#000000' : '#191f2d')
  if (!open) {
    c.fillStyle = PAL.inkFaint
    c.fillRect(inner.x + 2, inner.y + 20, 2, 3)
  }
}

function drawRug(c: CanvasRenderingContext2D): void {
  fill(c, RUG, '#191e2c')
  fill(c, { x: RUG.x + 4, y: RUG.y + 4, w: RUG.w - 8, h: RUG.h - 8 }, '#1c2231')
  c.fillStyle = 'rgba(217,178,95,0.045)'
  c.fillRect(RUG.x + 9, RUG.y + 9, RUG.w - 18, RUG.h - 18)
  c.fillStyle = 'rgba(0,0,0,0.22)'
  c.strokeStyle = 'rgba(0,0,0,0.22)'
  c.lineWidth = 1
  c.strokeRect(RUG.x + 0.5, RUG.y + 0.5, RUG.w - 1, RUG.h - 1)
}

/** Móveis, ordenáveis por profundidade junto com Liam. */
export const PROPS: Prop[] = [
  {
    baseY: DESK.y + DESK.h,
    draw(c) {
      fill(c, { x: DESK.x + 3, y: DESK.y + DESK.h, w: DESK.w - 6, h: 3 }, 'rgba(0,0,0,0.38)')
      fill(c, DESK, '#2d3648')
      fill(c, { x: DESK.x, y: DESK.y, w: DESK.w, h: 3 }, '#374159')
      fill(c, { x: DESK.x, y: DESK.y + DESK.h - 4, w: DESK.w, h: 4 }, '#232b3c')
      // Luminária
      fill(c, { x: LAMP.x - 1, y: LAMP.y - 2, w: 2, h: 10 }, '#46516d')
      fill(c, { x: LAMP.x - 7, y: LAMP.y - 10, w: 14, h: 7 }, '#525d7b')
      fill(c, { x: LAMP.x - 5, y: LAMP.y - 4, w: 10, h: 3 }, PAL.lampCore)
    },
  },
  {
    baseY: CHAIR.y + CHAIR.h,
    draw(c) {
      fill(c, { x: CHAIR.x + 2, y: CHAIR.y + CHAIR.h - 1, w: CHAIR.w - 4, h: 2 }, 'rgba(0,0,0,0.35)')
      fill(c, { x: CHAIR.x + 1, y: CHAIR.y, w: CHAIR.w - 2, h: 7 }, '#3a4358')   // encosto
      fill(c, { x: CHAIR.x + 3, y: CHAIR.y + 2, w: CHAIR.w - 6, h: 3 }, '#2a3244')
      fill(c, { x: CHAIR.x, y: CHAIR.y + 7, w: CHAIR.w, h: 7 }, '#333c52')       // assento
      fill(c, { x: CHAIR.x, y: CHAIR.y + 13, w: CHAIR.w, h: 2 }, '#222a3a')
      fill(c, { x: CHAIR.x + 2, y: CHAIR.y + 15, w: 3, h: 5 }, '#222a3a')        // pés
      fill(c, { x: CHAIR.x + CHAIR.w - 5, y: CHAIR.y + 15, w: 3, h: 5 }, '#222a3a')
    },
  },
  {
    baseY: BED.y + BED.h,
    draw(c) {
      fill(c, { x: BED.x + 2, y: BED.y + BED.h, w: BED.w - 4, h: 3 }, 'rgba(0,0,0,0.38)')
      fill(c, { x: BED.x, y: BED.y, w: BED.w, h: 10 }, '#39425a')
      fill(c, { x: BED.x, y: BED.y + 10, w: BED.w, h: BED.h - 10 }, PAL.cloth)
      fill(c, { x: BED.x + 5, y: BED.y + 13, w: BED.w - 10, h: 14 }, '#525d7b')
      fill(c, { x: BED.x + 5, y: BED.y + 13, w: BED.w - 10, h: 3 }, '#5d6989')
      fill(c, { x: BED.x, y: BED.y + 32, w: BED.w, h: 2 }, '#3a4459')
      fill(c, { x: BED.x, y: BED.y + 34, w: BED.w, h: 1 }, 'rgba(0,0,0,0.30)')
      fill(c, { x: BED.x, y: BED.y + 54, w: BED.w, h: 1 }, 'rgba(0,0,0,0.18)')
      fill(c, { x: BED.x, y: BED.y + BED.h - 4, w: BED.w, h: 4 }, '#262e3e')
    },
  },
  {
    baseY: WARDROBE.y + WARDROBE.h,
    draw(c) {
      fill(c, { x: WARDROBE.x + 2, y: WARDROBE.y + WARDROBE.h, w: WARDROBE.w - 4, h: 3 }, 'rgba(0,0,0,0.38)')
      fill(c, WARDROBE, '#2c3446')
      fill(c, { x: WARDROBE.x, y: WARDROBE.y, w: WARDROBE.w, h: 4 }, '#39425a')
      fill(c, { x: WARDROBE.x + WARDROBE.w / 2, y: WARDROBE.y + 4, w: 1, h: WARDROBE.h - 4 }, 'rgba(0,0,0,0.42)')
      c.fillStyle = PAL.inkFaint
      c.fillRect(WARDROBE.x + WARDROBE.w / 2 - 4, WARDROBE.y + 20, 2, 4)
      c.fillRect(WARDROBE.x + WARDROBE.w / 2 + 3, WARDROBE.y + 20, 2, 4)
    },
  },
]

/** Objetos soltos que ainda não foram recolhidos. */
export function drawClutter(c: CanvasRenderingContext2D, resolved: (id: string) => boolean): void {
  const at = (id: string, fn: () => void) => {
    if (!resolved(id)) fn()
  }

  at('roupa1', () => {
    fill(c, { x: 116, y: 148, w: 16, h: 8 }, '#3c455e')
    fill(c, { x: 119, y: 146, w: 10, h: 4 }, '#464f6a')
  })
  at('roupa2', () => {
    fill(c, { x: 192, y: 170, w: 18, h: 8 }, '#363f56')
    fill(c, { x: 197, y: 168, w: 9, h: 4 }, '#404963')
  })
  at('desenho1', () => paper(c, 146, 120, 14, 11))
  at('desenho2', () => paper(c, 264, 152, 14, 11))

  at('botao', () => {
    c.fillStyle = '#767c8e'
    c.fillRect(97, 180, 5, 5)
    c.fillStyle = PAL.wallDark
    c.fillRect(99, 182, 1, 1)
  })
  at('passagem', () => paper(c, 292, 114, 12, 7))
  at('pedra', () => {
    c.fillStyle = '#365d82'
    c.fillRect(167, 180, 7, 5)
    c.fillStyle = '#4c7ba6'
    c.fillRect(168, 180, 3, 2)
  })
  at('chave', () => {
    c.fillStyle = '#848a9c'
    c.fillRect(301, 175, 8, 2)
    c.fillRect(301, 173, 3, 4)
  })
  at('papel', () => paper(c, 122, 86, 10, 8))
}

function paper(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  c.fillStyle = 'rgba(207,198,180,0.42)'
  c.fillRect(x, y, w, h)
  c.fillStyle = 'rgba(11,14,22,0.34)'
  c.fillRect(x + 2, y + 2, w - 5, 1)
  c.fillRect(x + 2, y + 5, w - 7, 1)
}
