/**
 * Tests de la sección Stack neumórfica (change `stack-neumorfico-oscuro`):
 * datos (con su marca, change colores-de-marca-hover), contraste del material en reposo y hundido, y guards del CSS real.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { EVA_BRAND_COLORS, EVA_COLORS } from '../src/styles/eva-tokens.js'
import { STACK, moduleCode } from '../src/data/stack.js'
import { blendOver, CONTRAST_THRESHOLDS, contrastRatio } from './lib/contrast.mjs'
import { parseRgbAlpha, parseShadowColors, ruleBody } from './lib/css-rules.mjs'

// --- Datos (design D1) -----------------------------------------------------

const EXPECTED_STACK = [
  { name: 'Java 17', brand: 'java', glyph: 'Jv', category: 'Lenguaje' },
  { name: 'Spring Boot', brand: 'spring', glyph: 'Sp', category: 'Backend' },
  { name: 'React 18', brand: 'react', glyph: 'Re', category: 'Frontend' },
  { name: 'Tailwind CSS', brand: 'tailwind', glyph: 'Tw', category: 'Frontend' },
  { name: 'JavaScript', brand: 'javascript', glyph: 'Js', category: 'Lenguaje' },
  { name: 'MySQL', brand: 'mysql', glyph: 'Sql', category: 'Base de datos' },
  { name: 'Python', brand: 'python', glyph: 'Py', category: 'Lenguaje' },
  { name: 'Docker', brand: 'docker', glyph: 'Dk', category: 'DevOps' },
  { name: 'Git', brand: 'git', glyph: 'Git', category: 'Herramienta' },
  { name: 'REST API', brand: 'rest', glyph: 'Api', category: 'Backend' },
  { name: 'JWT', brand: 'jwt', glyph: 'Jwt', category: 'Seguridad' },
  { name: 'HTML5 / CSS3', brand: 'web', glyph: 'Web', category: 'Frontend' },
]

test('STACK: las 12 tecnologías actuales, en orden, con name/brand/glyph/category', () => {
  assert.deepEqual(STACK, EXPECTED_STACK)
})

test('STACK: cada tecnología tiene exactamente brand, category, glyph y name (sin hex propio)', () => {
  for (const tech of STACK) {
    assert.deepEqual(Object.keys(tech).sort(), ['brand', 'category', 'glyph', 'name'], tech.name)
  }
})

test('STACK: los nombres son únicos', () => {
  assert.equal(new Set(STACK.map((t) => t.name)).size, STACK.length)
})

test('moduleCode: código correlativo MOD-nn desde el índice 0', () => {
  assert.equal(moduleCode(0), 'MOD-01')
  assert.equal(moduleCode(9), 'MOD-10')
  assert.equal(moduleCode(11), 'MOD-12')
})

// --- Helper de CSS (design D6) ---------------------------------------------

const SAMPLE_CSS = `
@layer components {
  .a { color: red; }
  .a:hover { color: blue; }
  @media (hover: hover) and (pointer: fine) {
    .a:hover { color: green; border-color: rgb(1 2 3 / 0.5); }
    .b { margin: 0; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .a { transition: color 1s; }
  }
  .c { background-color: rgb(255 122 26 / 0.12); }
}
`

test('ruleBody: sin within devuelve el primer bloque fuera de at-rules de condición', () => {
  assert.match(ruleBody(SAMPLE_CSS, '.a'), /color: red/)
  assert.doesNotMatch(ruleBody(SAMPLE_CSS, '.a'), /transition/)
})

test('ruleBody: con within busca solo dentro de esa at-rule', () => {
  const body = ruleBody(SAMPLE_CSS, '.a:hover', { within: '@media (hover: hover) and (pointer: fine)' })
  assert.match(body, /color: green/)
  assert.doesNotMatch(body, /blue/)
  assert.match(ruleBody(SAMPLE_CSS, '.a', { within: '@media (prefers-reduced-motion: no-preference)' }), /transition/)
})

test('ruleBody: selector ausente o fuera del within devuelve null', () => {
  assert.equal(ruleBody(SAMPLE_CSS, '.zzz'), null)
  assert.equal(ruleBody(SAMPLE_CSS, '.b'), null)
  assert.equal(ruleBody(SAMPLE_CSS, '.c', { within: '@media (hover: hover) and (pointer: fine)' }), null)
})

test('ruleBody: el selector es exacto (".a" no casa ".a:hover" ni ".ab")', () => {
  assert.equal(ruleBody('.ab { x: 1 } .a:hover { y: 2 }', '.a'), null)
})

test('parseRgbAlpha: devuelve hex y alpha del primer rgb(r g b / a) de la propiedad', () => {
  assert.deepEqual(parseRgbAlpha('background-color: rgb(255 122 26 / 0.12); color: red', 'background-color'), {
    hex: '#ff7a1a',
    alpha: 0.12,
  })
  assert.equal(parseRgbAlpha('color: red', 'background-color'), null)
})

test('parseShadowColors: dos sombras externas con su alpha', () => {
  assert.deepEqual(
    parseShadowColors('-4px -4px 10px rgb(237 230 214 / 0.04), 4px 4px 10px rgb(5 5 5 / 0.7)'),
    [
      { hex: '#ede6d6', alpha: 0.04, inset: false },
      { hex: '#050505', alpha: 0.7, inset: false },
    ],
  )
})

test('parseShadowColors: reconoce inset', () => {
  assert.deepEqual(parseShadowColors('inset 4px 4px 8px rgb(5 5 5 / 0.7), inset -4px -4px 8px rgb(237 230 214 / 0.04)'), [
    { hex: '#050505', alpha: 0.7, inset: true },
    { hex: '#ede6d6', alpha: 0.04, inset: true },
  ])
})

// --- Contraste del material (design D3) ------------------------------------

const CSS = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const HOVER_MEDIA = '@media (hover: hover) and (pointer: fine)'
const NO_MOTION_MEDIA = '@media (prefers-reduced-motion: no-preference)'
const ratio2 = (value) => (Math.floor(value * 100) / 100).toFixed(2)

/**
 * Evalúa los pares de contraste del módulo en reposo y hundido. El peor caso
 * es la sombra a opacidad completa (cota superior de su desenfoque).
 * @param {{ lightAlpha: number, darkAlpha: number, insetLightAlpha: number, sunkBorder?: string, touchBorder?: string, accent?: string }} options
 *   `sunkBorder`: borde hundido (por defecto el naranja de respaldo); `touchBorder` y `accent`: borde y
 *   monograma de marca en relieve táctil / hundido (si se pasan, se evalúan sus pares)
 * @returns {string[]} errores legibles (estado, par, valor); vacío si todo cumple
 */
