/**
 * Precarga de la fuente principal del primer render (funciones puras, sin I/O).
 * Se precarga la serif de títulos (Noto Serif Display, ejes wght y wdth): el
 * `h1` del hero y la marca de la barra (`NavBrand`, presente también en
 * `/configurador`) la usan desde el primer render, así que Chrome nunca avisa
 * "preloaded but not used" en ninguna ruta (design D5 de `hero-brutalista`).
 * Rajdhani (texto de cuerpo chico) hace swap sin precarga. Plan B si el LCP
 * empeora más de 10%: volver a `['rajdhani-latin-400-normal']`.
 */
export const PRELOAD_FONT_STEMS = ['noto-serif-display-latin-wdth-normal']

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

/**
 * Stems cuyo `<stem>.woff2` no aparece en ningún `url()` del CSS de fuentes:
 * detecta que la lista de precarga quedó desincronizada de `fonts.css`.
 * `latin-ext` no cuenta como `latin` (el stem completo debe coincidir).
 * @param {string} fontsCss
 * @param {string[]} stems
 * @returns {string[]}
 */
export function missingFontStems(fontsCss, stems) {
  return stems.filter((stem) => {
    const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
    return !new RegExp(String.raw`(?:^|[/'"(])${escaped}\.woff2`).test(fontsCss)
  })
}
