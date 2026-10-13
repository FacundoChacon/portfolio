/**
 * Modelo de presentación del resumen de la solicitud.
 *
 * Función pura que combina el catálogo y el estado del wizard y devuelve el
 * listado listo para pintar: el tipo de sitio elegido (con su cantidad) y los
 * extras seleccionados. No hay precios: el resumen describe la solicitud, no
 * un importe.
 *
 * Vive fuera del componente `SummarySidebar` para poder testearse con
 * `node:test` sin DOM (el proyecto no usa testing-library ni jsdom).
 *
 * @typedef {Object} SummaryServiceLine
 * @property {string} id
 * @property {string} name
 * @property {number} quantity
 *
 * @typedef {Object} SummaryExtraLine
 * @property {string} id
 * @property {string} name
 * @property {string|null} disclaimer
 *
 * @typedef {Object} Summary
 * @property {SummaryServiceLine|null} service
 * @property {SummaryExtraLine[]} extras
 */

import { getSelectedExtras, getService } from './wizard.js'

/**
 * Arma el resumen de la solicitud a partir del estado del wizard y el catálogo.
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

  return {
    service: service
      ? {
          id: service.id,
          name: service.name,
          quantity,
        }
      : null,
    extras: selectedExtras.map((extra) => ({
      id: extra.id,
      name: extra.name,
      disclaimer: extra.disclaimer ?? null,
    })),
  }
}
