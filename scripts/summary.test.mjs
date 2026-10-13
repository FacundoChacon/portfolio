/**
 * Tests unitarios del modelo de resumen (C-06).
 * Runner nativo de Node (`node:test`); sin dependencias.
 *
 * Uso: npm run test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { buildSummary } from '../src/utils/summary.js'
import { createInitialState, setQuantity, toggleExtra } from '../src/utils/wizard.js'

const SERVICES = [
  { id: 'landing', name: 'Landing Page' },
  { id: 'custom', name: 'Sistema a medida' },
]
const EXTRAS = [
  { id: 'seo', name: 'SEO inicial' },
  { id: 'maintenance', name: 'Mantenimiento mensual' },
  {
    id: 'hosting',
    name: 'Hosting + Dominio',
    recommended: true,
    disclaimer: 'El costo del hosting está a cargo del cliente.',
  },
]

// --- Desglose ---------------------------------------------------------------

test('buildSummary: servicio y cantidad', () => {
  const state = setQuantity(createInitialState(SERVICES, []), 3)
  const summary = buildSummary(state, SERVICES, [])
  assert.equal(summary.service.name, 'Landing Page')
  assert.equal(summary.service.quantity, 3)
})

test('buildSummary: lista los extras seleccionados con su nombre y disclaimer', () => {
  const state = toggleExtra(createInitialState(SERVICES, EXTRAS), 'seo')
  const summary = buildSummary(state, SERVICES, EXTRAS)
  const ids = summary.extras.map((e) => e.id).sort()
  assert.deepEqual(ids, ['hosting', 'seo'])

  const seo = summary.extras.find((e) => e.id === 'seo')
  assert.equal(seo.name, 'SEO inicial')
  assert.equal(seo.disclaimer, null)

  const hosting = summary.extras.find((e) => e.id === 'hosting')
  assert.equal(hosting.disclaimer, 'El costo del hosting está a cargo del cliente.')
})

test('buildSummary: no expone ningún campo de precio', () => {
  const summary = buildSummary(createInitialState(SERVICES, EXTRAS), SERVICES, EXTRAS)
  for (const key of ['currency', 'totalLabel', 'oneTimeTotal', 'recurringMonthly', 'hasQuotable']) {
    assert.equal(key in summary, false, `el resumen no debe tener "${key}"`)
  }
  assert.equal('amount' in summary.service, false)
  for (const extra of summary.extras) {
    assert.equal('amountLabel' in extra, false)
    assert.equal('priceARS' in extra, false)
  }
})

// --- Integración con el estado ----------------------------------------------

test('buildSummary: alternar un extra cambia la lista', () => {
  const base = createInitialState(SERVICES, EXTRAS) // hosting preseleccionado
  assert.deepEqual(
    buildSummary(base, SERVICES, EXTRAS).extras.map((e) => e.id),
    ['hosting'],
  )

  const withSeo = toggleExtra(base, 'seo')
  assert.deepEqual(
    buildSummary(withSeo, SERVICES, EXTRAS).extras.map((e) => e.id).sort(),
    ['hosting', 'seo'],
  )
})

// --- Sin extras y estado vacío ----------------------------------------------

test('buildSummary: sin extras la lista queda vacía', () => {
  const summary = buildSummary(createInitialState(SERVICES, []), SERVICES, [])
  assert.deepEqual(summary.extras, [])
})

test('buildSummary: estado vacío no rompe', () => {
  const summary = buildSummary(undefined, SERVICES, EXTRAS)
  assert.equal(summary.service, null)
  assert.deepEqual(summary.extras, [])
})
