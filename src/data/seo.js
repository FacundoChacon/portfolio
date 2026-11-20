/**
 * Fuente única de metadatos por ruta pública (SEO).
 *
 * Módulo ESM sin dependencias: lo consumen el cliente (sincronización al
 * navegar), el build (`vite.config.js`) y los scripts/tests de Node.
 */

export const SITE_URL = 'https://www.facucode.dev'
export const OG_IMAGE = `${SITE_URL}/og-image.png`

/**
 * Páginas públicas. `socialTitle` / `socialDescription` (Open Graph y Twitter)
 * caen en `title` / `description` si no se declaran.
 * @type {ReadonlyArray<{ path: string, title: string, description: string, socialTitle?: string, socialDescription?: string }>}
 */
export const ROUTES = [
  {
    path: '/',
    title: 'Facundo Chacón | Desarrollador Full Stack Java / React',
    description:
      'Portfolio de Facundo Chacón, desarrollador Full Stack Java / React. Proyectos, stack y creación de sitios web a medida.',
    socialDescription: 'Desarrollador Full Stack Java / React. Proyectos, stack y creación de sitios web a medida.',
  },
  {
    path: '/configurador',
    title: 'Armá tu presupuesto web | Facundo Chacón',
    description:
      'Elegí el tipo de sitio, sumá extras y pedime un presupuesto para tu página web. Te respondo por email.',
  },
]

/**
 * URL canónica absoluta de una ruta: la home con barra final, el resto sin ella.
 * @param {string} path
 * @returns {string}
 */
export function canonicalUrl(path) {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
}

/**
 * Metadatos resueltos de una ruta, listos para aplicar al `<head>`.
 * @typedef {object} RouteMeta
 * @property {string} path
 * @property {string} title
 * @property {string} description
 * @property {string} socialTitle
 * @property {string} socialDescription
 * @property {string} canonical
 * @property {string} image
 */

/** Quita la barra final (salvo en la raíz). */
function normalizePath(pathname) {
  const path = String(pathname || '/')
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}

/**
 * Resuelve la meta de una ruta; una ruta desconocida devuelve la de la home
 * (la SPA redirige las rutas inexistentes a `/`).
 * @param {string} pathname
 * @returns {RouteMeta}
 */
export function resolveRouteMeta(pathname) {
  const path = normalizePath(pathname)
  const route = ROUTES.find((r) => r.path === path) ?? ROUTES[0]
  return {
    path: route.path,
    title: route.title,
    description: route.description,
    socialTitle: route.socialTitle ?? route.title,
    socialDescription: route.socialDescription ?? route.description,
    canonical: canonicalUrl(route.path),
    image: OG_IMAGE,
  }
}
