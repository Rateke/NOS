import type { Scene, SceneCtx } from '../types'
import { Dialogue } from '../../systems/dialogue'
import { Piano } from '../../systems/piano'
import { audio } from '../../../engine/audio'
import { musica, TEMA, ESCALA } from '../../../engine/musica'
import { Figura, VISUAL } from '../../world/figura'
import { Particulas } from '../../world/particulas'
import { drawSalaFundo, drawSalaFrente, drawLuzSala, LUZ_PIANO, BANCO_Y, PIANO, PASSO_Y } from '../../world/sala'
import {
  PROLOGO_ABERTURA, PROLOGO_FRASES, PROLOGO_ACERTOU_FRASE, PROLOGO_ERRO,
  PROLOGO_ACERTO, PROLOGO_LIVRE, PROLOGO_FECHO, PROLOGO_SUBINDO,
  PROLOGO_GRITO, PROLOGO_RESPIRA, PROLOGO_RESPIROU, PROLOGO_NAO_RESPIROU,
} from '../../content/demoScript'
import { Respiracao } from '../../ui/respiracao'
import { CasaScene } from './casa'
import { Etiquetas } from '../../ui/etiqueta'
import { Camada } from '../../ui/camada'
import { memoria } from '../../systems/memoria'
import { DE_NOVO_PROLOGO, DE_NOVO_ACERTOU } from '../../content/deNovo'

type Fase = 'entrada' | 'escuta' | 'toca' | 'livre' | 'fecho' | 'saida'

/**
 * O piano do pai por baixo do violino do filho: um acorde por frase, uma
 * nota dele a cada nota certa do Liam. Ré menor, lá maior, si bemol.
 */
const ACOMPANHA: number[][] = [
  [73.42, 110.0, 146.83, 174.61],
  [55.0, 82.41, 110.0, 138.59],
  [58.27, 87.31, 116.54, 146.83],
]

/**
 * A Música.
 *
 * Único momento quente da obra, e o único em que o jogador aprende algo de
 * verdade: três frases que crescem, de ouvido. O pai toca no piano; Liam
 * responde no violino, em pé do lado dele — e quando acerta, os dois tocam
 * juntos. Quando erra, o pai bate no piano. Depois de zerar o jogo, ele
 * grita, e Liam tem de respirar com o arco tremendo na corda. O tema que
 * ele aprende aqui é o que vai abrir os fios lá embaixo.
 */
export class PrologoScene implements Scene {
  readonly id = 'demo-prologo'
  readonly ponto = 'prologo' as const

  private dialogue = new Dialogue()
  private piano = new Piano()
  private etiquetas = new Etiquetas()
  private camada = new Camada()
  private fase: Fase = 'entrada'
  private t = 0
  private calor = 0
  private saida = 0

  /** Qual frase do tema está em jogo, e onde o jogador está dentro dela. */
  private frase = 0
  private passo = 0
  private idxDemo = 0
  private proxNota = 0
  private erros = 0
  private livreAte = 0
  /** As últimas notas do momento livre, para reconhecer o tema ao contrário. */
  private ultimas: number[] = []
  private ouviuSubindo = false
  /** Já zerou: o erro vira grito, e o grito pede respiração. */
  private deNovo = false
  private gritos = 0
  /** Liam respirando com o arco na corda (exposto para os testes). */
  respiracao = new Respiracao()
  /** O arco: onde está na corda (-1..1) e para onde vai. */
  private arcada = 0
  private arcoDir = 1
  /** O piano batido no erro: a tela treme junto. */
  private tranco = 0

