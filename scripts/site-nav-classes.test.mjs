/**
 * Guard estático de la barra de navegación: clases y estilos prohibidos/exigidos
 * en `SiteNav.jsx`, `NavBrand.jsx`, las páginas y `src/index.css`. Red de
 * regresión sobre texto, no una medición en navegador.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { NAV_HEIGHT_PX } from '../src/utils/siteNav.js'
import { findStyleViolations } from './lib/class-guard.mjs'
import { ruleBody } from './lib/css-rules.mjs'

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

/**
 * Errores de `NavBrand.jsx` (change `logo-eva`): el glifo simple va ANTES de "FC" y no lo reemplaza.
 * @param {string} source
 * @returns {string[]}
 */
function navBrandLogoErrors(source) {
  const errors = []
  if (!/import\s+LogoEva\s+from\s+["']\.\/LogoEva["']/.test(source)) errors.push('no importa LogoEva')
  const glifo = source.indexOf('<LogoEva variante="simple"')
  const texto = source.search(/^\s*FC\s*$/m)
  if (glifo === -1) errors.push('no monta <LogoEva variante="simple"')
  else if (texto !== -1 && glifo > texto) errors.push('el glifo debe ir antes de FC')
  if (texto === -1) errors.push('el texto FC desaparecio')
  for (const requerido of ['navCode(BRAND_CODE)', 'tracking-[0.2em] text-eva-secondary', 'sr-only', ', ir al inicio', 'to="/"', 'font-eva-display']) {
    if (!source.includes(requerido)) errors.push(`falta ${requerido}`)
  }
  return errors
}

test('NavBrand monta el glifo simple junto a FC', () => {
  assert.deepEqual(navBrandLogoErrors(read('src/components/NavBrand.jsx')), [])
})

test('navBrandLogoErrors: sin glifo, glifo despues de FC, sin FC o sin sr-only fallan', () => {
  const real = read('src/components/NavBrand.jsx')
  assert.ok(navBrandLogoErrors(real.replace(/<LogoEva[^>]*\/>/, '')).includes('no monta <LogoEva variante="simple"'))
  const despues = real.replace(/ *<LogoEva[^>]*\/>\r?\n/, '').replace(/^(\s*FC\s*)$/m, '$1\n<LogoEva variante="simple" className="h-7 w-auto" />')
  assert.notEqual(despues, real)
  assert.ok(navBrandLogoErrors(despues).includes('el glifo debe ir antes de FC'))
  assert.ok(navBrandLogoErrors(real.replace(/^\s*FC\s*$/m, '')).includes('el texto FC desaparecio'))
  assert.ok(navBrandLogoErrors(real.replace('sr-only', 'hidden')).includes('falta sr-only'))
})

// --- pulido-post-auditoria: enlaces visibles y panel móvil ---

test('SiteNav consume HOME_NAV_LINKS (no NAV_LINKS) para enlaces y scroll-spy', () => {
  const nav = read('src/components/SiteNav.jsx')
  assert.match(nav, /import\s*\{\s*HOME_NAV_LINKS\s*\}\s*from\s*["']\.\.\/utils\/homeNav["']/)
  assert.match(nav, /SECTION_ORDER\s*=\s*HOME_NAV_LINKS\.map/)
  assert.equal((nav.match(/HOME_NAV_LINKS\.map\(/g) ?? []).length, 3, 'SECTION_ORDER + escritorio + móvil')
  assert.doesNotMatch(nav, /\bNAV_LINKS\b/)
})

/**
 * Problemas del panel móvil en un CSS: respaldo `100vh` antes de `100dvh`,
 * desplazamiento propio y contención del desplazamiento.
 * @param {string} css
 * @returns {string[]}
 */
function findMobileNavProblems(css) {
  const body = ruleBody(css, '.eva-mobile-nav')
  if (body === null) return ['falta .eva-mobile-nav']
  const found = []
  const vh = body.indexOf('max-height: calc(100vh - var(--eva-nav-h))')
  const dvh = body.indexOf('max-height: calc(100dvh - var(--eva-nav-h))')
  if (vh === -1) found.push('falta el respaldo max-height con 100vh')
  if (dvh === -1) found.push('falta max-height con 100dvh')
  if (vh !== -1 && dvh !== -1 && vh > dvh) found.push('100vh debe ir antes de 100dvh')
  if (!/overflow-y:\s*auto/.test(body)) found.push('falta overflow-y: auto')
  if (!/overscroll-behavior:\s*contain/.test(body)) found.push('falta overscroll-behavior: contain')
  return found
}

test('findMobileNavProblems: acepta el panel correcto y rechaza fixtures defectuosos', () => {
  const ok = '.eva-mobile-nav { max-height: calc(100vh - var(--eva-nav-h)); max-height: calc(100dvh - var(--eva-nav-h)); overflow-y: auto; overscroll-behavior: contain; }'
  assert.deepEqual(findMobileNavProblems(ok), [])
  const sinRespaldo = '.eva-mobile-nav { max-height: calc(100dvh - var(--eva-nav-h)); overflow-y: auto; overscroll-behavior: contain; }'
  assert.deepEqual(findMobileNavProblems(sinRespaldo), ['falta el respaldo max-height con 100vh'])
  const orden = '.eva-mobile-nav { max-height: calc(100dvh - var(--eva-nav-h)); max-height: calc(100vh - var(--eva-nav-h)); overflow-y: auto; overscroll-behavior: contain; }'
  assert.deepEqual(findMobileNavProblems(orden), ['100vh debe ir antes de 100dvh'])
  assert.deepEqual(findMobileNavProblems('.otra { color: red; }'), ['falta .eva-mobile-nav'])
})

test('index.css define .eva-mobile-nav acotado y desplazable', () => {
  assert.deepEqual(findMobileNavProblems(CSS), [])
})

test('SiteNav aplica .eva-mobile-nav al elemento #mobile-nav', () => {
  const nav = read('src/components/SiteNav.jsx')
  const start = nav.indexOf('id="mobile-nav"')
  assert.ok(start !== -1, 'no se encontró #mobile-nav')
  const tag = nav.slice(start, nav.indexOf('>', start))
  assert.ok(tag.includes('eva-mobile-nav'), 'el panel no usa la clase eva-mobile-nav')
})
