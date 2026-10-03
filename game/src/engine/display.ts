import { WORLD_W, WORLD_H } from './constants'

/** Deformações de tela. Todas em pixels de mundo; 0 desliga. */
export interface Fx {
  /** Separação de canais de cor, em pixels. */
  rgbSplit: number
  /** Amplitude da ondulação horizontal. */
  wave: number
  /** Tremor da câmera. */
  shake: number
  /** Relógio, para a ondulação andar. */
  time?: number
  /** Aproximação da câmera; 1 mostra o mundo inteiro. */
  zoom?: number
  /** Ponto do mundo que fica no centro da tela. */
  alvoX?: number
  alvoY?: number
}

/**
 * Duas camadas: o mundo é desenhado em 384x216 e escalado por um inteiro
 * (pixels nítidos, sem meio-pixel); a interface é desenhada por cima, em
 * resolução de tela, para que o texto fique legível.
 */
export class Display {
  readonly canvas: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
  readonly world: CanvasRenderingContext2D

  scale = 1
  offsetX = 0
  offsetY = 0
  /**
   * Câmera usada no último quadro. As conversões tela<->mundo precisam dela:
   * sem isso, com zoom, o clique do jogador cai num ponto errado do mundo.
   */
  private cam = { zoom: 1, alvoX: WORLD_W / 2, alvoY: WORLD_H / 2 }
  cssW = 0
  cssH = 0

  private worldCanvas: HTMLCanvasElement
  private tintA: HTMLCanvasElement
  private tintB: HTMLCanvasElement
  private grainCanvas: HTMLCanvasElement
  private grainSeed = 0
  /** Caixa que define o tamanho útil. Ver nota em `resize`. */
  private host: HTMLElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D indisponível')
    this.ctx = ctx

    this.worldCanvas = document.createElement('canvas')
    this.worldCanvas.width = WORLD_W
    this.worldCanvas.height = WORLD_H
    const wctx = this.worldCanvas.getContext('2d')
    if (!wctx) throw new Error('Canvas do mundo indisponível')
    this.world = wctx

    this.grainCanvas = document.createElement('canvas')
    this.grainCanvas.width = WORLD_W
    this.grainCanvas.height = WORLD_H

    const buf = (): HTMLCanvasElement => {
      const cv = document.createElement('canvas')
      cv.width = WORLD_W
      cv.height = WORLD_H
      return cv
    }
    this.tintA = buf()
    this.tintB = buf()

    this.host = this.buildHost()

