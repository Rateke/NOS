/**
 * Teste de integração da fatia vertical: abre o jogo num navegador real e
 * joga a abertura inteira pelo teclado, conferindo que o quarto pode ser
 * arrumado e que a porta só cede depois disso.
 *
 *   npm run build && npm run preview &   # servidor em :4173
 *   npm test
 *
 * OUT=<dir> salva capturas de cada momento.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = process.env.OUT ?? null
const URL = process.env.URL ?? 'http://localhost:4173/'
if (OUT) mkdirSync(OUT, { recursive: true })

const failures = []
function expect(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`  ${ok ? 'ok  ' : 'FALHA'} ${label}: ${JSON.stringify(actual)}`)
  if (!ok) failures.push(`${label}: esperado ${JSON.stringify(expected)}, veio ${JSON.stringify(actual)}`)
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))

await page.goto(URL + '?debug=1', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

const KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }
const pos = () => page.evaluate(() => {
  const s = window.__nos?.scene
  return s?.player ? { x: s.player.x, y: s.player.y } : null
})
const st = () => page.evaluate(() => {
  const s = window.__nos?.state
  return s ? {
    diaryRead: s.diaryRead, tidy: s.tidy, left: s.choresLeft(),
    pocket: s.inventory.map(i => i.name), attempts: s.doorAttempts,
  } : null
})
const talking = () => page.evaluate(() => !!window.__nos?.scene?.dialogue?.active)

async function clearDialogue(max = 12) {
  for (let i = 0; i < max; i++) {
    if (!(await talking())) return
    await page.keyboard.press('Space')
    await page.waitForTimeout(260)
  }
}

/** Anda até ficar perto de (tx,ty), corrigindo eixo a eixo. */
async function walkTo(tx, ty, budgetMs = 9000) {
  const t0 = Date.now()
  while (Date.now() - t0 < budgetMs) {
    const p = await pos()
    if (!p) return false
    const dx = tx - p.x, dy = ty - p.y
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return true
    const horiz = Math.abs(dx) > Math.abs(dy)
    const key = horiz ? (dx < 0 ? KEY.left : KEY.right) : (dy < 0 ? KEY.up : KEY.down)
    await page.keyboard.down(key)
    await page.waitForTimeout(70)
    await page.keyboard.up(key)
  }
  return false
}

async function grab(name, tx, ty, face) {
  await walkTo(tx, ty)
  if (face) { await page.keyboard.down(KEY[face]); await page.waitForTimeout(60); await page.keyboard.up(KEY[face]) }
  await page.keyboard.press('Space')
  await page.waitForTimeout(350)
  await clearDialogue()
  const s = await st()
  console.log(`  ${name.padEnd(12)} restam=${s.left}`)
}

// Entrar no jogo e pular a abertura
await page.keyboard.press('Space')
await page.waitForTimeout(600)
for (let i = 0; i < 6; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(450) }
await page.waitForTimeout(1200)
await clearDialogue()
console.log('\nverificações:')
{
  const s0 = await st()
  expect('nove tarefas no início', s0.left, 9)
  expect('diário ainda não lido', s0.diaryRead, false)
}

// A porta antes do diário: Liam nem sabe o que falta
await walkTo(326, 128)
await page.keyboard.down(KEY.right); await page.waitForTimeout(80); await page.keyboard.up(KEY.right)
await page.keyboard.press('Space'); await page.waitForTimeout(400)
if (OUT) await page.screenshot({ path: `${OUT}/07-porta-sem-diario.png` })
await clearDialogue()

// Ler o diário
await walkTo(196, 88)
await page.keyboard.down(KEY.up); await page.waitForTimeout(80); await page.keyboard.up(KEY.up)
await page.keyboard.press('Space'); await page.waitForTimeout(500)
if (OUT) await page.screenshot({ path: `${OUT}/08-diario.png` })
await clearDialogue()
expect('diário lido', (await st()).diaryRead, true)
if (OUT) await page.screenshot({ path: `${OUT}/09-bagunca-visivel.png` })

// A porta com o quarto bagunçado: três recusas
for (let i = 0; i < 3; i++) {
  await walkTo(326, 128)
  await page.keyboard.down(KEY.right); await page.waitForTimeout(80); await page.keyboard.up(KEY.right)
  await page.keyboard.press('Space'); await page.waitForTimeout(400)
  if (i === 2 && OUT) await page.screenshot({ path: `${OUT}/10-recusa-final.png` })
  await clearDialogue()
}
{
  const s1 = await st()
  expect('três recusas na porta', s1.attempts, 3)
  expect('porta não abriu com o quarto bagunçado', s1.tidy, false)
}

// Arrumar o quarto inteiro
console.log('arrumando:')
await grab('papel',    127, 101, 'up')
await grab('desenho1', 153, 137, 'up')
await grab('roupa1',   124, 164, 'up')
await grab('botao',    100, 194, 'up')
await grab('pedra',    170, 194, 'up')
await grab('roupa2',   201, 188, 'up')
await grab('desenho2', 271, 169, 'up')
await grab('chave',    305, 189, 'up')
await grab('passagem', 298, 130, 'up')
await clearDialogue()

const s2 = await st()
expect('nenhuma tarefa restante', s2.left, 0)
expect('quarto arrumado', s2.tidy, true)
expect('cinco objetos no bolso', s2.pocket.length, 5)
if (OUT) await page.screenshot({ path: `${OUT}/11-quarto-arrumado.png` })

// A porta agora abre
await walkTo(326, 128)
await page.keyboard.down(KEY.right); await page.waitForTimeout(80); await page.keyboard.up(KEY.right)
await page.keyboard.press('Space'); await page.waitForTimeout(500)
if (OUT) await page.screenshot({ path: `${OUT}/12-porta-abre.png` })
await clearDialogue()
await page.waitForTimeout(5000)
if (OUT) await page.screenshot({ path: `${OUT}/13-capitulo.png` })

// A cena final tem de ser o cartão de capítulo.
const ended = await page.evaluate(() => window.__nos?.scene?.id ?? '?')
expect('terminou no cartão de capítulo', ended, 'chapter-card')
expect('sem erros de runtime', errors, [])

await browser.close()

if (failures.length) {
  console.error(`\n${failures.length} falha(s):`)
  for (const f of failures) console.error('  - ' + f)
  process.exit(1)
}
console.log('\nfatia vertical jogável de ponta a ponta.')
