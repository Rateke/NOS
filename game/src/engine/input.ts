type Dir = { x: number; y: number }

const MOVE_KEYS: Record<string, Dir> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
}

const CONFIRM_KEYS = new Set(['Space', 'Enter', 'KeyE', 'NumpadEnter'])

/**
 * Teclado. `pressed` é o estado contínuo; `consumeConfirm` entrega o toque uma
 * única vez, para que segurar a tecla não avance três linhas de diálogo.
 */
/** Raio morto e alcance do manche virtual, em pixels de tela. */
const STICK_DEAD = 12
const STICK_MAX = 46

export class Input {
  private down = new Set<string>()
  private confirmQueued = false
  private anyQueued = false

  /** Manche virtual: metade esquerda da tela arrasta, metade direita confirma. */
  stick: { ox: number; oy: number; x: number; y: number } | null = null
  private stickId: number | null = null
  touchMode = false

  constructor(target: EventTarget = window) {
    target.addEventListener('keydown', (e) => {
      const ev = e as KeyboardEvent
      if (ev.repeat) return
      this.down.add(ev.code)
      this.anyQueued = true
      if (CONFIRM_KEYS.has(ev.code)) {
        this.confirmQueued = true
        ev.preventDefault()
      }
      if (ev.code in MOVE_KEYS) ev.preventDefault()
    })
    target.addEventListener('keyup', (e) => this.down.delete((e as KeyboardEvent).code))
    window.addEventListener('blur', () => {
      this.down.clear()
      this.stick = null
      this.stickId = null
    })
    this.bindTouch()
  }

  private bindTouch(): void {
    const onStart = (e: TouchEvent) => {
      this.touchMode = true
      this.anyQueued = true
      for (const t of Array.from(e.changedTouches)) {
        if (t.clientX < window.innerWidth / 2) {
          if (this.stickId === null) {
            this.stickId = t.identifier
            this.stick = { ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY }
          }
        } else {
          this.confirmQueued = true
        }
      }
      e.preventDefault()
    }
    const onMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this.stickId && this.stick) {
          this.stick.x = t.clientX
          this.stick.y = t.clientY
        }
      }
      e.preventDefault()
    }
    const onEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this.stickId) {
          this.stickId = null
          this.stick = null
        }
      }
      e.preventDefault()
    }
    window.addEventListener('touchstart', onStart, { passive: false })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: false })
    window.addEventListener('touchcancel', onEnd, { passive: false })
  }

  /** Direção normalizada do movimento, ou null se parado. */
  moveAxis(): Dir | null {
    let x = 0
    let y = 0
    for (const code of this.down) {
      const d = MOVE_KEYS[code]
      if (d) {
        x += d.x
        y += d.y
      }
    }
    if (x === 0 && y === 0 && this.stick) {
      const dx = this.stick.x - this.stick.ox
      const dy = this.stick.y - this.stick.oy
      const d = Math.hypot(dx, dy)
      if (d > STICK_DEAD) {
        const amp = Math.min(1, (d - STICK_DEAD) / (STICK_MAX - STICK_DEAD))
        return { x: (dx / d) * amp, y: (dy / d) * amp }
      }
    }
    if (x === 0 && y === 0) return null
    const len = Math.hypot(x, y)
    return { x: x / len, y: y / len }
  }

  consumeConfirm(): boolean {
    const v = this.confirmQueued
    this.confirmQueued = false
    return v
  }

  consumeAny(): boolean {
    const v = this.anyQueued
    this.anyQueued = false
    return v
  }
}
