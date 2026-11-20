/**
 * Sincroniza los metadatos del `<head>` con la ruta activa de la SPA.
 *
 * Solo actualiza elementos que ya existen (el HTML servido siempre los trae) y
 * únicamente `title`, description y canonical: los scrapers de previews no
 * ejecutan JS, así que `og:*` / `twitter:*` no se tocan en el cliente.
 * @param {{ title: string, querySelector: (selector: string) => ({ setAttribute: (name: string, value: string) => void } | null) }} doc
 * @param {import('../data/seo.js').RouteMeta} meta
 */
export function applyRouteMeta(doc, meta) {
  doc.title = meta.title
  doc.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
  doc.querySelector('link[rel="canonical"]')?.setAttribute('href', meta.canonical)
}
