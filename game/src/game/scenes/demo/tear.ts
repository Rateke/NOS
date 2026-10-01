import type { Scene, SceneCtx } from '../types'
import { Dialogue, FONT_BODY, FONT_FIM } from '../../systems/dialogue'
import { PAL, WORLD_W, WORLD_H } from '../../../engine/constants'
import { audio, sons } from '../../../engine/audio'
import { principal } from '../../../engine/principal'
import {
  TEAR_CHEGADA, ADRIAN_DURANTE, ADRIAN_INSISTE, CORPO,
  TEAR_FIM, TEAR_PIANO, TEAR_ERRO, TEAR_CADERNO, TEAR_VOLTA, TEAR_ENGOLIU, TEAR_GRITO,
} from '../../content/demoScript'
import { Montagem } from '../../world/dentro'
import { HospitalScene } from './hospital'
import { DOC_CADERNO_AMELIA } from '../../content/documentos'
import { Leitor } from '../../systems/leitor'
import type { GameState } from '../../systems/state'
import { Figura, VISUAL } from '../../world/figura'
import { Piano } from '../../systems/piano'
import { RELIQUIAS } from '../../world/reliquias'
import { musica, TEMA } from '../../../engine/musica'
import { Particulas } from '../../world/particulas'
import type { EstadoTear, FioTear } from '../../world/camara'
import {
  drawCamara, drawTear, drawAmarras, drawLuzCamara, CARREIRAS, LIAM_CAMARA, posCarretel,
} from '../../world/camara'
import type { Lembranca } from '../../world/lembrancas'
import { criarLembrancas, tingir } from '../../world/lembrancas'

/** Carreiras já tecidas quando Liam chega: só a barra de baixo. */
const TECIDO_INICIAL = 5
const POR_FIO = (CARREIRAS - TECIDO_INICIAL) / 6

interface Eco {
  texto: string
  x: number
  y: number
  vida: number
  total: number
  escala: number
}

type Fase = 'chegada' | 'absorvendo' | 'pico' | 'dentro' | 'volta' | 'grito' | 'onda' | 'silencio'

/**
 * A câmara do Tear.
 *
 * O jogador faz a coisa ruim com as próprias mãos, e é recompensado por
 * isso. Cada nota certa passa a lançadeira e bate o pente: o tecido da
 * família cresce, bonito, carreira por carreira. Cada fio completo acalma a
 * discussão lá em cima — e prende mais um fio no peito de Liam, e enfia nele
 * uma lembrança que não é dele.
 *
 * As lembranças vão do pai para trás, geração por geração, até a bisavó que
 * criou o Tear. A última é a figura preta: a única que não passou nada para
 * ele, porque cortou o próprio fio. Quando o tecido fica pronto, o desenho
 * mostra o que faltava — um buraco do tamanho de uma pessoa.
 */
export class TearScene implements Scene {
  readonly id = 'demo-tear'

  private dialogue = new Dialogue()
  private leitor = new Leitor()
  private jogo: GameState | null = null
  private fase: Fase = 'chegada'
  private t = 0
  private fios: FioTear[] = []
  private sel = 0
  private ecos: Eco[] = []
  private intensidade = 0
  private ocioso = 0
  private idxInsiste = 0
  private proxBatida = 0
  private tPico = 0
  private montagem: Montagem | null = null
  /** 0..1: quanto do grito Liam já deixou sair. */
  private nivel = 0
  private segurava = false
  private comecouGrito = false
  private engoliu = 0
  private tOnda = 0
  private onda = 0
  private falaAdrian = ''
  private falaAdrianAte = 0
  private po = new Particulas()
  private piano = new Piano()
  private passo = 0
  private errosFio = 0
  private jolt = 0

  // O tear em si
  private tecido = TECIDO_INICIAL
  private tecidoAlvo = TECIDO_INICIAL
  private lancadeira = 0
  private dirLanc = 1
  private lancando = false
  private batedor = 0
  private cala = 0
  private brilhoCorte = 0
  private rompido = false
  private clarao = 0

