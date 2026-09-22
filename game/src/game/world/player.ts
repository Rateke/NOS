import { WALK_SPEED, PAL } from '../../engine/constants'
import type { Rect } from './types'
import { overlaps } from './types'

export type Facing = 'up' | 'down' | 'left' | 'right'

const BODY_W = 9
const BODY_H = 7 // só os pés colidem: dá a sensação de 3/4 e evita travar em móveis

export class Player {
  x: number
  y: number
  facing: Facing = 'down'
  private walkPhase = 0
  private moving = false

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  /** Retângulo de colisão (os pés). */
  get feet(): Rect {
    return { x: this.x - BODY_W / 2, y: this.y - BODY_H, w: BODY_W, h: BODY_H }
  }

  /** Um ponto à frente de Liam, usado para decidir o que ele pode alcançar. */
  reachPoint(): { x: number; y: number } {
    const d = 11
    switch (this.facing) {
      case 'up': return { x: this.x, y: this.y - d }
      case 'down': return { x: this.x, y: this.y + d * 0.5 }
      case 'left': return { x: this.x - d, y: this.y - 3 }
      case 'right': return { x: this.x + d, y: this.y - 3 }
    }
  }

  update(dt: number, axis: { x: number; y: number } | null, floor: Rect, solids: Rect[]): void {
    this.moving = axis !== null
    if (!axis) {
      this.walkPhase = 0
      return
    }

    if (Math.abs(axis.x) > Math.abs(axis.y)) this.facing = axis.x < 0 ? 'left' : 'right'
    else this.facing = axis.y < 0 ? 'up' : 'down'

    this.walkPhase += dt * 7.5

    // Eixos separados: bater numa parede não anula o outro eixo.
    this.tryMove(axis.x * WALK_SPEED * dt, 0, floor, solids)
    this.tryMove(0, axis.y * WALK_SPEED * dt, floor, solids)
  }

  private tryMove(dx: number, dy: number, floor: Rect, solids: Rect[]): void {
    const nx = this.x + dx
    const ny = this.y + dy
    const box: Rect = { x: nx - BODY_W / 2, y: ny - BODY_H, w: BODY_W, h: BODY_H }
    if (box.x < floor.x || box.x + box.w > floor.x + floor.w) return
    if (box.y < floor.y || box.y + box.h > floor.y + floor.h) return
    for (const s of solids) if (overlaps(box, s)) return
    this.x = nx
    this.y = ny
  }

  draw(c: CanvasRenderingContext2D, lamp: { x: number; y: number }): void {
    const bob = this.moving && Math.floor(this.walkPhase) % 2 === 0 ? 1 : 0
    const x = Math.round(this.x)
    const y = Math.round(this.y) - bob

    // Sombra
    c.fillStyle = 'rgba(0,0,0,0.42)'
    c.fillRect(x - 5, y - 2, 10, 3)

    // Corpo: silhueta escura, quase sem detalhe interno
    c.fillStyle = '#12151f'
    c.fillRect(x - 4, y - 16, 8, 11) // tronco
    c.fillStyle = '#171b27'
    c.fillRect(x - 5, y - 22, 10, 8) // cabeça

    // Pernas
    c.fillStyle = '#0e1119'
    if (this.moving && bob) {
      c.fillRect(x - 4, y - 5, 3, 4)
      c.fillRect(x + 2, y - 4, 3, 3)
    } else {
      c.fillRect(x - 4, y - 5, 3, 5)
      c.fillRect(x + 1, y - 5, 3, 5)
    }

    // Luz de contorno vinda da luminária: única cor quente no personagem
    const side = lamp.x > this.x ? 1 : -1
    c.fillStyle = 'rgba(240,192,136,0.30)'
    c.fillRect(x + (side > 0 ? 3 : -5), y - 22, 2, 8)
    c.fillRect(x + (side > 0 ? 2 : -4), y - 16, 2, 11)

    // Cabelo / nuca, conforme a direção
    c.fillStyle = '#0b0e16'
    if (this.facing === 'down') c.fillRect(x - 5, y - 22, 10, 3)
    else if (this.facing === 'up') c.fillRect(x - 5, y - 22, 10, 6)
    else c.fillRect(x - (this.facing === 'left' ? 5 : 2), y - 22, 7, 4)

    // Olhos só quando está de frente, e mal se veem
    if (this.facing === 'down') {
      c.fillStyle = PAL.inkDim
      c.fillRect(x - 3, y - 18, 1, 1)
      c.fillRect(x + 2, y - 18, 1, 1)
    }
  }
}
