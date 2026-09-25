import { WORLD_W, WORLD_H } from '../../engine/constants'
import type { Line } from './types'

/**
 * A casa explorável.
 *
 * Cada cômodo é um dado: largura, chão, portas e vestígios. A cena de
 * exploração só lê isto — assim dá para acrescentar cômodo sem mexer em
 * lógica nenhuma.
 *
 * A casa é vista de frente, como as outras cenas da demo. O corredor é mais
 * largo que a tela e a câmera acompanha; e ele **cresce** conforme Liam anda,
 * que é o que o roteiro descreve: "o corredor se alonga conforme ele caminha".
 */

export interface Porta {
  /** Centro da porta, em coordenadas do cômodo. */
  x: number
  /** Cômodo de destino. */
  para: string
  /** Onde Liam aparece no destino. */
  entraEm: number
  rotulo: string
  /** Se travada, mostra `aoTentar` em vez de levar a algum lugar. */
  travada?: boolean
  aoTentar?: Line[]
}

export interface VestigioCasa {
  id: string
  x: number
  rotulo: string
  linhas: Line[]
}

export interface Comodo {
  id: string
  nome: string
  largura: number
  chaoY: number
  portas: Porta[]
  vestigios: VestigioCasa[]
  desenharFundo(c: CanvasRenderingContext2D, t: number): void
  desenharFrente?(c: CanvasRenderingContext2D, t: number): void
}

const CHAO = 158

/** Moldura de porta, com o vão escuro e uma fresta de luz por baixo. */
function porta(c: CanvasRenderingContext2D, x: number, chao: number, aberta = false): void {
  const larg = 30
  const alt = 62
  const y = chao - alt
  c.fillStyle = '#0c1018'
  c.fillRect(x - larg / 2 - 3, y - 3, larg + 6, alt + 3)
  c.fillStyle = aberta ? '#05070c' : '#1a2130'
  c.fillRect(x - larg / 2, y, larg, alt)
  if (!aberta) {
    c.fillStyle = '#242c3e'
    c.fillRect(x - larg / 2 + 3, y + 4, larg - 6, alt - 10)
    c.fillStyle = '#d9b25f'
    c.fillRect(x + larg / 2 - 7, y + alt / 2, 3, 3)
  }
  // Fresta por baixo: há luz do outro lado
  c.fillStyle = 'rgba(226,190,130,0.16)'
  c.fillRect(x - larg / 2, chao - 2, larg, 2)
}

function rodape(c: CanvasRenderingContext2D, largura: number, chao: number): void {
  c.fillStyle = 'rgba(255,255,255,0.05)'
  c.fillRect(0, chao - 5, largura, 2)
  c.fillStyle = 'rgba(0,0,0,0.35)'
  c.fillRect(0, chao, largura, 2)
}

function tabuas(c: CanvasRenderingContext2D, largura: number, chao: number, cor: string): void {
  c.fillStyle = cor
  c.fillRect(0, chao, largura, WORLD_H - chao)
  c.fillStyle = 'rgba(0,0,0,0.14)'
  for (let y = chao + 9; y < WORLD_H; y += 10) c.fillRect(0, y, largura, 1)
  c.fillStyle = 'rgba(0,0,0,0.1)'
  for (let x = 24; x < largura; x += 58) c.fillRect(x, chao, 1, WORLD_H - chao)
}

// --- Corredor ---------------------------------------------------------------

/** Cresce conforme Liam anda. Começa curto e vira túnel. */
export const CORREDOR_BASE = 470
export const CORREDOR_MAX = 1180

