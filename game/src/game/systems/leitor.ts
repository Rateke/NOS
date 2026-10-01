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
    if (pag.planta) this.desenharPlanta(c, x + w * 0.08, y + h * 0.15, w * 0.84, h * 0.5)
  }

  /**
   * A planta a lápis no verso da redação. É desenho de quem desenha bem:
   * paredes grossas, portas com o arco de abrir, janelas, os móveis de cada
   * cômodo, a cota em cima e o norte no canto. Na cozinha, cinco cadeiras.
   * No fim do corredor, uma porta fechada e o cômodo a mais, tracejado.
   *
   * Por cima, árvores de giz de cera no corredor — de outra mão, de criança.
   * "Aqui era a floresta."
   */
  private desenharPlanta(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const X = (u: number) => x + u * w
    const Y = (v: number) => y + v * h
    const grafite = 'rgba(52,50,64,0.86)'
    const claro = 'rgba(52,50,64,0.5)'
    const fino = Math.max(0.8, w * 0.0026)
    const esp = Math.max(2.2, w * 0.011)
    c.save()
    c.lineCap = 'butt'
    c.lineJoin = 'miter'

    type Vao = [number, number]
    // Parede horizontal em v, de u0 a u1, com vãos (portas) e janelas.
    const paredeH = (v: number, u0: number, u1: number, vaos: Vao[] = [], janelas: Vao[] = []) => {
      const cortes = [...vaos, ...janelas].sort((a, b) => a[0] - b[0])
      let ini = u0
      c.strokeStyle = grafite
      c.lineWidth = esp
      for (const [a, b] of [...cortes, [u1, u1] as Vao]) {
        if (a > ini) {
          c.beginPath()
          c.moveTo(X(ini), Y(v))
          c.lineTo(X(a), Y(v))
          c.stroke()
        }
        ini = b
      }
      c.lineWidth = fino
      for (const [a, b] of janelas) {
        for (const d of [-esp / 2, 0, esp / 2]) {
          c.beginPath()
          c.moveTo(X(a), Y(v) + d)
          c.lineTo(X(b), Y(v) + d)
          c.stroke()
        }
      }
    }
    const paredeV = (u: number, v0: number, v1: number, vaos: Vao[] = [], janelas: Vao[] = []) => {
      const cortes = [...vaos, ...janelas].sort((a, b) => a[0] - b[0])
      let ini = v0
      c.strokeStyle = grafite
      c.lineWidth = esp
      for (const [a, b] of [...cortes, [v1, v1] as Vao]) {
        if (a > ini) {
          c.beginPath()
          c.moveTo(X(u), Y(ini))
          c.lineTo(X(u), Y(a))
          c.stroke()
        }
        ini = b
      }
      c.lineWidth = fino
      for (const [a, b] of janelas) {
        for (const d of [-esp / 2, 0, esp / 2]) {
          c.beginPath()
          c.moveTo(X(u) + d, Y(a))
          c.lineTo(X(u) + d, Y(b))
          c.stroke()
        }
      }
    }
    // Porta: a folha aberta a 90° e o arco que ela faz. `dir` é para que
    // lado do vão ela abre (1 para baixo/direita, -1 para cima/esquerda).
    const portaH = (v: number, a: number, b: number, dir: number) => {
      const r = X(b) - X(a)
      c.strokeStyle = grafite
      c.lineWidth = fino
      c.beginPath()
      c.moveTo(X(a), Y(v))
      c.lineTo(X(a), Y(v) + dir * r)
      c.stroke()
      c.strokeStyle = claro
      c.beginPath()
      c.arc(X(a), Y(v), r, dir > 0 ? 0 : -Math.PI / 2, dir > 0 ? Math.PI / 2 : 0)
      c.stroke()
    }
    const portaV = (u: number, a: number, b: number, dir: number) => {
      const r = Y(b) - Y(a)
      c.strokeStyle = grafite
      c.lineWidth = fino
      c.beginPath()
      c.moveTo(X(u), Y(a))
      c.lineTo(X(u) + dir * r, Y(a))
      c.stroke()
      c.strokeStyle = claro
      c.beginPath()
      c.arc(X(u), Y(a), r, dir > 0 ? 0 : Math.PI / 2, dir > 0 ? Math.PI / 2 : Math.PI)
      c.stroke()
    }
    const ret = (u0: number, v0: number, u1: number, v1: number, cor = claro) => {
      c.strokeStyle = cor
      c.lineWidth = fino
      c.strokeRect(X(u0), Y(v0), X(u1) - X(u0), Y(v1) - Y(v0))
    }
    const linha = (u0: number, v0: number, u1: number, v1: number, cor = claro) => {
      c.strokeStyle = cor
      c.lineWidth = fino
      c.beginPath()
      c.moveTo(X(u0), Y(v0))
      c.lineTo(X(u1), Y(v1))
      c.stroke()
    }

    // --- Cota e título -------------------------------------------------------
    linha(0.04, 0.045, 0.74, 0.045)
    for (const u of [0.04, 0.4, 0.74]) linha(u - 0.008, 0.06, u + 0.008, 0.03)
    const letra = (t: string, u: number, v: number, tam: number, alinhar: CanvasTextAlign = 'center', cor = grafite) => {
      c.fillStyle = cor
      c.font = `italic 500 ${tam}px ${FONT_FIM}`
      c.textAlign = alinhar
      c.fillText(t, X(u), Y(v))
    }
    const t = w * 0.034
    letra('5,10', 0.22, 0.035, t * 0.8)
    letra('4,20', 0.57, 0.035, t * 0.8)
    letra('nossa casa', 0.98, 0.06, t * 1.05, 'right')
    letra('esc. 1:100', 0.98, 0.115, t * 0.75, 'right', claro)

    // --- Paredes --------------------------------------------------------------
    // Externas
    paredeH(0.1, 0.04, 0.74, [], [[0.1, 0.24], [0.5, 0.64]])
    paredeH(0.9, 0.04, 0.74, [], [[0.08, 0.16], [0.42, 0.5], [0.6, 0.7]])
    paredeV(0.04, 0.1, 0.9, [[0.48, 0.56]], [[0.2, 0.34]])
    paredeV(0.74, 0.1, 0.9, [[0.48, 0.56]], [[0.18, 0.28]])
    // Corredor, entre os dois lados da casa
    paredeH(0.46, 0.04, 0.74, [[0.26, 0.32], [0.46, 0.52]])
    paredeH(0.58, 0.04, 0.74, [[0.1, 0.15], [0.25, 0.29], [0.4, 0.45], [0.62, 0.67]])
    // Divisórias
    paredeV(0.4, 0.1, 0.46)
    paredeV(0.22, 0.58, 0.9)
    paredeV(0.34, 0.58, 0.9)
    paredeV(0.54, 0.58, 0.9)

    // Portas abrindo para dentro dos cômodos
    portaH(0.46, 0.26, 0.32, -1)
    portaH(0.46, 0.46, 0.52, -1)
    portaH(0.58, 0.1, 0.15, 1)
    portaH(0.58, 0.25, 0.29, 1)
    portaH(0.58, 0.4, 0.45, 1)
    portaH(0.58, 0.62, 0.67, 1)
    // A da frente, abrindo para dentro do corredor
    portaV(0.04, 0.48, 0.56, 1)
    // A do fim do corredor: fechada. Uma linha só, e a chave desenhada.
    linha(0.74, 0.48, 0.74, 0.56, grafite)
    c.strokeStyle = grafite
    c.lineWidth = fino * 1.4
    c.beginPath()
    c.moveTo(X(0.725), Y(0.52))
    c.lineTo(X(0.735), Y(0.52))
    c.stroke()

    // --- Móveis ---------------------------------------------------------------
    // Sala: piano encostado em cima, com as teclas; sofá; mesinha; estante;
    // poltrona e o tapete tracejado.
    ret(0.07, 0.115, 0.2, 0.16)
    for (let i = 0; i < 12; i++) linha(0.075 + i * 0.01, 0.15, 0.075 + i * 0.01, 0.16)
    ret(0.06, 0.22, 0.1, 0.4)
    linha(0.072, 0.225, 0.072, 0.395)
    ret(0.16, 0.27, 0.23, 0.33)
    ret(0.36, 0.14, 0.39, 0.3)
    for (const v of [0.18, 0.22, 0.26]) linha(0.36, v, 0.39, v)
    ret(0.28, 0.34, 0.33, 0.41)
    c.setLineDash([3, 3])
    ret(0.13, 0.23, 0.3, 0.39, 'rgba(52,50,64,0.32)')
    c.setLineDash([])
    // Cozinha: bancada com fogão de quatro bocas e pia; geladeira; a mesa e
    // as cadeiras. Cinco.
    ret(0.42, 0.115, 0.72, 0.155)
    ret(0.48, 0.118, 0.55, 0.152)
    for (const [du, dv] of [[0.497, 0.127], [0.533, 0.127], [0.497, 0.143], [0.533, 0.143]] as const) {
      c.beginPath()
      c.arc(X(du), Y(dv), w * 0.0075, 0, Math.PI * 2)
      c.stroke()
    }
    ret(0.61, 0.12, 0.67, 0.15)
    ret(0.62, 0.125, 0.66, 0.145)
    ret(0.685, 0.17, 0.72, 0.25)
    linha(0.685, 0.2, 0.72, 0.2)
    ret(0.5, 0.28, 0.64, 0.36)
    for (const [cu, cv] of [[0.53, 0.25], [0.6, 0.25], [0.53, 0.37], [0.6, 0.37], [0.65, 0.31]] as const) {
      ret(cu, cv, cu + 0.025, cv + 0.025)
    }
    // Quarto dos pais: cama de casal, dois travesseiros, guarda-roupa.
    ret(0.09, 0.66, 0.2, 0.84)
    ret(0.1, 0.67, 0.14, 0.7)
    ret(0.15, 0.67, 0.19, 0.7)
    linha(0.09, 0.72, 0.2, 0.72)
    ret(0.05, 0.6, 0.08, 0.76)
    linha(0.05, 0.6, 0.08, 0.76)
    linha(0.08, 0.6, 0.05, 0.76)
    // Banheiro: box com a diagonal, vaso.
    ret(0.235, 0.79, 0.3, 0.885)
    linha(0.235, 0.79, 0.3, 0.885)
    c.strokeStyle = claro
    c.beginPath()
    c.ellipse(X(0.317), Y(0.83), w * 0.012, h * 0.022, 0, 0, Math.PI * 2)
    c.stroke()
    // Quarto da Lia e o meu: cama de solteiro, escrivaninha.
    ret(0.36, 0.7, 0.42, 0.885)
    ret(0.365, 0.705, 0.415, 0.735)
    ret(0.46, 0.83, 0.53, 0.885)
    ret(0.67, 0.7, 0.73, 0.885)
    ret(0.675, 0.705, 0.725, 0.735)
    ret(0.56, 0.83, 0.63, 0.885)
    ret(0.585, 0.795, 0.61, 0.82)
    // A cabana: duas cadeiras e o cobertor por cima, de cima.
    c.setLineDash([2, 2])
    ret(0.56, 0.64, 0.62, 0.72, 'rgba(52,50,64,0.4)')
    c.setLineDash([])

    // --- O cômodo a mais ------------------------------------------------------
    c.strokeStyle = grafite
    c.lineWidth = fino * 1.3
    c.setLineDash([w * 0.012, w * 0.009])
    c.strokeRect(X(0.74), Y(0.34), X(0.96) - X(0.74), Y(0.7) - Y(0.34))
    c.setLineDash([])
    letra('?', 0.85, 0.56, t * 2)

    // --- Nomes dos cômodos, na minha letra --------------------------------------
    letra('sala', 0.22, 0.215, t)
    letra('cozinha', 0.57, 0.43, t)
    letra('corredor', 0.415, 0.535, t * 0.8, 'center', claro)
    letra('pais', 0.15, 0.885, t * 0.85)
    letra('banh.', 0.28, 0.66, t * 0.75)
    letra('Lia', 0.48, 0.66, t * 0.85)
    letra('eu', 0.7, 0.66, t * 0.85)

    // Norte
    const nu = X(0.9)
    const nv = Y(0.84)
    const nr = w * 0.025
    c.strokeStyle = claro
    c.lineWidth = fino
    c.beginPath()
    c.arc(nu, nv, nr, 0, Math.PI * 2)
    c.stroke()
    c.fillStyle = grafite
    c.beginPath()
    c.moveTo(nu, nv - nr * 0.9)
    c.lineTo(nu - nr * 0.35, nv + nr * 0.4)
    c.lineTo(nu + nr * 0.35, nv + nr * 0.4)
    c.closePath()
    c.fill()
    letra('N', 0.9, 0.84 - (nr * 1.25) / h, t * 0.7)

    // --- Por cima: giz de cera, de outra mão ---------------------------------------
    let semente = 11
    const rnd = () => {
      semente = (semente * 9301 + 49297) % 233280
      return semente / 233280
    }
    c.lineCap = 'round'
    for (const u of [0.17, 0.33, 0.5, 0.63]) {
      const cx = X(u)
      const cy = Y(0.475)
      const r = w * 0.036
      // Tronco marrom, torto
      c.strokeStyle = 'rgba(120,74,40,0.75)'
      c.lineWidth = w * 0.009
      c.beginPath()
      c.moveTo(cx + (rnd() - 0.5) * 2, cy + r * 0.6)
      c.lineTo(cx + (rnd() - 0.5) * 3, Y(0.57))
      c.stroke()
      // Copa: primeiro uma bola torta pintada, depois o rabisco em volta,
      // girando, do jeito que criança pinta — e passando da linha.
      c.fillStyle = 'rgba(70,150,66,0.38)'
      c.beginPath()
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        const rr = r * (0.85 + rnd() * 0.3)
        const px = cx + Math.cos(a) * rr
        const py = cy + Math.sin(a) * rr * 0.92
        if (i === 0) c.moveTo(px, py)
        else c.lineTo(px, py)
      }
      c.closePath()
      c.fill()
      c.strokeStyle = 'rgba(56,128,58,0.55)'
      c.lineWidth = w * 0.007
      c.beginPath()
      for (let i = 0; i < 34; i++) {
        const a = i * 0.55 + rnd() * 0.3
        const rr = r * (0.25 + (i / 34) * 0.85 + (rnd() - 0.5) * 0.15)
        const px = cx + Math.cos(a) * rr
        const py = cy + Math.sin(a) * rr * 0.92
        if (i === 0) c.moveTo(px, py)
        else c.lineTo(px, py)
      }
      c.stroke()
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
      if (pag.planta && i === 1) ty = Math.max(ty, y + h * 0.69)
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
