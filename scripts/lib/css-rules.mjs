/**
 * Helpers de tests para leer reglas del CSS real (sin I/O, sin dependencias).
 * Contrato compartido entre `stack-neumorfico-oscuro` y `acerca-testimonios-glass`.
 */

const norm = (text) => text.replace(/\s+/g, ' ').trim()

/**
 * Divide `css` en bloques `{ head, body }` de un solo nivel (los hijos quedan
 * dentro de `body`). Ignora comentarios y respeta llaves anidadas.
 * @param {string} css
 * @returns {{ head: string, body: string }[]}
 */
function blocksOf(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const blocks = []
  let depth = 0
  let headStart = 0
  let bodyStart = 0
  let head = ''
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i]
    if (ch === '{') {
      if (depth === 0) {
        head = norm(src.slice(headStart, i))
        bodyStart = i + 1
      }
      depth += 1
    } else if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        blocks.push({ head, body: src.slice(bodyStart, i) })
        headStart = i + 1
      }
    } else if (ch === ';' && depth === 0) {
      headStart = i + 1
    }
  }
  return blocks
}

/**
 * Busca el primer bloque de `selector` entre `blocks`, descendiendo solo por
 * `@layer` (que no condiciona la regla).
 */
function findRule(blocks, selector) {
  for (const { head, body } of blocks) {
    if (head === selector) return body
    if (head.startsWith('@layer')) {
      const found = findRule(blocksOf(body), selector)
      if (found !== null) return found
    }
  }
  return null
}

/** Cuerpos de todas las at-rules cuyo encabezado es `within` (puede haber varias). */
function findAtRules(blocks, within) {
  return blocks.flatMap(({ head, body }) => {
    if (head === within || head.startsWith(within)) return [body]
    return head.startsWith('@layer') ? findAtRules(blocksOf(body), within) : []
  })
}

/**
 * Cuerpo del primer bloque cuyo selector es exactamente `selector`.
 * Sin `within` solo mira reglas que no están dentro de `@media`/`@supports`
 * (sí dentro de `@layer`); con `within` (p. ej. `'@media (hover: hover)'`) mira
 * únicamente dentro de esa at-rule (si hay varias iguales, la primera que contenga el selector).
 * @param {string} css
 * @param {string} selector
 * @param {{ within?: string }} [options]
 * @returns {string|null} el cuerpo (sin llaves) o `null` si no existe
 */
export function ruleBody(css, selector, { within } = {}) {
  const top = blocksOf(css)
  if (within === undefined) return findRule(top, norm(selector))
  for (const inner of findAtRules(top, norm(within))) {
    const found = findRule(blocksOf(inner), norm(selector))
    if (found !== null) return found
  }
  return null
}

const RGB_ALPHA = /rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\s*\)/
const toHex = (r, g, b) => `#${[r, g, b].map((c) => Number(c).toString(16).padStart(2, '0')).join('')}`

/**
 * `{ hex, alpha }` del primer `property: rgb(r g b / a)` de `text`.
 * @param {string} text
 * @param {string} property p. ej. `background-color`
 * @returns {{ hex: string, alpha: number }|null}
 */
export function parseRgbAlpha(text, property) {
  const declaration = text
    .split(/[;{}]/)
    .map((part) => part.trim())
    .find((part) => part.startsWith(property) && part.slice(property.length).trimStart().startsWith(':'))
  const color = declaration && RGB_ALPHA.exec(declaration.slice(declaration.indexOf(':') + 1))
  return color ? { hex: toHex(color[1], color[2], color[3]), alpha: Number(color[4]) } : null
}

/**
 * Colores de un valor de `box-shadow` con colores `rgb(r g b / a)`.
 * @param {string} text valor de `box-shadow` (sin la propiedad)
 * @returns {{ hex: string, alpha: number, inset: boolean }[]}
 */
export function parseShadowColors(text) {
  return text
    .split(/,(?![^(]*\))/)
    .map((layer) => {
      const color = RGB_ALPHA.exec(layer)
      return color
        ? { hex: toHex(color[1], color[2], color[3]), alpha: Number(color[4]), inset: /(^|\s)inset(\s|$)/.test(layer) }
        : null
    })
    .filter(Boolean)
}
