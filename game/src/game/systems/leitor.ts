import type { Input } from '../../engine/input'
import { audio } from '../../engine/audio'
import { PAL } from '../../engine/constants'
import { FONT_BODY, FONT_TITLE, FONT_FIM } from './dialogue'

/**
 * Leitor de documentos: diários, cadernos, cartas, jornal, bilhetes.
 *
 * Cada documento é uma folha de papel desenhada por cima do jogo, com a letra
 * de quem escreveu — cada pessoa da família tem a sua, e é assim que o
 * jogador aprende a reconhecer quem esteve ali. Vira página com as setas, com
 * clique ou com E; Esc fecha.
 *
 * Duas coisas existem só para quem presta atenção: páginas que marcam um
 * segredo quando aparecem, e texto que só surge depois de alguns segundos
 * olhando uma página que parecia em branco.
 */

/** Quem escreveu. Cada letra tem fonte, tamanho e tinta próprios. */
export type Letra =
  | 'liam' | 'evelyn' | 'lia' | 'elisa' | 'adrian' | 'amelia' | 'catarina'
  | 'impresso' | 'titulo' | 'manchete' | 'data' | 'pequeno'
  /** Caneta vermelha de professora. */
  | 'professora'
  /** A letra da sombra: branca, por cima da tinta dos outros. */
  | 'sombra'
  /** Marca de caneta que atravessou a folha arrancada: quase não se lê. */
  | 'marca'

export interface Bloco {
  texto: string
  letra?: Letra
  alinhar?: 'esq' | 'centro' | 'dir'
  /** Riscado por cima, mas legível. */
  riscado?: boolean
  /** O risco é da sombra: branco, grosso, por cima da letra de Liam. */
  riscoBranco?: boolean
  /** Circulado a caneta — o anúncio que alguém marcou. */
  circulado?: boolean
  /** Espaço extra antes do bloco. */
  respiro?: number
}

export interface Pagina {
  blocos: Bloco[]
  /** Segredo marcado quando a página aparece. */
  segredo?: string
  /** Texto que só aparece depois de um tempo olhando a página. */
  paciencia?: { apos: number; blocos: Bloco[]; segredo?: string }
  mancha?: boolean
  rasgada?: boolean
  dobras?: boolean
  flor?: boolean
  /** Desenho a lápis de uma planta de casa com um cômodo a mais. */
  planta?: boolean
  /** Palavras cruzadas: '.' vazio, '_' casa em branco, MAIÚSCULA tinta, minúscula lápis. */
  cruzadas?: string[]
}

export type TipoDocumento = 'diario' | 'caderno' | 'carta' | 'jornal' | 'livro' | 'bilhete'

export interface Documento {
  id: string
  tipo: TipoDocumento
  titulo: string
  paginas: Pagina[]
}

interface EstiloLetra {
  fonte: (s: number) => string
  cor: string
  escala: number
  entre?: string
  /** Contorno escuro por baixo: branco em papel claro só se lê assim. */
  contorno?: string
}

