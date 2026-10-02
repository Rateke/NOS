import type { Scene, SceneCtx } from '../types'
import { FONT_BODY, FONT_TITLE, FIO } from '../../systems/dialogue'
import { SEGREDOS } from '../../content/segredos'
import { WORLD_W, WORLD_H } from '../../../engine/constants'
import { musica, TEMA, ESCALA } from '../../../engine/musica'
import { audio, sons } from '../../../engine/audio'
import { voz } from '../../../engine/voz'
import { clima } from '../../../engine/clima'
import { principal } from '../../../engine/principal'
import { memoria } from '../../systems/memoria'
import { salvo } from '../../systems/salvo'
import { Figura, VISUAL } from '../../world/figura'

/** Frequências do arranjo dos créditos. */
const F = {
  D1: 36.71, D2: 73.42, A2: 110.0, D3: 146.83, Fs3: 185.0, A3: 220.0,
  D4: 293.66, Bb2: 116.54, F2: 87.31, G2: 98.0, C3: 130.81, Cs3: 138.59, E3: 164.81, F3: 174.61,
  G3: 196.0, Bb3: 233.08,
} as const

type Estilo = 'titulo' | 'pequeno' | 'nome' | 'fios' | 'nota' | 'fim'
interface Credito {
  texto: string
  estilo: Estilo
}

/** As frases que voam no colapso: tudo o que ele ouviu a noite inteira. */
const ECOS: { quem: string; texto: string }[] = [
  { quem: 'Adrian', texto: 'SÓ MAIS UM' },
  { quem: 'Adrian', texto: 'TOCA, LIAM' },
  { quem: 'Adrian', texto: 'ESCOLHE' },
  { quem: 'sombra', texto: 'a culpa é toda sua' },
  { quem: 'Lia', texto: 'VOLTA, SEU IDIOTA' },
  { quem: 'Evelyn', texto: 'eu volto mais tarde' },
  { quem: 'Adrian', texto: 'OLHA PRA MIM' },
  { quem: 'sombra', texto: 'é você' },
  { quem: 'Adrian', texto: 'CONTO COM VOCÊ' },
  { quem: 'Lia', texto: 'ESCOLHE A MÃE' },
  { quem: 'sombra', texto: 'não agir é uma escolha' },
  { quem: 'Adrian', texto: 'DE NOVO' },
]

/** Quanto dura cada parte, em segundos, depois que os créditos param. */
const SEGURA = 3.2
const COLAPSO = 7.5
const PRETO = 1.8
const HOSPITAL = 5.2
/** Velocidade dos créditos, em pixels de tela por segundo. */
const SUBIDA = 38

/**
 * O fim da demo.
 *
 * Os créditos sobem, simples, com o tema por baixo — a mesma música do pai,
 * que desta vez termina em ré maior. Quando o "fim da demo" para no meio da
 * tela, ela pisca, e o Liam aparece de perto entrando em colapso: as frases
 * da noite voando, o som subindo até não caber mais. Corte seco. Silêncio.
 * E, por cinco segundos, um quarto de hospital: a Lia dormindo na cadeira, o
 * monitor, e um dedo que se mexe. Então o menu.
 */
export class FimScene implements Scene {
  readonly id = 'demo-fim'
  readonly ponto = 'fim' as const
  private t = 0
  private creditos: Credito[] = []
  private notas: { t: number; freq: number; forca: number; dur: number }[] = []
  private idxNota = 0
  /** Quando os créditos param (o "fim da demo" no meio da tela). */
  private parouEm = Infinity
  private alturaCreditos = 0
  private acelera = 1
  private rolado = 0
  private fase: 'creditos' | 'colapso' | 'preto' | 'hospital' | 'fim' = 'creditos'
  private tFase = 0
  private proxEco = 0
  private ecos: { texto: string; x: number; y: number; vida: number; escala: number; cor: string }[] = []
  private proxCaos = 0
  private proxBip = 0
  private dedo = 0
  private liam = new Figura({ ...VISUAL.liam, x: WORLD_W / 2, y: 0, altura: 31, cor: { roupa: '#252a3a', cabelo: '#12151f', pele: '#d7b9a4', sombra: 'rgba(0,0,0,0)' } })
  private deitado = new Figura({ ...VISUAL.liam, x: 0, y: 0, altura: 31, cor: { roupa: '#c9ced6', cabelo: '#12151f', pele: '#c8ab98', sombra: 'rgba(0,0,0,0)' } })
  private lia = new Figura({
    ...VISUAL.lia, x: 262, y: 160, altura: 34, cabelo: 'rabo', pose: 'sentado',
    cor: { roupa: '#6a2c38', cabelo: '#1e1214', pele: '#7a6052', sombra: 'rgba(0,0,0,0.4)' },
  })
  private gotas: { x: number; y: number; vy: number }[] = []

