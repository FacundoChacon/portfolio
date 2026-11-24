/**
 * Tests de las funciones puras de precarga de fuentes del build.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { readFileSync } from 'node:fs'

import { PRELOAD_FONT_STEMS, findFontAssets, fontPreloadTags, missingFontStems } from './lib/font-preload.mjs'

const readSrc = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const STEM = 'jetbrains-mono-latin-wght-normal'

test('findFontAssets: encuentra el asset con hash y devuelve la ruta absoluta', () => {
  const files = ['assets/index-abc.js', `assets/${STEM}-AbC123.woff2`, 'assets/noto-serif-display-latin-wdth-normal-Zzz.woff2']
  assert.deepEqual(findFontAssets(files, [STEM]), [`/assets/${STEM}-AbC123.woff2`])
})

test('findFontAssets: devuelve una ruta por stem, en el orden pedido', () => {
  const files = ['assets/b-latin-400-normal-H2.woff2', 'assets/a-latin-400-normal-H1.woff2']
  assert.deepEqual(findFontAssets(files, ['a-latin-400-normal', 'b-latin-400-normal']), [
    '/assets/a-latin-400-normal-H1.woff2',
    '/assets/b-latin-400-normal-H2.woff2',
  ])
})

test('findFontAssets: lanza nombrando el stem si falta', () => {
  assert.throws(() => findFontAssets(['assets/index-abc.js'], [STEM]), new RegExp(STEM))
})

test('findFontAssets: lanza si hay más de una coincidencia', () => {
  const files = [`assets/${STEM}-AAA.woff2`, `assets/${STEM}-BBB.woff2`]
  assert.throws(() => findFontAssets(files, [STEM]), /más de uno|repetid|ambig/i)
})

test('findFontAssets: no confunde latin con latin-ext ni .woff con .woff2', () => {
  const files = ['assets/jetbrains-mono-latin-ext-wght-normal-XYZ.woff2', `assets/${STEM}-AbC.woff`]
  assert.throws(() => findFontAssets(files, [STEM]), new RegExp(STEM))
  const ok = findFontAssets([...files, `assets/${STEM}-AbC.woff2`], [STEM])
  assert.deepEqual(ok, [`/assets/${STEM}-AbC.woff2`])
})

test('fontPreloadTags: descriptor de precarga de fuente sin manejadores on*', () => {
  const [tag] = fontPreloadTags(['/assets/x-1.woff2'])
  assert.deepEqual(tag, {
    tag: 'link',
    attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: '/assets/x-1.woff2', crossorigin: true },
    injectTo: 'head',
  })
  assert.ok(Object.keys(tag.attrs).every((name) => !/^on/i.test(name)))
})

test('fontPreloadTags: un descriptor por href y lista vacía sin tags', () => {
  assert.equal(fontPreloadTags(['/assets/a.woff2', '/assets/b.woff2']).length, 2)
  assert.deepEqual(fontPreloadTags([]), [])
})

test('PRELOAD_FONT_STEMS: la fuente precargada es la serif de títulos (Noto Serif Display)', () => {
  assert.deepEqual(PRELOAD_FONT_STEMS, ['noto-serif-display-latin-wdth-normal'])
})

const CSS = `@font-face { src: url(@fontsource-variable/x/files/noto-serif-display-latin-wdth-normal.woff2) format('woff2'); }
@font-face { src: url('./files/noto-serif-display-latin-ext-wdth-normal.woff2'); }`

test('missingFontStems: stem presente en un url() de fonts.css -> []', () => {
  assert.deepEqual(missingFontStems(CSS, ['noto-serif-display-latin-wdth-normal']), [])
})

test('missingFontStems: stem ausente -> [stem]; solo informa los ausentes', () => {
  assert.deepEqual(missingFontStems(CSS, ['jetbrains-mono-latin-wght-normal']), ['jetbrains-mono-latin-wght-normal'])
  assert.deepEqual(
    missingFontStems(CSS, ['noto-serif-display-latin-wdth-normal', 'otra-latin-400-normal']),
    ['otra-latin-400-normal'],
  )
})

test('missingFontStems: latin-ext no cuenta como latin', () => {
  const soloExt = `@font-face { src: url(./noto-serif-display-latin-ext-wdth-normal.woff2); }`
  assert.deepEqual(missingFontStems(soloExt, ['noto-serif-display-latin-wdth-normal']), [
    'noto-serif-display-latin-wdth-normal',
  ])
})

test('PRELOAD_FONT_STEMS: coherente con src/styles/fonts.css', () => {
  assert.deepEqual(missingFontStems(readSrc('src/styles/fonts.css'), PRELOAD_FONT_STEMS), [])
})

/** La fuente precargada debe usarse en el primer render de cada ruta (si no, Chrome avisa "preloaded but not used"). */
function usesPreloadedFontOnEveryRoute(files) {
  const errors = []
  if (!/font-eva-display/.test(files['src/components/Hero.jsx'])) errors.push('Hero.jsx no usa font-eva-display')
  if (!/font-eva-display/.test(files['src/components/NavBrand.jsx'])) errors.push('NavBrand.jsx no usa font-eva-display')
  const conf = files['src/pages/Configurador.jsx']
  if (!/import\s+NavBrand\s+from/.test(conf) || !/<NavBrand\s*\/>/.test(conf)) {
    errors.push('Configurador.jsx no monta NavBrand')
  }
  return errors
}

test('guard de uso: Hero y NavBrand usan font-eva-display y Configurador monta NavBrand', () => {
  const files = Object.fromEntries(
    ['src/components/Hero.jsx', 'src/components/NavBrand.jsx', 'src/pages/Configurador.jsx'].map((f) => [f, readSrc(f)]),
  )
  assert.deepEqual(usesPreloadedFontOnEveryRoute(files), [])
  // Triangulación: quitar NavBrand de una copia en memoria hace fallar el guard.
  const sinNavBrand = { ...files, 'src/pages/Configurador.jsx': files['src/pages/Configurador.jsx'].replace(/<NavBrand\s*\/>/g, '') }
  assert.deepEqual(usesPreloadedFontOnEveryRoute(sinNavBrand), ['Configurador.jsx no monta NavBrand'])
})
