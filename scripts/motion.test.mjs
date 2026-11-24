/**
 * Tests de `prefersReducedMotion` (C-11): detección pura de la preferencia de
 * movimiento reducido con `matchMedia` inyectable. Runner nativo `node:test`.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { REDUCED_MOTION_QUERY, prefersReducedMotion, shouldRevealImmediately } from '../src/utils/motion.js'

test('prefersReducedMotion: true cuando la media query coincide', () => {
  assert.equal(prefersReducedMotion(() => ({ matches: true })), true)
})

test('prefersReducedMotion: false cuando la media query no coincide', () => {
  assert.equal(prefersReducedMotion(() => ({ matches: false })), false)
})

test('prefersReducedMotion: false si matchMedia falta o no es función', () => {
  assert.equal(prefersReducedMotion(undefined), false)
  assert.equal(prefersReducedMotion('no-es-funcion'), false)
})

test('prefersReducedMotion: false si matchMedia lanza', () => {
  assert.equal(
    prefersReducedMotion(() => {
      throw new Error('boom')
    }),
    false,
  )
})

test('prefersReducedMotion: consulta con REDUCED_MOTION_QUERY', () => {
  const queries = []
  prefersReducedMotion((query) => {
    queries.push(query)
    return { matches: false }
  })
  assert.deepEqual(queries, [REDUCED_MOTION_QUERY])
  assert.equal(REDUCED_MOTION_QUERY, '(prefers-reduced-motion: reduce)')
})

test('shouldRevealImmediately: true con movimiento reducido aunque haya IntersectionObserver', () => {
  assert.equal(shouldRevealImmediately({ reducedMotion: true, hasIntersectionObserver: true }), true)
})

test('shouldRevealImmediately: true sin IntersectionObserver', () => {
  assert.equal(shouldRevealImmediately({ reducedMotion: false, hasIntersectionObserver: false }), true)
})

test('shouldRevealImmediately: false con observer disponible y sin preferencia de reducir', () => {
  assert.equal(shouldRevealImmediately({ reducedMotion: false, hasIntersectionObserver: true }), false)
})

test('shouldRevealImmediately: true cuando se dan ambas condiciones', () => {
  assert.equal(shouldRevealImmediately({ reducedMotion: true, hasIntersectionObserver: false }), true)
})
