/**
 * Motor de cálculo del Configurador de Presupuestos Web (C-04).
 *
 * Funciones puras, sin React ni DOM: reciben los datos del catálogo (C-03) y
 * devuelven el desglose del presupuesto. Son la única fuente de verdad de la
 * aritmética que consumen la UI, el payload del webhook y el PDF.
 *
 * Reglas: `priceARS: null` no suma (marca cotizable), `priceARS: 0` no altera,
 * la cantidad multiplica solo al servicio y los extras recurrentes se exponen
 * aparte como importe mensual.
 *
 * @typedef {import('../data/configurador.js').Service} Service
 * @typedef {import('../data/configurador.js').Extra} Extra
 *
 * @typedef {Object} Presupuesto
 * @property {string} currency            Moneda del presupuesto (siempre ARS).
 * @property {number} serviceTotal        Precio del servicio × cantidad (0 si es cotizable o no hay servicio).
 * @property {number} extrasOneTimeTotal  Suma de los extras de pago único.
 * @property {number} subtotal            `serviceTotal` + `extrasOneTimeTotal`.
 * @property {number} total               Total de pago único (igual a `subtotal` en v1).
 * @property {number} recurringMonthly    Suma de los extras recurrentes, como importe "/mes".
 * @property {boolean} hasQuotable        `true` si el presupuesto incluye algún ítem cotizable.
 */

import { CURRENCY } from '../data/configurador.js'

/** Formateador ARS reutilizado entre llamadas (es costoso de construir). */
const ARS_FORMATTER = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

/**
 * Devuelve el precio numérico utilizable, o 0 si no es un número positivo finito.
 * Cubre `null` (cotizable), `undefined` y valores inválidos.
 * @param {unknown} value
 * @returns {number}
 */
const toPrice = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0

/**
 * Normaliza la cantidad: entero ≥ 1; cualquier otra cosa se trata como 1.
 * @param {unknown} quantity
 * @returns {number}
 */
const normalizeQuantity = (quantity) =>
  typeof quantity === 'number' && Number.isFinite(quantity) && quantity >= 1 ? quantity : 1

/**
 * Separa los extras de pago único de los de cobro mensual (RN-PR-05).
 *
 * @param {Extra[]} [extras]
 * @returns {{ oneTime: Extra[], recurring: Extra[] }}
 */
export function splitRecurring(extras = []) {
  const oneTime = []
  const recurring = []
  for (const extra of extras ?? []) {
    if (!extra) continue
    if (extra.recurring === true) recurring.push(extra)
    else oneTime.push(extra)
  }
  return { oneTime, recurring }
}

/**
 * Indica si el presupuesto incluye algún ítem "a cotizar" (RN-CO-01).
 *
 * @param {Service|null|undefined} service
 * @param {Extra[]} [extras]
 * @returns {boolean}
 */
export function hasQuotable(service, extras = []) {
  if (service && service.quotable === true) return true
  return (extras ?? []).some((extra) => extra && extra.quotable === true)
}

/**
 * Calcula el desglose del presupuesto (RN-PR-02..04, RN-CO-03, RN-HD-01, RN-QT-02).
 *
 * @param {Service|null|undefined} service   Servicio principal seleccionado.
 * @param {number} [quantity]                Unidades del servicio (≥ 1).
 * @param {Extra[]} [extras]                 Extras seleccionados.
 * @returns {Presupuesto}
 */
export function computeTotal(service, quantity = 1, extras = []) {
  const qty = normalizeQuantity(quantity)
  const serviceTotal = toPrice(service?.priceARS) * qty

  const { oneTime, recurring } = splitRecurring(extras)
  const extrasOneTimeTotal = oneTime.reduce((sum, extra) => sum + toPrice(extra.priceARS), 0)
  const recurringMonthly = recurring.reduce((sum, extra) => sum + toPrice(extra.priceARS), 0)

  const subtotal = serviceTotal + extrasOneTimeTotal

  return {
    currency: CURRENCY,
    serviceTotal,
    extrasOneTimeTotal,
    subtotal,
    total: subtotal,
    recurringMonthly,
    hasQuotable: hasQuotable(service, extras),
  }
}

/**
 * Formatea un importe en pesos argentinos (RN-PR-01).
 * Devuelve cadena vacía si el valor no es un número finito (por ejemplo `null`,
 * cuando el ítem es "a cotizar"): la UI decide qué mostrar en ese caso.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function formatARS(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return ARS_FORMATTER.format(value)
}
