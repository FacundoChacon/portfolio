/**
 * Enlaces visibles de la home: la barra y el encabezado de Contacto los
 * consumen para que los códigos de sistema coincidan. El enlace a Testimonios
 * solo existe si hay testimonios (misma condición que `Testimonials.jsx`).
 */
import testimonios from '../data/testimonios.js'
import { NAV_LINKS, visibleNavLinks } from './siteNav.js'

/**
 * @param {unknown[]} items testimonios cargados
 * @returns {{ id: string, label: string, code: string }[]}
 */
export function homeNavLinks(items) {
  return visibleNavLinks(NAV_LINKS, items.length === 0 ? ['testimonios'] : [])
}

/** Enlaces de la home con los datos reales. */
export const HOME_NAV_LINKS = homeNavLinks(testimonios)
