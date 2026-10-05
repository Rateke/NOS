import type { Bloco, Documento, Pagina } from '../systems/leitor'
import type { GameState } from '../systems/state'

/**
 * O caderno "O que eu sei".
 *
 * É o caderno que a Lia levou para o hospital e deixou do lado da cama —
 * coisa que o jogador só entende no fim (a Lia diz "eu trouxe o seu
 * caderno", e não diz para onde). Na cabeça de Liam ele se escreve sozinho: cada coisa que ele vê vira uma
 * linha, na letra dele. Serve de resumo para quem se perdeu — e serve de
 * outra coisa depois do grito, quando a sombra passa a riscar o que é
 * mentira e a escrever a verdade por cima, em branco.
 *
 * A sombra nunca mente e nunca fala pouco: o que ela escreve se entende sem
 * precisar de mais nada.
 */
interface Linha {
  /** Só aparece quando Liam sabe disto (id de `sabe` ou de segredo). */
  se?: string
  texto: string
  /** A sombra risca a linha e escreve isto no lugar. */
  verdade?: string
  /** A sombra não risca: só acrescenta embaixo. */
  nota?: string
  /** Pergunta respondida: Liam mesmo risca, e escreve a resposta. */
  resposta?: { se: string; texto: string }
}

interface PaginaCaderno {
  titulo: string
  linhas: Linha[]
  /** Escrito pela sombra no pé da página, depois do grito. */
  sombraFim?: string
}

const PAGINAS: PaginaCaderno[] = [
  {
    titulo: 'Eu',
    linhas: [
      { texto: 'Liam. Catorze anos. 9º ano B.' },
      { texto: 'Regra da casa: quando eles brigam, eu fico no meio. Aí eles param.' },
      { se: 'radio', texto: 'O rádio falou de um incêndio numa casa do meu bairro. Uma pessoa morreu.' },
      { se: 'radio', texto: 'A Lia falou comigo no escuro. Me chamou de idiota. Disse que leu este caderno.' },
      {
        texto: 'Eu tô bem.',
        verdade: 'Você não dorme direito há meses. Acorda com a raiva dos outros e chama isso de cansaço.',
      },
      { se: 'evelyn-eco', texto: 'A mãe me perguntou uma coisa e eu respondi com a voz do pai.' },
      { se: 'prato-na-frente', texto: 'Na cozinha eu entrei na frente do prato.', verdade: 'Ninguém pediu. Você foi sozinho, porque aprendeu que é melhor ser ferido do que ferir os outros. Isso não protegeu ninguém. Só pôs você no caminho.' },
      {
        se: 'lia-caderno',
        texto: 'A Lia acha que eu arrumo alguma coisa quando minto.',
        verdade: 'Ela não acha. Ela sabe. E você arrumou a casa inteira.',
      },
    ],
    sombraFim: 'Você me chama de sombra porque eu apareço no chão. Eu sou a parte de você que não deve nada a ninguém.',
  },
  {
    titulo: 'Pai',
    linhas: [
      { texto: 'Adrian. Meu pai.' },
      { texto: 'Me ensinou piano. Diz que eu escuto melhor que todo mundo.' },
      {
        texto: 'Ele nunca levanta a voz.',
        verdade: 'Ele não precisa. Quando alguém levanta a voz nesta casa, é você que desce pro porão pra abaixar.',
      },
      { se: 'evelyn-eco', texto: '"Quando você tá cansada, você vê coisa onde não tem." Ele fala isso pra mãe.' },
      { se: 'carta-escola', texto: 'A escola chamou. Ele resolveu "por telefone".', nota: 'Ninguém foi. Ninguém vai. Ele não deixa ninguém de fora olhar pra dentro desta casa.' },
      { se: 'tear', texto: 'Ele desceu atrás de mim. Ele sabia do tear.', nota: 'Ele sempre soube. Foi ele que te ensinou a música que abre os fios.' },
    ],
  },
  {
    titulo: 'Mãe',
    linhas: [
      { texto: 'Evelyn. Minha mãe.' },
      { texto: 'Chega cansada. Dorme no sofá quando ele chega tarde.' },
      {
        texto: 'O pai diz que ela bebe.',
        verdade: 'A garrafa está cheia desde o Natal. Ela tem dois empregos.',
      },
      {
        se: 'evelyn-eco',
        texto: 'Ela perguntou se eu arrumava uma mochila. Só o que coubesse.',
        nota: 'Ela estava te chamando pra ir junto. Você respondeu com a voz dele.',
      },
      { se: 'recado-mae', texto: 'Recado dela na caixa de costura: "Quando você estiver pronto, vem pra cozinha. Senta do meu lado."', nota: 'Do lado dela ele grita menos. Ela sabia. Ela ia te contar a coisa boa depois do jantar.' },
      { se: 'bilhete-catarina', texto: 'Ela ia embora hoje. Às 23h. Com a gente.' },
      {
        se: 'secretaria',
        texto: 'Recado dela na secretária: "Eu volto mais tarde."',
        nota: 'O último recado dela foi pra você. Ela pediu pra você não ser o homem da casa.',
      },
    ],
  },
  {
    titulo: 'Lia',
    linhas: [
      { texto: 'Lia. Minha irmã. Mesma idade, mesma altura.' },
      {
        texto: 'Ela grita. Ela quebra as coisas. Ela não entende que é só ficar quieta.',
        verdade: 'Ela entende. Ela só não aceita ficar quieta. E você tem raiva dela porque ela faz o que você não tem coragem de fazer.',
      },
      { se: 'lia-caderno', texto: 'Ela tem um caderno de coisas que ela sabe e ninguém pergunta.', nota: 'Ninguém pergunta porque ela responderia.' },
      { se: 'caderno-rasgado', texto: 'O pai achou o caderno dela comigo. Rasgou a página.', nota: 'Você não disse que era dela. Também não disse que não era. Ficou quieto, e ela vai achar a página no chão.' },
      { se: 'escolha', texto: 'No porão, o pai me mandou escolher entre a mãe e a Lia.', nota: 'Não agir é uma escolha, é simplesmente deixar.' },
      { se: 'depois-lia', texto: 'Ela deu um passo pra trás quando eu cheguei perto.', nota: 'Ela está com medo de você. É a primeira vez. Medo passa. O que não passava era você sumindo um pouco toda noite.' },
    ],
  },
  {
    titulo: '?',
    linhas: [
      { texto: 'Eu sempre escrevo cinco linhas quando faço a lista da família.' },
      { se: 'pratos', texto: 'Cinco pratos na mesa. Somos quatro.' },
      { se: 'linha-lilas', texto: 'Na costura tem um carretel de linha lilás. Ninguém aqui usa lilás.' },
      { se: 'nome', texto: 'E. L. I. — lixaram um nome no batente da rouparia.' },
      { se: 'bater', texto: 'Alguém responde quando eu bato na porta do fim do corredor. Devagar, e depois rápido.' },
      { se: 'bilhete', texto: '"Você não precisa ser melhor. Você já é." — E.' },
      { se: 'caderno', texto: '"Eu li. Por isso cortei o meu." — E.' },
    ],
    sombraFim: 'Você sabe o nome. Você só não deixa ele subir até a boca, porque, se ele subir, você vai ter que lembrar por que ela foi embora.',
  },
  {
    titulo: 'Outros',
    linhas: [
      { se: 'bilhete-catarina', texto: 'Tia Catarina. Irmã da mãe. Faz anos que elas não se falam.' },
      { se: 'bilhete-catarina', texto: '23h. Carro prata. Esquina da padaria.' },
      { se: 'carta-escola', texto: 'Prof.ª Márcia. Perguntou se estava tudo bem em casa.', nota: 'Ela ficou até as seis esperando. Você não foi.' },
      {
        se: 'tear',
        texto: 'Amélia, minha bisavó. O pai diz que ela segurava todo mundo. Que era um dom.',
        verdade: 'Ela mesma escreveu "não é dom" — e riscou, pra ninguém ler.',
      },
      { se: 'caderno-amelia', texto: '"O tear não une ninguém. Ele só escolhe quem vai carregar."' },
    ],
  },
  {
    titulo: 'Perguntas',
    linhas: [
      { se: 'radio', texto: 'Quem morreu no incêndio?' },
      { se: 'radio', texto: 'A Lia me pediu pra voltar. Voltar de onde?' },
      { texto: 'Quem é a quinta pessoa?' },
      { se: 'mesa', texto: 'O que tem embaixo da cozinha?', resposta: { se: 'tear', texto: 'Um tear. E os fios de todo mundo, presos em mim.' } },
      { se: 'bilhete-catarina', texto: 'A mãe ia mesmo embora?' },
      { se: 'radio-cozinha', texto: 'Como o rádio da cozinha já sabia do incêndio?' },
    ],
    sombraFim: 'Quem morreu? Escuta a secretária de novo. Ela disse que voltava mais tarde.',
  },
]

