import type { RGB } from './arte'
import { rgb, clarear, ret, sorteio } from './arte'

/**
 * As portas da casa, cada uma com a cara de quem mora atrás dela.
 *
 * Antes eram todas a mesma porta pintada de outra cor. Agora a porta já
 * conta quem é: a do Liam é arrumada demais (a plaquinha com o nome, o
 * desenho e a partitura presos com fita, nada torto); a da Lia é um
 * protesto (adesivo por cima de adesivo, a placa "BATE ANTES", o amassado
 * na altura do punho com fita por cima); a da cozinha tem o vidro fosco por
 * onde passam as sombras dos dois discutindo; a da sala é de vidro, para a
 * casa parecer aberta; a da costura é da mãe (fita métrica pendurada na
 * maçaneta, alfineteira, a plaquinha bordada); e a do fim é mais velha que
 * a casa, com lilás aparecendo por baixo da tinta.
 *
 * Todas têm o mesmo tamanho da porta comum (42 × 100, 2,10 m na escala da
 * casa), batente, maçaneta e a luz por baixo quando há alguém do outro lado.
 */

const LARG = 42

/** Batente e folha: a base de toda porta. Devolve o topo da folha. */
function folha(c: CanvasRenderingContext2D, x: number, chao: number, cor: RGB, batente: RGB, alt = 100): number {
  const y = chao - alt
  ret(c, x - LARG / 2 - 5, y - 5, LARG + 10, alt + 5, rgb(batente))
  ret(c, x - LARG / 2 - 5, y - 5, LARG + 10, 2, rgb(clarear(batente, 14)))
  ret(c, x - LARG / 2 - 5, y - 5, 2, alt + 5, rgb(clarear(batente, 8)))
  ret(c, x + LARG / 2 + 3, y - 5, 2, alt + 5, rgb(clarear(batente, -10)))
  ret(c, x - LARG / 2, y, LARG, alt, rgb(cor))
  // Sombra do batente sobre a folha, em cima e à direita
  ret(c, x - LARG / 2, y, LARG, 2, 'rgba(0,0,0,0.3)')
  ret(c, x + LARG / 2 - 2, y, 2, alt, 'rgba(0,0,0,0.22)')
  return y
}

/** Duas almofadas em relevo, como nas portas comuns. */
function almofadas(c: CanvasRenderingContext2D, x: number, y: number, alt: number, cor: RGB, topo = 0.38): void {
  const l = x - LARG / 2 + 5
  const w = LARG - 10
  const h1 = Math.round(alt * topo)
  const y2 = y + 6 + h1 + 5
  const h2 = alt - (y2 - y) - 7
  for (const [yy, hh] of [[y + 6, h1], [y2, h2]] as const) {
    ret(c, l, yy, w, hh, rgb(clarear(cor, -8)))
    ret(c, l, yy, w, 1, rgb(clarear(cor, 10)))
    ret(c, l, yy, 1, hh, rgb(clarear(cor, 6)))
    ret(c, l, yy + hh - 1, w, 1, rgb(clarear(cor, -18)))
    ret(c, l + w - 1, yy, 1, hh, rgb(clarear(cor, -14)))
  }
}

function macaneta(c: CanvasRenderingContext2D, x: number, y: number, alt: number, cor = '#b8964e'): void {
  const mx = x + LARG / 2 - 7
  const my = y + Math.round(alt * 0.52)
  ret(c, mx - 1, my - 3, 4, 9, 'rgba(0,0,0,0.25)')            // espelho da fechadura
  ret(c, mx - 1, my - 3, 3, 8, '#5a4a36')
  ret(c, mx, my, 3, 3, cor)
  ret(c, mx, my, 3, 1, '#ead08a')
  ret(c, mx, my + 4, 1, 2, '#141010')                         // buraco da chave
}

/** Luz por baixo: tem alguém do outro lado. */
function luzPorBaixo(c: CanvasRenderingContext2D, x: number, chao: number, cor: string, a: number): void {
  if (a <= 0) return
  ret(c, x - LARG / 2, chao - 2, LARG, 2, `rgba(${cor},${a})`)
}

/** Fita crepe segurando papel na porta. */
function fita(c: CanvasRenderingContext2D, x: number, y: number): void {
  ret(c, x, y, 4, 2, 'rgba(226,210,160,0.75)')
}

