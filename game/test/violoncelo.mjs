// Os segredos do menu e o violoncelo da casa depois do grito.
//
// Uso: com `npx vite preview --port 4173` no ar, `node test/violoncelo.mjs`.
// SHOTS=<pasta> grava capturas da partitura e do quinto retrato.
import { chromium } from 'playwright'

const URL = process.env.URL ?? 'http://localhost:4173/'
const OUT = process.env.SHOTS
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const erros = []
page.on('pageerror', (e) => erros.push(e.message))

let falhas = 0
function esperar(nome, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado)
  if (!ok) falhas++
  console.log(`  ${ok ? 'ok ' : 'FALHOU'} ${nome}${ok ? '' : `  (veio ${JSON.stringify(real)}, esperava ${JSON.stringify(esperado)})`}`)
}

const cena = () => page.evaluate(() => window.__nos?.scene?.id)
const s = (fn) => page.evaluate(fn)
async function ate(cond, ms = 15000) {
  const fim = Date.now() + ms
  while (Date.now() < fim) {
    if (await cond()) return true
    await page.waitForTimeout(150)
  }
  return false
}
async function digitar(palavra) {
  for (const l of palavra) {
    await page.keyboard.press(`Key${l.toUpperCase()}`)
    await page.waitForTimeout(90)
  }
  await page.waitForTimeout(250)
}

console.log('\nsegredos do menu:')
await page.goto(URL + '?debug=1')
await page.evaluate(() => {
  const estado = { resolved: [], seen: [], inventory: [], diaryRead: false, doorAttempts: 0, segredos: [], sabe: [], camadas: [], apresentados: [], sombraEscreve: false }
  localStorage.setItem('nos:salvo', JSON.stringify({ v: 1, ponto: 'depois', quando: Date.now(), estado }))
  localStorage.setItem('nos:demo', JSON.stringify({ terminou: true, viuEscolha: true, escolha: 'lia' }))
})
await page.reload()
await ate(async () => (await cena()) === 'title')
// O menu só aceita o primeiro toque depois de 0,7 s no preto.
await ate(() => s(() => window.__nos.scene.t > 0.9))
await page.keyboard.press('Space')
await ate(() => s(() => window.__nos.scene.fase === 'pronto'))
await page.waitForTimeout(300)

await digitar('nos')
esperar('"nos" derruba o acento', await s(() => window.__nos.scene.acento > 0), true)
await digitar('elisa')
esperar('digitar "elisa" não escolhe nada no menu', [await cena(), await s(() => window.__nos.scene.fase)], ['title', 'pronto'])
esperar('"elisa" deixa o recado roxo', await s(() => window.__nos.scene.aviso?.texto ?? null), 'Eu também cortei o meu. — E.')
await digitar('liam')
esperar('"liam" responde', await s(() => window.__nos.scene.aviso?.texto ?? null), 'Ainda tô aqui.')
esperar('a seleção não andou com as letras', await s(() => window.__nos.scene.sel), 0)
if (OUT) await page.screenshot({ path: `${OUT}/v-menu.png` })

console.log('\no violoncelo:')
await page.keyboard.press('Space')
await ate(async () => (await cena()) === 'demo-casa', 20000)
esperar('continuar abre a casa depois do grito', await s(() => window.__nos.scene.depois), true)
for (let i = 0; i < 40; i++) {
  if (await s(() => !window.__nos.scene.dialogue.active && !window.__nos.scene.ocupado)) break
  await page.keyboard.press('Space')
  await page.waitForTimeout(200)
}
// Leva Liam ao quarto dele, embaixo do violoncelo.
await s(() => {
  const c = window.__nos.scene
  c.atual = c.comodos.get('quarto')
  c.liam.x = 246
  c.liam.y = c.atual.passoY
})
await page.waitForTimeout(300)
esperar('o violoncelo está ao alcance', await s(() => window.__nos.scene.vestigioPerto()?.id ?? null), 'violoncelo')
await page.keyboard.press('KeyE')
for (let i = 0; i < 20 && !(await s(() => window.__nos.scene.tocandoCello)); i++) {
  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
}
esperar('Liam senta com o violoncelo', await s(() => window.__nos.scene.tocandoCello), true)

const TECLA = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK']
// A mesma de src/game/content/violoncelo.ts.
const PARTITURA = [0, 1, 3, 2, 4, 5, 7, 4, 5, 7]
// Uma tecla por quadro: um intervalo curto entre elas, como uma pessoa toca.
await page.keyboard.press(TECLA[PARTITURA[0]])
await page.waitForTimeout(120)
await page.keyboard.press(TECLA[PARTITURA[1]])
await page.waitForTimeout(200)
esperar('duas notas certas andam a partitura', await s(() => window.__nos.scene.partituraIdx), 2)
await page.keyboard.press('KeyJ')
await page.waitForTimeout(200)
esperar('uma errada volta ao começo, sem sair', [await s(() => window.__nos.scene.partituraIdx), await s(() => window.__nos.scene.tocandoCello)], [0, true])
for (const [i, n] of PARTITURA.entries()) {
  await page.keyboard.press(TECLA[n])
  await page.waitForTimeout(260)
  if (i === 5 && OUT) await page.screenshot({ path: `${OUT}/v-partitura.png` })
}
await page.waitForTimeout(300)
esperar('a partitura inteira vira segredo', await s(() => window.__nos.state.segredos.has('partitura')), true)
const falas = new Set()
for (let i = 0; i < 30; i++) {
  const r = await s(() => ({ t: window.__nos.scene.dialogue?.atual?.text ?? null, a: window.__nos.scene.dialogue.active }))
  if (r.t) falas.add(r.t)
  if (!r.a) break
  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
}
esperar('o piano responde lá embaixo', [...falas].some((t) => t.includes('o piano responde')), true)
await page.keyboard.press('Escape')
await page.waitForTimeout(250)
esperar('Esc devolve o violoncelo (e não pausa)', [await s(() => window.__nos.scene.tocandoCello), await s(() => window.__nos.pausa.aberta)], [false, false])

await s(() => {
  const c = window.__nos.scene
  c.atual = c.comodos.get('sala')
  c.liam.x = 266
  c.liam.y = c.atual.passoY
})
await page.waitForTimeout(2500)
esperar('o quinto retrato apareceu na sala', await s(() => window.__nos.scene.quinto > 0.5), true)
if (OUT) await page.screenshot({ path: `${OUT}/v-sala.png` })
await page.keyboard.press('KeyE')
const retrato = new Set()
for (let i = 0; i < 30; i++) {
  const r = await s(() => ({ t: window.__nos.scene.dialogue?.atual?.text ?? null, a: window.__nos.scene.dialogue.active }))
  if (r.t) retrato.add(r.t)
  if (!r.a && i > 2) break
  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
}
esperar('atrás do retrato: "eu escutei"', [...retrato].some((t) => t.includes('eu escutei')), true)

esperar('nenhum erro de página', erros, [])
await browser.close()
console.log(falhas ? `\n${falhas} falha(s)` : '\no violoncelo está de pé.')
process.exit(falhas ? 1 : 0)
