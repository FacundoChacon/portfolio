/**
 * Tests del generador de PDF (C-09).
 * Runner nativo de Node (`node:test`); sin dependencias nuevas.
 *
 * Cubre dos niveles: las secciones puras de `pdfDocument.js` (rápidas, sin
 * render) y la integración real con `@react-pdf/renderer` vía `buildPdfBlob`,
 * que en Node rinde un buffer con cabecera `%PDF-`.
 *
 * Uso: npm run test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { extras, services } from '../src/data/configurador.js'
import { formatARS } from '../src/utils/pricing.js'
import { QUOTABLE_LABEL, extraPriceLabel } from '../src/utils/priceLabels.js'
import { buildPdfSections } from '../src/utils/pdfDocument.js'
import { bufferToBase64, buildPdfBlob, tryBuildPdfBlob } from '../src/utils/pdfGenerator.js'

const LANDING = services.find((service) => service.id === 'landing')
const HOSTING = extras.find((extra) => extra.id === 'hosting')
const MANTENIMIENTO = extras.find((extra) => extra.id === 'maintenance')

/** Payload de ejemplo (shape de KB 04 §LeadPayload) con datos del catálogo real. */
function samplePayload(overrides = {}) {
  return {
    submittedAt: '2026-10-12T14:00:00.000Z',
    source: 'facucode.dev/configurador',
    service: LANDING,
    quantity: 1,
    extras: [HOSTING, MANTENIMIENTO],
    hasQuotable: false,
    subtotal: LANDING.priceARS,
    total: LANDING.priceARS,
    currency: 'ARS',
    contact: {
      name: '  Martina  ',
      email: ' martina@marca.com ',
      phone: '+54 9 11 5555-1234',
      project: 'Tienda online para mi marca',
    },
    meta: { userAgent: 'node:test', referrer: '' },
    ...overrides,
  }
}

test('buildPdfSections: encabezado con emisor, título, fecha es-AR y fuente', () => {
  const s = buildPdfSections(samplePayload())

  assert.equal(s.emisor, 'Facundo Chacón')
  assert.equal(s.titulo, 'Presupuesto web')
  assert.equal(s.fecha, '12 de octubre de 2026')
  assert.equal(s.fuente, 'facucode.dev/configurador')
})

test('buildPdfSections: bloque de servicio con importe (precio × cantidad)', () => {
  const s = buildPdfSections(samplePayload())

  assert.deepEqual(s.serviceRows, [
    { label: 'Tipo de sitio', value: 'Landing Page' },
    { label: 'Importe del servicio', value: formatARS(LANDING.priceARS) },
  ])
  assert.equal(s.serviceRows[1].value, '$\u00A0250.000,00')
})

test('buildPdfSections: la cantidad aparece solo cuando es mayor a 1', () => {
  const s = buildPdfSections(samplePayload())
  assert.equal(s.serviceRows.find((row) => row.label === 'Cantidad'), undefined)

  const many = buildPdfSections(samplePayload({ quantity: 3 }))
  assert.deepEqual(many.serviceRows.find((row) => row.label === 'Cantidad'), {
    label: 'Cantidad',
    value: '× 3',
  })
  assert.equal(
    many.serviceRows.find((row) => row.label === 'Importe del servicio').value,
    formatARS(250000 * 3),
  )
})

test('buildPdfSections: extras de pago único vs recurrentes /mes, "Sin costo" en hosting', () => {
  const s = buildPdfSections(samplePayload())

  assert.deepEqual(s.oneTimeRows, [{ label: 'Hosting + Dominio', value: extraPriceLabel(HOSTING) }])
  assert.equal(s.oneTimeRows[0].value, 'Sin costo')
  assert.equal(s.hasHosting, true)

  assert.deepEqual(s.monthlyRows, [
    { label: 'Mantenimiento mensual', value: extraPriceLabel(MANTENIMIENTO) },
  ])
  assert.equal(s.monthlyRows[0].value, '$\u00A060.000,00/mes')
  assert.equal(s.totals.monthlyTotal, 60000)
})

test('buildPdfSections: sin hosting no hay disclaimer ni hasHosting', () => {
  const s = buildPdfSections(samplePayload({ extras: [MANTENIMIENTO] }))

  assert.equal(s.hasHosting, false)
  assert.deepEqual(s.oneTimeRows, [])
})

test('buildPdfSections: ítem cotizable → "A cotizar" + aviso (RN-CO-02)', () => {
  const s = buildPdfSections(
    samplePayload({
      service: services.find((service) => service.id === 'custom'),
      hasQuotable: true,
      subtotal: 0,
      total: 0,
    }),
  )

  assert.equal(s.totals.isQuotable, true)
  assert.equal(s.serviceRows.find((row) => row.label === 'Importe del servicio').value, QUOTABLE_LABEL)
  assert.match(s.notaCotizable, /El ítem/)
  assert.match(s.notaCotizable, /cotiza por separado/)
})

test('buildPdfSections: subtotal se muestra solo si difiere del total', () => {
  assert.equal(buildPdfSections(samplePayload()).totals.showSubtotal, false)

  const diff = buildPdfSections(
    samplePayload({ subtotal: 250000, total: 300000, extras: [] }),
  )
  assert.equal(diff.totals.showSubtotal, true)
})

test('buildPdfSections: contacto recorta espacios y omite campos vacíos', () => {
  const s = buildPdfSections(
    samplePayload({
      contact: { name: '  Martina  ', email: ' martina@marca.com ', phone: '   ', project: '' },
    }),
  )

  assert.deepEqual(s.contactRows, [
    { label: 'Nombre', value: 'Martina' },
    { label: 'Email', value: 'martina@marca.com' },
  ])
})

test('buildPdfSections: payload inválido revienta con error controlado', () => {
  assert.throws(() => buildPdfSections(undefined), TypeError)
  assert.throws(() => buildPdfSections(null), TypeError)
})

test('buildPdfBlob: renderiza un PDF en cliente (cabecera %PDF- y no vacío)', async () => {
  const buffer = await buildPdfBlob(samplePayload())

  assert.ok(buffer instanceof Uint8Array)
  assert.ok(buffer.byteLength > 1000, `blob muy chico: ${buffer.byteLength} bytes`)
  assert.equal(Buffer.from(buffer).subarray(0, 5).toString(), '%PDF-')
})

test('tryBuildPdfBlob: payload válido → buffer; inválido → null sin excepción (RN-PD-03)', async () => {
  const ok = await tryBuildPdfBlob(samplePayload())
  assert.ok(ok instanceof Uint8Array)
  assert.equal(Buffer.from(ok).subarray(0, 5).toString(), '%PDF-')

  assert.equal(await tryBuildPdfBlob(undefined), null)
  assert.equal(await tryBuildPdfBlob(null), null)
  assert.equal(await tryBuildPdfBlob({}), null)
})

test('bufferToBase64: reversible y sin depender del tamaño', async () => {
  const source = new TextEncoder().encode('hola')
  const encoded = bufferToBase64(source)
  assert.equal(typeof encoded, 'string')
  assert.equal(new TextDecoder().decode(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))), 'hola')

  // Un PDF real (≈ varios kB) también redondea byte a byte vía base64.
  const pdf = await buildPdfBlob(samplePayload())
  const round = Buffer.from(atob(bufferToBase64(pdf)), 'binary')
  assert.ok(round.equals(Buffer.from(pdf)))
})