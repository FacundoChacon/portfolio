/**
 * Tests unitarios del modelo de revisión (C-08).
 * Runner nativo de Node (`node:test`); sin dependencias.
 *
 * Uso: npm run test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { extras, services } from '../src/data/configurador.js'
import { buildReview } from '../src/utils/review.js'
import {
  STEPS,
  createInitialState,
  setForm,
  setQuantity,
  setService,
  toggleExtra,
} from '../src/utils/wizard.js'

test('buildReview: tres bloques con su paso de edición', () => {
  const review = buildReview(createInitialState(services, extras), services, extras)

  assert.deepEqual(
    review.blocks.map((block) => block.id),
    ['service', 'extras', 'contact'],
  )
  assert.equal(review.blocks[0].editStep, STEPS.SERVICE)
  assert.equal(review.blocks[1].editStep, STEPS.EXTRAS)
  assert.equal(review.blocks[2].editStep, STEPS.CONTACT)
})

test('buildReview: la cantidad se muestra solo cuando es mayor a 1', () => {
  const one = buildReview(createInitialState(services, extras), services, extras)
  assert.equal(one.blocks[0].lines.find((line) => line.label === 'Cantidad'), undefined)

  const many = buildReview(setQuantity(createInitialState(services, extras), 3), services, extras)
  const cantidad = many.blocks[0].lines.find((line) => line.label === 'Cantidad')
  assert.ok(cantidad)
  assert.equal(cantidad.value, '× 3')
})

test('buildReview: "Sin extras" cuando no hay seleccionados', () => {
  let state = createInitialState(services, extras)
  for (const extra of extras) {
    if (state.extras.includes(extra.id)) state = toggleExtra(state, extra.id)
  }

  const review = buildReview(state, services, extras)
  assert.deepEqual(review.blocks[1].lines, [{ label: 'Extras', value: 'Sin extras' }])
})

test('buildReview: extras listados con su etiqueta de precio (RN-PR-05, RN-HD-01)', () => {
  let state = createInitialState(services, extras) // hosting preseleccionado
  state = toggleExtra(state, 'maintenance')

  const review = buildReview(state, services, extras)
  const lines = review.blocks[1].lines

  const hosting = lines.find((line) => line.label === 'Hosting + Dominio')
  assert.ok(hosting)
  assert.equal(hosting.value, 'Sin costo')

  const maintenance = lines.find((line) => line.label === 'Mantenimiento mensual')
  assert.ok(maintenance)
  assert.ok(maintenance.value.endsWith('/mes'))
})

test('buildReview: datos de contacto con "—" en obligatorios y omitiendo opcionales vacíos', () => {
  let state = createInitialState(services, extras)
  state = setForm(state, { name: 'Ana', email: 'ana@example.com' })

  const contact = buildReview(state, services, extras).blocks[2].lines
  assert.deepEqual(contact, [
    { label: 'Nombre', value: 'Ana' },
    { label: 'Email', value: 'ana@example.com' },
  ])

  state = setForm(state, { phone: '   ', project: 'Quiero un sitio' })
  const withOptional = buildReview(state, services, extras).blocks[2].lines
  assert.deepEqual(withOptional, [
    { label: 'Nombre', value: 'Ana' },
    { label: 'Email', value: 'ana@example.com' },
    { label: 'Proyecto', value: 'Quiero un sitio' },
  ])
})

test('buildReview: incluye el resumen con total y aviso de cotizable (RN-CO-02)', () => {
  const review = buildReview(setService(createInitialState(services, extras), 'custom'), services, extras)

  assert.equal(review.summary.hasQuotable, true)
  assert.ok(review.summary.totalLabel)
  assert.match(review.summary.totalLabel, /\$\s/)
})

test('buildReview: un estado vacío no rompe', () => {
  const review = buildReview({}, [], [])
  assert.equal(review.blocks[0].lines[0].value, 'Sin seleccionar')
  assert.deepEqual(review.blocks[1].lines, [{ label: 'Extras', value: 'Sin extras' }])
  assert.equal(review.blocks[2].lines[0].value, '—')
})