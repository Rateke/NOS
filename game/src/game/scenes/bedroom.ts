import type { Scene, SceneCtx } from './types'
import type { Interactable } from '../world/types'
import { Player } from '../world/player'
import { Dialogue, FONT_BODY } from '../systems/dialogue'
import { drawBackground, drawClutter, PROPS, INTERACTABLES, SOLIDS, FLOOR, LAMP } from '../world/bedroom'
import { drawLighting } from '../world/lighting'
import { PAL, WORLD_W, WORLD_H } from '../../engine/constants'
import { audio } from '../../engine/audio'
import {
  SCRIPT, WAKE, DOOR_BEFORE_DIARY, DOOR_REFUSALS, ROOM_TIDY, DOOR_OPEN,
} from '../content/script'
import { ChapterCardScene } from './chapterCard'

const WAKE_SEC = 2.2
const REACH = 15

export class BedroomScene implements Scene {
  readonly id = 'bedroom'
  readonly player = new Player(112, 118)
  private dialogue = new Dialogue()
  private time = 0
  private wake = 0
  private doorOpen = false
  private leaving = false
  private tidyAnnounced = false
  private target: Interactable | null = null
  /** Destino de um clique no chão; limpo ao chegar ou ao usar o teclado. */
  private destino: { x: number; y: number } | null = null

  enter(ctx: SceneCtx): void {
    for (const it of INTERACTABLES) if (it.chore) ctx.state.registerChore(it.id)
    this.dialogue.play(WAKE)
  }

  update(dt: number, ctx: SceneCtx): void {
    this.time += dt
    this.wake = Math.min(1, this.wake + dt / WAKE_SEC)
    this.dialogue.update(dt)

    const confirm = ctx.input.consumeConfirm()

    if (this.dialogue.active) {
      if (confirm) this.dialogue.confirm()
      return
    }
    if (this.leaving) return

    // Clique: perto de algo examinável, interage; senão, anda até lá.
    const tap = ctx.input.consumeTap()
    if (tap) {
      const wx = ctx.display.toWorldX(tap.x)
      const wy = ctx.display.toWorldY(tap.y)
      const alvo = this.alvoEm(wx, wy, ctx)
      if (alvo && this.perto(alvo)) {
        this.destino = null
        this.interact(alvo, ctx)
        return
      }
      this.destino = { x: wx, y: wy }
    }

    const teclado = ctx.input.moveAxis()
    if (teclado) this.destino = null
    this.player.update(dt, teclado ?? this.rumoAoDestino(), FLOOR, this.solids(ctx))
    this.target = this.findTarget(ctx)

    if (confirm && this.target) this.interact(this.target, ctx)

    // Anunciado só uma vez, quando a última tarefa cai.
    if (!this.tidyAnnounced && ctx.state.diaryRead && ctx.state.tidy) {
      this.tidyAnnounced = true
      audio.reveal()
      this.dialogue.play(ROOM_TIDY)
    }
  }

  /** Direção até o ponto clicado, ou null se já chegou (ou está travado). */
  private rumoAoDestino(): { x: number; y: number } | null {
    const d = this.destino
    if (!d) return null
    const dx = d.x - this.player.x
    const dy = d.y - this.player.y
    const dist = Math.hypot(dx, dy)
    if (dist < 3) {
      this.destino = null
      return null
    }
    return { x: dx / dist, y: dy / dist }
  }

  /** O examinável sob um ponto do mundo, se houver. */
  private alvoEm(wx: number, wy: number, ctx: SceneCtx): Interactable | null {
    for (const it of INTERACTABLES) {
      if (it.consumable && ctx.state.isResolved(it.id)) continue
      const r = it.rect
      // Margem generosa: os objetos soltos são pequenos demais para mirar.
      if (wx >= r.x - 5 && wx <= r.x + r.w + 5 && wy >= r.y - 5 && wy <= r.y + r.h + 5) return it
    }
    return null
  }

  private perto(it: Interactable): boolean {
    const r = it.rect
    const dx = Math.max(r.x - this.player.x, 0, this.player.x - (r.x + r.w))
    const dy = Math.max(r.y - this.player.y, 0, this.player.y - (r.y + r.h))
    return Math.hypot(dx, dy) < REACH + 12
  }

  private solids(ctx: SceneCtx) {
    const extra = INTERACTABLES.filter((i) => i.solid && !ctx.state.isResolved(i.id)).map((i) => i.rect)
    return [...SOLIDS, ...extra]
  }

  private findTarget(ctx: SceneCtx): Interactable | null {
    const p = this.player.reachPoint()
    let best: Interactable | null = null
    let bestDist = Infinity
    for (const it of INTERACTABLES) {
      if (it.consumable && ctx.state.isResolved(it.id)) continue
      const cx = it.rect.x + it.rect.w / 2
      const cy = it.rect.y + it.rect.h / 2
      // Distância ponto-retângulo, para objetos largos como a cama.
      const dx = Math.max(it.rect.x - p.x, 0, p.x - (it.rect.x + it.rect.w))
      const dy = Math.max(it.rect.y - p.y, 0, p.y - (it.rect.y + it.rect.h))
      const d = Math.hypot(dx, dy) + Math.hypot(cx - p.x, cy - p.y) * 0.05
      if (d < REACH && d < bestDist) {
        bestDist = d
        best = it
      }
    }
    return best
  }

