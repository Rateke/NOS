import type { Input } from '../../engine/input'
import { FONT_BODY, FONT_TITLE } from '../systems/dialogue'
import { PAL } from '../../engine/constants'

/** Retângulo clicável, em pixels de tela. */
export interface Caixa {
  x: number
  y: number
  w: number
  h: number
}

export interface ItemLista {
  rotulo: string
  /** A linha pequena embaixo do item escolhido. Vazia, não aparece. */
  nota: string
}

export interface OpcoesLista {
  itens: readonly ItemLista[]
  sel: number
  cssW: number
  /** Linha de base do primeiro item. */
  y0: number
  /** Tamanho da letra. */
  s: number
  t: number
  /** Opacidade de cada item (a montagem do menu entra um por um). */
  alfa: (i: number) => number
  /** Falso enquanto nada pode ser escolhido: nenhum item fica marcado. */
  vivo: boolean
}

export const PASSO_LISTA = 3.7

/**
 * Uma lista de opções no jeito do menu do jogo: maiúsculas espaçadas, o item
 * escolhido aceso, dois fios que se abrem dos lados dele e a nota embaixo.
 * O menu principal e a pausa desenham com isto, para serem a mesma coisa.
 */
export function desenharLista(c: CanvasRenderingContext2D, o: OpcoesLista): Caixa[] {
  const { cssW, s } = o
  const caixas: Caixa[] = []
  let y = o.y0
  c.save()
  c.textAlign = 'center'
  for (const [i, item] of o.itens.entries()) {
    const a = o.alfa(i)
    const ativo = i === o.sel && o.vivo
    caixas.push({ x: cssW * 0.24, y: y - s * 1.3, w: cssW * 0.52, h: s * 2.6 })

    c.globalAlpha = a * (ativo ? 1 : 0.42)
    c.fillStyle = ativo ? PAL.ink : PAL.inkDim
    c.font = `${ativo ? 400 : 300} ${s * (ativo ? 1.16 : 1.04)}px ${FONT_TITLE}`
    c.letterSpacing = '0.16em'
    c.fillText(item.rotulo.toUpperCase(), cssW / 2, y)
    const larguraTexto = c.measureText(item.rotulo.toUpperCase()).width
    c.letterSpacing = '0em'

    if (ativo) {
      const pulso = 0.5 + Math.sin(o.t * 2.2) * 0.22
      c.globalAlpha = a * pulso
      c.fillStyle = PAL.accent
      const larg = s * 3.2
      const folga = larguraTexto / 2 + s * 1.1
      c.fillRect(cssW / 2 - folga - larg, y - s * 0.34, larg, 1)
      c.fillRect(cssW / 2 + folga, y - s * 0.34, larg, 1)

      if (item.nota) {
        c.globalAlpha = a * 0.55
        c.fillStyle = PAL.inkDim
        c.font = `300 italic ${s * 0.72}px ${FONT_BODY}`
        c.fillText(item.nota, cssW / 2, y + s * 1.5)
      }
    }
    y += s * PASSO_LISTA
  }
  c.restore()
  return caixas
}

/**
 * Setas (ou W/S) andam, clique escolhe, Espaço/Enter/E confirma. Devolve a
 * seleção nova e o índice escolhido (ou -1).
 */
export function navegarLista(
  input: Input,
  n: number,
  sel: number,
  caixas: readonly Caixa[],
): { sel: number; escolhido: number; moveu: boolean } {
  let novo = sel
  if (input.consumeKey('ArrowUp') || input.consumeKey('KeyW')) novo = (novo - 1 + n) % n
  if (input.consumeKey('ArrowDown') || input.consumeKey('KeyS')) novo = (novo + 1) % n
  const tap = input.consumeTap()
  let clicou = false
  if (tap) {
    const i = caixas.findIndex((r) => tap.x >= r.x && tap.x <= r.x + r.w && tap.y >= r.y && tap.y <= r.y + r.h)
    if (i >= 0) {
      novo = i
      clicou = true
    }
  }
  // Um clique fora das opções não confirma nada.
  const confirmou = input.consumeConfirm()
  const escolhido = clicou || (confirmou && !tap) ? novo : -1
  return { sel: novo, escolhido, moveu: novo !== sel }
}