  // Lembranças
  private lembrancas: Lembranca[] = criarLembrancas()
  private lembranca: { idx: number; t: number } | null = null
  private memoria: HTMLCanvasElement | null = null
  private afinacaoAntes = { desafinado: 0, abafado: 0 }

  private liam = new Figura({
    ...VISUAL.liam,
    x: LIAM_CAMARA.x, y: LIAM_CAMARA.y, altura: 34,
    cor: { roupa: '#1a2030', cabelo: '#080b12', pele: '#5c4c46', sombra: 'rgba(0,0,0,0.55)' },
  })
  // Adrian desceu atrás dele e ficou ao pé da escada, no escuro.
  private adrian = new Figura({
    ...VISUAL.adrian,
    x: 40, y: LIAM_CAMARA.y, altura: 44, barba: true, gola: '#bdb4a8',
    cor: { roupa: '#1e1820', cabelo: '#0c0808', pele: '#4a3a34', sombra: 'rgba(0,0,0,0.5)' },
  })
  /** Exposto para o clique nas teclas e para os testes. */
  get caixas(): { x: number; y: number; w: number; h: number }[] {
    return this.piano.caixas
  }

  /** Uma lembrança está passando: a entrada fica parada. */
  get lembrando(): boolean {
    return this.lembranca !== null
  }

  private fraseDoFio(indice: number): readonly number[] {
    return TEMA[indice % TEMA.length] ?? []
  }

  /** Um documento aberto na tela. */
  get lendo(): boolean {
    return this.leitor.aberto
  }

  enter(ctx: SceneCtx): void {
    this.jogo = ctx.state
    ctx.state.aprender('tear')
    const cores = ['#7a90b4', '#9a78b0', '#b88a70', '#78a890', '#b07a90', '#8a98b0']
    this.fios = cores.map((cor, i) => ({
      cor,
      absorvido: false,
      puxado: 0,
      reliquia: RELIQUIAS[i] ?? 'carta',
      balanco: i * 0.9,
    }))
    this.adrian.olhar = 1
    this.liam.costas = true
    this.lancadeira = 0
    audio.startAmbient()
    audio.setAmbient(0.5, 1)
    audio.startArgument()
    audio.setArgument(0.32, 2)
    // O piano volta desafinado e abafado: é o mesmo instrumento, estragado.
    musica.desafinado = -0.35
    musica.abafado = 0.45
    musica.setPad(0.35, 3)
    // Chegada, o caderno da bisavó, e só então o piano.
    this.dialogue.play(TEAR_CHEGADA, () => {
      this.dialogue.play(TEAR_CADERNO, () => {
        this.leitor.abrir(DOC_CADERNO_AMELIA, {
          onSegredo: (id) => {
            if (this.jogo?.descobrir(id)) audio.segredo()
          },
          onFechar: () => {
            this.jogo?.aprender('caderno-amelia')
            this.dialogue.play(TEAR_PIANO, () => {
              this.fase = 'absorvendo'
            })
          },
        })
      })
    })
  }

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt
    this.dialogue.update(dt)
    this.ecos = this.ecos.filter((e) => (e.vida -= dt) > 0)
    this.baterCoracao()
    this.animar(dt)

    if (this.leitor.aberto) {
      this.leitor.update(dt, ctx.input)
      return
    }

    if (this.lembranca) {
      this.lembrar(dt, ctx)
      return
    }

    if (this.fase === 'dentro' && this.montagem) {
      this.montagem.update(dt, ctx.input)
      if (this.montagem.done) this.voltar()
      return
    }
    if (this.fase === 'grito') {
      this.gritar(dt, ctx)
      return
    }
    if (this.fase === 'onda') {
      this.depoisDaOnda(dt, ctx)
      return
    }

    if (this.dialogue.active) {
      const cinematico = this.fase === 'pico'
      if (!cinematico && ctx.input.consumeConfirm()) this.dialogue.confirm()
      // Nos clímaxes a fala corre sozinha, e a cena continua por baixo.
      if (!cinematico && this.fase !== 'absorvendo') return
    }