// --- Letras de pixel ----------------------------------------------------------

const GLIFOS: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  E: ['111', '100', '110', '100', '111'],
  I: ['111', '010', '010', '010', '111'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['110', '101', '101', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  '!': ['1', '1', '1', '0', '1'],
  '.': ['0', '0', '0', '0', '1'],
}

/** Escreve em letras de 3 × 5 pixels. Devolve a largura escrita. */
export function letreiro(c: CanvasRenderingContext2D, texto: string, x: number, y: number, cor: string, tremido = 0): number {
  let cx = Math.round(x)
  const r = sorteio(texto.length * 7 + Math.round(x))
  c.fillStyle = cor
  for (const ch of texto) {
    if (ch === ' ') {
      cx += 3
      continue
    }
    const g = GLIFOS[ch]
    if (!g) continue
    const dy = tremido > 0 ? Math.round((r() - 0.5) * tremido) : 0
    g.forEach((linha, j) => {
      for (let i = 0; i < linha.length; i++) if (linha[i] === '1') c.fillRect(cx + i, Math.round(y) + j + dy, 1, 1)
    })
    cx += (g[0]?.length ?? 3) + 1
  }
  return cx - Math.round(x) - 1
}

export function larguraLetreiro(texto: string): number {
  let w = 0
  for (const ch of texto) w += ch === ' ' ? 3 : (GLIFOS[ch]?.[0]?.length ?? 3) + 1
  return Math.max(0, w - 1)
}

// --- As portas ----------------------------------------------------------------

/**
 * A porta do quarto do Liam, vista do corredor. Arrumada: a plaquinha de
 * madeira com o nome, o desenho da casa com um cômodo a mais e a página de
 * partitura, os dois presos reto com fita. Embaixo, o rodapé da porta gasto
 * de tanto ele fechar com o pé, devagar, para não fazer barulho.
 */
export function portaLiam(c: CanvasRenderingContext2D, x: number, chao: number): void {
  const cor: RGB = [34, 44, 64]
  const y = folha(c, x, chao, cor, [24, 26, 36])
  almofadas(c, x, y, 100, cor)
  // A plaquinha: madeira clara, pendurada num barbante, letras pirogravadas.
  ret(c, x - 1, y + 9, 1, 4, 'rgba(220,210,190,0.5)')
  ret(c, x - 9, y + 13, 19, 9, '#9a7a52')
  ret(c, x - 9, y + 13, 19, 1, '#b8966a')
  ret(c, x - 9, y + 21, 19, 1, '#6a5236')
  letreiro(c, 'LIAM', x - 7, y + 15, '#3a2a1a')
  // O desenho da casa com o cômodo a mais
  ret(c, x - 12, y + 30, 14, 12, '#e4dccb')
  fita(c, x - 13, y + 29)
  fita(c, x - 1, y + 29)
  ret(c, x - 10, y + 36, 7, 5, '#3a5a8a')
  c.fillStyle = '#9a3a3a'
  c.beginPath()
  c.moveTo(x - 11, y + 36)
  c.lineTo(x - 6.5, y + 32)
  c.lineTo(x - 2, y + 36)
  c.fill()
  // O cômodo a mais, tracejado em verde, do lado de fora da casa
  for (const [dx, dy] of [[-2, 37], [0, 37], [0, 39], [-2, 40], [0, 41]] as const) ret(c, x + dx, y + dy, 1, 1, '#4a8a4a')
  // A página de partitura: cinco linhas, as notas do tema
  ret(c, x + 3, y + 33, 11, 14, '#ece6d6')
  fita(c, x + 6, y + 32)
  for (let i = 0; i < 5; i++) ret(c, x + 4, y + 36 + i * 2, 9, 1, 'rgba(40,40,50,0.45)')
  for (const [dx, dy] of [[5, 41], [7, 39], [9, 38], [11, 39]] as const) ret(c, x + dx, y + dy, 1, 1, '#1a1a22')
  // Uma estrelinha fosforescente, a única coisa fora do lugar
  ret(c, x + 13, y + 57, 1, 3, 'rgba(200,240,170,0.7)')
  ret(c, x + 12, y + 58, 3, 1, 'rgba(200,240,170,0.7)')
  macaneta(c, x, y, 100)
  // O rodapé da porta, gasto de fechar com o pé
  ret(c, x - LARG / 2 + 2, chao - 7, 14, 4, rgb(clarear(cor, 12)))
  ret(c, x - LARG / 2 + 4, chao - 6, 9, 1, rgb(clarear(cor, 22)))
}

/** A mesma porta, do lado de dentro do quarto: o casaco da escola no gancho e o mapa do céu. */
export function portaLiamDentro(c: CanvasRenderingContext2D, x: number, chao: number, luz: boolean): void {
  const cor: RGB = [36, 44, 64]
  const y = folha(c, x, chao, cor, [22, 24, 34])
  almofadas(c, x, y, 100, cor)
  // O mapa do céu, com as constelações ligadas a lápis
  ret(c, x - 14, y + 10, 24, 30, '#141c34')
  ret(c, x - 14, y + 10, 24, 1, '#2a3454')
  const r = sorteio(41)
  for (let i = 0; i < 16; i++) ret(c, x - 13 + Math.floor(r() * 22), y + 12 + Math.floor(r() * 26), 1, 1, 'rgba(230,236,255,0.8)')
  c.strokeStyle = 'rgba(200,210,240,0.35)'
  c.lineWidth = 0.6
  c.beginPath()
  c.moveTo(x - 10, y + 18)
  c.lineTo(x - 4, y + 22)
  c.lineTo(x + 2, y + 17)
  c.lineTo(x + 6, y + 26)
  c.stroke()
  fita(c, x - 15, y + 9)
  fita(c, x + 7, y + 9)
  // O gancho e o casaco da escola, com o crachá
  ret(c, x - 3, y + 46, 6, 2, '#8a8a90')
  c.fillStyle = '#2a3044'
  c.beginPath()
  c.moveTo(x - 7, y + 48)
  c.lineTo(x + 7, y + 48)
  c.lineTo(x + 10, y + 82)
  c.lineTo(x - 10, y + 82)
  c.closePath()
  c.fill()
  ret(c, x - 1, y + 48, 2, 32, '#1e2434')
  ret(c, x + 3, y + 58, 5, 6, '#d8d4c8')
  ret(c, x + 4, y + 60, 3, 1, '#3a5a8a')
  macaneta(c, x, y, 100)
  luzPorBaixo(c, x, chao, '236,196,132', luz ? 0.34 : 0)
}

/**
 * A porta da Lia, vista do corredor. Adesivos por cima de adesivos, a placa
 * escrita a marcador vermelho, um amassado na altura do punho com fita
 * isolante em X por cima, e o rasgo de um adesivo que alguém arrancou.
 */
export function portaLia(c: CanvasRenderingContext2D, x: number, chao: number, luz: boolean): void {
  const cor: RGB = [52, 30, 42]
  const y = folha(c, x, chao, cor, [30, 22, 28])
  almofadas(c, x, y, 100, cor, 0.42)
  // A placa: papelão com fita, marcador vermelho, letra tremida de raiva.
  ret(c, x - 15, y + 10, 30, 12, '#d8ccb4')
  ret(c, x - 15, y + 21, 30, 1, '#a8987e')
  fita(c, x - 16, y + 9)
  fita(c, x + 12, y + 9)
  letreiro(c, 'BATE', x - larguraLetreiro('BATE') / 2, y + 11, '#b02a34', 1)
  letreiro(c, 'ANTES!', x - larguraLetreiro('ANTES!') / 2, y + 17, '#b02a34')
  // Adesivos: de banda, uma caveira, um raio, um coração riscado.
  const adesivos: [number, number, number, number, string][] = [
    [-16, 30, 9, 6, '#e0c060'], [-5, 27, 7, 7, '#2a2a2a'], [5, 31, 10, 5, '#5ab0c8'],
    [-13, 42, 6, 8, '#c85a6a'], [8, 44, 8, 8, '#e8e4dc'], [-2, 52, 9, 4, '#8a5ac8'],
    [-16, 66, 8, 5, '#3a8a5a'], [10, 70, 6, 6, '#e07a3a'],
  ]
  for (const [dx, dy, w, h, cr] of adesivos) {
    ret(c, x + dx + 1, y + dy + 1, w, h, 'rgba(0,0,0,0.3)')
    ret(c, x + dx, y + dy, w, h, cr)
  }
  // A caveira, em cima do adesivo preto
  ret(c, x - 4, y + 28, 5, 4, '#e8e4dc')
  ret(c, x - 3, y + 29, 1, 1, '#1a1a1a')
  ret(c, x - 1, y + 29, 1, 1, '#1a1a1a')
  ret(c, x - 3, y + 32, 3, 1, '#e8e4dc')
  // O raio no adesivo branco
  ret(c, x + 12, y + 45, 1, 3, '#c83a3a')
  ret(c, x + 11, y + 47, 2, 1, '#c83a3a')
  ret(c, x + 10, y + 48, 1, 3, '#c83a3a')
  // O coração riscado no adesivo rosa
  ret(c, x - 12, y + 44, 2, 2, '#f0e0e4')
  ret(c, x - 10, y + 44, 2, 2, '#f0e0e4')
  ret(c, x - 11, y + 46, 2, 2, '#f0e0e4')
  ret(c, x - 13, y + 48, 6, 1, '#1a1a1a')
  // O que sobrou do adesivo arrancado
  ret(c, x + 2, y + 60, 7, 3, 'rgba(230,226,214,0.55)')
  ret(c, x + 3, y + 59, 2, 1, 'rgba(230,226,214,0.4)')
  // O amassado na altura do punho, com fita isolante em X
  ret(c, x - 6, y + 56, 7, 6, rgb(clarear(cor, -14)))
  ret(c, x - 5, y + 57, 5, 1, rgb(clarear(cor, 10)))
  for (let i = 0; i < 8; i++) {
    ret(c, x - 7 + i, y + 55 + i, 1, 1, '#141418')
    ret(c, x - 7 + i, y + 62 - i, 1, 1, '#141418')
  }
  // A corrente de alfinetes pendurada na maçaneta
  macaneta(c, x, y, 100, '#9a9aa4')
  for (let i = 0; i < 4; i++) ret(c, x + LARG / 2 - 6, y + 56 + i * 2, 1, 1, '#c8c8d0')
  luzPorBaixo(c, x, chao, '255,160,180', luz ? 0.4 : 0)
}

/** A porta da Lia por dentro: o pôster rasgado, o moletom no gancho, a lista de músicas. */
export function portaLiaDentro(c: CanvasRenderingContext2D, x: number, chao: number, luz: boolean): void {
  const cor: RGB = [52, 30, 42]
  const y = folha(c, x, chao, cor, [30, 22, 28])
  almofadas(c, x, y, 100, cor, 0.42)
  // O pôster: uma banda em alto contraste, rasgado num canto
  ret(c, x - 15, y + 8, 26, 34, '#e8e4dc')
  ret(c, x - 13, y + 10, 22, 22, '#1a1a1a')
  ret(c, x - 6, y + 16, 8, 10, '#c83a3a')
  ret(c, x - 4, y + 13, 4, 4, '#e8e4dc')
  letreiro(c, 'NOS', x - 8, y + 34, '#1a1a1a')
  ret(c, x + 6, y + 36, 5, 6, rgb(cor))
  fita(c, x - 16, y + 7)
  // A lista de músicas a caneta, colada embaixo
  ret(c, x - 12, y + 48, 12, 14, '#f0ece0')
  for (let i = 0; i < 5; i++) ret(c, x - 11, y + 50 + i * 2.4, 6 + (i % 3) * 2, 1, 'rgba(60,40,120,0.6)')
  // O moletom no gancho
  ret(c, x + 6, y + 46, 5, 2, '#8a8a90')
  c.fillStyle = '#3a3a48'
  c.beginPath()
  c.moveTo(x + 4, y + 48)
  c.lineTo(x + 13, y + 48)
  c.lineTo(x + 15, y + 74)
  c.lineTo(x + 2, y + 74)
  c.closePath()
  c.fill()
  ret(c, x + 7, y + 60, 4, 3, '#c85a6a')
  macaneta(c, x, y, 100, '#9a9aa4')
  luzPorBaixo(c, x, chao, '236,196,132', luz ? 0.3 : 0)
}

/**
 * A porta da cozinha. Madeira mais clara, com um vidro fosco na metade de
 * cima e a chapa de empurrar gasta. Antes do jantar, a luz da cozinha passa
 * pelo vidro — e as sombras dos dois também, indo e vindo, uma delas com o
 * braço levantado de vez em quando.
 */
export function portaCozinha(c: CanvasRenderingContext2D, x: number, chao: number, t: number, acesa: boolean): void {
  const cor: RGB = [70, 56, 46]
  const y = folha(c, x, chao, cor, [40, 32, 28])
  // A metade de baixo: uma almofada só, larga
  ret(c, x - 16, y + 52, 32, 40, rgb(clarear(cor, -8)))
  ret(c, x - 16, y + 52, 32, 1, rgb(clarear(cor, 10)))
  ret(c, x - 16, y + 91, 32, 1, rgb(clarear(cor, -18)))
  // O vidro fosco, com caixilho em cruz
  const vx = x - 15
  const vy = y + 8
  const vw = 30
  const vh = 38
  ret(c, vx - 2, vy - 2, vw + 4, vh + 4, rgb(clarear(cor, -16)))
  if (acesa) {
    const g = c.createLinearGradient(0, vy, 0, vy + vh)
    g.addColorStop(0, 'rgb(214,170,112)')
    g.addColorStop(1, 'rgb(170,120,80)')
    c.fillStyle = g
  } else {
    c.fillStyle = 'rgb(28,30,38)'
  }
  c.fillRect(vx, vy, vw, vh)
  // O fosco: pontilhado
  const r = sorteio(9)
  for (let i = 0; i < 60; i++) ret(c, vx + Math.floor(r() * vw), vy + Math.floor(r() * vh), 1, 1, acesa ? 'rgba(255,236,200,0.35)' : 'rgba(120,130,150,0.18)')
  if (acesa) {
    // As duas sombras do outro lado do vidro, borradas pelo fosco.
    c.save()
    c.beginPath()
    c.rect(vx, vy, vw, vh)
    c.clip()
    const ela = vx + 9 + Math.sin(t * 0.7) * 3
    const ele = vx + 21 + Math.sin(t * 0.45 + 1) * 4
    c.fillStyle = 'rgba(60,34,22,0.45)'
    c.fillRect(Math.round(ela) - 2, vy + 10, 5, 30)
    c.fillRect(Math.round(ela) - 1, vy + 6, 3, 4)
    c.fillStyle = 'rgba(40,22,14,0.55)'
    c.fillRect(Math.round(ele) - 3, vy + 6, 6, 34)
    c.fillRect(Math.round(ele) - 2, vy + 2, 4, 4)
    // O braço dele sobe, de vez em quando
    if (Math.sin(t * 1.3) > 0.82) c.fillRect(Math.round(ele) + 2, vy + 2, 2, 9)
    c.restore()
  }
  ret(c, vx + vw / 2 - 1, vy, 2, vh, rgb(clarear(cor, -10)))
  ret(c, vx, vy + vh / 2 - 1, vw, 2, rgb(clarear(cor, -10)))
  // Reflexo no vidro
  for (let i = 0; i < 6; i++) ret(c, vx + 2 + i, vy + 2 + i, 1, 1, 'rgba(255,255,255,0.18)')
  // A chapa de empurrar, de latão, gasta no meio
  ret(c, x + 9, y + 50, 5, 12, '#a88a52')
  ret(c, x + 10, y + 54, 3, 4, '#c8aa6a')
  macaneta(c, x, y, 100)
  luzPorBaixo(c, x, chao, '236,176,112', acesa ? 0.36 : 0)
}

/**
 * A porta entre a sala e o corredor: de vidro, em quadradinhos, para a casa
 * parecer aberta. Do outro lado, a luz do cômodo vizinho.
 */
export function portaDeVidro(c: CanvasRenderingContext2D, x: number, chao: number, cor: RGB, luzDoOutroLado: string, a: number): void {
  const y = folha(c, x, chao, cor, clarear(cor, -14))
  // Seis vidros em duas colunas, na metade de cima e um pouco mais
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 2; i++) {
      const gx = x - 15 + i * 16
      const gy = y + 6 + j * 15
      ret(c, gx - 1, gy - 1, 14, 14, rgb(clarear(cor, -12)))
      ret(c, gx, gy, 12, 12, `rgba(${luzDoOutroLado},${0.18 + a * 0.4})`)
      ret(c, gx, gy, 12, 12, 'rgba(10,12,20,0.35)')
      ret(c, gx + 1, gy + 1, 3, 1, 'rgba(255,255,255,0.22)')
      ret(c, gx + 1, gy + 1, 1, 3, 'rgba(255,255,255,0.16)')
    }
  }
  // Embaixo, uma almofada de madeira
  ret(c, x - 16, y + 70, 32, 24, rgb(clarear(cor, -8)))
  ret(c, x - 16, y + 70, 32, 1, rgb(clarear(cor, 10)))
  macaneta(c, x, y, 100)
  luzPorBaixo(c, x, chao, luzDoOutroLado, 0.18 + a * 0.2)
}