const LETRAS: Record<Letra, EstiloLetra> = {
  liam: { fonte: (s) => `italic 500 ${s}px ${FONT_FIM}`, cor: '#26305a', escala: 1.28 },
  evelyn: { fonte: (s) => `italic 400 ${s}px ${FONT_BODY}`, cor: '#3a2a22', escala: 1.0 },
  lia: { fonte: (s) => `500 ${s}px ${FONT_FIM}`, cor: '#8e2a2a', escala: 1.24 },
  elisa: { fonte: (s) => `italic 400 ${s}px ${FONT_FIM}`, cor: 'rgba(84,62,120,0.85)', escala: 1.34, entre: '0.03em' },
  adrian: { fonte: (s) => `400 ${s}px ${FONT_TITLE}`, cor: '#141418', escala: 0.98 },
  amelia: { fonte: (s) => `italic 400 ${s}px ${FONT_FIM}`, cor: '#4a2e16', escala: 1.3 },
  catarina: { fonte: (s) => `italic 400 ${s}px ${FONT_BODY}`, cor: '#1e2a48', escala: 1.04 },
  professora: { fonte: (s) => `500 ${s}px ${FONT_BODY}`, cor: '#b02a2a', escala: 0.98 },
  sombra: { fonte: (s) => `italic 600 ${s}px ${FONT_FIM}`, cor: '#fbfbff', escala: 1.26, contorno: 'rgba(18,18,26,0.92)' },
  marca: { fonte: (s) => `italic 500 ${s}px ${FONT_FIM}`, cor: 'rgba(120,112,98,0.34)', escala: 1.4, contorno: 'rgba(255,252,240,0.5)' },
  impresso: { fonte: (s) => `400 ${s}px ${FONT_BODY}`, cor: '#1c1c20', escala: 0.92 },
  titulo: { fonte: (s) => `500 ${s}px ${FONT_TITLE}`, cor: '#141418', escala: 1.3 },
  manchete: { fonte: (s) => `500 ${s}px ${FONT_TITLE}`, cor: '#0e0e10', escala: 1.7, entre: '0.04em' },
  data: { fonte: (s) => `italic 400 ${s}px ${FONT_BODY}`, cor: '#6a5a48', escala: 0.86 },
  pequeno: { fonte: (s) => `400 ${s}px ${FONT_BODY}`, cor: '#4a4a52', escala: 0.78 },
}

const PAPEL: Record<TipoDocumento, { cor: string; borda: string; proporcao: number; escala: number }> = {
  diario: { cor: '#ebe4d0', borda: '#c8bca0', proporcao: 0.72, escala: 1 },
  caderno: { cor: '#d8c8a2', borda: '#9a8458', proporcao: 0.72, escala: 1 },
  carta: { cor: '#f1eee6', borda: '#cfcabe', proporcao: 0.72, escala: 1 },
  jornal: { cor: '#dcd8cc', borda: '#b4b0a4', proporcao: 0.76, escala: 1 },
  livro: { cor: '#efe6cf', borda: '#cbbd98', proporcao: 0.72, escala: 1 },
  bilhete: { cor: '#f2eee2', borda: '#cdc6b2', proporcao: 0.9, escala: 0.62 },
}

export interface OpcoesLeitura {
  onFechar?: () => void
  onSegredo?: (id: string) => void
}

export class Leitor {
  private doc: Documento | null = null
  private pagina = 0
  private tPagina = 0
  private virada = 1
  private dir = 1
  private abrindo = 0
  private opcoes: OpcoesLeitura = {}
  private vistas = new Set<string>()
  /** Onde a folha foi desenhada, em pixels de tela, para o clique. */
  private caixa = { x: 0, y: 0, w: 0, h: 0 }

  get aberto(): boolean {
    return this.doc !== null
  }

  /** Para os testes e para quem quiser saber onde o jogador está. */
  get paginaAtual(): number {
    return this.pagina
  }

  abrir(doc: Documento, opcoes: OpcoesLeitura = {}): void {
    this.doc = doc
    this.pagina = 0
    this.tPagina = 0
    this.virada = 1
    this.abrindo = 0
    this.opcoes = opcoes
    audio.folha()
    this.aoMostrar()
  }

  fechar(): void {
    if (!this.doc) return
    this.doc = null
    audio.folha()
    const cb = this.opcoes.onFechar
    this.opcoes = {}
    cb?.()
  }

  private aoMostrar(): void {
    const p = this.doc?.paginas[this.pagina]
    if (p?.segredo) this.opcoes.onSegredo?.(p.segredo)
  }

  private virar(d: number): void {
    if (!this.doc) return
    const alvo = this.pagina + d
    if (alvo >= this.doc.paginas.length) {
      this.fechar()
      return
    }
    if (alvo < 0) return
    this.pagina = alvo
    this.tPagina = 0
    this.virada = 0
    this.dir = d
    audio.folha()
    this.aoMostrar()
  }

