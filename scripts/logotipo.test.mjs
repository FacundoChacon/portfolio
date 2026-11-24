/**
 * Tests del change `logo-eva`: colores del logotipo (tokens), geometria unica, serializador,
 * componente, favicon e icono tactil. Estilo del repo: `node:test` + guards estaticos + funciones puras.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import test from 'node:test'

import tailwindConfig from '../tailwind.config.js'
import {
  EVA_COLORS,
  EVA_LOGO_COLORS,
  EVA_ROLES,
  EVA_THEME_COLORS,
  brandBaseStyles,
  logoBaseStyles,
} from '../src/styles/eva-tokens.js'
import { checkContrastPairs } from './lib/contrast.mjs'

// --- Colores del logotipo como tokens (design D2) ---------------------------

test('EVA_LOGO_COLORS: claves exactas edge y fill con hex #rrggbb', () => {
  assert.deepEqual(Object.keys(EVA_LOGO_COLORS).sort(), ['edge', 'fill'])
  for (const [key, hex] of Object.entries(EVA_LOGO_COLORS)) assert.match(hex, /^#[0-9A-Fa-f]{6}$/, key)
})

test('EVA_LOGO_COLORS: ninguna clave esta en EVA_COLORS, EVA_THEME_COLORS ni EVA_ROLES', () => {
  for (const key of Object.keys(EVA_LOGO_COLORS)) {
    assert.ok(!(key in EVA_COLORS), `${key} en EVA_COLORS`)
    assert.ok(!(key in EVA_THEME_COLORS), `${key} en EVA_THEME_COLORS`)
    assert.ok(!(key in EVA_ROLES), `${key} en EVA_ROLES`)
  }
})

test('EVA_LOGO_COLORS: valores aprobados en el boceto', () => {
  assert.deepEqual(EVA_LOGO_COLORS, { fill: '#FFC21A', edge: '#F0381E' })
})

/**
 * Errores de contraste del logo: relleno (normal) y filo (ui) contra black y panel.
 * @param {{ fill: string, edge: string }} colors
 * @returns {string[]}
 */
function logoContrastErrors(colors) {
  const all = { ...EVA_COLORS, 'logo:fill': colors.fill, 'logo:edge': colors.edge }
  const pairs = ['black', 'panel'].flatMap((bg) => [
    { fg: 'logo:fill', bg, level: 'normal' },
    { fg: 'logo:edge', bg, level: 'ui' },
  ])
  return checkContrastPairs(all, pairs)
}

test('logoContrastErrors: colores oscuros fallan nombrando token, fondo y contraste', () => {
  const errors = logoContrastErrors({ fill: '#6B4F00', edge: '#5A1408' })
  assert.equal(errors.length, 4)
  for (const token of ['logo:fill', 'logo:edge']) {
    for (const bg of ['black', 'panel']) {
      assert.ok(errors.some((e) => e.startsWith(`${token} sobre ${bg}: `) && /< (4\.5|3) /.test(e)), `${token}/${bg}`)
    }
  }
})

test('logoContrastErrors: los colores reales cumplen (relleno >= 4.5, filo >= 3)', () => {
  assert.deepEqual(logoContrastErrors(EVA_LOGO_COLORS), [])
})

test('logoBaseStyles: expone --eva-logo-fill y --eva-logo-edge en :root', () => {
  assert.deepEqual(logoBaseStyles(), { ':root': { '--eva-logo-fill': '#FFC21A', '--eva-logo-edge': '#F0381E' } })
})

test('logoBaseStyles: usa el mapa inyectado', () => {
  assert.deepEqual(logoBaseStyles({ fill: '#111111', edge: '#222222' }), {
    ':root': { '--eva-logo-fill': '#111111', '--eva-logo-edge': '#222222' },
  })
})

test('tailwind.config.js: un plugin registra logoBaseStyles() y otro sigue con brandBaseStyles()', () => {
  const calls = []
  for (const plugin of tailwindConfig.plugins) {
    const fn = typeof plugin === 'function' ? plugin : plugin.handler
    fn({ addBase: (styles) => calls.push(JSON.stringify(styles)) })
  }
  assert.ok(calls.includes(JSON.stringify(logoBaseStyles())), 'falta logoBaseStyles()')
  assert.ok(calls.includes(JSON.stringify(brandBaseStyles())), 'falta brandBaseStyles()')
})

// --- Guard de hex del logo (design D2) --------------------------------------

const ROOT = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8')

/** Archivos `.js/.jsx/.css` bajo `dir` (relativo a la raiz del repo). */
function sourceFiles(dir) {
  return readdirSync(new URL(dir, ROOT)).flatMap((name) => {
    const path = `${dir}${name}`
    if (statSync(new URL(path, ROOT)).isDirectory()) return sourceFiles(`${path}/`)
    return /\.(js|jsx|css)$/.test(name) ? [path] : []
  })
}

/**
 * Archivos que contienen un hex del logo (sin distinguir mayusculas) fuera de la fuente unica.
 * @param {{ path: string, source: string }[]} files
 * @returns {string[]} errores que nombran el archivo
 */
function logoHexLeaks(files) {
  const hexes = Object.values(EVA_LOGO_COLORS).map((hex) => hex.toLowerCase())
  return files
    .filter(({ path }) => path !== 'src/styles/eva-tokens.js')
    .flatMap(({ path, source }) =>
      hexes.filter((hex) => source.toLowerCase().includes(hex)).map((hex) => `${path}: hex del logo ${hex} fuera de eva-tokens.js`),
    )
}

test('logoHexLeaks: los hex del logo solo viven en src/styles/eva-tokens.js', () => {
  const files = [...sourceFiles('src/'), 'index.html'].map((path) => ({ path, source: read(path) }))
  assert.ok(files.some(({ path }) => path === 'src/styles/eva-tokens.js'), 'el barrido no vio eva-tokens.js')
  assert.deepEqual(logoHexLeaks(files), [])
})

test('logoHexLeaks: un hex del logo en NavBrand.jsx (en cualquier caso) falla nombrando el archivo', () => {
  const sucio = [
    { path: 'src/components/NavBrand.jsx', source: '<path fill="#ffc21a" />' },
    { path: 'src/components/Hero.jsx', source: 'stroke="#F0381E"' },
    { path: 'src/styles/eva-tokens.js', source: "fill: '#FFC21A'" },
  ]
  const errores = logoHexLeaks(sucio)
  assert.equal(errores.length, 2)
  assert.ok(errores[0].startsWith('src/components/NavBrand.jsx'))
  assert.ok(errores[1].startsWith('src/components/Hero.jsx'))
})
