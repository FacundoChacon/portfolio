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
  visibleNavLinks,
} from '../src/utils/siteNav.js'
import { HOME_NAV_LINKS, homeNavLinks } from '../src/utils/homeNav.js'

test('navHref y navCode arman el ancla y el código de sistema', () => {
  assert.equal(navHref('proyectos'), '#proyectos')
  assert.equal(navHref('quien-soy'), '#quien-soy')
  assert.equal(navCode('03'), '//03')
  assert.equal(navCode(BRAND_CODE), '//00')
})

test('NAV_LINKS declara los 6 destinos en orden con códigos únicos 01..06', () => {
  assert.deepEqual(
    NAV_LINKS.map(({ id, label }) => [id, label]),
    [
      ['presentacion', 'Inicio'],
      ['quien-soy', 'Quién soy'],
      ['proyectos', 'Proyectos'],
      ['stack', 'Stack'],
      ['testimonios', 'Testimonios'],
      ['contacto', 'Contáctame'],
    ],
  )
  assert.deepEqual(NAV_LINKS.map((l) => l.code), ['01', '02', '03', '04', '05', '06'])
  assert.equal(NAV_HEIGHT_PX, 70)
})

test('visibleNavLinks sin ocultos devuelve los mismos enlaces (códigos declarados = calculados)', () => {
  assert.deepEqual(visibleNavLinks(NAV_LINKS, []), NAV_LINKS)
})

test('visibleNavLinks oculta testimonios y contacto pasa a 05', () => {
  const links = visibleNavLinks(NAV_LINKS, ['testimonios'])
  assert.equal(links.length, 5)
  assert.ok(!links.some((l) => l.id === 'testimonios'))
  assert.deepEqual(links.map((l) => l.code), ['01', '02', '03', '04', '05'])
  assert.equal(links.at(-1).id, 'contacto')
})

test('visibleNavLinks renumera sin huecos al ocultar un id del medio', () => {
  const links = visibleNavLinks(NAV_LINKS, ['quien-soy'])
  assert.deepEqual(
    links.map((l) => [l.id, l.code]),
    [
      ['presentacion', '01'],
      ['proyectos', '02'],
      ['stack', '03'],
      ['testimonios', '04'],
      ['contacto', '05'],
    ],
  )
})

test('visibleNavLinks ignora ids inexistentes y no muta NAV_LINKS', () => {
  const antes = structuredClone(NAV_LINKS)
  assert.deepEqual(visibleNavLinks(NAV_LINKS, ['no-existe']), NAV_LINKS)
  visibleNavLinks(NAV_LINKS, ['testimonios', 'stack'])
  assert.deepEqual(NAV_LINKS, antes)
})

const HOME_COMPONENTS = ['Hero', 'About', 'Projects', 'Stack', 'Contact', 'Testimonials']
  .map((name) => readFileSync(new URL(`../src/components/${name}.jsx`, import.meta.url), 'utf8'))
  .join('\n')

test('HOME_NAV_LINKS con los datos reales (sin testimonios) omite testimonios y termina en contacto 05', () => {
  assert.ok(!HOME_NAV_LINKS.some((l) => l.id === 'testimonios'))
  assert.deepEqual(HOME_NAV_LINKS.at(-1), { id: 'contacto', label: 'Contáctame', code: '05' })
  for (const { id } of HOME_NAV_LINKS) {
    assert.ok(HOME_COMPONENTS.includes(`id="${id}"`), `ningún componente de la home declara id="${id}"`)
  }
})

test('homeNavLinks con testimonios incluye testimonios 05 y contacto 06', () => {
  const links = homeNavLinks([{ nombre: 'Ana Pérez' }])
  assert.deepEqual(links.map((l) => [l.id, l.code]).slice(-2), [['testimonios', '05'], ['contacto', '06']])
  assert.equal(links.length, 6)
})

test('homeNavLinks con array vacío equivale a ocultar testimonios', () => {
  assert.deepEqual(homeNavLinks([]), visibleNavLinks(NAV_LINKS, ['testimonios']))
})

test('pickActiveSection devuelve la última sección en orden de documento (la que acaba de entrar)', () => {
  const order = NAV_LINKS.map((l) => l.id)
  const visibles = HOME_NAV_LINKS.map((l) => l.id)
  assert.equal(pickActiveSection(order, new Set()), null)
  assert.equal(pickActiveSection(order, new Set(['stack'])), 'stack')
  assert.equal(pickActiveSection(order, new Set(['stack', 'proyectos'])), 'stack')
  assert.equal(pickActiveSection(order, new Set(['proyectos', 'stack'])), 'stack')
  assert.equal(pickActiveSection(order, new Set(['testimonios'])), 'testimonios')
  assert.equal(pickActiveSection(visibles, new Set(['testimonios'])), null)
  assert.equal(pickActiveSection(visibles, new Set(['testimonios', 'contacto'])), 'contacto')
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
  for (const token of ['violet-light', 'paper', 'gray']) {
    const ratio = contrastRatio(EVA_COLORS[token], worst)
    assert.ok(ratio >= 4.5, `${token} sobre cristal: ${ratio.toFixed(2)} < 4.5`)
  }
})

test('con alpha 0.72 el violeta claro deja de ser legible (3.29: protege contra bajar el alpha)', () => {
  const worst = blendOver(EVA_COLORS.black, '#FFFFFF', 0.72)
  assert.ok(contrastRatio(EVA_COLORS['violet-light'], worst) < 4.5)
})
