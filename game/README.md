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
prato, respirando no ritmo e parando de arrumar), `test/mouse.mjs` (a mesma
só no mouse, sendo pego com o caderno e arrumando até o fim), `test/escolha.mjs` (a escolha do
Tear numa segunda partida, salvando cada uma), `test/salvar.mjs` (salvar,
continuar, pausar, sair), `test/celular.mjs` (em pé e deitado, só no
toque), `test/som.mjs` (vozes audíveis, grito mais
alto que fala, nada estoura na briga), `test/segunda.mjs` (o que muda
quando o jogo lembra que você já terminou), `test/violoncelo.mjs` (os
segredos do menu, a partitura até o fim e o quinto retrato),
`test/novidades.mjs` (a foto que a Lia joga, a cabana pela luz, a floresta
pela fresta do armário, a sombra do pai que engole o Tear, o jornal) e
`test/playthrough.mjs` (a fatia
antiga do quarto). `npm run test:all` roda todos.

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
| Tocar o piano ou o violino | clicar na tecla ou na nota | A S D F G H J K | tocar na tecla ou na nota |
| Abrir um fio no Tear | tocar a melodia | tocar a melodia | tocar a melodia |
| Rever o caderno da bisavó / escutar o fio, no Tear | clicar no botão | C / R | tocar no botão |
| Abrir e fechar a porta do armário (depois do grito) | arrastar | ← → | arrastar |
| Pegar a foto que a Lia joga | clicar onde correr | setas | tocar onde correr |
| Examinar um vestígio | clicar nele | E perto dele | tocar nele |
| Esconder o caderno da Lia (os passos) | clicar | espaço ou E | tocar |
| Arrumar a coisa torta, no Dentro | clicar nela | E | tocar nela |
| Respirar, numa crise | segurar o botão | segurar espaço | segurar o dedo |
| Entrar na frente de um prato | clicar onde correr | setas | tocar onde correr |
| Escolher quem salvar, no Tear | clicar na metade dela | ← ou → | tocar na metade dela |
| Pausar | ícone no canto de cima | Esc ou P | ícone no canto de cima |
| Abrir o caderno | ícone no canto de baixo | C ou Tab | ícone no canto de baixo |

**No celular:** o jogo é deitado. Em pé, ele para e pede para virar o
aparelho, e continua de onde parou. Deitado, o cenário preenche a altura da
tela. Qualquer toque passa a fala; arrastar o dedo na metade esquerda anda.
O primeiro toque liga o som — o navegador do celular só deixa o áudio tocar
se ele for ligado dentro de um toque — e, no Android, pede a tela inteira e
trava deitado. No iPhone o som toca mesmo com a chave de silencioso ligada
(Safari 16.4 em diante). Com o piano na tela, a caixa de fala sobe para não
cobrir as teclas. `test/celular.mjs` joga isso tudo só no dedo.

**Cada um lê no seu tempo.** Toda fala espera o toque para passar — o
boletim do rádio também. A única exceção são os gritos curtos (até 64
letras, que se leem num relance): esses passam sozinhos e não dá para
pular. É o único momento em que o jogo tira o controle de quem joga. Grito
comprido espera o toque como o resto.

**Respirar.** Às vezes o ar não entra. A tela some em volta, um anel claro
cresce e encolhe no ritmo certo (quatro pra dentro, quatro pra fora),
contando de 1 a 4 no meio, e o círculo de dentro é o ar do Liam: cresce
enquanto você segura e esvazia quando solta. Embaixo, sempre: *"segure
ESPAÇO enquanto o círculo cresce · solte enquanto ele diminui"*. Quando o ar
acompanha o anel, o escuro em volta abre; quando escapa, fecha. Não tem
botão de pular — quem não segura nada também está respirando, mal. A
primeira vez é com a mãe, no corredor, sem como errar.

**Mecânica nova aparece antes de importar.** O jogo não pausa para explicar.
Cada mecânica aparece primeiro num momento sem perigo: a marca vermelha no
chão (a foto que a Lia joga, antes dos pratos da cozinha), a respiração (com
a mãe, antes da crise), o tema (com o pai no prólogo, antes do Tear).

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
site publicado**. Um arquivo com *lia* ou *fone* no nome não mexe na trilha
do menu: ele vira a música do fone da Lia, a que toca quando os dois dividem
o fone. **Delete**, no menu, tira a trilha própria e volta o piano
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

### Som e vozes

