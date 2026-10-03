/**
 * As vozes. Ninguém pronuncia as palavras: cada pessoa tem um timbre — a
 * altura, o tamanho da garganta, o fôlego, o ritmo — e a fala vira sílabas
 * que acompanham a legenda letra a letra, como em OMORI e Undertale. As
 * vogais do texto escolhem a forma da boca, as consoantes o ataque; a frase
 * cai no fim, e sobe quando é pergunta.
 *
 * Grito sai mais alto, mais agudo e rasgado. A sombra fala com a voz do
 * Liam, uma oitava embaixo dela mesma e com eco. Quem fala de outro cômodo
 * sai abafado.
 *
 * Tudo sintetizado, como o resto do áudio: nenhum arquivo de voz.
 */
import { audio } from './audio'

interface Timbre {
  /** Altura média, em Hz. */
  f0: number
  /** Quanto a altura passeia entre uma sílaba e outra, em semitons. */
  variacao: number
  /** Escala dos formantes: garganta maior (<1) ou menor (>1). */
  boca: number
  /** Sopro misturado na voz, 0 a 1. */
  ar: number
  /** Duração de cada sílaba, em segundos. */
  silaba: number
  /** Menor intervalo entre duas sílabas. */
  passo: number
  volume: number
  /**
   * Compensação: vozes graves perdem energia nos filtros da boca (menos
   * harmônicos caem nas ressonâncias). Medido para todas soarem parecidas.
   */
  ganho: number
  /** Uma oitava embaixo e eco: a sombra. */
  eco?: boolean
}

const TIMBRES: Record<string, Timbre> = {
  // Grave, devagar, firme. Quase não varia: ele não precisa levantar a voz
  // para mandar — e quando levanta, é outra coisa.
  Adrian: { f0: 98, variacao: 1.6, boca: 0.92, ar: 0.06, silaba: 0.12, passo: 0.125, volume: 1, ganho: 3.6 },
  // Treze anos, a voz ainda não mudou de vez. Baixo, com fôlego.
  Liam: { f0: 196, variacao: 2.6, boca: 1.16, ar: 0.2, silaba: 0.088, passo: 0.1, volume: 0.82, ganho: 1.35 },
  // Cansada: sopro alto, frases que caem.
  Evelyn: { f0: 188, variacao: 2.2, boca: 1.1, ar: 0.32, silaba: 0.1, passo: 0.112, volume: 0.84, ganho: 1.5 },
  // Rápida e afiada.
  Lia: { f0: 250, variacao: 3.8, boca: 1.22, ar: 0.1, silaba: 0.074, passo: 0.084, volume: 0.88, ganho: 1.3 },
  sombra: { f0: 196, variacao: 1.2, boca: 1.08, ar: 0.42, silaba: 0.1, passo: 0.118, volume: 0.9, ganho: 1.25, eco: true },
  Elisa: { f0: 226, variacao: 1.6, boca: 1.14, ar: 0.55, silaba: 0.11, passo: 0.13, volume: 0.6, ganho: 1.3, eco: true },
  Voz: { f0: 226, variacao: 1.6, boca: 1.14, ar: 0.55, silaba: 0.11, passo: 0.13, volume: 0.6, ganho: 1.3, eco: true },
  Catarina: { f0: 214, variacao: 3, boca: 1.12, ar: 0.16, silaba: 0.09, passo: 0.1, volume: 0.8, ganho: 1.4 },
  Helena: { f0: 176, variacao: 2, boca: 1.06, ar: 0.3, silaba: 0.11, passo: 0.125, volume: 0.75, ganho: 1.7 },
}
const PADRAO: Timbre = { f0: 170, variacao: 2, boca: 1.04, ar: 0.2, silaba: 0.095, passo: 0.11, volume: 0.75, ganho: 1.6 }

