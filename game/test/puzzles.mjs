// Os puzzles: a gaiola (obrigatória, no começo do Dentro) e o relógio do
// corredor (opcional, sem dica nenhuma). E a lembrança do corte, que não
// deixa pular.
//
// Uso: com `npx vite preview --port 4173` no ar, `node test/puzzles.mjs`.
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
    localStorage.setItem('nos:demo', JSON.stringify({ terminou: false }))
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

/** O Tear até a gaiola, direto pelo pico. */
async function ateAGaiola() {
  await page.goto(URL + '?debug=1&cena=tear')
  await page.waitForTimeout(1500)
  await s(() => { const c = window.__nos.scene; if (c.leitor.aberto) c.leitor.fechar(); c.dialogue.play([]); c.fase = 'pico'; c.tPico = 2.7 })
  await ate(() => s(() => !!window.__nos.scene.gaiola), 5000)
}
const g = () => s(() => {
  const x = window.__nos.scene.gaiola
  return x ? { x: Math.round(x.x), fase: x.faseAtual, seg: [...x.segurando], falando: x.dialogue.active, dica: x.dica } : null
})
async function passarGaiola() {
  for (let i = 0; i < 40; i++) {
    if (!(await g())?.falando) return
    await page.keyboard.press('Space')
    await page.waitForTimeout(170)
  }
}
async function andarAte(x, dir) {
  await page.keyboard.down(dir)
  await ate(async () => {
    const e = await g()
    return !e || e.falando || (dir === 'ArrowRight' ? e.x >= x : e.x <= x)
  }, 15000)
  await page.keyboard.up(dir)
  await page.waitForTimeout(150)
}

console.log('\npuzzles:')

