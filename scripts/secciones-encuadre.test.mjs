/**
 * Guard estático del change `secciones-encuadre`: anclaje uniforme (token de aire +
 * `scroll-margin` negativo), ritmo vertical común (`.eva-seccion`), Proyectos compacto
 * y Contacto como cierre. Red de regresión sobre texto: el encuadre real se mide
 * con Playwright (build + preview), no acá.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { ruleBody } from './lib/css-rules.mjs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const CSS = read('src/index.css')
const MD = '@media (min-width: 768px)'

const SECCIONES = ['About', 'Stack', 'Testimonials']

/** Valor (normalizado) de `prop` dentro del cuerpo de una regla, o `null`. */
function decl(body, prop) {
  if (body === null) return null
  const m = new RegExp(String.raw`(?:^|[;\s])${prop}\s*:\s*([^;]+)`).exec(body)
  return m ? m[1].replace(/\s+/g, ' ').trim() : null
}

/** Clases del `<section>` (primer `className` tras `<section`) de un componente. */
function clasesDeSeccion(source) {
  const m = /<section[^>]*?className=(?:"([^"]*)"|\{`([^`]*)`\})/s.exec(source)
  return m ? (m[1] ?? m[2]).split(/\s+/).filter(Boolean) : []
}

const PADDING_UTIL = /^(?:[a-z]+:)*(?:py|pt|pb)-/

/** Violaciones del marcado de sección común: sin `eva-seccion` o con utilidades de relleno vertical. */
function violacionesSeccion(source) {
  const clases = clasesDeSeccion(source)
  const out = []
  if (!clases.includes('eva-seccion')) out.push('falta eva-seccion')
  for (const c of clases) if (PADDING_UTIL.test(c)) out.push(c)
  return out
}

/** Márgenes de más de 2rem (`mt-10`, `mt-12`, `mt-14`...) entre encabezado y contenido. */
function margenesAnchos(source) {
  return [...source.matchAll(/\bmt-(10|12|14|16|20)\b/g)].map((m) => m[0])
}

// --- 2.1 CSS: token, anclaje y .eva-seccion ---------------------------------

test('index.css: :root define --eva-foco-aire', () => {
  assert.equal(decl(ruleBody(CSS, ':root'), '--eva-foco-aire'), '1rem')
})

test('index.css: html ancla con calc(var(--eva-nav-h) + var(--eva-foco-aire))', () => {
  assert.equal(
    decl(ruleBody(CSS, 'html'), 'scroll-padding-top'),
    'calc(var(--eva-nav-h) + var(--eva-foco-aire))',
  )
})

test('guard del anclaje: rechaza el 1rem literal anterior', () => {
  const viejo = 'html { scroll-padding-top: calc(var(--eva-nav-h) + 1rem); }'
  assert.equal(decl(ruleBody(viejo, 'html'), 'scroll-padding-top'), 'calc(var(--eva-nav-h) + 1rem)')
})

test('index.css: .eva-seccion anula el aire con scroll-margin negativo atado al token', () => {
  const body = ruleBody(CSS, '.eva-seccion')
  assert.notEqual(body, null, '.eva-seccion no existe')
  assert.equal(decl(body, 'scroll-margin-top'), 'calc(-1 * var(--eva-foco-aire))')
})

test('guard de scroll-margin: rechaza el -1rem literal', () => {
  const literal = '.eva-seccion { scroll-margin-top: -1rem; }'
  assert.equal(decl(ruleBody(literal, '.eva-seccion'), 'scroll-margin-top'), '-1rem')
})

test('index.css: .eva-seccion tiene 3rem de relleno vertical y 3.5rem desde 768px', () => {
  const movil = decl(ruleBody(CSS, '.eva-seccion'), 'padding-block')
  const md = decl(ruleBody(CSS, '.eva-seccion', { within: MD }), 'padding-block')
  assert.equal(movil, '3rem')
  assert.equal(md, '3.5rem')
  assert.ok(parseFloat(md) > parseFloat(movil) && parseFloat(md) <= 3.5)
})

