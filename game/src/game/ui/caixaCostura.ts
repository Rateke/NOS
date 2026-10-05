import type { Input } from '../../engine/input'
import { FONT_FIM, FONT_BODY } from '../systems/dialogue'
import { PAL } from '../../engine/constants'
import { CORES_LINHA, SEGREDO_CAIXA, TAMPA_BORDADO, encaixam } from '../content/costura'

/**
 * A caixa de costura da mãe, vista de cima, tomando a tela.
 *
 * Quatro carretéis lado a lado; cada um gira pelas cinco cores. Setas
 * escolhem o carretel e trocam a cor, Enter tenta abrir, Esc larga a caixa.
 * Com o mouse ou o dedo: tocar num carretel troca a cor dele; "abrir" e
 * "deixar" ficam embaixo.
 *
 * A cada tentativa errada a tampa treme e Liam sente quantos carretéis
 * encaixam — é a única resposta da própria tranca. Dica, aqui, não é texto:
 * quem demora muito de verdade vê o quarto ajudar (a cena da casa cuida
 * disso; ver `pistasCostura`).
 *
 * A caixa guarda o estado entre uma visita e outra: quem larga e volta
 * encontra os carretéis do jeito que deixou.
 */
type Caixa = { x: number; y: number; w: number; h: number }

export class CaixaCostura {
  /** Índice da cor em cada um dos quatro carretéis. */
  aneis = [4, 4, 4, 4]
  /** O carretel escolhido (teclado). */
  sel = 0
  /** Tentativas que não abriram. */
  falhas = 0
  /** Já abriu: o recado está solto. */
  aberta = false
  ativa = false
  private t = 0
  private tremor = 0
  private abrindo = 0
  private recado: { texto: string; t: number } | null = null
  private zonas: { carreteis: Caixa[]; abrir: Caixa; deixar: Caixa } = {
    carreteis: [], abrir: { x: 0, y: 0, w: 0, h: 0 }, deixar: { x: 0, y: 0, w: 0, h: 0 },
  }

  /** Terminou: abriu (e a animação acabou) ou ele largou a caixa. */
  get acabou(): boolean {
    return !this.ativa
  }

  abrir(): void {
    this.ativa = true
    this.t = 0
    this.abrindo = 0
    this.recado = null
  }

  /** Devolve o que aconteceu neste quadro, para a cena tocar o som certo. */
  update(dt: number, input: Input): 'girou' | 'errou' | 'abriu' | 'largou' | null {
    if (!this.ativa) return null
    this.t += dt
    this.tremor = Math.max(0, this.tremor - dt * 2.4)
    if (this.recado) this.recado.t += dt
    if (this.aberta) {
      // A tampa sobe devagar; depois a caixa sai da tela sozinha.
      this.abrindo = Math.min(1, this.abrindo + dt / 1.6)
      input.consumeTap()
      input.consumeConfirm()
      if (this.abrindo >= 1) this.ativa = false
      return null
    }
    // Uma carência curta: o toque que fechou a fala não gira nada.
    if (this.t < 0.3) {
      input.consumeTap()
      input.consumeConfirm()
      return null
    }
    // Um clique também marca confirmar: com toque, só vale onde tocou.
    const tap = input.consumeTap()
    const confirmou = input.consumeConfirm()
    if (tap) {
      const dentro = (z: Caixa) => tap.x >= z.x && tap.x <= z.x + z.w && tap.y >= z.y && tap.y <= z.y + z.h
      const i = this.zonas.carreteis.findIndex(dentro)
      if (i >= 0) {
        this.sel = i
        this.girar(1)
        return 'girou'
      }
      if (dentro(this.zonas.abrir)) return this.tentar()
      if (dentro(this.zonas.deixar)) return this.largar()
      return null
    }
    if (input.consumeKey('Escape')) return this.largar()
    if (input.consumeKey('ArrowLeft') || input.consumeKey('KeyA')) this.sel = (this.sel + 3) % 4
    if (input.consumeKey('ArrowRight') || input.consumeKey('KeyD')) this.sel = (this.sel + 1) % 4
    if (input.consumeKey('ArrowUp') || input.consumeKey('KeyW')) {
      this.girar(1)
      return 'girou'
    }
    if (input.consumeKey('ArrowDown') || input.consumeKey('KeyS')) {
      this.girar(-1)
      return 'girou'
    }
    if (confirmou) return this.tentar()
    return null
  }

