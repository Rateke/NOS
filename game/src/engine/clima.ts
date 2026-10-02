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
import { musica, ESCALA, TEMA, criarArco } from './musica'

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
  /** O violino sozinho tocando o tema, longe: o Dentro. */
  violino?: number
}

type Chave = keyof Mistura
const ZERO: Required<Mistura> = {
  pulso: 0, bpm: 84, cordas: 0, aperto: 0, relogio: 0, ritmoRelogio: 1, caixinha: 0, coracao: 0, chuva: 0, violino: 0,
}
const NOTAS_CAIXINHA = TEMA.flat()

class Clima {
  private atual: Required<Mistura> = { ...ZERO }
  private alvo: Required<Mistura> = { ...ZERO }
  private velocidade: Record<Chave, number> = {
    pulso: 1, bpm: 1, cordas: 1, aperto: 1, relogio: 1, ritmoRelogio: 1, caixinha: 1, coracao: 1, chuva: 1, violino: 1,
  }
  private proxPulso = 0
  private idxPulso = 0
  private proxTique = 0
  private tiqueForte = false
  private proxCaixinha = 0
  private idxCaixinha = 0
  private proxCoracao = 0
  private proxViolino = 0
  private idxViolino = 0

  private nos: {
    celloG: GainNode
    violinoG: GainNode
    tremolo: GainNode
    cello: (f: number, quando: number, suave?: number) => void
    chuvaG: GainNode
  } | null = null
  private degrauCello = 0

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
    const sala = musica.destinos
    if (!ctx || !out || !sala) return false
    const ligar = (g: GainNode): void => {
      g.connect(sala.seco)
      g.connect(sala.sala)
    }
    const SEMPRE = 1e6

    // O violoncelo: um pedal grave que segura a nota. Na tensão, desce meio
    // tom por vez.
    const celloG = ctx.createGain()
    celloG.gain.value = 0
    ligar(celloG)
    const cello = criarArco(ctx, 'violoncelo', 73.42, celloG, ctx.currentTime, SEMPRE)

    // O violino: duas notas em segunda menor, lá em cima, com tremolo — só
    // entra quando aperta.
    const violinoG = ctx.createGain()
    violinoG.gain.value = 0
    const trem = ctx.createGain()
    trem.gain.value = 1
    trem.connect(violinoG)
    ligar(violinoG)
    criarArco(ctx, 'violino', 880, trem, ctx.currentTime, SEMPRE)
    criarArco(ctx, 'violino', 932.33, trem, ctx.currentTime, SEMPRE)
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 9
    const tremolo = ctx.createGain()
    tremolo.gain.value = 0
    lfo.connect(tremolo).connect(trem.gain)
    lfo.start()

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

    this.nos = { celloG, violinoG, tremolo, cello, chuvaG }
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
    const algo = m.pulso + m.cordas + m.relogio + m.caixinha + m.coracao + m.chuva + m.violino > 0.001
    if (!algo && !this.nos) return
    if (!this.montar() || !this.nos) return
    const ctx = audio.contexto
    if (!ctx) return
    const t = ctx.currentTime
    const n = this.nos

    // Camadas contínuas: o violoncelo segura; o violino só quando aperta.
    n.celloG.gain.setTargetAtTime(m.cordas * 0.55, t, 0.15)
    n.violinoG.gain.setTargetAtTime(m.cordas * Math.max(0, m.aperto - 0.25) * 0.9, t, 0.15)
    n.tremolo.gain.setTargetAtTime(m.aperto * 0.6, t, 0.2)
    const degrau = Math.min(3, Math.floor(m.aperto * 4))
    if (degrau !== this.degrauCello) {
      this.degrauCello = degrau
      n.cello(73.42 * Math.pow(2, -degrau / 12), t, 0.12)
    }
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
    // O violino sozinho, longe: o tema uma oitava acima, devagar.
    this.proxViolino -= dt
    if (m.violino > 0.01 && this.proxViolino <= 0) {
      this.proxViolino = 1.55
      const grau = NOTAS_CAIXINHA[this.idxViolino % NOTAS_CAIXINHA.length] ?? 0
      const f = ESCALA[grau]
      if (f) musica.arco('violino', f * 2, 2.6, 0.35 + m.violino * 0.45, 'piano')
      this.idxViolino++
      if ([4, 9].includes(this.idxViolino % NOTAS_CAIXINHA.length)) this.proxViolino += 1.8
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
