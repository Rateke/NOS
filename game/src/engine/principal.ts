import { musica, Trilha, TEMA_PRINCIPAL, DURACAO_PRINCIPAL } from './musica'
import { trilhaPropria } from './trilhaPropria'

/**
 * A trilha de fundo do jogo, onde quer que ela toque: o menu, a casa, o
 * fecho. Se quem joga escolheu arquivos próprios, toca os arquivos; senão, o
 * piano sintetizado.
 *
 * Regras que valem para as duas:
 * - não cresce: entra no volume em que vai ficar;
 * - a versão completa entra por cima só nos picos, e sai;
 * - onde a história pede silêncio (a casa depois do grito), ela não toca.
 */
class Principal {
  private trilha = new Trilha()
  private nivel = 0

  get tocando(): boolean {
    return this.trilha.ativa || trilhaPropria.tocando
  }

  tocar(nivel = 0.8): void {
    this.nivel = nivel
    if (trilhaPropria.pronta) {
      if (!trilhaPropria.tocando) trilhaPropria.tocar(nivel)
      else trilhaPropria.volume(nivel)
      return
    }
    musica.setFundo(nivel, 2)
    if (!this.trilha.ativa) this.trilha.iniciar(TEMA_PRINCIPAL, DURACAO_PRINCIPAL)
  }

  /** Mais baixo sem parar: sentar ao piano da sala, por exemplo. */
  volume(nivel: number, segundos = 2): void {
    this.nivel = nivel
    if (trilhaPropria.tocando) trilhaPropria.volume(nivel, segundos)
    else musica.setFundo(nivel, segundos)
  }

  parar(segundos = 2): void {
    this.nivel = 0
    trilhaPropria.parar(segundos)
    musica.setFundo(0, segundos)
    musica.setCompleto(0, Math.min(segundos, 1))
    window.setTimeout(() => {
      if (this.nivel === 0) this.trilha.parar()
    }, segundos * 1000)
  }

  /** Corte seco: o preto depois do grito não espera nada terminar. */
  cortar(): void {
    this.nivel = 0
    trilhaPropria.parar(0.05)
    musica.setFundo(0, 0.05)
    musica.setCompleto(0, 0.05)
    this.trilha.parar()
  }

  /** Trocou a fonte (arquivo próprio entrou ou saiu): recomeça do zero. */
  recomecar(nivel = 0.8): void {
    this.trilha.parar()
    musica.setFundo(0, 0.3)
    musica.setCompleto(0, 0.3)
    trilhaPropria.parar(0.3)
    window.setTimeout(() => this.tocar(nivel), 450)
  }

  completo(nivel: number, segundos = 1.2): void {
    if (trilhaPropria.tocando) trilhaPropria.completo(nivel, segundos)
    else musica.setCompleto(nivel, segundos)
  }

  update(dt: number): void {
    this.trilha.update(dt)
  }
}

export const principal = new Principal()
