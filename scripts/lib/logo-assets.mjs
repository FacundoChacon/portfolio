/**
 * SVG de los íconos del sitio (funciones puras, sin I/O): el favicon y el ícono táctil salen de
 * la misma geometría que el resto del logotipo (`src/data/logo.js`).
 * `scripts/render-logo-assets.mjs` escribe los archivos de `public/`.
 */
import { logoSvg } from '../../src/data/logo.js'
import { EVA_COLORS, EVA_LOGO_COLORS } from '../../src/styles/eva-tokens.js'

/** Favicon: variante simple sobre cuadrado negro de 32x32 con esquinas redondeadas. */
export function faviconSvg() {
  return logoSvg({ variante: 'simple', colores: EVA_LOGO_COLORS, fondo: EVA_COLORS.black })
}

/** Ícono táctil: el mismo dibujo sin esquinas redondeadas (iOS las aplica). */
export function touchIconSvg() {
  return logoSvg({ variante: 'simple', colores: EVA_LOGO_COLORS, fondo: EVA_COLORS.black, radioFondo: 0 })
}
