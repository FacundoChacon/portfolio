import { useRef } from "react"
import { useTanqueLCL } from "../../hooks/useTanqueLCL"

/**
 * Tanque de LCL: tercio inferior del panel, detrás de las cards. Decorativo
 * (oculto a tecnologías asistivas); `panelRef` apunta al panel que escucha el puntero.
 */
export default function TanqueLCL({ panelRef }) {
  const tanqueRef = useRef(null)
  const canvasRef = useRef(null)
  useTanqueLCL({ panelRef, tanqueRef, canvasRef })

  return (
    <div className="lcl-tanque" aria-hidden="true" ref={tanqueRef}>
      <canvas ref={canvasRef} />
    </div>
  )
}
