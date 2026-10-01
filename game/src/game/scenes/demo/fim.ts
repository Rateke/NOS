import type { Scene, SceneCtx } from '../types'
import { FONT_BODY, FONT_TITLE, FONT_FIM } from '../../systems/dialogue'
import { EPILOGO, EPILOGO_CREDITO, EPILOGO_SUBINDO, DEMO_FIM } from '../../content/demoScript'
import { SEGREDOS } from '../../content/segredos'
import { PAL, WORLD_W, WORLD_H } from '../../../engine/constants'
import { musica, TEMA, ESCALA } from '../../../engine/musica'
import { RELIQUIAS, desenharReliquia } from '../../world/reliquias'
import type { TipoReliquia } from '../../world/reliquias'
import { memoria } from '../../systems/memoria'
import { principal } from '../../../engine/principal'

interface Subindo {
  tipo: TipoReliquia
  x: number
  y: number
  vy: number
  balanco: number
  atraso: number
}

/** Partícula de luz. `x`/`y` em pixels de mundo, ou de tela no texto. */
interface Luz {
  x: number
  y: number
  vx: number
  vy: number
  vida: number
  total: number
  tam: number
  cor: [number, number, number]
  /** Freio: 0 nenhum, 1 para quase na hora. */
  arrasto: number
  /** Gravidade: negativa sobe, positiva cai. */
  g: number
}

interface Frase {
  texto: string
  inicio: number
  fim: number
}

/** Frequências do acorde final. */
const F = {
  D1: 36.71, D2: 73.42, A2: 110.0, D3: 146.83, Fs3: 185.0, A3: 220.0,
  D4: 293.66, Fs4: 369.99, A4: 440.0, D5: 587.33, Fs5: 739.99, A5: 880.0, D6: 1174.66,
  Bb2: 116.54, F2: 87.31, G2: 98.0, C3: 130.81, Cs3: 138.59, E3: 164.81, F3: 174.61,
  G3: 196.0, Bb3: 233.08,
} as const

const OURO: [number, number, number] = [255, 214, 160]
const LILAS: [number, number, number] = [196, 176, 236]
const BRANCO: [number, number, number] = [255, 246, 228]

/**
 * Fecho.
 *
 * Depois do corte vem silêncio absoluto — e só então o tema volta, afinado,
 * do jeito que o pai ensinou antes de estragá-lo. Agora com a mão esquerda
 * por baixo, crescendo frase a frase. Cada nota acende um ponto de luz; as
 * relíquias que os fios seguravam sobem no escuro, soltas.
 *
 * O "tchan" é harmônico: a última nota do tema, que sempre caiu em ré menor,
 * cai em **ré maior**. É a terça de Picardia — a mesma música, e pela
 * primeira vez ela termina aberta. É nesse acorde que o título aparece.
 *
 * Quem achou a melodia ao contrário no piano da sala ouve, antes do acorde,
 * a frase subindo — a versão de quem ensinava sem cobrar nada.
 */
export class FimScene implements Scene {
  readonly id = 'demo-fim'
  private t = 0
  private reliquias: Subindo[] = []
  private notas: { t: number; freq: number; forca: number; dur: number; grau?: number }[] = []
  private idxNota = 0
  private luzes: Luz[] = []
  /** Partículas das letras que se desfazem, em pixels de tela. */
  private cinzas: Luz[] = []
  private frases: Frase[] = []
  /** Quais letras de cada frase já viraram pó. */
  private desfeitas = new Map<number, Set<number>>()
  /** Instante do acorde maior. Tudo depois dele se mede a partir daqui. */
  private tchan = 20
  private explodiu = false
  private clarao = 0
  private anel = -1
  private segredosAchados = 0
  private achouMelodia = false
  private tremor = 0
  private trilhaFinal = false

