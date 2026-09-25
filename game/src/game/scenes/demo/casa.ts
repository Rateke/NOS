import type { Scene, SceneCtx } from '../types'
import type { Comodo, Porta, VestigioCasa } from '../../world/casa'
import {
  comodoCorredor, comodoQuarto, comodoSala, comodoCozinha,
  CORREDOR_BASE, CORREDOR_MAX,
} from '../../world/casa'
import { drawSalaFundo, drawSalaFrente, drawLuzSala } from '../../world/sala'
import { Dialogue, FONT_BODY } from '../../systems/dialogue'
import { Figura } from '../../world/figura'
import { Particulas } from '../../world/particulas'
import { PAL, WORLD_W } from '../../../engine/constants'
import { audio } from '../../../engine/audio'
import { musica } from '../../../engine/musica'
import {
  CASA_ABERTURA, CASA_CORREDOR, CASA_ANTES_DA_COZINHA, CASA_PRONTO,
  CASA_OBJETIVO_INICIAL, CASA_OBJETIVO_COZINHA,
} from '../../content/demoScript'
import { MesaScene } from './mesa'

const VELOCIDADE = 44
const ALCANCE = 20

/**
 * A Casa Grande Demais.
 *
 * Quatro cômodos ligados por portas: sala, corredor, quarto e cozinha. Liam
 * anda, a câmera acompanha, e atravessar uma porta carrega outro cômodo.
 *
 * O corredor **cresce** enquanto ele caminha, até quase o triplo do tamanho
 * inicial. É a regra da obra virada espaço: a casa do coma não tem medida, e
 * a porta do fim nunca chega. No fim dele existe uma porta que não abre — e
 * que Liam desenhou em todas as plantas do quarto dele.
 */
export class CasaScene implements Scene {
  readonly id = 'demo-casa'

  private dialogue = new Dialogue()
  private comodos = new Map<string, Comodo>()
  private atual!: Comodo
  private t = 0
  private liam = new Figura({
    x: 300, y: 150, altura: 31,
    cor: { roupa: '#252a3a', cabelo: '#12151f', pele: '#6d5a52', sombra: 'rgba(0,0,0,0.5)' },
  })
  private po = new Particulas()

  /** Quanto o corredor já se esticou. */
  private corredorLargura = CORREDOR_BASE
  private idxCorredor = 0
  private achados = new Set<string>()
  private visitados = new Set<string>()
  private destino: number | null = null
  private saindo = false
  private avisouCozinha = false

  /** Exposto para os testes. */
  get comodoAtual(): string {
    return this.atual?.id ?? ''
  }

  enter(): void {
    this.montar()
    this.atual = this.comodos.get('sala') as Comodo
    this.visitados.add('sala')
    this.liam.x = 300
    this.liam.y = this.atual.chaoY
    audio.setAmbient(0.42, 3)
    musica.setPad(0.2, 5)
    musica.desafinado = 0
    musica.abafado = 0.15
    this.dialogue.play(CASA_ABERTURA)
  }

  /** (Re)constrói os cômodos. O corredor depende do comprimento atual. */
  private montar(): void {
    this.comodos = new Map<string, Comodo>()
    for (const c of [
      comodoSala(drawSalaFundo, drawSalaFrente, drawLuzSala),
      comodoCorredor(this.corredorLargura),
      comodoQuarto,
      comodoCozinha,
    ]) {
      this.comodos.set(c.id, c)
    }
  }

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt
    this.liam.update(dt)
    this.po.update(dt)
    this.dialogue.update(dt)

    if (this.dialogue.active) {
      if (ctx.input.consumeConfirm()) this.dialogue.confirm()
      return
    }
    if (this.saindo) return

    // Lê os dois de uma vez. Um clique marca confirmar E toque; se a
    // proximidade valesse também, clicar para andar acionaria a porta embaixo
    // dos pés e teleportaria o jogador sem ele pedir.
    const tap = ctx.input.consumeTap()
    const confirmou = ctx.input.consumeConfirm()

    if (!tap && confirmou) {
      const vestigio = this.vestigioPerto()
      if (vestigio && !this.achados.has(vestigio.id)) {
        this.examinar(vestigio)
        return
      }
      const porta = this.portaPerto()
      if (porta) {
        this.atravessar(porta, ctx)
        return
      }
    }

