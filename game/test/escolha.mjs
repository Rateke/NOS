/**
 * A escolha do Tear numa segunda partida: as mãos obedecem.
 *
 * Na primeira vez ninguém consegue escolher (o teste da demo cobre isso).
 * Aqui o navegador já lembra que viu a escolha: a seta, a tecla ou o clique
 * salvam uma, e o fio da outra queima. Pula direto para a lei do pai.
 *
 *   npm run build && npm run preview &
 *   npm run test:escolha
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

/** Abre o Tear já com a escolha vista uma vez, e vai até ela. */
async function ateAEscolha() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  await ctx.addInitScript(() => localStorage.setItem('nos:demo', JSON.stringify({ viuEscolha: true })))
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))
  await page.goto(URL + '?debug=1&cena=tear')
  await page.waitForTimeout(1200)
  await page.evaluate(() => {
    const s = window.__nos.scene
    if (s.leitor.aberto) s.leitor.fechar()
    for (const f of s.fios) { f.absorvido = true; f.puxado = 1 }
    s.lei()
  })
  const tear = () => page.evaluate(() => {
    const s = window.__nos?.scene
    return { fase: s?.faseAtual, resultado: s?.escolhaResultado ?? null, travada: s?.escolhaTravada, queimando: s?.queimando ?? [] }
  })
  for (let i = 0; i < 120; i++) {
    if ((await tear()).fase === 'escolha') break
    await page.keyboard.press('Space')
    await page.waitForTimeout(220)
  }
  await page.waitForTimeout(800)
  return { page, ctx, errs, tear }
}

console.log('\nverificações (a escolha, segunda partida):')

{
  const { page, ctx, errs, tear } = await ateAEscolha()
  esperar('a escolha começa', (await tear()).fase, 'escolha')
  esperar('na segunda vez as mãos obedecem', (await tear()).travada, false)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(300)
  const t = await tear()
  esperar('a seta para a direita salva a Lia', [t.fase, t.resultado], ['fogo', 'lia'])
  esperar('o fio da mãe queima', t.queimando, ['mae'])
  for (let i = 0; i < 80; i++) {
    if ((await tear()).fase === 'dentro2') break
    await page.keyboard.press('Space')
    await page.waitForTimeout(250)
  }
  esperar('depois do fogo, a conversa', (await tear()).fase, 'dentro2')
  // A sombra pode falar antes (a pressa de quem passa tudo sem ler): procura na conversa inteira.
  const abertura = await page.evaluate(() => window.__nos.scene.conversa.passos.flatMap((p) => p.linhas).map((l) => l.text).join(' '))
  esperar('a sombra fala de quem foi salva', abertura.includes('Você escolheu a Lia'), true)
  esperar('o "e se" foi preenchido', await page.evaluate(() =>
    window.__nos.scene.conversa.passos.some((p) => p.linhas.some((l) => l.text.includes('{')))), false)
  esperar('sem erros de runtime', errs, [])
  await ctx.close()
}

{
  const { page, ctx, errs, tear } = await ateAEscolha()
  // Um clique na metade esquerda da tela salva a mãe.
  await page.mouse.click(300, 360)
  await page.waitForTimeout(300)
  const t = await tear()
  esperar('o clique à esquerda salva a mãe', [t.fase, t.resultado], ['fogo', 'mae'])
  esperar('o fio da Lia queima', t.queimando, ['lia'])
  esperar('o navegador lembra que a escolha foi vista',
    await page.evaluate(() => JSON.parse(localStorage.getItem('nos:demo') ?? '{}').viuEscolha), true)
  esperar('sem erros de runtime', errs, [])
  await ctx.close()
}

await browser.close()
if (falhas.length) {
  console.error(`\n${falhas.length} falha(s): ${falhas.join(', ')}`)
  process.exit(1)
}
console.log('\na escolha funciona nos dois lados.')
