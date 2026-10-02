import type { Input } from '../../engine/input'
import { telaPiano } from '../ui/telaPiano'
import type { Display } from '../../engine/display'
import { ESCALA, NOMES_NOTA, musica } from '../../engine/musica'
import { PAL } from '../../engine/constants'
import { FONT_BODY } from './dialogue'

/** Oito teclas, na ordem em que a mão cai no teclado. */
const TECLAS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK']
const LETRAS = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K']

export interface OpcoesPiano {
  /** Tecla que deve ser destacada (Adrian mostrando qual é). */
  destaque?: number
  /** Piano do Tear: apagado, torto, frio. */
  fantasma?: boolean
  /** Desliga a entrada sem esconder o desenho. */
  travado?: boolean
}

/** O que soa e o que aparece na tela: o teclado do pai ou o violino do Liam. */
export type Instrumento = 'piano' | 'violino' | 'violoncelo'

/**
 * O piano.
 *
 * É o mesmo objeto nas duas pontas da demo: aqui Adrian ensina, e lá embaixo
 * a mesma interface reaparece para fazer outra coisa. Por isso ele é um
 * componente, e não parte de uma cena — a repetição é o ponto.
 */
export class Piano {
  /** Onde cada tecla foi desenhada, em pixels de tela. Usado no clique. */
  caixas: { x: number; y: number; w: number; h: number }[] = []
  /** Brilho de cada tecla recém-tocada, 0 a 1. */
  private brilho = new Array(8).fill(0)
  private ultima = -1
  /** No prólogo o Liam toca violino: a mesma entrada, outro instrumento. */
  instrumento: Instrumento = 'piano'
  /** 0..1: o arco tremendo na corda (o nervoso). */
  tremor = 0

  update(dt: number): void {
    for (let i = 0; i < this.brilho.length; i++) {
      this.brilho[i] = Math.max(0, (this.brilho[i] ?? 0) - dt * 2.6)
    }
  }

  /** Acende e soa uma tecla sem que o jogador a tenha tocado (Adrian). */
  mostrar(i: number, forca = 0.9): void {
    const f = ESCALA[i]
    if (f === undefined) return
    musica.nota(f, forca)
    // A oitava de baixo, junto e mais fraca: o piano dele é pesado.
    musica.nota(f / 2, forca * 0.2)
    this.brilho[i] = 1
    this.ultima = i
  }

  /**
   * Lê o jogador. Devolve o índice da tecla tocada neste quadro, ou null.
   * Aceita letra, clique e toque — os três caminhos que o jogo suporta.
   */
  ler(input: Input, display: Display, opcoes: OpcoesPiano = {}): number | null {
    if (opcoes.travado) return null

    let i = TECLAS.findIndex((k) => input.consumeKey(k))
    if (i < 0) {
      const tap = input.consumeTap()
      if (tap) {
        i = this.caixas.findIndex(
          (r) => tap.x >= r.x && tap.x <= r.x + r.w && tap.y >= r.y && tap.y <= r.y + r.h,
        )
      }
    }
    void display
    if (i < 0) return null

    const f = ESCALA[i]
    if (f === undefined) return null
    if (this.instrumento === 'violino') {
      // O violino, uma oitava acima do piano: arco atacado, curto e cheio.
      musica.arco('violino', f * 2, 1.25, 2.7 - this.tremor * 0.6, 'piano', 0.05)
    } else if (this.instrumento === 'violoncelo') {
      // O violoncelo, na altura do piano: longo, grave, cheio de madeira.
      musica.arco('violoncelo', f, 2.2, 3.2, 'piano', 0.07)
    } else {
      musica.nota(f, 1)
      musica.nota(f / 2, 0.2)
    }
    this.brilho[i] = 1
    this.ultima = i
    return i
  }

