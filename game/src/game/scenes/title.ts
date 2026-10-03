import type { Scene, SceneCtx } from './types'
import { FONT_BODY, FONT_TITLE } from '../systems/dialogue'
import { audio, sons } from '../../engine/audio'
import { musica } from '../../engine/musica'
import { principal } from '../../engine/principal'
import { trilhaPropria } from '../../engine/trilhaPropria'
import { Particulas } from '../world/particulas'
import { PAL, WORLD_W, WORLD_H } from '../../engine/constants'
import { HospitalScene } from './demo/hospital'
import { DespedidaScene } from './despedida'
import { PONTOS } from './pontos'
import { salvo, haQuanto } from '../systems/salvo'
import type { Salvo } from '../systems/salvo'
import { desenharLista, navegarLista } from '../ui/lista'
import { memoria } from '../systems/memoria'

type Fase = 'espera' | 'abrindo' | 'pronto' | 'saindo'
type Acao = 'continuar' | 'novo' | 'sair'

/** O menu aberto agora, para quem soltar um arquivo de música na janela. */
let menuAberto: TitleScene | null = null
let ouvindoArquivos = false

function ehAudio(f: File): boolean {
  return f.type.startsWith('audio/') || /\.(mp3|ogg|oga|wav|m4a|aac|flac|opus|weba|webm)$/i.test(f.name)
}

/**
 * Arrastar arquivos de música para a janela, com o menu aberto, troca a
 * trilha (ver engine/trilhaPropria.ts). Não tem item no menu de propósito:
 * é para quem apresenta o jogo, não para quem joga. Fora do menu o arquivo
 * solto é só ignorado — e nunca abre por cima do jogo.
 */
function ouvirArquivos(): void {
  if (ouvindoArquivos) return
  ouvindoArquivos = true
  window.addEventListener('dragover', (e) => e.preventDefault())
  window.addEventListener('drop', (e) => {
    e.preventDefault()
    const arquivos = Array.from(e.dataTransfer?.files ?? []).filter(ehAudio)
    if (arquivos.length > 0) menuAberto?.receberTrilha(arquivos)
  })
}

/** Ponto de fuga do corredor do fundo. */
const FUGA = { x: WORLD_W / 2, y: 104 }
const ANEIS = 9
/** Segundos parado no menu até a porta do fim abrir. */
const ESPERA_PORTA = 40
/** O que se pode digitar no menu. */
const PALAVRAS_MENU = ['nos', 'ajuda', 'elisa', 'lia', 'liam'] as const

/** O fim do que foi digitado já é o começo (duas letras ou mais) de uma palavra. */
function meioDePalavra(digitado: string): boolean {
  return PALAVRAS_MENU.some((w) => {
    for (let n = Math.min(w.length, digitado.length); n >= 2; n--) {
      if (digitado.endsWith(w.slice(0, n))) return true
    }
    return false
  })
}

/** Segundos segurando o dedo parado até o menu responder. */
const SEGURAR = 5

/**
 * Menu.
 *
 * Abre em preto absoluto: um toque, e só então a música entra, o fundo
 * aparece e o título se monta — como nos menus que deixam o silêncio fazer o
 * trabalho antes de qualquer coisa acontecer.
 *
 * O fundo é o corredor da casa, em fuga, avançando devagar para sempre. É o
 * que o jogo inteiro é: andar na direção de uma porta que não chega.
 */
export class TitleScene implements Scene {
  readonly id = 'title'

  private fase: Fase = 'espera'
  private t = 0
  private desde = 0
  private sel = 0
  private po = new Particulas()
  caixas: { x: number; y: number; w: number; h: number }[] = []
  /** Tempo sem tocar em nada com o menu aberto. */
  private parado = 0
  /** 0..1: a porta do fim abrindo para quem espera. */
  private abertura = 0
  private bateu = false

