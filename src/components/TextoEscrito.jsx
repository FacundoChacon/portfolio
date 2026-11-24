import { partirTexto } from "../utils/escritura"

/**
 * Texto que se escribe sin tocar el DOM del lector de pantalla ni el layout.
 *
 * - `accesible="copia"` (por defecto): copia `sr-only` con el texto real completo.
 * - `accesible="externo"`: el contenedor ya tiene nombre accesible (p. ej. `aria-label` del h1).
 * - `accesible="decorativo"`: el contenedor entero es `aria-hidden` (p. ej. el kicker).
 *
 * La capa visual siempre es `aria-hidden`. El tramo sin escribir se reserva con
 * `text-transparent`: ocupa su ancho final (sin CLS) y los cortes de línea ya son los finales.
 * El cursor es un pseudo-elemento absoluto del tramo que empieza en el borde de escritura.
 *
 * @param {{ texto: string, visibles: number, direccion?: 'izq'|'der', accesible?: 'copia'|'externo'|'decorativo' }} props
 */
export default function TextoEscrito({ texto, visibles, direccion = "izq", accesible = "copia" }) {
  const { visible, reservado } = partirTexto(texto, visibles, direccion)
  const escribiendo = visible !== "" && reservado !== ""
  const alReves = direccion === "der"

  const tramoVisible = (
    <span key="visible" className="eva-cursor-escritura" data-cursor={escribiendo && alReves ? "der" : undefined}>
      {visible}
    </span>
  )
  const tramoReservado = (
    <span
      key="reservado"
      className="eva-cursor-escritura text-transparent"
      data-cursor={escribiendo && !alReves ? "izq" : undefined}
    >
      {reservado}
    </span>
  )

  return (
    <>
      {accesible === "copia" && <span className="sr-only">{texto}</span>}
      <span aria-hidden="true">{alReves ? [tramoReservado, tramoVisible] : [tramoVisible, tramoReservado]}</span>
    </>
  )
}
