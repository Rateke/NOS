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

  addKeepsake(k: Keepsake): void {
    if (!this.inventory.some((i) => i.id === k.id)) this.inventory.push(k)
  }
}
