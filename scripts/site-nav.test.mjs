/**
 * Lógica pura de la barra de navegación (`src/utils/siteNav.js`) y legibilidad
 * del fondo de cristal (`.eva-nav-glass` en `src/index.css`).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { EVA_COLORS } from '../src/styles/eva-tokens.js'
import { blendOver, contrastRatio } from './lib/contrast.mjs'
import {
  BRAND_CODE,
  NAV_HEIGHT_PX,
  NAV_LINKS,
  menuKeyAction,
  navCode,
  navHref,
  pickActiveSection,
  sectionObserverOptions,
} from '../src/utils/siteNav.js'

test('navHref y navCode arman el ancla y el código de sistema', () => {
  assert.equal(navHref('proyectos'), '#proyectos')
  assert.equal(navHref('quien-soy'), '#quien-soy')
  assert.equal(navCode('03'), '//03')
  assert.equal(navCode(BRAND_CODE), '//00')
})

test('NAV_LINKS conserva los 5 destinos actuales en orden con códigos únicos 01..05', () => {
  assert.deepEqual(
    NAV_LINKS.map(({ id, label }) => [id, label]),
    [
      ['presentacion', 'Inicio'],
      ['quien-soy', 'Quién soy'],
      ['proyectos', 'Proyectos'],
      ['stack', 'Stack'],
      ['contacto', 'Contáctame'],
    ],
  )
  assert.deepEqual(NAV_LINKS.map((l) => l.code), ['01', '02', '03', '04', '05'])
  assert.equal(NAV_HEIGHT_PX, 70)
})

test('pickActiveSection devuelve la última sección en orden de documento (la que acaba de entrar)', () => {
  const order = NAV_LINKS.map((l) => l.id)
  assert.equal(pickActiveSection(order, new Set()), null)
  assert.equal(pickActiveSection(order, new Set(['stack'])), 'stack')
  assert.equal(pickActiveSection(order, new Set(['stack', 'proyectos'])), 'stack')
  assert.equal(pickActiveSection(order, new Set(['proyectos', 'stack'])), 'stack')
  assert.equal(pickActiveSection(order, new Set(['testimonios'])), null)
  assert.equal(pickActiveSection(order, new Set(['testimonios', 'contacto'])), 'contacto')
})

test('sectionObserverOptions arma la zona de lectura bajo la barra', () => {
  assert.deepEqual(sectionObserverOptions(70), { rootMargin: '-70px 0px -60% 0px', threshold: 0 })
  assert.deepEqual(sectionObserverOptions(48), { rootMargin: '-48px 0px -60% 0px', threshold: 0 })
})

test('menuKeyAction cierra solo con Escape y el menú abierto', () => {
  assert.equal(menuKeyAction('Escape', true), 'close')
  assert.equal(menuKeyAction('Escape', false), null)
  assert.equal(menuKeyAction('Enter', true), null)
  assert.equal(menuKeyAction('Tab', true), null)
})

test('blendOver compone el color sobre el fondo por canal sRGB', () => {
  assert.equal(blendOver('#050505', '#FFFFFF', 0.85), '#2b2b2b')
  assert.equal(blendOver('#050505', '#FFFFFF', 1), '#050505')
  assert.equal(blendOver('#050505', '#FFFFFF', 0), '#ffffff')
  assert.equal(blendOver('#ff0000', '#0000ff', 0.5), '#800080')
})

const CSS = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

/** Extrae `[r, g, b, a]` del primer `background-color: rgb(r g b / a)` de `.eva-nav-glass`. */
function glassColor(css) {
  const rule = /\.eva-nav-glass\s*\{([^}]*)\}/.exec(css)
  assert.ok(rule, '.eva-nav-glass no existe en index.css')
  const m = /background-color:\s*rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\s*\)/.exec(rule[1])
  assert.ok(m, '.eva-nav-glass sin background-color rgb(r g b / a)')
  return [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]
}

const toHex = ([r, g, b]) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`

test('el cristal es eva-black y los textos son legibles sobre el peor caso (blanco detrás)', () => {
  const [r, g, b, a] = glassColor(CSS)
  assert.equal(toHex([r, g, b]).toUpperCase(), EVA_COLORS.black)
  const worst = blendOver(EVA_COLORS.black, '#FFFFFF', a)
  for (const token of ['orange', 'paper', 'gray']) {
    const ratio = contrastRatio(EVA_COLORS[token], worst)
    assert.ok(ratio >= 4.5, `${token} sobre cristal: ${ratio.toFixed(2)} < 4.5`)
  }
})

test('con alpha 0.72 el naranja deja de ser legible (protege contra bajar el alpha)', () => {
  const worst = blendOver(EVA_COLORS.black, '#FFFFFF', 0.72)
  assert.ok(contrastRatio(EVA_COLORS.orange, worst) < 4.5)
})
