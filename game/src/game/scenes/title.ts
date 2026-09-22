import type { Scene, SceneCtx } from './types'
import { FONT_BODY, FONT_TITLE } from '../systems/dialogue'
import { audio } from '../../engine/audio'
import { PAL } from '../../engine/constants'
import { OpeningScene } from './opening'

/** Existe por causa da política de autoplay: o áudio precisa de um gesto. */
export class TitleScene implements Scene {
  readonly id = 'title'
  private t = 0
  private leaving = false

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt
    if (!this.leaving && this.t > 0.6 && ctx.input.consumeAny()) {
      this.leaving = true
      audio.init()
      audio.resume()
      audio.startAmbient()
      audio.setAmbient(0.55, 3)
      ctx.transition(new OpeningScene(), 1.2, 0.1)
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
    c.font = `${hintSize}px ${FONT_BODY}`
    c.globalAlpha = 0.35 + Math.sin(this.t * 2) * 0.25
    c.fillStyle = PAL.inkDim
    c.fillText('pressione qualquer tecla', cssW / 2, cssH / 2 + titleSize * 0.9)
    c.globalAlpha = 1

    c.font = `${Math.max(10, hintSize * 0.8)}px ${FONT_BODY}`
    c.fillStyle = PAL.inkFaint
    c.fillText('fatia vertical · abertura', cssW / 2, cssH - 28)
    c.restore()
  }
}
