import './fontes.css'
import './style.css'
import { Display } from './engine/display'
import { Input } from './engine/input'
import { GameState } from './game/systems/state'
import { TitleScene } from './game/scenes/title'
import { OpeningScene } from './game/scenes/opening'
import { PONTOS } from './game/scenes/pontos'
import { principal } from './engine/principal'
import { audio, sons } from './engine/audio'
import { musica } from './engine/musica'
import { clima } from './engine/clima'
import { FONT_BODY } from './game/systems/dialogue'
import { voz } from './engine/voz'
import { salvo, ORDEM_PONTOS } from './game/systems/salvo'
import type { Ponto } from './game/systems/salvo'
import { Pausa, caixaIconePausa, desenharIconePausa, desenharSalvando } from './game/ui/pausa'
import { DespedidaScene } from './game/scenes/despedida'
import type { Scene, SceneCtx } from './game/scenes/types'

const canvas = document.getElementById('game') as HTMLCanvasElement | null
if (!canvas) throw new Error('Canvas #game não encontrado')

const display = new Display(canvas)
const input = new Input()
const state = new GameState()

/**
 * `?cena=<id>` começa direto numa cena, sem rejogar tudo. Existe para
 * produção: dá para conferir o fecho ou o Tear sem atravessar a demo inteira.
 * Vale qualquer ponto de salvamento (ver game/scenes/pontos.ts), mais
 * `hospital` (= abertura) e `quarto`, a fatia antiga do quarto de Liam.
 * Sem o parâmetro, nada muda.
 */
function cenaInicial(): Scene {
  const pedida = new URLSearchParams(location.search).get('cena') ?? ''
  if (pedida === 'quarto') return new OpeningScene()
  const ponto = pedida === 'hospital' ? 'abertura' : pedida
  if ((ORDEM_PONTOS as readonly string[]).includes(ponto)) return PONTOS[ponto as Ponto].criar()
  return new TitleScene()
}

// `?segredos=a,b` já começa com esses segredos achados — para conferir o
// fecho com e sem eles, sem caçar tudo de novo.
for (const id of (new URLSearchParams(location.search).get('segredos') ?? '').split(',')) {
  if (id) state.descobrir(id)
}

let scene: Scene = cenaInicial()
let fade = 0
let fadeTarget = 0
let fadeRate = 0
let pending: { next: Scene; inSec: number } | null = null
/** Troca pedida enquanto a pausa estava aberta: acontece quando ela fechar. */
let adiada: { next: Scene; outSec: number; inSec: number } | null = null
const pausa = new Pausa()
/** O salvo que esta cena gravou ao chegar é dos que não aparecem? */
let salvoDiscreto = true

/**
 * Cada cena recebe o seu próprio ctx. Um temporizador de uma cena que já
 * saiu (um setTimeout que ficou para trás quando o jogador voltou ao menu)
 * pede a troca pelo ctx velho — e o pedido é ignorado.
 */
function ctxPara(dona: Scene): SceneCtx {
  return {
    display,
    input,
    state,
    transition(next: Scene, outSec = 1, inSec = 1) {
      if (dona !== scene || pending) return
      if (pausa.aberta) {
        adiada = { next, outSec, inSec }
        return
      }
      pending = { next, inSec }
      fadeTarget = 1
      fadeRate = outSec > 0 ? 1 / outSec : 999
    },
    menu() {
      if (dona === scene) voltarAoMenu()
    },
  }
}

let ctx = ctxPara(scene)

/**
 * O som no celular. O navegador do celular (o do iPhone principalmente) só
 * deixa o áudio tocar se ele for ligado dentro do próprio toque — no fim do
 * toque, não no começo e nem um quadro depois. Então todo toque, clique e
 * tecla passa por aqui: cria o som se ele ainda não existe (é o caso de quem
 * entra direto numa cena com `?cena=`) e acorda o som se o aparelho o
 * suspendeu (uma ligação, o app em segundo plano). A pausa suspende de
 * propósito: com ela aberta, ele fica quieto.
 */
function destravarSom(): void {
  if (!audio.contexto) {
    audio.init()
    audio.startAmbient()
    musica.iniciarPad()
  }
  const c = audio.contexto
  if (c && c.state !== 'running' && !pausa.aberta) void c.resume()
  telaCheiaNoCelular()
}
for (const ev of ['touchend', 'pointerup', 'click', 'keydown']) {
  window.addEventListener(ev, destravarSom, { capture: true })
}

/**
 * No celular, o primeiro toque pede a tela inteira e trava o aparelho
 * deitado (no Android; o iPhone não deixa página nenhuma fazer isso, e lá
 * vale o aviso de virar o celular). Se o navegador recusar, segue normal.
 */
let pediuTelaCheia = false
function telaCheiaNoCelular(): void {
  if (pediuTelaCheia || !input.touchMode) return
  pediuTelaCheia = true
  const el = document.documentElement
  if (!el.requestFullscreen || document.fullscreenElement) return
  el.requestFullscreen({ navigationUI: 'hide' })
    .then(() => {
      const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
      return o.lock?.('landscape')
    })
    .catch(() => {
      // Dentro de um iframe, ou o navegador não quis: tudo bem.
    })
}

