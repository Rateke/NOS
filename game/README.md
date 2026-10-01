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

Testes de ponta a ponta, num Chromium de verdade: `test/demo.mjs` (a demo
inteira no teclado, escondendo o caderno a tempo, entrando na frente do
prato e parando de arrumar), `test/mouse.mjs` (a mesma só no mouse, sendo
pego com o caderno e arrumando até o fim), `test/escolha.mjs` (a escolha do
Tear numa segunda partida, salvando cada uma), `test/salvar.mjs` (salvar,
continuar, pausar, sair) e `test/playthrough.mjs` (a fatia antiga do
quarto). `npm run test:all` roda todos.

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

**Se um push não virou deploy**, confira nesta ordem:

1. **O projeto está ligado ao GitHub?** Deploy feito pela linha de comando
   aparece em Deployments com o ícone `>_` — o projeto existe, mas nenhum
   push chega nele. Ligue em Vercel > projeto > Settings > Git > Connect Git
   Repository > `Rateke/NOS` (não importe de novo: isso cria um segundo
   projeto, com outro endereço).
2. **O branch de produção.** O repositório só tem um branch,
   `claude/nos-roteiro-narrativo-lz8r6r`. Em Vercel > projeto > Settings >
   Git > Production Branch, tem que estar esse nome; se estiver `main`, os
   pushes viram só *Preview*, e o endereço principal não muda.
3. **Commit bloqueado.** No plano gratuito a Vercel só publica commits cujo
   autor é o dono da conta. Commit assinado por outra pessoa (ou pelo
   Claude) aparece em Deployments como *Blocked*, ou nem aparece. Os commits
   deste repositório saem com o seu nome e e-mail por isso.

**Reserva, sem depender da integração:** o workflow
`.github/workflows/vercel.yml` publica pela linha de comando da Vercel a
cada push. Ele só precisa do segredo `VERCEL_TOKEN` no GitHub (o passo a
passo está no topo do arquivo). Sem o segredo, ele não faz nada e termina
verde.

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
| Esconder o caderno da Lia (os passos) | clicar | espaço ou E | tocar |
| Entrar na frente de um prato | clicar onde correr | setas | tocar onde correr |
| Escolher quem salvar, no Tear | clicar na metade dela | ← ou → | tocar na metade dela |
| Pausar | ícone no canto de cima | Esc ou P | ícone no canto de cima |
| Abrir o caderno | ícone no canto de baixo | C ou Tab | ícone no canto de baixo |

O clique também traz o foco do teclado para o jogo — dentro de um painel ou
iframe, sem foco nenhuma tecla chega à página.

## Menu e fecho

O jogo **abre em preto absoluto**: uma linha piscando, e nada mais. O primeiro
toque acende tudo de uma vez — a música entra, o corredor em fuga aparece ao
fundo e o título se monta, depois os itens do menu, um a um. Quem já viu a
abertura pula tudo com um toque.

O menu tem três itens:

- **Continuar** — só aparece quando há jogo salvo. Embaixo, onde ele parou e
  há quanto tempo (*"a mesa · salvo há 5 minutos"*).
- **Só mais um** — começa do início. Se houver jogo salvo, a primeira escolha
  só avisa que ele vai ser apagado; a segunda confirma.
- **Sair** — fecha o jogo (ver abaixo).

### Salvar

O jogo **salva sozinho**, na chegada de cada parte: o rádio, a música, a casa,
a mesa, o Tear, depois do grito, a casa sem música e o fim. Não existe botão de
salvar — numa história que se assiste tanto quanto se joga, um menu de salvar
no meio da cena quebra a cena. Um fio que dá uma volta e vira nó aparece por
três segundos no canto de cima, com *salvo* do lado (no preto do rádio e do
grito, o jogo salva sem mostrar nada).

O que fica guardado é o que Liam sabia **ao chegar** na parte: quem continua
começa a parte do começo. As partes da demo duram poucos minutos. O salvo vive
no navegador (`localStorage`, chave `nos:salvo`, com número de versão para
migrar no jogo completo); numa janela anônima, ou embutido numa página que não
deixa guardar, ele vale só enquanto a aba estiver aberta. Depois do fim, ao
voltar para o menu, o salvo é apagado — a história terminou.

Para o jogo completo, um capítulo novo entra em dois lugares:
`ORDEM_PONTOS` (`src/game/systems/salvo.ts`) e `PONTOS`
(`src/game/scenes/pontos.ts`), e a cena declara `readonly ponto`.

