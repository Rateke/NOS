/**
 * As relíquias que os fios amarram: objetos e lembranças de gerações
 * diferentes, como o roteiro descreve. Ficam aqui, num módulo só, porque
 * aparecem duas vezes — penduradas no Tear e subindo no escuro do fecho.
 */
export type TipoReliquia = 'retrato' | 'chave' | 'pulseira' | 'fita' | 'anel' | 'carta'

export const RELIQUIAS: TipoReliquia[] = [
  'retrato', 'chave', 'pulseira', 'fita', 'anel', 'carta',
]

export function desenharReliquia(
  c: CanvasRenderingContext2D,
  tipo: TipoReliquia,
  x: number,
  y: number,
  cor: string,
  vazio: string,
): void {
  c.fillStyle = cor
  switch (tipo) {
    case 'retrato':
      c.fillRect(x - 5, y, 10, 8)
      c.fillStyle = vazio
      c.fillRect(x - 3, y + 2, 6, 4)
      break
    case 'chave':
      c.fillRect(x - 1, y, 2, 9)
      c.fillRect(x - 3, y, 6, 3)
      c.fillRect(x + 1, y + 6, 3, 2)
      break
    case 'pulseira':
      c.fillRect(x - 4, y + 1, 8, 2)
      c.fillRect(x - 5, y + 3, 2, 3)
      c.fillRect(x + 3, y + 3, 2, 3)
      break
    case 'fita':
      c.fillRect(x - 6, y, 12, 7)
      c.fillStyle = vazio
      c.fillRect(x - 4, y + 2, 3, 3)
      c.fillRect(x + 1, y + 2, 3, 3)
      break
    case 'anel':
      c.fillRect(x - 2, y + 1, 4, 1)
      c.fillRect(x - 3, y + 2, 1, 3)
      c.fillRect(x + 2, y + 2, 1, 3)
      c.fillRect(x - 2, y + 5, 4, 1)
      break
    case 'carta':
      c.fillRect(x - 5, y, 10, 7)
      c.fillStyle = vazio
      c.fillRect(x - 3, y + 2, 6, 1)
      c.fillRect(x - 3, y + 4, 4, 1)
      break
  }
}
