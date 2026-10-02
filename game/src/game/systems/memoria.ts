/**
 * O pouco que o jogo lembra entre uma partida e outra, no navegador de quem
 * joga. Tudo embrulhado em try: numa janela anônima o armazenamento pode não
 * existir, e o jogo tem de funcionar igual.
 */
const CHAVE = 'nos:demo'

interface Lembrado {
  /** Já viu a cena da mãe pelo menos uma vez. */
  viuEvelyn?: boolean
  /** Já viu a conversa com a Lia no quarto dela. */
  viuLia?: boolean
  /** Terminou a demo pelo menos uma vez. */
  terminou?: boolean
  /** Já passou pela escolha do Tear (a mãe ou a Lia). */
  viuEscolha?: boolean
  /** O que saiu da escolha do Tear na última vez. */
  escolha?: 'mae' | 'lia' | 'nenhuma'
  /** Saiu para o menu no meio da cozinha ou do Tear, e o menu ainda não disse nada. */
  fugiu?: boolean
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
  get viuLia(): boolean {
    return ler().viuLia === true
  },
  marcarLia(): void {
    gravar({ ...ler(), viuLia: true })
  },
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
  get escolhaAnterior(): 'mae' | 'lia' | 'nenhuma' | null {
    return ler().escolha ?? null
  },
  guardarEscolha(r: 'mae' | 'lia' | 'nenhuma'): void {
    gravar({ ...ler(), escolha: r })
  },
  get fugiu(): boolean {
    return ler().fugiu === true
  },
  marcarFuga(sim: boolean): void {
    gravar({ ...ler(), fugiu: sim })
  },
}