  private itens: { acao: Acao; rotulo: string }[] = []
  /** O que está salvo, lido quando o menu abre. */
  private guardado: Salvo | null = null
  /** "Só mais um" com jogo salvo pede uma segunda escolha antes de apagar. */
  private confirmandoNovo = false
  /** Achou a porta do menu nesta visita: o segredo sobrevive ao jogo novo. */
  private achouPorta = false
  /** Uma linha passageira no pé do menu (a trilha própria entrou, saiu). */
  private aviso: { texto: string; t: number } | null = null
  // --- Segredos do menu ---
  /** O que foi digitado no menu, as últimas letras. */
  private digitado = ''
  private achadosMenu = new Set<string>()
  /** Segundos com o dedo (ou o mouse) apertado fora das opções. */
  private segurando = 0
  private ultimoPonteiro: { x: number; y: number } | null = null
  /** Segundos desde que o acento caiu (0 = no lugar). */
  private acento = 0
  /** A Elisa aparecendo na porta do fim, enquanto durar. */
  private elisaAte = 0
  /** O corredor para quando alguém segura a respiração. */
  private tCorredor = 0
  private corAviso = ''

  /** Volta do jogo: o som já existe, não precisa do toque inicial. */
  private readonly direto: boolean
  /** Já terminou uma vez: o título lembra. */
  private deNovo = false

  constructor(opcoes: { direto?: boolean } = {}) {
    this.direto = opcoes.direto === true
  }

  enter(ctx: SceneCtx): void {
    menuAberto = this
    ouvirArquivos()
    this.achouPorta = ctx.state.segredos.has('porta-menu')
    this.deNovo = memoria.terminou
    // Quem saiu no meio da briga ou do Tear ouve isto ao voltar.
    if (memoria.fugiu) {
      memoria.marcarFuga(false)
      this.aviso = { texto: 'Fugir também é escolher.', t: -2.5 }
    }
    this.montarItens()
    if (this.direto) this.abrir()
  }

  private montarItens(): void {
    this.guardado = salvo.ler()
    this.itens = [
      ...(this.guardado ? [{ acao: 'continuar' as const, rotulo: 'Continuar' }] : []),
      { acao: 'novo', rotulo: 'Só mais um' },
      { acao: 'sair', rotulo: 'Sair' },
    ]
    this.sel = 0
    this.confirmandoNovo = false
  }

  /** Exposto para os testes: a ação de cada item, na ordem. */
  get acoes(): Acao[] {
    return this.itens.map((i) => i.acao)
  }

  private nota(acao: Acao): string {
    if (acao === 'continuar' && this.guardado) {
      return `${PONTOS[this.guardado.ponto].nome}  ·  salvo ${haQuanto(this.guardado.quando)}`
    }
    if (acao === 'novo') {
      if (this.confirmandoNovo) return 'isso apaga o jogo salvo  ·  escolha de novo para começar'
      return this.guardado ? 'começar do início' : 'demo · a música, a casa, o Tear e o que vem depois'
    }
    return 'fechar o jogo'
  }

  /** Arquivos soltos na janela viram a trilha. */
  receberTrilha(arquivos: File[]): void {
    if (this.fase === 'espera' || this.fase === 'saindo') return
    this.aviso = { texto: 'carregando a trilha...', t: 0 }
    // Só o arquivo do fone da Lia: a trilha do menu fica como está.
    if (arquivos.every((f) => /lia|fone/i.test(f.name))) {
      void trilhaPropria.escolher(arquivos)
        .then(() => {
          this.avisar(`no fone da Lia: ${arquivos[0]?.name ?? 'arquivo'}`, '#d06e80')
        })
        .catch(() => {
          this.aviso = { texto: 'não deu para abrir esse arquivo', t: 0 }
        })
      return
    }
    void trilhaPropria.escolher(arquivos)
      .then(() => {
        principal.recomecar(0.8)
        const nome = trilhaPropria.nomes.piano ?? 'arquivo'
        const extra = trilhaPropria.temCompleto ? ' + versão completa' : ''
        this.aviso = { texto: `trilha própria: ${nome}${extra}`, t: 0 }
      })
      .catch(() => {
        this.aviso = { texto: 'não deu para abrir esse arquivo', t: 0 }
      })
  }

