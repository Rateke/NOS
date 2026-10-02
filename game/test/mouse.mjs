/**
 * A mesma demo, jogada inteira SÓ COM O MOUSE — é o caminho de quem abre o
 * jogo num painel, onde o teclado pode nem chegar à página.
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
    achados: s?.achados?.size, larg: s?.corredorLargura, quais: s?.achados ? [...s.achados] : null, x: Math.round(s?.liam?.x ?? 0),
    intensidade: s?.intensidade?.toFixed?.(2),
  }
})
// Falando ou lendo: os dois pedem um toque para seguir.
const falando = () => page.evaluate(() => {
  const s = window.__nos?.scene
  return !!(s?.dialogue?.active || s?.lendo || s?.ocupado)
})
const caixas = () => page.evaluate(() => window.__nos?.scene?.caixas ?? [])

async function limpar(max = 40) {
  for (let i = 0; i < max; i++) {
    if (!(await falando())) return
    await page.mouse.click(640, 120)
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
/** Toca clicando nas teclas desenhadas. */
async function tocar(graus) {
  for (const g of graus) {
    const c = await caixas()
    const r = c[g]
    if (!r) throw new Error(`tecla ${g} não está na tela`)
    await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2)
    await page.waitForTimeout(240)
  }
}

await page.goto(URL + '?debug=1')
await page.waitForTimeout(1300)
console.log('\nverificações (somente mouse):')

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
await page.mouse.click(640, 400)
for (let i = 0; i < 40; i++) {
  const pronto = await page.evaluate(() => window.__nos?.scene?.fase === 'pronto')
  if (pronto && (await caixas()).length > 0) break
  await page.waitForTimeout(250)
}
esperar('o menu se monta após o primeiro toque', (await caixas()).length, 2)
esperar('sem jogo salvo: só começar e sair', (await page.evaluate(() => window.__nos?.scene?.acoes ?? [])).join(','), 'novo,sair')
if (OUT) await page.screenshot({ path: `${OUT}/a0-menu.png` })
{
  const c = await caixas()
  await page.mouse.click(c[0].x + c[0].w / 2, c[0].y + c[0].h / 2)
}
esperar('o prólogo chega na vez do jogador', await esperarFase('toca', 120000), true)
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
/**
 * Clica num ponto do cômodo até acontecer o que se espera: Liam anda até lá
 * e usa o que houver. Insiste, porque uma fala no meio do caminho interrompe
 * a caminhada e é preciso clicar de novo.
 */
async function irEUsar(alvoMundo, pronto, tentativas = 10) {
  for (let i = 0; i < tentativas; i++) {
    if (await pronto()) return true
    await limpar()
    if (await pronto()) return true
    const cam = await page.evaluate(() => window.__nos?.scene?.camX?.() ?? 0)
    const pt = await page.evaluate((a) => window.__nos?.paraTela?.(a, 140), alvoMundo - cam)
    if (!pt) return false
    await page.mouse.click(pt.x, pt.y)
    for (let k = 0; k < 45; k++) {
      if (await pronto()) return true
      if (await falando()) break
      await page.waitForTimeout(150)
    }
  }
  return await pronto()
}

const emComodo = (alvo) => async () => (await estado()).id !== 'demo-casa' || (await comodo()) === alvo
const saiuDaCasa = async () => (await estado()).id !== 'demo-casa'
const achou = (n) => async () => ((await estado()).achados ?? 0) >= n

// O piano da sala: clicar nele senta; clicar nas teclas toca; clicar fora levanta.
const sentado = () => page.evaluate(() => !!window.__nos?.scene?.sentadoAoPiano)
esperar('clicar no piano senta Liam no banco', await irEUsar(156, sentado), true)
await page.waitForTimeout(500)
for (const i of [0, 1, 2, 3, 4, 2, 0]) {
  const r = (await caixas())[i]
  if (r) await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2)
  await page.waitForTimeout(280)
}
await page.waitForTimeout(400)
await limpar()
const segredosM = await page.evaluate(() => [...(window.__nos?.state?.segredos ?? [])])
esperar('as teclas respondem ao clique', segredosM.includes('melodia'), true)
await page.mouse.click(640, 120)
await page.waitForTimeout(400)
esperar('clicar fora das teclas levanta', await sentado(), false)

