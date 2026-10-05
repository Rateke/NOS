// As mecânicas novas: a foto que a Lia joga (o aviso dos pratos, sem
// perigo), a cabana pela luz, a floresta pela fresta do armário, a sombra
// do pai que engole o Tear e o recomeça, e o jornal diagramado.
//
// Uso: com `npx vite preview --port 4173` no ar, `node test/novidades.mjs`.
import { chromium } from 'playwright'

const URL = process.env.URL ?? 'http://localhost:4173/'
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
const s = (fn, arg) => page.evaluate(fn, arg)
async function ate(cond, ms = 15000) {
  const fim = Date.now() + ms
  while (Date.now() < fim) {
    if (await cond()) return true
    await page.waitForTimeout(150)
  }
  return false
}

/** Abre o jogo num ponto salvo e espera a cena livre. */
async function abrir(ponto, cena, sabe = []) {
  await page.goto(URL + '?debug=1')
  await s(([ponto, sabe]) => {
    const estado = { resolved: [], seen: [], inventory: [], diaryRead: false, doorAttempts: 0, segredos: [], sabe, camadas: [], apresentados: [], sombraEscreve: false }
    localStorage.setItem('nos:salvo', JSON.stringify({ v: 1, ponto, quando: Date.now(), estado }))
    localStorage.setItem('nos:demo', JSON.stringify({ terminou: true, viuEscolha: true, escolha: 'lia' }))
  }, [ponto, sabe])
  await page.reload()
  await ate(() => s(() => window.__nos?.scene?.id === 'title' && window.__nos.scene.t > 0.9))
  await page.keyboard.press('Space')
  await ate(() => s(() => window.__nos.scene.fase === 'pronto'))
  await page.waitForTimeout(300)
  await page.keyboard.press('Space')
  await ate(() => s((c) => window.__nos?.scene?.id === c, cena), 20000)
  await page.waitForTimeout(500)
}
async function passarFalas(n = 40) {
  for (let i = 0; i < n; i++) {
    if (await s(() => { const c = window.__nos.scene; return !c.dialogue.active && !c.ocupado && !c.cutscene })) return
    await page.keyboard.press('Space')
    await page.waitForTimeout(200)
  }
}
const ir = (sala, x) => s(([sala, x]) => { const c = window.__nos.scene; c.atual = c.comodos.get(sala); c.liam.x = x; c.liam.y = c.atual.passoY }, [sala, x])
const examinar = (id) => s((id) => { const c = window.__nos.scene; c.examinar(c.vestigios().find((v) => v.id === id)) }, id)

console.log('\nnovidades:')

// 1. A foto da família: a marca vermelha no chão, e dá para pegar no ar.
await abrir('casa', 'demo-casa')
await passarFalas()
await ir('lia', 140)
await s(() => window.__nos.scene.liaRaiva())
await ate(async () => {
  if (await s(() => !!window.__nos.scene.retratoLia)) return true
  await page.keyboard.press('Space')
  return false
}, 15000)
esperar('a Lia ergue a foto (o aviso dos pratos)', await s(() => window.__nos.scene.retratoLia?.fase ?? null), 'aviso')
await page.keyboard.down('ArrowLeft')
await ate(() => s(() => window.__nos.scene.liam.x < 74), 4000)
await page.keyboard.up('ArrowLeft')
await ate(() => s(() => !window.__nos.scene.retratoLia), 5000)
esperar('correndo até a marca, Liam pega a foto', await s(() => window.__nos.state.sabe.has('pegou-retrato')), true)

// 2. Depois do grito: a mão na luz da cabana, e a lata.
await abrir('depois', 'demo-casa')
await passarFalas()
await ir('quarto', 58)
await examinar('d-cabana')
await ate(async () => {
  if (await s(() => window.__nos.scene.atual.id === 'cabana')) return true
  await page.keyboard.press('Space')
  return false
}, 12000)
esperar('a luz da cabana leva para dentro dela', await s(() => window.__nos.scene.atual.id), 'cabana')
await page.waitForTimeout(1500)
await examinar('c-lata')
await ate(async () => {
  if (await s(() => window.__nos.state.segredos.has('lata'))) return true
  await page.keyboard.press('Space')
  return false
}, 15000)
esperar('na lata, a voz dela (segredo, sem aviso)', await s(() => window.__nos.state.segredos.has('lata')), true)
await passarFalas()

