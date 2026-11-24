import { memo } from "react"
import { estadosDeCaracteres } from "../utils/escritura"

const CLASE_DE_ESTADO = {
  escrito: undefined,
  // Reserva el ancho final del carácter: ni el layout ni los cortes de línea se mueven al escribir.
  pendiente: "text-transparent",
  // Cursor de bloque sólido sobre el próximo carácter (ver `.eva-cursor-escritura` en index.css).
  cursor: "eva-cursor-escritura text-transparent",
}

/**
 * Texto que se escribe sin tocar el DOM del lector de pantalla ni el layout.
 *
 * - `accesible="copia"` (por defecto): copia `sr-only` con el texto real completo.
 * - `accesible="externo"`: el contenedor ya tiene nombre accesible (p. ej. `aria-label` del h1).
 * - `accesible="decorativo"`: el contenedor entero es `aria-hidden` (p. ej. el kicker).
 *
 * La capa visual siempre es `aria-hidden` y tiene un `<span>` por carácter: solo cambia su clase
 * (`text-transparent` hasta que se escribe), así que ningún nodo cambia de caja y el CLS es ~0.
 * Un solo `<span>` partido en dos tramos movería sus rectángulos en cada cuadro y el CLS lo contaría.
 *
 * @param {{ texto: string, visibles: number, direccion?: 'izq'|'der', accesible?: 'copia'|'externo'|'decorativo' }} props
 */
function TextoEscrito({ texto, visibles, direccion = "izq", accesible = "copia" }) {
  const estados = estadosDeCaracteres(texto, visibles, direccion)
  return (
    <>
      {accesible === "copia" && <span className="sr-only">{texto}</span>}
      <span aria-hidden="true">
        {Array.from(texto).map((caracter, indice) => (
          // El índice es la identidad estable del carácter: el texto no se reordena.
          <span key={indice} className={CLASE_DE_ESTADO[estados[indice]]}>
            {caracter}
          </span>
        ))}
      </span>
    </>
  )
}

export default memo(TextoEscrito)
