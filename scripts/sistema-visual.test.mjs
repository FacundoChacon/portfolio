/**
 * Guards estáticos del sistema visual (tokens, tipografías, foco, movimiento).
 * Mismo patrón que `a11y-classes.test.mjs`: leen archivos fuente, sin DOM.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

import tailwindConfig from '../tailwind.config.js'
import { EVA_COLORS } from '../src/styles/eva-tokens.js'

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8')
const colors = tailwindConfig.theme.extend.colors
const fonts = tailwindConfig.theme.extend.fontFamily

test('tailwind: expone la paleta eva igual a EVA_COLORS', () => {
  assert.deepEqual(colors.eva, EVA_COLORS)
})

test('tailwind: conserva los tokens anteriores con sus valores', () => {
  assert.equal(colors.accent.green, '#00ffc3')
  assert.equal(colors['accent'].pink, '#ff6eff')
  assert.equal(colors.accent['green-dark'], '#00cc9a')
  assert.equal(colors.accent['pink-dark'], '#cc3acc')
  assert.equal(colors.neon.cyan, '#00ffc3')
  assert.equal(colors.neon.magenta, '#ff6eff')
  assert.deepEqual(colors.dark, { DEFAULT: '#030303', secondary: '#0A0A0A', card: '#111116', border: '#1A1A22' })
  assert.deepEqual(colors.muted, { DEFAULT: '#1A1A22', foreground: '#9ca3af' })
})

test('tailwind: eva-display es Noto Serif Display y sans/display/mono no cambian', () => {
  assert.deepEqual(fonts['eva-display'], ['"Noto Serif Display"', 'Georgia', 'serif'])
  assert.deepEqual(fonts.sans, ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'])
  assert.deepEqual(fonts.display, ['Orbitron', 'Rajdhani', 'sans-serif'])
  assert.deepEqual(fonts.mono, ['JetBrains Mono', 'Fira Code', 'monospace'])
})

test('index.html no referencia Google Fonts', () => {
  const html = read('index.html')
  assert.doesNotMatch(html, /fonts\.googleapis\.com/)
  assert.doesNotMatch(html, /fonts\.gstatic\.com/)
})

test('fonts.css: declara las cuatro familias y solo archivos latin', () => {
  assert.ok(existsSync(new URL('../src/styles/fonts.css', import.meta.url)), 'falta src/styles/fonts.css')
  const css = read('src/styles/fonts.css')
  for (const family of ['Noto Serif Display', 'JetBrains Mono', 'Orbitron', 'Rajdhani']) {
    assert.match(css, new RegExp(String.raw`font-family:\s*['"]${family}['"]`), `falta @font-face de ${family}`)
  }
  assert.match(css, /font-stretch:\s*62\.5% 100%/)
  assert.match(css, /font-weight:\s*100 900/)
  for (const weight of [400, 500, 600, 700]) assert.match(css, new RegExp(`rajdhani-latin-${weight}-normal`))
  for (const [, file] of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    assert.match(file, /-latin-/, `${file} no es subset latin`)
    assert.doesNotMatch(file, /latin-ext|cyrillic|greek|vietnamese/, file)
  }
  assert.doesNotMatch(css, /url\(\s*['"]?https?:/)
})

test('fonts.css: font-display swap en todos los @font-face', () => {
  const css = read('src/styles/fonts.css')
  const faces = css.match(/@font-face\s*{[^}]*}/g) ?? []
  assert.ok(faces.length >= 4)
  for (const face of faces) assert.match(face, /font-display:\s*swap/)
})

test('main.jsx importa fonts.css antes de index.css', () => {
  const main = read('src/main.jsx')
  const fonts = main.indexOf("./styles/fonts.css")
  const index = main.indexOf("./index.css")
  assert.ok(fonts >= 0 && index >= 0 && fonts < index)
})

// --- src/index.css: foco, movimiento, texturas y paneles ---

const css = () => read('src/index.css').replace(/\r\n/g, '\n')

/** Cuerpo (entre llaves balanceadas) del primer bloque que empieza con `header`, o null. */
function blockBody(source, header) {
  const start = source.indexOf(header)
  if (start < 0) return null
  const open = source.indexOf('{', start)
  let depth = 0
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1
    if (source[i] === '}') {
      depth -= 1
      if (depth === 0) return source.slice(open + 1, i)
    }
  }
  return null
}

