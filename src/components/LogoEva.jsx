import { LOGO_VARIANTES, logoPaths, trazoDelFilo } from "../data/logo"

/**
 * Logotipo decorativo en SVG inline. Pinta las tres capas de `logoSvg` (sombra desplazada, filo y
 * relleno sin contorno) con las mismas formas, así del filo solo se ve la franja exterior de la
 * silueta. Los colores llegan por las clases `eva-logo-*` (variables `--eva-logo-*`): sin `style`,
 * porque la CSP de producción no admite estilos inline. `stroke-width` y `transform` son atributos.
 *
 * @param {{ variante?: "completo"|"simple", className?: string }} props
 *   `simple` usa el recorte sin fondo (`viewBoxSinFondo`); el tamaño final lo da `className`.
 */
export default function LogoEva({ variante = "completo", className }) {
  const datos = LOGO_VARIANTES[variante]
  if (!datos) throw new Error(`LogoEva: variante inexistente ${JSON.stringify(variante)}`)
  const viewBox = datos.viewBoxSinFondo ?? datos.viewBox
  const [, , width, height] = viewBox.split(" ")
  const { barras, anillo } = logoPaths(datos)
  const formas = (
    <>
      <path d={barras} />
      <path fillRule="evenodd" d={anillo} />
    </>
  )

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g className="eva-logo-sombra" strokeWidth={trazoDelFilo(datos)} transform={`translate(${datos.sombra} ${datos.sombra})`}>
        {formas}
      </g>
      <g className="eva-logo-filo" strokeWidth={trazoDelFilo(datos)}>
        {formas}
      </g>
      <g className="eva-logo-relleno">{formas}</g>
    </svg>
  )
}
