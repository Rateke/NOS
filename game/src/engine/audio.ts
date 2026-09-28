/**
 * Áudio inteiramente sintetizado — o jogo não carrega nenhum arquivo de som.
 * O ambiente é um drone grave com ruído filtrado; os efeitos são envelopes
 * curtos. Serve de base até existir trilha de verdade.
 */
import { musica } from './musica'

export class Audio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambientGain: GainNode | null = null
  private started = false

  /** Precisa ser chamado a partir de um gesto do usuário. */
  init(): void {
    if (this.ctx) return
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    this.ctx = new Ctor()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.5
    this.master.connect(this.ctx.destination)
    musica.conectar(this.ctx, this.master)
  }

  resume(): void {
    void this.ctx?.resume()
  }

  startAmbient(): void {
    if (!this.ctx || !this.master || this.started) return
    this.started = true
    const ctx = this.ctx

    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(this.master)
    this.ambientGain = gain

    // Duas ondas graves levemente desafinadas: bate lento, soa instável.
    for (const freq of [55, 55.4, 82.5]) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      const g = ctx.createGain()
      g.gain.value = freq > 80 ? 0.05 : 0.12
      osc.connect(g).connect(gain)
      osc.start()
    }

    // Ruído rosa aproximado, bem abafado: o "ar parado" da casa.
    const len = ctx.sampleRate * 4
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.2
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    noise.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 420
    const ng = ctx.createGain()
    ng.gain.value = 0.16
    noise.connect(lp).connect(ng).connect(gain)
    noise.start()
  }

  /** 0 = silêncio, 1 = presença cheia. Transição lenta, nunca em corte. */
  setAmbient(level: number, seconds = 2): void {
    if (!this.ctx || !this.ambientGain) return
    const t = this.ctx.currentTime
    this.ambientGain.gain.cancelScheduledValues(t)
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, t)
    this.ambientGain.gain.linearRampToValueAtTime(level, t + seconds)
  }

  private ping(freq: number, dur: number, vol: number, type: OscillatorType = 'sine'): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g).connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  /** Letra aparecendo na caixa de diálogo. Muito baixo e agudo. */
  type(): void {
    this.ping(1250 + Math.random() * 260, 0.035, 0.018, 'square')
  }

  interact(): void {
    this.ping(392, 0.16, 0.06, 'triangle')
  }

  /** Folha virando: um sopro de ruído, filtrado, que abre e fecha rápido. */
  folha(): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const dur = 0.22
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const k = i / d.length
      d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * k) * (0.6 + Math.random() * 0.4)
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(1800, t)
    bp.frequency.linearRampToValueAtTime(3600, t + dur)
    bp.Q.value = 0.8
    const g = ctx.createGain()
    g.gain.value = 0.09
    src.connect(bp).connect(g).connect(this.master)
    src.start(t)
  }

  pickup(): void {
    this.ping(523.25, 0.13, 0.055, 'triangle')
    window.setTimeout(() => this.ping(784, 0.2, 0.04, 'triangle'), 70)
  }

  /** Quando Liam se recusa a sair. Grave, fechado. */
  refuse(): void {
    this.ping(98, 0.34, 0.075, 'sine')
  }

  // --- Camadas para a cena do Tear ---------------------------------------
  //
  // Cada fio absorvido acrescenta uma voz. Elas são levemente desafinadas
  // entre si de propósito: quanto mais "paz" Liam produz lá em cima, mais
  // dissonante fica aqui dentro.

  private layers: { osc: OscillatorNode; gain: GainNode }[] = []

  addLayer(freq: number, type: OscillatorType = 'sine', gain = 0.07): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 1.2)
    osc.connect(g).connect(this.master)
    osc.start()
    this.layers.push({ osc, gain: g })
  }

  /** Corte seco de tudo: o silêncio depois do fio central ser cortado. */
  cutAll(seconds = 0.25): void {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    for (const l of this.layers) {
      l.gain.gain.cancelScheduledValues(t)
      l.gain.gain.setValueAtTime(l.gain.gain.value, t)
      l.gain.gain.linearRampToValueAtTime(0, t + seconds)
      l.osc.stop(t + seconds + 0.1)
    }
    this.layers = []
    this.setAmbient(0, seconds)
  }

  /** Batida cardíaca: dois golpes graves. Acelera com a intensidade. */
  heartbeat(volume = 0.16): void {
    this.thud(70, volume)
    window.setTimeout(() => this.thud(58, volume * 0.72), 145)
  }

  private thud(freq: number, vol: number): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.16)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
    osc.connect(g).connect(this.master)
    osc.start(t)
    osc.stop(t + 0.34)
  }

  /**
   * Discussão abafada no andar de cima: ruído filtrado com a banda variando,
   * que soa como voz sem nenhuma palavra sair inteira.
   */
  private argueGain: GainNode | null = null

  startArgument(): void {
    if (!this.ctx || !this.master || this.argueGain) return
    const ctx = this.ctx
    const len = ctx.sampleRate * 5
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.6
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true

    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 380
    bp.Q.value = 6
    // A frequência oscila: dá o contorno de alguém falando através do assoalho.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 2.7
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 190
    lfo.connect(lfoGain).connect(bp.frequency)
    lfo.start()

    const g = ctx.createGain()
    g.gain.value = 0
    src.connect(bp).connect(g).connect(this.master)
    src.start()
    this.argueGain = g
  }

  setArgument(level: number, seconds = 1.5): void {
    if (!this.ctx || !this.argueGain) return
    const t = this.ctx.currentTime
    this.argueGain.gain.cancelScheduledValues(t)
    this.argueGain.gain.setValueAtTime(this.argueGain.gain.value, t)
    this.argueGain.gain.linearRampToValueAtTime(level, t + seconds)
  }

  /** Nota do prólogo: Adrian ensinando. Quente, com corpo. */
  note(freq: number, dur = 0.9, vol = 0.1): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const t = ctx.currentTime
    for (const [mult, amp] of [[1, 1], [2, 0.32], [3, 0.14]] as const) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq * mult
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(vol * amp, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(g).connect(this.master)
      osc.start(t)
      osc.stop(t + dur + 0.05)
    }
  }

  /** Dois sinos altos e fracos: o som de ter achado algo que não se via. */
  segredo(): void {
    musica.nota(1174.66, 0.32, 3.4)
    window.setTimeout(() => musica.nota(1760, 0.24, 3.8), 170)
  }

  /** Três batidas de dedo numa porta, do outro lado. */
  bater(vezes = 3, depois = 0): void {
    for (let i = 0; i < vezes; i++) {
      window.setTimeout(() => this.thud(92 - i * 3, 0.2), depois + i * 330)
    }
  }

  reveal(): void {
    this.ping(196, 1.5, 0.07, 'sine')
    window.setTimeout(() => this.ping(294, 1.8, 0.05, 'sine'), 180)
  }
}

export const audio = new Audio()
