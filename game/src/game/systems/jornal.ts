import type { Bloco, Pagina } from './leitor'
import { FONT_BODY, FONT_TITLE, FONT_FIM } from './dialogue'

/**
 * A Folha do Vale, diagramada como jornal de verdade.
 *
 * O texto vem dos mesmos blocos de qualquer documento; aqui eles viram
 * jornal: o nome no alto entre filetes, a linha da data, a manchete em
 * corpo grande, o texto em colunas com fio entre elas, fotos em retícula com
 * legenda, a tarja preta de cada caderno, o índice e a previsão do tempo.
 * Papel de jornal: cinza-amarelado, pontilhado, com a dobra no meio.
 *
 * Como os blocos viram jornal:
 *   manchete   → o nome do jornal (só na capa)
 *   data       → a linha da data, cortada nos ' · '
 *   titulo     → abre uma matéria (na página com `secao`, o primeiro é a tarja)
 *   impresso   → parágrafo da matéria (nos classificados, um anúncio)
 *   foto       → foto em retícula, com a legenda embaixo
 *   caixa      → vai para a coluna lateral, num quadro
 *   pequeno    → índice (capa) ou intertítulo (dentro)
 *   letra de alguém da casa → anotação à mão, por cima do impresso
 */

export type TipoFoto = 'chuva' | 'fabrica' | 'tirinha'

const TINTA = '#17171a'
const TINTA_CLARA = '#4a4a50'
const FIO = 'rgba(20,20,24,0.55)'

/** As letras de mão que aparecem no jornal. */
const MAO: Record<string, { fonte: (s: number) => string; cor: string }> = {
  evelyn: { fonte: (s) => `italic 500 ${s}px ${FONT_BODY}`, cor: '#2c3a6a' },
  lia: { fonte: (s) => `600 ${s}px ${FONT_FIM}`, cor: '#9a2a2a' },
  liam: { fonte: (s) => `italic 600 ${s}px ${FONT_FIM}`, cor: '#26305a' },
  elisa: { fonte: (s) => `italic 500 ${s}px ${FONT_FIM}`, cor: 'rgba(84,62,120,0.9)' },
}

const IMPRESSAS = new Set(['impresso', 'titulo', 'manchete', 'data', 'pequeno', undefined])

interface Materia {
  titulo: string
  corpo: Bloco[]
  foto?: Bloco
  notas: Bloco[]
}

/** Agrupa os blocos da página em matérias, quadros, índice e anotações. */
function montar(pag: Pagina): {
  nome?: string; data?: string; materias: Materia[]; caixas: Bloco[]; indice: Bloco[]; notas: Bloco[]
} {
  const materias: Materia[] = []
  const caixas: Bloco[] = []
  const indice: Bloco[] = []
  const notas: Bloco[] = []
  let nome: string | undefined
  let data: string | undefined
  let atual: Materia | null = null
  for (const b of pag.blocos) {
    if (b.letra === 'manchete') nome = b.texto
    else if (b.letra === 'data') data = b.texto
    else if (b.caixa) caixas.push(b)
    else if (b.letra === 'titulo') {
      atual = { titulo: b.texto, corpo: [], notas: [] }
      materias.push(atual)
    } else if (b.foto === 'tirinha') {
      caixas.push(b)
    } else if (b.foto) {
      if (atual) atual.foto = b
    } else if (!IMPRESSAS.has(b.letra)) {
      if (atual) atual.notas.push(b)
      else notas.push(b)
    } else if (b.letra === 'pequeno' && !pag.secao) indice.push(b)
    else if (atual) atual.corpo.push(b)
  }
  return { nome, data, materias, caixas, indice, notas }
}

export function quebrarLinhas(c: CanvasRenderingContext2D, texto: string, largura: number): string[] {
  const linhas: string[] = []
  let atual = ''
  for (const p of texto.split(' ')) {
    const tentativa = atual ? `${atual} ${p}` : p
    if (c.measureText(tentativa).width > largura && atual) {
      linhas.push(atual)
      atual = p
    } else atual = tentativa
  }
  if (atual) linhas.push(atual)
  return linhas
}

/** Texto justificado, como no jornal (a última linha do parágrafo, não). */
function linhaJustificada(c: CanvasRenderingContext2D, linha: string, x: number, y: number, largura: number, ultima: boolean): void {
  const palavras = linha.split(' ')
  if (ultima || palavras.length < 2) {
    c.fillText(linha, x, y)
    return
  }
  const soma = palavras.reduce((a, p) => a + c.measureText(p).width, 0)
  const vao = (largura - soma) / (palavras.length - 1)
  if (vao > largura * 0.12) {
    c.fillText(linha, x, y)
    return
  }
  let px = x
  for (const p of palavras) {
    c.fillText(p, px, y)
    px += c.measureText(p).width + vao
  }
}

