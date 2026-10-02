import type { Input } from '../../engine/input'
import type { Display } from '../../engine/display'
import type { GameState } from '../systems/state'
import { WORLD_W, WORLD_H } from '../../engine/constants'
import { audio } from '../../engine/audio'
import { musica, ESCALA, TEMA } from '../../engine/musica'
import { Dialogue, FONT_FIM, FONT_BODY, FIO } from '../systems/dialogue'
import type { Line } from './types'
import { Figura, criarSombraBranca, VISUAL } from './figura'
import { Camada } from '../ui/camada'
import { DENTRO_CONTA } from '../content/demoScript'
import {
  DENTRO_RECORTES, DENTRO_PRATOS_NA_FRENTE, DENTRO_1_PAROU, DENTRO_1_ACABOU,
} from '../content/noite'
import type { FiguraDentro, PassoDentro } from '../content/noite'

/**
 * Dentro: a cabeça de Liam, por baixo da casa.
 *
 * Vácuo preto, uma toalha xadrez enorme no chão, uma luz de cima. As
 * lembranças chegam recortadas — no máximo três coisas por vez — e trocam
 * por corte seco. Em cada recorte há uma coisa torta, brilhando. Arrumar faz
 * o próximo recorte chegar; é o ritual de Liam, e o jogador o executa sem
 * pensar.
 *
 * Em cada recorte a sombra conversa com ele sobre a mãe (os Arcos 2 e 4):
 * pergunta, ele responde, a lembrança fala, e só então dá para arrumar. Ela
 * termina no golpe — "e a culpa é toda sua" — e Liam pode parar de arrumar.
 * Parando ou não, o pai desce a escada: o resto é no Tear, e depois na
 * Conversa, mais abaixo neste arquivo.
 */
type Recorte = 'pratos' | 'partitura' | 'sapatos' | 'uniforme' | 'mochila' | 'chave'

interface Corte {
  tipo: Recorte
  /** Quantos pratos, nos recortes da mesa. */
  pratos?: number
  /** Ângulo do objeto torto, em radianos. */
  torto: number
  /** A conta que Liam faz, na letra dele. */
  conta?: string
  /** Alguém em pé no recorte. */
  pessoa?: 'evelyn' | 'sombra'
}

const CORTES: Corte[] = [
  { tipo: 'pratos', pratos: 5, torto: 0.5, conta: DENTRO_CONTA[0] },
  { tipo: 'partitura', torto: -0.42 },
  { tipo: 'sapatos', torto: 0.6 },
  { tipo: 'uniforme', torto: 0.38, pessoa: 'evelyn' },
  // No mesmo lugar onde a mãe estava, agora está a sombra.
  { tipo: 'mochila', torto: -0.5, pessoa: 'sombra' },
  { tipo: 'pratos', pratos: 4, torto: -0.46, conta: DENTRO_CONTA[1] },
  { tipo: 'chave', torto: 0.55 },
  { tipo: 'pratos', pratos: 3, torto: 0.5, conta: DENTRO_CONTA[2] },
]

/** Onde está a coisa torta de cada recorte, no mundo (antes de subir 34px). */
function alvoDe(corte: Corte): { x: number; y: number } {
  switch (corte.tipo) {
    case 'pratos': {
      const n = corte.pratos ?? 5
      return { x: 192 + (Math.floor(n / 2) - (n - 1) / 2) * 30 + 14, y: 160 }
    }
    case 'partitura': return { x: 196, y: 172 }
    case 'sapatos': return { x: 224, y: 165 }
    case 'uniforme': return { x: 178, y: 128 }
    case 'mochila': return { x: 190, y: 150 }
    case 'chave': return { x: 196, y: 132 }
  }
}
/** O recorte inteiro é desenhado 34px acima da linha do chão. */
const SOBE = 34

/**
 * A partir de qual recorte parar de arrumar já conta como parar. Antes
 * disso a conversa sobre a mãe ainda não chegou no golpe.
 */
const PODE_PARAR = 6
/** Quanto tempo parado, depois de ler, para valer como ter parado. */
const PARADO = 4.5

type Fase = 'cortes' | 'parou' | 'fim'

