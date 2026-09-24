import type { Scene, SceneCtx } from '../types'
import { Dialogue, FONT_BODY } from '../../systems/dialogue'
import { PAL, WORLD_W, WORLD_H } from '../../../engine/constants'
import { audio } from '../../../engine/audio'
import {
  PROLOGO_ABERTURA, PROLOGO_ENSINO, PROLOGO_ACERTO, PROLOGO_ERRO, PROLOGO_DICA,
  FRASE_MUSICAL,
} from '../../content/demoScript'
import { TearScene } from './tear'

/**
 * As quatro notas. Cada uma aceita a seta ou a letra equivalente do WASD,
 * para a mão poder ficar onde o jogador estiver acostumado.
 */
const TECLAS: readonly (readonly string[])[] = [
  ['ArrowLeft', 'KeyA'],
  ['ArrowUp', 'KeyW'],
  ['ArrowRight', 'KeyD'],
  ['ArrowDown', 'KeyS'],
]
const NOTAS = [261.63, 329.63, 392.0, 493.88]
const NOMES = ['←', '↑', '→', '↓']
const LETRAS = ['A', 'W', 'D', 'S']

type Fase = 'entrada' | 'ele-toca' | 'sua-vez' | 'acerto' | 'saida'

/**
 * A Música. Único momento quente da obra: luz âmbar, som com corpo, e um pai
 * que está de fato ensinando o filho. O elogio do fim é que planta a função —
 * e é por isso que o Tear, depois, dói.
 */
export class PrologoScene implements Scene {
  readonly id = 'demo-prologo'

  private dialogue = new Dialogue()
  private fase: Fase = 'entrada'
  private t = 0
  private idxDemo = 0
  private idxJogador = 0
  private ultimaTecla = -1
  private brilhoTecla = 0
  private proxNota = 0
  private calor = 0
  private saida = 0
  /** Onde as quatro teclas foram desenhadas, para poderem ser clicadas. */
  private caixas: { x: number; y: number; w: number; h: number }[] = []

  enter(): void {
    audio.setAmbient(0.22, 2)
    this.dialogue.play(PROLOGO_ABERTURA, () => {
      this.fase = 'ele-toca'
      this.proxNota = this.t + 0.6
    })
  }

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt
    this.calor = Math.min(1, this.calor + dt / 2.5)
    this.brilhoTecla = Math.max(0, this.brilhoTecla - dt * 2.4)
    this.dialogue.update(dt)

    if (this.dialogue.active) {
      if (ctx.input.consumeConfirm()) this.dialogue.confirm()
      return
    }

