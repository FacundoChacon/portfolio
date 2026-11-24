/**
 * Verificación de chunks del build: ningún chunk JS debe contener Three.js
 * (WebGLRenderer). Guarda de regresión: el panel de proyectos no usa motor 3D.
 */

const MARKER = 'WebGLRenderer'

/**
 * @param {{ entry: { file: string, code: string } | null, chunks: Array<{ file: string, code: string }> }} args
 * @returns {string[]} errores (vacío si todo está bien)
 */
export function checkChunks({ entry, chunks }) {
  if (!entry) return ['no se encontró el chunk de entrada']
  return chunks.filter((c) => c.code.includes(MARKER)).map((c) => `${c.file} contiene ${MARKER}: el sitio no debe incluir un motor 3D`)
}