export class Montagem {
  done = false
  private fase: Fase = 'cortes'
  private corte = 0
  private t = 0
  private tCorte = 0
  private parado = 0
  /** 0..1: o objeto torto sendo endireitado. */
  private arrumando = 0
  private arrumou = false
  private preto = 0
  private dialogue = new Dialogue()
  readonly camada = new Camada()
  private liam = new Figura({
    ...VISUAL.liam,
    x: 150, y: 176, altura: 31,
    cor: { roupa: '#252a3a', cabelo: '#12151f', pele: '#6d5a52', sombra: 'rgba(0,0,0,0.5)' },
  })
  private sombra = criarSombraBranca(250, 176, 35)
  private evelyn = new Figura({
    x: 276, y: 172, altura: 36, cabelo: 'longo',
    cor: { roupa: '#e2a95e', cabelo: '#e2a95e', pele: '#e2a95e', sombra: 'rgba(0,0,0,0)' },
  })
  private antes = { desafinado: 0, abafado: 0 }
  /** Quantos recortes o jogador arrumou (para os testes). */
  arrumados = 0
  /** Tempo desde que a última fala do recorte terminou de se escrever. */
  private desdeConversou = 0
  /** Liam indo até a coisa torta, antes de endireitar. */
  private indo = false
  private estado: GameState | null = null

  private antesDoPrimeiro: Line[] = []

  constructor() {
    this.evelyn.silhueta = true
    this.evelyn.silhuetaCor = { roupa: '#8a6436', cabelo: '#a4763e', pele: '#a4763e', sombra: 'rgba(0,0,0,0)' }
    this.liam.costas = false
    this.liam.olhar = 1
    this.sombra.olhar = -1
  }

  get faseAtual(): Fase {
    return this.fase
  }

  /** `antes`: falas que entram antes do primeiro recorte (a sombra, quando tem o que dizer). */
  comecar(state: GameState, antes: Line[] = []): void {
    this.estado = state
    this.antesDoPrimeiro = antes
    this.camada.mostrar(state, 'dentro')
    this.antes = { desafinado: musica.desafinado, abafado: musica.abafado }
    musica.desafinado = 0
    musica.abafado = 0.35
    audio.setAmbient(0.14, 0.3)
    this.entrarCorte(0)
  }

  private entrarCorte(i: number): void {
    this.corte = i
    this.tCorte = 0
    this.parado = 0
    this.arrumando = 0
    this.arrumou = false
    this.indo = false
    this.desdeConversou = 0
    this.liam.x = 150
    this.liam.andando = 0
    this.liam.braco = 0
    this.preto = 0.12
    audio.bater(1, 0)
    // Uma nota do tema a cada corte, limpa — aqui dentro ele ainda é afinado.
    const graus = TEMA.flat()
    const f = ESCALA[graus[i % graus.length] ?? 0]
    if (f) musica.nota(f / 2, 0.55, 4)
    const falas = [...(i === 0 ? this.antesDoPrimeiro : []), ...(DENTRO_RECORTES[i] ?? [])]
    // Quem entrou na frente do prato na cozinha ouve isso no recorte da mãe.
    if (i === 3 && this.estado?.sabe.has('prato-na-frente')) falas.push(DENTRO_PRATOS_NA_FRENTE)
    if (falas.length > 0) this.dialogue.play(falas)
  }

  /** A conversa do recorte acabou (a última linha inteira na tela, ou já fechada). */
  private get conversou(): boolean {
    return !this.dialogue.active || (this.dialogue.completa && this.dialogue.fila === 0)
  }

  /** A coisa torta deste recorte, já na altura em que aparece (para o toque e os testes). */
  get alvo(): { x: number; y: number } | null {
    const corte = CORTES[this.corte]
    if (this.fase !== 'cortes' || !corte) return null
    const a = alvoDe(corte)
    return { x: a.x, y: a.y - SOBE }
  }

  /** A conversa acabou e a coisa ainda está torta: é a vez do jogador. */
  get esperandoArrumar(): boolean {
    return this.fase === 'cortes' && !this.arrumou && this.conversou && this.desdeConversou > 0.3
  }

  private tocouNoAlvo(tap: { x: number; y: number }, display: Display): boolean {
    const a = this.alvo
    if (!a) return false
    const wx = display.toWorldX(tap.x)
    const wy = display.toWorldY(tap.y)
    return Math.abs(wx - a.x) < 22 && Math.abs(wy - a.y) < 22
  }

