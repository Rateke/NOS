import { WORLD_H } from '../../engine/constants'
import type { Comodo, VestigioCasa } from './casa'
import { ret, sorteio } from './arte'

/**
 * Dentro da cabana, depois do grito.
 *
 * No quarto, a cabana de cobertor desabou. Mas a lanterna continua acesa lá
 * embaixo, e quem encosta a mão na luz entra. Por dentro ela é maior do que
 * por fora — do tamanho de que ele precisava. É o único lugar da casa em
 * que nada está fora do lugar: o cobertor de retalhos fazendo teto, o varal
 * de luzinhas, as almofadas, os desenhos presos com alfinete, a caixinha de
 * música, a lata do telefone de barbante.
 *
 * Aqui não tem nó para desatar e ninguém grita. É o lugar onde ele fica bem.
 */

const LARGURA = 330
const CHAO = 150
const PASSO = 166
const LANTERNA = { x: 165, y: 52 }

const VESTIGIOS: VestigioCasa[] = [
  {
    id: 'c-lanterna', x: 165, rotulo: 'Olhar', naParede: true,
    linhas: [
      { text: 'A lanterna, pendurada no meio, onde o cobertor faz o pico.' },
      { text: 'A pilha está fraca desde que eu me lembro. Aqui dentro ela nunca apaga.' },
    ],
  },
  {
    id: 'c-desenhos', x: 96, rotulo: 'Olhar', naParede: true,
    linhas: [
      { text: 'Desenhos presos no cobertor com alfinete. Os meus, de giz de cera.' },
      { text: 'A casa com um quarto a mais. Uma árvore enorme no lugar do corredor.' },
      { text: 'E a família: cinco bonecos de palito. O quinto é roxo, e está segurando a minha mão.' },
    ],
  },
  {
    id: 'c-almofadas', x: 134, rotulo: 'Deitar', acao: 'deitar',
    linhas: [
      { text: 'Eu deito nas almofadas. O cobertor balança em cima, devagar.' },
      { text: 'Aqui dentro ninguém grita.' },
      { text: 'Aqui dentro eu posso respirar sem contar.' },
    ],
  },
  {
    id: 'c-caixinha', x: 204, rotulo: 'Dar corda', acao: 'caixinha',
    linhas: [
      { text: 'Uma caixinha de música, com a bailarina quebrada. Eu dou corda.' },
    ],
  },
  {
    id: 'c-lata', x: 252, rotulo: 'Escutar', acao: 'lata',
    linhas: [
      { text: 'Duas latas e um barbante. O barbante sai por baixo do cobertor e some no escuro.' },
      { text: 'Eu encosto a lata no ouvido.' },
    ],
  },
]

