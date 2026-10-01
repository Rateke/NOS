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

/** O que a pessoa veste: muda os detalhes do tronco, não a silhueta. */
export type Estilo = 'simples' | 'moletom' | 'camisa' | 'uniforme' | 'casaco'

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
  estilo?: Estilo
  /** Calça (ou saia); sem isto, um tom abaixo da roupa. */
  calca?: string
  sapato?: string
  /** A sola clara do tênis. */
  solado?: string
  /** Olheiras: quem trabalha de dia e de noite. */
  olheiras?: boolean
  /** Os cordões do capuz do moletom. */
  cordao?: string
}

export type TipoCabelo = 'curto' | 'longo' | 'rabo'

/**
 * Como cada pessoa da família se veste. As cenas espalham isto por cima das
 * opções: assim Liam é o mesmo menino na sala, na cozinha e no porão.
 */
export const VISUAL = {
  liam: { estilo: 'moletom', calca: '#262a34', sapato: '#17191f', solado: '#b8b4ac' },
  adrian: { estilo: 'camisa', calca: '#211e24', sapato: '#120c0a' },
  evelyn: { estilo: 'uniforme', calca: '#2b3640', sapato: '#2a2224', olheiras: true },
  lia: { estilo: 'moletom', calca: '#33425c', sapato: '#d4d0c6', solado: '#f0ece2', cordao: '#e4d8c8' },
} as const satisfies Record<string, Partial<OpcoesFigura>>

/** Figura toda preta, sem rosto: alguém que a memória não deixa ver. */
const SILHUETA: CorFigura = { roupa: '#030204', cabelo: '#030204', pele: '#030204', sombra: 'rgba(0,0,0,0.4)' }

