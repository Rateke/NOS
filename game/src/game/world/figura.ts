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
  /** Corte de cabelo: é o que primeiro separa uma pessoa da outra. */
  cabelo?: TipoCabelo
  barba?: boolean
  /** Cor da gola da camisa aparecendo no pescoço. */
  gola?: string
  /** Mochila nas costas: quem está pronto para sair. */
  mochila?: string
}

export type TipoCabelo = 'curto' | 'longo' | 'rabo'

/** Figura toda preta, sem rosto: alguém que a memória não deixa ver. */
const SILHUETA: CorFigura = { roupa: '#030204', cabelo: '#030204', pele: '#030204', sombra: 'rgba(0,0,0,0.4)' }

export class Figura {
  x: number
  y: number
  altura: number
  cor: CorFigura
  pose: Pose
  paraEsquerda: boolean
  cabelo: TipoCabelo
  barba: boolean
  gola: string | null
  mochila: string | null
  /** Desenha só a silhueta, em preto. */
  silhueta = false

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
    this.cabelo = o.cabelo ?? 'curto'
    this.barba = o.barba ?? false
    this.gola = o.gola ?? null
    this.mochila = o.mochila ?? null
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
    const cor = this.silhueta ? SILHUETA : this.cor
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
    c.fillStyle = cor.sombra
    c.fillRect(x - larguraTronco / 2 - 2, base - 1, larguraTronco + 4, 3)

    // Pernas
    c.fillStyle = cor.roupa
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

    // Mochila: de costas cobre o meio das costas; de perfil, aparece atrás.
    if (this.mochila && this.pose === 'de-pe') {
      const alt = Math.round(altTronco * 0.62)
      const y0 = topoTronco + respiro + 2
      const perfilM = !this.costas && Math.abs(this.olhar) >= 0.35
      c.fillStyle = this.silhueta ? cor.roupa : this.mochila
      if (this.costas) {
        c.fillRect(x - larguraTronco / 2 + 1, y0, larguraTronco - 2, alt)
      } else if (perfilM) {
        const atras = this.olhar >= 0 ? -1 : 1
        c.fillRect(atras < 0 ? x - larguraTronco / 2 - 3 : x + larguraTronco / 2, y0, 3, alt)
      } else {
        // De frente, só as alças
        c.fillRect(x - larguraTronco / 2 + 1, y0 - 1, 1, alt)
        c.fillRect(x + larguraTronco / 2 - 2, y0 - 1, 1, alt)
      }
      c.fillStyle = cor.roupa
    }
    // Gola da camisa no pescoço
    if (this.gola && !this.costas && !this.silhueta) {
      c.fillStyle = this.gola
      c.fillRect(x - 2, topoTronco + respiro, 1, 2)
      c.fillRect(x + 1, topoTronco + respiro, 1, 2)
      c.fillStyle = cor.roupa
    }

    // Braços: descem ao lado ou sobem à frente conforme `braco`
    const lb = Math.max(2, Math.round(larguraTronco * 0.26))
    const altBraco = Math.round(h * 0.28)
    const topoBraco = topoTronco + respiro + Math.round(h * 0.06)
    const erguido = Math.round(this.braco * altBraco * 0.55)
    const balanco = this.pose === 'de-pe' ? Math.round(Math.sin(this.passoFase) * this.andando) : 0
    c.fillStyle = cor.roupa
    c.fillRect(x - larguraTronco / 2 - lb + 1, topoBraco + erguido, lb, altBraco - erguido - balanco)
    c.fillRect(x + larguraTronco / 2 - 1, topoBraco + erguido, lb, altBraco - erguido + balanco)
    if (this.braco > 0.25) {
      // Antebraços à frente, na altura do instrumento
      c.fillStyle = cor.pele
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
      c.fillStyle = cor.cabelo
      c.fillRect(cx0, topoCabeca, lc, altCabeca)
      // Um fio de nuca aparecendo por baixo do cabelo
      c.fillStyle = cor.pele
      c.fillRect(cx0 + 2, topoCabeca + altCabeca - 2, lc - 4, 2)
    } else if (perfil) {
      c.fillStyle = cor.pele
      c.fillRect(cx0, topoCabeca, lc, altCabeca)
      c.fillStyle = cor.cabelo
      c.fillRect(cx0, topoCabeca, lc, altCabelo)
      // Nuca: metade de trás da cabeça coberta de cabelo
      const nuca = Math.ceil(lc * 0.5)
      c.fillRect(lado > 0 ? cx0 : cx0 + lc - nuca, topoCabeca, nuca, altCabeca - 1)
      // Nariz: um pixel para fora, do lado do olhar
      c.fillStyle = cor.pele
      const oy = topoCabeca + Math.round(altCabeca * 0.58)
      c.fillRect(lado > 0 ? cx0 + lc : cx0 - 1, oy, 1, 2)
      if (this.piscando <= 0 && altCabeca >= 7 && !this.silhueta) {
        c.fillStyle = 'rgba(12,15,22,0.9)'
        c.fillRect(lado > 0 ? cx0 + lc - 3 : cx0 + 2, oy - 1, 1, 1)
      }
    } else {
      c.fillStyle = cor.pele
      c.fillRect(cx0, topoCabeca, lc, altCabeca)
      c.fillStyle = cor.cabelo
      c.fillRect(cx0, topoCabeca, lc, altCabelo)
      // Costeletas dos dois lados, simétricas
      c.fillRect(cx0, topoCabeca, 1, Math.round(altCabeca * 0.66))
      c.fillRect(cx0 + lc - 1, topoCabeca, 1, Math.round(altCabeca * 0.66))
      if (this.piscando <= 0 && altCabeca >= 7 && !this.silhueta) {
        c.fillStyle = 'rgba(12,15,22,0.85)'
        const oy = topoCabeca + Math.round(altCabeca * 0.6)
        c.fillRect(cx0 + 2, oy, 1, 1)
        c.fillRect(cx0 + lc - 3, oy, 1, 1)
      }
    }

