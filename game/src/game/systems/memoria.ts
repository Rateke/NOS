/**
 * O pouco que o jogo lembra entre uma partida e outra, no navegador de quem
 * joga. Tudo embrulhado em try: numa janela anônima o armazenamento pode não
 * existir, e o jogo tem de funcionar igual.
 */
const CHAVE = 'nos:demo'

interface Lembrado {
  /** Já viu a cena da mãe pelo menos uma vez. */
  viuEvelyn?: boolean
  /** Terminou a demo pelo menos uma vez. */
  terminou?: boolean
  /** Já passou pela escolha do Tear (a mãe ou a Lia). */
  viuEscolha?: boolean
}

function ler(): Lembrado {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? (JSON.parse(bruto) as Lembrado) : {}
  } catch {
    return {}
  }
}

function gravar(l: Lembrado): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(l))
  } catch {
    /* sem armazenamento: esquece, e está tudo bem */
  }
}

export const memoria = {
  get viuEvelyn(): boolean {
    return ler().viuEvelyn === true
  },
  marcarEvelyn(): void {
    gravar({ ...ler(), viuEvelyn: true })
  },
  get viuEscolha(): boolean {
    return ler().viuEscolha === true
  },
  marcarEscolha(): void {
    gravar({ ...ler(), viuEscolha: true })
  },
  get terminou(): boolean {
    return ler().terminou === true
  },
  marcarFim(): void {
    gravar({ ...ler(), terminou: true })
  },
}
