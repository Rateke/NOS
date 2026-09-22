import type { Scene, SceneCtx } from './types'
import { FONT_BODY, FONT_TITLE } from '../systems/dialogue'
import { OPENING } from '../content/script'
import { PAL, WORLD_W, WORLD_H } from '../../engine/constants'
import { BedroomScene } from './bedroom'

const FADE = 0.9
const GAP = 0.45
const TITLE_IN = 1.6
const TITLE_HOLD = 2.4
const TITLE_OUT = 1.6

interface Beat {
  kind: 'line' | 'title'
  text: string
  start: number
  fadeIn: number
  hold: number
  fadeOut: number
}

function buildTimeline(): Beat[] {
  const beats: Beat[] = []
  let t = 1.0
  for (const l of OPENING) {
    beats.push({ kind: 'line', text: l.text, start: t, fadeIn: FADE, hold: l.hold, fadeOut: FADE })
    t += FADE + l.hold + FADE + GAP
  }
  beats.push({ kind: 'title', text: 'NÓS', start: t + 0.6, fadeIn: TITLE_IN, hold: TITLE_HOLD, fadeOut: TITLE_OUT })
  return beats
}

/** Tela preta, a VOZ, o título. Nenhuma imagem ainda — só som e legenda. */
export class OpeningScene implements Scene {
  readonly id = 'opening'
  private beats = buildTimeline()
  private t = 0
  private ended = false

  private get total(): number {
    const last = this.beats[this.beats.length - 1]
    return last.start + last.fadeIn + last.hold + last.fadeOut
  }

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt

    // Pular: salta para o fim da batida atual.
    if (ctx.input.consumeConfirm()) {
      const cur = this.beats.find((b) => this.t < b.start + b.fadeIn + b.hold + b.fadeOut)
      if (cur) this.t = cur.start + cur.fadeIn + cur.hold + cur.fadeOut
      else this.t = this.total
    }

    if (!this.ended && this.t >= this.total) {
      this.ended = true
      ctx.transition(new BedroomScene(), 0.1, 0.1)
    }
  }

  private alphaOf(b: Beat): number {
    const local = this.t - b.start
    if (local < 0) return 0
    if (local < b.fadeIn) return local / b.fadeIn
    if (local < b.fadeIn + b.hold) return 1
    const out = local - b.fadeIn - b.hold
    if (out < b.fadeOut) return 1 - out / b.fadeOut
    return 0
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    w.fillStyle = PAL.void
    w.fillRect(0, 0, WORLD_W, WORLD_H)
    ctx.display.present()

    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    c.save()
    c.textAlign = 'center'

    for (const b of this.beats) {
      const a = this.alphaOf(b)
      if (a <= 0.001) continue
      c.globalAlpha = a
      if (b.kind === 'title') {
        const size = Math.max(52, Math.min(cssW / 7, 150))
        c.fillStyle = PAL.ink
        c.font = `300 ${size}px ${FONT_TITLE}`
        c.letterSpacing = '0.32em'
        c.fillText(b.text, cssW / 2 + size * 0.16, cssH / 2 + size * 0.3)
        c.letterSpacing = '0em'
      } else {
        const size = Math.max(17, Math.min(cssW / 42, 30))
        c.fillStyle = PAL.inkDim
        c.font = `${size}px ${FONT_BODY}`
        c.fillText(b.text, cssW / 2, cssH / 2 + size * 0.35)
      }
    }
    c.restore()
  }
}
