import type { Display } from '../../engine/display'
import type { Input } from '../../engine/input'
import type { GameState } from '../systems/state'

export interface SceneCtx {
  display: Display
  input: Input
  state: GameState
  /** Escurece, troca de cena e clareia. */
  transition(next: Scene, outSec?: number, inSec?: number): void
}

export interface Scene {
  /** Identificador estável, imune à minificação. Serve para salvar e depurar. */
  readonly id: string
  enter?(ctx: SceneCtx): void
  update(dt: number, ctx: SceneCtx): void
  render(ctx: SceneCtx): void
}
