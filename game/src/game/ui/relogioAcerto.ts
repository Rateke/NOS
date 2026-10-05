import type { Input } from '../../engine/input'
import { FONT_BODY, FONT_TITLE } from '../systems/dialogue'
import { PAL } from '../../engine/constants'

/**
 * O mostrador do relógio do corredor, de perto, com o vidro aberto.
 *
 * Setas ← → andam o ponteiro grande de cinco em cinco minutos (e o pequeno
 * vai junto); ↑ ↓ andam a hora inteira. Enter solta os ponteiros, Esc deixa
 * como estava. Com o mouse ou o dedo: tocar perto da borda leva o ponteiro
 * grande até ali; perto do centro, o pequeno.
 *
 * O mostrador não diz se acertou. Quem solta na hora errada só vê o relógio
 * continuar dali.
 */
type Caixa = { x: number; y: number; w: number; h: number }

export class RelogioAcerto {
  ativa = false
  /** 0..11 e 0..55. */
  hora = 10
  minuto = 10
  private t = 0
  private zonas: { face: { cx: number; cy: number; r: number }; soltar: Caixa; deixar: Caixa } = {
    face: { cx: 0, cy: 0, r: 1 }, soltar: { x: 0, y: 0, w: 0, h: 0 }, deixar: { x: 0, y: 0, w: 0, h: 0 },
  }

  abrir(h: number, m: number): void {
    this.ativa = true
    this.t = 0
    this.hora = ((h % 12) + 12) % 12
    this.minuto = Math.round(m / 5) * 5 % 60
  }

