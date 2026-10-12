import {
  Briefcase,
  Building2,
  Layers,
  Newspaper,
  Rocket,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'

/**
 * Resolución de los iconos del catálogo (C-07).
 *
 * El catálogo guarda el icono como **string** (`service.icon`) y el build no
 * valida que exista en `lucide-react`. Este mapa lo traduce a componentes
 * importados explícitamente (un `import * as icons` arrastraría toda la
 * librería al bundle) y `resolveServiceIcon` cae a un reemplazo si el nombre es
 * desconocido, para que un typo no rompa el render.
 */

/** Mapa de nombres del catálogo → componentes de lucide-react. */
export const SERVICE_ICONS = {
  Rocket,
  Layers,
  ShoppingCart,
  Building2,
  Newspaper,
  Briefcase,
  Sparkles,
}

/** Icono de reemplazo para nombres desconocidos. */
export const FALLBACK_ICON = Sparkles

/**
 * Devuelve el componente de icono para un nombre del catálogo.
 * @param {string} [name]
 * @returns {import('lucide-react').LucideIcon}
 */
export function resolveServiceIcon(name) {
  return SERVICE_ICONS[name] ?? FALLBACK_ICON
}