  enter(ctx: SceneCtx): void {
    memoria.marcarFim()
    musica.desafinado = 0
    musica.abafado = 0.3
    musica.setPad(0, 0.5)
    principal.parar(0.5)
    audio.setAmbient(0, 1)
    const achados = SEGREDOS.filter((s) => ctx.state.segredos.has(s)).length
    this.creditos = [
      { texto: 'NÓS', estilo: 'titulo' },
      { texto: '', estilo: 'nota' },
      { texto: 'um jogo de', estilo: 'pequeno' },
      { texto: 'Fernando Rateke Neto', estilo: 'nome' },
      { texto: 'Luana Lupi Vergara', estilo: 'nome' },
      { texto: '', estilo: 'nota' },
      { texto: 'roteiro e direção', estilo: 'pequeno' },
      { texto: 'Fernando Rateke Neto', estilo: 'nome' },
      { texto: 'Luana Lupi Vergara', estilo: 'nome' },
      { texto: '', estilo: 'nota' },
      { texto: 'Liam   Lia   Evelyn   Adrian', estilo: 'fios' },
      { texto: '', estilo: 'nota' },
      { texto: 'SA Integrada', estilo: 'pequeno' },
      { texto: '', estilo: 'nota' },
      { texto: `segredos encontrados: ${achados} de ${SEGREDOS.length}`, estilo: 'nota' },
      { texto: '', estilo: 'nota' },
      { texto: 'fim da demo', estilo: 'fim' },
    ]
    this.compor()
    this.liam.panico = true
    this.deitado.dormindo = true
    this.lia.dormindo = true
    this.lia.curvatura = 1
    this.lia.olhar = -1
  }

  /** O tema no piano, com a mão esquerda por baixo, terminando em ré maior. */
  private compor(): void {
    const passo = 0.92
    let quando = 1.6
    const esquerda: [number, number[]][][] = [
      [[F.D2, [F.D3, F.F3, F.A3]]],
      [[F.D2, [F.D3, F.F3, F.A3]], [F.A2, [F.Cs3, F.E3, F.A3]]],
      [[F.Bb2, [F.D3, F.F3, F.Bb3]], [F.A2, [F.Cs3, F.E3, F.G3]]],
    ]
    let tchan = 20
    TEMA.forEach((frase, i) => {
      const acordes = esquerda[i] ?? []
      const metade = Math.ceil(frase.length / Math.max(1, acordes.length))
      frase.forEach((grau, k) => {
        const f = ESCALA[grau]
        const ultima = i === TEMA.length - 1 && k === frase.length - 1
        if (f !== undefined && !ultima) this.notas.push({ t: quando, freq: f, forca: 0.44, dur: 5.5 })
        if (ultima) tchan = quando
        else if (k % metade === 0) {
          const acorde = acordes[Math.floor(k / metade)]
          if (acorde) {
            const [baixo, arpejo] = acorde
            this.notas.push({ t: quando, freq: baixo / 2, forca: 0.4, dur: 6.5 })
            arpejo.forEach((n, j) => this.notas.push({ t: quando + 0.46 + j * 0.46, freq: n / 2, forca: 0.2, dur: 4.5 }))
          }
        }
        quando += passo
      })
      quando += 1.1
    })
    // Ré maior: a última nota do tema, pela primeira vez aberta.
    ;[F.D1, F.D2, F.A2, F.D3, F.Fs3, F.A3, F.D4].forEach((f, i) => {
      this.notas.push({ t: tchan + i * 0.06, freq: f, forca: 0.44, dur: 10 })
    })
    ;[F.A3, F.Fs3, F.D3].forEach((f, i) => this.notas.push({ t: tchan + 6.5 + i * 1.3, freq: f, forca: 0.36, dur: 7 }))
    this.notas.sort((a, b) => a.t - b.t)
  }

  podePausar(): boolean {
    return this.fase === 'creditos'
  }

  private mudar(f: FimScene['fase']): void {
    this.fase = f
    this.tFase = 0
  }

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt
    this.tFase += dt
    this.liam.update(dt)
    this.lia.update(dt)
    this.deitado.update(dt)

