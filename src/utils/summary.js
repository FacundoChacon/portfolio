/**
 * Modelo de presentación del resumen del presupuesto (C-06).
 *
 * Función pura que combina el catálogo (C-03), el estado del wizard (C-05) y el
 * cálculo (C-04) y devuelve el desglose listo para pintar: líneas del servicio y
 * de los extras, importe mensual, total y las etiquetas especiales
 * ("A cotizar", "Sin costo", "<importe>/mes").
 *
 * Vive fuera del componente `SummarySidebar` para poder testearse con
 * `node:test` sin DOM (el proyecto no usa testing-library ni jsdom).
 *
 * @typedef {Object} SummaryLine
 * @property {string} id
 * @property {string} name
 * @property {number} amount
 * @property {string} amountLabel
 *
 * @typedef {Object} SummaryServiceLine
 * @property {string} id
 * @property {string} name
 * @property {number} quantity
 * @property {boolean} quotable
 * @property {number} amount
 * @property {string} amountLabel
 *
 * @typedef {Object} SummaryExtraLine
 * @property {string} id
 * @property {string} name
 * @property {number} priceARS
 * @property {boolean} recurring
 * @property {string} amountLabel
 * @property {string|null} disclaimer
 *
 * @typedef {Object} Summary
 * @property {string} currency
 * @property {boolean} hasQuotable
 * @property {number} oneTimeTotal
 * @property {string} totalLabel
 * @property {number} recurringMonthly
 * @property {string} recurringLabel   Cadena vacía si no hay recurrentes.
 * @property {SummaryServiceLine|null} service
 * @property {SummaryExtraLine[]} extras
 */

import { extraPriceLabel, serviceLineLabel } from './priceLabels.js'
import { computeTotal, formatARS } from './pricing.js'
import { getSelectedExtras, getService } from './wizard.js'

/**
 * Arma el resumen del presupuesto a partir del estado del wizard y el catálogo.
 *
 * @param {{serviceId?: string, extras?: string[], quantity?: number}} [state]
 * @param {object[]} [services]
 * @param {object[]} [extras]
 * @returns {Summary}
 */
export function buildSummary(state = {}, services = [], extras = []) {
  const quantity = state.quantity ?? 1
  // Normaliza el estado para tolerar un `extras` ausente (estado vacío).
  const safeState = { ...state, extras: Array.isArray(state.extras) ? state.extras : [] }
  const service = getService(safeState, services)
  const selectedExtras = getSelectedExtras(safeState, extras)
  const quote = computeTotal(service, quantity, selectedExtras)

  return {
    currency: quote.currency,
    hasQuotable: quote.hasQuotable,
    oneTimeTotal: quote.total,
    totalLabel: formatARS(quote.total),
    recurringMonthly: quote.recurringMonthly,
    recurringLabel: quote.recurringMonthly > 0 ? formatARS(quote.recurringMonthly) : '',
    service: service
      ? {
          id: service.id,
          name: service.name,
          quantity,
          quotable: service.quotable === true,
          amount: quote.serviceTotal,
          amountLabel: serviceLineLabel(service, quote.serviceTotal),
        }
      : null,
    extras: selectedExtras.map((extra) => ({
      id: extra.id,
      name: extra.name,
      priceARS: extra.priceARS,
      recurring: extra.recurring === true,
      amountLabel: extraPriceLabel(extra),
      disclaimer: extra.disclaimer ?? null,
    })),
  }
}
