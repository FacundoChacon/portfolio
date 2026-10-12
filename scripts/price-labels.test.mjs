/**
 * Tests unitarios de las etiquetas de precio (C-07).
 * Runner nativo de Node (`node:test`); sin dependencias.
 *
 * Uso: npm run test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  FREE_LABEL,
  QUOTABLE_LABEL,
  extraPriceLabel,
  serviceLineLabel,
  servicePriceLabel,
} from '../src/utils/priceLabels.js'

// El locale es-AR usa un espacio duro (U+00A0) entre el símbolo y el número.
const ARS = (n) => `$\u00A0${n}`

test('servicePriceLabel: precio de referencia formateado', () => {
  assert.equal(servicePriceLabel({ priceARS: 250000, quotable: false }), ARS('250.000,00'))
})

test('servicePriceLabel: cotizable se muestra "A cotizar", nunca un número', () => {
  assert.equal(servicePriceLabel({ priceARS: null, quotable: true }), QUOTABLE_LABEL)
})

test('servicePriceLabel: servicio nulo no rompe', () => {
  assert.equal(servicePriceLabel(null), ARS('0,00'))
})

test('serviceLineLabel: importe de la línea (precio × cantidad)', () => {
  assert.equal(serviceLineLabel({ quotable: false }, 750000), ARS('750.000,00'))
})

test('serviceLineLabel: cotizable se mantiene "A cotizar" aunque el total sea 0', () => {
  assert.equal(serviceLineLabel({ quotable: true }, 0), QUOTABLE_LABEL)
})

test('extraPriceLabel: importe formateado', () => {
  assert.equal(extraPriceLabel({ priceARS: 120000, recurring: false }), ARS('120.000,00'))
})

test('extraPriceLabel: recurrente agrega el sufijo /mes (RN-PR-05)', () => {
  assert.equal(extraPriceLabel({ priceARS: 60000, recurring: true }), `${ARS('60.000,00')}/mes`)
})

test('extraPriceLabel: precio 0 se muestra "Sin costo" (RN-HD-01)', () => {
  assert.equal(extraPriceLabel({ priceARS: 0, recurring: false }), FREE_LABEL)
})

test('extraPriceLabel: precio inválido se trata como sin costo', () => {
  assert.equal(extraPriceLabel({ priceARS: null }), FREE_LABEL)
  assert.equal(extraPriceLabel({}), FREE_LABEL)
})