    this.andar(dt, ctx, tap)
    this.esticarCorredor()
  }

  private andar(dt: number, ctx: SceneCtx, tap: { x: number; y: number } | null): void {
    const eixo = ctx.input.moveAxis()
    let dx = eixo ? eixo.x : 0
    if (eixo) this.destino = null

    if (tap) {
      const alvo = ctx.display.toWorldX(tap.x) + this.camX()
      // Clique em cima de uma porta ou vestígio: anda até lá e usa ao chegar.
      const p = this.atual.portas.find((q) => Math.abs(q.x - alvo) < 26)
      const v = this.atual.vestigios.find((q) => Math.abs(q.x - alvo) < 24)
      this.destino = p ? p.x : v ? v.x : alvo
    }

    if (this.destino !== null && dx === 0) {
      const d = this.destino - this.liam.x
      if (Math.abs(d) < 3) {
        this.destino = null
        const v = this.vestigioPerto()
        if (v && !this.achados.has(v.id)) {
          this.examinar(v)
          return
        }
        const p = this.portaPerto()
        if (p) {
          this.atravessar(p, ctx)
          return
        }
      } else {
        dx = Math.sign(d)
      }
    }

    this.liam.x = Math.max(16, Math.min(this.atual.largura - 16, this.liam.x + dx * VELOCIDADE * dt))
    this.liam.olhar = dx !== 0 ? Math.sign(dx) : this.liam.olhar * 0.9
    this.liam.ofego = dx !== 0 ? 1.5 : 1
  }

  /**
   * O corredor se alonga enquanto Liam anda para o fundo. Cada esticada
   * afasta a porta do fim — e Liam comenta, três vezes, até entender.
   */
  private esticarCorredor(): void {
    if (this.atual.id !== 'corredor') return
    const limite = this.corredorLargura - 120
    if (this.liam.x < limite || this.corredorLargura >= CORREDOR_MAX) return

    this.corredorLargura = Math.min(CORREDOR_MAX, this.corredorLargura + 230)
    this.montar()
    this.atual = this.comodos.get('corredor') as Comodo
    audio.refuse()

    const fala = CASA_CORREDOR[this.idxCorredor]
    if (fala && this.idxCorredor < CASA_CORREDOR.length) {
      this.idxCorredor++
      this.dialogue.play(fala)
    }
  }

  private examinar(v: VestigioCasa): void {
    this.achados.add(v.id)
    audio.interact()
    this.dialogue.play(v.linhas)
  }

  private atravessar(p: Porta, ctx: SceneCtx): void {
    if (p.travada) {
      audio.refuse()
      if (p.aoTentar) this.dialogue.play(p.aoTentar)
      return
    }

    // A cozinha encerra a exploração: é lá que a noite começa.
    if (p.para === 'cozinha') {
      if (!this.avisouCozinha) {
        this.avisouCozinha = true
        this.dialogue.play(CASA_ANTES_DA_COZINHA)
        return
      }
      this.saindo = true
      audio.interact()
      this.dialogue.play(CASA_PRONTO, () => {
        ctx.transition(new MesaScene(), 1.8, 1.6)
      })
      return
    }

    const destino = this.comodos.get(p.para)
    if (!destino) return
    audio.interact()
    this.atual = destino
    this.visitados.add(destino.id)
    this.liam.x = p.entraEm
    this.liam.y = destino.chaoY
    this.destino = null
    this.po.limpar()
  }

  private portaPerto(): Porta | null {
    for (const p of this.atual.portas) {
      if (Math.abs(p.x - this.liam.x) < ALCANCE) return p
    }
    return null
  }

  private vestigioPerto(): VestigioCasa | null {
    for (const v of this.atual.vestigios) {
      if (Math.abs(v.x - this.liam.x) < ALCANCE) return v
    }
    return null
  }

  /** Deslocamento da câmera: segue Liam, preso às bordas do cômodo. */
  camX(): number {
    const meia = WORLD_W / 2
    if (this.atual.largura <= WORLD_W) return 0
    return Math.max(0, Math.min(this.atual.largura - WORLD_W, this.liam.x - meia))
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    const cam = Math.round(this.camX())

    w.save()
    w.translate(-cam, 0)
    this.atual.desenharFundo(w, this.t)
    // A atmosfera do cômodo vem ANTES de Liam. Desenhada depois, a névoa do
    // fundo do corredor engolia o próprio jogador.
    this.atual.desenharFrente?.(w, this.t)
    this.liam.draw(w, this.liam.x - 40, 'rgba(200,196,224,0.24)')
    this.po.draw(w, false)
    w.restore()

    ctx.display.applyGrain(0.05)
    ctx.display.present({ rgbSplit: 0, wave: 0, shake: 0, zoom: 1.24, time: this.t })
    ctx.display.vignette(0.7)

    this.drawInterface(ctx, cam)
    this.dialogue.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
  }

  private drawInterface(ctx: SceneCtx, cam: number): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const s = Math.max(12, Math.min(cssW / 70, 17))
    c.save()

    // Nome do cômodo, no alto
    c.textAlign = 'center'
    c.font = `${s * 0.92}px ${FONT_BODY}`
    c.globalAlpha = 0.4
    c.fillStyle = PAL.inkDim
    c.letterSpacing = '0.22em'
    c.fillText(this.atual.nome.toUpperCase(), cssW / 2, cssH * 0.08)
    c.letterSpacing = '0em'
    c.globalAlpha = 1

    // Aviso do que está ao alcance
    const alvo = this.vestigioPerto() ?? this.portaPerto()
    const jaVisto = alvo && 'linhas' in alvo && this.achados.has(alvo.id)
    if (alvo && !jaVisto && !this.dialogue.active) {
      const sx = ctx.display.toScreenX(this.liam.x - cam)
      const sy = ctx.display.toScreenY(this.liam.y - 40)
      const txt = alvo.rotulo
      c.font = `${s}px ${FONT_BODY}`
      const w = c.measureText(txt).width + s * 3.2
      c.fillStyle = 'rgba(4,6,11,0.85)'
      c.fillRect(sx - w / 2, sy - s, w, s * 1.9)
      c.textAlign = 'left'
      c.fillStyle = PAL.accent
      c.fillText('E', sx - w / 2 + s * 0.7, sy + s * 0.45)
      c.fillStyle = PAL.ink
      c.fillText(txt, sx - w / 2 + s * 2, sy + s * 0.45)
    }

    // Objetivo e progresso, discretos no rodapé
    c.textAlign = 'center'
    c.globalAlpha = 0.42
    c.fillStyle = PAL.inkDim
    c.font = `${s * 0.95}px ${FONT_BODY}`
    const objetivo = this.avisouCozinha ? CASA_OBJETIVO_COZINHA : CASA_OBJETIVO_INICIAL
    c.fillText(
      `${objetivo}  ·  ${this.achados.size} vestígios  ·  ← → anda · E usa`,
      cssW / 2, cssH - s * 2,
    )
    c.restore()
  }
}
