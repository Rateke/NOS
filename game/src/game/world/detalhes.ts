import type { RGB } from './arte'
import { rgb, clarear, ret } from './arte'

/**
 * Os detalhes da casa: as pequenas coisas que fazem um cômodo parecer
 * habitado. Cada uma é desenhada à mão em pixels, com luz de um lado e
 * sombra do outro, como a cozinha.
 *
 * Algumas contam história sem dizer nada: o relógio da sala parado nas dez e
 * quarenta, o calendário com a terça circulada, os sapatos alinhados com o
 * bico para fora — e o par da Lia, torto.
 */

/** Interpola entre a versão fria (noite) e a quente (o prólogo). */
export function mistura(frio: RGB, quente: RGB, k: number): RGB {
  return [
    Math.round(frio[0] + (quente[0] - frio[0]) * k),
    Math.round(frio[1] + (quente[1] - frio[1]) * k),
    Math.round(frio[2] + (quente[2] - frio[2]) * k),
  ]
}

/** Sanca de gesso no alto da parede, com dentículos. */
export function sanca(c: CanvasRenderingContext2D, x0: number, x1: number, parede: RGB): void {
  const claro = clarear(parede, 18)
  ret(c, x0, 0, x1 - x0, 3, rgb(claro))
  ret(c, x0, 3, x1 - x0, 1, rgb(clarear(parede, 28)))
  ret(c, x0, 4, x1 - x0, 2, rgb(clarear(parede, 6)))
  for (let x = x0 + 1; x < x1; x += 4) ret(c, x, 4, 2, 2, rgb(clarear(parede, 22)))
  ret(c, x0, 6, x1 - x0, 1, 'rgba(0,0,0,0.35)')
}

/** Rodapé de madeira, com o brilho de cima e a sombra no chão. */
export function rodape(c: CanvasRenderingContext2D, x0: number, x1: number, chao: number, madeira: RGB): void {
  ret(c, x0, chao - 4, x1 - x0, 4, rgb(clarear(madeira, -4)))
  ret(c, x0, chao - 4, x1 - x0, 1, rgb(clarear(madeira, 14)))
  ret(c, x0, chao, x1 - x0, 1, 'rgba(0,0,0,0.35)')
}

/** Interruptor de parede: espelho claro, tecla, parafusos. */
export function interruptor(c: CanvasRenderingContext2D, x: number, y: number, k: number): void {
  const placa = mistura([132, 136, 148], [196, 180, 160], k)
  ret(c, x, y, 5, 8, rgb(clarear(placa, -30)))
  ret(c, x, y, 5, 7, rgb(placa))
  ret(c, x + 2, y + 2, 1, 3, rgb(clarear(placa, -40)))
  ret(c, x + 2, y, 1, 1, rgb(clarear(placa, -20)))
  ret(c, x + 2, y + 6, 1, 1, rgb(clarear(placa, -20)))
}

/** Tomada baixa, e o fio do abajur saindo dela. */
export function tomada(c: CanvasRenderingContext2D, x: number, y: number, k: number, fioAte?: number): void {
  const placa = mistura([120, 124, 136], [186, 170, 150], k)
  ret(c, x, y, 5, 5, rgb(placa))
  ret(c, x + 1, y + 2, 1, 1, '#1a1a1e')
  ret(c, x + 3, y + 2, 1, 1, '#1a1a1e')
  if (fioAte !== undefined) {
    c.fillStyle = 'rgba(16,14,16,0.85)'
    const dir = Math.sign(fioAte - x) || 1
    for (let xx = x + 2; dir > 0 ? xx < fioAte : xx > fioAte; xx += dir) {
      const yy = y + 5 + Math.round(Math.sin((xx - x) * 0.25) * 1.5 + Math.min(6, Math.abs(xx - x) * 0.3))
      c.fillRect(xx, yy, 1, 1)
    }
  }
}

/**
 * Relógio de parede redondo. `h` e `m` decidem os ponteiros: na sala ele está
 * parado nas dez e quarenta, e ninguém repara.
 */
