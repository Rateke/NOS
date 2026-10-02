/**
 * O jogo num celular: tela deitada e em pé, só no toque.
 *
 * Em pé, o jogo para e pede para virar. Deitado, o cenário preenche a
 * altura; um toque liga o som; o piano responde ao dedo; arrastar na metade
 * esquerda anda; tocar em qualquer lugar passa a fala.
 *
 *   npm run build && npm run preview &
 *   npm run test:celular
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const URL = process.env.URL ?? 'http://localhost:4173/'
const OUT = process.env.OUT ?? null
if (OUT) mkdirSync(OUT, { recursive: true })
const TEMA = [[0, 2, 4, 3], [0, 2, 4, 6, 5], [0, 2, 4, 3, 2, 1, 0]]
const falhas = []
function esperar(rotulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado)
  console.log(`  ${ok ? 'ok  ' : 'FALHA'} ${rotulo}: ${JSON.stringify(real)}`)
  if (!ok) falhas.push(rotulo)
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
const cdp = await ctx.newCDPSession(page)
const erros = []
page.on('pageerror', (e) => erros.push(String(e)))
const st = () => page.evaluate(() => {
  const s = window.__nos?.scene
  return { id: s?.id, fase: s?.fase, frase: s?.frase, x: Math.round(s?.liam?.x ?? 0), falando: !!(s?.dialogue?.active || s?.lendo || s?.ocupado) }
})
const tocar = async (x, y) => { await page.touchscreen.tap(x, y); await page.waitForTimeout(240) }
console.log('\nverificações (celular):')

// --- Em pé: o jogo para e pede para virar ---------------------------------
await page.setViewportSize({ width: 390, height: 844 })
await page.goto(URL + '?debug=1&cena=casa')
await page.waitForTimeout(800)
await tocar(200, 400)
const antes = await page.evaluate(() => window.__nos.scene.tCut ?? 0)
await page.waitForTimeout(1200)
if (OUT) await page.screenshot({ path: `${OUT}/cel-a-empe.png` })
esperar('em pé, o jogo fica parado', await page.evaluate(() => window.__nos.scene.tCut ?? 0), antes)
await page.setViewportSize({ width: 844, height: 390 })
await page.waitForTimeout(800)
esperar('deitado, ele continua', (await page.evaluate(() => window.__nos.scene.tCut ?? 0)) > antes, true)

// --- Deitado: o cenário preenche a altura ---------------------------------
const escala = await page.evaluate(() => {
  const c = document.getElementById('game')
  return { h: c.getBoundingClientRect().height }
})
esperar('o canvas ocupa a tela', escala.h, 390)
if (OUT) await page.screenshot({ path: `${OUT}/cel-b-casa.png` })

// --- Do menu ao piano, só no dedo -----------------------------------------
// Abrir ?cena=casa acima gravou o jogo; o menu tem de começar do zero.
await page.evaluate(() => localStorage.clear())
await page.goto(URL + '?debug=1')
await page.waitForTimeout(800)
await tocar(422, 195)
esperar('um toque liga o som', await page.evaluate(() => window.__nos.audio.contexto?.state), 'running')
for (let i = 0; i < 40; i++) {
  if (await page.evaluate(() => window.__nos?.scene?.fase === 'pronto' && (window.__nos.scene.caixas?.length ?? 0) > 0)) break
  await page.waitForTimeout(250)
}
const caixa = (await page.evaluate(() => window.__nos.scene.caixas))[0]
await tocar(caixa.x + caixa.w / 2, caixa.y + caixa.h / 2)
// Passa as falas tocando na metade ESQUERDA: qualquer toque confirma.
// (O rádio do começo corre sozinho; depois vem o piano.)
for (const fim = Date.now() + 150000; Date.now() < fim;) {
  const e = await st()
  if (process.env.DBG && `${e.id}:${e.fase}` !== globalThis.ult) { globalThis.ult = `${e.id}:${e.fase}`; console.log('   ', globalThis.ult) }
  if (e.fase === 'toca') break
  if (e.falando) await tocar(120, 120)
  else await page.waitForTimeout(250)
}
esperar('tocar na metade esquerda passa as falas', [(await st()).id, (await st()).fase], ['demo-prologo', 'toca'])
const tecla = async (g) => {
  const c = await page.evaluate(() => window.__nos.scene.caixas)
  const r = c[g]
  await tocar(r.x + r.w / 2, r.y + r.h / 2)
}
for (let i = 0; i < 20 && (await st()).falando; i++) await tocar(120, 120)
for (const g of TEMA[0]) await tecla(g)
await page.waitForTimeout(500)
esperar('o piano responde ao dedo', (await st()).frase, 1)
if (OUT) await page.screenshot({ path: `${OUT}/cel-c-piano.png` })

// --- Arrastar na metade esquerda anda -------------------------------------
await page.goto(URL + '?debug=1&cena=casa')
await page.waitForTimeout(800)
await tocar(600, 100)
for (let i = 0; i < 80; i++) {
  const e = await st()
  if (!e.falando) break
  await tocar(600, 100)
}
const x0 = (await st()).x
const ponto = (x, y) => [{ x, y, id: 1 }]
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: ponto(150, 300) })
for (let k = 1; k <= 6; k++) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: ponto(150 + k * 12, 300) })
  await page.waitForTimeout(30)
}
await page.waitForTimeout(1500)
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
await page.waitForTimeout(300)
esperar('arrastar para a direita anda para a direita', (await st()).x > x0 + 20, true)
esperar('sem erros de runtime', erros, [])

await browser.close()
if (falhas.length) {
  console.error(`\n${falhas.length} falha(s): ${falhas.join(', ')}`)
  process.exit(1)
}
console.log('\no celular joga.')
