import type { Input } from '../../engine/input'
import type { Display } from '../../engine/display'
import type { GameState } from '../systems/state'
import { WORLD_W, WORLD_H, PAL } from '../../engine/constants'
import { audio, sons } from '../../engine/audio'
import { Dialogue, FONT_BODY } from '../systems/dialogue'
import type { Line } from './types'
import { Figura, criarSombraBranca, VISUAL } from './figura'
import { ret, sorteio } from './arte'
import {
  GAIOLA_ENTRADA, POEMA, PEGAR, LARGAR, PORTA_NAO_ABRE, PORTA_CHAVE, PORTA_ABRE,
  GAIOLA_DICA_PENA_CHAO, GAIOLA_DICA_PENA_MAO, GAIOLA_DICA_POEMA, GAIOLA_DICA_SOMBRA, GAIOLA_LIMPA,
} from '../content/gaiola'
import type { ObjetoGaiola } from '../content/gaiola'

/**
 * A gaiola: o primeiro quarto de dentro da cabeça de Liam.
 *
 * Uma sala vazia no escuro, uma lâmpada só. No meio, uma gaiola aberta. Em
 * volta, uma pena, uma corrente quebrada, uma chave enferrujada — e, no
 * fundo, uma porta fechada. Na parede, o poema.
 *
 * O jogador pensa: a chave abre a porta. Não abre: a porta não tem
 * fechadura. Tudo que Liam pega, ele carrega (anda mais devagar, a mão
 * ocupada), e carregando qualquer coisa — ou com a gaiola fechada por ele —
 * a porta não abre. A saída é não pegar nada e só atravessar. Quem pegou
 * pode devolver: cada coisa volta para o lugar dela.
 *
 * É um puzzle obrigatório. Se o jogador demorar muito de verdade, a própria
 * sala ajuda, sem texto de dica: a pena sai voando e passa por baixo da
 * porta; depois o fim do poema acende; por último a sombra aparece, diz uma
 * frase, e tudo que ele segurava cai da mão.
 */

const CHAO = 176
const PORTA_X = 344
/** Até onde ele chega com a porta fechada. */
const ENCOSTA = PORTA_X - 18
const X: Record<ObjetoGaiola | 'poema', number> = {
  poema: 58,
  pena: 112,
  gaiola: 182,
  corrente: 238,
  chave: 286,
}
const ALCANCE = 15
const VELOCIDADE = 46
/** Segundos parado no problema até a sala ajudar, de etapa em etapa. */
const DICAS = [80, 135, 190]

type Fase = 'entrando' | 'sala' | 'saindo' | 'branco' | 'fim'

export class Gaiola {
  done = false
  /** O que ele está segurando (a gaiola conta quando ele fechou). */
  readonly segurando = new Set<ObjetoGaiola>()
  /** Pegou alguma coisa em algum momento (para a sombra, e para os testes). */
  tocou = false
  private fase: Fase = 'entrando'
  private tFase = 0
  private t = 0
  private dialogue = new Dialogue()
  private liam = new Figura({
    ...VISUAL.liam, x: 30, y: CHAO, altura: 31,
    cor: { roupa: '#252a3a', cabelo: '#12151f', pele: '#6d5a52', sombra: 'rgba(0,0,0,0.5)' },
  })
  private sombra = criarSombraBranca(PORTA_X - 30, CHAO, 35)
  private sombraVis = 0
  private destino: number | null = null
  private usarAoChegar = false
  /** 0..1: a porta abrindo. */
  private porta = 0
  private bateu = false
  private idxPorta = 0
  private semResolver = 0
  /** Quantas ajudas a sala já deu. */
  dica = 0
  private pena: { x: number; y: number; t: number } | null = null
  private penaSumiu = false
  private poemaAceso = 0
  private branco = 0
  private estado: GameState | null = null

  comecar(state: GameState): void {
    this.estado = state
    this.liam.olhar = 1
    audio.setAmbient(0.12, 0.6)
    this.dialogue.play(GAIOLA_ENTRADA, () => {
      this.fase = 'sala'
      this.tFase = 0
    })
  }

  /** Livre para sair: nada na mão, a gaiola como estava. */
  get livre(): boolean {
    return this.segurando.size === 0
  }

