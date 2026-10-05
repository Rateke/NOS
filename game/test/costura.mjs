// O quarto de costura da mãe: a porta nova na sala, a caixa trancada com
// quatro carretéis, as dicas a cada erro, o recado que aponta a cozinha (sem
// trancar o resto da casa) e a porta trancada depois do grito. E as dicas
// do Tear depois que a sombra engole a sala.
//
// Uso: com `npx vite preview --port 4173` no ar, `node test/costura.mjs`.
import { chromium } from 'playwright'

const URL = process.env.URL ?? 'http://localhost:4173/'
const OUT = process.env.OUT
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
async function passarFalas(n = 120) {
  for (let i = 0; i < n; i++) {
    if (await s(() => { const c = window.__nos.scene; return !c.dialogue.active && !c.ocupado && !c.cutscene && !c.lendo })) return
    if (await s(() => window.__nos.scene.lendo)) await page.keyboard.press('Escape')
    else await page.keyboard.press('Space')
    await page.waitForTimeout(200)
  }
}
const ir = (sala, x) => s(([sala, x]) => { const c = window.__nos.scene; c.atual = c.comodos.get(sala); c.liam.x = x; c.liam.y = c.atual.passoY }, [sala, x])
const examinar = (id) => s((id) => { const c = window.__nos.scene; c.examinar(c.vestigios().find((v) => v.id === id)) }, id)
const tecla = async (k, vezes = 1) => {
  for (let i = 0; i < vezes; i++) {
    await page.keyboard.press(k)
    await page.waitForTimeout(90)
  }
}

console.log('\ncostura:')

// 1. A porta nova, no canto da sala, e o quarto do outro lado.
await abrir('casa', 'demo-casa')
await passarFalas()
const portas = await s(() => window.__nos.scene.comodos.get('sala').portas.map((p) => p.para))
esperar('a sala tem uma porta para a costura', portas.includes('costura'), true)
await ir('sala', 552)
await page.waitForTimeout(200)
await page.keyboard.press('KeyE')
await page.waitForTimeout(400)
esperar('pela porta, o quarto de costura', await s(() => window.__nos.scene.comodoAtual), 'costura')
if (OUT) await page.screenshot({ path: `${OUT}/costura-quarto.png` })

// 2. As pistas: a foto e as roupas falam; nada disso tranca coisa nenhuma.
await examinar('c-foto')
esperar('a foto diz a ordem', await s(() => window.__nos.scene.dialogue.active), true)
await passarFalas()

