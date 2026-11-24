/**
 * Guards estáticos sobre el marcado de componentes (funciones puras, sin I/O).
 * Complementa los guards literales de `proyectos-guard.test.mjs` y
 * `a11y-classes.test.mjs` con reglas por expresión regular (prefijos como
 * `accent-`, `blur-`, o utilidades que solo valen con `motion-safe:`).
 */

/**
 * Devuelve cada coincidencia de cada regla en `source`, en el orden de las reglas.
 * @param {string} source
 * @param {{ rule: string, pattern: RegExp }[]} rules
 * @returns {{ rule: string, match: string }[]}
 */
export function findForbiddenTokens(source, rules) {
  return rules.flatMap(({ rule, pattern }) => {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
    return [...source.matchAll(new RegExp(pattern.source, flags))].map((m) => ({ rule, match: m[0] }))
  })
}

/**
 * Patrón de una utilidad que solo es válida precedida de `motion-safe:`: casa
 * el token completo (con variantes como `md:` o `hover:`) cuando ninguna de sus
 * variantes es `motion-safe:`.
 * @param {string} utilitySource fuente de regex de la utilidad (sin variantes)
 * @returns {RegExp}
 */
export function withoutMotionSafe(utilitySource) {
  return new RegExp(String.raw`(?<![\w:-])(?:(?!motion-safe:)[\w-]+:)*${utilitySource}(?![\w-])`)
}

const tokenize = (source) => source.split(/[\s"'`{}<>=]+/).filter(Boolean)

/**
 * Problemas de estilo en una fuente JSX de la barra: clases del sistema viejo,
 * radios, hex literales y traslación en hover sin `motion-safe:`.
 * @param {string} source
 * @returns {string[]}
 */
export function findStyleViolations(source) {
  const found = []
  for (const token of tokenize(source)) {
    const base = token.replace(/\/\d+$/, '')
    const util = base.split(':').pop()
    if (/^(accent|neon)-/.test(util) || /-(accent|neon)-/.test(util)) found.push(token)
    else if (/-glow-/.test(util) || /^(text|box)-glow/.test(util)) found.push(token)
    else if (/^rounded(-|$)/.test(util)) found.push(token)
    else if (/(^|\[)#[0-9a-f]{3,8}\]?$/i.test(util)) found.push(token)
    else if (/\bhover:/.test(base) && /translate/.test(util) && !/motion-safe:/.test(base)) found.push(token)
  }
  return found
}