// 3. O armário: pela fresta, a floresta; parado olhando, a Lia.
await ir('quarto', 392)
await examinar('d-armario')
await ate(async () => {
  if (await s(() => !!window.__nos.scene.armario)) return true
  await page.keyboard.press('Space')
  return false
}, 8000)
esperar('dá para entrar no armário', await s(() => !!window.__nos.scene.armario), true)
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(500); await page.keyboard.up('ArrowRight')
await ate(() => s(() => window.__nos.state.segredos.has('floresta')), 12000)
esperar('olhando pela fresta, a Lia no meio das árvores', await s(() => window.__nos.state.segredos.has('floresta')), true)
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(2600); await page.keyboard.up('ArrowRight')
await page.waitForTimeout(500)
esperar('aberta demais, é só o quarto', await s(() => window.__nos.scene.armario?.abriuTudo ?? null), true)
await page.keyboard.press('KeyE')
await page.waitForTimeout(400)
esperar('E sai do armário', await s(() => window.__nos.scene.armario), null)

// 4. O Tear: errar seguido faz a sombra do pai encher e engolir; o Tear recomeça.
await abrir('tear', 'demo-tear')
for (let i = 0; i < 80; i++) {
  if ((await s(() => window.__nos.scene.faseAtual)) === 'absorvendo' && !(await s(() => window.__nos.scene.dialogue.active))) break
  if (await s(() => window.__nos.scene.lendo)) await page.keyboard.press('Escape')
  else await page.keyboard.press('Space')
  await page.waitForTimeout(200)
}
esperar('o Tear espera a melodia', await s(() => window.__nos.scene.faseAtual), 'absorvendo')
await page.keyboard.press('KeyC')
await page.waitForTimeout(400)
esperar('C reabre o caderno da bisavó, na página da música', await s(() => window.__nos.scene.leitor.pagina), 3)
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
for (let i = 0; i < 6; i++) {
  await page.keyboard.press('KeyK')
  await page.waitForTimeout(650)
}
await ate(() => s(() => !!window.__nos.scene.fimDeJogo), 8000)
esperar('errando seguido, a sombra dele engole a sala', await s(() => !!window.__nos.scene.fimDeJogo), true)
await ate(() => s(() => !window.__nos.scene.fimDeJogo), 9000)
esperar('e o Tear recomeça, com a sombra pequena de novo', await s(() => window.__nos.scene.sombra.nivel < 0.05 && window.__nos.scene.faseAtual === 'absorvendo'), true)

// 5. O prólogo é lembrança: sem sombra lá.
await abrir('prologo', 'demo-prologo')
esperar('o prólogo não tem sombra', await s(() => window.__nos.scene.sombra ?? null), null)

// 6. O jornal: quatro páginas, diagramado.
await abrir('casa', 'demo-casa')
await passarFalas()
await ir('sala', 320)
await examinar('jornal')
await ate(async () => {
  if (await s(() => window.__nos.scene.leitor.aberto)) return true
  await page.keyboard.press('Space')
  return false
}, 8000)
esperar('o jornal abre no leitor', await s(() => window.__nos.scene.leitor.doc?.tipo ?? null), 'jornal')
esperar('com capa, classificados, passatempos e variedades', await s(() => window.__nos.scene.leitor.doc?.paginas.map((p) => p.secao ?? 'capa')), ['capa', 'CLASSIFICADOS', 'PASSATEMPOS', 'VARIEDADES'])

esperar('nenhum erro de página', erros, [])
await browser.close()
console.log(falhas ? `\n${falhas} falha(s)` : '\nas novidades estão de pé.')
process.exit(falhas ? 1 : 0)
