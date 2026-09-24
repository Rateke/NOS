import type { Scene, SceneCtx } from '../types'
import { FONT_BODY, FONT_TITLE } from '../../systems/dialogue'
import { EPILOGO, DEMO_FIM } from '../../content/demoScript'
import { PAL, WORLD_W, WORLD_H } from '../../../engine/constants'

/**
 * Fecho da demo. Silêncio absoluto — nenhum som volta — e uma frase só.
 * Depois do que o jogador acabou de fazer com as próprias mãos, ela recontexta
 * a cena inteira.
 */
export class FimScene implements Scene {
  readonly id = 'demo-fim'
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
    const surge = (inicio: number, dur = 2.2): number =>
      Math.max(0, Math.min(1, (this.t - inicio) / dur))

    c.save()
    c.textAlign = 'center'

    // A frase respira sozinha por um tempo longo antes de qualquer outra coisa.
    const size = Math.max(19, Math.min(cssW / 34, 38))
    c.font = `${size}px ${FONT_TITLE}`
    c.fillStyle = PAL.ink
    c.globalAlpha = surge(1.2, 3)
    for (const [i, linha] of EPILOGO.entries()) {
      c.fillText(linha, cssW / 2, cssH / 2 - size * 1.4 + i * size * 1.6)
    }

    const t2 = Math.max(24, Math.min(cssW / 12, 84))
    c.globalAlpha = surge(6, 2.4)
    c.font = `300 ${t2}px ${FONT_TITLE}`
    c.letterSpacing = '0.3em'
    c.fillText('NÓS', cssW / 2 + t2 * 0.15, cssH / 2 + t2 * 1.5)
    c.letterSpacing = '0em'

    const s3 = Math.max(12, Math.min(cssW / 70, 17))
    c.globalAlpha = surge(8.4, 1.8)
    c.font = `${s3}px ${FONT_BODY}`
    c.fillStyle = PAL.inkFaint
    c.fillText(DEMO_FIM, cssW / 2, cssH - s3 * 5)
    c.globalAlpha = surge(9.6, 1.4) * (0.35 + Math.sin(this.t * 2) * 0.25)
    c.fillText('F5 para recomeçar', cssW / 2, cssH - s3 * 2.6)
    c.restore()
  }
}
