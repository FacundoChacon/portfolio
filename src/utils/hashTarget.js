/**
 * Entrada directa por ancla (`/#proyectos`): la SPA se monta después de que el navegador
 * intenta el ancla, así que la home la resuelve a mano. Funciones puras, sin DOM.
 */

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/

/**
 * Id de elemento al que apunta un `location.hash`, o null si no es un id simple y seguro.
 * @param {unknown} hash
 * @returns {string|null}
 */
export function resolveHashTarget(hash) {
  if (typeof hash !== 'string' || !hash.startsWith('#')) return null
  let id
  try {
    id = decodeURIComponent(hash.slice(1))
  } catch {
    return null
  }
  return ID_PATTERN.test(id) ? id : null
}

/**
 * Solo una navegación nueva aplica el ancla: al volver/adelante o recargar manda la
 * restauración de scroll del navegador.
 * @param {string|undefined} navigationType `PerformanceNavigationTiming.type`
 */
export function shouldApplyHash(navigationType) {
  return navigationType !== 'back_forward' && navigationType !== 'reload'
}