### Pausa e Sair

**Esc** (ou P, ou o ícone de pausa no canto de cima, que aparece para quem
mexe o mouse ou joga no toque) congela a cena onde ela estiver — o quadro e o
som param juntos e voltam do mesmo ponto. Esconder a aba também pausa. A pausa
tem *Continuar*, *Voltar ao menu* e *Sair*. Ela só não abre nos cinco segundos
de preto depois do grito, em que nada funciona de propósito.

**Sair**, na versão de computador, fecha a janela: o empacotador (Electron,
Tauri, NW.js) expõe `window.nosNativo.sair()` num script de pré-carga, e
`src/engine/plataforma.ts` chama essa função. No navegador uma página não pode
fechar a própria aba; aí fica uma tela preta com *"Tudo bem parar um pouco."*
e o aviso de que o jogo está salvo — um clique volta ao menu.

### Trilha própria

Para tocar uma gravação que não pode ir junto com o jogo (o *Unravel*
acústico, por exemplo): com o menu aberto, **arraste os arquivos de música
para a janela**. Um arquivo vira a trilha de fundo; com dois, o que tiver
"completo" no nome (ou o maior) é a versão com todos os instrumentos, que
entra por cima só nos picos (o grito e o fecho). Os arquivos ficam guardados
no navegador de quem arrastou e **nunca vão para o repositório nem para o
site publicado**. **Delete**, no menu, tira a trilha própria e volta o piano
sintetizado. Não há item no menu para isso de propósito: é ferramenta de
quem apresenta, não de quem joga.

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

**Demo — Só mais um.** A espinha é uma só: **o tema que você aprende no piano
do prólogo é o que abre os fios no porão.** O presente vira a ferramenta, na
mesma interface.

0. **O rádio.** Tela preta. A hora certa (os bipes perdem o ritmo num trecho)
   e um boletim em linguagem de jornal: incêndio na cozinha às 22h40, duas
   pessoas levadas ao hospital, **uma pessoa morreu**, o pai saiu ileso.
   Ninguém diz quem morreu, nem quem foi levado. Depois, no escuro, a voz da
   Lia falando com o Liam — brava, xingando, e só no fim pedindo
   (*"Volta logo, seu idiota. ...Por favor."*). Ela não diz de onde fala:
   quem joga pela primeira vez acha que é através de uma porta.

   **Que o Liam está em coma, o jogo só conta no fim.** Até lá é pista, para
   quem for juntando: o caderno pergunta *"Voltar de onde?"*, a casa é
   anotada como *"a casa, na minha cabeça"*, e depois do grito um bipe
   dispara e a Lia grita que ele apertou a mão dela. A primeira vez que cada
   camada do mundo aparece — lembrança, a casa, o Dentro, lá fora — ganha uma
   anotação a lápis no canto.

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

   **Cenas que o jogador só assiste.** Ao entrar, a chave gira na porta da
   frente e Liam anda sozinho até o retrato e o endireita, antes de pensar.
   No corredor, a mãe sai da cozinha e pergunta se ele arrumaria uma mochila.
   As respostas dele começam a se escrever devagar — e, **na primeira vez que
   alguém joga, sempre**, sai antes da boca dele a frase do pai, na cor do
   fio do pai. Nas partidas seguintes ele às vezes chega antes. Logo depois,
   o reflexo no vidro do retrato está branco: é a primeira fala da sombra.

   **Cada pessoa é apresentada por uma etiqueta**, na letra do Adrian, presa
   por um fio: *EVELYN — mãe. Cansada.* *LIA — filha. Rebelde.* Na primeira
   fala de cada um, o nome vem com o parentesco; cada nome tem a cor do fio
   da pessoa.

   **A casa calma, até não estar.** Ler o caderno da Lia no corredor tem
   consequência: assim que ele fecha, vêm passos da cozinha, cada um mais
   perto e mais forte, e o aviso é só *ESCONDE*. Dois segundos e pouco.
   Quem esconde a tempo ouve o pai passar direto. Quem não esconde vê o pai
   aparecer na porta, pegar o caderno da mão dele e rasgar a página — e a
   folha rasgada vai para o caderno de Liam. Nada avisa antes que isso pode
   acontecer.

   **O caderno "O que eu sei"** (tecla C, ou o ícone no canto) se escreve
   sozinho com o que Liam vê. Depois do grito, a sombra passa a riscar o que
   é mentira e escrever a verdade por cima, em branco.

   **Papéis para ler de verdade**, com páginas: o diário de Liam (as regras
   da casa, a lista da família com uma quinta linha riscada), o livro de
   receitas onde Evelyn guarda as contas, a carta em que a escola pede uma
   conversa e a **redação "Minha família"**, que tirou dez, o caderno da Lia
   (*"Quando o Liam mente, ele arruma alguma coisa"*), o jornal do dia
   (classificados e palavras cruzadas), o bilhete da tia **Catarina** na
   cozinha e, no porão, o caderno de Amélia. Cada pessoa tem a sua letra — e
   uma quarta letra, a lápis roxo, aparece onde não devia.

   **A mensagem escondida.** Em vários lugares, sem nenhum texto apontando,
   o jogo diz *"preciso de ajuda, não me deixa cair"*: as primeiras letras
   das frases da redação; os bipes da hora certa no rádio e do aparelho
   depois do grito, que perdem o ritmo num trecho de Morse; o poste da rua, que pisca sempre na mesma ordem; a
   resposta do outro lado da porta do fim, que completa as três batidas de
   Liam; cinco casas em branco nas palavras cruzadas; e a marca de caneta
   numa folha arrancada do diário.

   A demo tem **treze segredos**, e nada no jogo avisa que existem — só o
   fecho conta quantos você achou. (Spoiler, para quem for testar: olhar e
   ler de novo o que já foi visto; bater mais de uma vez; esperar no menu;
   contar os pratos; abaixar o rádio da cozinha; ler o jornal até o fim;
   esperar na última página do caderno da bisavó e na folha em branco do
   diário; e prestar atenção no que a voz diz dentro da cabana.)

