/**
 * Preferencia de movimiento reducido (C-11): helper puro con `matchMedia`
 * inyectable para poder testearlo sin DOM.
 */

/** Media query estándar de movimiento reducido. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Indica si el usuario pidió movimiento reducido. Sin `matchMedia` (SSR, tests)
 * o si este lanza, devuelve `false` (se anima como siempre).
 * @param {((query: string) => { matches: boolean })|undefined} [matchMediaImpl]
 * @returns {boolean}
 */
export function prefersReducedMotion(matchMediaImpl = globalThis.matchMedia) {
  if (typeof matchMediaImpl !== 'function') return false
  try {
    return matchMediaImpl(REDUCED_MOTION_QUERY)?.matches === true
  } catch {
    return false
  }
}

/**
 * Decide si un elemento con revelado debe mostrarse de inmediato, sin crear un
 * IntersectionObserver: con movimiento reducido o si el navegador no lo ofrece.
 * @param {{ reducedMotion: boolean, hasIntersectionObserver: boolean }} state
 * @returns {boolean}
 */
export function shouldRevealImmediately({ reducedMotion, hasIntersectionObserver }) {
  return reducedMotion || !hasIntersectionObserver
}
