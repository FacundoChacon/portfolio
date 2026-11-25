/**
 * Helpers puros de la entrada escrita del hero (change `hero-escritura`).
 * Sin DOM ni React: se testean con `node --test`.
 */

/**
 * Estado de cada carácter (por punto de código, no corta "ó" ni "·") de un texto que se escribe.
 * El cursor va sobre el próximo carácter a escribir y solo mientras se escribe.
 * Cada carácter conserva su caja siempre: solo cambia su estado, así el layout no se mueve.
 * @param {string} texto
 * @param {number} visibles caracteres escritos; se recorta al rango válido
 * @param {'izq'|'der'} direccion 'izq' escribe desde el inicio; 'der', desde el final
 * @returns {('escrito'|'cursor'|'pendiente')[]}
 */
export function estadosDeCaracteres(texto, visibles, direccion) {
  const largo = Array.from(texto).length
  const n = Math.min(Math.max(Math.trunc(visibles) || 0, 0), largo)
  const escribiendo = n > 0 && n < largo
  return Array.from({ length: largo }, (_, i) => {
    const distancia = direccion === 'der' ? largo - 1 - i : i
    if (distancia < n) return 'escrito'
    return escribiendo && distancia === n ? 'cursor' : 'pendiente'
  })
}

/**
 * Duraciones (ms) de cada tramo de la entrada. Son fijas por segmento y no por
 * carácter: la descripción (~190 caracteres) iría lentísima a la velocidad del
 * nombre. Total por defecto ≈ 3,13 s (la spec exige ≤ 3,5 s).
 */
export const TIEMPOS = Object.freeze({
  /** Pausa entre tramos de la fase A (salvo nombre → apellido). */
  pausa: 30,
  kicker: 160,
  nombre: 160,
  apellido: 160,
  subtitulo: 240,
  /** La descripción debe empezar antes de 850 ms: es el candidato a LCP en móvil. */
  descripcion: 700,
  /** Entrada `eva-boot` de las acciones. */
  acciones: 360,
  /** Retiro del obturador y aparición del marco de la ficha. */
  marco: 300,
  /** Por fila de la ficha: primero el valor, después la etiqueta. */
  valor: 150,
  etiqueta: 90,
})

/** Fases en orden: escritura de la columna izquierda, acciones, retrato + marco, ficha y estado final. */
export const FASES = Object.freeze(['a', 'acciones', 'b', 'c', 'fin'])

/**
 * @typedef {{ id: string, fase: 'a'|'c', direccion: 'izq'|'der', largo: number, inicio: number, fin: number }} Segmento
 * @typedef {{ segmentos: Segmento[], fases: Record<'a'|'acciones'|'b'|'c', { inicio: number, fin: number }>, total: number }} LineaDeTiempo
 */

/**
 * Arma la línea de tiempo de la entrada.
 * @param {{ kicker: string, nombre: string, apellido: string, subtitulo: string, descripcion: string,
 *   ficha: { id: string, etiqueta: string, valor: string }[] }} textos
 * @param {typeof TIEMPOS} [tiempos]
 * @returns {LineaDeTiempo}
 */
export function crearLineaDeTiempo(textos, tiempos = TIEMPOS) {
  const segmentos = []
  let cursor = 0
  const agregar = (id, fase, direccion, texto, duracion, pausa = 0) => {
    const inicio = cursor
    cursor = inicio + duracion
    segmentos.push({ id, fase, direccion, largo: Array.from(texto).length, inicio, fin: cursor })
    cursor += pausa
  }

  agregar('kicker', 'a', 'izq', textos.kicker, tiempos.kicker, tiempos.pausa)
  agregar('nombre', 'a', 'izq', textos.nombre, tiempos.nombre)
  agregar('apellido', 'a', 'izq', textos.apellido, tiempos.apellido, tiempos.pausa)
  agregar('subtitulo', 'a', 'izq', textos.subtitulo, tiempos.subtitulo, tiempos.pausa)
  agregar('descripcion', 'a', 'izq', textos.descripcion, tiempos.descripcion)
  const finA = cursor
  const finAcciones = finA + tiempos.acciones
  const finB = finAcciones + tiempos.marco
  cursor = finB
  for (const { id, etiqueta, valor } of textos.ficha) {
    agregar(`${id}-valor`, 'c', 'der', valor, tiempos.valor)
    agregar(`${id}-etiqueta`, 'c', 'der', etiqueta, tiempos.etiqueta)
  }

  return {
    segmentos,
    fases: {
      a: { inicio: 0, fin: finA },
      acciones: { inicio: finA, fin: finAcciones },
      b: { inicio: finAcciones, fin: finB },
      c: { inicio: finB, fin: cursor },
    },
    total: cursor,
  }
}

