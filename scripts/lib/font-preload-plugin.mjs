import { PRELOAD_FONT_STEMS, findFontAssets, fontPreloadTags } from './font-preload.mjs'

/**
 * Inyecta en el HTML del build la precarga de la fuente principal del primer
 * render (`PRELOAD_FONT_STEMS`), resolviendo el nombre con hash desde el
 * bundle. `routeHtmlPlugin` clona luego ese HTML a cada ruta pública. Si la
 * fuente no está en el bundle, el build falla.
 */
export function fontPreloadPlugin({ stems = PRELOAD_FONT_STEMS } = {}) {
  return {
    name: 'font-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const hrefs = findFontAssets(Object.keys(ctx.bundle ?? {}), stems)
        return fontPreloadTags(hrefs)
      },
    },
  }
}
