/**
 * A noite: a cozinha que explode, o Tear que aperta, a escolha, e as duas
 * conversas com a sombra.
 *
 * A estrutura segue, arco por arco, o episódio 12 de Tokyo Ghoul (o Kaneki
 * na cadeira do Yamori, a Rize dentro da cabeça dele), com algumas frases
 * citadas como estão, em homenagem — os créditos ficam no README. O que é
 * do NÓS é o destino: lá a saída é devorar; aqui é largar o que não é seu.
 *
 *   Arco 1  — a pressão que não deixa pensar (o Adrian no Tear)
 *   Arco 2  — a mãe idealizada (Dentro 1)
 *   Arco 3  — o fundo do poço, em voz (a gritaria na cozinha)
 *   Arco 4  — a verdade sobre a mãe e "a culpa é toda sua" (Dentro 1)
 *   Arco 5  — a lei do pai: a culpa, a filosofia, a situação que prova
 *   Arco 6  — a escolha: a mãe ou a Lia
 *   Arco 7  — "é tudo culpa sua" (Dentro 2)
 *   Arco 8  — os "e se" e as próximas (Dentro 2)
 *   Arco 9  — o desmonte da mãe (Dentro 2)
 *   Arco 10 — a decisão (Dentro 2)
 *   Arco 11 — a corda vira a dele (de volta ao Tear, e o grito)
 */
import type { Line } from '../world/types'

// --- A casa: os passos ---------------------------------------------------------

/** Escondeu a tempo. A voz dele, do outro lado da porta. */
export const CASA_PASSOS_ESCONDEU: Line[] = [
  { text: 'Eu enfio o caderno embaixo da mochila dela. As mãos sabem fazer isso rápido.' },
  { speaker: 'Adrian', text: 'Liam? Que barulho é esse?', style: 'speech', onde: 'da cozinha' },
  { speaker: 'Liam', text: 'Nada, pai. Tô guardando as coisas.', style: 'speech' },
  { speaker: 'Adrian', text: '...Então guarda.', style: 'speech', onde: 'da cozinha' },
  { text: 'Os passos voltam. Eu fico parado até não escutar mais nada.' },
]

/** Não deu tempo. Ele abre a porta e vê. */
export const CASA_PASSOS_PEGO: Line[] = [
  { speaker: 'Adrian', text: 'O que é isso na sua mão?', style: 'speech' },
  { speaker: 'Adrian', text: '“O pai só é gentil quando tem alguém olhando.”', style: 'speech' },
  { speaker: 'Adrian', text: 'É isso que a sua irmã escreve de mim? Dentro da minha casa?', style: 'speech', grito: true },
  { speaker: 'Adrian', text: 'E você leu. E não me contou.', style: 'speech' },
  { speaker: 'Adrian', text: 'Bonito, Liam. Muito bonito.', style: 'speech' },
  { text: 'Ele deixa a página rasgada no chão, do lado do resto do caderno.' },
]

// --- A cozinha: o estouro ------------------------------------------------------

/**
 * Liam abre a porta da cozinha e já está explodindo. Nada de entrar devagar:
 * a casa estava calma até agora, e é isso que faz doer.
 */
export const MESA_ESTOURO: Line[] = [
  { speaker: 'Adrian', text: 'VOCÊ NÃO VAI LEVAR OS MEUS FILHOS A LUGAR NENHUM, PORRA!', style: 'speech', grito: true },
  { speaker: 'Evelyn', text: 'Fala baixo, Adrian. Eles tão ouvindo.', style: 'speech' },
  { speaker: 'Adrian', text: 'QUE OUÇAM! Que ouçam que a mãe deles é uma ingrata do caralho, que foge no meio da noite!', style: 'speech', grito: true },
  { speaker: 'Lia', text: 'Para de gritar com ela, seu covarde!', style: 'speech', grito: true },
  { speaker: 'Adrian', text: 'Cala essa boca, Lia. Eu não tô falando com você.', style: 'speech' },
]

