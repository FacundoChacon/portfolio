/**
 * Tests de la sección de contacto brutalista (change `contacto-brutalista`):
 * datos puros, contraste y guard estático de `Contact.jsx`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { EVA_COLORS } from '../src/styles/eva-tokens.js'
import { findForbiddenTokens, withoutMotionSafe } from './lib/class-guard.mjs'
import { checkContrastPairs } from './lib/contrast.mjs'
import {
  DEFAULT_CONTACT_EMAIL,
  buildContactChannels,
  channelCode,
  channelLinkProps,
  isExternalHref,
  resolveContactEmail,
} from '../src/data/contacto.js'

const ROOT = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8')

// --- Datos (design D1) -----------------------------------------------------

test('resolveContactEmail: una dirección válida se usa tal cual', () => {
  assert.equal(resolveContactEmail('hola@ejemplo.com'), 'hola@ejemplo.com')
})

test('resolveContactEmail: recorta espacios alrededor', () => {
  assert.equal(resolveContactEmail('  hola@ejemplo.com \n'), 'hola@ejemplo.com')
})

test('resolveContactEmail: sin valor, vacío, solo espacios o inválido cae al respaldo', () => {
  for (const value of [undefined, null, '', '   ', 'no-es-email', 'a@b', 'a b@c.com', 42]) {
    assert.equal(resolveContactEmail(value), DEFAULT_CONTACT_EMAIL, String(value))
  }
})

test('resolveContactEmail: acepta un respaldo inyectado', () => {
  assert.equal(resolveContactEmail('', 'otro@ejemplo.com'), 'otro@ejemplo.com')
  assert.equal(resolveContactEmail('x@y.io', 'otro@ejemplo.com'), 'x@y.io')
})

test('buildContactChannels: orden, ids y mailto con el email recibido', () => {
  const channels = buildContactChannels('hola@ejemplo.com')
  assert.deepEqual(channels.map((c) => c.id), ['email', 'github', 'linkedin'])
  assert.equal(channels[0].value, 'hola@ejemplo.com')
  assert.equal(channels[0].href, 'mailto:hola@ejemplo.com')
  assert.deepEqual(channels.map((c) => c.brand), ['email', 'github', 'linkedin'])
})

test('buildContactChannels: triangulación con otro email y externos https', () => {
  const [email, ...externos] = buildContactChannels('otra@dir.org')
  assert.equal(email.href, 'mailto:otra@dir.org')
  for (const c of externos) {
    assert.match(c.href, /^https:\/\//)
    assert.doesNotThrow(() => new URL(c.href))
  }
  for (const c of [email, ...externos]) {
    assert.ok(c.label.trim() && c.value.trim())
  }
  assert.deepEqual([email, ...externos].map((c) => c.brand), ['email', 'github', 'linkedin'])
})

test('isExternalHref: solo http(s)', () => {
  assert.equal(isExternalHref('https://github.com/x'), true)
  assert.equal(isExternalHref('http://ejemplo.com'), true)
  for (const href of ['mailto:a@b.co', 'tel:+5412345', '#contacto']) assert.equal(isExternalHref(href), false, href)
})

test('channelLinkProps: externos abren pestaña nueva sin acceso al origen; el resto no', () => {
  assert.deepEqual(channelLinkProps('https://github.com/x'), { target: '_blank', rel: 'noopener noreferrer' })
  assert.deepEqual(channelLinkProps('http://x.com'), { target: '_blank', rel: 'noopener noreferrer' })
  for (const href of ['mailto:a@b.co', 'tel:+5412345', '#contacto']) assert.deepEqual(channelLinkProps(href), {}, href)
})

test('channelCode: código CH- de dos dígitos', () => {
  assert.equal(channelCode(0), 'CH-01')
  assert.equal(channelCode(2), 'CH-03')
  assert.equal(channelCode(9), 'CH-10')
})

// --- Contraste (design D4) -------------------------------------------------

const CONTACTO_CONTRAST_PAIRS = [
  ...['paper', 'gray', 'violet-light', 'orange', 'aqua'].flatMap((fg) =>
    ['black', 'panel'].map((bg) => ({ fg, bg, level: 'normal' })),
  ),
  { fg: 'black', bg: 'orange', level: 'normal' },
  { fg: 'black', bg: 'violet', level: 'normal' },
  { fg: 'gray-dim', bg: 'black', level: 'ui' },
  { fg: 'gray-dim', bg: 'panel', level: 'ui' },
  { fg: 'violet', bg: 'panel', level: 'ui' },
  { fg: 'aqua', bg: 'panel', level: 'ui' },
]

test('contraste: pares de colores de la sección cumplen su umbral', () => {
  assert.deepEqual(checkContrastPairs(EVA_COLORS, CONTACTO_CONTRAST_PAIRS), [])
})

test('contraste: violet no se declara como texto normal sobre línea (triangulación)', () => {
  const errors = checkContrastPairs(EVA_COLORS, [{ fg: 'violet', bg: 'line', level: 'normal' }])
  assert.equal(errors.length, 1)
  assert.match(errors[0], /violet sobre line/)
})

// --- Guard estático de Contact.jsx (design D5) -----------------------------

const CONTACT = read('src/components/Contact.jsx')

/** Token de utilidad con variantes opcionales (`md:`, `hover:`...). */
const util = (body) => new RegExp(String.raw`(?<![\w-])(?:[\w-]+:)*${body}(?![\w-])`)

