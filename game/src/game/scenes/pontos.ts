import type { Scene } from './types'
import type { Ponto } from '../systems/salvo'
import { HospitalScene } from './demo/hospital'
import { PrologoScene } from './demo/prologo'
import { CasaScene } from './demo/casa'
import { MesaScene } from './demo/mesa'
import { TearScene } from './demo/tear'
import { FimScene } from './demo/fim'

interface PontoInfo {
  /** Como o ponto aparece embaixo do Continuar. */
  nome: string
  /**
   * Grava sem mostrar o nó no canto: o preto do rádio e o do grito não
   * podem ter nada desenhado por cima.
   */
  discreto?: boolean
  criar: () => Scene
}

/**
 * Todo lugar onde o jogo pode recomeçar. É daqui que o Continuar monta a
 * cena — e o `?cena=` de produção também. Um capítulo novo do jogo completo
 * entra aqui e em ORDEM_PONTOS (systems/salvo.ts), e mais nada.
 */
export const PONTOS: Record<Ponto, PontoInfo> = {
  abertura: { nome: 'o rádio', discreto: true, criar: () => new HospitalScene('abertura') },
  prologo: { nome: 'a música', criar: () => new PrologoScene() },
  casa: { nome: 'a casa grande demais', criar: () => new CasaScene() },
  mesa: { nome: 'a mesa', criar: () => new MesaScene() },
  tear: { nome: 'o Tear', criar: () => new TearScene() },
  grito: { nome: 'depois do grito', discreto: true, criar: () => new HospitalScene('grito') },
  depois: { nome: 'a casa, depois', criar: () => new CasaScene({ depois: true }) },
  fim: { nome: 'o fim', criar: () => new FimScene() },
}
