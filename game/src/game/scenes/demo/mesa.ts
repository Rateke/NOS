import type { Scene, SceneCtx } from '../types'
import { Dialogue, FONT_BODY } from '../../systems/dialogue'
import { PAL, WORLD_W, WORLD_H } from '../../../engine/constants'
import { audio } from '../../../engine/audio'
import { Figura } from '../../world/figura'
import { Particulas } from '../../world/particulas'
import {
  MESA_ABERTURA, MESA_CONFRONTO, MESA_PENSAMENTO, MESA_FUGA,
  PUXAO_ADRIAN, PUXAO_EVELYN, PUXAO_LIA,
} from '../../content/demoScript'
import { TearScene } from './tear'

const CHAO = 160
const LIMITE_ESQ = 84
const LIMITE_DIR = 306
const ALCAPAO = 214

type Fase = 'abertura' | 'confronto' | 'preso' | 'fuga'

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
    x: 204, y: CHAO, altura: 31,
    cor: { roupa: '#252a3a', cabelo: '#12151f', pele: '#6d5a52', sombra: 'rgba(0,0,0,0.5)' },
  })
  private evelyn = new Figura({
    x: 132, y: CHAO, altura: 38,
    cor: { roupa: '#33405a', cabelo: '#1a1720', pele: '#6b5148', sombra: 'rgba(0,0,0,0.5)' },
  })
  private adrian = new Figura({
    x: 292, y: CHAO, altura: 41,
    cor: { roupa: '#2b2129', cabelo: '#171017', pele: '#6a4f48', sombra: 'rgba(0,0,0,0.5)' },
  })
  private lia = new Figura({
    x: 92, y: CHAO, altura: 31,
    cor: { roupa: '#3d2f3a', cabelo: '#140f16', pele: '#705a4f', sombra: 'rgba(0,0,0,0.5)' },
  })

  private puxao = ''
  private puxaoQuem: 'Adrian' | 'Evelyn' | 'Lia' = 'Adrian'
  private puxaoAte = 0
  private proxPuxao = 3
  private idxPuxao = 0
  private idxPensamento = 0

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
    if (Math.random() < dt * 5) this.po.poeira(198, 90, 7, 3, 'rgba(150,146,152,')

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
    // Andar
    const eixo = ctx.input.moveAxis()
    let dx = eixo ? eixo.x : 0
    const tap = ctx.input.consumeTap()
    if (tap) {
      const alvo = ctx.display.toWorldX(tap.x)
      dx = Math.sign(alvo - this.liam.x)
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
      this.dialogue.play(MESA_FUGA, () => {
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

  private chamar(quem: 'Adrian' | 'Evelyn' | 'Lia', falas: string[]): void {
    this.puxaoQuem = quem
    this.puxao = falas[this.idxPuxao % falas.length] ?? ''
    this.idxPuxao++
    this.puxaoAte = this.t + 3
    audio.interact()
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    this.drawCozinha(w)
    this.lia.draw(w, 200, 'rgba(150,170,210,0.22)')
    this.evelyn.draw(w, 200, 'rgba(150,170,210,0.22)')
    this.adrian.draw(w, 200, 'rgba(210,170,130,0.26)')
    this.liam.draw(w, 200, 'rgba(180,180,210,0.24)')
    this.drawFrente(w)
    this.po.draw(w, false)
    this.drawLuz(w)

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

    this.drawPuxao(ctx)
    this.dialogue.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
  }

  private drawCozinha(c: CanvasRenderingContext2D): void {
    c.fillStyle = '#0c1018'
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    c.fillStyle = '#141a26'
    c.fillRect(0, 0, WORLD_W, CHAO)
    // Azulejo até a metade
    c.fillStyle = '#19202e'
    c.fillRect(0, 64, WORLD_W, CHAO - 64)
    c.fillStyle = 'rgba(0,0,0,0.16)'
    for (let x = 0; x < WORLD_W; x += 12) c.fillRect(x, 64, 1, CHAO - 64)
    for (let y = 64; y < CHAO; y += 12) c.fillRect(0, y, WORLD_W, 1)

    // Bancada com fogão, panela e o pano na tampa
    c.fillStyle = '#212a3a'
    c.fillRect(160, 104, 96, 8)
    c.fillStyle = '#1a212e'
    c.fillRect(160, 112, 96, 30)
    c.fillStyle = '#2c3748'
    c.fillRect(186, 96, 22, 9)                       // panela
    c.fillStyle = '#3a4256'
    c.fillRect(184, 94, 26, 3)                       // tampa
    c.fillStyle = '#5c4f58'
    c.fillRect(196, 90, 13, 4)                       // o pano
    c.fillStyle = 'rgba(226,120,60,0.5)'
    c.fillRect(190, 105, 14, 2)                      // a chama

    // Rádio, ligado
    c.fillStyle = '#2a3346'
    c.fillRect(272, 92, 22, 13)
    c.fillStyle = '#404c66'
    c.fillRect(275, 95, 9, 7)
    c.fillStyle = `rgba(226,178,110,${0.4 + Math.sin(this.t * 7) * 0.2})`
    c.fillRect(287, 96, 3, 3)

    // Porta trancada, à direita
    c.fillStyle = '#10151f'
    c.fillRect(336, 56, 34, CHAO - 56)
    c.fillStyle = '#1b2230'
    c.fillRect(340, 60, 26, CHAO - 64)
    c.fillStyle = PAL.accent
    c.fillRect(342, 112, 3, 4)

    // Alçapão do porão, no chão à direita do centro
    c.fillStyle = '#0a0d14'
    c.fillRect(ALCAPAO - 14, CHAO + 4, 28, 10)
    c.fillStyle = '#161d29'
    c.fillRect(ALCAPAO - 12, CHAO + 6, 24, 6)

    // Chão
    c.fillStyle = '#161c28'
    c.fillRect(0, CHAO, WORLD_W, WORLD_H - CHAO)
    c.fillStyle = 'rgba(0,0,0,0.3)'
    c.fillRect(0, CHAO, WORLD_W, 2)

    // As malas
    c.fillStyle = '#1d2634'
    c.fillRect(106, CHAO - 11, 20, 11)
    c.fillRect(148, CHAO - 8, 15, 8)
    c.fillStyle = '#28344a'
    c.fillRect(106, CHAO - 11, 20, 2)
    c.fillRect(148, CHAO - 8, 15, 2)
    c.fillStyle = '#39445e'
    c.fillRect(113, CHAO - 13, 6, 2)
  }

  private drawFrente(c: CanvasRenderingContext2D): void {
    // Mesa em primeiro plano, cortando a cena ao meio
    c.fillStyle = '#1d2534'
    c.fillRect(120, 176, 150, 8)
    c.fillStyle = '#26303f'
    c.fillRect(120, 176, 150, 2)
    c.fillStyle = '#141a26'
    c.fillRect(130, 184, 6, 24)
    c.fillRect(254, 184, 6, 24)
    // Batente
    c.fillStyle = '#04060a'
    c.fillRect(0, 0, 10, WORLD_H)
    c.fillRect(WORLD_W - 10, 0, 10, WORLD_H)
  }

  private drawLuz(c: CanvasRenderingContext2D): void {
    c.save()
    c.globalCompositeOperation = 'multiply'
    const g = c.createRadialGradient(192, 96, 30, 192, 96, 220)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.5, '#9aa2b6')
    g.addColorStop(1, '#3f4658')
    c.fillStyle = g
    c.fillRect(0, 0, WORLD_W, WORLD_H)
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