const FORBIDDEN_RULES = [
  { rule: 'GlitchText', pattern: /GlitchText/ },
  { rule: 'glitch', pattern: /glitch/i },
  { rule: 'glow', pattern: /glow/ },
  { rule: 'cyber-grid', pattern: /cyber-grid/ },
  { rule: 'accent-*', pattern: util(String.raw`(?:bg|text|border|from|to|via|shadow|ring)-accent-[\w/]+`) },
  { rule: 'neon-*', pattern: /neon-/ },
  { rule: 'dark', pattern: util(String.raw`(?:bg|text|border|from|to|via)-dark(?:-\w+)?`) },
  { rule: 'red-N', pattern: /red-\d/ },
  { rule: 'rounded', pattern: util(String.raw`rounded(?:-[\w[\]]+)?`) },
  { rule: 'truncate', pattern: util('truncate') },
  { rule: 'style inline', pattern: /style=\{\{/ },
  { rule: 'blur-', pattern: util(String.raw`blur(?:-[\w[\]]+)?`) },
  { rule: 'backdrop-', pattern: /backdrop-/ },
  { rule: 'sombra predefinida', pattern: util(String.raw`shadow-(?:sm|md|lg|xl|2xl|inner)`) },
  // `shadow-[ox_oy_blur_...]`: el tercer valor (desenfoque) debe ser 0.
  { rule: 'sombra con blur', pattern: util(String.raw`shadow-\[[^\]_]+_[^\]_]+_(?!0_)[^\]_]+_[^\]]*\]`) },
  { rule: 'font-display', pattern: util('font-display') },
  { rule: 'text-white', pattern: /text-white/ },
  { rule: 'text-gray-N', pattern: /text-gray-\d/ },
  { rule: 'hex literal', pattern: /#[0-9a-fA-F]{3,8}(?![\w-])/ },
  { rule: 'texto eva-primary/gray-dim', pattern: /text-eva-(?:primary|gray-dim)(?![\w-])/ },
  { rule: 'nombre de color de acento', pattern: /eva-(?:orange|purple|green|red|violet|aqua|sky)(?![\w-])/ },
  { rule: 'animate-', pattern: util(String.raw`animate-[\w-]+`) },
  { rule: 'var(--brand) en JSX', pattern: /var\(--brand/ },
  {
    rule: 'color con variante de estado',
    pattern: util(String.raw`(?:hover|focus-visible|group-hover|group-focus-visible):(?:border-eva-|shadow-\[|bg-eva-|text-eva-)[\w/[\]().,-]*`),
  },
  { rule: 'hover translate sin motion-safe', pattern: withoutMotionSafe(String.raw`hover:-?translate-[xy]-[\w.]+`) },
  { rule: 'focus translate sin motion-safe', pattern: withoutMotionSafe(String.raw`focus-visible:-?translate-[xy]-[\w.]+`) },
  { rule: 'active translate sin motion-safe', pattern: withoutMotionSafe(String.raw`active:-?translate-[xy]-[\w.]+`) },
]

test('Contact.jsx: sin clases cyberpunk ni utilidades prohibidas', () => {
  assert.deepEqual(findForbiddenTokens(CONTACT, FORBIDDEN_RULES), [])
})

test('guard de Contact: las reglas detectan la sección cyberpunk anterior (triangulación)', () => {
  const vieja = `<section className="cyber-grid overflow-hidden"><div className="animate-glitch-line" style={{ boxShadow: "0 0 12px red" }} />
    <h2 className="font-display text-white"><GlitchText text="x" /></h2>
    <a className="rounded-lg border-dark-border hover:-translate-y-1 hover:box-glow-red text-red-500 text-accent-pink"><p className="truncate text-gray-400 shadow-lg backdrop-blur">`
  const reglas = new Set(findForbiddenTokens(vieja, FORBIDDEN_RULES).map((f) => f.rule))
  for (const regla of [
    'GlitchText', 'glitch', 'glow', 'cyber-grid', 'accent-*', 'dark', 'red-N', 'rounded', 'truncate', 'style inline',
    'backdrop-', 'sombra predefinida', 'font-display', 'text-white', 'text-gray-N', 'animate-',
    'hover translate sin motion-safe',
  ]) {
    assert.ok(reglas.has(regla), `la regla "${regla}" no detectó la sección vieja`)
  }
})

test('guard de Contact: sombras con blur se detectan y las sólidas no (triangulación)', () => {
  const blur = findForbiddenTokens('hover:shadow-[0_0_12px_var(--eva-orange)]', FORBIDDEN_RULES).map((f) => f.rule)
  assert.ok(blur.includes('sombra con blur'))
  const solida = 'shadow-[6px_6px_0_0_var(--eva-gray-dim)] active:shadow-none'
  assert.deepEqual(findForbiddenTokens(solida, FORBIDDEN_RULES), [])
})

test('guard de Contact: el color de hover/foco solo viene del CSS (colores con variante de estado y var(--brand) se detectan)', () => {
  for (const viejo of [
    'hover:border-eva-secondary',
    'focus-visible:shadow-[6px_6px_0_0_var(--eva-secondary)]',
    'group-hover:bg-eva-secondary',
    'group-focus-visible:text-eva-black',
  ]) {
    assert.deepEqual(findForbiddenTokens(viejo, FORBIDDEN_RULES).map((f) => f.rule), ['color con variante de estado'], viejo)
  }
  assert.deepEqual(findForbiddenTokens('text-[var(--brand)]', FORBIDDEN_RULES).map((f) => f.rule), ['var(--brand) en JSX'])
  assert.deepEqual(findForbiddenTokens('eva-channel eva-brand-accent active:shadow-none motion-safe:hover:-translate-y-0.5', FORBIDDEN_RULES), [])
})

test('guard de Contact: lo permitido no dispara reglas (font-eva-display, motion-safe)', () => {
  const ok = `<h2 className="font-eva-display font-stretch-condensed motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-x-0 motion-safe:focus-visible:-translate-x-0.5 border-eva-primary">`
  assert.deepEqual(findForbiddenTokens(ok, FORBIDDEN_RULES), [])
})

test('Contact.jsx: contiene los elementos requeridos', () => {
  const required = [
    'id="contacto"', '<h2', '<ul', 'font-eva-display', 'eva-stripes', 'eva-panel', 'aria-hidden', 'sr-only',
    'eva-channel', 'eva-channel-cta', 'eva-brand-accent', 'data-brand={channel.brand}', 'useReveal', 'eva-reveal',
    'buildContactChannels', 'resolveContactEmail', 'channelLinkProps', 'VITE_CONTACT_EMAIL',
  ]
  assert.deepEqual(required.filter((token) => !CONTACT.includes(token)), [])
})

// --- Jerarquía de color por rol (jerarquia-color-violeta, D4) ---

test('Contact.jsx: borde superior y franja ancha primary; eyebrow, flechas y ABRIR primary-light; hover secondary; estado tertiary', () => {
  const faltan = [
    'border-t-2 border-eva-primary',
    'eva-stripes eva-stripes-primary h-3',
    'tracking-[0.3em] text-eva-primary-light',
    'text-eva-primary-light">juntos?',
    'px-3 text-eva-primary-light sm:px-4',
    'px-3 font-mono text-xs font-bold uppercase tracking-[0.15em] text-eva-primary-light',
    'size-4 text-eva-secondary',
    'text-eva-tertiary',
    'inline-block size-2.5 bg-eva-tertiary',
  ].filter((token) => !CONTACT.includes(token))
  assert.deepEqual(faltan, [])
})

// --- pulido-post-auditoria: el código del encabezado sale de la barra ---

test('Contact.jsx toma el código del encabezado de HOME_NAV_LINKS, sin literal', async () => {
  const source = read('src/components/Contact.jsx')
  assert.doesNotMatch(source, /\b0[5-6] \{"\/\/"\}/)
  assert.match(source, /import\s*\{\s*HOME_NAV_LINKS\s*\}\s*from\s*["']\.\.\/utils\/homeNav["']/)
  assert.match(source, /HOME_NAV_LINKS\.find\(\(link\) => link\.id === "contacto"\)/)
  assert.match(source, /\{code\} \{"\/\/"\}/)
})

test('el código de Contacto en HOME_NAV_LINKS es el último de la barra y se arma con homeNavLinks', async () => {
  const { HOME_NAV_LINKS, homeNavLinks } = await import('../src/utils/homeNav.js')
  assert.equal(HOME_NAV_LINKS.at(-1).id, 'contacto')
  assert.equal(HOME_NAV_LINKS.at(-1).code, String(HOME_NAV_LINKS.length).padStart(2, '0'))
  assert.equal(homeNavLinks([{}]).at(-1).code, '06')
})

// --- Columnas equilibradas (change hero-escritura, D2) ---------------------

/**
 * Problemas de la grilla de canales que dejan un hueco bajo el último canal.
 * @param {string} source
 * @returns {string[]}
 */
function channelGridProblems(source) {
  const problems = []
  const ul = source.match(/<ul\b[^>]*>/)?.[0] ?? ''
  if (!/(?<![\w:-])content-start(?![\w-])/.test(ul)) problems.push('la lista perdió content-start (móvil)')
  for (const token of ['lg:auto-rows-fr', 'lg:content-stretch']) {
    if (!new RegExp(String.raw`(?<![\w:-])${token}(?![\w-])`).test(ul)) problems.push(`falta ${token} en la lista`)
  }
  if (/(?<![\w:-])auto-rows-fr(?![\w-])/.test(ul)) problems.push('auto-rows-fr sin prefijo lg: estira en móvil')
  const classes = source.match(/CHANNEL_CLASSES\s*=\s*\n?\s*"([^"]*)"/)?.[1] ?? ''
  if (!/(?<![\w:-])lg:h-full(?![\w-])/.test(classes)) problems.push('falta lg:h-full en los canales')
  return problems
}

test('Contact.jsx: los canales llenan el alto del panel solo desde lg', () => {
  assert.deepEqual(channelGridProblems(CONTACT), [])
})

test('channelGridProblems: rechaza el markup actual y la variante sin prefijo lg: (triangulación)', () => {
  const actual = `const CHANNEL_CLASSES =\n  "eva-channel relative flex min-h-[4.5rem]"\n<ul className="grid content-start gap-5 lg:col-span-7">`
  assert.equal(channelGridProblems(actual).length, 3)
  const sinPrefijo = `const CHANNEL_CLASSES = "eva-channel lg:h-full"\n<ul className="grid content-start auto-rows-fr lg:auto-rows-fr lg:content-stretch gap-5">`
  assert.deepEqual(channelGridProblems(sinPrefijo), ['auto-rows-fr sin prefijo lg: estira en móvil'])
  const bueno = `const CHANNEL_CLASSES = "eva-channel lg:h-full"\n<ul className="grid content-start gap-5 lg:auto-rows-fr lg:content-stretch lg:col-span-7">`
  assert.deepEqual(channelGridProblems(bueno), [])
})
