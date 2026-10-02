/**
 * O rosto dos sustos, desenhado em resolução de tela e por cima de tudo —
 * inclusive das margens do quadro do jogo. Vem para cima de quem joga.
 *
 * - **retrato**: a sombra branca. Careca, branca, sem nada que seja do Liam.
 * - **espelho**: o reflexo do Liam, com o cabelo dele caindo na cara.
 *
 * `t` é o tempo desde o estouro. O primeiro instante é branco puro; depois o
 * rosto avança, treme, pisca em negativo, e no fim some de uma vez.
 */

/** Sorteio com semente: a forma do rosto é a mesma em todo quadro. */
function sorteio(semente: number): () => number {
  let s = semente >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** Quanto tempo o rosto fica na tela depois do estouro. */
export const DURACAO_SUSTO = 1.05

export function desenharSusto(
  c: CanvasRenderingContext2D, W: number, H: number, tipo: 'espelho' | 'retrato', t: number,
): void {
  c.save()
  c.fillStyle = '#000'
  c.fillRect(0, 0, W, H)
  // O primeiro instante: branco.
  if (t < 0.05) {
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, W, H)
    c.restore()
    return
  }
  const avanco = Math.min(1, (t - 0.05) / 0.16)
  const chega = 1 - Math.pow(1 - avanco, 3)
  // Ele chega perto e continua chegando; no fim, some para trás de uma vez.
  const some = t > DURACAO_SUSTO - 0.12 ? (t - (DURACAO_SUSTO - 0.12)) / 0.12 : 0
  const escala = (0.72 + chega * 0.58 + Math.max(0, t - 0.21) * 0.3) * (1 - some * 0.6)
  const forca = t < 0.5 ? 1 : 0.55
  const cx = W / 2 + (Math.random() - 0.5) * 22 * forca
  const cy = H * 0.56 + (Math.random() - 0.5) * 16 * forca
  const ry = H * 0.6 * escala
  const rx = ry * 0.74

  c.translate(cx, cy)
  // O fantasma vermelho e o azul, deslocados: a imagem não aguenta.
  c.save()
  c.globalAlpha = 0.35
  c.translate(-rx * 0.05, 0)
  silhueta(c, rx, ry, 'rgba(255,40,60,1)')
  c.translate(rx * 0.1, 0)
  silhueta(c, rx, ry, 'rgba(40,220,255,1)')
  c.restore()
  rosto(c, rx, ry, tipo, t)
  c.restore()

  // Pisca em negativo, um quadro ou dois.
  if ((t > 0.27 && t < 0.3) || (t > 0.58 && t < 0.6)) {
    c.save()
    c.globalCompositeOperation = 'difference'
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, W, H)
    c.restore()
  }
  // Grão, linhas de tela e o vermelho nas bordas.
  c.save()
  for (let i = 0; i < 900; i++) {
    c.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.25)'
    c.fillRect(Math.random() * W, Math.random() * H, 2, 2)
  }
  c.fillStyle = 'rgba(0,0,0,0.18)'
  for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1)
  const v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(90,0,8,0.75)')
  c.fillStyle = v
  c.fillRect(0, 0, W, H)
  if (some > 0) {
    c.fillStyle = `rgba(0,0,0,${Math.min(1, some * 1.2).toFixed(2)})`
    c.fillRect(0, 0, W, H)
  }
  c.restore()
}

/** Só o contorno da cabeça, numa cor: para o fantasma colorido. */
function silhueta(c: CanvasRenderingContext2D, rx: number, ry: number, cor: string): void {
  c.fillStyle = cor
  c.beginPath()
  c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  c.fill()
}

/** Um contorno torto: elipse com a borda mordida. */
function borda(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, r: () => number, morde = 0.14): void {
  c.beginPath()
  const n = 44
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = 1 + (r() - 0.5) * morde * 2
    const px = x + Math.cos(a) * rx * k
    const py = y + Math.sin(a) * ry * k
    if (i === 0) c.moveTo(px, py)
    else c.lineTo(px, py)
  }
  c.closePath()
}

