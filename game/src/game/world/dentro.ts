import type { Input } from '../../engine/input'
import type { GameState } from '../systems/state'
import { WORLD_W, WORLD_H, PAL } from '../../engine/constants'
import { audio } from '../../engine/audio'
import { musica, ESCALA, TEMA } from '../../engine/musica'
import { Dialogue, FONT_FIM, FONT_BODY } from '../systems/dialogue'
import type { Line } from './types'
import { Figura, criarSombraBranca } from './figura'
import { Camada } from '../ui/camada'
import { DENTRO_SOMBRA, DENTRO_CONTA, DENTRO_PAROU, DENTRO_OFERTA } from '../content/demoScript'

/**
 * Dentro: a cabeça de Liam, por baixo da casa.
 *
 * Vácuo preto, uma toalha xadrez enorme no chão, uma luz de cima. As
 * lembranças chegam recortadas — no máximo três coisas por vez — e trocam
 * por corte seco. Em cada recorte há uma coisa torta, brilhando. Arrumar faz
 * o próximo recorte chegar; é o ritual de Liam, e o jogador o executa sem
 * pensar.
 *
 * A saída é parar de arrumar. Quando ele para, a sombra branca aparece
 * inteira, de frente para ele, e faz a oferta: soltar o que não é dele.
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

/** A partir de qual recorte parar de arrumar já conta como parar. */
const PODE_PARAR = 3
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

  comecar(state: GameState): void {
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
    this.preto = 0.12
    audio.bater(1, 0)
    // Uma nota do tema a cada corte, limpa — aqui dentro ele ainda é afinado.
    const graus = TEMA.flat()
    const f = ESCALA[graus[i % graus.length] ?? 0]
    if (f) musica.nota(f / 2, 0.55, 4)
    const fala = DENTRO_SOMBRA[i]
    if (fala) this.dialogue.play([{ sombra: true, text: fala, style: 'speech' }])
  }

  private parar(acabou: boolean): void {
    this.fase = 'parou'
    this.preto = 0.4
    audio.bater(1, 0)
    this.sombra.x = 236
    this.liam.x = 150
    const falas: Line[] = acabou
      ? [{ sombra: true, text: 'Acabaram as coisas fora do lugar. E lá em cima eles continuam brigando. Viu? Nunca foi o garfo.', style: 'speech' }]
      : DENTRO_PAROU
    this.dialogue.play([...falas, ...DENTRO_OFERTA], () => {
      this.fase = 'fim'
      this.done = true
      musica.desafinado = this.antes.desafinado
      musica.abafado = this.antes.abafado
    })
  }

  update(dt: number, input: Input): void {
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
      this.arrumando = Math.min(1, this.arrumando + dt * 4)
      if (this.arrumando >= 1 && this.tCorte > 0.35) {
        const prox = this.corte + 1
        if (prox >= CORTES.length) this.parar(true)
        else this.entrarCorte(prox)
      }
      input.consumeConfirm()
      input.consumeTap()
      return
    }

    const tocou = input.consumeConfirm() || input.consumeTap() !== null
    if (tocou && this.tCorte > 0.25) {
      // Primeiro toque termina de escrever a frase; o seguinte arruma.
      if (!this.dialogue.completa) {
        this.dialogue.confirm()
        return
      }
      this.arrumou = true
      this.arrumando = 0
      this.tCorte = 0
      this.arrumados++
      audio.pickup()
      return
    }

    if (this.dialogue.completa) this.parado += dt
    if (this.corte >= PODE_PARAR && this.parado > PARADO) this.parar(false)
  }

  /** O vácuo, a toalha, a luz e o recorte da vez. */
  render(c: CanvasRenderingContext2D): void {
    c.fillStyle = '#020203'
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    if (this.preto > 0) return

    this.toalha(c)
    this.luz(c)

    if (this.fase === 'cortes') {
      const corte = CORTES[this.corte]
      if (corte) this.recorte(c, corte)
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

  /** A toalha xadrez da mesa da cozinha, do tamanho do chão inteiro. */
  private toalha(c: CanvasRenderingContext2D): void {
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

  /** Uma luz só, de cima, em cone. */
  private luz(c: CanvasRenderingContext2D): void {
    c.save()
    c.globalCompositeOperation = 'lighter'
    const g = c.createRadialGradient(192, 118, 4, 192, 118, 120)
    g.addColorStop(0, 'rgba(255,248,236,0.16)')
    g.addColorStop(1, 'rgba(255,248,236,0)')
    c.fillStyle = g
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    c.fillStyle = 'rgba(255,248,236,0.035)'
    c.beginPath()
    c.moveTo(176, 0)
    c.lineTo(208, 0)
    c.lineTo(270, 150)
    c.lineTo(114, 150)
    c.closePath()
    c.fill()
    c.restore()
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

  /** Desenha `f` girado em torno de (x, y). */
  private girado(c: CanvasRenderingContext2D, x: number, y: number, ang: number, f: () => void): void {
    c.save()
    c.translate(x, y)
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

  /** O que vai por cima, em resolução de tela: a conta e a voz da sombra. */
  renderUI(c: CanvasRenderingContext2D, cssW: number, cssH: number): void {
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
    if (this.fase === 'cortes' && this.corte < 2 && this.parado > 5 && !this.arrumou) {
      const s = Math.max(12, Math.min(cssW / 70, 17))
      c.save()
      c.textAlign = 'center'
      c.globalAlpha = 0.35 + Math.sin(this.t * 3) * 0.2
      c.fillStyle = PAL.inkDim
      c.font = `${s}px ${FONT_BODY}`
      c.fillText('E arruma', cssW / 2, cssH * 0.3)
      c.restore()
    }
    this.dialogue.render(c, cssW, cssH)
  }
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