  private parar(acabou: boolean): void {
    this.fase = 'parou'
    this.preto = 0.4
    audio.bater(1, 0)
    this.sombra.x = 236
    this.liam.x = 150
    const falas: Line[] = acabou ? DENTRO_1_ACABOU : DENTRO_1_PAROU
    this.dialogue.play(falas, () => {
      this.fase = 'fim'
      this.done = true
      musica.desafinado = this.antes.desafinado
      musica.abafado = this.antes.abafado
    })
  }

  update(dt: number, input: Input, display?: Display): void {
    this.t += dt
    this.tCorte += dt
    this.preto = Math.max(0, this.preto - dt)
    this.dialogue.update(dt)
    this.camada.update(dt)
    this.liam.update(dt)
    this.sombra.update(dt)
    this.evelyn.update(dt)

    if (this.fase === 'parou') {
      if (input.consumeConfirm()) this.dialogue.confirm()
      return
    }
    if (this.fase !== 'cortes') return

    if (this.arrumou) {
      input.consumeConfirm()
      input.consumeTap()
      input.consumeKey('KeyE')
      const corte = CORTES[this.corte]
      if (this.indo && corte) {
        // Ele vai até lá. O corpo sabe o caminho.
        const alvoX = alvoDe(corte).x - 12
        const d = alvoX - this.liam.x
        this.liam.olhar = Math.sign(d) || 1
        if (Math.abs(d) > 1.5) {
          this.liam.x += Math.sign(d) * Math.min(Math.abs(d), 110 * dt)
          this.liam.andando = 1
          return
        }
        this.liam.andando = 0
        this.indo = false
        this.tCorte = 0
        audio.pickup()
      }
      this.liam.braco = Math.min(1, this.liam.braco + dt * 6)
      this.arrumando = Math.min(1, this.arrumando + dt * 3)
      if (this.arrumando >= 1 && this.tCorte > 0.55) {
        this.liam.braco = 0
        const prox = this.corte + 1
        if (prox >= CORTES.length) this.parar(true)
        else this.entrarCorte(prox)
      }
      return
    }

    const conversou = this.conversou
    this.desdeConversou = conversou ? this.desdeConversou + dt : 0
    const tecla = input.consumeKey('KeyE')
    const tap = input.consumeTap()
    const confirmou = input.consumeConfirm()
    if (this.tCorte <= 0.25) return

    if (!conversou) {
      // Os toques passam a conversa (E também).
      if (confirmou || tap) this.dialogue.confirm()
      return
    }
    // Acabou a conversa. Arrumar é um gesto: E, ou tocar na coisa torta.
    const naCoisa = tap !== null && display !== undefined && this.tocouNoAlvo(tap, display)
    if ((tecla || naCoisa) && this.desdeConversou > 0.3) {
      if (this.dialogue.active) this.dialogue.confirm()
      this.arrumou = true
      this.indo = true
      this.arrumando = 0
      this.tCorte = 0
      this.arrumados++
      return
    }
    // Espaço ou um toque em outro lugar só fecham a fala. A coisa continua torta.
    if ((confirmou || tap) && this.dialogue.active) this.dialogue.confirm()

    this.parado += dt
    if (this.corte >= PODE_PARAR && this.parado > PARADO) this.parar(false)
  }

  /** O vácuo, a toalha, a luz e o recorte da vez. */
  render(c: CanvasRenderingContext2D): void {
    c.fillStyle = '#020203'
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    if (this.preto > 0) return

    this.toalha(c)
    this.luz(c)
    desenharPoeiraDentro(c, this.t)

    if (this.fase === 'cortes') {
      const corte = CORTES[this.corte]
      if (corte) this.recorte(c, corte)
      // Ele mesmo, no canto do recorte: é quem arruma.
      c.save()
      c.translate(0, -SOBE)
      this.liam.draw(c, 192, 'rgba(255,255,255,0.22)')
      c.restore()
    } else {
      // Parou: só os dois, frente a frente, no meio da toalha vazia.
      c.save()
      c.translate(0, -34)
      this.liam.draw(c, 192, 'rgba(255,255,255,0.25)')
      this.sombra.draw(c, 192, 'rgba(255,255,255,0.5)')
      c.restore()
    }

    // Grão fino de filme
    for (let i = 0; i < 60; i++) {
      const x = (i * 97 + Math.floor(this.t * 60) * 31) % WORLD_W
      const y = (i * 53 + Math.floor(this.t * 60) * 17) % WORLD_H
      c.fillStyle = 'rgba(255,255,255,0.04)'
      c.fillRect(x, y, 1, 1)
    }
  }

