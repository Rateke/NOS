import type { Scene, SceneCtx } from '../types'
import type { GameState } from '../../systems/state'
import type { Comodo, Porta, VestigioCasa, EstadoComodo } from '../../world/casa'
import {
  comodoCorredor, comodoQuarto, comodoSala, CORREDOR_BASE, CORREDOR_MAX,
} from '../../world/casa'
import { PIANO, BANCO_Y } from '../../world/sala'
import type { Line } from '../../world/types'
import { Dialogue, FONT_BODY } from '../../systems/dialogue'
import { Piano } from '../../systems/piano'
import { Leitor } from '../../systems/leitor'
import type { Documento } from '../../systems/leitor'
import { Figura } from '../../world/figura'
import { Particulas } from '../../world/particulas'
import { PAL, WORLD_W } from '../../../engine/constants'
import { audio } from '../../../engine/audio'
import { musica } from '../../../engine/musica'
import {
  CASA_ABERTURA, CASA_CORREDOR, CASA_ANTES_DA_COZINHA, CASA_PRONTO,
  CASA_OBJETIVO_INICIAL, CASA_OBJETIVO_COZINHA, CASA_PORTA_FIM, CASA_MELODIA,
  CASA_MELODIA_DELE,
} from '../../content/demoScript'
import { MesaScene } from './mesa'

const VELOCIDADE = 44
const ALCANCE = 15
const ZOOM = 1.24
/** Largura de mundo que cabe na tela com o zoom da casa. */
const VISIVEL = WORLD_W / ZOOM

/** O tema, de trás para a frente: a frase que desce, subindo. */
const MELODIA_SUBINDO = [0, 1, 2, 3, 4, 2, 0]
/** A terceira frase como Adrian ensinou. */
const MELODIA_DESCENDO = [0, 2, 4, 3, 2, 1, 0]

/**
 * A Casa Grande Demais.
 *
 * Três cômodos ligados por portas — sala, corredor e quarto — e a cozinha,
 * que encerra a exploração. Liam anda, a câmera acompanha, e cada cômodo
 * tem paredes de verdade: não se sai por onde não há porta.
 *
 * O corredor **cresce** enquanto ele caminha, até quase o triplo do tamanho
 * inicial. No fim dele existe uma porta que não abre — e que Liam desenhou
 * em todas as plantas do quarto dele.
 *
 * Nada aqui avisa que há segredos. Olhar de novo uma coisa já vista às vezes
 * mostra outra; o piano da sala continua tocável; a porta do fim responde a
 * quem insiste.
 */
export class CasaScene implements Scene {
  readonly id = 'demo-casa'

  private dialogue = new Dialogue()
  private comodos = new Map<string, Comodo>()
  private atual!: Comodo
  private t = 0
  private liam = new Figura({
    x: 300, y: 163, altura: 31,
    cor: { roupa: '#252a3a', cabelo: '#12151f', pele: '#6d5a52', sombra: 'rgba(0,0,0,0.5)' },
  })
  private po = new Particulas()
  private piano = new Piano()
  private leitor = new Leitor()

  /** Quanto o corredor já se esticou. */
  private corredorLargura = CORREDOR_BASE
  private idxCorredor = 0
  /** Vestígios lidos; `id+` quando lidos de novo. */
  private achados = new Set<string>()
  private visitados = new Set<string>()
  private destino: number | null = null
  private saindo = false
  private avisouCozinha = false

  /** Liam está de costas, olhando algo na parede, enquanto a fala dura. */
  private deCostas = false
  /** Dentro da cabana: some da tela enquanto a voz fala. */
  private escondido = false
  /** Sentado ao piano da sala. */
  private tocando = false
  private ultimas: number[] = []
  private dedilhado = 0
  private tentativasFim = 0
  private sinal = 0
  /** Brilho do aviso de segredo no canto. */
  private estrela = 0
  private zoomPiano = 0

  /** Exposto para os testes. */
  get comodoAtual(): string {
    return this.atual?.id ?? ''
  }

  get caixas(): { x: number; y: number; w: number; h: number }[] {
    return this.piano.caixas
  }

