import { FONT_BODY, FONT_FIM } from '../systems/dialogue'

/**
 * A sombra do pai.
 *
 * Nos momentos que decidem alguma coisa, cada erro faz o pai chegar mais
 * perto — e crescer. O corpo vira uma sombra preta que vai tomando a sala,
 * com dois olhos dourados acesos e um vermelho de brasa por trás. A voz
 * engrossa junto (a cena lê `grave`). Quando a sombra enche, ela engole a
 * tela: o momento recomeça.
 *
 * Tudo é desenhado por cima do jogo, na tela, a partir de onde ele está.
 */
export class SombraDoPai {
  /** 0..1: o tamanho da sombra agora (já suavizado). */
  nivel = 0
  private alvo = 0
  /** 0..1: a sombra fechando a tela inteira — o fim deste momento. */
  engolindo = 0
  private t = 0

  /** Ela encheu e fechou a tela inteira. */
  get engoliu(): boolean {
    return this.engolindo >= 1
  }

  /** Quanto a voz dele engrossa agora. */
  get grave(): number {
    return Math.min(1, this.nivel * 1.15)
  }

  crescer(k: number): void {
    this.alvo = Math.min(1, this.alvo + k)
  }

  recuar(k: number): void {
    if (this.engolindo > 0) return
    this.alvo = Math.max(0, this.alvo - k)
  }

  zerar(): void {
    this.nivel = 0
    this.alvo = 0
    this.engolindo = 0
  }

  update(dt: number): void {
    this.t += dt
    this.nivel += (this.alvo - this.nivel) * Math.min(1, dt * 2.2)
    if (this.alvo >= 1 && this.nivel > 0.96) this.engolindo = Math.min(1, this.engolindo + dt / 1.7)
  }