export function relogioParado(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, h: number, m: number, k: number): void {
  const aro = mistura([70, 64, 60], [130, 98, 64], k)
  c.fillStyle = rgb(clarear(aro, -20))
  c.beginPath()
  c.arc(cx, cy + 1, r + 1, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = rgb(aro)
  c.beginPath()
  c.arc(cx, cy, r + 1, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = rgb(mistura([168, 168, 172], [222, 210, 188], k))
  c.beginPath()
  c.arc(cx, cy, r - 1, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = 'rgba(30,26,26,0.7)'
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    c.fillRect(Math.round(cx + Math.cos(a) * (r - 2)), Math.round(cy + Math.sin(a) * (r - 2)), 1, 1)
  }
  const ponteiro = (ang: number, comp: number, cor: string) => {
    c.fillStyle = cor
    for (let i = 0; i <= comp; i += 0.5) {
      c.fillRect(Math.round(cx + Math.cos(ang) * i), Math.round(cy + Math.sin(ang) * i), 1, 1)
    }
  }
  const angH = ((h % 12) + m / 60) / 12 * Math.PI * 2 - Math.PI / 2
  const angM = (m / 60) * Math.PI * 2 - Math.PI / 2
  ponteiro(angH, r * 0.5, '#1a1414')
  ponteiro(angM, r * 0.78, '#1a1414')
  ret(c, cx, cy, 1, 1, '#8a2a24')
  // Reflexo no vidro
  ret(c, cx - Math.round(r * 0.5), cy - Math.round(r * 0.6), 2, 1, 'rgba(255,255,255,0.35)')
}

/** Lustre de três braços, apagado: a sala só acende o abajur. */
export function lustre(c: CanvasRenderingContext2D, x: number, k: number): void {
  const metal = mistura([70, 72, 82], [140, 112, 70], k)
  ret(c, x, 6, 1, 14, rgb(clarear(metal, -10)))
  ret(c, x - 3, 6, 7, 2, rgb(metal))
  ret(c, x - 1, 20, 3, 4, rgb(metal))
  ret(c, x - 12, 24, 25, 2, rgb(metal))
  for (const dx of [-12, 0, 12]) {
    ret(c, x + dx - 1, 18, 3, 6, rgb(clarear(metal, -14)))
    ret(c, x + dx - 2, 14, 5, 5, 'rgba(206,214,230,0.28)')
    ret(c, x + dx - 1, 14, 1, 4, 'rgba(255,255,255,0.3)')
  }
  // Pingentes de vidro
  for (const dx of [-8, -4, 4, 8]) ret(c, x + dx, 26, 1, 3, 'rgba(210,220,240,0.4)')
}

/** Radiador de ferro embaixo da janela, com as aletas. */
export function radiador(c: CanvasRenderingContext2D, x: number, y: number, w: number, k: number): void {
  const ferro = mistura([54, 58, 70], [96, 80, 72], k)
  ret(c, x, y, w, 2, rgb(clarear(ferro, 12)))
  for (let xx = x; xx < x + w; xx += 4) {
    ret(c, xx, y + 2, 3, 22, rgb(ferro))
    ret(c, xx, y + 2, 1, 22, rgb(clarear(ferro, 14)))
    ret(c, xx + 3, y + 2, 1, 22, rgb(clarear(ferro, -22)))
  }
  ret(c, x, y + 24, w, 2, rgb(clarear(ferro, -10)))
  ret(c, x + 2, y + 26, 2, 3, rgb(clarear(ferro, -16)))
  ret(c, x + w - 4, y + 26, 2, 3, rgb(clarear(ferro, -16)))
  // A válvula, com a ferrugem
  ret(c, x - 3, y + 18, 3, 3, rgb(clarear(ferro, -6)))
  ret(c, x - 3, y + 18, 1, 1, '#7a4a2a')
}

/** Vaso pequeno de violeta no peitoril. */
export function violeta(c: CanvasRenderingContext2D, x: number, y: number): void {
  ret(c, x, y - 5, 8, 5, '#7a4e3a')
  ret(c, x, y - 5, 8, 1, '#9a6a4e')
  ret(c, x + 1, y - 1, 6, 1, '#5a3a2a')
  const folhas: [number, number][] = [[-2, -8], [0, -10], [3, -11], [6, -9], [8, -7], [2, -7]]
  for (const [dx, dy] of folhas) ret(c, x + dx, y + dy, 3, 2, '#3a5a3a')
  ret(c, x + 2, y - 12, 2, 2, '#6a4a8a')
  ret(c, x + 5, y - 11, 2, 2, '#6a4a8a')
  ret(c, x + 3, y - 12, 1, 1, '#c8b04a')
}

/**
 * Uma arvorezinha de vaso (um fícus), no canto entre o piano e o sofá. É a
 * única coisa viva da sala, e alguém ainda rega: a terra está escura.
 *
 * A copa é feita de cachos, cada um uma massa escura com folhas por cima —
 * mais claras em cima, onde a luz do abajur bate. As folhas caem sempre no
 * mesmo lugar (a semente é fixa), senão a árvore tremeria a cada quadro.
 */
export function plantaAlta(c: CanvasRenderingContext2D, x: number, chao: number, k: number): void {
  // Vaso de barro, mais largo em cima, com pires e uma faixa
  const barro = mistura([96, 62, 50], [152, 92, 64], k)
  ret(c, x - 9, chao - 2, 18, 2, rgb(clarear(barro, -22)))
  ret(c, x - 9, chao - 2, 18, 1, rgb(clarear(barro, -4)))
  for (let i = 0; i < 12; i++) {
    const y = chao - 3 - i
    const meia = 5 + Math.floor(i / 4)
    ret(c, x - meia, y, meia * 2, 1, rgb(barro))
    ret(c, x - meia, y, 1, 1, rgb(clarear(barro, 12)))
    ret(c, x + meia - 3, y, 3, 1, rgb(clarear(barro, -20)))
  }
  ret(c, x - 6, chao - 8, 12, 1, rgb(clarear(barro, -14)))
  ret(c, x - 6, chao - 7, 12, 1, rgb(clarear(barro, 6)))
  // Borda grossa e a terra escura lá dentro
  ret(c, x - 9, chao - 17, 18, 3, rgb(clarear(barro, 10)))
  ret(c, x - 9, chao - 17, 18, 1, rgb(clarear(barro, 26)))
  ret(c, x + 5, chao - 16, 4, 2, rgb(clarear(barro, -8)))
  ret(c, x - 8, chao - 14, 16, 1, 'rgba(0,0,0,0.35)')
  ret(c, x - 7, chao - 18, 14, 1, '#2a1d17')

  // Tronco: sobe torto e abre em três galhos
  const casca = mistura([56, 42, 34], [100, 74, 54], k)
  const tronco: [number, number][] = [[0, 18], [0, 19], [0, 20], [1, 21], [1, 22], [1, 23], [1, 24], [0, 25], [0, 26], [0, 27], [-1, 28], [-1, 29], [0, 30], [0, 31]]
  for (const [dx, dy] of tronco) {
    ret(c, x + dx - 1, chao - dy, 2, 1, rgb(casca))
    ret(c, x + dx - 1, chao - dy, 1, 1, rgb(clarear(casca, 14)))
  }
  const galhos: [number, number][][] = [
    [[-1, 31], [-2, 33], [-3, 34], [-4, 36], [-5, 37]],
    [[0, 31], [1, 33], [2, 34], [3, 35], [4, 37], [5, 38], [6, 40]],
    [[0, 32], [0, 34], [-1, 36], [-1, 38], [0, 40], [0, 43]],
  ]
  for (const g of galhos) for (const [dx, dy] of g) ret(c, x + dx, chao - dy, 1, 1, rgb(casca))

  // A copa, em cachos: os de trás primeiro
  const escuro = mistura([24, 40, 32], [40, 62, 42], k)
  const medio = mistura([40, 64, 46], [70, 98, 56], k)
  const claro = mistura([62, 92, 62], [116, 140, 76], k)
  const cachos: [number, number, number, number][] = [
    [x + 9, chao - 39, 5, 4],
    [x - 9, chao - 42, 6, 4],
    [x + 6, chao - 46, 7, 5],
    [x - 5, chao - 47, 7, 5],
    [x + 1, chao - 54, 7, 5],
    [x - 3, chao - 39, 5, 3],
  ]
  let semente = 7
  for (const [cx, cy, rx, ry] of cachos) {
    copa(c, cx, cy, rx, ry, escuro, medio, claro, semente)
    semente += 13
  }
}

/** Um cacho de folhas: massa escura, folhas médias, as de cima mais claras. */
function copa(
  c: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number,
  escuro: RGB, medio: RGB, claro: RGB, semente: number,
): void {
  let s = semente * 9301 + 49297
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2)))
    ret(c, cx - w, cy + dy, w * 2 + 1, 1, rgb(escuro))
  }
  const n = Math.round(rx * ry * 0.8)
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2
    const r = Math.sqrt(rnd())
    const lx = Math.round(cx + Math.cos(a) * r * (rx - 1))
    const ly = Math.round(cy + Math.sin(a) * r * (ry - 1))
    const emCima = ly < cy - ry * 0.15
    folhaMiuda(c, lx, ly, emCima && rnd() < 0.7 ? claro : medio, rnd() < 0.5)
  }
  // Folhas soltas na borda: a copa não é um balão
  for (let i = 0; i < rx + 2; i++) {
    const a = rnd() * Math.PI * 2
    const lx = Math.round(cx + Math.cos(a) * (rx + 0.5))
    const ly = Math.round(cy + Math.sin(a) * (ry + 0.5))
    folhaMiuda(c, lx, ly, ly < cy ? medio : escuro, rnd() < 0.5)
  }
}

