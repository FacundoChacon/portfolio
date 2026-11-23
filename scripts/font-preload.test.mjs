/**
 * Tests de las funciones puras de precarga de fuentes del build.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { PRELOAD_FONT_STEMS, findFontAssets, fontPreloadTags } from './lib/font-preload.mjs'

const STEM = 'rajdhani-latin-400-normal'

test('findFontAssets: encuentra el asset con hash y devuelve la ruta absoluta', () => {
  const files = ['assets/index-abc.js', `assets/${STEM}-AbC123.woff2`, 'assets/rajdhani-latin-500-normal-Zzz.woff2']
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
  const files = ['assets/rajdhani-latin-ext-400-normal-XYZ.woff2', `assets/${STEM}-AbC.woff`]
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

test('PRELOAD_FONT_STEMS: hoy la fuente principal es Rajdhani 400', () => {
  assert.deepEqual(PRELOAD_FONT_STEMS, ['rajdhani-latin-400-normal'])
})
