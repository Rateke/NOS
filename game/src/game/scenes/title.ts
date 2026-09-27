import type { Scene, SceneCtx } from './types'
import { FONT_BODY, FONT_TITLE } from '../systems/dialogue'
import { audio } from '../../engine/audio'
import { musica, Trilha, TEMA_MENU, DURACAO_MENU } from '../../engine/musica'
import { Particulas } from '../world/particulas'
import { PAL, WORLD_W, WORLD_H } from '../../engine/constants'
import { OpeningScene } from './opening'
import { PrologoScene } from './demo/prologo'

type Fase = 'espera' | 'abrindo' | 'pronto' | 'saindo'

/** Ponto de fuga do corredor do fundo. */
const FUGA = { x: WORLD_W / 2, y: 104 }
const ANEIS = 9
/** Segundos parado no menu até a porta do fim abrir. */
const ESPERA_PORTA = 40

/**
 * Menu.
 *
 * Abre em preto absoluto: um toque, e só então a música entra, o fundo
 * aparece e o título se monta — como nos menus que deixam o silêncio fazer o
 * trabalho antes de qualquer coisa acontecer.
 *
 * O fundo é o corredor da casa, em fuga, avançando devagar para sempre. É o
 * que o jogo inteiro é: andar na direção de uma porta que não chega.
 */
export class TitleScene implements Scene {
  readonly id = 'title'

  private fase: Fase = 'espera'
  private t = 0
  private desde = 0
  private sel = 0
  private trilha = new Trilha()
  private po = new Particulas()
  caixas: { x: number; y: number; w: number; h: number }[] = []
  /** Tempo sem tocar em nada com o menu aberto. */
  private parado = 0
  /** 0..1: a porta do fim abrindo para quem espera. */
  private abertura = 0
  private bateu = false

  private readonly itens = [
    { rotulo: 'Só mais um', nota: 'demo · a música, a casa e o Tear', cena: () => new PrologoScene() },
    { rotulo: 'Abertura', nota: 'o quarto de Liam', cena: () => new OpeningScene() },
  ]

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt
    this.desde += dt
    this.po.update(dt)
    this.trilha.update(dt)

    if (this.fase === 'espera') {
      if (this.t > 0.7 && (ctx.input.consumeAny() || ctx.input.consumeConfirm())) {
        this.abrir()
      }
      return
    }
    if (this.fase === 'saindo') return

    // Poeira no fundo do corredor, subindo para a luz.
    if (Math.random() < dt * 14) {
      this.po.emitir({
        x: FUGA.x + (Math.random() - 0.5) * 150,
        y: FUGA.y + 40 + Math.random() * 70,
        vx: (Math.random() - 0.5) * 2,
        vy: -(2 + Math.random() * 5),
        vida: 4 + Math.random() * 4,
        total: 8,
        tam: 1,
        cor: 'rgba(236,206,166,',
      })
    }

    if (this.fase !== 'pronto') {
      // Quem já viu a abertura não deve precisar esperar por ela: qualquer
      // toque durante a montagem salta direto para o menu pronto.
      if (this.desde > 4.2 || ctx.input.consumeAny() || ctx.input.consumeConfirm()) {
        this.fase = 'pronto'
        this.desde = Math.max(this.desde, 4.2)
      }
      return
    }

    // Quem espera sem fazer nada vê a porta do fim abrir — e alguém nela.
    if (ctx.input.consumeAny()) this.parado = 0
    else this.parado += dt
    const alvo = this.parado > ESPERA_PORTA ? 1 : 0
    this.abertura += (alvo - this.abertura) * Math.min(1, dt * (alvo ? 0.5 : 3))
    if (this.abertura > 0.6 && !this.bateu) {
      this.bateu = true
      audio.bater(3, 0)
      if (ctx.state.descobrir('porta-menu')) window.setTimeout(() => audio.segredo(), 1400)
    }

