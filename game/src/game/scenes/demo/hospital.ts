import type { Scene, SceneCtx } from '../types'
import type { Ponto } from '../../systems/salvo'
import { Dialogue, FONT_BODY } from '../../systems/dialogue'
import { PAL } from '../../../engine/constants'
import { audio, sons } from '../../../engine/audio'
import { musica } from '../../../engine/musica'
import { principal } from '../../../engine/principal'
import { Camada } from '../../ui/camada'
import {
  RADIO_ESTACAO, RADIO_BOLETIM, RADIO_DESTAQUE, ABERTURA_LIA, HOSPITAL_GRITO,
} from '../../content/demoScript'
import { PrologoScene } from './prologo'
import { CasaScene } from './casa'

export type VarianteHospital = 'abertura' | 'grito'

type Fase = 'preto' | 'sinal' | 'radio' | 'voz' | 'saida'

const CPS = 34

/**
 * O mundo de fora, que só existe como som.
 *
 * Duas vezes na demo a tela fica preta e o jogo vira ouvido. Nenhuma das
 * duas diz onde Liam está: que ele está em coma é coisa que o jogo só conta
 * no fim. Antes disso, é pista para quem for juntando.
 *
 * - **abertura**: o rádio dá a hora certa e um boletim em linguagem de
 *   jornal — incêndio, uma pessoa morta, o pai ileso. Não diz quem morreu
 *   nem quem foi levado. Depois, no escuro, a voz da Lia falando com o Liam,
 *   brava, de um lugar que ela não diz qual é.
 * - **grito**: cinco segundos de nada absoluto (nenhuma tecla funciona), um
 *   bipe disparado e a Lia gritando que ele apertou a mão dela.
 *
 * Os bipes, nas duas — a hora certa do rádio, o aparelho do grito —, têm um
 * trecho que não é ritmo de nada.
 */
export class HospitalScene implements Scene {
  readonly id = 'demo-hospital'

  private dialogue = new Dialogue()
  private camada = new Camada()
  private fase: Fase = 'preto'
  private t = 0
  private tFase = 0
  private linha = 0
  private revelado = 0
  private proxBip = 0
  private intervalo = 1
  private morseAte = 0
  private pulso = 0

  readonly ponto: Ponto

  constructor(private readonly variante: VarianteHospital = 'abertura') {
    this.ponto = variante === 'abertura' ? 'abertura' : 'grito'
  }

  /** Os cinco segundos de preto depois do grito não abrem nem a pausa. */
  podePausar(): boolean {
    return !(this.variante === 'grito' && this.fase === 'preto')
  }

  enter(ctx: SceneCtx): void {
    principal.cortar()
    musica.setPad(0, 0.3)
    audio.setAmbient(0, 0.3)
    audio.setArgument(0, 0.2)
    if (this.variante === 'abertura') {
      sons.iniciarRadio()
      sons.radio(0, 0, 0.1)
      ctx.state.aprender('radio')
    }
  }

  get faseAtual(): Fase {
    return this.fase
  }

  /** Há texto esperando um toque (o boletim, ou a voz da Lia). */
  get ocupado(): boolean {
    return this.fase === 'radio' || this.dialogue.active
  }

  private mudar(f: Fase): void {
    this.fase = f
    this.tFase = 0
  }

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt
    this.tFase += dt
    this.camada.update(dt)
    this.dialogue.update(dt)
    this.pulso = Math.max(0, this.pulso - dt * 3)

    if (this.fase === 'preto') {
      // Nada responde. É de propósito.
      ctx.input.consumeConfirm()
      ctx.input.consumeTap()
      ctx.input.consumeAny()
      const espera = this.variante === 'grito' ? 5 : 0.8
      if (this.tFase >= espera) {
        if (this.variante === 'abertura') {
          // O rádio liga no meio da hora certa.
          sons.radio(0.08, 0, 1.2)
          this.comecarSinal(1)
        } else {
          this.comecarSinal(0.42)
          this.camada.mostrar(ctx.state, 'hospital')
        }
      }
      return
    }

