/**
 * A primeira partida: nada de "de novo" antes de zerar.
 *
 *   npm run build && npm run preview &
 *   node test/primeira.mjs
 *
 * Com o navegador limpo, joga do menu até o prólogo e entra pelos pontos
 * salvos na casa, na cozinha e no Tear: nenhuma fala de quem já terminou
 * aparece, e o jogo não grava que terminou. Só a cena do fim grava — e aí o
 * menu muda (o S bordado de volta).
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
const s = (fn, arg) => page.evaluate(fn, arg)
const terminou = () => s(() => JSON.parse(localStorage.getItem('nos:demo') ?? '{}').terminou === true)

/** Falas de quem já zerou: nenhuma pode aparecer na primeira vez. */
const DE_NOVO = [
  'De novo, filho?', 'Você já sabe essa.', 'Eu já te falei tudo isso',
  'Você já esteve aqui.', 'Da outra vez tinha.', 'Eu sei o que vem agora.',
  'Você já sabe como termina.',
]
const vistas = new Set()
async function ouvir(ms, ate = () => false) {
  const fim = Date.now() + ms
  while (Date.now() < fim) {
    const r = await s(() => {
      const c = window.__nos?.scene
      const l = c?.dialogue?.atual ?? c?.montagem?.dialogue?.atual ?? null
      return { id: c?.id, texto: l?.text ?? null }
    })
    if (r.texto) vistas.add(r.texto)
    if (await ate(r)) return true
    await page.keyboard.press('Space')
    await page.waitForTimeout(200)
  }
  return false
}
async function entrar(ponto, cena) {
  await s((ponto) => {
    const estado = { resolved: [], seen: [], inventory: [], diaryRead: false, doorAttempts: 0, segredos: [], sabe: [], camadas: [], apresentados: [], sombraEscreve: false }
    localStorage.setItem('nos:salvo', JSON.stringify({ v: 1, ponto, quando: Date.now(), estado }))
  }, ponto)
  await page.reload()
  await page.waitForTimeout(1200)
  await page.mouse.click(640, 360)
  for (let i = 0; i < 40 && (await s(() => window.__nos?.scene?.fase)) !== 'pronto'; i++) await page.waitForTimeout(150)
  await page.waitForTimeout(300)
  await page.keyboard.press('Space')
  for (let i = 0; i < 100 && (await s(() => window.__nos?.scene?.id)) !== cena; i++) await page.waitForTimeout(200)
  await page.waitForTimeout(400)
}

console.log('\na primeira partida:')

// 1. Navegador limpo: o menu não sabe de nada.
await page.goto(URL + '?debug')
await s(() => { localStorage.removeItem('nos:demo'); localStorage.removeItem('nos:salvo') })
await page.reload()
await page.waitForTimeout(1200)
await page.mouse.click(640, 360)
await page.waitForTimeout(5200)
esperar('o menu da primeira vez (S impresso, sem bordado)', await s(() => window.__nos.scene.deNovo), false)

// 2. Começar: o rádio e o prólogo, do jeito da primeira vez.
await page.keyboard.press('Space')
esperar('chega ao prólogo', await ouvir(120000, (r) => r.id === 'demo-prologo'), true)
await ouvir(6000)
esperar('o pai não diz "De novo, filho?"', await s(() => window.__nos.scene.deNovo), false)

// 3. A casa, a cozinha e o Tear, pelos pontos salvos.
await entrar('casa', 'demo-casa')
await ouvir(40000, async () => s(() => { const c = window.__nos.scene; return !c.dialogue.active && !c.cutscene }))
esperar('a casa não lembra de outra vez', await s(() => window.__nos.scene.outraVez), false)
esperar('o relógio do corredor anda', await s(() => window.__nos.scene.horaDaCasa().parado), false)
await entrar('mesa', 'demo-mesa')
await ouvir(8000)
await entrar('tear', 'demo-tear')
await ouvir(8000, async () => s(() => window.__nos.scene.lendo))
esperar('o Tear não lembra de outra vez', await s(() => window.__nos.scene.deNovo), false)

const repetidas = DE_NOVO.filter((f) => [...vistas].some((v) => v.startsWith(f)))
esperar('nenhuma fala de quem já zerou apareceu', repetidas, [])
esperar('nada disso grava que terminou', await terminou(), false)

// 4. Só a cena do fim grava — e aí o menu muda.
await entrar('fim', 'demo-fim')
await page.waitForTimeout(800)
esperar('a cena do fim grava que terminou', await terminou(), true)
await s(() => localStorage.removeItem('nos:salvo'))
await page.reload()
await page.waitForTimeout(1200)
await page.mouse.click(640, 360)
await page.waitForTimeout(5200)
esperar('depois de zerar, o menu muda (o S bordado)', await s(() => window.__nos.scene.deNovo), true)

esperar('sem erros de runtime', errs, [])
await browser.close()
if (falhas.length) {
  console.error(`\n${falhas.length} falha(s): ${falhas.join(', ')}`)
  process.exit(1)
}
console.log('\na primeira vez é a primeira vez.')