/** Uma folha de fícus: dois pixels e a ponta, em diagonal. */
function folhaMiuda(c: CanvasRenderingContext2D, x: number, y: number, cor: RGB, espelho: boolean): void {
  ret(c, x, y, 2, 1, rgb(cor))
  ret(c, espelho ? x - 1 : x + 1, y + 1, 2, 1, rgb(clarear(cor, -12)))
}

/**
 * O retângulo mais claro no papel de parede onde um quadro ficou anos, e o
 * prego ainda lá. Alguém tirou. Ninguém pendurou outro.
 */
export function marcaDeQuadro(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ret(c, x, y, w, h, 'rgba(255,240,220,0.05)')
  ret(c, x, y, w, 1, 'rgba(255,240,220,0.05)')
  ret(c, x, y + h - 1, w, 1, 'rgba(0,0,0,0.08)')
  ret(c, x + Math.floor(w / 2), y - 4, 1, 1, '#8a8478')
  ret(c, x + Math.floor(w / 2), y - 3, 1, 1, 'rgba(0,0,0,0.3)')
}

/** Sombra de contato: o chão escurece embaixo dos móveis encostados. */
export function sombraDeContato(c: CanvasRenderingContext2D, x: number, chao: number, w: number): void {
  ret(c, x, chao, w, 1, 'rgba(0,0,0,0.42)')
  ret(c, x + 1, chao + 1, w - 2, 1, 'rgba(0,0,0,0.24)')
  ret(c, x + 3, chao + 2, w - 6, 1, 'rgba(0,0,0,0.12)')
}

