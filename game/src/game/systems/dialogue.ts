import type { Line } from '../world/types'
import { audio, sons } from '../../engine/audio'
import { voz } from '../../engine/voz'
import { pianoNaTela } from '../ui/telaPiano'
import { PAL } from '../../engine/constants'

const CHARS_PER_SEC = 42
/**
 * Até quantas letras um grito se lê num relance. Grito curto corre sozinho
 * e não dá para pular: é o único momento em que o jogo tira o controle de
 * quem joga. Todo o resto espera o toque — cada um lê no seu tempo.
 */
const GRITO_CURTO = 64

/**
 * A cor do fio de cada pessoa. É a cor do nome dela na legenda — o jogador
 * aprende as cores antes de ver os fios no Tear.
 */
export const FIO: Record<string, string> = {
  Adrian: '#93a6c6',
  Evelyn: '#e2a95e',
  Lia: '#d06e80',
  Elisa: '#b49ade',
  Voz: '#b49ade',
  Catarina: '#8cc095',
  Liam: '#aab0bd',
  Helena: '#cdb577',
}

/** Na primeira fala de cada um, o nome vem com o parentesco. */
const PARENTESCO: Record<string, string> = {
  Adrian: 'pai',
  Evelyn: 'mãe',
  Lia: 'irmã',
  Catarina: 'tia',
}
const apresentados = new Set<string>()

/**
 * Caixa de legenda com efeito de máquina de escrever. Desenhada em resolução
 * de tela (não no mundo) para o texto não ficar ilegível na escala pequena.
 */
export class Dialogue {
  private queue: Line[] = []
  private current: Line | null = null
  private revealed = 0
  private elapsed = 0
  private onDone: (() => void) | null = null
  private lastTypeSound = 0
  /** Segundos de espera antes de avançar sozinho; 0 = espera o jogador. */
  private auto = 0
  private paradoDesde = 0
  /** Parentesco mostrado junto do nome, só na primeira fala da pessoa. */
  private nota = ''

  get active(): boolean {
    return this.current !== null || this.queue.length > 0
  }

  /** A linha atual já terminou de se escrever (ou não há linha). */
  get completa(): boolean {
    return !this.current || this.revealed >= this.current.text.length
  }

  /** Quem está falando agora, ou null se é pensamento. */
  get falante(): string | null {
    return this.current?.speaker ?? null
  }

  /** Quantas falas ainda esperam depois da atual. */
  get fila(): number {
    return this.queue.length
  }

  /** A linha na tela agora. */
  get atual(): Line | null {
    return this.current
  }

  /**
   * Sobe a cada linha nova. Quem precisa reagir ao começo de uma fala (a
   * tela que sacode num grito) compara com o valor da última vez.
   */
  linhaNum = 0

  /**
   * `auto` é o respiro mínimo depois de um grito curto, antes de ele passar
   * sozinho. Fala que não é grito curto ignora o `auto` e espera o toque.
   */
  play(lines: Line[], onDone?: () => void, auto = 0): void {
    this.queue = [...lines]
    this.onDone = onDone ?? null
    this.auto = auto
    this.advance()
  }

  private advance(): void {
    const next = this.queue.shift()
    if (!next) {
      this.current = null
      const cb = this.onDone
      this.onDone = null
      cb?.()
      return
    }
    this.current = next
    this.linhaNum++
    voz.novaLinha()
    // Todo grito vem com o caos por baixo. Em maiúsculas, inteiro.
    if (next.grito) {
      const letras = next.text.replace(/[^A-Za-zÀ-ú]/g, '')
      const altas = letras.replace(/[^A-ZÀ-Þ]/g, '').length
      sons.caos(letras.length > 0 && altas / letras.length > 0.6 ? 1 : 0.6)
    }
    this.revealed = 0
    this.elapsed = 0
    this.paradoDesde = 0
    this.nota = ''
    const quem = next.speaker
    if (quem && PARENTESCO[quem] && !apresentados.has(quem)) {
      apresentados.add(quem)
      this.nota = PARENTESCO[quem] ?? ''
    }
  }

  /** Um grito curto na tela: passa sozinho, e o toque não faz nada. */
  get semControle(): boolean {
    const l = this.current
    return l !== null && l.grito === true && l.text.length <= GRITO_CURTO
  }

  /** Um toque completa a linha; o toque seguinte passa para a próxima. */
  confirm(): void {
    if (!this.current || this.semControle) return
    if (this.revealed < this.current.text.length) {
      this.revealed = this.current.text.length
    } else {
      this.advance()
    }
  }

  update(dt: number): void {
    if (!this.current) return
    if (this.revealed < this.current.text.length) {
      this.elapsed += dt
      const target = Math.min(this.current.text.length, Math.floor(this.elapsed * CHARS_PER_SEC))
      if (target > this.revealed) {
        this.revealed = target
        // Quem fala tem voz; pensamento e papel lido, só o tique da letra.
        const quem = this.current.sombra ? 'sombra' : this.current.speaker
        if (quem && this.current.style !== 'read') {
          voz.legenda(quem, this.current.text, target, {
            grito: this.current.grito === true,
            abafado: this.current.onde !== undefined,
          })
        } else {
          this.lastTypeSound += 1
          if (this.lastTypeSound % 2 === 0) audio.type()
        }
      }
      return
    }
    if (this.semControle) {
      // O tempo de ler o grito inteiro, e ele some.
      this.paradoDesde += dt
      if (this.paradoDesde >= Math.max(this.auto, 0.6 + this.current.text.length / 40)) this.advance()
    }
  }