  get sentadoAoPiano(): boolean {
    return this.tocando
  }

  /** Um documento aberto na tela. */
  get lendo(): boolean {
    return this.leitor.aberto
  }

  enter(ctx: SceneCtx): void {
    this.jogo = ctx.state
    this.montar()
    this.atual = this.comodos.get('sala') as Comodo
    this.visitados.add('sala')
    this.liam.x = 300
    this.liam.y = this.atual.passoY
    audio.setAmbient(0.42, 3)
    musica.setPad(0.2, 5)
    musica.desafinado = 0
    musica.abafado = 0.15
    this.dialogue.play(CASA_ABERTURA)
  }

  /** (Re)constrói os cômodos. O corredor depende do comprimento atual. */
  private montar(): void {
    this.comodos = new Map<string, Comodo>()
    for (const c of [comodoSala(), comodoCorredor(this.corredorLargura), comodoQuarto()]) {
      this.comodos.set(c.id, c)
    }
  }

  update(dt: number, ctx: SceneCtx): void {
    this.jogo = ctx.state
    this.t += dt
    this.liam.update(dt)
    this.po.update(dt)
    this.piano.update(dt)
    this.dialogue.update(dt)
    this.dedilhado = Math.max(0, this.dedilhado - dt * 3)
    this.sinal = Math.max(0, this.sinal - dt * 0.35)
    this.estrela = Math.max(0, this.estrela - dt * 0.3)
    this.zoomPiano += ((this.tocando ? 1 : 0) - this.zoomPiano) * Math.min(1, dt * 3)

    // Lendo: o papel fica com a entrada toda, e Liam fica parado olhando.
    if (this.leitor.aberto) {
      this.liam.andando = 0
      this.leitor.update(dt, ctx.input)
      return
    }

    if (this.dialogue.active) {
      this.liam.andando = 0
      if (ctx.input.consumeConfirm()) this.dialogue.confirm()
      // Ao piano, as teclas continuam respondendo com a fala na tela.
      if (!this.tocando) return
    } else {
      this.deCostas = false
      this.escondido = false
    }
    this.liam.costas = this.deCostas || this.tocando
    if (this.saindo) return

    if (this.tocando) {
      this.aoPiano(ctx)
      return
    }

    // Lê os dois de uma vez. Um clique marca confirmar E toque; se a
    // proximidade valesse também, clicar para andar acionaria a porta embaixo
    // dos pés e teleportaria o jogador sem ele pedir.
    const tap = ctx.input.consumeTap()
    const confirmou = ctx.input.consumeConfirm()

    if (!tap && confirmou && this.usarPerto(ctx)) return

    this.andar(dt, ctx, tap)
    this.esticarCorredor()
  }

  /** Usa o que estiver ao alcance. Devolve true se usou algo. */
  private usarPerto(ctx: SceneCtx): boolean {
    const vestigio = this.vestigioPerto()
    if (vestigio) {
      this.examinar(vestigio)
      return true
    }
    const porta = this.portaPerto()
    if (porta) {
      this.atravessar(porta, ctx)
      return true
    }
    return false
  }

  private andar(dt: number, ctx: SceneCtx, tap: { x: number; y: number } | null): void {
    const eixo = ctx.input.moveAxis()
    let dx = eixo ? eixo.x : 0
    if (eixo) this.destino = null

    if (tap) {
      const alvo = ctx.display.toWorldX(tap.x) + this.camX()
      // Clique em cima de uma porta ou vestígio: anda até lá e usa ao chegar.
      const p = this.atual.portas.find((q) => Math.abs(q.x - alvo) < 20)
      const v = this.vestigios().find((q) => Math.abs(q.x - alvo) < 16)
      const bruto = v ? v.x : p ? p.x : alvo
      this.destino = Math.max(this.atual.limiteEsq, Math.min(this.atual.limiteDir, bruto))
      this.usarAoChegar = Boolean(p || v)
    }

    if (this.destino !== null && dx === 0) {
      const d = this.destino - this.liam.x
      if (Math.abs(d) < 2) {
        this.destino = null
        if (this.usarAoChegar) {
          this.usarAoChegar = false
          if (this.usarPerto(ctx)) return
        }
      } else {
        dx = Math.sign(d)
      }
    }

    const antes = this.liam.x
    this.liam.x = Math.max(
      this.atual.limiteEsq,
      Math.min(this.atual.limiteDir, this.liam.x + dx * VELOCIDADE * dt),
    )
    const andou = this.liam.x !== antes
    // Anda olhando para onde vai. Contra a parede, para e respira.
    if (dx !== 0) this.liam.olhar = Math.sign(dx)
    else this.liam.olhar *= 0.94
    this.liam.andando = andou ? 1 : 0
    this.liam.ofego = andou ? 1.5 : 1
  }