    if (ctx.input.consumeKey('ArrowUp') || ctx.input.consumeKey('KeyW')) this.mover(-1)
    if (ctx.input.consumeKey('ArrowDown') || ctx.input.consumeKey('KeyS')) this.mover(1)

    const tap = ctx.input.consumeTap()
    let clicou = false
    if (tap) {
      const i = this.caixas.findIndex(
        (r) => tap.x >= r.x && tap.x <= r.x + r.w && tap.y >= r.y && tap.y <= r.y + r.h,
      )
      if (i >= 0) {
        this.sel = i
        clicou = true
      }
    }

    if (clicou || ctx.input.consumeConfirm()) {
      this.fase = 'saindo'
      this.desde = 0
      musica.nota(146.83, 0.6, 5)
      this.trilha.parar()
      musica.setPad(0.2, 2)
      const item = this.itens[this.sel]
      if (item) ctx.transition(item.cena(), 2.2, 0.6)
    }
  }

  /** O primeiro toque: é aqui que o som do jogo começa a existir. */
  private abrir(): void {
    this.fase = 'abrindo'
    this.desde = 0
    audio.init()
    audio.resume()
    audio.startAmbient()
    audio.setAmbient(0.2, 6)
    musica.desafinado = 0
    musica.abafado = 0.1
    musica.iniciarPad()
    musica.setPad(0.34, 8)
    this.trilha.iniciar(TEMA_MENU, DURACAO_MENU)
  }

  private mover(d: number): void {
    this.sel = (this.sel + d + this.itens.length) % this.itens.length
    audio.interact()
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    const entrada = this.fase === 'espera' ? 0 : Math.min(1, this.desde / 3.4)
    const saida = this.fase === 'saindo' ? Math.min(1, this.desde / 2) : 0
    const luz = entrada * (1 - saida)

    this.drawCorredor(w, luz)
    this.po.draw(w, true)
    ctx.display.applyGrain(0.04 + (1 - luz) * 0.02)
    // Respiração lenta da câmera: o corredor nunca para de se aproximar.
    ctx.display.present({
      rgbSplit: 0, wave: 0, shake: 0,
      zoom: 1.06 + Math.sin(this.t * 0.16) * 0.03 + saida * 0.12,
      alvoX: FUGA.x, alvoY: 112,
      time: this.t,
    })
    ctx.display.vignette(0.74)
    this.drawVeu(ctx, luz)

    if (this.fase === 'espera') this.drawEspera(ctx)
    else this.drawMenu(ctx, luz)
  }

  /**
   * Corredor em fuga: anéis que crescem a partir do ponto de fuga e se
   * apagam ao passar pela câmera. Nunca chega no fim.
   */
  private drawCorredor(c: CanvasRenderingContext2D, luz: number): void {
    c.fillStyle = '#04050a'
    c.fillRect(0, 0, WORLD_W, WORLD_H)

    // Halo da porta ao fundo
    c.save()
    c.globalCompositeOperation = 'lighter'
    const g = c.createRadialGradient(FUGA.x, FUGA.y, 2, FUGA.x, FUGA.y, 130)
    g.addColorStop(0, `rgba(255,214,158,${0.3 * luz})`)
    g.addColorStop(0.3, `rgba(214,148,92,${0.09 * luz})`)
    g.addColorStop(1, 'rgba(214,148,92,0)')
    c.fillStyle = g
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    c.restore()

    for (let i = 0; i < ANEIS; i++) {
      const z = ((i / ANEIS + this.t * 0.028) % 1 + 1) % 1
      const escala = Math.exp(z * 3.3)
      const lw = 30 * escala
      const lh = 21 * escala
      // Some quando nasce longe e quando passa perto demais.
      const a = Math.min(1, z / 0.18) * Math.max(0, 1 - Math.max(0, z - 0.72) / 0.28)
      if (a <= 0.01) continue
      c.strokeStyle = `rgba(150,158,186,${0.13 * a * luz})`
      c.lineWidth = Math.max(1, escala * 0.5)
      c.strokeRect(FUGA.x - lw, FUGA.y - lh, lw * 2, lh * 2)
      // Batente de porta de um dos lados, alternando
      c.fillStyle = `rgba(10,13,20,${0.5 * a * luz})`
      const bx = i % 2 === 0 ? FUGA.x - lw : FUGA.x + lw - lw * 0.16
      c.fillRect(bx, FUGA.y - lh * 0.55, lw * 0.16, lh * 1.55)
    }

    // A porta do fim, sempre pequena e sempre acesa. Para quem espera, ela
    // abre um pouco — e tem alguém parado no vão, mais alto que Liam.
    const ab = this.abertura
    const meia = 4 + ab * 3
    c.fillStyle = `rgba(255,226,180,${(0.5 + ab * 0.3) * luz})`
    c.fillRect(FUGA.x - meia, FUGA.y - 7 - ab * 2, meia * 2, 14 + ab * 2)
    c.fillStyle = `rgba(255,240,214,${(0.7 + ab * 0.3) * luz})`
    c.fillRect(FUGA.x - meia + 2, FUGA.y - 5 - ab * 2, meia * 2 - 4, 10 + ab * 2)
    if (ab > 0.05) {
      const a = Math.min(1, (ab - 0.05) * 1.6) * luz
      c.fillStyle = `rgba(8,6,10,${a})`
      c.fillRect(FUGA.x - 1, FUGA.y - 4, 3, 3)
      c.fillRect(FUGA.x - 2, FUGA.y - 1, 5, 7)
      c.fillRect(FUGA.x - 1, FUGA.y + 6, 1, 2)
      c.fillRect(FUGA.x + 1, FUGA.y + 6, 1, 2)
      // Cabelo comprido caindo nos ombros
      c.fillRect(FUGA.x - 2, FUGA.y - 3, 1, 4)
      c.fillRect(FUGA.x + 2, FUGA.y - 3, 1, 4)
      // A sombra dela se esticando pelo chão do corredor, na direção da câmera
      const sg = c.createLinearGradient(0, FUGA.y + 8, 0, FUGA.y + 60)
      sg.addColorStop(0, `rgba(0,0,0,${0.5 * a})`)
      sg.addColorStop(1, 'rgba(0,0,0,0)')
      c.fillStyle = sg
      c.beginPath()
      c.moveTo(FUGA.x - 2, FUGA.y + 8)
      c.lineTo(FUGA.x + 3, FUGA.y + 8)
      c.lineTo(FUGA.x + 10, FUGA.y + 60)
      c.lineTo(FUGA.x - 8, FUGA.y + 60)
      c.fill()
    }
  }

  /**
   * Escurece a faixa de cima e a de baixo, onde moram o título e o menu,
   * e deixa a faixa do meio livre para a porta no fim do corredor. Sem isso
   * o texto briga com os anéis e nada se lê direito.
   */
  private drawVeu(ctx: SceneCtx, luz: number): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    c.save()
    const cima = c.createLinearGradient(0, 0, 0, cssH * 0.5)
    cima.addColorStop(0, `rgba(3,4,8,${0.9 * luz})`)
    cima.addColorStop(1, 'rgba(3,4,8,0)')
    c.fillStyle = cima
    c.fillRect(0, 0, cssW, cssH * 0.5)
    const baixo = c.createLinearGradient(0, cssH, 0, cssH * 0.46)
    baixo.addColorStop(0, `rgba(3,4,8,${0.94 * luz})`)
    baixo.addColorStop(1, 'rgba(3,4,8,0)')
    c.fillStyle = baixo
    c.fillRect(0, cssH * 0.46, cssW, cssH * 0.54)
    c.restore()
  }

  /** Antes de tudo: preto e uma linha só. */
  private drawEspera(ctx: SceneCtx): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    c.fillStyle = '#000'
    c.fillRect(0, 0, cssW, cssH)
    const s = Math.max(12, Math.min(cssW / 66, 19))
    c.save()
    c.textAlign = 'center'
    c.font = `300 ${s}px ${FONT_BODY}`
    c.letterSpacing = '0.42em'
    c.globalAlpha = 0.2 + Math.sin(this.t * 1.5) * 0.18
    c.fillStyle = PAL.ink
    const toque = 'ontouchstart' in window ? 'TOQUE PARA COMEÇAR' : 'CLIQUE PARA COMEÇAR'
    c.fillText(toque, cssW / 2, cssH * 0.62)
    c.restore()
  }

  private drawMenu(ctx: SceneCtx, luz: number): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    c.save()
    c.textAlign = 'center'

    // O título se monta antes do menu.
    const aTit = Math.max(0, Math.min(1, (this.desde - 0.9) / 2.4)) * (1 - (this.fase === 'saindo' ? Math.min(1, this.desde / 1.4) : 0))
    const tam = Math.max(56, Math.min(cssW / 6.4, 176))
    c.globalAlpha = aTit
    c.fillStyle = PAL.ink
    c.font = `400 ${tam}px ${FONT_TITLE}`
    c.letterSpacing = `${0.26 - aTit * 0.04}em`
    c.fillText('NÓS', cssW / 2 + tam * 0.12, cssH * 0.3)
    c.letterSpacing = '0em'

    // Fio fino sob o título
    c.globalAlpha = aTit * 0.35
    c.fillStyle = PAL.accent
    const fio = tam * 1.4 * aTit
    c.fillRect(cssW / 2 - fio / 2, cssH * 0.3 + tam * 0.2, fio, 1)

    const s = Math.max(14, Math.min(cssW / 58, 24))
    let y = cssH * 0.68
    this.caixas = []
    for (const [i, item] of this.itens.entries()) {
      const a = Math.max(0, Math.min(1, (this.desde - 2.4 - i * 0.45) / 1.2)) * luz
      const ativo = i === this.sel && this.fase === 'pronto'
      this.caixas.push({ x: cssW * 0.24, y: y - s * 1.3, w: cssW * 0.52, h: s * 2.6 })

      c.globalAlpha = a * (ativo ? 1 : 0.42)
      c.fillStyle = ativo ? PAL.ink : PAL.inkDim
      c.font = `${ativo ? 400 : 300} ${s * (ativo ? 1.16 : 1.04)}px ${FONT_TITLE}`
      c.letterSpacing = '0.16em'
      c.fillText(item.rotulo.toUpperCase(), cssW / 2, y)
      c.letterSpacing = '0em'

      if (ativo) {
        // Marcador: dois fios que se abrem a partir do item selecionado.
        const pulso = 0.5 + Math.sin(this.t * 2.2) * 0.22
        c.globalAlpha = a * pulso
        c.fillStyle = PAL.accent
        const larg = s * 3.2
        c.fillRect(cssW / 2 - larg - s * 4.6, y - s * 0.34, larg, 1)
        c.fillRect(cssW / 2 + s * 4.6, y - s * 0.34, larg, 1)

        c.globalAlpha = a * 0.5
        c.fillStyle = PAL.inkDim
        c.font = `300 italic ${s * 0.72}px ${FONT_BODY}`
        c.fillText(item.nota, cssW / 2, y + s * 1.5)
      }
      y += s * 3.9
    }

    const aPe = Math.max(0, Math.min(1, (this.desde - 4) / 1.6)) * luz
    c.globalAlpha = aPe * 0.34
    c.fillStyle = PAL.inkDim
    c.font = `300 ${s * 0.66}px ${FONT_BODY}`
    c.letterSpacing = '0.2em'
    const dica = 'ontouchstart' in window ? 'TOQUE PARA ESCOLHER' : 'CLIQUE, OU ↑ ↓ E ESPAÇO'
    c.fillText(dica, cssW / 2, cssH - s * 2.4)
    c.restore()
  }
}
