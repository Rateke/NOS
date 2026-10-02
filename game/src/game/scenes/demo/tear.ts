import type { Scene, SceneCtx } from '../types'
import { Dialogue, FONT_BODY, FONT_FIM, FIO } from '../../systems/dialogue'
import { PAL, WORLD_W, WORLD_H } from '../../../engine/constants'
import { audio, sons } from '../../../engine/audio'
import { voz } from '../../../engine/voz'
import { clima } from '../../../engine/clima'
import { principal } from '../../../engine/principal'
import {
  TEAR_CHEGADA, ADRIAN_DURANTE, CORPO,
  TEAR_FIM, TEAR_PIANO, TEAR_ERRO, TEAR_CADERNO, TEAR_ENGOLIU, TEAR_GRITO,
} from '../../content/demoScript'
import {
  TEAR_CONTAR, PRESSAO_ADRIAN, TEAR_LEI, ESCOLHA_ARMADILHA, ESCOLHA_GRITOS, ESCOLHA_ME_QUEIMA,
  ESCOLHA_DEPOIS, DENTRO_2_ABRE, DENTRO_2_ESE, DENTRO_2, TEAR_VOLTA_DEPOIS,
} from '../../content/noite'
import type { PassoDentro } from '../../content/noite'
import { Montagem, Conversa } from '../../world/dentro'
import { memoria } from '../../systems/memoria'
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
  /** Cor da voz e de quem é (na escolha, as três vozes se sobrepõem). */
  cor?: string
  quem?: string
}

type Fase =
  | 'chegada' | 'absorvendo' | 'pico' | 'dentro'
  | 'lei' | 'escolha' | 'fogo' | 'dentro2'
  | 'volta' | 'grito' | 'onda' | 'silencio'