  private usarAoChegar = false

  /**
   * O corredor se alonga enquanto Liam anda para o fundo. Cada esticada
   * afasta a porta do fim — e Liam comenta, três vezes, até entender.
   */
  private esticarCorredor(): void {
    if (this.atual.id !== 'corredor') return
    const limite = this.corredorLargura - 120
    if (this.liam.x < limite || this.corredorLargura >= CORREDOR_MAX) return

    this.corredorLargura = Math.min(CORREDOR_MAX, this.corredorLargura + 236)
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
    this.destino = null
    this.liam.andando = 0
    this.deCostas = Boolean(v.naParede)

    const primeira = !this.achados.has(v.id)
    if (primeira) {
      this.achados.add(v.id)
      audio.interact()
      if (v.segredo && !v.deNovo) this.segredo(v.segredo)
      if (v.acao === 'piano') {
        this.dialogue.play(v.linhas, () => this.sentar())
        return
      }
      const doc = v.documento
      if (doc) {
        this.dialogue.play(v.linhas, () => this.ler(doc, v.depois))
        return
      }
      this.dialogue.play(v.linhas)
      return
    }

    if (v.acao === 'piano') {
      this.sentar()
      return
    }

    // Olhar de novo. Quase sempre é o mesmo — às vezes, não.
    if (v.deNovo && !this.achados.has(`${v.id}+`)) {
      this.achados.add(`${v.id}+`)
      audio.interact()
      if (v.acao === 'cabana') this.escondido = true
      const outro = v.documentoDeNovo
      this.dialogue.play(v.deNovo, () => {
        if (v.segredo) this.segredo(v.segredo)
        if (outro) this.ler(outro)
      })
      return
    }
    // Papel se relê quantas vezes quiser — sempre a versão mais completa.
    const doc = this.achados.has(`${v.id}+`) ? v.documentoDeNovo ?? v.documento : v.documento
    if (doc) {
      this.ler(doc)
      return
    }
    const ultima = (v.deNovo ?? v.linhas).at(-1)
    if (ultima) this.dialogue.play([ultima])
  }

  private ler(doc: Documento, depois?: Line[]): void {
    this.leitor.abrir(doc, {
      onSegredo: (id) => this.segredo(id),
      onFechar: () => {
        if (depois) this.dialogue.play(depois)
      },
    })
  }

  /** Guardado para os segredos que chegam por callback de fala. */
  private jogo: GameState | null = null

  private segredo(id: string): void {
    if (!this.jogo?.descobrir(id)) return
    audio.segredo()
    this.estrela = 1
    this.po.poeira(this.liam.x - 14, this.liam.y - 36, 28, 30)
  }

  // --- Piano da sala ------------------------------------------------------

  private sentar(): void {
    this.tocando = true
    this.ultimas = []
    this.liam.pose = 'sentado'
    this.liam.x = PIANO.cx + 4
    this.liam.y = BANCO_Y
    this.liam.olhar = 0
    musica.setPad(0.08, 2)
  }

  private levantar(): void {
    this.tocando = false
    this.liam.pose = 'de-pe'
    this.liam.y = this.atual.passoY
    this.liam.braco = 0
    this.liam.x = PIANO.cx + 22
    musica.setPad(0.2, 3)
  }