    if (this.fase === 'radio') this.radio(dt, ctx)
    else if (this.fase === 'sinal' || this.fase === 'voz') this.sinal(ctx)
    else if (this.fase === 'saida') this.sair(ctx)
  }

  /** O boletim: uma frase por vez, a voz do rádio só enquanto ela se escreve. */
  private radio(dt: number, ctx: SceneCtx): void {
    if (this.tFase < 1.2) return
    const frase = RADIO_BOLETIM[this.linha]
    if (frase === undefined) {
      if (this.tFase > 2.2) {
        // O rádio desliga. Fica o escuro, e alguém falando nele.
        sons.radio(0, 0, 1.4)
        this.mudar('voz')
        this.dialogue.play(ABERTURA_LIA, () => this.mudar('saida'), 1.6)
      }
      return
    }
    const confirmou = ctx.input.consumeConfirm()
    if (this.revelado < frase.length) {
      const antes = this.revelado
      this.revelado = confirmou ? frase.length : Math.min(frase.length, this.revelado + dt * CPS)
      if (Math.floor(antes / 3) !== Math.floor(this.revelado / 3)) audio.type()
      sons.radio(0.1, 0.05, 0.15)
      this.desdeFrase = 0
      return
    }
    // Cada frase fica na tela até o jogador tocar: lê no tempo dele.
    sons.radio(0.1, 0.006, 0.3)
    this.desdeFrase += dt
    if (confirmou) {
      this.linha++
      this.revelado = 0
      this.desdeFrase = 0
      if (this.linha >= RADIO_BOLETIM.length) this.tFase = 0
    }
  }

  private desdeFrase = 0

  private comecarSinal(intervalo: number): void {
    this.mudar('sinal')
    this.intervalo = intervalo
    this.proxBip = this.t + 0.4
  }

  private bipes = 0

  /**
   * Os bipes. Na abertura, a hora certa do rádio; no grito, um aparelho
   * disparado. No quinto, os dois perdem o ritmo — por um trecho.
   */
  private sinal(ctx: SceneCtx): void {
    if (this.fase === 'voz') {
      if (this.dialogue.active && ctx.input.consumeConfirm()) this.dialogue.confirm()
      if (this.variante === 'abertura') return
    }
    if (this.t >= this.proxBip && this.t >= this.morseAte) {
      this.bipes++
      if (this.bipes === 5) {
        const dur = sons.morse('AJUDA')
        this.morseAte = this.t + dur + 0.5
        this.proxBip = this.morseAte
        this.pulso = 1
      } else {
        sons.bip()
        this.pulso = 1
        this.proxBip = this.t + this.intervalo
      }
    }

    if (this.fase === 'sinal' && this.bipes >= 7 && this.t >= this.morseAte) {
      if (this.variante === 'abertura') {
        // Depois da hora certa, o boletim.
        this.mudar('radio')
        sons.radio(0.11, 0, 0.6)
        return
      }
      this.mudar('voz')
      this.dialogue.play(HOSPITAL_GRITO, () => {
        this.mudar('saida')
        this.intervalo = 0.95
      }, 1.3)
    }
  }

  private sair(ctx: SceneCtx): void {
    if (this.variante === 'grito' && this.t >= this.proxBip) {
      sons.bip()
      this.pulso = 1
      this.proxBip = this.t + this.intervalo
    }
    if (this.tFase > 2.4 && this.fase === 'saida') {
      this.fase = 'preto'
      this.tFase = -999
      const prox = this.variante === 'abertura' ? new PrologoScene() : new CasaScene({ depois: true })
      ctx.transition(prox, 1.6, 2.2)
    }
  }

  render(ctx: SceneCtx): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    c.save()
    c.fillStyle = '#000'
    c.fillRect(0, 0, cssW, cssH)

    if (this.variante === 'abertura' && (this.fase === 'sinal' || this.fase === 'radio' || (this.fase === 'voz' && this.tFase < 1.5))) {
      this.desenharBoletim(c, cssW, cssH)
    }

    // O aparelho não aparece. O que aparece é o som dele: uma linha que pulsa.
    if (this.variante === 'grito' && this.fase !== 'preto') {
      const s = Math.max(1, cssW / 900)
      c.globalAlpha = 0.08 + this.pulso * 0.3
      c.fillStyle = '#cfd6e6'
      const w = cssW * 0.16
      c.fillRect(cssW / 2 - w / 2, cssH * 0.42, w, s)
      if (this.pulso > 0.2) c.fillRect(cssW / 2 - s, cssH * 0.42 - this.pulso * cssH * 0.03, s * 2, this.pulso * cssH * 0.06)
      c.globalAlpha = 1
    }
    c.restore()

    this.camada.draw(c, cssW, cssH)
    this.dialogue.render(c, cssW, cssH)
  }

  private desenharBoletim(c: CanvasRenderingContext2D, cssW: number, cssH: number): void {
    const s = Math.max(15, Math.min(cssW / 52, 24))
    const some = this.fase === 'voz' ? Math.max(0, 1 - this.tFase / 1.4) : 1
    const entra = this.fase === 'sinal' ? Math.min(1, this.tFase / 1.5) : 1
    c.save()
    c.textAlign = 'center'
    c.globalAlpha = 0.5 * some * entra
    c.fillStyle = PAL.inkDim
    c.font = `${s * 0.66}px ${FONT_BODY}`
    c.letterSpacing = '0.3em'
    c.fillText(RADIO_ESTACAO, cssW / 2, cssH * 0.16)
    c.letterSpacing = '0em'

    if (this.fase === 'sinal') {
      c.restore()
      return
    }
    c.font = `300 ${s}px ${FONT_BODY}`
    const visiveis = Math.min(this.linha + 1, RADIO_BOLETIM.length)
    const inicio = Math.max(0, visiveis - 5)
    let y = cssH * 0.3
    for (let i = inicio; i < visiveis; i++) {
      const frase = RADIO_BOLETIM[i] ?? ''
      const texto = i === this.linha ? frase.slice(0, Math.floor(this.revelado)) : frase
      const atual = i === this.linha
      c.globalAlpha = (atual ? 0.95 : 0.42) * some
      c.fillStyle = i === RADIO_DESTAQUE ? '#f2ead8' : PAL.ink
      c.fillText(texto, cssW / 2, y)
      y += s * 2
    }
    // A frase terminou: o quadradinho pisca até o jogador tocar.
    const atual = RADIO_BOLETIM[this.linha]
    if (this.fase === 'radio' && atual !== undefined && this.revelado >= atual.length && Math.floor(this.t * 2) % 2 === 0) {
      c.globalAlpha = 0.6
      c.fillStyle = PAL.inkDim
      const q = Math.max(6, s * 0.36)
      c.fillRect(Math.round(cssW / 2 - q / 2), Math.round(y - s * 1.1), q, q)
    }
    c.restore()
  }
}