3. **A Mesa.** Começa no meio: um prato estoura na parede antes de qualquer
   palavra, e a primeira fala já é gritada e xingada (*"VOCÊ NÃO VAI LEVAR
   OS MEUS FILHOS A LUGAR NENHUM, P\*\*\*\*!"*). Toda fala gritada sacode a
   tela no momento em que começa. Palavrão sai censurado, sempre numa fala
   inteira em maiúsculas, para o jogador entender o que foi dito. A cozinha
   da noite da fuga: fogão de quatro bocas com a panela no fogo e o pano de prato apoiado na tampa, pia com a torneira
   pingando embaixo da janela de chuva, rádio ligado, telefone de parede com o
   fone pendurado pelo fio, geladeira com o desenho MAMÃE E EU, relógio
   marcando quase 23h, o chaveiro com o gancho vazio (a chave está no bolso de
   Adrian) e a porta da frente trancada. Evelyn de uniforme e cabelo solto,
   Lia de rabo de cavalo e mochila, Adrian de barba e gola clara. Liam anda
   entre a mãe e o pai e é puxado pelos dois — **não existe ponto neutro**, e
   a tensão sobe mesmo parado. Há **quatro vestígios** (as malas, o bilhete
   da tia no bolso do casaco na cadeira, o pano na panela, o telefone fora do
   gancho) e os cinco pratos. Nada disso muda o que vai acontecer; muda o que
   ele sabe quando acontecer.

   **Os pratos.** Três vezes o pai levanta um prato e mira na mãe ou na Lia:
   o braço sobe, uma marca vermelha aparece no chão aos pés dela, e há um
   segundo e meio. Quem corre até lá leva o prato no lugar dela — a tela
   estoura em branco, e Liam pensa *"Fico no meio. Aí eles param."* (não
   param). Quem não chega vê o prato quebrar nela. O E não funciona enquanto
   o prato está no ar.

   **O fundo do poço é em voz.** Quando a tensão enche, o pai vira para Liam.
   Ele sobe a voz; Liam sobe a dele pedindo para parar; as falas entram no
   tempo marcado e não saem — se empilham pela tela, cada uma maior, até não
   caber mais nada. Corte seco para o preto e o silêncio. Depois, a fuga
   para o alçapão.

4. **O Tear.** Um tear de verdade, embaixo da cozinha: moldura de madeira,
   urdidura esticada, liços, pente, lançadeira e seis carretéis, cada um com
   uma relíquia pendurada. Adrian desce atrás e fica ao pé da escada:
   `Você lembra da música?` E não fica no pé da escada: a cada fio ele chega
   mais perto e aperta mais (*"De novo."* ... *"TOCA, LIAM! TOCA, P\*\*\*\*!"*),
   enquanto Liam se agarra às notas para não ouvir. Cada nota certa passa a
   lançadeira e bate o pente, e a tapeçaria da família cresce de baixo para cima — uma casa, cinco
   figuras de mãos dadas. Cada fio completo prende mais um fio no peito de
   Liam e abre uma **lembrança que não é dele**, indo de geração em geração:
   o pai e o prato quebrado, Lia gritando para uma porta, Evelyn na primeira
   fuga com uma menina pela mão, a avó endireitando o retrato, Amélia
   tecendo à luz de vela (*"Toda paz que lhes dei acordou dentro de mim"*) e,
   por último, **a figura preta**: alguém na porta do quarto, contra a luz,
   cortando o próprio fio para que nada chegasse nele. Quando o tecido fica
   pronto, o desenho mostra o que faltava — um buraco do tamanho de uma
   pessoa, ao lado de Liam.

5. **Dentro.** Corte seco para a cabeça de Liam: vácuo preto, uma toalha
   xadrez do tamanho do chão, uma luz de cima. As lembranças chegam
   recortadas, e em cada recorte há uma coisa torta brilhando — arrumar faz o
   próximo chegar (*Cinco. Quatro. Três.*, contando pratos). Em cada recorte
   a **sombra branca**, a parte de Liam que não deve nada a ninguém, conversa
   com ele sobre a mãe: pergunta que tipo de pessoa ela era, deixa a
   lembrança falar, e repete a lição da mãe na boca dela (*"É melhor ser
   ferido do que ferir os outros"*). Depois vem a pergunta que ele nunca fez
   (*"Tem certeza de que a sua mãe era tão boa e maravilhosa quanto você
   pensa?"*), e o golpe, sobre a Lia: *"E a culpa é toda sua."* Do recorte
   da chave em diante, **dá para parar de arrumar**. Parando ou não, ouve-se
   o pai descendo a escada.

6. **A lei do pai e a escolha.** De volta ao Tear, Adrian fala baixo pela
   primeira vez: a lei que aprendeu com a mãe dele (*"Todas as desvantagens
   deste mundo vêm da falta de habilidade de uma pessoa"*), e então monta a
   situação que prova as duas coisas. A mãe e a Lia aparecem, cada uma presa
   ao peito de Liam por um fio, e ele acende a vela: *"Qual delas você quer
   salvar?"* Treze segundos. As três vozes por cima umas das outras (*"Escolhe
   a Lia, filho."* / *"Escolhe a mãe, seu idiota!"* / *"ESCOLHE!"*), o calor
   subindo, ← para a mãe, → para a Lia. **Na primeira vez as mãos não
   obedecem** — todo mundo vive o não escolher: no fim Liam se oferece no
   lugar (*"Se tem que queimar alguém, queima o meu!"*) e o fogo sobe pelos
   dois fios. Nas partidas seguintes dá para escolher, e o fio da outra
   queima. Nos três casos o jogo não diz quem morreu.

7. **Dentro, de novo.** Cinza caindo no vácuo, e a conversa inteira com a
   sombra: *"Se oferecer no lugar dos outros é a lição da sua mãe levada até
   o fim. E ela não salva ninguém."* A culpa, dita até o fim (*"É você."*); o
   *e se* que muda conforme a escolha, e *"Não agir é uma escolha, é
   simplesmente deixar."*; a mãe, que *"não conseguiu fazer isso. Isso não é
   bondade. Isso é apenas fraqueza."*; Liam respondendo *"Mesmo assim!"* cada
   vez mais alto; e o fim, em que ele para de discutir com a sombra e diz o
   que é dele: *"Eu não sou o nó."*

8. **O grito.** De volta ao Tear, o pai pede só mais um — e Liam pergunta,
   pela primeira vez: *"Quantas vezes, pai? Quantas vezes 'só mais um'?"* Segurar a tecla (ou o
   clique, ou o dedo) deixa sair *EU NÃO QUERO.* letra por letra; soltar cedo
   é engolir, e o pai repete o pedido. Cheio, vira uma onda branca: todos os
   fios arrebentam. **Cinco segundos de preto**, em que nenhuma tecla
   funciona. Um bipe dispara; a Lia grita que ele apertou a mão dela e chama
   alguém.

9. **A casa sem música.** Tudo fora do lugar, as cores reais das coisas
   (dessaturadas), geladeira, relógio e chuva. A sombra de Liam no chão ficou
   branca. Nada pede para ser arrumado — e deixar como está é a escolha. A
   Lia recua quando ele chega perto, e a etiqueta dela é corrigida pela
   sombra. A única cor da casa é a luz âmbar da secretária eletrônica: um
   recado da mãe, de terça às 17h40. *"Eu volto mais tarde."*

**A fatia antiga** — o quarto de Liam, o diário e a porta que nunca esteve
trancada. Saiu do menu; continua no código e abre com `?cena=quarto`.

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
| **Falas da noite**: a briga, os pratos, a gritaria, a pressão no Tear, a lei do pai, a escolha, as duas conversas com a sombra, os passos | `src/game/content/noite.ts` |
| Pratos voando e a gritaria (tempos, alvo, dano) | `src/game/scenes/demo/mesa.ts` (`ARREMESSOS_EM`, `AVISO_PRATO`, `CORRIDA`) |
| A escolha do Tear (duração, fios queimando) | `src/game/scenes/demo/tear.ts` (`ESCOLHA_DUR`) |
| **Cômodos da casa, portas e vestígios** | `src/game/world/casa.ts` |
| Quanto o corredor estica | `src/game/world/casa.ts` (`CORREDOR_BASE`, `CORREDOR_MAX`) |
| Sala (piano, retratos, sofá, estante) | `src/game/world/sala.ts` |
| Texturas comuns (papel de parede, lambri, assoalho, portas, quadros) | `src/game/world/arte.ts` |
| Lista dos segredos | `src/game/content/segredos.ts` |
| **Diários, cartas, jornal, caderno** (o texto das páginas) | `src/game/content/documentos.ts` |
| Leitor de páginas (papel, letras de cada pessoa) | `src/game/systems/leitor.ts` |
| O fecho (partículas, acorde final, contagem de segredos) | `src/game/scenes/demo/fim.ts` |
| Cozinha (fogão, pia, rádio, telefone, mesa) | `src/game/world/cozinha.ts` |
| O Tear e a câmara | `src/game/world/camara.ts` |
| As lembranças do Tear | `src/game/world/lembrancas.ts` |
| Personagens animados (cabelo, barba, mochila, silhueta) | `src/game/world/figura.ts` |
| Rádio do começo e hospital | `src/game/scenes/demo/hospital.ts` |
| Dentro (montagem, sombra, oferta) | `src/game/world/dentro.ts` |
| Caderno "O que eu sei" (o que se escreve, o que a sombra corrige) | `src/game/content/caderno.ts` |
| Etiquetas, anotação de camada, escolha lenta | `src/game/ui/` |
| A casa depois do grito | `src/game/world/casa.ts` (`*_DEPOIS`) |
| Trilha de fundo (sintetizada ou arquivos próprios) | `src/engine/principal.ts`, `src/engine/trilhaPropria.ts` |
| Menu (Continuar, Só mais um, Sair) | `src/game/scenes/title.ts`, `src/game/ui/lista.ts` |
| Salvar e os pontos de salvamento | `src/game/systems/salvo.ts`, `src/game/scenes/pontos.ts` |
| Pausa, ícone de pausa, nó do salvo | `src/game/ui/pausa.ts` |
| Sair (despedida e versão de computador) | `src/game/scenes/despedida.ts`, `src/engine/plataforma.ts` |

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
trecho durante a produção. Os ids são os pontos de salvamento (`abertura`,
`prologo`, `casa`, `mesa`, `tear`, `grito`, `depois`, `fim`), mais `hospital`
(= `abertura`) e `quarto` (a fatia antiga). Entrar assim também grava o jogo. `?segredos=melodia,nome` começa com esses segredos achados (para
conferir o fecho). Nenhum deles tem efeito no jogo normal.

## Limites conhecidos

- Na fatia antiga só o quarto de Liam existe; a porta leva ao cartão de capítulo.
- A música é toda sintetizada no navegador (piano por harmônicos, drone,
  reverberação gerada); não há áudio gravado.
- Um lugar de salvo só (sem vários perfis), sem menu de opções, sem suporte a
  controle.
- As fontes (Bodoni Moda, Spectral e Cormorant Garamond) vão embutidas no
  arquivo; o jogo funciona sem rede.