/** O luar que entra pela janela e se deita no assoalho. */
export function luarNoChao(c: CanvasRenderingContext2D, x: number, chao: number, w: number): void {
  c.save()
  c.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 18; i++) {
    const a = 0.05 * (1 - i / 18)
    c.fillStyle = `rgba(150,170,220,${a})`
    c.fillRect(x + i * 2, chao + i, w - i, 1)
  }
  // A sombra do caixilho atravessando a mancha de luz
  c.globalCompositeOperation = 'source-over'
  c.fillStyle = 'rgba(0,0,0,0.12)'
  for (let i = 0; i < 18; i++) c.fillRect(x + Math.round(w / 2) + i * 2, chao + i, 1, 1)
  c.restore()
}

/**
 * Cesto de tricô no chão: novelos, as agulhas espetadas e um fio solto que
 * escapa e vai embora pelo chão. Ninguém mais tricota nesta casa.
 */
export function cestoTrico(c: CanvasRenderingContext2D, x: number, chao: number, k: number): void {
  const vime = mistura([86, 74, 60], [140, 108, 70], k)
  ret(c, x, chao - 9, 16, 9, rgb(vime))
  for (let i = 0; i < 9; i += 2) ret(c, x, chao - 9 + i, 16, 1, rgb(clarear(vime, -14)))
  for (let i = 1; i < 16; i += 3) ret(c, x + i, chao - 9, 1, 9, rgb(clarear(vime, 10)))
  ret(c, x - 1, chao - 10, 18, 2, rgb(clarear(vime, 16)))
  const novelos: [number, number, string][] = [[2, -14, '#7a4a5a'], [8, -13, '#4a5a7a'], [12, -15, '#8a7a4a']]
  for (const [dx, dy, cor] of novelos) {
    c.fillStyle = cor
    c.beginPath()
    c.arc(x + dx + 2, chao + dy + 3, 3, 0, Math.PI * 2)
    c.fill()
    ret(c, x + dx + 1, chao + dy + 1, 2, 1, 'rgba(255,255,255,0.25)')
  }
  // Agulhas
  ret(c, x + 5, chao - 22, 1, 10, '#b8b4ac')
  ret(c, x + 9, chao - 21, 1, 9, '#b8b4ac')
  // O fio solto, pelo chão, até sair do quadro
  c.fillStyle = '#7a4a5a'
  for (let i = 0; i < 26; i++) c.fillRect(x + 16 + i, chao - 1 + Math.round(Math.sin(i * 0.5)), 1, 1)
}

