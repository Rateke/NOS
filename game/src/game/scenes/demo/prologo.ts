import type { Scene, SceneCtx } from '../types'
import { Dialogue } from '../../systems/dialogue'
import { Piano } from '../../systems/piano'
import { audio } from '../../../engine/audio'
import { musica, TEMA } from '../../../engine/musica'
import { Figura } from '../../world/figura'
import { Particulas } from '../../world/particulas'
import { drawSalaFundo, drawSalaFrente, drawLuzSala, LUZ_PIANO, BANCO_Y, PIANO } from '../../world/sala'
import {
  PROLOGO_ABERTURA, PROLOGO_FRASES, PROLOGO_ACERTOU_FRASE, PROLOGO_ERRO,
  PROLOGO_ACERTO, PROLOGO_LIVRE, PROLOGO_FECHO, PROLOGO_SUBINDO,
} from '../../content/demoScript'
import { CasaScene } from './casa'

type Fase = 'entrada' | 'escuta' | 'toca' | 'livre' | 'fecho' | 'saida'

/**
 * A Música.
 *
 * Único momento quente da obra, e o único em que o jogador aprende algo de
 * verdade: três frases que crescem, tocadas de ouvido num piano real. O que
 * ele aprende aqui não é enfeite — é a interface que vai reaparecer lá
 * embaixo, fazendo outra coisa.
 */
export class PrologoScene implements Scene {
  readonly id = 'demo-prologo'

  private dialogue = new Dialogue()
  private piano = new Piano()
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

  // Os dois no banco do piano, de costas para a câmera. É uma cena de nuca e
  // de mãos: o rosto só aparece quando alguém se vira para o outro.
  private adrian = new Figura({
    x: PIANO.cx - 11, y: BANCO_Y, altura: 40,
    cor: { roupa: '#2b2129', cabelo: '#171017', pele: '#6a4f48', sombra: 'rgba(0,0,0,0)' },
    pose: 'sentado',
  })
  private liam = new Figura({
    x: PIANO.cx + 15, y: BANCO_Y, altura: 31,
    cor: { roupa: '#252a3a', cabelo: '#12151f', pele: '#6d5a52', sombra: 'rgba(0,0,0,0)' },
    pose: 'sentado',
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

  enter(): void {
    audio.setAmbient(0.16, 2)
    musica.desafinado = 0
    musica.abafado = 0
    musica.iniciarPad()
    musica.setPad(0.5, 6)
    this.dialogue.play(PROLOGO_ABERTURA, () => this.comecarFrase())
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
    this.calor = Math.min(1, this.calor + dt / 2.5)
    this.piano.update(dt)
    this.animar(dt)
    this.dialogue.update(dt)

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

    if (this.fraseAtual[this.passo] === tocada) {
      this.passo++
      if (this.passo >= this.fraseAtual.length) this.acertou()
      return
    }

    // Errou: volta ao começo da frase e Adrian reensina, sem levantar a voz.
    const fala = PROLOGO_ERRO[Math.min(this.erros, PROLOGO_ERRO.length - 1)]
    this.erros++
    this.passo = 0
    audio.refuse()
    if (fala) this.dialogue.play(fala, () => this.repetir())
    else this.repetir()
  }

  private repetir(): void {
    this.fase = 'escuta'
    this.idxDemo = 0
    this.proxNota = this.t + 0.6
  }

  private acertou(): void {
    const fala = PROLOGO_ACERTOU_FRASE[this.frase]
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
      this.livreAte = Math.max(this.livreAte, this.t + 5)
      this.ultimas = [...this.ultimas, nota].slice(-7)
      // Quem já sabe tocar a frase subindo — não aprendeu com ele.
      const subindo = [0, 1, 2, 3, 4, 2, 0]
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

    // Quem fala vira o rosto para o outro. O resto do tempo, os dois olham
    // para o teclado — de costas para quem joga.
    const falando = this.dialogue.active ? this.dialogue.falante : null
    const dele = this.fase === 'escuta'
    const vezDoFilho = this.fase === 'toca' || this.fase === 'livre'

    this.adrian.costas = falando !== 'Adrian'
    this.adrian.olhar = falando === 'Adrian' ? 1 : 0
    this.adrian.braco = dele ? 0.62 + this.dedilhado * 0.3 : 0.3

    this.liam.costas = falando !== 'Adrian'
    this.liam.olhar = falando === 'Adrian' ? -1 : 0
    this.liam.braco = vezDoFilho ? 0.6 + this.dedilhado * 0.3 : 0.14

    if (this.fase === 'saida') {
      this.adrian.costas = true
      this.liam.costas = true
      this.liam.curvatura = Math.min(0.5, this.saida * 0.14)
    }
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
    drawSalaFrente(w, estado)
    this.po.draw(w, true)
    drawLuzSala(w, estado, 'piano')

    ctx.display.applyGrain(0.045)
    // A câmera fecha no piano enquanto ele ensina e recua quando o calor sai:
    // no fim a sala volta a ficar grande demais.
    const entrada = Math.min(1, this.t / 26)
    const recuo = this.fase === 'saida' ? Math.min(1, this.saida / 4) : 0
    ctx.display.present({
      rgbSplit: 0, wave: 0, shake: 0,
      zoom: 1.62 + entrada * 0.16 - recuo * 0.6,
      alvoX: PIANO.cx + 2 + recuo * 40,
      alvoY: 104 - recuo * 4,
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
      if (this.fase === 'escuta') this.piano.drawDica(ctx.display, 'escute')
      else if (this.fase === 'toca') {
        this.piano.drawDica(
          ctx.display,
          `repita  ·  ${this.passo}/${this.fraseAtual.length}  ·  clique ou A S D F G H J K`,
        )
      } else if (this.fase === 'livre') this.piano.drawDica(ctx.display, PROLOGO_LIVRE)
    }

    this.dialogue.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
  }
}