    this.desenharCabelo(c, cor, cx0, topoCabeca, lc, altCabeca, altCabelo, perfil, lado, topoTronco + respiro)

    // Contraluz do lado da fonte
    const ladoLuz = luzX > this.x ? 1 : -1
    c.fillStyle = luzCor
    const bx = ladoLuz > 0 ? x + larguraTronco / 2 - 1 : x - larguraTronco / 2
    c.fillRect(bx, topoTronco + respiro, 1, altTronco - respiro)
    c.fillRect(ladoLuz > 0 ? cx0 + lc - 1 : cx0, topoCabeca, 1, altCabeca)
  }

  /**
   * O corte de cabelo por cima da cabeça básica. Sem isso Evelyn e Lia
   * pareciam de cabeça raspada — e ninguém se reconhecia na cozinha.
   */
  private desenharCabelo(
    c: CanvasRenderingContext2D, cor: CorFigura, cx0: number, topo: number, lc: number,
    alt: number, altCabelo: number, perfil: boolean, lado: number, ombro: number,
  ): void {
    const h = this.altura
    c.fillStyle = cor.cabelo
    if (this.cabelo === 'longo') {
      // Solto até abaixo do ombro, com volume dos lados.
      const desce = alt + Math.round(h * 0.15)
      if (this.costas) {
        c.fillRect(cx0 - 1, topo - 1, lc + 2, desce)
      } else if (perfil) {
        c.fillRect(cx0, topo - 1, lc, altCabelo + 1)
        const nuca = Math.ceil(lc * 0.6)
        c.fillRect(lado > 0 ? cx0 - 1 : cx0 + lc - nuca + 1, topo, nuca, desce)
      } else {
        c.fillRect(cx0 - 1, topo - 1, lc + 2, altCabelo + 1)
        c.fillRect(cx0 - 1, topo, 2, desce)
        c.fillRect(cx0 + lc - 1, topo, 2, desce)
        // Risca no meio
        c.fillStyle = cor.pele
        if (!this.silhueta) c.fillRect(cx0 + Math.floor(lc / 2), topo, 1, 1)
      }
    } else if (this.cabelo === 'rabo') {
      // Rabo de cavalo alto, que balança com a respiração.
      const balanca = Math.round(Math.sin(this.fase * 0.9) * 1)
      const compr = Math.round(alt * 1.1)
      if (this.costas) {
        c.fillRect(cx0, topo - 1, lc, alt)
        c.fillRect(cx0 + Math.floor(lc / 2) - 1 + balanca, topo + 1, 2, compr + 2)
      } else if (perfil) {
        c.fillRect(cx0, topo - 1, lc, altCabelo + 1)
        const tras = lado > 0 ? cx0 - 2 : cx0 + lc
        c.fillRect(tras, topo, 2, 2)
        c.fillRect(tras + (lado > 0 ? -1 : 1) + balanca, topo + 1, 2, compr)
      } else {
        c.fillRect(cx0 - 1, topo - 1, lc + 2, altCabelo)
        // Franja caindo de lado
        c.fillRect(cx0, topo, Math.ceil(lc * 0.55), altCabelo + 1)
        // O rabo aparece atrás, pelo lado
        c.fillRect(cx0 + lc + balanca, topo + 1, 2, compr)
      }
    }
    if (this.barba && !this.costas && !this.silhueta) {
      c.fillStyle = cor.cabelo
      c.globalAlpha = 0.55
      if (perfil) c.fillRect(lado > 0 ? cx0 + 2 : cx0, topo + alt - 2, lc - 2, 2)
      else c.fillRect(cx0 + 1, topo + alt - 2, lc - 2, 2)
      c.globalAlpha = 1
    }
    void ombro
  }
}
