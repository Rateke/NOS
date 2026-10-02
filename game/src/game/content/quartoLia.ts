import type { Line } from '../world/types'

/**
 * O quarto da Lia, antes do jantar.
 *
 * Ela está arrumando a mala. Xinga ele, manda ele ajudar, divide o fone, e
 * chama ele para ir junto. A resposta do Liam sai com a voz do pai — e ela
 * sabe de quem é aquela frase. Joga o travesseiro, manda ele sair, e mesmo
 * assim enfia um bilhete no bolso dele.
 */

export const LIA_ENTRA: Line[] = [
  { speaker: 'Lia', text: 'Bate antes de entrar, seu idiota.', style: 'speech' },
  { speaker: 'Liam', text: 'A porta tava aberta.', style: 'speech' },
  { speaker: 'Lia', text: 'Aberta não é convite.', style: 'speech' },
  { text: 'Ela não para de dobrar roupa. Dobra tudo torto, e não arruma.' },
  { speaker: 'Lia', text: 'Já que tá aí, me passa as coisas. Rápido.', style: 'speech' },
]

export const LIA_ITENS = ['A foto da família', 'O fone dela', 'O meu desenho, da parede']

export const LIA_ITEM_RESPOSTA: Line[][] = [
  [
    { speaker: 'Lia', text: 'Essa não. Ele tá nela.', style: 'speech' },
    { text: 'Ela vira a foto pra baixo, em cima da cama.' },
  ],
  [
    { speaker: 'Lia', text: 'Isso vai. Isso vai sempre.', style: 'speech' },
  ],
  [
    { speaker: 'Lia', text: '...Você lembra disso? Você tinha sete anos.', style: 'speech' },
    { speaker: 'Lia', text: 'Vai junto. E cala a boca.', style: 'speech' },
    { text: 'Ela dobra o desenho em quatro e põe por baixo das roupas.' },
  ],
]

export const LIA_FONE: Line[] = [
  { speaker: 'Lia', text: 'Senta aí. Toma, um lado é seu.', style: 'speech' },
  { speaker: 'Lia', text: 'Não fala nada. Só escuta.', style: 'speech' },
]

export const LIA_FONE_PAZ: Line[] = [
  { text: 'Por um minuto a casa não existe.' },
]

export const LIA_FONE_CORTE: Line[] = [
  { speaker: 'Adrian', text: 'LIA! LIAM! PRA COZINHA, AGORA!', style: 'speech', grito: true, onde: 'da cozinha' },
  { text: 'Ela puxa o fone da minha orelha. Fica olhando pra porta.' },
]

export const LIA_CONVITE: Line[] = [
  { speaker: 'Lia', text: 'Escuta. A mãe já ligou pra tia Catarina.', style: 'speech' },
  { speaker: 'Lia', text: 'A gente vai hoje, depois do jantar. Vem com a gente.', style: 'speech' },
]

export const LIA_CONVITE_OPCOES = ['Eu vou.', 'E o pai?', 'Tá bom.']

/** O que sai antes de ele conseguir responder: a frase do pai, na boca dele. */
export const LIA_ECO: Line[] = [
  { speaker: 'Liam', text: 'Não posso deixar o pai sozinho.', style: 'speech', fio: 'Adrian' },
]

/** Nas partidas seguintes, quando ele consegue escolher. */
export const LIA_CONVITE_RESPOSTAS: Line[][] = [
  [
    { speaker: 'Lia', text: '...Sério?', style: 'speech' },
    { speaker: 'Lia', text: 'Então fica quieto no jantar. Não discute com ele. Só fica quieto.', style: 'speech' },
  ],
  [
    { speaker: 'Lia', text: 'O pai é adulto, Liam. Ele que se vire.', style: 'speech' },
  ],
  [
    { speaker: 'Lia', text: '"Tá bom" não é resposta. Você sempre fala "tá bom".', style: 'speech' },
  ],
]

export const LIA_RAIVA: Line[] = [
  { speaker: 'Lia', text: '...', style: 'speech' },
  { speaker: 'Lia', text: 'VOCÊ É IGUALZINHO A ELE, SABIA?', style: 'speech', grito: true },
]

export const LIA_SAI: Line[] = [
  { speaker: 'Lia', text: 'Sai do meu quarto.', style: 'speech' },
]

export const LIA_BILHETE: Line[] = [
  { text: 'Quando eu viro, ela chega perto e enfia um papel no bolso do meu moletom.' },
  { text: 'Não fala nada. Volta pra mala.' },
]

/** Depois do espelho. */
export const ESPELHO_DEPOIS: Line[] = [
  { text: '...' },
  { text: 'Eu não dormi direito. É só isso.' },
]
