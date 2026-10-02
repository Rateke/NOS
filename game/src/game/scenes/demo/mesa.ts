import type { Scene, SceneCtx } from '../types'
import { Dialogue, FONT_BODY } from '../../systems/dialogue'
import { PAL, WORLD_W } from '../../../engine/constants'
import { audio, sons } from '../../../engine/audio'
import { voz } from '../../../engine/voz'
import { clima } from '../../../engine/clima'
import { Figura, VISUAL } from '../../world/figura'
import { Particulas } from '../../world/particulas'
import { Leitor } from '../../systems/leitor'
import {
  MESA_ABERTURA, MESA_CONFRONTO, MESA_PENSAMENTO, MESA_FUGA, MESA_FECHO,
  MESA_VESTIGIOS, MESA_PRATOS, PUXAO_ADRIAN, PUXAO_EVELYN, PUXAO_LIA,
} from '../../content/demoScript'
import {
  MESA_FALTA_AR, MESA_RESPIROU, MESA_SEM_AR,
  MESA_ESTOURO, ARREMESSO_ADRIAN, PRATO_NELAS, PRATO_NO_LIAM, PRATO_PENSAMENTO, GRITARIA, GRITARIA_FIM,
} from '../../content/noite'
import { TearScene } from './tear'
import { Respiracao } from '../../ui/respiracao'
import { memoria } from '../../systems/memoria'
import { DE_NOVO_MESA } from '../../content/deNovo'
import { Etiquetas } from '../../ui/etiqueta'
import { CadernoUI } from '../../ui/cadernoUI'
import type { EstadoCozinha } from '../../world/cozinha'
import {
  drawCozinhaFundo, drawCozinhaFrente, drawCozinhaLuz, COZ_CHAO, LAMPADA, PANELA,
} from '../../world/cozinha'

const CHAO = 160
const LIMITE_ESQ = 84
const LIMITE_DIR = 306
const ALCAPAO = 214

type Fase = 'estouro' | 'abertura' | 'confronto' | 'preso' | 'gritaria' | 'fundo' | 'fuga'

/** Onde fica o quinto prato, na mesa da frente. */
const PRATOS_X = 232

/** Quando, depois de começar a andar, cada prato voa (segundos). */
const ARREMESSOS_EM = [2.0, 7.2, 12.4]
/** O braço levantado antes de soltar: o tempo que o jogador tem. */
const AVISO_PRATO = 1.55
const VOO_PRATO = 0.5
/** Com o prato no ar, o corpo corre sozinho, mais rápido. */
const CORRIDA = 84

/**
 * Quem leva um prato: vira o rosto, põe a mão na cara, e — se for uma delas
 * — cai. Sangra. Depois de um tempo, levanta. Liam não cai: olha a mão, vê
 * o sangue e fica onde está.
 */
interface Ferida {
  f: Figura
  t: number
  cai: boolean
  /** Para que lado o corpo vai (contrário de onde veio o prato). */
  lado: number
}
/** Quanto tempo ela fica no chão antes de conseguir levantar. */
const NO_CHAO = 3.4
const SANGUE = '#8a1016'
const SANGUE_VIVO = '#b8141c'

interface Arremesso {
  fase: 'aviso' | 'voo'
  t: number
  /** Para onde ele mira: a mãe ou a Lia. */
  alvo: 'Evelyn' | 'Lia'
  alvoX: number
  idx: number
}

/** Um caco voando, ou já parado no chão. */
interface Caco {
  x: number
  y: number
  vx: number
  vy: number
  girando: number
  noChao: boolean
  tam: number
}

/** Uma voz da gritaria, já na tela. */
interface Grito {
  quem: 'Adrian' | 'Liam'
  texto: string
  t: number
  x: number
  y: number
  escala: number
}

/**
 * A Mesa.
 *
 * A casa estava calma até a porta da cozinha abrir. Aqui já está tudo
 * explodindo: um prato quebra antes da primeira fala, o pai grita, xinga, e
 * a tela treme junto com cada grito.
 *
 * Liam pode andar entre a mãe e o pai, e é puxado pelos dois — **não existe
 * ponto neutro**. De tempos em tempos o pai pega um prato: o braço sobe, uma
 * marca vermelha aparece no chão aos pés da mãe ou da Lia, e o jogador tem
 * um segundo e meio. Correr e entrar na frente é levar o prato. Não correr
 * é ver o prato estourar nos pés dela. As duas coisas são ruins — e a sombra
 * vai lembrar qual ele escolheu.
 *
 * No fim o pai vira para ele. Os dois sobem a voz, um por cima do outro, até
 * não sobrar nada: o fundo do poço é em voz. E aí ele corre para o porão.
 */
export class MesaScene implements Scene {
  readonly id = 'demo-mesa'
  readonly ponto = 'mesa' as const

  private dialogue = new Dialogue()
  private leitor = new Leitor()
  private etiquetas = new Etiquetas()
  private caderno = new CadernoUI()
  private fase: Fase = 'estouro'
  private t = 0
  private tensao = 0
  private po = new Particulas()
  /** Solavanco da tela: um grito, um prato. */
  private jolt = 0
  /** Clarão: branco quando o prato acerta Liam, vermelho quando acerta perto delas. */
  private clarao = 0
  private claraoCor = '255,255,255'
  private ultimaLinha = 0
  private tPreso = 0
  private arremesso: Arremesso | null = null
  private proxArremesso = 0
  private cacos: Caco[] = []
  /** Quantos pratos Liam levou, e quantos estouraram perto delas. */
  pratosNoLiam = 0
  pratosNelas = 0
  private gritos: Grito[] = []
  private tGritaria = 0
  private idxGrito = 0
  private tFundo = 0
  /** Entre os pratos, ele tenta respirar. Dando certo ou não, piora. */
  respiracao = new Respiracao()
  private respirou = false
  /** 0..1: o ar que faltou. Fecha a tela e não volta inteiro. */
  private sufoco = 0
  private feridas: Ferida[] = []
  /** Quem já sangrou: a marca fica no rosto até o fim da cena. */
  private sujos = new Set<Figura>()
  private gotas: { x: number; y: number; vy: number }[] = []
  private manchas: { x: number; y: number; r: number }[] = []

