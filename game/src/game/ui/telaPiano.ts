/**
 * Quando o piano foi desenhado por último. No celular a caixa de fala
 * cobriria as teclas: com o piano na tela, ela sobe para o alto.
 */
export const telaPiano = { ultimo: -Infinity }

export function pianoNaTela(): boolean {
  return performance.now() - telaPiano.ultimo < 150
}