**Todo mundo fala.** Ninguém pronuncia as palavras: cada personagem tem uma
voz sintetizada, que acompanha a legenda letra a letra, como em OMORI e
Undertale (`src/engine/voz.ts`). As vogais do texto dão a forma da boca, as
consoantes o ataque, e a frase cai no fim e sobe quando é pergunta. Adrian é
grave e devagar; Liam, baixo e com fôlego; Evelyn, cansada; a Lia, rápida e
afiada; a sombra fala com a voz do Liam, uma oitava embaixo e com eco. Quem
fala de outro cômodo (ou da secretária eletrônica) sai abafado. Pensamento e
papel lido não têm voz, só o tique da letra.

**Grito vem com caos.** Toda fala gritada dispara, por baixo, uma mistura
que nunca se repete igual (`sons.caos` em `src/engine/audio.ts`): um baque
grave, um piano esmagado em notas que brigam, uma serra rasgada, um guincho
de metal, louça, estática, cordas raspando e o zumbido que fica no ouvido. A
voz do grito sai mais alta, mais aguda e distorcida.

**A gritaria da cozinha** é uma cacofonia que sobe: serras desafinadas
subindo juntas, uma multidão sem palavras, cada fala gritada na voz de quem
gritou e do lado da tela onde ela caiu — até o corte seco, em que sobra só o
apito no ouvido. Na escolha do Tear, as três vozes gritam por cima umas das
outras, cada uma do seu lado, com o relógio acelerando.

**Música de tensão** (`src/engine/clima.ts`), dosada por cena: um
contrabaixo em colcheias que corre conforme a tensão, um **violoncelo** que
segura a nota grave e desce meio tom por vez quando aperta, dois **violinos**
lá em cima que fecham em segunda menor com tremolo, um relógio, o coração,
chuva na janela da casa, e no Dentro uma caixinha de música e um violino
sozinho tocando o tema. O tema do piano também ganhou violoncelo e violino
por baixo. Cordas são sintetizadas (serra com vibrato, ataque de arco e um
corpo de madeira em filtros), como o resto.

**Silêncio antes do susto.** Os dois sustos da demo vêm depois de um
silêncio de verdade: a música, a chuva e a casa somem de uma vez, e só
então o estouro, o som mais alto do jogo (`sons.susto`, direto na saída:
um grave que despenca, uma pancada de cordas em segundas menores rasgada,
metal, um guincho longo e um estouro de ar). O rosto
(`src/game/ui/rostoSusto.ts`) é desenhado na resolução da tela e por cima
de tudo, inclusive das margens: um clarão branco, e ele vem para cima de
quem joga — branco de cera, rachado, órbitas fundas com pupilas mínimas,
lágrimas pretas, veias, a boca rasgada até perto das orelhas, cheia de
dentes — tremendo, piscando em negativo, com o vermelho nas bordas. No
espelho, é o rosto do Liam, com o cabelo dele caindo na cara.

**As cordas** são sintetizadas como corda friccionada, não como órgão:
dente de serra com a afinação viva e vibrato que entra depois do ataque,
o corpo do instrumento em ressonâncias em série (o ar da caixa, a
madeira, o buraco nasal, o brilho do cavalete), o chiado da crina e, na
nota atacada, o arco mordendo a corda e a nota entrando um tico abaixo. Na casa calma, só chuva,
os passos de Liam no assoalho (às vezes a tábua range) e as portas; quando
os passos do pai vêm, o coração e as cordas entram de uma vez.

**Volume e graves.** A mistura sai forte: ganho geral alto, os graves
reforçados na medida (+2,5 dB abaixo de ~120 Hz e +2 dB no sub, em ~58 Hz — o
piano do pai, o violoncelo, os baques, as portas, os passos), um limitador
e, no fim, uma saturação suave que encorpa o que é baixo e arredonda o que
passou. Os gritos podem empilhar à vontade: nada sai acima de 0,94 na caixa
de som (`test/som.mjs` mede isso).

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

