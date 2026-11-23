/**
 * Matemática pura del tramo fijado de la sección de proyectos.
 * Las "paradas" son los proyectos. Sin DOM: el hook mide y pasa números.
 */

/** Tramo de scroll (vh) en que cada proyecto queda quieto. */
export const PLATEAU_VH = 15
/** Tramo de scroll (vh) en que se pasa de un proyecto al siguiente. */
export const TRANSITION_VH = 45
/** Espera (ms) sin scroll antes de asentar; supera el intervalo típico entre muescas de la rueda. */
export const SETTLE_IDLE_MS = 300
/**
 * Fracción (lineal, 0..1) del tramo de transición que el scroll debe haber salido de la meseta
 * para asentar en el sentido del movimiento. Es chica a propósito: una muesca de rueda (~100 px)
 * desde el centro de la meseta apenas supera el borde y debe bastar para avanzar.
 */
export const SETTLE_DIRECTION_THRESHOLD = 0.05

const EPSILON = 1e-6
const CYCLE_VH = PLATEAU_VH + TRANSITION_VH

/** @param {number} value @param {number} min @param {number} max */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/** Curva 3t² − 2t³: llega a los extremos con velocidad cero. */
export function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

/**
 * Inversa de `smoothstep` en [0, 1] (forma cerrada). Fuera del rango se acota.
 * @param {number} y
 */
export function smoothstepInverse(y) {
  if (!(y > 0)) return 0
  if (y >= 1) return 1
  return 0.5 - Math.sin(Math.asin(1 - 2 * y) / 3)
}

/** Tramo de scroll útil (vh) de `pages` paradas. */
export function pinRangeVh(pages) {
  return pages * PLATEAU_VH + (pages - 1) * TRANSITION_VH
}

/** Alto (vh) de la sección fijada; 0 = sin pin. */
export function pinHeightVh(pages) {
  return pages < 2 ? 0 : 100 + pinRangeVh(pages)
}

/**
 * Progreso 0..1 del scroll dentro del tramo.
 * @param {{ scrollY: number, top: number, range: number }} args
 */
export function scrollProgress({ scrollY, top, range }) {
  if (!(range > 0)) return 0
  return clamp((scrollY - top) / range, 0, 1)
}

/**
 * Posición fraccional (0..pages-1) con mesetas y transiciones suaves.
 * @param {number} progress
 * @param {number} pages
 */
export function pagePosition(progress, pages) {
  if (!(pages > 1)) return 0
  const vh = clamp(progress, 0, 1) * pinRangeVh(pages)
  const k = Math.min(Math.floor(vh / CYCLE_VH), pages - 1)
  const into = vh - k * CYCLE_VH
  if (into <= PLATEAU_VH || k === pages - 1) return k
  return k + smoothstep((into - PLATEAU_VH) / TRANSITION_VH)
}

/**
 * Progreso del centro de la meseta de `page`.
 * @param {number} page
 * @param {number} pages
 */
export function progressForPage(page, pages) {
  if (!(pages > 1)) return 0
  const k = clamp(page, 0, pages - 1)
  return (k * CYCLE_VH + PLATEAU_VH / 2) / pinRangeVh(pages)
}

/**
 * Inversa de `pagePosition`: progreso para una posición fraccional.
 * Un entero devuelve el centro de su meseta.
 * @param {number} position
 * @param {number} pages
 */
export function progressForPosition(position, pages) {
  if (!(pages > 1)) return 0
  const p = clamp(position, 0, pages - 1)
  const k = Math.floor(p)
  const f = p - k
  if (f < EPSILON) return progressForPage(k, pages)
  return (k * CYCLE_VH + PLATEAU_VH + smoothstepInverse(f) * TRANSITION_VH) / pinRangeVh(pages)
}

/**
 * scrollY al que la parada `page` queda en el centro de su meseta.
 * @param {{ page: number, pages: number, top: number, range: number }} args
 */
export function scrollTopForPage({ page, pages, top, range }) {
  return Math.round(top + progressForPage(page, pages) * range)
}

/**
 * scrollY correspondiente a una posición fraccional del carrete.
 * @param {{ position: number, pages: number, top: number, range: number }} args
 */
export function scrollTopForPosition({ position, pages, top, range }) {
  return Math.round(top + progressForPosition(position, pages) * range)
}

/**
 * Parada en la que asentar si el scroll quedó en plena transición; si no, null.
 * @param {number} progress
 * @param {number} pages
 * @returns {number|null}
 */
export function settleTarget(progress, pages) {
  if (!(pages > 1)) return null
  const position = pagePosition(progress, pages)
  const target = Math.round(position)
  return Math.abs(position - target) < EPSILON ? null : target
}

/**
 * Como `settleTarget`, pero en el sentido del último movimiento (`direction` > 0 avanza,
 * < 0 retrocede, 0 = más cercano). Si el scroll salió de la meseta en más de
 * `SETTLE_DIRECTION_THRESHOLD` de la transición, completa el giro hacia donde iba; si no, vuelve a la meseta.
 * Así scrollear despacio (muescas separadas por más que la espera) no devuelve al anterior.
 * @param {number} progress
 * @param {number} pages
 * @param {number} direction
 * @returns {number|null}
 */
export function settleTargetDirectional(progress, pages, direction) {
  if (!(pages > 1)) return null
  const position = pagePosition(progress, pages)
  const lower = Math.floor(position)
  const fraction = position - lower
  if (fraction < EPSILON || 1 - fraction < EPSILON) return null
  if (!direction) return Math.round(position)
  const t = smoothstepInverse(fraction)
  if (direction > 0) return t > SETTLE_DIRECTION_THRESHOLD ? lower + 1 : lower
  return 1 - t > SETTLE_DIRECTION_THRESHOLD ? lower : lower + 1
}

/**
 * Modo de la sección según el entorno.
 * @param {{ webgl2: boolean, short: boolean, supportsClip: boolean, failed: boolean }} env
 * @returns {'reel'|'carousel'}
 */
export function projectsMode({ webgl2, short, supportsClip, failed }) {
  return !webgl2 || short || !supportsClip || failed ? 'carousel' : 'reel'
}

/** Texto para lectores de pantalla de cada card. */
export function projectLabel(index, total) {
  return `Proyecto ${index + 1} de ${total}`
}
