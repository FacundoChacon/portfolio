/**
 * Tests del hero brutalista (change `hero-brutalista`): datos puros, guard
 * estático de `Hero.jsx`, contraste y animación de entrada.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { EVA_COLORS } from '../src/styles/eva-tokens.js'
import tailwindConfig from '../tailwind.config.js'
import { findForbiddenTokens, withoutMotionSafe } from './lib/class-guard.mjs'
import { blendOver, checkContrastPairs, contrastRatio } from './lib/contrast.mjs'
import {
  ENLACES_PERFIL,
  FICHA,
  PERFIL,
  RETRATO,
  externalLinkProps,
  nombreCompleto,
} from '../src/data/presentacion.js'

const ROOT = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8')

/** Lee ancho/alto de un WebP (VP8, VP8L o VP8X) desde su cabecera. */
function webpSize(buffer) {
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF')
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP')
  const kind = buffer.toString('ascii', 12, 16)
  if (kind === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff }
  if (kind === 'VP8X') return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 }
  if (kind === 'VP8L') {
    const bits = buffer.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  throw new Error(`WebP desconocido: ${kind}`)
}

// --- Datos (design D1) ---------------------------------------------------

test('nombreCompleto: nombre y apellido reales', () => {
  assert.equal(nombreCompleto(PERFIL), 'Facundo Chacón')
})

test('nombreCompleto: triangula con otros nombres y recorta espacios', () => {
  assert.equal(nombreCompleto({ nombre: 'Ana', apellido: 'Gómez' }), 'Ana Gómez')
  assert.equal(nombreCompleto({ nombre: '  Ana ', apellido: ' Gómez  ' }), 'Ana Gómez')
  assert.equal(nombreCompleto({ nombre: 'Ana', apellido: '' }), 'Ana')
})

test('FICHA: ids y orden, con etiqueta y valor no vacíos', () => {
  assert.deepEqual(FICHA.map((fila) => fila.id), ['rol', 'stack', 'ubicacion', 'estado'])
  for (const fila of FICHA) {
    assert.ok(fila.etiqueta.trim() && fila.valor.trim(), `fila ${fila.id} incompleta`)
  }
})

test('FICHA: el estado es "ok" y lo dice con texto, no solo con tono', () => {
  const estado = FICHA.find((fila) => fila.id === 'estado')
  assert.equal(estado.tono, 'ok')
  assert.match(estado.valor, /operativo/i)
  assert.deepEqual(FICHA.filter((fila) => fila.tono).map((fila) => fila.id), ['estado'])
})

test('FICHA: el rol coincide con el del perfil', () => {
  assert.equal(FICHA.find((fila) => fila.id === 'rol').valor, PERFIL.rol)
})