  private girar(d: number): void {
    const n = CORES_LINHA.length
    this.aneis[this.sel] = ((this.aneis[this.sel] ?? 0) + d + n) % n
  }

  private largar(): 'largou' {
    this.ativa = false
    return 'largou'
  }

  private tentar(): 'errou' | 'abriu' {
    const certos = this.aneis.filter((c, i) => c === SEGREDO_CAIXA[i]).length
    if (certos === SEGREDO_CAIXA.length) {
      this.aberta = true
      this.abrindo = 0
      this.recado = null
      return 'abriu'
    }
    this.falhas++
    this.tremor = 1
    this.recado = { texto: encaixam(certos), t: 0 }
    return 'errou'
  }

  draw(c: CanvasRenderingContext2D, cssW: number, cssH: number, toque: boolean): void {
    if (!this.ativa) return
    const entra = Math.min(1, this.t / 0.35)
    const sai = this.aberta ? Math.max(0, 1 - Math.max(0, this.abrindo - 0.7) / 0.3) : 1
    const a = entra * sai
    const s = Math.max(12, Math.min(cssW / 60, 20))
    c.save()
    c.globalAlpha = a
    c.fillStyle = 'rgba(4,4,8,0.8)'
    c.fillRect(0, 0, cssW, cssH)

    // A caixa: madeira, vista de cima, com a tampa em cima e os carretéis embaixo.
    const w = Math.min(cssW * 0.86, s * 34)
    const h = w * 0.62
    const tremeX = Math.sin(this.t * 60) * this.tremor * s * 0.35
    const x = (cssW - w) / 2 + tremeX
    const y = Math.max(s * 3.6, (cssH - h) / 2 - s)
    c.fillStyle = '#3a2216'
    c.fillRect(x - s * 0.4, y - s * 0.4, w + s * 0.8, h + s * 0.8)
    c.fillStyle = '#6e4428'
    c.fillRect(x, y, w, h)
    c.fillStyle = 'rgba(255,220,170,0.08)'
    for (let i = 0; i < 9; i++) c.fillRect(x, y + (h / 9) * i + s * 0.2, w, 1)

    // A tampa: o bordado dela, em linha âmbar. Abrindo, sobe e some.
    const tampaH = h * 0.42
    const sobe = this.abrindo * tampaH
    c.save()
    c.beginPath()
    c.rect(x, y - tampaH, w, tampaH * 2)
    c.clip()
    c.fillStyle = '#5a3620'
    c.fillRect(x + s * 0.6, y + s * 0.6 - sobe, w - s * 1.2, tampaH - s * 0.6)
    c.strokeStyle = 'rgba(226,169,94,0.5)'
    c.setLineDash([s * 0.3, s * 0.25])
    c.lineWidth = 1.2
    c.strokeRect(x + s * 1.1, y + s * 1.1 - sobe, w - s * 2.2, tampaH - s * 1.6)
    c.setLineDash([])
    c.textAlign = 'center'
    c.font = `italic 500 ${s * 1.25}px ${FONT_FIM}`
    c.fillStyle = '#e2a95e'
    c.fillText(`"${TAMPA_BORDADO}"`, cssW / 2 + tremeX, y + tampaH * 0.62 - sobe)
    c.restore()

    // Dentro, quando abre: as linhas e o papel dobrado.
    if (this.aberta) {
      c.fillStyle = '#e8e0cc'
      const pw = w * 0.32
      c.fillRect(cssW / 2 - pw / 2, y + tampaH * 0.25, pw, tampaH * 0.6)
      c.fillStyle = 'rgba(60,40,30,0.35)'
      c.fillRect(cssW / 2 - pw / 2, y + tampaH * 0.55, pw, 1)
    }

    // Os quatro carretéis
    const zonaY = y + tampaH + s * 0.8
    const zonaH = h - tampaH - s * 1.6
    const passo = w / 4
    const carreteis: Caixa[] = []
    for (let i = 0; i < 4; i++) {
      const cx = x + passo * (i + 0.5)
      const cw = Math.min(passo * 0.5, s * 3.4)
      const ch = zonaH * 0.62
      const cy = zonaY + s * 0.2
      carreteis.push({ x: cx - passo / 2, y: zonaY - s * 0.6, w: passo, h: zonaH + s * 0.6 })
      const cor = CORES_LINHA[this.aneis[i] ?? 0] ?? CORES_LINHA[0]
      const escolhido = i === this.sel && !toque && !this.aberta
      // As abas de madeira e a linha enrolada
      c.fillStyle = '#c8a878'
      c.fillRect(cx - cw / 2 - s * 0.3, cy, cw + s * 0.6, s * 0.45)
      c.fillRect(cx - cw / 2 - s * 0.3, cy + ch - s * 0.45, cw + s * 0.6, s * 0.45)
      c.fillStyle = cor.cor
      c.fillRect(cx - cw / 2, cy + s * 0.45, cw, ch - s * 0.9)
      c.fillStyle = 'rgba(0,0,0,0.18)'
      for (let k = cy + s * 0.6; k < cy + ch - s * 0.5; k += s * 0.32) c.fillRect(cx - cw / 2, k, cw, 1)
      c.fillStyle = 'rgba(255,255,255,0.22)'
      c.fillRect(cx - cw / 2 + s * 0.2, cy + s * 0.45, s * 0.3, ch - s * 0.9)
      // O nome da cor, para não depender só do olho.
      c.textAlign = 'center'
      c.font = `${s * 0.9}px ${FONT_BODY}`
      c.fillStyle = escolhido ? PAL.ink : PAL.inkDim
      c.fillText(cor.nome, cx, cy + ch + s * 1.05)
      if (escolhido) {
        c.fillStyle = PAL.accent
        c.fillText('▲', cx, cy - s * 0.35)
        c.fillText('▼', cx, cy + ch + s * 2.2)
      }
    }

    // O que ele pensa depois de tentar
    if (this.recado && !this.aberta) {
      const r = this.recado
      const fade = Math.min(1, r.t / 0.3)
      c.textAlign = 'center'
      c.font = `italic ${s * 1.05}px ${FONT_BODY}`
      c.fillStyle = `rgba(232,220,200,${fade})`
      c.fillText(r.texto, cssW / 2, y - s * 1.6)
    }

    // Os botões, e o que dá para fazer
    const by = Math.min(cssH - s * 2.6, y + h + s * 1.6)
    c.font = `${s}px ${FONT_BODY}`
    const bw = s * 7
    const abrir = { x: cssW / 2 + s * 0.5, y: by, w: bw, h: s * 1.9 }
    const deixar = { x: cssW / 2 - s * 0.5 - bw, y: by, w: bw, h: s * 1.9 }
    if (!this.aberta) {
      for (const [z, txt, forte] of [[abrir, 'abrir', true], [deixar, 'deixar', false]] as const) {
        c.fillStyle = forte ? 'rgba(226,169,94,0.22)' : 'rgba(255,255,255,0.06)'
        c.fillRect(z.x, z.y, z.w, z.h)
        c.strokeStyle = forte ? 'rgba(226,169,94,0.7)' : 'rgba(255,255,255,0.25)'
        c.strokeRect(z.x + 0.5, z.y + 0.5, z.w - 1, z.h - 1)
        c.fillStyle = forte ? '#f2d6a8' : PAL.inkDim
        c.textAlign = 'center'
        c.fillText(txt, z.x + z.w / 2, z.y + z.h * 0.66)
      }
      c.globalAlpha = a * 0.55
      c.font = `${s * 0.82}px ${FONT_BODY}`
      c.fillStyle = PAL.inkDim
      c.fillText(
        toque ? 'toque num carretel para trocar a cor' : '← → carretel  ·  ↑ ↓ cor  ·  Enter abre  ·  Esc deixa',
        cssW / 2, Math.min(cssH - s * 0.6, by + s * 3.2),
      )
    }
    this.zonas = { carreteis, abrir, deixar }
    c.restore()
  }
}