  private toalha(c: CanvasRenderingContext2D): void {
    desenharToalha(c)
  }

  private luz(c: CanvasRenderingContext2D): void {
    desenharLuzDentro(c, this.t)
  }

  private recorte(c: CanvasRenderingContext2D, corte: Corte): void {
    c.save()
    c.translate(0, -34)
    this.recorteNoLugar(c, corte)
    c.restore()
  }

  private recorteNoLugar(c: CanvasRenderingContext2D, corte: Corte): void {
    const ang = corte.torto * (1 - easeOut(this.arrumando))
    const brilho = this.arrumou ? 1 - this.arrumando : 0.6 + Math.sin(this.t * 4) * 0.3

    if (corte.pessoa === 'evelyn') this.evelyn.draw(c, 192, 'rgba(255,220,160,0.3)')
    if (corte.pessoa === 'sombra') {
      this.sombra.x = 276
      this.sombra.y = 172
      this.sombra.draw(c, 192, 'rgba(255,255,255,0.4)')
    }

    switch (corte.tipo) {
      case 'pratos': this.pratos(c, corte.pratos ?? 5, ang, brilho); break
      case 'partitura': this.partitura(c, ang, brilho); break
      case 'sapatos': this.sapatos(c, ang, brilho); break
      case 'uniforme': this.uniforme(c, ang, brilho); break
      case 'mochila': this.mochila(c, ang, brilho); break
      case 'chave': this.chave(c, ang, brilho); break
    }
  }

  private halo(c: CanvasRenderingContext2D, x: number, y: number, a: number): void {
    if (a <= 0) return
    c.save()
    c.globalCompositeOperation = 'lighter'
    const g = c.createRadialGradient(x, y, 1, x, y, 16)
    g.addColorStop(0, `rgba(255,236,190,${0.35 * a})`)
    g.addColorStop(1, 'rgba(255,236,190,0)')
    c.fillStyle = g
    c.fillRect(x - 16, y - 16, 32, 32)
    c.restore()
  }

  /** Desenha `f` girado em torno de (x, y). Enquanto espera, a coisa torta flutua um pouco. */
  private girado(c: CanvasRenderingContext2D, x: number, y: number, ang: number, f: () => void): void {
    c.save()
    const flutua = this.arrumou ? 0 : Math.round(Math.sin(this.t * 2.4) * 1.2)
    c.translate(x, y + flutua)
    c.rotate(ang)
    f()
    c.restore()
  }

