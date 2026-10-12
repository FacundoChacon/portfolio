import { extraPriceLabel } from './priceLabels.js'
import { buildSummary } from './summary.js'
import { STEPS, getSelectedExtras, getService } from './wizard.js'

/**
 * Modelo puro del paso de revisión (C-08).
 *
 * Deriva los bloques de la revisión (tipo de sitio, extras y datos de
 * contacto) con el paso que edita cada uno, y reutiliza `buildSummary` (C-06)
 * para los totales y las etiquetas de precio (C-07). Los componentes `ReviewStep`
 * quedan finos y la lógica es testeable con `node:test`.
 *
 * @typedef {Object} ReviewLine
 * @property {string} label
 * @property {string} value
 *
 * @typedef {Object} ReviewBlock
 * @property {'service'|'extras'|'contact'} id
 * @property {string} title
 * @property {number} editStep
 * @property {ReviewLine[]} lines
 *
 * @typedef {Object} Review
 * @property {ReturnType<typeof import('./summary.js').buildSummary>} summary
 * @property {ReviewBlock[]} blocks
 */

/**
 * @param {{serviceId?: string, extras?: string[], quantity?: number, form?: object}} [state]
 * @param {object[]} [services]
 * @param {object[]} [extras]
 * @returns {Review}
 */
export function buildReview(state = {}, services = [], extras = []) {
  // Normaliza el estado para tolerar un `extras` ausente (igual que buildSummary).
  const safeState = { ...state, extras: Array.isArray(state.extras) ? state.extras : [] }
  const summary = buildSummary(safeState, services, extras)

  const quantity = safeState.quantity ?? 1
  const service = getService(safeState, services)
  const selectedExtras = getSelectedExtras(safeState, extras)
  const form = safeState.form ?? {}

  const serviceLines = service
    ? [
        { label: 'Tipo de sitio', value: service.name },
        ...(quantity > 1 ? [{ label: 'Cantidad', value: `× ${quantity}` }] : []),
        { label: 'Importe', value: summary.service?.amountLabel ?? '—' },
      ]
    : [{ label: 'Tipo de sitio', value: 'Sin seleccionar' }]

  const extrasLines =
    selectedExtras.length > 0
      ? selectedExtras.map((extra) => ({ label: extra.name, value: extraPriceLabel(extra) }))
      : [{ label: 'Extras', value: 'Sin extras' }]

  const contactLines = [
    { label: 'Nombre', value: form.name?.trim() || '—' },
    { label: 'Email', value: form.email?.trim() || '—' },
    ...(form.phone?.trim() ? [{ label: 'Teléfono', value: form.phone.trim() }] : []),
    ...(form.project?.trim() ? [{ label: 'Proyecto', value: form.project.trim() }] : []),
  ]

  return {
    summary,
    blocks: [
      { id: 'service', title: 'Tipo de sitio', editStep: STEPS.SERVICE, lines: serviceLines },
      { id: 'extras', title: 'Extras', editStep: STEPS.EXTRAS, lines: extrasLines },
      { id: 'contact', title: 'Tus datos', editStep: STEPS.CONTACT, lines: contactLines },
    ],
  }
}