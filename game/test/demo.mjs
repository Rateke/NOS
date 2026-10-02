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
// Falando ou lendo: os dois pedem um toque para seguir.
const falando = () => page.evaluate(() => {
  const s = window.__nos?.scene
  return !!(s?.dialogue?.active || s?.lendo || s?.ocupado || s?.respiracao?.ativa)
})
const respirando = () => page.evaluate(() => !!window.__nos?.scene?.respiracao?.ativa)
/** Respira no ritmo do anel: segura enquanto ele cresce, solta enquanto encolhe. */
async function respirarBem() {
  let segura = false
  for (let i = 0; i < 600; i++) {
    const r = await page.evaluate(() => {
      const x = window.__nos?.scene?.respiracao
      return x?.ativa ? { puxando: x.puxando } : null
    })
    if (!r) break
    if (r.puxando !== segura) {
      if (r.puxando) await page.keyboard.down('Space')
      else await page.keyboard.up('Space')
      segura = r.puxando
    }
    await page.waitForTimeout(30)
  }
  if (segura) await page.keyboard.up('Space')
}
const caixas = () => page.evaluate(() => window.__nos?.scene?.caixas ?? [])

async function limpar(max = 40) {
  for (let i = 0; i < max; i++) {
    if (!(await falando())) return
    if (await respirando()) {
      await respirarBem()
      continue
    }
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
esperar('na primeira vez, a frase do pai sai da boca do Liam',
  await page.evaluate(() => window.__nos.scene.falouPeloPai), true)

// O caderno da Lia: ler tem consequência. Os passos do pai chegam, e há
// dois segundos e pouco para esconder (E). Quem esconde a tempo escapa.
await andarAte(176)
await page.keyboard.press('KeyE')
await page.waitForTimeout(380)
const cutscene = () => page.evaluate(() => window.__nos?.scene?.cutsceneAtual ?? null)
for (let i = 0; i < 80; i++) {
  if ((await cutscene()) === 'passos') break
  await page.keyboard.press('Space')
  await page.waitForTimeout(260)
}
esperar('depois de ler o caderno da Lia, os passos vêm', await cutscene(), 'passos')
if (OUT) await page.screenshot({ path: `${OUT}/c0-passos.png` })
await page.waitForTimeout(500)
await page.keyboard.press('KeyE')
await page.waitForTimeout(200)
esperar('esconder a tempo', await page.evaluate(() => window.__nos.scene.passosResultado), 'escondeu')
await limpar()

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
// As três dele, e a resposta do outro lado: três devagar, três rápidas.
await page.waitForTimeout(6000)
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

const mesa = () => page.evaluate(() => {
  const s = window.__nos?.scene
  return {
    prato: s?.pratoNoAr ?? null, alvoX: s?.arremesso?.alvoX ?? null,
    noLiam: s?.pratosNoLiam ?? 0, nelas: s?.pratosNelas ?? 0,
  }
})
// O primeiro prato: o pai mira na mãe, e quem corre até ela leva no lugar.
for (let i = 0; i < 120; i++) {
  if ((await mesa()).prato) break
  await limpar(1)
  await page.waitForTimeout(100)
}
{
  const m = await mesa()
  esperar('o pai arma um prato', m.prato, 'aviso')
  if (OUT) await page.screenshot({ path: `${OUT}/c1-prato-aviso.png` })
  let segurando = null
  let fotografou = false
  for (const ate = Date.now() + 20000; Date.now() < ate;) {
    const st = await estado()
    const p = await mesa()
    if (!p.prato) break
    if (p.prato === 'voo' && OUT && !fotografou) {
      fotografou = true
      await page.screenshot({ path: `${OUT}/c2-prato-voo.png` })
    }
    const t = Math.abs(st.x - (p.alvoX ?? st.x)) < 4 ? null : st.x < p.alvoX ? 'ArrowRight' : 'ArrowLeft'
    if (t !== segurando) {
      if (segurando) await page.keyboard.up(segurando)
      if (t) await page.keyboard.down(t)
      segurando = t
    }
    await page.waitForTimeout(40)
  }
  if (segurando) await page.keyboard.up(segurando)
}
esperar('Liam entra na frente do prato', (await mesa()).noLiam, 1)
await limpar()

// Os vestígios, entre um prato e outro. Um prato no ar engole o E: insiste.
for (const alvo of [262, 200, 158, 116]) {
  const antes = (await estado()).achados ?? 0
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    if ((await estado()).id !== 'demo-mesa' || ((await estado()).achados ?? 0) > antes) break
    // Segura a seta até chegar (andar em toquinhos gastava o tempo da cena).
    let segurando = null
    for (let i = 0; i < 300; i++) {
      const st = await estado()
      if (st.id !== 'demo-mesa' || Math.abs(st.x - alvo) < 8) break
      if ((await mesa()).prato || (await falando())) {
        if (segurando) { await page.keyboard.up(segurando); segurando = null }
        await limpar(1)
        continue
      }
      const t = st.x < alvo ? 'ArrowRight' : 'ArrowLeft'
      if (t !== segurando) {
        if (segurando) await page.keyboard.up(segurando)
        await page.keyboard.down(t)
        segurando = t
      }
      await page.waitForTimeout(30)
    }
    if (segurando) await page.keyboard.up(segurando)
    await page.keyboard.press('KeyE')
    await page.waitForTimeout(320)
    await limpar()
  }
}
esperar('os quatro vestígios foram encontrados', (await estado()).achados, 4)
// Entre os pratos o ar falta. Respirando no ritmo, ele consegue — e o pai grita por isso.
for (let i = 0; i < 80 && !(await page.evaluate(() => window.__nos.state.sabe.has('respirou') || window.__nos.state.sabe.has('sem-ar'))); i++) {
  await limpar(1)
  await page.waitForTimeout(150)
}
esperar('respirou no ritmo, na cozinha', await page.evaluate(() => window.__nos.state.sabe.has('respirou')), true)
if (OUT) await page.screenshot({ path: `${OUT}/d-achados.png` })

// O fundo do poço é em voz: o pai sobe, Liam sobe pedindo para parar, e as
// falas se empilham até a tela cortar para o preto.
esperar('a tensão vira gritaria', await esperarFase('gritaria', 60000), true)
await page.waitForTimeout(4200)
if (OUT) await page.screenshot({ path: `${OUT}/d2-gritaria.png` })
{
  let viu = false
  for (let i = 0; i < 60 && !viu; i++) {
    viu = ['fundo', 'fuga'].includes((await estado()).fase)
    await page.waitForTimeout(150)
  }
  esperar('a gritaria acaba no preto', viu, true)
}

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
  return m ? { arrumados: m.arrumados, fase: m.faseAtual, fila: m.dialogue.fila, completa: m.dialogue.completa } : null
})
// Espaço passa a fala mas não arruma: depois da conversa, a coisa continua torta.
for (let i = 0; i < 40; i++) {
  if (await page.evaluate(() => window.__nos.scene.montagem?.esperandoArrumar)) break
  await page.keyboard.press('Space')
  await page.waitForTimeout(220)
}
await page.keyboard.press('Space')
await page.waitForTimeout(600)
esperar('espaço não arruma', (await montagem())?.arrumados, 0)
if (OUT) await page.screenshot({ path: `${OUT}/g1-arrumar.png` })
// Cada recorte é uma conversa sobre a mãe; o E passa as falas e, depois da
// última, arruma (Liam anda até a coisa torta e endireita).
for (let i = 0; i < 500; i++) {
  if (((await montagem())?.arrumados ?? 0) >= 6) break
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(200)
}
esperar('seis recortes arrumados', (await montagem())?.arrumados, 6)
if (OUT) await page.screenshot({ path: `${OUT}/g2-dentro.png` })
// Lê o recorte da chave até a última fala, e para de arrumar.
for (let i = 0; i < 40; i++) {
  const m = await montagem()
  if (!m || m.fila === 0) break
  await page.keyboard.press('Space')
  await page.waitForTimeout(320)
}
for (let i = 0; i < 80; i++) {
  if ((await montagem())?.fase !== 'cortes') break
  await page.waitForTimeout(400)
}
esperar('parar de arrumar encerra a montagem', (await montagem())?.fase, 'parou')
esperar('parar não arruma mais nada', (await montagem())?.arrumados, 6)