  private pratos(c: CanvasRenderingContext2D, n: number, ang: number, brilho: number): void {
    const torto = Math.floor(n / 2)
    for (let i = 0; i < n; i++) {
      const x = 192 + (i - (n - 1) / 2) * 30
      const y = 160 + Math.abs(i - (n - 1) / 2) * -3
      c.fillStyle = '#d8d2c6'
      c.beginPath()
      c.ellipse(x, y, 11, 4, 0, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#b8b0a2'
      c.beginPath()
      c.ellipse(x, y, 6, 2, 0, 0, Math.PI * 2)
      c.fill()
      // O garfo ao lado de cada prato; um deles, torto.
      const gx = x + 14
      if (i === torto) {
        this.halo(c, gx, y, brilho)
        this.girado(c, gx, y, ang, () => {
          c.fillStyle = '#e8e4dc'
          c.fillRect(0, -6, 1, 12)
          c.fillRect(-1, -6, 3, 1)
        })
      } else {
        c.fillStyle = '#9a968e'
        c.fillRect(gx, y - 6, 1, 12)
        c.fillRect(gx - 1, y - 6, 3, 1)
      }
    }
  }

  private partitura(c: CanvasRenderingContext2D, ang: number, brilho: number): void {
    // O banco do piano, comprido, e a partitura caída no chão.
    c.fillStyle = '#2a2024'
    c.fillRect(150, 140, 84, 6)
    c.fillRect(154, 146, 3, 16)
    c.fillRect(227, 146, 3, 16)
    this.halo(c, 196, 172, brilho)
    this.girado(c, 196, 172, ang, () => {
      c.fillStyle = '#e4ddcc'
      c.fillRect(-9, -6, 18, 12)
      c.fillStyle = 'rgba(30,30,40,0.6)'
      for (let i = 0; i < 4; i++) c.fillRect(-7, -4 + i * 3, 14, 1)
    })
  }

  private sapatos(c: CanvasRenderingContext2D, ang: number, brilho: number): void {
    // O capacho da porta, e os sapatos com o bico para fora.
    c.fillStyle = '#4a3e36'
    c.fillRect(146, 166, 92, 10)
    const pares = [158, 172, 206]
    for (const x of pares) {
      c.fillStyle = '#1e1a1c'
      c.fillRect(x, 160, 5, 10)
      c.fillRect(x + 7, 160, 5, 10)
    }
    this.halo(c, 224, 165, brilho)
    this.girado(c, 224, 165, ang, () => {
      c.fillStyle = '#26303e'
      c.fillRect(-3, -5, 5, 10)
    })
    c.fillStyle = '#26303e'
    c.fillRect(213, 160, 5, 10)
  }

  private uniforme(c: CanvasRenderingContext2D, ang: number, brilho: number): void {
    // A cadeira com o uniforme da mãe pendurado no encosto.
    c.fillStyle = '#2c2426'
    c.fillRect(176, 130, 3, 40)
    c.fillRect(204, 150, 3, 20)
    c.fillRect(176, 150, 31, 3)
    c.fillStyle = '#3e5664'
    c.fillRect(172, 128, 12, 26)
    this.halo(c, 178, 128, brilho)
    this.girado(c, 178, 128, ang, () => {
      c.fillStyle = '#a8b4bc'
      c.fillRect(-6, -2, 12, 3)
    })
  }

  private mochila(c: CanvasRenderingContext2D, ang: number, brilho: number): void {
    c.fillStyle = '#6a2c38'
    c.fillRect(180, 152, 20, 18)
    c.fillStyle = '#4e2028'
    c.fillRect(182, 156, 16, 1)
    this.halo(c, 190, 150, brilho)
    this.girado(c, 190, 150, ang, () => {
      c.fillStyle = '#2e3e56'
      c.fillRect(-8, -2, 16, 3)
    })
  }

  private chave(c: CanvasRenderingContext2D, ang: number, brilho: number): void {
    // O quadrinho de chaves da entrada; falta uma, e a que sobrou está torta.
    c.fillStyle = '#3a2e2c'
    c.fillRect(170, 120, 44, 14)
    for (const x of [176, 186, 196, 206]) {
      c.fillStyle = '#8a8478'
      c.fillRect(x, 126, 1, 2)
    }
    c.fillStyle = '#b8a060'
    c.fillRect(176, 128, 2, 8)
    this.halo(c, 196, 132, brilho)
    this.girado(c, 196, 128, ang, () => {
      c.fillStyle = '#d8c070'
      c.fillRect(-1, 0, 2, 9)
      c.fillRect(-2, 7, 4, 2)
    })
  }

  /** O que vai por cima, em resolução de tela: a conta, o aviso de arrumar e a voz da sombra. */
  renderUI(c: CanvasRenderingContext2D, cssW: number, cssH: number, display?: Display, toque = false): void {
    this.camada.draw(c, cssW, cssH)
    const corte = CORTES[this.corte]
    if (this.fase === 'cortes' && corte?.conta && this.preto <= 0) {
      const s = Math.max(22, Math.min(cssW / 26, 46))
      c.save()
      c.textAlign = 'center'
      c.globalAlpha = Math.min(1, this.tCorte / 0.6) * 0.85
      c.font = `italic 500 ${s}px ${FONT_FIM}`
      c.fillStyle = '#c6d0f0'
      c.fillText(corte.conta, cssW / 2, cssH * 0.16)
      c.restore()
    }
    // A conversa acabou: a coisa torta espera o gesto.
    const a = this.alvo
    if (this.esperandoArrumar && a && display) {
      const s2 = Math.max(13, Math.min(cssW / 64, 19))
      const sx = display.toScreenX(a.x)
      const sy = display.toScreenY(a.y) - s2 * 2.2
      c.save()
      c.textAlign = 'center'
      c.globalAlpha = Math.min(1, (this.desdeConversou - 0.3) / 0.4) * (0.6 + Math.sin(this.t * 3.2) * 0.25)
      c.font = `${s2}px ${FONT_BODY}`
      c.letterSpacing = '0.12em'
      const texto = toque ? 'toque nele para arrumar' : 'E  ·  arrumar'
      const larg = c.measureText(texto).width + s2 * 1.6
      c.fillStyle = 'rgba(6,6,10,0.82)'
      c.beginPath()
      c.roundRect(sx - larg / 2, sy - s2 * 1.15, larg, s2 * 1.7, s2 * 0.4)
      c.fill()
      c.fillStyle = '#f6ecd2'
      c.fillText(texto, sx, sy)
      c.restore()
    }
    this.dialogue.render(c, cssW, cssH)
  }
}

/**
 * Dentro 2: depois do fogo.
 *
 * O mesmo vácuo, a mesma toalha. Agora não há nada para arrumar: só a
 * sombra falando, inteira, e quem ela chama aparecendo no escuro em volta —
 * as cinzas do que queimou, a figura preta que cortou o próprio fio, a Lia
 * ao longe, a mãe no meio. São os Arcos 6 a 10: a culpa, os "e se", o
 * desmonte da mãe e a decisão. Termina quando Liam diz que não é o nó.
 */
export class Conversa {
  done = false
  /** 0..1, para quem desenha a tela sacudir junto com os gritos. */
  jolt = 0
  private dialogue = new Dialogue()
  private t = 0
  private idx = -1
  private passos: PassoDentro[]
  private ultimaLinha = 0
  /** Opacidade de cada figura, indo atrás do que o passo pede. */
  private alfa: Record<FiguraDentro, number> = { evelyn: 0, lia: 0, eli: 0, cinzas: 0 }
  private alvo = new Set<FiguraDentro>()
  private cinzas: { x: number; y: number; vy: number; vx: number; tam: number }[] = []
  private liam = new Figura({
    ...VISUAL.liam,
    x: 150, y: 176, altura: 31,
    cor: { roupa: '#252a3a', cabelo: '#12151f', pele: '#6d5a52', sombra: 'rgba(0,0,0,0.5)' },
  })
  private sombra = criarSombraBranca(236, 176, 35)
  private evelyn = new Figura({
    x: 192, y: 160, altura: 30, cabelo: 'longo',
    cor: { roupa: '#e2a95e', cabelo: '#e2a95e', pele: '#e2a95e', sombra: 'rgba(0,0,0,0)' },
  })
  private lia = new Figura({
    x: 334, y: 168, altura: 26, cabelo: 'rabo',
    cor: { roupa: '#d06e80', cabelo: '#d06e80', pele: '#d06e80', sombra: 'rgba(0,0,0,0)' },
  })
  private eli = new Figura({
    x: 52, y: 168, altura: 30, cabelo: 'longo',
    cor: { roupa: '#000', cabelo: '#000', pele: '#000', sombra: 'rgba(0,0,0,0)' },
  })

