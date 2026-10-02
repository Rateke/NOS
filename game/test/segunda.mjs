/**
 * A segunda partida: o jogo lembra de quem já terminou.
 *
 *   npm run build && npm run preview &
 *   node test/segunda.mjs
 *
 * Grava no navegador que a demo já foi terminada (e que da outra vez a Lia
 * foi salva), começa do zero e confere o que muda: o título, a Lia no rádio,
 * o pai no piano, a sombra na entrada da casa e o relógio parado.
 */
import { chromium } from 'playwright'

const URL = process.env.URL ?? 'http://localhost:4173/'
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

await page.goto(URL + '?debug')
await page.evaluate(() => {
  localStorage.setItem('nos:demo', JSON.stringify({ terminou: true, viuEscolha: true, escolha: 'lia', fugiu: true }))
  localStorage.removeItem('nos:salvo')
})
await page.reload()
await page.waitForTimeout(1200)
await page.mouse.click(640, 360)
await page.waitForTimeout(5200)

const cena = () => page.evaluate(() => window.__nos?.scene?.id)
esperar('o menu abre', await cena(), 'title')
esperar('o aviso de fuga foi lido e apagado', await page.evaluate(() => JSON.parse(localStorage.getItem('nos:demo')).fugiu), false)

// Só mais um: o rádio, a Lia, o prólogo.
await page.keyboard.press('Space')
const vistas = new Set()
async function ouvirAte(alvo, ms) {
  const ate = Date.now() + ms
  while (Date.now() < ate) {
    const r = await page.evaluate(() => {
      const s = window.__nos?.scene
      return { id: s?.id, texto: s?.dialogue?.atual?.text ?? null }
    })
    if (r.texto) vistas.add(r.texto)
    if (r.id === alvo) return true
    await page.keyboard.press('Space')
    await page.waitForTimeout(220)
  }
  return false
}
esperar('chega ao prólogo', await ouvirAte('demo-prologo', 120000), true)
esperar('a Lia diz que fala isso todo dia', [...vistas].some((t) => t.startsWith('Eu já te falei tudo isso')), true)

// O pai, logo na primeira fala.
for (let i = 0; i < 20; i++) {
  const t = await page.evaluate(() => window.__nos.scene.dialogue?.atual?.text ?? null)
  if (t) vistas.add(t)
  if (t === 'De novo, filho?') break
  await page.waitForTimeout(150)
}
esperar('o pai: "De novo, filho?"', vistas.has('De novo, filho?'), true)

// Pula para a casa por um salvo, e confere a entrada.
await page.evaluate(() => {
  const estado = { resolved: [], seen: [], inventory: [], diaryRead: false, doorAttempts: 0, segredos: [], sabe: [], camadas: [], apresentados: [], sombraEscreve: false }
  localStorage.setItem('nos:salvo', JSON.stringify({ v: 1, ponto: 'casa', quando: Date.now(), estado }))
})
await page.reload()
await page.waitForTimeout(1200)
await page.mouse.click(640, 360)
await page.waitForTimeout(5200)
await page.keyboard.press('Space')
for (let i = 0; i < 60 && (await cena()) !== 'demo-casa'; i++) await page.waitForTimeout(250)
esperar('a casa abre', await cena(), 'demo-casa')
const naCasa = new Set()
for (let i = 0; i < 60; i++) {
  const r = await page.evaluate(() => {
    const s = window.__nos.scene
    return { texto: s.dialogue?.atual?.text ?? null, sombra: !!s.dialogue?.atual?.sombra, livre: !s.dialogue.active && !s.ocupado }
  })
  if (r.texto) naCasa.add(`${r.sombra ? 'sombra:' : ''}${r.texto}`)
  if (naCasa.has('sombra:Você já esteve aqui.') && r.livre) break
  await page.keyboard.press('Space')
  await page.waitForTimeout(250)
}
esperar('a sombra na entrada: "Você já esteve aqui."', naCasa.has('sombra:Você já esteve aqui.'), true)
esperar('o relógio já começa parado nas 22h40', await page.evaluate(() => {
  const h = window.__nos.scene.horaDaCasa()
  return `${h.h}:${h.m} ${h.parado}`
}), '22:40 true')
esperar('ninguém embaixo do poste na segunda vez', await page.evaluate(() => {
  const s = window.__nos.scene
  s.liam.x = 170
  return new Promise((r) => setTimeout(() => r(s.vulto < 0.05), 1500))
}), true)

esperar('nenhum erro de página', errs, [])
await browser.close()
console.log(falhas.length ? `\n${falhas.length} falha(s): ${falhas.join(', ')}` : '\ntudo certo')
process.exit(falhas.length ? 1 : 0)
