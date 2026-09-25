import type { Scene, SceneCtx } from '../types'
import { FONT_BODY, FONT_TITLE } from '../../systems/dialogue'
import { EPILOGO, EPILOGO_CREDITO, DEMO_FIM } from '../../content/demoScript'
import { PAL, WORLD_W, WORLD_H } from '../../../engine/constants'
import { musica, TEMA, ESCALA } from '../../../engine/musica'
import { RELIQUIAS, desenharReliquia } from '../../world/reliquias'
import type { TipoReliquia } from '../../world/reliquias'

interface Subindo {
  tipo: TipoReliquia
  x: number
  y: number
  vy: number
  balanco: number
  atraso: number
}

/**
 * Fecho.
 *
 * Depois do corte vem silêncio absoluto — e só então o tema volta, **afinado**,
 * do jeito que o pai ensinou antes de estragá-lo. Enquanto ele toca, as
 * relíquias que os fios seguravam sobem no escuro, soltas. Não é vitória:
 * é o que sobra quando alguém finalmente corta.
 */
export class FimScene implements Scene {
  readonly id = 'demo-fim'
  private t = 0
  private reliquias: Subindo[] = []
  private idxNota = 0
  private notas: { t: number; grau: number }[] = []

  enter(): void {
    // O instrumento volta ao normal: a lembrança boa, restituída.
    musica.desafinado = 0
    musica.abafado = 0
    musica.setPad(0, 0.5)

    this.reliquias = RELIQUIAS.map((tipo, i) => ({
      tipo,
      // Espalhadas pela largura e escalonadas no tempo: sobem uma a uma.
      x: 36 + i * 54 + (Math.random() - 0.5) * 20,
      y: WORLD_H + 12 + i * 14,
      vy: 5 + Math.random() * 2,
      balanco: i * 1.3,
      atraso: 2.2 + i * 1.3,
    }))

    // O tema inteiro, bem devagar, começando depois do silêncio.
    let quando = 3.4
    for (const frase of TEMA) {
      for (const grau of frase) {
        this.notas.push({ t: quando, grau })
        quando += 0.92
      }
      quando += 1.1
    }
  }

  update(dt: number): void {
    this.t += dt

    while (this.idxNota < this.notas.length) {
      const n = this.notas[this.idxNota]
      if (!n || n.t > this.t) break
      const f = ESCALA[n.grau]
      // Fraco e longo: soa como se viesse de outro cômodo.
      if (f !== undefined) musica.nota(f, 0.42, 5.5)
      this.idxNota++
    }

    for (const r of this.reliquias) {
      if (this.t < r.atraso) continue
      r.y -= r.vy * dt
      r.balanco += dt * 0.7
      r.x += Math.sin(r.balanco) * 5 * dt
    }
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    w.fillStyle = PAL.void
    w.fillRect(0, 0, WORLD_W, WORLD_H)

    // Um clarão fraquíssimo no centro, que cresce com a música.
    const brilho = Math.max(0, Math.min(1, (this.t - 3) / 9))
    w.save()
    w.globalCompositeOperation = 'lighter'
    const g = w.createRadialGradient(WORLD_W / 2, 108, 4, WORLD_W / 2, 108, 190)
    g.addColorStop(0, `rgba(196,176,224,${0.1 * brilho})`)
    g.addColorStop(1, 'rgba(196,176,224,0)')
    w.fillStyle = g
    w.fillRect(0, 0, WORLD_W, WORLD_H)
    w.restore()

    for (const r of this.reliquias) {
      if (this.t < r.atraso || r.y < -20) continue
      // Apagam conforme sobem: soltas, e indo embora.
      const a = Math.max(0, Math.min(0.88, (WORLD_H - r.y) / 70)) * Math.min(1, r.y / 34)
      if (a <= 0.01) continue
      w.save()
      w.globalAlpha = a
      desenharReliquia(w, r.tipo, Math.round(r.x), Math.round(r.y),
        'rgba(184,170,214,0.9)', 'rgba(10,8,16,0.8)')
      w.restore()
    }

    ctx.display.applyGrain(0.035)
    ctx.display.present({ rgbSplit: 0, wave: 0, shake: 0, zoom: 1 + brilho * 0.05, time: this.t })
    ctx.display.vignette(0.78)

    this.drawTexto(ctx)
  }

  private drawTexto(ctx: SceneCtx): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    /** Aparece, respira e some. Cada frase tem a tela só para ela. */
    const janela = (inicio: number, dentro: number, fica: number, fora: number): number => {
      const d = this.t - inicio
      if (d < 0) return 0
      if (d < dentro) return d / dentro
      if (d < dentro + fica) return 1
      const f = d - dentro - fica
      return f < fora ? 1 - f / fora : 0
    }

    c.save()
    c.textAlign = 'center'

    const s = Math.max(18, Math.min(cssW / 32, 40))
    c.font = `300 italic ${s}px ${FONT_TITLE}`
    c.fillStyle = PAL.ink
    const a1 = janela(4.2, 2.4, 3.6, 2)
    if (a1 > 0) {
      c.globalAlpha = a1
      c.fillText(EPILOGO[0] ?? '', cssW / 2, cssH * 0.44)
    }
    const a2 = janela(12.6, 2.2, 3.2, 2)
    if (a2 > 0) {
      c.globalAlpha = a2
      c.fillText(EPILOGO[1] ?? '', cssW / 2, cssH * 0.44)
    }

    // O título se monta letra a letra, e o traço se abre sob ele.
    const aT = janela(20, 3.4, 99, 0)
    if (aT > 0) {
      const tam = Math.max(52, Math.min(cssW / 6.6, 168))
      c.globalAlpha = aT
      c.fillStyle = PAL.ink
      c.font = `400 ${tam}px ${FONT_TITLE}`
      c.letterSpacing = `${0.5 - aT * 0.24}em`
      c.fillText('NÓS', cssW / 2 + tam * 0.16, cssH * 0.47)
      c.letterSpacing = '0em'

      const fio = tam * 1.5 * Math.max(0, Math.min(1, (this.t - 22.5) / 2.6))
      c.globalAlpha = aT * 0.4
      c.fillStyle = PAL.accent
      c.fillRect(cssW / 2 - fio / 2, cssH * 0.47 + tam * 0.24, fio, 1)
    }

    const sc = Math.max(11, Math.min(cssW / 82, 16))
    const aC = janela(25, 2.6, 99, 0)
    if (aC > 0) {
      c.globalAlpha = aC * 0.52
      c.fillStyle = PAL.inkDim
      c.font = `300 ${sc}px ${FONT_BODY}`
      c.letterSpacing = '0.16em'
      c.fillText(EPILOGO_CREDITO, cssW / 2, cssH * 0.47 + sc * 7)
      c.letterSpacing = '0em'
    }

    const aF = janela(28.5, 2, 99, 0)
    if (aF > 0) {
      c.globalAlpha = aF * (0.26 + Math.sin(this.t * 1.8) * 0.16)
      c.fillStyle = PAL.inkFaint
      c.font = `300 ${sc * 0.92}px ${FONT_BODY}`
      c.letterSpacing = '0.26em'
      c.fillText(`${DEMO_FIM.toUpperCase()}  ·  F5 PARA RECOMEÇAR`, cssW / 2, cssH - sc * 3)
      c.letterSpacing = '0em'
    }
    c.restore()
  }
}
