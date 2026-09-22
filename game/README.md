# NÓS — jogo

Fatia vertical da abertura, em TypeScript + Canvas. Sem engine e sem nenhum
arquivo de arte ou áudio: tudo é desenhado e sintetizado em código.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # checagem de tipos + build de produção em dist/
npm run preview    # serve o build em :4173
npm test           # joga a fatia inteira num navegador real e confere o resultado
```

O teste precisa do preview rodando. `OUT=<pasta> npm test` salva capturas de
cada momento.

## O que já está jogável

Tela preta e a VOZ → título → Liam acorda no quarto → encontra o diário →
arruma o quarto → a porta abre → cartão do Capítulo 1.

**A porta nunca esteve trancada.** Tentá-la antes da hora não dá "está
trancada": dá a recusa do próprio Liam, que escala em três passos até
`Não é que eu não possa sair. / É que eu não consigo imaginar sair assim.`
Essa é a tese da obra virada mecânica, e é o motivo desta fatia existir.

Os cinco objetos que ele guarda no bolso — botão, passagem vencida, pedra
pintada, chave sem porta, papel dobrado — contam como tarefa mas não são
descartados: Liam não consegue jogar fora. A pedra pintada e o papel dobrado
já plantam Elisa sem nomeá-la.

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

`?debug=1` na URL expõe `window.__nos` com o estado e a cena atual. Não tem
efeito nenhum no jogo normal.

## Limites conhecidos

- Só o quarto de Liam existe. A porta leva ao cartão de capítulo, não à casa.
- Sem trilha sonora: o ambiente é um drone sintetizado, base até existir áudio
  de verdade.
- Sem salvamento, sem menu de opções, sem suporte a controle ou toque.
- As fontes vêm do Google Fonts; sem rede, caem para as do sistema.