/** Chinelos de pano, lado a lado. */
export function chinelos(c: CanvasRenderingContext2D, x: number, y: number, cor: string): void {
  ret(c, x, y, 6, 3, cor)
  ret(c, x + 8, y, 6, 3, cor)
  ret(c, x, y, 6, 1, 'rgba(255,255,255,0.15)')
  ret(c, x + 8, y, 6, 1, 'rgba(255,255,255,0.15)')
}

/** Uma paisagem de mar emoldurada: a casa da praia de um verão bom. */
export function quadroMar(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, k: number): void {
  const moldura = mistura([72, 66, 60], [140, 106, 60], k)
  ret(c, x - 3, y - 3, w + 6, h + 6, rgb(clarear(moldura, -18)))
  ret(c, x - 2, y - 2, w + 4, h + 4, rgb(moldura))
  ret(c, x - 2, y - 2, w + 4, 1, rgb(clarear(moldura, 26)))
  const ceu = c.createLinearGradient(0, y, 0, y + h * 0.55)
  ceu.addColorStop(0, rgb(mistura([62, 72, 96], [148, 120, 110], k)))
  ceu.addColorStop(1, rgb(mistura([96, 100, 116], [214, 170, 130], k)))
  c.fillStyle = ceu
  c.fillRect(x, y, w, Math.round(h * 0.55))
  const mar = mistura([40, 56, 78], [70, 96, 118], k)
  ret(c, x, y + Math.round(h * 0.55), w, h - Math.round(h * 0.55), rgb(mar))
  for (let i = 0; i < 5; i++) ret(c, x + 4 + i * 14, y + Math.round(h * 0.62) + (i % 2) * 3, 6, 1, rgb(clarear(mar, 20)))
  // Sol baixo e um barquinho
  ret(c, x + w - 18, y + Math.round(h * 0.4), 6, 3, rgb(mistura([170, 160, 150], [240, 200, 140], k)))
  ret(c, x + 16, y + Math.round(h * 0.5), 6, 2, '#2a2224')
  ret(c, x + 18, y + Math.round(h * 0.5) - 5, 1, 5, '#2a2224')
  ret(c, x + 19, y + Math.round(h * 0.5) - 4, 3, 3, rgb(mistura([150, 150, 150], [230, 220, 200], k)))
  // Morro e uma casinha na ponta
  c.fillStyle = rgb(mistura([34, 44, 40], [70, 80, 54], k))
  c.beginPath()
  c.moveTo(x, y + Math.round(h * 0.56))
  c.lineTo(x + 18, y + Math.round(h * 0.38))
  c.lineTo(x + 30, y + Math.round(h * 0.56))
  c.fill()
  ret(c, x + 10, y + Math.round(h * 0.44), 4, 3, '#d8cfc0')
  ret(c, x + 10, y + Math.round(h * 0.43), 4, 1, '#8a3a30')
}