interface Peca {
  alt: number
  desenhar: (x: number, y: number) => void
}

/**
 * Corre peças (linhas de texto, fotos) por N colunas, equilibrando a altura.
 * Devolve onde termina a coluna mais funda.
 */
function colunas(c: CanvasRenderingContext2D, pecas: Peca[], x: number, y: number, w: number, n: number, vao: number): number {
  const lc = (w - vao * (n - 1)) / n
  const total = pecas.reduce((a, p) => a + p.alt, 0)
  const meta = total / n
  let col = 0
  let cy = y
  let fundo = y
  for (const p of pecas) {
    if (cy - y + p.alt > meta + 1 && cy > y && col < n - 1) {
      col++
      cy = y
    }
    p.desenhar(x + col * (lc + vao), cy)
    cy += p.alt
    fundo = Math.max(fundo, cy)
  }
  // Fio vertical entre as colunas
  c.fillStyle = FIO
  for (let i = 1; i < n; i++) c.fillRect(x + i * (lc + vao) - vao / 2, y, 1, fundo - y)
  return fundo
}

/** Linhas de um parágrafo como peças, já quebradas na largura da coluna. */
function pecasDeTexto(c: CanvasRenderingContext2D, texto: string, lc: number, tam: number, opcoes: { negrito?: boolean } = {}): Peca[] {
  const fonte = `${opcoes.negrito ? 600 : 400} ${tam}px ${FONT_BODY}`
  c.font = fonte
  const linhas = quebrarLinhas(c, texto, lc)
  const alt = tam * 1.22
  return linhas.map((l, i) => ({
    alt: i === linhas.length - 1 ? alt + tam * 0.35 : alt,
    desenhar: (x: number, y: number) => {
      c.font = fonte
      c.fillStyle = TINTA
      c.textAlign = 'left'
      linhaJustificada(c, l, x, y + tam, lc, i === linhas.length - 1)
    },
  }))
}

/** Desenha a grade das cruzadas em (x, y), com a largura dada; devolve o fim. */
export type DesenharGrade = (x: number, y: number, w: number) => number

/** Desenha a página do jornal. Devolve onde o conteúdo terminou. */
export function desenharJornal(
  c: CanvasRenderingContext2D, pag: Pagina, numero: number, x: number, y: number, w: number, h: number,
  grade?: DesenharGrade,
): number {
  c.save()
  papelDeJornal(c, x, y, w, h)
  const m = w * 0.055
  const x0 = x + m
  const largura = w - m * 2
  // Dentro, menos coisa por página: a letra pode ser maior.
  const base = pag.secao ? w / 34 : w / 42
  const p = montar(pag)
  let ty = y + m * 0.9

  if (p.nome) ty = cabecalho(c, p.nome, p.data ?? '', x0, ty, largura, base)
  else ty = cabecalhoInterno(c, pag.secao ?? '', numero, x0, ty, largura, base)

  if (pag.secao === 'CLASSIFICADOS') ty = classificados(c, pag, p.caixas, x0, ty, largura, base)
  else if (pag.secao) ty = passatempos(c, pag, p.materias, p.caixas, x0, ty, largura, base, grade)
  else ty = capa(c, p.materias, p.caixas, p.indice, x0, ty, largura, base, y + h - m)

  // Anotações soltas da página (fora de uma matéria): à mão, no pé da folha.
  let ny = Math.max(ty + base * 1.2, y + h - m - base * 2.6 * p.notas.length)
  for (const nota of p.notas) {
    anotacao(c, nota, x0 + largura * 0.08, ny, largura * 0.84, base * 1.45, -0.035)
    ny += base * 2.4
  }
  c.restore()
  return ty
}