/** As duas primeiras ressonâncias de cada vogal, numa garganta adulta. */
const VOGAIS: Record<string, readonly [number, number]> = {
  a: [800, 1220],
  e: [480, 1850],
  i: [300, 2300],
  o: [520, 880],
  u: [330, 780],
}
const BASE: Record<string, string> = {
  a: 'a', á: 'a', à: 'a', â: 'a', ã: 'a',
  e: 'e', é: 'e', ê: 'e',
  i: 'i', í: 'i', y: 'i',
  o: 'o', ó: 'o', ô: 'o', õ: 'o',
  u: 'u', ú: 'u', ü: 'u',
}
const FRICATIVAS = new Set(['s', 'z', 'x', 'f', 'v', 'j', 'ç'])
const OCLUSIVAS = new Set(['p', 't', 'k', 'q', 'b', 'd', 'g'])
const NASAIS = new Set(['m', 'n'])
const PAUSAS: Record<string, number> = { ',': 0.12, ';': 0.16, ':': 0.14, '.': 0.24, '!': 0.24, '?': 0.24, '…': 0.3, '—': 0.18 }

type Ataque = 'fricativa' | 'chiado' | 'oclusiva' | 'surda' | 'nasal' | null

export interface JeitoDeFalar {
  grito?: boolean
  /** De outro cômodo: abafado e mais baixo. */
  abafado?: boolean
  /** -1 (esquerda) a 1 (direita). */
  pan?: number
  /** Multiplica o volume. */
  volume?: number
  /** 0..1: a voz engrossando — mais grave, a boca maior, mais forte. */
  grave?: number
}

/** Um número entre 0 e 1 que só depende da letra e da posição: a mesma fala soa sempre igual. */
function acaso(i: number, c: number): number {
  const s = Math.sin(i * 12.9898 + c * 78.233) * 43758.5453
  return s - Math.floor(s)
}

function vogal(c: string | undefined): string | null {
  if (!c) return null
  return BASE[c.toLowerCase()] ?? null
}

/** O que vem antes da vogal decide como a sílaba começa. */
function ataque(texto: string, i: number): Ataque {
  const a = texto[i - 1]?.toLowerCase()
  const b = texto[i - 2]?.toLowerCase()
  if (!a) return null
  if (a === 'h' && (b === 'c' || b === 's')) return 'chiado'
  if (a === 'h' && b === 'n') return 'nasal'
  if (a === 'c') return 'ei'.includes(texto[i]?.toLowerCase() ?? '') ? 'fricativa' : 'oclusiva'
  if (FRICATIVAS.has(a)) return a === 'j' || a === 'x' ? 'chiado' : 'fricativa'
  if (OCLUSIVAS.has(a)) return 'ptkq'.includes(a) ? 'surda' : 'oclusiva'
  if (NASAIS.has(a)) return 'nasal'
  return null
}

class Voz {
  private ctx: AudioContext | null = null
  private glote: PeriodicWave | null = null
  private ruido: AudioBuffer | null = null
  private limpo: GainNode | null = null
  private rasgado: GainNode | null = null
  private eco: GainNode | null = null
  private abafado: GainNode | null = null
  /** Volume geral das vozes. */
  private geral: GainNode | null = null
  /** Para a legenda: quando pode sair a próxima sílaba. */
  private livreEm = 0
  private ultimaRevelada = 0
  /** O que ainda vai soar: para poder calar tudo de uma vez. */
  private vivos = new Set<AudioScheduledSourceNode>()

  private soltar(n: AudioScheduledSourceNode, inicio: number, fim: number, offset?: number, duracao?: number): void {
    this.vivos.add(n)
    n.onended = () => this.vivos.delete(n)
    if (n instanceof AudioBufferSourceNode && offset !== undefined) n.start(inicio, offset, duracao)
    else n.start(inicio)
    n.stop(fim)
  }

