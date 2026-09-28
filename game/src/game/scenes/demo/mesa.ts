import type { Scene, SceneCtx } from '../types'
import { Dialogue, FONT_BODY } from '../../systems/dialogue'
import { PAL, WORLD_W } from '../../../engine/constants'
import { audio } from '../../../engine/audio'
import { Figura } from '../../world/figura'
import { Particulas } from '../../world/particulas'
import {
  MESA_ABERTURA, MESA_CONFRONTO, MESA_PENSAMENTO, MESA_FUGA, MESA_FECHO,
  MESA_VESTIGIOS, MESA_PRATOS, PUXAO_ADRIAN, PUXAO_EVELYN, PUXAO_LIA,
} from '../../content/demoScript'
import { TearScene } from './tear'
import type { EstadoCozinha } from '../../world/cozinha'
import {
  drawCozinhaFundo, drawCozinhaFrente, drawCozinhaLuz, COZ_CHAO, LAMPADA, PANELA,
} from '../../world/cozinha'

const CHAO = 160
const LIMITE_ESQ = 84
const LIMITE_DIR = 306
const ALCAPAO = 214

type Fase = 'abertura' | 'confronto' | 'preso' | 'fuga'

/** Onde fica o quinto prato, na mesa da frente. */
const PRATOS_X = 232

/**
 * A Mesa.
 *
 * O elo que faltava entre a música e o porão: aqui o jogador descobre, com o
 * corpo, por que Liam desce. Ele pode andar entre a mãe e o pai, e é puxado
 * pelos dois — chegar perto de um faz o outro chamar. **Não existe ponto
 * neutro.** A tensão sobe de qualquer jeito, as paredes fecham, e quando não
 * há mais para onde ir ele corre para o único lugar onde acha que resolve.
 */
export class MesaScene implements Scene {
  readonly id = 'demo-mesa'

  private dialogue = new Dialogue()
  private fase: Fase = 'abertura'
  private t = 0
  private tensao = 0
  private po = new Particulas()

  private liam = new Figura({
    x: 232, y: CHAO, altura: 31,
    cor: { roupa: '#252a3a', cabelo: '#12151f', pele: '#6d5a52', sombra: 'rgba(0,0,0,0.5)' },
  })
  // Evelyn: uniforme do trabalho, cabelo comprido solto. O casaco está na
  // cadeira — pronto para sair.
  private evelyn = new Figura({
    x: 132, y: CHAO, altura: 38, cabelo: 'longo', gola: '#a8b4bc',
    cor: { roupa: '#3e5664', cabelo: '#2a1a16', pele: '#7a5a4e', sombra: 'rgba(0,0,0,0.5)' },
  })
  // Adrian: o mais alto, barba, camisa escura de gola clara. Calmo.
  private adrian = new Figura({
    x: 292, y: CHAO, altura: 42, barba: true, gola: '#d4ccc0',
    cor: { roupa: '#2e2430', cabelo: '#16100f', pele: '#7a584c', sombra: 'rgba(0,0,0,0.5)' },
  })
  // Lia: quatorze anos, rabo de cavalo, moletom vinho e a mochila nas costas.
  private lia = new Figura({
    x: 92, y: CHAO, altura: 32, cabelo: 'rabo', mochila: '#2e3e56',
    cor: { roupa: '#6a2c38', cabelo: '#1e1214', pele: '#7a6052', sombra: 'rgba(0,0,0,0.5)' },
  })

  private puxao = ''
  private puxaoQuem: 'Adrian' | 'Evelyn' | 'Lia' = 'Adrian'
  private puxaoAte = 0
  private proxPuxao = 3
  private idxPuxao = 0
  private idxPensamento = 0
  /** Vestígios já examinados. É a única coisa que o jogador muda aqui. */
  private achados = new Set<string>()
  private pratosVistos = false
  private panoTirado = false
  /** Destino de um clique. Liam anda sozinho até lá. */
  private destino: number | null = null
  private desdeQuePreso = 0
  private examinarAoChegar = false

