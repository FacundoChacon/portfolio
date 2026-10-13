/**
 * Tests del webhook (C-10).
 * Runner nativo de Node (`node:test`); sin dependencias.
 *
 * Cubre el mapeo puro de `buildLeadPayload` al `LeadPayload` (KB 04).
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { extras, services } from '../src/data/configurador.js'
import { computeTotal } from '../src/utils/pricing.js'
import { buildLeadPayload, LEAD_SOURCE, isWebhookConfigured } from '../src/utils/webhook.js'

const LANDING = services.find((s) => s.id === 'landing')
const CUSTOM = services.find((s) => s.id === 'custom')
const HOSTING = extras.find((e) => e.id === 'hosting')
const MAINT = extras.find((e) => e.id === 'maintenance')

test('buildLeadPayload: mapea servicio, cantidad, extras, contacto, source e ISO', () => {
  const state = {
    serviceId: LANDING.id,
    quantity: 2,
    extras: [HOSTING.id, MAINT.id],
    form: {
      name: ' Martina ',
      email: ' martina@marca.com ',
      phone: '+54 9 11 5555',
      project: 'Tienda online',
    },
  }

  const payload = buildLeadPayload(state, services, extras)
  const totals = computeTotal(LANDING, 2, [HOSTING, MAINT])

  assert.equal(payload.source, LEAD_SOURCE)
  assert.equal(payload.service.id, LANDING.id)
  assert.equal(payload.service.name, LANDING.name)
  assert.equal(payload.quantity, 2)
  assert.equal(payload.extras.length, 2)
  assert.equal(payload.extras[0].id, HOSTING.id)
  assert.equal(payload.extras[1].recurring, true)
  assert.equal(payload.hasQuotable, totals.hasQuotable)
  assert.equal(payload.subtotal, totals.subtotal)
  assert.equal(payload.total, totals.total)
  assert.equal(payload.currency, totals.currency)
  assert.equal(payload.contact.name, 'Martina')
  assert.equal(payload.contact.email, 'martina@marca.com')
  assert.equal(payload.contact.phone, '+54 9 11 5555')
  assert.equal(payload.contact.project, 'Tienda online')
  assert.ok(typeof payload.submittedAt === 'string')
  assert.ok(!Number.isNaN(Date.parse(payload.submittedAt)))
  assert.equal(payload.meta.userAgent, 'node:test')
  assert.equal(payload.meta.referrer, '')
})

test('buildLeadPayload: quotable → hasQuotable true y totales coherentes', () => {
  const state = {
    serviceId: CUSTOM.id,
    quantity: 1,
    extras: [],
    form: { name: 'Ana', email: 'ana@test.com' },
  }
  const payload = buildLeadPayload(state, services, extras)
  const totals = computeTotal(CUSTOM, 1, [])

  assert.equal(payload.hasQuotable, true)
  assert.equal(payload.subtotal, totals.subtotal)
  assert.equal(payload.total, totals.total)
  assert.equal(payload.service.id, CUSTOM.id)
})

test('buildLeadPayload: extras vacíos y sin servicio → maneja sin romper', () => {
  const state = {
    serviceId: null,
    quantity: 0,
    extras: [],
    form: { name: ' Beto ', email: 'beto@test.com', phone: '', project: '' },
  }
  const payload = buildLeadPayload(state, services, extras)

  assert.equal(payload.service, null)
  assert.equal(payload.quantity, 1) // normalizado
  assert.deepEqual(payload.extras, [])
  assert.equal(payload.contact.phone, '')
  assert.equal(payload.contact.project, '')
})

test('isWebhookConfigured: false en test (sin env)', () => {
  // En Node/test no hay import.meta.env → undefined
  assert.equal(isWebhookConfigured(), false)
})