/**
 * Calendário de parede, outubro. A terça, dia 14, circulada a caneta
 * vermelha — por quem, ninguém diz.
 */
export function calendario(c: CanvasRenderingContext2D, x: number, y: number): void {
  ret(c, x + 6, y - 3, 1, 3, '#2a2224')
  ret(c, x, y, 14, 19, '#d8d2c4')
  ret(c, x, y, 14, 5, '#8a3a34')
  ret(c, x + 3, y + 2, 8, 1, '#e8d8c8')
  ret(c, x + 1, y + 18, 13, 1, 'rgba(0,0,0,0.3)')
  for (let linha = 0; linha < 5; linha++) {
    for (let col = 0; col < 6; col++) {
      ret(c, x + 1 + col * 2, y + 7 + linha * 2, 1, 1, 'rgba(40,36,40,0.6)')
    }
  }
  // O 14, circulado
  c.strokeStyle = 'rgba(200,40,40,0.9)'
  c.lineWidth = 1
  c.strokeRect(x + 2.5, y + 9.5, 3, 3)
}

/**
 * Os sapatos de todo mundo, alinhados, com o bico para fora — a regra
 * número um do diário. O par da Lia está torto, como sempre.
 */
export function sapatos(c: CanvasRenderingContext2D, x: number, chao: number): void {
  const pares: [number, string, string, number][] = [
    [0, '#120c0a', '#2a201c', 7],      // Adrian
    [17, '#4a3028', '#6a4838', 6],     // Evelyn
    [32, '#17191f', '#b8b4ac', 5],     // Liam: tênis escuro de sola clara
  ]
  for (const [dx, cor, bico, w] of pares) {
    for (const lado of [0, w + 1]) {
      ret(c, x + dx + lado, chao - 3, w, 3, cor)
      ret(c, x + dx + lado, chao - 1, w, 1, bico)
      ret(c, x + dx + lado + 1, chao - 3, w - 2, 1, 'rgba(255,255,255,0.12)')
    }
  }
  // Lia: tênis branco, um deitado de lado, o outro virado ao contrário
  ret(c, x + 45, chao - 3, 5, 3, '#d4d0c6')
  ret(c, x + 45, chao - 3, 5, 1, '#f0ece2')
  ret(c, x + 52, chao - 2, 6, 2, '#d4d0c6')
  ret(c, x + 52, chao - 3, 2, 1, '#b8b4ac')
  ret(c, x + 53, chao - 2, 1, 1, '#8a2a34')
}

/** O desenho colado com fita na porta do quarto: a casa com um cômodo a mais. */
export function desenhoNaPorta(c: CanvasRenderingContext2D, x: number, y: number): void {
  ret(c, x, y, 10, 9, '#e4dccb')
  ret(c, x - 1, y - 1, 3, 2, 'rgba(230,220,180,0.6)')
  ret(c, x + 8, y - 1, 3, 2, 'rgba(230,220,180,0.6)')
  c.fillStyle = '#3a5a8a'
  c.fillRect(x + 2, y + 4, 4, 4)
  c.fillRect(x + 1, y + 3, 6, 1)
  c.fillRect(x + 2, y + 2, 4, 1)
  // O cômodo a mais, tracejado, em verde
  c.fillStyle = '#4a8a4a'
  c.fillRect(x + 7, y + 5, 1, 1)
  c.fillRect(x + 8, y + 7, 1, 1)
  c.fillRect(x + 7, y + 7, 1, 1)
}