export function comodoCorredor(largura: number): Comodo {
  return {
    id: 'corredor',
    nome: 'Corredor',
    largura,
    chaoY: CHAO,
    portas: [
      { x: 40, para: 'sala', entraEm: 300, rotulo: 'Voltar para a sala' },
      { x: 150, para: 'quarto', entraEm: 190, rotulo: 'Meu quarto' },
      { x: 268, para: 'cozinha', entraEm: 70, rotulo: 'Cozinha' },
      {
        x: largura - 46, para: 'impossivel', entraEm: 0, rotulo: 'Abrir',
        travada: true,
        aoTentar: [
          { text: 'A maçaneta gira. A porta não abre.' },
          { text: 'Nunca abriu.' },
          { text: 'Eu desenhei um quarto aqui. Eu lembro de desenhar.' },
        ],
      },
    ],
    vestigios: [
      {
        id: 'retratos', x: 206, rotulo: 'Olhar',
        linhas: [
          { text: 'A parede do corredor é só retrato.' },
          { text: 'Nesse aqui tem um espaço vazio entre mim e a minha mãe.' },
          { text: 'Do tamanho de uma pessoa.' },
        ],
      },
      {
        id: 'marcas', x: 330, rotulo: 'Olhar',
        linhas: [
          { text: 'Riscos de altura no batente. Um lápis por ano.' },
          { text: 'Tem dois nomes riscados até a metade.' },
          { text: 'E um terceiro, mais alto, que alguém tentou apagar.' },
        ],
      },
    ],
    desenharFundo(c, t) {
      c.fillStyle = '#0a0d15'
      c.fillRect(0, 0, largura, WORLD_H)
      // Parede com papel listrado
      c.fillStyle = '#171d2a'
      c.fillRect(0, 0, largura, CHAO)
      c.fillStyle = 'rgba(255,255,255,0.02)'
      for (let x = 5; x < largura; x += 11) c.fillRect(x, 0, 1, CHAO - 5)
      c.fillStyle = '#131926'
      c.fillRect(0, 96, largura, CHAO - 96)
      c.fillStyle = 'rgba(255,255,255,0.04)'
      c.fillRect(0, 94, largura, 2)

      // Lâmpadas penduradas, cada vez mais distantes
      for (let i = 0; i < Math.ceil(largura / 130); i++) {
        const lx = 70 + i * 130
        if (lx > largura - 20) break
        const osc = Math.sin(t * 0.7 + i) * 1.2
        c.fillStyle = '#232b3c'
        c.fillRect(lx, 0, 1, 22)
        c.fillStyle = `rgba(240,206,150,${0.5 - i * 0.07})`
        c.fillRect(lx - 4 + osc, 22, 9, 4)
      }

      tabuas(c, largura, CHAO, '#1b2130')
      // Passadeira no meio do corredor
      c.fillStyle = '#242536'
      c.fillRect(0, CHAO + 14, largura, 26)
      c.fillStyle = '#2b2d41'
      c.fillRect(0, CHAO + 17, largura, 20)
      rodape(c, largura, CHAO)

      // Retratos
      for (let i = 0; i < Math.ceil(largura / 78); i++) {
        const qx = 190 + i * 78
        if (qx > largura - 70) break
        c.fillStyle = '#2b3448'
        c.fillRect(qx, 34, 26, 20)
        c.fillStyle = '#0f131d'
        c.fillRect(qx + 2, 36, 22, 16)
        // Um dos retratos tem um buraco onde havia alguém
        const figuras = i === 1 ? 3 : 4
        for (let k = 1; k <= figuras; k++) {
          c.fillStyle = 'rgba(184,196,220,0.22)'
          const fx = qx + 2 + (22 / (figuras + 1)) * k
          c.fillRect(fx - 1, 44, 3, 6)
          c.fillRect(fx - 1, 41, 3, 3)
        }
      }

      for (const p of this.portas) porta(c, p.x, CHAO, false)
    },
    desenharFrente(c) {
      // O fundo do corredor engole a luz: quanto mais longe, mais escuro.
      const g = c.createLinearGradient(largura - 200, 0, largura, 0)
      g.addColorStop(0, 'rgba(4,6,10,0)')
      // Forte o bastante para a porta do fim parecer longe, fraca o bastante
      // para Liam continuar visível quando chegar lá.
      g.addColorStop(1, 'rgba(4,6,10,0.66)')
      c.fillStyle = g
      c.fillRect(largura - 200, 0, 200, WORLD_H)
    },
  }
}

// --- Quarto de Liam ---------------------------------------------------------

