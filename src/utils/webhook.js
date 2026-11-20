/**
 * Integración con webhook externo (C-10).
 *
 * Mapea el estado del wizard al `LeadPayload` (KB 04 §LeadPayload), determina
 * si hay webhook configurado y envía el lead. El PDF se deja preparado para
 * integrarse con C-09 (`pdf` acepta null por ahora).
 *
 * El configurador no publica precios: el payload lleva la selección (tipo de
 * sitio, cantidad y extras) y los datos de contacto, sin importes.
 *
 * Reglas: ISO 8601, `source: 'facucode.dev/configurador'`,
 * RN-NT-03/RN-AB-02/RN-AB-04.
 */

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

  const form = state.form ?? {}
  const contact = {
    name: form.name?.trim() ?? '',
    email: form.email?.trim() ?? '',
    phone: form.phone?.trim() ?? '',
    project: form.project?.trim() ?? '',
  }

  const meta = {
    userAgent: String(globalThis.navigator?.userAgent ?? ''),
    referrer: (typeof globalThis !== 'undefined' && globalThis.document && globalThis.document.referrer) || '',
  }

  return {
    submittedAt: new Date().toISOString(),
    source: LEAD_SOURCE,
    service: service
      ? {
          id: service.id,
          name: service.name,
        }
      : null,
    quantity: qty,
    extras: selectedExtras.map((e) => ({
      id: e.id,
      name: e.name,
    })),
    contact,
    meta,
  }
}

/**
 * Arma las opciones de `fetch` para enviar el lead. Usa `text/plain` para que
 * sea un request "simple" (sin preflight CORS): receptores como Google Apps
 * Script no responden OPTIONS. El cuerpo sigue siendo JSON.
 * @param {object} payload LeadPayload
 * @param {{ pdf?: { mimeType: string, base64: string }|null }|undefined} opts
 * @returns {{ method: string, headers: Record<string, string>, body: string }}
 */
export function buildLeadRequest(payload, opts = { pdf: null }) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ payload, pdf: opts?.pdf ?? null }),
  }
}

/**
 * Tiempo máximo de espera del webhook. Apps Script a veces deja colgada la
 * redirección a `script.googleusercontent.com`; sin límite, la UI quedaría en
 * "Enviando..." para siempre. Tras el timeout se muestra el error con
 * "Reintentar" (si el script ya había corrido, el lead puede duplicarse).
 */
export const SEND_TIMEOUT_MS = 20000

/**
 * Envía el lead al webhook.
 * @param {object} payload LeadPayload
 * @param {{
 *   pdf?: { mimeType: string, base64: string }|null,
 *   url?: string,
 *   fetchImpl?: typeof fetch,
 *   timeoutMs?: number,
 * }} [opts] `url`/`fetchImpl`/`timeoutMs` existen para tests; por defecto usa
 *   `VITE_WEBHOOK_URL`, el `fetch` global y `SEND_TIMEOUT_MS`.
 * @returns {Promise<object>} Respuesta del webhook
 */
export async function sendLead(payload, opts = {}) {
  const {
    url = import.meta.env?.VITE_WEBHOOK_URL,
    fetchImpl = globalThis.fetch,
    timeoutMs = SEND_TIMEOUT_MS,
  } = opts
  if (!url || url.trim().length === 0) {
    throw new Error('Webhook no configurado: VITE_WEBHOOK_URL no está definido')
  }

  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(new Error(`El webhook no respondió a tiempo (${timeoutMs} ms)`)),
    timeoutMs,
  )

  try {
    const res = await fetchImpl(url, { ...buildLeadRequest(payload, opts), signal: controller.signal })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Error al enviar al webhook (${res.status}): ${text}`)
    }

    // Intentar parsear JSON si existe; si no, devolver vacío
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return await res.json().catch(() => ({}))
    }
    return {}
  } finally {
    clearTimeout(timer)
  }
}