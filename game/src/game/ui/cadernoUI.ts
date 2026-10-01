import type { SceneCtx } from '../scenes/types'
import type { Leitor } from '../systems/leitor'
import { montarCaderno } from '../content/caderno'
import { FONT_BODY } from '../systems/dialogue'
import { PAL } from '../../engine/constants'

/**
 * O caderno no canto da tela: um ícone pequeno que pulsa quando ganha uma
 * linha nova. C (ou Tab, ou um clique no ícone) abre. Só nas cenas em que
 * Liam anda livre — nunca no meio de uma cena que o jogador só assiste.
 */
export class CadernoUI {
  private caixa = { x: 0, y: 0, w: 0, h: 0 }
  private t = 0

  /** Abre o caderno se o jogador pediu. Devolve true se abriu. */
  update(dt: number, ctx: SceneCtx, leitor: Leitor, livre: boolean): boolean {
    this.t += dt
    ctx.state.novidade = Math.max(0, ctx.state.novidade - dt * 0.05)
    if (!livre || leitor.aberto) return false
    const tap = ctx.input.peekTap()
    const noIcone = tap !== null
      && tap.x >= this.caixa.x && tap.x <= this.caixa.x + this.caixa.w
      && tap.y >= this.caixa.y && tap.y <= this.caixa.y + this.caixa.h
    if (noIcone) {
      ctx.input.consumeTap()
      ctx.input.consumeConfirm()
    }
    if (noIcone || ctx.input.consumeKey('KeyC') || ctx.input.consumeKey('Tab')) {
      ctx.state.novidade = 0
      leitor.abrir(montarCaderno(ctx.state))
      return true
    }
    return false
  }

  draw(c: CanvasRenderingContext2D, cssW: number, cssH: number, novidade: number): void {
    const s = Math.max(12, Math.min(cssW / 70, 17))
    const x = cssW - s * 6.2
    const y = cssH - s * 4.4
    const w = s * 1.5
    const h = s * 2
    this.caixa = { x: x - s * 0.6, y: y - s * 0.6, w: s * 5.6, h: h + s * 1.2 }
    const pulso = novidade > 0 ? 0.55 + Math.sin(this.t * 4) * 0.35 : 0
    c.save()
    c.globalAlpha = 0.5 + pulso * 0.5
    // A capa do caderno, com a espiral
    c.fillStyle = novidade > 0 ? PAL.accent : '#9aa0b0'
    c.fillRect(x, y, w, h)
    c.fillStyle = '#05070c'
    for (let i = 0; i < 4; i++) c.fillRect(x - 1, y + 3 + i * (h / 4), 3, 2)
    c.fillRect(x + w * 0.3, y + h * 0.3, w * 0.5, 1)
    c.fillRect(x + w * 0.3, y + h * 0.45, w * 0.5, 1)
    c.font = `${s * 0.86}px ${FONT_BODY}`
    c.fillStyle = PAL.ink
    c.textAlign = 'left'
    c.fillText('C', x + w + s * 0.6, y + h * 0.42)
    c.globalAlpha *= 0.8
    c.fillStyle = PAL.inkDim
    c.fillText('caderno', x + w + s * 0.6, y + h * 0.95)
    c.restore()
  }
}
