/**
 * Lógica pura de los testimonios (`src/utils/testimonios.js`).
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { hasValidRating, inicialesDe, messageCode, ratingLabel } from '../src/utils/testimonios.js'

test('hasValidRating: acepta enteros de 1 a 5', () => {
  assert.equal(hasValidRating(1), true)
  assert.equal(hasValidRating(5), true)
  assert.equal(hasValidRating(3), true)
})

test('hasValidRating: rechaza fuera de rango, decimales, strings y ausentes', () => {
  for (const value of [0, 6, 3.5, '4', undefined, null, NaN]) {
    assert.equal(hasValidRating(value), false, `debería rechazar ${String(value)}`)
  }
})

test('inicialesDe: primeras letras de las dos primeras palabras en mayúscula', () => {
  assert.equal(inicialesDe('Ana María Pérez'), 'AM')
  assert.equal(inicialesDe('  laura   gómez '), 'LG')
  assert.equal(inicialesDe('Cher'), 'C')
  assert.equal(inicialesDe(''), '')
})

test('messageCode: correlativo de tres dígitos desde MSG-001', () => {
  assert.equal(messageCode(0), 'MSG-001')
  assert.equal(messageCode(11), 'MSG-012')
  assert.equal(messageCode(99), 'MSG-100')
})

test('ratingLabel: texto alternativo de la calificación', () => {
  assert.equal(ratingLabel(4), 'Calificación: 4 de 5')
  assert.equal(ratingLabel(1), 'Calificación: 1 de 5')
})
