# NÓS — jogo

Fatia vertical da abertura, em TypeScript + Canvas. Sem engine e sem nenhum
arquivo de arte ou áudio: tudo é desenhado e sintetizado em código.

## Rodar

### Só quero jogar

```bash
npm install
npm run build:single
```

Gera **`dist/nos.html`**: um arquivo único de ~30 kB. Dê duplo clique e o jogo
abre no navegador — sem servidor, sem node rodando, sem internet (sem rede as
fontes caem para as do sistema). Dá para mandar por e-mail ou levar num
pendrive.

### Quero mexer no jogo

```bash
npm install
npm run dev        # http://localhost:5173, recarrega ao salvar
```

### Outros comandos

```bash
npm run build      # checagem de tipos + build em dist/ (este precisa de servidor)
npm run preview    # serve o build em :4173
npm test           # joga a fatia inteira num navegador real e confere tudo
```

O teste aponta para `http://localhost:4173` por padrão: rode o `preview` antes,
ou passe `URL=file:///caminho/para/dist/nos.html`. `OUT=<pasta>` salva capturas
de cada momento.

### Publicar na Vercel

Já está configurado na raiz do repositório (`vercel.json` + `package.json`).
Dois caminhos:

**Sem GitHub, na hora** — publica a pasta construída direto:

```bash
cd game && npm run build
npx vercel deploy dist --prod
```

Na primeira vez ele pede login e o nome do projeto. Ao fim imprime a URL.

**Com GitHub, publicando a cada push** — em vercel.com/new, importe o
repositório e **não mude nada**: a configuração da raiz já diz o que
construir (`npm run build`) e o que publicar (`game/dist`). O
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` está ligado ali para o build não baixar um
navegador por causa de uma dependência que só serve aos testes.

### Publicar no GitHub Pages

Também configurado. Basta ligar uma vez, no GitHub:

> **Settings → Pages → Build and deployment → Source: "GitHub Actions"**

Não precisa escolher branch nem pasta. A partir daí, todo push constrói e
publica sozinho em `https://<usuário>.github.io/NOS/` — o workflow está em
`.github/workflows/pages.yml`.