/** O que ele grita quando pega um prato. Uma por arremesso. */
export const ARREMESSO_ADRIAN: string[] = [
  'TÁ VENDO O QUE VOCÊ FAZ COMIGO?!',
  'É ISSO QUE VOCÊ QUER?! É ISSO?!',
  'QUEM PAGOU ESSA MERDA TODA FUI EU!',
]

/** O prato quebra perto delas. */
export const PRATO_NELAS: { quem: 'Evelyn' | 'Lia'; texto: string }[] = [
  { quem: 'Evelyn', texto: 'Para! Para, pelo amor de Deus!' },
  { quem: 'Lia', texto: 'Você é louco! Você é LOUCO!' },
  { quem: 'Evelyn', texto: 'Adrian, as crianças!' },
]

/** O prato quebra em Liam, que entrou na frente. */
export const PRATO_NO_LIAM: { quem: 'Adrian' | 'Evelyn' | 'Lia'; texto: string }[] = [
  { quem: 'Adrian', texto: 'SAI DA FRENTE, LIAM!' },
  { quem: 'Evelyn', texto: 'Filho! Filho, você se machucou?' },
  { quem: 'Adrian', texto: 'Olha o que você me fez fazer.' },
]

/** O primeiro prato que ele leva. Pensamento, rápido. */
export const PRATO_PENSAMENTO: Line[] = [
  { text: 'Fico no meio. Aí eles param.' },
]

/**
 * Arco 3 — o fundo do poço, em voz. O pai sobe, o filho sobe junto pedindo
 * para parar, e as vozes se empilham até não sobrar nada. Cada fala entra
 * no instante `t` (segundos), por cima das anteriores, sem esperar.
 */
export const GRITARIA: { quem: 'Adrian' | 'Liam'; texto: string; t: number }[] = [
  { quem: 'Adrian', texto: 'Liam. Fala pra ela.', t: 0 },
  { quem: 'Liam', texto: 'Pai, eu...', t: 1.3 },
  { quem: 'Adrian', texto: 'FALA PRA ELA QUE A GENTE FICA JUNTO!', t: 2.1 },
  { quem: 'Liam', texto: 'Para...', t: 3.0 },
  { quem: 'Adrian', texto: 'FALA, LIAM!', t: 3.6 },
  { quem: 'Liam', texto: 'Para, pai.', t: 4.1 },
  { quem: 'Adrian', texto: 'VAI FICAR AÍ PARADO QUE NEM UM INÚTIL?!', t: 4.5 },
  { quem: 'Liam', texto: 'PARA!', t: 5.0 },
  { quem: 'Adrian', texto: 'OLHA PRA MIM QUANDO EU FALO COM VOCÊ!', t: 5.35 },
  { quem: 'Liam', texto: 'PARA, PAI!', t: 5.65 },
  { quem: 'Adrian', texto: 'INÚTIL!', t: 5.9 },
  { quem: 'Liam', texto: 'PARA! PARA! PARA!', t: 6.1 },
  { quem: 'Adrian', texto: 'FALA!', t: 6.25 },
]
/** Quando a gritaria corta seco para o silêncio. */
export const GRITARIA_FIM = 6.7

// --- O Tear: a pressão (Arco 1) ------------------------------------------------

/** Antes de tocar: o que segura Liam é contar as notas. */
export const TEAR_CONTAR: Line[] = [
  { text: 'Eu me agarro às notas.' },
  { text: 'Enquanto eu conto as notas, eu não escuto lá em cima.' },
]

/**
 * O pai não deixa ele pensar. Cada vez que Liam para, ele chega mais perto e
 * fala mais alto. A última é a mesma da primeira, só que gritada.
 */
export const PRESSAO_ADRIAN: string[] = [
  'Liam.',
  'Toca.',
  'Não para agora.',
  'TOCA.',
  'Você quer que ela vá embora? QUER?',
  'Olha pra mim quando eu falo com você.',
  'TOCA, LIAM! TOCA, PORRA!',
]

// --- O Tear: a lei do pai e a escolha (Arcos 5 e 6) -----------------------------

/**
 * Arco 5. A sombra plantou a culpa; agora o pai dá a filosofia — aprendida
 * com quem o machucou, e agradecida — e monta a situação que vai provar as
 * duas coisas.
 */