  /** Lê a entrada. Enquanto aberto, o leitor fica com tudo. */
  update(dt: number, input: Input): void {
    if (!this.doc) return
    this.tPagina += dt
    this.virada = Math.min(1, this.virada + dt * 5)
    this.abrindo = Math.min(1, this.abrindo + dt * 4)

    const p = this.doc.paginas[this.pagina]
    if (p?.paciencia && this.tPagina >= p.paciencia.apos) {
      const chave = `${this.doc.id}:${this.pagina}`
      if (!this.vistas.has(chave)) {
        this.vistas.add(chave)
        if (p.paciencia.segredo) this.opcoes.onSegredo?.(p.paciencia.segredo)
      }
    }

    // Um instante de carência: a tecla que abriu não pode virar a página.
    if (this.abrindo < 0.6) {
      input.consumeConfirm()
      input.consumeTap()
      return
    }

    if (input.consumeKey('Escape')) {
      this.fechar()
      return
    }
    const tap = input.consumeTap()
    const confirmou = input.consumeConfirm()
    if (tap) {
      const { x, y, w, h } = this.caixa
      const dentro = tap.x >= x && tap.x <= x + w && tap.y >= y - 40 && tap.y <= y + h + 60
      if (!dentro) this.fechar()
      else this.virar(tap.x < x + w * 0.3 ? -1 : 1)
      return
    }
    if (input.consumeKey('ArrowLeft') || input.consumeKey('KeyA')) this.virar(-1)
    else if (input.consumeKey('ArrowRight') || input.consumeKey('KeyD') || confirmou) this.virar(1)
  }

  render(c: CanvasRenderingContext2D, cssW: number, cssH: number): void {
    const doc = this.doc
    const pag = doc?.paginas[this.pagina]
    if (!doc || !pag) return
    const papel = PAPEL[doc.tipo]

    c.save()
    c.globalAlpha = this.abrindo
    c.fillStyle = 'rgba(2,3,6,0.8)'
    c.fillRect(0, 0, cssW, cssH)

    // Tamanho da folha: cabe na tela, de pé, também no celular.
    let h = Math.min(cssH * 0.8, 700) * papel.escala
    let w = h * papel.proporcao
    if (w > cssW * 0.92) {
      w = cssW * 0.92
      h = w / papel.proporcao
    }
    const desliza = (1 - easeOut(this.virada)) * 26 * this.dir
    const x = (cssW - w) / 2 + desliza
    const y = (cssH - h) / 2 - cssH * 0.02 + (1 - easeOut(this.abrindo)) * 14
    this.caixa = { x: (cssW - w) / 2, y, w, h }

    c.globalAlpha = this.abrindo * (0.35 + 0.65 * easeOut(this.virada))
    // Sombra e papel
    c.fillStyle = 'rgba(0,0,0,0.5)'
    c.fillRect(x + 6, y + 8, w, h)
    this.desenharPapel(c, doc.tipo, pag, x, y, w, h)
    this.desenharTexto(c, pag, x, y, w, h)
    c.restore()

    // Título do documento, página e dica — fora da folha
    c.save()
    const s = Math.max(12, Math.min(cssW / 70, 16))
    c.textAlign = 'center'
    c.font = `${s}px ${FONT_BODY}`
    c.letterSpacing = '0.24em'
    c.fillStyle = PAL.inkDim
    c.globalAlpha = 0.8 * this.abrindo
    c.fillText(doc.titulo.toUpperCase(), cssW / 2, Math.max(s * 1.6, y - s * 0.9))
    c.letterSpacing = '0.1em'
    const total = doc.paginas.length
    const rodape = total > 1
      ? `‹   ${this.pagina + 1} / ${total}   ›      ← → vira   ·   Esc fecha`
      : 'E ou Esc fecha'
    c.globalAlpha = 0.6 * this.abrindo
    c.fillText(rodape, cssW / 2, Math.min(cssH - s * 0.8, y + h + s * 2))
    c.restore()
  }