  private aoPiano(ctx: SceneCtx): void {
    const tocada = this.piano.ler(ctx.input, ctx.display)
    const confirmou = ctx.input.consumeConfirm()
    const sair = ctx.input.consumeKey('Escape')
      || ctx.input.consumeKey('ArrowLeft')
      || ctx.input.consumeKey('ArrowRight')
      || ctx.input.consumeKey('ArrowDown')

    this.liam.braco = 0.55 + this.dedilhado * 0.3
    if (tocada !== null) {
      this.dedilhado = 1
      this.ultimas.push(tocada)
      if (this.ultimas.length > 7) this.ultimas.shift()
      this.conferirMelodia()
      return
    }
    // Um clique fora das teclas, E, Esc ou uma seta: levanta do banco.
    if ((confirmou || sair) && !this.dialogue.active) this.levantar()
  }

  private conferirMelodia(): void {
    const igual = (m: number[]) => m.length === this.ultimas.length && m.every((n, i) => this.ultimas[i] === n)
    if (igual(MELODIA_SUBINDO)) {
      this.ultimas = []
      this.dialogue.play(CASA_MELODIA, () => this.segredo('melodia'))
    } else if (igual(MELODIA_DESCENDO) && !this.achados.has('melodia-dele')) {
      this.achados.add('melodia-dele')
      this.ultimas = []
      this.dialogue.play(CASA_MELODIA_DELE)
    }
  }

  // --- Portas -------------------------------------------------------------