  /** 'soltou' com a hora escolhida, 'deixou' sem mexer, ou null. */
  update(dt: number, input: Input): 'soltou' | 'deixou' | 'girou' | null {
    if (!this.ativa) return null
    this.t += dt
    if (this.t < 0.3) {
      input.consumeTap()
      input.consumeConfirm()
      return null
    }
    const tap = input.consumeTap()
    const confirmou = input.consumeConfirm()
    if (tap) {
      const dentro = (z: Caixa) => tap.x >= z.x && tap.x <= z.x + z.w && tap.y >= z.y && tap.y <= z.y + z.h
      if (dentro(this.zonas.soltar)) return this.fechar(true)
      if (dentro(this.zonas.deixar)) return this.fechar(false)
      const f = this.zonas.face
      const dx = tap.x - f.cx
      const dy = tap.y - f.cy
      const d = Math.hypot(dx, dy)
      if (d <= f.r * 1.08) {
        // Ângulo a partir do 12, no sentido do relógio
        const ang = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2)
        if (d > f.r * 0.5) this.minuto = (Math.round((ang / (Math.PI * 2)) * 12) % 12) * 5
        else this.hora = Math.round((ang / (Math.PI * 2)) * 12) % 12
        return 'girou'
      }
      return null
    }
    if (input.consumeKey('Escape')) return this.fechar(false)
    if (input.consumeKey('ArrowRight') || input.consumeKey('KeyD')) return this.andar(5)
    if (input.consumeKey('ArrowLeft') || input.consumeKey('KeyA')) return this.andar(-5)
    if (input.consumeKey('ArrowUp') || input.consumeKey('KeyW')) {
      this.hora = (this.hora + 1) % 12
      return 'girou'
    }
    if (input.consumeKey('ArrowDown') || input.consumeKey('KeyS')) {
      this.hora = (this.hora + 11) % 12
      return 'girou'
    }
    if (confirmou) return this.fechar(true)
    return null
  }

  private andar(d: number): 'girou' {
    let m = this.minuto + d
    if (m >= 60) {
      m -= 60
      this.hora = (this.hora + 1) % 12
    } else if (m < 0) {
      m += 60
      this.hora = (this.hora + 11) % 12
    }
    this.minuto = m
    return 'girou'
  }

  private fechar(soltou: boolean): 'soltou' | 'deixou' {
    this.ativa = false
    return soltou ? 'soltou' : 'deixou'
  }

  draw(c: CanvasRenderingContext2D, cssW: number, cssH: number, toque: boolean): void {
    if (!this.ativa) return
    const a = Math.min(1, this.t / 0.3)
    const s = Math.max(12, Math.min(cssW / 60, 20))
    c.save()
    c.globalAlpha = a
    c.fillStyle = 'rgba(4,4,8,0.82)'
    c.fillRect(0, 0, cssW, cssH)
    const r = Math.min(cssH * 0.27, cssW * 0.2)
    const cx = cssW / 2 - Math.min(r * 0.6, cssW * 0.08)
    const cy = cssH * 0.38
    // A caixa de madeira em volta
    c.fillStyle = '#3a2618'
    c.fillRect(cx - r * 1.25, cy - r * 1.25, r * 2.5, r * 2.5 + r * 0.9)
    c.fillStyle = '#4e3220'
    c.fillRect(cx - r * 1.15, cy - r * 1.15, r * 2.3, r * 2.3 + r * 0.8)
    // A portinha do pêndulo, embaixo, fechada; e o pêndulo parado atrás do vidro
    c.fillStyle = '#2a1a10'
    c.fillRect(cx - r * 0.45, cy + r * 1.2, r * 0.9, r * 0.62)
    c.fillStyle = 'rgba(190,170,110,0.5)'
    c.fillRect(cx - 1, cy + r * 1.2, 2, r * 0.42)
    c.beginPath()
    c.arc(cx, cy + r * 1.62, r * 0.1, 0, Math.PI * 2)
    c.fill()
    // O mostrador
    c.fillStyle = '#e8e0cc'
    c.beginPath()
    c.arc(cx, cy, r, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = '#8a6a3a'
    c.lineWidth = Math.max(2, r * 0.04)
    c.stroke()
    // Os traços e os números
    c.fillStyle = '#2a2018'
    for (let i = 0; i < 60; i++) {
      const ang = (i / 60) * Math.PI * 2
      const grosso = i % 5 === 0
      const r0 = r * (grosso ? 0.84 : 0.9)
      c.save()
      c.translate(cx + Math.sin(ang) * r0, cy - Math.cos(ang) * r0)
      c.rotate(ang)
      c.fillRect(-(grosso ? 1.5 : 0.6), 0, grosso ? 3 : 1.2, r * (grosso ? 0.1 : 0.05))
      c.restore()
    }
    c.font = `500 ${r * 0.16}px ${FONT_TITLE}`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    for (let n = 1; n <= 12; n++) {
      const ang = (n / 12) * Math.PI * 2
      c.fillText(String(n), cx + Math.sin(ang) * r * 0.68, cy - Math.cos(ang) * r * 0.68)
    }
    c.textBaseline = 'alphabetic'
    // Os ponteiros: o pequeno anda junto com os minutos
    const angM = (this.minuto / 60) * Math.PI * 2
    const angH = ((this.hora + this.minuto / 60) / 12) * Math.PI * 2
    const ponteiro = (ang: number, comp: number, larg: number, cor: string) => {
      c.save()
      c.translate(cx, cy)
      c.rotate(ang)
      c.fillStyle = cor
      c.beginPath()
      c.moveTo(-larg, r * 0.08)
      c.lineTo(0, -comp)
      c.lineTo(larg, r * 0.08)
      c.closePath()
      c.fill()
      c.restore()
    }
    ponteiro(angH, r * 0.48, r * 0.05, '#1a120c')
    ponteiro(angM, r * 0.78, r * 0.03, '#1a120c')
    c.fillStyle = '#8a6a3a'
    c.beginPath()
    c.arc(cx, cy, r * 0.05, 0, Math.PI * 2)
    c.fill()
    // Reflexo do vidro aberto, de lado
    c.fillStyle = 'rgba(255,255,255,0.06)'
    c.beginPath()
    c.ellipse(cx - r * 1.05, cy, r * 0.12, r * 0.95, 0, 0, Math.PI * 2)
    c.fill()

    // Os botões, ao lado da caixa, e o que dá para fazer
    const bw = s * 7
    const bx = Math.min(cssW - bw - s, cx + r * 1.4)
    const soltar = { x: bx, y: cy + r * 0.1, w: bw, h: s * 1.9 }
    const deixar = { x: bx, y: cy + r * 0.1 + s * 2.5, w: bw, h: s * 1.9 }
    c.font = `${s}px ${FONT_BODY}`
    for (const [z, txt, forte] of [[soltar, 'soltar', true], [deixar, 'deixar', false]] as const) {
      c.fillStyle = forte ? 'rgba(226,169,94,0.22)' : 'rgba(255,255,255,0.06)'
      c.fillRect(z.x, z.y, z.w, z.h)
      c.strokeStyle = forte ? 'rgba(226,169,94,0.7)' : 'rgba(255,255,255,0.25)'
      c.lineWidth = 1
      c.strokeRect(z.x + 0.5, z.y + 0.5, z.w - 1, z.h - 1)
      c.fillStyle = forte ? '#f2d6a8' : PAL.inkDim
      c.textAlign = 'center'
      c.fillText(txt, z.x + z.w / 2, z.y + z.h * 0.66)
    }
    c.globalAlpha = a * 0.55
    c.font = `${s * 0.82}px ${FONT_BODY}`
    c.fillStyle = PAL.inkDim
    c.fillText(
      toque ? 'toque perto da borda para o ponteiro grande, perto do meio para o pequeno' : '← → minutos  ·  ↑ ↓ horas  ·  Enter solta  ·  Esc deixa',
      cssW / 2, cssH - s * 0.8,
    )
    this.zonas = { face: { cx, cy, r }, soltar, deixar }
    c.restore()
  }
}
