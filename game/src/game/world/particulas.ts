/**
 * Poeira e brasas. São partículas baratas, e fazem mais pela sensação de
 * espaço do que qualquer objeto parado: o ar passa a existir.
 */
export interface Particula {
  x: number
  y: number
  vx: number
  vy: number
  vida: number
  total: number
  tam: number
  cor: string
}

export class Particulas {
  private itens: Particula[] = []

  get quantidade(): number {
    return this.itens.length
  }

  emitir(p: Particula): void {
    // Teto: partícula é enfeite, não pode custar quadro.
    if (this.itens.length > 320) return
    this.itens.push(p)
  }

  /**
   * Poeira suspensa num feixe de luz. Cai devagar e deriva de lado, como pó
   * de verdade — nunca sobe.
   */
  poeira(x: number, y: number, larg: number, alt: number, cor = 'rgba(255,214,160,'): void {
    this.emitir({
      x: x + Math.random() * larg,
      y: y + Math.random() * alt,
      vx: (Math.random() - 0.5) * 3,
      vy: 1.4 + Math.random() * 2.2,
      vida: 3 + Math.random() * 4,
      total: 7,
      tam: Math.random() < 0.75 ? 1 : 2,
      cor,
    })
  }

  /** Brasa subindo, para o Tear: sobe porque é calor, não pó. */
  brasa(x: number, y: number, cor = 'rgba(206,176,255,'): void {
    this.emitir({
      x,
      y,
      vx: (Math.random() - 0.5) * 9,
      vy: -(7 + Math.random() * 16),
      vida: 0.8 + Math.random() * 1.1,
      total: 1.9,
      tam: Math.random() < 0.7 ? 1 : 2,
      cor,
    })
  }

  update(dt: number): void {
    for (const p of this.itens) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vida -= dt
    }
    this.itens = this.itens.filter((p) => p.vida > 0)
  }

  draw(c: CanvasRenderingContext2D, brilho = false): void {
    c.save()
    if (brilho) c.globalCompositeOperation = 'lighter'
    for (const p of this.itens) {
      const a = Math.min(1, p.vida / (p.total * 0.4)) * 0.5
      c.fillStyle = `${p.cor}${a.toFixed(3)})`
      c.fillRect(Math.round(p.x), Math.round(p.y), p.tam, p.tam)
    }
    c.restore()
  }

  limpar(): void {
    this.itens = []
  }
}
