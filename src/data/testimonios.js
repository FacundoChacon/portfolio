/**
 * Testimonios del portfolio.
 *
 * Fuente de verdad única de la sección "04. Testimonios" de la home. Es un dato
 * editable: cargar los testimonios reales acá no requiere tocar ningún
 * componente de UI. Con el array vacío la sección queda oculta (guard del
 * componente), así que activarla es solo completar estos datos.
 *
 * @typedef {Object} Testimonio
 * @property {string} nombre      Nombre y apellido (dos palabras; alimenta las iniciales del avatar y es el key de la grilla).
 * @property {string} rol         Rol + contexto que da credibilidad (ej. "Dueña · Clínica dental"). Máx ~40 caracteres.
 * @property {string} comentario  Frase corta con resultado concreto, 80-180 caracteres (para altura pareja en 3 columnas).
 * @property {number} rating      Entero 1-5.
 */

// Cargar testimonios reales antes de activar la sección.
/** @type {Testimonio[]} */
export default []
