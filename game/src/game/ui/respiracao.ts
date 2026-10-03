import type { Input } from '../../engine/input'
import { FONT_BODY, FONT_FIM, FIO } from '../systems/dialogue'
import { PAL } from '../../engine/constants'
import { sons, audio } from '../../engine/audio'

/**
 * Respirar.
 *
 * O que a mãe ensinou: quatro pra dentro, quatro pra fora. Um anel claro
 * cresce e encolhe no ritmo certo, contando de um a quatro; o círculo de
 * dentro é o ar do Liam — cresce enquanto o jogador segura (espaço, E, ou o
 * dedo na tela) e esvazia quando ele solta. Acompanhar o anel é conseguir
 * respirar, e dá para ver: quando o ar acompanha, o escuro em volta abre e
 * o coração desacelera; quando escapa, a tela fecha.
 *
 * A mãe ensina isso no corredor, antes de qualquer coisa dar errado, numa
 * versão em que não dá para errar (`ensino`): ela conta junto.
 *
 * Não tem botão de pular: quem não segura nada também está respirando — mal.
 */
export interface OpcoesRespiracao {
  /** Quantas vezes o ar entra e sai. */
  ciclos: number
  /** Segundos de um ciclo inteiro (puxa + solta). */
  periodo: number
  /** Erro médio aceito para contar como conseguiu (0..1). */
  tolerancia?: number
  /** A mãe ensinando: ela conta em voz alta e não existe errar. */
  ensino?: boolean
  onFim: (conseguiu: boolean) => void
}

/** O começo é para entender: o primeiro meio segundo não conta. */
const CARENCIA = 0.6

export class Respiracao {
  private o: OpcoesRespiracao | null = null
  private t = 0
  /** 0..1: o ar dentro dele. */
  private ar = 0
  /** 0..1: onde o ar devia estar. */
  private guia = 0
  private erro = 0
  private medido = 0
  private segurava = false
  private fechando = 0
  private resultado: boolean | null = null
  /** 0..1: o quanto o ar está fora do ritmo agora. Fecha a tela em volta. */
  private aperto = 0
  /** Para os testes: o último resultado. */
  ultimo: boolean | null = null

  get ativa(): boolean {
    return this.o !== null
  }

  /** O erro médio até aqui (para os testes e para a cor do anel). */
  get erroMedio(): number {
    return this.medido > 0 ? this.erro / this.medido : 0
  }

  /** O anel agora: puxando ou soltando. */
  get puxando(): boolean {
    if (!this.o) return false
    return (this.t % this.o.periodo) < this.o.periodo / 2
  }

  /** Interrompe sem chamar o fim (a cena foi engolida por outra coisa). */
  cancelar(): void {
    this.o = null
  }

  comecar(o: OpcoesRespiracao): void {
    this.o = o
    this.t = 0
    this.ar = 0
    this.guia = 0
    this.erro = 0
    this.medido = 0
    this.segurava = false
    this.fechando = 0
    this.resultado = null
    this.aperto = 0
  }

  update(dt: number, input: Input): void {
    const o = this.o
    if (!o) return
    // O que for apertado aqui é respiração, não fala nem passo.
    input.consumeConfirm()
    input.consumeTap()
    if (this.resultado !== null) {
      this.fechando += dt
      if (this.fechando > 0.7) {
        const r = this.resultado
        this.o = null
        this.ultimo = r
        o.onFim(r)
      }
      return
    }
    this.t += dt
    const segura = input.held('Space') || input.held('KeyE') || input.held('Enter') || input.pointerDown
    const meio = o.periodo / 2
    this.ar = Math.max(0, Math.min(1, this.ar + (segura ? 1 : -1) * dt / meio))
    this.guia = 0.5 - 0.5 * Math.cos((2 * Math.PI * this.t) / o.periodo)
    if (this.t > CARENCIA) {
      this.erro += Math.abs(this.ar - this.guia) * dt
      this.medido += dt
    }
    // O som acompanha o que o jogador faz, não o anel.
    if (segura !== this.segurava) {
      this.segurava = segura
      const aflito = this.erroMedio > 0.3 && this.medido > 1
      sons.respiro(segura, meio * 0.9, 0.9, aflito)
    }
    // O escuro em volta segue o erro recente, não o da conta inteira.
    this.aperto += (Math.min(1, Math.abs(this.ar - this.guia) * 2.2) - this.aperto) * Math.min(1, dt * 3)
    if (this.t >= o.ciclos * o.periodo) {
      this.resultado = o.ensino ? true : this.erroMedio <= (o.tolerancia ?? 0.2)
      audio.heartbeat(this.resultado ? 0.08 : 0.22)
    }
  }