/** Celular em pé: o jogo é deitado. Para tudo e pede para virar. */
function celularEmPe(): boolean {
  const toque = input.touchMode || navigator.maxTouchPoints > 0
  return toque && display.cssH > display.cssW && display.cssW < 600
}

let tempoGire = 0
function desenharGire(c: CanvasRenderingContext2D, w: number, h: number, dt: number): void {
  tempoGire += dt
  c.save()
  c.fillStyle = '#000'
  c.fillRect(0, 0, w, h)
  // Um celular de contorno que deita e levanta, devagar.
  const ciclo = (tempoGire % 3) / 3
  const ang = ciclo < 0.35 ? 0 : ciclo < 0.6 ? ((ciclo - 0.35) / 0.25) * (Math.PI / 2) : Math.PI / 2
  const s = Math.min(w, h) * 0.12
  c.translate(w / 2, h * 0.42)
  c.rotate(-ang)
  c.strokeStyle = 'rgba(230,226,216,0.8)'
  c.lineWidth = 2
  c.beginPath()
  c.roundRect(-s * 0.5, -s * 0.9, s, s * 1.8, s * 0.14)
  c.stroke()
  c.beginPath()
  c.arc(0, s * 0.72, s * 0.06, 0, Math.PI * 2)
  c.stroke()
  c.restore()
  c.save()
  c.fillStyle = 'rgba(230,226,216,0.86)'
  c.textAlign = 'center'
  const fs = Math.max(16, Math.min(w / 18, 24))
  c.font = `${fs}px ${FONT_BODY}`
  c.fillText('Vire o celular de lado.', w / 2, h * 0.62)
  c.fillStyle = 'rgba(230,226,216,0.45)'
  c.font = `italic ${fs * 0.78}px ${FONT_BODY}`
  c.fillText('O jogo continua de onde parou.', w / 2, h * 0.62 + fs * 1.6)
  c.restore()
}

/**
 * Chegar numa cena. Se ela é um ponto de salvamento, o jogo grava antes de
 * ela começar: o salvo guarda o que Liam sabia ao chegar, não o que a cena
 * já mudou.
 */
function entrar(next: Scene): void {
  scene = next
  ctx = ctxPara(next)
  // A música de tensão é de cada cena: a que chega diz o que quer.
  clima.parar(0.6)
  voz.calar()
  if (next.ponto) {
    salvo.gravar(next.ponto, state)
    salvoDiscreto = PONTOS[next.ponto].discreto === true
  }
  next.enter?.(ctx)
}

function trocarJa(next: Scene, outSec: number, inSec: number): void {
  pending = { next, inSec }
  fadeTarget = 1
  fadeRate = outSec > 0 ? 1 / outSec : 999
}

/** Cala o que a cena deixou tocando e volta ao menu, já aberto. */
function voltarAoMenu(): void {
  adiada = null
  pausa.fechar()
  principal.cortar()
  musica.setPad(0, 0.3)
  audio.silenciar(0.3)
  sons.silenciar(0.3)
  clima.parar(0.3)
  voz.calar()
  pending = null
  trocarJa(new TitleScene({ direto: true }), 0.8, 0.6)
}

function sair(): void {
  adiada = null
  // O som fica parado onde a pausa deixou: a despedida é em silêncio.
  pausa.fechar(false)
  pending = null
  trocarJa(new DespedidaScene(), 0.9, 0.8)
}

function podePausar(): boolean {
  if (scene instanceof TitleScene || scene instanceof DespedidaScene) return false
  if (pending || fade > 0) return false
  return scene.podePausar?.() ?? true
}

// Esconder a aba no meio do jogo pausa: ninguém volta e encontra a cena
// andando sem ele.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && podePausar()) pausa.abrir()
})

/** Para o ícone de pausa: só aparece para quem mexeu o mouse há pouco. */
let ultimoPonteiro: { x: number; y: number } | null = null
let mexeuHa = Infinity

entrar(scene)

