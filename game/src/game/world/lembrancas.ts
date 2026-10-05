import { WORLD_W, WORLD_H } from '../../engine/constants'
import { audio, sons } from '../../engine/audio'
import { ESCALA, TEMA } from '../../engine/musica'
import { Figura, VISUAL } from './figura'
import type { CorFigura } from './figura'
import { ret, sorteio, papelDeParede, assoalho, quadro, porta } from './arte'

/**
 * As lembranças que entram em Liam a cada fio tecido.
 *
 * Nenhuma é dele. Vão do presente para trás, de geração em geração: o pai, a
 * irmã, a mãe na primeira fuga, a avó, a bisavó que criou o Tear — e, por
 * último, a figura preta. Ela é a única que não passou nada para ele: cortou
 * o próprio fio para que nada chegasse.
 *
 * Cada lembrança é um quadrinho desenhado no mesmo mundo de pixels, tingido
 * de uma cor só, com grão e vinheta. O fio da última continua colorido,
 * porque é o único fio que importa nela.
 */

export interface Fala {
  texto: string
  /** Segundos desde o começo da lembrança. */
  de: number
  /** Some neste instante (sem isto, fica até a lembrança acabar). */
  ate?: number
  /** Narração: pequena, no pé do quadro, em vez de no alto. */
  baixo?: boolean
}

export interface Lembranca {
  falas: Fala[]
  /** De quem é. Aparece pequeno, embaixo. */
  dono: string
  /** Cor da lembrança inteira. */
  tom: string
  dur: number
  atualizar(dt: number, t: number): void
  desenhar(c: CanvasRenderingContext2D, t: number): void
  /** Por cima do tom: mantém a cor original. */
  sobre?(c: CanvasRenderingContext2D, t: number): void
  /**
   * Para onde a câmera vai chegando enquanto a lembrança passa (em pixels do
   * mundo), e quanto ela aproxima no fim. A ação fica grande na tela.
   */
  foco?(t: number): { x: number; y: number }
  zoom?: number
  /** Câmera dirigida plano a plano: substitui `foco` e `zoom`. */
  camera?(t: number): { x: number; y: number; z: number }
  /** Não dá para apressar: é para ver inteira. */
  semPular?: boolean
  /** A lembrança cuida da própria música: o Tear não toca a frase por cima. */
  musicaPropria?: boolean
}

const PELE = '#7a5a4e'
const cor = (roupa: string, cabelo: string, pele = PELE): CorFigura => ({
  roupa, cabelo, pele, sombra: 'rgba(0,0,0,0.45)',
})

function comodo(c: CanvasRenderingContext2D, parede: [number, number, number], chao: number): void {
  papelDeParede(c, 0, WORLD_W, 0, chao, parede, 2)
  assoalho(c, 0, WORLD_W, chao, WORLD_H, [parede[0] - 6, parede[1] - 8, parede[2] - 10])
}

export function criarLembrancas(): Lembranca[] {
  return [pratoQuebrado(), portaDoQuarto(), primeiraFuga(), avo(), amelia(), figuraPreta()]
}

/** Quando o prato sai da mão dele, e quando estoura no chão. */
const PRATO_CAI = 0.7
const PRATO_ESTOURA = 1.0

/** 1. Adrian. O prato no chão, e a frase que sempre vem depois. */
function pratoQuebrado(): Lembranca {
  const adrian = new Figura({ ...VISUAL.adrian, x: 222, y: 170, altura: 44, barba: true, gola: '#ddd', cor: cor('#2e2430', '#16100f') })
  const evelyn = new Figura({ ...VISUAL.evelyn, x: 176, y: 170, altura: 36, cabelo: 'longo', pose: 'sentado', cor: cor('#3e5664', '#2a1a16') })
  const liam = new Figura({ ...VISUAL.liam, x: 336, y: 170, altura: 22, cor: cor('#2a3044', '#12151f') })
  adrian.olhar = -1
  evelyn.olhar = 1
  evelyn.curvatura = 0.5
  liam.olhar = -1
  return {
    falas: [{ texto: 'Olha o que você me fez fazer.', de: 1.4 }],
    dono: 'Adrian',
    tom: '#b0503c',
    dur: 5.4,
    zoom: 1.32,
    foco: (t) => ({ x: 236 + Math.min(1, t / 4) * 30, y: 134 }),
    atualizar(dt, t) {
      for (const f of [adrian, evelyn, liam]) f.update(dt)
      adrian.ofego = 2.4
      // O braço sobe com o prato, e desce de uma vez.
      adrian.braco = t < PRATO_CAI ? 1 : Math.max(0, 1 - (t - PRATO_CAI) * 3)
      // Ela se encolhe e cobre o rosto quando estoura.
      const depois = t - PRATO_ESTOURA
      evelyn.tremor = depois > 0 && depois < 0.6 ? 1.4 : 0.2
      evelyn.braco = depois > 0 ? 0.9 : 0.3
      evelyn.curvatura = depois > 0 ? 0.75 : 0.5
      // O menino na porta: se esconde atrás do batente, e volta a espiar.
      liam.x = depois > 0 && depois < 1.6 ? 344 : 336
      liam.tremor = depois > 0 && depois < 2 ? 0.8 : 0
    },
    desenhar(c, t) {
      comodo(c, [52, 48, 44], 170)
      // Azulejo, bancada, a luz de cima
      for (let x = 0; x < WORLD_W; x += 9) ret(c, x, 96, 1, 74, 'rgba(0,0,0,0.12)')
      for (let y = 100; y < 130; y += 9) ret(c, 0, y, 160, 1, 'rgba(0,0,0,0.1)')
      armarioAlto(c, 44, 52, 100)
      ret(c, 40, 132, 110, 38, '#4a3a32')
      ret(c, 40, 130, 110, 3, '#6a5a50')
      for (const px of [46, 82, 118]) {
        ret(c, px, 138, 26, 28, '#42332c')
        ret(c, px + 20, 150, 2, 4, '#8a7a60')
      }
      // Escorredor com pratos em pé, e a torneira
      ret(c, 56, 118, 26, 12, 'rgba(0,0,0,0.25)')
      for (let i = 0; i < 6; i++) ret(c, 58 + i * 4, 116 - (i % 2), 2, 13, '#d8d4cc')
      ret(c, 104, 116, 2, 14, '#8a8a90')
      ret(c, 104, 116, 8, 2, '#8a8a90')
      // Janela, o relógio e a luminária que balança
      janelaPequena(c, 262, 44, 44, 40)
      relogioDeParede(c, 150, 30)
      luminariaPendente(c, 222, t)
      // A mesa, com a toalha e o copo virado
      ret(c, 120, 146, 84, 4, '#5a463a')
      ret(c, 120, 150, 84, 4, '#c8bfb0')
      for (let i = 0; i < 84; i += 6) ret(c, 120 + i, 150, 3, 4, '#9a3a34')
      ret(c, 124, 154, 3, 16, '#3a2a22')
      ret(c, 198, 154, 3, 16, '#3a2a22')
      ret(c, 160, 142, 6, 4, 'rgba(220,230,240,0.6)')
      // A cadeira dele, derrubada
      ret(c, 240, 164, 18, 3, '#3a2a22')
      ret(c, 254, 152, 3, 14, '#3a2a22')
      ret(c, 236, 160, 3, 8, '#3a2a22')
      // O prato: na mão dele, voando, e os cacos.
      if (t < PRATO_CAI) {
        ret(c, 214, 116 - Math.round(Math.sin(t * 8) * 1), 10, 3, '#ece8e0')
        ret(c, 216, 115, 6, 1, '#ffffff')
      } else if (t < PRATO_ESTOURA) {
        const p = (t - PRATO_CAI) / (PRATO_ESTOURA - PRATO_CAI)
        const px = 216 + (182 - 216) * p
        const py = 116 + (170 - 116) * p * p
        ret(c, Math.round(px), Math.round(py), 8, 3, '#ece8e0')
      } else {
        const q = t - PRATO_ESTOURA
        const r = sorteio(3)
        for (let i = 0; i < 22; i++) {
          const vx = (r() - 0.5) * 140
          const vy = -(30 + r() * 70)
          const voo = Math.min(q, 0.55)
          const x = 182 + vx * voo
          const y = Math.min(172 + r() * 8, 168 + vy * voo + 260 * voo * voo)
          ret(c, Math.round(x), Math.round(y), 1 + Math.floor(r() * 3), 1, '#ece8e0')
        }
      }
      // Batente da porta, com Liam pequeno olhando de lá
      ret(c, 318, 90, 6, 80, '#2a2220')
      evelyn.draw(c, 200)
      adrian.draw(c, 200)
      liam.draw(c, 200)
      ret(c, 344, 90, 40, 80, '#1a1614')
    },
    sobre(c, t) {
      // O estouro: um clarão curto, branco.
      const q = t - PRATO_ESTOURA
      if (q > 0 && q < 0.14) {
        c.fillStyle = `rgba(255,250,240,${(0.55 * (1 - q / 0.14)).toFixed(2)})`
        c.fillRect(0, 0, WORLD_W, WORLD_H)
      }
    },
  }
}

