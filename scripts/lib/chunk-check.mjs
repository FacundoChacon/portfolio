/**
 * Verificación de chunks del build: Three.js (WebGLRenderer) debe vivir solo en
 * su chunk bajo demanda, nunca en el de entrada, y ese chunk entra en presupuesto.
 */

/** Presupuesto del chunk 3D (bytes gzip). */
export const MAX_3D_CHUNK_GZIP = 150 * 1024

const MARKER = 'WebGLRenderer'

/**
 * @param {{ entry: { file: string, code: string } | null, chunks: Array<{ file: string, code: string, gzipBytes: number }>, maxGzipBytes?: number }} args
 * @returns {string[]} errores (vacío si todo está bien)
 */
export function checkChunks({ entry, chunks, maxGzipBytes = MAX_3D_CHUNK_GZIP }) {
  if (!entry) return ['no se encontró el chunk de entrada']
  const errors = []
  if (entry.code.includes(MARKER)) errors.push(`el chunk de entrada (${entry.file}) contiene ${MARKER}: Three.js debe cargarse bajo demanda`)
  const three = chunks.filter((c) => c.file !== entry.file && c.code.includes(MARKER))
  if (three.length === 0) errors.push(`ningún chunk contiene ${MARKER}: ¿se rompió la carga diferida del carrete?`)
  for (const chunk of three) {
    if (chunk.gzipBytes > maxGzipBytes) {
      errors.push(`${chunk.file} pesa ${(chunk.gzipBytes / 1024).toFixed(1)} KB gz y el presupuesto es ${Math.round(maxGzipBytes / 1024)} KB`)
    }
  }
  return errors
}
