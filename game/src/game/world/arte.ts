/**
 * Peças de desenho comuns a todos os cômodos.
 *
 * O problema dos cenários antigos era a superfície lisa: parede de uma cor,
 * chão de uma cor. Aqui toda superfície tem textura — padrão no papel de
 * parede, painéis no lambri, veio e emenda no assoalho — e ela é gerada por
 * um sorteio com semente fixa, para o mesmo cômodo sair sempre igual.
 */

export type RGB = [number, number, number]

export function rgb(c: RGB, a = 1): string {
  return a >= 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`
}

/** Interpola entre frio e quente. `k` = 0 frio, 1 quente. */
export function mix(frio: RGB, quente: RGB, k: number): string {
  return rgb([
    Math.round(frio[0] + (quente[0] - frio[0]) * k),
    Math.round(frio[1] + (quente[1] - frio[1]) * k),
    Math.round(frio[2] + (quente[2] - frio[2]) * k),
  ])
}

export function clarear(c: RGB, d: number): RGB {
  return [
    Math.max(0, Math.min(255, c[0] + d)),
    Math.max(0, Math.min(255, c[1] + d)),
    Math.max(0, Math.min(255, c[2] + d)),
  ]
}

/** Sorteio determinístico: mesma semente, mesmo cômodo. */
export function sorteio(semente: number): () => number {
  let s = semente >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function ret(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cor: string): void {
  c.fillStyle = cor
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

/**
 * Papel de parede com um motivo pequeno repetido — losango com ponto no
 * centro, em tom quase igual ao fundo. De longe é textura; de perto, padrão.
 */
export function papelDeParede(
  c: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number,
  base: RGB, desbotado = 0,
): void {
  ret(c, x0, y0, x1 - x0, y1 - y0, rgb(base))
  const claro = rgb(clarear(base, 7), 1)
  const escuro = rgb(clarear(base, -5), 1)
  for (let y = y0 + 4; y < y1; y += 12) {
    const desloc = ((y - y0) / 12) % 2 === 0 ? 0 : 7
    for (let x = x0 + desloc; x < x1; x += 14) {
      c.fillStyle = claro
      c.fillRect(x, y, 1, 1)
      c.fillRect(x - 1, y + 1, 1, 1)
      c.fillRect(x + 1, y + 1, 1, 1)
      c.fillRect(x, y + 2, 1, 1)
      c.fillStyle = escuro
      c.fillRect(x, y + 1, 1, 1)
    }
  }
  // Manchas de papel desbotado: onde já houve um quadro pendurado.
  if (desbotado > 0) {
    const r = sorteio(Math.round(x0 * 7 + y0))
    for (let i = 0; i < desbotado; i++) {
      const w = 14 + Math.floor(r() * 16)
      const h = 12 + Math.floor(r() * 12)
      const x = x0 + Math.floor(r() * (x1 - x0 - w))
      const y = y0 + 8 + Math.floor(r() * 40)
      c.fillStyle = rgb(clarear(base, 4), 0.55)
      c.fillRect(x, y, w, h)
    }
  }
}

/** Lambri: painéis de madeira na metade de baixo, com friso por cima. */
export function lambri(
  c: CanvasRenderingContext2D, x0: number, x1: number, yTopo: number, yChao: number, cor: RGB,
): void {
  ret(c, x0, yTopo, x1 - x0, yChao - yTopo, rgb(cor))
  ret(c, x0, yTopo - 3, x1 - x0, 3, rgb(clarear(cor, 16)))
  ret(c, x0, yTopo, x1 - x0, 1, rgb(clarear(cor, -10)))
  for (let x = x0 + 6; x < x1 - 20; x += 34) {
    c.fillStyle = rgb(clarear(cor, -8))
    c.fillRect(x, yTopo + 6, 26, 1)
    c.fillRect(x, yTopo + 6, 1, yChao - yTopo - 14)
    c.fillStyle = rgb(clarear(cor, 6))
    c.fillRect(x + 26, yTopo + 6, 1, yChao - yTopo - 14)
    c.fillRect(x, yChao - 8, 27, 1)
  }
  // Rodapé
  ret(c, x0, yChao - 4, x1 - x0, 4, rgb(clarear(cor, -14)))
  ret(c, x0, yChao - 4, x1 - x0, 1, rgb(clarear(cor, 10)))
}

/** Assoalho de tábuas com emendas desencontradas e veio. */
export function assoalho(
  c: CanvasRenderingContext2D, x0: number, x1: number, yChao: number, yFim: number, cor: RGB,
): void {
  ret(c, x0, yChao, x1 - x0, yFim - yChao, rgb(cor))
  const r = sorteio(Math.round(x0 + yChao * 13))
  let linha = 0
  for (let y = yChao; y < yFim; y += 9) {
    const tom = Math.floor(r() * 7) - 3
    ret(c, x0, y, x1 - x0, 9, rgb(clarear(cor, tom)))
    ret(c, x0, y, x1 - x0, 1, rgb(clarear(cor, -12)))
    const offset = (linha * 37) % 70
    for (let x = x0 + offset; x < x1; x += 70 + Math.floor(r() * 30)) {
      ret(c, x, y, 1, 9, rgb(clarear(cor, -14)))
    }
    // Veio: traço fino e comprido
    const vx = x0 + Math.floor(r() * (x1 - x0))
    ret(c, vx, y + 4, 12 + Math.floor(r() * 20), 1, rgb(clarear(cor, -6)))
    linha++
  }
  ret(c, x0, yChao, x1 - x0, 2, 'rgba(0,0,0,0.35)')
}

export interface OpcoesPorta {
  aberta?: boolean
  /** Fresta de luz por baixo — há alguém do outro lado. */
  luz?: boolean
  cor?: RGB
  alt?: number
}

/** Porta com batente, almofadas, maçaneta e, se pedido, luz por baixo. */
export function porta(c: CanvasRenderingContext2D, x: number, chao: number, o: OpcoesPorta = {}): void {
  const larg = 30
  const alt = o.alt ?? 64
  const y = chao - alt
  const cor = o.cor ?? [36, 44, 62]
  ret(c, x - larg / 2 - 4, y - 4, larg + 8, alt + 4, rgb(clarear(cor, -18)))
  ret(c, x - larg / 2 - 4, y - 4, larg + 8, 2, rgb(clarear(cor, 8)))
  if (o.aberta) {
    ret(c, x - larg / 2, y, larg, alt, '#040509')
    return
  }
  ret(c, x - larg / 2, y, larg, alt, rgb(cor))
  // Duas almofadas
  ret(c, x - larg / 2 + 4, y + 5, larg - 8, alt * 0.38, rgb(clarear(cor, -7)))
  ret(c, x - larg / 2 + 4, y + 5 + alt * 0.45, larg - 8, alt * 0.44, rgb(clarear(cor, -7)))
  ret(c, x - larg / 2 + 4, y + 5, larg - 8, 1, rgb(clarear(cor, 9)))
  ret(c, x - larg / 2 + 4, y + 5 + alt * 0.45, larg - 8, 1, rgb(clarear(cor, 9)))
  // Maçaneta
  ret(c, x + larg / 2 - 7, y + alt * 0.52, 3, 3, '#b8964e')
  ret(c, x + larg / 2 - 7, y + alt * 0.52, 3, 1, '#e2c27a')
  if (o.luz) ret(c, x - larg / 2, chao - 2, larg, 2, 'rgba(236,196,132,0.34)')
}

export interface OpcoesQuadro {
  figuras: number
  /** Posições (0-base) vazias: alguém que foi recortado da foto. */
  vazios?: number[]
  moldura?: RGB
  /** Tom da foto. */
  foto?: RGB
}

/** Quem aparece nas fotos da família, na ordem em que eles sempre posam. */
const POSE: { roupa: RGB; cabelo: RGB; adulto: boolean; longo?: boolean; rabo?: boolean }[] = [
  { roupa: [70, 78, 104], cabelo: [34, 28, 26], adulto: true },
  { roupa: [70, 104, 112], cabelo: [44, 30, 26], adulto: true, longo: true },
  { roupa: [52, 60, 86], cabelo: [24, 24, 32], adulto: false },
  { roupa: [128, 58, 70], cabelo: [32, 22, 24], adulto: false, rabo: true },
]

/**
 * Retrato emoldurado: moldura com filete e passe-partout, a foto com fundo
 * de estúdio e chão, e a família posando — cada um com a sua roupa, o seu
 * cabelo e o rosto que a foto deixa ver. O vazio é o recorte exato de uma
 * pessoa, mais claro que o fundo. Por cima, o vidro.
 */
export function quadro(
  c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, o: OpcoesQuadro,
): void {
  const moldura = o.moldura ?? [74, 58, 50]
  const foto = o.foto ?? [22, 20, 26]
  // Moldura: madeira com luz em cima e à esquerda, sombra embaixo e à direita
  ret(c, x - 3, y - 3, w + 6, h + 6, rgb(clarear(moldura, -20)))
  ret(c, x - 2, y - 2, w + 4, h + 4, rgb(moldura))
  ret(c, x - 2, y - 2, w + 4, 1, rgb(clarear(moldura, 24)))
  ret(c, x - 2, y - 2, 1, h + 4, rgb(clarear(moldura, 14)))
  ret(c, x - 2, y + h + 1, w + 4, 1, rgb(clarear(moldura, -26)))
  ret(c, x + w + 1, y - 2, 1, h + 4, rgb(clarear(moldura, -18)))
  // Filete dourado e o passe-partout
  ret(c, x - 1, y - 1, w + 2, h + 2, 'rgba(176,146,92,0.55)')
  const pp = w >= 30 ? 2 : 1
  ret(c, x, y, w, h, rgb(clarear(foto, 40), 0.9))
  const fx0 = x + pp
  const fy0 = y + pp
  const fw = w - pp * 2
  const fh = h - pp * 2
  // Fundo de estúdio, mais claro no meio, e o chão
  const g = c.createLinearGradient(0, fy0, 0, fy0 + fh)
  g.addColorStop(0, rgb(clarear(foto, 18)))
  g.addColorStop(0.7, rgb(clarear(foto, 8)))
  g.addColorStop(1, rgb(foto))
  c.fillStyle = g
  c.fillRect(fx0, fy0, fw, fh)
  ret(c, fx0 + Math.round(fw * 0.25), fy0 + 1, Math.round(fw * 0.5), Math.round(fh * 0.5), rgb(clarear(foto, 26), 0.25))
  const chao = fy0 + fh - 2
  ret(c, fx0, chao, fw, 2, rgb(clarear(foto, -6)))

  const total = o.figuras + (o.vazios?.length ?? 0)
  const passo = fw / (total + 1)
  const escala = Math.min(1, (fh - 3) / 13)
  let fig = 0
  for (let i = 0; i < total; i++) {
    const px = Math.round(fx0 + passo * (i + 1))
    const quem = POSE[fig % POSE.length] ?? POSE[0]!
    const alt = Math.max(5, Math.round((quem.adulto ? 12 : 9) * escala))
    const topo = chao - alt
    if (o.vazios?.includes(i)) {
      // O vazio: o recorte exato de alguém, cabeça e ombros, mais claro.
      const recorte = rgb(clarear(foto, 34), 0.55)
      ret(c, px - 1, topo, 3, 3, recorte)
      ret(c, px - 2, topo + 3, 5, alt - 3, recorte)
      continue
    }
    pessoaNaFoto(c, px, topo, alt, quem, foto)
    fig++
  }
  // Vidro: um reflexo largo em diagonal e o brilho do canto
  ret(c, fx0, fy0, Math.max(2, Math.round(fw * 0.3)), 1, 'rgba(255,255,255,0.16)')
  for (let i = 0; i < Math.min(fh, 6); i++) ret(c, fx0 + fw - 8 + i, fy0 + i, 2, 1, 'rgba(255,255,255,0.06)')
}

/** Uma pessoa numa foto antiga: cores lavadas, cabeça, ombros, braços. */
function pessoaNaFoto(
  c: CanvasRenderingContext2D, px: number, topo: number, alt: number,
  quem: (typeof POSE)[number], foto: RGB,
): void {
  const lavar = (cor: RGB): string => rgb([
    Math.round(cor[0] * 0.7 + foto[0] * 0.3 + 18),
    Math.round(cor[1] * 0.7 + foto[1] * 0.3 + 14),
    Math.round(cor[2] * 0.7 + foto[2] * 0.3 + 10),
  ], 0.9)
  const pele: RGB = [176, 142, 120]
  const larg = quem.adulto ? 5 : 4
  const cab = quem.adulto ? 3 : 3
  // Corpo e braços
  ret(c, px - Math.floor(larg / 2), topo + cab, larg, alt - cab, lavar(quem.roupa))
  ret(c, px - Math.floor(larg / 2), topo + cab, larg, 1, lavar(clarear(quem.roupa, 14)))
  ret(c, px + Math.ceil(larg / 2) - 1, topo + cab + 1, 1, alt - cab - 1, lavar(clarear(quem.roupa, -14)))
  // Calça e pés
  if (alt >= 8) ret(c, px - Math.floor(larg / 2), topo + alt - 3, larg, 3, lavar([40, 40, 48]))
  // Cabeça, com o cabelo por cima
  ret(c, px - 1, topo, 3, cab, lavar(pele))
  ret(c, px - 1, topo, 3, 1, lavar(quem.cabelo))
  if (quem.longo) {
    ret(c, px - 2, topo, 1, cab + 2, lavar(quem.cabelo))
    ret(c, px + 2, topo, 1, cab + 2, lavar(quem.cabelo))
  }
  if (quem.rabo) ret(c, px + 2, topo, 1, 2, lavar(quem.cabelo))
  // Os olhos, quando a foto é grande o bastante para eles
  if (alt >= 10) {
    ret(c, px - 1, topo + 1, 1, 1, 'rgba(30,26,30,0.6)')
    ret(c, px + 1, topo + 1, 1, 1, 'rgba(30,26,30,0.6)')
  }
}

/**
 * As duas paredes laterais do cômodo, vistas de quina. Sem elas o cenário
 * parecia uma faixa infinita — e Liam andava para fora da casa sem nada
 * dizer que ali acabava.
 */
export function cantos(
  c: CanvasRenderingContext2D, largura: number, yChao: number, yFim: number, cor: RGB,
): void {
  const fundo = 12
  for (const lado of [0, 1]) {
    const x = lado === 0 ? 0 : largura - fundo
    const g = c.createLinearGradient(x, 0, x + fundo, 0)
    const escuro = rgb(clarear(cor, -22))
    const claro = rgb(clarear(cor, 2))
    g.addColorStop(0, lado === 0 ? escuro : claro)
    g.addColorStop(1, lado === 0 ? claro : escuro)
    c.fillStyle = g
    c.fillRect(x, 0, fundo, yChao)
    // Quina: uma linha de luz onde as duas paredes se encontram
    ret(c, lado === 0 ? fundo : largura - fundo - 1, 0, 1, yChao, rgb(clarear(cor, 18), 0.6))
    // Rodapé da parede lateral, descendo em diagonal até a frente
    c.fillStyle = rgb(clarear(cor, -20))
    c.beginPath()
    if (lado === 0) {
      c.moveTo(0, yChao - 4)
      c.lineTo(fundo, yChao - 4)
      c.lineTo(fundo, yChao)
      c.lineTo(0, yFim)
    } else {
      c.moveTo(largura, yChao - 4)
      c.lineTo(largura - fundo, yChao - 4)
      c.lineTo(largura - fundo, yChao)
      c.lineTo(largura, yFim)
    }
    c.closePath()
    c.fill()
  }
  // Sombra que a parede joga no chão
  const s0 = c.createLinearGradient(0, 0, 26, 0)
  s0.addColorStop(0, 'rgba(0,0,0,0.5)')
  s0.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = s0
  c.fillRect(0, yChao, 26, yFim - yChao)
  const s1 = c.createLinearGradient(largura, 0, largura - 26, 0)
  s1.addColorStop(0, 'rgba(0,0,0,0.5)')
  s1.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = s1
  c.fillRect(largura - 26, yChao, 26, yFim - yChao)
}
