/**
 * Tests unitarios del motor de cálculo (C-04).
 * Runner nativo de Node (`node:test`); sin dependencias.
 *
 * Uso: npm run test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { computeTotal, formatARS, hasQuotable, splitRecurring } from '../src/utils/pricing.js'

const servicio = (priceARS, quotable = false) => ({ id: 'svc', priceARS, quotable })
const extra = (id, priceARS, recurring = false) => ({ id, priceARS, recurring })

// El locale es-AR usa un espacio duro (U+00A0) entre el símbolo y el número.
const ARS = (n) => `$\u00A0${n}`

test('computeTotal: servicio × cantidad sin extras', () => {
  const r = computeTotal(servicio(100000), 3, [])
  assert.equal(r.serviceTotal, 300000)
  assert.equal(r.extrasOneTimeTotal, 0)
  assert.equal(r.total, 300000)
})

test('computeTotal: servicio + extras', () => {
  const r = computeTotal(servicio(600000), 1, [extra('seo', 120000)])
  assert.equal(r.total, 720000)
})

test('computeTotal: sin servicio, el total es la suma de extras', () => {
  const r = computeTotal(null, 1, [extra('seo', 120000), extra('copy', 90000)])
  assert.equal(r.serviceTotal, 0)
  assert.equal(r.total, 210000)
})

test('computeTotal: la cantidad no multiplica los extras', () => {
  const r = computeTotal(servicio(100000), 3, [extra('seo', 50000)])
  assert.equal(r.serviceTotal, 300000)
  assert.equal(r.extrasOneTimeTotal, 50000)
  assert.equal(r.total, 350000)
})

test('computeTotal: cantidad ausente o inválida se trata como 1', () => {
  assert.equal(computeTotal(servicio(100000), undefined, []).total, 100000)
  assert.equal(computeTotal(servicio(100000), 0, []).total, 100000)
  assert.equal(computeTotal(servicio(100000), -4, []).total, 100000)
  assert.equal(computeTotal(servicio(100000), Number.NaN, []).total, 100000)
})

test('computeTotal: el servicio cotizable aporta 0', () => {
  const r = computeTotal(servicio(null, true), 1, [])
  assert.equal(r.serviceTotal, 0)
  assert.equal(r.total, 0)
  assert.equal(r.hasQuotable, true)
})

test('computeTotal: cotizable + extra suma solo el extra', () => {
  const r = computeTotal(servicio(null, true), 1, [extra('seo', 120000)])
  assert.equal(r.total, 120000)
  assert.equal(r.hasQuotable, true)
})

test('computeTotal: un extra sin costo no altera el total', () => {
  const r = computeTotal(servicio(250000), 1, [extra('hosting', 0)])
  assert.equal(r.total, 250000)
})

test('computeTotal: la recurrencia no infla el total de pago único', () => {
  const r = computeTotal(servicio(300000), 1, [extra('maintenance', 60000, true)])
  assert.equal(r.total, 300000)
  assert.equal(r.recurringMonthly, 60000)
})

test('computeTotal: separa pago único y mensual', () => {
  const r = computeTotal(servicio(300000), 1, [
    extra('seo', 120000),
    extra('maintenance', 60000, true),
  ])
  assert.equal(r.extrasOneTimeTotal, 120000)
  assert.equal(r.recurringMonthly, 60000)
  assert.equal(r.subtotal, 420000)
})

test('computeTotal: subtotal y total coinciden en v1', () => {
  const r = computeTotal(servicio(250000), 2, [extra('seo', 120000)])
  assert.equal(r.subtotal, r.total)
})

test('computeTotal: expone la moneda del catálogo', () => {
  assert.equal(computeTotal(servicio(1000), 1, []).currency, 'ARS')
})

test('hasQuotable: true con servicio cotizable', () => {
  assert.equal(hasQuotable(servicio(null, true)), true)
})

test('hasQuotable: false sin ítems cotizables', () => {
  assert.equal(hasQuotable(servicio(100000), [extra('seo', 1)]), false)
})

test('splitRecurring: separa por recurrencia', () => {
  const { oneTime, recurring } = splitRecurring([
    extra('seo', 1),
    extra('maintenance', 2, true),
    extra('copy', 3),
  ])
  assert.deepEqual(
    oneTime.map((e) => e.id),
    ['seo', 'copy'],
  )
  assert.deepEqual(
    recurring.map((e) => e.id),
    ['maintenance'],
  )
})

test('splitRecurring: lista vacía', () => {
  assert.deepEqual(splitRecurring([]), { oneTime: [], recurring: [] })
})

test('formatARS: separador de miles en es-AR', () => {
  assert.equal(formatARS(720000), ARS('720.000,00'))
})

test('formatARS: importe cero', () => {
  assert.equal(formatARS(0), ARS('0,00'))
})

test('formatARS: valores no numéricos devuelven cadena vacía', () => {
  assert.equal(formatARS(null), '')
  assert.equal(formatARS(undefined), '')
  assert.equal(formatARS(Number.NaN), '')
  assert.equal(formatARS('1200'), '')
})
