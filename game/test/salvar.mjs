// Salvar, continuar, pausar e sair.
//
// Uso: com `npx vite preview --port 4173` no ar, `node test/salvar.mjs`.
// SHOTS=<pasta> grava capturas do menu, da pausa e da despedida.
import { chromium } from 'playwright'

const URL = process.env.URL ?? 'http://localhost:4173/'
const OUT = process.env.SHOTS
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const erros = []
page.on('pageerror', (e) => erros.push(e.message))

let falhas = 0
function esperar(nome, real, esperado) {
  const ok = real === esperado
  if (!ok) falhas++
  console.log(`  ${ok ? 'ok ' : 'FALHOU'} ${nome}${ok ? '' : `  (veio ${JSON.stringify(real)}, esperava ${JSON.stringify(esperado)})`}`)
}

const cena = () => page.evaluate(() => window.__nos?.scene?.id)
const acoes = () => page.evaluate(() => (window.__nos?.scene?.acoes ?? []).join(','))
const pontoSalvo = () => page.evaluate(() => window.__nos?.salvo?.ler()?.ponto ?? null)
const pausada = () => page.evaluate(() => !!window.__nos?.pausa?.aberta)

async function ate(cond, ms = 15000) {
  const fim = Date.now() + ms
  while (Date.now() < fim) {
    if (await cond()) return true
    await page.waitForTimeout(150)
  }
  return false
}

/** Abre o menu (o primeiro toque) e espera os itens. */
async function abrirMenu() {
  await ate(async () => (await cena()) === 'title')
  const fase = () => page.evaluate(() => window.__nos?.scene?.fase)
  if ((await fase()) === 'espera') await page.keyboard.press('Space')
  await ate(async () => (await fase()) === 'pronto')
  await page.waitForTimeout(300)
}

/** Escolhe um item do menu pelo nome da ação, pelo teclado. */
async function escolher(acao) {
  const lista = (await acoes()).split(',')
  const alvo = lista.indexOf(acao)
  const sel = await page.evaluate(() => window.__nos?.scene?.sel ?? 0)
  for (let i = sel; i < alvo; i++) {
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(120)
  }
  for (let i = sel; i > alvo; i--) {
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(120)
  }
  await page.keyboard.press('Space')
}

console.log('\nsalvar e continuar:')

// 1. Primeira vez: nada salvo, o menu oferece só começar e sair.
await page.goto(URL + '?debug=1')
await page.waitForTimeout(900)
await abrirMenu()
esperar('sem salvo: só começar e sair', await acoes(), 'novo,sair')
esperar('a Abertura e a Trilha própria saíram do menu', (await acoes()).includes('trilha'), false)
if (OUT) await page.screenshot({ path: `${OUT}/s1-menu-novo.png` })

// 2. Começar grava o primeiro ponto, já na chegada ao rádio.
await escolher('novo')
await ate(async () => (await cena()) === 'demo-hospital')
esperar('começar leva ao rádio', await cena(), 'demo-hospital')
esperar('chegar ao rádio grava o jogo', await pontoSalvo(), 'abertura')