/** Quanto dura a escolha, em segundos. Parece meia hora; é isso. */
const ESCOLHA_DUR = 13
type Resultado = 'nenhuma' | 'mae' | 'lia'

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
  readonly ponto = 'tear' as const

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
  /** 0..1: o quanto o pai já apertou. Ele chega mais perto e fala mais alto. */
  private pressao = 0
  private ultimaLinha = 0

  // A lei do pai e a escolha
  private conversa: Conversa | null = null
  /** 0..1: as duas aparecendo, presas a ele por um fio cada. */
  private elas = 0
  private escolhaT = 0
  private idxGritoEscolha = 0
  private proxGritoEscolha = 0
  private travada = false
  private escolhaFalada = false
  private resultado: Resultado | null = null
  private queima = { mae: 0, lia: 0 }
  private queimando: ('mae' | 'lia')[] = []
  private tFogo = 0
  private depoisFalado = false
  private recusa = { mae: 0, lia: 0 }
  private mae = new Figura({
    ...VISUAL.evelyn,
    x: 104, y: LIAM_CAMARA.y, altura: 38, cabelo: 'longo', gola: '#a8b4bc',
    cor: { roupa: '#3e5664', cabelo: '#2a1a16', pele: '#7a5a4e', sombra: 'rgba(0,0,0,0.5)' },
  })
  private irma = new Figura({
    ...VISUAL.lia,
    x: 282, y: LIAM_CAMARA.y, altura: 32, cabelo: 'rabo', mochila: '#2e3e56',
    cor: { roupa: '#6a2c38', cabelo: '#1e1214', pele: '#7a6052', sombra: 'rgba(0,0,0,0.5)' },
  })

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

  /** Para os testes: a fase, o que saiu da escolha e se as mãos obedeciam. */
  get faseAtual(): Fase {
    return this.fase
  }

  get escolhaResultado(): Resultado | null {
    return this.resultado
  }

  get escolhaTravada(): boolean {
    return this.travada
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
            this.dialogue.play([...TEAR_PIANO, ...TEAR_CONTAR], () => {
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
    this.misturar()

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
      if (this.montagem.done) this.lei()
      return
    }
    if (this.fase === 'dentro2' && this.conversa) {
      this.conversa.update(dt, ctx.input)
      if (this.conversa.done) this.voltar()
      return
    }

    // Toda fala gritada sacode a câmara no começo.
    if (this.dialogue.linhaNum !== this.ultimaLinha) {
      this.ultimaLinha = this.dialogue.linhaNum
      if (this.dialogue.atual?.grito) {
        this.jolt = Math.max(this.jolt, 1)
        audio.heartbeat(0.22)
      }
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
      const cinematico = this.fase === 'pico' || this.fase === 'escolha'
      if (!cinematico && ctx.input.consumeConfirm()) this.dialogue.confirm()
      // Nos clímaxes a fala corre sozinha, e a cena continua por baixo.
      if (!cinematico && this.fase !== 'absorvendo') return
    }

    if (this.fase === 'absorvendo') this.absorver(dt, ctx)
    else if (this.fase === 'pico') this.pico(dt, ctx)
    else if (this.fase === 'escolha') this.escolher(dt, ctx)
    else if (this.fase === 'fogo') this.arder(dt)
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

    for (const f of [this.liam, this.adrian, this.mae, this.irma]) f.update(dt)
    // O pai chega perto: no Tear, conforme aperta; na escolha, do lado dele.
    const perto = this.fase === 'lei' || this.fase === 'escolha' || this.fase === 'fogo'
    const alvoAdrian = perto ? 152 : this.fase === 'absorvendo' ? 40 + this.pressao * 74 : 40
    this.adrian.x += (alvoAdrian - this.adrian.x) * Math.min(1, dt * 1.5)
    this.adrian.olhar = 1
    this.elas += ((perto ? 1 : 0) - this.elas) * Math.min(1, dt * 1.2)
    this.mae.olhar = 1
    this.irma.olhar = -1
    this.recusa.mae = Math.max(0, this.recusa.mae - dt * 3)
    this.recusa.lia = Math.max(0, this.recusa.lia - dt * 3)
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
      // Arco 1: ele não deixa pensar. Parou dois segundos, ele fala; parou
      // de novo, ele chega mais perto e fala mais alto.
      this.ocioso += dt
      if (this.ocioso > (this.idxInsiste === 0 ? 2.6 : 2.1)) {
        this.ocioso = 0
        const n = PRESSAO_ADRIAN.length
        const i = this.idxInsiste < n ? this.idxInsiste : 3 + ((this.idxInsiste - 3) % (n - 3))
        const fala = PRESSAO_ADRIAN[i] ?? ''
        this.idxInsiste++
        this.pressao = Math.min(1, this.pressao + 0.17)
        this.dizer(fala, 2.4)
        const gritou = fala === fala.toUpperCase()
        this.jolt = Math.max(this.jolt, gritou ? 1 : 0.4)
        audio.heartbeat(gritou ? 0.26 : 0.16)
        audio.setArgument(0.3 + this.intensidade * 0.3 + this.pressao * 0.3, 0.4)
      }
      return
    }

    this.ocioso = 0
    // Tocando, ele recua um pouco. Só um pouco.
    this.pressao = Math.max(0, this.pressao - 0.05)
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
    // Ele fala de trás, à esquerda de Liam.
    const gritou = texto === texto.toUpperCase()
    voz.dizer('Adrian', texto, { grito: gritou, pan: -0.45 })
    if (gritou) sons.caos(0.65)
  }

  /** A música de tensão acompanha a fase da câmara. */
  private misturar(): void {
    const f = this.fase
    if (this.lembranca) {
      clima.set({ pulso: 0, cordas: 0.14, aperto: 0.1, coracao: 0, relogio: 0, caixinha: 0 }, 1.2)
      return
    }
    if (f === 'chegada' || f === 'absorvendo') {
      // Quanto mais o pai aperta, mais a música aperta junto.
      const p = this.pressao
      clima.set({
        cordas: 0.16 + p * 0.5, aperto: p, pulso: p > 0.25 ? 0.25 + p * 0.55 : 0, bpm: 78 + p * 56,
        coracao: p * 0.7, relogio: 0, caixinha: 0,
      }, 0.8)
    } else if (f === 'pico') {
      clima.set({ cordas: 0.9, aperto: 1, pulso: 0.9, bpm: 150, coracao: 1 }, 1.5)
    } else if (f === 'dentro') {
      // Dentro da cabeça: a caixinha de música com o tema. Cada coisa
      // arrumada aperta um pouco mais as cordas por baixo dela.
      const m = this.montagem
      const n = m?.arrumados ?? 0
      if (m && m.faseAtual !== 'cortes') clima.set({ caixinha: 0, cordas: 0.3, aperto: 0.55, coracao: 0.35, pulso: 0 }, 1.2)
      else clima.set({ caixinha: 0.55, cordas: 0.08 + n * 0.04, aperto: n * 0.08, pulso: 0, coracao: 0 }, 1)
    } else if (f === 'lei') {
      // Ele fala baixo. Só as cordas graves e um relógio.
      clima.set({ cordas: 0.22, aperto: 0.15, pulso: 0, coracao: 0, caixinha: 0, relogio: 0.55, ritmoRelogio: 1 }, 2)
    } else if (f === 'escolha') {
      const c = Math.min(1, this.escolhaT / ESCOLHA_DUR)
      clima.set({
        cordas: 0.5 + c * 0.5, aperto: 0.4 + c * 0.6, pulso: 0.4 + c * 0.6, bpm: 100 + c * 72,
        coracao: 0.4 + c * 0.6, relogio: 0.8 + c * 0.5, ritmoRelogio: 0.55 - c * 0.42, caixinha: 0,
      }, 0.3)
    } else if (f === 'fogo') {
      clima.set({ cordas: 0.35, aperto: 0.9, pulso: 0, coracao: 0.5, relogio: 0 }, 0.4)
    } else if (f === 'dentro2') {
      clima.set({ caixinha: 0.42, cordas: 0.22, aperto: 0.35, pulso: 0, coracao: 0, relogio: 0 }, 2)
    } else if (f === 'volta') {
      clima.set({ caixinha: 0, cordas: 0.55, aperto: 0.8, coracao: 0.6, pulso: 0.35, bpm: 96 }, 1.5)
    } else if (f === 'grito') {
      clima.set({ caixinha: 0, cordas: 0.7, aperto: 1, coracao: 0.9, pulso: 0.6, bpm: 140, relogio: 0 }, 1)
    } else {
      // A onda e o preto: corte seco.
      clima.parar(0.05)
    }
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

  /**
   * Arco 5: a sombra plantou a culpa; agora o pai dá a filosofia e monta a
   * situação que vai provar as duas coisas. Arco 6: as duas aparecem, cada
   * uma presa a Liam por um fio, e ele acende a vela.
   */
  private lei(): void {
    this.fase = 'lei'
    this.montagem = null
    // Calmo de propósito: ele fala baixo antes de pedir o pior.
    this.intensidade = 0.3
    this.liam.costas = false
    this.liam.olhar = -1
    audio.setArgument(0, 1)
    this.dialogue.play([...TEAR_LEI, ...ESCOLHA_ARMADILHA], () => this.comecarEscolha())
  }

  private comecarEscolha(): void {
    this.fase = 'escolha'
    this.escolhaT = 0
    this.idxGritoEscolha = 0
    this.proxGritoEscolha = 0.2
    this.escolhaFalada = false
    // Na primeira vez, as mãos não obedecem: todo mundo vive o não escolher.
    this.travada = !memoria.viuEscolha
    sons.iniciarFogo()
    sons.fogo(0.06, 1)
    sons.iniciarCacofonia()
  }

  /** Arco 6: treze segundos, três vozes, duas setas. */
  private escolher(dt: number, ctx: SceneCtx): void {
    this.escolhaT += dt
    const calor = Math.min(1, this.escolhaT / ESCOLHA_DUR)
    this.intensidade = 0.3 + calor * 0.45
    sons.fogo(0.06 + calor * 0.22, 0.3)
    sons.cacofonia(calor * 0.5)
    audio.setArgument(0.2 + calor * 0.5, 0.3)

    // As vozes por cima umas das outras, cada vez mais rápido.
    if (this.escolhaT >= this.proxGritoEscolha && this.idxGritoEscolha < ESCOLHA_GRITOS.length && !this.escolhaFalada) {
      const g = ESCOLHA_GRITOS[this.idxGritoEscolha]
      if (g) {
        const pos = g.quem === 'Adrian' ? { x: 0.5, y: 0.2 } : g.quem === 'Evelyn' ? { x: 0.2, y: 0.34 } : { x: 0.8, y: 0.34 }
        const cor = FIO[g.quem] ?? PAL.ink
        this.ecos.push({
          texto: g.texto, x: pos.x + (Math.random() - 0.5) * 0.08, y: pos.y + (Math.random() - 0.5) * 0.1,
          vida: 1.9, total: 1.9, escala: 0.9 + this.idxGritoEscolha * 0.04, cor, quem: g.quem,
        })
        const gritou = g.texto === g.texto.toUpperCase()
        if (gritou) this.jolt = Math.max(this.jolt, 0.7)
        // As três vozes por cima umas das outras, cada uma do seu lado.
        voz.dizer(g.quem, g.texto, { grito: gritou || calor > 0.6, pan: (pos.x - 0.5) * 1.6 })
        if (gritou) sons.caos(0.45 + calor * 0.4)
      }
      this.idxGritoEscolha++
      this.proxGritoEscolha = this.escolhaT + Math.max(0.55, 1.05 - this.idxGritoEscolha * 0.05)
    }

    if (this.escolhaFalada) {
      ctx.input.consumeConfirm()
      ctx.input.consumeTap()
      return
    }

    // Seta, A/D, ou um toque na metade da tela de quem ele quer salvar.
    let lado: 'mae' | 'lia' | null = null
    if (ctx.input.consumeKey('ArrowLeft') || ctx.input.consumeKey('KeyA')) lado = 'mae'
    if (ctx.input.consumeKey('ArrowRight') || ctx.input.consumeKey('KeyD')) lado = 'lia'
    const tap = ctx.input.consumeTap()
    if (tap) lado = tap.x < ctx.display.cssW / 2 ? 'mae' : 'lia'
    ctx.input.consumeConfirm()
    if (lado) {
      if (this.travada) {
        // A mão não vai. O corpo dele não deixa escolher ninguém.
        this.recusa[lado] = 1
        this.jolt = Math.max(this.jolt, 0.5)
        audio.refuse()
      } else {
        this.resultado = lado
        this.queimar()
        return
      }
    }

    if (this.escolhaT >= ESCOLHA_DUR - 2.6) {
      this.escolhaFalada = true
      this.dialogue.play(ESCOLHA_ME_QUEIMA, () => {
        this.resultado = 'nenhuma'
        this.queimar()
      }, 0.85)
    }
  }

  /** O fogo sobe pelos fios de quem não foi salva. */
  private queimar(): void {
    const r = this.resultado ?? 'nenhuma'
    this.fase = 'fogo'
    this.tFogo = 0
    this.depoisFalado = false
    this.ecos = []
    memoria.marcarEscolha()
    sons.cortarCacofonia(true)
    voz.calar()
    this.jogo?.aprender('escolha')
    this.jogo?.aprender(`escolha-${r}`)
    this.queimando = r === 'mae' ? ['lia'] : r === 'lia' ? ['mae'] : ['mae', 'lia']
    sons.fogo(0.42, 0.4)
    this.clarao = 0.5
    this.jolt = 1
  }

  private arder(dt: number): void {
    this.tFogo += dt
    for (const k of this.queimando) this.queima[k] = Math.min(1, this.tFogo / 2.6)
    for (const k of this.queimando) {
      if (this.queima[k] >= 1) continue
      const p = this.pontoDoFio(k, this.queima[k])
      for (let i = 0; i < 3; i++) this.po.brasa(p.x, p.y, 'rgba(255,170,90,')
    }
    if (this.tFogo > 3.3 && !this.depoisFalado) {
      this.depoisFalado = true
      sons.fogo(0.04, 2)
      this.dialogue.play(ESCOLHA_DEPOIS[this.resultado ?? 'nenhuma'], () => this.dentro2())
    }
  }

  /** Arcos 6 a 10: a conversa inteira com a sombra, depois do fogo. */
  private dentro2(): void {
    const r = this.resultado ?? 'nenhuma'
    const ese = DENTRO_2_ESE[r]
    const passos: PassoDentro[] = [
      { mostrar: ['cinzas'], linhas: DENTRO_2_ABRE[r] },
      ...DENTRO_2.map((p) => ({
        ...p,
        linhas: p.linhas.map((l) => ({ ...l, text: l.text.replace('{ESE}', ese) })),
      })),
    ]
    this.fase = 'dentro2'
    sons.fogo(0, 0.6)
    this.conversa = new Conversa(passos)
    this.conversa.comecar()
  }

  /** Arco 11: de volta ao Tear. O "só mais um" era a corda; agora é dele. */
  private voltar(): void {
    this.fase = 'volta'
    this.montagem = null
    this.conversa = null
    this.intensidade = 1
    this.liam.costas = false
    this.liam.olhar = -1
    this.dialogue.play(TEAR_VOLTA_DEPOIS, () => {
      this.fase = 'grito'
      sons.iniciarGrito()
    })
  }

  /** Um ponto do fio de uma delas: 0 é nela, 1 é no peito de Liam. */
  private pontoDoFio(quem: 'mae' | 'lia', t: number): { x: number; y: number } {
    const f = quem === 'mae' ? this.mae : this.irma
    const p0 = { x: f.x, y: f.y - f.altura * 0.62 }
    const p1 = { x: LIAM_CAMARA.x, y: LIAM_CAMARA.y - 22 }
    const cx = (p0.x + p1.x) / 2
    const cy = Math.min(p0.y, p1.y) - 22
    const u = 1 - t
    return {
      x: u * u * p0.x + 2 * u * t * cx + t * t * p1.x,
      y: u * u * p0.y + 2 * u * t * cy + t * t * p1.y,
    }
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
    if (this.fase === 'dentro2' && this.conversa) {
      this.conversa.render(w)
      const j = this.conversa.jolt
      ctx.display.applyGrain(0.07 + j * 0.05)
      ctx.display.present({ rgbSplit: j * 2.4, wave: 0, shake: j * 2.6, zoom: 1, alvoX: WORLD_W / 2, alvoY: WORLD_H / 2, time: this.t })
      ctx.display.vignette(0.8)
      this.conversa.renderUI(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
      return
    }
    const e = this.estadoTear
    drawCamara(w, e)
    drawTear(w, e)

    this.desenharElas(w)
    this.adrian.draw(w, WORLD_W / 2, 'rgba(196,170,236,0.35)')
    this.desenharVela(w)
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
    if (this.fase === 'escolha') this.desenharEscolha(ctx)
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

  /**
   * A mãe à esquerda, a Lia à direita, cada uma presa ao peito de Liam por
   * um fio da cor dela. Na escolha os fios esquentam; no fogo, o de quem não
   * foi salva queima dela até ele, e ela vira cinza.
   */
  private desenharElas(w: CanvasRenderingContext2D): void {
    if (this.elas <= 0.02) return
    const calor = this.fase === 'escolha' ? Math.min(1, this.escolhaT / ESCOLHA_DUR) : this.fase === 'fogo' ? 1 : 0
    for (const [quem, f, cor] of [['mae', this.mae, FIO.Evelyn], ['lia', this.irma, FIO.Lia]] as const) {
      const q = this.queima[quem]
      // Ela: some conforme o fogo chega nela primeiro.
      const a = this.elas * (1 - Math.min(1, q * 1.8))
      if (a > 0.02) {
        w.save()
        w.globalAlpha = a
        const dx = this.recusa[quem] > 0 ? Math.round((Math.random() - 0.5) * 3 * this.recusa[quem]) : 0
        f.x += dx
        f.draw(w, WORLD_W / 2, 'rgba(255,190,140,0.3)')
        f.x -= dx
        w.restore()
      }
      // O fio, de q até 1 (o que sobrou sem queimar)
      w.save()
      w.globalAlpha = this.elas
      const pulso = 0.6 + Math.sin(this.t * (4 + calor * 10)) * 0.25
      w.strokeStyle = calor > 0 ? misturar(cor, '#ff8a3a', calor * 0.7) : cor
      w.lineWidth = 1
      w.globalAlpha = this.elas * pulso
      w.beginPath()
      const passos = 24
      for (let i = 0; i <= passos; i++) {
        const t = q + (1 - q) * (i / passos)
        const p = this.pontoDoFio(quem, t)
        if (i === 0) w.moveTo(p.x, p.y)
        else w.lineTo(p.x, p.y)
      }
      if (q < 1) w.stroke()
      // A chama na frente do fogo
      if (q > 0 && q < 1) {
        const p = this.pontoDoFio(quem, q)
        w.globalAlpha = 1
        w.fillStyle = '#ffd27a'
        w.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 3, 2, 3)
        w.fillStyle = '#ff7a2a'
        w.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 2)
      }
      w.restore()
    }
  }

  /** A vela na mão do pai, enquanto ele espera a resposta. */
  private desenharVela(w: CanvasRenderingContext2D): void {
    if (this.elas <= 0.05 || this.fase === 'dentro2') return
    const x = Math.round(this.adrian.x + 5)
    const y = Math.round(this.adrian.y - this.adrian.altura * 0.55)
    w.save()
    w.globalAlpha = this.elas
    w.fillStyle = '#e8dcc4'
    w.fillRect(x, y, 2, 5)
    const tremula = Math.sin(this.t * 23) > 0 ? 1 : 0
    w.fillStyle = '#ffd27a'
    w.fillRect(x, y - 3 - tremula, 2, 3)
    w.globalCompositeOperation = 'lighter'
    const g = w.createRadialGradient(x + 1, y - 2, 1, x + 1, y - 2, 22)
    g.addColorStop(0, 'rgba(255,190,110,0.35)')
    g.addColorStop(1, 'rgba(255,190,110,0)')
    w.fillStyle = g
    w.fillRect(x - 22, y - 24, 44, 44)
    w.restore()
  }

  /** As duas setas, o tempo acabando. */
  private desenharEscolha(ctx: SceneCtx): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const s = Math.max(18, Math.min(cssW / 34, 36))
    const resta = Math.max(0, 1 - this.escolhaT / ESCOLHA_DUR)
    c.save()
    c.textAlign = 'center'
    c.font = `600 ${s}px ${FONT_BODY}`
    c.letterSpacing = '0.18em'
    for (const [quem, rotulo, x, cor] of [
      ['mae', '←  MÃE', cssW * 0.2, FIO.Evelyn],
      ['lia', 'LIA  →', cssW * 0.8, FIO.Lia],
    ] as const) {
      const r = this.recusa[quem]
      const dx = r > 0 ? (Math.random() - 0.5) * s * 0.5 * r : 0
      c.globalAlpha = this.escolhaFalada ? 0.25 : 0.55 + Math.sin(this.t * 6) * 0.25
      c.fillStyle = cor
      c.fillText(rotulo, x + dx, cssH * 0.64)
    }
    c.letterSpacing = '0em'
    // A barra do tempo, no meio, vermelha no fim
    const larg = cssW * 0.36
    const y = cssH * 0.7
    c.globalAlpha = 0.5
    c.fillStyle = 'rgba(255,255,255,0.15)'
    c.fillRect(cssW / 2 - larg / 2, y, larg, 3)
    c.globalAlpha = 0.9
    c.fillStyle = resta < 0.3 ? '#ff5a5a' : PAL.ink
    c.fillRect(cssW / 2 - (larg * resta) / 2, y, larg * resta, 3)
    c.restore()
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
      // Cabe na tela: frase comprida anda para dentro.
      const meia = c.measureText(e.texto).width / 2 + cssW * 0.03
      const ex = Math.max(meia, Math.min(cssW - meia, cssW * e.x)) / cssW
      e.x = ex
      c.shadowColor = 'rgba(0,0,0,0.9)'
      c.shadowBlur = size * 0.4
      const jitter = (1 - p) * this.intensidade * 4
      c.globalAlpha = a * 0.16
      c.fillStyle = '#ff5a6e'
      c.fillText(e.texto, cssW * e.x - jitter, cssH * e.y)
      c.fillStyle = '#5ad9ff'
      c.fillText(e.texto, cssW * e.x + jitter, cssH * e.y)
      c.globalAlpha = a * 0.82
      c.fillStyle = e.cor ?? PAL.ink
      c.fillText(e.texto, cssW * e.x, cssH * e.y)
      if (e.quem) {
        c.globalAlpha = a * 0.5
        c.font = `${Math.max(10, size * 0.4)}px ${FONT_BODY}`
        c.letterSpacing = '0.2em'
        c.fillText(e.quem.toUpperCase(), cssW * e.x, cssH * e.y - size * 0.95)
        c.letterSpacing = '0em'
      }
      c.shadowBlur = 0
    }
    c.restore()
  }

  /**
   * Adrian, no Tear. Começa baixo, ao pé da escada; cada vez que Liam para,
   * ele chega mais perto e a letra cresce. Em maiúsculas, ele gritou.
   */
  private desenharAdrian(ctx: SceneCtx): void {
    if (this.t > this.falaAdrianAte || !this.falaAdrian) return
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const gritou = this.falaAdrian === this.falaAdrian.toUpperCase() && /[A-Z]/.test(this.falaAdrian)
    const size = Math.max(15, Math.min(cssW / 44, 27)) * (1 + this.pressao * 0.55) * (gritou ? 1.2 : 1)
    const restante = this.falaAdrianAte - this.t
    const tremor = gritou ? size * 0.05 : 0
    c.save()
    c.globalAlpha = Math.min(1, restante / 0.7)
    c.fillStyle = PAL.accent
    c.textAlign = 'left'
    c.font = `${Math.max(12, size * 0.6)}px ${FONT_BODY}`
    c.letterSpacing = '0.14em'
    c.fillText('ADRIAN', cssW * 0.06, cssH * 0.1)
    c.letterSpacing = '0em'
    c.font = `${gritou ? 600 : 400} ${size}px ${FONT_BODY}`
    const y = cssH * 0.1 + size * 1.5
    if (gritou) {
      const a0 = c.globalAlpha
      c.globalAlpha = a0 * 0.3
      c.fillStyle = '#ff5a6e'
      c.fillText(this.falaAdrian, cssW * 0.06 - tremor, y)
      c.fillStyle = '#5ad9ff'
      c.fillText(this.falaAdrian, cssW * 0.06 + tremor, y)
      c.globalAlpha = a0
    }
    c.fillStyle = gritou ? '#ffe2da' : PAL.ink
    c.fillText(this.falaAdrian, cssW * 0.06 + (Math.random() - 0.5) * tremor, y)
    c.restore()
  }
}

/** Mistura duas cores '#rrggbb'; k=0 é a primeira, k=1 a segunda. */
function misturar(a: string, b: string, k: number): string {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const canal = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k)
  return `rgb(${canal(16)},${canal(8)},${canal(0)})`
}

/** '#rrggbb' para o prefixo 'rgba(r,g,b,' que as partículas esperam. */
function hexRgba(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},`
}