/** Cesto de roupa suja, transbordando um pouco. */
export function cestoRoupa(c: CanvasRenderingContext2D, x: number, chao: number): void {
  ret(c, x, chao - 12, 14, 12, '#5a5a62')
  for (let i = 0; i < 12; i += 3) ret(c, x, chao - 12 + i, 14, 1, '#46464e')
  ret(c, x - 1, chao - 13, 16, 2, '#6e6e76')
  ret(c, x + 1, chao - 16, 6, 4, '#6a2c38')
  ret(c, x + 6, chao - 15, 7, 3, '#3e5664')
  ret(c, x + 3, chao - 17, 4, 2, '#c8c0b0')
}

/** Criado-mudo com o despertador, um copo d'água e o livro da escola. */
export function criadoMudo(c: CanvasRenderingContext2D, x: number, chao: number, t: number): void {
  const m: RGB = [56, 44, 46]
  ret(c, x, chao - 20, 16, 20, rgb(m))
  ret(c, x - 1, chao - 21, 18, 2, rgb(clarear(m, 14)))
  ret(c, x + 2, chao - 15, 12, 5, rgb(clarear(m, -8)))
  ret(c, x + 7, chao - 13, 2, 1, '#b8964e')
  ret(c, x + 2, chao - 8, 12, 6, rgb(clarear(m, -8)))
  ret(c, x + 1, chao, 2, 1, 'rgba(0,0,0,0.4)')
  // Despertador: números vermelhos, 06:30, com os dois-pontos piscando
  ret(c, x + 1, chao - 27, 9, 6, '#1a1a20')
  ret(c, x + 2, chao - 26, 7, 4, '#0a0a0e')
  const pisca = Math.sin(t * Math.PI) > 0
  c.fillStyle = 'rgba(230,60,50,0.9)'
  c.fillRect(x + 2, chao - 25, 2, 2)
  if (pisca) c.fillRect(x + 5, chao - 25, 1, 1)
  c.fillRect(x + 6, chao - 25, 2, 2)
  // Copo d'água pela metade
  ret(c, x + 12, chao - 26, 3, 5, 'rgba(180,200,220,0.35)')
  ret(c, x + 12, chao - 24, 3, 3, 'rgba(120,160,200,0.4)')
}

/** Uma pilha de livros no chão, do maior para o menor: tudo em ordem. */
export function pilhaLivros(c: CanvasRenderingContext2D, x: number, chao: number): void {
  const livros: [number, string][] = [[16, '#3e4a6e'], [14, '#6a3a3a'], [12, '#4a5a3a'], [10, '#7a6a3a']]
  let y = chao
  for (const [w, cor] of livros) {
    y -= 3
    ret(c, x + Math.round((16 - w) / 2), y, w, 3, cor)
    ret(c, x + Math.round((16 - w) / 2), y, w, 1, 'rgba(255,255,255,0.14)')
    ret(c, x + Math.round((16 - w) / 2) + w - 2, y + 1, 1, 1, '#d8d0bc')
  }
}

/** A mochila da escola, encostada, com o chaveiro pendurado. */
export function mochilaEscola(c: CanvasRenderingContext2D, x: number, chao: number): void {
  ret(c, x, chao - 14, 12, 14, '#2e3a54')
  ret(c, x + 1, chao - 15, 10, 2, '#3a4866')
  ret(c, x + 2, chao - 8, 8, 6, '#26304a')
  ret(c, x + 2, chao - 8, 8, 1, '#4a5878')
  ret(c, x + 5, chao - 15, 2, 2, '#1a2236')
  ret(c, x + 10, chao - 6, 2, 3, '#c8a84a')
}
