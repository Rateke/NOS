import type { Scene, SceneCtx } from '../types'
import type { Ponto } from '../../systems/salvo'
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
import { Figura, criarSombraBranca, VISUAL } from '../../world/figura'
import { Particulas } from '../../world/particulas'
import { PAL, WORLD_W } from '../../../engine/constants'
import { audio, sons } from '../../../engine/audio'
import { clima } from '../../../engine/clima'
import { musica } from '../../../engine/musica'
import { principal } from '../../../engine/principal'
import {
  CASA_ABERTURA, CASA_CORREDOR, CASA_ANTES_DA_COZINHA, CASA_PRONTO,
  CASA_OBJETIVO_INICIAL, CASA_OBJETIVO_COZINHA, CASA_PORTA_FIM, CASA_MELODIA,
  CASA_MELODIA_DELE, CASA_CHAVE, CASA_CHAVE_DEPOIS, CASA_PAREDE,
  EVELYN_PERGUNTA, EVELYN_OPCOES, LIAM_ECO, EVELYN_DEPOIS_ECO, EVELYN_RESPOSTAS,
  LIAM_DEPOIS_ECO, SOMBRA_REFLEXO, DEPOIS_ABERTURA, DEPOIS_LIA, DEPOIS_RECADO,
  DEPOIS_RECADO_FIM,
} from '../../content/demoScript'
import { CASA_PASSOS_ESCONDEU, CASA_PASSOS_PEGO } from '../../content/noite'
import { Etiquetas } from '../../ui/etiqueta'
import { Camada } from '../../ui/camada'
import { CadernoUI } from '../../ui/cadernoUI'
import { Escolha } from '../../ui/escolha'
import { memoria } from '../../systems/memoria'
import { MesaScene } from './mesa'
import { FimScene } from './fim'

/** Cenas que o jogador assiste: Liam não obedece às setas enquanto duram. */
type Cutscene = 'chave' | 'evelyn' | 'reflexo' | 'lia' | 'recado' | 'passos'

/** Quanto tempo Liam tem para esconder o caderno antes de o pai abrir a porta. */
const JANELA_PASSOS = 2.8

