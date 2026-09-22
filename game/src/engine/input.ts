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
export class Input {
  private down = new Set<string>()
  private confirmQueued = false
  private anyQueued = false

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
    window.addEventListener('blur', () => this.down.clear())
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