  enter(ctx: SceneCtx): void {
    memoria.marcarFim()
    // O instrumento volta ao normal: a lembrança boa, restituída.
    musica.desafinado = 0
    musica.abafado = 0.3
    musica.setPad(0, 0.5)
    this.segredosAchados = SEGREDOS.filter((s) => ctx.state.segredos.has(s)).length
    this.achouMelodia = ctx.state.segredos.has('melodia')

    this.reliquias = RELIQUIAS.map((tipo, i) => ({
      tipo,
      x: 36 + i * 62 + (Math.random() - 0.5) * 20,
      y: WORLD_H + 12 + i * 12,
      vy: 5 + Math.random() * 2,
      balanco: i * 1.3,
      atraso: 2.2 + i * 1.3,
    }))

    this.compor()

    const T = this.tchan
    this.frases = [
      { texto: EPILOGO[0] ?? '', inicio: 4.2, fim: 9.8 },
      { texto: EPILOGO[1] ?? '', inicio: 11.0, fim: this.achouMelodia ? 18.2 : T - 2.4 },
    ]
    if (this.achouMelodia) {
      this.frases.push({ texto: EPILOGO_SUBINDO, inicio: 20.4, fim: T - 2.2 })
    }
  }

  /**
   * Monta o arranjo: tema na mão direita, acordes arpejados na esquerda,
   * cada frase um pouco mais cheia que a anterior.
   */
  private compor(): void {
    const passo = 0.92
    let quando = 3.4
    const esquerda: [number, number[]][][] = [
      [[F.D2, [F.D3, F.F3, F.A3]]],
      [[F.Bb2, [F.D3, F.F3, F.Bb3]], [F.F2, [F.C3, F.F3, F.A3]]],
      [[F.G2, [F.D3, F.G3, F.Bb3]], [F.A2, [F.Cs3, F.E3, F.G3]]],
    ]
    TEMA.forEach((frase, i) => {
      const acordes = esquerda[i] ?? []
      const metade = Math.ceil(frase.length / Math.max(1, acordes.length))
      frase.forEach((grau, k) => {
        const f = ESCALA[grau]
        const ultima = i === TEMA.length - 1 && k === frase.length - 1
        if (f !== undefined && !(ultima && !this.achouMelodia)) {
          // Uma oitava abaixo, e sempre com a mesma força: nada cresce.
          this.notas.push({ t: quando, freq: f / 2, forca: 0.44, dur: 5.5, grau })
        }
        if (ultima && !this.achouMelodia) {
          // A última nota do tema É o acorde maior.
          this.tchan = quando
        } else if (k % metade === 0) {
          const acorde = acordes[Math.floor(k / metade)]
          if (acorde) {
            const [baixo, arpejo] = acorde
            this.notas.push({ t: quando, freq: baixo / 2, forca: 0.4, dur: 6.5 })
            arpejo.forEach((n, j) => {
              this.notas.push({ t: quando + 0.46 + j * 0.46, freq: n / 2, forca: 0.2, dur: 4.5 })
            })
          }
        }
        if (ultima && this.achouMelodia) {
          // Termina em ré menor, como sempre terminou.
          this.notas.push({ t: quando, freq: F.D2, forca: 0.4, dur: 6 })
          this.notas.push({ t: quando + 0.3, freq: F.F3, forca: 0.2, dur: 5 })
        }
        quando += passo
      })
      quando += 1.1
    })

    if (this.achouMelodia) {
      // A frase de novo, subindo. A última nota é o acorde.
      quando += 0.6
      const subindo = [0, 1, 2, 3, 4, 2, 0]
      this.notas.push({ t: quando, freq: F.Bb2, forca: 0.3, dur: 6 })
      subindo.forEach((grau, k) => {
        const f = ESCALA[grau]
        if (k === subindo.length - 1) {
          this.tchan = quando
          return
        }
        if (f !== undefined) this.notas.push({ t: quando, freq: f / 2, forca: 0.44, dur: 5, grau })
        if (k === 3) this.notas.push({ t: quando, freq: F.A2 / 2, forca: 0.36, dur: 5 })
        quando += 0.74
      })
    }

    // O acorde: ré maior, dedilhado de baixo para cima, com o grave por
    // baixo de tudo e um brilho agudo subindo logo depois.
    // O acorde maior entra no mesmo volume de tudo: não é um estrondo, é a
    // mesma música, pela primeira vez terminando aberta.
    const T = this.tchan
    const acorde = [F.D1, F.D2, F.A2, F.D3, F.Fs3, F.A3, F.D4]
    acorde.forEach((f, i) => {
      this.notas.push({ t: T + i * 0.06, freq: f, forca: 0.44, dur: 10, grau: i === 6 ? 0 : undefined })
    })
    // E a resposta, bem depois, quando tudo já assentou.
    ;[F.A3, F.Fs3, F.D3].forEach((f, i) => {
      this.notas.push({ t: T + 6.5 + i * 1.3, freq: f, forca: 0.36, dur: 7 })
    })
    this.notas.sort((a, b) => a.t - b.t)
  }

