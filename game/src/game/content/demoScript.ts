/**
 * Texto da demo "Só mais um".
 *
 * A demo comprime o arco da obra em dois momentos: Adrian ensinando música
 * (o afeto é verdadeiro — e é no mesmo fôlego que a função é instalada) e a
 * câmara do Tear (o mesmo afeto virando instrumento).
 */
import type { Line } from '../world/types'
import type { Documento } from '../systems/leitor'
import { DOC_BILHETE_CATARINA } from './documentos'

// --- Prólogo: A Música ------------------------------------------------------

export const PROLOGO_ABERTURA: Line[] = [
  { text: 'A sala é o único lugar quente da casa. Principalmente quando ele está de bom humor.' },
  { speaker: 'Adrian', text: 'Pega o violino. Fica aí, do lado do piano. Assim.', style: 'speech' },
  { speaker: 'Adrian', text: 'Meu avô tocava isso pra minha mãe dormir. Ninguém nunca me ensinou direito — eu aprendi escutando atrás da porta.', style: 'speech' },
  { speaker: 'Adrian', text: 'Eu toco no piano. Você responde no violino. Escuta primeiro. Depois você faz.', style: 'speech' },
]

/** Uma linha por frase do tema, dita antes de Adrian tocá-la. */
export const PROLOGO_FRASES: Line[][] = [
  [{ speaker: 'Adrian', text: 'Essa é a primeira parte. Ela pula lá pra cima e suspira, como quem vai perguntar alguma coisa e desiste.', style: 'speech' }],
  [{ speaker: 'Adrian', text: 'Agora ela cresce até o alto. Presta atenção no fim: ela desce torta e não fecha.', style: 'speech' }],
  [{ speaker: 'Adrian', text: 'E essa desce tudo, até onde começou. É aqui que ela descansa.', style: 'speech' }],
]

export const PROLOGO_ACERTOU_FRASE: Line[][] = [
  [
    { speaker: 'Adrian', text: 'Isso. Sem pressa.', style: 'speech' },
    { text: 'O piano dele embaixo do meu violino. Juntos, a sala inteira treme.' },
  ],
  [
    { speaker: 'Adrian', text: 'Você pega rápido. Mais rápido que eu, na sua idade.', style: 'speech' },
  ],
  [{ speaker: 'Adrian', text: 'Inteira. Na primeira noite.', style: 'speech' }],
]

/** A bronca da primeira vez: ele não grita. Bate no piano e fala baixo. */
export const PROLOGO_ERRO: Line[][] = [
  [
    { speaker: 'Adrian', text: 'Não. Para.', style: 'speech' },
    { speaker: 'Adrian', text: 'Você não tá escutando. Do começo.', style: 'speech' },
  ],
  [
    { speaker: 'Adrian', text: 'Liam. Olha pra mim.', style: 'speech' },
    { speaker: 'Adrian', text: 'Eu toco, você escuta, depois você toca. Não é difícil.', style: 'speech' },
  ],
  [
    { speaker: 'Adrian', text: 'De novo.', style: 'speech' },
    { text: 'A voz dele não sobe. Ainda. A mão dele fica parada em cima das teclas, esperando.' },
  ],
]

/**
 * Depois de zerar, a bronca vira grito — e ele sabe que você já esteve
 * aqui. Liam precisa segurar a respiração no lugar enquanto o arco treme.
 */
export const PROLOGO_GRITO: Line[][] = [
  [
    { speaker: 'Adrian', text: 'ERROU?! DE NOVO?!', style: 'speech', grito: true },
    { speaker: 'Adrian', text: 'Agora vê se não erra. Você já passou por aqui. Já sabe como as coisas funcionam.', style: 'speech' },
  ],
  [
    { speaker: 'Adrian', text: 'DE NOVO, LIAM?!', style: 'speech', grito: true },
    { speaker: 'Adrian', text: 'Respira e toca. Do jeito que eu ensinei.', style: 'speech' },
  ],
]

/** O arco treme na corda enquanto ele tenta respirar. */
export const PROLOGO_RESPIRA: Line[] = [
  { text: 'O arco treme em cima da corda. Se eu tirar, ele percebe.' },
]
export const PROLOGO_RESPIROU: Line[] = [
  { text: 'O arco para de tremer. Quase.' },
]
export const PROLOGO_NAO_RESPIROU: Line[] = [
  { text: 'O arco não para. Ele ouve. Ele sempre ouve.' },
]