  draw(display: Display, opcoes: OpcoesPiano = {}): void {
    telaPiano.ultimo = performance.now()
    const c = display.ctx
    const { cssW, cssH } = display
    const fantasma = opcoes.fantasma ?? false
    if (this.instrumento !== 'piano') {
      this.desenharBraco(c, cssW, cssH, opcoes)
      return
    }

    const larg = Math.min(cssW * 0.62, 620)
    const lt = larg / 8
    const alt = Math.min(lt * 3.1, cssH * 0.2)
    const x0 = (cssW - larg) / 2
    const y0 = cssH - alt - Math.max(26, cssH * 0.1)

    c.save()
    this.caixas = []

    // Tampo do instrumento
    c.fillStyle = fantasma ? 'rgba(10,8,16,0.34)' : 'rgba(22,15,14,0.82)'
    c.fillRect(x0 - 10, y0 - 12, larg + 20, alt + 22)
    c.fillStyle = fantasma ? 'rgba(120,104,160,0.28)' : 'rgba(58,38,30,0.9)'
    c.fillRect(x0 - 10, y0 - 12, larg + 20, 4)

    for (let i = 0; i < 8; i++) {
      const x = x0 + i * lt
      this.caixas.push({ x, y: y0, w: lt - 2, h: alt })
      const b = this.brilho[i] ?? 0
      const destaque = opcoes.destaque === i

      // Tecla afundando quando tocada
      const afunda = Math.round(b * 3)
      const claro = fantasma ? 120 : 228
      const tom = claro - i * 3 + b * 24
      c.fillStyle = fantasma
        ? `rgba(${Math.round(tom * 0.7)},${Math.round(tom * 0.72)},${Math.round(tom * 0.95)},${0.1 + b * 0.55})`
        : `rgb(${tom},${tom - 6},${tom - 18})`
      c.fillRect(x, y0 + afunda, lt - 2, alt - afunda)

      // Sombra lateral, que dá volume
      c.fillStyle = 'rgba(0,0,0,0.26)'
      c.fillRect(x + lt - 4, y0 + afunda, 2, alt - afunda)

      if (b > 0) {
        c.fillStyle = `rgba(255,214,150,${b * 0.5})`
        c.fillRect(x, y0 + afunda, lt - 2, alt - afunda)
      }
      if (destaque) {
        c.strokeStyle = `rgba(217,178,95,${0.55 + Math.sin(performance.now() / 180) * 0.35})`
        c.lineWidth = 2
        c.strokeRect(x + 1, y0 + 1, lt - 4, alt - 2)
      }

      // Letra e nome da nota, discretos, no pé da tecla
      c.textAlign = 'center'
      c.fillStyle = fantasma ? 'rgba(186,176,214,0.42)' : 'rgba(40,30,28,0.62)'
      c.font = `${Math.round(lt * 0.3)}px ${FONT_BODY}`
      c.fillText(LETRAS[i] ?? '', x + lt / 2 - 1, y0 + alt - lt * 0.52)
      c.fillStyle = fantasma ? 'rgba(200,190,220,0.3)' : 'rgba(40,30,28,0.38)'
      c.font = `${Math.round(lt * 0.23)}px ${FONT_BODY}`
      c.fillText(NOMES_NOTA[i] ?? '', x + lt / 2 - 1, y0 + alt - lt * 0.18)
    }
    c.restore()
  }