esperar('a porta da sala leva ao corredor', await irEUsar(484, emComodo('corredor')), true)

// O caderno da Lia, lido no corredor. Quem só clica para ler e não esconde
// a tempo é pego: o pai aparece na porta e rasga a página.
const cutscene = () => page.evaluate(() => window.__nos?.scene?.cutsceneAtual ?? null)
const lendoCaderno = () => page.evaluate(() => !!window.__nos?.scene?.lendo || !!window.__nos?.scene?.dialogue?.active)
esperar('clicar no caderno da Lia pega o caderno', await irEUsar(176, lendoCaderno), true)
for (let i = 0; i < 80; i++) {
  if ((await cutscene()) === 'passos') break
  await page.mouse.click(640, 120)
  await page.waitForTimeout(260)
}
esperar('depois de ler, os passos vêm', await cutscene(), 'passos')
await page.waitForTimeout(3600)
esperar('sem esconder, o pai pega', await page.evaluate(() => window.__nos.scene.passosResultado), 'pego')
if (OUT) await page.screenshot({ path: `${OUT}/c0-pego.png` })
for (let i = 0; i < 80; i++) {
  if ((await cutscene()) === null) break
  if (await page.evaluate(() => !!window.__nos?.scene?.dialogue?.active)) await page.mouse.click(640, 120)
  await page.waitForTimeout(260)
}
esperar('a página rasgada fica no caderno de Liam', await page.evaluate(() => window.__nos.state.sabe.has('caderno-rasgado')), true)
esperar('o corredor leva ao quarto', await irEUsar(150, emComodo('quarto')), true)
esperar('na primeira vez, a frase do pai sai da boca do Liam',
  await page.evaluate(() => window.__nos.scene.falouPeloPai), true)
esperar('a caixa debaixo da cama foi aberta', await irEUsar(214, achou(2)), true)
esperar('dá para voltar ao corredor', await irEUsar(300, emComodo('corredor')), true)
// A cozinha pede dois usos: o primeiro avisa, o segundo desce.
esperar('a cozinha encerra a exploração', await irEUsar(268, saiuDaCasa), true)

esperar('a cozinha começa a noite', await esperarCena('demo-mesa'), true)
await esperarFase('preso')
await limpar()
if (OUT) await page.screenshot({ path: `${OUT}/c-mesa.png` })

// Clicar em cima de um vestígio: Liam anda até lá e examina ao chegar.
// Insiste até o vestígio entrar na lista — um pensamento pode interromper a
// caminhada no meio, e aí é só clicar de novo.
for (const [alvo, id] of [[116, 'malas'], [158, 'bilhete'], [200, 'fogao'], [262, 'telefone']]) {
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const st = await estado()
    if (st.id !== 'demo-mesa' || st.quais?.includes(id)) break
    await limpar()
    const pt = await page.evaluate((a) => window.__nos?.paraTela?.(a, 150), alvo)
    if (!pt) throw new Error('sem conversão de coordenadas')
    await page.mouse.click(pt.x, pt.y)
    for (let i = 0; i < 40; i++) {
      const s2 = await estado()
      if (s2.id !== 'demo-mesa' || s2.quais?.includes(id)) break
      await page.waitForTimeout(150)
    }
    await limpar()
  }
}
esperar('os quatro vestígios foram encontrados', (await estado()).achados, 4)
if (OUT) await page.screenshot({ path: `${OUT}/d-achados.png` })
esperar('a tensão vira gritaria', await esperarFase('gritaria', 60000), true)
esperar('os três pratos voaram', await page.evaluate(() => window.__nos.scene.pratosNoLiam + window.__nos.scene.pratosNelas), 3)

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