  update(dt: number): void {
    this.t += dt

    while (this.idxNota < this.notas.length) {
      const n = this.notas[this.idxNota]
      if (!n || n.t > this.t) break
      musica.nota(n.freq, n.forca, n.dur)
      // Cada nota da melodia acende um ponto, na altura da tecla.
      if (n.grau !== undefined && n.freq >= 290 && n.freq < 600) this.florescer(n.grau)
      this.idxNota++
    }

    if (!this.explodiu && this.t >= this.tchan) this.explodir()
    // Depois de assentar, a trilha entra inteira por baixo dos créditos.
    if (this.explodiu && !this.trilhaFinal && this.t >= this.tchan + 9) {
      this.trilhaFinal = true
      principal.tocar(0.7)
      principal.completo(1, 2.5)
    }

    for (const r of this.reliquias) {
      if (this.t < r.atraso) continue
      r.y -= r.vy * dt * (this.explodiu ? 1.6 : 1)
      r.balanco += dt * 0.7
      r.x += Math.sin(r.balanco) * 5 * dt
    }

    this.emitir(dt)
    this.mover(this.luzes, dt)
    this.mover(this.cinzas, dt)
    this.clarao = Math.max(0, this.clarao - dt * 0.7)
    this.tremor = Math.max(0, this.tremor - dt * 2.4)
    if (this.anel >= 0) this.anel += dt
  }

  private emitir(dt: number): void {
    const brilho = this.brilho
    // Poeira de luz subindo, mais densa conforme a música cresce.
    const taxa = 10 + brilho * 34 - (this.explodiu ? 16 : 0)
    let n = taxa * dt
    while (n > 0) {
      if (Math.random() < n) {
        this.luzes.push({
          x: Math.random() * WORLD_W,
          y: WORLD_H + 4 - Math.random() * 30,
          vx: (Math.random() - 0.5) * 3,
          vy: -(4 + Math.random() * 10),
          vida: 0, total: 6 + Math.random() * 6,
          tam: Math.random() < 0.18 ? 2 : 1,
          cor: Math.random() < 0.6 ? OURO : LILAS,
          arrasto: 0, g: 0,
        })
      }
      n -= 1
    }
    // Depois do acorde, luz caindo devagar do alto, como neve.
    if (this.explodiu) {
      let m = 14 * dt
      while (m > 0) {
        if (Math.random() < m) {
          this.luzes.push({
            x: Math.random() * WORLD_W, y: -4,
            vx: (Math.random() - 0.5) * 4, vy: 5 + Math.random() * 9,
            vida: 0, total: 10 + Math.random() * 6,
            tam: 1, cor: BRANCO, arrasto: 0, g: 0,
          })
        }
        m -= 1
      }
    }
  }

  /** Um feixe curto subindo de onde a nota "está" no teclado. */
  private florescer(grau: number): void {
    const x = 52 + grau * 40
    for (let i = 0; i < 22; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.3
      const v = 14 + Math.random() * 30
      this.luzes.push({
        x: x + (Math.random() - 0.5) * 6, y: 176,
        vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
        vida: 0, total: 1.6 + Math.random() * 1.8,
        tam: Math.random() < 0.3 ? 2 : 1,
        cor: OURO, arrasto: 1.4, g: -3,
      })
    }
  }

