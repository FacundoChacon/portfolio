import assert from 'node:assert/strict'
import test from 'node:test'

import { checkChunks } from './lib/chunk-check.mjs'

const entry = { file: 'dist/assets/index-a.js', code: 'console.log("app")', gzipBytes: 1000 }
const otro = { file: 'dist/assets/Configurador-b.js', code: 'export const x = 1', gzipBytes: 5000 }

test('checkChunks: ningún chunk con WebGLRenderer → sin errores', () => {
  assert.deepEqual(checkChunks({ entry, chunks: [entry, otro] }), [])
})

test('checkChunks: WebGLRenderer en la entrada es un error que nombra el archivo', () => {
  const sucia = { ...entry, code: 'x;new WebGLRenderer({})' }
  const errors = checkChunks({ entry: sucia, chunks: [sucia, otro] })
  assert.equal(errors.length, 1)
  assert.match(errors[0], /index-a\.js.*WebGLRenderer/)
})

test('checkChunks: WebGLRenderer en cualquier otro chunk también es un error', () => {
  const sucio = { ...otro, code: 'class WebGLRenderer{}' }
  const errors = checkChunks({ entry, chunks: [entry, sucio] })
  assert.equal(errors.length, 1)
  assert.match(errors[0], /Configurador-b\.js.*WebGLRenderer/)
})

test('checkChunks: varios chunks sucios dan un error por chunk', () => {
  const a = { ...entry, code: 'WebGLRenderer' }
  const b = { ...otro, code: 'WebGLRenderer' }
  assert.equal(checkChunks({ entry: a, chunks: [a, b] }).length, 2)
})

test('checkChunks: sin entrada → error', () => {
  const errors = checkChunks({ entry: null, chunks: [otro] })
  assert.equal(errors.length, 1)
})
