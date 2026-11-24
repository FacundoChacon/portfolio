/**
 * Tecnologías de la sección Stack. La identificación la dan monograma, nombre, categoría y
 * código de módulo; el color de marca (`brand`, clave de `EVA_BRAND_COLORS` en
 * `src/styles/eva-tokens.js`) es solo decorativo y se enciende al interactuar
 * (change `colores-de-marca-hover`). Los datos no llevan hex.
 * @type {{ name: string, brand: string, glyph: string, category: string }[]}
 */
export const STACK = [
  { name: 'Java 17', brand: 'java', glyph: 'Jv', category: 'Lenguaje' },
  { name: 'Spring Boot', brand: 'spring', glyph: 'Sp', category: 'Backend' },
  { name: 'React 18', brand: 'react', glyph: 'Re', category: 'Frontend' },
  { name: 'Tailwind CSS', brand: 'tailwind', glyph: 'Tw', category: 'Frontend' },
  { name: 'JavaScript', brand: 'javascript', glyph: 'Js', category: 'Lenguaje' },
  { name: 'MySQL', brand: 'mysql', glyph: 'Sql', category: 'Base de datos' },
  { name: 'Python', brand: 'python', glyph: 'Py', category: 'Lenguaje' },
  { name: 'Docker', brand: 'docker', glyph: 'Dk', category: 'DevOps' },
  { name: 'Git', brand: 'git', glyph: 'Git', category: 'Herramienta' },
  { name: 'REST API', brand: 'rest', glyph: 'Api', category: 'Backend' },
  { name: 'JWT', brand: 'jwt', glyph: 'Jwt', category: 'Seguridad' },
  { name: 'HTML5 / CSS3', brand: 'web', glyph: 'Web', category: 'Frontend' },
]

/**
 * Código de módulo visible, correlativo y con dos dígitos.
 * @param {number} index posición en `STACK` (desde 0)
 * @returns {string} p. ej. `MOD-01`
 */
export function moduleCode(index) {
  return `MOD-${String(index + 1).padStart(2, '0')}`
}
