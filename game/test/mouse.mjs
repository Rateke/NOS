/**
 * Prova que a demo é jogável inteira com o mouse, sem nenhuma tecla — é o
 * caminho de quem abre o jogo dentro de um painel, onde o teclado pode nem
 * chegar à página.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = process.env.OUT ?? null
const URL = process.env.URL ?? 'http://localhost:4173/'
if (OUT) mkdirSync(OUT, { recursive: true })

const falhas = []
function esperar(rotulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado)
  console.log(`  ${ok ? 'ok  ' : 'FALHA'} ${rotulo}: ${JSON.stringify(real)}`)
  if (!ok) falhas.push(rotulo)
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errs = []
page.on('pageerror', e => errs.push(String(e)))

const estado = () => page.evaluate(() => {
  const s = window.__nos?.scene
  return { id: s?.id, fase: s?.fase, intensidade: s?.intensidade?.toFixed?.(2) }
})
const falando = () => page.evaluate(() => !!window.__nos?.scene?.dialogue?.active)
/** Avança falas clicando — nunca com tecla. */
async function limpar(max = 14) {
  for (let i = 0; i < max; i++) {
    if (!(await falando())) return
    await page.mouse.click(640, 690)
    await page.waitForTimeout(300)
  }
}
/**
 * Clica numa caixa desenhada pela cena. Espera ela existir em vez de
 * cronometrar: as cenas só desenham suas caixas na fase certa.
 */
const caixas = () => page.evaluate(() => window.__nos?.scene?.caixas ?? [])
async function clicarCaixa(i, esperaMs = 12000) {
  const ate = Date.now() + esperaMs
  let cs = await caixas()
  while (!cs[i] && Date.now() < ate) {
    await page.waitForTimeout(200)
    cs = await caixas()
  }
  const r = cs[i]
  if (!r) throw new Error(`caixa ${i} não apareceu em ${esperaMs}ms`)
  await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2)
}

/** Espera uma cena específica, limpando falas pelo caminho. */
async function esperarCena(alvo, ms = 60000) {
  const ate = Date.now() + ms
  while (Date.now() < ate) {
    const e = await estado()
    if (e.id === alvo) return true
    await limpar(3)
    await page.waitForTimeout(400)
  }
  return false
}

/** Espera uma fase dentro da cena atual, limpando falas pelo caminho. */
async function esperarFase(alvo, ms = 30000) {
  const ate = Date.now() + ms
  while (Date.now() < ate) {
    if ((await estado()).fase === alvo) return true
    await limpar(3)
    await page.waitForTimeout(300)
  }
  return false
}

await page.goto(URL + '?debug=1')
await page.waitForTimeout(1400)

console.log('\nverificações (somente mouse):')
await clicarCaixa(0)                       // "Demo — Só mais um"
await page.waitForTimeout(2200)
esperar('menu entrou na demo pelo clique', (await estado()).id, 'demo-prologo')

await limpar()
await page.waitForTimeout(4400)            // Adrian toca a frase
await limpar()
if (OUT) await page.screenshot({ path: `${OUT}/mouse-prologo.png` })

// A frase é ← → ↓ ↑ = caixas 0, 2, 3, 1
for (const i of [0, 2, 3, 1]) {
  await clicarCaixa(i)
  await page.waitForTimeout(430)
  await limpar()                           // um erro reabre fala; limpa e segue
}
await page.waitForTimeout(700)
// 'acerto' é o elogio de Adrian; 'saida' é o calor já indo embora. As duas
// significam que a frase foi aceita.
{
  const f = (await estado()).fase
  esperar('frase tocada com cliques', ['acerto', 'saida'].includes(f), true)
}

await limpar()
esperar('passou pela Mesa até o Tear', await esperarCena('demo-tear'), true)
await page.waitForTimeout(800)

esperar('o Tear aceita entrada', await esperarFase('absorvendo'), true)

// Absorver os seis fios segurando o botão do mouse.
for (let i = 0; i < 6; i++) {
  await page.mouse.move(640, 400)
  await page.mouse.down()
  await page.waitForTimeout(1750)
  await page.mouse.up()
  await page.waitForTimeout(450)
  if (i === 3 && OUT) await page.screenshot({ path: `${OUT}/mouse-tear.png` })
}
{
  const e = await estado()
  esperar('seis fios absorvidos com o mouse', e.fase, 'pico')
  esperar('intensidade no máximo', Number(e.intensidade) >= 1, true)
}

await page.waitForTimeout(9000)
esperar('chegou ao fim', (await estado()).id, 'demo-fim')
esperar('sem erros de runtime', errs, [])
if (OUT) await page.screenshot({ path: `${OUT}/mouse-fim.png` })

await browser.close()
if (falhas.length) {
  console.error(`\n${falhas.length} falha(s): ${falhas.join(', ')}`)
  process.exit(1)
}
console.log('\ndemo jogável inteira com o mouse.')
