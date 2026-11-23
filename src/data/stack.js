/**
 * Tecnologías de la sección Stack. Todas comparten la paleta eva: se
 * distinguen por monograma, nombre, categoría y código de módulo, no por color.
 * @type {{ name: string, glyph: string, category: string }[]}
 */
export const STACK = [
  { name: 'Java 17', glyph: 'Jv', category: 'Lenguaje' },
  { name: 'Spring Boot', glyph: 'Sp', category: 'Backend' },
  { name: 'React 18', glyph: 'Re', category: 'Frontend' },
  { name: 'Tailwind CSS', glyph: 'Tw', category: 'Frontend' },
  { name: 'JavaScript', glyph: 'Js', category: 'Lenguaje' },
  { name: 'MySQL', glyph: 'Sql', category: 'Base de datos' },
  { name: 'Python', glyph: 'Py', category: 'Lenguaje' },
  { name: 'Docker', glyph: 'Dk', category: 'DevOps' },
  { name: 'Git', glyph: 'Git', category: 'Herramienta' },
  { name: 'REST API', glyph: 'Api', category: 'Backend' },
  { name: 'JWT', glyph: 'Jwt', category: 'Seguridad' },
  { name: 'HTML5 / CSS3', glyph: 'Web', category: 'Frontend' },
]

/**
 * Código de módulo visible, correlativo y con dos dígitos.
 * @param {number} index posición en `STACK` (desde 0)
 * @returns {string} p. ej. `MOD-01`
 */
export function moduleCode(index) {
  return `MOD-${String(index + 1).padStart(2, '0')}`
}
