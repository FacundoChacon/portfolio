/**
 * Estilos del configurador (sistema visual eva, brutalista).
 *
 * Módulo puro, sin React: concentra las cadenas de clases para que Tailwind las
 * detecte como literales completos y para poder probarlas sin DOM. Toda
 * traslación va con `motion-safe:`; el deshabilitado se distingue por fondo y
 * borde, nunca por transparencia general.
 */

/** Estado deshabilitado común: bloque legible, sin sombra ni desplazamiento. */
const DESHABILITADO =
  'disabled:cursor-not-allowed disabled:border-eva-gray-dim disabled:bg-eva-line disabled:text-eva-gray disabled:shadow-none disabled:hover:shadow-none motion-safe:disabled:hover:translate-x-0 motion-safe:disabled:hover:translate-y-0 motion-safe:disabled:focus-visible:translate-x-0 motion-safe:disabled:focus-visible:translate-y-0'

/** Desplazamiento leve al pasar el puntero o enfocar (solo sin movimiento reducido). */
const DESPLAZA =
  'motion-safe:transition-[transform,box-shadow,border-color,color] motion-safe:duration-150 motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5 motion-safe:focus-visible:-translate-x-0.5 motion-safe:focus-visible:-translate-y-0.5'

export const BOTON_PRIMARIO = `inline-flex items-center gap-2 border-2 border-eva-primary bg-eva-primary px-4 py-2 font-mono text-xs uppercase tracking-widest text-eva-black shadow-[4px_4px_0_0_var(--eva-secondary)] hover:shadow-[6px_6px_0_0_var(--eva-secondary)] focus-visible:shadow-[6px_6px_0_0_var(--eva-secondary)] ${DESPLAZA} ${DESHABILITADO}`

export const BOTON_SECUNDARIO = `inline-flex items-center gap-2 border-2 border-eva-gray-dim bg-eva-black px-4 py-2 font-mono text-xs uppercase tracking-widest text-eva-paper hover:border-eva-secondary hover:text-eva-secondary hover:shadow-[3px_3px_0_0_var(--eva-secondary)] focus-visible:border-eva-secondary focus-visible:text-eva-secondary focus-visible:shadow-[3px_3px_0_0_var(--eva-secondary)] ${DESPLAZA} ${DESHABILITADO}`

/** Variante chica del secundario (botones "Editar"). */
export const BOTON_EDITAR = `inline-flex items-center gap-1.5 border-2 border-eva-gray-dim bg-eva-black px-2.5 py-1 font-mono text-xs uppercase tracking-widest text-eva-paper hover:border-eva-secondary hover:text-eva-secondary hover:shadow-[3px_3px_0_0_var(--eva-secondary)] focus-visible:border-eva-secondary focus-visible:text-eva-secondary focus-visible:shadow-[3px_3px_0_0_var(--eva-secondary)] ${DESPLAZA} ${DESHABILITADO}`

/** Panel opaco con espacio arriba para el rótulo `.eva-panel-label`. */
export const PANEL = 'eva-panel p-5 pt-8'

/** Prefijo + número de dos dígitos (base 1): `('TIPO', 0)` → `TIPO-01`. */
export function codigoModulo(prefijo, indice) {
  return `${prefijo}-${String(indice + 1).padStart(2, '0')}`
}

/** Estado de presentación de un paso del indicador de progreso. */
export function estadoPaso(indice, actual) {
  if (indice < actual) return 'done'
  return indice === actual ? 'current' : 'pending'
}

/** Clases del `li` de un paso: relleno (actual), verde con tilde (hecho) o borde tenue (pendiente). */
export function clasePaso(estado) {
  const base =
    'flex items-center gap-2 border-2 px-3 py-2 font-mono text-xs uppercase tracking-widest'
  switch (estado) {
    case 'current':
      return `${base} border-eva-primary bg-eva-primary text-eva-black`
    case 'done':
      return `${base} border-eva-tertiary text-eva-tertiary`
    case 'pending':
      return `${base} border-eva-gray-dim text-eva-gray`
    default:
      throw new Error(`clasePaso: estado desconocido "${estado}"`)
  }
}

/** Tarjeta de tipo de sitio o de extra: seleccionada = sombra sólida desplazada + tinte. */
export function claseModulo(seleccionado) {
  const base = `h-full w-full border-2 p-4 text-left ${DESPLAZA}`
  return seleccionado
    ? `${base} border-eva-primary bg-eva-primary/10 shadow-[6px_6px_0_0_var(--eva-secondary)]`
    : `${base} border-eva-gray-dim bg-eva-panel hover:border-eva-secondary hover:shadow-[4px_4px_0_0_var(--eva-secondary)] focus-visible:border-eva-secondary focus-visible:shadow-[4px_4px_0_0_var(--eva-secondary)]`
}

/** Cuadrado indicador de la tarjeta: vacío o relleno (con tilde en el JSX). */
export function claseIndicador(seleccionado) {
  const base = 'flex size-6 shrink-0 items-center justify-center border-2'
  return seleccionado
    ? `${base} border-eva-primary bg-eva-primary text-eva-black`
    : `${base} border-eva-gray-dim`
}

/** Input/textarea: borde duro; con error, borde rojo claro (la marca ERR va en el JSX; el foco verde agua no se anula). */
export function claseCampo(conError) {
  const base =
    'w-full border-2 bg-eva-black px-3 py-2 text-sm text-eva-paper placeholder:text-eva-gray'
  return conError
    ? `${base} border-eva-error focus:border-eva-error`
    : `${base} border-eva-gray-dim focus:border-eva-primary`
}