  // O pai no banco do piano, de costas para a câmera; Liam em pé do lado,
  // de perfil, com o violino no ombro.
  private adrian = new Figura({
    ...VISUAL.adrian,
    x: PIANO.cx - 4, y: BANCO_Y, altura: 40, barba: true, gola: '#d4ccc0',
    cor: { roupa: '#2b2129', cabelo: '#171017', pele: '#6a4f48', sombra: 'rgba(0,0,0,0)' },
    pose: 'sentado',
  })
  private liam = new Figura({
    ...VISUAL.liam,
    x: PIANO.x1 + 12, y: PASSO_Y, altura: 31,
    cor: { roupa: '#252a3a', cabelo: '#12151f', pele: '#6d5a52', sombra: 'rgba(0,0,0,0.4)' },
  })
  private po = new Particulas()
  private dedilhado = 0

  /** Exposto para o clique nas teclas e para os testes. */
  get caixas(): { x: number; y: number; w: number; h: number }[] {
    return this.piano.caixas
  }

  private get fraseAtual(): readonly number[] {
    return TEMA[this.frase] ?? []
  }

  enter(ctx: SceneCtx): void {
    this.deNovo = memoria.terminou
    this.piano.instrumento = 'violino'
    this.camada.mostrar(ctx.state, 'lembranca', 7)
    audio.setAmbient(0.16, 2)
    musica.desafinado = 0
    musica.abafado = 0
    musica.iniciarPad()
    musica.setPad(0.5, 6)
    // Na segunda vez, o pai percebe antes de qualquer coisa.
    const abre = memoria.terminou ? [...DE_NOVO_PROLOGO, ...PROLOGO_ABERTURA.slice(1)] : PROLOGO_ABERTURA
    this.dialogue.play(abre, () => this.comecarFrase())
  }

  private comecarFrase(): void {
    this.fase = 'escuta'
    this.idxDemo = 0
    this.passo = 0
    this.proxNota = this.t + 0.9
    const fala = PROLOGO_FRASES[this.frase]
    if (fala) this.dialogue.play(fala)
  }

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt
    this.etiquetas.update(dt)
    this.camada.update(dt)
    // Os dois são apresentados pelas etiquetas, na letra do Adrian.
    if (this.t > 1.4) this.etiquetas.apresentar(ctx.state, 'Adrian', 7)
    if (this.t > 4.2) this.etiquetas.apresentar(ctx.state, 'Liam', 7)
    this.calor = Math.min(1, this.calor + dt / 2.5)
    this.piano.update(dt)
    this.animar(dt)
    this.dialogue.update(dt)
    this.tranco = Math.max(0, this.tranco - dt * 2.5)
    this.piano.tremor = Math.max(this.respiracao.ativa ? 0.8 : 0, this.piano.tremor - dt * 0.4)
    if (this.respiracao.ativa) {
      this.respiracao.update(dt, ctx.input)
      return
    }

    if (this.dialogue.active) {
      if (ctx.input.consumeConfirm()) this.dialogue.confirm()
      // Na vez do jogador as teclas respondem mesmo com a fala na tela.
      if (this.fase !== 'toca' && this.fase !== 'livre') return
    }

