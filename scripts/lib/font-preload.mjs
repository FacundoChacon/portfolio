/**
 * Precarga de la fuente principal del primer render (funciones puras, sin I/O).
 * Hoy el texto de cuerpo usa Rajdhani 400; `hero-brutalista` cambiará esta
 * lista a la serif de títulos cuando el hero la use (precargar una fuente sin
 * uso hace que Chrome advierta "preloaded but not used").
 */
export const PRELOAD_FONT_STEMS = ['rajdhani-latin-400-normal']

/**
 * Resuelve cada stem (`<familia>-latin-<peso>-normal`) al `.woff2` con hash del
 * bundle. Falla si falta o está repetido: así el build no pasa en silencio.
 * @param {string[]} fileNames nombres de archivo del bundle (`assets/x-hash.woff2`)
 * @param {string[]} stems
 * @returns {string[]} rutas absolutas (`/assets/...`) en el orden de `stems`
 */
export function findFontAssets(fileNames, stems) {
  return stems.map((stem) => {
    const matches = fileNames.filter((name) => {
      const prefix = `assets/${stem}-`
      return name.startsWith(prefix) && name.endsWith('.woff2') && !name.slice(prefix.length).includes('/')
    })
    if (matches.length === 0) throw new Error(`font-preload: no se encontró el .woff2 de la fuente "${stem}" en el bundle`)
    if (matches.length > 1) {
      throw new Error(`font-preload: la fuente "${stem}" tiene más de uno coincidente en el bundle: ${matches.join(', ')}`)
    }
    return `/${matches[0]}`
  })
}

/**
 * Descriptores `<link rel="preload">` para `transformIndexHtml`. `crossorigin`
 * es obligatorio en precargas de fuentes (si no, se descargan dos veces).
 * @param {string[]} hrefs
 */
export function fontPreloadTags(hrefs) {
  return hrefs.map((href) => ({
    tag: 'link',
    attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href, crossorigin: true },
    injectTo: 'head',
  }))
}