/** 2. Lia, pequena, gritando para uma porta fechada. */
function portaDoQuarto(): Lembranca {
  const lia = new Figura({ ...VISUAL.lia, x: 214, y: 170, altura: 26, cabelo: 'rabo', cor: cor('#6a2c38', '#1e1214') })
  const liam = new Figura({ ...VISUAL.liam, x: 108, y: 170, altura: 22, pose: 'sentado', cor: cor('#2a3044', '#12151f') })
  lia.olhar = 1
  liam.olhar = 1
  return {
    falas: [{ texto: 'Ninguém nessa casa fala a verdade!', de: 0.4 }],
    dono: 'Lia',
    tom: '#a04a6a',
    dur: 5.4,
    zoom: 1.3,
    foco: () => ({ x: 214, y: 136 }),
    atualizar(dt, t) {
      lia.update(dt)
      liam.update(dt)
      // Ela bate na porta até cansar, e escorrega até o chão.
      const cansou = t > 3.4
      lia.braco = cansou ? 0.1 : 0.5 + Math.max(0, Math.sin(t * 6)) * 0.4
      lia.tremor = cansou ? 0.3 : 0.6
      lia.pose = t > 4 ? 'sentado' : 'de-pe'
      lia.curvatura = cansou ? Math.min(0.8, (t - 3.4) * 0.8) : 0
      liam.braco = 0.9
      liam.curvatura = 0.6
    },
    desenhar(c, t) {
      comodo(c, [44, 44, 54], 170)
      ret(c, 0, 166, WORLD_W, 4, '#34343e')
      ret(c, 0, 166, WORLD_W, 1, '#4a4a56')
      // A porta treme a cada batida. Lá dentro, a luz apaga.
      const bate = t < 3.4 && Math.sin(t * 6) > 0.85 ? 1 : 0
      porta(c, 262 + bate, 170, { luz: t < 2.4, cor: [70, 60, 60], alt: 70 })
      if (t < 2.4) ret(c, 250, 169, 26, 1, 'rgba(255,230,170,0.7)')
      quadro(c, 140, 50, 26, 20, { figuras: 4 })
      quadro(c, 176, 58, 16, 14, { figuras: 2 })
      quadro(c, 86, 62, 14, 18, { figuras: 1 })
      arandela(c, 216, 70)
      // Passadeira, mesinha com o telefone e um ursinho largado
      ret(c, 20, 176, 300, 10, '#3a2e34')
      for (let x = 22; x < 318; x += 8) ret(c, x, 180, 3, 2, '#4a3a42')
      ret(c, 24, 140, 30, 4, '#4a3a34')
      ret(c, 28, 144, 3, 26, '#3a2a26')
      ret(c, 48, 144, 3, 26, '#3a2a26')
      ret(c, 32, 134, 12, 6, '#2a2a30')
      ret(c, 34, 132, 8, 2, '#3a3a42')
      ret(c, 140, 164, 7, 6, '#7a5a44')
      ret(c, 141, 161, 5, 4, '#7a5a44')
      ret(c, 140, 160, 2, 2, '#7a5a44')
      ret(c, 145, 160, 2, 2, '#7a5a44')
      lia.draw(c, 262)
      liam.draw(c, 262)
    },
  }
}

