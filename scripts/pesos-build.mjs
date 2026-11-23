/**
 * Imprime los pesos de `dist/assets` (crudo y gzip) por tipo.
 * Uso: `node scripts/pesos-build.mjs [carpeta-dist]` (por defecto `dist`).
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

import { resumirPesos } from './lib/asset-weights.mjs'

const dist = process.argv[2] ?? 'dist'
const dir = join(dist, 'assets')
const files = readdirSync(dir).map((name) => {
  const data = readFileSync(join(dir, name))
  return { name, bytes: data.length, gzipBytes: gzipSync(data).length }
})
const kb = (n) => `${(n / 1024).toFixed(1)} KB`
for (const [group, { count, bytes, gzipBytes }] of Object.entries(resumirPesos(files))) {
  console.log(`${group.padEnd(8)} ${String(count).padStart(2)} archivos  crudo ${kb(bytes).padStart(9)}  gzip ${kb(gzipBytes).padStart(9)}`)
}
