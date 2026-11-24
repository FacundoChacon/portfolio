/**
 * Tests del change `colores-de-marca-hover`: mapa de colores de marca, su contraste,
 * `--brand` en la hoja de estilos, datos de Stack/Contacto y guards del CSS/JSX.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import tailwindConfig from '../tailwind.config.js'
import { EVA_BRAND_COLORS, EVA_COLORS, EVA_THEME_COLORS, brandBaseStyles } from '../src/styles/eva-tokens.js'
import { STACK } from '../src/data/stack.js'
import { buildContactChannels } from '../src/data/contacto.js'
import { blendOver, checkContrastPairs } from './lib/contrast.mjs'
import { ruleBody } from './lib/css-rules.mjs'

const BRAND_KEYS = [
  'java', 'spring', 'react', 'tailwind', 'javascript', 'mysql', 'python', 'docker',
  'git', 'rest', 'jwt', 'web', 'email', 'github', 'linkedin',
]

// --- Mapa central (design D1) -----------------------------------------------

test('EVA_BRAND_COLORS: exactamente las 15 claves de diseño, con hex #rrggbb', () => {
  assert.deepEqual(Object.keys(EVA_BRAND_COLORS).sort(), [...BRAND_KEYS].sort())
  for (const [key, hex] of Object.entries(EVA_BRAND_COLORS)) assert.match(hex, /^#[0-9A-Fa-f]{6}$/, key)
})

test('EVA_BRAND_COLORS: ninguna clave está en EVA_COLORS ni en EVA_THEME_COLORS', () => {
  for (const key of Object.keys(EVA_BRAND_COLORS)) {
    assert.ok(!(key in EVA_COLORS), `${key} en EVA_COLORS`)
    assert.ok(!(key in EVA_THEME_COLORS), `${key} en EVA_THEME_COLORS`)
  }
})

// --- Contraste (design D5) --------------------------------------------------

/**
 * Pares de contraste de un mapa de marcas: texto normal contra negro y panel, negro sobre
 * la marca (indicador invertido) y borde (ui) contra las composiciones del neumorfismo.
 * @param {Record<string, string>} brands
 * @returns {string[]} errores legibles
 */
function brandContrastErrors(brands) {
  const colors = {
    ...EVA_COLORS,
    restLight: blendOver(EVA_COLORS.paper, EVA_COLORS.panel, 0.04),
    restDark: blendOver(EVA_COLORS.black, EVA_COLORS.panel, 0.7),
    sunkLight: blendOver(EVA_COLORS.paper, EVA_COLORS.black, 0.04),
  }
  const pairs = []
  for (const [key, hex] of Object.entries(brands)) {
    colors[`brand:${key}`] = hex
    const fg = `brand:${key}`
    for (const bg of ['black', 'panel']) pairs.push({ fg, bg, level: 'normal' })
    pairs.push({ fg: 'black', bg: fg, level: 'normal' })
    for (const bg of ['restLight', 'restDark', 'sunkLight']) pairs.push({ fg, bg, level: 'ui' })
  }
  return checkContrastPairs(colors, pairs)
}

test('contraste de marca: los oficiales que fallan se reportan por nombre de marca', () => {
  const errors = brandContrastErrors({ mysql: '#4479A1', linkedin: '#0A66C2', web: '#264DE4' })
  for (const key of ['mysql', 'linkedin', 'web']) {
    assert.ok(errors.some((e) => e.includes(`brand:${key}`)), `no reportó ${key}`)
  }
})

test('contraste de marca: EVA_BRAND_COLORS cumple todos los pares', () => {
  assert.deepEqual(brandContrastErrors(EVA_BRAND_COLORS), [])
})

test('contraste de marca: jwt (margen justo) pasa y un rojo más oscuro falla contra panel', () => {
  assert.deepEqual(brandContrastErrors({ jwt: EVA_BRAND_COLORS.jwt }), [])
  const errors = brandContrastErrors({ rojo: '#E8202A' })
  assert.ok(errors.some((e) => e.includes('brand:rojo sobre panel')), errors.join('\n'))
})

