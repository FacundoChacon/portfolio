/**
 * Guard estático de "Quién soy" y "Testimonios": clases del sistema viejo
 * prohibidas, estructura accesible exigida y movimiento del cursor acotado.
 * Red de regresión sobre texto, no una medición en navegador.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { NAV_LINKS, navCode } from '../src/utils/siteNav.js'
import { ruleBody } from './lib/css-rules.mjs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const ABOUT = read('src/components/About.jsx')
const TESTIMONIALS = read('src/components/Testimonials.jsx')
const CSS = read('src/index.css')

const tokenize = (source) => source.split(/[\s"'`{}<>=]+/).filter(Boolean)

/** Reglas por token (se compara la utilidad sin variantes ni opacidad). */
const UTILITY_RULES = [
  { rule: 'accent/neon/dark', test: (u) => /(^|-)(accent|neon|dark)-/.test(u) },
  { rule: 'glow', test: (u) => /-glow-/.test(u) || /^(text|box)-glow/.test(u) },
  { rule: 'glitch', test: (u) => /glitch/i.test(u) },
  { rule: 'cyber-grid', test: (u) => u === 'cyber-grid' },
  { rule: 'rounded', test: (u) => /^rounded(-|$)/.test(u) },
  { rule: 'font-display (Orbitron)', test: (u) => u === 'font-display' },
  { rule: 'text-white', test: (u) => u === 'text-white' },
  { rule: 'text-gray-*', test: (u) => /^text-gray-\d+$/.test(u) },
  { rule: 'text-amber-*', test: (u) => /^text-amber-\d+$/.test(u) },
  { rule: 'hex literal', test: (u) => /(^|\[)#[0-9a-f]{3,8}\]?$/i.test(u) },
  { rule: 'reveal legacy', test: (u) => u === 'reveal' || u === 'reveal-bottom' },
]

/**
 * Problemas de estilo de una fuente JSX de sección.
 * @param {string} source
 * @returns {string[]} `regla: token`
 */
function findSectionViolations(source) {
  const found = []
  for (const token of tokenize(source)) {
    const base = token.replace(/\/\d+$/, '')
    const utility = base.split(':').pop()
    for (const { rule, test: matches } of UTILITY_RULES) {
      if (matches(utility)) found.push(`${rule}: ${token}`)
    }
    if (/(^|:)hover:/.test(base) || base.startsWith('hover:')) {
      if (/translate/.test(utility)) found.push(`hover translate: ${token}`)
    }
  }
  return found
}

/**
 * Etiquetas de apertura que contienen la clase `cls` como token.
 * @param {string} source
 * @param {string} cls
 * @returns {string[]}
 */
function openingTagsWith(source, cls) {
  return [...source.matchAll(/<[A-Za-z][^<>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => tokenize(tag).includes(cls))
}

test('findSectionViolations: detecta lo prohibido', () => {
  assert.deepEqual(findSectionViolations('<p className="text-accent-green">'), ['accent/neon/dark: text-accent-green'])
  assert.deepEqual(findSectionViolations('<p className="bg-dark-card/50 hover:box-glow-cyan">'), [
    'accent/neon/dark: bg-dark-card/50',
    'glow: hover:box-glow-cyan',
  ])
  assert.deepEqual(findSectionViolations('<div className="rounded-lg rounded-full">'), [
    'rounded: rounded-lg',
    'rounded: rounded-full',
  ])
  assert.deepEqual(findSectionViolations('<h2 className="font-display text-white text-gray-500 text-amber-400">'), [
    'font-display (Orbitron): font-display',
    'text-white: text-white',
    'text-gray-*: text-gray-500',
    'text-amber-*: text-amber-400',
  ])
  assert.deepEqual(findSectionViolations('<div className="reveal reveal-bottom cyber-grid bg-[#ff0000]">'), [
    'reveal legacy: reveal',
    'reveal legacy: reveal-bottom',
    'cyber-grid: cyber-grid',
    'hex literal: bg-[#ff0000]',
  ])
  assert.deepEqual(findSectionViolations('<GlitchText text="x" />'), ['glitch: GlitchText'])
  assert.deepEqual(findSectionViolations('<div className="hover:-translate-y-1 md:hover:translate-x-2">'), [
    'hover translate: hover:-translate-y-1',
    'hover translate: md:hover:translate-x-2',
  ])
})

test('findSectionViolations: acepta los tokens del sistema eva', () => {
  const ok =
    '<h2 id="quien-soy-titulo" className="font-eva-display font-stretch-condensed text-eva-paper text-eva-gray border-eva-line bg-eva-black eva-glass eva-reveal"><a href="#contenido">'
  assert.deepEqual(findSectionViolations(ok), [])
})

for (const [name, source] of [
  ['About.jsx', ABOUT],
  ['Testimonials.jsx', TESTIMONIALS],
]) {
  test(`${name}: sin clases de la estética anterior ni colores literales`, () => {
    assert.deepEqual(findSectionViolations(source), [])
  })

  test(`${name}: usa el cristal, la grilla hexagonal y el revelado del sistema`, () => {
    for (const cls of ['eva-glass', 'eva-hex-grid', 'eva-panel-label', 'eva-reveal']) {
      assert.ok(tokenize(source).includes(cls), `${name} no usa ${cls}`)
    }
    assert.match(source, /aria-labelledby=/)
  })

  test(`${name}: los códigos de panel son decorativos (aria-hidden)`, () => {
    for (const cls of ['eva-panel-label', 'eva-panel-code']) {
      for (const tag of openingTagsWith(source, cls)) {
        assert.match(tag, /aria-hidden/, `${name}: ${cls} sin aria-hidden -> ${tag}`)
      }
    }
  })

  test(`${name}: .eva-reveal va en los paneles, nunca en el contenedor del cristal`, () => {
    for (const tag of openingTagsWith(source, 'eva-reveal')) {
      assert.ok(tokenize(tag).includes('eva-glass'), `${name}: .eva-reveal sin .eva-glass en el mismo elemento -> ${tag}`)
    }
  })
}

test('About.jsx: ancla, lista accesible, código //02 de la barra y sin hover', () => {
  assert.match(ABOUT, /id="quien-soy"/)
  assert.match(ABOUT, /role="list"/)
  const link = NAV_LINKS.find((l) => l.id === 'quien-soy')
  assert.ok(link, 'NAV_LINKS sin quien-soy')
  assert.ok(ABOUT.includes(navCode(link.code)), `About.jsx no muestra ${navCode(link.code)}`)
  assert.ok(!/hover:/.test(ABOUT), 'los paneles estáticos no llevan hover')
})

test('Testimonials.jsx: ancla, return null con array vacío, sin GlitchText ni hover', () => {
  assert.match(TESTIMONIALS, /id="testimonios"/)
  assert.match(TESTIMONIALS, /testimonios\.length === 0\)?\s*return null/)
  assert.ok(!/GlitchText/.test(TESTIMONIALS), 'Testimonials.jsx no debe usar GlitchText')
  assert.ok(!/hover:/.test(TESTIMONIALS), 'los paneles estáticos no llevan hover')
  assert.ok(TESTIMONIALS.includes('//RX'), 'Testimonials.jsx sin código //RX')
})

test('Testimonials.jsx: useReveal se llama antes del return condicional', () => {
  assert.ok(TESTIMONIALS.indexOf('useReveal()') < TESTIMONIALS.indexOf('return null'))
})

test('index.css: el cursor parpadea solo sin preferencia de movimiento y pocas veces', () => {
  assert.match(CSS, /@keyframes eva-cursor-blink/)
  assert.ok(ruleBody(CSS, '.eva-cursor'), 'falta .eva-cursor')
  assert.ok(!/animation/.test(ruleBody(CSS, '.eva-cursor')), '.eva-cursor base no debe animar')
  const animated = ruleBody(CSS, '.eva-cursor', { within: '@media (prefers-reduced-motion: no-preference)' })
  assert.ok(animated, '.eva-cursor debe animar solo dentro de prefers-reduced-motion: no-preference')
  const m = /animation:[^;]*eva-cursor-blink[^;]*/.exec(animated)
  assert.ok(m, 'falta animation: eva-cursor-blink')
  assert.ok(!/infinite/.test(m[0]), 'el cursor no puede ser infinito')
  const count = /(?:^|\s)(\d+)\s*$/.exec(m[0].trim())
  assert.ok(count && Number(count[1]) <= 5, `iteraciones del cursor: ${m[0]}`)
})
