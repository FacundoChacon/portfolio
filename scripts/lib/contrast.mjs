/**
 * Contraste de color WCAG 2.x (funciones puras, sin I/O). Solo lo usan las
 * verificaciones: no entra al bundle del sitio.
 */

/** Umbral mínimo por nivel: texto normal 4.5, texto grande 3, componentes de UI 3. */
export const CONTRAST_THRESHOLDS = { normal: 4.5, large: 3, ui: 3 }

/** Canal sRGB (0-255) a lineal, con el umbral 0.04045 de WCAG. */
function linearChannel(value) {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Hex `#rgb` o `#rrggbb` a [r, g, b]. */
function parseHex(hex) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim())
  if (!match) throw new Error(`contrast: color hex inválido "${hex}"`)
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join('') : match[1]
  return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16))
}

/** Luminancia relativa WCAG de un color hex (0 a 1). */
export function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map(linearChannel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razón de contraste WCAG entre dos colores hex (1 a 21), simétrica. */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Trunca (no redondea) a 2 decimales: igual que la tabla de diseño. */
function truncate2(value) {
  return Math.floor(value * 100) / 100
}

/**
 * Evalúa pares `{ fg, bg, level }` contra la paleta y devuelve errores legibles.
 * @param {Record<string, string>} colors token -> hex
 * @param {{ fg: string, bg: string, level: 'normal'|'large'|'ui' }[]} pairs
 * @returns {string[]}
 */
export function checkContrastPairs(colors, pairs) {
  const errors = []
  for (const { fg, bg, level } of pairs) {
    const threshold = CONTRAST_THRESHOLDS[level]
    if (threshold === undefined) {
      errors.push(`${fg} sobre ${bg}: nivel desconocido "${level}"`)
      continue
    }
    const missing = [fg, bg].filter((token) => !(token in colors))
    if (missing.length > 0) {
      errors.push(`${fg} sobre ${bg}: token inexistente ${missing.join(', ')}`)
      continue
    }
    const ratio = contrastRatio(colors[fg], colors[bg])
    if (ratio < threshold) errors.push(`${fg} sobre ${bg}: ${truncate2(ratio)} < ${threshold} (${level})`)
  }
  return errors
}

/**
 * Compone `fgHex` con opacidad `alpha` sobre `bgHex` (por canal sRGB, como lo
 * hace el navegador) y devuelve el hex `#rrggbb` en minúsculas.
 * @param {string} fgHex
 * @param {string} bgHex
 * @param {number} alpha 0 a 1
 * @returns {string}
 */
export function blendOver(fgHex, bgHex, alpha) {
  const fg = parseHex(fgHex)
  const bg = parseHex(bgHex)
  const channels = fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)))
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}
