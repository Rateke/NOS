export interface Keepsake {
  id: string
  name: string
  note: string
}

/**
 * Estado da fatia. `resolved` guarda tudo que já foi examinado ou recolhido;
 * `chores` é o subconjunto que precisa estar vazio para o quarto contar como
 * arrumado.
 */
export class GameState {
  readonly resolved = new Set<string>()
  readonly seen = new Set<string>()
  readonly inventory: Keepsake[] = []
  diaryRead = false
  doorAttempts = 0
  /** Segredos achados, na demo inteira. Ver content/segredos.ts. */
  readonly segredos = new Set<string>()
  /**
   * O que Liam já sabe. É daqui que o caderno "O que eu sei" se escreve
   * sozinho: cada id destrava uma linha (ver content/caderno.ts).
   */
  readonly sabe = new Set<string>()
  /** Camadas do mundo já apresentadas com a anotação a lápis no canto. */
  readonly camadas = new Set<string>()
  /** Quem já ganhou a etiqueta de apresentação, na letra do Adrian. */
  readonly apresentados = new Set<string>()
  /**
   * Depois do grito a sombra passa a escrever no caderno: risca o que é
   * mentira e escreve a verdade por cima.
   */
  sombraEscreve = false
  /** 0..1: o caderno ganhou uma linha nova e ainda ninguém abriu. */
  novidade = 0
  private chores = new Set<string>()

  registerChore(id: string): void {
    this.chores.add(id)
  }

  resolve(id: string): void {
    this.resolved.add(id)
  }

  isResolved(id: string): boolean {
    return this.resolved.has(id)
  }

  markSeen(id: string): boolean {
    const first = !this.seen.has(id)
    this.seen.add(id)
    return first
  }

  choresLeft(): number {
    let n = 0
    for (const id of this.chores) if (!this.resolved.has(id)) n++
    return n
  }

  get tidy(): boolean {
    return this.choresLeft() === 0
  }

  /** Marca um segredo. Devolve true só na primeira vez. */
  descobrir(id: string): boolean {
    if (this.segredos.has(id)) return false
    this.segredos.add(id)
    return true
  }

  /** Liam fica sabendo de algo. Devolve true só na primeira vez. */
  aprender(id: string): boolean {
    if (this.sabe.has(id)) return false
    this.sabe.add(id)
    this.novidade = 1
    return true
  }

  /** Primeira vez que esta camada aparece? Marca e responde. */
  primeiraCamada(id: string): boolean {
    if (this.camadas.has(id)) return false
    this.camadas.add(id)
    return true
  }

  /** Primeira vez que esta pessoa aparece? Marca e responde. */
  apresentar(quem: string): boolean {
    if (this.apresentados.has(quem)) return false
    this.apresentados.add(quem)
    return true
  }

  addKeepsake(k: Keepsake): void {
    if (!this.inventory.some((i) => i.id === k.id)) this.inventory.push(k)
  }
}