  /** O acorde maior: clarão, anel, e tudo que estava preso vira luz. */
  private explodir(): void {
    this.explodiu = true
    this.clarao = 1
    this.anel = 0
    this.tremor = 1
    musica.setPad(0.3, 4)
    const cx = WORLD_W / 2
    const cy = 104
    for (let i = 0; i < 320; i++) {
      const ang = Math.random() * Math.PI * 2
      const v = 18 + Math.pow(Math.random(), 0.6) * 120
      this.luzes.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * v, vy: Math.sin(ang) * v * 0.7,
        vida: 0, total: 2.4 + Math.random() * 3.6,
        tam: Math.random() < 0.25 ? 2 : 1,
        cor: Math.random() < 0.5 ? BRANCO : Math.random() < 0.6 ? OURO : LILAS,
        arrasto: 1.1, g: 2,
      })
    }
    // As relíquias se desfazem em luz.
    for (const r of this.reliquias) {
      if (this.t < r.atraso || r.y < -10 || r.y > WORLD_H) continue
      for (let i = 0; i < 26; i++) {
        const ang = Math.random() * Math.PI * 2
        const v = 8 + Math.random() * 30
        this.luzes.push({
          x: r.x, y: r.y + 4, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
          vida: 0, total: 2 + Math.random() * 2, tam: 1, cor: LILAS, arrasto: 1.2, g: -4,
        })
      }
    }
  }

  private mover(lista: Luz[], dt: number): void {
    for (const p of lista) {
      p.vida += dt
      const freio = Math.max(0, 1 - p.arrasto * dt)
      p.vx *= freio
      p.vy = p.vy * freio + p.g * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
    }
    let j = 0
    for (const p of lista) if (p.vida < p.total) lista[j++] = p
    lista.length = j
  }

  /** Cresce com a música até o acorde. */
  private get brilho(): number {
    return Math.max(0, Math.min(1, (this.t - 3) / Math.max(4, this.tchan - 3)))
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    w.fillStyle = PAL.void
    w.fillRect(0, 0, WORLD_W, WORLD_H)

    const brilho = this.brilho
    w.save()
    w.globalCompositeOperation = 'lighter'
    const g = w.createRadialGradient(WORLD_W / 2, 108, 4, WORLD_W / 2, 108, 200)
    g.addColorStop(0, `rgba(196,176,224,${0.1 * brilho + (this.explodiu ? 0.06 : 0)})`)
    g.addColorStop(1, 'rgba(196,176,224,0)')
    w.fillStyle = g
    w.fillRect(0, 0, WORLD_W, WORLD_H)
    w.restore()

    // Os fios, cortados, ainda balançando lá no alto antes de sumirem.
    const fios = Math.max(0, 1 - this.t / 9)
    if (fios > 0) {
      for (let i = 0; i < 7; i++) {
        const x = 40 + i * 50 + Math.sin(this.t * 0.8 + i) * 3
        const comp = 30 + ((i * 37) % 50) - this.t * 4
        w.fillStyle = `rgba(160,80,90,${0.35 * fios})`
        w.fillRect(Math.round(x), 0, 1, Math.max(0, Math.round(comp)))
      }
    }

    for (const r of this.reliquias) {
      if (this.t < r.atraso || r.y < -20) continue
      // Apagam conforme sobem: soltas, e indo embora.
      const a = Math.max(0, Math.min(0.9, (WORLD_H - r.y) / 70)) * Math.min(1, r.y / 34)
        * (this.explodiu ? Math.max(0, 1 - (this.t - this.tchan) / 1.2) : 1)
      if (a <= 0.01) continue
      w.save()
      w.globalAlpha = a
      desenharReliquia(w, r.tipo, Math.round(r.x), Math.round(r.y),
        'rgba(196,184,230,0.95)', 'rgba(10,8,16,0.8)')
      w.restore()
      w.save()
      w.globalCompositeOperation = 'lighter'
      const h = w.createRadialGradient(r.x, r.y + 4, 0, r.x, r.y + 4, 16)
      h.addColorStop(0, `rgba(196,176,236,${0.22 * a})`)
      h.addColorStop(1, 'rgba(196,176,236,0)')
      w.fillStyle = h
      w.fillRect(r.x - 16, r.y - 12, 32, 32)
      w.restore()
    }

    this.drawLuzes(w)

    // O anel do acorde, abrindo até sair da tela.
    if (this.anel >= 0 && this.anel < 2.4) {
      const r = 6 + this.anel * 150
      w.save()
      w.globalCompositeOperation = 'lighter'
      w.strokeStyle = `rgba(255,236,200,${0.5 * (1 - this.anel / 2.4)})`
      w.lineWidth = 2
      w.beginPath()
      w.ellipse(WORLD_W / 2, 104, r, r * 0.62, 0, 0, Math.PI * 2)
      w.stroke()
      w.restore()
    }
    if (this.clarao > 0) {
      w.fillStyle = `rgba(255,244,226,${Math.pow(this.clarao, 2.2) * 0.7})`
      w.fillRect(0, 0, WORLD_W, WORLD_H)
    }

    ctx.display.applyGrain(0.03)
    const pulso = this.explodiu ? Math.max(0, 1 - (this.t - this.tchan) / 1.4) * 0.05 : 0
    ctx.display.present({
      rgbSplit: 0, wave: 0, shake: this.tremor * 0.8,
      zoom: 1 + brilho * 0.05 + pulso, time: this.t,
    })
    ctx.display.vignette(0.74 - (this.explodiu ? 0.12 : 0))

    this.drawTexto(ctx)
    this.drawCinzas(ctx)
  }

  private drawLuzes(w: CanvasRenderingContext2D): void {
    w.save()
    w.globalCompositeOperation = 'lighter'
    for (const p of this.luzes) {
      const vida = p.vida / p.total
      // Acende rápido, apaga devagar, e pisca um pouco no meio.
      const a = Math.min(1, vida * 6) * (1 - vida) * (0.75 + Math.sin(p.vida * 9 + p.x) * 0.25)
      if (a <= 0.02) continue
      const [r, g, b] = p.cor
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      w.fillStyle = `rgba(${r},${g},${b},${a * 0.16})`
      w.fillRect(x - p.tam, y - p.tam, p.tam * 3, p.tam * 3)
      w.fillStyle = `rgba(${r},${g},${b},${a})`
      w.fillRect(x, y, p.tam, p.tam)
    }
    w.restore()
  }

  private drawCinzas(ctx: SceneCtx): void {
    const c = ctx.display.ctx
    c.save()
    c.globalCompositeOperation = 'lighter'
    for (const p of this.cinzas) {
      const vida = p.vida / p.total
      const a = (1 - vida) * 0.9
      if (a <= 0.02) continue
      const [r, g, b] = p.cor
      c.fillStyle = `rgba(${r},${g},${b},${a})`
      c.fillRect(p.x, p.y, p.tam, p.tam)
    }
    c.restore()
  }

  /**
   * Uma frase escrita letra a letra, cada uma acendendo com um halo e
   * subindo um pouco até o lugar. Ao sair, as letras se desfazem em pó, na
   * mesma ordem em que entraram.
   */
  private escrever(ctx: SceneCtx, idx: number, f: Frase, y: number, tam: number): void {
    const c = ctx.display.ctx
    const d = this.t - f.inicio
    if (d < 0 || this.t > f.fim + 2.4) return
    const letras = [...f.texto]
    const ritmo = Math.min(0.055, 2.2 / Math.max(1, letras.length))

    c.font = `italic 500 ${tam}px ${FONT_FIM}`
    c.textAlign = 'left'
    c.textBaseline = 'alphabetic'
    const total = c.measureText(f.texto).width
    const x0 = ctx.display.cssW / 2 - total / 2
    let desfeitas = this.desfeitas.get(idx)
    if (!desfeitas) {
      desfeitas = new Set<number>()
      this.desfeitas.set(idx, desfeitas)
    }

    for (let i = 0; i < letras.length; i++) {
      const ch = letras[i] ?? ''
      const x = x0 + c.measureText(letras.slice(0, i).join('')).width
      const entra = Math.max(0, Math.min(1, (d - i * ritmo) / 0.7))
      const saiEm = f.fim + i * ritmo * 0.6
      const sai = Math.max(0, Math.min(1, (this.t - saiEm) / 0.5))
      const a = entra * (1 - sai)

      if (sai > 0.3 && !desfeitas.has(i) && ch.trim()) {
        desfeitas.add(i)
        for (let k = 0; k < 5; k++) {
          this.cinzas.push({
            x: x + Math.random() * tam * 0.45, y: y - Math.random() * tam * 0.7,
            vx: (Math.random() - 0.3) * 22, vy: -(10 + Math.random() * 26),
            vida: 0, total: 1.4 + Math.random() * 1.6,
            tam: Math.random() < 0.3 ? 2 : 1.4, cor: OURO, arrasto: 0.8, g: -6,
          })
        }
      }
      if (a <= 0.01) continue

      const sobe = (1 - entra) * tam * 0.3
      // Halo quente que some quando a letra assenta
      c.save()
      c.shadowColor = `rgba(255,214,160,${0.7 * a})`
      c.shadowBlur = tam * (0.25 + (1 - entra) * 0.9)
      c.globalAlpha = a
      c.fillStyle = entra < 1 ? '#fff4e0' : '#efe6d6'
      c.fillText(ch, x, y + sobe)
      c.restore()
    }
  }

  private drawTexto(ctx: SceneCtx): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const janela = (inicio: number, dentro: number): number =>
      Math.max(0, Math.min(1, (this.t - inicio) / dentro))

    c.save()
    const s = Math.max(22, Math.min(cssW / 24, 50))
    this.frases.forEach((f, i) => this.escrever(ctx, i, f, cssH * 0.47, s))

    const T = this.tchan
    // O título aparece no acorde, já inteiro, e o traço se abre sob ele.
    const aT = janela(T, 0.5)
    if (aT > 0) {
      const tam = Math.max(52, Math.min(cssW / 6.6, 168))
      c.textAlign = 'center'
      c.globalAlpha = aT
      c.font = `400 ${tam}px ${FONT_TITLE}`
      const abre = Math.max(0, 1 - (this.t - T) / 5)
      c.letterSpacing = `${0.26 + abre * 0.12}em`
      c.shadowColor = `rgba(255,226,184,${0.25 + abre * 0.55})`
      c.shadowBlur = tam * (0.12 + abre * 0.4)
      c.fillStyle = PAL.ink
      c.fillText('NÓS', cssW / 2 + tam * 0.1, cssH * 0.47)
      c.shadowBlur = 0
      c.letterSpacing = '0em'

      const fio = tam * 1.5 * Math.max(0, Math.min(1, (this.t - T - 0.8) / 2.6))
      c.globalAlpha = aT * 0.5
      c.fillStyle = PAL.accent
      c.fillRect(cssW / 2 - fio / 2, cssH * 0.47 + tam * 0.24, fio, 1)
    }

    const sc = Math.max(11, Math.min(cssW / 82, 16))
    c.textAlign = 'center'
    const aC = janela(T + 4.5, 2.6)
    if (aC > 0) {
      c.globalAlpha = aC * 0.6
      c.fillStyle = PAL.inkDim
      c.font = `300 ${sc}px ${FONT_BODY}`
      c.letterSpacing = '0.16em'
      c.fillText(EPILOGO_CREDITO, cssW / 2, cssH * 0.47 + sc * 7)
      c.letterSpacing = '0em'
    }

    // Quantos segredos. É a única pista, no jogo inteiro, de que existem.
    const aS = janela(T + 7, 2.4)
    if (aS > 0) {
      const y = cssH * 0.47 + sc * 10
      const passo = sc * 1.3
      const x0 = cssW / 2 - ((SEGREDOS.length - 1) * passo) / 2
      for (let i = 0; i < SEGREDOS.length; i++) {
        const achou = i < this.segredosAchados
        c.globalAlpha = aS * (achou ? 0.95 : 0.55)
        if (achou) {
          c.fillStyle = PAL.accent
          estrela(c, x0 + i * passo, y, sc * 0.36)
        } else {
          c.strokeStyle = PAL.inkDim
          c.lineWidth = 1
          estrela(c, x0 + i * passo, y, sc * 0.3, true)
        }
      }
      c.globalAlpha = aS * 0.55
      c.fillStyle = PAL.inkDim
      c.font = `italic 300 ${sc * 0.92}px ${FONT_BODY}`
      c.fillText(
        this.segredosAchados === SEGREDOS.length
          ? 'você viu tudo o que a casa escondia'
          : `${this.segredosAchados} de ${SEGREDOS.length} coisas que a casa escondia`,
        cssW / 2, y + sc * 1.8,
      )
    }

    const aF = janela(T + 9.5, 2)
    if (aF > 0) {
      c.globalAlpha = aF * (0.26 + Math.sin(this.t * 1.8) * 0.16)
      c.fillStyle = PAL.inkFaint
      c.font = `300 ${sc * 0.92}px ${FONT_BODY}`
      c.letterSpacing = '0.26em'
      c.fillText(`${DEMO_FIM.toUpperCase()}  ·  F5 PARA RECOMEÇAR`, cssW / 2, cssH - sc * 3)
      c.letterSpacing = '0em'
    }
    c.restore()
  }
}

function estrela(c: CanvasRenderingContext2D, x: number, y: number, r: number, vazada = false): void {
  c.beginPath()
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 - Math.PI / 2
    const rr = i % 2 === 0 ? r : r * 0.36
    c.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr)
  }
  c.closePath()
  if (vazada) c.stroke()
  else c.fill()
}
