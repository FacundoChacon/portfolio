/**
 * Integración con webhook externo (C-10).
 *
 * Mapea el estado del wizard al `LeadPayload` (KB 04 §LeadPayload), determina
 * si hay webhook configurado y envía el lead. El PDF se deja preparado para
 * integrarse con C-09 (`pdf` acepta null por ahora).
 *
 * Reglas: ISO 8601, `source: 'facucode.dev/configurador'`, usa `computeTotal`
 * (única fuente de verdad de totales), RN-NT-03/RN-AB-02/RN-AB-04.
 */

import { computeTotal } from './pricing.js'

/** Origen del lead. */
export const LEAD_SOURCE = 'facucode.dev/configurador'

/**
 * Indica si el webhook está configurado.
 * @returns {boolean}
 */
export function isWebhookConfigured() {
  try {
    const url = import.meta.env?.VITE_WEBHOOK_URL
    return typeof url === 'string' && url.trim().length > 0
  } catch {
    return false
  }
}

/**
 * Arma el `LeadPayload` a partir del estado del wizard y catálogos.
 * @param {object} state Estado de useConfigurador (step, serviceId, extras[], quantity, form, submitted, status, submitting)
 * @param {Array<object>} services Catálogo de servicios
 * @param {Array<object>} extras Catálogo de extras
 * @returns {object} LeadPayload
 */
export function buildLeadPayload(state, services = [], extras = []) {
  const service = services.find((s) => s.id === state.serviceId) ?? null
  const selectedExtras = (state.extras ?? [])
    .map((id) => extras.find((e) => e.id === id))
    .filter(Boolean)
  const qty = typeof state.quantity === 'number' && state.quantity >= 1 ? state.quantity : 1

  const totals = computeTotal(service, qty, selectedExtras)

  const form = state.form ?? {}
  const contact = {
    name: form.name?.trim() ?? '',
    email: form.email?.trim() ?? '',
    phone: form.phone?.trim() ?? '',
    project: form.project?.trim() ?? '',
  }

  const meta = {
    userAgent: 'node:test',
    referrer: (typeof globalThis !== 'undefined' && globalThis.document && globalThis.document.referrer) || '',
  }

  return {
    submittedAt: new Date().toISOString(),
    source: LEAD_SOURCE,
    service: service
      ? {
          id: service.id,
          name: service.name,
          priceARS: service.priceARS,
        }
      : null,
    quantity: qty,
    extras: selectedExtras.map((e) => ({
      id: e.id,
      name: e.name,
      priceARS: e.priceARS,
      recurring: e.recurring === true,
    })),
    hasQuotable: totals.hasQuotable,
    subtotal: totals.subtotal,
    total: totals.total,
    currency: totals.currency,
    contact,
    meta,
  }
}

/**
 * Envía el lead al webhook.
 * @param {object} payload LeadPayload
 * @param {{ pdf?: { mimeType: string, base64: string }|null }|undefined} opts
 * @returns {Promise<object>} Respuesta del webhook
 */
export async function sendLead(payload, opts = { pdf: null }) {
  const url = import.meta.env?.VITE_WEBHOOK_URL
  if (!url || url.trim().length === 0) {
    throw new Error('Webhook no configurado: VITE_WEBHOOK_URL no está definido')
  }

  const body = {
    payload,
    pdf: opts.pdf ?? null,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Error al enviar al webhook (${res.status}): ${text}`)
  }

  // Intentar parsear JSON si existe; si no, devolver vacío
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json().catch(() => ({}))
  }
  return {}
}