1. **A Música.** Sala de estar, o único ambiente quente da obra. Adrian
   sentado ao piano; Liam em pé do lado, com o violino no ombro. O tema é em
   ré menor harmônico, grave, em três frases que crescem (4, 5 e 7 notas):
   a pergunta (salta uma quinta, sobe meio tom e suspira), a que cresce até a
   oitava e desce torta pelo dó sustenido sem fechar, e a queda, que desce
   inteira até onde começou. O pai toca cada frase no piano; você responde
   no violino, de ouvido (o mesmo A S D F G H J K, agora num braço de
   violino na tela, com o arco correndo a cada nota). Quando você acerta, o
   piano dele entra embaixo e os dois tocam juntos. **Quando erra, bronca:**
   ele bate as duas mãos no grave do piano, vira para você e fala baixo
   (*"Não. Para. Você não tá escutando. Do começo."*). **Depois de zerar a
   demo, o erro vira grito** (*"ERROU?! DE NOVO?! Agora vê se não erra. Você
   já passou por aqui. Já sabe como as coisas funcionam."*), e Liam tem de
   respirar no ritmo com o arco tremendo em cima da corda antes de tentar de
   novo. No fim, toque à vontade. E aí vem o elogio, com a função dentro
   dele: `Sua mãe não tem paciência pra isso. Você tem. Por isso eu conto com você.`
   Liam toca os três: o piano (que o pai ensinou), o violino (que o pai quis)
   e o violoncelo do bisavô, pendurado na parede do quarto dele — *"é o único
   que ninguém corrige"*.

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
   **O corredor cresce enquanto Liam caminha**, de 520 para 1180 pixels, o
   papel de parede vira floresta e os retratos vão perdendo gente. No fim
   está a **porta que não abre**.

   **Cenas que o jogador só assiste.** Ao entrar, o chaveiro, a chave
   raspando na fechadura, duas voltas, a porta da frente abrindo e batendo:
   o pai chegou. Liam leva um susto (um pulinho e um "!" em cima da cabeça),
   corre até o retrato grande da sala, que está torto, e endireita com as
   duas mãos — o quadro balança, passa do ponto e para reto — antes de o pai
   dizer *"Cheguei."*. Ninguém mandou.
   No corredor, a mãe sai da cozinha e pergunta se ele arrumaria uma mochila.
   As respostas dele começam a se escrever devagar — e, **na primeira vez que
   alguém joga, sempre**, sai antes da boca dele a frase do pai, na cor do
   fio do pai. Só **depois de zerar a demo** ele consegue responder com uma
   das opções dele (sair no meio e voltar não conta). Logo depois,
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

   **O quarto da Lia**, no corredor, com a porta cheia de adesivos. Por
   dentro é o quarto de uma adolescente que não pede licença: parede
   escura riscada de canetinha (*LIA*, *SAI*, *LIVRE*, *NÃO ENTRA*,
   *CANSEI*, símbolos, setas), uma bandeira listrada no lugar da cortina,
   um varal de polaroides com fita crepe, roupa e papel no chão e uma TV
   velha chiando no canto, o skate dela com a roda torta encostado na parede,
   um calendário com os dias riscados até hoje (circulado: *"tia C., 23h"*)
   e, na porta do armário, uma tira de fotos de cabine em que a quarta foto
   foi cortada na tesoura — sobrou um pedacinho de manga roxa. Ela
   está arrumando a mala e xinga ele por entrar sem bater. Manda ele passar
   as coisas — a foto da família (*"Essa não. Ele tá nela."*), o fone, o
   desenho que ele fez com sete anos —, senta na beirada da cama, manda ele
   sentar do lado, divide o fone (o fio liga as duas orelhas) e por meio minuto a casa
   não existe (a música dela toca, abafada, num lado só, sem pressa — ela
   batuca o ritmo no joelho, encosta a cabeça no ombro dele; uma peça própria,
   piano lento em sol maior com eco de quarto; quem quiser outra música no
   fone arrasta um arquivo com *lia* ou *fone* no nome, ver *Trilha
   própria*), até o pai gritar da
   cozinha. Então ela chama ele para ir junto, hoje, para a tia Catarina. A
   resposta dele, **na primeira vez, sai com a voz do pai** (*"Não posso
   deixar o pai sozinho."*); ela grita *"VOCÊ É IGUALZINHO A ELE, SABIA?"*,
   pega a foto da família — a que tem o pai — e ergue para jogar. **É aqui
   que o jogo ensina a mecânica dos pratos, sem perigo:** o braço sobe, uma
   marca vermelha pulsa no chão onde a foto vai bater, e há dois segundos.
   Quem corre até a marca pega a foto no peito (*"Por que você protege ele?!
   Ele nem tá aqui!"*); quem não corre vê o vidro estourar bem em cima do
   rosto do pai (*"Eu podia ter pegado."*). Nada pausa para explicar. Ela
   manda ele sair — e, quando ele vira, enfia um bilhete no bolso do moletom
   dele.

   **A mãe ensina a respirar.** No corredor, antes da pergunta da mochila,
   Evelyn repara que ele está respirando curto e faz o exercício junto
   (*"Quatro pra dentro, quatro pra fora. Eu conto."*): o anel cresce e
   encolhe contando de um a quatro, ela conta em voz alta, e não dá para
   errar. É a mesma respiração que ele vai precisar sozinho, na crise da casa
   e na cozinha — e lá, quando o ar acompanha o anel, o escuro em volta abre
   e o coração desacelera; quando escapa, a tela fecha.

   **Os dois sustos.** O espelho do quarto da Lia: quando Liam passa, o
   reflexo atrasa — uma vez só. Quem estranha e volta para olhar, parado na
   frente dele, leva o susto. E a primeira vez que a sombra branca aparece,
   no vidro do retrato do corredor: silêncio, e o rosto dela enche a tela.

   **A janela da sala.** O poste da rua acende num cone amarelo com a chuva
   caindo dentro, uma poça de luz no asfalto e um resto de luz que entra pela
   janela e cai no chão. Quem vem da direita olhando a janela de longe, na
   primeira vez, vê alguém parado embaixo do poste, sem guarda-chuva. Chegando
   perto, não tem ninguém.

   **O relógio do corredor** anda conforme ele visita os cômodos (22h10,
   22h15...) e para às 22h40 depois do grito. De madrugada de verdade (entre
   meia-noite e cinco da manhã de quem joga), ele mostra a hora real e a mãe
   chama da cozinha: *"Liam? Já passou da meia-noite, filho. Vai dormir."*

   **O cheiro de queimado.** De vez em quando, entrando num cômodo, Liam
   sente cheiro de queimado. Ninguém mais sente. *"Não vem da cozinha. Vem de
   perto. Vem de mim."*

   **A crise.** Cada coisa que ele olha tem outra escondida embaixo, e o
   coração vai subindo junto. Na sétima, o peito fecha: o zumbido, as mãos
   formigando e a respiração (ver Controles). Conseguindo ou não, passa — de
   jeitos diferentes.

   **Ninguém veio.** Quem fica dois minutos sem mexer em nada vê Liam sentar
   no chão, esperando alguém vir procurar.

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
   o jogo diz *"preciso de ajuda, não me deixem cair"*: as primeiras letras
   das frases da redação (PRECISO na primeira página, DE AJUDA na segunda);
   os bipes da hora certa no rádio e do aparelho depois do grito, que perdem
   o ritmo num trecho de Morse (AJUDA); o poste da rua, que pisca sempre na
   mesma ordem (SOS); a resposta do outro lado da porta do fim, que completa
   as três batidas de Liam; cinco casas em branco nas palavras cruzadas; e a
   marca de caneta numa folha arrancada do diário, que só aparece para quem
   espera na página: *"não me deixem cair"*.

   A demo tem **onze segredos**, e nada no jogo avisa que existem — sem som,
   sem estrela, sem aviso; só o fecho conta quantos você achou. Olhar de novo
   um objeto não conta como segredo: segredo é o que pede paciência, atenção
   ou fazer o que o jogo não pede. (Spoiler, para quem for testar: esperar
   no menu até a porta do fim abrir; reparar no vulto embaixo do poste e ir
   até a janela; tocar o tema ao contrário no piano da sala; bater três vezes
   na porta que não abre; reparar que a mesa da cozinha tem cinco pratos;
   abaixar o rádio da cozinha; esperar na última página, em branco, do
   caderno da bisavó e na folha arrancada do diário; e, depois do grito,
   escutar a lata dentro da cabana, ficar olhando pela fresta do armário até
   ver a Lia, e tocar a partitura roxa no violoncelo até o fim.)

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

   **Os pratos.** Dois pratos, um em cada uma, e só depois de ela dizer o que
   ele não quer ouvir: a mãe (*"Chega, Adrian. Eu vou embora hoje. E as
   crianças vão comigo."*) e, mais tarde, a Lia (*"Ninguém nesta casa aguenta
   mais você. NINGUÉM!"*). *"O QUE FOI QUE VOCÊ DISSE?!"* — o braço sobe, a
   mesma marca vermelha que apareceu no quarto da Lia pulsa no chão aos pés
   de quem falou, e há um segundo e meio. Quem corre até lá leva o prato no lugar dela — a tela
   estoura em branco, e Liam pensa *"Fico no meio. Aí eles param."* (não
   param). Quem não chega vê o prato quebrar nela. O E não funciona enquanto
   o prato está no ar.

   **O ar.** Depois do primeiro prato, o ar para de entrar e vem a
   respiração. Dá para conseguir — e o pai ouve: *"TÁ RESPIRANDO ASSIM POR
   QUÊ?! OLHA PRA MIM!"*. Não conseguindo, a cozinha fica pequena. Nos dois
   casos piora: a tela fecha mais e não volta inteira.

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
   enquanto Liam se agarra às notas para não ouvir.

   **O que fazer fica sempre na tela:** *"Tecer os seis fios: em cada um, a
   frase que o pai ensinou"*, quantos fios faltam, e dois botões — **C**,
   o caderno da bisavó, que abre direto na página da *música do tear* (as
   três frases em nomes de nota, ré, lá, si♭..., do jeito que o teclado
   mostra, com uma nota apagada na segunda e outra na terceira: *"Onde
   falta, eu já não lembro. O fio lembra"*), e **R**, escutar o fio: a frase
   do fio aceso toca sozinha, acendendo as teclas uma a uma, para quem
   esqueceu. Escutar custa: ele não gosta de esperar.

   **A sombra do pai.** Cada nota errada faz Adrian chegar mais perto e
   crescer: o corpo vira uma sombra preta que vai tomando a sala, com dois
   olhos dourados acesos e uma brasa vermelha por trás, e a voz dele engrossa
   junto. Tocar certo faz ela recuar. Se ela enche, engole a tela inteira —
   preto, os olhos, *"DE NOVO."*, *"Ele cresceu até não sobrar sala."* — e
   o Tear recomeça do primeiro fio (as lembranças que já passaram não voltam).
   A mesma sombra aparece no prólogo, no violino: três erros seguidos e a
   frase recomeça. Cada nota certa passa a
   lançadeira e bate o pente, e a tapeçaria da família cresce de baixo para cima — uma casa, cinco
   figuras de mãos dadas. Cada fio completo prende mais um fio no peito de
   Liam e abre uma **lembrança que não é dele**, indo de geração em geração,
   como filme velho (moldura de cantos redondos, grão, luz vazando num canto,
   a cor de quem lembra) e com a câmera chegando perto da ação: o pai
   levantando o prato e estilhaçando no chão, a mãe se encolhendo e o Liam
   pequeno se escondendo no batente; Lia batendo numa porta que treme até a
   luz lá dentro apagar e ela escorregar para o chão; Evelyn na primeira
   fuga, andando na chuva com uma menina pela mão e a mala, um farol
   varrendo as duas; a avó endireitando o retrato enquanto o menino baixa a
   cabeça; Amélia tecendo à luz de vela, o pano subindo e a lançadeira indo
   e voltando (*"Toda paz que lhes dei acordou dentro de mim"*) e,
   por último, **a figura preta**: alguém na porta do quarto, contra a luz,
   cortando o próprio fio para que nada chegasse nele. Quando o tecido fica
   pronto, o desenho mostra o que faltava — um buraco do tamanho de uma
   pessoa, ao lado de Liam.

5. **Dentro.** Corte seco para a cabeça de Liam: vácuo preto, uma toalha
   xadrez do tamanho do chão, uma luz de cima. As lembranças chegam
   recortadas, e em cada recorte há uma coisa torta brilhando, flutuando
   torta debaixo de uma lâmpada pendurada que balança. Passar as falas não
   arruma nada: depois da conversa é **o jogador** que aperta E (ou toca na
   coisa) e Liam vai até ela e endireita — e só então o próximo recorte chega
   (*Cinco. Quatro. Três.*, contando pratos). Poeira e fios das cores da
   família caem devagar do escuro. Em cada recorte
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
   dois fios. Depois de zerar a demo dá para escolher, e o fio da outra
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

   **Os nós.** Em cada cômodo tem um nó de fio da cor de alguém: o da mãe na
   sala, o do pai no corredor, o da Lia no quarto dele, e um lilás no quarto
   da Lia. Desatar um abre uma lembrança daquela pessoa e pinta a tela da cor
   dela por um instante. A secretária só toca depois que os quatro estão
   soltos — e, com o último, a porta do fim do corredor se abre um pouco: um
   bipe de monitor e a voz da Lia lá de dentro. O relógio está parado nas
   22h40, a porta da cozinha está trancada (pela fresta, o boletim inteiro
   do rádio: *"...o adolescente de treze anos segue internado..."*). No
   quarto da Lia, o espelho está coberto com um lençol, e quem guardou o
   bilhete lê: *"se mudar de ideia, a gente tá na tia Catarina. — L."*
   Na parede dela, por cima dos rabiscos, um *VOLTA* grande, de tinta
   fresca; e, na segunda partida, embaixo de um dos rabiscos, um recado
   pequeno: *"não é culpa sua, L."*

   **A cabana, por dentro.** No quarto dele a cabana de cobertor desabou —
   mas a lanterna continua acesa por baixo do pano. Quem encosta a mão na luz
   vê a tela clarear inteira, e do outro lado está dentro dela: maior por
   dentro do que por fora, o cobertor de retalhos fazendo teto, o varal de
   luzinhas, as almofadas, desenhos de giz de cera presos com alfinete (cinco
   bonecos de palito; o quinto, roxo, segurando a mão dele), uma caixinha de
   música que toca o tema ao contrário, subindo, e duas latas ligadas por um
   barbante que some no escuro. Na lata, longe, a voz da Lia: *"Eu tô aqui
   fora. Eu não vou embora. Então você também não vai."* É o único lugar da
   casa em que nada está fora do lugar.

   **O armário.** Dá para entrar no armário dele, puxar a porta e decidir
   quanto ela fica aberta (← →, ou arrastando). Pela fresta, em vez do
   quarto, tem uma floresta à noite — lua, troncos, névoa, vaga-lumes, o
   vento e uma coruja. Aberta demais, é só o quarto de novo: a floresta só
   existe pelo pouco que se vê. Quem deixa a fresta pequena e fica parado
   olhando vê, entre as árvores, uma figura de rabo de cavalo. A música dela
   vem de longe por um instante. *"...Lia?"*

   **O quarto dela, depois.** O fone que ela deixou na cama: pegando, a
   música dela toca no quarto vazio enquanto ele estiver lá. Uma caixa de
   sapato puxada de baixo da cama, com todos os desenhos que ele deu para
   ela, até os feios. E a foto da família como ficou: estourada no chão, se
   ele não pegou; virada para baixo embaixo do travesseiro, se pegou.

   **O violoncelo.** O do bisavô ficou torto no gancho do quarto de Liam.
   Agora dá para tirar da parede, sentar na cama e tocar (A S D F G H J K,
   ou tocando nas notas do braço). Embaixo dele, no chão, uma partitura a
   lápis roxo — *"pra quando você não conseguir dormir — E."* — com a letra
   de cada nota embaixo e a próxima marcada. Errar volta para o começo, sem
   bronca: aqui ninguém corrige. Quem toca até o fim ouve o piano da sala
   responder sozinho, em ré maior, pela primeira vez; e na sala, no prego
   onde faltava um retrato, volta **o quinto retrato** — uma mulher que ele
   nunca viu, com as mãos do jeito que ele segura as dele. Atrás, a lápis
   roxo: *"você tocou até o fim. eu escutei. — E."*

10. **Os créditos e o colapso.** Os créditos sobem com o tema no piano,
    terminando em ré maior (segurar espaço ou o dedo acelera). A tela pisca
    — e o Liam aparece em pânico, de perto, suando, enquanto as frases da
    noite voam pela tela nas vozes de quem disse, e o som aumenta, aumenta e
    **aumenta** — até o corte seco. Preto. E então, rápido e discreto: o
    quarto de hospital, Liam deitado, a Lia dormindo na cadeira, o monitor
    bipando. O dedo dele mexe. Volta para o menu.

**A segunda partida.** (Spoiler.) Tudo o que muda na segunda vez só muda
depois de **zerar** a demo: quem começou, cansou e saiu continua com o
jogo salvo, mas sem nada disso. Quem termina a demo e aperta *Só mais um*
de novo não volta para a mesma casa: volta para uma casa que lembra. O fio
fino embaixo do título aparece cortado no meio, com as pontas desfiadas, e o
tema do menu volta um pouco fora do tom. O pai abre a aula com *"De novo, filho?"* e,
quando Liam acerta, *"Você já sabe essa. Eu sei que sabe."* A Lia, no rádio,
diz que fala a mesma coisa todo dia. A sombra aparece logo na entrada da
casa (*"Você já esteve aqui."*), o relógio do corredor já começa parado nas
22h40 e o poste está vazio (*"Da outra vez tinha."*). Na cozinha, *"Eu sei o
que vem agora. Saber não ajuda em nada."* Com a mãe, ele finalmente consegue
responder; no quarto da Lia, também; e no Tear as mãos obedecem. E,
depois do fogo, a sombra lembra
quem ele salvou da outra vez — e diz se ele fez igual. Mais duas coisas,
fora da segunda partida: quem sai para o menu no meio da cozinha ou do Tear
encontra, ao voltar, *"Fugir também é escolher."*; e quem vem passando as
falas sem ler ouve a sombra, no Dentro, numa fala que não dá para pular:
*"Você nem lê mais. Só quer que acabe. Igual a ele."*

**Os segredos do menu.** (Spoiler.) Com o menu aberto, digitar algumas
palavras faz coisas: *nos* derruba o acento do título (*"Sem o acento, nós
vira nos. Como em: ele nos ama."*); *ajuda* toca o Morse dos bipes; *elisa*
abre a porta do corredor ao fundo, alguém aparece, bate e deixa um recado
roxo; *lia* põe a música do fone dela tocando baixinho do outro lado da
parede; *liam* responde *"Ainda tô aqui."* E segurar o clique (ou o dedo)
fora dos itens por cinco segundos congela o corredor, faz o coração bater e
traz a respiração da mãe: *"Quatro pra dentro. Quatro pra fora."*

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
| **O tema musical** | `src/engine/musica.ts` (`TEMA`, em graus da `ESCALA` de ré menor harmônico) |
| O violino do Liam (som e braço na tela) | `src/game/systems/piano.ts` (`instrumento: 'violino'`), `src/engine/musica.ts` (`arco`) |
| O prólogo: acompanhamento do pai, bronca, grito e respiração | `src/game/scenes/demo/prologo.ts` (`ACOMPANHA`, `baterNoPiano`, `gritar`); falas em `content/demoScript.ts` (`PROLOGO_*`) |
| Volume geral, graves, limitador | `src/engine/audio.ts` (`init`) |
| Timbre do piano e reverberação | `src/engine/musica.ts` |
| Vestígios da cozinha | `src/game/content/demoScript.ts` (`MESA_VESTIGIOS`) |
| **Falas da noite**: a briga, os pratos, a gritaria, a pressão no Tear, a lei do pai, a escolha, as duas conversas com a sombra, os passos | `src/game/content/noite.ts` |
| **Vozes** (timbre de cada personagem, altura, ritmo) | `src/engine/voz.ts` (`TIMBRES`) |
| O caos dos gritos, a cacofonia, passos, portas | `src/engine/audio.ts` (`caos`, `iniciarCacofonia`, `pisada`, `porta`) |
| Música de tensão (pulso, cordas, relógio, caixinha, coração, chuva) | `src/engine/clima.ts`; cada cena dosa no seu `misturar()` |
| Pratos voando e a gritaria (tempos, alvo, dano) | `src/game/scenes/demo/mesa.ts` (`ARREMESSOS_EM`, `AVISO_PRATO`, `CORRIDA`) |
| A escolha do Tear (duração, fios queimando) | `src/game/scenes/demo/tear.ts` (`ESCOLHA_DUR`) |
| **Cômodos da casa, portas e vestígios** | `src/game/world/casa.ts` |
| Quanto o corredor estica | `src/game/world/casa.ts` (`CORREDOR_BASE`, `CORREDOR_MAX`) |
| Sala (piano, retratos, sofá, estante) | `src/game/world/sala.ts` |
| Texturas comuns (papel de parede, lambri, assoalho, portas, quadros) | `src/game/world/arte.ts` |
| Lista dos segredos | `src/game/content/segredos.ts` |
| **Diários, cartas, jornal, caderno** (o texto das páginas) | `src/game/content/documentos.ts` |
| A diagramação do jornal (cabeçalho, colunas, fotos em retícula, classificados, tirinha) | `src/game/systems/jornal.ts` |
| A cabana por dentro (depois do grito) | `src/game/world/cabanaDentro.ts`; a entrada pela luz em `scenes/demo/casa.ts` (`entrarNaCabana`) |
| O armário e a floresta pela fresta | `src/game/world/armarioFloresta.ts`; o som em `src/engine/audio.ts` (`floresta`) |
| A sombra do pai (Tear e prólogo) | `src/game/ui/sombraPai.ts`; a voz engrossando em `src/engine/voz.ts` (`grave`) |
| A foto que a Lia joga (a marca vermelha, antes dos pratos) | `src/game/scenes/demo/casa.ts` (`cutRetratoLia`, `RETRATO_*`) |
| Os pratos da cozinha (quem fala, quando o braço sobe) | `src/game/scenes/demo/mesa.ts` (`PROVOCACOES`) |
| Leitor de páginas (papel, letras de cada pessoa) | `src/game/systems/leitor.ts` |
| O fecho (partículas, acorde final, contagem de segredos) | `src/game/scenes/demo/fim.ts` |
| Créditos, colapso e pós-créditos | `src/game/scenes/demo/fim.ts` (`COLAPSO`, `ECOS`) |
| O quarto da Lia (falas) | `src/game/content/quartoLia.ts` |
| O quarto da Lia (arte, espelho, nós da casa depois) | `src/game/world/casa.ts` (`comodoLia`, `ESPELHO`, `NOS`) |
| Os rabiscos, polaroides e a TV do quarto da Lia | `src/game/world/casa.ts` (`rabiscosLia`, `polaroides`, `tvChiando`) |
| A música do fone da Lia | `src/engine/audio.ts` (`musicaDaLia`); arquivo próprio em `src/engine/trilhaPropria.ts` |
| O violoncelo, a partitura e o quinto retrato | `src/game/content/violoncelo.ts` (`PARTITURA`); a cena em `src/game/scenes/demo/casa.ts` (`aoCello`) |
| A mensagem escondida (acróstico, cruzadas, marca do diário) | `src/game/content/documentos.ts`; o Morse em `src/engine/audio.ts` (`morse`); o poste em `src/game/world/sala.ts` (`posteAceso`) |
| Os sustos (silêncio, rosto, estouro) | `src/game/scenes/demo/casa.ts` (`iniciarSusto`), `src/engine/audio.ts` (`susto`) |
| A respiração (ritmo, tolerância, desenho) | `src/game/ui/respiracao.ts`; a crise da casa em `content/crise.ts`, a da cozinha em `content/noite.ts` |
| **A segunda partida**, o vulto, o cheiro, "Ninguém veio", a pressa | `src/game/content/deNovo.ts`; o que o jogo lembra em `src/game/systems/memoria.ts` |
| Quem passa as falas sem ler | `src/game/systems/dialogue.ts` (`leitorApressado`) |
| A rua pela janela da sala (poste, cone de luz, vulto) | `src/game/world/sala.ts` (`drawRua`, `luzDaRua`) |
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
| Menu (Continuar, Só mais um, Sair) e os segredos do menu | `src/game/scenes/title.ts` (`segredosDoMenu`), `src/game/ui/lista.ts` |
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

O mundo é desenhado em 384x216 e escalado para preencher a janela inteira
(o lado que limitar; o pixel fracionário quase não aparece a partir de 3x);
o texto é desenhado por cima em resolução de tela, para continuar legível.
A escala da casa é a de uma porta de 2,10 m (100 px): móveis abaixo do alto
das portas, marcas de altura na altura das crianças. Móveis e Liam são ordenados por profundidade, então
ele passa atrás da escrivaninha e na frente da cama.

**Referências visuais:** navegação e câmera do OMORI; paleta, queda de luz e
silhuetas do Hollow Knight. Uma única fonte quente no quarto (a luminária);
a janela é fria e **não anima**, porque a manhã lá fora está congelada.

## Depuração

`?debug=1` na URL expõe `window.__nos` com o estado e a cena atual.

`?cena=<id>` começa direto numa cena, sem rejogar tudo — útil para conferir um
trecho durante a produção. Os ids são os pontos de salvamento (`abertura`,
`prologo`, `casa`, `mesa`, `tear`, `grito`, `depois`, `fim`), mais `hospital`
(= `abertura`) e `quarto` (a fatia antiga). Entrar assim também grava o jogo,
e o primeiro clique ou tecla liga o som (que normalmente nasce no menu).
`?segredos=melodia,floresta` começa com esses segredos achados (para
conferir o fecho). Nenhum deles tem efeito no jogo normal.

## Limites conhecidos

- Na fatia antiga só o quarto de Liam existe; a porta leva ao cartão de capítulo.
- As vozes não dizem as palavras: são sílabas sintetizadas no timbre de
  cada personagem.
- A música é toda sintetizada no navegador (piano por harmônicos, drone,
  reverberação gerada); não há áudio gravado.
- Um lugar de salvo só (sem vários perfis), sem menu de opções, sem suporte a
  controle.
- As fontes (Bodoni Moda, Spectral e Cormorant Garamond) vão embutidas no
  arquivo; o jogo funciona sem rede.
