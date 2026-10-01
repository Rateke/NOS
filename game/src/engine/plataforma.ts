/**
 * O que depende de onde o jogo está rodando.
 *
 * No navegador, uma página não pode fechar a própria aba (só a que ela mesma
 * abriu). Na versão de computador ela pode: o empacotador (Electron, Tauri,
 * NW.js) expõe `window.nosNativo.sair()` num script de pré-carga, e é essa
 * função que fecha o jogo de verdade. Ver o README.
 */
interface Nativo {
  sair?: () => void
}

function nativo(): Nativo | undefined {
  return (window as unknown as { nosNativo?: Nativo }).nosNativo
}

/** Existe um jeito garantido de fechar? (só na versão de computador) */
export function fechaDeVerdade(): boolean {
  return typeof nativo()?.sair === 'function'
}

/**
 * Tenta fechar o jogo. Resolve `true` se fechou (ou vai fechar), `false` se
 * a página continua aberta — aí quem chamou mostra a despedida no lugar.
 */
export function sairDoJogo(): Promise<boolean> {
  const n = nativo()
  if (n?.sair) {
    n.sair()
    return Promise.resolve(true)
  }
  try {
    window.close()
  } catch {
    /* recusado */
  }
  // O navegador decide em seguida; se a janela ainda existe, não fechou.
  return new Promise((ok) => window.setTimeout(() => ok(window.closed), 250))
}
