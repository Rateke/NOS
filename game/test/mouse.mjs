/**
 * A mesma demo, jogada inteira SÓ COM O MOUSE — é o caminho de quem abre o
 * jogo num painel, onde o teclado pode nem chegar à página.
 *
 * Cobre as três cenas e, principalmente, a espinha da demo: o tema aprendido
 * no piano do prólogo é o mesmo que abre os fios na câmara do Tear.
 *
 *   npm run build && npm run preview &
 *   npm run test:demo
 *
 * OUT=<dir> salva capturas de cada momento.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = process.env.OUT ?? null
const URL = process.env.URL ?? 'http://localhost:4173/'
if (OUT) mkdirSync(OUT, { recursive: true })

/** O tema, em graus da escala. Tem de bater com engine/musica.ts. */
const TEMA = [[0, 2, 4, 3], [0, 2, 4, 6, 5], [0, 2, 4, 3, 2, 1, 0]]
const TECLAS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK']

const falhas = []
function esperar(rotulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado)
  console.log(`  ${ok ? 'ok  ' : 'FALHA'} ${rotulo}: ${JSON.stringify(real)}`)
  if (!ok) falhas.push(rotulo)
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))

const estado = () => page.evaluate(() => {
  const s = window.__nos?.scene
  return {
    id: s?.id, fase: s?.fase, frase: s?.frase, passo: s?.passo, sel: s?.sel,
    achados: s?.achados?.size, larg: s?.corredorLargura, quais: s?.achados ? [...s.achados] : null, x: Math.round(s?.liam?.x ?? 0),
    intensidade: s?.intensidade?.toFixed?.(2),
  }
})
const falando = () => page.evaluate(() => !!window.__nos?.scene?.dialogue?.active)
const caixas = () => page.evaluate(() => window.__nos?.scene?.caixas ?? [])

async function limpar(max = 14) {
  for (let i = 0; i < max; i++) {
    if (!(await falando())) return
    await page.mouse.click(640, 120)
    await page.waitForTimeout(260)
  }
}
async function esperarFase(alvo, ms = 45000) {
  const ate = Date.now() + ms
  while (Date.now() < ate) {
    if ((await estado()).fase === alvo) return true
    await limpar(2)
    await page.waitForTimeout(300)
  }
  return false
}
async function esperarCena(alvo, ms = 90000) {
  const ate = Date.now() + ms
  while (Date.now() < ate) {
    if ((await estado()).id === alvo) return true
    await limpar(2)
    await page.waitForTimeout(350)
  }
  return false
}
/** Toca clicando nas teclas desenhadas. */
async function tocar(graus) {
  for (const g of graus) {
    const c = await caixas()
    const r = c[g]
    if (!r) throw new Error(`tecla ${g} não está na tela`)
    await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2)
    await page.waitForTimeout(240)
  }
}

await page.goto(URL + '?debug=1')
await page.waitForTimeout(1300)
console.log('\nverificações (somente mouse):')

{
  const fit = await page.evaluate(() => {
    const c = document.getElementById('game')
    const b = c.getBoundingClientRect()
    return Math.abs(b.width - innerWidth) <= 2 && Math.abs(b.height - innerHeight) <= 2
  })
  esperar('canvas preenche a janela', fit, true)
}

// Menu -> demo
{
  const c = await caixas()
  await page.mouse.click(c[0].x + c[0].w / 2, c[0].y + c[0].h / 2)
}
esperar('o prólogo chega na vez do jogador', await esperarFase('toca'), true)
await limpar()
if (OUT) await page.screenshot({ path: `${OUT}/a-piano.png` })

// As três frases do tema, cada uma maior que a anterior
for (let f = 0; f < 3; f++) {
  const st = await estado()
  await tocar(TEMA[st.frase ?? f])
  await page.waitForTimeout(450)
  await limpar()
  if (f < 2) {
    esperar(`frase ${f + 1} aceita`, (await estado()).frase, f + 1)
    await esperarFase('toca', 25000)
    await limpar()
  }
}
esperar('tema inteiro aprendido', (await estado()).fase, 'livre')
if (OUT) await page.screenshot({ path: `${OUT}/b-livre.png` })

// A Mesa e seus vestígios
// --- A Casa: quatro cômodos ligados por portas ---------------------------
esperar('a sala vira casa explorável', await esperarCena('demo-casa'), true)
await limpar()

