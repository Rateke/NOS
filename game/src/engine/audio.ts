/**
 * Áudio inteiramente sintetizado — o jogo não carrega nenhum arquivo de som.
 * O ambiente é um drone grave com ruído filtrado; os efeitos são envelopes
 * curtos. Serve de base até existir trilha de verdade.
 */
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

  pickup(): void {
    this.ping(523.25, 0.13, 0.055, 'triangle')
    window.setTimeout(() => this.ping(784, 0.2, 0.04, 'triangle'), 70)
  }

  /** Quando Liam se recusa a sair. Grave, fechado. */
  refuse(): void {
    this.ping(98, 0.34, 0.075, 'sine')
  }

  reveal(): void {
    this.ping(196, 1.5, 0.07, 'sine')
    window.setTimeout(() => this.ping(294, 1.8, 0.05, 'sine'), 180)
  }
}

export const audio = new Audio()
