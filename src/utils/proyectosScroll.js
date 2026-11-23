/**
 * Matemática pura del recorrido horizontal de la sección de proyectos.
 * Sin DOM: el hook mide y pasa números; acá solo se calcula.
 */

/** Cards por página. */
export const PER_PAGE = 3
/** Tramo de scroll (vh) en que cada página queda quieta. */
export const PLATEAU_VH = 25
/** Tramo de scroll (vh) en que se pasa de una página a la siguiente. */
export const TRANSITION_VH = 75
/** Espera (ms) sin scroll antes de asentar en la página más cercana. */
export const SETTLE_IDLE_MS = 150

const EPSILON = 1e-6

/** @param {number} value @param {number} min @param {number} max */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/** Curva 3t² − 2t³: llega a los extremos con velocidad cero. */
function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

/** @param {number} perPage */
function assertPerPage(perPage) {
  if (!(perPage >= 1)) throw new RangeError('perPage debe ser >= 1')
}

/**
 * Cantidad de páginas de `items` elementos. Entradas inválidas → 0.
 * @param {number} items
 * @param {number} [perPage]
 */
export function pageCount(items, perPage = PER_PAGE) {
  assertPerPage(perPage)
  if (!Number.isInteger(items) || items < 0) return 0
  return Math.ceil(items / perPage)
}

/**
 * Dónde va la card de cierre: en la pista si deja hueco (o no hay proyectos),
 * después de la pista si la última página ya está completa.
 * @param {number} n cantidad de proyectos
 * @param {number} [perPage]
 * @returns {'track'|'after'}
 */
export function ctaPlacement(n, perPage = PER_PAGE) {
  assertPerPage(perPage)
  return n > 0 && n % perPage === 0 ? 'after' : 'track'
}

/**
 * Elementos de la pista (proyectos + cierre si va en la pista).
 * @param {number} n
 * @param {number} [perPage]
 */
export function trackItemCount(n, perPage = PER_PAGE) {
  return ctaPlacement(n, perPage) === 'track' ? n + 1 : n
}

/** Tramo de scroll útil (vh) de `pages` páginas. */
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
 * Posición fraccional de página (0..pages-1) con mesetas y transiciones suaves.
 * @param {number} progress
 * @param {number} pages
 */
export function pagePosition(progress, pages) {
  if (!(pages > 1)) return 0
  const range = pinRangeVh(pages)
  const vh = clamp(progress, 0, 1) * range
  const cycle = PLATEAU_VH + TRANSITION_VH
  const k = Math.min(Math.floor(vh / cycle), pages - 1)
  const into = vh - k * cycle
  if (into <= PLATEAU_VH || k === pages - 1) return k
  return k + smoothstep((into - PLATEAU_VH) / TRANSITION_VH)
}

/** Paso horizontal entre páginas: ancho del contenedor + separación. */
export function pageStride(containerWidth, gap) {
  return containerWidth + gap
}

/** Desplazamiento X de la pista (nunca -0). */
export function trackOffset(position, stride) {
  return position === 0 ? 0 : -position * stride
}

/**
 * Progreso del centro de la meseta de `page`.
 * @param {number} page
 * @param {number} pages
 */
export function progressForPage(page, pages) {
  if (!(pages > 1)) return 0
  const k = clamp(page, 0, pages - 1)
  return (k * (PLATEAU_VH + TRANSITION_VH) + PLATEAU_VH / 2) / pinRangeVh(pages)
}

/**
 * scrollY al que la página `page` queda en el centro de su meseta.
 * @param {{ page: number, pages: number, top: number, range: number }} args
 */
export function scrollTopForPage({ page, pages, top, range }) {
  return Math.round(top + progressForPage(page, pages) * range)
}

/** Página (0-based) a la que pertenece el elemento `index`. */
export function pageOfItem(index, perPage = PER_PAGE) {
  return Math.floor(index / perPage)
}

/** Página a mostrar en el indicador. */
export function currentPage(position) {
  return Math.round(position)
}

/**
 * Página en la que asentar si el scroll quedó en plena transición; si no, null.
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
 * Modo de la sección según el entorno.
 * @param {{ pages: number, narrow: boolean, coarse: boolean, short: boolean, reducedMotion: boolean, supportsClip: boolean }} env
 * @returns {'pin'|'carousel'|'row'}
 */
export function layoutMode({ pages, narrow, coarse, short, reducedMotion, supportsClip }) {
  if (narrow || coarse || short || reducedMotion || !supportsClip) return 'carousel'
  return pages >= 2 ? 'pin' : 'row'
}

/** Texto para lectores de pantalla de cada card. */
export function projectLabel(index, total) {
  return `Proyecto ${index + 1} de ${total}`
}