  update(dt: number, ctx: SceneCtx): void {
    this.t += dt
    this.desde += dt
    this.po.update(dt)

    if (this.fase === 'espera') {
      if (this.t > 0.7 && (ctx.input.consumeAny() || ctx.input.consumeConfirm())) {
        this.abrir()
      }
      return
    }
    if (this.fase === 'saindo') return

    // Poeira no fundo do corredor, subindo para a luz.
    if (Math.random() < dt * 14) {
      this.po.emitir({
        x: FUGA.x + (Math.random() - 0.5) * 150,
        y: FUGA.y + 40 + Math.random() * 70,
        vx: (Math.random() - 0.5) * 2,
        vy: -(2 + Math.random() * 5),
        vida: 4 + Math.random() * 4,
        total: 8,
        tam: 1,
        cor: 'rgba(236,206,166,',
      })
    }

    if (this.fase !== 'pronto') {
      // Quem já viu a abertura não deve precisar esperar por ela: qualquer
      // toque durante a montagem salta direto para o menu pronto.
      if (this.desde > 4.2 || ctx.input.consumeAny() || ctx.input.consumeConfirm()) {
        this.fase = 'pronto'
        this.desde = Math.max(this.desde, 4.2)
      }
      return
    }

    // Quem espera sem fazer nada vê a porta do fim abrir — e alguém nela.
    if (ctx.input.consumeAny()) this.parado = 0
    else this.parado += dt
    const alvo = this.parado > ESPERA_PORTA || this.t < this.elisaAte ? 1 : 0
    this.abertura += (alvo - this.abertura) * Math.min(1, dt * (alvo ? 0.5 : 3))
    if (this.abertura > 0.6 && !this.bateu) {
      this.bateu = true
      audio.bater(3, 0)
      this.achouPorta = true
      ctx.state.descobrir('porta-menu')
    }

    if (this.aviso) this.aviso.t += dt
    this.segredosDoMenu(dt, ctx)

    // Delete tira a trilha própria e devolve o piano do jogo.
    if (ctx.input.consumeKey('Delete') && trilhaPropria.pronta) {
      void trilhaPropria.remover().then(() => principal.recomecar(0.8))
      this.aviso = { texto: 'trilha própria removida', t: 0 }
    }

    const r = navegarLista(ctx.input, this.itens.length, this.sel, this.caixas)
    if (r.moveu) {
      this.sel = r.sel
      this.confirmandoNovo = false
      audio.interact()
    }
    if (r.escolhido < 0) return
    this.sel = r.escolhido
    const acao = this.itens[this.sel]?.acao
    if (!acao) return

    if (acao === 'novo' && this.guardado && !this.confirmandoNovo) {
      this.confirmandoNovo = true
      audio.interact()
      return
    }

    this.fase = 'saindo'
    this.desde = 0
    menuAberto = null
    musica.desafinado = 0
    musica.setPad(0.2, 2)
    if (acao === 'sair') {
      musica.nota(73.42, 0.5, 5)
      principal.parar(2)
      ctx.transition(new DespedidaScene(), 2.2, 0.6)
      return
    }
    musica.nota(146.83, 0.6, 5)
    principal.parar(2)
    if (acao === 'continuar' && this.guardado) {
      ctx.state.restaurar(this.guardado.estado)
      if (this.achouPorta) ctx.state.descobrir('porta-menu')
      ctx.transition(PONTOS[this.guardado.ponto].criar(), 2.2, 0.6)
      return
    }
    salvo.apagar()
    ctx.state.zerar()
    if (this.achouPorta) ctx.state.descobrir('porta-menu')
    ctx.transition(new HospitalScene('abertura'), 2.2, 0.6)
  }

