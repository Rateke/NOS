import type { Line } from '../world/types'
import { audio } from '../../engine/audio'
import { PAL } from '../../engine/constants'

const CHARS_PER_SEC = 42

/**
 * Caixa de legenda com efeito de máquina de escrever. Desenhada em resolução
 * de tela (não no mundo) para o texto não ficar ilegível na escala pequena.
 */
export class Dialogue {
  private queue: Line[] = []
  private current: Line | null = null
  private revealed = 0
  private elapsed = 0
  private onDone: (() => void) | null = null
  private lastTypeSound = 0
  /** Segundos de espera antes de avançar sozinho; 0 = espera o jogador. */
  private auto = 0
  private paradoDesde = 0

  get active(): boolean {
    return this.current !== null || this.queue.length > 0
  }

  /**
   * `auto` faz as falas correrem sozinhas, sem toque. Usado nos clímaxes:
   * tirar o controle da mão do jogador é parte da direção.
   */
  play(lines: Line[], onDone?: () => void, auto = 0): void {
    this.queue = [...lines]
    this.onDone = onDone ?? null
    this.auto = auto
    this.advance()
  }

  private advance(): void {
    const next = this.queue.shift()
    if (!next) {
      this.current = null
      const cb = this.onDone
      this.onDone = null
      cb?.()
      return
    }
    this.current = next
    this.revealed = 0
    this.elapsed = 0
    this.paradoDesde = 0
  }

  /** Um toque completa a linha; o toque seguinte passa para a próxima. */
  confirm(): void {
    if (!this.current) return
    if (this.revealed < this.current.text.length) {
      this.revealed = this.current.text.length
    } else {
      this.advance()
    }
  }

  update(dt: number): void {
    if (!this.current) return
    if (this.revealed < this.current.text.length) {
      this.elapsed += dt
      const target = Math.min(this.current.text.length, Math.floor(this.elapsed * CHARS_PER_SEC))
      if (target > this.revealed) {
        this.revealed = target
        this.lastTypeSound += 1
        if (this.lastTypeSound % 2 === 0) audio.type()
      }
      return
    }
    if (this.auto > 0) {
      this.paradoDesde += dt
      if (this.paradoDesde >= this.auto) this.advance()
    }
  }

  render(ctx: CanvasRenderingContext2D, cssW: number, cssH: number): void {
    const line = this.current
    if (!line) return

    const pad = Math.max(16, Math.min(cssW, cssH) * 0.04)
    const boxW = Math.min(cssW - pad * 2, 900)
    const fontSize = Math.max(15, Math.round(Math.min(cssW / 46, 26)))
    const lineH = fontSize * 1.55
    const boxX = (cssW - boxW) / 2

    const style = line.style ?? 'thought'
    ctx.font = `${style === 'read' ? 'italic ' : ''}${fontSize}px ${FONT_BODY}`
    const text = line.text.slice(0, this.revealed)
    const wrapped = wrap(ctx, line.text, boxW - pad * 2)
    const shownLines = wrap(ctx, text, boxW - pad * 2)

    const nameH = line.speaker ? fontSize * 1.5 : 0
    const boxH = nameH + wrapped.length * lineH + pad * 1.4
    const boxY = cssH - boxH - pad

    ctx.save()
    ctx.fillStyle = 'rgba(4,6,11,0.88)'
    ctx.fillRect(boxX, boxY, boxW, boxH)
    ctx.strokeStyle = 'rgba(134,142,162,0.28)'
    ctx.lineWidth = 1
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1)

    let ty = boxY + pad * 0.7 + fontSize
    if (line.speaker) {
      ctx.font = `${Math.round(fontSize * 0.82)}px ${FONT_BODY}`
      ctx.fillStyle = PAL.accent
      ctx.letterSpacing = '0.14em'
      ctx.fillText(line.speaker.toUpperCase(), boxX + pad, ty)
      ctx.letterSpacing = '0em'
      ty += nameH
      ctx.font = `${fontSize}px ${FONT_BODY}`
    }

    ctx.fillStyle = style === 'read' ? PAL.paper : style === 'speech' ? PAL.ink : PAL.inkDim
    if (style === 'read') ctx.font = `italic ${fontSize}px ${FONT_BODY}`
    for (const l of shownLines) {
      ctx.fillText(l, boxX + pad, ty)
      ty += lineH
    }

    if (this.revealed >= line.text.length) {
      const t = performance.now() / 500
      ctx.globalAlpha = 0.35 + Math.sin(t) * 0.3
      ctx.fillStyle = PAL.ink
      const s = Math.round(fontSize * 0.3)
      ctx.fillRect(boxX + boxW - pad, boxY + boxH - pad * 0.8, s, s)
      ctx.globalAlpha = 1
    }
    ctx.restore()
  }
}

export const FONT_BODY = `'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`
export const FONT_TITLE = `'Cormorant Garamond', ui-serif, Georgia, serif`

export function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ')
  const out: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxW && line) {
      out.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) out.push(line)
  return out
}