    if (this.fase === 'absorvendo') this.absorver(dt, ctx)
    else if (this.fase === 'pico') this.pico(dt, ctx)
  }

  /** Vida da cena fora da interação: tear, corpo, poeira, brasas. */
  private animar(dt: number): void {
    const i = this.intensidade
    this.po.update(dt)
    this.piano.update(dt)
    this.jolt = Math.max(0, this.jolt - dt * 3)
    this.batedor = Math.max(0, this.batedor - dt * 4)
    this.brilhoCorte = Math.max(0, this.brilhoCorte - dt * 0.25)
    this.clarao = Math.max(0, this.clarao - dt * 1.4)
    this.tecido += (this.tecidoAlvo - this.tecido) * Math.min(1, dt * 4)
    for (const f of this.fios) f.balanco += dt * (0.5 + f.puxado * 1.6)

    // A lançadeira atravessa a cala; ao chegar, o pente bate a carreira.
    if (this.lancando) {
      this.lancadeira += this.dirLanc * dt / 0.28
      if (this.lancadeira >= 1 || this.lancadeira <= 0) {
        this.lancadeira = Math.max(0, Math.min(1, this.lancadeira))
        this.lancando = false
        this.dirLanc *= -1
        this.batedor = 1
        this.cala = 1 - this.cala
        audio.bater(1, 0)
      }
    }

    for (const f of [this.liam, this.adrian]) f.update(dt)
    this.onda = Math.max(0, this.onda - dt * 0.4)
    this.liam.ofego = 1 + i * 3.4
    this.liam.curvatura = Math.min(0.8, i * 0.7)
    this.liam.tremor = i > 0.45 ? (i - 0.45) * 2.6 : 0
    this.liam.braco = this.fase === 'absorvendo' ? 0.5 + this.batedor * 0.3 : this.fase === 'grito' ? this.nivel * 0.4 : 0.1
    if (this.fase === 'grito') {
      // Gritando ele se endireita: a curvatura de carregar todo mundo sai.
      this.liam.curvatura = Math.max(0, 0.8 - this.nivel)
      this.liam.tremor = this.nivel * 2.2
    }
    this.adrian.ofego = 0.8

    // Poeira desprendida do assoalho pela discussão lá em cima.
    if (Math.random() < dt * (7 + i * 16)) {
      this.po.poeira(24, 22, WORLD_W - 48, 4, 'rgba(190,180,200,')
    }
    if (i > 0.3 && Math.random() < dt * i * 34) {
      this.po.brasa(LIAM_CAMARA.x + (Math.random() - 0.5) * 16, LIAM_CAMARA.y - 18)
    }
  }

  private baterCoracao(): void {
    if (this.fase === 'silencio' || this.fase === 'chegada') return
    const intervalo = 1.15 - this.intensidade * 0.62
    if (this.t >= this.proxBatida) {
      this.proxBatida = this.t + intervalo * (this.lembranca ? 1.6 : 1)
      audio.heartbeat((0.1 + this.intensidade * 0.14) * (this.lembranca ? 0.5 : 1))
    }
  }

  /**
   * Tocar a melodia que Adrian ensinou é o que tece. Cada fio pede uma frase
   * do tema; errar uma nota faz o fio chicotear de volta e desfaz o pedaço
   * da carreira que já estava pronto.
   */
  private absorver(dt: number, ctx: SceneCtx): void {
    const vivos = this.fios.filter((f) => !f.absorvido)
    if (vivos.length === 0) {
      this.fase = 'pico'
      this.tPico = 0
      this.liam.costas = false
      this.liam.olhar = 0
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
      this.lancar()
      this.tecidoAlvo = this.nivelTecido() + fio.puxado * POR_FIO * 0.9
      if (this.passo >= frase.length) this.concluir(fio)
      return
    }

    // Nota errada: o fio recua, a carreira desfaz, a cena dá um solavanco.
    this.passo = 0
    fio.puxado = 0
    this.tecidoAlvo = this.nivelTecido()
    this.jolt = 1
    audio.refuse()
    const fala = TEAR_ERRO[Math.min(this.errosFio, TEAR_ERRO.length - 1)]
    this.errosFio++
    this.dizer(fala ?? '', 2.8)
  }

  private nivelTecido(): number {
    return TECIDO_INICIAL + this.fios.filter((f) => f.absorvido).length * POR_FIO
  }

  private lancar(): void {
    this.lancando = true
    this.cala = 1 - this.cala
  }

  private mover(d: number): void {
    const n = this.fios.length
    for (let i = 1; i <= n; i++) {
      const j = (this.sel + d * i + n * 2) % n
      if (!this.fios[j]?.absorvido) {
        this.sel = j
        this.passo = 0
        // A lançadeira vai para o lado do carretel escolhido.
        this.lancadeira = posCarretel(j).lado < 0 ? 0 : 1
        this.dirLanc = posCarretel(j).lado < 0 ? 1 : -1
        audio.interact()
        return
      }
    }
  }

  /** Um fio a menos lá em cima, uma lembrança a mais aqui dentro. */
  private concluir(fio: FioTear): void {
    fio.absorvido = true
    fio.puxado = 1
    this.passo = 0
    const feitos = this.fios.filter((f) => f.absorvido).length
    this.intensidade = feitos / this.fios.length
    this.tecidoAlvo = this.nivelTecido()

    musica.desafinado = -0.35 - this.intensidade * 1.1
    musica.abafado = 0.45 + this.intensidade * 0.45
    audio.setArgument(Math.max(0, 0.34 - this.intensidade * 0.3), 1.6)
    this.errosFio = 0
    this.comecarLembranca(feitos - 1)
  }

  private comecarLembranca(idx: number): void {
    this.lembranca = { idx, t: 0 }
    this.clarao = 1
    audio.reveal()
    // A lembrança é afinada. O presente é que está estragado.
    this.afinacaoAntes = { desafinado: musica.desafinado, abafado: musica.abafado }
    musica.desafinado = 0
    musica.abafado = 0.2
    const frase = TEMA[idx % TEMA.length] ?? []
    musica.tocarFrase(frase.slice(0, 4), 0.7, 0.32)
  }

  private lembrar(dt: number, ctx: SceneCtx): void {
    const l = this.lembranca
    if (!l) return
    const mem = this.lembrancas[l.idx]
    l.t += dt
    mem?.atualizar(dt, l.t)
    // Quem já viu pode apressar, mas nunca pular o começo.
    const pular = l.t > 1.6 && (ctx.input.consumeConfirm() || ctx.input.consumeTap() !== null)
    if (!mem || l.t >= mem.dur || pular) this.terminarLembranca(l.idx)
  }

  private terminarLembranca(idx: number): void {
    this.lembranca = null
    musica.desafinado = this.afinacaoAntes.desafinado
    musica.abafado = this.afinacaoAntes.abafado
    const feitos = idx + 1
    // Depois da figura preta, o fio cortado do tear acende.
    if (idx === this.lembrancas.length - 1) this.brilhoCorte = 1
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
  }

  private dizer(texto: string, dur: number): void {
    this.falaAdrian = texto
    this.falaAdrianAte = this.t + dur
  }

  private pico(dt: number, ctx: SceneCtx): void {
    this.tPico += dt
    this.intensidade = Math.min(1.5, 1 + this.tPico * 0.22)
    audio.setArgument(0, 1)
    // Quando ele termina de dizer que não quer, corta seco para dentro.
    if (this.tPico > 2.6 && !this.dialogue.active && this.fase === 'pico') {
      this.fase = 'dentro'
      this.montagem = new Montagem()
      this.montagem.comecar(ctx.state)
    }
  }

  /** De volta ao Tear, logo depois da oferta: o pai pede mais um. */
  private voltar(): void {
    this.fase = 'volta'
    this.montagem = null
    this.intensidade = 1
    this.liam.costas = false
    this.liam.olhar = -1
    this.dialogue.play(TEAR_VOLTA, () => {
      this.fase = 'grito'
      sons.iniciarGrito()
    })
  }

  /**
   * O grito. Segurar deixa sair; soltar antes da hora é engolir de novo — e o
   * pai repete o pedido. Cheio, vira a onda.
   */
  private gritar(dt: number, ctx: SceneCtx): void {
    const segura = ctx.input.held('Space') || ctx.input.held('Enter') || ctx.input.held('KeyE')
      || ctx.input.pointerDown
    ctx.input.consumeConfirm()
    ctx.input.consumeTap()
    if (segura) {
      if (!this.comecouGrito) {
        this.comecouGrito = true
        // A versão com todos os instrumentos entra de uma vez, e só aqui.
        principal.tocar(0.85)
        principal.completo(1, 0.4)
      }
      this.nivel = Math.min(1, this.nivel + dt / 2.8)
    } else if (this.segurava && this.nivel < 1) {
      // Soltou cedo: engoliu. O pai repete, baixo.
      if (this.nivel > 0.1) {
        const fala = TEAR_ENGOLIU[this.engoliu % TEAR_ENGOLIU.length] ?? ''
        this.engoliu++
        this.dizer(fala, 3)
        audio.refuse()
      }
      this.nivel = 0
    }
    this.segurava = segura
    sons.grito(this.nivel)
    if (this.nivel >= 1) this.explodir(ctx)
  }

  /** A onda: todos os fios arrebentam de uma vez, e tudo voa. */
  private explodir(ctx: SceneCtx): void {
    this.fase = 'onda'
    this.tOnda = 0
    this.onda = 1
    sons.pararGrito(0.05)
    sons.onda()
    for (let i = 0; i < this.fios.length; i++) sons.estalo(0.05 + i * 0.07)
    this.romper()
    ctx.state.sombraEscreve = true
    ctx.state.aprender('grito')
  }

  private depoisDaOnda(dt: number, ctx: SceneCtx): void {
    this.tOnda += dt
    ctx.input.consumeConfirm()
    ctx.input.consumeTap()
    if (this.tOnda > 0.8 && this.fase === 'onda') {
      this.fase = 'silencio'
      principal.cortar()
      audio.cutAll(0.04)
      // Corte seco para o preto: os cinco segundos são da próxima cena.
      ctx.transition(new HospitalScene('grito'), 0, 0)
    }
  }

  /** Todos os fios presos nele arrebentam de uma vez. */
  private romper(): void {
    this.rompido = true
    this.clarao = 1
    for (const f of this.fios) {
      for (let k = 0; k < 14; k++) {
        this.po.brasa(
          LIAM_CAMARA.x + (Math.random() - 0.5) * 30, LIAM_CAMARA.y - 20 - Math.random() * 20,
          hexRgba(f.cor),
        )
      }
    }
  }

  private get estadoTear(): EstadoTear {
    return {
      t: this.t,
      intensidade: Math.min(1, this.intensidade),
      tecido: this.fase === 'absorvendo' || this.fase === 'chegada' ? this.tecido : CARREIRAS,
      fios: this.fios,
      sel: this.sel,
      lancadeira: this.lancadeira,
      lancando: this.lancando,
      batedor: this.batedor,
      cala: this.cala,
      brilhoCorte: this.brilhoCorte,
      rompido: this.rompido,
    }
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    if (this.fase === 'dentro' && this.montagem) {
      this.montagem.render(w)
      ctx.display.applyGrain(0.07)
      ctx.display.present({ rgbSplit: 0, wave: 0, shake: 0, zoom: 1, alvoX: WORLD_W / 2, alvoY: WORLD_H / 2, time: this.t })
      ctx.display.vignette(0.8)
      this.montagem.renderUI(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
      return
    }
    const e = this.estadoTear
    drawCamara(w, e)
    drawTear(w, e)

    this.adrian.draw(w, WORLD_W / 2, 'rgba(196,170,236,0.35)')
    drawAmarras(w, e, LIAM_CAMARA.y - 22)
    this.liam.draw(w, WORLD_W / 2 + 40, `rgba(196,170,236,${0.3 + this.intensidade * 0.4})`)
    this.desenharOnda(w)
    this.po.draw(w, true)
    drawLuzCamara(w, e)

    // A lembrança por cima de tudo, desenhada no mesmo mundo de pixels.
    const m = this.alfaLembranca
    if (m > 0 && this.lembranca) this.desenharLembranca(w, m)
    if (this.clarao > 0) {
      w.fillStyle = `rgba(255,250,240,${Math.pow(this.clarao, 2) * 0.8})`
      w.fillRect(0, 0, WORLD_W, WORLD_H)
    }

    const i = this.intensidade * (1 - m)
    const g = this.nivel
    ctx.display.applyGrain(0.05 + i * 0.09 + g * 0.05)
    ctx.display.present({
      rgbSplit: i * 2.6 + g * 3,
      wave: i * 1.5,
      shake: i * i * 1.6 + this.jolt * 2.2 * (1 - m) + g * g * 2.4 + this.onda * 4,
      zoom: 1 + i * 0.36,
      alvoX: WORLD_W / 2,
      alvoY: WORLD_H / 2 + i * 26,
      time: this.t,
    })
    ctx.display.vignette(0.66 + i * 0.22)

    this.desenharEcos(ctx)
    if (this.fase === 'absorvendo' && !this.lembranca) {
      this.piano.draw(ctx.display, { fantasma: true })
      const frase = this.fraseDoFio(this.sel)
      this.piano.drawDica(
        ctx.display,
        `toque a melodia  ·  ${this.passo}/${frase.length}  ·  ← → escolhe o fio`,
      )
    }
    if (this.lembranca) this.desenharFalaLembranca(ctx, m)
    else this.desenharAdrian(ctx)
    if (this.fase === 'grito' || this.fase === 'onda') this.desenharGrito(ctx)
    this.dialogue.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
    this.leitor.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
  }

  /** Entra depressa, sai devagar. */
  private get alfaLembranca(): number {
    const l = this.lembranca
    if (!l) return 0
    const dur = this.lembrancas[l.idx]?.dur ?? 5
    return Math.min(1, l.t / 0.35, (dur - l.t) / 0.7)
  }

  private desenharLembranca(w: CanvasRenderingContext2D, alfa: number): void {
    const l = this.lembranca
    const mem = l ? this.lembrancas[l.idx] : undefined
    if (!l || !mem) return
    if (!this.memoria) {
      this.memoria = document.createElement('canvas')
      this.memoria.width = WORLD_W
      this.memoria.height = WORLD_H
    }
    const c = this.memoria.getContext('2d')
    if (!c) return
    c.imageSmoothingEnabled = false
    c.clearRect(0, 0, WORLD_W, WORLD_H)
    mem.desenhar(c, l.t)
    tingir(c, mem.tom, l.t)
    mem.sobre?.(c, l.t)
    // Leve deriva da imagem, como projeção
    const dx = Math.round(Math.sin(l.t * 0.8) * 1)
    w.save()
    w.globalAlpha = alfa
    w.drawImage(this.memoria, dx, 0)
    w.restore()
  }

  /** A frase da lembrança: caligrafia, no alto, e de quem é, embaixo. */
  private desenharFalaLembranca(ctx: SceneCtx, alfa: number): void {
    const l = this.lembranca
    const mem = l ? this.lembrancas[l.idx] : undefined
    if (!l || !mem) return
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const s = Math.max(20, Math.min(cssW / 30, 42))
    c.save()
    c.textAlign = 'center'
    let y = cssH * 0.14
    for (const f of mem.falas) {
      const a = Math.max(0, Math.min(1, (l.t - f.de) / 0.6)) * alfa
      if (a <= 0) continue
      c.globalAlpha = a
      c.font = `italic 500 ${s}px ${FONT_FIM}`
      c.shadowColor = 'rgba(0,0,0,0.9)'
      c.shadowBlur = s * 0.5
      c.fillStyle = '#f2ead8'
      c.fillText(f.texto, cssW / 2, y + (1 - a) * 6)
      y += s * 1.25
    }
    if (mem.dono) {
      c.shadowBlur = 0
      c.globalAlpha = alfa * 0.6
      c.font = `${Math.max(11, s * 0.36)}px ${FONT_BODY}`
      c.letterSpacing = '0.3em'
      c.fillStyle = PAL.inkDim
      c.fillText(mem.dono.toUpperCase(), cssW / 2, y + s * 0.2)
      c.letterSpacing = '0em'
    }
    c.restore()
  }

  /** A onda branca saindo de Liam, empurrando tudo para fora. */
  private desenharOnda(w: CanvasRenderingContext2D): void {
    if (this.fase !== 'onda') return
    const r = Math.pow(this.tOnda / 0.6, 0.7) * 420
    w.save()
    w.strokeStyle = `rgba(250,250,255,${Math.max(0, 1 - this.tOnda / 0.7)})`
    w.lineWidth = 10
    w.beginPath()
    w.arc(LIAM_CAMARA.x, LIAM_CAMARA.y - 18, r, 0, Math.PI * 2)
    w.stroke()
    w.fillStyle = `rgba(250,250,255,${Math.max(0, 0.6 - this.tOnda)})`
    w.fillRect(0, 0, WORLD_W, WORLD_H)
    w.restore()
  }

  /** As palavras saem na medida em que ele deixa sair. */
  private desenharGrito(ctx: SceneCtx): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const n = Math.floor(this.nivel * TEAR_GRITO.length)
    const texto = this.fase === 'onda' ? TEAR_GRITO : TEAR_GRITO.slice(0, n)
    c.save()
    c.textAlign = 'center'
    if (texto) {
      const s = Math.max(28, Math.min(cssW / 16, 96)) * (0.7 + this.nivel * 0.5)
      const j = this.nivel * s * 0.04
      c.font = `500 ${s}px ${FONT_BODY}`
      c.letterSpacing = `${0.04 + this.nivel * 0.1}em`
      c.globalAlpha = 0.25
      c.fillStyle = '#ff5a6e'
      c.fillText(texto, cssW / 2 - j, cssH * 0.42)
      c.fillStyle = '#5ad9ff'
      c.fillText(texto, cssW / 2 + j, cssH * 0.42)
      c.globalAlpha = 1
      c.fillStyle = '#fbfbff'
      c.fillText(texto, cssW / 2 + (Math.random() - 0.5) * j, cssH * 0.42 + (Math.random() - 0.5) * j)
      c.letterSpacing = '0em'
    }
    if (this.fase === 'grito' && this.nivel < 0.04) {
      const s = Math.max(13, Math.min(cssW / 60, 20))
      c.globalAlpha = 0.45 + Math.sin(this.t * 3) * 0.25
      c.fillStyle = PAL.ink
      c.font = `${s}px ${FONT_BODY}`
      c.letterSpacing = '0.2em'
      const como = 'ontouchstart' in window ? 'SEGURE O DEDO NA TELA' : 'SEGURE ESPAÇO  ·  OU O CLIQUE'
      c.fillText(como, cssW / 2, cssH * 0.82)
    }
    c.restore()
  }

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
      c.fillStyle = '#5ad9ff'
      c.fillText(e.texto, cssW * e.x + jitter, cssH * e.y)
      c.globalAlpha = a * 0.82
      c.fillStyle = PAL.ink
      c.fillText(e.texto, cssW * e.x, cssH * e.y)
    }
    c.restore()
  }

  /** Adrian nunca grita. Fica ao pé da escada, em voz baixa, e é pior assim. */
  private desenharAdrian(ctx: SceneCtx): void {
    if (this.t > this.falaAdrianAte || !this.falaAdrian) return
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const size = Math.max(15, Math.min(cssW / 44, 27))
    const restante = this.falaAdrianAte - this.t
    c.save()
    c.globalAlpha = Math.min(1, restante / 0.7)
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

/** '#rrggbb' para o prefixo 'rgba(r,g,b,' que as partículas esperam. */
function hexRgba(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},`
}