/** O elogio e a função instalada na mesma frase. */
export const PROLOGO_ACERTO: Line[] = [
  { speaker: 'Adrian', text: 'Pronto. Agora é sua.', style: 'speech' },
  { speaker: 'Adrian', text: 'Sabe o que eu gosto em você? Você escuta. Ninguém mais nessa casa escuta.', style: 'speech' },
  { speaker: 'Adrian', text: 'Sua mãe não tem paciência pra isso. A Lia não tem. Você tem.', style: 'speech' },
  { speaker: 'Adrian', text: 'Por isso eu conto com você.', style: 'speech' },
]

export const PROLOGO_LIVRE = 'toque à vontade no violino'

export const PROLOGO_FECHO: Line[] = [
  { text: 'Eu gostava quando ele falava assim.' },
  { text: 'Como se eu fosse a única pessoa da casa que entendia.' },
  { text: 'Eu ainda gosto.' },
]

/** Se o jogador toca o tema de trás para a frente no prólogo. */
export const PROLOGO_SUBINDO: Line[] = [
  { speaker: 'Adrian', text: '...Onde você aprendeu isso?', style: 'speech' },
  { text: 'Não sei. Estava na minha mão.' },
  { speaker: 'Adrian', text: 'Não é assim. Ela desce. Toca do jeito certo.', style: 'speech' },
]

// --- O Tear -----------------------------------------------------------------

export const TEAR_CHEGADA: Line[] = [
  { text: 'Embaixo da cozinha tem um tear.' },
  { text: 'Seis carretéis. Em cada um, amarrada, uma coisa de alguém.' },
  { text: 'Um fio da urdidura está cortado. Alguém cortou.' },
  { text: 'A discussão atravessa as tábuas.' },
  { text: 'Se eu tecer os fios, eles param.' },
  { text: 'Sempre para.' },
]

/**
 * O piano reaparece aqui. É a virada da demo: a mesma interface que era
 * carinho vira ferramenta. Adrian não precisa explicar nada — só lembrar.
 */
export const TEAR_PIANO: Line[] = [
  { speaker: 'Adrian', text: 'Você lembra da música?', style: 'speech' },
  { speaker: 'Adrian', text: 'É só tocar. Igual eu te ensinei.', style: 'speech' },
]

export const TEAR_ERRO: string[] = [
  'De novo, do começo.',
  'Calma. Você sabe essa.',
  'Escuta o fio. Ele te dá a nota.',
]

/** Adrian entre uma absorção e outra. Nunca grita: é essa a questão. */
export const ADRIAN_DURANTE: string[] = [
  'Isso. Você consegue.',
  'Mais um, filho.',
  'Tá ouvindo? Já está mais calmo lá em cima.',
  'Ninguém mais nessa casa faz isso.',
  'Só mais um. Junta todos.',
  'Pronto. Escuta. Silêncio lá em cima.',
]

/** Quando o jogador para de absorver, a pressão sobe em vez de aliviar. */
export const ADRIAN_INSISTE: string[] = [
  'Liam.',
  'Não para agora.',
  'Você quer que ela vá embora?',
  'Olha pra mim. Só mais um.',
  'Sua bisavó fazia isso. Segurava todo mundo. Era um dom.',
  'Escuta lá em cima. Tá vendo? Por sua causa.',
]

export const CORPO: string[] = [
  'não é meu',
  'isso não é meu',
  'de quem é isso',
  'eu não estava lá',
]

/** Antes do piano: o caderno aberto no chão, perto das velas. */
export const TEAR_CADERNO: Line[] = [
  { text: 'Perto das velas tem uma pilha de cadernos. Um está aberto.' },
  { text: 'A letra é antiga, inclinada. Na capa, a lápis: Amélia.' },
]

export const TEAR_FIM: Line[] = [
  { speaker: 'Liam', text: 'Pai...', style: 'speech' },
  { speaker: 'Liam', text: 'Eu não quero.', style: 'speech' },
  { speaker: 'Adrian', text: 'Você consegue fazer o que ninguém mais consegue.', style: 'speech' },
  { speaker: 'Adrian', text: 'Eu sei. Depois passa.', style: 'speech' },
]

