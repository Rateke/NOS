import type { Scene, SceneCtx } from '../types'
import { Dialogue, FONT_BODY } from '../../systems/dialogue'
import { PAL } from '../../../engine/constants'
import { Figura } from '../../world/figura'
import { Particulas } from '../../world/particulas'
import { drawSalaFundo, drawSalaFrente, drawLuzSala, ABAJUR, ASSENTO_Y } from '../../world/sala'
import { audio } from '../../../engine/audio'
import {
  PROLOGO_ABERTURA, PROLOGO_ENSINO, PROLOGO_ACERTO, PROLOGO_ERRO, PROLOGO_DICA,
  FRASE_MUSICAL,
} from '../../content/demoScript'
import { MesaScene } from './mesa'

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

  private adrian = new Figura({
    x: 152, y: ASSENTO_Y, altura: 40,
    cor: { roupa: '#2b2129', cabelo: '#171017', pele: '#6a4f48', sombra: 'rgba(0,0,0,0.42)' },
    pose: 'sentado',
  })
  private liam = new Figura({
    x: 200, y: ASSENTO_Y, altura: 31,
    cor: { roupa: '#252a3a', cabelo: '#12151f', pele: '#6d5a52', sombra: 'rgba(0,0,0,0.42)' },
    pose: 'sentado',
  })
  private po = new Particulas()
  private dedilhado = 0
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
    this.animar(dt)
    this.brilhoTecla = Math.max(0, this.brilhoTecla - dt * 2.4)
    this.dialogue.update(dt)

    if (this.dialogue.active) {
      if (ctx.input.consumeConfirm()) this.dialogue.confirm()
      // Na vez do jogador as teclas respondem mesmo com a fala na tela: ele
      // vai tentar tocar assim que vir as teclas, e engolir essa nota em
      // silêncio parece o jogo travado.
      if (this.fase !== 'sua-vez') return
    }

    if (this.fase === 'ele-toca') this.eleToca(ctx)
    else if (this.fase === 'sua-vez') this.suaVez(ctx)
    else if (this.fase === 'saida') this.sair(dt, ctx)
  }

  /**
   * Nada aqui é entrada do jogador: é a cena respirando sozinha. Adrian olha
   * para o instrumento enquanto toca e para o filho quando fala; Liam olha
   * para as mãos do pai. A poeira só existe dentro do cone do abajur.
   */
  private animar(dt: number): void {
    this.adrian.update(dt)
    this.liam.update(dt)
    this.po.update(dt)

    if (Math.random() < dt * 22 * this.calor) {
      this.po.poeira(ABAJUR.x - 42, ABAJUR.y + 6, 84, 70)
    }

    this.dedilhado = Math.max(0, this.dedilhado - dt * 3)
    const tocando = this.fase === 'ele-toca'
    const vezDele = this.fase === 'sua-vez'

    this.adrian.braco = 0.55 + this.dedilhado * 0.3
    this.adrian.olhar = tocando ? -0.25 : 0.7
    this.liam.olhar = -0.8
    this.liam.braco = vezDele ? 0.45 + this.brilhoTecla * 0.35 : 0.1

    // Na saída, o calor indo embora também encolhe os dois.
    if (this.fase === 'saida') {
      this.adrian.olhar = 0
      this.liam.curvatura = Math.min(0.5, this.saida * 0.14)
    }
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
    this.dedilhado = 1
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
    this.dedilhado = 1

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
      ctx.transition(new MesaScene(), 2.4, 2.0)
    }
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    const k = this.calor

    drawSalaFundo(w, k)
    this.adrian.draw(w, ABAJUR.x)
    this.liam.draw(w, ABAJUR.x)
    this.drawViolao(w, k)
    drawSalaFrente(w, k)
    this.po.draw(w, true)
    drawLuzSala(w, k, this.t)

    ctx.display.applyGrain(0.045)
    // A câmera entra devagar enquanto ele ensina e recua quando o calor sai:
    // a sala volta a ficar grande demais no fim.
    const entrada = Math.min(1, this.t / 26)
    const recuo = this.fase === 'saida' ? Math.min(1, this.saida / 4) : 0
    ctx.display.present({
      rgbSplit: 0,
      wave: 0,
      shake: 0,
      zoom: 1.32 + entrada * 0.16 - recuo * 0.44,
      alvoX: 176 + entrada * 6,
      alvoY: 116 - recuo * 6,
      time: this.t,
    })
    ctx.display.vignette(0.6 + (1 - k) * 0.26)

    if (this.fase === 'sua-vez') this.desenharTeclas(ctx)
    this.dialogue.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
  }

  /** O violão no colo de Adrian, com a mão dele batendo nas cordas. */
  private drawViolao(c: CanvasRenderingContext2D, k: number): void {
    const x = this.adrian.x
    const y = ASSENTO_Y - 10
    c.fillStyle = k > 0.5 ? '#5a3a2c' : '#2f3548'
    c.fillRect(x - 4, y, 22, 12)
    c.fillRect(x + 16, y + 3, 16, 5)
    c.fillStyle = k > 0.5 ? '#3a2318' : '#20263a'
    c.fillRect(x + 3, y + 4, 6, 5)
    c.fillStyle = k > 0.5 ? '#6f4a36' : '#3a4159'
    c.fillRect(x - 4, y, 22, 1)
    // Cordas, brilhando no instante do dedilhado
    c.fillStyle = `rgba(255,232,196,${0.14 + this.dedilhado * 0.55})`
    for (let i = 0; i < 3; i++) c.fillRect(x - 2, y + 3 + i * 3, 32, 1)
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