function step(dt: number): void {
  if (celularEmPe()) {
    input.consumeTap()
    input.consumeConfirm()
    desenharGire(display.ctx, display.cssW, display.cssH, dt)
    input.endFrame()
    return
  }
  if (fade !== fadeTarget) {
    const dir = Math.sign(fadeTarget - fade)
    fade = Math.max(0, Math.min(1, fade + dir * fadeRate * dt))
    if (fade === 1 && pending) {
      const p = pending
      fadeTarget = 0
      fadeRate = p.inSec > 0 ? 1 / p.inSec : 999
      pending = null
      entrar(p.next)
    }
  }

  const ptr = input.pointer
  if (ptr && (!ultimoPonteiro || ptr.x !== ultimoPonteiro.x || ptr.y !== ultimoPonteiro.y)) mexeuHa = 0
  else mexeuHa += dt
  ultimoPonteiro = ptr ? { ...ptr } : null
  const tempoSalvo = salvo.desde - 0.9
  const mostraSalvo = !salvoDiscreto && tempoSalvo >= 0 && tempoSalvo <= 3.2
  const icone = !pausa.aberta && !mostraSalvo && podePausar() && (input.touchMode || mexeuHa < 2.5)

  if (pausa.aberta) {
    const acao = pausa.update(dt, input)
    if (acao === 'continuar') {
      pausa.fechar()
      if (adiada) {
        const a = adiada
        adiada = null
        ctx.transition(a.next, a.outSec, a.inSec)
      }
    } else if (acao === 'menu') voltarAoMenu()
    else if (acao === 'sair') sair()
  } else {
    // O ícone vem antes da cena: o clique nele não pode virar um passo.
    const tap = input.peekTap()
    const cx = caixaIconePausa(display.cssW)
    if (icone && tap && tap.x >= cx.x && tap.x <= cx.x + cx.w && tap.y >= cx.y && tap.y <= cx.y + cx.h) {
      input.consumeTap()
      input.consumeConfirm()
      pausa.abrir()
    } else {
      principal.update(dt)
      clima.update(dt)
      scene.update(dt, ctx)
      // Esc que a cena não usou (para fechar um papel, levantar do piano)
      // abre a pausa.
      if ((input.consumeKey('Escape') || input.consumeKey('KeyP')) && podePausar()) pausa.abrir()
    }
  }

  scene.render(ctx)
  drawStick()

  const c = display.ctx
  if (pausa.aberta) pausa.draw(c, display.cssW, display.cssH)
  else {
    if (mostraSalvo && fade === 0) desenharSalvando(c, display.cssW, tempoSalvo)
    if (icone) {
      const p = input.pointer
      const cx = caixaIconePausa(display.cssW)
      const sobre = p !== null && p.x >= cx.x && p.x <= cx.x + cx.w && p.y >= cx.y && p.y <= cx.y + cx.h
      desenharIconePausa(c, display.cssW, Math.min(1, input.touchMode ? 1 : 2.5 - mexeuHa), sobre)
    }
  }
  input.endFrame()

  if (fade > 0) {
    c.save()
    c.globalAlpha = fade
    c.fillStyle = '#000'
    c.fillRect(0, 0, display.cssW, display.cssH)
    c.restore()
  }
}

// Gancho de teste: só existe com ?debug na URL. Serve para automação de
// playtest e para pular direto a uma cena durante a produção.
if (new URLSearchParams(location.search).has('debug')) {
  Object.defineProperty(window, '__nos', {
    value: {
      state,
      salvo,
      pausa,
      audio,
      sons,
      musica,
      voz,
      clima,
      get scene() {
        return scene
      },
      /** Converte um ponto do mundo em pixels de tela (usado nos testes). */
      paraTela(x: number, y: number) {
        return { x: display.toScreenX(x), y: display.toScreenY(y) }
      },
    },
  })
}

/** Desenha o manche virtual enquanto o dedo está na tela. */
function drawStick(): void {
  const st = input.stick
  if (!st) return
  const c = display.ctx
  const dx = st.x - st.ox
  const dy = st.y - st.oy
  const d = Math.hypot(dx, dy)
  const clamp = Math.min(d, 46)
  const nx = d > 0 ? st.ox + (dx / d) * clamp : st.ox
  const ny = d > 0 ? st.oy + (dy / d) * clamp : st.oy
  c.save()
  c.strokeStyle = 'rgba(232,236,244,0.20)'
  c.lineWidth = 2
  c.beginPath()
  c.arc(st.ox, st.oy, 46, 0, Math.PI * 2)
  c.stroke()
  c.fillStyle = 'rgba(217,178,95,0.38)'
  c.beginPath()
  c.arc(nx, ny, 17, 0, Math.PI * 2)
  c.fill()
  c.restore()
}

let last = performance.now()
function loop(now: number): void {
  // Trava o passo: uma aba em segundo plano não deve avançar dez segundos.
  const dt = Math.min((now - last) / 1000, 1 / 20)
  last = now
  step(dt)
  requestAnimationFrame(loop)
}

/**
 * Canvas não dispara o carregamento de fonte: se desenhar antes dela chegar,
 * usa a de reserva e fica com ela. Então cada face é pedida explicitamente,
 * antes do primeiro quadro.
 */
const FACES = [
  "400 32px 'Bodoni Moda'",
  "500 32px 'Bodoni Moda'",
  "italic 400 32px 'Bodoni Moda'",
  "300 20px 'Spectral'",
  "400 20px 'Spectral'",
  "italic 300 20px 'Spectral'",
  "italic 400 20px 'Spectral'",
  "italic 400 32px 'Cormorant Garamond'",
  "italic 500 32px 'Cormorant Garamond'",
]

async function boot(): Promise<void> {
  try {
    await Promise.all(FACES.map((f) => document.fonts.load(f, 'Nós ÁÉÍÓÚ ãõç')))
    await document.fonts.ready
  } catch {
    /* segue com as fontes de reserva */
  }
  document.getElementById('loading')?.remove()
  requestAnimationFrame(loop)
}

void boot()
