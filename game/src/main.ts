import './style.css'
import { Display } from './engine/display'
import { Input } from './engine/input'
import { GameState } from './game/systems/state'
import { TitleScene } from './game/scenes/title'
import type { Scene, SceneCtx } from './game/scenes/types'

const canvas = document.getElementById('game') as HTMLCanvasElement | null
if (!canvas) throw new Error('Canvas #game não encontrado')

const display = new Display(canvas)
const input = new Input()
const state = new GameState()

let scene: Scene = new TitleScene()
let fade = 0
let fadeTarget = 0
let fadeRate = 0
let pending: { next: Scene; inSec: number } | null = null

const ctx: SceneCtx = {
  display,
  input,
  state,
  transition(next: Scene, outSec = 1, inSec = 1) {
    if (pending) return
    pending = { next, inSec }
    fadeTarget = 1
    fadeRate = outSec > 0 ? 1 / outSec : 999
  },
}

scene.enter?.(ctx)

function step(dt: number): void {
  if (fade !== fadeTarget) {
    const dir = Math.sign(fadeTarget - fade)
    fade = Math.max(0, Math.min(1, fade + dir * fadeRate * dt))
    if (fade === 1 && pending) {
      scene = pending.next
      scene.enter?.(ctx)
      fadeTarget = 0
      fadeRate = pending.inSec > 0 ? 1 / pending.inSec : 999
      pending = null
    }
  }

  scene.update(dt, ctx)
  scene.render(ctx)

  if (fade > 0) {
    const c = display.ctx
    c.save()
    c.globalAlpha = fade
    c.fillStyle = '#000'
    c.fillRect(0, 0, display.cssW, display.cssH)
    c.restore()
  }
}

// Gancho de teste: só existe com ?debug na URL. Serve para automação de
// playtest e para pular direto a uma cena durante a produção.
if (new URLSearchParams(location.search).has('debug')) {
  Object.defineProperty(window, '__nos', {
    value: {
      state,
      get scene() {
        return scene
      },
    },
  })
}

let last = performance.now()
function loop(now: number): void {
  // Trava o passo: uma aba em segundo plano não deve avançar dez segundos.
  const dt = Math.min((now - last) / 1000, 1 / 20)
  last = now
  step(dt)
  requestAnimationFrame(loop)
}

async function boot(): Promise<void> {
  try {
    await document.fonts.ready
  } catch {
    /* segue com as fontes de fallback */
  }
  document.getElementById('loading')?.remove()
  requestAnimationFrame(loop)
}

void boot()