    this.resize()
    window.addEventListener('resize', () => this.resize())
    window.addEventListener('orientationchange', () => this.resize())
    // O CSS pode aplicar depois deste construtor (no build de arquivo único o
    // estilo é injetado por script), e o teclado virtual do celular muda a
    // altura sem disparar 'resize'. O observador cobre os dois casos.
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this.resize()).observe(this.host)
    }
  }

  /**
   * Envolve o canvas numa div que ocupa a tela.
   *
   * O canvas não pode se dimensionar sozinho: é um elemento substituído, então
   * `inset: 0` não o estica — ele fica nos 300x150 intrínsecos. Quem estica é
   * a div (elemento normal), e o canvas é dimensionado a partir dela. Medir o
   * próprio canvas para depois escrever seu tamanho seria circular, e foi
   * exatamente o que já travou o jogo num quadrado de 300x150.
   *
   * Tudo em estilo inline, de propósito: assim o jogo funciona mesmo que a
   * folha de estilo não carregue.
   */
  private buildHost(): HTMLElement {
    const host = document.createElement('div')
    host.setAttribute('data-nos', 'viewport')
    const h = host.style
    h.position = 'fixed'
    h.left = '0'
    h.right = '0'
    h.top = '0'
    h.bottom = '0'
    // Refina com as áreas seguras do aparelho; se o navegador não conhecer
    // env(), a declaração é ignorada e os zeros acima continuam valendo.
    h.top = 'env(safe-area-inset-top, 0px)'
    h.bottom = 'env(safe-area-inset-bottom, 0px)'
    h.overflow = 'hidden'
    h.background = '#000'

    // Focável: dentro de um iframe, sem foco nenhum elemento recebe teclado.
    this.canvas.tabIndex = 0
    this.canvas.style.outline = 'none'
    const focar = () => {
      try {
        this.canvas.focus({ preventScroll: true })
      } catch {
        /* ignora */
      }
    }
    focar()
    window.setTimeout(focar, 60)
    host.addEventListener('pointerdown', focar)

    const c = this.canvas.style
    c.display = 'block'
    c.imageRendering = 'pixelated'
    c.touchAction = 'none'

    this.canvas.parentNode?.insertBefore(host, this.canvas)
    host.appendChild(this.canvas)
    return host
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    // Mede a div, nunca o canvas: medir o canvas para depois definir seu
    // tamanho é circular e o trava na primeira leitura.
    const rect = this.host.getBoundingClientRect()
    const usable = rect.width >= 2 && rect.height >= 2
    this.cssW = Math.max(1, Math.round(usable ? rect.width : window.innerWidth))
    this.cssH = Math.max(1, Math.round(usable ? rect.height : window.innerHeight))

    this.canvas.style.width = `${this.cssW}px`
    this.canvas.style.height = `${this.cssH}px`
    this.canvas.width = Math.round(this.cssW * dpr)
    this.canvas.height = Math.round(this.cssH * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // O cenário preenche a janela inteira (o lado que limitar). Escala
    // inteira deixava tarja grossa em quase toda tela — numa janela de
    // 1440x800 o jogo ficava com 1152x648 — e quem jogou reclamou que não
    // enxergava. O pixel fracionário quase não aparece a partir de 3x.
    const raw = Math.min(this.cssW / WORLD_W, this.cssH / WORLD_H)
    this.scale = raw
    this.offsetX = Math.floor((this.cssW - WORLD_W * this.scale) / 2)
    this.offsetY = Math.floor((this.cssH - WORLD_H * this.scale) / 2)
  }

  beginWorld(): CanvasRenderingContext2D {
    const w = this.world
    w.setTransform(1, 0, 0, 1, 0, 0)
    w.imageSmoothingEnabled = false
    w.clearRect(0, 0, WORLD_W, WORLD_H)
    return w
  }

  /** Grão de filme, aplicado em baixa resolução para ficar granulado e não liso. */
  applyGrain(strength: number): void {
    if (strength <= 0) return
    const g = this.grainCanvas.getContext('2d')
    if (!g) return
    this.grainSeed = (this.grainSeed + 1) % 7
    const img = g.createImageData(WORLD_W, WORLD_H)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() * 255) | 0
      d[i] = n
      d[i + 1] = n
      d[i + 2] = n
      d[i + 3] = Math.random() < 0.5 ? strength * 255 : 0
    }
    g.putImageData(img, 0, 0)
    this.world.save()
    this.world.globalCompositeOperation = 'overlay'
    this.world.globalAlpha = 0.5
    this.world.drawImage(this.grainCanvas, 0, 0)
    this.world.restore()
  }

  /**
   * Deformações aplicadas na hora de jogar o mundo na tela. Tudo aqui existe
   * para uma coisa só: deixar visível, sem texto, que Liam está recebendo
   * emoção que não é dele.
   */
  present(fx?: Fx): void {
    const c = this.ctx
    c.imageSmoothingEnabled = false
    c.fillStyle = '#000'
    c.fillRect(0, 0, this.cssW, this.cssH)

    // Câmera: zoom em torno de um ponto do mundo. Com zoom 1 e alvo no
    // centro, a conta devolve exatamente o enquadramento cheio.
    const z = fx?.zoom && fx.zoom > 0 ? fx.zoom : 1
    const alvoX = fx?.alvoX ?? WORLD_W / 2
    const alvoY = fx?.alvoY ?? WORLD_H / 2
    this.cam = { zoom: z, alvoX, alvoY }
    const w = WORLD_W * this.scale * z
    const h = WORLD_H * this.scale * z
    let ox = this.offsetX + (WORLD_W * this.scale) / 2 - alvoX * this.scale * z
    let oy = this.offsetY + (WORLD_H * this.scale) / 2 - alvoY * this.scale * z

    if (fx?.shake) {
      ox += (Math.random() * 2 - 1) * fx.shake * this.scale
      oy += (Math.random() * 2 - 1) * fx.shake * this.scale
    }

    if (!fx || (!fx.rgbSplit && !fx.wave)) {
      // Recorta as bordas quando a câmera aproxima, para não vazar no letterbox.
      c.save()
      c.beginPath()
      c.rect(this.offsetX, this.offsetY, WORLD_W * this.scale, WORLD_H * this.scale)
      c.clip()
      c.drawImage(this.worldCanvas, ox, oy, w, h)
      c.restore()
      return
    }

    // Separação de canais: uma cópia só vermelha e outra só ciano, deslocadas
    // em sentidos opostos e somadas — reconstrói a imagem "rachada".
    c.save()
    c.beginPath()
    c.rect(this.offsetX, this.offsetY, WORLD_W * this.scale, WORLD_H * this.scale)
    c.clip()
    if (fx.rgbSplit > 0) {
      const d = fx.rgbSplit * this.scale
      this.drawTinted(this.tintA, '#ff0000', ox - d, oy, w, h, fx)
      c.save()
      c.globalCompositeOperation = 'lighter'
      this.drawTinted(this.tintB, '#00ffff', ox + d, oy, w, h, fx)
      c.restore()
    } else {
      this.drawWaved(this.worldCanvas, ox, oy, w, h, fx)
    }
    c.restore()
  }

  private drawTinted(
    buf: HTMLCanvasElement, color: string,
    x: number, y: number, w: number, h: number, fx: Fx,
  ): void {
    const b = buf.getContext('2d')
    if (!b) return
    b.globalCompositeOperation = 'source-over'
    b.clearRect(0, 0, WORLD_W, WORLD_H)
    b.drawImage(this.worldCanvas, 0, 0)
    b.globalCompositeOperation = 'multiply'
    b.fillStyle = color
    b.fillRect(0, 0, WORLD_W, WORLD_H)
    this.drawWaved(buf, x, y, w, h, fx)
  }

  /** Desenha em faixas horizontais deslocadas por seno: a imagem "respira". */
  private drawWaved(
    src: CanvasImageSource, x: number, y: number, w: number, h: number, fx: Fx,
  ): void {
    const c = this.ctx
    if (!fx.wave) {
      c.drawImage(src, x, y, w, h)
      return
    }
    const bands = 36
    const bandSrc = WORLD_H / bands
    const bandDst = h / bands
    for (let i = 0; i < bands; i++) {
      const t = i / bands
      const dx = Math.sin(t * 13 + (fx.time ?? 0) * 3.1) * fx.wave * this.scale
      c.drawImage(
        src,
        0, i * bandSrc, WORLD_W, bandSrc,
        x + dx, y + i * bandDst, w, bandDst + 1,
      )
    }
  }

  /** Vinheta em resolução de tela, para a queda de luz ficar suave. */
  vignette(intensity: number): void {
    const c = this.ctx
    const cx = this.cssW / 2
    const cy = this.cssH / 2
    const r = Math.hypot(cx, cy)
    const g = c.createRadialGradient(cx, cy, r * 0.32, cx, cy, r)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, `rgba(0,0,0,${intensity})`)
    c.fillStyle = g
    c.fillRect(0, 0, this.cssW, this.cssH)
  }

  /**
   * Mundo para tela, já contando a câmera do último quadro — é assim que um
   * aviso desenhado na interface para em cima do objeto certo.
   */
  toScreenX(x: number): number {
    const { zoom, alvoX } = this.cam
    return this.offsetX + (WORLD_W * this.scale) / 2 + (x - alvoX) * this.scale * zoom
  }

  toScreenY(y: number): number {
    const { zoom, alvoY } = this.cam
    return this.offsetY + (WORLD_H * this.scale) / 2 + (y - alvoY) * this.scale * zoom
  }

  /** Inverso: onde, no mundo, o jogador clicou. */
  toWorldX(sx: number): number {
    const { zoom, alvoX } = this.cam
    return alvoX + (sx - this.offsetX - (WORLD_W * this.scale) / 2) / (this.scale * zoom)
  }

  toWorldY(sy: number): number {
    const { zoom, alvoY } = this.cam
    return alvoY + (sy - this.offsetY - (WORLD_H * this.scale) / 2) / (this.scale * zoom)
  }
}