  private liam = new Figura({
    ...VISUAL.liam,
    x: 232, y: CHAO, altura: 31,
    cor: { roupa: '#252a3a', cabelo: '#12151f', pele: '#6d5a52', sombra: 'rgba(0,0,0,0.5)' },
  })
  // Evelyn: uniforme do trabalho, cabelo comprido solto. O casaco está na
  // cadeira — pronto para sair.
  private evelyn = new Figura({
    ...VISUAL.evelyn,
    x: 132, y: CHAO, altura: 38, cabelo: 'longo', gola: '#a8b4bc',
    cor: { roupa: '#3e5664', cabelo: '#2a1a16', pele: '#7a5a4e', sombra: 'rgba(0,0,0,0.5)' },
  })
  // Adrian: o mais alto, barba, camisa escura de gola clara. Calmo.
  private adrian = new Figura({
    ...VISUAL.adrian,
    x: 292, y: CHAO, altura: 42, barba: true, gola: '#d4ccc0',
    cor: { roupa: '#2e2430', cabelo: '#16100f', pele: '#7a584c', sombra: 'rgba(0,0,0,0.5)' },
  })
  // Lia: quatorze anos, rabo de cavalo, moletom vinho e a mochila nas costas.
  private lia = new Figura({
    ...VISUAL.lia,
    x: 92, y: CHAO, altura: 32, cabelo: 'rabo', mochila: '#2e3e56',
    cor: { roupa: '#6a2c38', cabelo: '#1e1214', pele: '#7a6052', sombra: 'rgba(0,0,0,0.5)' },
  })

  private puxao = ''
  private puxaoQuem: 'Adrian' | 'Evelyn' | 'Lia' = 'Adrian'
  private puxaoAte = 0
  private proxPuxao = 3
  private idxPuxao = 0
  private idxPensamento = 0
  /** Vestígios já examinados. É a única coisa que o jogador muda aqui. */
  private achados = new Set<string>()
  private pratosVistos = false
  private panoTirado = false
  /** Destino de um clique. Liam anda sozinho até lá. */
  private destino: number | null = null
  private desdeQuePreso = 0
  private examinarAoChegar = false

  enter(ctx: SceneCtx): void {
    ctx.state.aprender('mesa')
    this.etiquetas.apresentar(ctx.state, 'Evelyn')
    this.etiquetas.apresentar(ctx.state, 'Lia', 8)
    audio.setAmbient(0.5, 0.2)
    audio.startArgument()
    audio.setArgument(0.5, 0.1)
    // Antes de qualquer palavra: o prato estourando na parede.
    this.quebrar(150, COZ_CHAO - 34, false)
    this.dialogue.play(MESA_ESTOURO, () => {
      this.fase = 'abertura'
      audio.setArgument(0.22, 2)
      const abre = memoria.terminou ? [...MESA_ABERTURA.slice(0, 3), ...DE_NOVO_MESA, ...MESA_ABERTURA.slice(3)] : MESA_ABERTURA
      this.dialogue.play(abre, () => {
        this.fase = 'confronto'
        this.dialogue.play(MESA_CONFRONTO, () => {
          this.fase = 'preso'
        }, 1.5)
      })
    }, 1.1)
  }

  /** O prato estoura: som, cacos, solavanco. */
  private quebrar(x: number, y: number, noLiam: boolean): void {
    sons.prato()
    this.jolt = 1
    this.clarao = noLiam ? 0.7 : 0.35
    this.claraoCor = noLiam ? '255,255,255' : '255,90,90'
    for (let i = 0; i < 12; i++) {
      this.cacos.push({
        x, y,
        vx: (Math.random() - 0.5) * 110,
        vy: -(30 + Math.random() * 70),
        girando: Math.random() * 6,
        noChao: false,
        tam: Math.random() < 0.6 ? 1 : 2,
      })
    }
  }

  private jogo: SceneCtx['state'] | null = null

