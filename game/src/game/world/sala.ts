import { WORLD_W, WORLD_H } from '../../engine/constants'

/**
 * A sala do prólogo.
 *
 * É o único ambiente quente da obra, então tudo aqui existe para contrastar
 * com a casa fria do resto: madeira, tecido, retratos na parede, uma luz só.
 * O desenho é dividido em fundo e frente para as figuras ficarem no meio —
 * atrás do braço do sofá, na frente do encosto.
 */

export const CHAO_Y = 150
/**
 * Altura do assento. É aqui que as figuras sentadas se apoiam, não no chão —
 * senão o corpo inteiro fica escondido atrás do sofá.
 */
export const ASSENTO_Y = 130
export const ABAJUR = { x: 286, y: 62 }

/** Interpola entre a versão fria e a quente conforme o calor da cena. */
function mix(frio: [number, number, number], quente: [number, number, number], k: number): string {
  const r = Math.round(frio[0] + (quente[0] - frio[0]) * k)
  const g = Math.round(frio[1] + (quente[1] - frio[1]) * k)
  const b = Math.round(frio[2] + (quente[2] - frio[2]) * k)
  return `rgb(${r},${g},${b})`
}

export function drawSalaFundo(c: CanvasRenderingContext2D, k: number): void {
  // Parede, com lambri na parte de baixo
  c.fillStyle = mix([20, 25, 38], [42, 31, 36], k)
  c.fillRect(0, 0, WORLD_W, CHAO_Y)
  c.fillStyle = mix([16, 20, 31], [34, 25, 29], k)
  c.fillRect(0, 104, WORLD_W, CHAO_Y - 104)
  c.fillStyle = mix([28, 34, 50], [56, 41, 46], k)
  c.fillRect(0, 102, WORLD_W, 2)

  // Papel de parede: listras verticais quase imperceptíveis
  c.fillStyle = 'rgba(255,255,255,0.016)'
  for (let x = 6; x < WORLD_W; x += 13) c.fillRect(x, 0, 1, 102)

  drawJanela(c, k)
  drawRetratos(c, k)
  drawEstante(c, k)

  // Chão de tábuas
  c.fillStyle = mix([24, 29, 42], [47, 34, 36], k)
  c.fillRect(0, CHAO_Y, WORLD_W, WORLD_H - CHAO_Y)
  c.fillStyle = 'rgba(0,0,0,0.14)'
  for (let y = CHAO_Y + 9; y < WORLD_H; y += 10) c.fillRect(0, y, WORLD_W, 1)
  c.fillStyle = 'rgba(0,0,0,0.3)'
  c.fillRect(0, CHAO_Y, WORLD_W, 2)

  drawTapete(c, k)
  drawAbajur(c, k)
  drawSofaFundo(c, k)
}

/** O que fica na frente das figuras. */
export function drawSalaFrente(c: CanvasRenderingContext2D, k: number): void {
  drawSofaFrente(c, k)
  drawMesinha(c, k)
  drawBatente(c)
}

function drawJanela(c: CanvasRenderingContext2D, k: number): void {
  const x = 38
  const y = 24
  const w = 68
  const h = 62
  c.fillStyle = mix([34, 41, 60], [64, 47, 52], k)
  c.fillRect(x - 4, y - 4, w + 8, h + 8)
  // Noite lá fora: nunca é dia nesta casa
  const g = c.createLinearGradient(0, y, 0, y + h)
  g.addColorStop(0, '#0b1020')
  g.addColorStop(1, '#141a2c')
  c.fillStyle = g
  c.fillRect(x, y, w, h)
  c.fillStyle = 'rgba(180,200,235,0.13)'
  c.fillRect(x + 6, y + 40, 12, 3)
  c.fillRect(x + 44, y + 46, 16, 3)
  c.fillStyle = 'rgba(180,200,235,0.07)'
  c.fillRect(x + 22, y + 34, 5, 5)
  // Caixilho
  c.fillStyle = mix([24, 30, 45], [46, 34, 38], k)
  c.fillRect(x + w / 2 - 1, y, 2, h)
  c.fillRect(x, y + h / 2 - 1, w, 2)
  // Cortinas
  c.fillStyle = mix([30, 37, 54], [58, 42, 46], k)
  c.fillRect(x - 10, y - 6, 12, h + 10)
  c.fillRect(x + w - 2, y - 6, 12, h + 10)
  c.fillStyle = 'rgba(0,0,0,0.2)'
  c.fillRect(x - 6, y - 6, 1, h + 10)
  c.fillRect(x + w + 4, y - 6, 1, h + 10)
}

