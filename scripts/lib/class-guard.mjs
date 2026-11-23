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
