/**
 * Ventana deslizante del panel de proyectos. Funciones puras, sin DOM: el hook
 * mide y conecta; acá vive toda la lógica de qué cards se ven.
 */

/** Cortes de ancho (px) para 2 y 3 cards. Mismos valores que `--por-vista` en index.css. */
export const CORTES = { dos: 640, tres: 1024 }

/** Gesto táctil mínimo (px) para correr la ventana. */
const UMBRAL_DESLIZAR = 40

/** Cantidad de cards visibles según el ancho (px). Ancho inválido → 1. */
export function porVistaParaAncho(ancho) {
  if (!Number.isFinite(ancho) || ancho <= 0) return 1
  if (ancho >= CORTES.tres) return 3
  if (ancho >= CORTES.dos) return 2
  return 1
}

/** Mayor `inicio` posible: la ventana siempre queda completa. */
export function maxInicio(total, porVista) {
  return Math.max(0, total - porVista)
}

/** Acota `inicio` al rango válido (NaN → 0). */
export function clampInicio(inicio, total, porVista) {
  if (!Number.isFinite(inicio)) return 0
  return Math.min(maxInicio(total, porVista), Math.max(0, inicio))
}

/** Corre la ventana `delta` proyectos, sin dar la vuelta. */
export function mover(inicio, delta, total, porVista) {
  return clampInicio(inicio + delta, total, porVista)
}

/** Índices visibles; con la ventana completa siempre. */
export function ventanaVisible(total, inicio, porVista) {
  const desde = clampInicio(inicio, total, porVista)
  const hasta = Math.min(total, desde + porVista)
  return Array.from({ length: hasta - desde }, (_, k) => desde + k)
}

export function puedeRetroceder(inicio) {
  return inicio > 0
}

export function puedeAvanzar(inicio, total, porVista) {
  return inicio < maxInicio(total, porVista)
}

/** Hay botones solo si no todos los proyectos entran en la ventana. */
export function hayNavegacion(total, porVista) {
  return total > porVista
}

/** Corrimiento mínimo de la ventana para que `indice` quede visible. */
export function inicioParaMostrar(indice, inicio, total, porVista) {
  if (indice < inicio) return clampInicio(indice, total, porVista)
  if (indice > inicio + porVista - 1) return clampInicio(indice - porVista + 1, total, porVista)
  return inicio
}

const dos = (n) => String(n).padStart(2, '0')

/** Texto visual del indicador: "01–03 / 05" o "03 / 05" con una sola card. */
export function etiquetaIndicador(inicio, porVista, total) {
  const primero = dos(inicio + 1)
  const ultimo = Math.min(total, inicio + porVista)
  const rango = porVista > 1 ? `${primero}–${dos(ultimo)}` : primero
  return `${rango} / ${dos(total)}`
}

/** Anuncio cortés para lectores de pantalla tras navegar. */
export function anuncioVentana(inicio, porVista, total) {
  const ultimo = Math.min(total, inicio + porVista)
  if (porVista === 1) return `Proyecto ${inicio + 1} de ${total}`
  return `Proyectos ${inicio + 1} a ${ultimo} de ${total}`
}

/** Texto para lectores de pantalla de cada card. */
export function projectLabel(index, total) {
  return `Proyecto ${index + 1} de ${total}`
}

/**
 * Dirección de un gesto: 1 (dedo a la izquierda → avanza), −1, o 0 si es corto
 * o predominantemente vertical.
 */
export function direccionDeslizar({ dx, dy, umbral = UMBRAL_DESLIZAR }) {
  if (Math.abs(dx) < umbral || Math.abs(dx) <= Math.abs(dy)) return 0
  return dx < 0 ? 1 : -1
}

/** Etiquetas visibles y cantidad que queda para el chip "+N". */
export function etiquetasVisibles(tags, max = 3) {
  return { visibles: tags.slice(0, max), resto: Math.max(0, tags.length - max) }
}

/** Cómo se muestra el acceso al repositorio de un proyecto. */
export function accesoRepositorio(project) {
  return project.repo ? { tipo: 'enlace', href: project.repo } : { tipo: 'privado' }
}
