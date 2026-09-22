import type { Scene, SceneCtx } from './types'
import { FONT_BODY, FONT_TITLE } from '../systems/dialogue'
import { CHAPTER_LABEL, CHAPTER_TITLE, SLICE_END } from '../content/script'
import { PAL, WORLD_W, WORLD_H } from '../../engine/constants'

export class ChapterCardScene implements Scene {
  readonly id = 'chapter-card'
  private t = 0

  update(dt: number): void {
    this.t += dt
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    w.fillStyle = PAL.void
    w.fillRect(0, 0, WORLD_W, WORLD_H)
    ctx.display.present()

    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const fadeIn = (start: number, dur = 1.4) =>
      Math.max(0, Math.min(1, (this.t - start) / dur))

    c.save()
    c.textAlign = 'center'

    const labelSize = Math.max(12, Math.min(cssW / 70, 18))
    c.globalAlpha = fadeIn(0.3)
    c.fillStyle = PAL.accent
    c.font = `${labelSize}px ${FONT_BODY}`
    c.letterSpacing = '0.34em'
    c.fillText(CHAPTER_LABEL.toUpperCase(), cssW / 2, cssH / 2 - labelSize * 3.6)
    c.letterSpacing = '0em'

    const titleSize = Math.max(32, Math.min(cssW / 15, 72))
    c.globalAlpha = fadeIn(1.1, 1.8)
    c.fillStyle = PAL.ink
    c.font = `300 ${titleSize}px ${FONT_TITLE}`
    c.fillText(CHAPTER_TITLE, cssW / 2, cssH / 2)

    const noteSize = Math.max(12, Math.min(cssW / 66, 18))
    c.font = `${noteSize}px ${FONT_BODY}`
    c.fillStyle = PAL.inkFaint
    let y = cssH / 2 + titleSize * 1.5
    SLICE_END.forEach((line, i) => {
      c.globalAlpha = fadeIn(3.2 + i * 0.7, 1.4)
      c.fillText(line, cssW / 2, y)
      y += noteSize * 1.8
    })

    c.globalAlpha = fadeIn(5.6, 1.4) * (0.4 + Math.sin(this.t * 2) * 0.25)
    c.fillText('F5 para recomeçar', cssW / 2, cssH - noteSize * 3)
    c.restore()
  }
}
