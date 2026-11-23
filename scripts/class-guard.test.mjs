/**
 * Tests del helper puro de guards estáticos sobre el marcado de componentes.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { findForbiddenTokens, withoutMotionSafe } from './lib/class-guard.mjs'

const RULES = [
  { rule: 'glow', pattern: /glow/ },
  { rule: 'font-display', pattern: /(?<![\w-])font-display(?![\w-])/ },
  { rule: 'animate', pattern: withoutMotionSafe(String.raw`animate-[\w-]+`) },
  { rule: 'hover-translate', pattern: withoutMotionSafe(String.raw`hover:-?translate-[xy]-[\w.]+`) },
]

test('findForbiddenTokens: detecta una regla y devuelve { rule, match }', () => {
  assert.deepEqual(findForbiddenTokens('<p className="box-glow-cyan mt-2">', RULES), [
    { rule: 'glow', match: 'glow' },
  ])
})

test('findForbiddenTokens: fuente limpia devuelve lista vacía', () => {
  assert.deepEqual(findForbiddenTokens('<p className="mt-2 text-eva-paper">', RULES), [])
  assert.deepEqual(findForbiddenTokens('', RULES), [])
})

test('findForbiddenTokens: font-display no dispara dentro de font-eva-display', () => {
  assert.deepEqual(findForbiddenTokens('className="font-eva-display"', RULES), [])
  assert.deepEqual(findForbiddenTokens('className="md:font-display text-xl"', RULES), [
    { rule: 'font-display', match: 'font-display' },
  ])
})

test('findForbiddenTokens: animate-* sin motion-safe se detecta, con motion-safe no (con variantes)', () => {
  assert.deepEqual(findForbiddenTokens('className="animate-flicker"', RULES), [
    { rule: 'animate', match: 'animate-flicker' },
  ])
  assert.deepEqual(findForbiddenTokens('className="md:animate-pulse-slow"', RULES), [
    { rule: 'animate', match: 'md:animate-pulse-slow' },
  ])
  assert.deepEqual(findForbiddenTokens('className="motion-safe:animate-eva-boot"', RULES), [])
  assert.deepEqual(findForbiddenTokens('className="md:motion-safe:animate-eva-boot"', RULES), [])
})

test('findForbiddenTokens: hover:translate sin motion-safe se detecta, con motion-safe no', () => {
  assert.deepEqual(findForbiddenTokens('className="hover:-translate-y-0.5"', RULES), [
    { rule: 'hover-translate', match: 'hover:-translate-y-0.5' },
  ])
  assert.deepEqual(findForbiddenTokens('className="md:hover:translate-x-1"', RULES), [
    { rule: 'hover-translate', match: 'md:hover:translate-x-1' },
  ])
  assert.deepEqual(findForbiddenTokens('className="motion-safe:hover:-translate-y-0.5"', RULES), [])
})

test('findForbiddenTokens: informa cada coincidencia distinta de una misma regla', () => {
  const found = findForbiddenTokens('className="animate-a animate-b motion-safe:animate-c"', RULES)
  assert.deepEqual(found, [
    { rule: 'animate', match: 'animate-a' },
    { rule: 'animate', match: 'animate-b' },
  ])
})