test('ENLACES_PERFIL: GitHub y LinkedIn con https y ids únicos', () => {
  assert.deepEqual(ENLACES_PERFIL.map((e) => e.id), ['github', 'linkedin'])
  assert.equal(new Set(ENLACES_PERFIL.map((e) => e.id)).size, ENLACES_PERFIL.length)
  for (const { href, label } of ENLACES_PERFIL) {
    assert.ok(label.trim())
    assert.match(href, /^https:\/\//)
    assert.doesNotThrow(() => new URL(href))
  }
})

test('externalLinkProps: pestaña nueva sin acceso a la ventana de origen', () => {
  assert.deepEqual(externalLinkProps(), { target: '_blank', rel: 'noopener noreferrer' })
})

test('RETRATO: dimensiones iguales a la cabecera de public/profile.webp', () => {
  const { width, height } = webpSize(readFileSync(new URL('public/profile.webp', ROOT)))
  assert.deepEqual({ width: RETRATO.width, height: RETRATO.height }, { width, height })
  assert.equal(RETRATO.src, '/profile.webp')
  assert.match(RETRATO.alt, /Facundo Chacón/)
})

// --- Animación de entrada (design D7) --------------------------------------

test('tailwind: animation eva-boot usa evaBoot y dura <= 0.4s', () => {
  const animation = tailwindConfig.theme.extend.animation['eva-boot']
  assert.ok(animation, 'falta animation["eva-boot"]')
  assert.match(animation, /^evaBoot\s/)
  const seconds = Number(animation.match(/(\d*\.?\d+)s/)?.[1])
  assert.ok(seconds > 0 && seconds <= 0.4, `duración ${seconds}s fuera de (0, 0.4]`)
})

test('tailwind: el keyframe evaBoot solo anima clip-path (sin propiedades de layout)', () => {
  const frames = tailwindConfig.theme.extend.keyframes.evaBoot
  assert.ok(frames, 'falta keyframes.evaBoot')
  const props = new Set(Object.values(frames).flatMap((frame) => Object.keys(frame)))
  assert.deepEqual([...props], ['clip-path'])
})

test('tailwind: las animaciones cyberpunk ya no existen (limpieza-cyberpunk) y eva-boot se conserva', () => {
  const animation = tailwindConfig.theme.extend.animation
  for (const name of ['fade-in', 'slide-up', 'pulse-slow', 'flicker']) assert.ok(!(name in animation), `sobra ${name}`)
  assert.ok(animation['eva-boot'], 'falta eva-boot')
})

// --- Guard estático de Hero.jsx (design D10) -------------------------------

const HERO = read('src/components/Hero.jsx')

/** Token de utilidad con variantes opcionales (`md:`, `hover:`...). */
const util = (body) => new RegExp(String.raw`(?<![\w-])(?:[\w-]+:)*${body}(?![\w-])`)

const FORBIDDEN_RULES = [
  { rule: 'accent-*', pattern: util(String.raw`(?:bg|text|border|from|to|via|shadow|ring)-accent-[\w/]+`) },
  { rule: 'neon-*', pattern: /neon-/ },
  { rule: 'dark', pattern: util(String.raw`(?:bg|text|border|from|to|via)-dark(?:-\w+)?`) },
  { rule: 'glow', pattern: /glow/ },
  { rule: 'glitch', pattern: /glitch/i },
  { rule: 'flicker', pattern: /flicker/ },
  { rule: 'cyber-grid', pattern: /cyber-grid/ },
  { rule: 'blur-', pattern: util(String.raw`blur(?:-[\w[\]]+)?`) },
  { rule: 'backdrop-', pattern: /backdrop-/ },
  { rule: 'rounded', pattern: util(String.raw`rounded(?:-[\w[\]]+)?`) },
  { rule: 'font-display', pattern: util('font-display') },
  { rule: 'text-white', pattern: /text-white/ },
  { rule: 'text-gray-N', pattern: /text-gray-\d/ },
  { rule: 'hex literal', pattern: /#[0-9a-fA-F]{3,8}(?![\w-])/ },
  { rule: 'loading=lazy', pattern: /loading=["{'`]+lazy/ },
  { rule: 'order-', pattern: util(String.raw`order-[\w[\]-]+`) },
  { rule: '--eva-hex-color', pattern: /--eva-hex-color/ },
  { rule: 'texto eva-red/purple/gray-dim', pattern: /text-eva-(?:red|purple|gray-dim)(?![\w-])/ },
  { rule: 'animate sin motion-safe', pattern: withoutMotionSafe(String.raw`animate-[\w-]+`) },
  { rule: 'hover translate sin motion-safe', pattern: withoutMotionSafe(String.raw`hover:-?translate-[xy]-[\w.]+`) },
  { rule: 'focus translate sin motion-safe', pattern: withoutMotionSafe(String.raw`focus-visible:-?translate-[xy]-[\w.]+`) },
]

test('Hero.jsx: sin clases cyberpunk ni utilidades prohibidas', () => {
  assert.deepEqual(findForbiddenTokens(HERO, FORBIDDEN_RULES), [])
})

test('guard de Hero: las reglas detectan el hero cyberpunk anterior (triangulación)', () => {
  const viejo = `<div className="cyber-grid blur-[120px] rounded-lg bg-accent-green/20 box-glow-cyan order-2 md:order-1">
    <h1 className="font-display text-white animate-flicker"><img loading="lazy" /></h1>
    <a className="hover:-translate-y-0.5 text-gray-400">`
  const reglas = new Set(findForbiddenTokens(viejo, FORBIDDEN_RULES).map((f) => f.rule))
  for (const regla of [
    'accent-*', 'glow', 'flicker', 'cyber-grid', 'blur-', 'rounded', 'font-display', 'text-white',
    'text-gray-N', 'loading=lazy', 'order-', 'animate sin motion-safe', 'hover translate sin motion-safe',
  ]) {
    assert.ok(reglas.has(regla), `la regla "${regla}" no detectó el hero viejo`)
  }
})

test('guard de Hero: lo permitido no dispara reglas (font-eva-display, motion-safe)', () => {
  const ok = `<h1 className="font-eva-display font-stretch-extra-condensed motion-safe:animate-eva-boot motion-safe:hover:-translate-y-0.5 border-eva-orange">`
  assert.deepEqual(findForbiddenTokens(ok, FORBIDDEN_RULES), [])
})

test('Hero.jsx: contiene los elementos requeridos', () => {
  const required = [
    'id="presentacion"', 'font-eva-display', 'font-stretch-', 'whitespace-nowrap', 'eva-hex-grid', 'eva-stripes',
    'eva-panel-label', 'eva-panel-code', 'fetchpriority="high"', 'decoding="async"', 'aria-hidden', 'sr-only',
    'RETRATO', 'FICHA', 'ENLACES_PERFIL', 'externalLinkProps', 'nombreCompleto', 'motion-safe:',
  ]
  assert.deepEqual(required.filter((token) => !HERO.includes(token)), [])
  assert.equal((HERO.match(/<h1\b/g) ?? []).length, 1)
})

test('Hero.jsx: el retrato y el h1 no se animan ni se ocultan (candidatos a LCP)', () => {
  const img = HERO.match(/<img\b[\s\S]*?\/>/)?.[0] ?? ''
  const h1 = HERO.match(/<h1\b[^>]*>/)?.[0] ?? ''
  assert.ok(img && h1, 'faltan <img> o <h1>')
  for (const tag of [img, h1]) {
    assert.ok(!/animate-|opacity-0|invisible|hidden/.test(tag), `${tag.slice(0, 40)}... se anima u oculta`)
  }
})

test('Home.jsx: un único <h1> en los componentes montados', () => {
  const home = read('src/pages/Home.jsx')
  const names = [...home.matchAll(/import\s+\w+\s+from\s+['"]\.\.\/components\/(\w+)['"]/g)].map((m) => m[1])
  assert.ok(names.includes('Hero'))
  const total = names.reduce((n, name) => n + (read(`src/components/${name}.jsx`).match(/<h1\b/g) ?? []).length, 0)
  assert.equal(total, 1)
})

// --- Contraste (design D9) -------------------------------------------------

const HERO_CONTRAST_PAIRS = [
  { fg: 'paper', bg: 'black', level: 'normal' },
  { fg: 'gray', bg: 'black', level: 'normal' },
  { fg: 'orange', bg: 'black', level: 'normal' },
  { fg: 'black', bg: 'orange', level: 'normal' },
  { fg: 'paper', bg: 'panel', level: 'normal' },
  { fg: 'gray', bg: 'panel', level: 'normal' },
  { fg: 'green', bg: 'panel', level: 'normal' },
  { fg: 'orange', bg: 'panel', level: 'normal' },
  { fg: 'gray-dim', bg: 'black', level: 'ui' },
]

test('contraste: pares de colores del hero cumplen su umbral', () => {
  assert.deepEqual(checkContrastPairs(EVA_COLORS, HERO_CONTRAST_PAIRS), [])
})

test('contraste: un par que no cumple se informa (triangulación)', () => {
  assert.equal(checkContrastPairs(EVA_COLORS, [{ fg: 'gray-dim', bg: 'black', level: 'normal' }]).length, 1)
})

function hexGridAlpha() {
  const fallback = read('src/index.css').match(/--eva-hex-color,\s*rgb\(\s*255\s+122\s+26\s*\/\s*([\d.]+)\s*\)/)
  assert.ok(fallback, 'no se encontró el fallback de --eva-hex-color')
  return Number(fallback[1])
}

test('contraste: texto sobre la grilla hex (alpha leído de index.css) >= 4.5', () => {
  const grilla = blendOver(EVA_COLORS.orange, EVA_COLORS.black, hexGridAlpha())
  for (const token of ['paper', 'gray', 'orange']) {
    const ratio = contrastRatio(EVA_COLORS[token], grilla)
    assert.ok(ratio >= 4.5, `${token} sobre la grilla: ${ratio.toFixed(2)} < 4.5`)
  }
})

test('contraste: con alpha 0.6 el gris sobre la grilla falla (protege la opacidad)', () => {
  const grilla = blendOver(EVA_COLORS.orange, EVA_COLORS.black, 0.6)
  assert.ok(contrastRatio(EVA_COLORS.gray, grilla) < 4.5)
})