function papelDeJornal(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  // O papel de jornal, um pouco mais escuro nas bordas e na dobra.
  const g = c.createLinearGradient(x, y, x + w, y)
  g.addColorStop(0, 'rgba(120,100,60,0.10)')
  g.addColorStop(0.08, 'rgba(0,0,0,0)')
  g.addColorStop(0.47, 'rgba(0,0,0,0)')
  g.addColorStop(0.5, 'rgba(60,50,30,0.10)')
  g.addColorStop(0.53, 'rgba(0,0,0,0)')
  g.addColorStop(0.92, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(120,100,60,0.12)')
  c.fillStyle = g
  c.fillRect(x, y, w, h)
  c.fillStyle = 'rgba(255,255,255,0.22)'
  c.fillRect(x + w / 2 + 1, y, 1, h)
  // Pontinhos de fibra
  let s = 7
  const r = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  for (let i = 0; i < 260; i++) {
    c.fillStyle = r() < 0.5 ? 'rgba(60,50,30,0.10)' : 'rgba(255,255,255,0.18)'
    c.fillRect(x + r() * w, y + r() * h, 1, 1)
  }
}

/** O nome do jornal entre filetes, com a linha da data embaixo. */
function cabecalho(c: CanvasRenderingContext2D, nome: string, data: string, x: number, y: number, w: number, base: number): number {
  const partes = data.split(' · ')
  c.textAlign = 'left'
  c.font = `500 ${base * 0.62}px ${FONT_BODY}`
  c.fillStyle = TINTA_CLARA
  c.letterSpacing = '0.12em'
  c.fillText('O JORNAL DO VALE DESDE 1928', x, y + base * 0.7)
  c.textAlign = 'right'
  c.fillText('EDIÇÃO DA MANHÃ', x + w, y + base * 0.7)
  c.letterSpacing = '0em'
  let ty = y + base * 1.1
  c.fillStyle = TINTA
  c.fillRect(x, ty, w, 2)
  ty += base * 0.35
  // O nome: corpo grande, condensado o bastante para caber na largura.
  let tam = base * 3.4
  c.font = `700 ${tam}px ${FONT_TITLE}`
  while (c.measureText(nome).width > w * 0.96 && tam > base) {
    tam *= 0.95
    c.font = `700 ${tam}px ${FONT_TITLE}`
  }
  c.textAlign = 'center'
  c.fillText(nome, x + w / 2, ty + tam * 0.86)
  ty += tam * 1.02
  c.fillRect(x, ty, w, 2)
  c.fillRect(x, ty + 3, w, 1)
  ty += base * 0.3
  // Linha da data: dia à esquerda, edição no meio, preço à direita.
  c.font = `italic 400 ${base * 0.72}px ${FONT_BODY}`
  c.fillStyle = TINTA
  const yy = ty + base * 0.85
  c.textAlign = 'left'
  c.fillText(partes[0] ?? '', x, yy)
  c.textAlign = 'center'
  c.fillText(partes.slice(1, -1).join('  ·  '), x + w / 2, yy)
  c.textAlign = 'right'
  c.fillText(partes.length > 1 ? (partes[partes.length - 1] ?? '') : '', x + w, yy)
  ty += base * 1.25
  c.fillRect(x, ty, w, 1)
  c.textAlign = 'left'
  return ty + base * 0.6
}

/** Nas páginas de dentro: a linha do jornal em cima e a tarja do caderno. */
function cabecalhoInterno(c: CanvasRenderingContext2D, secao: string, numero: number, x: number, y: number, w: number, base: number): number {
  c.font = `500 ${base * 0.66}px ${FONT_BODY}`
  c.fillStyle = TINTA_CLARA
  c.letterSpacing = '0.1em'
  c.textAlign = 'left'
  c.fillText(`${numero + 1}  ·  FOLHA DO VALE`, x, y + base * 0.75)
  c.textAlign = 'right'
  c.fillText('TERÇA-FEIRA, 14 DE OUTUBRO', x + w, y + base * 0.75)
  c.letterSpacing = '0em'
  let ty = y + base * 1.15
  c.fillStyle = TINTA
  c.fillRect(x, ty, w, 1)
  ty += base * 0.45
  // A tarja preta com o nome do caderno
  const alt = base * 1.75
  c.fillRect(x, ty, w, alt)
  c.fillStyle = '#ece6d6'
  c.font = `700 ${base * 1.15}px ${FONT_TITLE}`
  c.letterSpacing = '0.22em'
  c.textAlign = 'left'
  c.fillText(secao, x + base * 0.6, ty + alt * 0.74)
  c.letterSpacing = '0em'
  return ty + alt + base * 0.7
}

/** A capa: a manchete com foto, a segunda matéria, e a coluna do lado. */
function capa(
  c: CanvasRenderingContext2D, materias: Materia[], caixas: Bloco[], indice: Bloco[],
  x: number, y: number, w: number, base: number, fim: number,
): number {
  let ty = y
  const tam = base * 0.92
  const [lead, ...resto] = materias
  if (lead) {
    // Manchete: o corpo maior da página, à esquerda, em duas linhas no máximo.
    let mt = base * 2.15
    c.font = `700 ${mt}px ${FONT_TITLE}`
    while (quebrarLinhas(c, lead.titulo, w).length > 2 && mt > base) {
      mt *= 0.93
      c.font = `700 ${mt}px ${FONT_TITLE}`
    }
    c.fillStyle = TINTA
    c.textAlign = 'left'
    for (const l of quebrarLinhas(c, lead.titulo, w)) {
      c.fillText(l, x, ty + mt * 0.9)
      ty += mt * 1.05
    }
    ty += base * 0.35
    const vao = base * 0.9
    const lc = (w - vao * 2) / 3
    const foto = lead.foto?.foto ? pecaFoto(c, lead.foto, lc * 2 + vao, base, true) : []
    const texto: Peca[] = []
    for (const [i, b] of lead.corpo.entries()) texto.push(...pecasDeTexto(c, b.texto, lc, tam, { negrito: i === 0 }))
    ty = foto.length ? colunasComFotoLarga(c, foto, texto, x, ty, w, vao) : colunas(c, texto, x, ty, w, 3, vao)
    for (const nota of lead.notas) {
      anotacao(c, nota, x + w * 0.45, ty, w * 0.5, base * 1.3, -0.04)
      ty += base * 1.8
    }
    ty += base * 0.5
  }
  c.fillStyle = TINTA
  c.fillRect(x, ty, w, 1)
  ty += base * 0.7

  // Embaixo: a segunda matéria (2/3) e a coluna lateral (1/3).
  const lateral = w * 0.31
  const principal = w - lateral - base
  const topo = ty
  let yEsq = ty
  for (const mat of resto) {
    c.font = `700 ${base * 1.3}px ${FONT_TITLE}`
    c.fillStyle = TINTA
    for (const l of quebrarLinhas(c, mat.titulo, principal)) {
      c.fillText(l, x, yEsq + base * 1.2)
      yEsq += base * 1.4
    }
    yEsq += base * 0.3
    const pecas: Peca[] = []
    const lc = (principal - base * 0.8) / 2
    if (mat.foto?.foto) pecas.push(...pecaFoto(c, mat.foto, lc, base, false))
    for (const b of mat.corpo) pecas.push(...pecasDeTexto(c, b.texto, lc, tam))
    yEsq = colunas(c, pecas, x, yEsq, principal, 2, base * 0.8) + base * 0.6
    for (const nota of mat.notas) {
      anotacao(c, nota, x, yEsq, principal, base * 1.3, -0.03)
      yEsq += base * 1.8
    }
  }
  // Fio entre a matéria e a coluna lateral
  const xl = x + principal + base / 2
  c.fillStyle = FIO
  c.fillRect(xl, topo, 1, Math.max(yEsq, fim - base * 2.5) - topo)

  let yDir = topo
  const xd = xl + base / 2
  for (const b of caixas) yDir = quadro(c, b, xd, yDir, lateral, base) + base * 0.6
  if (indice.length) {
    yDir = Math.max(yDir, fim - base * (1.6 + indice.length * 1.2) - base * 2)
    c.fillStyle = TINTA
    c.fillRect(xd, yDir, lateral, base * 1.25)
    c.fillStyle = '#ece6d6'
    c.font = `700 ${base * 0.7}px ${FONT_BODY}`
    c.letterSpacing = '0.16em'
    c.fillText('NESTA EDIÇÃO', xd + base * 0.4, yDir + base * 0.9)
    c.letterSpacing = '0em'
    yDir += base * 1.7
    c.fillStyle = TINTA
    c.font = `400 ${base * 0.78}px ${FONT_BODY}`
    for (const b of indice) {
      for (const parte of b.texto.split(' · ')) {
        const [nome, pagina] = parte.split(', ')
        c.textAlign = 'left'
        c.fillText(nome ?? parte, xd, yDir + base * 0.8)
        c.textAlign = 'right'
        c.fillText(pagina ?? '', xd + lateral, yDir + base * 0.8)
        c.fillStyle = 'rgba(20,20,24,0.3)'
        c.fillRect(xd, yDir + base * 1.05, lateral, 1)
        c.fillStyle = TINTA
        yDir += base * 1.25
      }
    }
    c.textAlign = 'left'
  }
  return Math.max(yEsq, yDir)
}

/**
 * Três colunas em que a foto da manchete ocupa as duas últimas de largura:
 * o texto começa no alto da primeira e continua embaixo da foto, na segunda
 * e na terceira. As três acabam na mesma altura.
 */
function colunasComFotoLarga(c: CanvasRenderingContext2D, foto: Peca[], texto: Peca[], x: number, y: number, w: number, vao: number): number {
  const lc = (w - vao * 2) / 3
  let fy = y
  for (const p of foto) {
    p.desenhar(x + lc + vao, fy)
    fy += p.alt
  }
  const altFoto = fy - y
  const total = texto.reduce((a, p) => a + p.alt, 0)
  const meta = (total + altFoto * 2) / 3
  const topos = [y, fy, fy]
  let col = 0
  let cy = topos[0] ?? fy
  let fundo = fy
  for (const p of texto) {
    if (cy - y + p.alt > meta + 1 && col < 2) {
      col++
      cy = topos[col] ?? y
    }
    p.desenhar(x + col * (lc + vao), cy)
    cy += p.alt
    fundo = Math.max(fundo, cy)
  }
  c.fillStyle = FIO
  c.fillRect(x + (lc + vao) - vao / 2, y, 1, fundo - y)
  c.fillRect(x + 2 * (lc + vao) - vao / 2, fy, 1, fundo - fy)
  return fundo
}

/** A foto em retícula, com a legenda em itálico embaixo. */
function pecaFoto(c: CanvasRenderingContext2D, b: Bloco, largura: number, base: number, larga: boolean): Peca[] {
  const altFoto = largura * (larga ? 0.5 : 0.62)
  const tamLeg = base * 0.7
  c.font = `italic 400 ${tamLeg}px ${FONT_BODY}`
  const linhas = b.legenda ? quebrarLinhas(c, b.legenda, largura) : []
  const pecaImg: Peca = {
    alt: altFoto + base * 0.3,
    desenhar: (x, y) => reticula(c, b.foto as TipoFoto, x, y, largura, altFoto),
  }
  const pecaLeg: Peca = {
    alt: linhas.length * tamLeg * 1.2 + base * 0.6,
    desenhar: (x, y) => {
      c.font = `italic 400 ${tamLeg}px ${FONT_BODY}`
      c.fillStyle = TINTA_CLARA
      c.textAlign = 'left'
      linhas.forEach((l, i) => c.fillText(l, x, y + tamLeg * (1 + i * 1.2)))
    },
  }
  return [pecaImg, pecaLeg]
}

/** Quadro da coluna lateral: título em versalete, texto, fio em volta. */
function quadro(c: CanvasRenderingContext2D, b: Bloco, x: number, y: number, w: number, base: number): number {
  const [titulo, ...resto] = b.texto.split(': ')
  const corpo = resto.join(': ')
  const pad = base * 0.5
  c.font = `400 ${base * 0.8}px ${FONT_BODY}`
  const linhas = quebrarLinhas(c, corpo, w - pad * 2)
  const alt = base * 1.6 + linhas.length * base * 0.98 + pad
  c.strokeStyle = TINTA
  c.lineWidth = 1
  c.strokeRect(x + 0.5, y + 0.5, w - 1, alt)
  c.fillStyle = TINTA
  c.font = `700 ${base * 0.78}px ${FONT_BODY}`
  c.letterSpacing = '0.14em'
  c.textAlign = 'left'
  c.fillText((titulo ?? '').toUpperCase(), x + pad, y + base * 1.1)
  c.letterSpacing = '0em'
  c.fillRect(x + pad, y + base * 1.35, w - pad * 2, 1)
  c.font = `400 ${base * 0.8}px ${FONT_BODY}`
  linhas.forEach((l, i) => c.fillText(l, x + pad, y + base * (2.2 + i * 0.98)))
  return y + alt
}

/** Classificados: anúncios em três colunas, a primeira palavra em negrito. */
function classificados(c: CanvasRenderingContext2D, pag: Pagina, caixas: Bloco[], x: number, y: number, w: number, base: number): number {
  const n = 3
  const vao = base * 0.8
  const lc = (w - vao * (n - 1)) / n
  const tam = base * 0.86
  const pecas: Peca[] = []
  const notas: Bloco[] = []
  let circulo: { x: number; y: number; w: number; h: number } | null = null
  for (const b of pag.blocos) {
    if (b.letra === 'titulo' || b.caixa) continue
    if (!IMPRESSAS.has(b.letra)) {
      notas.push(b)
      continue
    }
    const [chave, ...resto] = b.texto.split(' ')
    c.font = `400 ${tam}px ${FONT_BODY}`
    const corpo = resto.join(' ')
    const prefixo = `${chave} `
    c.font = `700 ${tam}px ${FONT_BODY}`
    const wChave = c.measureText(prefixo).width
    c.font = `400 ${tam}px ${FONT_BODY}`
    // A primeira linha começa depois da palavra em negrito.
    const linhas: string[] = []
    let atual = ''
    let limite = lc - wChave
    for (const p of corpo.split(' ')) {
      const t = atual ? `${atual} ${p}` : p
      if (c.measureText(t).width > limite && atual) {
        linhas.push(atual)
        atual = p
        limite = lc
      } else atual = t
    }
    if (atual) linhas.push(atual)
    const alt = linhas.length * tam * 1.2 + base * 0.95
    const circulado = !!b.circulado
    pecas.push({
      alt,
      desenhar: (px, py) => {
        c.textAlign = 'left'
        c.fillStyle = TINTA
        c.font = `700 ${tam}px ${FONT_BODY}`
        c.fillText(chave ?? '', px, py + tam)
        c.font = `400 ${tam}px ${FONT_BODY}`
        linhas.forEach((l, i) => c.fillText(l, px + (i === 0 ? wChave : 0), py + tam * (1 + i * 1.2)))
        c.fillStyle = 'rgba(20,20,24,0.35)'
        c.fillRect(px, py + alt - base * 0.45, lc, 1)
        if (circulado) circulo = { x: px, y: py, w: lc, h: alt - base * 0.45 }
      },
    })
  }
  const fundo = colunas(c, pecas, x, y, w, n, vao)
  const circ = circulo as { x: number; y: number; w: number; h: number } | null
  if (circ) {
    // A caneta que circulou: duas voltas, a segunda passando da primeira.
    c.strokeStyle = 'rgba(176,36,36,0.8)'
    c.lineWidth = Math.max(1.6, base * 0.14)
    c.beginPath()
    c.ellipse(circ.x + circ.w / 2, circ.y + circ.h / 2, circ.w / 2 + base * 0.5, circ.h / 2 + base * 0.6, -0.04, 0.2, Math.PI * 2.15)
    c.stroke()
  }
  let ny = fundo + base * 0.8
  if (caixas.length) ny = quadrosLargos(c, caixas, x, ny, w, base) + base * 0.6
  for (const nota of notas) {
    anotacao(c, nota, x + w * 0.1, ny, w * 0.8, base * 1.45, -0.04)
    ny += base * 2.4
  }
  return ny
}

/** Anúncios e avisos em quadro, dois por linha, com o título grande. */
function quadrosLargos(c: CanvasRenderingContext2D, todas: Bloco[], x: number, y: number, w: number, base: number): number {
  const vao = base * 0.8
  const lq = (w - vao) / 2
  let ty = y
  const caixas = todas.filter((b) => b.foto !== 'tirinha')
  for (const b of todas.filter((t) => t.foto === 'tirinha')) ty = tirinha(c, b, x, ty, w, base) + vao
  for (let i = 0; i < caixas.length; i += 2) {
    const par = caixas.slice(i, i + 2)
    const alturas = par.map((b) => medirQuadroLargo(c, b, lq, base))
    const alt = Math.max(...alturas)
    par.forEach((b, j) => desenharQuadroLargo(c, b, x + j * (lq + vao), ty, lq, alt, base))
    ty += alt + vao
  }
  return ty
}

/**
 * A tirinha: três quadros da mesma casa à noite. Quatro janelas acesas, depois
 * três, depois uma. Sem fala nenhuma. Embaixo, o título e o nome de quem fez.
 */
function tirinha(c: CanvasRenderingContext2D, b: Bloco, x: number, y: number, w: number, base: number): number {
  c.font = `700 ${base * 0.95}px ${FONT_TITLE}`
  c.fillStyle = TINTA
  c.textAlign = 'left'
  c.fillText(b.texto, x, y + base * 0.9)
  const ty = y + base * 1.4
  const vao = base * 0.6
  const lq = (w - vao * 2) / 3
  const alt = lq * 0.72
  const acesas = [4, 3, 1]
  for (let i = 0; i < 3; i++) {
    const qx = x + i * (lq + vao)
    c.fillStyle = '#e8e2d2'
    c.fillRect(qx, ty, lq, alt)
    c.strokeStyle = TINTA
    c.lineWidth = 1.5
    c.strokeRect(qx + 0.5, ty + 0.5, lq - 1, alt - 1)
    // Céu hachurado, lua, chão
    c.strokeStyle = 'rgba(20,20,24,0.35)'
    c.lineWidth = 1
    for (let k = 0; k < lq + alt; k += 4) {
      c.beginPath()
      c.moveTo(qx + Math.max(0, k - alt), ty + Math.min(alt, k))
      c.lineTo(qx + Math.min(lq, k), ty + Math.max(0, k - lq))
      c.stroke()
    }
    c.fillStyle = '#e8e2d2'
    c.beginPath()
    c.arc(qx + lq * 0.82, ty + alt * 0.2, alt * 0.09, 0, Math.PI * 2)
    c.fill()
    // A casa: paredes, telhado, a porta
    const cx = qx + lq * 0.2
    const cw = lq * 0.6
    const cy = ty + alt * 0.42
    const ch = alt * 0.5
    c.fillStyle = '#e8e2d2'
    c.fillRect(cx, cy, cw, ch)
    c.strokeStyle = TINTA
    c.lineWidth = 1.5
    c.strokeRect(cx, cy, cw, ch)
    c.beginPath()
    c.moveTo(cx - cw * 0.08, cy)
    c.lineTo(cx + cw / 2, cy - alt * 0.24)
    c.lineTo(cx + cw * 1.08, cy)
    c.closePath()
    c.fillStyle = TINTA
    c.fill()
    c.fillRect(cx + cw * 0.44, cy + ch * 0.55, cw * 0.12, ch * 0.45)
    const janelas = [[0.12, 0.18], [0.66, 0.18], [0.12, 0.6], [0.66, 0.6]]
    janelas.forEach(([jx, jy], k) => {
      const acesa = k < (acesas[i] ?? 0)
      c.fillStyle = acesa ? '#f4eedc' : TINTA
      c.fillRect(cx + cw * (jx ?? 0), cy + ch * (jy ?? 0), cw * 0.22, ch * 0.26)
      c.strokeStyle = TINTA
      c.lineWidth = 1
      c.strokeRect(cx + cw * (jx ?? 0), cy + ch * (jy ?? 0), cw * 0.22, ch * 0.26)
    })
    c.fillStyle = TINTA
    c.fillRect(qx, ty + alt * 0.92, lq, alt * 0.08)
  }
  c.font = `italic 400 ${base * 0.7}px ${FONT_BODY}`
  c.fillStyle = TINTA_CLARA
  c.textAlign = 'right'
  c.fillText(b.legenda ?? '', x + w, ty + alt + base * 0.9)
  c.textAlign = 'left'
  return ty + alt + base * 1.2
}

function partesQuadro(b: Bloco): [string, string] {
  const [titulo, ...resto] = b.texto.split(': ')
  return [titulo ?? '', resto.join(': ')]
}

function medirQuadroLargo(c: CanvasRenderingContext2D, b: Bloco, w: number, base: number): number {
  const [titulo, corpo] = partesQuadro(b)
  c.font = `700 ${base * 1.25}px ${FONT_TITLE}`
  const lt = quebrarLinhas(c, titulo, w - base * 1.6).length
  c.font = `400 ${base * 0.86}px ${FONT_BODY}`
  const lc = quebrarLinhas(c, corpo, w - base * 1.6).length
  return base * 1.2 + lt * base * 1.4 + lc * base * 1.08 + base * 0.8
}

function desenharQuadroLargo(c: CanvasRenderingContext2D, b: Bloco, x: number, y: number, w: number, alt: number, base: number): void {
  const [titulo, corpo] = partesQuadro(b)
  const pad = base * 0.8
  c.strokeStyle = TINTA
  c.lineWidth = 2
  c.strokeRect(x + 1, y + 1, w - 2, alt - 2)
  c.lineWidth = 1
  c.strokeRect(x + 4.5, y + 4.5, w - 9, alt - 9)
  c.fillStyle = TINTA
  c.textAlign = 'center'
  c.font = `700 ${base * 1.25}px ${FONT_TITLE}`
  let ty = y + base * 1.2
  for (const l of quebrarLinhas(c, titulo, w - pad * 2)) {
    c.fillText(l, x + w / 2, ty + base * 0.9)
    ty += base * 1.4
  }
  c.font = `400 ${base * 0.86}px ${FONT_BODY}`
  for (const l of quebrarLinhas(c, corpo, w - pad * 2)) {
    c.fillText(l, x + w / 2, ty + base * 0.8)
    ty += base * 1.08
  }
  c.textAlign = 'left'
}

/**
 * Passatempos: o título da seção é a tarja; o resto (cruzadas, pistas,
 * horóscopo) entra embaixo. As cruzadas o leitor desenha à parte.
 */
function passatempos(
  c: CanvasRenderingContext2D, pag: Pagina, materias: Materia[], caixas: Bloco[],
  x: number, y: number, w: number, base: number, grade?: DesenharGrade,
): number {
  let ty = y
  const tam = base * 0.95
  for (const mat of materias) {
    c.font = `700 ${base * 1.25}px ${FONT_TITLE}`
    c.fillStyle = TINTA
    c.textAlign = 'left'
    c.fillText(mat.titulo, x, ty + base * 1.1)
    ty += base * 1.6
    c.fillRect(x, ty, w * 0.3, 2)
    ty += base * 0.5
    if (pag.cruzadas && grade && mat === materias[0]) ty = grade(x + w * 0.12, ty + base * 0.4, w * 0.76) + base * 0.4
    const pecas: Peca[] = []
    const lc = (w - base) / 2
    for (const b of mat.corpo) {
      if (b.letra === 'pequeno') {
        pecas.push({
          alt: base * 1.5,
          desenhar: (px, py) => {
            c.font = `700 ${base * 0.78}px ${FONT_BODY}`
            c.letterSpacing = '0.16em'
            c.fillStyle = TINTA
            c.fillText(b.texto, px, py + base * 1.1)
            c.letterSpacing = '0em'
          },
        })
      } else pecas.push(...pecasDeTexto(c, b.texto, lc, tam))
    }
    ty = colunas(c, pecas, x, ty, w, 2, base) + base * 0.8
    for (const nota of mat.notas) {
      anotacao(c, nota, x + w * 0.12, ty, w * 0.8, base * 1.45, -0.035)
      ty += base * 2.6
    }
  }
  if (caixas.length) ty = quadrosLargos(c, caixas, x, ty + base * 0.4, w, base)
  return ty
}

/** Uma anotação à mão por cima do impresso, um pouco torta. */
function anotacao(c: CanvasRenderingContext2D, b: Bloco, x: number, y: number, w: number, tam: number, giro: number): void {
  const est = MAO[b.letra ?? ''] ?? MAO.liam
  if (!est) return
  c.save()
  c.translate(x, y)
  c.rotate(giro)
  c.font = est.fonte(tam)
  c.fillStyle = est.cor
  c.textAlign = 'left'
  quebrarLinhas(c, b.texto, w).forEach((l, i) => c.fillText(l, 0, tam * (1 + i * 1.15)))
  c.restore()
}

// --- Fotos em retícula ---------------------------------------------------------------

const cacheFoto = new Map<string, HTMLCanvasElement>()

/** Escuro (1) a claro (0) em cada ponto da foto, de 0 a 1 nos dois eixos. */
function cena(tipo: TipoFoto, u: number, v: number): number {
  if (tipo === 'chuva') {
    // Céu fechado, nuvens pesadas, telhados da parte baixa e a chuva riscando.
    let d = 0.55 - v * 0.25
    d += Math.sin(u * 9 + Math.sin(v * 5) * 2) * 0.08 + Math.sin(u * 23 + v * 7) * 0.05
    const telhado = 0.7 + Math.abs(((u * 7) % 1) - 0.5) * 0.12 + (Math.floor(u * 7) % 2) * 0.04
    if (v > telhado) d = 0.82 + (v > 0.86 ? 0.1 : 0)
    if (v > telhado && ((u * 31) % 1) < 0.12 && v < 0.84) d = 0.35
    const risco = ((u * 40 + v * 18) % 1)
    if (risco < 0.05 && v < telhado) d -= 0.22
    return Math.max(0, Math.min(1, d))
  }
  // A tecelagem em 1931: céu claro, o galpão de telhado serrilhado, a chaminé.
  let d = 0.12 + v * 0.1
  const chamine = u > 0.76 && u < 0.81 && v > 0.08
  const fumaca = v < 0.2 && Math.hypot((u - 0.82 - v * 0.4) * 2, v - 0.1) < 0.12
  const dente = 0.36 + Math.abs(((u * 8) % 1) - 0.5) * 0.14
  if (fumaca) d = 0.32
  if (v > dente && u > 0.05 && u < 0.95) {
    d = 0.68
    const jan = ((u * 16) % 1) > 0.35 && ((u * 16) % 1) < 0.75 && v > 0.52 && v < 0.7
    if (jan) d = 0.92
    if (v > 0.84) d = 0.5
  }
  if (chamine) d = 0.86
  if (v > 0.92) d = 0.4
  return Math.max(0, Math.min(1, d))
}

function reticula(c: CanvasRenderingContext2D, tipo: TipoFoto, x: number, y: number, w: number, h: number): void {
  const chave = `${tipo}:${Math.round(w)}x${Math.round(h)}`
  let tela = cacheFoto.get(chave)
  if (!tela) {
    tela = document.createElement('canvas')
    tela.width = Math.max(1, Math.round(w))
    tela.height = Math.max(1, Math.round(h))
    const t = tela.getContext('2d')
    if (t) {
      t.fillStyle = '#e4dfd0'
      t.fillRect(0, 0, tela.width, tela.height)
      const passo = Math.max(2.4, w / 70)
      t.fillStyle = '#18181c'
      for (let py = passo / 2, linha = 0; py < tela.height; py += passo, linha++) {
        for (let px = (linha % 2) * passo / 2; px < tela.width; px += passo) {
          const d = cena(tipo, px / tela.width, py / tela.height)
          const r = Math.sqrt(d) * passo * 0.62
          if (r < 0.3) continue
          t.beginPath()
          t.arc(px, py, r, 0, Math.PI * 2)
          t.fill()
        }
      }
    }
    cacheFoto.set(chave, tela)
  }
  c.drawImage(tela, x, y, w, h)
  c.strokeStyle = 'rgba(20,20,24,0.6)'
  c.lineWidth = 1
  c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
}
