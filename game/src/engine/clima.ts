/**
 * A música por baixo das cenas — o que a trilha de piano não cobre. Não é
 * melodia: são camadas que cada cena dosa.
 *
 * - **pulso**: um contrabaixo dedilhado em ré, colcheias, no andamento que a
 *   cena pedir. É a pressa.
 * - **cordas**: ré e lá sustentados, e duas vozes que vão fechando em
 *   segunda menor conforme o **aperto** sobe — com tremolo, como num filme
 *   de terror. É o aperto no peito.
 * - **relogio**: o tique de um relógio, no ritmo que a cena quiser.
 * - **caixinha**: uma caixinha de música tocando o tema, lá no alto, devagar.
 *   É o Dentro.
 * - **coracao**: o coração batendo, mais rápido quanto mais alto.
 * - **chuva**: chuva na janela, para a casa.
 *
 * As transições são sempre graduais: `set` diz para onde ir e em quanto
 * tempo.
 */
import { audio, sons } from './audio'
import { musica, ESCALA, TEMA } from './musica'

export interface Mistura {
  pulso?: number
  bpm?: number
  cordas?: number
  aperto?: number
  relogio?: number
  /** Segundos entre um tique e outro. */
  ritmoRelogio?: number
  caixinha?: number
  coracao?: number
  chuva?: number
}

type Chave = keyof Mistura
const ZERO: Required<Mistura> = {
  pulso: 0, bpm: 84, cordas: 0, aperto: 0, relogio: 0, ritmoRelogio: 1, caixinha: 0, coracao: 0, chuva: 0,
}
const NOTAS_CAIXINHA = TEMA.flat()

class Clima {
  private atual: Required<Mistura> = { ...ZERO }
  private alvo: Required<Mistura> = { ...ZERO }
  private velocidade: Record<Chave, number> = {
    pulso: 1, bpm: 1, cordas: 1, aperto: 1, relogio: 1, ritmoRelogio: 1, caixinha: 1, coracao: 1, chuva: 1,
  }
  private proxPulso = 0
  private idxPulso = 0
  private proxTique = 0
  private tiqueForte = false
  private proxCaixinha = 0
  private idxCaixinha = 0
  private proxCoracao = 0

  private nos: {
    cordasG: GainNode
    lp: BiquadFilterNode
    tremolo: GainNode
    apertoOscs: OscillatorNode[]
    chuvaG: GainNode
  } | null = null

  /** Para onde a música vai, e em quantos segundos chega. */
  set(m: Mistura, segundos = 2): void {
    for (const k of Object.keys(m) as Chave[]) {
      const v = m[k]
      if (v === undefined) continue
      this.alvo[k] = v
      const dist = Math.abs(v - this.atual[k])
      this.velocidade[k] = segundos <= 0 ? Infinity : Math.max(dist / segundos, 0.0001)
    }
  }

  /** Tudo para zero. */
  parar(segundos = 1.5): void {
    const { bpm: _b, ritmoRelogio: _r, ...resto } = ZERO
    void _b
    void _r
    this.set(resto, segundos)
  }

  private montar(): boolean {
    if (this.nos) return true
    const ctx = audio.contexto
    const out = audio.saida
    if (!ctx || !out) return false

    const cordasG = ctx.createGain()
    cordasG.gain.value = 0
    const tremolo = ctx.createGain()
    tremolo.gain.value = 1
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 700
    lp.Q.value = 0.8
    lp.connect(tremolo).connect(cordasG).connect(out)
    // Tremolo: o volume tremendo rápido. A profundidade sobe com o aperto.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 7
    const lfoG = ctx.createGain()
    lfoG.gain.value = 0
    lfo.connect(lfoG).connect(tremolo.gain)
    lfo.start()

    const corda = (freq: number, vol: number): OscillatorNode => {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = freq
      o.detune.value = (Math.random() - 0.5) * 10
      const vib = ctx.createOscillator()
      vib.frequency.value = 4.6 + Math.random()
      const vg = ctx.createGain()
      vg.gain.value = freq * 0.004
      vib.connect(vg).connect(o.frequency)
      vib.start()
      const g = ctx.createGain()
      g.gain.value = vol
      o.connect(g).connect(lp)
      o.start()
      return o
    }
    // Ré e lá embaixo, firmes.
    corda(73.42, 0.3)
    corda(146.83, 0.22)
    corda(220, 0.16)
    // As duas que apertam: começam em fá e dó e descem até mi bemol e si.
    const apertoOscs = [corda(174.61, 0.14), corda(261.63, 0.1)]

    // Chuva na vidraça: ruído em banda média, com gotas mais fortes.
    const len = ctx.sampleRate * 3
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.0015 ? 3 : 0.5)
    const chuva = ctx.createBufferSource()
    chuva.buffer = buf
    chuva.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2400
    bp.Q.value = 0.4
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 500
    const chuvaG = ctx.createGain()
    chuvaG.gain.value = 0
    chuva.connect(bp).connect(hp).connect(chuvaG).connect(out)
    chuva.start()

