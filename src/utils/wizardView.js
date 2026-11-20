/**
 * Helpers puros de vista del wizard (C-11): sin React ni DOM, para poder
 * testearlos con `node:test`. El cableado (refs, efectos) vive en la página.
 */

/** Anuncio de la región viva mientras hay un envío en curso. */
export const SUBMITTING_MESSAGE = 'Enviando tu solicitud…'

/** Título de la pantalla de éxito. */
export const SUCCESS_TITLE = '¡Solicitud enviada!'

/** Cierre común del mensaje de éxito (primera persona del singular). */
const SUCCESS_TAIL = 'Te respondo por email a la brevedad.'

/**
 * Clave de la vista visible: `'success'`, `'error'` o `'step-N'`.
 * @param {{ step: number, status?: string }} state
 * @returns {string}
 */
export function getViewKey(state) {
  if (state.status === 'success') return 'success'
  if (state.status === 'error') return 'error'
  return `step-${state.step}`
}

/**
 * Indica si el foco debe pasar al título de la nueva vista: solo cuando ambas
 * claves existen y difieren (la carga inicial, sin clave previa, no lo mueve).
 * @param {string|null|undefined} prevKey
 * @param {string|null|undefined} nextKey
 * @returns {boolean}
 */
export function shouldMoveFocus(prevKey, nextKey) {
  return Boolean(prevKey) && Boolean(nextKey) && prevKey !== nextKey
}

/**
 * Mensaje para la región `aria-live`: solo anuncia el envío en curso.
 * @param {{ submitting?: boolean }} state
 * @returns {string}
 */
export function getLiveMessage(state) {
  return state.submitting ? SUBMITTING_MESSAGE : ''
}

/**
 * Copy de la pantalla de éxito. Con nombre (string con contenido) lo saluda;
 * sin nombre usa un agradecimiento genérico, sin texto de relleno.
 * @param {unknown} name
 * @returns {{ title: string, body: string }}
 */
export function buildSuccessMessage(name) {
  const clean = typeof name === 'string' ? name.trim() : ''
  const thanks = clean ? `¡Gracias, ${clean}!` : '¡Gracias!'
  return { title: SUCCESS_TITLE, body: `${thanks} ${SUCCESS_TAIL}` }
}