  /** Liga os barramentos na primeira fala. Antes do primeiro toque não há contexto. */
  private pronto(): boolean {
    const ctx = audio.contexto
    const saida = audio.saida
    if (!ctx || !saida) return false
    if (this.ctx === ctx) return true
    this.ctx = ctx

    // A forma de onda da glote: muitos harmônicos, caindo devagar.
    const n = 48
    const re = new Float32Array(n)
    const im = new Float32Array(n)
    for (let k = 1; k < n; k++) im[k] = 1 / Math.pow(k, 1.15)
    this.glote = ctx.createPeriodicWave(re, im)

    const len = Math.floor(ctx.sampleRate * 2)
    this.ruido = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = this.ruido.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1

    this.geral = ctx.createGain()
    this.geral.gain.value = 1
    // Um compressor leve segura os gritos sem esmagar o resto.
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -16
    comp.ratio.value = 4
    comp.attack.value = 0.004
    comp.release.value = 0.15
    this.geral.connect(comp).connect(saida)

    this.limpo = ctx.createGain()
    this.limpo.connect(this.geral)

    // Grito: saturação e um brilho por cima.
    this.rasgado = ctx.createGain()
    const sat = ctx.createWaveShaper()
    const curva = new Float32Array(1024)
    for (let i = 0; i < curva.length; i++) {
      const x = (i / (curva.length - 1)) * 2 - 1
      curva[i] = Math.tanh(x * 5.5) / Math.tanh(5.5)
    }
    sat.curve = curva
    sat.oversample = '2x'
    const brilho = ctx.createBiquadFilter()
    brilho.type = 'highshelf'
    brilho.frequency.value = 2200
    brilho.gain.value = 4
    const pos = ctx.createGain()
    pos.gain.value = 0.55
    this.rasgado.connect(sat).connect(brilho).connect(pos).connect(this.geral)

    // A sombra: seco e um eco que volta duas vezes, mais escuro.
    this.eco = ctx.createGain()
    this.eco.connect(this.geral)
    const atraso = ctx.createDelay(1)
    atraso.delayTime.value = 0.23
    const volta = ctx.createGain()
    volta.gain.value = 0.38
    const escuro = ctx.createBiquadFilter()
    escuro.type = 'lowpass'
    escuro.frequency.value = 1500
    const molhado = ctx.createGain()
    molhado.gain.value = 0.55
    this.eco.connect(atraso)
    atraso.connect(escuro).connect(volta).connect(atraso)
    escuro.connect(molhado).connect(this.geral)

    // Atrás de uma porta.
    this.abafado = ctx.createGain()
    const parede = ctx.createBiquadFilter()
    parede.type = 'lowpass'
    parede.frequency.value = 650
    const longe = ctx.createGain()
    longe.gain.value = 0.55
    this.abafado.connect(parede).connect(longe).connect(this.geral)
    return true
  }

  private timbre(quem: string | null): Timbre {
    return (quem && TIMBRES[quem]) || PADRAO
  }

  /**
   * A legenda revelou mais letras: fala as sílabas que nasceram nelas, sem
   * atropelar o ritmo de quem fala.
   */
  legenda(quem: string | null, texto: string, ate: number, jeito: JeitoDeFalar = {}): void {
    if (!this.pronto() || !this.ctx) return
    const de = ate < this.ultimaRevelada ? 0 : this.ultimaRevelada
    this.ultimaRevelada = ate
    const agora = this.ctx.currentTime
    const tb = this.timbre(quem)
    for (let i = de; i < ate; i++) {
      const c = texto[i] ?? ''
      const pausa = PAUSAS[c]
      if (pausa) {
        this.livreEm = Math.max(this.livreEm, agora + pausa * (jeito.grito ? 0.6 : 1))
        continue
      }
      if (!vogal(c) || vogal(texto[i - 1])) continue
      if (agora < this.livreEm) continue
      this.silabaDoTexto(tb, texto, i, agora, jeito)
      this.livreEm = agora + tb.passo * (jeito.grito ? 0.82 : 1)
    }
  }

  /** Uma fala nova começou na legenda. */
  novaLinha(): void {
    this.ultimaRevelada = 0
    this.livreEm = 0
  }

