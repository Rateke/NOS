/**
 * Teste de integração da demo "Só mais um": joga o prólogo musical e a câmara
 * do Tear num navegador real, conferindo que a frase é aceita, que os seis
 * fios podem ser absorvidos e que o clímax corre sozinho até o fim.
 *
 *   npm run build && npm run preview &
 *   npm run test:demo
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
const OUT = process.env.OUT ?? null
if (OUT) mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const falhas = []
function esperar(rotulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado)
  console.log(`  ${ok ? 'ok  ' : 'FALHA'} ${rotulo}: ${JSON.stringify(real)}`)
  if (!ok) falhas.push(rotulo)
}
const errs = []
page.on('pageerror', e => errs.push(String(e)))

const falando = () => page.evaluate(() => !!window.__nos?.scene?.dialogue?.active)
const estado = () => page.evaluate(() => {
  const s = window.__nos?.scene
  return { id: s?.id, fase: s?.fase, intensidade: s?.intensidade?.toFixed?.(2) }
})
async function limpar(max = 14) {
  for (let i = 0; i < max; i++) {
    if (!(await falando())) return
    await page.keyboard.press('Space')
    await page.waitForTimeout(300)
  }
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

await page.goto((process.env.URL ?? 'http://localhost:4173/') + '?debug=1')
await page.waitForTimeout(1200)
if (OUT) await page.screenshot({ path: `${OUT}/a-menu.png` })

await page.keyboard.press('Space')
await page.waitForTimeout(2200)
await limpar()
await page.waitForTimeout(4200)            // Adrian toca a frase
if (OUT) await page.screenshot({ path: `${OUT}/b-prologo.png` })

await limpar()
for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp']) {
  await page.keyboard.press(k)
  await page.waitForTimeout(430)
}
await page.waitForTimeout(700)
console.log('\nverificações:')
esperar('a frase musical foi aceita', (await estado()).fase, 'acerto')
if (OUT) await page.screenshot({ path: `${OUT}/c-acerto.png` })

await limpar()
esperar('a sala dá lugar à cozinha', await esperarCena('demo-mesa'), true)
if (OUT) await page.screenshot({ path: `${OUT}/d0-mesa.png` })

// A Mesa não tem ponto neutro: a tensão sobe sozinha até ele correr.
esperar('a Mesa empurra Liam para o porão', await esperarCena('demo-tear'), true)
await page.waitForTimeout(800)
if (OUT) await page.screenshot({ path: `${OUT}/d-tear-chegada.png` })

esperar('o Tear aceita entrada', await esperarFase('absorvendo'), true)

// Absorver os seis fios
for (let i = 0; i < 6; i++) {
  await page.keyboard.down('KeyE')
  await page.waitForTimeout(1750)
  await page.keyboard.up('KeyE')
  await page.waitForTimeout(450)
  if (i === 0) if (OUT) await page.screenshot({ path: `${OUT}/e-primeiro-fio.png` })
  if (i === 3) if (OUT) await page.screenshot({ path: `${OUT}/f-tear-meio.png` })
}
{
  const e = await estado()
  esperar('os seis fios foram absorvidos', e.fase, 'pico')
  esperar('intensidade no máximo', Number(e.intensidade) >= 1, true)
}
if (OUT) await page.screenshot({ path: `${OUT}/g-pico.png` })

await limpar()
await page.waitForTimeout(3000)
if (OUT) await page.screenshot({ path: `${OUT}/h-corte.png` })
await page.waitForTimeout(6000)
if (OUT) await page.screenshot({ path: `${OUT}/i-fim.png` })
esperar('o clímax correu sozinho até o fim', (await estado()).id, 'demo-fim')
esperar('sem erros de runtime', errs, [])
await browser.close()
if (falhas.length) {
  console.error(`\n${falhas.length} falha(s): ${falhas.join(', ')}`)
  process.exit(1)
}
console.log('\ndemo jogável de ponta a ponta.')