const comodo = () => page.evaluate(() => window.__nos?.scene?.comodoAtual)
/**
 * Clica num ponto do cômodo até acontecer o que se espera: Liam anda até lá
 * e usa o que houver. Insiste, porque uma fala no meio do caminho interrompe
 * a caminhada e é preciso clicar de novo.
 */
async function irEUsar(alvoMundo, pronto, tentativas = 10) {
  for (let i = 0; i < tentativas; i++) {
    if (await pronto()) return true
    await limpar()
    if (await pronto()) return true
    const cam = await page.evaluate(() => window.__nos?.scene?.camX?.() ?? 0)
    const pt = await page.evaluate((a) => window.__nos?.paraTela?.(a, 140), alvoMundo - cam)
    if (!pt) return false
    await page.mouse.click(pt.x, pt.y)
    for (let k = 0; k < 45; k++) {
      if (await pronto()) return true
      if (await falando()) break
      await page.waitForTimeout(150)
    }
  }
  return await pronto()
}

const emComodo = (alvo) => async () => (await estado()).id !== 'demo-casa' || (await comodo()) === alvo
const saiuDaCasa = async () => (await estado()).id !== 'demo-casa'
const achou = (n) => async () => ((await estado()).achados ?? 0) >= n

esperar('a porta da sala leva ao corredor', await irEUsar(340, emComodo('corredor')), true)
esperar('o corredor leva ao quarto', await irEUsar(150, emComodo('quarto')), true)
esperar('a caixa debaixo da cama foi aberta', await irEUsar(148, achou(1)), true)
esperar('dá para voltar ao corredor', await irEUsar(210, emComodo('corredor')), true)
// A cozinha pede dois usos: o primeiro avisa, o segundo desce.
esperar('a cozinha encerra a exploração', await irEUsar(268, saiuDaCasa), true)

esperar('a cozinha começa a noite', await esperarCena('demo-mesa'), true)
await esperarFase('preso')
await limpar()
if (OUT) await page.screenshot({ path: `${OUT}/c-mesa.png` })

// Clicar em cima de um vestígio: Liam anda até lá e examina ao chegar.
// Insiste até o vestígio entrar na lista — um pensamento pode interromper a
// caminhada no meio, e aí é só clicar de novo.
for (const [alvo, id] of [[116, 'malas'], [158, 'bilhete'], [200, 'fogao'], [262, 'telefone']]) {
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const st = await estado()
    if (st.id !== 'demo-mesa' || st.quais?.includes(id)) break
    await limpar()
    const pt = await page.evaluate((a) => window.__nos?.paraTela?.(a, 150), alvo)
    if (!pt) throw new Error('sem conversão de coordenadas')
    await page.mouse.click(pt.x, pt.y)
    for (let i = 0; i < 40; i++) {
      const s2 = await estado()
      if (s2.id !== 'demo-mesa' || s2.quais?.includes(id)) break
      await page.waitForTimeout(150)
    }
    await limpar()
  }
}
esperar('os quatro vestígios foram encontrados', (await estado()).achados, 4)
if (OUT) await page.screenshot({ path: `${OUT}/d-achados.png` })

// A câmara: o mesmo tema abre os fios
esperar('a Mesa empurra Liam para o porão', await esperarCena('demo-tear'), true)
esperar('o Tear aceita entrada', await esperarFase('absorvendo'), true)
await limpar()
if (OUT) await page.screenshot({ path: `${OUT}/e-tear-piano.png` })

for (let i = 0; i < 6; i++) {
  const st = await estado()
  if (st.fase !== 'absorvendo') break
  await tocar(TEMA[(st.sel ?? 0) % 3])
  await page.waitForTimeout(500)
  await limpar(3)
  if (i === 2 && OUT) await page.screenshot({ path: `${OUT}/f-tear-meio.png` })
}
{
  const e = await estado()
  esperar('os seis fios foram abertos pela melodia', e.fase, 'pico')
  esperar('intensidade no máximo', Number(e.intensidade) >= 1, true)
}
if (OUT) await page.screenshot({ path: `${OUT}/g-pico.png` })

esperar('o clímax correu sozinho até o fim', await esperarCena('demo-fim', 40000), true)
esperar('sem erros de runtime', errs, [])
if (OUT) await page.screenshot({ path: `${OUT}/h-fim.png` })

await browser.close()
if (falhas.length) {
  console.error(`\n${falhas.length} falha(s): ${falhas.join(', ')}`)
  process.exit(1)
}
console.log('\ndemo jogável de ponta a ponta.')