function rosto(c: CanvasRenderingContext2D, rx: number, ry: number, tipo: 'espelho' | 'retrato', t: number): void {
  const r = sorteio(tipo === 'retrato' ? 7 : 13)
  const traco = Math.max(1, ry * 0.006)

  // O cabelo dele, atrás da cabeça (só no espelho).
  if (tipo === 'espelho') {
    c.fillStyle = '#07080c'
    c.beginPath()
    c.ellipse(0, -ry * 0.12, rx * 1.12, ry * 1.02, 0, Math.PI, 0)
    c.lineTo(rx * 1.1, ry * 0.5)
    c.lineTo(-rx * 1.1, ry * 0.5)
    c.closePath()
    c.fill()
  }

  // A pele: branca de cera, fria nas bordas.
  c.save()
  c.beginPath()
  c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  const pele = c.createRadialGradient(-rx * 0.2, -ry * 0.28, ry * 0.05, 0, 0, ry * 1.05)
  pele.addColorStop(0, tipo === 'retrato' ? '#fbfbfd' : '#efe6e0')
  pele.addColorStop(0.55, tipo === 'retrato' ? '#d6d9e2' : '#cbbdb6')
  pele.addColorStop(1, tipo === 'retrato' ? '#7f8597' : '#6e605c')
  c.fillStyle = pele
  c.fill()
  c.clip()
  // Manchas na pele.
  for (let i = 0; i < 70; i++) {
    c.fillStyle = `rgba(${90 + Math.floor(r() * 40)},${90 + Math.floor(r() * 30)},${110 + Math.floor(r() * 40)},${(0.04 + r() * 0.09).toFixed(3)})`
    c.beginPath()
    c.ellipse((r() - 0.5) * rx * 2, (r() - 0.5) * ry * 2, rx * (0.04 + r() * 0.14), ry * (0.03 + r() * 0.1), r() * 3, 0, Math.PI * 2)
    c.fill()
  }
  // Veias azuladas saindo das têmporas e do queixo.
  c.strokeStyle = 'rgba(70,84,150,0.32)'
  c.lineWidth = traco * 0.8
  for (let i = 0; i < 12; i++) {
    let x = (r() > 0.5 ? 1 : -1) * rx * (0.7 + r() * 0.3)
    let y = (r() - 0.3) * ry * 1.4
    c.beginPath()
    c.moveTo(x, y)
    for (let k = 0; k < 6; k++) {
      x += -Math.sign(x) * rx * (0.03 + r() * 0.06)
      y += (r() - 0.5) * ry * 0.12
      c.lineTo(x, y)
    }
    c.stroke()
  }
  // Rachaduras, como louça.
  c.strokeStyle = 'rgba(25,22,30,0.75)'
  c.lineWidth = traco
  for (let i = 0; i < 5; i++) {
    let x = (r() - 0.5) * rx * 1.2
    let y = -ry * (0.7 + r() * 0.3)
    c.beginPath()
    c.moveTo(x, y)
    for (let k = 0; k < 9; k++) {
      x += (r() - 0.5) * rx * 0.16
      y += ry * (0.05 + r() * 0.06)
      c.lineTo(x, y)
    }
    c.stroke()
  }
  // As órbitas: fundas, roxas em volta, mordidas na borda.
  for (const lado of [-1, 1]) {
    const ox = lado * rx * 0.36
    const oy = -ry * 0.12
    c.fillStyle = 'rgba(70,30,50,0.4)'
    borda(c, ox, oy, rx * 0.3, ry * 0.24, r, 0.1)
    c.fill()
    const fundo = c.createRadialGradient(ox, oy, 0, ox, oy, rx * 0.24)
    fundo.addColorStop(0, '#000000')
    fundo.addColorStop(0.75, '#050206')
    fundo.addColorStop(1, '#2a0a12')
    c.fillStyle = fundo
    borda(c, ox, oy, rx * 0.22, ry * 0.17, r, 0.16)
    c.fill()
    // A pupila: um ponto branco minúsculo, olhando para quem joga.
    const tr = (Math.random() - 0.5) * rx * 0.012
    c.fillStyle = '#ffffff'
    c.beginPath()
    c.arc(ox - lado * rx * 0.02 + tr, oy + ry * 0.01, Math.max(1.5, ry * 0.013), 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = 'rgba(200,20,30,0.55)'
    c.lineWidth = traco
    c.beginPath()
    c.arc(ox - lado * rx * 0.02, oy + ry * 0.01, Math.max(3, ry * 0.03), 0, Math.PI * 2)
    c.stroke()
    // Lágrimas pretas escorrendo.
    for (let k = 0; k < 3; k++) {
      const lx = ox + (r() - 0.5) * rx * 0.24
      const ly = oy + ry * 0.12
      const comp = ry * (0.25 + r() * 0.45) * Math.min(1, 0.6 + t * 0.8)
      const g = c.createLinearGradient(0, ly, 0, ly + comp)
      g.addColorStop(0, 'rgba(5,2,6,0.95)')
      g.addColorStop(1, 'rgba(5,2,6,0)')
      c.fillStyle = g
      c.fillRect(lx, ly, Math.max(2, ry * (0.008 + r() * 0.01)), comp)
    }
  }
  // O nariz: duas fendas.
  c.fillStyle = 'rgba(20,10,15,0.85)'
  for (const lado of [-1, 1]) {
    c.beginPath()
    c.ellipse(lado * rx * 0.07, ry * 0.15, rx * 0.025, ry * 0.035, lado * 0.4, 0, Math.PI * 2)
    c.fill()
  }
  // A boca: rasgada até perto das orelhas, aberta, com dentes demais.
  const by = ry * 0.43
  const larg = rx * 0.66
  const abre = ry * (0.16 + Math.min(1, t * 2) * 0.06)
  c.beginPath()
  c.moveTo(-larg - rx * 0.08, by - ry * 0.16)
  c.quadraticCurveTo(-larg * 0.5, by - abre * 0.55, 0, by - abre * 0.5)
  c.quadraticCurveTo(larg * 0.5, by - abre * 0.55, larg + rx * 0.08, by - ry * 0.16)
  c.quadraticCurveTo(larg * 0.6, by + abre * 0.9, 0, by + abre)
  c.quadraticCurveTo(-larg * 0.6, by + abre * 0.9, -larg - rx * 0.08, by - ry * 0.16)
  c.closePath()
  const boca = c.createRadialGradient(0, by, 0, 0, by, larg)
  boca.addColorStop(0, '#000000')
  boca.addColorStop(0.7, '#14030a')
  boca.addColorStop(1, '#4a0c18')
  c.fillStyle = boca
  c.fill()
  c.strokeStyle = 'rgba(90,20,32,0.9)'
  c.lineWidth = traco * 1.4
  c.stroke()
  c.save()
  c.clip()
  // Gengiva e as duas fileiras de dentes, tortos e desiguais.
  c.fillStyle = '#5a1020'
  c.fillRect(-larg, by - abre * 0.62, larg * 2, abre * 0.18)
  c.fillRect(-larg, by + abre * 0.72, larg * 2, abre * 0.3)
  const n = 22
  for (let i = 0; i < n; i++) {
    const x = -larg + (i / n) * larg * 2
    const w = (larg * 2) / n - Math.max(1, traco)
    const curva = 1 - Math.pow((x / larg), 2) * 0.5
    const alto = abre * (0.22 + r() * 0.2) * curva
    c.fillStyle = r() > 0.15 ? `rgb(${210 + Math.floor(r() * 30)},${200 + Math.floor(r() * 30)},${170 + Math.floor(r() * 40)})` : '#3a2a20'
    c.fillRect(x, by - abre * 0.52, w, alto)
    const baixo = abre * (0.18 + r() * 0.2) * curva
    c.fillRect(x + w * 0.3, by + abre * 0.74 - baixo, w, baixo)
  }
  c.restore()
  c.restore()

  // A franja dele, em mechas, caindo por cima da testa (só no espelho).
  if (tipo === 'espelho') {
    c.fillStyle = '#06070b'
    c.beginPath()
    c.ellipse(0, -ry * 0.62, rx * 0.98, ry * 0.4, 0, Math.PI, 0)
    c.fill()
    for (let i = 0; i < 16; i++) {
      const x = -rx * 0.9 + (i / 15) * rx * 1.8
      const comp = ry * (0.25 + r() * 0.35)
      c.beginPath()
      c.moveTo(x - rx * 0.07, -ry * 0.66)
      c.lineTo(x + rx * 0.07, -ry * 0.66)
      c.lineTo(x + (r() - 0.5) * rx * 0.08, -ry * 0.62 + comp)
      c.closePath()
      c.fill()
    }
  }
}
