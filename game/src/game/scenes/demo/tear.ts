import type { Scene, SceneCtx } from '../types'
import { Dialogue, FONT_BODY } from '../../systems/dialogue'
import { PAL, WORLD_W, WORLD_H } from '../../../engine/constants'
import { audio } from '../../../engine/audio'
import {
  TEAR_CHEGADA, ADRIAN_DURANTE, ADRIAN_INSISTE, FRAGMENTOS, CORPO,
  TEAR_FIM, ELISA_CORTE, TEAR_PIANO, TEAR_ERRO,
} from '../../content/demoScript'
import { FimScene } from './fim'
import { Figura } from '../../world/figura'
import { Piano } from '../../systems/piano'
import { RELIQUIAS, desenharReliquia } from '../../world/reliquias'
import type { TipoReliquia } from '../../world/reliquias'
import { musica, TEMA } from '../../../engine/musica'
import { Particulas } from '../../world/particulas'

const LIAM = { x: WORLD_W / 2, y: 150 }
const NOTAS_FIO = [147, 165, 185, 196, 220, 233]

interface Fio {
  x0: number
  cor: string
  fase: number
  puxado: number
  absorvido: boolean
  /**
   * O que está amarrado na outra ponta. O roteiro diz que os fios unem
   * objetos e lembranças de gerações diferentes — então cada um carrega uma
   * relíquia, que balança e cai quando o fio é absorvido.
   */
  relíquia: TipoReliquia
  balanco: number
}

interface Eco {
  texto: string
  x: number
  y: number
  vida: number
  total: number
  escala: number
}

type Fase = 'chegada' | 'absorvendo' | 'pico' | 'corte' | 'silencio'

/**
 * A câmara do Tear.
 *
 * A cena inteira é construída em torno de uma ideia: **o jogador faz a coisa
 * ruim com as próprias mãos, e é recompensado por isso.** Cada fio absorvido
 * acalma a discussão lá em cima — que é exatamente o que Liam quer — e ao
 * mesmo tempo racha a imagem, empilha uma dissonância no som e enfia em Liam
 * uma lembrança que não é dele. Não existe tela de fracasso e ninguém manda
 * parar. Parar só faz a pressão subir.
 */
export class TearScene implements Scene {
  readonly id = 'demo-tear'

  private dialogue = new Dialogue()
  private fase: Fase = 'chegada'
  private t = 0
  private fios: Fio[] = []
  private sel = 0
  private ecos: Eco[] = []
  private intensidade = 0
  private ocioso = 0
  private idxInsiste = 0
  private proxBatida = 0
  private tPico = 0
  private tCorte = 0
  private falaAdrian = ''
  private falaAdrianAte = 0
  private po = new Particulas()
  private piano = new Piano()
  /** Posição dentro da frase exigida pelo fio selecionado. */
  private passo = 0
  private errosFio = 0
  private jolt = 0
  private liam = new Figura({
    x: LIAM.x, y: LIAM.y, altura: 34,
    cor: { roupa: '#141926', cabelo: '#080b12', pele: '#5c4c46', sombra: 'rgba(0,0,0,0.55)' },
  })

  /** Exposto para o clique nas teclas e para os testes. */
  get caixas(): { x: number; y: number; w: number; h: number }[] {
    return this.piano.caixas
  }

  /** A frase do tema que este fio exige. Ciclam, e crescem. */
  private fraseDoFio(indice: number): readonly number[] {
    return TEMA[indice % TEMA.length] ?? []
  }

  enter(): void {
    const cores = ['#6f86a8', '#8a6f9e', '#9e7a6f', '#6f9e8a', '#9e6f85', '#7a8a9e']
    const relíquias = RELIQUIAS
    this.fios = cores.map((cor, i) => ({
      x0: 46 + i * 58,
      cor,
      fase: i * 1.7,
      puxado: 0,
      absorvido: false,
      relíquia: relíquias[i] ?? 'carta',
      balanco: i * 0.9,
    }))
    audio.startAmbient()
    audio.setAmbient(0.5, 1)
    audio.startArgument()
    audio.setArgument(0.32, 2)
    // O piano volta desafinado e abafado: é o mesmo instrumento, estragado.
    musica.desafinado = -0.35
    musica.abafado = 0.45
    musica.setPad(0.35, 3)
    this.dialogue.play(TEAR_CHEGADA, () => {
      this.dialogue.play(TEAR_PIANO, () => {
        this.fase = 'absorvendo'
      })
    })
  }

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt
    this.dialogue.update(dt)
    for (const f of this.fios) f.fase += dt * 0.7
    this.ecos = this.ecos.filter((e) => (e.vida -= dt) > 0)
    this.baterCoracao()
    this.animar(dt)

