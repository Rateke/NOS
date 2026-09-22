import { WORLD_W, WORLD_H } from './constants'

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
  cssW = 0
  cssH = 0

  private worldCanvas: HTMLCanvasElement
  private grainCanvas: HTMLCanvasElement
  private grainSeed = 0

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

    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.cssW = window.innerWidth
    this.cssH = window.innerHeight
    this.canvas.width = Math.floor(this.cssW * dpr)
    this.canvas.height = Math.floor(this.cssH * dpr)
    this.canvas.style.width = `${this.cssW}px`
    this.canvas.style.height = `${this.cssH}px`
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Escala inteira sempre que couber; abaixo disso, aceita fracionária para
    // não deixar tarja enorme em janelas pequenas.
    const raw = Math.min(this.cssW / WORLD_W, this.cssH / WORLD_H)
    this.scale = raw >= 1 ? Math.floor(raw) : raw
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

  /** Desenha o mundo escalado na tela e limpa as tarjas. */
  present(): void {
    const c = this.ctx
    c.imageSmoothingEnabled = false
    c.fillStyle = '#000'
    c.fillRect(0, 0, this.cssW, this.cssH)
    c.drawImage(
      this.worldCanvas,
      this.offsetX,
      this.offsetY,
      WORLD_W * this.scale,
      WORLD_H * this.scale,
    )
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

  /** Converte coordenada de mundo para coordenada de tela (para a interface). */
  toScreenX(x: number): number {
    return this.offsetX + x * this.scale
  }

  toScreenY(y: number): number {
    return this.offsetY + y * this.scale
  }
}