// --- Dentro: arrumar faz os recortes andarem; parar é a saída -----------
esperar('o pico corta para dentro da cabeça', await esperarFase('dentro', 30000), true)
// O primeiro quarto de segundo de cada recorte não aceita toque (para
// ninguém pular sem querer): espera ele assentar.
await page.waitForTimeout(500)
const montagem = () => page.evaluate(() => {
  const m = window.__nos?.scene?.montagem
  return m ? { arrumados: m.arrumados, fase: m.faseAtual } : null
})
// Quem não para de arrumar arruma tudo, até o último recorte.
for (let i = 0; i < 600; i++) {
  if ((await montagem())?.fase !== 'cortes') break
  await page.mouse.click(640, 300)
  await page.waitForTimeout(200)
}
esperar('os oito recortes arrumados', (await montagem())?.arrumados, 8)
esperar('arrumar até o fim também acaba', (await montagem())?.fase, 'parou')
if (OUT) await page.screenshot({ path: `${OUT}/g2-dentro.png` })

// --- A lei do pai, e a escolha --------------------------------------------
const tear = () => page.evaluate(() => {
  const s = window.__nos?.scene
  return { fase: s?.faseAtual, resultado: s?.escolhaResultado ?? null, travada: s?.escolhaTravada }
})
for (let i = 0; i < 120; i++) {
  if ((await tear()).fase === 'escolha') break
  await page.mouse.click(640, 300)
  await page.waitForTimeout(250)
}
esperar('o pai monta a escolha', (await tear()).fase, 'escolha')
esperar('na primeira vez as mãos não obedecem', (await tear()).travada, true)
await page.waitForTimeout(1500)
await page.mouse.click(1000, 360)
await page.waitForTimeout(300)
esperar('o clique do lado da Lia não vai', [(await tear()).fase, (await tear()).resultado], ['escolha', null])
for (let i = 0; i < 100; i++) {
  if ((await tear()).fase === 'fogo') break
  // Só o grito passa sozinho: as falas do pai esperam o clique.
  await page.mouse.click(640, 120)
  await page.waitForTimeout(250)
}
esperar('ninguém foi escolhido: as duas queimam', [(await tear()).fase, (await tear()).resultado], ['fogo', 'nenhuma'])

for (let i = 0; i < 600; i++) {
  const f = (await tear()).fase
  if (f === 'volta' || f === 'grito') break
  await page.mouse.click(640, 300)
  await page.waitForTimeout(160)
}
esperar('a conversa devolve Liam ao Tear', ['volta', 'grito'].includes((await tear()).fase), true)
for (let i = 0; i < 60; i++) {
  const f = (await estado()).fase
  if (f === 'grito') break
  await page.mouse.click(640, 300)
  await page.waitForTimeout(300)
}
esperar('aceitar a sombra é gritar', (await estado()).fase, 'grito')
if (OUT) await page.screenshot({ path: `${OUT}/g6-grito.png` })
// Soltar cedo é engolir: o grito volta a zero.
await page.mouse.move(640, 300); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up()
await page.waitForTimeout(300)
esperar('soltar cedo engole o grito', (await estado()).fase, 'grito')
await page.mouse.move(640, 300); await page.mouse.down(); await page.waitForTimeout(3600); await page.mouse.up()
esperar('o grito vira a onda e o preto', await esperarCena('demo-hospital', 8000), true)
esperar('cinco segundos de preto, o hospital, e a casa sem música',
  await esperarCena('demo-casa', 60000) && await page.evaluate(() => window.__nos.scene.depois), true)

// --- A casa depois do grito ----------------------------------------------
await limpar()
esperar('a sombra passou a escrever no caderno', await page.evaluate(() => window.__nos.state.sombraEscreve), true)
if (OUT) await page.screenshot({ path: `${OUT}/h-depois.png` })
esperar('depois do grito, a sala ainda leva ao corredor', await irEUsar(484, emComodo('corredor')), true)
const liaRecuou = () => page.evaluate(() => window.__nos.state.sabe.has('depois-lia'))
esperar('a Lia recua quando Liam chega perto', await irEUsar(250, liaRecuou), true)
await limpar()
esperar('o recado da mãe encerra a demo', await irEUsar(118, saiuDaCasa, 14), true)
esperar('o fecho chega', await esperarCena('demo-fim', 60000), true)
esperar('sem erros de runtime', errs, [])
if (OUT) await page.screenshot({ path: `${OUT}/i-fim.png` })


await browser.close()
if (falhas.length) {
  console.error(`\n${falhas.length} falha(s): ${falhas.join(', ')}`)
  process.exit(1)
}
console.log('\ndemo jogável de ponta a ponta.')