export const comodoQuarto: Comodo = {
  id: 'quarto',
  nome: 'Quarto de Liam',
  largura: WORLD_W,
  chaoY: CHAO,
  portas: [{ x: 210, para: 'corredor', entraEm: 150, rotulo: 'Sair' }],
  vestigios: [
    {
      id: 'plantas', x: 92, rotulo: 'Olhar',
      linhas: [
        { text: 'Minhas plantas de casas. Uma parede inteira.' },
        { text: 'Todas têm um cômodo a mais do que a nossa.' },
        { text: 'Sempre no fim do corredor.' },
      ],
    },
    {
      id: 'armario', x: 300, rotulo: 'Abrir',
      linhas: [
        { text: 'Eu caibo aqui dentro, se dobrar os joelhos.' },
        { text: 'E sei exatamente quanto tempo dá pra ficar antes de alguém notar.' },
      ],
    },
    {
      id: 'caixa', x: 148, rotulo: 'Abrir',
      linhas: [
        { text: 'A caixa debaixo da cama.' },
        { text: 'Botão. Passagem vencida. Pedra pintada de azul. Chave sem porta.' },
        { text: 'Nada disso é meu, e eu não consigo jogar fora.' },
        { text: 'Se eu jogar fora, é como dizer que nunca foi de ninguém.' },
      ],
    },
  ],
  desenharFundo(c) {
    c.fillStyle = '#0a0d15'
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    c.fillStyle = '#161c29'
    c.fillRect(0, 0, WORLD_W, CHAO)
    c.fillStyle = '#121824'
    c.fillRect(0, 100, WORLD_W, CHAO - 100)
    c.fillStyle = 'rgba(255,255,255,0.04)'
    c.fillRect(0, 98, WORLD_W, 2)

    // Janela com a manhã parada
    c.fillStyle = '#222a3c'
    c.fillRect(240, 20, 56, 44)
    const g = c.createLinearGradient(0, 20, 0, 64)
    g.addColorStop(0, '#9fb4d0')
    g.addColorStop(1, '#5d7291')
    c.fillStyle = g
    c.fillRect(244, 24, 48, 36)
    c.fillStyle = 'rgba(11,14,22,0.35)'
    c.fillRect(252, 40, 4, 20)
    c.fillRect(247, 32, 14, 9)
    c.fillStyle = '#1a2130'
    c.fillRect(267, 24, 2, 36)
    c.fillRect(244, 41, 48, 2)

    // Parede de plantas desenhadas
    for (let i = 0; i < 11; i++) {
      const px = 40 + (i % 6) * 20
      const py = 22 + Math.floor(i / 6) * 26
      c.fillStyle = 'rgba(207,198,180,0.13)'
      c.fillRect(px, py, 16, 20)
      c.fillStyle = 'rgba(11,14,22,0.3)'
      c.fillRect(px + 3, py + 3, 10, 1)
      c.fillRect(px + 3, py + 3, 1, 12)
      c.fillRect(px + 3, py + 14, 10, 1)
    }

    tabuas(c, WORLD_W, CHAO, '#1a2030')
    rodape(c, WORLD_W, CHAO)

    // Cama
    c.fillStyle = '#2a3346'
    c.fillRect(120, CHAO - 26, 66, 26)
    c.fillStyle = '#343e56'
    c.fillRect(120, CHAO - 30, 66, 5)
    c.fillStyle = '#414d6a'
    c.fillRect(124, CHAO - 28, 20, 5)
    c.fillStyle = '#1c2231'
    c.fillRect(120, CHAO - 4, 66, 4)
    // A caixa embaixo dela
    c.fillStyle = '#26304a'
    c.fillRect(140, CHAO - 9, 18, 9)

    // Escrivaninha e luminária
    c.fillStyle = '#28324a'
    c.fillRect(230, CHAO - 22, 52, 6)
    c.fillStyle = '#1e2636'
    c.fillRect(234, CHAO - 16, 5, 16)
    c.fillRect(273, CHAO - 16, 5, 16)
    c.fillStyle = '#3a4660'
    c.fillRect(252, CHAO - 34, 3, 12)
    c.fillStyle = '#4a5674'
    c.fillRect(246, CHAO - 40, 15, 7)
    c.fillStyle = 'rgba(255,233,198,0.65)'
    c.fillRect(248, CHAO - 33, 11, 2)

    // Armário
    c.fillStyle = '#232c3e'
    c.fillRect(288, CHAO - 56, 34, 56)
    c.fillStyle = '#2c374d'
    c.fillRect(288, CHAO - 56, 34, 4)
    c.fillStyle = 'rgba(0,0,0,0.4)'
    c.fillRect(305, CHAO - 52, 1, 52)
    c.fillStyle = '#4a5166'
    c.fillRect(301, CHAO - 30, 2, 5)
    c.fillRect(307, CHAO - 30, 2, 5)

    porta(c, 210, CHAO, false)
  },
  desenharFrente(c) {
    c.save()
    c.globalCompositeOperation = 'lighter'
    const g = c.createRadialGradient(253, CHAO - 34, 4, 253, CHAO - 34, 120)
    g.addColorStop(0, 'rgba(255,224,176,0.2)')
    g.addColorStop(1, 'rgba(232,164,104,0)')
    c.fillStyle = g
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    c.restore()
  },
}