  render(ctx: CanvasRenderingContext2D, cssW: number, cssH: number): void {
    const line = this.current
    if (!line) return

    const pad = Math.max(16, Math.min(cssW, cssH) * 0.04)
    const boxW = Math.min(cssW - pad * 2, 1000)
    const grito = line.grito === true
    const fontSize = Math.round(Math.max(17, Math.min(cssW / 40, 30)) * (grito ? 1.16 : 1))
    const lineH = fontSize * 1.5
    const boxX = (cssW - boxW) / 2

    const style = line.style ?? 'thought'
    const sombra = line.sombra === true
    const italico = style === 'read' || sombra
    ctx.font = `${italico ? 'italic ' : ''}${fontSize}px ${FONT_BODY}`
    const text = line.text.slice(0, this.revealed)
    const wrapped = wrap(ctx, line.text, boxW - pad * 2)
    const shownLines = wrap(ctx, text, boxW - pad * 2)

    const nameH = line.speaker ? fontSize * 1.5 : 0
    const boxH = nameH + wrapped.length * lineH + pad * 1.4
    // Celular deitado com o piano na tela: a caixa vai para o alto, senão
    // cobre as teclas.
    const boxY = cssH < 540 && pianoNaTela() ? pad : cssH - boxH - pad

    ctx.save()
    ctx.fillStyle = sombra ? 'rgba(10,10,14,0.9)' : 'rgba(4,6,11,0.88)'
    ctx.fillRect(boxX, boxY, boxW, boxH)
    ctx.strokeStyle = sombra ? 'rgba(244,244,250,0.55)' : 'rgba(134,142,162,0.28)'
    ctx.lineWidth = 1
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1)

    const corFio = FIO[line.fio ?? line.speaker ?? ''] ?? PAL.accent
    let ty = boxY + pad * 0.7 + fontSize
    if (line.speaker) {
      ctx.font = `${Math.round(fontSize * 0.82)}px ${FONT_BODY}`
      ctx.fillStyle = corFio
      ctx.letterSpacing = '0.14em'
      const nome = line.speaker.toUpperCase()
      ctx.fillText(nome, boxX + pad, ty)
      const extra = [this.nota, line.onde].filter(Boolean).join(' · ')
      if (extra) {
        const nw = ctx.measureText(nome).width
        ctx.globalAlpha = 0.55
        ctx.fillText(`  ·  ${extra.toUpperCase()}`, boxX + pad + nw, ty)
        ctx.globalAlpha = 1
      }
      ctx.letterSpacing = '0em'
      ty += nameH
      ctx.font = `${fontSize}px ${FONT_BODY}`
    }

    ctx.fillStyle = sombra
      ? '#f4f4fa'
      : line.fio
        ? corFio
        : style === 'read' ? PAL.paper : style === 'speech' ? PAL.ink : PAL.inkDim
    if (italico) ctx.font = `italic ${fontSize}px ${FONT_BODY}`
    if (sombra) {
      ctx.shadowColor = 'rgba(244,244,250,0.45)'
      ctx.shadowBlur = fontSize * 0.5
    }
    // Gritado: a letra treme e se desdobra em vermelho e azul, como a tela.
    const tremor = grito ? Math.max(1, fontSize * 0.06) : 0
    for (const l of shownLines) {
      if (grito) {
        const corTexto: string | CanvasGradient | CanvasPattern = ctx.fillStyle
        ctx.globalAlpha = 0.35
        ctx.fillStyle = '#ff5a6e'
        ctx.fillText(l, boxX + pad - tremor, ty)
        ctx.fillStyle = '#5ad9ff'
        ctx.fillText(l, boxX + pad + tremor, ty)
        ctx.globalAlpha = 1
        ctx.fillStyle = corTexto
        ctx.fillText(l, boxX + pad + (Math.random() - 0.5) * tremor, ty + (Math.random() - 0.5) * tremor)
      } else {
        ctx.fillText(l, boxX + pad, ty)
      }
      ty += lineH
    }
    ctx.shadowBlur = 0

    if (this.revealed >= line.text.length) {
      const t = performance.now() / 500
      ctx.globalAlpha = 0.35 + Math.sin(t) * 0.3
      ctx.fillStyle = PAL.ink
      const s = Math.round(fontSize * 0.3)
      ctx.fillRect(boxX + boxW - pad, boxY + boxH - pad * 0.8, s, s)
      ctx.globalAlpha = 1
    }
    ctx.restore()
  }
}

export const FONT_BODY = `'Spectral', ui-serif, Georgia, 'Times New Roman', serif`
export const FONT_TITLE = `'Bodoni Moda', ui-serif, Didot, 'Playfair Display', Georgia, serif`

/** Para rótulos curtos e interface: a mesma serifa, em corpo pequeno. */
/** Só o fecho: itálico caligráfico para as frases finais. */
export const FONT_FIM = `'Cormorant Garamond', 'Spectral', ui-serif, Georgia, serif`
export const FONT_UI = `'Spectral', ui-serif, Georgia, serif`

export function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ')
  const out: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxW && line) {
      out.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) out.push(line)
  return out
}