  update(dt: number, ctx: SceneCtx): void {
    this.jogo = ctx.state
    this.t += dt
    this.dialogue.update(dt)
    this.etiquetas.update(dt)
    this.po.update(dt)
    for (const f of [this.liam, this.evelyn, this.adrian, this.lia]) f.update(dt)

    // Fumaça fina saindo da panela esquecida no fogo. Ninguém olha.
    if (Math.random() < dt * (this.panoTirado ? 3 : 6)) this.po.poeira(PANELA.x - 4, PANELA.y - 8, 8, 3, 'rgba(170,166,176,')

    this.encarar()
    this.misturar()
    this.jolt = Math.max(0, this.jolt - dt * 2.6)
    this.clarao = Math.max(0, this.clarao - dt * 2.2)
    this.moverCacos(dt)

    // Cada fala gritada sacode a tela no momento em que começa.
    if (this.dialogue.linhaNum !== this.ultimaLinha) {
      this.ultimaLinha = this.dialogue.linhaNum
      if (this.dialogue.atual?.grito) {
        this.jolt = Math.max(this.jolt, 0.8)
        audio.heartbeat(0.2)
      }
    }

    this.sufoco = Math.max(this.respirou ? 0.35 : 0, this.sufoco - dt * 0.08)
    this.sangrar(dt)
    if (this.respiracao.ativa) {
      // Tudo continua em volta. Ele só consegue pensar no ar.
      this.liam.ofego = 3.2
      this.liam.tremor = 1
      this.respiracao.update(dt, ctx.input)
      return
    }

    if (this.fase === 'gritaria') {
      this.gritar(dt)
      return
    }
    if (this.fase === 'fundo') {
      this.fundo(dt, ctx)
      return
    }

    // Lendo o bilhete, o mundo espera. É o único respiro da cena.
    if (this.leitor.aberto) {
      this.leitor.update(dt, ctx.input)
      return
    }

    // Nas partes assistidas a cena segue por baixo da fala; nas outras, a
    // fala segura tudo. O toque passa a fala sempre (grito curto ignora).
    const cinematico = this.fase === 'estouro' || this.fase === 'confronto' || this.fase === 'fuga'
    if (this.dialogue.active) {
      if (ctx.input.consumeConfirm()) this.dialogue.confirm()
      if (!cinematico) return
    }

    if (this.fase === 'preso') this.preso(dt, ctx)
    else if (this.fase === 'fuga') this.fugir(dt, ctx)
  }

