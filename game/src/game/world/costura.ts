import { WORLD_H } from '../../engine/constants'
import type { Comodo, VestigioCasa } from './casa'
import type { RGB } from './arte'
import { rgb, clarear, ret, papelDeParede, lambri, assoalho, porta, quadro, cantos } from './arte'
import { sanca, rodape, sombraDeContato, interruptor } from './detalhes'
import { CORES_LINHA, CAIXA_COSTURA } from '../content/costura'
import { SALA_COSTURA } from './sala'

/**
 * O quarto de costura da mãe, do lado da sala.
 *
 * Pequeno, quente, com a luminária da máquina acesa. Tudo aqui é pista da
 * caixa de costura: o avental dela (âmbar), o paletó dele no manequim
 * (azul), o cesto com o meu uniforme (cinza) e a jaqueta da Lia (rosa), e a
 * foto grande da família, na ordem em que a gente sempre posa. Um carretel
 * lilás, sozinho na prateleira, não é de ninguém.
 */

export const COSTURA_W = 340
const CHAO = 150
const PASSO = 163
const LAMPADA = { x: 284, y: 82 }

const PAREDE: RGB = [46, 36, 42]
const MADEIRA: RGB = [40, 30, 32]

const X = {
  porta: 44,
  avental: 92,
  manequim: 132,
  cesto: 174,
  foto: 208,
  caixa: 244,
  maquina: 284,
  lilas: 312,
}

const VESTIGIOS: VestigioCasa[] = [
  {
    id: 'c-avental', x: X.avental, rotulo: 'Olhar', naParede: true,
    linhas: [
      { text: 'O avental dela, no gancho. Tem alfinete espetado no bolso até hoje.' },
      { text: 'Na barra, a costura é âmbar. Tudo que é dela tem um ponto âmbar em algum lugar.' },
      { text: 'Ela diz que é pra não misturar na lavanderia. Eu acho que é pra ter alguma coisa só dela.' },
    ],
  },
  {
    id: 'c-manequim', x: X.manequim, rotulo: 'Olhar',
    linhas: [
      { text: 'O paletó dele, vestido no manequim, com a manga alfinetada.' },
      { text: 'Na etiqueta de dentro, um ponto de linha azul. O azul é dele.' },
      { text: 'Ele nunca pediu nada disso. Ela costura do mesmo jeito.' },
    ],
  },
  {
    id: 'c-cesto', x: X.cesto, rotulo: 'Olhar',
    linhas: [
      { text: 'O cesto da roupa pra remendar.' },
      { text: 'O meu uniforme, com o botão solto: um ponto cinza na gola. Cinza é o meu.' },
      { text: 'A jaqueta da Lia, rasgada no cotovelo: ponto rosa. Foi ela que escolheu a cor, e brigou por ela.' },
    ],
  },
  {
    id: 'c-foto', x: X.foto, rotulo: 'Olhar', naParede: true,
    linhas: [
      { text: 'A foto grande da família. É a única desta casa que fica fora da sala.' },
      { text: 'A gente sempre posa igual: ele, ela, eu, a Lia. Da esquerda pra direita.' },
      { text: 'E sobra um espaço na ponta. Aqui também.' },
    ],
  },
  {
    id: 'c-caixa', x: X.caixa, rotulo: 'Abrir', acao: 'costura',
    linhas: CAIXA_COSTURA,
  },
  {
    id: 'c-maquina', x: X.maquina, rotulo: 'Olhar',
    linhas: [
      { text: 'A máquina de costura da avó. Preta, com as letras douradas quase apagadas.' },
      { text: 'Ela costura de noite, quando a casa dorme.' },
      { text: 'É o único barulho desta casa que ele não manda parar.' },
    ],
  },
  {
    id: 'c-lilas', x: X.lilas, rotulo: 'Olhar', naParede: true, aprende: 'linha-lilas',
    linhas: [
      { text: 'Um carretel de linha lilás, sozinho na prateleira. Quase cheio.' },
      { text: 'Ninguém nesta casa usa lilás.' },
    ],
    deNovo: [
      { text: 'Embaixo do carretel, a lápis, na madeira: uma letra só.' },
      { text: 'E.' },
    ],
  },
]

