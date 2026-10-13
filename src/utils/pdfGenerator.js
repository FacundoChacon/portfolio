/**
 * Generador del PDF del presupuesto (C-09).
 *
 * Punto único por el que se renderiza el PDF en el cliente (RN-PD-01) a partir
 * del `LeadPayload`. Acá viven las dos preocupaciones que el roadmap exige:
 *
 *  - **Carga diferida**: `@react-pdf/renderer` y el documento se importan de
 *    forma dinámica dentro de `buildPdfBlob`. Vite los separa en su propio
 *    chunk: la librería (pesada) nunca entra al bundle inicial del configurador.
 *  - **Best-effort (RN-PD-03)**: `tryBuildPdfBlob` convierte cualquier fallo
 *    (payload inválido, error de render, memoria) en `null`. El flujo de envío
 *    (C-10) procede igual y marca `pdf: false`.
 *
 * Este módulo queda ligero y sin estados: `bufferToBase64` es puro y
 * testeable con `node:test`.
 */

/**
 * Lanza el render del documento y devuelve el buffer del PDF.
 * @param {object} payload LeadPayload (KB 04 §LeadPayload).
 * @returns {Promise<Uint8Array>} Buffer listo para Blob o `renderToBuffer`.
 */
export async function buildPdfBlob(payload) {
  const [{ renderToBuffer }, { buildPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./pdfDocument.js'),
  ])
  return renderToBuffer(buildPdfDocument(payload))
}

/**
 * Best-effort (RN-PD-03): `Uint8Array` con el PDF, o `null` si algo falló.
 * Nunca lanza hacia el flujo de envío.
 * @param {object} payload LeadPayload.
 * @returns {Promise<Uint8Array|null>}
 */
export async function tryBuildPdfBlob(payload) {
  try {
    return await buildPdfBlob(payload)
  } catch {
    return null
  }
}

/** Tamaño de chunk para armar el binario en base64 (evita stack overflow). */
const CHUNK = 0x8000

/**
 * Convierte el buffer del PDF a una cadena base64 para adjuntarlo al webhook
 * (KB 07, Flujo 3). Funciona igual en el navegador y en Node (btoa global).
 * @param {ArrayBuffer|Uint8Array} buffer
 * @returns {string}
 */
export function bufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}