  /**
   * A música da briga: um contrabaixo que corre, cordas que fecham e o
   * coração, tudo preso à tensão. Prato no ar é o pico.
   */
  private misturar(): void {
    const f = this.fase
    const t = this.tensao
    if (f === 'estouro' || f === 'abertura' || f === 'confronto') {
      clima.set({ pulso: 0.45, bpm: 96, cordas: 0.35, aperto: 0.4, coracao: 0.3, chuva: 0.35 }, 0.6)
    } else if (f === 'preso') {
      if (this.arremesso) clima.set({ pulso: 0.9, bpm: 160, cordas: 0.8, aperto: 1, coracao: 1 }, 0.2)
      else {
        clima.set({
          pulso: 0.4 + t * 0.5, bpm: 92 + t * 56, cordas: 0.3 + t * 0.55, aperto: 0.3 + t * 0.7,
          coracao: t * 0.8, chuva: 0.3,
        }, 0.6)
      }
    } else if (f === 'gritaria') {
      clima.set({ pulso: 1, bpm: 150 + this.tGritaria * 4, cordas: 1, aperto: 1, coracao: 1, chuva: 0 }, 0.3)
    } else if (f === 'fundo') {
      clima.parar(0.05)
    } else {
      // A fuga: só o coração e as cordas baixas.
      clima.set({ pulso: 0, cordas: 0.2, aperto: 0.6, coracao: 0.7, chuva: 0 }, 1.5)
    }
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
    // Carência curta ao entrar na fase: um confirmar que sobrou de fechar a
    // fala anterior não pode examinar nada sozinho.
    this.desdeQuePreso += dt
    if (this.desdeQuePreso < 0.35) {
      ctx.input.consumeConfirm()
      ctx.input.consumeTap()
      return
    }

    this.tPreso += dt
    if (!this.arremesso && this.proxArremesso < ARREMESSOS_EM.length && this.tPreso >= (ARREMESSOS_EM[this.proxArremesso] ?? 99)) {
      this.armar()
    }
    if (this.arremesso) {
      this.arremessar(dt, ctx)
      return
    }
    // Depois do primeiro prato, o ar falta.
    if (!this.respirou && this.proxArremesso >= 1 && this.tPreso > (ARREMESSOS_EM[0] ?? 2) + 3.2) {
      this.faltaAr()
      return
    }

    if (this.caderno.update(dt, ctx, this.leitor, true)) return

    // Examinar o que estiver ao alcance
    // Igual à casa: um clique vale como destino, não como usar o que está ao
    // lado — senão clicar para andar examinaria o objeto embaixo dos pés.
    const tap = ctx.input.consumeTap()
    const confirmou = ctx.input.consumeConfirm()
    const perto = this.vestigioPerto()
    if (!tap && confirmou && perto && !this.achados.has(perto.id)) {
      this.examinar(perto)
      return
    }
    if (!tap && confirmou && !perto && this.pratosPerto() && !this.pratosVistos) {
      this.contarPratos(ctx)
      return
    }

    // Andar. O teclado manda direto; o clique vira destino e Liam vai
    // sozinho até lá — clicar de quadro em quadro seria insuportável.
    const eixo = ctx.input.moveAxis()
    let dx = eixo ? eixo.x : 0
    if (eixo) this.destino = null

    if (tap) {
      const alvo = ctx.display.toWorldX(tap.x)
      // Clique em cima de um vestígio: anda até ele e examina ao chegar.
      const v = MESA_VESTIGIOS.find((c) => Math.abs(c.x - alvo) < 24)
      this.destino = v ? v.x : alvo
      this.examinarAoChegar = Boolean(v)
    }

    if (this.destino !== null && dx === 0) {
      const d = this.destino - this.liam.x
      if (Math.abs(d) < 3) {
        this.destino = null
        if (this.examinarAoChegar) {
          this.examinarAoChegar = false
          const v = this.vestigioPerto()
          if (v && !this.achados.has(v.id)) {
            this.examinar(v)
            return
          }
        }
      } else {
        dx = Math.sign(d)
      }
    }

    this.liam.x = Math.max(LIMITE_ESQ, Math.min(LIMITE_DIR, this.liam.x + dx * 42 * dt))

    // A tensão sobe sozinha. Ficar parado não é neutro: é mais um jeito de
    // não decidir, e a casa cobra igual.
    this.tensao = Math.min(1, this.tensao + dt * 0.05)
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
      // O pai vira para ele. Começa a gritaria.
      this.fase = 'gritaria'
      // O pai corta qualquer pensamento no meio: a gritaria não espera.
      this.dialogue.play([])
      sons.iniciarCacofonia()
      this.tGritaria = 0
      this.idxGrito = 0
      this.gritos = []
      this.destino = null
      void ctx
    }
  }

  private faltaAr(): void {
    this.respirou = true
    this.destino = null
    this.liam.andando = 0
    this.dialogue.play(MESA_FALTA_AR, () => {
      this.respiracao.comecar({
        ciclos: 2, periodo: 3.4, tolerancia: 0.22,
        onFim: (ok) => {
          // Piora: a tela fecha e não abre mais inteira; a briga anda um pouco.
          this.tensao = Math.min(0.97, this.tensao + 0.08)
          this.sufoco = 1
          if (ok) {
            // Ele conseguiu. O pai ouviu o ar entrando.
            this.jogo?.aprender('respirou')
            this.jolt = 1
            this.dialogue.play(MESA_RESPIROU, undefined, 1.2)
          } else {
            this.jogo?.aprender('sem-ar')
            audio.heartbeat(0.3)
            this.dialogue.play(MESA_SEM_AR)
          }
        },
      })
    })
  }

  private ferir(f: Figura, cai: boolean): void {
    this.feridas = this.feridas.filter((k) => k.f !== f)
    // O prato vem do pai (à direita): o corpo vai para a esquerda.
    this.feridas.push({ f, t: 0, cai, lado: f.x < this.adrian.x ? -1 : 1 })
    this.sujos.add(f)
    audio.heartbeat(0.3)
  }

  /** O ângulo do corpo de quem caiu (0 em pé). */
  private tombo(f: Figura): number {
    const k = this.feridas.find((x) => x.f === f)
    if (!k || !k.cai) return 0
    const t = k.t
    if (t < 1.1) return 0
    if (t < 1.5) return k.lado * 1.4 * Math.pow((t - 1.1) / 0.4, 2)
    if (t < 1.5 + NO_CHAO) return k.lado * 1.4
    const sobe = Math.min(1, (t - 1.5 - NO_CHAO) / 1.1)
    return k.lado * 1.4 * (1 - sobe * sobe * (3 - 2 * sobe))
  }

  /** Onde fica o rosto agora, contando o tombo. */
  private rostoDe(f: Figura): { x: number; y: number } {
    const a = this.tombo(f)
    const d = f.altura * 0.8
    return { x: f.x + Math.sin(a) * d, y: f.y - Math.cos(a) * d }
  }

  private sangrar(dt: number): void {
    for (const k of this.feridas) {
      k.t += dt
      const f = k.f
      const t = k.t
      if (t < 0.3) {
        // O tranco: o rosto vira para o lado contrário.
        f.tremor = 2
        f.olhar = k.lado
        f.braco = 0
      } else if (k.cai ? t < 1.5 + NO_CHAO + 1.1 : t < 1.1) {
        // A mão no rosto.
        f.braco = 0.9
        f.curvatura = 0.45
        f.olhar = k.lado
        f.tremor = Math.max(0.4, f.tremor)
      } else if (!k.cai && t < 2.4) {
        // Ele abaixa a mão e olha para ela. Tem sangue.
        f.braco = 0.45
        f.curvatura = 0.35
        f.tremor = 0.5
      } else {
        f.braco = k.cai ? 0.6 : 0
        f.curvatura = k.cai ? 0.35 : 0.2
      }
      // O baque no chão.
      if (k.cai && t - dt < 1.5 && t >= 1.5) {
        sons.passo(0, 1.5)
        this.jolt = Math.max(this.jolt, 0.5)
      }
      // Pinga do rosto enquanto a mão está lá; no chão, a poça cresce.
      const r = this.rostoDe(f)
      if (t > 0.25 && t < 3 && Math.random() < dt * 7) this.gotas.push({ x: r.x + (Math.random() - 0.5) * 3, y: r.y + 2, vy: 10 })
      if (k.cai && t > 1.5 && t < 1.5 + NO_CHAO) {
        const poca = this.manchas.find((m) => Math.abs(m.x - r.x) < 3 && m.r > 2)
        if (poca) poca.r = Math.min(9, poca.r + dt * 2.2)
        else this.manchas.push({ x: Math.round(r.x), y: CHAO + 1, r: 2.5 })
      }
    }
    this.feridas = this.feridas.filter((k) => k.t < (k.cai ? 1.5 + NO_CHAO + 1.6 : 2.6))
    for (const g of this.gotas) {
      g.vy += 300 * dt
      g.y += g.vy * dt
    }
    for (const g of this.gotas.filter((x) => x.y >= CHAO + 1)) {
      this.manchas.push({ x: Math.round(g.x), y: CHAO + 1 + Math.floor(Math.random() * 4), r: Math.random() < 0.3 ? 1.5 : 0.8 })
    }
    this.gotas = this.gotas.filter((x) => x.y < CHAO + 1)
    if (this.manchas.length > 160) this.manchas.splice(0, this.manchas.length - 160)
  }

  /** Uma pessoa da cozinha, caída ou de pé, com o sangue que tiver. */
  private desenharPessoa(w: CanvasRenderingContext2D, f: Figura, luz: string): void {
    const a = this.tombo(f)
    w.save()
    if (a !== 0) {
      w.translate(f.x, f.y)
      w.rotate(a)
      w.translate(-f.x, -f.y)
    }
    f.draw(w, LAMPADA.x, luz)
    if (this.sujos.has(f)) {
      // O corte na testa, e o sangue escorrendo pelo rosto até o queixo.
      const x = Math.round(f.x) + (f.olhar >= 0 ? 1 : -2)
      const y = Math.round(f.y - f.altura * 0.84)
      w.fillStyle = SANGUE_VIVO
      w.fillRect(x, y, 2, 1)
      w.fillStyle = SANGUE
      w.fillRect(x + 1, y + 1, 1, 4)
      w.fillRect(x, y + 3, 1, 2)
      // Na mão, quando ela está no rosto ou na frente dos olhos.
      if (f.braco > 0.3) {
        w.fillStyle = SANGUE_VIVO
        w.fillRect(Math.round(f.x) + (f.olhar >= 0 ? 3 : -4), Math.round(f.y - f.altura * (f.braco > 0.7 ? 0.8 : 0.55)), 2, 2)
      }
    }
    w.restore()
  }

  /** O braço sobe com o prato. Ele mira na mãe ou na Lia. */
  private armar(): void {
    const idx = this.proxArremesso
    this.proxArremesso++
    const alvo: 'Evelyn' | 'Lia' = idx === 1 ? 'Lia' : 'Evelyn'
    const f = alvo === 'Lia' ? this.lia : this.evelyn
    this.arremesso = { fase: 'aviso', t: 0, alvo, alvoX: f.x + 10, idx }
    this.destino = null
    this.puxaoAte = 0
    this.chamar('Adrian', [ARREMESSO_ADRIAN[idx % ARREMESSO_ADRIAN.length] ?? 'ESCOLHE!'])
    this.jolt = Math.max(this.jolt, 0.5)
    audio.setArgument(0.6, 0.2)
  }

  /**
   * O prato no ar. O corpo de Liam corre sozinho, mais rápido — mas para
   * onde, é o jogador que diz.
   */
  private arremessar(dt: number, ctx: SceneCtx): void {
    const a = this.arremesso
    if (!a) return
    a.t += dt
    ctx.input.consumeConfirm()
    const tap = ctx.input.consumeTap()
    if (tap) this.destino = ctx.display.toWorldX(tap.x)
    const eixo = ctx.input.moveAxis()
    let dx = eixo ? eixo.x : 0
    if (eixo) this.destino = null
    if (this.destino !== null && dx === 0) {
      const d = this.destino - this.liam.x
      if (Math.abs(d) < 3) this.destino = null
      else dx = Math.sign(d)
    }
    this.liam.x = Math.max(LIMITE_ESQ, Math.min(LIMITE_DIR, this.liam.x + dx * CORRIDA * dt))
    if (dx !== 0) this.liam.olhar = Math.sign(dx)

    if (a.fase === 'aviso' && a.t >= AVISO_PRATO) {
      a.fase = 'voo'
      a.t = 0
      return
    }
    if (a.fase === 'voo' && a.t >= VOO_PRATO) {
      const noLiam = Math.abs(this.liam.x - a.alvoX) < 16
      this.arremesso = null
      this.destino = null
      if (noLiam) {
        this.pratosNoLiam++
        this.jogo?.aprender('prato-na-frente')
        this.liam.tremor = 2
        this.quebrar(this.liam.x, CHAO - 22, true)
        this.ferir(this.liam, false)
        const r = PRATO_NO_LIAM[a.idx % PRATO_NO_LIAM.length]
        if (r) this.chamar(r.quem, [r.texto])
        this.tensao = Math.min(0.97, this.tensao + 0.02)
        if (this.pratosNoLiam === 1) this.dialogue.play(PRATO_PENSAMENTO, undefined, 1.2)
      } else {
        this.pratosNelas++
        this.jogo?.aprender('prato-nelas')
        const f = a.alvo === 'Lia' ? this.lia : this.evelyn
        f.tremor = 1.6
        this.quebrar(a.alvoX - 8, CHAO - 26, false)
        this.ferir(f, true)
        const r = PRATO_NELAS[a.idx % PRATO_NELAS.length]
        if (r) this.chamar(r.quem, [r.texto])
        this.tensao = Math.min(0.97, this.tensao + 0.08)
      }
      audio.setArgument(0.3 + this.tensao * 0.4, 1)
    }
  }

  private moverCacos(dt: number): void {
    for (const k of this.cacos) {
      if (k.noChao) continue
      k.vy += 260 * dt
      k.x += k.vx * dt
      k.y += k.vy * dt
      k.girando += dt * 12
      if (k.y >= CHAO + 2) {
        k.y = CHAO + 2 + Math.random() * 6
        k.noChao = true
      }
    }
    // Os cacos ficam no chão; só os mais antigos somem, para não pesar.
    if (this.cacos.length > 120) this.cacos.splice(0, this.cacos.length - 120)
    for (const f of [this.evelyn, this.lia, this.liam]) f.tremor = Math.max(this.fase === 'preso' ? 0 : f.tremor, f.tremor - dt * 2)
  }

  /**
   * Arco 3 — o fundo do poço, em voz. As falas entram no tempo marcado e
   * não saem: se empilham, cada uma maior, até a tela não comportar mais.
   */
  private gritar(dt: number): void {
    this.tGritaria += dt
    // O pai anda até ele; ele recua até a parede da porta.
    this.adrian.x += (Math.min(LIMITE_DIR, this.liam.x + 30) - this.adrian.x) * Math.min(1, dt * 1.2)
    this.liam.olhar = 1
    this.liam.curvatura = Math.min(0.8, this.tGritaria * 0.12)
    this.liam.tremor = Math.min(2.4, this.tGritaria * 0.35)
    while (this.idxGrito < GRITARIA.length) {
      const g = GRITARIA[this.idxGrito]
      if (!g || g.t > this.tGritaria) break
      const k = this.idxGrito
      this.gritos.push({
        quem: g.quem, texto: g.texto, t: this.tGritaria,
        // Posições espalhadas mas fixas: o caos tem desenho.
        x: 0.5 + Math.sin(k * 2.39) * 0.26,
        y: 0.2 + ((k * 0.37) % 1) * 0.58,
        escala: 0.85 + k * 0.09,
      })
      this.jolt = Math.max(this.jolt, 0.5 + k * 0.05)
      audio.heartbeat(0.14 + k * 0.012)
      // Cada fala sai na voz de quem gritou, do lado da tela onde ela caiu,
      // por cima das outras — e com o caos por baixo, cada vez maior.
      const ultimo = this.gritos[this.gritos.length - 1]
      voz.dizer(g.quem, g.texto, {
        grito: g.texto === g.texto.toUpperCase() || k > 3,
        pan: ((ultimo?.x ?? 0.5) - 0.5) * 1.6,
        volume: 0.9 + k * 0.05,
      })
      sons.caos(Math.min(1, 0.4 + k * 0.06))
      this.idxGrito++
    }
    audio.setArgument(Math.min(0.95, 0.4 + this.tGritaria * 0.09), 0.3)
    sons.cacofonia(this.tGritaria / GRITARIA_FIM)
    if (this.tGritaria >= GRITARIA_FIM) {
      // Corte seco: preto e silêncio. O fundo do poço. Sobra o zumbido.
      sons.cortarCacofonia(true)
      voz.calar()
      clima.parar(0.05)
      this.fase = 'fundo'
      this.tFundo = 0
      audio.setArgument(0, 0.04)
      audio.setAmbient(0, 0.04)
      this.gritos = []
    }
  }

  /** O preto depois dos gritos, e então a fuga. */
  private fundo(dt: number, ctx: SceneCtx): void {
    this.tFundo += dt
    if (this.dialogue.active && ctx.input.consumeConfirm()) this.dialogue.confirm()
    ctx.input.consumeTap()
    if (this.tFundo > 1.6 && !this.dialogue.active && this.fase === 'fundo') {
      this.fase = 'fuga'
      this.liam.curvatura = 0.4
      this.liam.tremor = 0.6
      audio.setAmbient(0.3, 1.2)
      // O fecho depende de quanto ele viu — nunca do que ele conseguiu mudar.
      const n = this.achados.size
      const fecho = MESA_FECHO[n >= 4 ? 4 : n >= 2 ? 2 : 0] ?? MESA_FUGA
      this.dialogue.play(fecho, () => {
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

  private examinar(v: (typeof MESA_VESTIGIOS)[number]): void {
    this.achados.add(v.id)
    if (v.id === 'fogao') this.panoTirado = true
    audio.interact()
    if (v.aprende) this.jogo?.aprender(v.aprende)
    if (v.segredo && this.jogo?.descobrir(v.segredo)) window.setTimeout(() => audio.segredo(), 400)
    const doc = v.documento
    if (doc) {
      const depois = v.depois
      this.dialogue.play(v.linhas, () => {
        this.leitor.abrir(doc, { onFechar: () => { if (depois) this.dialogue.play(depois) } })
      })
      return
    }
    this.dialogue.play(v.linhas)
  }

  /** Um documento aberto na tela. */
  get lendo(): boolean {
    return this.leitor.aberto
  }

  /** Para os testes: um prato no ar (ou na mão dele, mirando). */
  get pratoNoAr(): string | null {
    return this.arremesso ? this.arremesso.fase : null
  }

  /**
   * Os pratos não contam como vestígio e não mudam o fecho. Estão ali para
   * quem reparar: cinco pratos numa casa de quatro.
   */
  private contarPratos(ctx: SceneCtx): void {
    this.pratosVistos = true
    audio.interact()
    this.dialogue.play(MESA_PRATOS, () => {
      if (ctx.state.descobrir('pratos')) audio.segredo()
    })
  }

  private pratosPerto(): boolean {
    return Math.abs(PRATOS_X - this.liam.x) < 10
  }

  /** O vestígio ao alcance de Liam, se houver. */
  private vestigioPerto(): (typeof MESA_VESTIGIOS)[number] | null {
    for (const v of MESA_VESTIGIOS) {
      if (Math.abs(v.x - this.liam.x) < 17) return v
    }
    return null
  }

  private chamar(quem: 'Adrian' | 'Evelyn' | 'Lia', falas: string[]): void {
    this.puxaoQuem = quem
    this.puxao = falas[this.idxPuxao % falas.length] ?? ''
    this.idxPuxao++
    this.puxaoAte = this.t + 3
    const gritado = this.puxao === this.puxao.toUpperCase()
    // Cada um chama de onde está: a voz vem do lado dele.
    const f = quem === 'Adrian' ? this.adrian : quem === 'Lia' ? this.lia : this.evelyn
    voz.dizer(quem, this.puxao, { grito: gritado, pan: (f.x - this.liam.x) / 140 })
    if (gritado) sons.caos(0.5)
  }

  render(ctx: SceneCtx): void {
    const w = ctx.display.beginWorld()
    const e = this.estadoCozinha
    drawCozinhaFundo(w, e)
    // O sangue no chão, por baixo de todo mundo.
    for (const m of this.manchas) {
      w.fillStyle = m.r > 2 ? SANGUE : 'rgba(138,16,22,0.9)'
      w.beginPath()
      w.ellipse(m.x, m.y, m.r, Math.max(0.6, m.r * 0.35), 0, 0, Math.PI * 2)
      w.fill()
    }
    this.desenharPessoa(w, this.lia, 'rgba(220,190,160,0.3)')
    this.desenharPessoa(w, this.evelyn, 'rgba(220,190,160,0.3)')
    this.adrian.draw(w, LAMPADA.x, 'rgba(220,190,160,0.3)')
    // A chave da porta no bolso dele. Brilha de vez em quando.
    if (Math.sin(this.t * 1.7) > 0.93) {
      w.fillStyle = 'rgba(236,200,120,0.9)'
      w.fillRect(Math.round(this.adrian.x) + 3, COZ_CHAO - 15, 1, 1)
    }
    this.desenharPessoa(w, this.liam, 'rgba(220,200,180,0.3)')
    for (const g of this.gotas) {
      w.fillStyle = SANGUE_VIVO
      w.fillRect(Math.round(g.x), Math.round(g.y), 1, 2)
    }
    this.desenharPrato(w)
    this.desenharCacos(w)
    this.po.draw(w, false)
    drawCozinhaLuz(w, e)
    drawCozinhaFrente(w, PRATOS_X)
    if (this.clarao > 0) {
      w.fillStyle = `rgba(${this.claraoCor},${(this.clarao * 0.55).toFixed(3)})`
      w.fillRect(0, 0, WORLD_W, 216)
    }

    const grit = this.fase === 'gritaria' ? Math.min(1, this.tGritaria / GRITARIA_FIM) : 0
    ctx.display.applyGrain(0.05 + this.tensao * 0.04 + grit * 0.06)
    // As paredes fecham conforme a tensão: o cômodo encolhe em volta dele.
    ctx.display.present({
      rgbSplit: this.tensao * 0.7 + this.jolt * 2 + grit * 3,
      wave: grit * 1.2,
      shake: this.tensao * this.tensao * 0.8 + this.jolt * 3.2 + grit * grit * 3,
      zoom: 1.2 + this.tensao * 0.34 + grit * 0.25 + this.sufoco * 0.06,
      alvoX: this.liam.x * 0.35 + WORLD_W / 2 * 0.65,
      alvoY: 112,
      time: this.t,
    })
    ctx.display.vignette(Math.min(0.98, 0.66 + this.tensao * 0.2 + grit * 0.12 + this.sufoco * 0.14))

    if (this.fase === 'fundo') {
      const c0 = ctx.display.ctx
      c0.fillStyle = '#000'
      c0.fillRect(0, 0, ctx.display.cssW, ctx.display.cssH)
      this.dialogue.render(c0, ctx.display.cssW, ctx.display.cssH)
      return
    }
    if (this.fase === 'gritaria') {
      this.desenharGritaria(ctx)
      return
    }

    this.drawAviso(ctx)
    this.drawPuxao(ctx)
    const c = ctx.display.ctx
    this.etiquetas.draw(c, ctx.display.cssW, (quem) => {
      const f = quem === 'Evelyn' ? this.evelyn : quem === 'Lia' ? this.lia : null
      if (!f) return null
      return { x: ctx.display.toScreenX(f.x), y: ctx.display.toScreenY(f.y - f.altura) }
    })
    if (this.fase === 'preso' && !this.leitor.aberto && !this.dialogue.active) {
      this.caderno.draw(c, ctx.display.cssW, ctx.display.cssH, this.jogo?.novidade ?? 0)
    }
    this.respiracao.draw(c, ctx.display.cssW, ctx.display.cssH, ctx.input.touchMode)
    this.dialogue.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
    this.leitor.render(ctx.display.ctx, ctx.display.cssW, ctx.display.cssH)
  }

  /**
   * O prato: na mão dele, acima da cabeça, enquanto ele mira; depois no ar,
   * girando, até o alvo. No chão, aos pés de quem ele mira, uma marca
   * vermelha que pulsa — é ali que vai estourar.
   */
  private desenharPrato(w: CanvasRenderingContext2D): void {
    const a = this.arremesso
    if (!a) return
    const mao = { x: this.adrian.x - 3, y: CHAO - this.adrian.altura - 4 }
    const alvo = { x: a.alvoX, y: CHAO - 20 }
    // A marca no chão
    const p = 0.5 + Math.sin(this.t * 14) * 0.5
    w.save()
    w.fillStyle = `rgba(255,60,60,${0.18 + p * 0.18})`
    w.beginPath()
    w.ellipse(a.alvoX, CHAO + 1, 12, 3.4, 0, 0, Math.PI * 2)
    w.fill()
    w.strokeStyle = `rgba(255,90,90,${0.55 + p * 0.45})`
    w.lineWidth = 1
    w.beginPath()
    w.ellipse(a.alvoX, CHAO + 1, 12 + p * 3, 3.4 + p, 0, 0, Math.PI * 2)
    w.stroke()
    w.restore()
    let x = mao.x
    let y = mao.y
    let ang = Math.sin(this.t * 9) * 0.3
    if (a.fase === 'voo') {
      const k = Math.min(1, a.t / VOO_PRATO)
      x = mao.x + (alvo.x - mao.x) * k
      y = mao.y + (alvo.y - mao.y) * k - Math.sin(k * Math.PI) * 18
      ang = a.t * 26
    } else {
      // O "!" em cima dele, no tempo do braço erguido
      w.fillStyle = `rgba(255,80,80,${0.6 + p * 0.4})`
      w.fillRect(Math.round(this.adrian.x) - 1, Math.round(mao.y) - 16, 3, 8)
      w.fillRect(Math.round(this.adrian.x) - 1, Math.round(mao.y) - 6, 3, 3)
    }
    w.save()
    w.translate(x, y)
    w.rotate(ang)
    // Um halo claro em volta, para o prato não sumir na parede escura
    w.fillStyle = 'rgba(255,250,240,0.18)'
    w.beginPath()
    w.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2)
    w.fill()
    w.fillStyle = '#f0ebe0'
    w.beginPath()
    w.ellipse(0, 0, 6.5, 2.4, 0, 0, Math.PI * 2)
    w.fill()
    w.fillStyle = '#b8b0a2'
    w.beginPath()
    w.ellipse(0, 0, 3.2, 1.1, 0, 0, Math.PI * 2)
    w.fill()
    w.restore()
  }

  private desenharCacos(w: CanvasRenderingContext2D): void {
    for (const k of this.cacos) {
      w.fillStyle = k.noChao ? 'rgba(214,208,196,0.75)' : '#f0ebe0'
      w.fillRect(Math.round(k.x), Math.round(k.y), k.tam + (k.noChao ? 1 : 0), k.tam)
    }
  }

  /** As vozes empilhadas, cada uma maior, se desdobrando em vermelho e azul. */
  private desenharGritaria(ctx: SceneCtx): void {
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const base = Math.max(18, Math.min(cssW / 34, 40))
    c.save()
    c.textAlign = 'center'
    for (const [i, g] of this.gritos.entries()) {
      const idade = this.tGritaria - g.t
      const recente = i >= this.gritos.length - 2
      const s = base * g.escala * (1 + Math.max(0, 0.25 - idade) * 1.2)
      const tremor = s * 0.05 * (recente ? 1.6 : 0.6)
      c.font = `${g.quem === 'Adrian' ? 600 : 500} ${s}px ${FONT_BODY}`
      // Cabe na tela: o centro anda para dentro quando a frase é comprida.
      const meia = c.measureText(g.texto).width / 2 + cssW * 0.03
      const x = Math.max(meia, Math.min(cssW - meia, cssW * g.x))
      const y = cssH * g.y
      c.globalAlpha = recente ? 0.3 : 0.14
      c.fillStyle = '#ff5a6e'
      c.fillText(g.texto, x - tremor, y)
      c.fillStyle = '#5ad9ff'
      c.fillText(g.texto, x + tremor, y)
      c.globalAlpha = recente ? 1 : 0.5
      c.fillStyle = g.quem === 'Adrian' ? '#ffd8cc' : '#d8e2ff'
      c.fillText(g.texto, x + (Math.random() - 0.5) * tremor, y + (Math.random() - 0.5) * tremor)
      if (recente) {
        c.globalAlpha = 0.7
        c.font = `${Math.max(11, s * 0.36)}px ${FONT_BODY}`
        c.letterSpacing = '0.2em'
        c.fillStyle = g.quem === 'Adrian' ? PAL.accent : PAL.inkDim
        c.fillText(g.quem.toUpperCase(), x, y - s * 0.95)
        c.letterSpacing = '0em'
      }
    }
    c.restore()
  }

  private get estadoCozinha(): EstadoCozinha {
    return { t: this.t, tensao: this.tensao, panoTirado: this.panoTirado }
  }

  /** Aviso de que há algo ao alcance, e quantos ele já viu. */
  private drawAviso(ctx: SceneCtx): void {
    if (this.fase !== 'preso' || this.leitor.aberto || this.arremesso) return
    const c = ctx.display.ctx
    const { cssW, cssH } = ctx.display
    const s = Math.max(12, Math.min(cssW / 70, 17))
    c.save()
    c.textAlign = 'center'
    c.font = `${s}px ${FONT_BODY}`

    const perto = this.vestigioPerto()
    const pratos = !perto && this.pratosPerto() && !this.pratosVistos
    if ((perto && !this.achados.has(perto.id)) || pratos) {
      const sx = ctx.display.toScreenX(this.liam.x)
      const sy = ctx.display.toScreenY(this.liam.y - 40)
      const txt = perto ? perto.rotulo : 'Contar os pratos'
      const w = c.measureText(txt).width + s * 3.2
      c.fillStyle = 'rgba(4,6,11,0.82)'
      c.fillRect(sx - w / 2, sy - s, w, s * 1.9)
      c.textAlign = 'left'
      c.fillStyle = PAL.accent
      c.fillText('E', sx - w / 2 + s * 0.7, sy + s * 0.45)
      c.fillStyle = PAL.ink
      c.fillText(txt, sx - w / 2 + s * 2, sy + s * 0.45)
      c.textAlign = 'center'
    }

    c.globalAlpha = 0.45
    c.fillStyle = PAL.inkDim
    c.font = `${s * 0.92}px ${FONT_BODY}`
    c.fillText(
      `${this.achados.size}/${MESA_VESTIGIOS.length} · ← → anda · E examina · C caderno`,
      cssW / 2, cssH - s * 2,
    )
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
    // Em maiúsculas é grito: maior, e tremendo.
    const gritado = this.puxao === this.puxao.toUpperCase() && /[A-ZÁ-Ú]/.test(this.puxao)
    const s2 = gritado ? size * 1.3 : size
    const tremor = gritado ? s2 * 0.05 : 0
    c.font = `${gritado ? 600 : 400} ${s2}px ${FONT_BODY}`
    if (gritado) {
      c.globalAlpha = a * 0.3
      c.fillStyle = '#ff5a6e'
      c.fillText(this.puxao, x - tremor, cssH * 0.14 + size * 1.9)
      c.fillStyle = '#5ad9ff'
      c.fillText(this.puxao, x + tremor, cssH * 0.14 + size * 1.9)
      c.globalAlpha = a
    }
    c.fillStyle = gritado ? '#ffe2da' : PAL.ink
    c.fillText(this.puxao, x + (Math.random() - 0.5) * tremor, cssH * (gritado ? 0.14 : 0.14) + size * (gritado ? 1.9 : 1.7))
    c.restore()
  }
}