/** 3. Evelyn, anos antes, fugindo de outra casa com uma menina pela mão. */
function primeiraFuga(): Lembranca {
  const evelyn = new Figura({ x: 176, y: 176, altura: 38, cabelo: 'longo', estilo: 'casaco', olheiras: true, cor: cor('#4a3e4a', '#2a1a16') })
  const menina = new Figura({ x: 160, y: 176, altura: 20, cabelo: 'longo', cor: cor('#2a2230', '#140e10', '#2a2230') })
  menina.costas = true
  evelyn.olhar = -0.5
  evelyn.costas = false
  return {
    falas: [{ texto: 'Da outra vez eu também saí à noite.', de: 0.5 }],
    dono: 'Evelyn',
    tom: '#4a6ab0',
    dur: 5.6,
    zoom: 1.28,
    foco: (t) => ({ x: 186 - t * 10, y: 140 }),
    atualizar(dt, t) {
      // As duas andando na chuva, sem olhar para trás. Ela olha uma vez.
      evelyn.x = 186 - t * 10
      menina.x = evelyn.x - 16
      evelyn.andando = 0.7
      menina.andando = 0.9
      evelyn.olhar = t > 2.6 && t < 3.6 ? 1 : -0.5
      evelyn.update(dt)
      menina.update(dt)
      evelyn.braco = 0.2
    },
    desenhar(c, t) {
      ret(c, 0, 0, WORLD_W, WORLD_H, '#101420')
      // A casa de onde elas saíram, lá atrás, com uma janela laranja demais
      ret(c, 262, 70, 90, 106, '#0a0c14')
      c.fillStyle = '#0a0c14'
      c.beginPath()
      c.moveTo(256, 72)
      c.lineTo(307, 38)
      c.lineTo(358, 72)
      c.fill()
      const fogo = 0.5 + Math.sin(t * 9) * 0.2 + Math.sin(t * 23) * 0.1
      ret(c, 284, 96, 12, 14, `rgba(255,140,60,${fogo})`)
      ret(c, 318, 96, 12, 14, 'rgba(60,60,80,0.8)')
      // Casas do outro lado, longe, com uma janela acesa ou outra
      for (const [hx, hw, hh] of [[0, 60, 46], [64, 50, 38], [120, 70, 52], [366, 40, 44]] as const) {
        ret(c, hx, 176 - hh - 30, hw, hh, '#0c0e18')
        ret(c, hx + Math.round(hw / 3), 176 - hh - 18, 5, 5, 'rgba(230,200,140,0.35)')
      }
      // Árvore e cerca baixa
      ret(c, 226, 92, 4, 84, '#0a0c14')
      for (const [dx, dy, r] of [[-12, -6, 16], [6, -12, 14], [16, 2, 12], [-4, 8, 12]] as const) {
        c.fillStyle = '#0a0c16'
        c.beginPath()
        c.arc(228 + dx, 92 + dy, r, 0, Math.PI * 2)
        c.fill()
      }
      for (let x = 0; x < 250; x += 6) ret(c, x, 156, 2, 20, '#141824')
      ret(c, 0, 160, 250, 2, '#141824')
      // Um carro parado, sem ninguém
      ret(c, 18, 156, 58, 14, '#151a26')
      ret(c, 30, 146, 34, 11, '#151a26')
      ret(c, 34, 148, 12, 7, 'rgba(120,140,170,0.25)')
      ret(c, 48, 148, 12, 7, 'rgba(120,140,170,0.25)')
      for (const rx of [28, 64]) {
        c.fillStyle = '#05060a'
        c.beginPath()
        c.arc(rx, 170, 5, 0, Math.PI * 2)
        c.fill()
      }
      // Calçada e poste
      ret(c, 0, 176, WORLD_W, 40, '#1a1c26')
      ret(c, 0, 176, WORLD_W, 1, '#2a2e3a')
      ret(c, 0, 184, WORLD_W, 1, '#22252f')
      // Poças refletindo o poste
      for (const [px, pw] of [[70, 40], [150, 26], [300, 50]] as const) {
        ret(c, px, 192, pw, 3, 'rgba(160,180,220,0.18)')
        ret(c, px + 6, 193, pw - 12, 1, 'rgba(255,220,160,0.25)')
      }
      ret(c, 92, 60, 3, 116, '#2a2e38')
      ret(c, 86, 58, 14, 4, '#3a3e4a')
      const luz = c.createRadialGradient(93, 64, 2, 93, 140, 90)
      luz.addColorStop(0, 'rgba(255,220,160,0.3)')
      luz.addColorStop(1, 'rgba(255,220,160,0)')
      c.fillStyle = luz
      c.fillRect(0, 50, 200, 140)
      // Placa de ponto de ônibus
      ret(c, 132, 110, 2, 66, '#3a3e4a')
      ret(c, 126, 104, 14, 8, '#4a5a7a')
      // A mala, puxada pela outra mão
      const mx = Math.round(evelyn.x + 9)
      ret(c, mx, 162, 12, 14, '#3a2e2a')
      ret(c, mx + 4, 159, 4, 3, '#5a4a44')
      ret(c, mx + 2, 176, 2, 1, '#05060a')
      ret(c, mx + 8, 176, 2, 1, '#05060a')
      evelyn.draw(c, 93)
      menina.draw(c, 93)
      // Mãos dadas
      ret(c, Math.round(menina.x + 3), 160, Math.round(evelyn.x - menina.x - 7), 1, PELE)
      // Um carro passa: o farol varre a rua e as duas por um instante.
      if (t > 3 && t < 4.6) {
        const fx = WORLD_W + 40 - (t - 3) * 300
        const g = c.createRadialGradient(fx, 168, 2, fx, 168, 70)
        g.addColorStop(0, 'rgba(255,245,220,0.45)')
        g.addColorStop(1, 'rgba(255,245,220,0)')
        c.fillStyle = g
        c.fillRect(fx - 70, 98, 140, 118)
      }
      // Chuva
      const r = sorteio(8)
      for (let i = 0; i < 70; i++) {
        const x = Math.floor(r() * WORLD_W)
        const v = 60 + r() * 50
        const y = (r() * WORLD_H + t * v) % WORLD_H
        ret(c, x, y, 1, 4, 'rgba(180,200,240,0.3)')
      }
    },
    sobre(c, t) {
      // A janela da casa de onde elas fugiram é a única cor: laranja de fogo.
      const fogo = 0.55 + Math.sin(t * 9) * 0.2 + Math.sin(t * 23) * 0.1
      ret(c, 284, 96, 12, 14, `rgba(255,130,50,${fogo})`)
      const g = c.createRadialGradient(290, 103, 1, 290, 103, 22)
      g.addColorStop(0, `rgba(255,140,60,${fogo * 0.35})`)
      g.addColorStop(1, 'rgba(255,140,60,0)')
      c.fillStyle = g
      c.fillRect(268, 81, 44, 44)
    },
  }
}

/** 4. Helena, a avó, endireitando o retrato. Adrian menino, ao lado. */
function avo(): Lembranca {
  const helena = new Figura({ x: 182, y: 172, altura: 36, cabelo: 'longo', estilo: 'casaco', cor: cor('#4a4048', '#a8a4a0') })
  const menino = new Figura({ x: 232, y: 172, altura: 24, estilo: 'camisa', gola: '#ddd', cor: cor('#3a3440', '#16100f') })
  helena.costas = true
  menino.olhar = -1
  return {
    falas: [
      { texto: 'Família não se separa.', de: 0.4 },
      { texto: 'Aguenta.', de: 2.6 },
    ],
    dono: 'Helena, avó',
    tom: '#a88a50',
    dur: 5.6,
    zoom: 1.34,
    foco: () => ({ x: 200, y: 104 }),
    atualizar(dt, t) {
      helena.update(dt)
      menino.update(dt)
      helena.braco = t < 3 ? Math.min(0.9, t * 0.6) : Math.max(0, 0.9 - (t - 3) * 1.5)
      helena.curvatura = 0.15
      // O menino olha para ela; no "Aguenta.", baixa a cabeça.
      menino.curvatura = t > 2.6 ? Math.min(0.5, (t - 2.6) * 0.6) : 0
      menino.olhar = -1
      // Ela se vira para ele depois de endireitar.
      helena.costas = t < 3.2
      helena.olhar = 1
    },
    desenhar(c, t) {
      comodo(c, [58, 50, 44], 172)
      ret(c, 0, 116, WORLD_W, 2, 'rgba(255,240,220,0.08)')
      quadro(c, 110, 40, 24, 20, { figuras: 3 })
      quadro(c, 250, 44, 20, 16, { figuras: 2 })
      // Relógio carrilhão, com o pêndulo indo e voltando
      ret(c, 46, 70, 22, 102, '#3a2a22')
      ret(c, 44, 66, 26, 6, '#4a3628')
      c.fillStyle = '#d8ccb0'
      c.beginPath()
      c.arc(57, 84, 7, 0, Math.PI * 2)
      c.fill()
      ret(c, 57, 79, 1, 5, '#1a1410')
      ret(c, 57, 84, 4, 1, '#1a1410')
      ret(c, 50, 98, 14, 50, '#24180f')
      const pend = Math.round(Math.sin(t * 2.6) * 4)
      ret(c, 57 + pend, 98, 1, 30, '#a88a4a')
      ret(c, 55 + pend, 127, 5, 5, '#c8a85a')
      // Janela de renda e o sofá antigo, com paninho de crochê no encosto
      ret(c, 300, 30, 50, 60, '#2a2830')
      for (let y = 32; y < 88; y += 4) for (let x = 302; x < 348; x += 4) ret(c, x + ((y / 4) % 2) * 2, y, 1, 1, 'rgba(255,250,240,0.25)')
      ret(c, 296, 28, 58, 3, '#4a3628')
      ret(c, 270, 130, 100, 30, '#4a3a3a')
      ret(c, 266, 122, 10, 42, '#544242')
      ret(c, 364, 122, 10, 42, '#544242')
      ret(c, 300, 124, 16, 8, '#d8d0c0')
      ret(c, 330, 124, 16, 8, '#d8d0c0')
      // Mesinha com o vaso e um tapete oval
      ret(c, 100, 150, 30, 3, '#4a3628')
      ret(c, 112, 153, 4, 19, '#3a2a22')
      ret(c, 108, 138, 10, 12, '#6a6a7a')
      for (const [dx, h] of [[0, 8], [3, 10], [6, 7]] as const) ret(c, 109 + dx, 138 - h, 1, h, '#4a5a3a')
      c.fillStyle = 'rgba(120,80,60,0.35)'
      c.beginPath()
      c.ellipse(200, 190, 90, 12, 0, 0, Math.PI * 2)
      c.fill()
      // O retrato grande, que ela endireita devagar
      const ang = Math.max(0, 0.16 - t * 0.05)
      c.save()
      c.translate(184, 62)
      c.rotate(ang)
      quadro(c, -20, -16, 40, 30, { figuras: 5 })
      c.restore()
      helena.draw(c, 184)
      menino.draw(c, 184)
    },
  }
}

