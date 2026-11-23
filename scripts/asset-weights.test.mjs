/**
 * Tests del resumen de pesos del build (scripts/lib/asset-weights.mjs).
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { resumirPesos } from './lib/asset-weights.mjs'

test('resumirPesos: lista vacía suma cero en cada grupo', () => {
  const zero = { count: 0, bytes: 0, gzipBytes: 0 }
  assert.deepEqual(resumirPesos([]), { css: zero, fuentes: zero, js: zero })
})

test('resumirPesos: agrupa por extensión y suma crudo y gzip', () => {
  const res = resumirPesos([
    { name: 'index-a.css', bytes: 1000, gzipBytes: 300 },
    { name: 'x-b.woff2', bytes: 5000, gzipBytes: 4900 },
    { name: 'y-c.woff2', bytes: 2000, gzipBytes: 1900 },
    { name: 'index-d.js', bytes: 9000, gzipBytes: 3000 },
    { name: 'Cfg-e.js', bytes: 1000, gzipBytes: 400 },
    { name: 'og.png', bytes: 777, gzipBytes: 777 },
  ])
  assert.deepEqual(res.css, { count: 1, bytes: 1000, gzipBytes: 300 })
  assert.deepEqual(res.fuentes, { count: 2, bytes: 7000, gzipBytes: 6800 })
  assert.deepEqual(res.js, { count: 2, bytes: 10000, gzipBytes: 3400 })
})

test('resumirPesos: ignora otras extensiones y no distingue mayúsculas', () => {
  const res = resumirPesos([{ name: 'A.WOFF2', bytes: 10, gzipBytes: 9 }, { name: 'map.js.map', bytes: 99, gzipBytes: 9 }])
  assert.equal(res.fuentes.count, 1)
  assert.equal(res.js.count, 0)
})
