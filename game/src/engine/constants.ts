/** Resolução interna do mundo. Tudo é desenhado aqui e depois escalado por inteiro. */
export const WORLD_W = 384
export const WORLD_H = 216

/**
 * Paleta: frio e profundo (Hollow Knight) com uma única fonte quente (a luminária).
 * A regra é que nada no quarto emite calor além dela.
 */
export const PAL = {
  void: '#05070c',
  wallDark: '#0b0e16',
  wall: '#141926',
  wallLit: '#1d2435',
  floorDark: '#141825',
  floor: '#1e2433',
  floorLit: '#283042',
  lamp: '#f0c088',
  lampCore: '#ffe9c6',
  windowCold: '#6e86a6',
  windowPale: '#aec2da',
  ink: '#e8ecf4',
  inkDim: '#868ea2',
  inkFaint: '#4a5166',
  cloth: '#333c52',
  paper: '#cfc6b4',
  accent: '#d9b25f',
} as const

/** Velocidade de caminhada de Liam, em pixels de mundo por segundo. */
export const WALK_SPEED = 46