export const ELISA_CORTE: Line[] = [
  { speaker: 'Elisa', text: 'Liam.', style: 'speech' },
]

/** Quem joga de madrugada: a mãe ouve que ele ainda está acordado. */
export const CASA_MADRUGADA: Line[] = [
  { speaker: 'Evelyn', text: 'Liam? Já passou da meia-noite, filho. Vai dormir.', style: 'speech', onde: 'da cozinha' },
  { text: 'O relógio do corredor diz a mesma coisa que ela.' },
]

// --- A Mesa -----------------------------------------------------------------

export const MESA_ABERTURA: Line[] = [
  { text: 'As malas estão no chão da cozinha.' },
  { text: 'Ninguém serviu o jantar. O rádio continua tocando uma música alegre, sozinho.' },
  { text: 'A Lia está de mochila nas costas. A mãe, de uniforme, como se fosse trabalhar.' },
  { text: 'Se eu ficar no meio, eles param.' },
  { text: 'Sempre para.' },
]

/** As falas da noite: primeiro os dois, depois Lia, depois a função de Liam. */
export const MESA_CONFRONTO: Line[] = [
  { speaker: 'Adrian', text: 'Ninguém vai sair antes de a gente conversar.', style: 'speech' },
  { speaker: 'Evelyn', text: 'Eu não tô pedindo, Adrian. Eu tô avisando.', style: 'speech' },
  { speaker: 'Adrian', text: 'Você vai pegar os meus filhos e sair no meio da noite? Assim?', style: 'speech' },
  { speaker: 'Evelyn', text: 'Vou. Eu vou tirar eles daqui. Faz anos que eu devia ter feito isso.', style: 'speech' },
  { speaker: 'Lia', text: 'Ah, agora você quer conversar? Então conversa, pai. Conta pra ele por que a porta da frente tá trancada. Conta! Ou tá com vergonha?', style: 'speech' },
  { speaker: 'Adrian', text: 'Liam. Explica pra sua irmã por que a gente precisa ficar junto.', style: 'speech' },
  { text: 'Ele olha pra mim como se eu soubesse a resposta.' },
  { text: 'Eu sempre sei a resposta.' },
]

/** Quando Liam se aproxima da mãe, o pai puxa. E vice-versa. */
export const PUXAO_ADRIAN: string[] = [
  'Liam. Vem cá.',
  'Fala pra ela, filho.',
  'Você sabe que eu tenho razão.',
  'Eu conto com você.',
]

export const PUXAO_EVELYN: string[] = [
  'Liam, olha pra mim. Pra mim.',
  'Não é você que tem que resolver isso, filho.',
  'Sai do meio, por favor. Vem pra cá.',
  'Pega a mochila da sua irmã. A gente vai.',
]

export const PUXAO_LIA: string[] = [
  'Para de olhar pra ele, idiota!',
  'Liam, anda logo, caramba!',
  'Você vai ficar aí parado de novo?',
]

/** O que ele pensa enquanto tenta ficar no meio. Vai desmoronando. */
export const MESA_PENSAMENTO: Line[][] = [
  [{ text: 'Eu consigo.' }],
  [{ text: 'É só achar o lado certo.' }],
  [{ text: 'Não tem lado certo.' }],
]

export const MESA_FUGA: Line[] = [
  { text: 'Eu não consigo.' },
  { text: 'Mas lá embaixo eu consigo.' },
]

/**
 * O que Liam pode encontrar na cozinha enquanto os pais discutem. Nada disso
 * muda o que vai acontecer — muda o que ele sabe quando acontecer. É a única
 * agência real da cena, e é de propósito que ela não salva ninguém.
 */
export interface Vestigio {
  id: string
  x: number
  rotulo: string
  linhas: Line[]
  /** Papel para ler de verdade, aberto depois de `linhas`. */
  documento?: Documento
  depois?: Line[]
  /** O que Liam fica sabendo (linha nova no caderno). */
  aprende?: string
  segredo?: string
}