// --- A lei do pai, e a escolha --------------------------------------------
const tear = () => page.evaluate(() => {
  const s = window.__nos?.scene
  return { fase: s?.faseAtual, resultado: s?.escolhaResultado ?? null, travada: s?.escolhaTravada }
})
for (let i = 0; i < 120; i++) {
  if ((await tear()).fase === 'escolha') break
  await page.keyboard.press('Space')
  await page.waitForTimeout(250)
}
esperar('o pai monta a escolha', (await tear()).fase, 'escolha')
esperar('na primeira vez as mãos não obedecem', (await tear()).travada, true)
await page.waitForTimeout(1500)
await page.keyboard.press('ArrowLeft')
await page.waitForTimeout(300)
if (OUT) await page.screenshot({ path: `${OUT}/g3-escolha.png` })
esperar('a mão não vai até a mãe', [(await tear()).fase, (await tear()).resultado], ['escolha', null])
for (let i = 0; i < 100; i++) {
  if ((await tear()).fase === 'fogo') break
  // Só o grito passa sozinho: as falas do pai esperam o toque.
  await page.keyboard.press('Space')
  await page.waitForTimeout(250)
}
esperar('o tempo acaba e o fogo sobe', (await tear()).fase, 'fogo')
esperar('ninguém foi escolhido: as duas queimam', (await tear()).resultado, 'nenhuma')
await page.waitForTimeout(1600)
if (OUT) await page.screenshot({ path: `${OUT}/g4-fogo.png` })

