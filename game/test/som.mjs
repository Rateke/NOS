/**
 * O som: as vozes sintetizadas, o caos dos gritos e a mixagem da briga.
 *
 * Mede no navegador, com um analisador na saída do jogo: cada voz tem de
 * ser audível e parecida com o piano; grito tem de ser mais alto que fala;
 * e a briga inteira, com a gritaria, não pode estourar.
 *
 *   npm run build && npm run preview &
 *   npm run test:som
 */
import { chromium } from 'playwright'

const URL = process.env.URL ?? 'http://localhost:4173/'
const falhas = []
function esperar(rotulo, ok, valor) {
  console.log(`  ${ok ? 'ok  ' : 'FALHA'} ${rotulo}: ${JSON.stringify(valor)}`)
  if (!ok) falhas.push(rotulo)
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const erros = []
page.on('pageerror', (e) => erros.push(String(e)))
console.log('\nverificações (som):')

// --- Cada peça sozinha, num silêncio ---------------------------------------
await page.goto(URL + '?debug=1&cena=fim')
await page.mouse.click(10, 10)
await page.waitForTimeout(500)
const n = await page.evaluate(async () => {
  const j = window.__nos
  j.audio.setAmbient(0, 0.01)
  j.musica.setPad(0, 0.01)
  j.musica.setFundo(0, 0.01)
  await new Promise((r) => setTimeout(r, 400))
  const ctx = j.audio.contexto
  const an = ctx.createAnalyser()
  an.fftSize = 2048
  // O equilíbrio (voz, piano, grito) se mede na mistura; o pico, no que
  // chega na caixa de som, depois dos graves, do limitador e da saturação.
  j.audio.saida.connect(an)
  const saida = ctx.createAnalyser()
  saida.fftSize = 2048
  j.audio.final.connect(saida)
  const buf = new Float32Array(an.fftSize)
  const buf2 = new Float32Array(saida.fftSize)
  const medir = async (fn, ms) => {
    fn()
    let soma = 0
    let k = 0
    let pico = 0
    const fim = performance.now() + ms
    while (performance.now() < fim) {
      an.getFloatTimeDomainData(buf)
      saida.getFloatTimeDomainData(buf2)
      let s = 0
      for (const v of buf) s += v * v
      for (const v of buf2) pico = Math.max(pico, Math.abs(v))
      const rms = Math.sqrt(s / buf.length)
      if (rms > 0.0005) {
        soma += rms
        k++
      }
      await new Promise((r) => setTimeout(r, 30))
    }
    await new Promise((r) => setTimeout(r, 700))
    return { rms: soma / Math.max(1, k), pico }
  }
  const frase = 'Você lembra da música? Eu toco, você repete. Devagar.'
  const r = {}
  for (const quem of ['Adrian', 'Liam', 'Evelyn', 'Lia', 'sombra']) r[quem] = await medir(() => j.voz.dizer(quem, frase), 2500)
  r.grito = await medir(() => j.voz.dizer('Adrian', 'VOCÊ NÃO VAI LEVAR OS MEUS FILHOS!', { grito: true }), 2500)
  r.piano = await medir(() => {
    for (let i = 0; i < 4; i++) setTimeout(() => j.musica.nota(293.66 * (1 + i * 0.12), 0.85), i * 500)
  }, 2500)
  // O caos é sorteado a cada grito: vale o mais forte de três.
  const caos = []
  for (let i = 0; i < 3; i++) caos.push(await medir(() => j.sons.caos(1), 2000))
  r.caos = { rms: Math.max(...caos.map((c) => c.rms)), pico: Math.max(...caos.map((c) => c.pico)) }
  return r
})
for (const quem of ['Adrian', 'Liam', 'Evelyn', 'Lia', 'sombra']) {
  const v = n[quem]
  esperar(`a voz de ${quem} é audível, perto do piano`, v.rms > n.piano.rms * 0.5 && v.rms < n.piano.rms * 2, +v.rms.toFixed(4))
}
esperar('grito é mais alto que fala', n.grito.rms > n.Adrian.rms * 1.5, +n.grito.rms.toFixed(4))
esperar('o caos de um grito é forte e não estoura', n.caos.rms > n.piano.rms && n.caos.pico < 0.95, +n.caos.pico.toFixed(3))

// --- A briga inteira, até a gritaria cortar para o preto -------------------
await page.goto(URL + '?debug=1&cena=mesa')
await page.mouse.click(640, 100)
await page.waitForTimeout(300)
await page.evaluate(() => {
  const a = window.__nos.audio
  const an = a.contexto.createAnalyser()
  an.fftSize = 2048
  a.final.connect(an)
  const b = new Float32Array(2048)
  window.__picos = []
  setInterval(() => {
    an.getFloatTimeDomainData(b)
    let p = 0
    for (const v of b) p = Math.max(p, Math.abs(v))
    window.__picos.push(p)
  }, 40)
})
const fases = new Set()
for (let i = 0; i < 260; i++) {
  const f = await page.evaluate(() => window.__nos.scene.fase)
  fases.add(f)
  if (f === 'fuga') break
  await page.keyboard.press('Space')
  await page.waitForTimeout(250)
}
const picos = await page.evaluate(() => window.__picos)
esperar('a briga chega na gritaria e no corte', fases.has('gritaria') && fases.has('fundo'), [...fases])
esperar('nada estoura na briga inteira', Math.max(...picos) < 0.99, +Math.max(...picos).toFixed(3))
esperar('sem erros de runtime', erros.length === 0, erros)

await browser.close()
if (falhas.length) {
  console.error(`\n${falhas.length} falha(s): ${falhas.join(', ')}`)
  process.exit(1)
}
console.log('\no som está de pé.')