export const MESA_VESTIGIOS: Vestigio[] = [
  {
    id: 'malas', x: 116, rotulo: 'Olhar',
    linhas: [
      { text: 'Documentos, remédios, dinheiro contado.' },
      { text: 'Tem uma pulseira de hospital no meio. Com outro sobrenome.' },
      { text: 'Não é o meu. Nem o da minha mãe.' },
    ],
  },
  {
    id: 'bilhete', x: 158, rotulo: 'Ler',
    linhas: [
      { text: 'O casaco da minha mãe, na cadeira. Tem um papel saindo do bolso.' },
      { text: 'É a letra da tia Catarina. Faz anos que elas não se falam.' },
    ],
    documento: DOC_BILHETE_CATARINA,
    aprende: 'bilhete-catarina',
    depois: [
      { text: 'Ela ia mesmo. Hoje.' },
      { text: '"Ela perguntou de você." Ela quem?' },
      { text: 'E que chave?' },
    ],
  },
  {
    id: 'fogao', x: 200, rotulo: 'Tirar o pano',
    linhas: [
      { text: 'Tem um pano apoiado na tampa da panela.' },
      { text: 'Eu tiro. Minha mãe sempre fala pra não deixar ali.' },
      { text: 'Ninguém olha.' },
    ],
  },
  {
    id: 'telefone', x: 262, rotulo: 'Pegar',
    linhas: [
      { text: 'O telefone está fora do gancho.' },
      { text: 'Fui eu que liguei pra ele.' },
      { text: 'Eu achei que estava pedindo ajuda.' },
    ],
  },
  {
    id: 'radio', x: 292, rotulo: 'Abaixar o rádio',
    linhas: [],
    aprende: 'radio-cozinha',
    segredo: 'radio',
  },
]

/** Os cinco pratos. Não é vestígio, não muda nada — só está ali. */
export const MESA_PRATOS: Line[] = [
  { text: 'Tem cinco pratos na mesa.' },
  { text: 'Minha mãe pôs cinco. Eu vi ela contar.' },
  { text: 'Somos quatro.' },
  { text: 'Ela olhou pro quinto como quem esquece uma palavra no meio da frase.' },
]

/** O fecho muda conforme quanto ele viu. Nunca muda o que acontece. */
export const MESA_FECHO: Record<number, Line[]> = {
  0: [{ text: 'Eu não consigo.' }, { text: 'Mas lá embaixo eu consigo.' }],
  2: [
    { text: 'Tem coisa demais nessa cozinha que eu não sabia.' },
    { text: 'E nada disso me diz o que fazer.' },
    { text: 'Lá embaixo eu sei.' },
  ],
  4: [
    { text: 'Eu vi tudo.' },
    { text: 'A pulseira, o bilhete, o telefone fora do gancho.' },
    { text: 'E continua não sendo escolha minha.' },
    { text: 'Só tem um lugar onde eu resolvo alguma coisa.' },
  ],
}

// --- A Casa -----------------------------------------------------------------

export const CASA_ABERTURA: Line[] = [
  { speaker: 'Adrian', text: 'Vai guardar suas coisas. Já está tarde.', style: 'speech' },
  { text: 'A casa parece maior de noite.' },
  { text: 'Ou eu que ando mais devagar.' },
  { text: 'Da cozinha vem o barulho da panela e o rádio baixinho. Ninguém está falando.' },
  { text: 'Isso é pior do que quando falam.' },
]

/** Dito quando Liam chega ao fim do corredor e ele ainda não acabou. */
export const CASA_CORREDOR: Line[][] = [
  [{ text: 'Esse corredor é mais comprido do que eu lembro.' }],
  [
    { text: 'Eu já devia ter chegado na porta.' },
    { text: 'Toda vez que eu olho, ela está mais longe.' },
  ],
  [
    { text: 'A casa não é grande assim.' },
    { text: 'A casa não pode ser grande assim.' },
    { speaker: 'Voz', text: 'Lembra? Aqui era a floresta.', style: 'speech' },
  ],
]