  constructor(passos: PassoDentro[]) {
    this.passos = passos
    this.liam.olhar = 1
    this.sombra.olhar = -1
    for (const f of [this.evelyn, this.lia]) {
      f.silhueta = true
      f.silhuetaCor = { ...f.cor }
    }
    this.eli.silhueta = true
    this.eli.silhuetaCor = { roupa: '#050506', cabelo: '#050506', pele: '#050506', sombra: 'rgba(0,0,0,0)' }
    this.lia.olhar = -1
    this.eli.olhar = 1
  }

  comecar(): void {
    audio.setAmbient(0.1, 0.3)
    this.proximo()
  }

  private proximo(): void {
    this.idx++
    const p = this.passos[this.idx]
    if (!p) {
      this.done = true
      return
    }
    this.alvo = new Set(p.mostrar ?? [])
    audio.bater(1, 0)
    this.dialogue.play(p.linhas, () => this.proximo(), p.auto ?? 0)
  }

  update(dt: number, input: Input): void {
    this.t += dt
    this.jolt = Math.max(0, this.jolt - dt * 2.4)
    this.dialogue.update(dt)
    for (const f of [this.liam, this.sombra, this.evelyn, this.lia, this.eli]) f.update(dt)
    for (const k of Object.keys(this.alfa) as FiguraDentro[]) {
      const quer = this.alvo.has(k) ? 1 : 0
      this.alfa[k] += (quer - this.alfa[k]) * Math.min(1, dt * 1.6)
    }
    this.liam.tremor = this.jolt * 1.5

    if (this.dialogue.linhaNum !== this.ultimaLinha) {
      this.ultimaLinha = this.dialogue.linhaNum
      if (this.dialogue.atual?.grito) {
        this.jolt = 1
        audio.heartbeat(0.22)
      }
    }

    // Cinza caindo devagar, do alto do vácuo.
    if (this.alfa.cinzas > 0.05 && Math.random() < dt * 30 * this.alfa.cinzas) {
      this.cinzas.push({
        x: Math.random() * WORLD_W, y: -4, vy: 6 + Math.random() * 10,
        vx: (Math.random() - 0.5) * 4, tam: Math.random() < 0.7 ? 1 : 2,
      })
    }
    for (const k of this.cinzas) {
      k.y += k.vy * dt
      k.x += k.vx * dt + Math.sin(this.t + k.y * 0.05) * 0.1
    }
    this.cinzas = this.cinzas.filter((k) => k.y < WORLD_H)

    if (this.dialogue.active && (input.consumeConfirm() || input.consumeTap() !== null)) {
      this.dialogue.confirm()
    }
  }

