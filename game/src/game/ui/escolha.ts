import type { Input } from '../../engine/input'
import { FONT_FIM, FONT_BODY } from '../systems/dialogue'
import { PAL } from '../../engine/constants'
import { audio } from '../../engine/audio'

/**
 * As palavras do próprio Liam, escrevendo-se devagar enquanto ele pensa.
 *
 * Existe para uma cena só: a mãe faz uma pergunta de verdade, as respostas
 * dele começam a se formar — e, antes de alguma ficar pronta, sai da boca
 * dele a frase do pai. Na primeira vez que alguém joga, isso acontece
 * sempre: as palavras dele são mais lentas que as do Adrian. Nas outras,
 * ele já sabe o que quer dizer e às vezes chega antes.
 */
export interface OpcoesEscolha {
  opcoes: string[]
  /** Letras por segundo com que cada resposta se escreve. */
  escrita: number
  /** Segundos até a frase do pai sair sozinha. */
  forcarEm: number
  /**
   * Na primeira vez, nenhuma resposta dele fica pronta a tempo: apertar
   * qualquer tecla não escolhe nada. A frase do pai chega antes, sempre.
   */
  travada?: boolean
  onEscolha: (i: number) => void
  onForcada: () => void
}

export class Escolha {
  private o: OpcoesEscolha | null = null
  private t = 0
  private sel = 0
  private desfazendo = -1
  caixas: { x: number; y: number; w: number; h: number }[] = []

  get ativa(): boolean {
    return this.o !== null
  }

  abrir(o: OpcoesEscolha): void {
    this.o = o
    this.t = 0
    this.sel = 0
    this.desfazendo = -1
  }

  /** Quantas letras de cada opção já estão escritas agora. */
  private escritas(): number[] {
    const o = this.o
    if (!o) return []
    let resta = this.t * o.escrita
    return o.opcoes.map((op) => {
      const n = Math.max(0, Math.min(op.length, Math.floor(resta)))
      resta -= op.length + 3
      return n
    })
  }

  private pronta(i: number): boolean {
    const o = this.o
    if (!o || o.travada) return false
    return (this.escritas()[i] ?? 0) >= (o.opcoes[i]?.length ?? 1)
  }

  update(dt: number, input: Input): void {
    const o = this.o
    if (!o) return
    this.t += dt
    if (this.desfazendo >= 0) {
      this.desfazendo += dt
      // Bloqueia a entrada enquanto as palavras dele se apagam.
      input.consumeConfirm()
      input.consumeTap()
      if (this.desfazendo > 0.9) {
        this.o = null
        o.onForcada()
      }
      return
    }
    if (this.t >= o.forcarEm) {
      this.desfazendo = 0
      audio.refuse()
      return
    }
    if (input.consumeKey('ArrowUp') || input.consumeKey('KeyW')) this.mover(-1)
    if (input.consumeKey('ArrowDown') || input.consumeKey('KeyS')) this.mover(1)
    const tap = input.consumeTap()
    if (tap) {
      const i = this.caixas.findIndex((r) => tap.x >= r.x && tap.x <= r.x + r.w && tap.y >= r.y && tap.y <= r.y + r.h)
      if (i >= 0 && this.pronta(i)) this.escolher(i)
      input.consumeConfirm()
      return
    }
    if (input.consumeConfirm() && this.pronta(this.sel)) this.escolher(this.sel)
  }

  private mover(d: number): void {
    const n = this.o?.opcoes.length ?? 1
    this.sel = (this.sel + d + n) % n
  }

  private escolher(i: number): void {
    const o = this.o
    if (!o) return
    this.o = null
    audio.interact()
    o.onEscolha(i)
  }

  draw(c: CanvasRenderingContext2D, cssW: number, cssH: number): void {
    const o = this.o
    if (!o) return
    const s = Math.max(20, Math.min(cssW / 34, 36))
    const n = this.escritas()
    const sumir = this.desfazendo >= 0 ? Math.min(1, this.desfazendo / 0.8) : 0
    c.save()
    c.textAlign = 'center'
    this.caixas = []
    let y = cssH * 0.6
    for (const [i, op] of o.opcoes.entries()) {
      const k = n[i] ?? 0
      const texto = op.slice(0, k)
      const pronta = k >= op.length
      const ativo = i === this.sel && pronta && sumir === 0 && !o.travada
      c.font = `italic 500 ${s}px ${FONT_FIM}`
      const w = c.measureText(op).width
      this.caixas.push({ x: cssW / 2 - w / 2 - s, y: y - s, w: w + s * 2, h: s * 1.5 })
      c.globalAlpha = (pronta ? (ativo ? 1 : 0.62) : 0.5) * (1 - sumir)
      c.fillStyle = '#c6d0f0'
      // As letras se desprendem e caem quando a frase do pai chega antes.
      const deriva = sumir * s * 0.6
      c.fillText(texto, cssW / 2, y + deriva * (1 + i * 0.3))
      if (ativo) {
        c.globalAlpha = 0.5
        c.fillStyle = PAL.accent
        c.fillRect(cssW / 2 - w / 2, y + s * 0.3, w, 1)
      }
      if (!pronta && sumir === 0) {
        // A ponta do lápis, piscando onde a palavra para.
        const tw = c.measureText(texto).width
        c.globalAlpha = 0.4 + Math.sin(this.t * 9) * 0.3
        c.fillRect(cssW / 2 + tw / 2 + 3, y - s * 0.7, 1.5, s * 0.8)
      }
      y += s * 1.7
    }
    c.globalAlpha = 0.35 * (1 - sumir)
    c.fillStyle = PAL.inkDim
    c.font = `${Math.max(12, s * 0.42)}px ${FONT_BODY}`
    c.fillText('o que eu digo?', cssW / 2, cssH * 0.6 - s * 1.5)
    c.restore()
  }
}
