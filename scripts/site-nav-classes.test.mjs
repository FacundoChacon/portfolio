/**
 * Guard estático de la barra de navegación: clases y estilos prohibidos/exigidos
 * en `SiteNav.jsx`, `NavBrand.jsx`, las páginas y `src/index.css`. Red de
 * regresión sobre texto, no una medición en navegador.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { NAV_HEIGHT_PX } from '../src/utils/siteNav.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const CSS = read('src/index.css')

test('index.css: .eva-nav-glass tiene respaldo opaco con @supports not', () => {
  assert.match(
    CSS,
    /@supports not \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)\s*\{\s*\.eva-nav-glass\s*\{[^}]*background-color:\s*var\(--eva-black\)/,
  )
})

test('index.css: scroll-padding-top usa --eva-nav-h y coincide con NAV_HEIGHT_PX', () => {
  assert.match(CSS, /scroll-padding-top:\s*calc\(var\(--eva-nav-h\)/)
  const m = /--eva-nav-h:\s*(\d+)px/.exec(CSS)
  assert.ok(m, '--eva-nav-h no definido en px')
  assert.equal(Number(m[1]), NAV_HEIGHT_PX)
})

const NAV_FILES = ['src/components/SiteNav.jsx', 'src/components/NavBrand.jsx']

const tokenize = (source) => source.split(/[\s"'`{}<>=]+/).filter(Boolean)

/**
 * Problemas de estilo en una fuente JSX de la barra: clases del sistema viejo,
 * radios, hex literales y traslación en hover sin `motion-safe:`.
 * @param {string} source
 * @returns {string[]}
 */
function findStyleViolations(source) {
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

test('findStyleViolations: detecta lo prohibido y acepta lo permitido', () => {
  assert.deepEqual(findStyleViolations('<a className="text-accent-green">'), ['text-accent-green'])
  assert.deepEqual(findStyleViolations('<a className="box-glow-cyan text-glow-cyan">'), ['box-glow-cyan', 'text-glow-cyan'])
  assert.deepEqual(findStyleViolations('<a className="rounded-md rounded">'), ['rounded-md', 'rounded'])
  assert.deepEqual(findStyleViolations('<a className="border-neon-blue">'), ['border-neon-blue'])
  assert.deepEqual(findStyleViolations('<a style={{ color: "#fff" }} className="bg-[#ff0000]">'), ['#fff', 'bg-[#ff0000]'])
  assert.deepEqual(findStyleViolations('<a href="#contenido" className="bg-eva-primary">'), [])
  assert.deepEqual(findStyleViolations('<a className="hover:-translate-x-0.5">'), ['hover:-translate-x-0.5'])
  assert.deepEqual(
    findStyleViolations('<a className="motion-safe:hover:-translate-x-0.5 border-eva-primary font-eva-display">'),
    [],
  )
})

/**
 * Atributos/identificadores exigidos que faltan en `source`.
 * @param {string} source
 * @param {(string|RegExp)[]} required
 * @returns {string[]}
 */
function findMissing(source, required) {
  return required.filter((r) => (r instanceof RegExp ? !r.test(source) : !source.includes(r))).map(String)
}

test('findMissing: lista lo que falta', () => {
  assert.deepEqual(findMissing('aria-current aria-expanded', ['aria-current', 'menuKeyAction']), ['menuKeyAction'])
  assert.deepEqual(findMissing('id="contenido"', ['id="contenido"']), [])
})

test('SiteNav y NavBrand no usan estilos del sistema viejo ni hex literales', () => {
  for (const file of NAV_FILES) assert.deepEqual(findStyleViolations(read(file)), [], file)
})

test('SiteNav exige semántica, cristal, franja y salto al contenido', () => {
  assert.deepEqual(
    findMissing(read('src/components/SiteNav.jsx'), [
      'aria-current',
      'aria-expanded',
      'aria-controls="mobile-nav"',
      'menuKeyAction',
      'eva-nav-glass',
      'eva-stripes',
      'href="#contenido"',
    ]),
    [],
  )
})

test('Home y Configurador tienen el destino id="contenido" enfocable', () => {
  for (const file of ['src/pages/Home.jsx', 'src/pages/Configurador.jsx']) {
    const source = read(file)
    assert.match(source, /<main[^>]*id="contenido"[^>]*tabIndex=\{-1\}[^>]*outline-none/s, file)
  }
})

test('Configurador usa NavBrand, el salto al contenido y la cabecera de cristal', () => {
  assert.deepEqual(
    findMissing(read('src/pages/Configurador.jsx'), [
      'NavBrand',
      'href="#contenido"',
      'eva-nav-glass',
      'eva-stripes',
      'border-eva-primary',
    ]),
    [],
  )
  assert.deepEqual(findStyleViolations(headerOf(read('src/pages/Configurador.jsx'))), [])
})

/** Fragmento del `<header>…</header>` de una página (el resto del configurador es de otro change). */
function headerOf(source) {
  const start = source.indexOf('<header')
  const end = source.indexOf('</header>')
  assert.ok(start !== -1 && end > start, 'no se encontró el <header>')
  return source.slice(start, end)
}

// --- jerarquia-color-violeta: la barra nombra roles ---

test('SiteNav: enlace activo, bordes, CTA y skip link en primary; hover duro en secondary', () => {
  const nav = read('src/components/SiteNav.jsx')
  assert.deepEqual(
    findMissing(nav, [
      'bg-eva-primary text-eva-black',
      'border-eva-primary',
      'border-eva-primary text-eva-primary-light hover:bg-eva-primary hover:text-eva-black',
      'focus:bg-eva-primary',
      'var(--eva-secondary)',
    ]),
    [],
  )
  assert.doesNotMatch(nav, /eva-orange|eva-purple|eva-green/)
})

test('NavBrand: el código //00 acompaña con el color secundario', () => {
  const brand = read('src/components/NavBrand.jsx')
  assert.match(brand, /tracking-\[0\.2em\] text-eva-secondary/)
  assert.doesNotMatch(brand, /eva-orange/)
})