/**
 * A porta da costura, vista da sala. Pintada de verde-acinzentado, a única
 * porta da casa que alguém escolheu a cor. A fita métrica pendurada na
 * maçaneta, a alfineteira de tomate presa com um prego, e a plaquinha
 * bordada num bastidor: "COSTURA".
 */
export function portaCostura(c: CanvasRenderingContext2D, x: number, chao: number, k: number): void {
  const cor: RGB = [Math.round(58 + k * 18), Math.round(66 + k * 10), Math.round(60 + k * 4)]
  const y = folha(c, x, chao, cor, [34, 32, 34])
  almofadas(c, x, y, 100, cor)
  // O bastidor bordado, pendurado numa fita
  ret(c, x - 1, y + 6, 1, 6, '#c84a5a')
  c.fillStyle = '#9a7a52'
  c.beginPath()
  c.ellipse(x, y + 20, 17, 9, 0, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#ece6d6'
  c.beginPath()
  c.ellipse(x, y + 20, 15.5, 7.5, 0, 0, Math.PI * 2)
  c.fill()
  letreiro(c, 'COSTURA', x - larguraLetreiro('COSTURA') / 2, y + 18, '#c87a3a')
  for (let i = -6; i <= 6; i += 3) ret(c, x + i, y + 25, 1, 1, '#6a8a5a')
  // A alfineteira de tomate, com os alfinetes espetados
  c.fillStyle = '#b83a3a'
  c.beginPath()
  c.ellipse(x - 11, y + 44, 4, 3, 0, 0, Math.PI * 2)
  c.fill()
  ret(c, x - 12, y + 40, 2, 1, '#3a6a3a')
  for (const [dx, dy] of [[-13, 41], [-10, 42], [-9, 40]] as const) {
    ret(c, x + dx, y + dy - 2, 1, 2, '#d8d8e0')
    ret(c, x + dx, y + dy - 3, 1, 1, '#e0c060')
  }
  macaneta(c, x, y, 100)
  // A fita métrica pendurada na maçaneta, até quase o chão
  const mx = x + LARG / 2 - 6
  const my = y + 53
  ret(c, mx, my, 2, 30, '#e8d27a')
  ret(c, mx - 2, my + 30, 2, 12, '#e8d27a')
  for (let i = 0; i < 30; i += 3) ret(c, mx, my + i, 1, 1, '#3a3a3a')
  luzPorBaixo(c, x, chao, '255,214,150', 0.4)
}

/** A porta da costura por dentro: o molde de papel preso com alfinete e o calendário de entregas. */
export function portaCosturaDentro(c: CanvasRenderingContext2D, x: number, chao: number): void {
  const cor: RGB = [70, 72, 62]
  const y = folha(c, x, chao, cor, [36, 32, 34])
  almofadas(c, x, y, 100, cor)
  // Um molde de papel pardo, de manga, preso com alfinetes
  c.fillStyle = '#c8a878'
  c.beginPath()
  c.moveTo(x - 14, y + 12)
  c.lineTo(x + 2, y + 10)
  c.lineTo(x + 6, y + 40)
  c.lineTo(x - 12, y + 42)
  c.closePath()
  c.fill()
  c.strokeStyle = 'rgba(80,60,40,0.6)'
  c.lineWidth = 0.6
  c.setLineDash([1.5, 1.5])
  c.beginPath()
  c.moveTo(x - 10, y + 16)
  c.lineTo(x + 1, y + 37)
  c.stroke()
  c.setLineDash([])
  for (const [dx, dy] of [[-12, 13], [1, 11], [4, 38]] as const) ret(c, x + dx, y + dy, 1, 2, '#e0e0e8')
  // O calendário de entregas, com dias riscados
  ret(c, x + 3, y + 48, 12, 14, '#f0ece0')
  ret(c, x + 3, y + 48, 12, 3, '#b83a3a')
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
    ret(c, x + 4 + i * 3, y + 53 + j * 3, 1, 1, i + j * 4 < 7 ? '#3a3a3a' : 'rgba(60,60,60,0.35)')
  }
  macaneta(c, x, y, 100)
}

