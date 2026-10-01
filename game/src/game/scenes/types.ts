import type { Display } from '../../engine/display'
import type { Input } from '../../engine/input'
import type { GameState } from '../systems/state'
import type { Ponto } from '../systems/salvo'

export interface SceneCtx {
  display: Display
  input: Input
  state: GameState
  /** Escurece, troca de cena e clareia. */
  transition(next: Scene, outSec?: number, inSec?: number): void
  /** Cala a cena e volta ao menu, que já abre pronto. */
  menu(): void
}

export interface Scene {
  /** Identificador estável, imune à minificação. Serve para salvar e depurar. */
  readonly id: string
  /**
   * Ponto de salvamento: chegar a esta cena grava o jogo (systems/salvo.ts).
   * Cenas sem ponto — o menu — não gravam nada.
   */
  readonly ponto?: Ponto
  /**
   * Falso enquanto abrir a pausa estragaria o momento: o preto absoluto do
   * grito, em que nenhuma tecla funciona de propósito. Sem o método, pode.
   */
  podePausar?(): boolean
  enter?(ctx: SceneCtx): void
  update(dt: number, ctx: SceneCtx): void
  render(ctx: SceneCtx): void
}
