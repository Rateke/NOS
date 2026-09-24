/**
 * Piano e trilha.
 *
 * Nada de arquivo de áudio: o piano é sintetizado por harmônicos com envelope
 * e filtro que fecha, e todo mundo passa por uma reverberação longa gerada na
 * hora. É o que dá o peso — piano seco soa a brinquedo; com cauda, soa a casa
 * vazia.
 *
 * O tema é uma única melodia em ré menor, em três frases: enunciado, extensão
 * e queda. É ela que Adrian ensina no prólogo — e é ela que volta, desafinada,
 * na câmara do Tear.
 */

/** Ré menor natural, de D4 a D5. As oito teclas do piano da cena. */
export const ESCALA = [293.66, 329.63, 349.23, 392.0, 440.0, 466.16, 523.25, 587.33]
export const NOMES_NOTA = ['ré', 'mi', 'fá', 'sol', 'lá', 'sí♭', 'dó', 'ré']

/**
 * O tema, em graus da escala acima.
 * 1: enunciado — sobe e hesita.
 * 2: extensão — vai mais alto e não resolve.
 * 3: queda — desce inteira, até o começo.
 */
export const TEMA: readonly (readonly number[])[] = [
  [0, 2, 4, 3],
  [0, 2, 4, 6, 5],
  [0, 2, 4, 3, 2, 1, 0],
]

export class Musica {
  private ctx: AudioContext | null = null
  private saida: GainNode | null = null
  private reverb: ConvolverNode | null = null
  private envioReverb: GainNode | null = null
  private padGain: GainNode | null = null
  /** Desafinação em semitons: 0 no prólogo, negativa no Tear. */
  desafinado = 0
  /** Abafamento: 0 aberto, 1 sufocado. */
  abafado = 0

  conectar(ctx: AudioContext, destino: AudioNode): void {
    if (this.ctx) return
    this.ctx = ctx

    this.saida = ctx.createGain()
    this.saida.gain.value = 0.9
    this.saida.connect(destino)

    // Reverberação: ruído com queda exponencial vira uma sala grande.
    this.reverb = ctx.createConvolver()
    this.reverb.buffer = this.criarCauda(ctx, 2.9, 2.4)
    const molhado = ctx.createGain()
    molhado.gain.value = 0.62
    this.reverb.connect(molhado).connect(destino)

    this.envioReverb = ctx.createGain()
    this.envioReverb.gain.value = 1
    this.envioReverb.connect(this.reverb)
  }

  private criarCauda(ctx: AudioContext, segundos: number, decaimento: number): AudioBuffer {
    const n = Math.floor(ctx.sampleRate * segundos)
    const buf = ctx.createBuffer(2, n, ctx.sampleRate)
    for (let canal = 0; canal < 2; canal++) {
      const d = buf.getChannelData(canal)
      for (let i = 0; i < n; i++) {
        const t = i / n
        // Pré-atraso curto: a cauda entra depois do ataque, não junto.
        const janela = t < 0.012 ? t / 0.012 : 1
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decaimento) * janela
      }
    }
    return buf
  }

  /**
   * Uma nota de piano. `forca` de 0 a 1 muda volume, brilho e duração —
   * é o que separa uma nota tocada de uma nota apertada.
   */
  nota(freqBase: number, forca = 1, duracao = 3.2): void {
    const ctx = this.ctx
    if (!ctx || !this.saida || !this.envioReverb) return
    const freq = freqBase * Math.pow(2, this.desafinado / 12)
    const t = ctx.currentTime

    const corpo = ctx.createGain()
    corpo.gain.value = 1

    const filtro = ctx.createBiquadFilter()
    filtro.type = 'lowpass'
    const abertura = 4200 - this.abafado * 3400
    filtro.frequency.setValueAtTime(abertura * (0.5 + forca * 0.5), t)
    filtro.frequency.exponentialRampToValueAtTime(Math.max(180, abertura * 0.12), t + duracao * 0.7)
    filtro.Q.value = 0.6

    // Harmônicos com decaimentos diferentes: os agudos morrem antes, como
    // num piano de verdade.
    const parciais: [number, number, number][] = [
      [1, 1, 1], [2, 0.42, 0.72], [3, 0.19, 0.5], [4, 0.1, 0.38], [6, 0.05, 0.28],
    ]
    for (const [mult, amp, dur] of parciais) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq * mult
      // Batimento leve: duas cordas nunca estão exatamente afinadas.
      osc.detune.value = (Math.random() - 0.5) * 6
      const g = ctx.createGain()
      const pico = amp * 0.16 * (0.35 + forca * 0.65)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(pico, t + 0.006)
      g.gain.exponentialRampToValueAtTime(0.0001, t + duracao * dur)
      osc.connect(g).connect(corpo)
      osc.start(t)
      osc.stop(t + duracao * dur + 0.05)
    }

    // Ruído curtíssimo do martelo
    const mart = ctx.createBufferSource()
    const nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate)
    const nd = nb.getChannelData(0)
    for (let i = 0; i < nd.length; i++) {
      nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nd.length, 3)
    }
    mart.buffer = nb
    const mg = ctx.createGain()
    mg.gain.value = 0.03 * forca
    mart.connect(mg).connect(corpo)
    mart.start(t)

    corpo.connect(filtro)
    filtro.connect(this.saida)
    filtro.connect(this.envioReverb)
  }

  /** Um colchão grave por baixo de tudo. Não é melodia: é a casa respirando. */
  iniciarPad(): void {
    const ctx = this.ctx
    if (!ctx || !this.saida || this.padGain) return
    const g = ctx.createGain()
    g.gain.value = 0
    g.connect(this.saida)
    this.padGain = g
    // Ré e lá: a tônica e a quinta, sem terça — nem maior nem menor.
    for (const f of [73.42, 110.0, 146.83]) {
      for (const desvio of [-0.12, 0.12]) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = f
        osc.detune.value = desvio * 100
        const og = ctx.createGain()
        og.gain.value = f < 100 ? 0.11 : 0.05
        osc.connect(og).connect(g)
        osc.start()
      }
    }
  }

  setPad(nivel: number, segundos = 3): void {
    if (!this.ctx || !this.padGain) return
    const t = this.ctx.currentTime
    this.padGain.gain.cancelScheduledValues(t)
    this.padGain.gain.setValueAtTime(this.padGain.gain.value, t)
    this.padGain.gain.linearRampToValueAtTime(nivel, t + segundos)
  }

  /** Toca uma frase inteira, espaçada. Devolve quanto tempo ela vai durar. */
  tocarFrase(graus: readonly number[], passo = 0.62, forca = 0.85): number {
    graus.forEach((grau, i) => {
      const f = ESCALA[grau]
      if (f === undefined) return
      window.setTimeout(() => this.nota(f, forca), i * passo * 1000)
    })
    return graus.length * passo
  }
}

export const musica = new Musica()
