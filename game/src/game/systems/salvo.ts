import type { EstadoSalvo, GameState } from './state'

/**
 * O jogo salvo.
 *
 * Um lugar só, gravado sozinho a cada ponto de salvamento — a entrada de
 * cada cena. Ninguém precisa lembrar de salvar, e o jogo nunca para no meio
 * de uma cena para perguntar nada: numa história que se assiste tanto
 * quanto se joga, um menu de salvar no meio do choro quebra o choro.
 *
 * O que fica guardado é o estado *na chegada* da cena. Quem continua começa
 * a cena do começo, sabendo exatamente o que sabia ao chegar — nunca um
 * meio de cena remendado. As cenas da demo duram poucos minutos; se uma
 * cena do jogo completo for longa, ela ganha pontos próprios no meio.
 *
 * Quando o armazenamento do navegador não existe (janela anônima, página
 * embutida), o salvo vive só na memória: "Voltar ao menu" e "Continuar"
 * funcionam enquanto a aba estiver aberta.
 */

/** Os pontos de salvamento, na ordem da história. */
export const ORDEM_PONTOS = ['abertura', 'prologo', 'casa', 'mesa', 'tear', 'grito', 'depois', 'fim'] as const
export type Ponto = (typeof ORDEM_PONTOS)[number]

const CHAVE = 'nos:salvo'
/**
 * Sobe quando o formato muda. Um salvo de versão antiga passa por `migrar`
 * antes de ser lido; um de versão desconhecida é ignorado, nunca apagado.
 */
const VERSAO = 1

export interface Salvo {
  v: number
  ponto: Ponto
  /** Quando foi gravado (Date.now()). */
  quando: number
  estado: Partial<EstadoSalvo>
}

let naMemoria: Salvo | null = null
/** Instante (performance.now) da última gravação nesta visita. */
let gravadoEm = -Infinity

function ehPonto(x: unknown): x is Ponto {
  return typeof x === 'string' && (ORDEM_PONTOS as readonly string[]).includes(x)
}

/** Traz um salvo antigo para o formato atual. Hoje só existe a versão 1. */
function migrar(bruto: unknown): Salvo | null {
  if (!bruto || typeof bruto !== 'object') return null
  const s = bruto as Partial<Salvo>
  if (s.v !== VERSAO || !ehPonto(s.ponto) || !s.estado || typeof s.estado !== 'object') return null
  return { v: VERSAO, ponto: s.ponto, quando: typeof s.quando === 'number' ? s.quando : Date.now(), estado: s.estado }
}

export const salvo = {
  ler(): Salvo | null {
    try {
      const bruto = localStorage.getItem(CHAVE)
      if (bruto) return migrar(JSON.parse(bruto))
    } catch {
      /* sem armazenamento, ou salvo ilegível: vale o da memória */
    }
    return naMemoria
  },

  get existe(): boolean {
    return this.ler() !== null
  },

  /** Grava a chegada a um ponto. Devolve false se só deu para guardar na memória. */
  gravar(ponto: Ponto, state: GameState): boolean {
    const s: Salvo = { v: VERSAO, ponto, quando: Date.now(), estado: state.fotografar() }
    naMemoria = s
    gravadoEm = performance.now()
    try {
      localStorage.setItem(CHAVE, JSON.stringify(s))
      return true
    } catch {
      return false
    }
  },

  apagar(): void {
    naMemoria = null
    try {
      localStorage.removeItem(CHAVE)
    } catch {
      /* nada a apagar */
    }
  },

  /** Segundos desde a última gravação nesta visita (Infinity se nenhuma). */
  get desde(): number {
    return (performance.now() - gravadoEm) / 1000
  },
}

/** "há 5 minutos", "ontem" — para a linha do Continuar. */
export function haQuanto(quando: number, agora = Date.now()): string {
  const min = Math.max(0, Math.round((agora - quando) / 60000))
  if (min < 1) return 'há pouco'
  if (min === 1) return 'há 1 minuto'
  if (min < 60) return `há ${min} minutos`
  const h = Math.round(min / 60)
  if (h < 24) return h === 1 ? 'há 1 hora' : `há ${h} horas`
  const d = Math.round(h / 24)
  if (d === 1) return 'ontem'
  return `há ${d} dias`
}
