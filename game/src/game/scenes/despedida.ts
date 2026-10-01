import type { Scene, SceneCtx } from './types'
import { FONT_BODY, FONT_FIM } from '../systems/dialogue'
import { PAL } from '../../engine/constants'
import { audio, sons } from '../../engine/audio'
import { musica } from '../../engine/musica'
import { principal } from '../../engine/principal'
import { sairDoJogo, fechaDeVerdade } from '../../engine/plataforma'
import { salvo } from '../systems/salvo'

/**
 * Sair.
 *
 * Na versão de computador, o jogo fecha aqui. No navegador uma página não
 * pode fechar a própria aba, então o que fica é isto: preto, e uma frase
 * que o Liam nunca ouviu de ninguém. Um clique volta para o menu.
 */
export class DespedidaScene implements Scene {
  readonly id = 'despedida'
  private t = 0
  private salvou = false

  enter(): void {
    this.salvou = salvo.existe
    principal.parar(1.6)
    musica.setPad(0, 1.6)
    audio.silenciar(1.6)
    sons.silenciar(0.6)
    void sairDoJogo()
  }

  podePausar(): boolean {
    return false
  }

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt
    if (this.t > 2.2 && (ctx.input.consumeConfirm() || ctx.input.consumeTap() || ctx.input.consumeKey('Escape'))) {
      ctx.menu()
    }
  }

  render(ctx: SceneCtx): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    c.fillStyle = '#000'
    c.fillRect(0, 0, cssW, cssH)
    // Na versão de computador a janela já está fechando: nada para ler.
    if (fechaDeVerdade()) return

    const s = Math.max(16, Math.min(cssW / 38, 34))
    const janela = (ini: number, dur: number) => Math.max(0, Math.min(1, (this.t - ini) / dur))
    c.save()
    c.textAlign = 'center'
    c.globalAlpha = janela(0.6, 1.6) * 0.92
    c.fillStyle = PAL.ink
    c.font = `italic 400 ${s}px ${FONT_FIM}`
    c.fillText('Tudo bem parar um pouco.', cssW / 2, cssH * 0.47)

    const p = s * 0.5
    c.globalAlpha = janela(2.0, 1.4) * 0.5
    c.fillStyle = PAL.inkDim
    c.font = `300 ${p}px ${FONT_BODY}`
    c.letterSpacing = '0.2em'
    const aviso = this.salvou ? 'O JOGO ESTÁ SALVO  ·  PODE FECHAR ESTA JANELA' : 'PODE FECHAR ESTA JANELA'
    c.fillText(aviso, cssW / 2, cssH * 0.47 + s * 1.6)

    c.globalAlpha = janela(3.4, 1.4) * (0.22 + Math.sin(this.t * 1.6) * 0.1)
    c.fillStyle = PAL.inkFaint
    c.fillText('ontouchstart' in window ? 'TOQUE PARA VOLTAR AO MENU' : 'CLIQUE PARA VOLTAR AO MENU', cssW / 2, cssH - p * 4.4)
    c.restore()
  }
}