function sabe(state: GameState, id?: string): boolean {
  return !id || state.sabe.has(id) || state.segredos.has(id)
}

/** O caderno como ele está agora, para o leitor abrir. */
export function montarCaderno(state: GameState): Documento {
  const paginas: Pagina[] = []
  const sombra = state.sombraEscreve
  for (const p of PAGINAS) {
    const blocos: Bloco[] = [{ texto: p.titulo, letra: 'liam', respiro: 0 }]
    let alguma = false
    for (const l of p.linhas) {
      if (!sabe(state, l.se)) continue
      alguma = true
      const respondida = l.resposta && sabe(state, l.resposta.se)
      if (sombra && l.verdade) {
        blocos.push({ texto: l.texto, letra: 'liam', riscado: true, riscoBranco: true, respiro: 0.3 })
        blocos.push({ texto: l.verdade, letra: 'sombra' })
      } else {
        blocos.push({ texto: l.texto, letra: 'liam', respiro: 0.3, ...(respondida ? { riscado: true } : {}) })
        if (respondida && l.resposta) blocos.push({ texto: l.resposta.texto, letra: 'liam' })
        if (sombra && l.nota) blocos.push({ texto: l.nota, letra: 'sombra' })
      }
    }
    if (!alguma) continue
    if (sombra && p.sombraFim) {
      // A pergunta sobre quem morreu só ganha resposta depois do recado.
      const pronta = p.titulo !== 'Perguntas' || state.sabe.has('secretaria')
      if (pronta) blocos.push({ texto: p.sombraFim, letra: 'sombra', respiro: 0.9 })
    }
    paginas.push({ blocos })
  }
  return { id: 'caderno', tipo: 'diario', titulo: 'O que eu sei', paginas }
}
