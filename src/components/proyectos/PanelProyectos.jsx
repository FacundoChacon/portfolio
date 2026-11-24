import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { usePanelProyectos } from "../../hooks/usePanelProyectos"
import {
  etiquetaIndicador,
  hayNavegacion,
  puedeAvanzar,
  puedeRetroceder,
  ventanaVisible,
} from "../../utils/panelProyectos"
import ProyectoCard from "./ProyectoCard"
import TanqueLCL from "./TanqueLCL"

/**
 * Panel de comando: barra (etiqueta, indicador, flechas), tanque de LCL y ventana
 * deslizante de cards. El único elemento con cristal; estático.
 */
export default function PanelProyectos({ projects }) {
  const total = projects.length
  const panelRef = useRef(null)
  const { porVista, inicio, anuncio, ir, ventanaRef } = usePanelProyectos(total)
  const navegable = hayNavegacion(total, porVista)
  const visibles = new Set(ventanaVisible(total, inicio, porVista))
  const retroceder = puedeRetroceder(inicio)
  const avanzar = puedeAvanzar(inicio, total, porVista)

  return (
    <div ref={panelRef} className="proyectos-panel eva-glass-panel" data-panel>
      <div className="proyectos-barra">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-eva-primary-light">
          SYS // ARCHIVO DE PROYECTOS
        </span>
        {navegable && (
          <div className="proyectos-controles">
            <p aria-hidden="true" className="proyectos-indicador whitespace-nowrap font-mono text-xs tracking-[0.18em] text-eva-paper">
              {etiquetaIndicador(inicio, porVista, total)}
            </p>
            <span aria-hidden="true" className="proyectos-segmentos">
              {projects.map((project, i) => (
                <span key={project.title} className="proyectos-segmento" data-activo={visibles.has(i) ? "" : undefined} />
              ))}
            </span>
            <button
              type="button"
              className="proyectos-flecha"
              aria-label="Proyecto anterior"
              aria-controls="proyectos-lista"
              aria-disabled={retroceder ? "false" : "true"}
              onClick={() => ir(-1)}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              className="proyectos-flecha"
              aria-label="Proyecto siguiente"
              aria-controls="proyectos-lista"
              aria-disabled={avanzar ? "false" : "true"}
              onClick={() => ir(1)}
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {anuncio}
      </p>

      <TanqueLCL panelRef={panelRef} />

      <div className="proyectos-ventana" ref={ventanaRef}>
        <ul id="proyectos-lista" className="proyectos-pista" style={{ "--inicio": inicio }}>
          {projects.map((project, i) => (
            <li key={project.title} data-index={i}>
              <ProyectoCard project={project} index={i} total={total} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