  enter(): void {
    audio.setAmbient(0.5, 2)
    audio.startArgument()
    audio.setArgument(0.16, 3)
    this.dialogue.play(MESA_ABERTURA, () => {
      this.fase = 'confronto'
      this.dialogue.play(MESA_CONFRONTO, () => {
        this.fase = 'preso'
      }, 1.5)
    })
  }

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt
    this.dialogue.update(dt)
    this.po.update(dt)
    for (const f of [this.liam, this.evelyn, this.adrian, this.lia]) f.update(dt)

    // Fumaça fina saindo da panela esquecida no fogo. Ninguém olha.
    if (Math.random() < dt * (this.panoTirado ? 3 : 6)) this.po.poeira(PANELA.x - 4, PANELA.y - 8, 8, 3, 'rgba(170,166,176,')

    this.encarar()

    const cinematico = this.fase === 'confronto' || this.fase === 'fuga'
    if (this.dialogue.active) {
      if (!cinematico && ctx.input.consumeConfirm()) this.dialogue.confirm()
      if (!cinematico) return
    }

    if (this.fase === 'preso') this.preso(dt, ctx)
    else if (this.fase === 'fuga') this.fugir(dt, ctx)
  }

  /** Todo mundo olha para Liam. É esse o peso da cena. */
  private encarar(): void {
    const paraLiam = (f: Figura) => {
      f.olhar = Math.max(-1, Math.min(1, (this.liam.x - f.x) / 60))
    }
    paraLiam(this.evelyn)
    paraLiam(this.adrian)
    paraLiam(this.lia)
    this.evelyn.ofego = 1 + this.tensao
    this.adrian.ofego = 1 + this.tensao * 0.4
    this.liam.ofego = 1 + this.tensao * 2.2
    this.liam.curvatura = this.tensao * 0.35
    this.liam.tremor = this.tensao > 0.6 ? (this.tensao - 0.6) * 2 : 0
  }

  private preso(dt: number, ctx: SceneCtx): void {
    // Carência curta ao entrar na fase: um confirmar que sobrou de fechar a
    // fala anterior não pode examinar nada sozinho.
    this.desdeQuePreso += dt
    if (this.desdeQuePreso < 0.35) {
      ctx.input.consumeConfirm()
      ctx.input.consumeTap()
      return
    }

    // Examinar o que estiver ao alcance
    // Igual à casa: um clique vale como destino, não como usar o que está ao
    // lado — senão clicar para andar examinaria o objeto embaixo dos pés.
    const tap = ctx.input.consumeTap()
    const confirmou = ctx.input.consumeConfirm()
    const perto = this.vestigioPerto()
    if (!tap && confirmou && perto && !this.achados.has(perto.id)) {
      this.examinar(perto)
      return
    }
    if (!tap && confirmou && !perto && this.pratosPerto() && !this.pratosVistos) {
      this.contarPratos(ctx)
      return
    }

    // Andar. O teclado manda direto; o clique vira destino e Liam vai
    // sozinho até lá — clicar de quadro em quadro seria insuportável.
    const eixo = ctx.input.moveAxis()
    let dx = eixo ? eixo.x : 0
    if (eixo) this.destino = null

    if (tap) {
      const alvo = ctx.display.toWorldX(tap.x)
      // Clique em cima de um vestígio: anda até ele e examina ao chegar.
      const v = MESA_VESTIGIOS.find((c) => Math.abs(c.x - alvo) < 24)
      this.destino = v ? v.x : alvo
      this.examinarAoChegar = Boolean(v)
    }

    if (this.destino !== null && dx === 0) {
      const d = this.destino - this.liam.x
      if (Math.abs(d) < 3) {
        this.destino = null
        if (this.examinarAoChegar) {
          this.examinarAoChegar = false
          const v = this.vestigioPerto()
          if (v && !this.achados.has(v.id)) {
            this.examinar(v)
            return
          }
        }
      } else {
        dx = Math.sign(d)
      }
    }

    this.liam.x = Math.max(LIMITE_ESQ, Math.min(LIMITE_DIR, this.liam.x + dx * 42 * dt))

    // A tensão sobe sozinha. Ficar parado não é neutro: é mais um jeito de
    // não decidir, e a casa cobra igual.
    this.tensao = Math.min(1, this.tensao + dt * 0.055)
    audio.setArgument(0.16 + this.tensao * 0.42, 0.6)

    // Quem chama é sempre o que está mais longe.
    if (this.t > this.proxPuxao && this.puxaoAte < this.t) {
      const dEve = Math.abs(this.liam.x - this.evelyn.x)
      const dAdr = Math.abs(this.liam.x - this.adrian.x)
      if (dEve < dAdr) this.chamar('Adrian', PUXAO_ADRIAN)
      else if (Math.random() < 0.25) this.chamar('Lia', PUXAO_LIA)
      else this.chamar('Evelyn', PUXAO_EVELYN)
      this.proxPuxao = this.t + 3.4
    }

    // Três pensamentos, marcando o desmoronamento.
    const marco = Math.floor(this.tensao * 3)
    if (marco > this.idxPensamento && marco <= 3) {
      const linhas = MESA_PENSAMENTO[this.idxPensamento]
      this.idxPensamento = marco
      if (linhas) this.dialogue.play(linhas, undefined, 1.6)
    }

    if (this.tensao >= 1) {
      this.fase = 'fuga'
      audio.refuse()
      // O fecho depende de quanto ele viu — nunca do que ele conseguiu mudar.
      const n = this.achados.size
      const fecho = MESA_FECHO[n >= 4 ? 4 : n >= 2 ? 2 : 0] ?? MESA_FUGA
      this.dialogue.play(fecho, () => {
        audio.setArgument(0.1, 1)
        ctx.transition(new TearScene(), 1.6, 1.6)
      }, 1.7)
    }
  }

  /** Ele corre para o alçapão. O jogador não controla mais nada. */
  private fugir(dt: number, ctx: SceneCtx): void {
    const dx = Math.sign(ALCAPAO - this.liam.x)
    this.liam.x += dx * 70 * dt
    this.liam.braco = 0.6
    void ctx
  }

  private examinar(v: (typeof MESA_VESTIGIOS)[number]): void {
    this.achados.add(v.id)
    if (v.id === 'fogao') this.panoTirado = true
    audio.interact()
    this.dialogue.play(v.linhas)
  }

  /**
   * Os pratos não contam como vestígio e não mudam o fecho. Estão ali para
   * quem reparar: cinco pratos numa casa de quatro.
   */
  private contarPratos(ctx: SceneCtx): void {
    this.pratosVistos = true
    audio.interact()
    this.dialogue.play(MESA_PRATOS, () => {
      if (ctx.state.descobrir('pratos')) audio.segredo()
    })
  }

  private pratosPerto(): boolean {
    return Math.abs(PRATOS_X - this.liam.x) < 10
  }

  /** O vestígio ao alcance de Liam, se houver. */
  private vestigioPerto(): (typeof MESA_VESTIGIOS)[number] | null {
    for (const v of MESA_VESTIGIOS) {
      if (Math.abs(v.x - this.liam.x) < 17) return v
    }
    return null
  }

  private chamar(quem: 'Adrian' | 'Evelyn' | 'Lia', falas: string[]): void {
    this.puxaoQuem = quem
    this.puxao = falas[this.idxPuxao % falas.length] ?? ''
    this.idxPuxao++
    this.puxaoAte = this.t + 3
    audio.interact()
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    const e = this.estadoCozinha
    drawCozinhaFundo(w, e)
    this.lia.draw(w, LAMPADA.x, 'rgba(220,190,160,0.3)')
    this.evelyn.draw(w, LAMPADA.x, 'rgba(220,190,160,0.3)')
    this.adrian.draw(w, LAMPADA.x, 'rgba(220,190,160,0.3)')
    // A chave da porta no bolso dele. Brilha de vez em quando.
    if (Math.sin(this.t * 1.7) > 0.93) {
      w.fillStyle = 'rgba(236,200,120,0.9)'
      w.fillRect(Math.round(this.adrian.x) + 3, COZ_CHAO - 15, 1, 1)
    }
    this.liam.draw(w, LAMPADA.x, 'rgba(220,200,180,0.3)')
    this.po.draw(w, false)
    drawCozinhaLuz(w, e)
    drawCozinhaFrente(w, PRATOS_X)

    ctx.display.applyGrain(0.05 + this.tensao * 0.04)
    // As paredes fecham conforme a tensão: o cômodo encolhe em volta dele.
    ctx.display.present({
      rgbSplit: this.tensao * 0.7,
      wave: 0,
      shake: this.tensao * this.tensao * 0.8,
      zoom: 1.2 + this.tensao * 0.34,
      alvoX: this.liam.x * 0.35 + WORLD_W / 2 * 0.65,
      alvoY: 112,
      time: this.t,
    })
    ctx.display.vignette(0.66 + this.tensao * 0.2)

    this.drawAviso(ctx)
    this.drawPuxao(ctx)
    this.dialogue.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
  }

  private get estadoCozinha(): EstadoCozinha {
    return { t: this.t, tensao: this.tensao, panoTirado: this.panoTirado }
  }

  /** Aviso de que há algo ao alcance, e quantos ele já viu. */
  private drawAviso(ctx: SceneCtx): void {
    if (this.fase !== 'preso') return
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const s = Math.max(12, Math.min(cssW / 70, 17))
    c.save()
    c.textAlign = 'center'
    c.font = `${s}px ${FONT_BODY}`

    const perto = this.vestigioPerto()
    const pratos = !perto && this.pratosPerto() && !this.pratosVistos
    if ((perto && !this.achados.has(perto.id)) || pratos) {
      const sx = ctx.display.toScreenX(this.liam.x)
      const sy = ctx.display.toScreenY(this.liam.y - 40)
      const txt = perto ? perto.rotulo : 'Contar os pratos'
      const w = c.measureText(txt).width + s * 3.2
      c.fillStyle = 'rgba(4,6,11,0.82)'
      c.fillRect(sx - w / 2, sy - s, w, s * 1.9)
      c.textAlign = 'left'
      c.fillStyle = PAL.accent
      c.fillText('E', sx - w / 2 + s * 0.7, sy + s * 0.45)
      c.fillStyle = PAL.ink
      c.fillText(txt, sx - w / 2 + s * 2, sy + s * 0.45)
      c.textAlign = 'center'
    }

    c.globalAlpha = 0.45
    c.fillStyle = PAL.inkDim
    c.font = `${s * 0.92}px ${FONT_BODY}`
    c.fillText(
      `${this.achados.size}/${MESA_VESTIGIOS.length} · ← → anda · E examina`,
      cssW / 2, cssH - s * 2,
    )
    c.restore()
  }

  /** Quem está longe chama. O nome aparece do lado de quem falou. */
  private drawPuxao(ctx: SceneCtx): void {
    if (this.t > this.puxaoAte || !this.puxao) return
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const size = Math.max(15, Math.min(cssW / 46, 26))
    const a = Math.min(1, (this.puxaoAte - this.t) / 0.6)
    const esquerda = this.puxaoQuem !== 'Adrian'
    c.save()
    c.globalAlpha = a
    c.textAlign = esquerda ? 'left' : 'right'
    const x = esquerda ? cssW * 0.06 : cssW * 0.94
    c.font = `${size * 0.78}px ${FONT_BODY}`
    c.letterSpacing = '0.14em'
    c.fillStyle = PAL.accent
    c.fillText(this.puxaoQuem.toUpperCase(), x, cssH * 0.14)
    c.letterSpacing = '0em'
    c.font = `${size}px ${FONT_BODY}`
    c.fillStyle = PAL.ink
    c.fillText(this.puxao, x, cssH * 0.14 + size * 1.7)
    c.restore()
  }
}
