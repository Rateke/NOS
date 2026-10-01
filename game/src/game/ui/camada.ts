import { FONT_FIM } from '../systems/dialogue'
import type { GameState } from '../systems/state'

/**
 * A primeira vez que cada camada do mundo aparece — uma lembrança, o Dentro,
 * o mundo de fora — ganha uma anotação a lápis no canto, na letra do Liam. Depois
 * disso o jogador já sabe ler a camada pelo olho e pelo ouvido, e a
 * anotação não volta.
 */
export type IdCamada = 'lembranca' | 'dentro' | 'hospital' | 'casa'

const TEXTO: Record<IdCamada, string> = {
  lembranca: '(lembrança)',
  dentro: '(dentro)',
  // O mundo de fora. Não diz "hospital": isso só se descobre no fim.
  hospital: '(lá fora)',
  casa: '(a casa, na minha cabeça)',
}

export class Camada {
  private texto = ''
  private t = 0
  private dur = 0

  mostrar(state: GameState, id: IdCamada, dur = 6): void {
    if (!state.primeiraCamada(id)) return
    this.texto = TEXTO[id]
    this.t = 0
    this.dur = dur
  }

  update(dt: number): void {
    if (this.t < this.dur) this.t += dt
  }

  draw(c: CanvasRenderingContext2D, cssW: number, cssH: number): void {
    if (!this.texto || this.t >= this.dur) return
    const alfa = Math.min(1, this.t / 0.8, (this.dur - this.t) / 1.2)
    const s = Math.max(16, Math.min(cssW / 42, 30))
    c.save()
    c.globalAlpha = Math.max(0, alfa) * 0.72
    c.font = `italic 500 ${s}px ${FONT_FIM}`
    c.fillStyle = '#c9cbd6'
    c.textAlign = 'left'
    // Grafite: um traço de lápis tremido embaixo, como quem anota às pressas.
    const x = cssW * 0.05
    const y = cssH * 0.09
    c.fillText(this.texto, x, y)
    const w = c.measureText(this.texto).width
    c.globalAlpha *= 0.5
    c.fillRect(x, y + s * 0.28, w * Math.min(1, this.t / 1.2), 1)
    c.restore()
  }
}
