/**
 * Áudio inteiramente sintetizado — o jogo não carrega nenhum arquivo de som.
 * O ambiente é um drone grave com ruído filtrado; os efeitos são envelopes
 * curtos. Serve de base até existir trilha de verdade.
 */
import { musica } from './musica'

export class Audio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private limitador: DynamicsCompressorNode | null = null
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
    // Um limitador antes da caixa de som: os gritos podem empilhar à
    // vontade, a saída nunca estoura.
    this.limitador = this.ctx.createDynamicsCompressor()
    this.limitador.threshold.value = -4
    this.limitador.knee.value = 2
    this.limitador.ratio.value = 20
    this.limitador.attack.value = 0.001
    this.limitador.release.value = 0.12
    this.master.connect(this.limitador).connect(this.ctx.destination)
    musica.conectar(this.ctx, this.master)
  }

  resume(): void {
    void this.ctx?.resume()
  }

  /** Para quem precisa tocar arquivo (a trilha própria). */
  get contexto(): AudioContext | null {
    return this.ctx
  }

  get saida(): AudioNode | null {
    return this.master
  }

  /** O que chega na caixa de som, depois do limitador (para medir). */
  get final(): AudioNode | null {
    return this.limitador
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

  /**
   * Cala tudo o que é desta classe sem desligar nada: quem vem depois (o
   * menu) sobe só o que quiser.
   */
  silenciar(segundos = 0.3): void {
    this.cutAll(segundos)
    this.setArgument(0, segundos)
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

// --- Sons da versão nova da demo ----------------------------------------

/** Ruído branco reaproveitável, criado uma vez. */
function ruido(ctx: AudioContext, segundos: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * segundos), ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/** Morse: é assim que os bipes (a hora certa do rádio, o aparelho do grito) pedem o que Liam não pede. */
const MORSE: Record<string, string> = {
  A: '.-', J: '.---', U: '..-', D: '-..', S: '...', O: '---', E: '.', I: '..', M: '--', N: '-.',
}

export class SonsNos {
  private ruidoBuf: AudioBuffer | null = null
  private radioStatic: GainNode | null = null
  private radioVoz: GainNode | null = null
  private gritoNos: { osc: OscillatorNode; g: GainNode; ruidoG: GainNode } | null = null
  private casaReal: GainNode | null = null
  private fitaG: GainNode | null = null
  private fogoG: GainNode | null = null

  private get ctx(): AudioContext | null {
    return audio.contexto
  }

  private get out(): AudioNode | null {
    return audio.saida
  }

  private buf(): AudioBuffer | null {
    const ctx = this.ctx
    if (!ctx) return null
    if (!this.ruidoBuf) this.ruidoBuf = ruido(ctx, 3)
    return this.ruidoBuf
  }

  /** Os laços (rádio, grito, casa, fita) a zero. Os bipes já agendados terminam. */
  silenciar(segundos = 0.3): void {
    this.radio(0, 0, segundos)
    this.pararGrito(segundos)
    this.setCasaReal(0, segundos)
    this.fita(0, segundos)
    this.fogo(0, segundos)
    this.cortarCacofonia(false)
  }

  /** Um bipe de monitor cardíaco, agendado `quando` segundos à frente. */
  bip(quando = 0, dur = 0.09, freq = 988, vol = 0.06): void {
    const ctx = this.ctx
    const out = this.out
    if (!ctx || !out) return
    const t = ctx.currentTime + quando
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.006)
    g.gain.setValueAtTime(vol, t + dur - 0.01)
    g.gain.linearRampToValueAtTime(0, t + dur)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  /**
   * Uma palavra em Morse, nos bipes do monitor. Parece arritmia. Devolve
   * quanto tempo leva, para a cena voltar ao ritmo normal depois.
   */
  morse(palavra: string, inicio = 0): number {
    let t = inicio
    for (const letra of palavra.toUpperCase()) {
      const cod = MORSE[letra]
      if (!cod) {
        t += 0.6
        continue
      }
      for (const sinal of cod) {
        const dur = sinal === '.' ? 0.09 : 0.3
        this.bip(t, dur)
        t += dur + 0.13
      }
      t += 0.42
    }
    return t - inicio
  }

  /** A chave girando na porta da frente: tilintar, e a lingueta. */
  chave(): void {
    const ctx = this.ctx
    const out = this.out
    if (!ctx || !out) return
    const t0 = ctx.currentTime
    const tins = [0, 0.09, 0.16, 0.31]
    for (const [i, dt] of tins.entries()) {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = [3150, 4120, 2680, 3620][i] ?? 3000
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t0 + dt)
      g.gain.linearRampToValueAtTime(0.03, t0 + dt + 0.003)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.18)
      o.connect(g).connect(out)
      o.start(t0 + dt)
      o.stop(t0 + dt + 0.2)
    }
    // A lingueta: um estalo seco, e o corpo da porta respondendo.
    const b = this.buf()
    if (!b) return
    for (const [dt, f, v] of [[0.62, 1500, 0.2], [0.78, 900, 0.14]] as const) {
      const src = ctx.createBufferSource()
      src.buffer = b
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = f
      bp.Q.value = 3
      const g = ctx.createGain()
      g.gain.setValueAtTime(v, t0 + dt)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.07)
      src.connect(bp).connect(g).connect(out)
      src.start(t0 + dt, Math.random(), 0.1)
    }
  }

  /**
   * A resposta do outro lado da porta: três devagar, três rápidas. Junto
   * com as três curtas que Liam bate, fecha uma frase que ele não sabe ler.
   */
  baterResposta(depois = 0): void {
    const tempos = [0, 0.82, 1.64, 2.5, 2.74, 2.98]
    for (const [i, t] of tempos.entries()) {
      window.setTimeout(() => audio.bater(1, 0), depois + t * 1000)
      void i
    }
  }

  /** Um fio arrebentando: estalo e um zunido que desce. */
  estalo(atraso = 0): void {
    const ctx = this.ctx
    const out = this.out
    if (!ctx || !out) return
    const t = ctx.currentTime + atraso
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.setValueAtTime(2300, t)
    o.frequency.exponentialRampToValueAtTime(420, t + 0.16)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.07, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + 0.25)
    const b = this.buf()
    if (!b) return
    const src = ctx.createBufferSource()
    src.buffer = b
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 2400
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.12, t)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)
    src.connect(hp).connect(ng).connect(out)
    src.start(t, Math.random(), 0.05)
  }

  /** Prato quebrando: o estouro da louça e os cacos tilintando no chão. */
  prato(atraso = 0): void {
    const ctx = this.ctx
    const out = this.out
    const b = this.buf()
    if (!ctx || !out || !b) return
    const t = ctx.currentTime + atraso
    const src = ctx.createBufferSource()
    src.buffer = b
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 3200
    bp.Q.value = 0.6
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.34, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
    src.connect(bp).connect(g).connect(out)
    src.start(t, Math.random(), 0.32)
    // Os cacos: tons agudos e curtos, cada um caindo um pouco depois.
    for (let i = 0; i < 6; i++) {
      const tt = t + 0.04 + Math.random() * 0.32
      const o = ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.value = 2600 + Math.random() * 3200
      const og = ctx.createGain()
      og.gain.setValueAtTime(0.035, tt)
      og.gain.exponentialRampToValueAtTime(0.0001, tt + 0.12 + Math.random() * 0.2)
      o.connect(og).connect(out)
      o.start(tt)
      o.stop(tt + 0.4)
    }
  }

  /** Passo pesado no assoalho, vindo de outro cômodo. */
  passo(atraso = 0, forca = 1): void {
    const ctx = this.ctx
    const out = this.out
    if (!ctx || !out) return
    const t = ctx.currentTime + atraso
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(82, t)
    o.frequency.exponentialRampToValueAtTime(44, t + 0.14)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.32 * forca, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + 0.25)
  }

  /** Um passo de Liam no assoalho: leve, e às vezes a tábua range. */
  pisada(forca = 1): void {
    const ctx = this.ctx
    const out = this.out
    const b = this.buf()
    if (!ctx || !out || !b) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(120 + Math.random() * 30, t)
    o.frequency.exponentialRampToValueAtTime(60, t + 0.07)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.09 * forca, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + 0.12)
    const src = ctx.createBufferSource()
    src.buffer = b
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 900 + Math.random() * 500
    bp.Q.value = 1.5
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.05 * forca, t)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
    src.connect(bp).connect(ng).connect(out)
    src.start(t, Math.random(), 0.06)
    // A tábua que range, uma vez ou outra.
    if (Math.random() < 0.12) {
      const r = ctx.createOscillator()
      r.type = 'sawtooth'
      const f0 = 300 + Math.random() * 200
      r.frequency.setValueAtTime(f0, t + 0.03)
      r.frequency.linearRampToValueAtTime(f0 * 0.82, t + 0.33)
      const rlp = ctx.createBiquadFilter()
      rlp.type = 'bandpass'
      rlp.frequency.value = 900
      rlp.Q.value = 6
      const rg = ctx.createGain()
      rg.gain.setValueAtTime(0.0001, t + 0.03)
      rg.gain.linearRampToValueAtTime(0.025 * forca, t + 0.1)
      rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
      r.connect(rlp).connect(rg).connect(out)
      r.start(t + 0.03)
      r.stop(t + 0.38)
    }
  }

  /** Porta: a maçaneta, a dobradiça e a batida de leve no batente. */
  porta(): void {
    const ctx = this.ctx
    const out = this.out
    const b = this.buf()
    if (!ctx || !out || !b) return
    const t = ctx.currentTime
    // Maçaneta: dois cliques metálicos.
    for (const [d, f] of [[0, 2600], [0.07, 2100]] as const) {
      const src = ctx.createBufferSource()
      src.buffer = b
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = f
      bp.Q.value = 8
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.12, t + d)
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.04)
      src.connect(bp).connect(g).connect(out)
      src.start(t + d, Math.random(), 0.05)
    }
    // Dobradiça.
    const r = ctx.createOscillator()
    r.type = 'sawtooth'
    r.frequency.setValueAtTime(520, t + 0.1)
    r.frequency.linearRampToValueAtTime(380 + Math.random() * 120, t + 0.5)
    const rbp = ctx.createBiquadFilter()
    rbp.type = 'bandpass'
    rbp.frequency.value = 1300
    rbp.Q.value = 5
    const rg = ctx.createGain()
    rg.gain.setValueAtTime(0.0001, t + 0.1)
    rg.gain.linearRampToValueAtTime(0.022, t + 0.2)
    rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
    r.connect(rbp).connect(rg).connect(out)
    r.start(t + 0.1)
    r.stop(t + 0.6)
    // A batida da porta fechando atrás dele.
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(110, t + 0.62)
    o.frequency.exponentialRampToValueAtTime(55, t + 0.8)
    const og = ctx.createGain()
    og.gain.setValueAtTime(0.0001, t + 0.62)
    og.gain.linearRampToValueAtTime(0.16, t + 0.63)
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.85)
    o.connect(og).connect(out)
    o.start(t + 0.62)
    o.stop(t + 0.9)
  }

  /** Papel rasgando, devagar e depois de uma vez. */
  rasgar(atraso = 0): void {
    const ctx = this.ctx
    const out = this.out
    const b = this.buf()
    if (!ctx || !out || !b) return
    const t = ctx.currentTime + atraso
    const src = ctx.createBufferSource()
    src.buffer = b
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.4
    bp.frequency.setValueAtTime(1300, t)
    bp.frequency.linearRampToValueAtTime(4200, t + 0.42)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.16, t + 0.05)
    for (let i = 1; i < 9; i++) g.gain.setValueAtTime(0.06 + Math.random() * 0.14, t + i * 0.045)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    src.connect(bp).connect(g).connect(out)
    src.start(t, Math.random(), 0.55)
  }

  /** O fogo subindo pelos fios: um chiado grave com estalos. */
  iniciarFogo(): void {
    const ctx = this.ctx
    const out = this.out
    if (!ctx || !out || this.fogoG) return
    const len = Math.floor(ctx.sampleRate * 2)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    let ultimo = 0
    for (let i = 0; i < len; i++) {
      ultimo = (ultimo + 0.05 * (Math.random() * 2 - 1)) / 1.05
      // Um estalo de vez em quando, seco
      const estalo = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : 0
      d[i] = ultimo * 2.4 + estalo
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 2400
    const g = ctx.createGain()
    g.gain.value = 0
    src.connect(lp).connect(g).connect(out)
    src.start()
    this.fogoG = g
  }

  fogo(nivel: number, segundos = 0.4): void {
    const ctx = this.ctx
    const g = this.fogoG
    if (!ctx || !g) return
    const t = ctx.currentTime
    g.gain.cancelScheduledValues(t)
    g.gain.setValueAtTime(g.gain.value, t)
    g.gain.linearRampToValueAtTime(nivel, t + segundos)
  }

  /** A onda do grito: um baque grave que empurra tudo, e o ar depois. */
  onda(): void {
    const ctx = this.ctx
    const out = this.out
    if (!ctx || !out) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(64, t)
    o.frequency.exponentialRampToValueAtTime(26, t + 1.4)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.55, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + 1.7)
    const b = this.buf()
    if (!b) return
    const src = ctx.createBufferSource()
    src.buffer = b
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(5000, t)
    lp.frequency.exponentialRampToValueAtTime(200, t + 1.2)
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.3, t)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.3)
    src.connect(lp).connect(ng).connect(out)
    src.start(t, 0, 1.4)
  }

  /**
   * A voz de Liam segurando o grito: uma vogal aberta, rouca. `nivel` de 0
   * a 1 é quanto ele já deixou sair.
   */
  iniciarGrito(): void {
    const ctx = this.ctx
    const out = this.out
    if (!ctx || !out || this.gritoNos) return
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = 176
    const vib = ctx.createOscillator()
    vib.frequency.value = 5.4
    const vibG = ctx.createGain()
    vibG.gain.value = 3.2
    vib.connect(vibG).connect(osc.frequency)
    vib.start()
    const g = ctx.createGain()
    g.gain.value = 0
    // Duas formantes de "a": é o que transforma serra em voz.
    for (const [f, q, v] of [[780, 7, 1], [1220, 9, 0.7], [2600, 12, 0.25]] as const) {
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = f
      bp.Q.value = q
      const fg = ctx.createGain()
      fg.gain.value = v
      osc.connect(bp).connect(fg).connect(g)
    }
    const b = this.buf()
    const ruidoG = ctx.createGain()
    ruidoG.gain.value = 0
    if (b) {
      const src = ctx.createBufferSource()
      src.buffer = b
      src.loop = true
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 1400
      bp.Q.value = 0.8
      src.connect(bp).connect(ruidoG).connect(out)
      src.start()
    }
    g.connect(out)
    osc.start()
    this.gritoNos = { osc, g, ruidoG }
  }

  grito(nivel: number): void {
    const n = this.gritoNos
    const ctx = this.ctx
    if (!n || !ctx) return
    const t = ctx.currentTime
    n.g.gain.setTargetAtTime(nivel * 0.34, t, 0.05)
    n.ruidoG.gain.setTargetAtTime(nivel * nivel * 0.1, t, 0.05)
    n.osc.frequency.setTargetAtTime(176 + nivel * 70, t, 0.1)
  }

  pararGrito(segundos = 0.08): void {
    const n = this.gritoNos
    const ctx = this.ctx
    if (!n || !ctx) return
    const t = ctx.currentTime
    n.g.gain.cancelScheduledValues(t)
    n.g.gain.setTargetAtTime(0, t, segundos / 3)
    n.ruidoG.gain.setTargetAtTime(0, t, segundos / 3)
  }

  /** Rádio: chiado de estação e uma voz que é só contorno. */
  iniciarRadio(): void {
    const ctx = this.ctx
    const out = this.out
    const b = this.buf()
    if (!ctx || !out || !b || this.radioStatic) return
    const st = ctx.createBufferSource()
    st.buffer = b
    st.loop = true
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 900
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 5200
    const sg = ctx.createGain()
    sg.gain.value = 0
    st.connect(hp).connect(lp).connect(sg).connect(out)
    st.start()
    this.radioStatic = sg

    const vz = ctx.createBufferSource()
    vz.buffer = b
    vz.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1100
    bp.Q.value = 5
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 3.3
    const lfoG = ctx.createGain()
    lfoG.gain.value = 420
    lfo.connect(lfoG).connect(bp.frequency)
    lfo.start()
    // Sílabas: o volume abre e fecha no ritmo de alguém lendo notícia.
    const am = ctx.createGain()
    am.gain.value = 0.5
    const sil = ctx.createOscillator()
    sil.frequency.value = 6.2
    const silG = ctx.createGain()
    silG.gain.value = 0.5
    sil.connect(silG).connect(am.gain)
    sil.start()
    const vg = ctx.createGain()
    vg.gain.value = 0
    vz.connect(bp).connect(am).connect(vg).connect(out)
    vz.start()
    this.radioVoz = vg
  }

  radio(estatica: number, voz: number, segundos = 0.4): void {
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    for (const [g, v] of [[this.radioStatic, estatica], [this.radioVoz, voz]] as const) {
      if (!g) continue
      g.gain.cancelScheduledValues(t)
      g.gain.setValueAtTime(g.gain.value, t)
      g.gain.linearRampToValueAtTime(v, t + segundos)
    }
  }

  /**
   * A casa sem música: geladeira, chuva no telhado. O relógio é tique a
   * tique, pela cena.
   */
  iniciarCasaReal(): void {
    const ctx = this.ctx
    const out = this.out
    const b = this.buf()
    if (!ctx || !out || !b || this.casaReal) return
    const g = ctx.createGain()
    g.gain.value = 0
    g.connect(out)
    this.casaReal = g
    for (const [f, v] of [[60, 0.05], [120, 0.022], [180.4, 0.01]] as const) {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f
      const og = ctx.createGain()
      og.gain.value = v
      o.connect(og).connect(g)
      o.start()
    }
    const chuva = ctx.createBufferSource()
    chuva.buffer = b
    chuva.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2600
    bp.Q.value = 0.5
    const cg = ctx.createGain()
    cg.gain.value = 0.07
    chuva.connect(bp).connect(cg).connect(g)
    chuva.start()
  }

  setCasaReal(nivel: number, segundos = 2): void {
    const ctx = this.ctx
    const g = this.casaReal
    if (!ctx || !g) return
    const t = ctx.currentTime
    g.gain.cancelScheduledValues(t)
    g.gain.setValueAtTime(g.gain.value, t)
    g.gain.linearRampToValueAtTime(nivel, t + segundos)
  }

  /** Tique do relógio da parede. */
  tique(forte = false, volume = 1): void {
    const ctx = this.ctx
    const out = this.out
    const b = this.buf()
    if (!ctx || !out || !b) return
    const t = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = b
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = forte ? 2400 : 3200
    bp.Q.value = 6
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.09 * volume, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)
    src.connect(bp).connect(g).connect(out)
    src.start(t, Math.random(), 0.04)
  }

  /** Secretária eletrônica: o bipe longo e o chiado da fita. */
  secretaria(): void {
    this.bip(0, 0.55, 1020, 0.06)
    const ctx = this.ctx
    const out = this.out
    const b = this.buf()
    if (!ctx || !out || !b || this.fitaG) return
    const src = ctx.createBufferSource()
    src.buffer = b
    src.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 3000
    const g = ctx.createGain()
    g.gain.value = 0
    src.connect(lp).connect(g).connect(out)
    src.start()
    this.fitaG = g
  }

  fita(nivel: number, segundos = 0.5): void {
    const ctx = this.ctx
    const g = this.fitaG
    if (!ctx || !g) return
    const t = ctx.currentTime
    g.gain.cancelScheduledValues(t)
    g.gain.setValueAtTime(g.gain.value, t)
    g.gain.linearRampToValueAtTime(nivel, t + segundos)
  }

  // --- O caos por baixo dos gritos ---------------------------------------

  private caosBus: GainNode | null = null
  private curvaRasgo: Float32Array<ArrayBuffer> | null = null

  /** Um compressor na frente: o caos pode empilhar sem estourar. */
  private barramentoCaos(): GainNode | null {
    const ctx = this.ctx
    const out = this.out
    if (!ctx || !out) return null
    if (this.caosBus) return this.caosBus
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 6
    comp.attack.value = 0.003
    comp.release.value = 0.25
    comp.connect(out)
    const g = ctx.createGain()
    g.gain.value = 1.25
    g.connect(comp)
    this.caosBus = g
    return g
  }

  private rasgo(ctx: AudioContext): WaveShaperNode {
    if (!this.curvaRasgo) {
      const c = new Float32Array(1024)
      for (let i = 0; i < c.length; i++) {
        const x = (i / (c.length - 1)) * 2 - 1
        c[i] = Math.tanh(x * 8) / Math.tanh(8)
      }
      this.curvaRasgo = c
    }
    const w = ctx.createWaveShaper()
    w.curve = this.curvaRasgo
    w.oversample = '2x'
    return w
  }

  /**
   * O caos por baixo de um grito: muita coisa de uma vez, e nunca a mesma
   * mistura. Sempre o baque grave e o piano esmagado; por cima, sorteados,
   * uma serra rasgada que abre e fecha, um guincho de ruído, louça, estática,
   * cordas raspando agudo, um sopro ao contrário e o zumbido no ouvido que
   * fica depois. `forca` de 0 a 1.
   */
  caos(forca = 1): void {
    const ctx = this.ctx
    const bus = this.barramentoCaos()
    const b = this.buf()
    if (!ctx || !bus || !b) return
    const f = Math.max(0.2, Math.min(1, forca))
    const t = ctx.currentTime + 0.005

    // O baque: um grave que despenca.
    const sub = ctx.createOscillator()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(70, t)
    sub.frequency.exponentialRampToValueAtTime(26, t + 0.55)
    const sg = ctx.createGain()
    sg.gain.setValueAtTime(0.0001, t)
    sg.gain.linearRampToValueAtTime(0.55 * f, t + 0.01)
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
    sub.connect(sg).connect(bus)
    sub.start(t)
    sub.stop(t + 0.75)

    // O piano esmagado: quatro notas graves que não combinam.
    const raiz = [55, 58.27, 61.74, 49][Math.floor(Math.random() * 4)] ?? 55
    for (const semi of [0, 1, 6, 13]) musica.nota(raiz * Math.pow(2, semi / 12), 0.95 * f, 2.8)

    const extras: (() => void)[] = [
      // Serra rasgada: três dentes de serra desafinados que abrem e fecham.
      () => {
        const lp = ctx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.Q.value = 4
        lp.frequency.setValueAtTime(260, t)
        lp.frequency.exponentialRampToValueAtTime(2600, t + 0.18)
        lp.frequency.exponentialRampToValueAtTime(420, t + 1.4)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(0.16 * f, t + 0.04)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5)
        const w = this.rasgo(ctx)
        w.connect(lp).connect(g).connect(bus)
        for (const m of [1, 1.059, 1.414]) {
          const o = ctx.createOscillator()
          o.type = 'sawtooth'
          o.frequency.value = raiz * 2 * m
          o.detune.value = (Math.random() - 0.5) * 30
          const og = ctx.createGain()
          og.gain.value = 0.35
          o.connect(og).connect(w)
          o.start(t)
          o.stop(t + 1.55)
        }
      },
      // Guincho: ruído num filtro estreito que sobe como um grito de metal.
      () => {
        const src = ctx.createBufferSource()
        src.buffer = b
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.Q.value = 9
        bp.frequency.setValueAtTime(700, t)
        bp.frequency.exponentialRampToValueAtTime(4200, t + 0.28)
        bp.frequency.exponentialRampToValueAtTime(1300, t + 1)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(0.5 * f, t + 0.05)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.05)
        src.connect(bp).connect(g).connect(bus)
        src.start(t, Math.random(), 1.1)
      },
      // Louça: cacos agudos espalhados.
      () => {
        for (let i = 0; i < 9; i++) {
          const tt = t + Math.random() * 0.75
          const o = ctx.createOscillator()
          o.type = 'triangle'
          o.frequency.value = 2200 + Math.random() * 4400
          const og = ctx.createGain()
          og.gain.setValueAtTime(0.045 * f, tt)
          og.gain.exponentialRampToValueAtTime(0.0001, tt + 0.08 + Math.random() * 0.18)
          o.connect(og).connect(bus)
          o.start(tt)
          o.stop(tt + 0.3)
        }
      },
      // Estática picotada, como um rádio caindo.
      () => {
        const src = ctx.createBufferSource()
        src.buffer = b
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.frequency.value = 1900
        bp.Q.value = 0.7
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t)
        const passo = 1 / (18 + Math.random() * 14)
        for (let k = 0; k < 18; k++) g.gain.setValueAtTime(Math.random() < 0.6 ? 0.2 * f * (1 - k / 18) : 0, t + k * passo)
        g.gain.setValueAtTime(0, t + 18 * passo)
        src.connect(bp).connect(g).connect(bus)
        src.start(t, Math.random(), 0.8)
      },
      // Cordas raspando em segunda menor, lá em cima.
      () => {
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.frequency.value = 2100
        bp.Q.value = 1.2
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(0.07 * f, t + 0.12)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
        bp.connect(g).connect(bus)
        const vib = ctx.createOscillator()
        vib.frequency.value = 7.5
        const vg = ctx.createGain()
        vg.gain.value = 22
        vib.connect(vg)
        for (const fr of [1480, 1568]) {
          const o = ctx.createOscillator()
          o.type = 'sawtooth'
          o.frequency.value = fr
          vg.connect(o.frequency)
          o.connect(bp)
          o.start(t)
          o.stop(t + 1.65)
        }
        vib.start(t)
        vib.stop(t + 1.65)
      },
      // Um sopro ao contrário: cresce e corta seco.
      () => {
        const src = ctx.createBufferSource()
        src.buffer = b
        const lp = ctx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.setValueAtTime(400, t + 0.2)
        lp.frequency.exponentialRampToValueAtTime(6000, t + 0.95)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.0001, t + 0.2)
        g.gain.exponentialRampToValueAtTime(0.3 * f, t + 0.95)
        g.gain.setValueAtTime(0, t + 0.96)
        src.connect(lp).connect(g).connect(bus)
        src.start(t + 0.2, Math.random(), 0.8)
      },
      // O zumbido que fica no ouvido.
      () => this.zumbido(f * 0.8, 3),
    ]
    // Embaralha e escolhe: grito inteiro em maiúsculas leva quase tudo.
    for (let i = extras.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const a = extras[i]
      extras[i] = extras[j] as () => void
      extras[j] = a as () => void
    }
    const quantos = 2 + Math.round(f * 3)
    for (const e of extras.slice(0, quantos)) e()
    audio.heartbeat(0.16 + f * 0.1)
  }

  /** Apito agudo no ouvido, depois de um estouro. */
  zumbido(forca = 1, segundos = 3): void {
    const ctx = this.ctx
    const bus = this.barramentoCaos()
    if (!ctx || !bus) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = 5600 + Math.random() * 2400
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.03 * forca, t + 0.25)
    g.gain.exponentialRampToValueAtTime(0.0001, t + segundos)
    o.connect(g).connect(bus)
    o.start(t)
    o.stop(t + segundos + 0.05)
  }

  // --- A cacofonia: a gritaria que cresce até não caber mais nada ---------

  private cacofoniaNos: { oscs: OscillatorNode[]; fontes: AudioScheduledSourceNode[]; g: GainNode; lp: BiquadFilterNode; multidao: GainNode; base: number[] } | null = null

  iniciarCacofonia(): void {
    const ctx = this.ctx
    const bus = this.barramentoCaos()
    const b = this.buf()
    if (!ctx || !bus || !b || this.cacofoniaNos) return
    const g = ctx.createGain()
    g.gain.value = 0
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 300
    lp.Q.value = 2
    const w = this.rasgo(ctx)
    w.connect(lp).connect(g).connect(bus)
    // Cinco serras em intervalos que brigam entre si; sobem juntas.
    const base = [73.42, 77.78, 103.83, 110, 155.56]
    const oscs = base.map((fr) => {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = fr
      o.detune.value = (Math.random() - 0.5) * 24
      const og = ctx.createGain()
      og.gain.value = 0.22
      o.connect(og).connect(w)
      o.start()
      return o
    })
    // Uma multidão sem palavras: ruído com a banda passeando.
    const src = ctx.createBufferSource()
    src.buffer = b
    src.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 700
    bp.Q.value = 3
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 4.3
    const lg = ctx.createGain()
    lg.gain.value = 380
    lfo.connect(lg).connect(bp.frequency)
    lfo.start()
    const multidao = ctx.createGain()
    multidao.gain.value = 0
    src.connect(bp).connect(multidao).connect(bus)
    src.start()
    this.cacofoniaNos = { oscs, fontes: [src, lfo], g, lp, multidao, base }
  }

  /** 0 a 1: quanto a gritaria já subiu. */
  cacofonia(nivel: number): void {
    const n = this.cacofoniaNos
    const ctx = this.ctx
    if (!n || !ctx) return
    const t = ctx.currentTime
    const v = Math.max(0, Math.min(1, nivel))
    n.g.gain.setTargetAtTime(v * 0.15, t, 0.15)
    n.multidao.gain.setTargetAtTime(v * 0.13, t, 0.15)
    n.lp.frequency.setTargetAtTime(300 + v * v * 3800, t, 0.2)
    n.oscs.forEach((o, i) => o.frequency.setTargetAtTime((n.base[i] ?? 80) * (1 + v * 0.9), t, 0.3))
  }

  /** Corte seco. Sobra só o zumbido no ouvido. */
  cortarCacofonia(zumbido = true): void {
    const n = this.cacofoniaNos
    const ctx = this.ctx
    if (!n || !ctx) return
    const t = ctx.currentTime
    n.g.gain.cancelScheduledValues(t)
    n.g.gain.setValueAtTime(0, t + 0.02)
    n.multidao.gain.cancelScheduledValues(t)
    n.multidao.gain.setValueAtTime(0, t + 0.02)
    for (const o of [...n.oscs, ...n.fontes]) o.stop(t + 0.05)
    this.cacofoniaNos = null
    if (zumbido) this.zumbido(1, 4.5)
  }
}

export const audio = new Audio()
export const sons = new SonsNos()