/** 5. Amélia, à luz de vela, no mesmo tear. O caderno aberto na mesa. */
function amelia(): Lembranca {
  const ela = new Figura({ x: 204, y: 172, altura: 34, cabelo: 'longo', pose: 'sentado', cor: cor('#3a3440', '#3a2e2a') })
  ela.olhar = 1
  return {
    falas: [
      { texto: 'Toda paz que lhes dei', de: 0.4 },
      { texto: 'acordou dentro de mim.', de: 2.2 },
    ],
    dono: 'caderno de Amélia',
    tom: '#8a7048',
    dur: 6,
    zoom: 1.3,
    foco: () => ({ x: 236, y: 112 }),
    atualizar(dt, t) {
      ela.update(dt)
      ela.braco = 0.55 + Math.max(0, Math.sin(t * 3)) * 0.25
      ela.curvatura = 0.25
    },
    desenhar(c, t) {
      ret(c, 0, 0, WORLD_W, WORLD_H, '#0e0c0c')
      // Paredes de pedra, vigas do teto e a janelinha lá no alto
      const pedra = sorteio(17)
      for (let y = 20; y < 172; y += 9) {
        for (let x = (y % 18 === 2 ? 0 : -8); x < WORLD_W; x += 16) {
          ret(c, x, y, 15, 8, `rgba(60,48,40,${0.25 + pedra() * 0.2})`)
        }
      }
      for (const vx of [0, 96, 192, 288]) ret(c, vx, 0, 96, 14, '#1c1410')
      for (const vx of [0, 96, 192, 288]) ret(c, vx + 92, 0, 4, 18, '#140e0a')
      ret(c, 160, 26, 30, 14, '#1a2230')
      ret(c, 174, 26, 2, 14, '#0e0c0c')
      ret(c, 158, 40, 34, 2, '#2a2018')
      // Teia no canto
      c.strokeStyle = 'rgba(200,190,170,0.18)'
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(0, 30)
      c.quadraticCurveTo(14, 18, 30, 14)
      c.moveTo(0, 22)
      c.lineTo(22, 14)
      c.moveTo(6, 28)
      c.lineTo(12, 14)
      c.stroke()
      // Prateleiras com novelos e carretéis
      ret(c, 12, 70, 56, 3, '#3a2a1e')
      ret(c, 12, 100, 56, 3, '#3a2a1e')
      for (let i = 0; i < 6; i++) {
        c.fillStyle = ['#6a4a5a', '#4a5a6a', '#7a6a4a', '#5a6a4a', '#6a4a3a', '#4a4a6a'][i] ?? '#555'
        c.beginPath()
        c.arc(18 + i * 9, 65, 4, 0, Math.PI * 2)
        c.fill()
      }
      for (let i = 0; i < 7; i++) {
        ret(c, 16 + i * 7, 90, 5, 10, '#5a4030')
        ret(c, 16 + i * 7, 92, 5, 6, ['#8a5a5a', '#5a7a8a', '#8a8a5a', '#6a8a6a'][i % 4] ?? '#777')
      }
      // Cesto de lã crua e a cadeira com o xale
      ret(c, 334, 154, 30, 18, '#4a3a28')
      for (let i = 0; i < 30; i += 4) ret(c, 334 + i, 154, 1, 18, '#3a2c1e')
      c.fillStyle = '#c8bca8'
      c.beginPath()
      c.ellipse(349, 152, 16, 6, 0, Math.PI, 0)
      c.fill()
      ret(c, 150, 120, 3, 52, '#3a2a1e')
      ret(c, 150, 146, 24, 3, '#3a2a1e')
      ret(c, 171, 146, 3, 26, '#3a2a1e')
      ret(c, 150, 118, 10, 22, '#5a3a4a')
      ret(c, 0, 172, WORLD_W, 44, '#16120e')
      // O tear, pequeno e novo
      ret(c, 214, 60, 5, 112, '#5a3e2c')
      ret(c, 312, 60, 5, 112, '#5a3e2c')
      ret(c, 210, 60, 112, 6, '#6a4a34')
      ret(c, 214, 140, 102, 6, '#6a4a34')
      for (let x = 222; x < 312; x += 3) ret(c, x, 66, 1, 74, 'rgba(220,200,170,0.4)')
      // O tecido sobe enquanto ela tece; a lançadeira vai e volta.
      const topoPano = Math.round(116 - Math.min(22, t * 4))
      for (let y = topoPano; y < 140; y += 2) ret(c, 222, y, 90, 2, (y / 2) % 2 ? '#5a3a44' : '#4a3a5a')
      const vai = (t * 0.9) % 2
      const lx = 222 + Math.round((vai < 1 ? vai : 2 - vai) * 80)
      ret(c, lx, topoPano - 3, 10, 3, '#8a6a44')
      ret(c, lx + 2, topoPano - 3, 6, 1, '#b8945a')
      // O fio correndo da lançadeira até a borda do pano.
      ret(c, Math.min(lx, 222), topoPano - 2, Math.abs(lx - 222), 1, 'rgba(200,160,170,0.6)')
      // Mesa, vela e o caderno aberto
      ret(c, 80, 140, 60, 4, '#4a3426')
      ret(c, 86, 144, 3, 28, '#3a2a1e')
      ret(c, 132, 144, 3, 28, '#3a2a1e')
      ret(c, 96, 136, 22, 4, '#d8ccb0')
      ret(c, 107, 136, 1, 4, '#8a7a60')
      ret(c, 124, 128, 3, 12, '#e4dcc4')
      // Cera escorrida
      ret(c, 123, 137, 1, 3, '#e4dcc4')
      ret(c, 127, 134, 1, 5, '#e4dcc4')
      ret(c, 121, 139, 8, 1, '#c8bca0')
      const f = Math.sin(t * 13) > 0 ? 1 : 0
      ret(c, 125, 124 - f, 1, 4, '#ffd28a')
      const luz = c.createRadialGradient(125, 124, 2, 125, 124, 120)
      luz.addColorStop(0, 'rgba(255,200,130,0.35)')
      luz.addColorStop(1, 'rgba(255,200,130,0)')
      c.fillStyle = luz
      c.fillRect(0, 0, WORLD_W, WORLD_H)
      ela.draw(c, 125)
    },
  }
}

/**
 * 6. A figura preta. A lembrança que importa, e a única que não é curta.
 *
 * O quarto de Liam quando ele era pequeno, de noite. A porta abre devagar e
 * alguém entra contra a luz do corredor — lá fora, as sombras dos pais
 * discutindo. Ela atravessa o quarto, ajoelha do lado da cama e o fio lilás
 * aparece entre os dois, batendo junto com o coração dele. Ela pega a
 * tesoura. A câmera fecha no fio. Ela corta. A ponta dela vira faísca e
 * sobe; a dele volta para o peito e apaga. Ela vai embora se desfazendo, e
 * a quinta pessoa some do desenho na parede. A porta fecha. De manhã,
 * alguém põe cinco pratos na mesa.
 *
 * Não dá para pular na primeira vez. É a cena mais importante da demo.
 */