/**
 * A porta que não deveria existir, no fim do corredor. Mais alta, mais
 * velha que a casa: almofadas entalhadas, a tinta cinza descascando e, por
 * baixo, lilás. A plaquinha de latão com o nome foi lixada até sobrar o
 * brilho. Não tem buraco de fechadura.
 */
export function portaDoFim(c: CanvasRenderingContext2D, x: number, chao: number, sinal: number, t: number): void {
  const alt = 108
  const cor: RGB = [58, 56, 66]
  const y = folha(c, x, chao, cor, [34, 30, 38], alt)
  // Almofadas entalhadas: três, a de cima em arco
  ret(c, x - 16, y + 8, 32, 26, rgb(clarear(cor, -9)))
  c.fillStyle = rgb(clarear(cor, -9))
  c.beginPath()
  c.ellipse(x, y + 10, 16, 6, 0, Math.PI, 0)
  c.fill()
  ret(c, x - 16, y + 40, 14, 58, rgb(clarear(cor, -9)))
  ret(c, x + 2, y + 40, 14, 58, rgb(clarear(cor, -9)))
  for (const [ax, ay, aw, ah] of [[-16, 8, 32, 26], [-16, 40, 14, 58], [2, 40, 14, 58]] as const) {
    ret(c, x + ax, y + ay, aw, 1, rgb(clarear(cor, 12)))
    ret(c, x + ax, y + ay + ah - 1, aw, 1, rgb(clarear(cor, -20)))
  }
  // A tinta cinza descascando: por baixo, lilás.
  const r = sorteio(77)
  for (let i = 0; i < 18; i++) {
    const px = x - 19 + Math.floor(r() * 38)
    const py = y + 4 + Math.floor(r() * (alt - 10))
    const w = 1 + Math.floor(r() * 3)
    ret(c, px, py, w, 1 + Math.floor(r() * 2), 'rgba(164,138,206,0.75)')
  }
  // A plaquinha lixada: só o brilho do latão e dois parafusos
  ret(c, x - 7, y + 36, 14, 4, '#8a7a52')
  ret(c, x - 6, y + 37, 12, 1, '#b8a46e')
  ret(c, x - 7, y + 37, 1, 1, '#3a3020')
  ret(c, x + 6, y + 37, 1, 1, '#3a3020')
  // Maçaneta antiga de louça, sem fechadura nenhuma
  ret(c, x + LARG / 2 - 8, y + Math.round(alt * 0.52), 4, 4, '#d8d0c0')
  ret(c, x + LARG / 2 - 8, y + Math.round(alt * 0.52), 4, 1, '#f0ece0')
  // Luz fria por baixo, que respira. Quando alguém está do outro lado, sobe.
  const a = 0.1 + Math.sin(t * 0.8) * 0.04 + sinal * 0.5
  ret(c, x - 15, chao - 2, 30, 2, `rgba(196,208,255,${a})`)
  // O desenho de criança na altura dos olhos de Liam: a casa, com a porta roxa.
  const dy = chao - 46
  ret(c, x - 7, dy, 14, 15, 'rgba(214,206,186,0.85)')
  fita(c, x - 8, dy - 1)
  fita(c, x + 5, dy - 1)
  ret(c, x - 5, dy + 7, 10, 6, 'rgba(160,60,60,0.6)')
  c.fillStyle = 'rgba(160,60,60,0.6)'
  c.beginPath()
  c.moveTo(x - 6, dy + 7)
  c.lineTo(x, dy + 2)
  c.lineTo(x + 6, dy + 7)
  c.fill()
  ret(c, x + 1, dy + 9, 2, 4, 'rgba(150,110,210,0.9)')
  ret(c, x - 4, dy + 9, 2, 2, 'rgba(60,80,140,0.8)')
}
