/**
 * Guard de roles de color y conteo de la jerarquía (funciones puras, sin I/O).
 * Lo aplica `scripts/jerarquia-color.test.mjs` sobre `src/components/**`,
 * `src/pages/**`, `src/App.jsx` y `src/index.css`.
 *
 * Jerarquía: primary (violeta) > secondary (naranja) > tertiary (verde agua).
 * `focus`, `success` y `error` quedan fuera: son funcionales o semánticos.
 */

/** El primario tiene que valer al menos esta cantidad de veces el secundario (empate no alcanza). */
export const MIN_PRIMARY_OVER_SECONDARY = 1.5

/** Clases de `index.css` que pintan un material con el color de un rol. */
export const COMPONENT_CLASSES = {
  'eva-panel': 'primary',
  'eva-glass': 'primary',
  'eva-panel-label': 'primary',
  'eva-hex-grid': 'primary',
  'eva-stripes-primary': 'primary',
  'eva-stripes': 'secondary',
}

/** Modificadores que anulan el conteo de la clase base cuando comparten `className`. */
const OVERRIDDEN_BY = {
  'eva-stripes': ['eva-stripes-primary', 'eva-stripes-error', 'eva-stripes-red'],
  'eva-panel-label': ['eva-panel-label-success', 'eva-panel-label-error'],
}

/** Variantes transitorias: no cuentan, porque lo que manda es la página quieta. */
const STATE_VARIANTS = new Set([
  'hover',
  'focus',
  'focus-visible',
  'focus-within',
  'group-hover',
  'group-focus',
  'group-focus-visible',
  'active',
  'disabled',
])

const COLOR_NAMES = 'violet-light|violet|orange|aqua|purple|green|sky|red-light|red'
const BOUNDARY = String.raw`(?<![A-Za-z0-9_])`

/** Nombres de color de acento (en lugar de roles) y hex retirados. */
const ACCENT_NAMES = new RegExp(
  `${BOUNDARY}(?:eva-(?:${COLOR_NAMES}|stripes-red)|colors\\.eva\\.(?:${COLOR_NAMES}))(?![\\w-])|#(?:8A4FD8|3DFF7A|E8202A)(?![\\w])`,
  'gi',
)

/** Roles de estado (celeste y rojo claro) y sus variantes de material. */
const STATUS_NAMES = new RegExp(
  `${BOUNDARY}(?:eva-(?:success|error|panel-label-success|panel-label-error|stripes-error)|colors\\.eva\\.(?:success|error))(?![\\w-])`,
  'g',
)

/** Rutas donde los roles de estado son legítimos. */
const STATUS_ALLOWED = [/^src\/components\/configurador\//, /^src\/pages\/Configurador\.jsx$/, /^src\/index\.css$/]

/**
 * Nombres de color de acento usados en lugar de un rol.
 * @param {string} source
 * @returns {{ match: string }[]}
 */
export function findAccentColorNames(source) {
  return [...source.matchAll(ACCENT_NAMES)].map((m) => ({ match: m[0] }))
}

/**
 * Usos de los roles de estado fuera del configurador (no son decoración de la home).
 * @param {{ path: string, source: string }[]} files
 * @returns {{ path: string, match: string }[]}
 */
export function findStatusOutsideConfigurador(files) {
  return files
    .filter(({ path }) => !STATUS_ALLOWED.some((allowed) => allowed.test(path)))
    .flatMap(({ path, source }) => [...source.matchAll(STATUS_NAMES)].map((m) => ({ path, match: m[0] })))
}

/** Separa `a:b:utilidad` en variantes y utilidad, ignorando los `:` dentro de corchetes. */
function splitVariants(token) {
  const parts = []
  let depth = 0
  let start = 0
  for (let i = 0; i < token.length; i += 1) {
    const ch = token[i]
    if (ch === '[' || ch === '(') depth += 1
    else if (ch === ']' || ch === ')') depth -= 1
    else if (ch === ':' && depth === 0) {
      parts.push(token.slice(start, i))
      start = i + 1
    }
  }
  return { variants: parts, utility: token.slice(start) }
}

const ROLE_USE = new RegExp(
  `${BOUNDARY}(?:--)?eva-(primary-light|primary|secondary|tertiary)(?![\\w-])|colors\\.eva\\.(primary-light|primary|secondary|tertiary)(?![\\w-])`,
  'g',
)

/** Cadenas de texto del código (comillas simples, dobles y plantillas): cada una es un posible `className`. */
const STRING_LITERAL = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g

const TOKEN_SPLIT = /[\s"'`{}<>=$?]+/

/**
 * Cuenta usos de cada rol de la jerarquía. Cuenta solo tokens en reposo (sin
 * variante de estado), suma `primary-light` a `primary` y suma el rol de las
 * clases de componente (`eva-panel`, `eva-stripes`...) salvo que su variante de
 * estado las anule en la misma cadena.
 * @param {string} source
 * @param {{ componentClasses?: Record<string, 'primary'|'secondary'|'tertiary'> }} [options]
 * @returns {{ primary: number, secondary: number, tertiary: number }}
 */
export function countRoleUses(source, { componentClasses = COMPONENT_CLASSES } = {}) {
  const total = { primary: 0, secondary: 0, tertiary: 0 }
  for (const [, , body] of source.matchAll(STRING_LITERAL)) {
    const tokens = body.split(TOKEN_SPLIT).filter(Boolean)
    const present = new Set(tokens)
    for (const token of tokens) {
      const { variants, utility } = splitVariants(token)
      if (variants.some((variant) => STATE_VARIANTS.has(variant))) continue
      if (variants.length === 0 && utility in componentClasses) {
        const overridden = (OVERRIDDEN_BY[utility] ?? []).some((modifier) => present.has(modifier))
        if (!overridden) total[componentClasses[utility]] += 1
        continue
      }
      for (const match of utility.matchAll(ROLE_USE)) {
        const role = (match[1] ?? match[2]).replace('-light', '')
        total[role] += 1
      }
    }
  }
  return total
}
