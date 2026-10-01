import { WORLD_W, WORLD_H } from '../../engine/constants'
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
    falas: [{ texto: 'Olha o que você me fez fazer.', de: 0.5 }],
    dono: 'Adrian',
    tom: '#b0503c',
    dur: 5,
    atualizar(dt) {
      for (const f of [adrian, evelyn, liam]) f.update(dt)
      adrian.ofego = 2.4
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
      // Cacos de prato espalhados
      const r = sorteio(3)
      for (let i = 0; i < 16; i++) {
        ret(c, 150 + Math.floor(r() * 60), 172 + Math.floor(r() * 10), 2 + Math.floor(r() * 3), 1, '#e8e4dc')
      }
      // Batente da porta, com Liam pequeno olhando de lá
      ret(c, 318, 90, 6, 80, '#2a2220')
      evelyn.draw(c, 200)
      adrian.draw(c, 200)
      liam.draw(c, 200)
      ret(c, 344, 90, 40, 80, '#1a1614')
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
    dur: 5,
    atualizar(dt, t) {
      lia.update(dt)
      liam.update(dt)
      lia.braco = 0.5 + Math.max(0, Math.sin(t * 6)) * 0.4
      lia.tremor = 0.6
      liam.braco = 0.9
      liam.curvatura = 0.6
    },
    desenhar(c) {
      comodo(c, [44, 44, 54], 170)
      ret(c, 0, 166, WORLD_W, 4, '#34343e')
      ret(c, 0, 166, WORLD_W, 1, '#4a4a56')
      porta(c, 262, 170, { luz: true, cor: [70, 60, 60], alt: 70 })
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
    dur: 5.4,
    atualizar(dt) {
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
      // A mala
      ret(c, 186, 160, 12, 16, '#3a2e2a')
      ret(c, 190, 157, 4, 3, '#5a4a44')
      evelyn.draw(c, 93)
      menina.draw(c, 93)
      // Mãos dadas
      ret(c, 163, 160, 9, 1, PELE)
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
    dur: 5.4,
    atualizar(dt, t) {
      helena.update(dt)
      menino.update(dt)
      helena.braco = Math.min(0.9, t * 0.6)
      helena.curvatura = 0.15
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
      for (let y = 116; y < 140; y += 2) ret(c, 222, y, 90, 2, (y / 2) % 2 ? '#5a3a44' : '#4a3a5a')
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
 * 6. A figura preta. O quarto de Liam, pequeno, dormindo. Alguém na porta,
 * contra a luz do corredor, com um fio saindo do peito até ele. Ela corta.
 */
function figuraPreta(): Lembranca {
  const ela = new Figura({ x: 272, y: 172, altura: 40, cabelo: 'longo', cor: cor('#000', '#000') })
  ela.silhueta = true
  ela.olhar = -1
  const CORTE = 3.1
  return {
    falas: [
      { texto: 'Se eu ficar, é você que carrega.', de: 0.6 },
      { texto: 'Então eu corto.', de: CORTE - 0.4 },
    ],
    dono: '',
    tom: '#303848',
    dur: 7,
    atualizar(dt, t) {
      ela.update(dt)
      ela.braco = t > 1.8 ? Math.min(0.9, (t - 1.8) * 1.2) : 0
    },
    desenhar(c, t) {
      comodo(c, [26, 30, 44], 172)
      // Desenhos de criança presos na parede, e uma prateleira com o coelho
      for (const [dx, dy] of [[108, 52], [128, 46], [150, 56]] as const) {
        ret(c, dx, dy, 14, 12, '#c8c4b8')
        ret(c, dx + 3, dy + 5, 5, 5, '#4a6a9a')
        ret(c, dx + 2, dy + 4, 7, 1, '#9a4a4a')
        ret(c, dx + 9, dy + 7, 3, 3, '#4a8a4a')
      }
      ret(c, 186, 92, 40, 3, '#3a2e2a')
      ret(c, 194, 82, 8, 10, '#a89494')
      ret(c, 195, 76, 2, 6, '#a89494')
      ret(c, 199, 77, 2, 5, '#a89494')
      ret(c, 196, 85, 1, 1, '#141014')
      ret(c, 199, 85, 1, 1, '#141014')
      ret(c, 210, 86, 6, 6, '#6a4a3a')
      // Cômoda baixa e uma luz de tomada em forma de estrela
      ret(c, 186, 130, 46, 42, '#2a2a3a')
      for (const yy of [136, 148, 160]) {
        ret(c, 190, yy, 38, 9, '#323246')
        ret(c, 207, yy + 4, 4, 1, '#8a8aa0')
      }
      ret(c, 236, 152, 4, 4, 'rgba(255,230,150,0.7)')
      ret(c, 237, 151, 2, 6, 'rgba(255,230,150,0.5)')
      // Brinquedos no chão: blocos, um carrinho
      ret(c, 166, 178, 6, 6, '#7a4a4a')
      ret(c, 172, 180, 6, 4, '#4a6a7a')
      ret(c, 168, 174, 5, 4, '#8a7a4a')
      ret(c, 46, 180, 14, 5, '#5a5a7a')
      ret(c, 48, 177, 8, 3, '#5a5a7a')
      ret(c, 48, 185, 3, 2, '#141414')
      ret(c, 56, 185, 3, 2, '#141414')
      // Janela com lua
      ret(c, 40, 40, 40, 36, '#0a1020')
      ret(c, 64, 46, 8, 8, '#c8ccd8')
      ret(c, 59, 40, 2, 36, '#1a1e2a')
      // A cama e o menino dormindo, encolhido
      ret(c, 70, 146, 90, 26, '#2a3048')
      ret(c, 70, 142, 90, 6, '#3a4260')
      ret(c, 142, 136, 16, 7, '#c8c0b0')
      ret(c, 132, 137, 10, 7, '#6d5a52')
      ret(c, 132, 136, 10, 3, '#12151f')
      c.fillStyle = '#3a4260'
      c.beginPath()
      c.ellipse(112, 142, 26, 7, 0, Math.PI, 0)
      c.fill()
      // A porta aberta, a luz do corredor atrás dela
      const sai = t > CORTE + 1.2 ? Math.min(1, (t - CORTE - 1.2) / 1.4) : 0
      ret(c, 252, 88, 44, 84, '#d8c8a0')
      const luz = c.createRadialGradient(274, 140, 4, 274, 140, 110)
      luz.addColorStop(0, 'rgba(255,230,180,0.3)')
      luz.addColorStop(1, 'rgba(255,230,180,0)')
      c.fillStyle = luz
      c.fillRect(150, 40, 234, 176)
      ret(c, 248, 84, 4, 88, '#14161e')
      ret(c, 296, 84, 4, 88, '#14161e')
      ret(c, 248, 84, 52, 4, '#14161e')
      // Luz da porta no chão
      c.fillStyle = 'rgba(255,230,180,0.12)'
      c.beginPath()
      c.moveTo(252, 172)
      c.lineTo(296, 172)
      c.lineTo(230, 216)
      c.lineTo(170, 216)
      c.fill()
      c.save()
      c.globalAlpha = 1 - sai
      ela.x = 272 + sai * 10
      ela.draw(c, 400, 'rgba(0,0,0,0)')
      c.restore()
    },
    sobre(c, t) {
      // O fio: do peito dela ao peito dele. É a única cor da lembrança.
      const cortado = t >= CORTE
      const pulso = 0.6 + Math.sin(t * 4) * 0.3
      const x0 = 270
      const y0 = 146
      const x1 = 136
      const y1 = 142
      c.save()
      c.strokeStyle = `rgba(200,170,255,${cortado ? Math.max(0, 1 - (t - CORTE) * 0.8) : pulso})`
      c.lineWidth = 1
      c.beginPath()
      if (!cortado) {
        c.moveTo(x0, y0)
        c.quadraticCurveTo(200, 128, x1, y1)
      } else {
        // As duas pontas caem, cada uma para o seu lado
        const q = Math.min(1, (t - CORTE) * 1.4)
        c.moveTo(x0, y0)
        c.quadraticCurveTo(x0 - 20, y0 + 10 + q * 16, x0 - 30, y0 + q * 24)
        c.moveTo(x1, y1)
        c.quadraticCurveTo(x1 + 30, y1 + 4 + q * 20, x1 + 44, y1 + q * 28)
      }
      c.stroke()
      // Tesoura na mão dela, e o estalo do corte
      if (t > 1.8 && t < CORTE + 1.2) {
        ret(c, 258, 134, 2, 1, '#e8e8f0')
        ret(c, 260, 133, 1, 1, '#e8e8f0')
        ret(c, 260, 135, 1, 1, '#e8e8f0')
      }
      if (cortado && t < CORTE + 0.25) {
        c.fillStyle = `rgba(255,255,255,${1 - (t - CORTE) * 4})`
        c.fillRect(0, 0, WORLD_W, WORLD_H)
      }
      c.restore()
    },
  }
}

/**
 * Tinge o quadrinho de uma cor só, escurece as bordas e põe grão. É o que
 * separa lembrança de presente sem precisar escrever "flashback".
 */
export function tingir(c: CanvasRenderingContext2D, tom: string, t: number): void {
  c.save()
  c.globalCompositeOperation = 'saturation'
  c.fillStyle = '#808080'
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  c.globalCompositeOperation = 'color'
  c.fillStyle = tom
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  c.globalCompositeOperation = 'multiply'
  const v = c.createRadialGradient(WORLD_W / 2, WORLD_H / 2, 50, WORLD_W / 2, WORLD_H / 2, 230)
  v.addColorStop(0, '#ffffff')
  v.addColorStop(1, '#101010')
  c.fillStyle = v
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  c.restore()
  // Grão e riscos de filme velho
  const r = sorteio(Math.floor(t * 24))
  for (let i = 0; i < 90; i++) {
    const a = r() * 0.12
    c.fillStyle = r() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 2})`
    c.fillRect(Math.floor(r() * WORLD_W), Math.floor(r() * WORLD_H), 1, 1)
  }
  if (r() > 0.6) {
    c.fillStyle = 'rgba(255,255,255,0.06)'
    c.fillRect(Math.floor(r() * WORLD_W), 0, 1, WORLD_H)
  }
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
