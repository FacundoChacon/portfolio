/**
 * Extracción de reglas CSS para tests (funciones puras, sin I/O). Un parser
 * mínimo por llaves: alcanza para `src/index.css`, no es un parser CSS general.
 */

/** Quita los comentarios del CSS. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/**
 * Recorre `css` y devuelve cada bloque con su preludio (selector o at-rule),
 * el cuerpo (texto entre sus llaves) y los preludios de sus ancestros.
 * Ignora `;`, `{` y `}` dentro de comillas y paréntesis (p. ej. `url("data:…")`).
 * @param {string} css
 * @returns {{ selector: string, body: string, ancestors: string[] }[]}
 */
function parseBlocks(css) {
  const source = stripComments(css)
  const blocks = []
  const stack = []
  let preludeStart = 0
  let quote = null
  let parens = 0

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]
    if (quote) {
      if (ch === quote && source[i - 1] !== '\\') quote = null
      continue
    }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(') parens += 1
    else if (ch === ')') parens = Math.max(0, parens - 1)
    else if (parens === 0 && ch === '{') {
      stack.push({ selector: source.slice(preludeStart, i).trim(), bodyStart: i + 1 })
      preludeStart = i + 1
    } else if (parens === 0 && ch === '}') {
      const open = stack.pop()
      if (open) {
        blocks.push({
          selector: open.selector,
          body: source.slice(open.bodyStart, i),
          ancestors: stack.map((entry) => entry.selector),
        })
      }
      preludeStart = i + 1
    } else if (parens === 0 && ch === ';') preludeStart = i + 1
  }
  return blocks
}

/** `true` si el preludio es un at-rule contenedor que cambia las condiciones (no `@layer`). */
const isConditional = (prelude) => /^@(supports|media|container)\b/.test(prelude)

/**
 * Cuerpo del primer bloque cuyo selector es exactamente `selector`.
 * Sin `within`, solo cuenta si no está dentro de `@supports`/`@media`/`@container`
 * (sí puede estar dentro de `@layer`); con `within`, solo cuenta si algún
 * ancestro empieza con ese texto (p. ej. `'@supports not'`).
 * @param {string} css
 * @param {string} selector
 * @param {{ within?: string }} [options]
 * @returns {string|null}
 */
export function ruleBody(css, selector, { within } = {}) {
  const block = parseBlocks(css).find((candidate) => {
    if (candidate.selector !== selector) return false
    return within === undefined
      ? !candidate.ancestors.some(isConditional)
      : candidate.ancestors.some((ancestor) => ancestor.startsWith(within))
  })
  return block ? block.body : null
}

/**
 * `{ hex, alpha }` del primer `property: … rgb(r g b / a) …` de `text`.
 * @param {string} text cuerpo de una regla
 * @param {string} property p. ej. `background-color`
 * @returns {{ hex: string, alpha: number }|null}
 */
export function parseRgbAlpha(text, property) {
  const escaped = property.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const match = new RegExp(
    String.raw`(?<![\w-])${escaped}\s*:[^;{}]*?rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*/\s*([\d.]+)\s*\)`,
  ).exec(text)
  if (!match) return null
  const hex = `#${match.slice(1, 4).map((c) => Number(c).toString(16).padStart(2, '0')).join('')}`
  return { hex, alpha: Number(match[4]) }
}
