import type { Input } from '../../engine/input'
import { audio } from '../../engine/audio'
import { FONT_BODY } from '../systems/dialogue'
import { PAL } from '../../engine/constants'
import { desenharLista, navegarLista, PASSO_LISTA } from './lista'
import type { Caixa } from './lista'

export type AcaoPausa = 'continuar' | 'menu' | 'sair'

const ITENS: readonly { acao: AcaoPausa; rotulo: string; nota: string }[] = [
  { acao: 'continuar', rotulo: 'Continuar', nota: '' },
  { acao: 'menu', rotulo: 'Voltar ao menu', nota: 'o jogo foi salvo quando esta parte começou' },
  { acao: 'sair', rotulo: 'Sair', nota: 'fecha o jogo · ele foi salvo quando esta parte começou' },
]

/**
 * A pausa. Esc (ou P, ou o ícone no canto) congela a cena onde ela estiver:
 * o quadro fica parado embaixo de um véu e o som inteiro para junto — não
 * abaixa, para, e volta do mesmo ponto.
 */
export class Pausa {
  aberta = false
  private sel = 0
  private t = 0
  private caixas: Caixa[] = []

  abrir(): void {
    if (this.aberta) return
    this.aberta = true
    this.sel = 0
    this.t = 0
    void audio.contexto?.suspend()
  }

  /** Fecha. `retomarSom` falso deixa o silêncio para quem vem depois. */
  fechar(retomarSom = true): void {
    if (!this.aberta) return
    this.aberta = false
    if (retomarSom) void audio.contexto?.resume()
  }

  update(dt: number, input: Input): AcaoPausa | null {
    this.t += dt
    // Um quadro de folga: a mesma tecla que abriu não fecha.
    if (this.t < 0.08) return null
    if (input.consumeKey('Escape') || input.consumeKey('KeyP')) return 'continuar'
    const r = navegarLista(input, ITENS.length, this.sel, this.caixas)
    this.sel = r.sel
    if (r.escolhido >= 0) return ITENS[r.escolhido]?.acao ?? null
    return null
  }

  draw(c: CanvasRenderingContext2D, cssW: number, cssH: number): void {
    const a = Math.min(1, this.t / 0.25)
    c.save()
    c.globalAlpha = a
    c.fillStyle = 'rgba(3,4,8,0.78)'
    c.fillRect(0, 0, cssW, cssH)

    const s = Math.max(14, Math.min(cssW / 58, 24))
    c.textAlign = 'center'
    c.fillStyle = PAL.inkFaint
    c.font = `300 ${s * 0.7}px ${FONT_BODY}`
    c.letterSpacing = '0.42em'
    c.fillText('PAUSA', cssW / 2, cssH * 0.5 - s * PASSO_LISTA * 1.5)
    c.letterSpacing = '0em'
    c.restore()

    this.caixas = desenharLista(c, {
      itens: ITENS,
      sel: this.sel,
      cssW,
      y0: cssH * 0.5 - s * PASSO_LISTA * 0.5,
      s,
      t: this.t,
      alfa: () => a,
      vivo: true,
    })

    c.save()
    c.globalAlpha = a * 0.34
    c.fillStyle = PAL.inkDim
    c.textAlign = 'center'
    c.font = `300 ${s * 0.66}px ${FONT_BODY}`
    c.letterSpacing = '0.2em'
    c.fillText('ESC VOLTA PARA O JOGO', cssW / 2, cssH - s * 2.4)
    c.restore()
  }
}

/**
 * O ícone de pausa no canto de cima: dois traços num círculo fino. Só
 * aparece para quem está de mouse ou de dedo — quem joga no teclado tem o
 * Esc e não precisa de nada desenhado por cima da cena.
 */
export function caixaIconePausa(cssW: number): Caixa {
  const s = Math.max(12, Math.min(cssW / 70, 17))
  const cx = cssW - s * 2.4
  const cy = s * 2.4
  const r = s * 1.6
  return { x: cx - r, y: cy - r, w: r * 2, h: r * 2 }
}

export function desenharIconePausa(c: CanvasRenderingContext2D, cssW: number, alfa: number, sobre: boolean): void {
  const s = Math.max(12, Math.min(cssW / 70, 17))
  const cx = cssW - s * 2.4
  const cy = s * 2.4
  c.save()
  c.globalAlpha = alfa * (sobre ? 0.9 : 0.5)
  c.strokeStyle = PAL.inkDim
  c.lineWidth = 1
  c.beginPath()
  c.arc(cx, cy, s * 0.95, 0, Math.PI * 2)
  c.stroke()
  c.fillStyle = sobre ? PAL.ink : PAL.inkDim
  const h = s * 0.8
  const w = Math.max(2, s * 0.16)
  c.fillRect(Math.round(cx - s * 0.26 - w / 2), Math.round(cy - h / 2), w, h)
  c.fillRect(Math.round(cx + s * 0.26 - w / 2), Math.round(cy - h / 2), w, h)
  c.restore()
}

/**
 * O salvamento: um fio que passa, dá uma volta e segue — um nó, desenhado
 * aos poucos, no canto de cima. `t` em segundos desde que gravou; some
 * sozinho.
 */
export function desenharSalvando(c: CanvasRenderingContext2D, cssW: number, t: number): void {
  const DUR = 3.2
  if (t < 0 || t > DUR) return
  const s = Math.max(12, Math.min(cssW / 70, 17))
  const cx = cssW - s * 2.4
  const cy = s * 2.4
  const a = Math.min(1, t / 0.5, (DUR - t) / 0.8)
  const p = Math.min(1, t / 1.2)
  const r = s * 0.42
  c.save()
  c.globalAlpha = a * 0.75
  c.strokeStyle = PAL.accent
  c.lineWidth = 1.5
  c.lineCap = 'round'
  c.lineJoin = 'round'
  // Da esquerda até o nó, a volta por cima, e embora pela direita.
  c.beginPath()
  c.moveTo(cx - s * 1.5, cy + r)
  c.lineTo(cx - r * 0.2, cy + r)
  c.arc(cx, cy, r, Math.PI * 0.5 + 0.5, Math.PI * 0.5 + 0.5 + Math.PI * 1.9, false)
  c.lineTo(cx + s * 1.5, cy + r)
  const total = s * 3 + r * Math.PI * 2
  c.setLineDash([total, total])
  c.lineDashOffset = total * (1 - p)
  c.stroke()
  c.setLineDash([])
  c.globalAlpha = a * 0.5
  c.fillStyle = PAL.inkDim
  c.textAlign = 'right'
  c.font = `italic 300 ${s * 0.86}px ${FONT_BODY}`
  c.fillText('salvo', cx - s * 1.9, cy + r + s * 0.3)
  c.restore()
}