function evaluateNeu({ lightAlpha, darkAlpha, insetLightAlpha, sunkBorder, touchBorder, accent }) {
  const { paper, gray, orange, black, panel } = EVA_COLORS
  const sunkEdge = sunkBorder ?? orange
  const violetLight = EVA_COLORS['violet-light']
  const grayDim = EVA_COLORS['gray-dim']
  const ui = CONTRAST_THRESHOLDS.ui
  const text = CONTRAST_THRESHOLDS.normal
  const restLight = blendOver(paper, panel, lightAlpha)
  const restDark = blendOver(black, panel, darkAlpha)
  const sunkLight = blendOver(paper, black, insetLightAlpha)

  const pairs = [
    ['reposo', 'borde vs superficie', grayDim, panel, ui],
    ['reposo', 'borde vs fondo del módulo', grayDim, panel, ui],
    ['reposo', 'borde vs sombra clara', grayDim, restLight, ui],
    ['reposo', 'borde vs sombra oscura', grayDim, restDark, ui],
    ['reposo', 'texto paper vs fondo', paper, panel, text],
    ['reposo', 'texto gray vs fondo', gray, panel, text],
    ['reposo', 'texto violet-light vs fondo', violetLight, panel, text],
    ['hundido', 'borde vs superficie', sunkEdge, panel, ui],
    ['hundido', 'borde vs fondo del módulo', sunkEdge, black, ui],
    ['hundido', 'borde vs sombra interior clara', sunkEdge, sunkLight, ui],
    ['hundido', 'texto paper vs fondo', paper, black, text],
    ['hundido', 'texto gray vs fondo', gray, black, text],
    ['hundido', 'texto violet-light vs fondo', violetLight, black, text],
    ['hundido', 'texto paper vs sombra interior clara', paper, sunkLight, text],
    ['hundido', 'texto gray vs sombra interior clara', gray, sunkLight, text],
    ['hundido', 'texto violet-light vs sombra interior clara', violetLight, sunkLight, text],
  ]
  if (touchBorder) {
    pairs.push(
      ['táctil', 'borde vs superficie', touchBorder, panel, ui],
      ['táctil', 'borde vs sombra clara', touchBorder, restLight, ui],
      ['táctil', 'borde vs sombra oscura', touchBorder, restDark, ui],
    )
  }
  if (accent) {
    pairs.push(
      ['táctil', 'monograma vs caja del monograma', accent, black, text],
      ['hundido', 'monograma vs caja del monograma', accent, black, text],
    )
  }
  return pairs.flatMap(([state, pair, fg, bg, threshold]) => {
    const value = contrastRatio(fg, bg)
    return value >= threshold ? [] : [`${state}: ${pair} ${ratio2(value)} < ${threshold}`]
  })
}