  /**
   * O braço do violino, deitado na tela: ébano escuro, as quatro cordas, e
   * oito lugares para o dedo — o mesmo A S D F G H J K do piano.
   */
  private desenharBraco(c: CanvasRenderingContext2D, cssW: number, cssH: number, opcoes: OpcoesPiano): void {
    const larg = Math.min(cssW * 0.6, 600)
    const lt = larg / 8
    const alt = Math.min(lt * 0.9, cssH * 0.075)
    const x0 = (cssW - larg) / 2
    // Alto o bastante para os nomes das notas não ficarem embaixo da dica.
    const y0 = cssH - alt - Math.max(52, cssH * 0.13)
    const treme = this.tremor > 0 ? (Math.random() - 0.5) * this.tremor * 3 : 0
    c.save()
    c.translate(0, treme)
    this.caixas = []
    // A voluta à esquerda e o corpo à direita, só a borda.
    c.fillStyle = 'rgba(86,44,22,0.95)'
    c.beginPath()
    c.ellipse(x0 + larg + 18, y0 + alt / 2, 22, alt * 0.9, 0, Math.PI / 2, -Math.PI / 2, true)
    c.fill()
    c.fillStyle = 'rgba(40,20,12,0.95)'
    c.beginPath()
    c.arc(x0 - 18, y0 + alt / 2, alt * 0.42, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = 'rgba(150,96,52,0.8)'
    c.lineWidth = 2
    c.beginPath()
    c.arc(x0 - 18, y0 + alt / 2, alt * 0.22, 0, Math.PI * 1.6)
    c.stroke()
    // O espelho de ébano.
    const g = c.createLinearGradient(0, y0, 0, y0 + alt)
    g.addColorStop(0, '#1c1612')
    g.addColorStop(0.5, '#0e0b09')
    g.addColorStop(1, '#1c1612')
    c.fillStyle = g
    c.fillRect(x0 - 4, y0, larg + 8, alt)
    c.fillStyle = 'rgba(200,160,110,0.18)'
    c.fillRect(x0 - 4, y0, larg + 8, 1)
    // As quatro cordas.
    for (let k = 0; k < 4; k++) {
      const yc = y0 + alt * (0.2 + k * 0.2)
      c.fillStyle = k < 2 ? 'rgba(226,218,200,0.75)' : 'rgba(200,170,120,0.75)'
      c.fillRect(x0 - 10, yc, larg + 40, k < 2 ? 1 : 2)
    }
    for (let i = 0; i < 8; i++) {
      const x = x0 + i * lt
      this.caixas.push({ x, y: y0 - alt * 0.3, w: lt - 2, h: alt * 1.6 })
      const b = this.brilho[i] ?? 0
      const cx = x + lt / 2
      const cy = y0 + alt / 2
      const r = Math.min(lt, alt) * 0.26
      // O lugar do dedo: um ponto de madrepérola que acende quando soa.
      if (b > 0) {
        const halo = c.createRadialGradient(cx, cy, 0, cx, cy, r * 3)
        halo.addColorStop(0, `rgba(255,214,150,${b * 0.55})`)
        halo.addColorStop(1, 'rgba(255,214,150,0)')
        c.fillStyle = halo
        c.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6)
      }
      c.fillStyle = b > 0 ? `rgba(255,236,200,${0.6 + b * 0.4})` : 'rgba(222,214,198,0.55)'
      c.beginPath()
      c.arc(cx, cy, r * (1 + b * 0.25), 0, Math.PI * 2)
      c.fill()
      if (opcoes.destaque === i) {
        c.strokeStyle = `rgba(217,178,95,${0.55 + Math.sin(performance.now() / 180) * 0.35})`
        c.lineWidth = 2
        c.beginPath()
        c.arc(cx, cy, r * 1.9, 0, Math.PI * 2)
        c.stroke()
      }
      c.textAlign = 'center'
      c.fillStyle = 'rgba(232,224,210,0.62)'
      c.font = `${Math.round(Math.min(lt * 0.26, 20))}px ${FONT_BODY}`
      c.fillText(LETRAS[i] ?? '', cx, y0 - alt * 0.18)
      c.fillStyle = 'rgba(232,224,210,0.4)'
      c.font = `${Math.round(Math.min(lt * 0.2, 15))}px ${FONT_BODY}`
      c.fillText(NOMES_NOTA[i] ?? '', cx, y0 + alt + alt * 0.42)
    }
    c.restore()
  }

  /** Legenda curta sob o piano. */
  drawDica(display: Display, texto: string): void {
    const c = display.ctx
    const { cssW, cssH } = display
    const s = Math.max(12, Math.min(cssW / 72, 17))
    c.save()
    c.textAlign = 'center'
    c.font = `${s}px ${FONT_BODY}`
    const w = c.measureText(texto).width
    c.fillStyle = 'rgba(6,5,9,0.66)'
    c.fillRect(cssW / 2 - w / 2 - s, cssH - s * 3.6, w + s * 2, s * 2)
    c.fillStyle = PAL.inkDim
    c.fillText(texto, cssW / 2, cssH - s * 2.2)
    c.restore()
  }

  get ultimaTocada(): number {
    return this.ultima
  }
}