    if (this.dialogue.active) {
      const cinematico = this.fase === 'pico' || this.fase === 'corte'
      if (!cinematico && ctx.input.consumeConfirm()) this.dialogue.confirm()
      // Nos clímaxes a fala corre sozinha, mas a cena continua andando por
      // baixo: a distorção e a batida não param para esperar o jogador.
      if (!cinematico && this.fase !== 'absorvendo') return
      if (cinematico) {
        /* o clímax roda por baixo da fala */
      } else if (this.dialogue.active && this.fase === 'absorvendo') {
        // As teclas respondem durante a fala: o jogador vai tentar tocar.
      }
    }

    if (this.fase === 'absorvendo') this.absorver(dt, ctx)
    else if (this.fase === 'pico') this.pico(dt)
    else if (this.fase === 'corte') this.corte(dt, ctx)
  }

  /** Vida da cena fora da interação: corpo, brasas, poeira, balanço. */
  private animar(dt: number): void {
    const i = this.intensidade
    this.po.update(dt)
    this.piano.update(dt)
    this.jolt = Math.max(0, this.jolt - dt * 3)
    for (const f of this.fios) f.balanco += dt * (0.5 + f.puxado * 1.6)

    this.liam.update(dt)
    this.liam.ofego = 1 + i * 3.4
    this.liam.curvatura = Math.min(1, i * 0.9)
    this.liam.tremor = i > 0.45 ? (i - 0.45) * 2.6 : 0
    this.liam.braco = this.passo > 0 ? 0.55 + Math.min(0.35, this.passo * 0.08) : 0.15

    // Poeira desprendida do assoalho pela discussão lá em cima.
    if (Math.random() < dt * (7 + i * 16)) {
      this.po.poeira(24, 30, WORLD_W - 48, 4, 'rgba(190,180,200,')
    }
    // Brasas saindo de Liam: só aparecem quando ele já está cheio.
    if (i > 0.3 && Math.random() < dt * i * 34) {
      this.po.brasa(LIAM.x + (Math.random() - 0.5) * 16, LIAM.y - 18)
    }
  }

  /** A batida acelera com a intensidade: de calma a taquicardia. */
  private baterCoracao(): void {
    if (this.fase === 'silencio' || this.fase === 'chegada') return
    const intervalo = 1.15 - this.intensidade * 0.62
    if (this.t >= this.proxBatida) {
      this.proxBatida = this.t + intervalo
      audio.heartbeat(0.1 + this.intensidade * 0.14)
    }
  }

  /**
   * Absorver deixou de ser segurar um botão: agora é **tocar a melodia** que
   * Adrian ensinou no prólogo, no mesmo piano, desafinado. Cada fio pede uma
   * frase do tema, e as frases crescem. Errar uma nota faz o fio chicotear de
   * volta e Adrian pedir, com toda a calma, de novo do começo.
   */
  private absorver(dt: number, ctx: SceneCtx): void {
    const vivos = this.fios.filter((f) => !f.absorvido)
    if (vivos.length === 0) {
      this.fase = 'pico'
      this.tPico = 0
      this.dialogue.play(TEAR_FIM, undefined, 1.6)
      return
    }

    if (ctx.input.consumeKey('ArrowLeft')) this.mover(-1)
    if (ctx.input.consumeKey('ArrowRight')) this.mover(1)

    const fio = this.fios[this.sel]
    if (!fio || fio.absorvido) {
      this.mover(1)
      return
    }

    const frase = this.fraseDoFio(this.sel)
    const tocada = this.piano.ler(ctx.input, ctx.display)
    if (tocada === null) {
      this.ocioso += dt
      if (this.ocioso > 5.5) {
        this.ocioso = 0
        const fala = ADRIAN_INSISTE[this.idxInsiste % ADRIAN_INSISTE.length]
        this.idxInsiste++
        this.dizer(fala ?? '', 3.2)
        audio.setArgument(0.3 + this.intensidade * 0.3 + 0.1, 1)
      }
      return
    }

    this.ocioso = 0
    if (frase[this.passo] === tocada) {
      this.passo++
      fio.puxado = this.passo / Math.max(1, frase.length)
      if (this.passo >= frase.length) this.concluir(fio)
      return
    }

    // Nota errada: o fio recua e a cena dá um solavanco.
    this.passo = 0
    fio.puxado = 0
    this.jolt = 1
    audio.refuse()
    const fala = TEAR_ERRO[Math.min(this.errosFio, TEAR_ERRO.length - 1)]
    this.errosFio++
    this.dizer(fala ?? '', 2.8)
  }

  private mover(d: number): void {
    const n = this.fios.length
    for (let i = 1; i <= n; i++) {
      const j = (this.sel + d * i + n * 2) % n
      if (!this.fios[j]?.absorvido) {
        this.sel = j
        this.passo = 0
        audio.interact()
        return
      }
    }
  }

  /** Um fio a menos lá em cima, uma voz a mais aqui dentro. */
  private concluir(fio: Fio): void {
    fio.absorvido = true
    fio.puxado = 1
    this.passo = 0
    const feitos = this.fios.filter((f) => f.absorvido).length
    this.intensidade = feitos / this.fios.length

    audio.addLayer(NOTAS_FIO[feitos - 1] ?? 147, 'sine', 0.055)
    // O instrumento estraga mais a cada fio: desafina e fecha.
    musica.desafinado = -0.35 - this.intensidade * 1.1
    musica.abafado = 0.45 + this.intensidade * 0.45
    audio.setArgument(Math.max(0, 0.34 - this.intensidade * 0.3), 1.6)
    audio.reveal()

    const frag = FRAGMENTOS[feitos - 1]
    if (frag) {
      this.ecos.push({
        texto: frag.fala, x: 0.5, y: 0.3,
        vida: 3.4, total: 3.4, escala: 1.35,
      })
      this.ecos.push({
        texto: `(${frag.dono})`, x: 0.5, y: 0.38,
        vida: 3.0, total: 3.0, escala: 0.8,
      })
    }
    // A partir da metade, a dúvida de quem é aquilo começa a aparecer sozinha.
    if (feitos >= 3) {
      const corpo = CORPO[(feitos - 3) % CORPO.length]
      this.ecos.push({
        texto: corpo ?? '', x: 0.18 + Math.random() * 0.64, y: 0.46 + Math.random() * 0.1,
        vida: 2.6, total: 2.6, escala: 0.75,
      })
    }

    const fala = ADRIAN_DURANTE[feitos - 1]
    if (fala) this.dizer(fala, 3.6)
    this.mover(1)
    this.errosFio = 0
  }

  private dizer(texto: string, dur: number): void {
    this.falaAdrian = texto
    this.falaAdrianAte = this.t + dur
  }

  private pico(dt: number): void {
    this.tPico += dt
    this.intensidade = Math.min(1.5, 1 + this.tPico * 0.22)
    audio.setArgument(0, 1)
    if (this.tPico > 2.6 && this.fase === 'pico') {
      this.fase = 'corte'
      this.tCorte = 0
      this.dialogue.play(ELISA_CORTE, () => {
        // O corte é um silêncio absoluto, não uma explosão.
        audio.cutAll(0.12)
      }, 0.9)
    }
  }

  private corte(dt: number, ctx: SceneCtx): void {
    this.tCorte += dt
    if (this.tCorte > 1.1 && this.fase === 'corte') {
      this.fase = 'silencio'
      this.intensidade = 0
      ctx.transition(new FimScene(), 1.4, 2.2)
    }
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    this.desenharCamara(w)
    for (const f of this.fios) this.desenharFio(w, f)
    this.desenharLiam(w)

    this.po.draw(w, true)

    const i = this.intensidade
    ctx.display.applyGrain(0.05 + i * 0.09)
    // A câmera fecha sobre ele conforme enche: o espaço some junto.
    ctx.display.present({
      rgbSplit: i * 2.6,
      wave: i * 1.5,
      shake: i * i * 1.6 + this.jolt * 2.2,
      zoom: 1 + i * 0.4,
      alvoX: WORLD_W / 2,
      alvoY: WORLD_H / 2 + i * 16,
      time: this.t,
    })
    ctx.display.vignette(0.68 + i * 0.22)

    this.desenharEcos(ctx)
    if (this.fase === 'absorvendo') {
      this.piano.draw(ctx.display, { fantasma: true })
      const frase = this.fraseDoFio(this.sel)
      this.piano.drawDica(
        ctx.display,
        `toque a melodia  ·  ${this.passo}/${frase.length}  ·  ← → escolhe o fio`,
      )
    }
    this.desenharAdrian(ctx)
    this.dialogue.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
  }

  private desenharCamara(c: CanvasRenderingContext2D): void {
    c.fillStyle = '#04060a'
    c.fillRect(0, 0, WORLD_W, WORLD_H)

    // Assoalho por cima: frestas de luz, e a discussão vem de lá.
    c.fillStyle = '#0a0d15'
    c.fillRect(0, 0, WORLD_W, 30)
    const tremor = 0.5 + Math.sin(this.t * 9) * 0.5
    for (let x = 0; x < WORLD_W; x += 26) {
      c.fillStyle = `rgba(200,170,120,${(0.05 + tremor * 0.03) * (1 - this.intensidade * 0.5)})`
      c.fillRect(x, 0, 2, 30)
    }

    // Terra batida
    c.fillStyle = '#080b12'
    c.fillRect(0, 162, WORLD_W, WORLD_H - 162)

    // Paredes de terra dos lados, com raízes descendo
    c.fillStyle = '#070a10'
    c.fillRect(0, 30, 16, 132)
    c.fillRect(WORLD_W - 16, 30, 16, 132)
    c.fillStyle = 'rgba(60,48,40,0.3)'
    for (let i = 0; i < 7; i++) {
      const y = 40 + i * 17
      c.fillRect(4, y, 9, 1)
      c.fillRect(WORLD_W - 13, y + 6, 9, 1)
    }

    // Estrutura do tear: montantes, travessa e pinos
    c.fillStyle = '#12161f'
    c.fillRect(16, 30, 7, 132)
    c.fillRect(WORLD_W - 23, 30, 7, 132)
    c.fillRect(16, 30, WORLD_W - 32, 6)
    c.fillStyle = '#1b2130'
    c.fillRect(16, 30, 7, 3)
    c.fillRect(WORLD_W - 23, 30, 7, 3)
    c.fillRect(16, 30, WORLD_W - 32, 2)

    // Escada de descida, ao fundo à esquerda
    c.fillStyle = '#10141d'
    c.fillRect(30, 36, 3, 126)
    c.fillRect(44, 36, 3, 126)
    c.fillStyle = '#161c28'
    for (let y = 44; y < 160; y += 14) c.fillRect(30, y, 17, 2)

    for (const f of this.fios) {
      c.fillStyle = f.absorvido ? '#171c28' : '#232b3c'
      c.fillRect(f.x0 - 2, 34, 4, 5)
      this.desenharRelíquia(c, f)
    }

    // Luz do próprio Tear, que cresce conforme Liam enche
    c.save()
    c.globalCompositeOperation = 'lighter'
    const g = c.createRadialGradient(LIAM.x, LIAM.y - 10, 2, LIAM.x, LIAM.y - 10, 92)
    g.addColorStop(0, `rgba(196,170,224,${0.08 + this.intensidade * 0.3})`)
    g.addColorStop(1, 'rgba(196,170,224,0)')
    c.fillStyle = g
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    c.restore()
  }

  /**
   * A relíquia amarrada na ponta de cada fio. Balança de leve; quando o fio é
   * absorvido, ela fica pendurada, imóvel e apagada — o vínculo saiu dali e
   * foi parar dentro do menino.
   */
  private desenharRelíquia(c: CanvasRenderingContext2D, f: Fio): void {
    const morta = f.absorvido
    const osc = morta ? 0 : Math.sin(f.balanco) * 3
    const x = Math.round(f.x0 + osc)
    const y = 44
    c.save()
    c.globalAlpha = morta ? 0.2 : 0.75
    c.strokeStyle = 'rgba(120,130,150,0.35)'
    c.beginPath()
    c.moveTo(f.x0, 39)
    c.lineTo(x, y)
    c.stroke()
    desenharReliquia(
      c, f.relíquia, x, y,
      morta ? '#1a1f2c' : f.cor,
      morta ? '#10141d' : 'rgba(12,15,22,0.6)',
    )
    c.restore()
  }

  /** Cada fio desce do assoalho até Liam, ondulando como algo vivo. */
  private desenharFio(c: CanvasRenderingContext2D, f: Fio): void {
    const idx = this.fios.indexOf(f)
    const selecionado = idx === this.sel && !f.absorvido
    const passos = 26
    const topo = f.absorvido ? LIAM.y - 14 : 28

    c.lineWidth = selecionado ? 2 : 1
    c.strokeStyle = f.absorvido
      ? `rgba(196,170,224,${0.1 + this.intensidade * 0.14})`
      : f.cor
    c.globalAlpha = f.absorvido ? 0.5 : selecionado ? 1 : 0.42
    c.beginPath()
    for (let i = 0; i <= passos; i++) {
      const t = i / passos
      // Conforme é puxado, a origem desliza para dentro de Liam.
      const x0 = f.x0 + (LIAM.x - f.x0) * f.puxado
      const x = x0 + (LIAM.x - x0) * t + Math.sin(f.fase + t * 5.5) * (1 - t) * 11
      const y = topo + (LIAM.y - 16 - topo) * t
      if (i === 0) c.moveTo(x, y)
      else c.lineTo(x, y)
    }
    c.stroke()
    c.globalAlpha = 1

    if (selecionado) {
      const p = 0.4 + Math.sin(this.t * 6) * 0.25
      c.fillStyle = `rgba(217,178,95,${p})`
      c.fillRect(f.x0 - 3, 26, 6, 3)
    }
  }

  /**
   * Liam no centro. A postura conta o estado: o ofego acelera, o corpo curva
   * e treme, e os fios já absorvidos giram em volta dele — o conflito não
   * sumiu, mudou de lugar.
   */
  private desenharLiam(c: CanvasRenderingContext2D): void {
    const i = this.intensidade
    this.desenharFiosEnrolados(c, Math.round(LIAM.x), Math.round(LIAM.y), i)
    this.liam.draw(c, LIAM.x - 40, `rgba(196,170,224,${0.2 + i * 0.5})`)
    // O que ele segura, brilhando através do peito
    const luz = 0.14 + i * 0.62
    c.fillStyle = `rgba(196,170,224,${luz})`
    c.fillRect(Math.round(LIAM.x) - 6, Math.round(LIAM.y) - 24 + Math.round(i * 5), 12, 3)
    c.fillStyle = `rgba(232,214,255,${luz * 0.8})`
    c.fillRect(Math.round(LIAM.x) - 3, Math.round(LIAM.y) - 24 + Math.round(i * 5), 6, 3)
  }

  /** Os fios já absorvidos, girando em volta dele. */
  private desenharFiosEnrolados(c: CanvasRenderingContext2D, x: number, y: number, i: number): void {
    const feitos = this.fios.filter((f) => f.absorvido)
    if (feitos.length === 0) return
    c.save()
    c.lineWidth = 1
    for (const [k, f] of feitos.entries()) {
      const giro = this.t * (0.5 + k * 0.17) + k * 1.4
      const raioX = 15 + k * 3.5
      const raioY = 9 + k * 2.4
      c.strokeStyle = f.cor
      c.globalAlpha = 0.16 + i * 0.3
      c.beginPath()
      for (let p = 0; p <= 30; p++) {
        const a = giro + (p / 30) * Math.PI * 2
        const px = x + Math.cos(a) * raioX
        const py = y - 22 + Math.sin(a) * raioY + Math.sin(a * 3 + this.t * 2) * 2
        if (p === 0) c.moveTo(px, py)
        else c.lineTo(px, py)
      }
      c.stroke()
    }
    c.restore()
  }

  /** Os fragmentos que entram nele. Aparecem e apagam, sem caixa. */
  private desenharEcos(ctx: SceneCtx): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    c.save()
    c.textAlign = 'center'
    for (const e of this.ecos) {
      const p = e.vida / e.total
      const a = p > 0.8 ? (1 - p) / 0.2 : p / 0.8
      const size = Math.max(14, Math.min(cssW / 30, 42)) * e.escala
      c.font = `${size}px ${FONT_BODY}`
      const jitter = (1 - p) * this.intensidade * 4
      c.globalAlpha = a * 0.16
      c.fillStyle = '#ff5a6e'
      c.fillText(e.texto, cssW * e.x - jitter, cssH * e.y)
      c.globalAlpha = a * 0.16
      c.fillStyle = '#5ad9ff'
      c.fillText(e.texto, cssW * e.x + jitter, cssH * e.y)
      c.globalAlpha = a * 0.82
      c.fillStyle = PAL.ink
      c.fillText(e.texto, cssW * e.x, cssH * e.y)
    }
    c.restore()
  }

  /** Adrian nunca grita. Fica num canto, em voz baixa, e é pior assim. */
  private desenharAdrian(ctx: SceneCtx): void {
    if (this.t > this.falaAdrianAte || !this.falaAdrian) return
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const size = Math.max(15, Math.min(cssW / 44, 27))
    const restante = this.falaAdrianAte - this.t
    const a = Math.min(1, restante / 0.7)
    c.save()
    c.globalAlpha = a
    c.font = `${size}px ${FONT_BODY}`
    c.fillStyle = PAL.accent
    c.textAlign = 'left'
    c.font = `${size * 0.8}px ${FONT_BODY}`
    c.letterSpacing = '0.14em'
    c.fillText('ADRIAN', cssW * 0.06, cssH * 0.1)
    c.letterSpacing = '0em'
    c.fillStyle = PAL.ink
    c.font = `${size}px ${FONT_BODY}`
    c.fillText(this.falaAdrian, cssW * 0.06, cssH * 0.1 + size * 1.7)
    c.restore()
  }
}