**Sem GitHub:** `dist/nos.html` é autossuficiente e sobe em qualquer lugar que
sirva um arquivo. Arrastar a pasta `dist/` para o
[Netlify Drop](https://app.netlify.com/drop) publica na hora.

## Controles

O jogo inteiro é jogável **só com o mouse**, só com o teclado, ou no toque —
os três caminhos são testados de ponta a ponta.

| | Mouse | Teclado | Toque |
|---|---|---|---|
| Escolher no menu | clicar no item | ↑ ↓ e espaço | tocar no item |
| Avançar uma fala | clicar | espaço, E ou Enter | tocar |
| Andar pelo quarto | clicar no chão | setas ou WASD | arrastar à esquerda |
| Examinar | clicar no objeto | E perto dele | tocar |
| Tocar o piano | clicar na tecla | A S D F G H J K | tocar na tecla |
| Abrir um fio no Tear | tocar a melodia | tocar a melodia | tocar a melodia |
| Examinar um vestígio | clicar nele | E perto dele | tocar nele |

O clique também traz o foco do teclado para o jogo — dentro de um painel ou
iframe, sem foco nenhuma tecla chega à página.

## Menu e fecho

O jogo **abre em preto absoluto**: uma linha piscando, e nada mais. O primeiro
toque acende tudo de uma vez — a música entra, o corredor em fuga aparece ao
fundo e o título se monta, depois os itens do menu, um a um. Quem já viu a
abertura pula tudo com um toque.

A trilha do menu é uma peça própria: quatro compassos lentos em ré menor
(Dm–Si♭–Fá–Sol menor), arpejo na mão esquerda e uma melodia esparsa por cima,
feita dos mesmos intervalos do tema que Adrian ensina. Pouca nota, muito
silêncio, e a reverberação fazendo o resto.

O fecho começa em **silêncio absoluto**. Só então o tema volta — afinado, do
jeito que o pai ensinou antes de estragá-lo — enquanto as relíquias que os
fios seguravam sobem soltas no escuro. As frases ganham a tela uma de cada
vez, e o título se monta abrindo o espaçamento das letras.

Tipografia: **Bodoni Moda** nos títulos (alto contraste, dramática) e
**Spectral** no texto — serifa desenhada para tela, que dá peso literário ao
diálogo.

## Os dois modos

**Demo — Só mais um**, em três cenas. A espinha é uma só: **o tema que você
aprende no piano do prólogo é o que abre os fios no porão.** O presente vira a
ferramenta, na mesma interface.

1. **A Música.** Sala de estar, o único ambiente quente da obra. Adrian ensina
   um tema em ré menor, em três frases que crescem (4, 5 e 7 notas), num piano
   de verdade — sintetizado por harmônicos, com reverberação longa. Você escuta
   e repete de ouvido. Errar não é punido: ele reensina, sem levantar a voz.
   No fim, toque à vontade. E aí vem o elogio, com a função dentro dele:
   `Sua mãe não tem paciência pra isso. Você tem. Por isso eu conto com você.`

2. **A Casa Grande Demais.** Sala, corredor e quarto ligados por portas —
   e a cozinha, que encerra a exploração. Câmera que acompanha, **paredes de
   verdade** (Liam não sai do cômodo por onde não há porta) e **todo vestígio
   em cima de uma coisa desenhada**: o piano da sala (que continua tocável),
   os retratos, o cobertor no braço do sofá, o livro de receitas; no
   corredor, a escova na gaveta do aparador, o retrato grande com o vazio do
   tamanho de uma pessoa, o casaco que não serve em ninguém, as marcas de
   altura no batente da rouparia; no quarto, a cabana de cobertor, a parede
   de plantas (cada uma diferente, com árvores de giz de cera de outra mão),
   a caixa debaixo da cama, o coelho de um olho só, o diário e o armário.
   **O corredor cresce enquanto Liam caminha**, de 470 para 1180 pixels, o
   papel de parede vira floresta e os retratos vão perdendo gente. No fim
   está a **porta que não abre**.

   A casa tem **oito segredos**, e nada no jogo avisa que existem — só o fecho
   conta quantos você achou. (Spoiler, para quem for testar: olhar de novo o
   que já foi visto; bater mais de uma vez; esperar no menu; contar os pratos;
   e prestar atenção no que a voz diz dentro da cabana.)

3. **A Mesa.** Cozinha, porta trancada, malas no chão, cinco pratos. Liam anda entre a mãe e
   o pai e é puxado pelos dois — **não existe ponto neutro**, e a tensão sobe
   mesmo parado. Enquanto isso há **quatro vestígios** para achar: a pulseira
   de hospital com outro sobrenome, o bilhete da tia marcando 23h, o telefone
   fora do gancho, e o pano esquecido na tampa da panela — que você pode tirar.
   Nada disso muda o que vai acontecer. Muda o que ele sabe quando acontecer,
   e o fecho da cena reflete quanto você viu.

4. **O Tear.** Seis fios, cada um pendurando uma relíquia de outra geração.
   O piano reaparece — apagado, torto, frio — e Adrian pergunta:
   `Você lembra da música?` Cada fio se abre tocando uma frase do tema. A cada
   fio o instrumento **desafina e abafa mais**, a imagem racha, o coração
   acelera, e entra em Liam uma lembrança que não é dele. Errar uma nota faz o
   fio chicotear de volta. Não há tela de fracasso e ninguém manda parar.

**Abertura** — o quarto de Liam, o diário e a porta que nunca esteve trancada.

## Onde mexer

| Quero mudar | Arquivo |
|---|---|
| **Qualquer fala ou texto** | `src/game/content/script.ts` — só dados, nada de código |
| Onde ficam os objetos do quarto | `src/game/world/bedroom.ts` (`INTERACTABLES`) |
| Arte do quarto | `src/game/world/bedroom.ts` (`drawBackground`, `PROPS`, `drawClutter`) |
| Luz e atmosfera | `src/game/world/lighting.ts` |
| Paleta e resolução interna | `src/engine/constants.ts` |
| Caixa de diálogo | `src/game/systems/dialogue.ts` |
| Ordem das cenas | `src/game/scenes/` |
| **O tema musical** | `src/engine/musica.ts` (`TEMA`, em graus da escala) |
| Timbre do piano e reverberação | `src/engine/musica.ts` |
| Vestígios da cozinha | `src/game/content/demoScript.ts` (`MESA_VESTIGIOS`) |
| **Cômodos da casa, portas e vestígios** | `src/game/world/casa.ts` |
| Quanto o corredor estica | `src/game/world/casa.ts` (`CORREDOR_BASE`, `CORREDOR_MAX`) |
| Sala (piano, retratos, sofá, estante) | `src/game/world/sala.ts` |
| Texturas comuns (papel de parede, lambri, assoalho, portas, quadros) | `src/game/world/arte.ts` |
| Lista dos segredos | `src/game/content/segredos.ts` |
| O fecho (partículas, acorde final, contagem de segredos) | `src/game/scenes/demo/fim.ts` |
| Personagens animados | `src/game/world/figura.ts` |

Para escrever falas novas basta editar `script.ts`; nenhum outro arquivo
precisa ser aberto.

## Como está montado

```
src/
  engine/      display (mundo 384x216 escalado + interface em resolução de tela),
               input, áudio sintetizado, paleta
  game/
    content/   script.ts — TODO o texto do jogo
    world/     geometria do quarto, arte, luz, Liam
    systems/   estado, caixa de diálogo
    scenes/    título → abertura → quarto → cartão de capítulo
```

O mundo é desenhado em 384x216 e escalado por um número inteiro, para os
pixels ficarem nítidos; o texto é desenhado por cima em resolução de tela,
para continuar legível. Móveis e Liam são ordenados por profundidade, então
ele passa atrás da escrivaninha e na frente da cama.

**Referências visuais:** navegação e câmera do OMORI; paleta, queda de luz e
silhuetas do Hollow Knight. Uma única fonte quente no quarto (a luminária);
a janela é fria e **não anima**, porque a manhã lá fora está congelada.

## Depuração

`?debug=1` na URL expõe `window.__nos` com o estado e a cena atual.

`?cena=<id>` começa direto numa cena, sem rejogar tudo — útil para conferir um
trecho durante a produção. Os ids são `prologo`, `casa`, `mesa`, `tear` e
`fim`. `?segredos=melodia,nome` começa com esses segredos achados (para
conferir o fecho). Nenhum deles tem efeito no jogo normal.

## Limites conhecidos

- Na Abertura só o quarto de Liam existe; a porta leva ao cartão de capítulo.
- A música é toda sintetizada no navegador (piano por harmônicos, drone,
  reverberação gerada); não há áudio gravado.
- Sem salvamento, sem menu de opções, sem suporte a controle.
- As fontes (Bodoni Moda, Spectral e Cormorant Garamond) vão embutidas no
  arquivo; o jogo funciona sem rede.
