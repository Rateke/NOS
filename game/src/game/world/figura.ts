/**
 * Personagem animado, desenhado em retângulos.
 *
 * A obra é feita de silhuetas, então a vida não vem de detalhe: vem de
 * movimento pequeno e constante — respiração, piscada, a cabeça virando para
 * quem fala. Uma figura parada parece um móvel; com respiro, parece gente.
 */

export type Pose = 'de-pe' | 'sentado'

export interface CorFigura {
  roupa: string
  cabelo: string
  pele: string
  sombra: string
}

export interface OpcoesFigura {
  x: number
  /** Linha do chão (os pés). */
  y: number
  /** Altura total em pixels de mundo. */
  altura: number
  cor: CorFigura
  pose?: Pose
  /** Espelha a figura no eixo X. */
  paraEsquerda?: boolean
}

export class Figura {
  x: number
  y: number
  altura: number
  cor: CorFigura
  pose: Pose
  paraEsquerda: boolean

  /** -1 olha para a esquerda, 0 de frente, 1 para a direita. */
  olhar = 0
  /** 0 braços caídos, 1 braços erguidos (tocando, alcançando). */
  braco = 0
  /** 0 ereto, 1 totalmente curvado para a frente. */
  curvatura = 0
  /** Multiplica a respiração: sobe com o esforço. */
  ofego = 1
  /** Tremor em pixels. */
  tremor = 0
  /**
   * De costas para a câmera. Numa cena vista de frente, olhar um retrato na
   * parede do fundo é virar as costas para quem joga.
   */
  costas = false
  /** 0 parado, 1 andando: as pernas alternam e os braços balançam. */
  andando = 0

  private passoFase = 0
  private fase = Math.random() * 6
  private piscaEm = 2 + Math.random() * 4
  private piscando = 0

  constructor(o: OpcoesFigura) {
    this.x = o.x
    this.y = o.y
    this.altura = o.altura
    this.cor = o.cor
    this.pose = o.pose ?? 'de-pe'
    this.paraEsquerda = o.paraEsquerda ?? false
  }

  update(dt: number): void {
    this.fase += dt * (1.1 + this.ofego * 0.9)
    this.passoFase = this.andando > 0.05 ? this.passoFase + dt * 11 * this.andando : 0
    this.piscaEm -= dt
    if (this.piscaEm <= 0) {
      this.piscando = 0.12
      this.piscaEm = 2.4 + Math.random() * 4.5
    }
    if (this.piscando > 0) this.piscando -= dt
  }

  /** Deslocamento vertical do tronco pela respiração. */
  private get respiro(): number {
    return Math.sin(this.fase) * (0.5 + this.ofego * 0.9)
  }

