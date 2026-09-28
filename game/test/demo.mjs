/**
 * Teste de integração da demo "Só mais um", pelo teclado.
 *
 * Cobre as três cenas e, principalmente, a espinha da demo: o tema aprendido
 * no piano do prólogo é o mesmo que abre os fios na câmara do Tear.
 *
 *   npm run build && npm run preview &
 *   npm run test:demo
 *
 * OUT=<dir> salva capturas de cada momento.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = process.env.OUT ?? null
const URL = process.env.URL ?? 'http://localhost:4173/'
if (OUT) mkdirSync(OUT, { recursive: true })

/** O tema, em graus da escala. Tem de bater com engine/musica.ts. */
const TEMA = [[0, 2, 4, 3], [0, 2, 4, 6, 5], [0, 2, 4, 3, 2, 1, 0]]
const TECLAS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK']

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

const estado = () => page.evaluate(() => {
  const s = window.__nos?.scene
  return {
    id: s?.id, fase: s?.fase, frase: s?.frase, passo: s?.passo, sel: s?.sel,
    achados: s?.achados?.size, larg: s?.corredorLargura, x: Math.round(s?.liam?.x ?? 0),
    intensidade: s?.intensidade?.toFixed?.(2),
  }
})
const falando = () => page.evaluate(() => !!window.__nos?.scene?.dialogue?.active)
const caixas = () => page.evaluate(() => window.__nos?.scene?.caixas ?? [])

async function limpar(max = 14) {
  for (let i = 0; i < max; i++) {
    if (!(await falando())) return
    await page.keyboard.press('Space')
    await page.waitForTimeout(260)
  }
}
async function esperarFase(alvo, ms = 45000) {
  const ate = Date.now() + ms
  while (Date.now() < ate) {
    if ((await estado()).fase === alvo) return true
    await limpar(2)
    await page.waitForTimeout(300)
  }
  return false
}
async function esperarCena(alvo, ms = 90000) {
  const ate = Date.now() + ms
  while (Date.now() < ate) {
    if ((await estado()).id === alvo) return true
    await limpar(2)
    await page.waitForTimeout(350)
  }
  return false
}
async function tocar(graus) {
  for (const g of graus) {
    await page.keyboard.press(TECLAS[g])
    await page.waitForTimeout(240)
  }
}

await page.goto(URL + '?debug=1')
await page.waitForTimeout(1300)
console.log('\nverificações (teclado):')

{
  const fit = await page.evaluate(() => {
    const c = document.getElementById('game')
    const b = c.getBoundingClientRect()
    return Math.abs(b.width - innerWidth) <= 2 && Math.abs(b.height - innerHeight) <= 2
  })
  esperar('canvas preenche a janela', fit, true)
}

// O menu abre em preto: o primeiro toque acende tudo, e só então os itens
// existem para serem clicados.
await page.keyboard.press('Space')
for (let i = 0; i < 40; i++) {
  const pronto = await page.evaluate(() => window.__nos?.scene?.fase === 'pronto')
  if (pronto && (await caixas()).length > 0) break
  await page.waitForTimeout(250)
}
esperar('o menu se monta após o primeiro toque', (await caixas()).length, 2)
if (OUT) await page.screenshot({ path: `${OUT}/a0-menu.png` })
{
  const c = await caixas()
  await page.mouse.click(c[0].x + c[0].w / 2, c[0].y + c[0].h / 2)
}
esperar('o prólogo chega na vez do jogador', await esperarFase('toca'), true)
await limpar()
if (OUT) await page.screenshot({ path: `${OUT}/a-piano.png` })

// As três frases do tema, cada uma maior que a anterior
for (let f = 0; f < 3; f++) {
  const st = await estado()
  await tocar(TEMA[st.frase ?? f])
  await page.waitForTimeout(450)
  await limpar()
  if (f < 2) {
    esperar(`frase ${f + 1} aceita`, (await estado()).frase, f + 1)
    await esperarFase('toca', 25000)
    await limpar()
  }
}
esperar('tema inteiro aprendido', (await estado()).fase, 'livre')
if (OUT) await page.screenshot({ path: `${OUT}/b-livre.png` })

// A Mesa e seus vestígios
// --- A Casa: quatro cômodos ligados por portas ---------------------------
esperar('a sala vira casa explorável', await esperarCena('demo-casa'), true)
await limpar()

const comodo = () => page.evaluate(() => window.__nos?.scene?.comodoAtual)
/** Segura a seta até chegar perto: andar em toquinhos levava minutos. */
async function andarAte(alvo, ms = 45000) {
  const ate = Date.now() + ms
  let segurando = null
  const soltar = async () => {
    if (segurando) await page.keyboard.up(segurando)
    segurando = null
  }
  while (Date.now() < ate) {
    const st = await estado()
    if (st.id !== 'demo-casa') break
    if (Math.abs(st.x - alvo) < 6) {
      await soltar()
      return true
    }
    const t = st.x < alvo ? 'ArrowRight' : 'ArrowLeft'
    if (segurando !== t) {
      await soltar()
      await page.keyboard.down(t)
      segurando = t
    }
    // Uma fala no caminho para Liam: fecha e segue.
    if (await falando()) {
      await soltar()
      await limpar()
    }
    await page.waitForTimeout(40)
  }
  await soltar()
  return false
}
async function usar() {
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(380)
  await limpar()
}

const segredos = () => page.evaluate(() => [...(window.__nos?.state?.segredos ?? [])])
const tecla = async (codigos) => {
  for (const k of codigos) {
    await page.keyboard.press(k)
    await page.waitForTimeout(260)
  }
}

