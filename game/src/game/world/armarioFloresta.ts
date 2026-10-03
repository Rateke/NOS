import type { Input } from '../../engine/input'
import type { Display } from '../../engine/display'
import { WORLD_W, WORLD_H } from '../../engine/constants'
import { sorteio } from './arte'

/**
 * Dentro do guarda-roupa, depois do grito.
 *
 * Liam entra e puxa a porta. O jogador decide quanto ela fica aberta (← →,
 * ou arrastando): pela fresta, em vez do quarto, tem uma floresta à noite.
 * Aberta demais, a floresta some e é só o quarto de novo — ela só existe
 * pelo pouco que se vê.
 *
 * Quem deixa a fresta pequena e fica parado olhando, alguns segundos, vê
 * entre as árvores uma figura de rabo de cavalo. É a Lia. Ela não se mexe.
 * Depois vira e vai embora, para dentro do mato. Nada avisa que isso existe.
 */
/** O "sair" no canto, para quem joga sem teclado. */
const SAIR = { w: 34, h: 14 }

export class ArmarioFloresta {
  /** 0 fechada, 1 escancarada. */
  fresta = 0.12
  private alvo = 0.12
  private t = 0
  /** Segundos com a fresta parada no tamanho certo. */
  private olhando = 0
  /** 0..1: a figura entre as árvores. */
  lia = 0
  /** Ela já foi vista (e foi embora). */
  viu = false
  private indo = 0
  /** Já abriu a porta inteira e viu que era só o quarto. */
  abriuTudo = false
  /** O que Liam diz baixinho, escrito por cima da vista (não para nada). */
  sussurro: { texto: string; t: number } | null = null
  private terminado = false

  get acabou(): boolean {
    return this.terminado
  }

  /** Onde fica o "sair", em coordenadas do mundo (a cena escreve o rótulo). */
  get botaoSair(): { x: number; y: number; w: number; h: number } {
    return { x: WORLD_W - SAIR.w - 4, y: WORLD_H - SAIR.h - 4, w: SAIR.w, h: SAIR.h }
  }

  /** A fresta certa: nem fechada, nem aberta a ponto de virar quarto. */
  private get frestaBoa(): boolean {
    return this.fresta > 0.16 && this.fresta < 0.55
  }

  update(dt: number, input: Input, display: Display): { viuAgora: boolean } {
    this.t += dt
    if (this.sussurro) {
      this.sussurro.t += dt
      if (this.sussurro.t > 4) this.sussurro = null
    }
    let viuAgora = false
    // Um clique também conta como confirmar; aqui o clique é a mão na porta.
    // Sai pelo teclado (E, espaço, Esc) ou tocando no "sair" do canto.
    const tap = input.consumeTap()
    const confirmou = input.consumeConfirm()
    let sair = input.consumeKey('Escape')
    if (tap) {
      const wx = display.toWorldX(tap.x)
      const wy = display.toWorldY(tap.y)
      if (wx > WORLD_W - SAIR.w - 6 && wy > WORLD_H - SAIR.h - 6) sair = true
    } else if (confirmou) {
      sair = true
    }
    // Uma carência curta: o E que fechou a fala de entrar não tira ele daqui.
    if (sair && this.t > 0.5) {
      this.terminado = true
      return { viuAgora }
    }
    const eixo = input.moveAxis()
    if (eixo && eixo.x !== 0) this.alvo = Math.max(0, Math.min(1, this.alvo + eixo.x * dt * 0.45))
    const p = input.pointer
    if (input.pointerDown && p && !tap) {
      // Arrastar: a mão na porta. A posição do dedo vira a abertura.
      const x = display.toWorldX(p.x)
      this.alvo = Math.max(0, Math.min(1, Math.abs(x - WORLD_W / 2) / (WORLD_W * 0.42)))
    }
    const antes = this.fresta
    this.fresta += (this.alvo - this.fresta) * Math.min(1, dt * 6)
    const mexeu = Math.abs(this.fresta - antes) > dt * 0.02
    if (this.fresta > 0.85) this.abriuTudo = true

    if (!this.viu) {
      if (this.frestaBoa && !mexeu) this.olhando += dt
      else this.olhando = Math.max(0, this.olhando - dt * 2)
      const quer = this.olhando > 3.2 && this.frestaBoa ? 1 : 0
      this.lia += (quer - this.lia) * Math.min(1, dt * (quer ? 0.5 : 3))
      if (this.lia > 0.7) {
        this.indo += dt
        if (this.indo > 2.6) {
          this.viu = true
          viuAgora = true
          this.sussurro = { texto: '...Lia?', t: 0 }
        }
      }
    } else {
      // Ela vira e entra no mato.
      this.lia = Math.max(0, this.lia - dt * 0.35)
    }
    return { viuAgora }
  }

