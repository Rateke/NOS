import { FONT_TITLE, FONT_FIM } from '../systems/dialogue'
import type { GameState } from '../systems/state'

/**
 * Etiquetas: é assim que cada pessoa é apresentada na primeira vez que
 * aparece. Um pedaço de papel pendurado por um fio, na letra do Adrian —
 * nome, o que a pessoa é na família, e o rótulo que ele deu. A apresentação
 * já nasce suspeita: quem escreveu foi ele.
 *
 * Depois do grito, a sombra passa a riscar o rótulo e escrever outro por cima.
 */
export interface DadosEtiqueta {
  nome: string
  papel: string
  rotulo: string
}

export const ETIQUETAS: Record<string, DadosEtiqueta> = {
  Adrian: { nome: 'ADRIAN', papel: 'pai', rotulo: 'Paciente.' },
  Liam: { nome: 'LIAM', papel: 'filho', rotulo: 'Maduro.' },
  Evelyn: { nome: 'EVELYN', papel: 'mãe', rotulo: 'Cansada.' },
  Lia: { nome: 'LIA', papel: 'filha', rotulo: 'Rebelde.' },
}

interface Ativa {
  quem: string
  t: number
  dur: number
  /** A sombra risca o rótulo e escreve isto por cima. */
  verdade?: string
}

export class Etiquetas {
  private ativas: Ativa[] = []

  /** Mostra a etiqueta de alguém, só na primeira aparição da partida. */
  apresentar(state: GameState, quem: string, dur = 6.5): void {
    if (!ETIQUETAS[quem] || !state.apresentar(quem)) return
    this.ativas.push({ quem, t: 0, dur })
  }

  /** A etiqueta de novo, com o rótulo riscado pela sombra. */
  corrigir(quem: string, verdade: string, dur = 9): void {
    this.ativas = this.ativas.filter((a) => a.quem !== quem)
    this.ativas.push({ quem, t: 0, dur, verdade })
  }

  get visivel(): boolean {
    return this.ativas.length > 0
  }

  update(dt: number): void {
    for (const a of this.ativas) a.t += dt
    this.ativas = this.ativas.filter((a) => a.t < a.dur)
  }

  /**
   * `pos` diz onde está a cabeça de cada um, em pixels de tela; quem não
   * estiver na tela não ganha etiqueta desenhada (mas o tempo corre).
   */
  draw(c: CanvasRenderingContext2D, cssW: number, pos: (quem: string) => { x: number; y: number } | null): void {
    const s = Math.max(12, Math.min(cssW / 64, 19))
    for (const a of this.ativas) {
      const dados = ETIQUETAS[a.quem]
      const p = pos(a.quem)
      if (!dados || !p) continue
      const entra = Math.min(1, a.t / 0.5)
      const sai = Math.min(1, (a.dur - a.t) / 0.8)
      const alfa = Math.max(0, Math.min(entra, sai))
      const balanco = Math.sin(a.t * 1.6) * 0.02

      c.save()
      c.globalAlpha = alfa
      const linha1 = `${dados.nome} — ${dados.papel}.`
      c.font = `500 ${s}px ${FONT_TITLE}`
      const w1 = c.measureText(linha1).width
      c.font = `italic 400 ${s}px ${FONT_TITLE}`
      const w2 = c.measureText(dados.rotulo).width
      let w3 = 0
      if (a.verdade) {
        c.font = `italic 600 ${s * 1.15}px ${FONT_FIM}`
        w3 = c.measureText(a.verdade).width
      }
      const w = Math.max(w1, w2, w3) + s * 1.6
      const h = s * (a.verdade ? 4.3 : 3.1)
      // Pendurada acima e ao lado da cabeça, para não cobrir o rosto.
      // Quem está à esquerda da tela ganha a etiqueta à esquerda, e vice-versa:
      // duas pessoas lado a lado não disputam o mesmo espaço.
      const esquerda = p.x < cssW / 2
      const ax = Math.min(cssW - w - 8, Math.max(8, esquerda ? p.x - w - s * 1.2 : p.x + s * 1.2))
      const ay = Math.max(8, p.y - h - s * 2.2)

      // O fio que prende a etiqueta na pessoa
      c.strokeStyle = 'rgba(220,210,190,0.55)'
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(p.x, p.y)
      c.quadraticCurveTo(p.x + (esquerda ? -s : s) * 0.4, ay + h + s, ax + (esquerda ? w - s * 0.7 : s * 0.7), ay + h * 0.3)
      c.stroke()

      c.translate(ax, ay)
      c.rotate(-0.05 + balanco)
      c.fillStyle = 'rgba(0,0,0,0.45)'
      c.fillRect(3, 4, w, h)
      c.fillStyle = '#e9e1cc'
      c.fillRect(0, 0, w, h)
      c.fillStyle = 'rgba(120,96,60,0.25)'
      c.fillRect(0, 0, w, 2)
      // O furo do barbante
      c.fillStyle = '#2a241c'
      c.beginPath()
      c.arc(s * 0.7, h * 0.3, s * 0.18, 0, Math.PI * 2)
      c.fill()

      c.fillStyle = '#1a1a20'
      c.font = `500 ${s}px ${FONT_TITLE}`
      c.fillText(linha1, s * 1.2, s * 1.35)
      c.font = `italic 400 ${s}px ${FONT_TITLE}`
      c.fillText(dados.rotulo, s * 1.2, s * 2.55)
      if (a.verdade) {
        const risco = Math.min(1, Math.max(0, (a.t - 1.2) / 0.6))
        c.fillStyle = 'rgba(18,18,26,0.9)'
        c.fillRect(s * 1.1, s * 2.12, (w2 + s * 0.3) * risco, s * 0.34)
        c.fillStyle = '#fbfbff'
        c.fillRect(s * 1.15, s * 2.18, (w2 + s * 0.2) * risco, s * 0.22)
        const escreve = Math.max(0, Math.min(1, (a.t - 2) / 1.2))
        if (escreve > 0) {
          c.globalAlpha = alfa * escreve
          c.font = `italic 600 ${s * 1.15}px ${FONT_FIM}`
          c.lineWidth = Math.max(2, s * 0.16)
          c.lineJoin = 'round'
          c.strokeStyle = 'rgba(18,18,26,0.9)'
          c.strokeText(a.verdade, s * 1.2, s * 3.75)
          c.fillStyle = '#fbfbff'
          c.fillText(a.verdade, s * 1.2, s * 3.75)
        }
      }
      c.restore()
    }
  }
}