export const TEAR_LEI: Line[] = [
  { speaker: 'Adrian', text: 'Sabe o que eu entendi hoje, filho?', style: 'speech' },
  { speaker: 'Adrian', text: 'Todas as desvantagens deste mundo vêm da falta de habilidade de uma pessoa.', style: 'speech' },
  { speaker: 'Adrian', text: 'Quem me disse isso foi a minha mãe. Ela era uma mulher dura. Uma canalha, às vezes. Mas hoje eu sou grato a ela.', style: 'speech' },
  { speaker: 'Adrian', text: 'Esquece o seu corpo. A sua cabeça é forte, Liam. Muito mais forte que a da sua mãe.', style: 'speech' },
  { speaker: 'Adrian', text: 'Então eu pensei numa coisa.', style: 'speech' },
]

/** Arco 6. As duas que cuidaram dele — e que ele achou que iam tirá-lo dali. */
export const ESCOLHA_ARMADILHA: Line[] = [
  { speaker: 'Adrian', text: 'Elas duas cuidaram de você até agora, não foi? A sua mãe, com a mochila pronta. A sua irmã, gritando por você.', style: 'speech' },
  { speaker: 'Adrian', text: 'Você achou que elas iam te tirar daqui. Achou, não achou?', style: 'speech' },
  { speaker: 'Adrian', text: 'Você vai escolher qual fio eu queimo.', style: 'speech' },
  { speaker: 'Adrian', text: '...Não. Deixa eu perguntar de outro jeito.', style: 'speech' },
  { speaker: 'Adrian', text: 'Qual delas você quer salvar?', style: 'speech' },
  { speaker: 'Liam', text: 'Por que eu? Por que eu tenho que escolher?', style: 'speech' },
  { speaker: 'Liam', text: 'Isso é igual a ser eu que queimo!', style: 'speech', grito: true },
  { speaker: 'Adrian', text: 'Escolhe.', style: 'speech' },
]

/** Durante a escolha, as três vozes por cima umas das outras. */
export const ESCOLHA_GRITOS: { quem: 'Adrian' | 'Evelyn' | 'Lia'; texto: string }[] = [
  { quem: 'Adrian', texto: 'Escolhe!' },
  { quem: 'Evelyn', texto: 'Escolhe a Lia, filho.' },
  { quem: 'Adrian', texto: 'A sua mãe?' },
  { quem: 'Lia', texto: 'Escolhe a mãe, seu idiota!' },
  { quem: 'Adrian', texto: 'A sua irmã?' },
  { quem: 'Adrian', texto: 'A da esquerda? A da direita?' },
  { quem: 'Evelyn', texto: 'Tá tudo bem. Escolhe ela.' },
  { quem: 'Adrian', texto: 'ESCOLHE UMA!' },
  { quem: 'Lia', texto: 'Não olha pra mim! Escolhe ela!' },
  { quem: 'Adrian', texto: 'Vai, Liam! ESCOLHE!' },
  { quem: 'Evelyn', texto: 'Escolhe a Lia!' },
  { quem: 'Lia', texto: 'A MÃE, LIAM!' },
]

/** Na primeira vez as mãos não obedecem. Isso é o que sai no lugar. */
export const ESCOLHA_ME_QUEIMA: Line[] = [
  { speaker: 'Liam', text: 'Se tem que queimar alguém, queima o meu!', style: 'speech', grito: true },
  { speaker: 'Adrian', text: 'Muito bem.', style: 'speech' },
  { speaker: 'Adrian', text: 'Olha com atenção agora.', style: 'speech' },
]

/** Depois do fogo. As duas pediram para morrer pela outra — é a mesma doença. */
export const ESCOLHA_DEPOIS: Record<'nenhuma' | 'mae' | 'lia', Line[]> = {
  nenhuma: [
    { speaker: 'Adrian', text: 'Viu só? Quebraram as duas. Igualzinho a você.', style: 'speech' },
    { speaker: 'Adrian', text: 'Todo mundo nessa casa quer ser o que aguenta.', style: 'speech' },
  ],
  mae: [
    { speaker: 'Adrian', text: 'A sua mãe, então.', style: 'speech' },
    { speaker: 'Adrian', text: 'Lembra disso quando a sua irmã perguntar por quê.', style: 'speech' },
  ],
  lia: [
    { speaker: 'Adrian', text: 'A sua irmã, então.', style: 'speech' },
    { speaker: 'Adrian', text: 'A sua mãe pediu, né? Ela sempre pede pra ficar com a pior parte.', style: 'speech' },
  ],
}