// --- Sala (reaproveita o cenário do prólogo, agora caminhável) --------------

export function comodoSala(
  desenhar: (c: CanvasRenderingContext2D, k: number) => void,
  desenharFrente: (c: CanvasRenderingContext2D, k: number) => void,
  luz: (c: CanvasRenderingContext2D, k: number, t: number) => void,
): Comodo {
  return {
    id: 'sala',
    nome: 'Sala',
    largura: WORLD_W,
    chaoY: 150,
    portas: [{ x: 340, para: 'corredor', entraEm: 60, rotulo: 'Corredor' }],
    vestigios: [
      {
        id: 'piano-sala', x: 150, rotulo: 'Olhar',
        linhas: [
          { text: 'O piano ainda está aberto.' },
          { text: 'A música que ele me ensinou continua na minha mão.' },
        ],
      },
      {
        id: 'quadros-sala', x: 236, rotulo: 'Olhar',
        linhas: [
          { text: 'Os retratos da sala são os bons.' },
          { text: 'Nesses ninguém está faltando.' },
          { text: 'Nesses eu não sei quem está faltando.' },
        ],
      },
    ],
    desenharFundo(c, t) {
      desenhar(c, 0.45)
      porta(c, 340, 150, false)
      void t
    },
    desenharFrente(c, t) {
      desenharFrente(c, 0.45)
      luz(c, 0.45, t)
    },
  }
}

// --- Cozinha ----------------------------------------------------------------

export const comodoCozinha: Comodo = {
  id: 'cozinha',
  nome: 'Cozinha',
  largura: WORLD_W,
  chaoY: 160,
  portas: [{ x: 30, para: 'corredor', entraEm: 268, rotulo: 'Voltar' }],
  vestigios: [],
  desenharFundo(c, t) {
    c.fillStyle = '#0c1018'
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    c.fillStyle = '#141a26'
    c.fillRect(0, 0, WORLD_W, 160)
    c.fillStyle = '#19202e'
    c.fillRect(0, 64, WORLD_W, 96)
    c.fillStyle = 'rgba(0,0,0,0.16)'
    for (let x = 0; x < WORLD_W; x += 12) c.fillRect(x, 64, 1, 96)
    for (let y = 64; y < 160; y += 12) c.fillRect(0, y, WORLD_W, 1)

    c.fillStyle = '#212a3a'
    c.fillRect(160, 104, 96, 8)
    c.fillStyle = '#1a212e'
    c.fillRect(160, 112, 96, 30)
    c.fillStyle = '#2c3748'
    c.fillRect(186, 96, 22, 9)
    c.fillStyle = '#3a4256'
    c.fillRect(184, 94, 26, 3)
    c.fillStyle = '#5c4f58'
    c.fillRect(196, 90, 13, 4)
    c.fillStyle = `rgba(226,120,60,${0.4 + Math.sin(t * 5) * 0.12})`
    c.fillRect(190, 105, 14, 2)

    c.fillStyle = '#2a3346'
    c.fillRect(272, 92, 22, 13)
    c.fillStyle = '#404c66'
    c.fillRect(275, 95, 9, 7)

    // A porta da frente, no fundo. É ela que vai ser trancada.
    c.fillStyle = '#10151f'
    c.fillRect(336, 56, 34, 104)
    c.fillStyle = '#1b2230'
    c.fillRect(340, 60, 26, 96)
    c.fillStyle = '#d9b25f'
    c.fillRect(342, 112, 3, 4)

    tabuas(c, WORLD_W, 160, '#161c28')
    rodape(c, WORLD_W, 160)
    porta(c, 30, 160, false)
  },
  desenharFrente(c) {
    c.save()
    c.globalCompositeOperation = 'multiply'
    const g = c.createRadialGradient(192, 96, 30, 192, 96, 220)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.5, '#9aa2b6')
    g.addColorStop(1, '#3f4658')
    c.fillStyle = g
    c.fillRect(0, 0, WORLD_W, WORLD_H)
    c.restore()
  },
}
