/**
 * Tests del webhook (C-10).
 * Runner nativo de Node (`node:test`); sin dependencias.
 *
 * Cubre el mapeo puro de `buildLeadPayload` al `LeadPayload` (KB 04).
 * El configurador no publica precios: el payload no debe llevar importes.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { HONEYPOT_FIELD } from '../src/utils/wizard.js'
import { extras, services } from '../src/data/configurador.js'
import {
  buildLeadPayload,
  buildLeadRequest,
  LEAD_SOURCE,
  SEND_TIMEOUT_MS,
  isWebhookConfigured,
  sendLead,
} from '../src/utils/webhook.js'

const LANDING = services.find((s) => s.id === 'landing')
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

  assert.equal(payload.source, LEAD_SOURCE)
  assert.equal(payload.service.id, LANDING.id)
  assert.equal(payload.service.name, LANDING.name)
  assert.equal(payload.quantity, 2)
  assert.equal(payload.extras.length, 2)
  assert.equal(payload.extras[0].id, HOSTING.id)
  assert.equal(payload.extras[1].id, MAINT.id)
  assert.equal(payload.contact.name, 'Martina')
  assert.equal(payload.contact.email, 'martina@marca.com')
  assert.equal(payload.contact.phone, '+54 9 11 5555')
  assert.equal(payload.contact.project, 'Tienda online')
  assert.ok(typeof payload.submittedAt === 'string')
  assert.ok(!Number.isNaN(Date.parse(payload.submittedAt)))
  assert.equal(payload.meta.referrer, '')
})

/** Ejecuta `fn` con `globalThis.navigator` reemplazado y restaura el descriptor original. */
function withNavigator(value, fn) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true })
  try {
    return fn()
  } finally {
    if (original) Object.defineProperty(globalThis, 'navigator', original)
    else delete globalThis.navigator
  }
}

test('buildLeadPayload: meta.userAgent es el del navegador real', () => {
  withNavigator({ userAgent: 'Mozilla/5.0 Test' }, () => {
    assert.equal(buildLeadPayload({ form: {} }, services, extras).meta.userAgent, 'Mozilla/5.0 Test')
  })
  withNavigator({ userAgent: 'Otro/1.0' }, () => {
    assert.equal(buildLeadPayload({ form: {} }, services, extras).meta.userAgent, 'Otro/1.0')
  })
})

test('buildLeadPayload: sin navigator, meta.userAgent es cadena vacía y no lanza', () => {
  withNavigator(undefined, () => {
    assert.equal(buildLeadPayload({ form: {} }, services, extras).meta.userAgent, '')
  })
})

test('buildLeadPayload: no incluye el campo trampa ni su valor', () => {
  const state = {
    serviceId: LANDING.id,
    form: { name: 'Ana', email: 'ana@example.com', [HONEYPOT_FIELD]: 'spam-value' },
  }
  const json = JSON.stringify(buildLeadPayload(state, services, extras))
  assert.equal(json.includes(HONEYPOT_FIELD), false)
  assert.equal(json.includes('spam-value'), false)
})

test('buildLeadPayload: no incluye ningún campo de precio', () => {
  const state = {
    serviceId: LANDING.id,
    quantity: 1,
    extras: [HOSTING.id],
    form: { name: 'Ana', email: 'ana@test.com' },
  }
  const payload = buildLeadPayload(state, services, extras)

  for (const key of ['hasQuotable', 'subtotal', 'total', 'currency']) {
    assert.equal(key in payload, false, `el payload no debe tener "${key}"`)
  }
  assert.equal('priceARS' in payload.service, false)
  for (const extra of payload.extras) {
    assert.equal('priceARS' in extra, false)
    assert.equal('recurring' in extra, false)
  }
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

test('buildLeadRequest: POST como text/plain (request simple, sin preflight CORS) con cuerpo JSON', () => {
  const payload = { contact: { name: 'Ana', email: 'ana@example.com' } }
  const req = buildLeadRequest(payload)
  assert.equal(req.method, 'POST')
  assert.equal(req.headers['Content-Type'], 'text/plain;charset=utf-8')
  assert.deepEqual(JSON.parse(req.body), { payload, pdf: null })
})

test('buildLeadRequest: incluye el pdf cuando se pasa', () => {
  const pdf = { mimeType: 'application/pdf', base64: 'QUJD' }
  const req = buildLeadRequest({ source: 'x' }, { pdf })
  assert.deepEqual(JSON.parse(req.body), { payload: { source: 'x' }, pdf })
})

// fetch falso que nunca responde, pero respeta la señal de aborto (como el real).
function hangingFetch() {
  return (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(init.signal.reason ?? new Error('aborted')))
    })
}

function okFetch(body = { ok: true }) {
  return async (_url, init) => {
    okFetch.lastInit = init
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
  }
}

test('SEND_TIMEOUT_MS: límite razonable de 20 s', () => {
  assert.equal(SEND_TIMEOUT_MS, 20000)
})

test('sendLead: si el webhook no responde a tiempo, falla con error de timeout (no queda colgado)', async () => {
  const started = Date.now()
  await assert.rejects(
    sendLead({ source: 'x' }, { url: 'https://hook.test/exec', fetchImpl: hangingFetch(), timeoutMs: 30 }),
    /no respondió a tiempo/,
  )
  assert.ok(Date.now() - started < 1000)
})

test('sendLead: respuesta a tiempo devuelve el JSON y pasa una señal de aborto a fetch', async () => {
  const res = await sendLead({ source: 'x' }, { url: 'https://hook.test/exec', fetchImpl: okFetch({ ok: true }), timeoutMs: 1000 })
  assert.deepEqual(res, { ok: true })
  assert.ok(okFetch.lastInit.signal instanceof AbortSignal)
  assert.equal(okFetch.lastInit.headers['Content-Type'], 'text/plain;charset=utf-8')
})

test('sendLead: un HTTP no-ok sigue fallando con el status', async () => {
  const fail = async () => new Response('boom', { status: 500 })
  await assert.rejects(sendLead({}, { url: 'https://hook.test/exec', fetchImpl: fail, timeoutMs: 1000 }), /\(500\)/)
})