  /**
   * `x`, `y`: os pés dele na tela; `alt`: a altura dele na tela, em pixels.
   */
  draw(c: CanvasRenderingContext2D, cssW: number, cssH: number, x: number, y: number, alt: number): void {
    const n = Math.max(this.nivel, this.engolindo)
    if (n < 0.04) return
    const W = cssW
    const H = cssH
    const g = this.engolindo
    c.save()
    // A brasa por trás dele
    const brasa = c.createRadialGradient(x, y - alt, alt * 0.2, x, y - alt, alt * (1.5 + n * 4))
    brasa.addColorStop(0, `rgba(170,24,18,${0.35 * n})`)
    brasa.addColorStop(1, 'rgba(60,0,0,0)')
    c.fillStyle = brasa
    c.fillRect(0, 0, W, H)
    // O escuro saindo dele e tomando a sala
    const raio = alt * (1.2 + n * 9) + g * Math.max(W, H) * 1.5
    const sombra = c.createRadialGradient(x, y - alt * 0.6, alt * 0.4, x, y - alt * 0.6, raio)
    sombra.addColorStop(0, `rgba(0,0,0,${0.55 + n * 0.45})`)
    sombra.addColorStop(0.6, `rgba(0,0,0,${0.3 + n * 0.6})`)
    sombra.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = sombra
    c.fillRect(0, 0, W, H)
    // O corpo: ombros e cabeça, crescendo do lugar onde ele está — sem
    // nunca sair da tela por cima: os olhos têm que estar à vista.
    const cresce = 1 + n * 3.6 + g * 3
    const h = Math.max(alt, Math.min(alt * cresce, y - H * 0.08))
    const cab = h * 0.16
    const cx = x + Math.sin(this.t * 0.9) * alt * 0.04 * n
    const topo = y - h
    c.save()
    // A brasa em volta da silhueta: um brilho, não um contorno.
    c.shadowColor = `rgba(190,36,24,${0.75 * n})`
    c.shadowBlur = Math.max(6, alt * 0.5 * n)
    c.fillStyle = `rgba(2,1,2,${Math.min(1, 0.6 + n)})`
    c.beginPath()
    c.moveTo(cx - h * 0.36, y + alt)
    c.quadraticCurveTo(cx - h * 0.34, topo + cab * 2.3, cx - cab * 0.55, topo + cab * 1.85)
    c.lineTo(cx - cab * 0.62, topo + cab * 1.3)
    c.bezierCurveTo(cx - cab * 0.95, topo + cab * 0.2, cx - cab * 0.5, topo - cab * 0.12, cx, topo - cab * 0.1)
    c.bezierCurveTo(cx + cab * 0.5, topo - cab * 0.12, cx + cab * 0.95, topo + cab * 0.2, cx + cab * 0.62, topo + cab * 1.3)
    c.lineTo(cx + cab * 0.55, topo + cab * 1.85)
    c.quadraticCurveTo(cx + h * 0.34, topo + cab * 2.3, cx + h * 0.36, y + alt)
    c.closePath()
    c.fill()
    c.restore()
    // Os olhos: dourados, acesos, piscando devagar; a pupila fina.
    const pisca = Math.sin(this.t * 0.7) > 0.985 ? 0.15 : 1
    const ox = cab * 0.32
    const oy = topo + cab * 0.95
    const rw = cab * 0.2
    const rh = cab * 0.1 * pisca
    for (const s of [-1, 1]) {
      const halo = c.createRadialGradient(cx + s * ox, oy, 0, cx + s * ox, oy, rw * 4)
      halo.addColorStop(0, `rgba(255,200,80,${0.55 * n})`)
      halo.addColorStop(1, 'rgba(255,160,40,0)')
      c.fillStyle = halo
      c.fillRect(cx + s * ox - rw * 4, oy - rw * 4, rw * 8, rw * 8)
      c.fillStyle = `rgba(255,214,110,${Math.min(1, 0.4 + n)})`
      c.beginPath()
      c.ellipse(cx + s * ox, oy, rw, Math.max(0.5, rh), s * -0.18, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = 'rgba(40,10,0,0.9)'
      c.fillRect(cx + s * ox - rw * 0.08, oy - rh, rw * 0.16, rh * 2)
    }
    // Engolindo: o preto fecha tudo, só os olhos ficam.
    if (g > 0) {
      c.fillStyle = `rgba(0,0,0,${Math.min(1, g * 1.4)})`
      c.fillRect(0, 0, W, H)
      const s = Math.min(W, H) * (0.06 + g * 0.05)
      for (const lado of [-1, 1]) {
        c.fillStyle = `rgba(255,206,96,${Math.min(1, g * 1.6)})`
        c.beginPath()
        c.ellipse(W / 2 + lado * s * 1.7, H * 0.42, s, s * 0.42 * pisca, lado * -0.15, 0, Math.PI * 2)
        c.fill()
        c.fillStyle = '#1a0800'
        c.fillRect(W / 2 + lado * s * 1.7 - s * 0.07, H * 0.42 - s * 0.42, s * 0.14, s * 0.84)
      }
    }
    c.restore()
  }

  /** A tela do fim deste momento: preto, os olhos, o que ele diz — e uma dica para a próxima vez. */
  drawFim(
    c: CanvasRenderingContext2D, cssW: number, cssH: number, t: number, linhas: [string, string], dica: string[] = [],
  ): void {
    c.save()
    c.fillStyle = '#000'
    c.fillRect(0, 0, cssW, cssH)
    const s = Math.min(cssW, cssH) * 0.11
    const abre = Math.max(0, 1 - t / 2.6)
    for (const lado of [-1, 1]) {
      c.fillStyle = `rgba(255,206,96,${abre})`
      c.beginPath()
      c.ellipse(cssW / 2 + lado * s * 1.7, cssH * 0.4, s, s * 0.42 * abre, lado * -0.15, 0, Math.PI * 2)
      c.fill()
    }
    c.textAlign = 'center'
    const f = Math.max(16, Math.min(cssW / 34, 30))
    c.font = `italic 500 ${f * 1.4}px ${FONT_FIM}`
    c.fillStyle = `rgba(232,220,200,${Math.min(1, Math.max(0, (t - 0.8) / 0.8))})`
    c.fillText(linhas[0], cssW / 2, cssH * 0.66)
    c.font = `400 ${f * 0.8}px ${FONT_BODY}`
    c.fillStyle = `rgba(200,190,180,${Math.min(0.8, Math.max(0, (t - 2) / 0.8))})`
    c.fillText(linhas[1], cssW / 2, cssH * 0.66 + f * 1.8)
    if (dica.length > 0) {
      c.font = `italic ${f * 0.78}px ${FONT_BODY}`
      c.fillStyle = `rgba(226,169,94,${Math.min(0.95, Math.max(0, (t - 2.6) / 0.8))})`
      dica.forEach((l, i) => c.fillText(l, cssW / 2, cssH * 0.66 + f * (3.6 + i * 1.3), cssW - f * 2))
    }
    c.restore()
  }
}