    if (this.fase === 'escuta') this.adrianToca()
    else if (this.fase === 'toca') this.jogadorToca(ctx)
    else if (this.fase === 'livre') this.livre(ctx)
    else if (this.fase === 'saida') this.sair(dt, ctx)
  }

  /** Adrian toca a frase; as teclas acendem sozinhas. */
  private adrianToca(): void {
    if (this.t < this.proxNota) return
    const grau = this.fraseAtual[this.idxDemo]
    if (grau === undefined) {
      this.fase = 'toca'
      this.passo = 0
      return
    }
    this.piano.mostrar(grau)
    this.dedilhado = 1
    this.idxDemo++
    this.proxNota = this.t + 0.62
  }

  private jogadorToca(ctx: SceneCtx): void {
    const tocada = this.piano.ler(ctx.input, ctx.display)
    if (tocada === null) return
    this.dedilhado = 1
    this.puxarArco()

    if (this.fraseAtual[this.passo] === tocada) {
      // Ele toca junto: uma nota do acorde da frase, embaixo do violino.
      const acorde = ACOMPANHA[this.frase] ?? []
      const f = acorde[this.passo % acorde.length]
      if (f) musica.nota(f, this.passo === 0 ? 0.55 : 0.34, 3.2)
      if (this.passo === 0 && acorde[0]) musica.nota(acorde[0] / 2, 0.4, 4)
      this.passo++
      if (this.passo >= this.fraseAtual.length) {
        // A frase inteira: o acorde todo, os dois juntos.
        for (const n of ACOMPANHA[0] ?? []) musica.nota(n, 0.42, 4.5)
        this.acertou()
      }
      return
    }

    this.erros++
    this.passo = 0
    if (this.deNovo) {
      this.gritar()
      return
    }
    // A bronca: ele bate no piano, vira para o filho e fala baixo.
    this.baterNoPiano(0.8)
    const fala = PROLOGO_ERRO[Math.min(this.erros - 1, PROLOGO_ERRO.length - 1)]
    if (fala) this.dialogue.play(fala, () => this.repetir())
    else this.repetir()
  }

  /** As duas mãos dele no grave do piano, de uma vez. */
  private baterNoPiano(forca: number): void {
    for (const f of [36.71, 38.89, 73.42, 77.78, 110.0]) musica.nota(f, forca, 2.6)
    audio.refuse()
    audio.heartbeat(0.2 + forca * 0.1)
    this.tranco = forca
    this.liam.tremor = 1.2 * forca
  }

  /**
   * Depois de zerar: o grito. Liam fica com o arco parado na corda, o arco
   * tremendo, e tem de respirar no ritmo antes de tentar de novo.
   */
  private gritar(): void {
    this.baterNoPiano(1)
    const fala = PROLOGO_GRITO[Math.min(this.gritos, PROLOGO_GRITO.length - 1)] ?? []
    this.gritos++
    this.dialogue.play([...fala, ...PROLOGO_RESPIRA], () => {
      const grau = this.fraseAtual[0] ?? 0
      const f = ESCALA[grau]
      // O arco fica na corda: uma nota longa, fraca, que treme.
      if (f) musica.arco('violino', f * 2, 8.6, 0.55, 'piano', 0.3)
      this.piano.tremor = 1
      this.respiracao.comecar({
        ciclos: 2, periodo: 4.2, tolerancia: 0.24,
        onFim: (ok) => {
          this.piano.tremor = ok ? 0.15 : 0.6
          this.liam.tremor = ok ? 0 : 0.8
          this.dialogue.play(ok ? PROLOGO_RESPIROU : PROLOGO_NAO_RESPIROU, () => this.repetir())
        },
      })
    })
  }

  /** Cada nota é uma arcada: o arco vai para um lado, a próxima volta. */
  private puxarArco(): void {
    this.arcoDir = -this.arcoDir
  }

  private repetir(): void {
    this.fase = 'escuta'
    this.idxDemo = 0
    this.proxNota = this.t + 0.6
  }

  private acertou(): void {
    const fala = this.frase === 0 && memoria.terminou ? DE_NOVO_ACERTOU : PROLOGO_ACERTOU_FRASE[this.frase]
    this.frase++
    if (this.frase < TEMA.length) {
      if (fala) this.dialogue.play(fala, () => this.comecarFrase())
      else this.comecarFrase()
      return
    }
    // Tema inteiro aprendido. Agora o elogio — e a função junto.
    this.fase = 'livre'
    this.livreAte = this.t + 16
    this.dialogue.play(PROLOGO_ACERTO)
  }

  /** Momento livre: o jogador toca o que quiser. É dele agora. */
  private livre(ctx: SceneCtx): void {
    const nota = this.piano.ler(ctx.input, ctx.display)
    if (nota !== null) {
      this.dedilhado = 1
      this.puxarArco()
      this.livreAte = Math.max(this.livreAte, this.t + 5)
      this.ultimas = [...this.ultimas, nota].slice(-7)
      // Quem já sabe tocar a frase subindo — não aprendeu com ele.
      const subindo = [...(TEMA[2] ?? [])].reverse()
      if (!this.ouviuSubindo && subindo.every((n, i) => this.ultimas[i] === n)) {
        this.ouviuSubindo = true
        this.livreAte = this.t + 8
        this.dialogue.play(PROLOGO_SUBINDO)
      }
    }
    if (this.t > this.livreAte && !this.dialogue.active) {
      this.fase = 'fecho'
      this.dialogue.play(PROLOGO_FECHO, () => {
        this.fase = 'saida'
        this.saida = 0
        audio.setAmbient(0.5, 4)
        musica.setPad(0.12, 4)
      })
    }
  }

  private sair(dt: number, ctx: SceneCtx): void {
    this.saida += dt
    this.calor = Math.max(0, 1 - this.saida / 3.5)
    if (this.saida > 4.5) {
      this.fase = 'entrada'
      ctx.transition(new CasaScene(), 2.4, 2.0)
    }
  }

  private animar(dt: number): void {
    this.adrian.update(dt)
    this.liam.update(dt)
    this.po.update(dt)
    if (Math.random() < dt * 20 * this.calor) {
      this.po.poeira(LUZ_PIANO.x - 40, LUZ_PIANO.y, 70, 60)
    }
    this.dedilhado = Math.max(0, this.dedilhado - dt * 3)

    // O pai de costas, no piano; vira para o filho quando fala ou bate.
    const falando = this.dialogue.active ? this.dialogue.falante : null
    const dele = this.fase === 'escuta'
    const vezDoFilho = this.fase === 'toca' || this.fase === 'livre'
    this.adrian.costas = falando !== 'Adrian' && this.tranco < 0.3
    this.adrian.olhar = 1
    this.adrian.braco = dele ? 0.62 + this.dedilhado * 0.3 : this.tranco > 0.3 ? 0.9 : 0.3

    // Liam em pé, de perfil para o piano, com o violino no ombro. O arco
    // corre de um lado para o outro a cada nota.
    this.liam.costas = false
    this.liam.olhar = -1
    this.liam.braco = vezDoFilho || this.respiracao.ativa ? 0.6 : 0.35
    const alvo = this.dedilhado > 0.05 ? this.arcoDir : this.arcada * 0.98
    this.arcada += (alvo - this.arcada) * Math.min(1, dt * 7)
    this.liam.tremor = Math.max(this.respiracao.ativa ? 0.6 : 0, this.liam.tremor - dt * 0.8)

    if (this.fase === 'saida') {
      this.adrian.costas = true
      this.liam.curvatura = Math.min(0.5, this.saida * 0.14)
    }
  }

  /**
   * O violino no ombro esquerdo dele, apontando para o piano, e o arco na
   * mão direita, cruzando as cordas perto do cavalete.
   */
  private desenharViolino(w: CanvasRenderingContext2D): void {
    const f = this.liam
    const lado = f.olhar >= 0 ? 1 : -1
    const x = Math.round(f.x)
    const q = Math.round(f.y - f.altura * 0.7)
    const treme = this.piano.tremor > 0.05 ? Math.round((Math.random() - 0.5) * this.piano.tremor * 2) : 0
    // Corpo do violino: madeira com o brilho do verniz.
    w.fillStyle = '#5a2a12'
    w.fillRect(x + lado * 1 - (lado > 0 ? 0 : 7), q + 1, 7, 4)
    w.fillRect(x + lado * 2 - (lado > 0 ? 0 : 5), q, 5, 6)
    w.fillStyle = '#9a5a26'
    w.fillRect(x + lado * 2 - (lado > 0 ? 0 : 3), q + 1, 3, 1)
    // O braço e a voluta, para a frente.
    w.fillStyle = '#1a120e'
    w.fillRect(lado > 0 ? x + 7 : x - 13, q + 1, 6, 1)
    w.fillRect(lado > 0 ? x + 13 : x - 14, q, 2, 2)
    // O arco: a vara escura e a crina clara, atravessando as cordas.
    const bx = x + lado * 3 + Math.round(this.arcada * 4) + treme
    w.strokeStyle = 'rgba(40,26,18,0.95)'
    w.lineWidth = 1
    w.beginPath()
    w.moveTo(bx - lado * 6, q - 6)
    w.lineTo(bx + lado * 3, q + 9)
    w.stroke()
    w.strokeStyle = 'rgba(232,222,200,0.75)'
    w.beginPath()
    w.moveTo(bx - lado * 5, q - 6)
    w.lineTo(bx + lado * 4, q + 9)
    w.stroke()
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    const estado = {
      k: this.calor,
      t: this.t,
      tecla: this.dedilhado > 0.02 ? this.piano.ultimaTocada : -1,
      brilhoTecla: this.dedilhado,
    }
    drawSalaFundo(w, estado)
    this.adrian.draw(w, LUZ_PIANO.x, 'rgba(255,206,146,0.4)')
    this.liam.draw(w, LUZ_PIANO.x, 'rgba(255,206,146,0.4)')
    this.desenharViolino(w)
    drawSalaFrente(w, estado)
    this.po.draw(w, true)
    drawLuzSala(w, estado, 'piano')

    ctx.display.applyGrain(0.045)
    // A câmera fecha no piano enquanto ele ensina e recua quando o calor sai:
    // no fim a sala volta a ficar grande demais.
    const entrada = Math.min(1, this.t / 26)
    const recuo = this.fase === 'saida' ? Math.min(1, this.saida / 4) : 0
    ctx.display.present({
      rgbSplit: this.tranco * 1.2, wave: 0, shake: this.tranco * 2.2,
      zoom: 1.4 + entrada * 0.12 - recuo * 0.45,
      alvoX: PIANO.cx + 26 + recuo * 30,
      alvoY: 124 - recuo * 14,
      time: this.t,
    })
    ctx.display.vignette(0.62 + (1 - this.calor) * 0.26)

    const mostrandoPiano = this.fase !== 'entrada' && this.fase !== 'saida'
    if (mostrandoPiano) {
      const destaque = this.fase === 'escuta' ? this.piano.ultimaTocada : undefined
      this.piano.draw(ctx.display, {
        travado: this.fase !== 'toca' && this.fase !== 'livre',
        ...(destaque !== undefined && destaque >= 0 ? { destaque } : {}),
      })
      if (this.respiracao.ativa) { /* a respiração tem a sua própria legenda */ }
      else if (this.fase === 'escuta') this.piano.drawDica(ctx.display, 'escute o piano')
      else if (this.fase === 'toca') {
        this.piano.drawDica(
          ctx.display,
          `responda no violino  ·  ${this.passo}/${this.fraseAtual.length}  ·  ${ctx.input.touchMode ? 'toque nas notas' : 'clique ou A S D F G H J K'}`,
        )
      } else if (this.fase === 'livre') this.piano.drawDica(ctx.display, PROLOGO_LIVRE)
    }

    const c = ctx.display.ctx
    this.etiquetas.draw(c, ctx.display.cssW, (quem) => {
      const f = quem === 'Adrian' ? this.adrian : quem === 'Liam' ? this.liam : null
      if (!f) return null
      return { x: ctx.display.toScreenX(f.x), y: ctx.display.toScreenY(f.y - f.altura * 0.62) }
    })
    this.camada.draw(c, ctx.display.cssW, ctx.display.cssH)
    this.respiracao.draw(c, ctx.display.cssW, ctx.display.cssH, ctx.input.touchMode)
    this.dialogue.render(c, ctx.display.cssW, ctx.display.cssH)
  }
}