// 3. A caixa: os carretéis, os erros e as dicas que chegam mais perto.
await ir('costura', 244)
await examinar('c-caixa')
await passarFalas()
esperar('a caixa de costura abre na tela', await s(() => window.__nos.scene.caixa.ativa), true)
await page.waitForTimeout(400)
if (OUT) await page.screenshot({ path: `${OUT}/costura-caixa.png` })
await tecla('Enter')
esperar('errar conta um erro', await s(() => window.__nos.scene.caixa.falhas), 1)
await page.waitForTimeout(1100)
if (OUT) await page.screenshot({ path: `${OUT}/costura-dica.png` })
for (let i = 0; i < 3; i++) {
  await tecla('Enter')
  await page.waitForTimeout(150)
}
esperar('a quarta dica já é a resposta', await s(() => window.__nos.scene.caixa.falhas), 4)
// O mouse também gira: um clique no primeiro carretel troca a cor dele.
const antes = await s(() => window.__nos.scene.caixa.aneis[0])
const z = await s(() => window.__nos.scene.caixa.zonas.carreteis[0])
await page.mouse.click(z.x + z.w / 2, z.y + z.h / 2)
await page.waitForTimeout(150)
esperar('clicar num carretel troca a cor', await s(() => window.__nos.scene.caixa.aneis[0]), (antes + 1) % 5)
// Esc larga a caixa e ela guarda os carretéis como estavam.
await tecla('Escape')
await page.waitForTimeout(200)
esperar('Esc larga a caixa', await s(() => window.__nos.scene.caixa.ativa), false)
await examinar('c-caixa')
await passarFalas()
esperar('voltando, os carretéis estão como ficaram', await s(() => window.__nos.scene.caixa.aneis[0]), (antes + 1) % 5)
await page.waitForTimeout(400)
// Azul, âmbar, cinza, rosa: ele, ela, eu, a Lia.
await s(() => { window.__nos.scene.caixa.aneis = [4, 4, 4, 4]; window.__nos.scene.caixa.sel = 0 })
await tecla('ArrowUp', 1)
await tecla('ArrowRight')
await tecla('ArrowUp', 2)
await tecla('ArrowRight')
await tecla('ArrowUp', 3)
await tecla('ArrowRight')
await tecla('ArrowDown', 1)
esperar('os carretéis na ordem da foto', await s(() => window.__nos.scene.caixa.aneis), [0, 1, 2, 3])
await tecla('Enter')
esperar('a tampa solta', await s(() => window.__nos.scene.caixa.aberta), true)
await ate(() => s(() => window.__nos.scene.dialogue.active), 5000)
await ate(async () => {
  if (await s(() => window.__nos.scene.lendo)) return true
  await page.keyboard.press('Space')
  await page.waitForTimeout(250)
  return false
}, 10000)
esperar('dentro, o recado dela', await s(() => window.__nos.scene.leitor.doc?.id ?? null), 'recado-mae')
if (OUT) await page.screenshot({ path: `${OUT}/costura-recado.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
await passarFalas()
esperar('ele fica sabendo do recado (caderno)', await s(() => window.__nos.state.sabe.has('recado-mae')), true)

// 4. O recado aponta a cozinha, mas a casa continua aberta.
await ir('sala', 300)
await examinar('janela')
esperar('dá para olhar o resto da casa antes', await s(() => window.__nos.scene.dialogue.active), true)
await passarFalas()
await s(() => { window.__nos.scene.evelynFeita = true })
await ir('corredor', 268)
await page.waitForTimeout(150)
esperar('a porta da cozinha ao alcance', await s(() => window.__nos.scene.portaPerto()?.para ?? null), 'cozinha')
await page.keyboard.press('KeyE')
await page.waitForTimeout(300)
esperar('com o recado lido, a cozinha abre de primeira', await s(() => window.__nos.scene.saindo), true)

// 5. Depois do grito, a porta da costura não abre.
await abrir('depois', 'demo-casa')
await passarFalas()
const travada = await s(() => window.__nos.scene.comodos.get('sala').portas.find((p) => p.para === 'costura')?.travada ?? null)
esperar('depois do grito a costura está trancada', travada, true)

// 6. O Tear: depois que a sombra engole a sala, uma dica — e ela fica na tela.
await abrir('tear', 'demo-tear')
await ate(async () => {
  if (await s(() => window.__nos.scene.faseAtual === 'absorvendo' && !window.__nos.scene.dialogue.active)) return true
  if (await s(() => window.__nos.scene.lendo)) await page.keyboard.press('Escape')
  else await page.keyboard.press('Space')
  return false
}, 60000)
for (let i = 0; i < 6; i++) {
  await page.keyboard.press('KeyK')
  await page.waitForTimeout(650)
}
await ate(() => s(() => !!window.__nos.scene.fimDeJogo), 8000)
esperar('a sombra engoliu: primeiro fim', await s(() => window.__nos.scene.fins), 1)
await page.waitForTimeout(3600)
if (OUT) await page.screenshot({ path: `${OUT}/tear-dica.png` })
esperar('a tela do fim traz uma dica', await s(() => window.__nos.scene.dicaFim.length), 2)
await page.keyboard.press('Space')
await ate(() => s(() => !window.__nos.scene.fimDeJogo), 6000)
esperar('quem leu pode pular o preto', await s(() => !window.__nos.scene.fimDeJogo), true)

esperar('sem erros na página', erros, [])
await browser.close()
if (falhas > 0) {
  console.log(`\n${falhas} falha(s)`)
  process.exit(1)
}
console.log('\ntudo certo')