/** A porta do fim, a cada vez que Liam insiste. Na terceira, alguém responde. */
export const CASA_PORTA_FIM: Line[][] = [
  [
    { text: 'A maçaneta gira. A porta não abre.' },
    { text: 'Nunca abriu.' },
    { text: 'Eu desenhei um quarto aqui. Eu lembro de desenhar.' },
  ],
  [{ text: 'Eu bato.' }, { text: 'Nada.' }],
  [
    { text: 'Eu bato de novo. Três vezes curtas.' },
    { text: 'Do jeito que alguém me ensinou.' },
  ],
  [{ text: 'A porta não abre.' }, { text: 'Mas agora eu sei que tem alguém ali.' }],
]

/** O tema de trás para a frente, no piano da sala. */
export const CASA_MELODIA: Line[] = [
  { speaker: 'Voz', text: 'Isso! Assim mesmo. Você lembrou.', style: 'speech' },
  { speaker: 'Voz', text: 'Ele sempre tocava ela descendo, né? Eu tocava ao contrário pra você, subindo, quando você não conseguia dormir.', style: 'speech' },
  { text: 'Assim a música não termina no chão.' },
]

/** A frase do jeito que Adrian ensinou. */
export const CASA_MELODIA_DELE: Line[] = [
  { text: 'Do jeito que ele ensinou.' },
  { text: 'Termina lá embaixo. Sempre termina lá embaixo.' },
]

/** Objetivo mostrado no canto, que muda conforme ele explora. */
export const CASA_OBJETIVO_INICIAL = 'guardar as coisas'
export const CASA_OBJETIVO_COZINHA = 'ir até a cozinha'

export const CASA_ANTES_DA_COZINHA: Line[] = [
  { text: 'Tem voz na cozinha.' },
  { text: 'Os dois ao mesmo tempo, baixinho, do jeito que eles acham que a gente não escuta.' },
  { text: 'Se eu entrar agora, eles param. Sempre param.' },
  { text: 'Ainda dá tempo de olhar o resto da casa.' },
]

/** Quando ele já viu o bastante e decide descer. */
export const CASA_PRONTO: Line[] = [
  { text: 'Não tem quarto nenhum no fim daquele corredor.' },
  { text: 'Então por que eu desenhei um?' },
]

// --- Abertura: o rádio e a voz no escuro --------------------------------------

/**
 * O que o jogador precisa saber antes de qualquer outra coisa: houve um
 * incêndio numa casa, alguém morreu e o pai saiu ileso. O boletim não diz
 * quem morreu, nem quem foi levado, nem para onde — é com essas perguntas
 * que se joga o resto.
 *
 * O que NÃO pode estar aqui: que Liam está em coma. Isso o jogo só diz no
 * fim. Até lá é pista, para quem for juntando.
 */
export const RADIO_ESTACAO = 'RÁDIO VALE FM  ·  7h00'
export const RADIO_BOLETIM: string[] = [
  'Bom dia. São sete horas desta quinta-feira.',
  'Na noite de terça, um incêndio atingiu uma casa no bairro Jardim das Acácias.',
  'O fogo começou na cozinha, por volta das dez e quarenta.',
  'Os bombeiros chegaram em vinte minutos.',
  'Duas pessoas foram socorridas e levadas ao Hospital Regional.',
  'Uma pessoa morreu no local.',
  'O pai, que saiu para buscar ajuda, não se feriu.',
  'A família não quis dar entrevista.',
]
/** A linha do boletim que fica mais clara que as outras. */
export const RADIO_DESTAQUE = 5

/**
 * A Lia, no escuro, depois do rádio. Ela não diz onde está nem por que ele
 * não responde: quem ouve pela primeira vez acha que ela fala com ele
 * através de uma porta. Ela xinga, porque é assim que ela gosta das
 * pessoas — e só no fim pede.
 */
export const ABERTURA_LIA: Line[] = [
  { speaker: 'Lia', text: 'Liam.', style: 'speech' },
  { speaker: 'Lia', text: 'Ei. Eu sei que você tá me ouvindo. Você sempre ouve tudo, então nem adianta fingir.', style: 'speech' },
  { speaker: 'Lia', text: 'Você é muito idiota, sabia? Se meter no meio deles de novo. Ninguém te pediu isso, Liam. Ninguém!', style: 'speech' },
  { speaker: 'Lia', text: 'E agora eu tenho que ficar aqui falando sozinha, que nem uma doida.', style: 'speech' },
  { speaker: 'Lia', text: 'Eu trouxe o seu caderno. Aquele que você esconde embaixo do colchão. Eu li, tá? Inteirinho. Pode ficar bravo.', style: 'speech' },
  { speaker: 'Lia', text: '...Fica bravo, então. Briga comigo. Faz qualquer coisa.', style: 'speech' },
  { speaker: 'Lia', text: 'Volta logo, seu idiota.', style: 'speech' },
  { speaker: 'Lia', text: '...Por favor.', style: 'speech' },
]

