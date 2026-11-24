/**
 * Lógica pura de la barra de navegación: enlaces con códigos de sistema,
 * sección activa y teclas del menú móvil. Sin DOM, para poder testearla.
 */

/** Altura de la barra fija: 64px (h-16) + franja de 6px (h-1.5). Debe coincidir con `--eva-nav-h` en `index.css`. */
export const NAV_HEIGHT_PX = 70

/** Código de sistema de la marca. */
export const BRAND_CODE = '00'

/**
 * Enlaces de la home, en orden de documento.
 * @type {{ id: string, label: string, code: string }[]}
 */
export const NAV_LINKS = [
  { id: 'presentacion', label: 'Inicio', code: '01' },
  { id: 'quien-soy', label: 'Quién soy', code: '02' },
  { id: 'proyectos', label: 'Proyectos', code: '03' },
  { id: 'stack', label: 'Stack', code: '04' },
  { id: 'testimonios', label: 'Testimonios', code: '05' },
  { id: 'contacto', label: 'Contáctame', code: '06' },
]

/**
 * Enlaces visibles: quita los ids ocultos y renumera los códigos por posición
 * (`01`, `02`, …) para que la secuencia no tenga huecos.
 * @param {{ id: string, label: string, code: string }[]} links
 * @param {string[]} hiddenIds ids a omitir; los inexistentes se ignoran
 * @returns {{ id: string, label: string, code: string }[]} copia nueva, sin mutar `links`
 */
export function visibleNavLinks(links, hiddenIds) {
  return links
    .filter((link) => !hiddenIds.includes(link.id))
    .map((link, index) => ({ ...link, code: String(index + 1).padStart(2, '0') }))
}

/**
 * Ancla de una sección.
 * @param {string} id
 * @returns {string} p. ej. `#proyectos`
 */
export function navHref(id) {
  return `#${id}`
}

/**
 * Código de sistema visible.
 * @param {string} code
 * @returns {string} p. ej. `//03`
 */
export function navCode(code) {
  return `//${code}`
}

/**
 * Sección activa: la última de `order` presente entre las que intersectan la
 * zona de lectura (la que acaba de entrar; la anterior solo asoma por su borde
 * inferior). Independiente del orden de llegada de las entradas.
 * @param {string[]} order ids en orden de documento
 * @param {Set<string>} intersectingIds
 * @returns {string|null}
 */
export function pickActiveSection(order, intersectingIds) {
  return [...order].reverse().find((id) => intersectingIds.has(id)) ?? null
}

/**
 * Opciones del `IntersectionObserver`: zona de lectura entre el borde inferior
 * de la barra y el 40% superior del viewport.
 * @param {number} navHeightPx
 * @returns {{ rootMargin: string, threshold: number }}
 */
export function sectionObserverOptions(navHeightPx) {
  return { rootMargin: `-${navHeightPx}px 0px -60% 0px`, threshold: 0 }
}

/**
 * Acción de teclado del menú móvil.
 * @param {string} key valor de `KeyboardEvent.key`
 * @param {boolean} isOpen
 * @returns {'close'|null}
 */
export function menuKeyAction(key, isOpen) {
  return key === 'Escape' && isOpen ? 'close' : null
}
