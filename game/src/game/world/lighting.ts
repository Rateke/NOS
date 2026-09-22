import { PAL, WORLD_W, WORLD_H } from '../../engine/constants'
import { LAMP, FLOOR } from './bedroom'

/**
 * A luz faz quase toda a atmosfera. Regras: a luminária é a única fonte
 * quente, a janela é fria e não oscila (a manhã lá fora está congelada), e os
 * cantos escurecem sem chegar ao preto — o quarto precisa continuar legível.
 */
export function drawLighting(c: CanvasRenderingContext2D, time: number): void {
  // Queda de luz geral, centrada no meio do quarto para não afundar a cama.
  c.save()
  c.globalCompositeOperation = 'multiply'
  const cx = 208
  const cy = 112
  c.translate(cx, cy)
  c.scale(1.5, 1) // elíptico: o quarto é mais largo do que alto
  const dark = c.createRadialGradient(0, 0, 22, 0, 0, 132)
  dark.addColorStop(0, '#ffffff')
  dark.addColorStop(0.45, '#a3aaba')
  dark.addColorStop(1, '#434a5e')
  c.fillStyle = dark
  c.fillRect(-WORLD_W, -WORLD_H, WORLD_W * 3, WORLD_H * 3)
  c.restore()

  // Derrame frio da janela: desaparece antes de virar holofote.
  c.save()
  c.globalCompositeOperation = 'lighter'
  const spill = c.createLinearGradient(0, FLOOR.y, 0, FLOOR.y + 58)
  spill.addColorStop(0, 'rgba(110,134,166,0.13)')
  spill.addColorStop(1, 'rgba(110,134,166,0)')
  c.fillStyle = spill
  c.beginPath()
  c.moveTo(99, FLOOR.y)
  c.lineTo(149, FLOOR.y)
  c.lineTo(163, FLOOR.y + 58)
  c.lineTo(85, FLOOR.y + 58)
  c.closePath()
  c.fill()
  c.restore()

  // Halo da luminária, com oscilação quase imperceptível.
  const flicker = 0.95 + Math.sin(time * 1.3) * 0.028 + Math.sin(time * 5.7) * 0.01
  c.save()
  c.globalCompositeOperation = 'lighter'
  const glow = c.createRadialGradient(LAMP.x, LAMP.y + 6, 4, LAMP.x, LAMP.y + 6, 128)
  glow.addColorStop(0, `rgba(255,233,198,${0.34 * flicker})`)
  glow.addColorStop(0.28, `rgba(240,192,136,${0.16 * flicker})`)
  glow.addColorStop(1, 'rgba(240,192,136,0)')
  c.fillStyle = glow
  c.fillRect(0, 0, WORLD_W, WORLD_H)
  c.restore()

  // Sombra rasante nas bordas do chão, para o quarto não flutuar.
  c.save()
  c.globalCompositeOperation = 'multiply'
  const edge = c.createLinearGradient(0, FLOOR.y + FLOOR.h - 26, 0, FLOOR.y + FLOOR.h)
  edge.addColorStop(0, '#ffffff')
  edge.addColorStop(1, '#8d94a6')
  c.fillStyle = edge
  c.fillRect(FLOOR.x, FLOOR.y + FLOOR.h - 26, FLOOR.w, 26)
  c.restore()
  void PAL
}