/**
 * Depois do grito: cinco segundos de nada, um bipe disparado, e isto. Ainda
 * não diz onde. Diz o bastante para quem já vinha desconfiando.
 */
export const HOSPITAL_GRITO: Line[] = [
  { speaker: 'Lia', text: 'Liam?', style: 'speech' },
  { speaker: 'Lia', text: 'Liam! Você apertou a minha mão. Apertou, eu senti!', style: 'speech' },
  { speaker: 'Lia', text: 'Alguém vem aqui! Por favor! Ele mexeu!', style: 'speech' },
]

// --- A casa: a chave, a mãe, o reflexo ---------------------------------------

/** A chave na porta. O corpo de Liam arruma antes de ele pensar. */
export const CASA_CHAVE: Line[] = [
  { text: 'A chave na porta da frente.' },
  { text: 'O pai chegou.' },
]
export const CASA_CHAVE_DEPOIS: Line[] = [
  { speaker: 'Adrian', text: 'Cheguei.', style: 'speech', onde: 'da porta' },
  { text: 'Eu arrumei o retrato antes de pensar.' },
  { text: 'Ninguém mandou. Ninguém nunca precisa mandar.' },
]

/** Pelo vão da cozinha, baixo. É a frase que vai sair da boca de Liam. */
export const CASA_PAREDE: Line[] = [
  { speaker: 'Adrian', text: 'Você tá cansada, Eve. Quando você tá cansada, você vê coisa onde não tem.', style: 'speech', onde: 'da cozinha' },
  { text: 'Ele fala baixo. Ele sempre fala baixo.' },
  { text: 'É por isso que ninguém de fora escuta.' },
]

export const EVELYN_PERGUNTA: Line[] = [
  { speaker: 'Evelyn', text: 'Liam. Vem cá um minuto. Fala baixo.', style: 'speech' },
  { speaker: 'Evelyn', text: 'Se eu te pedisse pra arrumar uma mochila hoje... só o que coubesse...', style: 'speech' },
  { speaker: 'Evelyn', text: 'Você arrumava?', style: 'speech' },
]

export const EVELYN_OPCOES = ['Arrumo.', 'Pra onde a gente vai?', 'Mãe, eu tô com medo.']

/** O que sai antes de ele conseguir escolher: a frase do pai, na boca dele. */
export const LIAM_ECO: Line[] = [
  { speaker: 'Liam', text: 'Você tá cansada, mãe. Quando você tá cansada, você vê coisa onde não tem.', style: 'speech', fio: 'Adrian' },
]

export const EVELYN_DEPOIS_ECO: Line[] = [
  { speaker: 'Evelyn', text: '...', style: 'speech' },
  { speaker: 'Evelyn', text: 'Você falou igualzinho a ele, sabia? Até o jeito.', style: 'speech' },
  { speaker: 'Evelyn', text: 'Tudo bem, filho. Esquece o que eu perguntei. Vai guardar suas coisas.', style: 'speech' },
]

/** Só para quem já jogou: às vezes as palavras dele chegam primeiro. */
export const EVELYN_RESPOSTAS: Line[][] = [
  [
    { speaker: 'Evelyn', text: 'Obrigada, filho. Só o que couber. E não comenta com o seu pai.', style: 'speech' },
  ],
  [
    { speaker: 'Evelyn', text: 'Pra casa da sua tia Catarina. Por uns dias. Até eu conseguir pensar.', style: 'speech' },
  ],
  [
    { speaker: 'Evelyn', text: 'Eu também, filho.', style: 'speech' },
    { speaker: 'Evelyn', text: 'Eu também.', style: 'speech' },
  ],
]

export const LIAM_DEPOIS_ECO: Line[] = [
  { text: 'Não era isso que eu ia dizer.' },
  { text: 'Eu nem sei de onde veio. Estava na minha boca antes de eu pensar.' },
]