test('evaluateNeu: los valores de diseño (4% / 70% / 4%) cumplen todos los pares', () => {
  assert.deepEqual(evaluateNeu({ lightAlpha: 0.04, darkAlpha: 0.7, insetLightAlpha: 0.04 }), [])
})

test('evaluateNeu: aclarar la sombra clara al 6% rompe el borde en reposo', () => {
  assert.deepEqual(evaluateNeu({ lightAlpha: 0.06, darkAlpha: 0.7, insetLightAlpha: 0.04 }), [
    'reposo: borde vs sombra clara 2.97 < 3',
  ])
})

test('evaluateNeu: subir la sombra oscura al 90% sigue cumpliendo', () => {
  assert.deepEqual(evaluateNeu({ lightAlpha: 0.04, darkAlpha: 0.9, insetLightAlpha: 0.04 }), [])
})

test('evaluateNeu: cada marca de Stack cumple borde hundido, borde táctil y monograma', () => {
  for (const tech of STACK) {
    const brand = EVA_BRAND_COLORS[tech.brand]
    assert.deepEqual(
      evaluateNeu({ lightAlpha: 0.04, darkAlpha: 0.7, insetLightAlpha: 0.04, sunkBorder: brand, touchBorder: brand, accent: brand }),
      [],
      tech.name,
    )
  }
})

test('evaluateNeu: el CSS3 oficial (#264DE4) como borde hundido nombra el par y su contraste', () => {
  const errors = evaluateNeu({ lightAlpha: 0.04, darkAlpha: 0.7, insetLightAlpha: 0.04, sunkBorder: '#264DE4' })
  assert.ok(errors.some((e) => e.startsWith('hundido: borde vs superficie 2.99')), errors.join(' | '))
})

test('evaluateNeu: con el naranja de respaldo sigue en verde (sin regresión del fallback)', () => {
  assert.deepEqual(evaluateNeu({ lightAlpha: 0.04, darkAlpha: 0.7, insetLightAlpha: 0.04, sunkBorder: EVA_COLORS.orange }), [])
})

test('el CSS real: sombras de reposo y hundido son paper/black y cumplen contraste', () => {
  const rest = ruleBody(CSS, '.eva-neu-module')
  assert.ok(rest, '.eva-neu-module no existe en src/index.css')
  const sunk = ruleBody(CSS, '.eva-neu-module:hover', { within: HOVER_MEDIA })
  assert.ok(sunk, '.eva-neu-module:hover no existe dentro de la media de hover')

  const shadow = (body) => parseShadowColors(/box-shadow:\s*([^;]+)/.exec(body)[1])
  const [restLight, restDark] = shadow(rest)
  const [sunkDark, sunkLight] = shadow(sunk)
  assert.deepEqual([restLight.hex, restDark.hex], [EVA_COLORS.paper, EVA_COLORS.black].map((c) => c.toLowerCase()))
  assert.deepEqual([sunkDark.hex, sunkLight.hex], [EVA_COLORS.black, EVA_COLORS.paper].map((c) => c.toLowerCase()))
  assert.ok(!restLight.inset && !restDark.inset, 'el relieve usa sombras externas')
  assert.ok(sunkDark.inset && sunkLight.inset, 'el hundido usa sombras interiores')

  assert.deepEqual(
    evaluateNeu({ lightAlpha: restLight.alpha, darkAlpha: restDark.alpha, insetLightAlpha: sunkLight.alpha }),
    [],
  )
})

