/**
 * Guard global contra restos de la estética cyberpunk (funciones puras, sin I/O).
 * Reutiliza `findForbiddenTokens` de class-guard.mjs. Lo aplica
 * `scripts/limpieza-cyberpunk.test.mjs` sobre todo `src/` e `index.html`.
 */
import { findForbiddenTokens } from './class-guard.mjs'

/** Prefijos de utilidad de Tailwind, con variantes (`hover:`, `md:`) y opacidad (`/60`) opcionales. */
const UTIL = String.raw`(?<![\w-])(?:[\w-]+:)*`
const OPACITY = String.raw`(?:/\d+)?(?![\w-])`
const PREFIXES = String.raw`(?:bg|text|border|from|via|to|ring|divide|shadow|outline|placeholder)`

/** Token suelto de clase: no precedido ni seguido por `-`, letra o dígito (deja pasar `eva-glass`, `useReveal`). */
const bare = (name) => String.raw`(?<![\w-])${name}(?![\w-])`

/**
 * Nombres que también son identificadores de JS (`reveal`, `tag`): solo cuentan como clase
 * dentro de `class`/`className="…"` o como selector CSS (`.tag`).
 */
const classOnly = (name) =>
  String.raw`(?<=class(?:Name)?=(?:"|'|\{\x60)(?:[^"'\x60]*\s)?)${name}(?=[\s"'\x60])|(?<![\w-])\.${name}(?![\w-])`

/**
 * @type {{ rule: string, pattern: RegExp, scope: 'markup' | 'css' | 'all' }[]}
 */
export const LEGACY_RULES = [
  {
    rule: 'paleta-anterior',
    scope: 'all',
    pattern: new RegExp(
      `${UTIL}(?:${PREFIXES}-(?:accent|neon|muted|dark)(?:-[\\w]+)*|(?:accent|neon|muted)-(?:green|pink|cyan|magenta|foreground)[\\w-]*)${OPACITY}`,
    ),
  },
  { rule: 'brillo', scope: 'all', pattern: /glow/i },
  { rule: 'glitch', scope: 'all', pattern: /glitch/i },
  { rule: 'animacion-cyberpunk', scope: 'all', pattern: /animate-scan|@keyframes scan|flicker/ },
  { rule: 'familia-retirada', scope: 'all', pattern: /orbitron|rajdhani/i },
  { rule: 'clase-font-display', scope: 'markup', pattern: new RegExp(`${UTIL}font-display(?![\\w-])`) },
  {
    rule: 'clase-heredada',
    scope: 'all',
    pattern: new RegExp(
      [
        bare('cyber-grid'),
        bare('gradient-text'),
        bare('gradient-border'),
        bare('duotone-wrap'),
        bare('section-title'),
        bare('section-desc'),
        classOnly('glass(?:-hover)?'),
        classOnly('reveal(?:-(?:bottom|left|right))?'),
        classOnly('tag'),
      ].join('|'),
    ),
  },
  {
    rule: 'hex-paleta-anterior',
    scope: 'all',
    pattern: /#(?:00ffc3|ff6eff|00cc9a|cc3acc|030303|0a0a0a|111116|1a1a22|0b0b10)(?![\w])|rgba\(\s*0,\s*255,\s*195|rgba\(\s*255,\s*110,\s*255/i,
  },
]

/** Excepciones declaradas (con motivo): literales de `@react-pdf`, no tokens de Tailwind. */
const MOTIVO_PDF =
  'Literal de @react-pdf del presupuesto (texto oscuro sobre papel blanco); restilar el PDF es una pregunta abierta de marca (Non-Goal de limpieza-cyberpunk).'

export const PERMITIDOS = [
  { path: 'src/utils/pdfDocument.js', rule: 'hex-paleta-anterior', match: '#030303', motivo: MOTIVO_PDF },
  { path: 'src/utils/pdfDocument.js', rule: 'hex-paleta-anterior', match: '#0a0a0a', motivo: MOTIVO_PDF },
  { path: 'src/utils/pdfDocument.js', rule: 'hex-paleta-anterior', match: '#00ffc3', motivo: MOTIVO_PDF },
]

/** Restos dentro de secciones o del configurador que otro change debe migrar. Solo crece con motivo. */
export const PENDIENTES = []

const kindOf = (path) => (path.endsWith('.css') ? 'css' : 'markup')

/**
 * @param {{ path: string, source: string }[]} files
 * @param {{ rules: typeof LEGACY_RULES, permitidos: { path: string, rule: string, match: string }[], pendientes: { path: string, rule: string, match: string }[] }} options
 * @returns {{ path: string, rule: string, match: string }[]}
 */
export function scanLegacy(files, { rules, permitidos, pendientes }) {
  const skip = [...permitidos, ...pendientes]
  return files.flatMap(({ path, source }) => {
    const kind = kindOf(path)
    const applicable = rules.filter((r) => r.scope === 'all' || r.scope === kind)
    return findForbiddenTokens(source, applicable)
      .map(({ rule, match }) => ({ path, rule, match }))
      .filter((hit) => !skip.some((e) => e.path === hit.path && e.rule === hit.rule && e.match === hit.match))
  })
}