export function comodoCabana(): Comodo {
  return {
    id: 'cabana',
    nome: 'Dentro da cabana',
    largura: LARGURA,
    chaoY: CHAO,
    passoY: PASSO,
    limiteEsq: 40,
    limiteDir: LARGURA - 34,
    luzX: LANTERNA.x,
    portas: [{ x: 44, para: 'quarto', entraEm: 66, rotulo: 'Sair' }],
    vestigios: VESTIGIOS,

    desenharFundo(c, e) {
      const t = e.t
      // O fundo da cabana: retalhos quentes, mais escuros longe da lanterna.
      const cores = ['#7a3e36', '#8a6a3e', '#4a5274', '#6e3a52', '#7e7246', '#3e5a4a']
      const r = sorteio(3)
      for (let y = 0; y < CHAO; y += 12) {
        for (let x = 0; x < LARGURA; x += 14) {
          const cor = cores[Math.floor(r() * cores.length)] ?? '#555'
          ret(c, x, y, 14, 12, cor)
          ret(c, x, y, 14, 1, 'rgba(0,0,0,0.25)')
          ret(c, x, y, 1, 12, 'rgba(0,0,0,0.2)')
          // Pontinhos de costura
          for (let k = 2; k < 14; k += 3) ret(c, x + k, y + 1, 1, 1, 'rgba(240,226,200,0.25)')
        }
      }
      // O teto: o cobertor caindo em duas águas a partir do pico, no meio.
      c.fillStyle = 'rgba(30,14,16,0.55)'
      c.beginPath()
      c.moveTo(0, 0)
      c.lineTo(LANTERNA.x, 0)
      c.lineTo(0, 64)
      c.closePath()
      c.fill()
      c.beginPath()
      c.moveTo(LARGURA, 0)
      c.lineTo(LANTERNA.x, 0)
      c.lineTo(LARGURA, 64)
      c.closePath()
      c.fill()
      // As duas "paredes": as cadeiras por trás do pano.
      for (const x of [22, LARGURA - 24]) {
        ret(c, x, 30, 4, CHAO - 30, 'rgba(20,10,10,0.5)')
        ret(c, x - 6, CHAO - 40, 16, 3, 'rgba(20,10,10,0.45)')
      }
      // A entrada, à esquerda: a aba levantada e o quarto escuro lá fora.
      ret(c, 30, 84, 30, CHAO - 84, '#07080e')
      c.fillStyle = '#8a6a3e'
      c.beginPath()
      c.moveTo(30, 84)
      c.lineTo(60, 84)
      c.lineTo(64, 76)
      c.lineTo(28, 78)
      c.closePath()
      c.fill()
      // O varal de luzinhas, em festão de uma ponta à outra
      for (let i = 0; i <= 26; i++) {
        const x = 10 + i * 12
        const y = 26 + Math.sin((i / 26) * Math.PI * 3) * 6 + Math.abs(x - LANTERNA.x) * 0.12
        ret(c, x, y, 12, 1, 'rgba(40,30,20,0.6)')
        const acesa = Math.sin(t * 1.8 + i * 1.3) > -0.4
        const cor = ['#f2d28a', '#f09a9a', '#a8d0f0', '#c8f0a0'][i % 4] ?? '#fff'
        ret(c, x, y + 1, 2, 2, acesa ? cor : '#5a4a3a')
      }
      // Os desenhos, presos com alfinete
      papel(c, 76, 66, 22, 18, (x, y) => {
        // A casa com um quarto a mais
        ret(c, x + 3, y + 8, 11, 7, '#c86a50')
        ret(c, x + 14, y + 10, 5, 5, '#8a5ac8')
        c.fillStyle = '#3a6a3a'
        c.beginPath()
        c.moveTo(x + 2, y + 8)
        c.lineTo(x + 8, y + 3)
        c.lineTo(x + 15, y + 8)
        c.fill()
      })
      papel(c, 104, 60, 20, 16, (x, y) => {
        // Cinco bonecos de palito; o quinto, roxo, de mãos dadas com o menor
        const cs = ['#3a3a5a', '#c87a4a', '#3a3a5a', '#c8505a', '#8a5ac8']
        cs.forEach((cor, i) => {
          ret(c, x + 2 + i * 3.5, y + 5, 1, 7, cor)
          ret(c, x + 1.5 + i * 3.5, y + 3, 2, 2, cor)
        })
      })
      papel(c, 214, 64, 24, 18, (x, y) => {
        // A árvore enorme no lugar do corredor
        ret(c, x + 10, y + 8, 3, 9, '#7a4a28')
        c.fillStyle = '#3a8a4a'
        c.beginPath()
        c.ellipse(x + 11, y + 7, 8, 6, 0, 0, Math.PI * 2)
        c.fill()
      })
      // Chão: o tapete grosso e as almofadas
      ret(c, 0, CHAO, LARGURA, WORLD_H - CHAO, '#2a1e24')
      for (let x = 0; x < LARGURA; x += 6) ret(c, x, CHAO + ((x / 6) % 2), 3, 1, 'rgba(255,220,180,0.06)')
      almofada(c, 112, CHAO + 4, '#a85a5a')
      almofada(c, 136, CHAO + 6, '#5a6aa8')
      almofada(c, 124, CHAO - 2, '#c8a85a')
      // Pilha de livros e uma xícara
      ret(c, 70, CHAO + 2, 14, 3, '#5a3a4a')
      ret(c, 71, CHAO - 1, 12, 3, '#3a5a6a')
      ret(c, 72, CHAO - 4, 10, 3, '#7a6a3a')
      // A caixinha de música, aberta
      ret(c, 198, CHAO + 2, 12, 6, '#6a3a2a')
      ret(c, 198, CHAO - 4, 12, 6, '#8a4a36')
      ret(c, 199, CHAO - 3, 10, 4, '#d8b8c8')
      ret(c, 204, CHAO - 7, 1, 4, '#f0e0e0')
      // As latas e o barbante saindo por baixo do cobertor
      ret(c, 248, CHAO + 1, 5, 6, '#a8a8b0')
      ret(c, 248, CHAO + 1, 5, 1, '#d8d8e0')
      c.strokeStyle = 'rgba(230,220,200,0.6)'
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(253, CHAO + 4)
      c.quadraticCurveTo(280, CHAO + 9, LARGURA - 18, CHAO - 2)
      c.stroke()
      // Vaga-lumes num pote
      ret(c, 286, CHAO - 6, 8, 12, 'rgba(200,220,230,0.25)')
      ret(c, 286, CHAO - 7, 8, 2, '#8a6a3e')
      for (let i = 0; i < 4; i++) {
        const a = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.9)
        ret(c, 287 + ((i * 3) % 6), CHAO - 4 + ((i * 5) % 8), 1, 1, `rgba(210,240,140,${0.3 + a * 0.7})`)
      }
      // A lanterna pendurada no pico
      ret(c, LANTERNA.x, 0, 1, LANTERNA.y - 6, 'rgba(230,220,200,0.6)')
      ret(c, LANTERNA.x - 3, LANTERNA.y - 6, 7, 9, '#3a3a44')
      ret(c, LANTERNA.x - 2, LANTERNA.y + 3, 5, 2, '#f8e0a0')
    },

    atmosfera(c, e) {
      // Tudo quente, a partir da lanterna; e o resto, num escuro macio.
      const pisca = 0.9 + Math.sin(e.t * 9) * 0.03
      const g = c.createRadialGradient(LANTERNA.x, LANTERNA.y + 10, 6, LANTERNA.x, LANTERNA.y + 30, 190)
      g.addColorStop(0, `rgba(255,214,150,${0.32 * pisca})`)
      g.addColorStop(0.5, 'rgba(255,190,120,0.1)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      c.save()
      c.globalCompositeOperation = 'lighter'
      c.fillStyle = g
      c.fillRect(0, 0, LARGURA, WORLD_H)
      c.restore()
      const v = c.createRadialGradient(LANTERNA.x, 110, 60, LANTERNA.x, 110, 240)
      v.addColorStop(0, 'rgba(10,4,6,0)')
      v.addColorStop(1, 'rgba(10,4,6,0.55)')
      c.fillStyle = v
      c.fillRect(0, 0, LARGURA, WORLD_H)
    },
  }
}

function papel(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, desenho: (x: number, y: number) => void): void {
  ret(c, x + 1, y + 1, w, h, 'rgba(0,0,0,0.3)')
  ret(c, x, y, w, h, '#e8e0cc')
  desenho(x, y)
  ret(c, x + w / 2, y, 1, 1, '#c84a4a')
}

function almofada(c: CanvasRenderingContext2D, x: number, y: number, cor: string): void {
  c.fillStyle = cor
  c.beginPath()
  c.ellipse(x, y, 13, 5, 0, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = 'rgba(255,255,255,0.12)'
  c.beginPath()
  c.ellipse(x - 2, y - 2, 8, 2, 0, 0, Math.PI * 2)
  c.fill()
}
