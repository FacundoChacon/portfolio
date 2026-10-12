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
  { id: 'landing', name: 'Landing Page', priceARS: 250000, quotable: false },
  { id: 'custom', name: 'Sistema a medida', priceARS: null, quotable: true },
]
const EXTRAS = [
  { id: 'seo', name: 'SEO inicial', priceARS: 120000, recurring: false },
  { id: 'maintenance', name: 'Mantenimiento mensual', priceARS: 60000, recurring: true },
  {
    id: 'hosting',
    name: 'Hosting + Dominio',
    priceARS: 0,
    recurring: false,
    recommended: true,
    disclaimer: 'El costo del hosting está a cargo del cliente.',
  },
]

// El locale es-AR usa un espacio duro (U+00A0) entre el símbolo y el número.
const ARS = (n) => `$\u00A0${n}`

// --- 4.1 Desglose -----------------------------------------------------------

test('buildSummary: servicio × cantidad y total', () => {
  const state = setQuantity(createInitialState(SERVICES, []), 3)
  const summary = buildSummary(state, SERVICES, [])
  assert.equal(summary.service.name, 'Landing Page')
  assert.equal(summary.service.quantity, 3)
  assert.equal(summary.service.amount, 750000)
  assert.equal(summary.oneTimeTotal, 750000)
  assert.equal(summary.totalLabel, ARS('750.000,00'))
})

test('buildSummary: lista los extras seleccionados con su importe', () => {
  const state = toggleExtra(createInitialState(SERVICES, EXTRAS), 'seo')
  const summary = buildSummary(state, SERVICES, EXTRAS)
  const ids = summary.extras.map((e) => e.id).sort()
  assert.deepEqual(ids, ['hosting', 'seo'])
  const seo = summary.extras.find((e) => e.id === 'seo')
  assert.equal(seo.name, 'SEO inicial')
  assert.equal(seo.amountLabel, ARS('120.000,00'))
})

test('buildSummary: la cantidad no multiplica los extras', () => {
  let state = createInitialState(SERVICES, EXTRAS)
  state = toggleExtra(state, 'seo')
  state = setQuantity(state, 2)
  const summary = buildSummary(state, SERVICES, EXTRAS)
  assert.equal(summary.oneTimeTotal, 250000 * 2 + 120000)
})

// --- 4.2 Etiquetas especiales ----------------------------------------------

test('buildSummary: servicio cotizable se etiqueta "A cotizar"', () => {
  const state = { ...createInitialState(SERVICES, []), serviceId: 'custom' }
  const summary = buildSummary(state, SERVICES, [])
  assert.equal(summary.service.quotable, true)
  assert.equal(summary.service.amountLabel, 'A cotizar')
})

test('buildSummary: un extra de precio 0 se etiqueta "Sin costo"', () => {
  const state = createInitialState(SERVICES, EXTRAS) // hosting viene preseleccionado
  const summary = buildSummary(state, SERVICES, EXTRAS)
  const hosting = summary.extras.find((e) => e.id === 'hosting')
  assert.equal(hosting.amountLabel, 'Sin costo')
  assert.equal(hosting.disclaimer, 'El costo del hosting está a cargo del cliente.')
})

test('buildSummary: un extra recurrente se etiqueta "<importe>/mes"', () => {
  const state = toggleExtra(createInitialState(SERVICES, EXTRAS), 'maintenance')
  const summary = buildSummary(state, SERVICES, EXTRAS)
  const maintenance = summary.extras.find((e) => e.id === 'maintenance')
  assert.equal(maintenance.amountLabel, `${ARS('60.000,00')}/mes`)
  assert.equal(summary.recurringLabel, ARS('60.000,00'))
})

test('buildSummary: sin recurrentes la etiqueta mensual es vacía', () => {
  const state = createInitialState(SERVICES, [])
  const summary = buildSummary(state, SERVICES, [])
  assert.equal(summary.recurringMonthly, 0)
  assert.equal(summary.recurringLabel, '')
})

// --- 4.3 Cotizable no suma --------------------------------------------------

test('buildSummary: hasQuotable y el ítem cotizable no se suma al total', () => {
  const state = toggleExtra(
    { ...createInitialState(SERVICES, EXTRAS), serviceId: 'custom' },
    'seo',
  )
  const summary = buildSummary(state, SERVICES, EXTRAS)
  assert.equal(summary.hasQuotable, true)
  assert.equal(summary.oneTimeTotal, 120000)
})

test('buildSummary: sin ítems cotizables hasQuotable es false', () => {
  const summary = buildSummary(createInitialState(SERVICES, EXTRAS), SERVICES, EXTRAS)
  assert.equal(summary.hasQuotable, false)
})

// --- 4.4 Integración con el estado (el total cambia al togglear) ------------

test('buildSummary: alternar un extra cambia el total', () => {
  const base = createInitialState(SERVICES, EXTRAS) // hosting (0)
  const before = buildSummary(base, SERVICES, EXTRAS)
  assert.equal(before.oneTimeTotal, 250000)

  const withSeo = toggleExtra(base, 'seo')
  const after = buildSummary(withSeo, SERVICES, EXTRAS)
  assert.equal(after.oneTimeTotal, 370000)
  assert.notEqual(after.totalLabel, before.totalLabel)

  const removed = toggleExtra(withSeo, 'seo')
  assert.equal(buildSummary(removed, SERVICES, EXTRAS).oneTimeTotal, before.oneTimeTotal)
})

// --- 4.5 Sin extras y estado vacío ------------------------------------------

test('buildSummary: sin extras el total es solo el servicio', () => {
  const summary = buildSummary(createInitialState(SERVICES, []), SERVICES, [])
  assert.deepEqual(summary.extras, [])
  assert.equal(summary.oneTimeTotal, 250000)
})

test('buildSummary: estado vacío no rompe', () => {
  const summary = buildSummary(undefined, SERVICES, EXTRAS)
  assert.equal(summary.service, null)
  assert.deepEqual(summary.extras, [])
  assert.equal(summary.totalLabel, ARS('0,00'))
  assert.equal(summary.hasQuotable, false)
})