  draw(w: CanvasRenderingContext2D): void {
    const W = WORLD_W
    const H = WORLD_H
    // O que está do outro lado: a floresta, que vira quarto quando abre demais.
    const quarto = Math.max(0, Math.min(1, (this.fresta - 0.62) / 0.25))
    this.floresta(w, 1 - quarto)
    if (quarto > 0) {
      w.globalAlpha = quarto
      this.quarto(w)
      w.globalAlpha = 1
    }
    // As portas do armário, de dentro: abrindo do meio para os lados.
    const meio = W / 2
    const abre = 3 + this.fresta * (W * 0.46)
    this.porta(w, 0, meio - abre / 2, -1)
    this.porta(w, meio + abre / 2, W, 1)
    // Roupas penduradas nas bordas, mais perto da câmera: escuras.
    const r = sorteio(5)
    for (let i = 0; i < 7; i++) {
      const x = i < 3 ? 4 + i * 18 + r() * 6 : W - 70 + (i - 3) * 18 + r() * 6
      const larg = 18 + r() * 8
      w.fillStyle = i % 2 ? '#0c0d14' : '#11131c'
      w.fillRect(x, 10, larg, H * (0.55 + r() * 0.25))
      w.fillStyle = 'rgba(255,255,255,0.03)'
      w.fillRect(x + 2, 12, 1, H * 0.4)
      // O cabide
      w.fillStyle = '#2a2a30'
      w.fillRect(x + larg / 2 - 1, 4, 2, 7)
    }
    w.fillStyle = '#1a1820'
    w.fillRect(0, 4, W, 3)
    // Escurece as bordas: dentro do armário é escuro.
    const g = w.createRadialGradient(meio, H * 0.5, 20, meio, H * 0.5, W * 0.62)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.75)')
    w.fillStyle = g
    w.fillRect(0, 0, W, H)
    // O "sair", no canto
    w.fillStyle = 'rgba(10,10,14,0.7)'
    w.fillRect(W - SAIR.w - 4, H - SAIR.h - 4, SAIR.w, SAIR.h)
    w.strokeStyle = 'rgba(200,200,214,0.35)'
    w.lineWidth = 1
    w.strokeRect(W - SAIR.w - 3.5, H - SAIR.h - 3.5, SAIR.w - 1, SAIR.h - 1)
  }

  private porta(w: CanvasRenderingContext2D, x0: number, x1: number, lado: number): void {
    if (x1 <= x0) return
    w.fillStyle = '#1b1b26'
    w.fillRect(x0, 0, x1 - x0, WORLD_H)
    // As tábuas, por dentro, e a borda que pega a luz da fresta.
    w.fillStyle = 'rgba(255,255,255,0.025)'
    for (let x = x0 + 6; x < x1; x += 14) w.fillRect(x, 0, 1, WORLD_H)
    const borda = lado < 0 ? x1 - 2 : x0
    w.fillStyle = 'rgba(170,190,230,0.28)'
    w.fillRect(borda, 0, 2, WORLD_H)
    // O puxador de dentro
    w.fillStyle = '#4a4440'
    w.fillRect(lado < 0 ? x1 - 9 : x0 + 6, WORLD_H * 0.5, 3, 10)
  }

  /** A floresta à noite: lua, troncos em camadas, névoa, vaga-lumes. */
  private floresta(w: CanvasRenderingContext2D, a: number): void {
    const W = WORLD_W
    const H = WORLD_H
    const ceu = w.createLinearGradient(0, 0, 0, H)
    ceu.addColorStop(0, '#0a1424')
    ceu.addColorStop(0.6, '#13243a')
    ceu.addColorStop(1, '#0b1410')
    w.fillStyle = ceu
    w.fillRect(0, 0, W, H)
    w.globalAlpha = a
    // A lua, e a luz dela descendo entre as árvores.
    w.fillStyle = '#d8e0f0'
    w.beginPath()
    w.arc(W * 0.6, 34, 10, 0, Math.PI * 2)
    w.fill()
    const luz = w.createLinearGradient(W * 0.6, 30, W * 0.52, H)
    luz.addColorStop(0, 'rgba(190,210,240,0.22)')
    luz.addColorStop(1, 'rgba(190,210,240,0)')
    w.fillStyle = luz
    w.beginPath()
    w.moveTo(W * 0.56, 40)
    w.lineTo(W * 0.64, 40)
    w.lineTo(W * 0.62, H)
    w.lineTo(W * 0.42, H)
    w.closePath()
    w.fill()
    // Três camadas de troncos: longe (claros, névoa), meio, perto (escuros).
    const camadas: [number, string, number][] = [[11, '#24384a', 0.6], [23, '#16242e', 0.8], [37, '#0a1014', 1]]
    for (const [semente, cor, alt] of camadas) {
      const r = sorteio(semente)
      for (let i = 0; i < 9; i++) {
        const x = r() * W
        const larg = 3 + r() * 6 * alt
        w.fillStyle = cor
        w.fillRect(Math.round(x), Math.round(H * (1 - alt) * 0.3), Math.round(larg), H)
        // Copa: uma massa irregular no alto.
        w.beginPath()
        w.ellipse(x + larg / 2, H * (1 - alt) * 0.3 + 8, 16 + r() * 12, 10 + r() * 6, 0, 0, Math.PI * 2)
        w.fill()
      }
      // Névoa entre uma camada e outra
      w.fillStyle = 'rgba(150,170,190,0.06)'
      w.fillRect(0, H * 0.62, W, H * 0.4)
    }
    // A figura: uma silhueta de rabo de cavalo, longe, entre os troncos.
    if (this.lia > 0.01) {
      const x = W * 0.53
      const y = H * 0.74
      const vira = this.viu ? 1 : 0
      w.fillStyle = `rgba(4,6,8,${0.85 * this.lia})`
      w.fillRect(x - 3, y - 22, 6, 22)
      w.fillRect(x - 2, y - 28, 5, 6)
      // O rabo de cavalo, para o lado em que ela olha
      w.fillRect(vira ? x - 4 : x + 3, y - 27, 2, 5)
      w.fillRect(x - 4, y - 20, 1, 10)
      w.fillRect(x + 3, y - 20, 1, 10)
    }
    // Vaga-lumes
    const r = sorteio(91)
    for (let i = 0; i < 14; i++) {
      const fx = r() * W + Math.sin(this.t * 0.6 + i) * 6
      const fy = H * 0.45 + r() * H * 0.45 + Math.cos(this.t * 0.8 + i * 2) * 4
      const acende = 0.5 + 0.5 * Math.sin(this.t * (1.2 + r()) + i * 1.7)
      w.fillStyle = `rgba(210,240,140,${0.25 + acende * 0.65})`
      w.fillRect(Math.round(fx), Math.round(fy), 1, 1)
    }
    w.globalAlpha = 1
  }

  /** Aberto demais: é só o quarto dele, no escuro. */
  private quarto(w: CanvasRenderingContext2D): void {
    const W = WORLD_W
    const H = WORLD_H
    w.fillStyle = '#141826'
    w.fillRect(0, 0, W, H)
    w.fillStyle = '#10131e'
    w.fillRect(0, H * 0.55, W, H * 0.45)
    // A cama, a escrivaninha, a janela com a lua
    w.fillStyle = '#2a3046'
    w.fillRect(W * 0.18, H * 0.58, W * 0.34, H * 0.12)
    w.fillStyle = '#3a4466'
    w.fillRect(W * 0.18, H * 0.56, W * 0.34, 4)
    w.fillStyle = '#2a2420'
    w.fillRect(W * 0.62, H * 0.6, W * 0.18, 4)
    w.fillRect(W * 0.63, H * 0.6, 2, H * 0.2)
    w.fillRect(W * 0.78, H * 0.6, 2, H * 0.2)
    w.fillStyle = '#1e2a40'
    w.fillRect(W * 0.62, H * 0.18, W * 0.16, H * 0.22)
    w.fillStyle = '#c8d0e0'
    w.fillRect(W * 0.71, H * 0.22, 4, 4)
  }
}
