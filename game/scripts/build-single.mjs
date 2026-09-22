/**
 * Junta o build num único .html autossuficiente, que roda com duplo clique —
 * sem servidor, sem node, sem internet (as fontes caem para as do sistema).
 *
 *   npm run build:single   ->   dist/nos.html
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const dist = 'dist'
const assets = readdirSync(join(dist, 'assets'))
const jsName = assets.find((f) => f.endsWith('.js'))
if (!jsName) throw new Error('dist/assets sem .js — rode `npm run build` antes')
const js = readFileSync(join(dist, 'assets', jsName), 'utf8')
// No build IIFE o Vite já injeta o CSS pelo próprio bundle; se um dia voltar
// a sair como arquivo, ele é embutido aqui.
const cssName = assets.find((f) => f.endsWith('.css'))
const css = cssName ? readFileSync(join(dist, 'assets', cssName), 'utf8') : ''

const ICON =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22%3E' +
  '%3Crect width=%2216%22 height=%2216%22 fill=%22%2305070c%22/%3E' +
  '%3Ccircle cx=%228%22 cy=%228%22 r=%223%22 fill=%22%23f0c088%22/%3E%3C/svg%3E'

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>NÓS</title>
<meta name="description" content="Narrativa de exploração psicológica. Fatia vertical: a abertura." />
<link rel="icon" href="${ICON}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
${css ? `<style>\n${css}\n</style>` : ''}
</head>
<body>
<canvas id="game"></canvas>
<div id="loading">nós</div>
<script>
${js}
</script>
</body>
</html>
`

writeFileSync(join(dist, 'nos.html'), html)
console.log(`dist/nos.html  ${(Buffer.byteLength(html) / 1024).toFixed(1)} kB — abra com duplo clique`)
