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
import { buildPdfSections, NOTA_SOLICITUD } from '../src/utils/pdfDocument.js'
import { bufferToBase64, buildPdfBlob, tryBuildPdfBlob } from '../src/utils/pdfGenerator.js'

const LANDING = services.find((service) => service.id === 'landing')
const HOSTING = extras.find((extra) => extra.id === 'hosting')
const MANTENIMIENTO = extras.find((extra) => extra.id === 'maintenance')

/** Payload de ejemplo (shape de KB 04 §LeadPayload) con datos del catálogo real. */
function samplePayload(overrides = {}) {
  return {
    submittedAt: '2026-10-12T14:00:00.000Z',
    source: 'facucode.dev/configurador',
    service: { id: LANDING.id, name: LANDING.name },
    quantity: 1,
    extras: [
      { id: HOSTING.id, name: HOSTING.name },
      { id: MANTENIMIENTO.id, name: MANTENIMIENTO.name },
    ],
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
  assert.equal(s.titulo, 'Solicitud de presupuesto')
  assert.equal(s.fecha, '12 de octubre de 2026')
  assert.equal(s.fuente, 'facucode.dev/configurador')
})

test('buildPdfSections: bloque de servicio sin importes', () => {
  const s = buildPdfSections(samplePayload())

  assert.deepEqual(s.serviceRows, [{ label: 'Tipo de sitio', value: 'Landing Page' }])
})

test('buildPdfSections: la cantidad aparece solo cuando es mayor a 1', () => {
  const s = buildPdfSections(samplePayload())
  assert.equal(s.serviceRows.find((row) => row.label === 'Cantidad'), undefined)

  const many = buildPdfSections(samplePayload({ quantity: 3 }))
  assert.deepEqual(many.serviceRows.find((row) => row.label === 'Cantidad'), {
    label: 'Cantidad',
    value: '× 3',
  })
})

test('buildPdfSections: extras listados por nombre, sin importes', () => {
  const s = buildPdfSections(samplePayload())

  assert.deepEqual(s.extrasRows, [
    { label: 'Seleccionados', value: 'Hosting + Dominio, Mantenimiento mensual' },
  ])
  assert.equal(s.hasHosting, true)
})

test('buildPdfSections: sin hosting no hay disclaimer ni hasHosting', () => {
  const s = buildPdfSections(samplePayload({ extras: [{ id: MANTENIMIENTO.id, name: MANTENIMIENTO.name }] }))

  assert.equal(s.hasHosting, false)
})

test('buildPdfSections: sin extras lo indica explícitamente', () => {
  const s = buildPdfSections(samplePayload({ extras: [] }))
  assert.deepEqual(s.extrasRows, [{ label: 'Seleccionados', value: 'Sin extras' }])
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

test('buildPdfSections: la nota no menciona montos', () => {
  assert.equal(NOTA_SOLICITUD, buildPdfSections(samplePayload()).notaSolicitud)
  assert.doesNotMatch(NOTA_SOLICITUD, /\$|monto|precio final/i)
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
