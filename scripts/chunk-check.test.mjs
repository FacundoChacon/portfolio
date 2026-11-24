import assert from 'node:assert/strict'
import test from 'node:test'

import { MAX_3D_CHUNK_GZIP, checkChunks } from './lib/chunk-check.mjs'

const entry = { file: 'dist/assets/index-a.js', code: 'console.log("app")', gzipBytes: 1000 }
const three = { file: 'dist/assets/carreteEscena-b.js', code: 'class WebGLRenderer{}', gzipBytes: 130 * 1024 }

test('MAX_3D_CHUNK_GZIP: 150 KB', () => {
  assert.equal(MAX_3D_CHUNK_GZIP, 150 * 1024)
})

test('checkChunks: entrada limpia y chunk 3D dentro del presupuesto → sin errores', () => {
  assert.deepEqual(checkChunks({ entry, chunks: [entry, three] }), [])
})

test('checkChunks: WebGLRenderer en la entrada es un error', () => {
  const sucia = { ...entry, code: 'x;new WebGLRenderer({})' }
  const errors = checkChunks({ entry: sucia, chunks: [sucia, three] })
  assert.equal(errors.length, 1)
  assert.match(errors[0], /entrada.*WebGLRenderer/)
})

test('checkChunks: sin chunk con WebGLRenderer es un error', () => {
  const errors = checkChunks({ entry, chunks: [entry] })
  assert.equal(errors.length, 1)
  assert.match(errors[0], /ningún chunk/)
})

test('checkChunks: chunk 3D por encima del presupuesto es un error; justo en el límite pasa', () => {
  const pesado = { ...three, gzipBytes: MAX_3D_CHUNK_GZIP + 1 }
  const errors = checkChunks({ entry, chunks: [entry, pesado] })
  assert.equal(errors.length, 1)
  assert.match(errors[0], /150 KB/)
  assert.deepEqual(checkChunks({ entry, chunks: [entry, { ...three, gzipBytes: MAX_3D_CHUNK_GZIP }] }), [])
})

test('checkChunks: sin entrada → error', () => {
  const errors = checkChunks({ entry: null, chunks: [three] })
  assert.equal(errors.length, 1)
})