    if (this.fase === 'creditos') {
      // Segurar ou tocar acelera a subida; não pula nada.
      const pressa = ctx.input.held('Space') || ctx.input.pointerDown
      this.acelera += ((pressa ? 4 : 1) - this.acelera) * Math.min(1, dt * 4)
      ctx.input.consumeConfirm()
      ctx.input.consumeTap()
      while (this.idxNota < this.notas.length) {
        const n = this.notas[this.idxNota]
        if (!n || n.t > this.t) break
        musica.nota(n.freq, n.forca, n.dur)
        this.idxNota++
      }
      if (this.rolado < this.parada(ctx.display.cssH)) this.rolado += SUBIDA * this.acelera * dt
      else if (this.parouEm === Infinity) this.parouEm = this.t
      if (this.t - this.parouEm > SEGURA) this.comecarColapso()
    } else if (this.fase === 'colapso') {
      this.colapsar(dt)
    } else if (this.fase === 'preto') {
      if (this.tFase > PRETO) {
        this.mudar('hospital')
        this.proxBip = 0.4
      }
    } else if (this.fase === 'hospital') {
      // O monitor, e só ele. No meio, o dedo.
      this.proxBip -= dt
      if (this.proxBip <= 0) {
        sons.bip(0, 0.08, 880, 0.05)
        this.proxBip = this.tFase > 2.6 && this.tFase < 3.4 ? 0.42 : 0.95
      }
      this.dedo = this.tFase > 2.8 && this.tFase < 3.25 ? 1 : 0
      if (this.tFase > HOSPITAL) this.mudar('fim')
    } else if (this.tFase > 0.8 || this.t > 200) {
      salvo.apagar()
      ctx.menu()
    }
    // Quem pula direto para o fim (os testes) vai para o menu também.
    if (this.t > 120 && this.fase !== 'fim') this.mudar('fim')
  }

  /** Até onde os créditos sobem: o "fim da demo" parado no meio da tela. */
  private parada(cssH: number): number {
    return this.alturaCreditos > 0 ? this.alturaCreditos - cssH * 0.5 + cssH : cssH * 2
  }

  private comecarColapso(): void {
    this.mudar('colapso')
    this.proxEco = 0.3
    this.proxCaos = 0.2
    sons.iniciarCacofonia()
    clima.set({ coracao: 0.6, cordas: 0.5, aperto: 0.6, pulso: 0.5, bpm: 120 }, 0.5)
  }

  /** Mais, mais, mais — e aí, nada. */
  private colapsar(dt: number): void {
    const k = Math.min(1, this.tFase / COLAPSO)
    sons.cacofonia(0.25 + k * 0.75)
    clima.set({ coracao: 0.6 + k * 0.4, cordas: 0.5 + k * 0.5, aperto: 0.6 + k * 0.4, pulso: 0.5 + k * 0.5, bpm: 120 + k * 80 }, 0.3)
    this.liam.tremor = 0.5 + k * 2.5
    this.liam.curvatura = 0.3 + k * 0.5
    this.proxEco -= dt
    if (this.proxEco <= 0) {
      const e = ECOS[Math.floor(Math.random() * ECOS.length)] ?? ECOS[0]
      if (e) {
        this.ecos.push({
          texto: e.texto, x: 0.08 + Math.random() * 0.84, y: 0.1 + Math.random() * 0.8, vida: 1.4,
          escala: 0.7 + k * 1.1 + Math.random() * 0.3, cor: e.quem === 'sombra' ? '#f4f4fa' : FIO[e.quem] ?? '#ddd',
        })
        voz.dizer(e.quem, e.texto, { grito: e.texto === e.texto.toUpperCase(), pan: Math.random() * 1.6 - 0.8, volume: 0.8 + k * 0.4 })
      }
      this.proxEco = Math.max(0.12, 0.7 - k * 0.6)
    }
    this.proxCaos -= dt
    if (this.proxCaos <= 0) {
      sons.caos(0.4 + k * 0.6)
      this.proxCaos = Math.max(0.35, 1.3 - k * 1)
    }
    if (Math.random() < dt * (3 + k * 10)) this.gotas.push({ x: (Math.random() - 0.5) * 12, y: -6, vy: 10 + Math.random() * 14 })
    for (const g of this.gotas) {
      g.y += g.vy * dt
      g.vy += 30 * dt
    }
    this.gotas = this.gotas.filter((g) => g.y < 30)
    for (const e of this.ecos) e.vida -= dt
    this.ecos = this.ecos.filter((e) => e.vida > 0)
    if (this.tFase >= COLAPSO) {
      // Corte seco: nada. Nem zumbido.
      sons.cortarCacofonia(false)
      voz.calar()
      clima.parar(0.02)
      audio.setAmbient(0, 0.02)
      this.ecos = []
      this.mudar('preto')
    }
  }

  render(ctx: SceneCtx): void {
    const d = ctx.display
    const c = d.ctx
    const w = d.cssW
    const h = d.cssH
    c.save()
    c.fillStyle = '#000'
    c.fillRect(0, 0, w, h)
    c.restore()
    if (this.fase === 'creditos') this.desenharCreditos(c, w, h)
    else if (this.fase === 'colapso') this.desenharColapso(ctx)
    else if (this.fase === 'hospital') this.desenharHospital(ctx)
  }

  private desenharCreditos(c: CanvasRenderingContext2D, w: number, h: number): void {
    const s = Math.max(16, Math.min(w / 46, 26))
    let y = h - this.rolado
    const inicio = y
    c.save()
    c.textAlign = 'center'
    for (const cr of this.creditos) {
      if (cr.estilo === 'titulo') {
        c.font = `400 ${s * 3.2}px ${FONT_TITLE}`
        c.fillStyle = '#efe6d2'
        c.letterSpacing = '0.3em'
        c.fillText(cr.texto, w / 2 + s * 0.45, y + s * 2.4)
        c.letterSpacing = '0em'
        y += s * 4.6
        continue
      }
      if (cr.estilo === 'fios') {
        // Cada nome na cor do fio dele.
        const nomes = cr.texto.split(/\s+/).filter(Boolean)
        c.font = `${s * 1.05}px ${FONT_BODY}`
        const larg = nomes.map((n) => c.measureText(n).width)
        const esp = s * 1.4
        const total = larg.reduce((a, b) => a + b, 0) + esp * (nomes.length - 1)
        let x = w / 2 - total / 2
        nomes.forEach((n, i) => {
          c.fillStyle = FIO[n] ?? '#ddd'
          c.textAlign = 'left'
          c.fillText(n, x, y + s)
          x += (larg[i] ?? 0) + esp
        })
        c.textAlign = 'center'
        y += s * 2.2
        continue
      }
      const tam = cr.estilo === 'pequeno' ? s * 0.72 : cr.estilo === 'nota' ? s * 0.78 : cr.estilo === 'fim' ? s * 0.9 : s * 1.1
      c.font = `${cr.estilo === 'pequeno' || cr.estilo === 'fim' ? 'italic ' : ''}${tam}px ${FONT_BODY}`
      c.fillStyle = cr.estilo === 'pequeno' ? 'rgba(230,224,210,0.55)' : cr.estilo === 'nota' ? 'rgba(230,224,210,0.62)' : '#ece4d4'
      if (cr.estilo === 'pequeno' || cr.estilo === 'fim') c.letterSpacing = '0.18em'
      if (cr.texto) c.fillText(cr.texto, w / 2, y + tam)
      c.letterSpacing = '0em'
      y += cr.texto ? tam * 1.9 : s * 1.4
    }
    c.restore()
    this.alturaCreditos = y - inicio
  }

  private desenharColapso(ctx: SceneCtx): void {
    const d = ctx.display
    const c = d.ctx
    const w = d.cssW
    const h = d.cssH
    const k = Math.min(1, this.tFase / COLAPSO)
    // A tela pisca antes de mostrar: três brancos, cada vez mais curtos.
    const pisca = [0, 0.09, 0.22, 0.3, 0.42, 0.47].findIndex((p, i, a) => this.tFase >= p && this.tFase < (a[i + 1] ?? p))
    if (this.tFase < 0.5 && pisca % 2 === 0) {
      c.fillStyle = '#f4f2ee'
      c.fillRect(0, 0, w, h)
      return
    }
    // O Liam de perto, no mundo, ampliado: pixels grandes. Fundo vermelho
    // escuro pulsando com o coração.
    const wc = d.beginWorld()
    const pulso = 0.5 + 0.5 * Math.sin(this.t * (6 + k * 10))
    wc.fillStyle = `rgb(${Math.round(30 + pulso * 50 * k)},6,10)`
    wc.fillRect(0, 0, WORLD_W, WORLD_H)
    const zoom = 4 + k * 0.6
    wc.save()
    wc.translate(WORLD_W / 2, WORLD_H * 0.62)
    wc.scale(zoom, zoom)
    this.liam.x = 0
    this.liam.y = 22
    this.liam.braco = 0.3 + 0.2 * Math.sin(this.t * 9)
    this.liam.draw(wc, -40, 'rgba(255,90,90,0.5)')
    wc.fillStyle = 'rgba(200,220,255,0.85)'
    for (const g of this.gotas) wc.fillRect(Math.round(g.x), Math.round(g.y - 18), 1, 2)
    wc.restore()
    // Separação de cor, ondulação e tremor crescendo com o pânico.
    d.present({ rgbSplit: 0.5 + k * 3, wave: k * 1.4, shake: k * 1.8, time: this.t })
    // As frases voando por cima.
    c.save()
    c.textAlign = 'center'
    for (const e of this.ecos) {
      const s = Math.max(16, Math.min(w / 40, 30)) * e.escala
      c.globalAlpha = Math.min(1, e.vida / 0.4)
      c.font = `${s}px ${FONT_BODY}`
      c.fillStyle = e.cor
      const tx = e.x * w + (Math.random() - 0.5) * k * 8
      c.fillText(e.texto, tx, e.y * h)
    }
    c.restore()
  }

  /** Um quarto de hospital, escuro. Quase nada se mexe. */
  private desenharHospital(ctx: SceneCtx): void {
    const d = ctx.display
    const c = d.beginWorld()
    const entra = Math.min(1, this.tFase / 0.8) * Math.min(1, (HOSPITAL - this.tFase) / 0.8)
    c.fillStyle = '#0d1119'
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    c.fillStyle = '#0a0d14'
    c.fillRect(0, 168, WORLD_W, WORLD_H - 168)
    // A janela com a persiana, e a cidade de noite atrás.
    c.fillStyle = '#16233a'
    c.fillRect(40, 46, 70, 64)
    for (let i = 0; i < 9; i++) {
      c.fillStyle = 'rgba(160,190,230,0.12)'
      c.fillRect(40, 50 + i * 7, 70, 2)
    }
    // A cama.
    c.fillStyle = '#2a2f3a'
    c.fillRect(118, 150, 132, 4)
    c.fillRect(120, 154, 3, 16)
    c.fillRect(245, 154, 3, 16)
    c.fillStyle = '#9aa0ac'
    c.fillRect(118, 140, 132, 10)
    c.fillStyle = '#b4bac4'
    c.fillRect(120, 136, 24, 6)
    // O Liam deitado, de olhos fechados, com o lençol até o peito.
    c.save()
    c.translate(152, 138)
    c.rotate(-Math.PI / 2)
    this.deitado.x = 0
    this.deitado.y = 0
    this.deitado.draw(c, 0, 'rgba(120,160,220,0.2)')
    c.restore()
    c.fillStyle = '#c4cad2'
    c.fillRect(150, 131, 98, 10)
    c.fillStyle = '#aab0bb'
    c.fillRect(150, 131, 98, 1)
    // A mão por cima do lençol. O dedo.
    c.fillStyle = '#c8ab98'
    c.fillRect(176, 129, 4, 2)
    c.fillRect(180, 129 - this.dedo, 1, 1 + this.dedo)
    // A Lia dormindo na cadeira, a cabeça quase na cama.
    c.fillStyle = '#1e2230'
    c.fillRect(252, 152, 20, 3)
    c.fillRect(268, 132, 3, 38)
    this.lia.draw(c, 200, 'rgba(120,160,220,0.18)')
    // O monitor: a linha verde andando.
    c.fillStyle = '#10161c'
    c.fillRect(276, 70, 46, 30)
    c.strokeStyle = '#4ee08a'
    c.lineWidth = 1
    c.beginPath()
    for (let x = 0; x < 42; x++) {
      const fase = (x + this.t * 30) % 42
      const pico = fase > 30 && fase < 34 ? (fase < 32 ? -10 : 6) : 0
      const yy = 86 + pico
      if (x === 0) c.moveTo(278 + x, yy)
      else c.lineTo(278 + x, yy)
    }
    c.stroke()
    c.fillStyle = 'rgba(78,224,138,0.08)'
    c.fillRect(270, 64, 58, 42)
    d.present()
    // Entra e sai devagar, do preto.
    const dc = d.ctx
    dc.save()
    dc.globalAlpha = 1 - entra
    dc.fillStyle = '#000'
    dc.fillRect(0, 0, d.cssW, d.cssH)
    dc.restore()
  }
}