  /** Para os testes: onde ele está e o que está perto. */
  get x(): number {
    return this.liam.x
  }

  get faseAtual(): Fase {
    return this.fase
  }

  private perto(): ObjetoGaiola | 'poema' | 'porta' | null {
    const x = this.liam.x
    if (Math.abs(x - ENCOSTA) < 10 || x > ENCOSTA) return 'porta'
    let melhor: ObjetoGaiola | 'poema' | null = null
    let dist = ALCANCE
    for (const [k, ox] of Object.entries(X) as [ObjetoGaiola | 'poema', number][]) {
      if (k === 'pena' && this.penaSumiu) continue
      const d = Math.abs(x - ox)
      if (d < dist) {
        dist = d
        melhor = k
      }
    }
    return melhor
  }

  private rotulo(alvo: ObjetoGaiola | 'poema' | 'porta'): string {
    if (alvo === 'poema') return 'Ler'
    if (alvo === 'porta') return 'Abrir'
    if (alvo === 'gaiola') return this.segurando.has('gaiola') ? 'Abrir' : 'Fechar'
    return this.segurando.has(alvo) ? 'Devolver' : 'Pegar'
  }

  private falar(linhas: Line[], depois?: () => void): void {
    this.destino = null
    this.liam.andando = 0
    this.dialogue.play(linhas, depois)
  }

  private usar(alvo: ObjetoGaiola | 'poema' | 'porta'): void {
    if (alvo === 'poema') {
      this.liam.costas = true
      this.falar(POEMA)
      return
    }
    if (alvo === 'porta') {
      this.tentarPorta(true)
      return
    }
    if (this.segurando.has(alvo)) {
      this.segurando.delete(alvo)
      audio.interact()
      this.falar(LARGAR[alvo])
      return
    }
    this.segurando.add(alvo)
    this.tocou = true
    audio.pickup()
    this.falar(PEGAR[alvo])
  }

  /** Contra a porta: abre se ele não segura nada; senão, não. */
  private tentarPorta(usando: boolean): void {
    if (this.livre) {
      this.abrirPorta()
      return
    }
    audio.refuse()
    if (usando && this.segurando.has('chave')) {
      this.falar(PORTA_CHAVE)
      return
    }
    const fala = PORTA_NAO_ABRE[this.idxPorta % PORTA_NAO_ABRE.length] ?? []
    this.idxPorta++
    this.falar(fala)
  }

  private abrirPorta(): void {
    this.fase = 'saindo'
    this.tFase = 0
    this.destino = null
    sons.porta()
    const linhas = [...PORTA_ABRE, ...(this.tocou ? [] : GAIOLA_LIMPA)]
    if (!this.tocou) this.estado?.descobrir('gaiola')
    this.dialogue.play(linhas)
  }

  update(dt: number, input: Input, display?: Display): void {
    this.t += dt
    this.tFase += dt
    this.dialogue.update(dt)
    this.liam.update(dt)
    this.sombra.update(dt)
    this.poemaAceso = Math.max(this.poemaAceso, this.dica >= 2 ? Math.min(1, this.poemaAceso + dt * 0.6) : 0)
    this.sombraVis += ((this.dica >= 3 && this.fase === 'sala' ? 1 : 0) - this.sombraVis) * Math.min(1, dt * 1.5)
    this.voarPena(dt)

    if (this.fase === 'branco') {
      this.branco = Math.min(1, this.branco + dt / 1.2)
      input.consumeConfirm()
      input.consumeTap()
      if (this.branco >= 1) {
        this.fase = 'fim'
        this.done = true
      }
      return
    }
    if (this.fase === 'saindo') {
      this.porta = Math.min(1, this.porta + dt / 0.7)
      if (this.dialogue.active) {
        if (input.consumeConfirm()) this.dialogue.confirm()
        input.consumeTap()
        return
      }
      // Ele atravessa a luz.
      this.liam.costas = false
      this.liam.olhar = 1
      this.liam.andando = 1
      this.liam.x += VELOCIDADE * dt
      if (this.liam.x > PORTA_X + 14) this.fase = 'branco'
      return
    }

    if (this.dialogue.active) {
      this.liam.andando = 0
      if (input.consumeConfirm()) this.dialogue.confirm()
      input.consumeTap()
      return
    }
    this.liam.costas = false
    if (this.fase === 'entrando') return

    this.ajudar(dt)
    if (this.dialogue.active) return

    const tap = input.consumeTap()
    const confirmou = input.consumeConfirm()
    if (!tap && confirmou) {
      const alvo = this.perto()
      if (alvo) {
        this.usar(alvo)
        return
      }
    }
    if (tap && display) {
      const wx = display.toWorldX(tap.x)
      const alvo = this.alvoEm(wx)
      this.destino = alvo ? (alvo === 'porta' ? ENCOSTA + 2 : X[alvo]) : Math.max(24, Math.min(ENCOSTA, wx))
      this.usarAoChegar = alvo !== null
    }
    this.andar(dt, input)
  }