// --- brandBaseStyles (design D2) -------------------------------------------

test('brandBaseStyles: una regla [data-brand] con --brand por cada marca', () => {
  const styles = brandBaseStyles()
  assert.deepEqual(Object.keys(styles).sort(), BRAND_KEYS.map((k) => `[data-brand="${k}"]`).sort())
  for (const [key, hex] of Object.entries(EVA_BRAND_COLORS)) {
    assert.deepEqual(styles[`[data-brand="${key}"]`], { '--brand': hex })
  }
})

test('brandBaseStyles: con un mapa inyectado solo emite esas claves', () => {
  assert.deepEqual(brandBaseStyles({ foo: '#123456' }), { '[data-brand="foo"]': { '--brand': '#123456' } })
})

test('brandBaseStyles: una clave insegura lanza un error que la nombra', () => {
  for (const key of ['a"]{x', 'Java', '1x', '']) {
    assert.throws(() => brandBaseStyles({ [key]: '#123456' }), (error) => error.message.includes(JSON.stringify(key)), key)
  }
})

test('tailwind.config.js: un plugin registra brandBaseStyles() con addBase', () => {
  const calls = []
  for (const plugin of tailwindConfig.plugins) {
    const fn = typeof plugin === 'function' ? plugin : plugin.handler
    fn({ addBase: (styles) => calls.push(styles) })
  }
  assert.ok(calls.some((styles) => JSON.stringify(styles) === JSON.stringify(brandBaseStyles())))
})

// --- Datos (design D1) ------------------------------------------------------

/** Referencias de marca que no existen en el mapa. */
const unknownBrands = (items, map) => items.filter((item) => !(item.brand in map)).map((item) => item.name ?? item.id)
/** Marcas del mapa que no se usan exactamente una vez entre las referencias. */
const brandsNotUsedOnce = (refs, map) => Object.keys(map).filter((key) => refs.filter((r) => r === key).length !== 1)

const CHANNELS = buildContactChannels('x@y.co')

test('datos: cada tecnología de Stack y cada canal apuntan a una marca existente', () => {
  assert.deepEqual(unknownBrands(STACK, EVA_BRAND_COLORS), [])
  assert.deepEqual(unknownBrands(CHANNELS, EVA_BRAND_COLORS), [])
})

test('datos: sin hex en stack.js ni contacto.js', () => {
  for (const file of ['src/data/stack.js', 'src/data/contacto.js']) {
    assert.doesNotMatch(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), /#[0-9a-fA-F]{6}\b/, file)
  }
})

test('datos: cada marca del mapa se usa exactamente una vez entre Stack y Contacto', () => {
  const refs = [...STACK, ...CHANNELS].map((item) => item.brand)
  assert.deepEqual(brandsNotUsedOnce(refs, EVA_BRAND_COLORS), [])
})

test('datos (detector): una marca huérfana o una referencia a "nope" se detectan', () => {
  const refs = [...STACK, ...CHANNELS].map((item) => item.brand)
  assert.deepEqual(brandsNotUsedOnce(refs, { ...EVA_BRAND_COLORS, whatsapp: '#25D366' }), ['whatsapp'])
  assert.deepEqual(unknownBrands([{ name: 'X', brand: 'nope' }], EVA_BRAND_COLORS), ['X'])
})

// --- CSS de estados (design D3, D4) -----------------------------------------

const CSS = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const TOUCH_MEDIA = '@media (hover: none), (pointer: coarse)'
const NO_MOTION_MEDIA = '@media (prefers-reduced-motion: no-preference)'
const HOVER_MEDIA = '@media (hover: hover) and (pointer: fine)'

/** Estados del canal que se enciende (hover y foco de teclado), sin media de puntero. */
const CHANNEL_STATES = [':hover', ':focus-visible']

test('canal: hover y foco-visible ponen borde y sombra sólida de marca, fuera de toda media', () => {
  for (const state of CHANNEL_STATES) {
    const body = ruleBody(CSS, `.eva-channel${state}`)
    assert.match(body ?? '', /border-color:\s*var\(--brand\)/, state)
    assert.match(body, /box-shadow:\s*6px 6px 0 0 var\(--brand\)/, state)
  }
})