export function comodoCostura(): Comodo {
  return {
    id: 'costura',
    nome: 'Costura',
    largura: COSTURA_W,
    chaoY: CHAO,
    passoY: PASSO,
    limiteEsq: 24,
    limiteDir: COSTURA_W - 24,
    luzX: LAMPADA.x,
    portas: [{ x: X.porta, para: 'sala', entraEm: SALA_COSTURA, rotulo: 'Sala' }],
    vestigios: VESTIGIOS,

    desenharFundo(c, e) {
      papelDeParede(c, 0, COSTURA_W, 0, 102, PAREDE, 2)
      sanca(c, 0, COSTURA_W, PAREDE)
      ret(c, 0, 101, COSTURA_W, 3, rgb(clarear(PAREDE, 10)))
      lambri(c, 0, COSTURA_W, 104, CHAO, MADEIRA)
      assoalho(c, 0, COSTURA_W, CHAO, WORLD_H, [44, 33, 32])
      rodape(c, 0, COSTURA_W, CHAO, [54, 38, 34])
      cantos(c, COSTURA_W, CHAO, WORLD_H, PAREDE)
      porta(c, X.porta, CHAO, { cor: [58, 44, 42] })
      interruptor(c, 72, 100, 0.4)

      // O avental no gancho
      ret(c, X.avental - 1, 50, 3, 3, '#8a7a60')
      c.fillStyle = '#6a5a4e'
      c.beginPath()
      c.moveTo(X.avental - 3, 53)
      c.lineTo(X.avental + 3, 53)
      c.lineTo(X.avental + 9, 96)
      c.lineTo(X.avental - 9, 96)
      c.closePath()
      c.fill()
      ret(c, X.avental - 6, 70, 12, 9, '#5e4e44')            // bolso
      ret(c, X.avental + 2, 69, 1, 4, '#d8d8e0')             // alfinete
      for (let x = X.avental - 9; x < X.avental + 9; x += 2) ret(c, x, 95, 1, 1, CORES_LINHA[1].cor)

      // A prateleira de carretéis, em cima do manequim e do cesto
      ret(c, 112, 46, 78, 3, '#5a4030')
      ret(c, 112, 49, 78, 1, 'rgba(0,0,0,0.4)')
      const enfeite = ['#5f86c4', '#c84a4a', '#e2a95e', '#3a7a5a', '#9a9ca6', '#d8708a', '#e8e0cc', '#2a2a34', '#c8a85a']
      enfeite.forEach((cor, i) => carretel(c, 118 + i * 8, 46, cor))

      // O manequim com o paletó dele
      ret(c, X.manequim - 1, 118, 2, CHAO - 118, '#3a2a22')
      ret(c, X.manequim - 8, CHAO - 2, 16, 2, '#3a2a22')
      c.fillStyle = '#2e3446'
      c.beginPath()
      c.moveTo(X.manequim - 11, 72)
      c.quadraticCurveTo(X.manequim, 66, X.manequim + 11, 72)
      c.lineTo(X.manequim + 9, 120)
      c.lineTo(X.manequim - 9, 120)
      c.closePath()
      c.fill()
      ret(c, X.manequim - 2, 70, 4, 26, '#d4ccc0')           // camisa
      ret(c, X.manequim - 1, 74, 2, 18, '#5a3a3a')           // gravata
      ret(c, X.manequim - 14, 76, 4, 30, '#2a3040')          // manga com alfinetes
      for (let y = 96; y < 106; y += 3) ret(c, X.manequim - 14, y, 1, 1, '#d8d8e0')
      ret(c, X.manequim + 4, 76, 2, 2, CORES_LINHA[0].cor)   // o ponto azul
      ret(c, X.manequim - 4, 64, 8, 4, '#4a3a30')            // pescoço do manequim

      // O cesto de remendar: uniforme cinza e a jaqueta da Lia por cima
      sombraDeContato(c, X.cesto - 14, CHAO, 28)
      ret(c, X.cesto - 13, CHAO - 18, 26, 18, '#7a5a3a')
      for (let x = X.cesto - 12; x < X.cesto + 12; x += 3) ret(c, x, CHAO - 17, 1, 16, 'rgba(0,0,0,0.18)')
      ret(c, X.cesto - 12, CHAO - 24, 14, 7, '#5a5e6a')      // uniforme
      ret(c, X.cesto - 10, CHAO - 23, 2, 1, CORES_LINHA[2].cor)
      ret(c, X.cesto - 1, CHAO - 25, 13, 8, '#6a2c38')       // jaqueta
      ret(c, X.cesto + 8, CHAO - 23, 2, 2, CORES_LINHA[3].cor)

      // A foto grande da família, na ordem de sempre — e o espaço na ponta.
      quadro(c, X.foto - 22, 30, 44, 30, { figuras: 4, vazios: [4], moldura: [96, 70, 52] })

      // A mesinha com a caixa de costura
      sombraDeContato(c, X.caixa - 14, CHAO, 28)
      ret(c, X.caixa - 13, 124, 26, 3, '#5a4030')
      ret(c, X.caixa - 11, 127, 2, CHAO - 127, '#4a3426')
      ret(c, X.caixa + 9, 127, 2, CHAO - 127, '#4a3426')
      const aberta = e.caixaAberta === true
      ret(c, X.caixa - 10, 114, 20, 10, '#7a4a2e')
      ret(c, X.caixa - 10, 114, 20, 1, '#9a6a44')
      if (aberta) {
        ret(c, X.caixa - 10, 104, 20, 10, '#6a3e26')        // a tampa em pé
        ret(c, X.caixa - 8, 115, 16, 3, '#e8e0cc')
      } else {
        ret(c, X.caixa - 10, 112, 20, 3, '#6a3e26')
      }
      ;[0, 1, 2, 3].forEach((i) => carretel(c, X.caixa - 7 + i * 5, 121, CORES_LINHA[i]?.cor ?? '#888', 3))

      // A máquina de costura e a luminária dela
      sombraDeContato(c, X.maquina - 22, CHAO, 44)
      ret(c, X.maquina - 22, 118, 44, 4, '#4a3426')
      ret(c, X.maquina - 20, 122, 3, CHAO - 122, '#2a1e18')
      ret(c, X.maquina + 17, 122, 3, CHAO - 122, '#2a1e18')
      ret(c, X.maquina - 16, 138, 32, 2, '#2a1e18')          // pedal
      ret(c, X.maquina - 14, 104, 26, 14, '#14141a')
      ret(c, X.maquina - 14, 100, 8, 6, '#14141a')
      ret(c, X.maquina + 6, 100, 6, 18, '#14141a')
      ret(c, X.maquina - 10, 108, 14, 1, '#b8964e')          // as letras douradas
      ret(c, X.maquina - 12, 117, 22, 1, '#e8e0cc')          // o pano embaixo da agulha
      ret(c, LAMPADA.x - 1, LAMPADA.y, 2, 18, '#3a3a40')
      ret(c, LAMPADA.x - 6, LAMPADA.y - 4, 12, 5, '#3a3a40')
      ret(c, LAMPADA.x - 4, LAMPADA.y + 1, 8, 1, '#f8e0a0')

      // A prateleira do lilás, sozinho
      ret(c, X.lilas - 10, 74, 20, 2, '#5a4030')
      carretel(c, X.lilas, 74, CORES_LINHA[4].cor)
    },

    atmosfera(c, e) {
      // A sala escura em volta; a luz é a da máquina.
      c.save()
      c.globalCompositeOperation = 'multiply'
      const esc = c.createRadialGradient(LAMPADA.x, LAMPADA.y + 30, 18, LAMPADA.x, LAMPADA.y + 30, 260)
      esc.addColorStop(0, '#ffffff')
      esc.addColorStop(0.45, '#c8aa96')
      esc.addColorStop(1, '#3a2e34')
      c.fillStyle = esc
      c.fillRect(0, 0, COSTURA_W, WORLD_H)
      c.restore()
      const pisca = 0.95 + Math.sin(e.t * 2.1) * 0.03
      c.save()
      c.globalCompositeOperation = 'lighter'
      const g = c.createRadialGradient(LAMPADA.x, LAMPADA.y + 8, 2, LAMPADA.x, LAMPADA.y + 8, 150)
      g.addColorStop(0, `rgba(255,220,160,${0.32 * pisca})`)
      g.addColorStop(0.4, 'rgba(232,164,104,0.1)')
      g.addColorStop(1, 'rgba(232,164,104,0)')
      c.fillStyle = g
      c.fillRect(0, 0, COSTURA_W, WORLD_H)
      c.restore()
    },
  }
}

/** Um carretel de pé: as duas abas de madeira e a linha enrolada no meio. */
function carretel(c: CanvasRenderingContext2D, x: number, base: number, cor: string, alt = 7): void {
  ret(c, x - 2, base - alt, 5, 1, '#c8a878')
  ret(c, x - 2, base - 1, 5, 1, '#c8a878')
  ret(c, x - 1, base - alt + 1, 3, alt - 2, cor)
  ret(c, x - 1, base - alt + 1, 1, alt - 2, 'rgba(255,255,255,0.25)')
}