// --- Dentro 1: a mãe (Arcos 2 e 4) ---------------------------------------------

/**
 * Uma conversa por recorte. A sombra pergunta, Liam responde, a lembrança
 * fala por cima — e só depois de tudo dito o objeto torto pode ser arrumado.
 *
 * A sombra fala da mãe no passado. Ela sabe. Liam corrige, no presente.
 */
export const DENTRO_RECORTES: Line[][] = [
  // 1 · os cinco pratos
  [
    { sombra: true, text: 'Bom dia, Liam.', style: 'speech' },
    { speaker: 'Liam', text: '...Você de novo.', style: 'speech' },
    { sombra: true, text: 'Me diz uma coisa. Que tipo de pessoa era a sua mãe?', style: 'speech' },
    { speaker: 'Liam', text: 'É. Que tipo de pessoa ela é.', style: 'speech' },
  ],
  // 2 · a partitura
  [
    { speaker: 'Liam', text: 'Ela trabalha em dois lugares. Chega de noite e ainda arruma a casa inteira.', style: 'speech' },
    { speaker: 'Liam', text: 'Nunca reclama. Nunca levanta a voz pra ninguém. Trata todo mundo igual.', style: 'speech' },
    { speaker: 'Liam', text: 'A minha mãe é o meu orgulho.', style: 'speech' },
  ],
  // 3 · os sapatos — Arco 2, a lição
  [
    { speaker: 'Evelyn', text: 'Filho, tudo bem sair perdendo de vez em quando. Menino bom que nem você pode ser feliz só com isso.', style: 'speech', onde: 'lembrança' },
    { speaker: 'Liam', text: 'Foi isso que ela me ensinou.', style: 'speech' },
    { sombra: true, text: 'Ela era muito gentil e maravilhosa, não é? É por isso que você está passando por tudo isso. Porque você decidiu seguir o dogma dela: “É melhor ser ferido do que ferir os outros. Pessoas boas podem ser felizes só com isso.”', style: 'speech' },
    { sombra: true, text: 'Liam, você é um bom garoto.', style: 'speech' },
  ],
  // 4 · o uniforme dela — Arco 4, a pergunta
  [
    { sombra: true, text: 'É melhor ser ferido do que ferir os outros. Você realmente viveu a sua vida acreditando nisso?', style: 'speech' },
    { speaker: 'Liam', text: 'Foi isso que a minha mãe me ensinou. Então eu...', style: 'speech' },
    { sombra: true, text: 'Você obedeceu ao que ela mandou.', style: 'speech' },
    { sombra: true, text: 'Tem certeza de que a sua mãe era tão boa e maravilhosa quanto você pensa?', style: 'speech' },
  ],
  // 5 · a mochila — as contas
  [
    { speaker: 'Liam', text: 'Toda noite ela senta na mesa da cozinha com as contas.', style: 'speech' },
    { speaker: 'Liam', text: 'Pra quem é esse dinheiro, mãe?', style: 'speech', onde: 'lembrança' },
    { speaker: 'Evelyn', text: 'Pro seu pai, filho. Ele disse que esse mês tá difícil.', style: 'speech', onde: 'lembrança' },
    { speaker: 'Liam', text: 'Todo mês tá difícil. Ela pega plantão de dia, plantão de noite, e no domingo costura pra fora.', style: 'speech' },
    { speaker: 'Liam', text: 'Mãe? Você tá bem?', style: 'speech', onde: 'lembrança' },
    { speaker: 'Evelyn', text: 'Tô bem, filho.', style: 'speech', onde: 'lembrança' },
    { sombra: true, text: 'E depois?', style: 'speech' },
    { speaker: 'Liam', text: 'E depois ela continuou.', style: 'speech' },
  ],
  // 6 · quatro pratos — Arco 4, o golpe
  [
    { speaker: 'Liam', text: 'A Lia é a única que ainda grita por mim.', style: 'speech' },
    { speaker: 'Lia', text: 'Liam, se a gente fugisse, você ia comigo? Mesmo sem a mãe?', style: 'speech', onde: 'lembrança' },
    { speaker: 'Liam', text: 'Não fala besteira.', style: 'speech', onde: 'lembrança' },
    { sombra: true, text: 'Ela é especial pra você, não é?', style: 'speech' },
    { sombra: true, text: 'Você já perdeu a sua mãe pra esse jeito de viver, e seguiu o ensinamento dela direitinho.', style: 'speech' },
    { sombra: true, text: 'Mas você vai perder a Lia também, né? Né?', style: 'speech' },
    { sombra: true, text: 'E a culpa é toda sua.', style: 'speech' },
  ],
  // 7 · a chave
  [
    { sombra: true, text: 'Toda vez que você ouve a chave na porta, você pensa a mesma coisa. Eu ouço, porque eu moro aqui. Você pensa: tomara que não seja ele. E depois arruma o sapato, pra ninguém saber que você pensou.', style: 'speech' },
  ],
  // 8 · três pratos
  [
    { sombra: true, text: 'Três. Você vai continuar arrumando até sobrar um prato só?', style: 'speech' },
  ],
]