// Parede: andar para a esquerda não tira Liam da sala.
await andarAte(-200, 9000)
esperar('a parede esquerda da sala segura Liam', (await estado()).x >= 20, true)

// O piano da sala continua tocável. O tema ao contrário é um segredo.
await andarAte(156); await page.keyboard.press('KeyE'); await page.waitForTimeout(300); await limpar()
esperar('Liam senta ao piano da sala', await page.evaluate(() => window.__nos.scene.sentadoAoPiano), true)
await tecla(['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyD', 'KeyA'])
await page.waitForTimeout(400)
await limpar()
esperar('o tema subindo é um segredo', (await segredos()).includes('melodia'), true)
await page.keyboard.press('Escape'); await page.waitForTimeout(300)
esperar('Esc levanta do piano', await page.evaluate(() => window.__nos.scene.sentadoAoPiano), false)

await andarAte(484); await usar()
esperar('a porta da sala leva ao corredor', await comodo(), 'corredor')

// As marcas de altura, vistas duas vezes, mostram o que a lixa não pegou.
await andarAte(306); await usar(); await usar()
esperar('olhar de novo as marcas acha um nome', (await segredos()).includes('nome'), true)

await andarAte(150); await usar()
esperar('o corredor leva ao quarto', await comodo(), 'quarto')
if (OUT) await page.screenshot({ path: `${OUT}/c1-quarto.png` })

await andarAte(214); await usar()
esperar('a caixa debaixo da cama foi aberta', (await estado()).achados >= 1, true)
await andarAte(342); await usar(); await usar()
esperar('o diário tem um bilhete escondido', (await segredos()).includes('bilhete'), true)
await andarAte(58); await usar(); await usar()
esperar('a cabana guarda uma voz', (await segredos()).includes('cabana'), true)
await andarAte(-100, 6000)
esperar('a parede esquerda do quarto segura Liam', (await estado()).x >= 20, true)

await andarAte(300); await usar()
esperar('dá para voltar ao corredor', await comodo(), 'corredor')
// Ir até o fundo faz o corredor se esticar, várias vezes.
for (let i = 0; i < 8; i++) {
  const st = await estado()
  if (st.id !== 'demo-casa' || (await comodo()) !== 'corredor') break
  if ((st.larg ?? 0) >= 1180) break
  await andarAte((st.larg ?? 470) - 40, 14000)
  await limpar()
}
esperar('o corredor se alongou enquanto Liam andava', (await estado()).larg, 1180)
if (OUT) await page.screenshot({ path: `${OUT}/c2-corredor.png` })

await andarAte(1180 - 112); await usar()
esperar('o último retrato não tem ninguém', (await segredos()).includes('ninguem'), true)

// A porta do fim não abre. Nunca abriu. Mas quem insiste ouve alguém.
await andarAte(1180 - 46)
await usar(); await usar(); await usar()
await page.waitForTimeout(2400)
await limpar()
esperar('a porta impossível continua fechada', await comodo(), 'corredor')
esperar('três batidas respondem do outro lado', (await segredos()).includes('bater'), true)
await andarAte(5000, 5000)
esperar('a parede do fim do corredor segura Liam', (await estado()).x <= 1180 - 20, true)

// A cozinha encerra a exploração
await andarAte(268); await usar(); await usar()

esperar('a cozinha começa a noite', await esperarCena('demo-mesa'), true)
await esperarFase('preso')
await limpar()
if (OUT) await page.screenshot({ path: `${OUT}/c-mesa.png` })

for (const alvo of [116, 158, 200, 262]) {
  for (let i = 0; i < 150; i++) {
    const st = await estado()
    if (st.id !== 'demo-mesa' || Math.abs(st.x - alvo) < 12) break
    const t = st.x < alvo ? 'ArrowRight' : 'ArrowLeft'
    await page.keyboard.down(t)
    await page.waitForTimeout(70)
    await page.keyboard.up(t)
  }
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(320)
  await limpar()
}
esperar('os quatro vestígios foram encontrados', (await estado()).achados, 4)
if (OUT) await page.screenshot({ path: `${OUT}/d-achados.png` })

// A câmara: o mesmo tema abre os fios
esperar('a Mesa empurra Liam para o porão', await esperarCena('demo-tear'), true)
esperar('o Tear aceita entrada', await esperarFase('absorvendo'), true)
await limpar()
if (OUT) await page.screenshot({ path: `${OUT}/e-tear-piano.png` })

for (let i = 0; i < 6; i++) {
  const st = await estado()
  if (st.fase !== 'absorvendo') break
  await tocar(TEMA[(st.sel ?? 0) % 3])
  // Cada fio tecido abre uma lembrança; a entrada volta quando ela acaba.
  for (let k = 0; k < 60; k++) {
    if (!(await page.evaluate(() => !!window.__nos?.scene?.lembrando))) break
    await page.waitForTimeout(250)
  }
  await page.waitForTimeout(300)
  await limpar(3)
  if (i === 2 && OUT) await page.screenshot({ path: `${OUT}/f-tear-meio.png` })
}
{
  const e = await estado()
  esperar('os seis fios foram abertos pela melodia', e.fase, 'pico')
  esperar('intensidade no máximo', Number(e.intensidade) >= 1, true)
}
if (OUT) await page.screenshot({ path: `${OUT}/g-pico.png` })

esperar('o clímax correu sozinho até o fim', await esperarCena('demo-fim', 40000), true)
esperar('sem erros de runtime', errs, [])
if (OUT) await page.screenshot({ path: `${OUT}/h-fim.png` })

await browser.close()
if (falhas.length) {
  console.error(`\n${falhas.length} falha(s): ${falhas.join(', ')}`)
  process.exit(1)
}
console.log('\ndemo jogável de ponta a ponta.')