  private alvoEm(wx: number): ObjetoGaiola | 'poema' | 'porta' | null {
    if (Math.abs(wx - PORTA_X) < 22) return 'porta'
    for (const [k, ox] of Object.entries(X) as [ObjetoGaiola | 'poema', number][]) {
      if (k === 'pena' && this.penaSumiu) continue
      if (Math.abs(wx - ox) < 14) return k
    }
    return null
  }

  private andar(dt: number, input: Input): void {
    const eixo = input.moveAxis()
    let dx = eixo ? eixo.x : 0
    if (eixo) this.destino = null
    if (this.destino !== null && dx === 0) {
      const d = this.destino - this.liam.x
      if (Math.abs(d) < 2) {
        this.destino = null
        if (this.usarAoChegar) {
          this.usarAoChegar = false
          const alvo = this.perto()
          if (alvo) {
            this.usar(alvo)
            return
          }
        }
      } else {
        dx = Math.sign(d)
      }
    }
    // Tudo que ele segura pesa: anda mais devagar.
    const peso = 1 - this.segurando.size * 0.12
    const antes = this.liam.x
    const limite = this.livre ? ENCOSTA + 4 : ENCOSTA
    this.liam.x = Math.max(24, Math.min(limite, this.liam.x + dx * VELOCIDADE * peso * dt))
    this.liam.andando = this.liam.x !== antes ? 1 : 0
    if (dx !== 0) this.liam.olhar = Math.sign(dx)
    // Chegou na porta andando: livre, ela abre; carregando, ele bate nela.
    if (dx > 0 && this.liam.x >= ENCOSTA) {
      if (this.livre) {
        this.abrirPorta()
        return
      }
      if (!this.bateu) {
        this.bateu = true
        this.tentarPorta(false)
      }
    }
    if (this.liam.x < ENCOSTA - 30) this.bateu = false
  }

  /** A sala ajuda quem está preso aqui há muito tempo. Nunca com texto de dica. */
  private ajudar(dt: number): void {
    this.semResolver += dt
    const proxima = DICAS[this.dica]
    if (proxima === undefined || this.semResolver < proxima) return
    this.dica++
    if (this.dica === 1 && !this.penaSumiu) {
      const naMao = this.segurando.has('pena')
      this.segurando.delete('pena')
      this.pena = { x: naMao ? this.liam.x + 4 : X.pena, y: naMao ? CHAO - 16 : CHAO - 2, t: 0 }
      sons.pisada(0.2)
      this.falar(naMao ? GAIOLA_DICA_PENA_MAO : GAIOLA_DICA_PENA_CHAO)
      return
    }
    if (this.dica <= 2) {
      this.falar(GAIOLA_DICA_POEMA)
      return
    }
    this.falar(GAIOLA_DICA_SOMBRA, () => {
      this.segurando.clear()
      audio.bater(1, 0)
    })
  }

  /** A pena voando até a porta e passando por baixo dela. */
  private voarPena(dt: number): void {
    const p = this.pena
    if (!p) return
    p.t += dt
    const alvoX = PORTA_X
    p.x += (alvoX - p.x) * Math.min(1, dt * 0.55)
    p.y = CHAO - 22 + Math.sin(p.t * 2.4) * 8 + Math.min(20, p.t * 4)
    if (Math.abs(p.x - alvoX) < 3) {
      this.pena = null
      this.penaSumiu = true
    }
  }