// 1. A gaiola: a chave não abre a porta; carregando, a porta não abre.
await ateAGaiola()
esperar('o Dentro começa pela gaiola', await s(() => !!window.__nos.scene.gaiola && !window.__nos.scene.montagem), true)
await passarGaiola()
await andarAte(284, 'ArrowRight')
await tecla('KeyE')
await passarGaiola()
esperar('pegar a chave: ela vai no bolso', (await g())?.seg, ['chave'])
await andarAte(400, 'ArrowRight')
esperar('com a chave, a porta não abre', (await g())?.fase, 'sala')
esperar('ele fala contra a porta', (await g())?.falando, true)
await passarGaiola()
await tecla('KeyE')
await passarGaiola()
esperar('tentar a chave na porta: não tem fechadura', (await g())?.fase, 'sala')
if (OUT) await page.screenshot({ path: `${OUT}/gaiola-porta.png` })
await andarAte(287, 'ArrowLeft')
await tecla('KeyE')
await passarGaiola()
esperar('devolver a chave', (await g())?.seg, [])
// Fechar a gaiola também prende.
await andarAte(182, 'ArrowLeft')
await tecla('KeyE')
await passarGaiola()
esperar('fechar a portinha da gaiola conta como segurar', (await g())?.seg, ['gaiola'])
await andarAte(400, 'ArrowRight')
esperar('com a gaiola fechada, a porta não abre', (await g())?.fase, 'sala')
await passarGaiola()
// Quem demora muito vê a sala ajudar: a pena voa, o poema acende, a sombra vem.
for (const [tempo, n] of [[81, 1], [136, 2], [191, 3]]) {
  await s((tempo) => { window.__nos.scene.gaiola.semResolver = tempo }, tempo)
  await ate(async () => ((await g())?.dica ?? 0) >= n, 3000)
  esperar(`depois de ${tempo}s, a ajuda ${n} da sala`, (await g())?.dica, n)
  if (OUT && n === 1) {
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${OUT}/gaiola-pena.png` })
  }
  await passarGaiola()
}
esperar('na última ajuda, tudo cai da mão', (await g())?.seg, [])
await andarAte(400, 'ArrowRight')
esperar('sem nada na mão, a porta abre', (await g())?.fase, 'saindo')
await passarGaiola()
await ate(() => s(() => !window.__nos.scene.gaiola && !!window.__nos.scene.montagem), 10000)
esperar('do outro lado, a montagem', await s(() => !!window.__nos.scene.montagem), true)
esperar('quem pegou alguma coisa não ganha o segredo', await s(() => window.__nos.state.segredos.has('gaiola')), false)

// 2. Atravessar sem tocar em nada: a sombra repara.
await ateAGaiola()
await passarGaiola()
await andarAte(400, 'ArrowRight')
esperar('direto para a porta: ela abre', (await g())?.fase, 'saindo')
await passarGaiola()
await ate(() => s(() => !window.__nos.scene.gaiola), 10000)
esperar('sem pegar nada: o segredo', await s(() => window.__nos.state.segredos.has('gaiola')), true)

// 3. O relógio do corredor: só abre nas dez e quarenta, e não diz nada.
await abrir('casa', 'demo-casa')
await passarFalas()
await s(() => { window.__nos.scene.evelynFeita = true })
await ir('corredor', 366)
await examinar('relogio')
await passarFalas()
esperar('o vidro do relógio abre na tela', await s(() => window.__nos.scene.relogio.ativa), true)
await page.waitForTimeout(400)
if (OUT) await page.screenshot({ path: `${OUT}/relogio.png` })
// Uma hora qualquer: ele só continua dali.
await s(() => { const r = window.__nos.scene.relogio; r.hora = 9; r.minuto = 15 })
await tecla('Enter')
await passarFalas()
esperar('numa hora qualquer, nada acontece', await s(() => window.__nos.state.segredos.has('relogio')), false)
esperar('e o relógio anda dali', await s(() => { const h = window.__nos.scene.horaDaCasa(); return [h.h % 12, h.m] }), [9, 15])
// As dez e quarenta, pelas setas.
await examinar('relogio')
await passarFalas()
await page.waitForTimeout(400)
await s(() => { const r = window.__nos.scene.relogio; r.hora = 9; r.minuto = 40 })
await tecla('ArrowUp')
await tecla('ArrowRight')
await tecla('ArrowLeft')
esperar('os ponteiros nas dez e quarenta', await s(() => [window.__nos.scene.relogio.hora, window.__nos.scene.relogio.minuto]), [10, 40])
await tecla('Enter')
for (let i = 0; i < 30 && !(await s(() => window.__nos.scene.lendo)); i++) {
  await page.keyboard.press('Space')
  await page.waitForTimeout(250)
}
esperar('atrás do pêndulo, o desenho', await s(() => window.__nos.scene.leitor.doc?.id ?? null), 'desenho-elisa')
if (OUT) await page.screenshot({ path: `${OUT}/relogio-desenho.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
await passarFalas()
esperar('o segredo do relógio', await s(() => window.__nos.state.segredos.has('relogio')), true)
esperar('o nome vai para o caderno', await s(() => window.__nos.state.sabe.has('relogio')), true)
esperar('e o relógio fica parado nas dez e quarenta', await s(() => window.__nos.scene.horaDaCasa()), { h: 22, m: 40, parado: true })

// 4. A lembrança do corte não deixa pular.
await page.goto(URL + '?debug=1&cena=tear')
await page.waitForTimeout(1500)
await s(() => { const c = window.__nos.scene; if (c.leitor.aberto) c.leitor.fechar(); c.dialogue.play([]); c.lembrancasVistas.add(5); c.comecarLembranca(5) })
await page.waitForTimeout(2500)
await page.keyboard.press('Space')
await page.mouse.click(640, 360)
await page.waitForTimeout(300)
esperar('apertar e clicar não pulam a lembrança do corte', await s(() => window.__nos.scene.lembranca !== null), true)
esperar('ela dura mais que as outras', await s(() => window.__nos.scene.lembrancas[5].dur > 2 * window.__nos.scene.lembrancas[0].dur), true)

esperar('sem erros na página', erros, [])
await browser.close()
if (falhas > 0) {
  console.log(`\n${falhas} falha(s)`)
  process.exit(1)
}
console.log('\ntudo certo')