/**
 * Caracteres escritos de un segmento en el instante `t`: 0 hasta su inicio, el
 * primero aparece apenas arranca y el largo completo desde su fin.
 * @param {number} t ms desde el primer render
 * @param {{ inicio: number, fin: number, largo: number }} segmento
 * @returns {number}
 */
export function caracteresVisibles(t, { inicio, fin, largo }) {
  if (t <= inicio || largo === 0) return 0
  if (t >= fin) return largo
  return Math.min(largo, Math.ceil(((t - inicio) / (fin - inicio)) * largo))
}

/**
 * @param {number} t
 * @param {LineaDeTiempo} linea
 * @returns {'a'|'acciones'|'b'|'c'|'fin'}
 */
export function faseEn(t, { fases, total }) {
  if (t >= total) return 'fin'
  if (t >= fases.c.inicio) return 'c'
  if (t >= fases.b.inicio) return 'b'
  if (t >= fases.acciones.inicio) return 'acciones'
  return 'a'
}

/**
 * ¿La fase `actual` ya llegó a `minima`? (las acciones siguen visibles en B y C).
 * @param {string} actual
 * @param {string} minima
 * @returns {boolean}
 */
export function faseAlcanza(actual, minima) {
  return FASES.indexOf(actual) >= FASES.indexOf(minima)
}

/**
 * Fase y caracteres visibles de cada segmento en el instante `t`.
 * @param {number} t
 * @param {LineaDeTiempo} linea
 * @returns {{ fase: string, visibles: Record<string, number> }}
 */
export function estadoEn(t, linea) {
  const visibles = {}
  for (const segmento of linea.segmentos) visibles[segmento.id] = caracteresVisibles(t, segmento)
  return { fase: faseEn(t, linea), visibles }
}

/**
 * Estado final: todo el texto escrito (movimiento reducido o entrada ya vista).
 * @param {LineaDeTiempo} linea
 * @returns {{ fase: 'fin', visibles: Record<string, number> }}
 */
export function estadoFinal(linea) {
  return estadoEn(linea.total, linea)
}

/**
 * Evita re-renders cuando el cuadro no cambió nada visible.
 * @param {{ fase: string, visibles: Record<string, number> }} a
 * @param {{ fase: string, visibles: Record<string, number> }} b
 * @returns {boolean}
 */
export function mismoEstado(a, b) {
  if (a === b) return true
  if (a.fase !== b.fase) return false
  const clavesA = Object.keys(a.visibles)
  if (clavesA.length !== Object.keys(b.visibles).length) return false
  return clavesA.every((id) => id in b.visibles && a.visibles[id] === b.visibles[id])
}

/**
 * @param {{ reducedMotion: boolean, yaEjecutada: boolean }} estado
 * @returns {boolean}
 */
export function debeAnimar({ reducedMotion, yaEjecutada }) {
  return !reducedMotion && !yaEjecutada
}

/**
 * Estado inicial del hero según el modo que le da la compuerta de entrada (change `compuerta-intro`):
 * - `lista`: estado final, el hero espera tapado (así el LCP cae en el primer cuadro).
 * - `en-espera`: `estadoEn(0)`, todo reservado y transparente mientras se abren las hojas.
 * - `libre` (y cualquier otro valor): la escritura de siempre.
 * Con movimiento reducido todos los modos dan el estado final.
 * @param {'lista'|'en-espera'|'libre'} modo
 * @param {LineaDeTiempo} linea
 * @param {{ reducedMotion: boolean, yaEjecutada: boolean }} flags
 * @returns {{ fase: string, visibles: Record<string, number> }}
 */
export function estadoInicialSegunModo(modo, linea, { reducedMotion, yaEjecutada }) {
  if (reducedMotion || modo === 'lista') return estadoFinal(linea)
  if (modo === 'en-espera') return estadoEn(0, linea)
  return debeAnimar({ reducedMotion, yaEjecutada }) ? estadoEn(0, linea) : estadoFinal(linea)
}