  /**
   * O menu esconde coisas. Digitar certas palavras, ou segurar o dedo
   * parado fora das opções, faz alguma coisa acontecer. Nada avisa.
   */
  private segredosDoMenu(dt: number, ctx: SceneCtx): void {
    if (this.acento > 0) this.acento += dt
    // O que se digita.
    const teclas = ctx.input.teclasNovas()
    for (const code of teclas) {
      const m = /^Key([A-Z])$/.exec(code)
      if (!m || !m[1]) continue
      this.digitado = (this.digitado + m[1].toLowerCase()).slice(-8)
      for (const palavra of PALAVRAS_MENU) {
        if (this.digitado.endsWith(palavra)) this.palavra(palavra)
      }
      // Quem está digitando não está escolhendo: no menu o E não confirma
      // (espaço e Enter confirmam), e um S no meio de uma palavra não desce.
      if (code === 'KeyE' && !teclas.some((t) => t === 'Space' || t === 'Enter' || t === 'NumpadEnter')) {
        ctx.input.consumeConfirm()
      }
      if (code === 'KeyS' && meioDePalavra(this.digitado)) ctx.input.consumeKey('KeyS')
    }
    // Segurar parado, fora das opções.
    const p = ctx.input.pointer
    const dentro = p && this.caixas.some((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h)
    if (ctx.input.pointerDown && p && !dentro) {
      this.ultimoPonteiro = { ...p }
      const antes = this.segurando
      this.segurando += dt
      if (antes < SEGURAR && this.segurando >= SEGURAR) {
        sons.respiro(false, 2.2, 1.2)
        audio.heartbeat(0.12)
        this.avisar('Quatro pra dentro. Quatro pra fora. — a mãe ensinou isso antes de tudo.', '#e2a95e')
      } else if (Math.floor(antes / 1.1) !== Math.floor(this.segurando / 1.1) && this.segurando < SEGURAR) {
        audio.heartbeat(0.06 + this.segurando * 0.02)
      }
    } else {
      this.segurando = 0
    }
    // O corredor para enquanto alguém segura.
    if (this.segurando < 0.4) this.tCorredor += dt
  }

  private palavra(p: string): void {
    const primeira = !this.achadosMenu.has(p)
    this.achadosMenu.add(p)
    if (p === 'nos') {
      this.acento = 0.001
      musica.nota(146.83, 0.5, 5)
      musica.nota(174.61, 0.35, 5)
      this.avisar('Sem o acento, nós vira nos. Como em: ele nos ama.', PAL.accent)
    } else if (p === 'ajuda') {
      sons.morse('AJUDA', 0.2)
      this.avisar(primeira ? 'Alguém ouviu.' : 'Alguém ouviu. De novo.', PAL.accent)
    } else if (p === 'elisa') {
      this.elisaAte = this.t + 7
      audio.bater(3, 0)
      this.avisar('Eu também cortei o meu. — E.', '#b49ade')
    } else if (p === 'lia') {
      this.avisar('(do outro lado da parede, a música dela, baixinho)', '#d06e80')
      const parar = sons.musicaDaLia(0.35)
      window.setTimeout(parar, 9000)
    } else if (p === 'liam') {
      this.avisar('Ainda tô aqui.', '#aab0bd')
    }
  }

  private avisar(texto: string, cor: string): void {
    this.aviso = { texto, t: 0.001 }
    this.corAviso = cor
  }

  /** O acento caindo do Ó, girando, até sumir embaixo do título. */
  private acentoCaindo(c: CanvasRenderingContext2D, xTit: number, yTit: number, tam: number): void {
    const inteiro = c.measureText('NOS').width
    const n = c.measureText('N').width
    const o = c.measureText('O').width
    const ox = xTit - inteiro / 2 + n + o / 2
    const t = this.acento
    const cai = Math.min(1, t / 1.4)
    const y = yTit - tam * 0.9 + cai * cai * tam * 1.5
    c.save()
    c.globalAlpha *= Math.max(0, 1 - Math.max(0, t - 1.2) / 1.5)
    c.translate(ox + t * tam * 0.06, y)
    c.rotate(t * 2.2)
    c.textAlign = 'center'
    c.fillText('´', 0, 0)
    c.restore()
  }

  /** O primeiro toque: é aqui que o som do jogo começa a existir. */
  private abrir(): void {
    this.fase = 'abrindo'
    this.desde = 0
    audio.init()
    audio.resume()
    audio.startAmbient()
    audio.setAmbient(0.2, 6)
    // Depois da primeira vez, o tema do menu volta um pouco fora do tom.
    musica.desafinado = this.deNovo ? -0.28 : 0
    musica.abafado = 0.3
    musica.iniciarPad()
    musica.setPad(0.22, 8)
    // Se havia trilha própria guardada, ela toca; senão, o piano sintetizado.
    void trilhaPropria.carregarGuardada().finally(() => principal.tocar(0.8))
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    const entrada = this.fase === 'espera' ? 0 : Math.min(1, this.desde / 3.4)
    const saida = this.fase === 'saindo' ? Math.min(1, this.desde / 2) : 0
    const luz = entrada * (1 - saida)

    this.drawCorredor(w, luz)
    this.po.draw(w, true)
    ctx.display.applyGrain(0.04 + (1 - luz) * 0.02)
    // Respiração lenta da câmera: o corredor nunca para de se aproximar.
    ctx.display.present({
      rgbSplit: 0, wave: 0, shake: 0,
      zoom: 1.06 + Math.sin(this.t * 0.16) * 0.03 + saida * 0.12,
      alvoX: FUGA.x, alvoY: 112,
      time: this.t,
    })
    ctx.display.vignette(0.74)
    this.drawVeu(ctx, luz)

    if (this.fase === 'espera') this.drawEspera(ctx)
    else this.drawMenu(ctx, luz)
  }

  /**
   * Corredor em fuga: anéis que crescem a partir do ponto de fuga e se
   * apagam ao passar pela câmera. Nunca chega no fim.
   */
  private drawCorredor(c: CanvasRenderingContext2D, luz: number): void {
    c.fillStyle = '#04050a'
    c.fillRect(0, 0, WORLD_W, WORLD_H)

    // Halo da porta ao fundo
    c.save()
    c.globalCompositeOperation = 'lighter'
    const g = c.createRadialGradient(FUGA.x, FUGA.y, 2, FUGA.x, FUGA.y, 130)
    g.addColorStop(0, `rgba(255,214,158,${0.3 * luz})`)
    g.addColorStop(0.3, `rgba(214,148,92,${0.09 * luz})`)
    g.addColorStop(1, 'rgba(214,148,92,0)')
    c.fillStyle = g
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    c.restore()

    for (let i = 0; i < ANEIS; i++) {
      const z = ((i / ANEIS + this.tCorredor * 0.028) % 1 + 1) % 1
      const escala = Math.exp(z * 3.3)
      const lw = 30 * escala
      const lh = 21 * escala
      // Some quando nasce longe e quando passa perto demais.
      const a = Math.min(1, z / 0.18) * Math.max(0, 1 - Math.max(0, z - 0.72) / 0.28)
      if (a <= 0.01) continue
      c.strokeStyle = `rgba(150,158,186,${0.13 * a * luz})`
      c.lineWidth = Math.max(1, escala * 0.5)
      c.strokeRect(FUGA.x - lw, FUGA.y - lh, lw * 2, lh * 2)
      // Batente de porta de um dos lados, alternando
      c.fillStyle = `rgba(10,13,20,${0.5 * a * luz})`
      const bx = i % 2 === 0 ? FUGA.x - lw : FUGA.x + lw - lw * 0.16
      c.fillRect(bx, FUGA.y - lh * 0.55, lw * 0.16, lh * 1.55)
    }

    // A porta do fim, sempre pequena e sempre acesa. Para quem espera, ela
    // abre um pouco — e tem alguém parado no vão, mais alto que Liam.
    const ab = this.abertura
    const meia = 4 + ab * 3
    c.fillStyle = `rgba(255,226,180,${(0.5 + ab * 0.3) * luz})`
    c.fillRect(FUGA.x - meia, FUGA.y - 7 - ab * 2, meia * 2, 14 + ab * 2)
    c.fillStyle = `rgba(255,240,214,${(0.7 + ab * 0.3) * luz})`
    c.fillRect(FUGA.x - meia + 2, FUGA.y - 5 - ab * 2, meia * 2 - 4, 10 + ab * 2)
    if (ab > 0.05) {
      const a = Math.min(1, (ab - 0.05) * 1.6) * luz
      c.fillStyle = `rgba(8,6,10,${a})`
      c.fillRect(FUGA.x - 1, FUGA.y - 4, 3, 3)
      c.fillRect(FUGA.x - 2, FUGA.y - 1, 5, 7)
      c.fillRect(FUGA.x - 1, FUGA.y + 6, 1, 2)
      c.fillRect(FUGA.x + 1, FUGA.y + 6, 1, 2)
      // Cabelo comprido caindo nos ombros
      c.fillRect(FUGA.x - 2, FUGA.y - 3, 1, 4)
      c.fillRect(FUGA.x + 2, FUGA.y - 3, 1, 4)
      // A sombra dela se esticando pelo chão do corredor, na direção da câmera
      const sg = c.createLinearGradient(0, FUGA.y + 8, 0, FUGA.y + 60)
      sg.addColorStop(0, `rgba(0,0,0,${0.5 * a})`)
      sg.addColorStop(1, 'rgba(0,0,0,0)')
      c.fillStyle = sg
      c.beginPath()
      c.moveTo(FUGA.x - 2, FUGA.y + 8)
      c.lineTo(FUGA.x + 3, FUGA.y + 8)
      c.lineTo(FUGA.x + 10, FUGA.y + 60)
      c.lineTo(FUGA.x - 8, FUGA.y + 60)
      c.fill()
    }
  }

  /**
   * Escurece a faixa de cima e a de baixo, onde moram o título e o menu,
   * e deixa a faixa do meio livre para a porta no fim do corredor. Sem isso
   * o texto briga com os anéis e nada se lê direito.
   */
  private drawVeu(ctx: SceneCtx, luz: number): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    c.save()
    const cima = c.createLinearGradient(0, 0, 0, cssH * 0.5)
    cima.addColorStop(0, `rgba(3,4,8,${0.9 * luz})`)
    cima.addColorStop(1, 'rgba(3,4,8,0)')
    c.fillStyle = cima
    c.fillRect(0, 0, cssW, cssH * 0.5)
    const baixo = c.createLinearGradient(0, cssH, 0, cssH * 0.46)
    baixo.addColorStop(0, `rgba(3,4,8,${0.94 * luz})`)
    baixo.addColorStop(1, 'rgba(3,4,8,0)')
    c.fillStyle = baixo
    c.fillRect(0, cssH * 0.46, cssW, cssH * 0.54)
    c.restore()
  }