/**
 * O primeiro reflexo da sombra, no vidro do retrato do corredor. Ela fala
 * pouco aqui — mas nunca pouco a ponto de não se entender.
 */
export const SOMBRA_REFLEXO: Line[] = [
  { text: 'No vidro do retrato, o meu reflexo está branco.' },
  { sombra: true, text: 'Não procura de onde veio. Veio dele. Você escuta tanto o seu pai que a voz dele chega na sua boca antes da sua.', style: 'speech' },
  { sombra: true, text: 'Ela te fez uma pergunta de verdade: se você ia com ela. E você respondeu por ele, porque ser o eco dá menos medo do que ser a resposta.', style: 'speech' },
  { sombra: true, text: 'Ficar quieto também escolhe, Liam. Só que escolhe sempre a favor de quem manda sem precisar gritar.', style: 'speech' },
  { text: 'Eu olho de novo. É só o retrato.' },
]

// --- A cozinha: o rádio que sabe antes ---------------------------------------

export const MESA_RADIO: Line[] = [
  { text: 'O rádio em cima da geladeira toca uma música alegre, alta demais pra esta cozinha.' },
  { text: 'Eu giro o botão pra abaixar. A música para. Entra uma voz.' },
  { text: '"...o fogo começou na cozinha, por volta das dez e quarenta. Uma pessoa morreu no..."', style: 'read' },
  { text: 'Eu olho o relógio da parede. São dez e quinze.' },
  { text: 'Eu desligo o rádio.' },
  { text: 'Ele continua tocando a música alegre.' },
]

// --- O Tear: o pico, o Dentro, o grito ---------------------------------------

/**
 * A montagem do Dentro: cada recorte tem um objeto torto, e arrumar faz o
 * próximo recorte chegar. A sombra fala entre um e outro — inteira, sem
 * meias palavras, e nada do que ela diz é mentira.
 */
export const DENTRO_SOMBRA: string[] = [
  'Quantos pratos tem nessa mesa? Conta. Cinco. Vocês são quatro, e todo dia alguém põe cinco, e todo dia ninguém pergunta por quê. Você também não pergunta. Você arruma o garfo.',
  'Ele te ensinou essa música no mesmo mês em que te ensinou a descer pro porão. O carinho e o serviço vieram juntos, na mesma mão. Por isso é tão difícil separar um do outro.',
  'Regra número um: sapato alinhado na porta. Você escreveu isso com nove anos. Criança de nove anos não inventa regra pra sapato. Alguém te ensinou que o humor da casa inteira dependia disso.',
  'A sua mãe te ensinou que, se alguém tem que ficar triste, que seja ela. E ela fica, todo dia, em dois empregos. Ela nunca te pediu pra carregar nada. Mas também nunca te mandou parar. Ela via o peso. E deixava.',
  'Ele não escolheu você porque você é especial. Escolheu porque você não revida. A Lia revida. É por isso que ela está lá em cima gritando, e você está aqui embaixo, tecendo.',
  'Conta de novo. Quatro. Alguém cortou o próprio fio pra não deixar a conta pra você. E mesmo assim você continua pagando.',
  'Toda vez que você ouve a chave na porta, você pensa a mesma coisa. Eu ouço, porque eu moro aqui. Você pensa: tomara que não seja ele. E depois arruma o sapato, pra ninguém saber que você pensou.',
  'Três. Você vai continuar arrumando até sobrar um prato só?',
]

/** O número que Liam conta em cada recorte da mesa. */
export const DENTRO_CONTA = ['Cinco.', 'Quatro.', 'Três.']

/** Quando ele para de arrumar. */
export const DENTRO_PAROU: Line[] = [
  { sombra: true, text: 'Você parou.', style: 'speech' },
  { sombra: true, text: 'É a primeira vez que você para. Olha como é quieto aqui quando você não está segurando nada.', style: 'speech' },
]