// --- Dentro, de novo: a conversa inteira com a sombra ---------------------
for (let i = 0; i < 80; i++) {
  if ((await tear()).fase === 'dentro2') break
  await page.keyboard.press('Space')
  await page.waitForTimeout(250)
}
esperar('depois do fogo, a conversa', (await tear()).fase, 'dentro2')
esperar('nenhuma fala ficou com marcador por trocar', await page.evaluate(() =>
  window.__nos.scene.conversa.passos.some((p) => p.linhas.some((l) => l.text.includes('{')))), false)
for (let i = 0; i < 500; i++) {
  const f = (await tear()).fase
  if (f !== 'dentro2') break
  if (i === 60 && OUT) await page.screenshot({ path: `${OUT}/g5-dentro2.png` })
  await page.keyboard.press('Space')
  await page.waitForTimeout(160)
}
esperar('a conversa devolve Liam ao Tear', ['volta', 'grito'].includes((await tear()).fase), true)
for (let i = 0; i < 60; i++) {
  const f = (await estado()).fase
  if (f === 'grito') break
  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
}
esperar('aceitar a sombra é gritar', (await estado()).fase, 'grito')
if (OUT) await page.screenshot({ path: `${OUT}/g6-grito.png` })
// Soltar cedo é engolir: o grito volta a zero.
await page.keyboard.down('Space'); await page.waitForTimeout(700); await page.keyboard.up('Space')
await page.waitForTimeout(300)
esperar('soltar cedo engole o grito', (await estado()).fase, 'grito')
await page.keyboard.down('Space'); await page.waitForTimeout(3600); await page.keyboard.up('Space')
esperar('o grito vira a onda e o preto', await esperarCena('demo-hospital', 8000), true)
esperar('cinco segundos de preto, o hospital, e a casa sem música',
  await esperarCena('demo-casa', 60000) && await page.evaluate(() => window.__nos.scene.depois), true)

// --- A casa depois do grito ----------------------------------------------
await limpar()
esperar('a sombra passou a escrever no caderno', await page.evaluate(() => window.__nos.state.sombraEscreve), true)
if (OUT) await page.screenshot({ path: `${OUT}/h-depois.png` })
const nos = () => page.evaluate(() => window.__nos.scene.nosSoltos ?? [])
// Os nós: um em cada cômodo. Desatar mostra uma lembrança.
await andarAte(322); await usar(); await limpar()
esperar('o nó da sala desata', (await nos()).includes('no-mae'), true)
await andarAte(484); await usar()
esperar('depois do grito, a sala ainda leva ao corredor', await comodo(), 'corredor')
await andarAte(250)
await limpar()
esperar('a Lia recua quando Liam chega perto',
  await page.evaluate(() => window.__nos.state.sabe.has('depois-lia')), true)
await andarAte(344); await usar(); await limpar()
esperar('o nó do corredor desata', (await nos()).includes('no-pai'), true)
await andarAte(118); await usar(); await limpar()
esperar('o recado espera os nós', (await estado()).id, 'demo-casa')
await andarAte(150); await usar()
await andarAte(128); await usar(); await limpar()
esperar('o nó do quarto desata', (await nos()).includes('no-lia'), true)
await andarAte(300); await usar()
await andarAte(404); await usar()
esperar('o quarto da Lia, depois', await comodo(), 'lia')
await andarAte(272); await usar(); await limpar()
esperar('os quatro nós soltos abrem a porta do fim', await page.evaluate(() => window.__nos.scene.portaDoFimAberta), true)
if (OUT) await page.screenshot({ path: `${OUT}/h2-nos.png` })
await andarAte(44); await usar()
await limpar()
await andarAte(118); await usar()
esperar('o recado da mãe encerra a demo', await esperarCena('demo-fim', 60000), true)
esperar('sem erros de runtime', errs, [])
if (OUT) await page.screenshot({ path: `${OUT}/i-fim.png` })


await browser.close()
if (falhas.length) {
  console.error(`\n${falhas.length} falha(s): ${falhas.join(', ')}`)
  process.exit(1)
}
console.log('\ndemo jogável de ponta a ponta.')