// 3. Esc pausa: a cena congela.
await page.waitForTimeout(1500)
await page.keyboard.press('Escape')
await page.waitForTimeout(200)
esperar('Esc abre a pausa', await pausada(), true)
const t0 = await page.evaluate(() => window.__nos.scene.t)
await page.waitForTimeout(1000)
const t1 = await page.evaluate(() => window.__nos.scene.t)
esperar('com a pausa aberta a cena não anda', t1 === t0, true)
const somParado = await page.evaluate(() => window.__nos?.audio?.contexto?.state ?? 'sem-audio')
esperar('o som para junto', somParado === 'suspended' || somParado === 'sem-audio', true)
if (OUT) await page.screenshot({ path: `${OUT}/s2-pausa.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
esperar('Esc de novo volta ao jogo', await pausada(), false)
const t2 = await page.evaluate(() => window.__nos.scene.t)
esperar('e a cena volta a andar', t2 > t1, true)

// 4. Pausa → Voltar ao menu: o menu já abre pronto, agora com Continuar.
await page.keyboard.press('Escape')
await page.waitForTimeout(200)
await page.keyboard.press('ArrowDown')
await page.waitForTimeout(120)
await page.keyboard.press('Space')
await ate(async () => (await cena()) === 'title')
esperar('voltar ao menu', await cena(), 'title')
await ate(async () => (await page.evaluate(() => window.__nos?.scene?.fase)) !== 'espera', 3000)
esperar('voltando do jogo o menu não pede o toque inicial', await page.evaluate(() => window.__nos?.scene?.fase) !== 'espera', true)
await abrirMenu()
esperar('com salvo: continuar, começar e sair', await acoes(), 'continuar,novo,sair')

// 5. Um salvo mais adiante: a casa. Entrar pela produção também grava.
await page.goto(URL + '?debug=1&cena=mesa&segredos=melodia,piano-sala')
await page.waitForTimeout(1200)
esperar('chegar à mesa grava o jogo', await pontoSalvo(), 'mesa')
await page.goto(URL + '?debug=1')
await page.waitForTimeout(900)
await abrirMenu()
esperar('o salvo sobrevive a recarregar a página', await acoes(), 'continuar,novo,sair')
if (OUT) await page.screenshot({ path: `${OUT}/s3-menu-continuar.png` })
await escolher('continuar')
await ate(async () => (await cena()) === 'demo-mesa')
esperar('continuar volta para a mesa', await cena(), 'demo-mesa')
const segredos = await page.evaluate(() => [...window.__nos.state.segredos].sort().join(','))
esperar('com o que Liam sabia ao chegar', segredos, 'melodia,piano-sala')

// 6. "Só mais um" com salvo pede confirmação, e então apaga.
// (A pausa não abre no meio do escurecer: espera a cena clarear.)
await page.waitForTimeout(1200)
await page.keyboard.press('Escape')
await page.waitForTimeout(200)
await page.keyboard.press('ArrowDown')
await page.waitForTimeout(120)
await page.keyboard.press('Space')
await ate(async () => (await cena()) === 'title')
await abrirMenu()
await escolher('novo')
await page.waitForTimeout(500)
esperar('a primeira escolha só avisa', await cena(), 'title')
if (OUT) await page.screenshot({ path: `${OUT}/s4-confirmar.png` })
await page.keyboard.press('Space')
await ate(async () => (await cena()) === 'demo-hospital')
esperar('a segunda começa do início', await cena(), 'demo-hospital')
esperar('com o salvo novo', await pontoSalvo(), 'abertura')
esperar('e sem os segredos de antes', await page.evaluate(() => window.__nos.state.segredos.size), 0)

// 7. O ícone de pausa: aparece para quem mexe o mouse, e um clique pausa.
await page.waitForTimeout(1200)
await page.mouse.move(600, 300)
await page.mouse.move(640, 320)
await page.waitForTimeout(200)
const caixa = await page.evaluate(() => {
  const w = innerWidth
  const s = Math.max(12, Math.min(w / 70, 17))
  return { x: w - s * 2.4, y: s * 2.4 }
})
await page.mouse.click(caixa.x, caixa.y)
await page.waitForTimeout(300)
esperar('o ícone no canto abre a pausa', await pausada(), true)

// 8. Sair: no navegador a aba não fecha; fica a despedida, e um clique volta.
// (Uma tecla por quadro: duas setas no mesmo quadro contam como uma.)
await page.keyboard.press('ArrowDown')
await page.waitForTimeout(120)
await page.keyboard.press('ArrowDown')
await page.waitForTimeout(120)
await page.keyboard.press('Space')
await ate(async () => (await cena()) === 'despedida')
esperar('sair mostra a despedida', await cena(), 'despedida')
await page.waitForTimeout(3600)
if (OUT) await page.screenshot({ path: `${OUT}/s5-despedida.png` })
await page.mouse.click(640, 360)
await ate(async () => (await cena()) === 'title')
esperar('um clique volta ao menu', await cena(), 'title')

// 9. O fim apaga o salvo ao voltar para o menu.
await page.goto(URL + '?debug=1&cena=fim')
await page.waitForTimeout(800)
esperar('o fim também é ponto', await pontoSalvo(), 'fim')
await page.evaluate(() => {
  window.__nos.scene.t = 60
})
await page.waitForTimeout(200)
await page.keyboard.press('Space')
await ate(async () => (await cena()) === 'title')
esperar('depois do fim, um toque volta ao menu', await cena(), 'title')
esperar('e a história terminada não fica salva', await pontoSalvo(), null)

esperar('nenhum erro de página', erros.join(' | '), '')
await browser.close()
console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo')
process.exit(falhas ? 1 : 0)