/** Quando cada coisa acontece, em segundos. */
const F = {
  porta: 3.0,
  entra: 4.4,
  anda: 7.4,
  ajoelha: 10.2,
  fio: 10.6,
  mao: 12.0,
  tesoura: 14.6,
  corte: 18.0,
  levanta: 20.4,
  sai: 21.4,
  fecha: 24.2,
  fim: 30,
}
const PORTA_X = 274
/** Onde ela ajoelha: do lado da cabeceira, perto do rosto dele. */
const CAMA_X = 176
const PEITO_LIAM = { x: 138, y: 145 }
const PEITO_ELA = { x: 173, y: 156 }
/** A mão no cabelo dele, e depois com a tesoura no meio do fio. */
const MAO_CABELO = { x: 152, y: 136 }
const MAO_CORTE = { x: 158, y: 150 }

/**
 * Ela ajoelhada, de perfil para a esquerda: cabeça, o cabelo comprido
 * caindo nas costas, o tronco inclinado para ele, os joelhos no chão e o
 * braço indo até `mao`. `k` vai de 0 (em pé) a 1 (ajoelhada).
 */
function ajoelhada(c: CanvasRenderingContext2D, bx: number, k: number, mao: { x: number; y: number } | null): void {
  const chao = 172
  const H = 40 * (1 - 0.34 * k)
  const topo = chao - H
  const inclina = 3 * k
  const cx = bx - inclina
  c.fillStyle = '#020203'
  // Cabeça
  c.beginPath()
  c.arc(cx, topo + 4.5, 4.3, 0, Math.PI * 2)
  c.fill()
  // O cabelo comprido, caindo pelas costas
  c.beginPath()
  c.moveTo(cx - 1, topo + 0.5)
  c.quadraticCurveTo(cx + 6, topo + 2, cx + 6, topo + 16)
  c.lineTo(cx + 2, topo + 17)
  c.lineTo(cx + 1, topo + 7)
  c.fill()
  // Pescoço, e o tronco: ombros, cintura, inclinado para ele
  c.fillRect(Math.round(cx - 1), Math.round(topo + 8), 2, 3)
  const ombro = topo + 10.5
  const quadril = topo + 10.5 + 13 * (1 - 0.15 * k)
  c.beginPath()
  c.moveTo(cx - 4, ombro)
  c.lineTo(cx + 4, ombro)
  c.lineTo(bx + 4, quadril)
  c.lineTo(bx - 4, quadril)
  c.closePath()
  c.fill()
  // Pernas: em pé, retas; ajoelhada, a coxa para a frente e a canela para trás.
  if (k < 0.5) {
    c.fillRect(Math.round(bx - 3), Math.round(quadril), 3, Math.round(chao - quadril))
    c.fillRect(Math.round(bx + 1), Math.round(quadril), 3, Math.round(chao - quadril))
  } else {
    c.beginPath()
    c.moveTo(bx - 4, quadril - 1)
    c.lineTo(bx + 4, quadril - 1)
    c.lineTo(bx - 2, chao - 3)
    c.lineTo(bx - 9, chao - 3)
    c.closePath()
    c.fill()
    c.fillRect(Math.round(bx - 9), chao - 3, 18, 3)
  }
  // O braço até onde a mão estiver
  const sx = cx - 2
  const sy = ombro + 1
  const hx = mao ? mao.x : bx - 2
  const hy = mao ? mao.y : quadril - 2
  c.strokeStyle = '#020203'
  c.lineWidth = 2.2
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(sx, sy)
  c.quadraticCurveTo((sx + hx) / 2 + 1, Math.max(sy, hy) + 2, hx, hy)
  c.stroke()
  c.lineCap = 'butt'
}

/** Suave entre 0 e 1. */
function suave(a: number, b: number, t: number): number {
  const p = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return p * p * (3 - 2 * p)
}