  render(c: CanvasRenderingContext2D): void {
    c.fillStyle = '#020203'
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    desenharToalha(c)
    desenharLuzDentro(c, this.t)
    desenharPoeiraDentro(c, this.t)
    c.save()
    c.translate(0, -34)
    // Quem ela chama aparece no escuro, longe da luz.
    const figura = (f: Figura, a: number, luz: string) => {
      if (a <= 0.02) return
      c.save()
      c.globalAlpha = a
      f.draw(c, 192, luz)
      c.restore()
    }
    figura(this.eli, this.alfa.eli, 'rgba(0,0,0,0)')
    figura(this.lia, this.alfa.lia * 0.8, 'rgba(255,200,210,0.3)')
    figura(this.evelyn, this.alfa.evelyn * 0.85, 'rgba(255,220,160,0.3)')
    this.liam.draw(c, 192, 'rgba(255,255,255,0.25)')
    this.sombra.draw(c, 192, 'rgba(255,255,255,0.5)')
    c.restore()
    for (const k of this.cinzas) {
      c.fillStyle = `rgba(150,146,150,${(0.55 * this.alfa.cinzas).toFixed(3)})`
      c.fillRect(Math.round(k.x), Math.round(k.y), k.tam, k.tam)
    }
    for (let i = 0; i < 60; i++) {
      const x = (i * 97 + Math.floor(this.t * 60) * 31) % WORLD_W
      const y = (i * 53 + Math.floor(this.t * 60) * 17) % WORLD_H
      c.fillStyle = 'rgba(255,255,255,0.04)'
      c.fillRect(x, y, 1, 1)
    }
  }

