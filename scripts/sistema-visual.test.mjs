/**
 * Guards estáticos del sistema visual (tokens, tipografías, foco, movimiento).
 * Mismo patrón que `a11y-classes.test.mjs`: leen archivos fuente, sin DOM.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

import tailwindConfig from '../tailwind.config.js'
import { EVA_COLORS, EVA_FONT_SANS } from '../src/styles/eva-tokens.js'
import { checkContrastPairs } from './lib/contrast.mjs'

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8')
const colors = tailwindConfig.theme.extend.colors
const fonts = tailwindConfig.theme.extend.fontFamily

test('tailwind: expone la paleta eva igual a EVA_COLORS', () => {
  assert.deepEqual(colors.eva, EVA_COLORS)
})

test('tailwind: solo expone la paleta eva', () => {
  assert.deepEqual(Object.keys(colors), ['eva'])
})

test('tailwind: sans es la pila del sistema, sin display, y mono/eva-display no cambian', () => {
  assert.deepEqual(fonts.sans, EVA_FONT_SANS)
  assert.equal(EVA_FONT_SANS[0], 'system-ui')
  assert.equal(EVA_FONT_SANS.at(-1), 'sans-serif')
  assert.ok(EVA_FONT_SANS.every((f) => !/rajdhani|orbitron|^inter$/i.test(f)), 'la pila no nombra fuentes retiradas ni descargables')
  assert.ok(!('display' in fonts), 'no debe existir fontFamily.display')
  assert.deepEqual(Object.keys(fonts).sort(), ['eva-display', 'mono', 'sans'])
  assert.deepEqual(fonts['eva-display'], ['"Noto Serif Display"', 'Georgia', 'serif'])
  assert.deepEqual(fonts.mono, ['JetBrains Mono', 'Fira Code', 'monospace'])
})

test('index.html no referencia Google Fonts', () => {
  const html = read('index.html')
  assert.doesNotMatch(html, /fonts\.googleapis\.com/)
  assert.doesNotMatch(html, /fonts\.gstatic\.com/)
})

test('fonts.css: declara exactamente Noto Serif Display y JetBrains Mono, solo archivos latin', () => {
  assert.ok(existsSync(new URL('../src/styles/fonts.css', import.meta.url)), 'falta src/styles/fonts.css')
  const css = read('src/styles/fonts.css')
  const families = [...css.matchAll(/font-family:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
  assert.deepEqual(families, ['Noto Serif Display', 'JetBrains Mono'])
  assert.doesNotMatch(css, /rajdhani|orbitron/i)
  assert.match(css, /font-stretch:\s*62\.5% 100%/)
  assert.match(css, /font-weight:\s*100 900/)
  for (const [, file] of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    assert.match(file, /-latin-/, `${file} no es subset latin`)
    assert.doesNotMatch(file, /latin-ext|cyrillic|greek|vietnamese/, file)
  }
  assert.doesNotMatch(css, /url\(\s*['"]?https?:/)
})

test('fonts.css: font-display swap en todos los @font-face', () => {
  const css = read('src/styles/fonts.css')
  const faces = css.match(/@font-face\s*{[^}]*}/g) ?? []
  assert.equal(faces.length, 2)
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

test('index.css: no quedan selectores heredados ni keyframes cyberpunk', () => {
  const source = css()
  const legacy = [
    '.reveal', '.tag ', '.tag{', '.glass', '.cyber-grid', '.gradient-text', '.gradient-border', '.duotone-wrap',
    '.glow-', '.text-glow-', '.box-glow-', '.section-title', '.section-desc', '.animate-scan', '.animate-glitch',
    '@keyframes scan', '@keyframes glitch-',
  ]
  for (const selector of legacy) assert.ok(!source.includes(selector), `queda ${selector}`)
})

test('index.css: el bloque reduce solo nombra clases que existen', () => {
  const source = css()
  const reduce = blockBody(source, '@media (prefers-reduced-motion: reduce)') ?? ''
  const named = [...reduce.matchAll(/\.([\w-]+)/g)].map((m) => m[1])
  assert.ok(named.includes('eva-reveal'))
  for (const name of new Set(named)) {
    assert.ok(source.replace(reduce, '').includes(`.${name}`), `.${name} está en reduce pero no se define`)
  }
})

// --- Base global en la paleta eva (limpieza-cyberpunk, D4) ---

test('index.html: theme-color igual a EVA_COLORS.black y <body> en tokens eva', () => {
  const html = read('index.html')
  assert.match(html, new RegExp(`<meta name="theme-color" content="${EVA_COLORS.black}"`, 'i'))
  assert.match(html, /<body class="bg-eva-black text-eva-paper antialiased">/)
})

test('base global: selección (negro sobre naranja) y carga (gray sobre black) cumplen contraste', () => {
  const pairs = [
    { fg: 'black', bg: 'orange', level: 'ui' }, // ::selection
    { fg: 'gray', bg: 'black', level: 'normal' }, // LoadingFallback
    { fg: 'orange', bg: 'black', level: 'ui' }, // aro del LoadingFallback y hover del scrollbar
    { fg: 'gray-dim', bg: 'black', level: 'ui' }, // thumb del scrollbar
  ]
  assert.deepEqual(checkContrastPairs(EVA_COLORS, pairs), [])
})

test('index.css: body, scrollbar y ::selection usan variables eva sin hex ni rgba viejos', () => {
  const source = css()
  assert.match(blockBody(source, 'body {') ?? '', /@apply bg-eva-black text-eva-paper;/)
  assert.match(blockBody(source, '::-webkit-scrollbar-track') ?? '', /background:\s*var\(--eva-black\)/)
  const thumb = blockBody(source, '::-webkit-scrollbar-thumb {') ?? ''
  assert.match(thumb, /background:\s*var\(--eva-gray-dim\)/)
  assert.doesNotMatch(thumb, /border-radius/)
  assert.match(blockBody(source, '::-webkit-scrollbar-thumb:hover') ?? '', /background:\s*var\(--eva-orange\)/)
  assert.match(blockBody(source, 'html {') ?? '', /scrollbar-color:\s*var\(--eva-gray-dim\) var\(--eva-black\)/)
  const selection = blockBody(source, '::selection') ?? ''
  assert.match(selection, /background:\s*var\(--eva-orange\)/)
  assert.match(selection, /color:\s*var\(--eva-black\)/)
  for (const header of ['body {', '::-webkit-scrollbar-track', '::-webkit-scrollbar-thumb {', '::-webkit-scrollbar-thumb:hover', '::selection']) {
    assert.doesNotMatch(blockBody(source, header) ?? '', /#[0-9a-f]{3,6}\b|rgba?\(/i, header)
  }
})

test('App.jsx y Home.jsx: fondo y LoadingFallback en tokens eva', () => {
  const app = read('src/App.jsx')
  assert.match(app, /bg-eva-black/)
  assert.match(app, /border-eva-line border-t-eva-orange/)
  assert.match(app, /text-eva-gray/)
  assert.match(read('src/pages/Home.jsx'), /overflow-x-clip bg-eva-black outline-none/)
})