/** Só para quem entrou na frente dos pratos na cozinha. Entra no recorte 4. */
export const DENTRO_PRATOS_NA_FRENTE: Line = {
  sombra: true,
  text: 'Hoje você entrou na frente do prato. Ninguém pediu. Você foi sozinho, porque é melhor ser ferido do que ferir os outros, não é?',
  style: 'speech',
}

/** O fim do Dentro 1: parou, ou arrumou tudo. Nos dois, o pai desce. */
export const DENTRO_1_PAROU: Line[] = [
  { sombra: true, text: 'Você parou.', style: 'speech' },
  { sombra: true, text: 'É a primeira vez que você para. Olha como é quieto aqui quando você não está segurando nada.', style: 'speech' },
  { sombra: true, text: 'Mas ele não para. Escuta: ele está descendo a escada.', style: 'speech' },
]
export const DENTRO_1_ACABOU: Line[] = [
  { sombra: true, text: 'Acabaram as coisas fora do lugar. E lá em cima eles continuam brigando. Viu? Nunca foi o garfo.', style: 'speech' },
  { sombra: true, text: 'E ele está descendo a escada.', style: 'speech' },
]

// --- Dentro 2: depois do fogo (Arcos 6 a 10) ------------------------------------

/** Quem aparece no vácuo enquanto a sombra fala. */
export type FiguraDentro = 'evelyn' | 'lia' | 'eli' | 'cinzas'

export interface PassoDentro {
  /** Quem aparece neste passo (além de Liam e da sombra). */
  mostrar?: FiguraDentro[]
  linhas: Line[]
  /** Segundos de espera automática entre falas; 0 espera o jogador. */
  auto?: number
}

/** O comentário que abre o Dentro 2 depende do que aconteceu no fogo. */
export const DENTRO_2_ABRE: Record<'nenhuma' | 'mae' | 'lia', Line[]> = {
  nenhuma: [
    { sombra: true, text: 'Você se ofereceu no lugar delas.', style: 'speech' },
    { sombra: true, text: 'Se oferecer no lugar dos outros é a lição da sua mãe levada até o fim. E ela não salva ninguém.', style: 'speech' },
  ],
  mae: [
    { sombra: true, text: 'Você escolheu a sua mãe. E a Lia queimou do mesmo jeito.', style: 'speech' },
    { sombra: true, text: 'Escolher uma é perder a outra. Não escolher é perder as duas. Ninguém te ensinou que existia uma terceira coisa.', style: 'speech' },
  ],
  lia: [
    { sombra: true, text: 'Você escolheu a Lia. E a sua mãe queimou do mesmo jeito.', style: 'speech' },
    { sombra: true, text: 'Escolher uma é perder a outra. Não escolher é perder as duas. Ninguém te ensinou que existia uma terceira coisa.', style: 'speech' },
  ],
}