  renderUI(c: CanvasRenderingContext2D, cssW: number, cssH: number): void {
    this.dialogue.render(c, cssW, cssH)
  }
}

/** A toalha xadrez da mesa da cozinha, do tamanho do chão inteiro. */
function desenharToalha(c: CanvasRenderingContext2D): void {
  const topo = 80
  const linhas = 9
  const colunas = 14
  for (let r = 0; r < linhas; r++) {
    const v0 = r / linhas
    const v1 = (r + 1) / linhas
    const y0 = topo + Math.pow(v0, 1.3) * (WORLD_H - topo)
    const y1 = topo + Math.pow(v1, 1.3) * (WORLD_H - topo)
    const l0 = 128 - v0 * 170
    const r0 = 256 + v0 * 170
    const l1 = 128 - v1 * 170
    const r1 = 256 + v1 * 170
    for (let k = 0; k < colunas; k++) {
      const u0 = k / colunas
      const u1 = (k + 1) / colunas
      const escuro = (r + k) % 2 === 0
      c.fillStyle = escuro ? '#3a3638' : '#a8a29a'
      c.beginPath()
      c.moveTo(l0 + (r0 - l0) * u0, y0)
      c.lineTo(l0 + (r0 - l0) * u1, y0)
      c.lineTo(l1 + (r1 - l1) * u1, y1)
      c.lineTo(l1 + (r1 - l1) * u0, y1)
      c.closePath()
      c.fill()
    }
  }
  // A borda some no escuro
  const g = c.createLinearGradient(0, topo, 0, topo + 40)
  g.addColorStop(0, 'rgba(2,2,3,1)')
  g.addColorStop(1, 'rgba(2,2,3,0)')
  c.fillStyle = g
  c.fillRect(0, topo, WORLD_W, 40)
}

/**
 * Uma luz só, de cima: uma lâmpada pendurada no fio, balançando devagar, e
 * o cone dela indo junto. De vez em quando ela falha.
 */
function desenharLuzDentro(c: CanvasRenderingContext2D, t = 0): void {
  const balanco = Math.sin(t * 0.55) * 4
  const lx = 192 + balanco
  const falha = Math.sin(t * 13.7) > 0.985 || Math.sin(t * 7.3 + 1) > 0.993 ? 0.45 : 1
  const forca = (1 + Math.sin(t * 1.7) * 0.06) * falha
  // O fio e a lâmpada.
  c.strokeStyle = 'rgba(30,30,34,1)'
  c.lineWidth = 1
  c.beginPath()
  c.moveTo(192, 0)
  c.lineTo(lx, 22)
  c.stroke()
  c.fillStyle = '#2a2a2e'
  c.fillRect(Math.round(lx) - 2, 22, 4, 2)
  c.fillStyle = `rgba(255,244,214,${(0.85 * forca).toFixed(3)})`
  c.fillRect(Math.round(lx) - 2, 24, 4, 3)
  c.save()
  c.globalCompositeOperation = 'lighter'
  const g = c.createRadialGradient(lx, 118, 4, lx, 118, 120)
  g.addColorStop(0, `rgba(255,248,236,${(0.16 * forca).toFixed(3)})`)
  g.addColorStop(1, 'rgba(255,248,236,0)')
  c.fillStyle = g
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  c.fillStyle = `rgba(255,248,236,${(0.035 * forca).toFixed(3)})`
  c.beginPath()
  c.moveTo(lx - 3, 26)
  c.lineTo(lx + 3, 26)
  c.lineTo(270 + balanco * 2, 150)
  c.lineTo(114 + balanco * 2, 150)
  c.closePath()
  c.fill()
  const gb = c.createRadialGradient(lx, 25, 0, lx, 25, 14)
  gb.addColorStop(0, `rgba(255,240,200,${(0.4 * forca).toFixed(3)})`)
  gb.addColorStop(1, 'rgba(255,240,200,0)')
  c.fillStyle = gb
  c.fillRect(lx - 14, 11, 28, 28)
  c.restore()
}

/** Poeira girando no cone de luz e, de vez em quando, um fio da família caindo do escuro. */
function desenharPoeiraDentro(c: CanvasRenderingContext2D, t: number): void {
  for (let i = 0; i < 26; i++) {
    const vel = 2 + (i % 4)
    const y = (i * 41 + t * vel * 3) % 150
    const abre = y / 150
    const x = 192 + Math.sin(t * 0.4 + i * 1.7) * (8 + abre * 60) + Math.sin(i * 12.9) * abre * 20
    const a = 0.12 + 0.18 * Math.abs(Math.sin(t * 0.9 + i))
    c.fillStyle = `rgba(255,246,226,${a.toFixed(3)})`
    c.fillRect(Math.round(x), Math.round(y + 20), 1, 1)
  }
  const cores = [FIO.Adrian, FIO.Evelyn, FIO.Lia, FIO.Elisa]
  for (let k = 0; k < 4; k++) {
    const ciclo = 14 + k * 3
    const p = ((t + k * 5.3) % ciclo) / ciclo
    const x = 60 + k * 86 + Math.sin(t * 0.8 + k) * 10
    const y = -10 + p * (WORLD_H + 20)
    c.strokeStyle = cores[k] ?? '#999'
    c.globalAlpha = 0.5 * Math.sin(p * Math.PI)
    c.lineWidth = 1
    c.beginPath()
    c.moveTo(x, y)
    c.quadraticCurveTo(x + Math.sin(t * 2 + k) * 4, y + 6, x + Math.sin(t * 1.3 + k) * 2, y + 12)
    c.stroke()
    c.globalAlpha = 1
  }
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
