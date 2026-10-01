import './fontes.css'
import './style.css'
import { Display } from './engine/display'
import { Input } from './engine/input'
import { GameState } from './game/systems/state'
import { TitleScene } from './game/scenes/title'
import { PrologoScene } from './game/scenes/demo/prologo'
import { CasaScene } from './game/scenes/demo/casa'
import { MesaScene } from './game/scenes/demo/mesa'
import { TearScene } from './game/scenes/demo/tear'
import { FimScene } from './game/scenes/demo/fim'
import { HospitalScene } from './game/scenes/demo/hospital'
import { principal } from './engine/principal'
import type { Scene, SceneCtx } from './game/scenes/types'

const canvas = document.getElementById('game') as HTMLCanvasElement | null
if (!canvas) throw new Error('Canvas #game não encontrado')

const display = new Display(canvas)
const input = new Input()
const state = new GameState()

/**
 * `?cena=<id>` começa direto numa cena, sem rejogar tudo. Existe para
 * produção: dá para conferir o fecho ou o Tear sem atravessar a demo inteira.
 * Sem o parâmetro, nada muda.
 */
function cenaInicial(): Scene {
  const pedida = new URLSearchParams(location.search).get('cena')
  switch (pedida) {
    case 'prologo': return new PrologoScene()
    case 'casa': return new CasaScene()
    case 'depois': return new CasaScene({ depois: true })
    case 'hospital': return new HospitalScene('abertura')
    case 'grito': return new HospitalScene('grito')
    case 'mesa': return new MesaScene()
    case 'tear': return new TearScene()
    case 'fim': return new FimScene()
    default: return new TitleScene()
  }
}

// `?segredos=a,b` já começa com esses segredos achados — para conferir o
// fecho com e sem eles, sem caçar tudo de novo.
for (const id of (new URLSearchParams(location.search).get('segredos') ?? '').split(',')) {
  if (id) state.descobrir(id)
}

let scene: Scene = cenaInicial()
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

  principal.update(dt)
  scene.update(dt, ctx)
  scene.render(ctx)
  drawStick()
  input.endFrame()

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
      /** Converte um ponto do mundo em pixels de tela (usado nos testes). */
      paraTela(x: number, y: number) {
        return { x: display.toScreenX(x), y: display.toScreenY(y) }
      },
    },
  })
}

/** Desenha o manche virtual enquanto o dedo está na tela. */
function drawStick(): void {
  const st = input.stick
  if (!st) return
  const c = display.ctx
  const dx = st.x - st.ox
  const dy = st.y - st.oy
  const d = Math.hypot(dx, dy)
  const clamp = Math.min(d, 46)
  const nx = d > 0 ? st.ox + (dx / d) * clamp : st.ox
  const ny = d > 0 ? st.oy + (dy / d) * clamp : st.oy
  c.save()
  c.strokeStyle = 'rgba(232,236,244,0.20)'
  c.lineWidth = 2
  c.beginPath()
  c.arc(st.ox, st.oy, 46, 0, Math.PI * 2)
  c.stroke()
  c.fillStyle = 'rgba(217,178,95,0.38)'
  c.beginPath()
  c.arc(nx, ny, 17, 0, Math.PI * 2)
  c.fill()
  c.restore()
}

let last = performance.now()
function loop(now: number): void {
  // Trava o passo: uma aba em segundo plano não deve avançar dez segundos.
  const dt = Math.min((now - last) / 1000, 1 / 20)
  last = now
  step(dt)
  requestAnimationFrame(loop)
}

/**
 * Canvas não dispara o carregamento de fonte: se desenhar antes dela chegar,
 * usa a de reserva e fica com ela. Então cada face é pedida explicitamente,
 * antes do primeiro quadro.
 */
const FACES = [
  "400 32px 'Bodoni Moda'",
  "500 32px 'Bodoni Moda'",
  "italic 400 32px 'Bodoni Moda'",
  "300 20px 'Spectral'",
  "400 20px 'Spectral'",
  "italic 300 20px 'Spectral'",
  "italic 400 20px 'Spectral'",
  "italic 400 32px 'Cormorant Garamond'",
  "italic 500 32px 'Cormorant Garamond'",
]

async function boot(): Promise<void> {
  try {
    await Promise.all(FACES.map((f) => document.fonts.load(f, 'Nós ÁÉÍÓÚ ãõç')))
    await document.fonts.ready
  } catch {
    /* segue com as fontes de reserva */
  }
  document.getElementById('loading')?.remove()
  requestAnimationFrame(loop)
}

void boot()