    this.nos = { cordasG, lp, tremolo: lfoG, apertoOscs, chuvaG }
    return true
  }

  update(dt: number): void {
    for (const k of Object.keys(this.alvo) as Chave[]) {
      const a = this.atual[k]
      const b = this.alvo[k]
      if (a === b) continue
      const passo = this.velocidade[k] * dt
      this.atual[k] = Math.abs(b - a) <= passo ? b : a + Math.sign(b - a) * passo
    }
    const m = this.atual
    const algo = m.pulso + m.cordas + m.relogio + m.caixinha + m.coracao + m.chuva > 0.001
    if (!algo && !this.nos) return
    if (!this.montar() || !this.nos) return
    const ctx = audio.contexto
    if (!ctx) return
    const t = ctx.currentTime
    const n = this.nos

    // Camadas contínuas.
    n.cordasG.gain.setTargetAtTime(m.cordas * 0.09, t, 0.1)
    n.lp.frequency.setTargetAtTime(500 + m.aperto * 2200, t, 0.2)
    n.tremolo.gain.setTargetAtTime(m.aperto * 0.55, t, 0.2)
    const [a1, a2] = n.apertoOscs
    a1?.frequency.setTargetAtTime(174.61 - m.aperto * (174.61 - 155.56), t, 0.3)
    a2?.frequency.setTargetAtTime(261.63 - m.aperto * (261.63 - 233.08), t, 0.3)
    n.chuvaG.gain.setTargetAtTime(m.chuva * 0.06, t, 0.4)

    // Pulso: colcheias de contrabaixo.
    this.proxPulso -= dt
    if (m.pulso > 0.01 && this.proxPulso <= 0) {
      this.proxPulso = 60 / Math.max(30, m.bpm) / 2
      // Ré, ré, ré, e de vez em quando o dó sustenido que puxa para baixo.
      const meia = this.idxPulso % 8 === 7 && m.aperto > 0.4 ? 69.3 : 73.42
      this.dedilhar(this.idxPulso % 2 === 0 ? meia : meia * 2, m.pulso * (this.idxPulso % 4 === 0 ? 1 : 0.7))
      this.idxPulso++
    }
    // Relógio.
    this.proxTique -= dt
    if (m.relogio > 0.01 && this.proxTique <= 0) {
      this.proxTique = Math.max(0.08, m.ritmoRelogio)
      this.tiqueForte = !this.tiqueForte
      sons.tique(this.tiqueForte, m.relogio)
    }
    // Caixinha: o tema, nota a nota, uma oitava e meia acima.
    this.proxCaixinha -= dt
    if (m.caixinha > 0.01 && this.proxCaixinha <= 0) {
      this.proxCaixinha = 0.82
      const grau = NOTAS_CAIXINHA[this.idxCaixinha % NOTAS_CAIXINHA.length] ?? 0
      const f = ESCALA[grau]
      if (f) musica.nota(f * 2, 0.22 + m.caixinha * 0.3, 2.6)
      this.idxCaixinha++
      // Respira entre as frases do tema.
      if ([4, 9].includes(this.idxCaixinha % NOTAS_CAIXINHA.length)) this.proxCaixinha += 1.2
    }
    // Coração.
    this.proxCoracao -= dt
    if (m.coracao > 0.01 && this.proxCoracao <= 0) {
      this.proxCoracao = 1.05 - m.coracao * 0.55
      audio.heartbeat(0.1 + m.coracao * 0.14)
    }
  }

  /** Uma corda grave puxada com o dedo. */
  private dedilhar(freq: number, forca: number): void {
    const ctx = audio.contexto
    const out = audio.saida
    if (!ctx || !out) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = freq
    const o2 = ctx.createOscillator()
    o2.type = 'sawtooth'
    o2.frequency.value = freq
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(900, t)
    lp.frequency.exponentialRampToValueAtTime(160, t + 0.25)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.2 * forca, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42)
    const g2 = ctx.createGain()
    g2.gain.value = 0.25
    o.connect(lp)
    o2.connect(g2).connect(lp)
    lp.connect(g).connect(out)
    o.start(t)
    o2.start(t)
    o.stop(t + 0.45)
    o2.stop(t + 0.45)
  }
}

export const clima = new Clima()
