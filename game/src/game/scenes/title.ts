import type { Scene, SceneCtx } from './types'
import { FONT_BODY, FONT_TITLE } from '../systems/dialogue'
import { audio } from '../../engine/audio'
import { PAL } from '../../engine/constants'
import { OpeningScene } from './opening'
import { PrologoScene } from './demo/prologo'

/** Existe por causa da política de autoplay: o áudio precisa de um gesto. */
export class TitleScene implements Scene {
  readonly id = 'title'
  private t = 0
  private leaving = false
  private sel = 0

  private readonly itens = [
    { rotulo: 'Demo — Só mais um', nota: 'o Tear, a cena central', cena: () => new PrologoScene() },
    { rotulo: 'Abertura', nota: 'o quarto de Liam', cena: () => new OpeningScene() },
  ]

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt
    if (this.leaving || this.t < 0.6) return

    if (ctx.input.consumeKey('ArrowUp') || ctx.input.consumeKey('KeyW')) {
      this.sel = (this.sel + this.itens.length - 1) % this.itens.length
      audio.interact()
    }
    if (ctx.input.consumeKey('ArrowDown') || ctx.input.consumeKey('KeyS')) {
      this.sel = (this.sel + 1) % this.itens.length
      audio.interact()
    }

    if (ctx.input.consumeConfirm() || (ctx.input.touchMode && ctx.input.consumeAny())) {
      this.leaving = true
      audio.init()
      audio.resume()
      audio.startAmbient()
      audio.setAmbient(0.55, 3)
      const item = this.itens[this.sel]
      if (item) ctx.transition(item.cena(), 1.2, 0.1)
    }
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    w.fillStyle = PAL.void
    w.fillRect(0, 0, 384, 216)
    ctx.display.present()

    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const titleSize = Math.max(44, Math.min(cssW / 8, 130))
    c.save()
    c.textAlign = 'center'
    c.fillStyle = PAL.ink
    c.font = `300 ${titleSize}px ${FONT_TITLE}`
    c.letterSpacing = '0.3em'
    c.fillText('NÓS', cssW / 2 + titleSize * 0.15, cssH / 2)
    c.letterSpacing = '0em'

    const hintSize = Math.max(12, Math.min(cssW / 60, 18))
    let y = cssH / 2 + titleSize * 0.75
    for (const [i, item] of this.itens.entries()) {
      const ativo = i === this.sel
      c.font = `${hintSize * (ativo ? 1.25 : 1.1)}px ${FONT_BODY}`
      c.globalAlpha = ativo ? 0.92 + Math.sin(this.t * 3) * 0.08 : 0.38
      c.fillStyle = ativo ? PAL.accent : PAL.inkDim
      c.fillText(item.rotulo, cssW / 2, y)
      if (ativo) {
        c.globalAlpha = 0.45
        c.fillStyle = PAL.inkDim
        c.font = `${hintSize * 0.92}px ${FONT_BODY}`
        c.fillText(item.nota, cssW / 2, y + hintSize * 1.5)
      }
      y += hintSize * 3.4
    }
    c.globalAlpha = 1

    c.font = `${Math.max(10, hintSize * 0.8)}px ${FONT_BODY}`
    c.fillStyle = PAL.inkFaint
    const how = ctx.input.touchMode || 'ontouchstart' in window
      ? 'toque para escolher'
      : '↑ ↓ escolhe  ·  E ou espaço confirma'
    c.fillText(how, cssW / 2, cssH - 28)
    c.restore()
  }
}