  private desenharPapel(
    c: CanvasRenderingContext2D, tipo: TipoDocumento, pag: Pagina,
    x: number, y: number, w: number, h: number,
  ): void {
    const papel = PAPEL[tipo]
    c.fillStyle = papel.cor
    if (pag.rasgada) {
      // Borda direita rasgada em dentes irregulares
      c.beginPath()
      c.moveTo(x, y)
      let yy = y
      const dentes = 22
      c.lineTo(x + w * 0.9, y)
      for (let i = 0; i <= dentes; i++) {
        yy = y + (h / dentes) * i
        c.lineTo(x + w * (0.84 + ((i * 37) % 11) / 100), yy)
      }
      c.lineTo(x, y + h)
      c.closePath()
      c.fill()
    } else {
      c.fillRect(x, y, w, h)
    }

    // Bordas amareladas
    const g = c.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.7)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, tipo === 'caderno' ? 'rgba(90,60,20,0.35)' : 'rgba(90,70,40,0.14)')
    c.fillStyle = g
    c.fillRect(x, y, w, h)

    const s = h / 30
    if (tipo === 'diario') {
      c.fillStyle = 'rgba(80,110,170,0.22)'
      for (let ly = y + s * 3.4; ly < y + h - s; ly += s * 1.62) c.fillRect(x + 2, ly, w - 4, 1)
      c.fillStyle = 'rgba(190,60,60,0.35)'
      c.fillRect(x + w * 0.11, y, 1, h)
      // Furos da espiral
      c.fillStyle = 'rgba(0,0,0,0.3)'
      for (let ly = y + s * 1.5; ly < y + h; ly += s * 2.2) {
        c.beginPath()
        c.arc(x + s * 0.9, ly, s * 0.28, 0, Math.PI * 2)
        c.fill()
      }
    } else if (tipo === 'caderno') {
      // Manchas de tempo
      for (let i = 0; i < 9; i++) {
        const mx = x + ((i * 97) % 100) / 100 * w
        const my = y + ((i * 61) % 100) / 100 * h
        c.fillStyle = 'rgba(120,80,30,0.08)'
        c.beginPath()
        c.arc(mx, my, s * (0.5 + (i % 3) * 0.4), 0, Math.PI * 2)
        c.fill()
      }
    } else if (tipo === 'jornal') {
      c.fillStyle = 'rgba(0,0,0,0.06)'
      c.fillRect(x + w / 2, y + s * 5, 1, h - s * 6)
    }

    if (pag.dobras) {
      c.fillStyle = 'rgba(0,0,0,0.08)'
      c.fillRect(x, y + h / 2, w, 1)
      c.fillRect(x + w / 2, y, 1, h)
      c.fillStyle = 'rgba(255,255,255,0.25)'
      c.fillRect(x, y + h / 2 + 1, w, 1)
    }
    if (pag.mancha) {
      c.strokeStyle = 'rgba(120,80,40,0.28)'
      c.lineWidth = s * 0.25
      c.beginPath()
      c.arc(x + w * 0.76, y + h * 0.78, s * 2.2, 0.3, Math.PI * 1.8)
      c.stroke()
      c.fillStyle = 'rgba(160,110,50,0.1)'
      c.beginPath()
      c.arc(x + w * 0.76, y + h * 0.78, s * 2.1, 0, Math.PI * 2)
      c.fill()
    }
    if (pag.flor) {
      // Flor prensada, marrom de velha
      const fx = x + w * 0.78
      const fy = y + h * 0.16
      c.strokeStyle = 'rgba(90,110,60,0.6)'
      c.lineWidth = 1.5
      c.beginPath()
      c.moveTo(fx, fy)
      c.lineTo(fx - s * 1.2, fy + s * 3.4)
      c.stroke()
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        c.fillStyle = 'rgba(150,80,90,0.55)'
        c.beginPath()
        c.ellipse(fx + Math.cos(a) * s * 0.5, fy + Math.sin(a) * s * 0.5, s * 0.5, s * 0.28, a, 0, Math.PI * 2)
        c.fill()
      }
      c.fillStyle = 'rgba(200,160,60,0.7)'
      c.beginPath()
      c.arc(fx, fy, s * 0.22, 0, Math.PI * 2)
      c.fill()
    }
    if (pag.planta) this.desenharPlanta(c, x + w * 0.18, y + h * 0.3, w * 0.64, h * 0.34)
  }

  /** A planta a lápis no verso: a casa, e o cômodo a mais com uma seta. */
  private desenharPlanta(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    c.save()
    c.strokeStyle = 'rgba(84,62,120,0.7)'
    c.lineWidth = 1.5
    c.strokeRect(x, y, w * 0.72, h)
    c.beginPath()
    c.moveTo(x + w * 0.3, y)
    c.lineTo(x + w * 0.3, y + h * 0.62)
    c.moveTo(x, y + h * 0.62)
    c.lineTo(x + w * 0.72, y + h * 0.62)
    c.moveTo(x + w * 0.5, y + h * 0.62)
    c.lineTo(x + w * 0.5, y + h)
    c.stroke()
    // O cômodo a mais, tracejado
    c.setLineDash([5, 4])
    c.strokeRect(x + w * 0.72, y + h * 0.2, w * 0.28, h * 0.5)
    c.setLineDash([])
    // Árvores de giz no corredor
    c.fillStyle = 'rgba(60,130,70,0.7)'
    for (let i = 0; i < 3; i++) {
      const ax = x + w * (0.08 + i * 0.08)
      const ay = y + h * 0.78
      c.beginPath()
      c.moveTo(ax, ay - 12)
      c.lineTo(ax - 6, ay + 4)
      c.lineTo(ax + 6, ay + 4)
      c.fill()
    }
    c.restore()
  }

  private desenharTexto(c: CanvasRenderingContext2D, pag: Pagina, x: number, y: number, w: number, h: number): void {
    const margem = w * 0.14
    const largura = w - margem - w * 0.09
    // Encolhe a letra até o texto caber na folha: página nenhuma transborda.
    let base = h / 30
    for (let i = 0; i < 6; i++) {
      const fim = this.medirTexto(c, pag, base, largura)
      if (fim <= h - base * 2.4) break
      base *= Math.max(0.8, Math.sqrt((h - base * 2.4) / fim))
    }
    let ty = y + base * 3.2

    const escrever = (b: Bloco, alfa = 1) => {
      const est = LETRAS[b.letra ?? 'impresso']
      const tam = base * est.escala
      c.font = est.fonte(tam)
      c.letterSpacing = est.entre ?? '0em'
      c.fillStyle = est.cor
      const linhas = quebrar(c, b.texto, largura)
      ty += (b.respiro ?? 0) * base
      const alt = tam * 1.32
      const topo = ty
      let maisLarga = 0
      const alfaAntes = c.globalAlpha
      c.globalAlpha = alfaAntes * alfa
      for (const l of linhas) {
        const lw = c.measureText(l).width
        maisLarga = Math.max(maisLarga, lw)
        const al = b.alinhar ?? (b.letra === 'manchete' || b.letra === 'titulo' ? 'centro' : b.letra === 'data' ? 'dir' : 'esq')
        const lx = al === 'centro' ? x + margem + (largura - lw) / 2 : al === 'dir' ? x + margem + largura - lw : x + margem
        if (est.contorno) {
          c.strokeStyle = est.contorno
          c.lineWidth = Math.max(1.5, tam * 0.09)
          c.lineJoin = 'round'
          c.strokeText(l, lx, ty + tam)
          c.fillStyle = est.cor
        }
        c.fillText(l, lx, ty + tam)
        if (b.riscado && b.riscoBranco) {
          const esp = Math.max(3, tam * 0.16)
          c.fillStyle = 'rgba(18,18,26,0.9)'
          c.fillRect(lx - 4, ty + tam * 0.62 - 1, lw + 8, esp + 2)
          c.fillStyle = '#fbfbff'
          c.fillRect(lx - 3, ty + tam * 0.62, lw + 6, esp)
        } else if (b.riscado) {
          c.fillStyle = est.cor
          c.fillRect(lx - 2, ty + tam * 0.66, lw + 4, Math.max(1.5, tam * 0.08))
        }
        ty += alt
      }
      c.globalAlpha = alfaAntes
      if (b.circulado) {
        c.strokeStyle = 'rgba(170,40,40,0.75)'
        c.lineWidth = 2
        c.beginPath()
        c.ellipse(x + margem + maisLarga / 2, topo + (ty - topo) / 2 + tam * 0.1,
          maisLarga / 2 + base * 0.8, (ty - topo) / 2 + base * 0.5, -0.02, 0, Math.PI * 2)
        c.stroke()
      }
      ty += base * 0.45
      c.letterSpacing = '0em'
    }

    for (const [i, b] of pag.blocos.entries()) {
      // Com desenho na página, o texto continua embaixo dele.
      if (pag.planta && i === 1) ty = Math.max(ty, y + h * 0.7)
      escrever(b)
    }

    if (pag.cruzadas) ty = this.desenharCruzadas(c, pag.cruzadas, x + margem, ty + base * 0.4, largura, base)

    if (pag.paciencia) {
      const a = Math.max(0, Math.min(1, (this.tPagina - pag.paciencia.apos) / 2.5))
      if (a > 0) {
        ty = Math.max(ty, y + h * 0.55)
        for (const b of pag.paciencia.blocos) escrever(b, a * 0.9)
      }
    }
  }

  /** Altura que o texto da página ocupa com esta letra, sem desenhar. */
  private medirTexto(c: CanvasRenderingContext2D, pag: Pagina, base: number, largura: number): number {
    let ty = base * 3.2
    const blocos = [...pag.blocos, ...(pag.paciencia?.blocos ?? [])]
    for (const b of blocos) {
      const est = LETRAS[b.letra ?? 'impresso']
      const tam = base * est.escala
      c.font = est.fonte(tam)
      c.letterSpacing = est.entre ?? '0em'
      ty += (b.respiro ?? 0) * base + quebrar(c, b.texto, largura).length * tam * 1.32 + base * 0.45
    }
    c.letterSpacing = '0em'
    if (pag.cruzadas) ty += pag.cruzadas.length * base * 1.9 + base * 1.4
    return ty
  }

  /** Grade das palavras cruzadas: tinta dele, e uma palavra a lápis. */
  private desenharCruzadas(
    c: CanvasRenderingContext2D, grade: string[], x: number, y: number, largura: number, base: number,
  ): number {
    const colunas = Math.max(...grade.map((l) => l.length))
    const lado = Math.min(largura / colunas, base * 1.9)
    const x0 = x + (largura - lado * colunas) / 2
    for (const [r, linha] of grade.entries()) {
      for (let col = 0; col < linha.length; col++) {
        const ch = linha[col] ?? '.'
        if (ch === '.') continue
        const cx = x0 + col * lado
        const cy = y + r * lado
        c.fillStyle = '#f4f0e6'
        c.fillRect(cx, cy, lado, lado)
        c.strokeStyle = '#2a2a2e'
        c.lineWidth = 1
        c.strokeRect(cx + 0.5, cy + 0.5, lado - 1, lado - 1)
        if (ch === '_') continue
        const lapis = ch === ch.toLowerCase()
        c.font = lapis ? `italic 500 ${lado * 0.72}px ${FONT_FIM}` : `400 ${lado * 0.6}px ${FONT_TITLE}`
        c.fillStyle = lapis ? 'rgba(84,62,120,0.85)' : '#141418'
        c.textAlign = 'center'
        c.fillText(ch.toUpperCase(), cx + lado / 2, cy + lado * 0.76)
        c.textAlign = 'left'
      }
    }
    return y + grade.length * lado + base
  }
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function quebrar(c: CanvasRenderingContext2D, texto: string, largura: number): string[] {
  const palavras = texto.split(' ')
  const linhas: string[] = []
  let atual = ''
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p
    if (c.measureText(tentativa).width > largura && atual) {
      linhas.push(atual)
      atual = p
    } else {
      atual = tentativa
    }
  }
  if (atual) linhas.push(atual)
  return linhas
}