const COR_LIAM = { roupa: '#252a3a', cabelo: '#12151f', pele: '#6d5a52', sombra: 'rgba(0,0,0,0.5)' }
/** Depois do grito, a sombra de Liam no chão fica branca e não volta. */
const SOMBRA_BRANCA = 'rgba(236,238,248,0.6)'

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

  /** A casa depois do grito: sem música, tudo fora do lugar, Lia com medo. */
  readonly depois: boolean
  readonly ponto: Ponto

  constructor(opcoes: { depois?: boolean } = {}) {
    this.depois = opcoes.depois === true
    this.ponto = this.depois ? 'depois' : 'casa'
  }

  private dialogue = new Dialogue()
  private etiquetas = new Etiquetas()
  private camada = new Camada()
  private caderno = new CadernoUI()
  private escolha = new Escolha()
  private cutscene: Cutscene | null = null
  private tCut = 0
  private passoCut = 0
  /** A frase do pai saiu da boca dele (para os testes, e para a história). */
  falouPeloPai = false
  private evelynFeita = false
  private evelyn = new Figura({
    ...VISUAL.evelyn,
    x: 268, y: 167, altura: 38, cabelo: 'longo', gola: '#a8b4bc',
    cor: { roupa: '#3e5664', cabelo: '#2a1a16', pele: '#7a5a4e', sombra: 'rgba(0,0,0,0.5)' },
  })
  private evelynVisivel = 0
  private lia = new Figura({
    ...VISUAL.lia,
    x: 300, y: 167, altura: 32, cabelo: 'rabo', mochila: '#2e3e56',
    cor: { roupa: '#6a2c38', cabelo: '#1e1214', pele: '#7a6052', sombra: 'rgba(0,0,0,0.5)' },
  })
  private liaVisivel = 1
  private liaFeita = false
  // O pai, no corredor, só quando os passos chegam a tempo de ver.
  private adrian = new Figura({
    ...VISUAL.adrian,
    x: 268, y: 167, altura: 42, barba: true, gola: '#d4ccc0',
    cor: { roupa: '#2e2430', cabelo: '#16100f', pele: '#7a584c', sombra: 'rgba(0,0,0,0.5)' },
  })
  private adrianVisivel = 0
  /** Como acabou o susto do caderno: escondido a tempo, ou não. */
  passosResultado: 'escondeu' | 'pego' | null = null
  /** Quanto Liam andou desde o último passo que soou. */
  private andado = 0
  private proxPassoSom = 0
  private rasgou = false
  private jolt = 0
  private reflexo = 0
  private proxTique = 0
  private comodos = new Map<string, Comodo>()
  private atual!: Comodo
  private t = 0
  private liam = new Figura({ ...VISUAL.liam, x: 300, y: 163, altura: 31, cor: { ...COR_LIAM } })
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

  /** Alguma coisa que o jogador só assiste ou escolhe — não é hora de andar. */
  get ocupado(): boolean {
    return this.cutscene !== null || this.escolha.ativa
  }

  get cutsceneAtual(): string | null {
    return this.cutscene
  }

  enter(ctx: SceneCtx): void {
    this.jogo = ctx.state
    this.montar()
    this.atual = this.comodos.get('sala') as Comodo
    this.visitados.add('sala')
    this.liam.x = 300
    this.liam.y = this.atual.passoY
    musica.desafinado = 0
    musica.abafado = 0.15
    if (this.depois) {
      this.liam.cor.sombra = SOMBRA_BRANCA
      ctx.state.sombraEscreve = true
      principal.parar(0.3)
      musica.setPad(0, 1)
      audio.setAmbient(0.1, 3)
      sons.iniciarCasaReal()
      sons.setCasaReal(0.9, 4)
      this.lia.x = 300
      this.dialogue.play(DEPOIS_ABERTURA)
      return
    }
    audio.setAmbient(0.36, 3)
    musica.setPad(0.12, 5)
    principal.tocar(0.5)
    // Chuva na janela a tarde inteira. A casa está calma — por enquanto.
    clima.set({ chuva: 0.45 }, 3)
    this.camada.mostrar(ctx.state, 'casa')
    // A chave na porta: o corpo de Liam arruma antes de ele pensar.
    this.cutscene = 'chave'
    this.tCut = 0
    this.passoCut = 0
    this.liam.olhar = -1
  }

  /** (Re)constrói os cômodos. O corredor depende do comprimento atual. */
  private montar(): void {
    this.comodos = new Map<string, Comodo>()
    const d = this.depois
    for (const c of [comodoSala(d), comodoCorredor(this.corredorLargura, d), comodoQuarto(d)]) {
      this.comodos.set(c.id, c)
    }
  }

  update(dt: number, ctx: SceneCtx): void {
    this.jogo = ctx.state
    this.ctxAtual = ctx
    this.t += dt
    this.liam.update(dt)
    this.evelyn.update(dt)
    this.lia.update(dt)
    this.po.update(dt)
    this.piano.update(dt)
    this.dialogue.update(dt)
    this.etiquetas.update(dt)
    this.camada.update(dt)
    this.reflexo = Math.max(0, this.reflexo - dt * 0.5)
    if (this.depois && this.t >= this.proxTique) {
      this.proxTique = this.t + 1
      sons.tique(Math.floor(this.t) % 2 === 0)
    }

    if (this.escolha.ativa) {
      this.liam.andando = 0
      this.escolha.update(dt, ctx.input)
      return
    }
    if (this.cutscene && !this.leitor.aberto) {
      this.liam.andando = 0
      if (this.dialogue.active && ctx.input.consumeConfirm()) this.dialogue.confirm()
      this.adrian.update(dt)
      this.rodarCutscene(dt, ctx)
      return
    }
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

    if (this.caderno.update(dt, ctx, this.leitor, true)) return
    this.gatilhos(ctx)

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
    // Os passos dele no assoalho, leves.
    this.andado += Math.abs(this.liam.x - antes)
    if (this.andado >= 15) {
      this.andado = 0
      sons.pisada(this.atual.id === 'corredor' && this.depois ? 0.6 : 1)
    }
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
    if (this.atual.id !== 'corredor' || this.depois) return
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
    if (v.acao === 'secretaria') {
      this.achados.add(v.id)
      this.iniciarRecado(v.linhas)
      return
    }
    if (primeira) {
      this.achados.add(v.id)
      audio.interact()
      if (v.aprende) this.jogo?.aprender(v.aprende)
      if (v.segredo && !v.deNovo) this.segredo(v.segredo)
      if (v.acao === 'piano') {
        this.dialogue.play(v.linhas, () => this.sentar())
        return
      }
      const doc = v.documento
      if (doc) {
        // Ler o caderno da Lia tem consequência: alguém vem vindo.
        const susto = v.id === 'caderno-lia' && !this.depois ? () => this.iniciarPassos() : undefined
        this.dialogue.play(v.linhas, () => this.ler(doc, v.depois, susto))
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

  private ler(doc: Documento, depois?: Line[], aoFim?: () => void): void {
    this.leitor.abrir(doc, {
      onSegredo: (id) => this.segredo(id),
      onFechar: () => {
        if (depois) this.dialogue.play(depois, aoFim)
        else aoFim?.()
      },
    })
  }

  /**
   * A casa estava calma. Aí vêm os passos da cozinha, cada vez mais perto, e
   * o caderno da Lia ainda está na mão dele. Dois segundos e pouco para
   * esconder. Ninguém avisa isso antes.
   */
  private iniciarPassos(): void {
    // A calma acaba aqui: o coração e as cordas entram de uma vez.
    clima.set({ coracao: 0.95, cordas: 0.5, aperto: 0.75, chuva: 0.15 }, 0.4)
    this.cutscene = 'passos'
    this.tCut = 0
    this.passoCut = 0
    this.proxPassoSom = 0
    this.destino = null
    this.liam.olhar = 1
    this.jolt = 0.4
  }

  private cutPassos(dt: number, ctx: SceneCtx): void {
    this.jolt = Math.max(0, this.jolt - dt * 2)
    if (this.passoCut === 0) {
      // Os passos apertam: cada um mais perto e mais forte que o anterior.
      if (this.tCut >= this.proxPassoSom) {
        const k = this.tCut / JANELA_PASSOS
        sons.passo(0, 0.5 + k * 0.7)
        this.proxPassoSom = this.tCut + Math.max(0.28, 0.6 - k * 0.32)
        audio.heartbeat(0.12 + k * 0.12)
      }
      const escondeu = ctx.input.consumeConfirm() || ctx.input.consumeTap() !== null
      if (escondeu && this.tCut > 0.25) {
        this.passoCut = 1
        this.passosResultado = 'escondeu'
        audio.interact()
        this.liam.olhar = -1
        this.dialogue.play(CASA_PASSOS_ESCONDEU, () => {
          this.cutscene = null
          clima.set({ coracao: 0, cordas: 0, aperto: 0, chuva: 0.45 }, 3)
        })
        return
      }
      if (this.tCut >= JANELA_PASSOS) {
        this.passoCut = 2
        this.passosResultado = 'pego'
        this.jogo?.aprender('caderno-rasgado')
        this.adrian.x = 268
        this.adrian.y = this.atual.passoY
        this.adrian.olhar = -1
        this.jolt = 1
        sons.chave()
      }
      return
    }
    if (this.passoCut === 2) {
      // Ele aparece na porta e vem até Liam.
      this.adrianVisivel = Math.min(1, this.adrianVisivel + dt * 2.5)
      const alvo = this.liam.x + 22
      if (Math.abs(this.adrian.x - alvo) > 1) {
        this.adrian.x += Math.sign(alvo - this.adrian.x) * 50 * dt
        this.adrian.andando = 1
        return
      }
      this.adrian.andando = 0
      this.passoCut = 3
      this.dialogue.play(CASA_PASSOS_PEGO, () => {
        this.passoCut = 4
      })
      return
    }
    if (this.passoCut === 3) {
      // A página rasga na fala dele, não antes.
      const linha = this.dialogue.atual?.text ?? ''
      if (linha.startsWith('É isso') && !this.rasgou) {
        this.rasgou = true
        sons.rasgar()
        this.jolt = 1
        this.po.poeira(this.liam.x + 6, this.liam.y - 26, 18, 10, 'rgba(236,230,214,')
      }
      return
    }
    if (this.passoCut === 4) {
      // Ele volta para a cozinha e fecha a porta.
      const alvo = 268
      this.adrian.olhar = 1
      if (Math.abs(this.adrian.x - alvo) > 1) {
        this.adrian.x += Math.sign(alvo - this.adrian.x) * 46 * dt
        this.adrian.andando = 1
        return
      }
      this.adrianVisivel = Math.max(0, this.adrianVisivel - dt * 2)
      if (this.adrianVisivel <= 0) {
        this.adrian.andando = 0
        this.cutscene = null
        sons.porta()
        clima.set({ coracao: 0, cordas: 0, aperto: 0, chuva: 0.45 }, 4)
      }
    }
  }

  /** Guardado para os segredos que chegam por callback de fala. */
  private jogo: GameState | null = null

  private segredo(id: string): void {
    if (!this.jogo?.descobrir(id)) return
    audio.segredo()
    this.estrela = 1
    this.po.poeira(this.liam.x - 14, this.liam.y - 36, 28, 30)
  }

  // --- Cenas assistidas ---------------------------------------------------

  private ctxAtual: SceneCtx | null = null

  private rodarCutscene(dt: number, ctx: SceneCtx): void {
    this.tCut += dt
    if (this.cutscene === 'chave') this.cutChave(dt)
    else if (this.cutscene === 'evelyn') this.cutEvelyn(dt, ctx)
    else if (this.cutscene === 'reflexo') this.reflexo = 1
    else if (this.cutscene === 'lia') this.cutLia(dt)
    else if (this.cutscene === 'passos') this.cutPassos(dt, ctx)
  }

  /** O que dispara uma cena só de andar até certo ponto. */
  private gatilhos(ctx: SceneCtx): void {
    if (this.atual.id !== 'corredor') return
    if (!this.depois && !this.evelynFeita && this.liam.x > 96) {
      this.evelynFeita = true
      this.cutscene = 'evelyn'
      this.passoCut = 0
      this.tCut = 0
      this.destino = null
      this.evelyn.x = 268
      this.evelynVisivel = 0
      void ctx
    } else if (this.depois && !this.liaFeita && Math.abs(this.liam.x - this.lia.x) < 74) {
      this.liaFeita = true
      this.cutscene = 'lia'
      this.passoCut = 0
      this.tCut = 0
      this.destino = null
    }
  }

  /** A chave gira, e Liam vai sozinho endireitar o retrato. */
  private cutChave(dt: number): void {
    if (this.passoCut === 0 && this.tCut > 1.1) {
      this.passoCut = 1
      sons.chave()
      this.dialogue.play(CASA_CHAVE, undefined, 0.9)
      return
    }
    if (this.passoCut === 1 && !this.dialogue.active) {
      const alvo = 243
      const d = alvo - this.liam.x
      if (Math.abs(d) > 1.5) {
        this.liam.x += Math.sign(d) * VELOCIDADE * 1.2 * dt
        this.liam.olhar = Math.sign(d)
        this.liam.andando = 1
        return
      }
      this.passoCut = 2
      this.tCut = 0
      this.liam.costas = true
      this.liam.braco = 0.8
      audio.interact()
      return
    }
    if (this.passoCut === 2 && this.tCut > 0.9) {
      this.passoCut = 3
      this.liam.braco = 0
      this.liam.costas = false
      this.dialogue.play(CASA_CHAVE_DEPOIS, () => {
        this.dialogue.play(CASA_ABERTURA, () => {
          this.dialogue.play(CASA_PAREDE, () => {
            this.cutscene = null
          })
        })
      })
    }
  }

  /**
   * A mãe sai da cozinha e faz uma pergunta. As respostas de Liam se
   * escrevem devagar; a do pai chega antes.
   */
  private cutEvelyn(dt: number, ctx: SceneCtx): void {
    if (this.passoCut === 0) {
      this.evelynVisivel = Math.min(1, this.evelynVisivel + dt * 2)
      this.liam.olhar = 1
      const alvo = this.liam.x + 34
      if (this.evelyn.x > alvo) {
        this.evelyn.x -= 52 * dt
        this.evelyn.olhar = -1
        this.evelyn.andando = 1
        return
      }
      this.evelyn.andando = 0
      this.passoCut = 1
      this.etiquetas.apresentar(ctx.state, 'Evelyn')
      this.dialogue.play(EVELYN_PERGUNTA, () => {
        const primeira = !memoria.viuEvelyn
        this.escolha.abrir({
          opcoes: EVELYN_OPCOES,
          escrita: primeira ? 4 : 40,
          forcarEm: primeira ? 3.4 : 9,
          travada: primeira,
          onForcada: () => {
            this.falouPeloPai = true
            ctx.state.aprender('evelyn-eco')
            this.dialogue.play(LIAM_ECO, () => {
              this.dialogue.play(EVELYN_DEPOIS_ECO, () => this.evelynSai())
            })
          },
          onEscolha: (i) => {
            this.dialogue.play(EVELYN_RESPOSTAS[i] ?? [], () => this.evelynSai())
          },
        })
      })
      return
    }
    if (this.passoCut === 2) {
      // Ela volta para a cozinha, de costas, e some na porta.
      this.evelyn.olhar = 1
      this.evelyn.andando = 1
      this.evelyn.x += 46 * dt
      if (this.evelyn.x > 250) this.evelynVisivel = Math.max(0, this.evelynVisivel - dt * 2)
      if (this.evelynVisivel <= 0) {
        this.evelyn.andando = 0
        this.passoCut = 3
        memoria.marcarEvelyn()
        if (this.falouPeloPai) {
          this.dialogue.play(LIAM_DEPOIS_ECO, () => {
            this.cutscene = 'reflexo'
            this.deCostas = true
            this.liam.costas = true
            this.dialogue.play(SOMBRA_REFLEXO, () => {
              this.cutscene = null
              this.deCostas = false
            })
          })
        } else {
          this.cutscene = null
        }
      }
    }
  }

  private evelynSai(): void {
    this.passoCut = 2
  }

  /** Depois do grito: a Lia recua quando Liam chega perto. */
  private cutLia(dt: number): void {
    const ctx = this.ctxAtual
    if (this.passoCut === 0) {
      this.passoCut = 1
      this.liam.olhar = Math.sign(this.lia.x - this.liam.x) || 1
      this.etiquetas.corrigir('Lia', 'Com medo de você.')
      ctx?.state.aprender('depois-lia')
      audio.refuse()
      this.dialogue.play(DEPOIS_LIA, () => {
        this.passoCut = 2
      })
    }
    if (this.passoCut === 1) {
      // Recua de frente para ele: um passo, outro, até a parede do fundo.
      const longe = this.liam.x + 112
      if (this.lia.x < longe && this.lia.x < this.atual.limiteDir - 30) {
        this.lia.x += 34 * dt
        this.lia.andando = 1
      } else {
        this.lia.andando = 0
      }
      this.lia.olhar = -1
    }
    if (this.passoCut === 2) {
      this.lia.andando = 0
      // Ela só some depois que a etiqueta corrigida já foi lida.
      if (this.etiquetas.visivel) return
      this.liaVisivel = Math.max(0, this.liaVisivel - dt * 0.7)
      if (this.liaVisivel <= 0) this.cutscene = null
    }
  }

  /** O recado da mãe na secretária. É aqui que a demo termina. */
  private iniciarRecado(linhas: Line[]): void {
    const ctx = this.ctxAtual
    this.cutscene = 'recado'
    this.deCostas = true
    this.dialogue.play(linhas, () => {
      sons.secretaria()
      sons.fita(0.035, 0.8)
      sons.setCasaReal(0.35, 1)
      this.dialogue.play(DEPOIS_RECADO, () => {
        sons.fita(0, 0.4)
        this.dialogue.play(DEPOIS_RECADO_FIM, () => {
          ctx?.state.aprender('secretaria')
          sons.setCasaReal(0, 3.5)
          this.saindo = true
          window.setTimeout(() => ctx?.transition(new FimScene(), 3, 2.4), 900)
        })
      })
    })
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
    principal.volume(0.08, 1.5)
  }

  private levantar(): void {
    this.tocando = false
    this.liam.pose = 'de-pe'
    this.liam.y = this.atual.passoY
    this.liam.braco = 0
    this.liam.x = PIANO.cx + 22
    musica.setPad(0.12, 3)
    principal.volume(0.5, 3)
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
    if (p.travada && p.fala) {
      this.deCostas = true
      audio.refuse()
      this.dialogue.play(p.fala)
      return
    }
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
    sons.porta()
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
    this.deCostas = true
    audio.refuse()
    if (this.depois) {
      audio.bater(3, 200)
      this.dialogue.play([
        { text: 'Eu bato. Três curtas.' },
        { text: 'Ninguém responde.' },
        { text: 'Talvez ela não precise mais ficar do outro lado da porta.' },
      ])
      return
    }
    const i = Math.min(this.tentativasFim, CASA_PORTA_FIM.length - 1)
    this.tentativasFim++
    const fala: Line[] = CASA_PORTA_FIM[i] ?? []
    if (i === 2) {
      this.dialogue.play(fala, () => {
        // As três curtas dele, e do outro lado: três devagar, três rápidas.
        audio.bater(3, 0)
        sons.baterResposta(1500)
        window.setTimeout(() => {
          this.sinal = 1
        }, 1500)
        window.setTimeout(() => {
          this.deCostas = true
          this.dialogue.play([
            { speaker: 'Voz', text: 'Ainda não.', style: 'speech' },
            { text: 'Ela respondeu devagar, e depois rápido.' },
            { text: 'Como quem termina uma frase que eu comecei.' },
          ], () => this.segredo('bater'))
        }, 5200)
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
    if (this.atual.id === 'corredor') this.desenharGente(w)
    if (!this.escondido) this.liam.draw(w, this.atual.luzX, 'rgba(210,200,230,0.32)')
    this.atual.desenharFrente?.(w, estado)
    this.po.draw(w, true)
    w.restore()

    ctx.display.applyGrain(0.05)
    const z = ZOOM + this.zoomPiano * 0.42
    const focoX = WORLD_W / 2 + (PIANO.cx - cam - WORLD_W / 2) * this.zoomPiano
    const focoY = 108 + (112 - 108) * this.zoomPiano
    const susto = this.cutscene === 'passos' && this.passoCut === 0 ? Math.min(1, this.tCut / JANELA_PASSOS) : 0
    ctx.display.present({
      rgbSplit: this.jolt * 2 + susto * 1.4, wave: 0, shake: this.jolt * 2.4 + susto * 0.8,
      zoom: z + susto * 0.12, alvoX: focoX, alvoY: focoY, time: this.t,
    })
    ctx.display.vignette(0.6 + susto * 0.3)

    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    if (this.tocando) {
      this.piano.draw(ctx.display, {})
      this.piano.drawDica(ctx.display, 'toque o que quiser  ·  A S D F G H J K  ·  E ou Esc levanta')
    } else if (!this.leitor.aberto && !this.cutscene && !this.escolha.ativa) {
      this.drawInterface(ctx, cam)
      if (!this.dialogue.active && !this.saindo) this.caderno.draw(c, cssW, cssH, ctx.state.novidade)
    }
    this.etiquetas.draw(c, cssW, (quem) => {
      const f = quem === 'Evelyn' ? this.evelyn : quem === 'Lia' ? this.lia : quem === 'Liam' ? this.liam : null
      if (!f || this.atual.id !== 'corredor' && f !== this.liam) return null
      return { x: ctx.display.toScreenX(f.x - cam), y: ctx.display.toScreenY(f.y - f.altura - 2) }
    })
    this.camada.draw(c, cssW, cssH)
    this.drawEstrela(ctx)
    this.escolha.draw(c, cssW, cssH)
    if (susto > 0) this.drawPassos(c, cssW, cssH, susto)
    this.dialogue.render(c, cssW, cssH)
    this.leitor.render(c, cssW, cssH)
  }

  /** O aviso dos passos: sem enfeite, só o que fazer e o tempo acabando. */
  private drawPassos(c: CanvasRenderingContext2D, cssW: number, cssH: number, k: number): void {
    const s = Math.max(18, Math.min(cssW / 36, 34))
    c.save()
    c.fillStyle = `rgba(120,10,10,${(0.12 + k * 0.16).toFixed(3)})`
    c.fillRect(0, 0, cssW, cssH)
    c.textAlign = 'center'
    c.globalAlpha = 0.75
    c.fillStyle = PAL.inkDim
    c.font = `italic ${s * 0.72}px ${FONT_BODY}`
    c.fillText('Passos. Vindo da cozinha.', cssW / 2, cssH * 0.3)
    const tremor = s * 0.04 * k
    c.globalAlpha = 1
    c.font = `600 ${s}px ${FONT_BODY}`
    c.letterSpacing = '0.16em'
    c.fillStyle = '#ffe2da'
    const toque = 'ontouchstart' in window ? 'TOQUE' : 'E'
    c.fillText(`${toque}  ·  ESCONDE O CADERNO`, cssW / 2 + (Math.random() - 0.5) * tremor, cssH * 0.38)
    c.letterSpacing = '0em'
    const larg = cssW * 0.3
    c.fillStyle = 'rgba(255,255,255,0.15)'
    c.fillRect(cssW / 2 - larg / 2, cssH * 0.42, larg, 3)
    c.fillStyle = k > 0.7 ? '#ff5a5a' : PAL.ink
    c.fillRect(cssW / 2 - (larg * (1 - k)) / 2, cssH * 0.42, larg * (1 - k), 3)
    c.restore()
  }

  /** A mãe (antes) e a Lia (depois), no corredor; e o reflexo no retrato. */
  private desenharGente(w: CanvasRenderingContext2D): void {
    if (this.adrianVisivel > 0) {
      w.save()
      w.globalAlpha = this.adrianVisivel
      this.adrian.draw(w, this.atual.luzX, 'rgba(220,190,160,0.3)')
      w.restore()
      // A luz da cozinha escapando pela porta aberta
      w.fillStyle = `rgba(236,176,112,${(0.18 * this.adrianVisivel).toFixed(3)})`
      w.fillRect(253, 60, 30, 110)
    }
    if (this.reflexo > 0 && !this.depois) {
      w.save()
      w.fillStyle = `rgba(0,0,0,${0.3 * this.reflexo})`
      w.fillRect(0, 0, this.atual.largura, 216)
      // Dentro do vidro do retrato grande: uma silhueta branca, sem rosto.
      w.beginPath()
      w.rect(180, 26, 44, 32)
      w.clip()
      w.globalAlpha = this.reflexo
      criarSombraBranca(203, 60, 28).draw(w, 203, 'rgba(255,255,255,0.4)')
      w.restore()
    }
    if (!this.depois && this.evelynVisivel > 0) {
      w.save()
      w.globalAlpha = this.evelynVisivel
      this.evelyn.y = this.atual.passoY
      this.evelyn.draw(w, this.atual.luzX, 'rgba(220,190,160,0.3)')
      w.restore()
    }
    if (this.depois && this.liaVisivel > 0) {
      w.save()
      w.globalAlpha = this.liaVisivel
      this.lia.y = this.atual.passoY
      this.lia.draw(w, this.atual.luzX, 'rgba(220,190,160,0.25)')
      w.restore()
    }
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
    const objetivo = this.depois
      ? (this.visitados.has('corredor') ? 'a luz âmbar no corredor' : 'ouvir a casa')
      : this.avisouCozinha ? CASA_OBJETIVO_COZINHA : CASA_OBJETIVO_INICIAL
    const vistos = [...this.achados].filter((a) => !a.endsWith('+') && a !== 'melodia-dele').length
    c.fillText(
      `${objetivo}  ·  ${vistos} vestígios  ·  ← → anda · E usa · C caderno`,
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
    // Abaixo do canto, que é do ícone de pausa e do nó do salvamento.
    const x = cssW - s * 2.4
    const y = s * 5.4
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
