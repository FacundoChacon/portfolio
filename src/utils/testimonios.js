/**
 * Lógica pura de presentación de los testimonios. Sin DOM, para poder testearla.
 */

/**
 * Una calificación es válida solo si es un entero de 1 a 5.
 * @param {unknown} rating
 * @returns {boolean}
 */
export function hasValidRating(rating) {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5
}

/**
 * Iniciales (mayúscula) de las dos primeras palabras del nombre.
 * @param {string} nombre
 * @returns {string} p. ej. `AM`; cadena vacía si no hay palabras
 */
export function inicialesDe(nombre) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join('')
}

/**
 * Código correlativo de mensaje entrante.
 * @param {number} index posición base 0
 * @returns {string} p. ej. `MSG-001`
 */
export function messageCode(index) {
  return `MSG-${String(index + 1).padStart(3, '0')}`
}

/**
 * Texto alternativo de la calificación.
 * @param {number} rating
 * @returns {string} p. ej. `Calificación: 4 de 5`
 */
export function ratingLabel(rating) {
  return `Calificación: ${rating} de 5`
}
