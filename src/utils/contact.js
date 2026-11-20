/**
 * Enlaces de contacto de respaldo (RN-AB-04).
 */

/**
 * Arma el enlace de WhatsApp (`https://wa.me/<número>?text=<mensaje>`).
 * El número se normaliza a solo dígitos, en formato internacional sin `+`
 * (Argentina celular: 54 9 + característica + número).
 *
 * @param {string|undefined|null} number Número de WhatsApp (p. ej. `VITE_WHATSAPP_NUMBER`)
 * @param {string} [text] Mensaje inicial prellenado
 * @returns {string|null} URL, o `null` si no hay número válido (no mostrar el botón)
 */
export function buildWhatsAppUrl(number, text) {
  const digits = String(number ?? '').replace(/\D/g, '')
  if (digits.length === 0) return null
  const base = `https://wa.me/${digits}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}
