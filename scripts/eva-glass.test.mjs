/**
 * Material de cristal `.eva-glass` (`src/index.css`): helper de reglas CSS,
 * contraste en el peor caso y límites del material.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { EVA_COLORS } from '../src/styles/eva-tokens.js'
import { blendOver, contrastRatio } from './lib/contrast.mjs'
import { parseRgbAlpha, ruleBody } from './lib/css-rules.mjs'

// --- css-rules.mjs ----------------------------------------------------------

const SAMPLE = `
@layer components {
  .a { color: red; }
  .eva-x { background-color: rgb(16 14 12 / 0.8); backdrop-filter: blur(8px); }
  @supports not (backdrop-filter: blur(1px)) {
    .eva-x { background-color: var(--eva-panel); }
    .solo-dentro { color: blue; }
  }
}
.eva-x::before { background-color: rgb(255 122 26 / 0.12); }
/* .comentado { color: pink; } */
`

test('ruleBody: encuentra el primer bloque con ese selector exacto fuera de at-rules', () => {
  assert.match(ruleBody(SAMPLE, '.eva-x'), /rgb\(16 14 12 \/ 0\.8\)/)
  assert.match(ruleBody(SAMPLE, '.eva-x::before'), /0\.12/)
})

test('ruleBody: selector ausente o comentado devuelve null', () => {
  assert.equal(ruleBody(SAMPLE, '.no-existe'), null)
  assert.equal(ruleBody(SAMPLE, '.comentado'), null)
})

test('ruleBody: within restringe al bloque anidado en el at-rule', () => {
  assert.match(ruleBody(SAMPLE, '.eva-x', { within: '@supports not' }), /var\(--eva-panel\)/)
  assert.equal(ruleBody(SAMPLE, '.solo-dentro'), null)
  assert.match(ruleBody(SAMPLE, '.solo-dentro', { within: '@supports not' }), /blue/)
  assert.equal(ruleBody(SAMPLE, '.a', { within: '@supports not' }), null)
})

test('parseRgbAlpha: devuelve hex y alpha de rgb(r g b / a)', () => {
  assert.deepEqual(parseRgbAlpha('background-color: rgb(16 14 12 / 0.8);', 'background-color'), {
    hex: '#100e0c',
    alpha: 0.8,
  })
  assert.deepEqual(parseRgbAlpha('x: 1; border: 1px solid rgb(255 122 26 / 0.35)', 'border'), {
    hex: '#ff7a1a',
    alpha: 0.35,
  })
})

test('parseRgbAlpha: propiedad ausente o sin rgb devuelve null', () => {
  assert.equal(parseRgbAlpha('color: red;', 'background-color'), null)
  assert.equal(parseRgbAlpha('background-color: var(--eva-panel);', 'background-color'), null)
})

// --- Contraste del cristal --------------------------------------------------

const CSS = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

/** Texto normal exige 4.5; los gráficos (gray-dim), 3. */
const TEXT_TOKENS = ['paper', 'gray', 'orange', 'green']

/**
 * Evalúa el cristal contra el fondo realista (línea de la grilla hexagonal) y
 * el de estrés (naranja sólido). El brillo superficial va encima del tinte.
 * @param {{ alpha: number, sheen: number, hexAlpha: number }} params
 * @returns {string[]} errores legibles (vacío si todo cumple)
 */
function evaluateGlass({ alpha, sheen, hexAlpha }) {
  const backgrounds = {
    'línea hex': blendOver(EVA_COLORS.orange, EVA_COLORS.black, hexAlpha),
    'estrés naranja': EVA_COLORS.orange,
  }
  const errors = []
  for (const [name, behind] of Object.entries(backgrounds)) {
    const surface = blendOver(EVA_COLORS.paper, blendOver(EVA_COLORS.panel, behind, alpha), sheen)
    for (const token of TEXT_TOKENS) {
      const ratio = contrastRatio(EVA_COLORS[token], surface)
      if (ratio < 4.5) errors.push(`${token} sobre cristal (${name}): ${ratio.toFixed(2)} < 4.5`)
    }
    if (name === 'línea hex') {
      const ratio = contrastRatio(EVA_COLORS['gray-dim'], surface)
      if (ratio < 3) errors.push(`gray-dim sobre cristal (${name}): ${ratio.toFixed(2)} < 3`)
    }
  }
  return errors
}

test('evaluateGlass: los valores de diseño cumplen en ambos fondos', () => {
  assert.deepEqual(evaluateGlass({ alpha: 0.8, sheen: 0.04, hexAlpha: 0.12 }), [])
})

test('evaluateGlass: bajar la opacidad del tinte rompe el gris de estrés', () => {
  const errors = evaluateGlass({ alpha: 0.7, sheen: 0.04, hexAlpha: 0.12 })
  assert.ok(errors.some((e) => e.startsWith('gray sobre cristal (estrés naranja)')), errors.join(' | '))
})

test('evaluateGlass: subir el brillo superficial rompe el gris de estrés', () => {
  const errors = evaluateGlass({ alpha: 0.8, sheen: 0.06, hexAlpha: 0.12 })
  assert.ok(errors.some((e) => e.startsWith('gray sobre cristal (estrés naranja)')), errors.join(' | '))
})

test('index.css: .eva-glass usa tinte panel, brillo paper y grilla naranja, y cumple el contraste', () => {
  const glass = ruleBody(CSS, '.eva-glass')
  assert.ok(glass, '.eva-glass no existe en index.css')
  const tint = parseRgbAlpha(glass, 'background-color')
  assert.ok(tint, '.eva-glass sin background-color rgb(r g b / a)')
  assert.equal(tint.hex.toUpperCase(), EVA_COLORS.panel)
  const sheen = parseRgbAlpha(glass, 'background-image')
  assert.ok(sheen, '.eva-glass sin brillo rgb(r g b / a) en background-image')
  assert.equal(sheen.hex.toUpperCase(), EVA_COLORS.paper)
  const hexGrid = parseRgbAlpha(ruleBody(CSS, '.eva-hex-grid::before') ?? '', 'background-color')
  assert.ok(hexGrid, '.eva-hex-grid::before sin --eva-hex-color por defecto')
  assert.equal(hexGrid.hex.toUpperCase(), EVA_COLORS.orange)

  assert.deepEqual(evaluateGlass({ alpha: tint.alpha, sheen: sheen.alpha, hexAlpha: hexGrid.alpha }), [])
})

// --- Límites del material y respaldo ---------------------------------------

test('index.css: .eva-glass tiene desenfoque <= 12px y es estático', () => {
  const glass = ruleBody(CSS, '.eva-glass')
  assert.ok(glass, '.eva-glass no existe en index.css')
  const blur = /(?<![\w-])backdrop-filter:\s*blur\((\d+(?:\.\d+)?)px\)/.exec(glass)
  assert.ok(blur, '.eva-glass sin backdrop-filter: blur(Npx)')
  assert.ok(Number(blur[1]) <= 12, `blur ${blur[1]}px > 12px`)
  for (const forbidden of ['transition', 'transform', 'animation']) {
    assert.ok(!glass.includes(forbidden), `.eva-glass no debe declarar ${forbidden}`)
  }
})

test('index.css: .eva-glass tiene respaldo opaco con @supports not', () => {
  const fallback = ruleBody(CSS, '.eva-glass', { within: '@supports not' })
  assert.ok(fallback, 'falta .eva-glass dentro del @supports not de backdrop-filter')
  assert.match(fallback, /background-color:\s*var\(--eva-panel\)/)
  assert.match(fallback, /background-image:\s*none/)
})

test('index.css: el respaldo va después de la regla base (misma especificidad, gana el último)', () => {
  const base = CSS.indexOf('.eva-glass {')
  const supports = CSS.indexOf('@supports not ((backdrop-filter')
  const fallback = CSS.indexOf('.eva-glass {', supports)
  assert.ok(base !== -1 && supports !== -1 && fallback !== -1)
  assert.ok(base < fallback, 'la regla base de .eva-glass debe declararse antes del @supports not')
})

test('index.css: el @supports not cubre backdrop-filter con y sin prefijo y conserva la barra', () => {
  assert.match(
    CSS,
    /@supports not \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)/,
  )
  const navFallback = ruleBody(CSS, '.eva-nav-glass', { within: '@supports not' })
  assert.ok(navFallback, 'falta .eva-nav-glass dentro del @supports not')
  assert.match(navFallback, /background-color:\s*var\(--eva-black\)/)
})