  private atravessar(p: Porta, ctx: SceneCtx): void {
    this.destino = null
    this.liam.andando = 0
    if (p.travada) {
      this.bater()
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
    this.liam.x = Math.max(destino.limiteEsq, Math.min(destino.limiteDir, p.entraEm))
    this.liam.y = destino.passoY
    this.po.limpar()
  }

  /**
   * A porta do fim. Na terceira vez que Liam insiste, alguém bate de volta
   * — do jeito que o poste da sala pisca.
   */
  private bater(): void {
    const i = Math.min(this.tentativasFim, CASA_PORTA_FIM.length - 1)
    this.tentativasFim++
    this.deCostas = true
    audio.refuse()
    const fala: Line[] = CASA_PORTA_FIM[i] ?? []
    if (i === 2) {
      this.dialogue.play(fala, () => {
        audio.bater(3, 500)
        window.setTimeout(() => {
          this.sinal = 1
        }, 500)
        window.setTimeout(() => {
          this.deCostas = true
          this.dialogue.play([
            { speaker: 'Voz', text: 'Ainda não.', style: 'speech' },
            { text: 'Tinha alguém do outro lado.' },
          ], () => this.segredo('bater'))
        }, 1700)
      })
      return
    }
    this.dialogue.play(fala)
  }

  private portaPerto(): Porta | null {
    for (const p of this.atual.portas) {
      if (Math.abs(p.x - this.liam.x) < ALCANCE + 2) return p
    }
    return null
  }

  private vestigios(): VestigioCasa[] {
    return this.atual.vestigios.filter((v) => !v.minLargura || this.atual.largura >= v.minLargura)
  }

  private vestigioPerto(): VestigioCasa | null {
    let melhor: VestigioCasa | null = null
    let dist = ALCANCE
    for (const v of this.vestigios()) {
      const d = Math.abs(v.x - this.liam.x)
      if (d < dist) {
        melhor = v
        dist = d
      }
    }
    return melhor
  }

  /**
   * Deslocamento da câmera: segue Liam e para nas paredes. Conta o zoom — a
   * versão anterior não contava, e as bordas do cômodo ficavam fora da tela;
   * Liam andava para dentro de um lugar que o jogador não via.
   */
  camX(): number {
    const margem = (WORLD_W - VISIVEL) / 2
    const min = -margem
    const max = this.atual.largura - WORLD_W + margem
    if (max <= min) return (this.atual.largura - WORLD_W) / 2
    return Math.max(min, Math.min(max, this.liam.x - WORLD_W / 2))
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    const cam = Math.round(this.camX())
    const estado: EstadoComodo = {
      t: this.t,
      tecla: this.dedilhado > 0.02 ? this.piano.ultimaTocada : -1,
      brilhoTecla: this.dedilhado,
      vistos: this.achados,
      sinal: this.sinal,
    }

    w.fillStyle = '#020306'
    w.fillRect(0, 0, WORLD_W, 216)
    w.save()
    w.translate(-cam, 0)
    this.atual.desenharFundo(w, estado)
    // A atmosfera do cômodo vem ANTES de Liam. Desenhada depois, a névoa do
    // fundo do corredor engolia o próprio jogador.
    this.atual.atmosfera?.(w, estado)
    if (!this.escondido) this.liam.draw(w, this.atual.luzX, 'rgba(210,200,230,0.32)')
    this.atual.desenharFrente?.(w, estado)
    this.po.draw(w, true)
    w.restore()

    ctx.display.applyGrain(0.05)
    const z = ZOOM + this.zoomPiano * 0.42
    const focoX = WORLD_W / 2 + (PIANO.cx - cam - WORLD_W / 2) * this.zoomPiano
    const focoY = 108 + (112 - 108) * this.zoomPiano
    ctx.display.present({ rgbSplit: 0, wave: 0, shake: 0, zoom: z, alvoX: focoX, alvoY: focoY, time: this.t })
    ctx.display.vignette(0.6)

    if (this.tocando) {
      this.piano.draw(ctx.display, {})
      this.piano.drawDica(ctx.display, 'toque o que quiser  ·  A S D F G H J K  ·  E ou Esc levanta')
    } else if (!this.leitor.aberto) {
      this.drawInterface(ctx, cam)
    }
    this.drawEstrela(ctx)
    this.dialogue.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
    this.leitor.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
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

    // Aviso do que está ao alcance. O que já foi visto fica apagado — mas
    // continua ali, para quem quiser olhar de novo.
    const v = this.vestigioPerto()
    const p = v ? null : this.portaPerto()
    if ((v || p) && !this.dialogue.active && !this.saindo) {
      const visto = v ? this.achados.has(v.id) : false
      const sx = ctx.display.toScreenX(this.liam.x - cam)
      const sy = ctx.display.toScreenY(this.liam.y - 42)
      const txt = v ? v.rotulo : p?.rotulo ?? ''
      c.font = `${s}px ${FONT_BODY}`
      const w = c.measureText(txt).width + s * 3.2
      c.globalAlpha = visto ? 0.42 : 1
      c.fillStyle = 'rgba(4,6,11,0.85)'
      c.fillRect(sx - w / 2, sy - s, w, s * 1.9)
      c.textAlign = 'left'
      c.fillStyle = PAL.accent
      c.fillText('E', sx - w / 2 + s * 0.7, sy + s * 0.45)
      c.fillStyle = PAL.ink
      c.fillText(txt, sx - w / 2 + s * 2, sy + s * 0.45)
      c.globalAlpha = 1
    }

    // Objetivo e progresso, discretos no rodapé
    c.textAlign = 'center'
    c.globalAlpha = 0.42
    c.fillStyle = PAL.inkDim
    c.font = `${s * 0.95}px ${FONT_BODY}`
    const objetivo = this.avisouCozinha ? CASA_OBJETIVO_COZINHA : CASA_OBJETIVO_INICIAL
    const vistos = [...this.achados].filter((a) => !a.endsWith('+') && a !== 'melodia-dele').length
    c.fillText(
      `${objetivo}  ·  ${vistos} vestígios  ·  ← → anda · E usa`,
      cssW / 2, cssH - s * 2,
    )
    c.restore()
  }

  /** Um brilho pequeno no canto quando um segredo é achado. Sem texto. */
  private drawEstrela(ctx: SceneCtx): void {
    if (this.estrela <= 0) return
    const c = ctx.display.ctx
    const { cssW } = ctx.display
    const s = Math.max(12, Math.min(cssW / 70, 17))
    const a = Math.min(1, this.estrela * 1.6)
    const x = cssW - s * 2.4
    const y = s * 2.4
    const r = s * (0.5 + (1 - this.estrela) * 0.6)
    c.save()
    c.globalAlpha = a
    c.fillStyle = PAL.accent
    c.beginPath()
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 - Math.PI / 2
      const rr = i % 2 === 0 ? r : r * 0.32
      c.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr)
    }
    c.closePath()
    c.fill()
    c.restore()
  }
}