    if (this.fase === 'ele-toca') this.eleToca(ctx)
    else if (this.fase === 'sua-vez') this.suaVez(ctx)
    else if (this.fase === 'saida') this.sair(dt, ctx)
  }

  /** Adrian toca a frase; o jogador só escuta e vê. */
  private eleToca(ctx: SceneCtx): void {
    if (this.t < this.proxNota) return
    const nota = FRASE_MUSICAL[this.idxDemo]
    if (nota === undefined || nota < 0 || nota >= TECLAS.length) {
      this.fase = 'sua-vez'
      this.idxJogador = 0
      this.dialogue.play(PROLOGO_ENSINO)
      return
    }
    audio.note(NOTAS[nota] ?? 261.63, 1.1)
    this.ultimaTecla = nota
    this.brilhoTecla = 1
    this.idxDemo++
    this.proxNota = this.t + 0.72
    void ctx
  }

  private suaVez(ctx: SceneCtx): void {
    let tocada = TECLAS.findIndex((teclas) => teclas.some((k) => ctx.input.consumeKey(k)))
    if (tocada < 0) {
      // Também dá para tocar clicando na tecla desenhada.
      const tap = ctx.input.consumeTap()
      if (tap) {
        tocada = this.caixas.findIndex(
          (r) => tap.x >= r.x && tap.x <= r.x + r.w && tap.y >= r.y && tap.y <= r.y + r.h,
        )
      }
    }
    if (tocada < 0) return

    audio.note(NOTAS[tocada] ?? 261.63, 0.9)
    this.ultimaTecla = tocada
    this.brilhoTecla = 1

    if (FRASE_MUSICAL[this.idxJogador] === tocada) {
      this.idxJogador++
      if (this.idxJogador >= FRASE_MUSICAL.length) {
        this.fase = 'acerto'
        this.dialogue.play(PROLOGO_ACERTO, () => {
          this.fase = 'saida'
          this.saida = 0
          audio.setAmbient(0.5, 4)
        })
      }
    } else {
      this.idxJogador = 0
      this.dialogue.play(PROLOGO_ERRO)
    }
  }

  /** O calor vai embora sozinho. Ninguém anuncia. */
  private sair(dt: number, ctx: SceneCtx): void {
    this.saida += dt
    this.calor = Math.max(0, 1 - this.saida / 3.5)
    if (this.saida > 4.5) {
      this.fase = 'entrada'
      ctx.transition(new TearScene(), 2.4, 2.0)
    }
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    this.desenharSala(w)
    ctx.display.applyGrain(0.04)
    ctx.display.present()
    ctx.display.vignette(0.66 + (1 - this.calor) * 0.2)

    if (this.fase === 'sua-vez') this.desenharTeclas(ctx)
    this.dialogue.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
  }

  /**
   * Sala de estar vista de frente. Duas silhuetas lado a lado e um abajur
   * quente — a paleta inteira puxada para o âmbar enquanto `calor` está alto.
   */
  private desenharSala(c: CanvasRenderingContext2D): void {
    const k = this.calor
    const mix = (frio: string, quente: string): string => (k > 0.5 ? quente : frio)

    c.fillStyle = mix('#0b0e16', '#171219')
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    c.fillStyle = mix('#141926', '#231a20')
    c.fillRect(0, 0, WORLD_W, 132)
    c.fillStyle = mix('#181d2a', '#2a1f24')
    c.fillRect(0, 132, WORLD_W, WORLD_H - 132)

    // Abajur: a fonte de calor da cena
    c.fillStyle = '#3a2c2a'
    c.fillRect(300, 96, 4, 36)
    c.fillStyle = `rgba(255,214,150,${0.5 + k * 0.4})`
    c.fillRect(292, 84, 20, 12)

    // Sofá
    c.fillStyle = mix('#232a3a', '#33242a')
    c.fillRect(96, 116, 150, 26)
    c.fillStyle = mix('#2c3446', '#3d2c33')
    c.fillRect(96, 110, 150, 8)

    // Adrian, maior, de lado; Liam ao lado, menor
    this.silhueta(c, 150, 130, 26, '#120f14')
    this.silhueta(c, 186, 132, 19, '#0f0d12')

    // Instrumento no colo de Adrian
    c.fillStyle = mix('#3a4358', '#4a3630')
    c.fillRect(140, 118, 30, 7)

    // Halo do abajur
    c.save()
    c.globalCompositeOperation = 'lighter'
    const g = c.createRadialGradient(302, 92, 6, 302, 92, 190)
    g.addColorStop(0, `rgba(255,206,146,${0.3 * (0.35 + k * 0.65)})`)
    g.addColorStop(0.4, `rgba(226,150,92,${0.12 * (0.35 + k * 0.65)})`)
    g.addColorStop(1, 'rgba(226,150,92,0)')
    c.fillStyle = g
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    c.restore()
  }

  private silhueta(c: CanvasRenderingContext2D, x: number, base: number, alt: number, cor: string): void {
    c.fillStyle = cor
    c.fillRect(x - 7, base - alt, 14, alt)
    c.fillRect(x - 6, base - alt - 9, 12, 10)
    // Contraluz do abajur, do lado direito
    c.fillStyle = `rgba(255,206,146,${0.18 + this.calor * 0.22})`
    c.fillRect(x + 5, base - alt - 9, 2, alt + 9)
  }

  /** As quatro teclas, com a última tocada acesa. */
  private desenharTeclas(ctx: SceneCtx): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const s = Math.max(30, Math.min(cssW / 18, 60))
    const total = s * 4 + s * 0.5 * 3
    let x = (cssW - total) / 2
    const y = cssH * 0.62

    c.save()
    c.textAlign = 'center'
    c.font = `${Math.round(s * 0.5)}px ${FONT_BODY}`
    this.caixas = []
    for (let i = 0; i < 4; i++) {
      this.caixas.push({ x, y, w: s, h: s })
      const aceso = i === this.ultimaTecla ? this.brilhoTecla : 0
      const feito = i < this.idxJogador
      c.fillStyle = `rgba(20,25,38,${0.72 + aceso * 0.2})`
      c.fillRect(x, y, s, s)
      c.strokeStyle = aceso > 0
        ? `rgba(255,206,146,${0.4 + aceso * 0.6})`
        : 'rgba(134,142,162,0.28)'
      c.lineWidth = 2
      c.strokeRect(x + 1, y + 1, s - 2, s - 2)
      c.fillStyle = aceso > 0 ? '#ffd79a' : feito ? PAL.accent : PAL.inkDim
      c.font = `${Math.round(s * 0.46)}px ${FONT_BODY}`
      c.fillText(NOMES[i] ?? '', x + s / 2, y + s * 0.52)
      c.globalAlpha = aceso > 0 ? 0.85 : 0.42
      c.font = `${Math.round(s * 0.26)}px ${FONT_BODY}`
      c.fillText(LETRAS[i] ?? '', x + s / 2, y + s * 0.84)
      c.globalAlpha = 1
      c.font = `${Math.round(s * 0.5)}px ${FONT_BODY}`
      x += s * 1.5
    }

    // A dica vai abaixo das teclas: ali o chão está vazio. Em cima do sofá
    // ela ficava ilegível.
    const dicaSize = Math.round(s * 0.3)
    c.font = `${dicaSize}px ${FONT_BODY}`
    const larg = c.measureText(PROLOGO_DICA).width
    c.fillStyle = 'rgba(8,6,10,0.55)'
    c.fillRect((cssW - larg) / 2 - dicaSize, y + s * 1.05, larg + dicaSize * 2, dicaSize * 2)
    c.fillStyle = PAL.inkDim
    c.globalAlpha = 0.66
    c.fillText(PROLOGO_DICA, cssW / 2, y + s * 1.05 + dicaSize * 1.4)
    c.restore()
  }
}