/** Retratos de família. Três, e um deles com uma pessoa a menos. */
function drawRetratos(c: CanvasRenderingContext2D, k: number): void {
  const quadros = [
    { x: 150, y: 28, w: 28, h: 22, figuras: 4 },
    { x: 186, y: 34, w: 22, h: 18, figuras: 2 },
    { x: 158, y: 58, w: 24, h: 20, figuras: 3 },
  ]
  for (const q of quadros) {
    c.fillStyle = mix([40, 48, 68], [74, 54, 52], k)
    c.fillRect(q.x - 2, q.y - 2, q.w + 4, q.h + 4)
    c.fillStyle = mix([14, 18, 28], [28, 21, 24], k)
    c.fillRect(q.x, q.y, q.w, q.h)
    // Vultos dentro do retrato
    const passo = q.w / (q.figuras + 1)
    for (let i = 1; i <= q.figuras; i++) {
      c.fillStyle = 'rgba(190,200,220,0.2)'
      const fx = q.x + passo * i
      c.fillRect(fx - 2, q.y + q.h - 11, 4, 8)
      c.fillRect(fx - 2, q.y + q.h - 15, 4, 4)
    }
    c.fillStyle = 'rgba(255,255,255,0.05)'
    c.fillRect(q.x, q.y, q.w, 1)
  }
}

function drawEstante(c: CanvasRenderingContext2D, k: number): void {
  const x = 318
  const y = 96
  c.fillStyle = mix([30, 37, 54], [58, 42, 45], k)
  c.fillRect(x, y, 54, CHAO_Y - y)
  c.fillStyle = mix([22, 28, 42], [44, 32, 35], k)
  c.fillRect(x + 2, y + 2, 50, 20)
  c.fillRect(x + 2, y + 26, 50, 20)
  // Livros
  const cores = ['#5a4740', '#3f4a5e', '#6b5340', '#454f66', '#5d4348']
  for (let i = 0; i < 9; i++) {
    c.fillStyle = cores[i % cores.length] ?? '#4a4a4a'
    c.fillRect(x + 4 + i * 5, y + 5 + (i % 3), 4, 17 - (i % 3))
  }
  for (let i = 0; i < 6; i++) {
    c.fillStyle = cores[(i + 2) % cores.length] ?? '#4a4a4a'
    c.fillRect(x + 5 + i * 5, y + 29, 4, 17)
  }
}

function drawTapete(c: CanvasRenderingContext2D, k: number): void {
  const x = 96
  const y = CHAO_Y + 2
  const w = 200
  const h = 50
  c.fillStyle = mix([28, 34, 48], [58, 38, 40], k)
  c.fillRect(x, y, w, h)
  c.fillStyle = mix([33, 40, 56], [68, 45, 46], k)
  c.fillRect(x + 5, y + 4, w - 10, h - 8)
  c.fillStyle = 'rgba(0,0,0,0.18)'
  c.fillRect(x + 12, y + 10, w - 24, 1)
  c.fillRect(x + 12, y + h - 12, w - 24, 1)
  // Franjas
  c.fillStyle = mix([36, 43, 60], [74, 50, 50], k)
  for (let i = 0; i < w; i += 6) {
    c.fillRect(x + i, y - 2, 3, 2)
    c.fillRect(x + i, y + h, 3, 2)
  }
}

function drawAbajur(c: CanvasRenderingContext2D, k: number): void {
  const { x } = ABAJUR
  c.fillStyle = mix([38, 46, 64], [70, 52, 50], k)
  c.fillRect(x - 1, 78, 3, CHAO_Y - 78)          // haste
  c.fillRect(x - 9, CHAO_Y - 3, 19, 4)           // base
  // Cúpula trapezoidal
  c.fillStyle = mix([58, 68, 92], [122, 96, 72], k)
  for (let i = 0; i < 16; i++) {
    const meio = 8 + Math.round(i * 0.55)
    c.fillRect(x - meio, 62 + i, meio * 2, 1)
  }
  c.fillStyle = `rgba(255,236,196,${0.45 + k * 0.5})`
  c.fillRect(x - 14, 77, 28, 2)
}

function drawSofaFundo(c: CanvasRenderingContext2D, k: number): void {
  const x = 108
  const larg = 150
  // Encosto baixo o bastante para as cabeças passarem por cima dele.
  c.fillStyle = mix([34, 41, 58], [66, 46, 48], k)
  c.fillRect(x, 108, larg, 22)
  c.fillStyle = mix([40, 48, 68], [78, 55, 55], k)
  c.fillRect(x + 3, 110, larg - 6, 8)
  c.fillStyle = 'rgba(0,0,0,0.2)'
  c.fillRect(x + larg / 2, 110, 1, 20)
}