  /** Antes de tudo: preto e uma linha só. */
  private drawEspera(ctx: SceneCtx): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    c.fillStyle = '#000'
    c.fillRect(0, 0, cssW, cssH)
    const s = Math.max(12, Math.min(cssW / 66, 19))
    c.save()
    c.textAlign = 'center'
    c.font = `300 ${s}px ${FONT_BODY}`
    c.letterSpacing = '0.42em'
    c.globalAlpha = 0.2 + Math.sin(this.t * 1.5) * 0.18
    c.fillStyle = PAL.ink
    const toque = 'ontouchstart' in window ? 'TOQUE PARA COMEÇAR' : 'CLIQUE PARA COMEÇAR'
    c.fillText(toque, cssW / 2, cssH * 0.62)
    c.restore()
  }

  private drawMenu(ctx: SceneCtx, luz: number): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    c.save()
    c.textAlign = 'center'

    // O título se monta antes do menu.
    const aTit = Math.max(0, Math.min(1, (this.desde - 0.9) / 2.4)) * (1 - (this.fase === 'saindo' ? Math.min(1, this.desde / 1.4) : 0))
    const tam = Math.max(56, Math.min(cssW / 6.4, 176))
    c.globalAlpha = aTit
    c.fillStyle = PAL.ink
    c.font = `400 ${tam}px ${FONT_TITLE}`
    c.letterSpacing = `${0.26 - aTit * 0.04}em`
    const xTit = cssW / 2 + tam * 0.12
    const yTit = cssH * 0.3
    // Quem digita "nos" vê o acento cair: sem ele, nós vira só um pronome.
    const semAcento = this.acento > 0 && this.acento < 9
    c.fillText(semAcento ? 'NOS' : 'NÓS', xTit, yTit)
    if (semAcento) this.acentoCaindo(c, xTit, yTit, tam)
    c.letterSpacing = '0em'

    // Fio fino sob o título. Depois de zerar, ele está cortado no meio.
    c.globalAlpha = aTit * 0.35
    c.fillStyle = PAL.accent
    const fio = tam * 1.4 * aTit
    const yFio = cssH * 0.3 + tam * 0.2
    if (this.deNovo) {
      const vao = tam * 0.12
      c.fillRect(cssW / 2 - fio / 2, yFio, fio / 2 - vao, 1)
      c.fillRect(cssW / 2 + vao, yFio, fio / 2 - vao, 1)
      // As pontas desfiadas.
      for (const [x, d] of [[cssW / 2 - vao, -1], [cssW / 2 + vao, 1]] as const) {
        for (let k = 0; k < 3; k++) c.fillRect(x + d * k * 2, yFio + (k - 1) * 2, d * 4, 1)
      }
    } else {
      c.fillRect(cssW / 2 - fio / 2, yFio, fio, 1)
    }
    // Segurando: um anel que enche em volta do dedo (ou do mouse).
    if (this.segurando > 0.4 && this.ultimoPonteiro) {
      const k = Math.min(1, this.segurando / SEGURAR)
      c.globalAlpha = 0.5
      c.strokeStyle = '#e2a95e'
      c.lineWidth = 2
      c.beginPath()
      c.arc(this.ultimoPonteiro.x, this.ultimoPonteiro.y, 22, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2)
      c.stroke()
    }

    const s = Math.max(14, Math.min(cssW / 58, 24))
    c.restore()
    this.caixas = desenharLista(c, {
      itens: this.itens.map((item) => ({ rotulo: item.rotulo, nota: this.nota(item.acao) })),
      sel: this.sel,
      cssW,
      y0: cssH * 0.58,
      s,
      t: this.t,
      alfa: (i) => Math.max(0, Math.min(1, (this.desde - 2.4 - i * 0.45) / 1.2)) * luz,
      vivo: this.fase === 'pronto',
    })
    c.save()
    c.textAlign = 'center'

    if (this.aviso && this.aviso.t > 0 && this.aviso.t < 5) {
      const a = Math.min(1, this.aviso.t / 0.4, (5 - this.aviso.t) / 1) * luz
      c.globalAlpha = a * 0.75
      c.fillStyle = this.corAviso || PAL.accent
      c.font = `italic 300 ${s * 0.72}px ${FONT_BODY}`
      c.fillText(this.aviso.texto, cssW / 2, cssH - s * 4)
    }

    const aPe = Math.max(0, Math.min(1, (this.desde - 4) / 1.6)) * luz
    c.globalAlpha = aPe * 0.34
    c.fillStyle = PAL.inkDim
    c.font = `300 ${s * 0.66}px ${FONT_BODY}`
    c.letterSpacing = '0.2em'
    const dica = 'ontouchstart' in window ? 'TOQUE PARA ESCOLHER' : 'CLIQUE, OU ↑ ↓ E ESPAÇO'
    c.fillText(dica, cssW / 2, cssH - s * 2.4)
    c.restore()
  }
}