test('guard del ritmo: rechaza padding-block de 6rem', () => {
  const css = '.eva-seccion { padding-block: 6rem; } @media (min-width: 768px) { .eva-seccion { padding-block: 6rem; } }'
  assert.equal(decl(ruleBody(css, '.eva-seccion'), 'padding-block'), '6rem')
  assert.equal(decl(ruleBody(css, '.eva-seccion', { within: MD }), 'padding-block'), '6rem')
})

// --- 2.3 JSX: Quién soy, Stack y Testimonios --------------------------------

for (const nombre of SECCIONES) {
  const source = read(`src/components/${nombre}.jsx`)

  test(`${nombre}.jsx: la sección usa eva-seccion y ningún py-/pt-/pb-`, () => {
    assert.deepEqual(violacionesSeccion(source), [])
  })

  test(`${nombre}.jsx: el contenido tras el encabezado usa mt-8 y no mt-10/12/14`, () => {
    assert.deepEqual(margenesAnchos(source), [])
    assert.match(source, /\bmt-8\b/)
  })
}

test('Hero.jsx: no usa eva-seccion', () => {
  assert.doesNotMatch(read('src/components/Hero.jsx'), /eva-seccion/)
})

test('guard de sección: rechaza el marcado anterior y una variante que conserva py-24', () => {
  assert.deepEqual(violacionesSeccion('<section id="a" className="relative border-t py-24">'), ['falta eva-seccion', 'py-24'])
  assert.deepEqual(violacionesSeccion('<section id="a" className="eva-seccion relative py-24">'), ['py-24'])
  assert.deepEqual(violacionesSeccion('<section id="a" className="eva-seccion relative md:pt-4">'), ['md:pt-4'])
  assert.deepEqual(violacionesSeccion('<section id="a" className="eva-seccion relative border-t">'), [])
})

test('guard de márgenes: rechaza mt-12 y acepta mt-8', () => {
  assert.deepEqual(margenesAnchos('<div className="mt-12 grid">'), ['mt-12'])
  assert.deepEqual(margenesAnchos('<div className="mt-8 grid">'), [])
})

// --- 3.1 Proyectos compacto --------------------------------------------------

test('index.css: .proyectos no tiene padding-block propio y conserva --por-vista', () => {
  const body = ruleBody(CSS, '.proyectos')
  assert.notEqual(body, null, '.proyectos no existe')
  assert.equal(decl(body, 'padding-block'), null)
  assert.equal(decl(body, '--por-vista'), '1')
  assert.equal(decl(body, '--proyectos-gap'), '1rem')
})

test('index.css: .proyectos-panel deja 2.5rem de relleno inferior', () => {
  assert.equal(decl(ruleBody(CSS, '.proyectos-panel'), 'padding'), '1rem 1rem 2.5rem')
})

test('guard de Proyectos: rechaza el CSS anterior (padding-block 5rem, relleno 4.5rem)', () => {
  const viejo = '.proyectos { --por-vista: 1; padding-block: 5rem; } .proyectos-panel { padding: 1rem 1rem 4.5rem; }'
  assert.equal(decl(ruleBody(viejo, '.proyectos'), 'padding-block'), '5rem')
  assert.equal(decl(ruleBody(viejo, '.proyectos-panel'), 'padding'), '1rem 1rem 4.5rem')
})

test('Projects.jsx: la sección usa eva-seccion y el panel va a mt-6', () => {
  const source = read('src/components/Projects.jsx')
  assert.deepEqual(violacionesSeccion(source), [])
  assert.match(source, /<div className="mt-6">\s*<PanelProyectos/)
  assert.deepEqual(margenesAnchos(source), [])
})

test('guard de Proyectos: rechaza el marcado anterior (sin eva-seccion, mt-10)', () => {
  assert.deepEqual(violacionesSeccion('<section id="proyectos" className="proyectos eva-hex-grid relative">'), ['falta eva-seccion'])
  assert.deepEqual(margenesAnchos('<div className="mt-10"><PanelProyectos />'), ['mt-10'])
})