/** O "e se" do Arco 8 muda conforme a escolha. */
export const DENTRO_2_ESE: Record<'nenhuma' | 'mae' | 'lia', string> = {
  nenhuma: 'Se você tivesse escolhido uma, a outra podia ter sido poupada.',
  mae: 'Se você tivesse escolhido a Lia, a sua mãe podia ter sido poupada.',
  lia: 'Se você tivesse escolhido a sua mãe, a Lia podia ter sido poupada.',
}

/**
 * O resto do Dentro 2, em ordem. `{ESE}` é trocado pela frase do "e se"
 * que combina com a escolha.
 */
export const DENTRO_2: PassoDentro[] = [
  // Arco 7 — é tudo culpa sua
  {
    mostrar: ['cinzas'],
    linhas: [
      { sombra: true, text: 'É tudo culpa sua.', style: 'speech' },
      { speaker: 'Liam', text: 'N-não... minha...', style: 'speech' },
      { speaker: 'Liam', text: 'Não. É culpa minha.', style: 'speech' },
      { sombra: true, text: 'Como você só está entendendo agora? Você vai ficar aí se culpando, se culpando... mas se culpar não muda nada. Você não tenta mudar. É tudo culpa sua. Isso é óbvio, não é?', style: 'speech' },
      { sombra: true, text: 'De quem é a culpa de as coisas terem terminado assim? Coincidência? Acidente? Destino? Não existe destino. É só uma circunstância somada a outra. E quem cria essas circunstâncias? Quem é?', style: 'speech' },
      { sombra: true, text: 'É você.', style: 'speech', grito: true },
      { sombra: true, text: 'Todas as desvantagens deste mundo vêm da falta de habilidade de uma pessoa. Ele tem razão, não tem?', style: 'speech' },
      { sombra: true, text: 'Você ficou quieto, e eu deixei. Ele ensinou, e você aprendeu. E nós dois viramos isso que está pendurado naquele tear. Tudo por sua causa.', style: 'speech' },
    ],
  },
  // Arco 8 — os "e se", e as próximas
  {
    mostrar: ['cinzas'],
    linhas: [
      { sombra: true, text: 'É melhor ser ferido do que ferir os outros. É por isso que você está passando por tudo isso.', style: 'speech' },
      { sombra: true, text: 'Se você tivesse sido forte e dito não pra ele, elas teriam sido poupadas. {ESE}', style: 'speech' },
      { sombra: true, text: 'Se ao menos você tivesse sido forte naquele momento.', style: 'speech' },
    ],
  },
  {
    mostrar: ['eli'],
    linhas: [
      { sombra: true, text: 'E não foi a primeira. Teve alguém que cortou o próprio fio pra não deixar a conta pra você. E você continuou pagando do mesmo jeito.', style: 'speech' },
    ],
  },
  {
    mostrar: ['eli', 'lia'],
    linhas: [
      { sombra: true, text: 'E tem a que ainda está por vir. A Lia. A que você mais ama.', style: 'speech' },
      { sombra: true, text: 'Ficar parado não é neutro, Liam.', style: 'speech' },
      { sombra: true, text: 'Não agir é uma escolha, é simplesmente deixar.', style: 'speech' },
    ],
  },
  // Arco 9 — o desmonte da mãe
  {
    mostrar: ['evelyn'],
    linhas: [
      { sombra: true, text: 'Você é gentil e maravilhoso. Mas, embora pareça que você está escolhendo os dois, na verdade está renunciando aos dois.', style: 'speech' },
      { sombra: true, text: 'A sua mãe era assim também.', style: 'speech' },
      { sombra: true, text: 'Se ela tivesse ignorado o que ele pedia, não teria se acabado do jeito que se acabou.', style: 'speech' },
      { speaker: 'Liam', text: 'Cala a boca.', style: 'speech' },
      { sombra: true, text: 'Que mãe tola, hein? Se ela te amasse, tinha largado o seu pai.', style: 'speech' },
      { speaker: 'Liam', text: 'Para com isso.', style: 'speech' },
      { sombra: true, text: 'Era isso que você queria que ela fizesse, não era?', style: 'speech' },
      { speaker: 'Liam', text: 'Para de falar.', style: 'speech' },
      { sombra: true, text: 'Era isso que você queria que ela fizesse, não era?', style: 'speech' },
    ],
  },
  {
    mostrar: ['evelyn'],
    linhas: [
      { speaker: 'Liam', text: 'Mãe... por quê? Por que você ficou?', style: 'speech' },
      { speaker: 'Liam', text: 'Eu senti a sua falta. Eu odeio ficar sozinho. Eu queria... Eu queria que você tivesse escolhido a gente!', style: 'speech', grito: true },
      { speaker: 'Liam', text: 'Eu queria que você tivesse ido embora! Comigo! Antes!', style: 'speech', grito: true },
    ],
  },
  {
    mostrar: ['evelyn'],
    auto: 0.55,
    linhas: [
      { sombra: true, text: 'Mesmo que isso significasse largar o seu pai?', style: 'speech' },
      { speaker: 'Liam', text: 'Mesmo assim!', style: 'speech', grito: true },
      { sombra: true, text: 'Mesmo que isso machucasse ele?', style: 'speech' },
      { speaker: 'Liam', text: 'Mesmo assim!', style: 'speech', grito: true },
      { sombra: true, text: 'Mesmo que ele nunca mais olhasse na sua cara?', style: 'speech' },
      { speaker: 'Liam', text: 'MESMO ASSIM!', style: 'speech', grito: true },
    ],
  },
  {
    linhas: [
      { sombra: true, text: 'Bom garoto. Isso mesmo, Liam.', style: 'speech' },
      { sombra: true, text: 'Há momentos em que você precisa abrir mão de uma coisa para preservar a outra. Sua mãe não conseguiu fazer isso. Isso não é bondade. Isso é apenas fraqueza.', style: 'speech' },
      { sombra: true, text: 'Ela não teve força... a coragem de virar as costas.', style: 'speech' },
      { sombra: true, text: 'Você ainda consegue ficar do lado de quem aguenta calado? Você consegue aguentar alguém como ele?', style: 'speech' },
      { speaker: 'Liam', text: 'Não. Eu não consigo!', style: 'speech', grito: true },
    ],
  },
  // Arco 10 — a decisão. Aqui o NÓS se separa: não é devorar, é largar.
  {
    linhas: [
      { sombra: true, text: 'Você tem esse tipo de força?', style: 'speech' },
      { speaker: 'Liam', text: 'Tenho.', style: 'speech' },
      { sombra: true, text: 'Tá dizendo que me aceita?', style: 'speech' },
      { speaker: 'Liam', text: 'Tô dizendo que eu não vou mais carregar ninguém.', style: 'speech' },
      { sombra: true, text: 'Mesmo que essa seja a escolha errada?', style: 'speech' },
      { speaker: 'Liam', text: 'Eu não sou o errado.', style: 'speech' },
      { speaker: 'Liam', text: 'O errado é essa casa!', style: 'speech', grito: true },
      { sombra: true, text: 'Chega, Liam. Viver não é carregar os outros. Solta.', style: 'speech' },
      { speaker: 'Liam', text: 'Eu não sou o nó.', style: 'speech' },
      { sombra: true, text: 'Não precisa ser bonito. Não precisa ser educado. Diz pra ele o que você nunca disse.', style: 'speech' },
    ],
  },
]

// --- De volta ao Tear (Arco 11) -------------------------------------------------

/** O "só mais um" era a corda dele. Agora quem pergunta é o Liam. */
export const TEAR_VOLTA_DEPOIS: Line[] = [
  { speaker: 'Adrian', text: 'Só mais um, filho. Junta todos.', style: 'speech' },
  { speaker: 'Liam', text: 'Só mais um?', style: 'speech' },
  { speaker: 'Adrian', text: 'Isso. Só mais um.', style: 'speech' },
  { speaker: 'Liam', text: 'Quantas vezes, pai? Quantas vezes "só mais um"?', style: 'speech', grito: true },
]