test('canal: hover y foco-visible colorean el ícono y invierten el indicador', () => {
  for (const state of CHANNEL_STATES) {
    const accent = ruleBody(CSS, `.eva-channel${state} .eva-brand-accent`)
    assert.match(accent ?? '', /(^|[\s;])color:\s*var\(--brand\)/, state)
    const cta = ruleBody(CSS, `.eva-channel${state} .eva-channel-cta`)
    assert.match(cta ?? '', /background-color:\s*var\(--brand\)/, state)
    assert.match(cta, /(^|[\s;])color:\s*var\(--eva-black\)/, state)
  }
})

test('foco: el :focus-visible global conserva el anillo del sistema y el del canal no está en una media de puntero', () => {
  const global = ruleBody(CSS, ':focus-visible')
  assert.match(global ?? '', /outline:\s*2px solid var\(--eva-focus\)/)
  assert.match(global, /outline-offset:\s*2px/)
  assert.doesNotMatch(global, /--brand/)
  assert.ok(ruleBody(CSS, '.eva-channel:focus-visible'))
  assert.equal(ruleBody(CSS, '.eva-channel:focus-visible', { within: HOVER_MEDIA }), null)
})

test('foco (detector): un foco dentro de la media de hover o con outline de marca se detecta', () => {
  const enMedia = '@media (hover: hover) and (pointer: fine) { .eva-channel:focus-visible { border-color: var(--brand); } }'
  assert.equal(ruleBody(enMedia, '.eva-channel:focus-visible'), null)
  const conMarca = ':focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }'
  assert.doesNotMatch(ruleBody(conMarca, ':focus-visible'), /outline:\s*2px solid var\(--eva-focus\)/)
})

test('táctil: el canal muestra el borde de marca sin sombra (la sombra sigue siendo indicador de estado)', () => {
  const body = ruleBody(CSS, '.eva-channel[data-brand]', { within: TOUCH_MEDIA })
  assert.match(body ?? '', /border-color:\s*var\(--brand\)/)
  assert.doesNotMatch(body, /box-shadow/)
})

// --- Movimiento reducido (design D3) ----------------------------------------

test('movimiento: la transición del acento y del indicador solo existe bajo no-preference', () => {
  for (const selector of ['.eva-brand-accent', '.eva-channel-cta']) {
    const animated = ruleBody(CSS, selector, { within: NO_MOTION_MEDIA })
    assert.match(animated ?? '', /transition:[^;]*color/, selector)
    assert.equal(ruleBody(CSS, selector), null, `${selector} fuera de la media`)
  }
})

test('movimiento: ninguna regla de marca declara transition ni animation fuera de no-preference', () => {
  const brandSelectors = [
    ['.eva-neu-module:hover .eva-brand-accent', HOVER_MEDIA],
    ['.eva-neu-module[data-brand]', TOUCH_MEDIA],
    ['[data-brand] .eva-brand-accent', TOUCH_MEDIA],
    ['.eva-channel[data-brand]', TOUCH_MEDIA],
    ['.eva-channel:hover', undefined],
    ['.eva-channel:focus-visible', undefined],
    ['.eva-channel:hover .eva-brand-accent', undefined],
    ['.eva-channel:hover .eva-channel-cta', undefined],
  ]
  for (const [selector, within] of brandSelectors) {
    const body = ruleBody(CSS, selector, within ? { within } : {})
    assert.ok(body, `falta ${selector}`)
    assert.doesNotMatch(body, /transition|animation/, selector)
  }
})

test('movimiento (detector): una transición del acento fuera de no-preference se detecta', () => {
  const mala = '.eva-brand-accent { transition: color 200ms; }'
  assert.equal(ruleBody(mala, '.eva-brand-accent', { within: NO_MOTION_MEDIA }), null)
  assert.match(ruleBody(mala, '.eva-brand-accent'), /transition/)
})
