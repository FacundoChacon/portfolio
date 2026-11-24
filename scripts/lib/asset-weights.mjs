/**
 * Resumen de pesos de `dist/assets` por tipo (función pura, sin I/O).
 * Lo usa el CLI `scripts/pesos-build.mjs` para comparar el build antes y después.
 */

const GROUPS = { css: ['.css'], fuentes: ['.woff2', '.woff'], js: ['.js'] }

/**
 * @param {{ name: string, bytes: number, gzipBytes: number }[]} files
 * @returns {Record<'css' | 'fuentes' | 'js', { count: number, bytes: number, gzipBytes: number }>}
 */
export function resumirPesos(files) {
  const total = () => ({ count: 0, bytes: 0, gzipBytes: 0 })
  const result = { css: total(), fuentes: total(), js: total() }
  for (const file of files) {
    const name = file.name.toLowerCase()
    const group = Object.keys(GROUPS).find((key) => GROUPS[key].some((ext) => name.endsWith(ext)))
    if (!group) continue
    result[group].count += 1
    result[group].bytes += file.bytes
    result[group].gzipBytes += file.gzipBytes
  }
  return result
}