/** Clareia (+) ou escurece (−) uma cor '#rrggbb'. Outras notações passam direto. */
export function tom(cor: string, d: number): string {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(cor)
  if (!m || !m[1]) return cor
  let hex = m[1]
  if (hex.length === 3) hex = hex.split('').map((ch) => ch + ch).join('')
  const n = parseInt(hex, 16)
  const f = (v: number) => Math.max(0, Math.min(255, v + d)).toString(16).padStart(2, '0')
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`
}

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
  estilo: Estilo
  calca: string | null
  sapato: string
  solado: string | null
  olheiras: boolean
  cordao: string | null
  /** Desenha só a silhueta, em preto. */
  silhueta = false
  /** Cor da silhueta, quando não é preta: a sombra branca de Liam. */
  silhuetaCor: CorFigura | null = null

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
    this.estilo = o.estilo ?? 'simples'
    this.calca = o.calca ?? null
    this.sapato = o.sapato ?? '#15151a'
    this.solado = o.solado ?? null
    this.olheiras = o.olheiras ?? false
    this.cordao = o.cordao ?? null
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
   * que é o que separa a silhueta do fundo escuro; o outro lado, um tom
   * abaixo. Roupa, mãos, sapatos e rosto são desenhados em partes — a mesma
   * figura de antes, agora com volume.
   */
  draw(c: CanvasRenderingContext2D, luzX: number, luzCor = 'rgba(255,206,146,0.34)'): void {
    const sil = this.silhueta
    const cor = sil ? (this.silhuetaCor ?? SILHUETA) : this.cor
    const trem = this.tremor > 0 ? (Math.random() * 2 - 1) * this.tremor : 0
    const x = Math.round(this.x + trem)
    const base = Math.round(this.y)
    const h = this.altura
    const sentado = this.pose === 'sentado'
    const perfil = !this.costas && Math.abs(this.olhar) >= 0.35
    const lado = this.olhar >= 0 ? 1 : -1
    const ladoLuz = luzX > this.x ? 1 : -1
    const grande = h >= 36

    const roupa = cor.roupa
    const roupaSom = sil ? roupa : tom(roupa, -16)
    const roupaFundo = sil ? roupa : tom(roupa, -28)
    const calca = sil ? roupa : this.calca ?? tom(roupa, -12)
    const calcaSom = sil ? calca : tom(calca, -14)
    const sapato = sil ? roupa : this.sapato
    const pele = cor.pele
    const peleSom = sil ? pele : tom(pele, -20)

    const altCabeca = Math.max(5, Math.round(h * 0.25))
    const largCabeca = Math.max(5, Math.round(h * 0.28))
    const pescoco = grande ? 2 : 1
    const altTronco = Math.round(h * 0.34)
    const altPerna = sentado ? Math.round(h * 0.16) : h - altCabeca - pescoco - altTronco
    const ombro = Math.round(h * (perfil ? 0.26 : 0.36))
    const cintura = ombro - (perfil ? 1 : 2)
    const curva = Math.round(this.curvatura * h * 0.16)
    const resp = Math.round(this.respiro)
    const baseTronco = base - altPerna
    const topoTronco = baseTronco - altTronco + curva + (sentado ? 1 : 0)
    const yT = topoTronco + resp

    // Sombra no chão: oval, mais escura no meio.
    c.fillStyle = cor.sombra
    c.fillRect(x - Math.round(ombro / 2) - 2, base - 1, ombro + 4, 2)
    c.fillRect(x - Math.round(ombro / 2), base + 1, ombro, 1)

    // --- Pernas e sapatos -------------------------------------------------
    if (sentado) {
      c.fillStyle = calca
      c.fillRect(x - Math.round(cintura / 2), base - altPerna, cintura, altPerna - 1)
      c.fillStyle = calcaSom
      c.fillRect(x, base - altPerna, 1, altPerna - 1)
      // Coxas para a frente, sobre o banco
      c.fillStyle = calca
      c.fillRect(x - Math.round(cintura / 2), base - altPerna - 1, cintura + 2, Math.max(2, Math.round(h * 0.07)))
      c.fillStyle = sapato
      c.fillRect(x - Math.round(cintura / 2), base - 1, Math.round(cintura / 2) - 1, 1)
      c.fillRect(x + 1, base - 1, Math.round(cintura / 2) - 1, 1)
    } else {
      const lp = Math.max(2, Math.round(ombro * 0.3))
      const pa = Math.sin(this.passoFase) * this.andando
      const ergueE = Math.max(0, Math.round(pa * 2))
      const ergueD = Math.max(0, Math.round(-pa * 2))
      const pernas: [number, number, boolean][] = perfil
        ? [[x - Math.round(lp / 2) - Math.round(pa * 2) * lado, ergueD, false], [x - Math.round(lp / 2) + Math.round(pa * 2) * lado, ergueE, true]]
        : [[x - lp, ergueE, true], [x, ergueD, true]]
      for (const [px, ergue, frente] of pernas) {
        const alt = altPerna - ergue
        c.fillStyle = frente ? calca : calcaSom
        c.fillRect(px, base - altPerna, lp, alt)
        // Vinco e joelho
        c.fillStyle = calcaSom
        c.fillRect(px + (ladoLuz > 0 ? 0 : lp - 1), base - altPerna, 1, alt)
        // Sapato: um pixel mais comprido para a frente
        const pe = perfil ? lado : 0
        c.fillStyle = sapato
        c.fillRect(px + Math.min(0, pe), base - ergue - 2, lp + Math.abs(pe), 2)
        if (this.solado && !sil) {
          c.fillStyle = this.solado
          c.fillRect(px + Math.min(0, pe), base - ergue - 1, lp + Math.abs(pe), 1)
        }
      }
      if (!perfil) {
        // Entreperna escura
        c.fillStyle = calcaSom
        c.fillRect(x - 1, base - altPerna, 1, Math.round(altPerna * 0.6))
      }
    }

    // --- Mochila, por trás do tronco ----------------------------------------
    const mochila = this.mochila && !sentado ? this.mochila : null
    if (mochila && perfil) {
      const alt = Math.round(altTronco * 0.66)
      c.fillStyle = sil ? roupa : mochila
      const atras = lado > 0 ? x - Math.round(ombro / 2) - 3 : x + Math.round(ombro / 2)
      c.fillRect(atras, yT + 2, 3, alt)
      c.fillStyle = sil ? roupa : tom(mochila, 18)
      c.fillRect(atras, yT + 2, 3, 1)
    }

    // --- Tronco: ombros caídos, afina até a cintura ---------------------------
    for (let r = 0; r < altTronco - resp; r++) {
      const k = r / Math.max(1, altTronco - 1)
      const w = r === 0 ? ombro - 2 : Math.round(ombro + (cintura - ombro) * k)
      c.fillStyle = roupa
      c.fillRect(x - Math.round(w / 2), yT + r, w, 1)
      // O lado de longe da luz fica um tom abaixo
      c.fillStyle = roupaSom
      c.fillRect(ladoLuz > 0 ? x - Math.round(w / 2) : x + Math.round(w / 2) - 2, yT + r, 2, 1)
    }
    const fimTronco = baseTronco
    if (!sil) this.detalhesTronco(c, x, yT, fimTronco, ombro, roupa, perfil, lado)

    if (mochila && this.costas) {
      const alt = Math.round(altTronco * 0.66)
      c.fillStyle = sil ? roupa : mochila
      c.fillRect(x - Math.round(ombro / 2) + 1, yT + 2, ombro - 2, alt)
      if (!sil) {
        c.fillStyle = tom(mochila, 20)
        c.fillRect(x - Math.round(ombro / 2) + 1, yT + 2, ombro - 2, 1)
        c.fillStyle = tom(mochila, -18)
        c.fillRect(x - Math.round(ombro / 2) + 2, yT + 2 + Math.round(alt * 0.55), ombro - 4, 1)
        c.fillRect(x - 1, yT + 4, 2, 1)
      }
    } else if (mochila && !perfil && !sil) {
      // De frente, só as alças
      c.fillStyle = mochila
      c.fillRect(x - Math.round(ombro / 2) + 1, yT, 1, Math.round(altTronco * 0.7))
      c.fillRect(x + Math.round(ombro / 2) - 2, yT, 1, Math.round(altTronco * 0.7))
    }

    // --- Braços e mãos ---------------------------------------------------------
    const lb = grande ? 3 : 2
    const altBraco = altTronco - 1
    const topoBraco = yT + 1
    const erguido = Math.round(this.braco * altBraco * 0.55)
    const balanco = !sentado ? Math.round(Math.sin(this.passoFase) * this.andando * 1.5) : 0
    const bracoX: [number, number, boolean][] = perfil
      ? [[x - Math.round(lb / 2) - balanco * lado, -balanco, true]]
      : [[x - Math.round(ombro / 2) - lb + 1, -balanco, ladoLuz < 0], [x + Math.round(ombro / 2) - 1, balanco, ladoLuz > 0]]
    if (perfil) {
      // O braço de trás, mais escuro, aparece quando ele anda
      if (this.andando > 0.05) {
        c.fillStyle = roupaFundo
        c.fillRect(x - Math.round(lb / 2) + balanco * lado, topoBraco + 1, lb, altBraco - 3)
      }
    }
    for (const [bx, desce, iluminado] of bracoX) {
      if (this.costas && this.braco > 0.25) break
      const alt = altBraco - erguido + desce
      c.fillStyle = iluminado ? roupa : roupaSom
      c.fillRect(bx, topoBraco + erguido, lb, alt)
      if (!sil) {
        c.fillStyle = roupaFundo
        c.fillRect(bx, topoBraco + erguido + alt - 1, lb, 1)
      }
      if (this.braco <= 0.25) {
        c.fillStyle = pele
        c.fillRect(bx, topoBraco + erguido + alt, lb, grande ? 3 : 2)
        if (!sil) {
          c.fillStyle = peleSom
          c.fillRect(bx, topoBraco + erguido + alt + (grande ? 2 : 1), lb, 1)
        }
      }
    }
    if (this.braco > 0.25 && this.costas) {
      // De costas, os braços vão para a frente: só aparecem os cotovelos
      const yb = topoBraco + Math.round(altBraco * 0.5)
      c.fillStyle = roupaSom
      c.fillRect(x - Math.round(ombro / 2) - lb, yb, lb, 3)
      c.fillRect(x + Math.round(ombro / 2), yb, lb, 3)
    } else if (this.braco > 0.25) {
      // Antebraços à frente, na altura do instrumento
      const yb = topoBraco + altBraco - 2
      const ab = Math.round(ombro * 0.45)
      c.fillStyle = roupaSom
      c.fillRect(x - Math.round(ombro / 2) - lb + 1, yb, ab, 2)
      c.fillRect(x + Math.round(ombro / 2) + lb - 1 - ab, yb, ab, 2)
      c.fillStyle = pele
      c.fillRect(x - Math.round(ombro / 2) - lb + 1 + ab, yb, 2, 2)
      c.fillRect(x + Math.round(ombro / 2) + lb - 3 - ab, yb, 2, 2)
    }

    // --- Pescoço ---------------------------------------------------------------
    const desv = perfil ? lado * Math.max(1, Math.round(h * 0.03)) : 0
    const inclina = Math.round(this.curvatura * 2) * (perfil ? lado : 0)
    c.fillStyle = peleSom
    c.fillRect(x - 1 + desv, yT - pescoco, grande ? 3 : 2, pescoco)

    // --- Cabeça ----------------------------------------------------------------
    const topoCabeca = yT - pescoco - altCabeca + Math.round(this.curvatura * 1.5)
    const cx0 = x - Math.round(largCabeca / 2) + desv + inclina
    // Rosto com os cantos arredondados (um pixel a menos em cima e no queixo)
    c.fillStyle = pele
    c.fillRect(cx0 + 1, topoCabeca, largCabeca - 2, 1)
    c.fillRect(cx0, topoCabeca + 1, largCabeca, altCabeca - 2)
    c.fillRect(cx0 + 1, topoCabeca + altCabeca - 1, largCabeca - 2, 1)
    if (!sil) {
      // Sombra do lado de longe da luz e embaixo do queixo
      c.fillStyle = peleSom
      c.fillRect(ladoLuz > 0 ? cx0 : cx0 + largCabeca - 1, topoCabeca + 2, 1, altCabeca - 3)
      c.fillRect(cx0 + 2, topoCabeca + altCabeca - 1, largCabeca - 4, 1)
    }

    const olhoY = topoCabeca + Math.round(altCabeca * 0.56)
    if (!sil && !this.costas) this.rosto(c, cx0, topoCabeca, largCabeca, altCabeca, olhoY, perfil, lado, pele, peleSom)

    this.desenharCabelo(c, cor, cx0, topoCabeca, largCabeca, altCabeca, perfil, lado, yT)

    // Contraluz do lado da fonte: tronco, braço e rosto
    c.fillStyle = luzCor
    const bx = ladoLuz > 0 ? x + Math.round(ombro / 2) - 1 : x - Math.round(ombro / 2)
    c.fillRect(bx, yT + 1, 1, fimTronco - yT - 1)
    c.fillRect(ladoLuz > 0 ? cx0 + largCabeca - 1 : cx0, topoCabeca + 1, 1, altCabeca - 2)
    c.fillRect(ladoLuz > 0 ? x + Math.round(ombro / 2) + lb - 2 : x - Math.round(ombro / 2) - lb + 1,
      topoBraco + erguido + 1, 1, Math.max(1, altBraco - erguido - 2))
  }

  /** Bolsos, zíper, botões, crachá: o que cada roupa tem na frente (ou atrás). */
  private detalhesTronco(
    c: CanvasRenderingContext2D, x: number, yT: number, fim: number, ombro: number,
    roupa: string, perfil: boolean, lado: number,
  ): void {
    const alt = fim - yT
    const claro = tom(roupa, 22)
    const escuro = tom(roupa, -26)
    const meio = perfil ? x + lado : x
    if (this.costas) {
      if (this.estilo === 'moletom') {
        // O capuz caído nas costas
        c.fillStyle = escuro
        c.fillRect(x - Math.round(ombro / 2) + 2, yT, ombro - 4, 3)
        c.fillStyle = claro
        c.fillRect(x - Math.round(ombro / 2) + 2, yT, ombro - 4, 1)
      }
      // Costura do meio das costas, quase sumida
      c.fillStyle = tom(roupa, -9)
      c.fillRect(x, yT + 3, 1, alt - 4)
      return
    }
    switch (this.estilo) {
      case 'moletom': {
        // Gola do capuz em volta do pescoço, bolso canguru e o zíper/cordões
        c.fillStyle = claro
        c.fillRect(meio - 2, yT, 5, 1)
        c.fillStyle = escuro
        if (!perfil) {
          // Bolso canguru: só a borda de cima e um tom mais fundo
          const bw = Math.round(ombro * 0.55)
          c.fillStyle = tom(roupa, -7)
          c.fillRect(x - Math.round(bw / 2), fim - 5, bw, 4)
          c.fillStyle = tom(roupa, -20)
          c.fillRect(x - Math.round(bw / 2) + 1, fim - 5, bw - 2, 1)
        }
        if (this.cordao) {
          c.fillStyle = this.cordao
          c.fillRect(meio - 1, yT + 1, 1, 3)
          c.fillRect(meio + 1, yT + 1, 1, 2)
        } else if (!perfil) {
          c.fillStyle = claro
          c.fillRect(x, yT + 1, 1, alt - 6)
        }
        // Punho elástico na barra
        c.fillStyle = escuro
        c.fillRect(x - Math.round(ombro / 2) + 1, fim - 1, ombro - 2, 1)
        break
      }
      case 'camisa': {
        // Gola clara em V, botões, cinto com fivela
        if (this.gola) {
          c.fillStyle = this.gola
          c.fillRect(meio - 2, yT, 2, 1)
          c.fillRect(meio + 1, yT, 2, 1)
          c.fillRect(meio - 1, yT + 1, 1, 1)
          c.fillRect(meio + 1, yT + 1, 1, 1)
        }
        c.fillStyle = claro
        for (let yy = yT + 3; yy < fim - 3; yy += 2) c.fillRect(meio, yy, 1, 1)
        c.fillStyle = '#100c0c'
        c.fillRect(x - Math.round(ombro / 2) + 1, fim - 3, ombro - 2, 1)
        c.fillStyle = '#b89a5a'
        c.fillRect(meio, fim - 3, 1, 1)
        // Bolso do peito
        if (!perfil) {
          c.fillStyle = escuro
          c.fillRect(x - Math.round(ombro / 4) - 1, yT + 3, 3, 1)
        }
        break
      }
      case 'uniforme': {
        // Gola, crachá e a fileira de botões de pressão
        if (this.gola) {
          c.fillStyle = this.gola
          c.fillRect(meio - 2, yT, 5, 1)
          c.fillRect(meio - 2, yT + 1, 1, 1)
          c.fillRect(meio + 2, yT + 1, 1, 1)
        }
        if (!perfil) {
          c.fillStyle = '#e6e8ea'
          c.fillRect(x - Math.round(ombro / 4) - 1, yT + 3, 3, 2)
          c.fillStyle = '#3a6a8a'
          c.fillRect(x - Math.round(ombro / 4) - 1, yT + 3, 3, 1)
        }
        c.fillStyle = escuro
        for (let yy = yT + 3; yy < fim - 2; yy += 3) c.fillRect(meio, yy, 1, 1)
        c.fillRect(x - Math.round(ombro / 2) + 1, fim - 4, ombro - 2, 1)
        break
      }
      case 'casaco': {
        c.fillStyle = escuro
        c.fillRect(meio, yT + 1, 1, alt - 1)
        c.fillRect(meio - 2, yT, 1, 3)
        c.fillRect(meio + 2, yT, 1, 3)
        break
      }
      default: {
        if (this.gola) {
          c.fillStyle = this.gola
          c.fillRect(meio - 2, yT, 1, 2)
          c.fillRect(meio + 1, yT, 1, 2)
        }
      }
    }
  }

  /** Olhos, sobrancelhas, nariz, boca e orelhas. Um pixel para cada coisa. */
  private rosto(
    c: CanvasRenderingContext2D, cx0: number, _topo: number, lc: number, alt: number,
    olhoY: number, perfil: boolean, lado: number, pele: string, peleSom: string,
  ): void {
    const olho = 'rgba(12,14,20,0.95)'
    const sobr = tom(this.cor.cabelo, 10)
    const fechado = this.piscando > 0
    if (perfil) {
      const frente = lado > 0 ? cx0 + lc - 1 : cx0
      const ox = lado > 0 ? cx0 + lc - 3 : cx0 + 2
      // Nariz para fora, do lado do olhar
      c.fillStyle = pele
      c.fillRect(lado > 0 ? cx0 + lc : cx0 - 1, olhoY + 1, 1, 2)
      c.fillStyle = peleSom
      c.fillRect(lado > 0 ? cx0 + lc : cx0 - 1, olhoY + 2, 1, 1)
      if (alt >= 7) {
        c.fillStyle = fechado ? peleSom : olho
        c.fillRect(ox, olhoY, 1, 1)
        c.fillStyle = sobr
        c.fillRect(ox - (lado > 0 ? 1 : 0), olhoY - 2, 2, 1)
        // Boca
        c.fillStyle = tom(pele, -34)
        c.fillRect(lado > 0 ? frente - 1 : frente, olhoY + 3, 2, 1)
      }
      // Orelha no meio da cabeça
      c.fillStyle = peleSom
      c.fillRect(cx0 + Math.floor(lc / 2) - (lado > 0 ? 1 : 0), olhoY, 1, 2)
      if (this.olheiras) {
        c.fillStyle = tom(pele, -14)
        c.fillRect(ox, olhoY + 1, 1, 1)
      }
      return
    }
    const ex = Math.max(1, Math.round(lc * 0.24))
    const oE = cx0 + ex
    const oD = cx0 + lc - 1 - ex
    // Orelhas, para fora do rosto
    c.fillStyle = peleSom
    c.fillRect(cx0 - 1, olhoY, 1, 2)
    c.fillRect(cx0 + lc, olhoY, 1, 2)
    if (alt < 6) return
    c.fillStyle = fechado ? peleSom : olho
    c.fillRect(oE, olhoY, 1, 1)
    c.fillRect(oD, olhoY, 1, 1)
    if (alt >= 9 && !fechado) {
      // Brilho do olho: quem olha de volta
      c.fillStyle = 'rgba(230,236,250,0.5)'
      c.fillRect(oE + 1, olhoY, 1, 1)
      c.fillRect(oD - 1, olhoY, 1, 1)
    }
    c.fillStyle = sobr
    c.fillRect(oE - (alt >= 9 ? 1 : 0), olhoY - 2, alt >= 9 ? 2 : 1, 1)
    c.fillRect(oD, olhoY - 2, alt >= 9 ? 2 : 1, 1)
    if (this.olheiras) {
      c.fillStyle = tom(pele, -16)
      c.fillRect(oE, olhoY + 1, 1, 1)
      c.fillRect(oD, olhoY + 1, 1, 1)
    }
    // Nariz: só a sombra de baixo
    c.fillStyle = peleSom
    const meio = cx0 + Math.floor(lc / 2)
    c.fillRect(meio - (lc % 2 === 0 ? 1 : 0), olhoY + 2, lc % 2 === 0 ? 2 : 1, 1)
    // Boca: reta. Ninguém sorri nesta casa.
    if (alt >= 7) {
      c.fillStyle = tom(pele, -36)
      c.fillRect(meio - 1, olhoY + (alt >= 9 ? 4 : 3), lc % 2 === 0 ? 2 : 3, 1)
    }
  }

  /**
   * O corte de cabelo por cima da cabeça básica: curto com franja, longo e
   * solto, ou rabo de cavalo. Mechas mais claras do lado da luz.
   */
  private desenharCabelo(
    c: CanvasRenderingContext2D, cor: CorFigura, cx0: number, topo: number, lc: number,
    alt: number, perfil: boolean, lado: number, ombro: number,
  ): void {
    const h = this.altura
    const sil = this.silhueta
    const cab = cor.cabelo
    const luz = sil ? cab : tom(cab, 26)
    const fundo = sil ? cab : tom(cab, -14)
    const altCabelo = Math.max(2, Math.round(alt * 0.38))
    c.fillStyle = cab

    // Topo arredondado, comum a todos os cortes
    if (this.costas) {
      c.fillRect(cx0 + 1, topo - 1, lc - 2, 1)
      c.fillRect(cx0, topo, lc, alt - 2)
      c.fillStyle = fundo
      c.fillRect(cx0 + 1, topo + alt - 3, lc - 2, 1)
    } else if (perfil) {
      c.fillRect(cx0 + 1, topo - 1, lc - 2, 1)
      c.fillRect(cx0, topo, lc, altCabelo)
      const nuca = Math.ceil(lc * 0.5)
      c.fillRect(lado > 0 ? cx0 : cx0 + lc - nuca, topo, nuca, alt - 2)
    } else {
      c.fillRect(cx0 + 1, topo - 1, lc - 2, 1)
      c.fillRect(cx0, topo, lc, altCabelo)
      // Costeletas
      c.fillRect(cx0, topo, 1, Math.round(alt * 0.62))
      c.fillRect(cx0 + lc - 1, topo, 1, Math.round(alt * 0.62))
    }
    if (!sil) {
      c.fillStyle = luz
      c.fillRect(cx0 + Math.round(lc * 0.3), topo - 1, Math.max(2, Math.round(lc * 0.35)), 1)
    }

    c.fillStyle = cab
    if (this.cabelo === 'curto' && !this.costas && !perfil) {
      // Franja caindo na testa, com duas pontas mais compridas
      c.fillRect(cx0 + 1, topo + altCabelo, lc - 2, 1)
      c.fillRect(cx0 + Math.round(lc * 0.3), topo + altCabelo + 1, 1, 1)
      c.fillRect(cx0 + Math.round(lc * 0.62), topo + altCabelo + 1, 1, 1)
    } else if (this.cabelo === 'curto' && this.costas && !sil) {
      // A nuca e as orelhas, vistas por trás
      c.fillStyle = tom(cor.pele, -16)
      c.fillRect(cx0 + 2, topo + alt - 2, lc - 4, 1)
      c.fillRect(cx0 - 1, topo + Math.round(alt * 0.5), 1, 2)
      c.fillRect(cx0 + lc, topo + Math.round(alt * 0.5), 1, 2)
    } else if (this.cabelo === 'longo') {
      const desce = alt + Math.round(h * 0.16)
      if (this.costas) {
        c.fillRect(cx0 - 1, topo, lc + 2, desce)
        c.fillStyle = fundo
        for (let i = 1; i < lc; i += 3) c.fillRect(cx0 + i, topo + 3, 1, desce - 4)
        c.fillStyle = cab
        // Pontas desiguais
        c.fillRect(cx0, topo + desce, 2, 1)
        c.fillRect(cx0 + lc - 3, topo + desce, 2, 1)
      } else if (perfil) {
        const nuca = Math.ceil(lc * 0.62)
        c.fillRect(lado > 0 ? cx0 - 1 : cx0 + lc - nuca + 1, topo, nuca, desce)
        c.fillStyle = fundo
        c.fillRect(lado > 0 ? cx0 : cx0 + lc - 2, topo + 3, 1, desce - 4)
      } else {
        c.fillRect(cx0 - 1, topo, 2, desce)
        c.fillRect(cx0 + lc - 1, topo, 2, desce)
        c.fillStyle = fundo
        c.fillRect(cx0 - 1, topo + 3, 1, desce - 3)
        c.fillRect(cx0 + lc, topo + 3, 1, desce - 3)
        // Risca no meio
        if (!sil) {
          c.fillStyle = tom(cor.pele, -10)
          c.fillRect(cx0 + Math.floor(lc / 2), topo, 1, 1)
        }
      }
    } else if (this.cabelo === 'rabo') {
      const balanca = Math.round(Math.sin(this.fase * 0.9) * 1)
      const compr = Math.round(alt * 1.15)
      if (this.costas) {
        c.fillRect(cx0 + Math.floor(lc / 2) - 1 + balanca, topo + 1, 2, compr + 2)
        if (!sil) {
          c.fillStyle = '#b03a4a'
          c.fillRect(cx0 + Math.floor(lc / 2) - 1, topo + 1, 2, 1)
        }
      } else if (perfil) {
        const tras = lado > 0 ? cx0 - 2 : cx0 + lc
        c.fillRect(tras, topo, 2, 2)
        c.fillRect(tras + (lado > 0 ? -1 : 1) + balanca, topo + 1, 2, compr)
        if (!sil) {
          c.fillStyle = '#b03a4a'
          c.fillRect(tras, topo + 1, 2, 1)
        }
      } else {
        // Franja caindo de lado e o rabo aparecendo atrás, pelo lado
        c.fillRect(cx0, topo, Math.ceil(lc * 0.55), altCabelo + 1)
        c.fillRect(cx0 + lc + balanca, topo + 1, 2, compr)
        c.fillStyle = luz
        c.fillRect(cx0 + lc + balanca, topo + 2, 1, Math.round(compr * 0.6))
      }
    }

    if (this.barba && !this.costas && !sil) {
      // Barba cheia no queixo e bigode por cima da boca
      c.fillStyle = cab
      c.globalAlpha = 0.72
      const y0 = topo + alt - 3
      if (perfil) {
        c.fillRect(lado > 0 ? cx0 + 2 : cx0, y0, lc - 2, 3)
      } else {
        c.fillRect(cx0, y0 - 1, 1, 3)
        c.fillRect(cx0 + lc - 1, y0 - 1, 1, 3)
        c.fillRect(cx0 + 1, y0 + 1, lc - 2, 2)
        c.fillRect(cx0 + Math.floor(lc / 2) - 2, y0, 4, 1)
      }
      c.globalAlpha = 1
    }
    void ombro
  }
}

/** A sombra branca: silhueta sem rosto, mais alta e mais fina que ele. */
export function criarSombraBranca(x: number, y: number, altura = 34): Figura {
  const f = new Figura({
    x, y, altura,
    cor: { roupa: '#f2f3f8', cabelo: '#f2f3f8', pele: '#f2f3f8', sombra: 'rgba(240,240,250,0.35)' },
  })
  f.silhueta = true
  f.silhuetaCor = { roupa: '#eef0f7', cabelo: '#f6f7fb', pele: '#f6f7fb', sombra: 'rgba(240,240,250,0.3)' }
  return f
}