test('index.css: scroll-behavior smooth solo dentro de prefers-reduced-motion: no-preference', () => {
  const source = css()
  const total = (source.match(/scroll-behavior:\s*smooth/g) ?? []).length
  const allowed = blockBody(source, '@media (prefers-reduced-motion: no-preference)')
  assert.ok(allowed, 'falta el bloque no-preference')
  assert.equal((allowed.match(/scroll-behavior:\s*smooth/g) ?? []).length, 1)
  assert.equal(total, 1, 'scroll-behavior: smooth fuera del bloque no-preference')
})

test(':focus-visible usa var(--eva-focus) y ya no el cian fijo', () => {
  const focus = blockBody(css(), ':focus-visible')
  assert.ok(focus, 'falta :focus-visible')
  assert.match(focus, /outline:\s*2px solid var\(--eva-focus\)/)
  assert.doesNotMatch(focus, /#00ffc3/i)
})

test('index.css: define --eva-focus y las variables --eva-* desde theme()', () => {
  const source = css()
  assert.match(source, /--eva-focus:\s*theme\('colors\.eva\.green'\)/)
  for (const token of ['black', 'panel', 'line', 'paper', 'gray', 'orange', 'red', 'purple', 'green']) {
    assert.match(source, new RegExp(String.raw`--eva-${token}:\s*theme\('colors\.eva\.${token}'\)`), token)
  }
})

test('.eva-reveal: oculto por defecto y visible/sin transición con movimiento reducido', () => {
  const source = css()
  assert.match(blockBody(source, '.eva-reveal {') ?? '', /opacity:\s*0/)
  assert.match(blockBody(source, '.eva-reveal.is-visible') ?? '', /opacity:\s*1/)
  const reduce = blockBody(source, '@media (prefers-reduced-motion: reduce)')
  const override = blockBody(reduce, '.eva-reveal')
  assert.ok(override, 'falta override de .eva-reveal en reduce')
  assert.match(override, /opacity:\s*1/)
  assert.match(override, /transition:\s*none/)
})

test('index.css: existen las utilidades de textura, panel y tag', () => {
  const source = css()
  for (const selector of ['.eva-hex-grid', '.eva-stripes', '.eva-stripes-red', '.eva-panel', '.eva-panel-label', '.eva-panel-code', '.eva-tag']) {
    assert.ok(source.includes(`${selector} {`) || source.includes(`${selector}::`) || source.includes(`${selector},`), `falta ${selector}`)
  }
})

test('.eva-hex-grid: decorativa (pointer-events none, detrás del texto) y con SVG data:', () => {
  const before = blockBody(css(), '.eva-hex-grid::before')
  assert.ok(before, 'falta .eva-hex-grid::before')
  assert.match(before, /pointer-events:\s*none/)
  assert.match(before, /z-index:\s*-1/)
  assert.match(before, /mask-image:\s*url\("data:image\/svg\+xml/)
})

test('index.css: ninguna textura pide recursos de otro origen', () => {
  assert.doesNotMatch(css(), /url\(\s*['"]?https?:/)
})

test('index.css: las utilidades de estiramiento tipográfico existen', () => {
  const source = css()
  assert.match(blockBody(source, '.font-stretch-condensed') ?? '', /font-stretch:\s*75%/)
  assert.match(blockBody(source, '.font-stretch-extra-condensed') ?? '', /font-stretch:\s*62\.5%/)
})

test('index.css: no se tocaron .reveal, .tag, .glass ni .cyber-grid', () => {
  const source = css()
  for (const selector of ['.reveal {', '.tag {', '.glass {', '.cyber-grid {']) assert.ok(source.includes(selector), selector)
})