function figuraPreta(): Lembranca {
  const ela = new Figura({ x: PORTA_X, y: 172, altura: 40, cabelo: 'longo', cor: cor('#000', '#000') })
  ela.silhueta = true
  ela.olhar = -1
  const menino = new Figura({ ...VISUAL.liam, x: 132, y: 150, altura: 18, cor: cor('#2a3044', '#12151f') })
  // As faíscas da ponta dela, subindo depois do corte
  const faiscas: { x: number; y: number; vx: number; vy: number; vida: number }[] = []
  // O pó dela, quando vai embora
  const po: { x: number; y: number; vx: number; vy: number; vida: number }[] = []
  let antes = 0
  const passou = (t: number, em: number) => antes < em && t >= em
  const melodia = [...(TEMA[0] ?? []), ...(TEMA[1] ?? [])].map((g) => ESCALA[g] ?? 220)

  return {
    falas: [
      { texto: 'Eles brigam de novo. E você ouve tudo, até dormindo.', de: 6.2, ate: 10.2 },
      { texto: 'Se eu ficar, é você que carrega.', de: 10.8, ate: 14.2 },
      { texto: 'Você não vai lembrar de mim. É melhor assim.', de: 14.4, ate: 17.4 },
      { texto: 'Então eu corto.', de: 17.5, ate: 20.6 },
      { texto: 'Na manhã seguinte, alguém pôs cinco pratos na mesa.', de: 25.0, baixo: true },
      { texto: 'Ninguém soube dizer por quê.', de: 26.8, baixo: true },
    ],
    dono: '',
    tom: '#303848',
    dur: F.fim,
    semPular: true,
    musicaPropria: true,
    camera(t) {
      // Plano aberto → segue ela até a cama → fecha no fio → abre de novo.
      const aberto = { x: 210, y: 118, z: 1.0 }
      const cama = { x: 196, y: 132, z: 1.45 }
      const fio = { x: 156, y: 146, z: 2.6 }
      const fimP = { x: 214, y: 120, z: 1.1 }
      const mistura = (a: typeof aberto, b: typeof aberto, k: number) => ({
        x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k,
      })
      if (t < F.anda) return mistura(aberto, { x: 236, y: 124, z: 1.18 }, suave(F.porta, F.anda, t))
      if (t < F.tesoura) return mistura({ x: 236, y: 124, z: 1.18 }, cama, suave(F.anda, F.ajoelha + 0.6, t))
      if (t < F.corte + 0.6) return mistura(cama, fio, suave(F.tesoura, F.corte - 0.6, t))
      if (t < F.sai) return mistura(fio, cama, suave(F.corte + 0.8, F.levanta + 0.4, t))
      return mistura(cama, fimP, suave(F.sai, F.fecha + 1, t))
    },
    atualizar(dt, t) {
      ela.update(dt)
      menino.update(dt)
      // Os sons, cada um no seu instante.
      if (passou(t, 0.2)) sons.caixinha(melodia, 0.62)
      if (passou(t, F.porta)) sons.porta()
      if (passou(t, F.fio)) audio.heartbeat(0.12)
      if (t > F.fio && t < F.corte && Math.floor(t * 0.9) !== Math.floor(antes * 0.9)) audio.heartbeat(0.08 + suave(F.tesoura, F.corte, t) * 0.1)
      if (passou(t, F.tesoura)) audio.interact()
      if (passou(t, F.corte)) {
        sons.estalo()
        audio.reveal()
        for (let i = 0; i < 26; i++) {
          faiscas.push({ x: MAO_CORTE.x + 2, y: MAO_CORTE.y + 1, vx: (Math.random() - 0.3) * 14, vy: -8 - Math.random() * 22, vida: 1.6 + Math.random() * 1.6 })
        }
      }
      if (passou(t, F.fecha)) sons.porta()
      antes = t

      // Ela: aparece na porta, anda até a cama, ajoelha, levanta, vai embora.
      ela.costas = false
      if (t < F.anda) {
        ela.x = PORTA_X
        ela.andando = 0
        ela.olhar = -1
      } else if (t < F.ajoelha) {
        const p = suave(F.anda, F.ajoelha, t)
        ela.x = PORTA_X + (CAMA_X - PORTA_X) * p
        ela.andando = 0.6
        ela.olhar = -1
      } else if (t < F.levanta) {
        ela.x = CAMA_X
        ela.andando = 0
      } else {
        const p = suave(F.sai, F.fecha - 0.4, t)
        ela.x = CAMA_X + (PORTA_X + 8 - CAMA_X) * p
        ela.andando = t > F.sai && t < F.fecha - 0.4 ? 0.5 : 0
        ela.olhar = t > F.sai ? 1 : -1
        // Na porta, ela olha para trás uma vez.
        if (t > F.fecha - 1.4 && t < F.fecha - 0.4) ela.olhar = -1
      }
      // A mão no cabelo dele; depois a tesoura.
      ela.braco = t > F.mao && t < F.tesoura ? 0.85 : t >= F.tesoura && t < F.corte + 0.6 ? 0.7 : 0
      // Ele se mexe quando ela encosta, e não acorda.
      menino.tremor = t > F.mao + 0.4 && t < F.mao + 1.2 ? 0.6 : 0

      for (const f of faiscas) {
        f.x += f.vx * dt
        f.y += f.vy * dt
        f.vy -= 4 * dt
        f.vida -= dt
      }
      // O pó dela, enquanto vai embora
      if (t > F.sai && t < F.fecha && Math.random() < dt * 40) {
        po.push({
          x: ela.x + (Math.random() - 0.5) * 8, y: 172 - Math.random() * 40,
          vx: 4 + Math.random() * 8, vy: -4 - Math.random() * 8, vida: 1.4 + Math.random(),
        })
      }
      for (const p of po) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vida -= dt
      }
    },
    desenhar(c, t) {
      comodo(c, [26, 30, 44], 172)
      // Rodapé e um friso de estrelinhas pintadas a esponja
      ret(c, 0, 168, WORLD_W, 4, '#1c2030')
      for (let x = 6; x < WORLD_W; x += 18) ret(c, x, 100 + ((x / 18) % 2) * 3, 1, 1, 'rgba(230,226,170,0.35)')
      // A janela com a lua e a chuva escorrendo
      ret(c, 34, 36, 46, 42, '#0a1020')
      ret(c, 60, 44, 9, 9, '#c8ccd8')
      ret(c, 63, 44, 6, 6, '#0a1020')
      ret(c, 56, 36, 2, 42, '#1a1e2a')
      ret(c, 34, 56, 46, 2, '#1a1e2a')
      ret(c, 30, 78, 54, 3, '#2a2e3e')
      const chuva = sorteio(5)
      for (let i = 0; i < 12; i++) {
        const gx = 35 + Math.floor(chuva() * 44)
        const gy = 37 + ((chuva() * 40 + t * (8 + chuva() * 10)) % 40)
        ret(c, gx, Math.round(gy), 1, 2, 'rgba(170,190,230,0.45)')
      }
      // Os desenhos dele na parede. No do meio, a família de palito: cinco.
      for (const [dx, dy] of [[100, 50], [150, 56]] as const) {
        ret(c, dx, dy, 15, 12, '#c8c4b8')
        ret(c, dx + 3, dy + 5, 5, 5, '#4a6a9a')
        ret(c, dx + 2, dy + 4, 7, 1, '#9a4a4a')
        ret(c, dx + 10, dy + 7, 3, 3, '#4a8a4a')
      }
      ret(c, 120, 42, 24, 16, '#d4d0c4')
      ret(c, 121, 42, 3, 1, 'rgba(230,220,180,0.7)')
      ret(c, 140, 42, 3, 1, 'rgba(230,220,180,0.7)')
      const somindo = 1 - suave(F.sai, F.fecha, t)
      const bonecos = ['#2a2a40', '#c87a4a', '#2a2a40', '#c8505a', '#8a5ac8']
      bonecos.forEach((cr, i) => {
        c.save()
        if (i === 4) c.globalAlpha = somindo
        ret(c, 124 + i * 4, 48, 1, 7, cr)
        ret(c, 123 + i * 4, 46, 3, 2, cr)
        c.restore()
      })
      // A mão do quinto bonequinho segurando a do menor
      if (somindo > 0.05) ret(c, 137, 50, 3, 1, `rgba(138,90,200,${somindo})`)
      // Prateleira: o coelho, um porta-retrato com cinco
      ret(c, 186, 92, 44, 3, '#3a2e2a')
      ret(c, 194, 82, 8, 10, '#a89494')
      ret(c, 195, 76, 2, 6, '#a89494')
      ret(c, 199, 77, 2, 5, '#a89494')
      ret(c, 196, 85, 1, 1, '#141014')
      ret(c, 199, 85, 1, 1, '#141014')
      quadro(c, 208, 80, 16, 12, { figuras: somindo > 0.5 ? 5 : 4, ...(somindo > 0.5 ? {} : { vazios: [4] }) })
      // Cômoda baixa e a luz de tomada em forma de estrela
      ret(c, 186, 130, 46, 42, '#2a2a3a')
      for (const yy of [136, 148, 160]) {
        ret(c, 190, yy, 38, 9, '#323246')
        ret(c, 207, yy + 4, 4, 1, '#8a8aa0')
      }
      ret(c, 238, 152, 4, 4, 'rgba(255,230,150,0.8)')
      ret(c, 239, 151, 2, 6, 'rgba(255,230,150,0.6)')
      const estrela = c.createRadialGradient(240, 154, 1, 240, 154, 26)
      estrela.addColorStop(0, 'rgba(255,230,150,0.22)')
      estrela.addColorStop(1, 'rgba(255,230,150,0)')
      c.fillStyle = estrela
      c.fillRect(214, 128, 52, 52)
      // Brinquedos no chão
      ret(c, 160, 178, 6, 6, '#7a4a4a')
      ret(c, 166, 180, 6, 4, '#4a6a7a')
      ret(c, 162, 174, 5, 4, '#8a7a4a')
      ret(c, 46, 180, 14, 5, '#5a5a7a')
      ret(c, 48, 177, 8, 3, '#5a5a7a')
      ret(c, 48, 185, 3, 2, '#141414')
      ret(c, 56, 185, 3, 2, '#141414')

      // A porta: fechada com a luz por baixo, abre, fecha de novo.
      const abre = suave(F.porta, F.entra + 0.6, t) * (1 - suave(F.fecha, F.fecha + 1.6, t))
      const vaoW = 44
      // O vão de luz: o corredor e, nele, as sombras dos pais.
      const luzW = Math.round(vaoW * abre)
      if (luzW > 0) {
        ret(c, PORTA_X - 22, 88, luzW, 84, '#d8c8a0')
        // As sombras discutindo na parede do corredor
        const briga = t > F.entra && t < F.corte
        if (briga) {
          c.save()
          c.beginPath()
          c.rect(PORTA_X - 22, 88, luzW, 84)
          c.clip()
          const a1 = PORTA_X - 14 + Math.sin(t * 1.1) * 3
          const a2 = PORTA_X + 6 + Math.sin(t * 0.8 + 1) * 4
          c.fillStyle = 'rgba(70,58,44,0.5)'
          c.fillRect(Math.round(a1), 104, 6, 46)
          c.fillRect(Math.round(a1) + 1, 98, 4, 6)
          c.fillStyle = 'rgba(60,48,36,0.6)'
          c.fillRect(Math.round(a2), 100, 8, 52)
          c.fillRect(Math.round(a2) + 2, 93, 5, 7)
          if (Math.sin(t * 2.2) > 0.6) c.fillRect(Math.round(a2) - 5, 100, 6, 2)
          c.restore()
        }
        const luz = c.createRadialGradient(PORTA_X, 140, 4, PORTA_X, 140, 130)
        luz.addColorStop(0, `rgba(255,230,180,${0.32 * abre})`)
        luz.addColorStop(1, 'rgba(255,230,180,0)')
        c.fillStyle = luz
        c.fillRect(120, 30, 264, 186)
        // A luz no chão, um triângulo que abre e fecha junto com a porta
        c.fillStyle = `rgba(255,230,180,${0.14 * abre})`
        c.beginPath()
        c.moveTo(PORTA_X - 22, 172)
        c.lineTo(PORTA_X - 22 + luzW, 172)
        c.lineTo(PORTA_X - 60 + luzW * 0.4, 216)
        c.lineTo(PORTA_X - 120 - abre * 40, 216)
        c.fill()
      }
      // A folha da porta, abrindo para dentro (encurta), e o batente
      const folhaW = Math.max(4, Math.round(vaoW * (1 - abre)))
      ret(c, PORTA_X - 22 + luzW, 88, folhaW, 84, '#2a2a36')
      ret(c, PORTA_X - 22 + luzW, 88, 1, 84, '#3a3a4a')
      if (abre < 0.1) ret(c, PORTA_X - 22, 171, vaoW, 1, 'rgba(255,230,170,0.75)')
      ret(c, PORTA_X - 26, 84, 4, 88, '#14161e')
      ret(c, PORTA_X + 22, 84, 4, 88, '#14161e')
      ret(c, PORTA_X - 26, 84, 52, 4, '#14161e')

      // A cama e o menino dormindo, encolhido
      ret(c, 70, 146, 96, 26, '#2a3048')
      ret(c, 70, 142, 96, 6, '#3a4260')
      ret(c, 66, 128, 4, 44, '#22283c')
      ret(c, 166, 136, 4, 36, '#22283c')
      // O travesseiro, e a cabeça dele em cima, de lado, com a luz da porta no rosto
      ret(c, 142, 135, 21, 9, '#d8d0c0')
      ret(c, 142, 135, 21, 1, '#ece6da')
      const mexe = menino.tremor > 0 ? Math.round(Math.sin(t * 24)) : 0
      ret(c, 147 + mexe, 135, 9, 7, '#8a6e62')
      ret(c, 146 + mexe, 133, 11, 3, '#12151f')
      ret(c, 146 + mexe, 135, 2, 4, '#12151f')
      ret(c, 149 + mexe, 139, 2, 1, '#3a2a28')
      ret(c, 152 + mexe, 140, 2, 1, '#5a4040')
      // O cobertor, encolhido por cima dele
      c.fillStyle = '#3a4260'
      c.beginPath()
      c.ellipse(118, 143, 30, 8, 0, Math.PI, 0)
      c.fill()
      ret(c, 140, 140, 10, 6, '#3a4260')
      // Um ursinho caído da cama
      ret(c, 84, 166, 6, 6, '#7a5a44')
      ret(c, 85, 164, 4, 3, '#7a5a44')

      // Ela, contra a luz. Ajoelhada do lado dele; indo embora, se desfaz.
      if (t > F.entra) {
        c.save()
        const entra = suave(F.entra, F.entra + 1.2, t)
        const desfaz = 1 - suave(F.sai, F.fecha - 0.2, t)
        c.globalAlpha = entra * desfaz
        const desce = suave(F.ajoelha, F.ajoelha + 0.7, t) * (1 - suave(F.levanta, F.levanta + 0.7, t))
        if (desce > 0.02) {
          const mao = t > F.mao && t < F.tesoura - 0.3
            ? MAO_CABELO
            : t >= F.tesoura - 0.3 && t < F.corte + 0.5 ? MAO_CORTE : null
          ajoelhada(c, ela.x, desce, desce > 0.6 ? mao : null)
        } else {
          ela.y = 172
          ela.draw(c, 400, 'rgba(0,0,0,0)')
        }
        c.restore()
      }
      for (const p of po) {
        if (p.vida <= 0) continue
        ret(c, Math.round(p.x), Math.round(p.y), 1, 1, `rgba(8,8,12,${Math.min(0.9, p.vida)})`)
      }
    },
    sobre(c, t) {
      // Os outros fios dele, finos e cinzentos, saindo pela porta: o pai, a mãe, a Lia.
      const abre = suave(F.porta, F.entra + 0.6, t) * (1 - suave(F.fecha, F.fecha + 1.6, t))
      const aparece = suave(F.fio, F.fio + 1.2, t)
      c.save()
      c.lineWidth = 1
      if (aparece > 0) {
        ;['rgba(147,166,198,', 'rgba(226,169,94,', 'rgba(208,110,128,'].forEach((cr, i) => {
          c.strokeStyle = `${cr}${(0.22 * aparece * Math.max(0.3, abre)).toFixed(3)})`
          c.beginPath()
          c.moveTo(PEITO_LIAM.x, PEITO_LIAM.y)
          c.quadraticCurveTo(200, 120 + i * 8, PORTA_X - 4 + i * 6, 120 + i * 10)
          c.stroke()
        })
      }
      // O fio dela: do peito dela ao peito dele, batendo junto com o coração.
      const corte = t >= F.corte
      const ex = PEITO_ELA.x
      const ey = PEITO_ELA.y
      if (aparece > 0 && !corte) {
        const bate = 0.55 + Math.pow(Math.max(0, Math.sin(t * Math.PI * 1.8)), 6) * 0.45
        const g = c.createLinearGradient(PEITO_LIAM.x, 0, ex, 0)
        g.addColorStop(0, `rgba(200,170,255,${aparece * bate})`)
        g.addColorStop(1, `rgba(220,190,255,${aparece * bate})`)
        c.strokeStyle = g
        c.shadowColor = 'rgba(180,150,240,0.9)'
        c.shadowBlur = 4 + bate * 4
        c.beginPath()
        c.moveTo(ex, ey)
        // Esticado quando a tesoura chega: a curva endireita e passa entre as lâminas.
        const estica = suave(F.tesoura, F.corte - 0.4, t)
        c.quadraticCurveTo((ex + PEITO_LIAM.x) / 2, (ey + PEITO_LIAM.y) / 2 - 7 + estica * 7, PEITO_LIAM.x, PEITO_LIAM.y)
        c.stroke()
        c.shadowBlur = 0
      }
      if (corte) {
        const q = Math.min(1, (t - F.corte) * 0.9)
        const some = Math.max(0, 1 - (t - F.corte) * 0.5)
        const meio = (ex + PEITO_LIAM.x) / 2
        // A ponta dele volta para o peito e apaga.
        c.strokeStyle = `rgba(200,170,255,${some})`
        c.beginPath()
        c.moveTo(PEITO_LIAM.x, PEITO_LIAM.y)
        c.quadraticCurveTo(PEITO_LIAM.x + 8, PEITO_LIAM.y + 2 + q * 6, meio - 2 - q * (meio - PEITO_LIAM.x - 4), PEITO_LIAM.y + q * 10)
        c.stroke()
        const brilho = c.createRadialGradient(PEITO_LIAM.x, PEITO_LIAM.y, 0, PEITO_LIAM.x, PEITO_LIAM.y, 10)
        brilho.addColorStop(0, `rgba(210,180,255,${0.6 * some})`)
        brilho.addColorStop(1, 'rgba(210,180,255,0)')
        c.fillStyle = brilho
        c.fillRect(PEITO_LIAM.x - 10, PEITO_LIAM.y - 10, 20, 20)
        // A ponta dela cai, e vira faísca.
        c.strokeStyle = `rgba(200,170,255,${Math.max(0, 1 - q * 1.4)})`
        c.beginPath()
        c.moveTo(ex, ey)
        c.quadraticCurveTo(ex - 4, ey + 6 + q * 10, ex - 8, ey + q * 16)
        c.stroke()
      }
      for (const f of faiscasDe(t)) ret(c, Math.round(f.x), Math.round(f.y), 1, 1, f.cor)
      // A tesoura: duas lâminas que abrem devagar e fecham de uma vez.
      if (t > F.tesoura && t < F.corte + 0.5) {
        const mx = MAO_CORTE.x
        const my = MAO_CORTE.y
        const abreT = t < F.corte - 0.15 ? suave(F.tesoura + 0.8, F.corte - 0.6, t) : 0
        const ang = 0.08 + abreT * 0.42
        c.save()
        c.translate(mx, my)
        c.strokeStyle = '#e8e8f0'
        c.lineWidth = 1
        for (const s of [-1, 1]) {
          c.save()
          c.rotate(s * ang)
          c.beginPath()
          c.moveTo(0, 0)
          c.lineTo(-11, 0)
          c.stroke()
          c.beginPath()
          c.arc(4, 0, 2.2, 0, Math.PI * 2)
          c.stroke()
          c.restore()
        }
        // O brilho na lâmina
        if (t < F.tesoura + 0.6) {
          c.fillStyle = `rgba(255,255,255,${1 - (t - F.tesoura) / 0.6})`
          c.fillRect(-8, -1, 2, 2)
        }
        c.restore()
      }
      // O estalo do corte: branco, e depois o quarto mais escuro que antes.
      if (corte && t < F.corte + 0.3) {
        c.fillStyle = `rgba(255,255,255,${1 - (t - F.corte) / 0.3})`
        c.fillRect(0, 0, WORLD_W, WORLD_H)
      }
      // A porta fechada de novo: só a estrela da tomada, e depois nem ela.
      const escurece = suave(F.fecha + 1.2, F.fim - 2, t)
      if (escurece > 0) {
        c.fillStyle = `rgba(2,2,6,${escurece * 0.82})`
        c.fillRect(0, 0, WORLD_W, WORLD_H)
        ret(c, 238, 152, 4, 4, `rgba(255,230,150,${0.8 * (1 - escurece * 0.6)})`)
      }
      c.restore()
    },
  }

  /** As faíscas da ponta dela, subindo e apagando. */
  function faiscasDe(t: number): { x: number; y: number; cor: string }[] {
    if (t < F.corte) return []
    return faiscas.filter((f) => f.vida > 0).map((f) => ({
      x: f.x, y: f.y, cor: `rgba(${200 + Math.floor(Math.random() * 40)},170,255,${Math.min(1, f.vida)})`,
    }))
  }
}