// --- Guards del CSS del material (design D6) --------------------------------

/** Cuerpos de las reglas del material en cualquier contexto (para guards globales). */
const MATERIAL_RULES = [...CSS.matchAll(/(\.eva-neu-(?:surface|module)[^{,]*)\{([^}]*)\}/g)].map(([, selector, body]) => ({
  selector: selector.trim(),
  body,
}))

test('el :hover del módulo existe solo dentro de la media de puntero fino con hover', () => {
  assert.ok(ruleBody(CSS, '.eva-neu-module:hover', { within: HOVER_MEDIA }))
  assert.equal(ruleBody(CSS, '.eva-neu-module:hover'), null, ':hover fuera de la media query')
})

test('el borde cambia de gris (reposo) al color de marca (hundido, con naranja de respaldo) y los fondos son panel/black', () => {
  const rest = ruleBody(CSS, '.eva-neu-module')
  const sunk = ruleBody(CSS, '.eva-neu-module:hover', { within: HOVER_MEDIA })
  assert.match(rest, /border:\s*1px solid var\(--eva-gray-dim\)/)
  assert.match(sunk, /border-color:\s*var\(--brand, var\(--eva-secondary\)\)/)
  const accent = ruleBody(CSS, '.eva-neu-module:hover .eva-brand-accent', { within: HOVER_MEDIA })
  assert.match(accent ?? '', /color:\s*var\(--brand\)/)
  assert.match(rest, /background-color:\s*var\(--eva-panel\)/)
  assert.match(sunk, /background-color:\s*var\(--eva-black\)/)
  assert.match(ruleBody(CSS, '.eva-neu-surface'), /background-color:\s*var\(--eva-panel\)/)
})

test('el material no define estados :focus ni :active', () => {
  const offenders = MATERIAL_RULES.filter(({ selector }) => /:(focus|active)/.test(selector)).map((r) => r.selector)
  assert.deepEqual(offenders, [])
})

test('el material no usa transform en ningún estado', () => {
  const offenders = MATERIAL_RULES.filter(({ body }) => /transform/.test(body)).map((r) => r.selector)
  assert.deepEqual(offenders, [])
})

test('la transition del módulo solo existe bajo prefers-reduced-motion: no-preference', () => {
  assert.match(ruleBody(CSS, '.eva-neu-module', { within: NO_MOTION_MEDIA }), /transition:/)
  assert.doesNotMatch(ruleBody(CSS, '.eva-neu-module'), /transition/)
  assert.doesNotMatch(ruleBody(CSS, '.eva-neu-module:hover', { within: HOVER_MEDIA }), /transition/)
})

test('ruleBody: con varias at-rules iguales usa la que contiene el selector', () => {
  const css = '@media (x) { .p { a: 1 } } @media (x) { .q { b: 2 } }'
  assert.match(ruleBody(css, '.q', { within: '@media (x)' }), /b: 2/)
})

// --- Táctil: color de marca permanente en relieve (change colores-de-marca-hover, D3) ---

const TOUCH_MEDIA = '@media (hover: none), (pointer: coarse)'

test('táctil: borde y monograma en color de marca, sin tocar sombras ni fondo (siguen en relieve)', () => {
  const border = ruleBody(CSS, '.eva-neu-module[data-brand]', { within: TOUCH_MEDIA })
  assert.match(border ?? '', /border-color:\s*var\(--brand\)/)
  assert.doesNotMatch(border, /box-shadow|background-color/)
  const accent = ruleBody(CSS, '[data-brand] .eva-brand-accent', { within: TOUCH_MEDIA })
  assert.match(accent ?? '', /(^|[\s;])color:\s*var\(--brand\)/)
  assert.doesNotMatch(accent, /box-shadow|background-color/)
})

test('táctil: la regla dentro de la media de puntero fino no cuenta como táctil', () => {
  const movida = `@media (hover: hover) and (pointer: fine) { .eva-neu-module[data-brand] { border-color: var(--brand); } }`
  assert.equal(ruleBody(movida, '.eva-neu-module[data-brand]', { within: TOUCH_MEDIA }), null)
})