  draw(c: CanvasRenderingContext2D, cssW: number, cssH: number, touch: boolean): void {
    const o = this.o
    if (!o) return
    const some = this.resultado !== null ? Math.max(0, 1 - this.fechando / 0.7) : Math.min(1, this.t / 0.4)
    const cx = cssW / 2
    const cy = cssH * 0.42
    const base = Math.min(cssW, cssH) * 0.06
    const cresce = base * 1.5
    const meio = o.periodo / 2
    const naFase = this.t % o.periodo
    const puxando = naFase < meio
    // 1, 2, 3, 4 em cada metade: a conta que a mãe faz.
    const conta = Math.min(4, Math.floor(((naFase % meio) / meio) * 4) + 1)
    c.save()
    c.globalAlpha = some
    // O mundo some em volta. Fora do ritmo, o escuro fecha; no ritmo, abre.
    const fecha = 0.25 + this.aperto * 0.55
    const v = c.createRadialGradient(cx, cy, base * (2.6 - this.aperto * 1.4), cx, cy, Math.max(cssW, cssH) * (0.75 - this.aperto * 0.25))
    v.addColorStop(0, 'rgba(2,3,8,0.3)')
    v.addColorStop(1, `rgba(2,3,8,${0.6 + fecha * 0.4})`)
    c.fillStyle = v
    c.fillRect(0, 0, cssW, cssH)

    // O anel do ritmo certo.
    const rg = base + this.guia * cresce
    c.strokeStyle = 'rgba(232,236,248,0.75)'
    c.lineWidth = Math.max(1.5, base * 0.05)
    c.beginPath()
    c.arc(cx, cy, rg, 0, Math.PI * 2)
    c.stroke()
    // O ar dele: azul quando acompanha, vermelho quando escapa.
    const longe = Math.min(1, Math.abs(this.ar - this.guia) * 2.5)
    const r = Math.round(150 + longe * 90)
    const g = Math.round(180 - longe * 90)
    const b = Math.round(230 - longe * 120)
    const ra = base * 0.6 + this.ar * cresce
    c.fillStyle = `rgba(${r},${g},${b},0.28)`
    c.beginPath()
    c.arc(cx, cy, ra, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = `rgba(${r},${g},${b},0.8)`
    c.lineWidth = Math.max(1, base * 0.03)
    c.stroke()

    // A conta, grande, no meio do anel.
    c.textAlign = 'center'
    const s = Math.max(15, Math.min(cssW / 46, 26))
    c.font = `500 ${s * 2.1}px ${FONT_FIM}`
    c.fillStyle = PAL.ink
    c.globalAlpha = some * 0.9
    c.fillText(String(conta), cx, cy + s * 0.7)
    c.font = `italic 400 ${s * 1.2}px ${FONT_FIM}`
    c.fillText(puxando ? 'puxa o ar...' : 'solta...', cx, cy + base + cresce + s * 1.8)
    // Os ciclos que faltam, em pontinhos.
    const feitos = Math.floor(this.t / o.periodo)
    for (let i = 0; i < o.ciclos; i++) {
      c.globalAlpha = some * (i < feitos ? 0.85 : 0.25)
      c.beginPath()
      c.arc(cx + (i - (o.ciclos - 1) / 2) * s, cy + base + cresce + s * 2.9, s * 0.16, 0, Math.PI * 2)
      c.fill()
    }
    // A mãe contando junto, quando é ela quem ensina.
    if (o.ensino) {
      const numeros = ['um...', 'dois...', 'três...', 'quatro...']
      c.font = `italic 500 ${s * 1.1}px ${FONT_BODY}`
      c.fillStyle = FIO.Evelyn ?? '#e2a95e'
      c.globalAlpha = some * 0.9
      c.fillText(`${numeros[conta - 1] ?? ''}`, cx, cy - base - cresce - s * 1.2)
    }
    // A instrução, sempre clara: o que apertar e quando.
    c.font = `400 ${s * 0.8}px ${FONT_BODY}`
    c.fillStyle = PAL.ink
    c.globalAlpha = some * 0.82
    const dica = touch
      ? 'segure o dedo na tela enquanto o círculo cresce  ·  solte enquanto ele diminui'
      : 'segure ESPAÇO enquanto o círculo cresce  ·  solte enquanto ele diminui'
    c.fillText(dica, cx, cssH - s * 2.2)
    c.restore()
  }
}