  render(c: CanvasRenderingContext2D): void {
    c.fillStyle = '#020203'
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    // A parede, quase invisível, e o chão de tábuas
    ret(c, 0, 26, WORLD_W, CHAO - 26, '#0a0b10')
    for (let x = 8; x < WORLD_W; x += 22) ret(c, x, 26, 1, CHAO - 26, 'rgba(255,255,255,0.025)')
    ret(c, 0, CHAO, WORLD_W, WORLD_H - CHAO, '#0d0c0e')
    for (let y = CHAO + 6; y < WORLD_H; y += 8) ret(c, 0, y, WORLD_W, 1, 'rgba(0,0,0,0.5)')
    ret(c, 0, CHAO, WORLD_W, 1, 'rgba(255,255,255,0.06)')

    // A lâmpada em cima da gaiola, e o cone de luz
    ret(c, X.gaiola, 0, 1, 22, 'rgba(160,150,140,0.5)')
    ret(c, X.gaiola - 3, 22, 7, 5, '#3a3530')
    ret(c, X.gaiola - 2, 27, 5, 3, '#f8e8c0')
    c.save()
    c.globalCompositeOperation = 'lighter'
    const cone = c.createLinearGradient(0, 28, 0, CHAO + 10)
    cone.addColorStop(0, 'rgba(255,236,200,0.2)')
    cone.addColorStop(1, 'rgba(255,236,200,0.03)')
    c.fillStyle = cone
    c.beginPath()
    c.moveTo(X.gaiola - 4, 28)
    c.lineTo(X.gaiola + 4, 28)
    c.lineTo(X.gaiola + 110, CHAO + 10)
    c.lineTo(X.gaiola - 110, CHAO + 10)
    c.closePath()
    c.fill()
    const poca = c.createRadialGradient(X.gaiola, CHAO + 4, 2, X.gaiola, CHAO + 4, 110)
    poca.addColorStop(0, 'rgba(255,230,190,0.18)')
    poca.addColorStop(1, 'rgba(255,230,190,0)')
    c.fillStyle = poca
    c.fillRect(X.gaiola - 120, CHAO - 20, 240, 60)
    c.restore()

    this.desenharPoema(c)
    this.desenharGaiola(c)
    if (!this.segurando.has('corrente')) this.desenharCorrente(c, X.corrente, CHAO)
    // O prego, com ou sem a chave
    ret(c, X.chave, 128, 2, 2, '#5a5a60')
    if (!this.segurando.has('chave')) this.desenharChave(c, X.chave - 2, 130, false)
    if (!this.segurando.has('pena') && !this.penaSumiu && !this.pena) this.desenharPena(c, X.pena, CHAO - 1, 0)
    if (this.pena) this.desenharPena(c, this.pena.x, this.pena.y, Math.sin(this.pena.t * 3) * 0.5)
    this.desenharPorta(c)

    // A sombra, perto da porta, na última ajuda
    if (this.sombraVis > 0.02) {
      c.save()
      c.globalAlpha = this.sombraVis
      this.sombra.olhar = -1
      this.sombra.draw(c, X.gaiola, 'rgba(255,255,255,0.2)')
      c.restore()
    }
    this.liam.draw(c, X.gaiola, 'rgba(255,236,200,0.3)')
    this.desenharNaMao(c)

    // A luz da porta aberta engolindo a sala, e o branco do fim
    if (this.porta > 0) {
      c.save()
      c.globalCompositeOperation = 'lighter'
      const g = c.createRadialGradient(PORTA_X, CHAO - 30, 4, PORTA_X, CHAO - 30, 220)
      g.addColorStop(0, `rgba(255,255,255,${0.5 * this.porta})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      c.fillStyle = g
      c.fillRect(0, 0, WORLD_W, WORLD_H)
      c.restore()
    }
    if (this.branco > 0) {
      c.fillStyle = `rgba(250,250,255,${this.branco})`
      c.fillRect(0, 0, WORLD_W, WORLD_H)
    }
  }

  private desenharPoema(c: CanvasRenderingContext2D): void {
    const x = X.poema - 18
    const y = 58
    ret(c, x, y, 36, 44, 'rgba(210,200,180,0.14)')
    // As cinco linhas, à mão; as duas últimas acendem na segunda ajuda.
    const r = sorteio(12)
    for (let i = 0; i < 5; i++) {
      const larg = 22 + Math.floor(r() * 9)
      const aceso = i >= 3 ? this.poemaAceso : 0
      const cor = aceso > 0 ? `rgba(255,236,190,${0.35 + aceso * 0.6})` : 'rgba(220,210,190,0.35)'
      for (let k = 0; k < larg; k += 2) ret(c, x + 4 + k, y + 8 + i * 7 + (k % 4 === 0 ? 0 : 1), 1 + (k % 3 === 0 ? 1 : 0), 1, cor)
    }
    if (this.poemaAceso > 0) {
      c.save()
      c.globalCompositeOperation = 'lighter'
      const g = c.createRadialGradient(X.poema, y + 32, 2, X.poema, y + 32, 30)
      g.addColorStop(0, `rgba(255,220,160,${0.25 * this.poemaAceso})`)
      g.addColorStop(1, 'rgba(255,220,160,0)')
      c.fillStyle = g
      c.fillRect(X.poema - 30, y, 60, 64)
      c.restore()
    }
  }

  private desenharGaiola(c: CanvasRenderingContext2D): void {
    const cx = X.gaiola
    const base = CHAO
    const topo = base - 54
    const larg = 36
    const ferro = '#8a7a68'
    // Pé e base
    ret(c, cx - 3, base - 8, 6, 8, '#3a3028')
    ret(c, cx - 14, base - 2, 28, 2, '#3a3028')
    ret(c, cx - larg / 2, base - 12, larg, 4, '#4a3e32')
    // A cúpula
    c.strokeStyle = ferro
    c.lineWidth = 1
    c.beginPath()
    c.ellipse(cx, topo + 10, larg / 2, 12, 0, Math.PI, 0)
    c.stroke()
    ret(c, cx - 1, topo - 6, 2, 4, ferro)
    c.beginPath()
    c.arc(cx, topo - 8, 2.5, 0, Math.PI * 2)
    c.stroke()
    // As grades
    for (let i = 0; i <= 8; i++) {
      const bx = cx - larg / 2 + (larg / 8) * i
      ret(c, Math.round(bx), topo + 10, 1, base - 12 - topo - 10, ferro)
    }
    ret(c, cx - larg / 2, topo + 26, larg, 1, ferro)
    // O poleiro, vazio
    ret(c, cx - 10, topo + 30, 20, 1, '#6a5038')
    // A portinha: aberta, para fora, ou fechada por ele
    const fechada = this.segurando.has('gaiola')
    const px = cx + 4
    const py = topo + 30
    if (fechada) {
      for (let i = 0; i <= 3; i++) ret(c, px + i * 3, py, 1, 12, '#b8a890')
      ret(c, px, py, 10, 1, '#b8a890')
      ret(c, px + 4, py + 6, 3, 2, '#d8c8a8')
    } else {
      // Aberta: a portinha girada para fora, e o vão
      ret(c, px, py, 10, 12, '#020203')
      for (let i = 0; i <= 3; i++) ret(c, px + 10 + i, py - i, 1, 12, ferro)
      ret(c, px + 10, py, 4, 1, ferro)
    }
  }

  private desenharCorrente(c: CanvasRenderingContext2D, x: number, chao: number): void {
    // Elos no chão, e a argola do pulso aberta na ponta
    for (let i = 0; i < 7; i++) {
      const ex = x - 14 + i * 4
      const ey = chao - 3 - (i % 2)
      c.strokeStyle = '#7a7470'
      c.lineWidth = 1
      c.beginPath()
      c.ellipse(ex, ey, 2, 1.3, i % 2 ? 0 : Math.PI / 2, 0, Math.PI * 2)
      c.stroke()
    }
    // O elo partido no meio
    ret(c, x - 1, chao - 6, 1, 2, '#9a948e')
    ret(c, x + 1, chao - 5, 1, 2, '#9a948e')
    c.strokeStyle = '#8a8480'
    c.beginPath()
    c.arc(x + 16, chao - 4, 3.5, Math.PI * 0.2, Math.PI * 1.7)
    c.stroke()
  }

  private desenharChave(c: CanvasRenderingContext2D, x: number, y: number, deitada: boolean): void {
    const cor = '#8a5a34'
    if (deitada) {
      ret(c, x, y, 7, 1, cor)
      ret(c, x + 5, y + 1, 1, 2, cor)
      c.strokeStyle = cor
      c.beginPath()
      c.arc(x - 2, y, 2, 0, Math.PI * 2)
      c.stroke()
      return
    }
    c.strokeStyle = cor
    c.lineWidth = 1
    c.beginPath()
    c.arc(x + 1, y + 2, 2.2, 0, Math.PI * 2)
    c.stroke()
    ret(c, x + 1, y + 4, 1, 8, cor)
    ret(c, x + 2, y + 9, 2, 1, cor)
    ret(c, x + 2, y + 11, 2, 1, cor)
    // Ferrugem
    ret(c, x + 1, y + 7, 1, 1, '#5a2e1a')
  }

  private desenharPena(c: CanvasRenderingContext2D, x: number, y: number, giro: number): void {
    c.save()
    c.translate(x, y)
    c.rotate(giro - 0.3)
    c.fillStyle = '#ece8e0'
    c.beginPath()
    c.ellipse(0, 0, 5, 1.6, 0, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#b8b4ac'
    c.fillRect(-6, 0, 12, 0.6)
    c.restore()
  }

  /** O que ele carrega, na mão e no pulso. */
  private desenharNaMao(c: CanvasRenderingContext2D): void {
    const f = this.liam
    const lado = f.olhar >= 0 ? 1 : -1
    const mx = Math.round(f.x + lado * 5)
    const my = Math.round(f.y - f.altura * 0.42)
    if (this.segurando.has('pena')) this.desenharPena(c, mx + lado * 2, my - 1, lado * 0.6)
    if (this.segurando.has('chave')) this.desenharChave(c, mx - lado * 8, my + 2, true)
    if (this.segurando.has('corrente')) {
      for (let i = 0; i < 4; i++) {
        c.strokeStyle = '#7a7470'
        c.lineWidth = 1
        c.beginPath()
        c.ellipse(mx, my + 3 + i * 3, 1.3, 2, 0, 0, Math.PI * 2)
        c.stroke()
      }
    }
  }

  private desenharPorta(c: CanvasRenderingContext2D): void {
    const x = PORTA_X
    const alt = 64
    const larg = 30
    const y = CHAO - alt
    ret(c, x - larg / 2 - 3, y - 3, larg + 6, alt + 3, '#1a1816')
    // O vão branco, por trás da folha
    ret(c, x - larg / 2, y, larg, alt, this.porta > 0 ? '#f4f2ee' : '#0e0d10')
    // A folha: lisa, sem maçaneta e sem fechadura. Abrindo, ela gira e estreita.
    const fw = Math.max(3, Math.round(larg * (1 - this.porta)))
    ret(c, x - larg / 2, y, fw, alt, '#26221e')
    ret(c, x - larg / 2, y, fw, 1, '#3a342e')
    if (fw > 10) {
      ret(c, x - larg / 2 + 4, y + 6, fw - 8, alt * 0.4, '#2c2722')
      ret(c, x - larg / 2 + 4, y + 10 + alt * 0.4, fw - 8, alt * 0.42, '#2c2722')
    }
    // A luz por baixo: alguma coisa clara do outro lado
    if (this.porta === 0) {
      const a = 0.35 + Math.sin(this.t * 1.2) * 0.1
      ret(c, x - larg / 2, CHAO - 1, larg, 1, `rgba(250,248,240,${a})`)
    }
  }

  renderUI(c: CanvasRenderingContext2D, cssW: number, cssH: number, display?: Display): void {
    // O que está ao alcance: só a ação, sem tecla.
    if (this.fase === 'sala' && !this.dialogue.active && display) {
      const alvo = this.perto()
      if (alvo && !(alvo === 'porta' && this.livre)) {
        const s = Math.max(12, Math.min(cssW / 70, 17))
        const txt = this.rotulo(alvo)
        const sx = display.toScreenX(this.liam.x)
        const sy = display.toScreenY(this.liam.y - 40)
        c.save()
        c.font = `${s}px ${FONT_BODY}`
        c.textAlign = 'center'
        const w = c.measureText(txt).width + s * 1.8
        c.fillStyle = 'rgba(4,6,11,0.85)'
        c.fillRect(sx - w / 2, sy - s, w, s * 1.9)
        c.fillStyle = PAL.ink
        c.fillText(txt, sx, sy + s * 0.45)
        c.restore()
      }
    }
    this.dialogue.render(c, cssW, cssH)
  }
}