  /**
   * `luzX` é de onde vem a luz: o lado iluminado ganha um fio de contraluz,
   * que é o que separa a silhueta do fundo escuro.
   */
  draw(c: CanvasRenderingContext2D, luzX: number, luzCor = 'rgba(255,206,146,0.34)'): void {
    const espelho = this.paraEsquerda ? -1 : 1
    const trem = this.tremor > 0 ? (Math.random() * 2 - 1) * this.tremor : 0
    const x = Math.round(this.x + trem)
    const base = Math.round(this.y)

    const h = this.altura
    const larguraTronco = Math.round(h * 0.34)
    const altCabeca = Math.round(h * 0.26)
    const altPerna = this.pose === 'sentado' ? Math.round(h * 0.16) : Math.round(h * 0.3)
    const curva = Math.round(this.curvatura * h * 0.16)
    const respiro = Math.round(this.respiro)

    const topoTronco = base - altPerna - Math.round(h * 0.44) + curva
    const altTronco = base - altPerna - topoTronco

    // Sombra no chão
    c.fillStyle = this.cor.sombra
    c.fillRect(x - larguraTronco / 2 - 2, base - 1, larguraTronco + 4, 3)

    // Pernas
    c.fillStyle = this.cor.roupa
    if (this.pose === 'sentado') {
      c.fillRect(x - larguraTronco / 2, base - altPerna, larguraTronco, altPerna)
      // Coxas para a frente
      c.fillRect(x - larguraTronco / 2 + espelho * 2, base - altPerna - 1,
        larguraTronco + 4, Math.max(2, Math.round(h * 0.07)))
    } else {
      const lp = Math.round(larguraTronco * 0.34)
      // Passo: um pé sai do chão enquanto o outro apoia.
      const pa = Math.sin(this.passoFase) * this.andando
      const ergueE = Math.max(0, Math.round(pa * 2))
      const ergueD = Math.max(0, Math.round(-pa * 2))
      c.fillRect(x - larguraTronco / 2 + 1, base - altPerna, lp, altPerna - ergueE)
      c.fillRect(x + larguraTronco / 2 - lp - 1, base - altPerna, lp, altPerna - ergueD)
    }

    // Tronco
    c.fillRect(x - larguraTronco / 2, topoTronco + respiro, larguraTronco, altTronco - respiro)

    // Braços: descem ao lado ou sobem à frente conforme `braco`
    const lb = Math.max(2, Math.round(larguraTronco * 0.26))
    const altBraco = Math.round(h * 0.28)
    const topoBraco = topoTronco + respiro + Math.round(h * 0.06)
    const erguido = Math.round(this.braco * altBraco * 0.55)
    const balanco = this.pose === 'de-pe' ? Math.round(Math.sin(this.passoFase) * this.andando) : 0
    c.fillStyle = this.cor.roupa
    c.fillRect(x - larguraTronco / 2 - lb + 1, topoBraco + erguido, lb, altBraco - erguido - balanco)
    c.fillRect(x + larguraTronco / 2 - 1, topoBraco + erguido, lb, altBraco - erguido + balanco)
    if (this.braco > 0.25) {
      // Antebraços à frente, na altura do instrumento
      c.fillStyle = this.cor.pele
      const yb = topoBraco + erguido + altBraco - erguido - 2
      c.fillRect(x - larguraTronco / 2 - lb + 1, yb, Math.round(larguraTronco * 0.45), 2)
      c.fillRect(x + larguraTronco / 2 - 1 - Math.round(larguraTronco * 0.3), yb,
        Math.round(larguraTronco * 0.45), 2)
    }

    // Cabeça. Três vistas: de frente, de perfil e de costas.
    //
    // No perfil, o cabelo cobre a NUCA — o lado oposto ao olhar — e o rosto
    // fica do lado para onde ele olha, com um olho e o nariz saindo um pixel.
    // A versão anterior punha a mecha do lado do olhar, e aí o boneco parecia
    // olhar para trás.
    const lc = Math.round(h * 0.3)
    const perfil = !this.costas && Math.abs(this.olhar) >= 0.35
    const lado = this.olhar >= 0 ? 1 : -1
    const desv = perfil ? lado * Math.max(1, Math.round(h * 0.03)) : 0
    const topoCabeca = topoTronco + respiro - altCabeca
    const cx0 = x - lc / 2 + desv
    const altCabelo = Math.max(2, Math.round(altCabeca * 0.4))

    if (this.costas) {
      c.fillStyle = this.cor.cabelo
      c.fillRect(cx0, topoCabeca, lc, altCabeca)
      // Um fio de nuca aparecendo por baixo do cabelo
      c.fillStyle = this.cor.pele
      c.fillRect(cx0 + 2, topoCabeca + altCabeca - 2, lc - 4, 2)
    } else if (perfil) {
      c.fillStyle = this.cor.pele
      c.fillRect(cx0, topoCabeca, lc, altCabeca)
      c.fillStyle = this.cor.cabelo
      c.fillRect(cx0, topoCabeca, lc, altCabelo)
      // Nuca: metade de trás da cabeça coberta de cabelo
      const nuca = Math.ceil(lc * 0.5)
      c.fillRect(lado > 0 ? cx0 : cx0 + lc - nuca, topoCabeca, nuca, altCabeca - 1)
      // Nariz: um pixel para fora, do lado do olhar
      c.fillStyle = this.cor.pele
      const oy = topoCabeca + Math.round(altCabeca * 0.58)
      c.fillRect(lado > 0 ? cx0 + lc : cx0 - 1, oy, 1, 2)
      if (this.piscando <= 0 && altCabeca >= 7) {
        c.fillStyle = 'rgba(12,15,22,0.9)'
        c.fillRect(lado > 0 ? cx0 + lc - 3 : cx0 + 2, oy - 1, 1, 1)
      }
    } else {
      c.fillStyle = this.cor.pele
      c.fillRect(cx0, topoCabeca, lc, altCabeca)
      c.fillStyle = this.cor.cabelo
      c.fillRect(cx0, topoCabeca, lc, altCabelo)
      // Costeletas dos dois lados, simétricas
      c.fillRect(cx0, topoCabeca, 1, Math.round(altCabeca * 0.66))
      c.fillRect(cx0 + lc - 1, topoCabeca, 1, Math.round(altCabeca * 0.66))
      if (this.piscando <= 0 && altCabeca >= 7) {
        c.fillStyle = 'rgba(12,15,22,0.85)'
        const oy = topoCabeca + Math.round(altCabeca * 0.6)
        c.fillRect(cx0 + 2, oy, 1, 1)
        c.fillRect(cx0 + lc - 3, oy, 1, 1)
      }
    }

    // Contraluz do lado da fonte
    const ladoLuz = luzX > this.x ? 1 : -1
    c.fillStyle = luzCor
    const bx = ladoLuz > 0 ? x + larguraTronco / 2 - 1 : x - larguraTronco / 2
    c.fillRect(bx, topoTronco + respiro, 1, altTronco - respiro)
    c.fillRect(ladoLuz > 0 ? cx0 + lc - 1 : cx0, topoCabeca, 1, altCabeca)
  }
}