/** A oferta. Aceitar a sombra é aceitar que a família não é dele para carregar. */
export const DENTRO_OFERTA: Line[] = [
  { sombra: true, text: 'Eu não sou a coisa ruim que ele diz que você tem por dentro. Eu sou a parte de você que não deve nada a ninguém — a parte que você enterrou no dia em que ele disse que você escutava melhor que todo mundo.', style: 'speech' },
  { sombra: true, text: 'Você acha que, se me deixar sair, vira um monstro. Não vira. Você só para de carregar o que não é seu.', style: 'speech' },
  { sombra: true, text: 'A raiva que você sente é dele. O cansaço é da sua mãe. O medo é da Lia. A sua bisavó escreveu com todas as letras: o tear não une ninguém, ele só escolhe quem vai carregar. Ele escolheu você.', style: 'speech' },
  { sombra: true, text: 'Eu não quero que você fique forte. Forte é o que ele quer, pra você aguentar mais um. Eu quero que você solte.', style: 'speech' },
  { sombra: true, text: 'Não precisa ser bonito. Não precisa ser educado. Diz pra ele o que você nunca disse.', style: 'speech' },
]

/** De volta ao Tear, logo antes do grito. */
export const TEAR_VOLTA: Line[] = [
  { speaker: 'Adrian', text: 'Só mais um, filho. Junta todos.', style: 'speech' },
]

/** Quando o jogador solta cedo demais: Liam engole, e o pai repete. */
export const TEAR_ENGOLIU: string[] = [
  'Só mais um.',
  'Isso. Respira. Só mais um.',
  'Ninguém mais nessa casa faz isso, filho.',
]

export const TEAR_GRITO = 'EU NÃO QUERO.'

// --- Depois do grito: a casa sem música ---------------------------------------

export const DEPOIS_ABERTURA: Line[] = [
  { text: 'A casa voltou.' },
  { text: 'Sem música. Só a geladeira, o relógio e a chuva no telhado.' },
  { text: 'Tudo está fora do lugar, e nada brilha pedindo pra ser arrumado.' },
  { text: 'A minha sombra no chão ficou branca. Não voltou a ser preta.' },
]

/** Lia, quando Liam chega perto: ela dá um passo para trás. */
export const DEPOIS_LIA: Line[] = [
  { text: 'A Lia está no corredor. Quando eu chego perto, ela dá um passo pra trás.' },
  { text: 'Ela nunca deu um passo pra trás. Nem pra ele.' },
  { sombra: true, text: 'Foi bom, né? Pela primeira vez eles olharam pra você. Não pro que você faz por eles. Pra você.', style: 'speech' },
  { sombra: true, text: 'Ela está com medo. É a primeira vez que alguém nesta casa tem medo de você, e não por você. Medo passa. O que não passava era você sumindo um pouco toda noite pra casa ficar em paz.', style: 'speech' },
]

export const DEPOIS_SECRETARIA_ANTES: Line[] = [
  { text: 'A secretária eletrônica, no aparador. A luz âmbar piscando.' },
  { text: 'Uma mensagem. Terça-feira, dezessete e quarenta.' },
]

/** A voz da mãe. É o único som da casa que parece música. */
export const DEPOIS_RECADO: Line[] = [
  { speaker: 'Evelyn', text: 'Filho, é a mãe. Tô saindo do primeiro turno agora.', style: 'speech', onde: 'secretária eletrônica' },
  { speaker: 'Evelyn', text: 'Tem comida na geladeira, é só esquentar. Janta sem esperar ninguém, tá?', style: 'speech', onde: 'secretária eletrônica' },
  { speaker: 'Evelyn', text: 'E, Liam... o seu pai falou de novo aquela história de você ser o homem da casa, né? Esquece isso. Você tem catorze anos, filho. Não é trabalho seu.', style: 'speech', onde: 'secretária eletrônica' },
  { speaker: 'Evelyn', text: 'Eu volto mais tarde. Te amo.', style: 'speech', onde: 'secretária eletrônica' },
]

export const DEPOIS_RECADO_FIM: Line[] = [
  { text: 'Fim das mensagens.', style: 'read' },
  { text: 'Ela disse que voltava mais tarde.' },
  { text: 'Eu fico esperando a secretária dizer outra coisa.' },
  { text: 'Ela não diz.' },
]

// O rádio da cozinha fala com as linhas que estão lá embaixo no arquivo.
const vestigioRadio = MESA_VESTIGIOS.find((v) => v.id === 'radio')
if (vestigioRadio) vestigioRadio.linhas = MESA_RADIO