  /**
   * Diz uma frase inteira de uma vez, agendada: para as falas que não passam
   * pela legenda (os gritos por cima uns dos outros). Devolve a duração.
   */
  dizer(quem: string | null, texto: string, jeito: JeitoDeFalar = {}, maximo = 3.5): number {
    if (!this.pronto() || !this.ctx) return 0
    const tb = this.timbre(quem)
    const t0 = this.ctx.currentTime + 0.02
    let t = t0
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i] ?? ''
      const pausa = PAUSAS[c]
      if (pausa) {
        t += pausa * (jeito.grito ? 0.6 : 1)
        continue
      }
      if (!vogal(c) || vogal(texto[i - 1])) continue
      if (t - t0 > maximo) break
      this.silabaDoTexto(tb, texto, i, t, jeito)
      t += tb.passo * (jeito.grito ? 0.82 : 1) * (0.9 + acaso(i, 7) * 0.2)
    }
    return t - t0
  }

  /** A entonação da frase decide a altura de cada sílaba. */
  private silabaDoTexto(tb: Timbre, texto: string, i: number, quando: number, jeito: JeitoDeFalar): void {
    const c = texto[i] ?? 'a'
    const v = vogal(c) ?? 'a'
    const p = texto.length > 1 ? i / (texto.length - 1) : 0
    const fim = texto.trimEnd().slice(-1)
    // Declinação: a frase começa mais alta e cai.
    let semi = (1 - p) * 1.6 - 0.8
    if (fim === '?' && p > 0.72) semi += (p - 0.72) * 18
    if (fim === '!') semi += 1
    semi += (acaso(i, c.charCodeAt(0)) * 2 - 1) * tb.variacao
    const maiuscula = c !== c.toLowerCase()
    let f0 = tb.f0 * Math.pow(2, semi / 12)
    let forca = tb.volume * tb.ganho * (maiuscula ? 1.15 : 1)
    if (jeito.grito) {
      f0 *= 1.42
      forca *= 1.5
    }
    forca *= jeito.volume ?? 1
    const grave = Math.max(0, Math.min(1, jeito.grave ?? 0))
    if (grave > 0) {
      f0 *= 1 - grave * 0.55
      forca *= 1 + grave * 0.6
    }
    this.silaba(tb, v, ataque(texto, i), f0, forca, quando, jeito, c === 'ã' || c === 'õ' || texto[i + 1] === 'm' || texto[i + 1] === 'n')
  }

  private silaba(tb: Timbre, v: string, atk: Ataque, f0: number, forca: number, quando: number, jeito: JeitoDeFalar, nasal: boolean): void {
    const ctx = this.ctx
    const glote = this.glote
    const ruido = this.ruido
    if (!ctx || !glote || !ruido) return
    const destinoBase = jeito.abafado ? this.abafado : jeito.grito ? this.rasgado : tb.eco ? this.eco : this.limpo
    if (!destinoBase) return
    let destino: AudioNode = destinoBase
    if (jeito.pan) {
      const pan = ctx.createStereoPanner()
      pan.pan.value = Math.max(-1, Math.min(1, jeito.pan))
      pan.connect(destinoBase)
      destino = pan
    }

    const dur = tb.silaba * (jeito.grito ? 1.15 : 1)
    const pico = 0.09 * forca
    const atrasoVogal = atk === 'fricativa' || atk === 'chiado' ? 0.045 : atk === 'surda' || atk === 'oclusiva' ? 0.014 : atk === 'nasal' ? 0.03 : 0
    const tv = quando + atrasoVogal

    // As ressonâncias da boca.
    const [f1b, f2b] = VOGAIS[v] ?? VOGAIS.a ?? [800, 1220]
    const abre = jeito.grito ? 1.12 : 1
    // Engrossando, a boca "cresce": as ressonâncias descem junto.
    const tamBoca = tb.boca * (1 - Math.max(0, Math.min(1, jeito.grave ?? 0)) * 0.28)
    const f1 = f1b * tamBoca * abre
    const f2 = f2b * tamBoca
    const boca = ctx.createGain()
    boca.gain.setValueAtTime(0, tv)
    boca.gain.linearRampToValueAtTime(pico, tv + 0.012)
    boca.gain.setValueAtTime(pico * 0.85, tv + dur * 0.55)
    boca.gain.exponentialRampToValueAtTime(0.0001, tv + dur)
    boca.connect(destino)

    const formantes: [number, number, number][] = [[f1, 5, 1], [f2, 8, 0.6], [2750 * tb.boca, 10, 0.22]]
    if (nasal) formantes.push([260, 4, 0.5])
    const entrada = ctx.createGain()
    entrada.gain.value = 1
    for (const [f, q, g] of formantes) {
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = f
      bp.Q.value = q
      const fg = ctx.createGain()
      fg.gain.value = g * 2.2
      entrada.connect(bp).connect(fg).connect(boca)
    }

    const vozes = tb.eco ? [1, 0.5] : [1]
    for (const mult of vozes) {
      const o = ctx.createOscillator()
      o.setPeriodicWave(glote)
      // A sílaba escorrega um pouco para baixo, como na fala.
      o.frequency.setValueAtTime(f0 * mult * 1.03, tv)
      o.frequency.linearRampToValueAtTime(f0 * mult * 0.97, tv + dur)
      if (jeito.grito) {
        // Aspereza: a altura tremendo rápido.
        const lfo = ctx.createOscillator()
        lfo.frequency.value = 26 + acaso(f0, 3) * 14
        const lg = ctx.createGain()
        lg.gain.value = f0 * 0.05
        lfo.connect(lg).connect(o.frequency)
        this.soltar(lfo, tv, tv + dur + 0.02)
      }
      const og = ctx.createGain()
      og.gain.value = mult === 1 ? 1 : 0.6
      o.connect(og).connect(entrada)
      this.soltar(o, tv, tv + dur + 0.02)
    }

    // O fôlego por cima da voz.
    if (tb.ar > 0) {
      const src = ctx.createBufferSource()
      src.buffer = ruido
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = f2
      bp.Q.value = 1.2
      const ng = ctx.createGain()
      ng.gain.value = tb.ar * 0.5
      src.connect(bp).connect(ng).connect(boca)
      this.soltar(src, tv, tv + dur + 0.03, Math.random() * 1.5, dur + 0.02)
    }

    // O ataque da consoante.
    if (atk && atk !== 'nasal') {
      const src = ctx.createBufferSource()
      src.buffer = ruido
      const f = ctx.createBiquadFilter()
      const g = ctx.createGain()
      let d = 0.012
      if (atk === 'fricativa') {
        f.type = 'highpass'
        f.frequency.value = 4200
        d = 0.05
        g.gain.setValueAtTime(pico * 0.55, quando)
      } else if (atk === 'chiado') {
        f.type = 'bandpass'
        f.frequency.value = 2600
        f.Q.value = 1.5
        d = 0.05
        g.gain.setValueAtTime(pico * 0.6, quando)
      } else {
        f.type = atk === 'surda' ? 'highpass' : 'lowpass'
        f.frequency.value = atk === 'surda' ? 1800 : 1400
        g.gain.setValueAtTime(pico * (atk === 'surda' ? 0.9 : 0.7), quando)
      }
      g.gain.exponentialRampToValueAtTime(0.0001, quando + d)
      src.connect(f).connect(g).connect(destino)
      this.soltar(src, quando, quando + d + 0.02, Math.random() * 1.5, d + 0.01)
    } else if (atk === 'nasal') {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f0
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, quando)
      g.gain.linearRampToValueAtTime(pico * 0.5, quando + 0.01)
      g.gain.linearRampToValueAtTime(0, tv + 0.01)
      o.connect(g).connect(destino)
      this.soltar(o, quando, tv + 0.03)
    }
  }

  /** Corta qualquer sílaba ainda agendada (a pausa e as transições usam). */
  calar(): void {
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    for (const n of this.vivos) {
      try {
        n.stop(t)
      } catch {
        // Já tinha parado.
      }
    }
    this.vivos.clear()
    this.livreEm = 0
  }
}

export const voz = new Voz()