function drawSofaFrente(c: CanvasRenderingContext2D, k: number): void {
  const x = 108
  const larg = 150
  // Assento, desenhado depois das figuras: esconde as pernas delas.
  c.fillStyle = mix([37, 45, 63], [72, 51, 51], k)
  c.fillRect(x, ASSENTO_Y, larg, 20)
  c.fillStyle = mix([44, 53, 74], [84, 60, 59], k)
  c.fillRect(x, ASSENTO_Y, larg, 3)
  c.fillStyle = 'rgba(0,0,0,0.22)'
  c.fillRect(x, CHAO_Y - 3, larg, 3)
  c.fillRect(x + larg / 2, ASSENTO_Y + 3, 1, 17)
  // Braços
  c.fillStyle = mix([42, 50, 70], [82, 58, 57], k)
  c.fillRect(x - 10, 116, 14, 34)
  c.fillRect(x + larg - 4, 116, 14, 34)
  c.fillStyle = mix([50, 59, 82], [96, 68, 64], k)
  c.fillRect(x - 10, 116, 14, 4)
  c.fillRect(x + larg - 4, 116, 14, 4)
  // Pés
  c.fillStyle = mix([22, 27, 40], [42, 30, 32], k)
  c.fillRect(x - 6, CHAO_Y, 4, 4)
  c.fillRect(x + larg + 2, CHAO_Y, 4, 4)
}

function drawMesinha(c: CanvasRenderingContext2D, k: number): void {
  const x = 140
  const y = 170
  c.fillStyle = mix([30, 37, 52], [60, 42, 42], k)
  c.fillRect(x, y, 88, 7)
  c.fillStyle = mix([36, 44, 62], [74, 52, 50], k)
  c.fillRect(x, y, 88, 2)
  c.fillStyle = mix([20, 25, 37], [40, 28, 30], k)
  c.fillRect(x + 5, y + 7, 4, 12)
  c.fillRect(x + 79, y + 7, 4, 12)
  // Duas canecas e um papel: alguém estava aqui antes
  c.fillStyle = mix([70, 80, 104], [138, 110, 92], k)
  c.fillRect(x + 18, y - 6, 7, 7)
  c.fillRect(x + 30, y - 5, 6, 6)
  c.fillStyle = 'rgba(214,206,186,0.5)'
  c.fillRect(x + 52, y - 2, 16, 3)
}

/** Batente em primeiro plano: enquadra a cena e dá profundidade. */
function drawBatente(c: CanvasRenderingContext2D): void {
  c.fillStyle = '#04060a'
  c.fillRect(0, 0, 18, WORLD_H)
  c.fillRect(WORLD_W - 18, 0, 18, WORLD_H)
  c.fillRect(0, 0, WORLD_W, 8)
  c.fillStyle = 'rgba(0,0,0,0.5)'
  c.fillRect(18, 0, 5, WORLD_H)
  c.fillRect(WORLD_W - 23, 0, 5, WORLD_H)
  c.fillRect(0, 8, WORLD_W, 4)
}

/** Halo do abajur. Separado para poder ser somado por cima das figuras. */
export function drawLuzSala(c: CanvasRenderingContext2D, k: number, t: number): void {
  const bruxo = 0.96 + Math.sin(t * 1.7) * 0.025 + Math.sin(t * 6.3) * 0.012
  c.save()
  c.globalCompositeOperation = 'multiply'
  const esc = c.createRadialGradient(ABAJUR.x, ABAJUR.y + 30, 24, ABAJUR.x, ABAJUR.y + 30, 250)
  esc.addColorStop(0, '#ffffff')
  esc.addColorStop(0.45, mix([150, 158, 178], [196, 170, 150], k))
  esc.addColorStop(1, mix([58, 64, 80], [74, 56, 56], k))
  c.fillStyle = esc
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  c.restore()

  c.save()
  c.globalCompositeOperation = 'lighter'
  const g = c.createRadialGradient(ABAJUR.x, ABAJUR.y + 12, 3, ABAJUR.x, ABAJUR.y + 12, 170)
  g.addColorStop(0, `rgba(255,224,176,${(0.1 + k * 0.3) * bruxo})`)
  g.addColorStop(0.35, `rgba(232,164,104,${(0.04 + k * 0.12) * bruxo})`)
  g.addColorStop(1, 'rgba(232,164,104,0)')
  c.fillStyle = g
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  c.restore()
}