/**
 * Tinge o quadrinho com a cor de quem lembra, sem lavar: um resto da cor de
 * verdade fica, o contraste sobe, as bordas afundam no preto e uma luz vaza
 * num canto, como filme velho. É o que separa lembrança de presente sem
 * precisar escrever "flashback".
 */
export function tingir(c: CanvasRenderingContext2D, tom: string, t: number): void {
  c.save()
  c.globalCompositeOperation = 'saturation'
  c.globalAlpha = 0.82
  c.fillStyle = '#808080'
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  c.globalCompositeOperation = 'color'
  c.globalAlpha = 0.78
  c.fillStyle = tom
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  // Contraste: a imagem sobre ela mesma.
  c.globalCompositeOperation = 'overlay'
  c.globalAlpha = 0.5
  c.drawImage(c.canvas, 0, 0)
  c.globalAlpha = 1
  c.globalCompositeOperation = 'multiply'
  const v = c.createRadialGradient(WORLD_W / 2, WORLD_H * 0.55, 40, WORLD_W / 2, WORLD_H * 0.55, 225)
  v.addColorStop(0, '#ffffff')
  v.addColorStop(0.7, '#9a9a9a')
  v.addColorStop(1, '#060606')
  c.fillStyle = v
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  // A luz vazando num canto.
  c.globalCompositeOperation = 'screen'
  const lx = WORLD_W * 0.86 + Math.sin(t * 0.5) * 18
  const vaza = c.createRadialGradient(lx, 10, 0, lx, 10, 150)
  vaza.addColorStop(0, 'rgba(255,190,120,0.2)')
  vaza.addColorStop(1, 'rgba(255,190,120,0)')
  c.fillStyle = vaza
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  c.restore()
  // Grão, riscos e a luz do projetor tremendo.
  const r = sorteio(Math.floor(t * 24))
  for (let i = 0; i < 110; i++) {
    const a = r() * 0.14
    c.fillStyle = r() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 2})`
    c.fillRect(Math.floor(r() * WORLD_W), Math.floor(r() * WORLD_H), 1, 1)
  }
  if (r() > 0.6) {
    c.fillStyle = 'rgba(255,255,255,0.07)'
    c.fillRect(Math.floor(r() * WORLD_W), 0, 1, WORLD_H)
  }
  c.fillStyle = `rgba(0,0,0,${(r() * 0.06).toFixed(3)})`
  c.fillRect(0, 0, WORLD_W, WORLD_H)
}

// --- Pequenos móveis das lembranças --------------------------------------

function armarioAlto(c: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  ret(c, x, y, w, 36, '#3e2e26')
  ret(c, x, y, w, 2, '#5a4636')
  const portas = Math.floor(w / 25)
  for (let i = 0; i < portas; i++) {
    ret(c, x + 2 + i * 25, y + 4, 22, 28, '#34261f')
    ret(c, x + 20 + i * 25, y + 20, 2, 3, '#8a7a60')
  }
}

function janelaPequena(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ret(c, x - 3, y - 3, w + 6, h + 6, '#3a3230')
  ret(c, x, y, w, h, '#141820')
  ret(c, x + Math.floor(w / 2) - 1, y, 2, h, '#3a3230')
  ret(c, x, y + Math.floor(h / 2) - 1, w, 2, '#3a3230')
  ret(c, x - 6, y + h + 2, w + 12, 3, '#4a403a')
}

function relogioDeParede(c: CanvasRenderingContext2D, x: number, y: number): void {
  c.fillStyle = '#4a3a30'
  c.beginPath()
  c.arc(x, y, 8, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#d8d0c0'
  c.beginPath()
  c.arc(x, y, 6, 0, Math.PI * 2)
  c.fill()
  ret(c, x, y - 4, 1, 4, '#141010')
  ret(c, x, y, 3, 1, '#141010')
}

function luminariaPendente(c: CanvasRenderingContext2D, x: number, t: number): void {
  const bal = Math.round(Math.sin(t * 2.2) * 3)
  c.strokeStyle = '#2a2420'
  c.lineWidth = 1
  c.beginPath()
  c.moveTo(x, 0)
  c.lineTo(x + bal, 34)
  c.stroke()
  ret(c, x + bal - 8, 34, 16, 6, '#5a4a3a')
  ret(c, x + bal - 6, 40, 12, 2, 'rgba(255,230,180,0.8)')
  const g = c.createRadialGradient(x + bal, 44, 2, x + bal, 120, 90)
  g.addColorStop(0, 'rgba(255,230,180,0.18)')
  g.addColorStop(1, 'rgba(255,230,180,0)')
  c.fillStyle = g
  c.fillRect(x + bal - 100, 40, 200, 140)
}

function arandela(c: CanvasRenderingContext2D, x: number, y: number): void {
  ret(c, x - 1, y, 3, 6, '#5a4a3a')
  ret(c, x - 5, y - 6, 11, 6, '#c8b8a0')
  const g = c.createRadialGradient(x, y - 3, 1, x, y - 3, 40)
  g.addColorStop(0, 'rgba(255,230,190,0.2)')
  g.addColorStop(1, 'rgba(255,230,190,0)')
  c.fillStyle = g
  c.fillRect(x - 40, y - 43, 80, 80)
}
