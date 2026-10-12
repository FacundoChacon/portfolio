/**
 * Etiquetas de precio del configurador (C-07).
 *
 * Centraliza cómo se muestra el precio de un ítem del catálogo, para que las
 * cards (C-07) y el resumen (C-06) no dupliquen las reglas: "A cotizar" para
 * `priceARS: null` (RN-CO-01), "Sin costo" para un extra de precio 0 (RN-HD-01)
 * y el sufijo "/mes" para los recurrentes (RN-PR-05).
 *
 * Módulo puro (sin React): testeable con `node:test`.
 */

import { formatARS } from './pricing.js'

/** Etiqueta de un ítem sin precio fijo. */
export const QUOTABLE_LABEL = 'A cotizar'
/** Etiqueta de un extra de precio 0. */
export const FREE_LABEL = 'Sin costo'

/**
 * Normaliza un precio a un número utilizable (0 si no es un número finito).
 * @param {unknown} value
 * @returns {number}
 */
const toAmount = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0

/**
 * Precio de referencia de un tipo de sitio (precio unitario, sin cantidad).
 * @param {{priceARS?: number|null, quotable?: boolean}|null} service
 * @returns {string}
 */
export function servicePriceLabel(service) {
  if (service?.quotable === true) return QUOTABLE_LABEL
  return formatARS(toAmount(service?.priceARS))
}

/**
 * Importe de la línea del servicio en el resumen (precio × cantidad ya
 * calculado). "A cotizar" si el servicio es cotizable.
 * @param {{quotable?: boolean}|null} service
 * @param {number} total
 * @returns {string}
 */
export function serviceLineLabel(service, total) {
  if (service?.quotable === true) return QUOTABLE_LABEL
  return formatARS(total)
}

/**
 * Precio de un extra: "<importe>/mes" si es recurrente, "Sin costo" si vale 0,
 * o el importe formateado.
 * @param {{priceARS?: number|null, recurring?: boolean}|null} extra
 * @returns {string}
 */
export function extraPriceLabel(extra) {
  const amount = toAmount(extra?.priceARS)
  if (extra?.recurring === true) return `${formatARS(amount)}/mes`
  if (amount === 0) return FREE_LABEL
  return formatARS(amount)
}
