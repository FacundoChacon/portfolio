/**
 * Efecto "foil" 2.5D de las cards: matemática pura del giro, el brillo y los
 * estados. Sin DOM: el hook mide (rect, viewport) y escribe las variables CSS.
 */

/** Giro máximo (grados), elevación (px) y escala del estado activo. */
export const ROT_Y_MAX = 13
export const ROT_X_MAX = 9
export const TZ = 46
export const ESCALA = 1.05

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/**
 * Giro y posición del brillo para un puntero. El giro se normaliza por el
 * viewport (no por la card): `sx = (px − centroX) / (vw / 2)`, acotado a [−1, 1].
 * `mxf` es local a la card (0 = borde izquierdo, 1 = derecho).
 * @param {{ px: number, py: number, rect: { left: number, top: number, width: number, height: number }, vw: number, vh: number }} args
 * @returns {{ rx: number, ry: number, mxf: number }}
 */
export function tiltDesdePuntero({ px, py, rect, vw, vh }) {
  const ok = [px, py, vw, vh, rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) && vw > 0 && vh > 0 && rect.width > 0
  if (!ok) return { rx: 0, ry: 0, mxf: 0.5 }
  const sx = clamp((px - (rect.left + rect.width / 2)) / (vw / 2), -1, 1)
  const sy = clamp((py - (rect.top + rect.height / 2)) / (vh / 2), -1, 1)
  return {
    rx: -ROT_X_MAX * sy || 0,
    ry: ROT_Y_MAX * sx,
    mxf: clamp((px - rect.left) / rect.width, 0, 1),
  }
}

/** Card en reposo: plana, sin brillo. */
export function estadoReposo() {
  return { rx: 0, ry: 0, tz: 0, s: 1, hover: 0, mxf: 0.5 }
}

/** Card bajo un puntero fino: giro, elevación, escala y foil visibles. */
export function estadoActivo({ rx, ry, mxf }) {
  return { rx, ry, tz: TZ, s: ESCALA, hover: 1, mxf }
}

/** Foco de teclado: levantada y con brillo centrado, sin giro. */
export function estadoEnfoque() {
  return { rx: 0, ry: 0, tz: TZ, s: ESCALA, hover: 1, mxf: 0.5 }
}

/** Variables CSS (con unidades) de un estado, para `style.setProperty`. */
export function propiedadesCss({ rx, ry, tz, s, hover, mxf }) {
  return {
    '--rx': `${rx}deg`,
    '--ry': `${ry}deg`,
    '--tz': `${tz}px`,
    '--s': `${s}`,
    '--hover': `${hover}`,
    '--mxf': `${mxf}`,
  }
}
