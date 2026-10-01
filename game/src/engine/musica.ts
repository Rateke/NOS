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
  /** A trilha de fundo (não o piano da cena): sobe e desce inteira. */
  private fundo: GainNode | null = null
  /** Camada "completa": cordas por baixo do piano, só nos picos. */
  private completo: GainNode | null = null
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

    this.fundo = ctx.createGain()
    this.fundo.gain.value = 1
    this.fundo.connect(this.saida)
    this.fundo.connect(this.envioReverb)
    this.completo = ctx.createGain()
    this.completo.gain.value = 0
    this.completo.connect(this.saida)
    this.completo.connect(this.envioReverb)
  }

  private rampa(g: GainNode | null, nivel: number, segundos: number): void {
    if (!this.ctx || !g) return
    const t = this.ctx.currentTime
    g.gain.cancelScheduledValues(t)
    g.gain.setValueAtTime(g.gain.value, t)
    g.gain.linearRampToValueAtTime(nivel, t + Math.max(0.01, segundos))
  }

  /** Volume da trilha de fundo. 0 some com ela sem cortar as notas no meio. */
  setFundo(nivel: number, segundos = 2): void {
    this.rampa(this.fundo, nivel, segundos)
  }

  /** A versão com todos os instrumentos entra por cima do piano, ou sai. */
  setCompleto(nivel: number, segundos = 1.5): void {
    this.rampa(this.completo, nivel, segundos)
  }

  /**
   * Uma corda (violoncelo, viola): serra filtrada com ataque lento e um
   * vibrato quase parado. Só existe na camada completa.
   */
  corda(freq: number, duracao = 6, forca = 0.5): void {
    const ctx = this.ctx
    const dest = this.completo
    if (!ctx || !dest) return
    const t = ctx.currentTime
    const f = freq * Math.pow(2, this.desafinado / 12)
    const g = ctx.createGain()
    const pico = 0.05 * forca
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(pico, t + Math.min(1.6, duracao * 0.3))
    g.gain.setValueAtTime(pico, t + duracao * 0.7)
    g.gain.linearRampToValueAtTime(0, t + duracao)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 900 + forca * 500
    lp.Q.value = 0.4
    for (const dt of [-5, 5]) {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = f
      o.detune.value = dt
      const vib = ctx.createOscillator()
      vib.frequency.value = 4.6
      const vg = ctx.createGain()
      vg.gain.value = f * 0.0035
      vib.connect(vg).connect(o.frequency)
      vib.start(t)
      vib.stop(t + duracao + 0.1)
      o.connect(lp)
      o.start(t)
      o.stop(t + duracao + 0.1)
    }
    lp.connect(g).connect(dest)
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
  nota(freqBase: number, forca = 1, duracao = 3.2, bus: 'piano' | 'fundo' | 'completo' = 'piano'): void {
    const ctx = this.ctx
    if (!ctx || !this.saida || !this.envioReverb) return
    const destino = bus === 'fundo' ? this.fundo : bus === 'completo' ? this.completo : null
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
    if (destino) {
      filtro.connect(destino)
    } else {
      filtro.connect(this.saida)
      filtro.connect(this.envioReverb)
    }
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

// --- Trilha ----------------------------------------------------------------

/** Frequências usadas nas composições. */
const N = {
  G1: 49.0, A1: 55.0, Bb1: 58.27, D2: 73.42, F2: 87.31, G2: 98.0, A2: 110.0, Bb2: 116.54,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, Bb3: 233.08,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0,
} as const

export interface Evento {
  /** Instante dentro do laço, em segundos. */
  t: number
  freq: number
  forca: number
  dur?: number
  /** Só toca na versão completa: cordas e dobras por baixo do piano. */
  completo?: boolean
  /** Corda em vez de piano (só na camada completa). */
  corda?: boolean
}

/**
 * A trilha da casa.
 *
 * Piano nos graves e nada de crescer: a mesma força do começo ao fim, lenta,
 * abafada, com a cauda da reverberação fazendo o trabalho. Quatro acordes que
 * não resolvem — ré menor, si bemol com sétima maior, sol menor, lá com a
 * quarta suspensa — e o laço volta ao começo sem nunca pousar.
 *
 * Por cima, o tema que Adrian ensina, uma oitava abaixo, devagar: dá para
 * reconhecer, mas não dá para cantar junto.
 *
 * A camada completa (cordas e o baixo dobrado) fica escrita junto, calada.
 * Só entra nos picos, e entra inteira — não vai crescendo.
 */
export const TEMA_PRINCIPAL: Evento[] = (() => {
  const ev: Evento[] = []
  const BAR = 7.2
  const acordes: { baixo: number; dentro: number[]; cordas: number[] }[] = [
    { baixo: N.D2, dentro: [N.F3, N.A3], cordas: [N.D3, N.F3, N.A3] },
    { baixo: N.Bb1, dentro: [N.D3, N.A3], cordas: [N.Bb2, N.D3, N.A3] },
    { baixo: N.G1, dentro: [N.Bb2, N.D3], cordas: [N.G2, N.Bb2, N.D3] },
    { baixo: N.A1, dentro: [N.D3, N.E3], cordas: [N.A2, N.D3, N.E3] },
  ]
  acordes.forEach((a, i) => {
    const t0 = i * BAR
    // Mão esquerda: a oitava grave, e as vozes de dentro depois de um respiro.
    ev.push({ t: t0, freq: a.baixo, forca: 0.46, dur: 7 })
    ev.push({ t: t0 + 0.05, freq: a.baixo * 2, forca: 0.3, dur: 6 })
    a.dentro.forEach((f, k) => ev.push({ t: t0 + 1.6 + k * 0.5, freq: f, forca: 0.24, dur: 5 }))
    // Camada completa: cordas sustentando o acorde e o baixo dobrado.
    for (const f of a.cordas) ev.push({ t: t0 + 0.1, freq: f, forca: 0.55, dur: BAR, completo: true, corda: true })
    ev.push({ t: t0 + 0.1, freq: a.baixo, forca: 0.6, dur: BAR, completo: true, corda: true })
  })
  // O tema do Adrian, uma oitava abaixo, espalhado pelos quatro compassos.
  const melodia: [number, number][] = [
    [2.6, N.D3], [3.7, N.F3], [4.8, N.A3], [6.2, N.G3],
    [BAR + 2.6, N.D3], [BAR + 3.6, N.F3], [BAR + 4.6, N.A3], [BAR + 5.6, N.C4], [BAR + 6.6, N.Bb3],
    [BAR * 2 + 2.6, N.A3], [BAR * 2 + 3.8, N.G3], [BAR * 2 + 5.0, N.F3],
    [BAR * 3 + 2.6, N.E3], [BAR * 3 + 4.4, N.D3],
  ]
  for (const [t, freq] of melodia) ev.push({ t, freq, forca: 0.36, dur: 4.6 })
  // Na versão completa a melodia ganha a oitava de cima, bem baixinho.
  for (const [t, freq] of melodia) ev.push({ t: t + 0.02, freq: freq * 2, forca: 0.18, dur: 4, completo: true })
  return ev.sort((a, b) => a.t - b.t)
})()

export const DURACAO_PRINCIPAL = 7.2 * 4

/**
 * Toca uma sequência em laço, disparando as notas quadro a quadro. Simples de
 * propósito: a música é lenta, não precisa de precisão de sequenciador.
 */
export class Trilha {
  private eventos: Evento[] = []
  private duracao = 1
  private t = 0
  private proximo = 0
  private tocando = false

  iniciar(eventos: Evento[], duracao: number): void {
    this.eventos = eventos
    this.duracao = duracao
    this.t = 0
    this.proximo = 0
    this.tocando = true
  }

  parar(): void {
    this.tocando = false
  }

  get ativa(): boolean {
    return this.tocando
  }

  update(dt: number): void {
    if (!this.tocando) return
    this.t += dt
    while (this.proximo < this.eventos.length) {
      const e = this.eventos[this.proximo]
      if (!e || e.t > this.t) break
      if (e.corda) musica.corda(e.freq, e.dur ?? 6, e.forca)
      else musica.nota(e.freq, e.forca, e.dur ?? 3.2, e.completo ? 'completo' : 'fundo')
      this.proximo++
    }
    if (this.t >= this.duracao) {
      this.t -= this.duracao
      this.proximo = 0
    }
  }
}