  private interact(it: Interactable, ctx: SceneCtx): void {
    if (it.id === 'porta') {
      this.useDoor(ctx)
      return
    }

    const lines = SCRIPT[it.id] ?? [{ text: '...' }]

    if (it.consumable) {
      ctx.state.resolve(it.id)
      if (it.keepsake) {
        ctx.state.addKeepsake({ id: it.id, ...it.keepsake })
        audio.pickup()
      } else {
        audio.interact()
      }
      this.dialogue.play(lines)
      return
    }

    if (it.id === 'diario') ctx.state.diaryRead = true
    audio.interact()
    this.dialogue.play(lines)
  }

  private useDoor(ctx: SceneCtx): void {
    if (!ctx.state.diaryRead) {
      audio.refuse()
      this.dialogue.play(DOOR_BEFORE_DIARY)
      return
    }
    if (!ctx.state.tidy) {
      const idx = Math.min(ctx.state.doorAttempts, DOOR_REFUSALS.length - 1)
      ctx.state.doorAttempts++
      audio.refuse()
      this.dialogue.play(DOOR_REFUSALS[idx])
      return
    }
    this.doorOpen = true
    this.leaving = true
    audio.reveal()
    this.dialogue.play(DOOR_OPEN, () => {
      audio.setAmbient(0.18, 2)
      ctx.transition(new ChapterCardScene(), 1.8, 1.2)
    })
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    drawBackground(w, this.doorOpen)
    drawClutter(w, (id) => ctx.state.isResolved(id))
    this.drawChoreHints(w, ctx)

    // Ordena móveis e Liam pela base, para ele passar atrás e na frente.
    const layers = [
      ...PROPS,
      { baseY: this.player.y, draw: (c: CanvasRenderingContext2D) => this.player.draw(c, LAMP) },
    ].sort((a, b) => a.baseY - b.baseY)
    for (const l of layers) l.draw(w)

    drawLighting(w, this.time)
    this.drawEyelids(w)
    ctx.display.applyGrain(0.05)
    ctx.display.present()
    ctx.display.vignette(0.72)

    this.drawPrompt(ctx)
    this.drawPocket(ctx)
    this.dialogue.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
  }

  /**
   * Antes de ler o diário, Liam não "vê" a bagunça. Depois, o que falta pulsa
   * de leve — é ele notando, não uma seta de interface.
   */
  private drawChoreHints(c: CanvasRenderingContext2D, ctx: SceneCtx): void {
    if (!ctx.state.diaryRead || ctx.state.tidy) return
    const pulse = 0.14 + Math.sin(this.time * 2.4) * 0.09
    c.save()
    c.globalCompositeOperation = 'lighter'
    for (const it of INTERACTABLES) {
      if (!it.chore || ctx.state.isResolved(it.id)) continue
      c.fillStyle = `rgba(217,178,95,${pulse})`
      c.fillRect(it.rect.x - 2, it.rect.y - 2, it.rect.w + 4, it.rect.h + 4)
    }
    c.restore()
  }

  /** Abertura das pálpebras no despertar. */
  private drawEyelids(c: CanvasRenderingContext2D): void {
    if (this.wake >= 1) return
    const e = 1 - this.wake
    const h = (WORLD_H / 2) * e * e
    c.fillStyle = '#000'
    c.fillRect(0, 0, WORLD_W, h)
    c.fillRect(0, WORLD_H - h, WORLD_W, h)
  }

  private drawPrompt(ctx: SceneCtx): void {
    if (!this.target || this.dialogue.active || this.leaving) return
    const c = ctx.display.ctx
    const d = ctx.display
    const sx = d.toScreenX(this.player.x)
    const sy = d.toScreenY(this.player.y - 30)
    const size = Math.max(12, Math.min(d.cssW / 70, 17))
    const label = `${this.target.label}`
    c.save()
    c.font = `${size}px ${FONT_BODY}`
    c.textAlign = 'center'
    const tw = c.measureText(label).width
    const padX = size * 0.7
    const boxW = tw + padX * 2
    c.fillStyle = 'rgba(4,6,11,0.8)'
    c.fillRect(sx - boxW / 2, sy - size * 1.1, boxW, size * 1.85)
    c.fillStyle = PAL.ink
    c.fillText(label, sx, sy + size * 0.35)
    c.restore()
  }

  /** Os objetos que Liam guardou, como ícones pequenos no canto. */
  private drawPocket(ctx: SceneCtx): void {
    const items = ctx.state.inventory
    if (items.length === 0) return
    const c = ctx.display.ctx
    const d = ctx.display
    const size = Math.max(10, Math.min(d.cssW / 90, 14))
    const pad = size * 1.6
    c.save()
    c.font = `${size}px ${FONT_BODY}`
    c.fillStyle = PAL.inkFaint
    c.fillText('no bolso', pad, d.cssH - pad - size * 1.6)
    c.fillStyle = PAL.inkDim
    let y = d.cssH - pad
    for (const it of [...items].reverse().slice(0, 5)) {
      c.fillStyle = PAL.accent
      c.fillRect(pad, y - size * 0.7, size * 0.4, size * 0.4)
      c.fillStyle = PAL.inkDim
      c.fillText(it.name, pad + size * 1.1, y)
      y -= size * 1.45
    }
    c.restore()
  }
}
