export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function centerOf(r: Rect): { x: number; y: number } {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 }
}

/** Como a legenda trata a linha. */
export type LineStyle = 'thought' | 'speech' | 'read'

export interface Line {
  speaker?: string
  text: string
  style?: LineStyle
  /** A sombra falando: sem nome, em branco. */
  sombra?: boolean
  /**
   * De quem é o fio desta fala, quando não é de quem fala. Liam repetindo o
   * pai sai com a cor do pai.
   */
  fio?: string
  /** De onde vem a voz, quando não se vê quem fala ("da cozinha"). */
  onde?: string
}

export interface Interactable {
  id: string
  /** Área de colisão do objeto no mundo. */
  rect: Rect
  /** Rótulo curto exibido no aviso de interação. */
  label: string
  /** Se true, bloqueia a passagem de Liam. */
  solid?: boolean
  /** Some do cenário quando resolvido (roupa guardada, objeto recolhido). */
  consumable?: boolean
  /** Conta para "o quarto está arrumado". */
  chore?: boolean
  /** Vai para o inventário em vez de simplesmente sumir. */
  keepsake?: { name: string; note: string }
}
