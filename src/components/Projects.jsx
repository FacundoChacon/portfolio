import { useRef } from "react"
import { useReveal } from "../hooks/useReveal"
import { useModoProyectos } from "../hooks/useModoProyectos"
import { usePinHorizontal } from "../hooks/usePinHorizontal"
import { PROYECTOS } from "../data/proyectos"
import { ctaPlacement, pageCount, pinHeightVh, trackItemCount } from "../utils/proyectosScroll"
import ProyectoCard from "./proyectos/ProyectoCard"
import ProyectosCierre from "./proyectos/ProyectosCierre"

export default function Projects() {
  const total = PROYECTOS.length
  const placement = ctaPlacement(total)
  const pages = pageCount(trackItemCount(total))
  const mode = useModoProyectos(pages)

  const [revealRef, visible] = useReveal()
  const pinRef = useRef(null)
  const stickyRef = useRef(null)
  const trackRef = useRef(null)
  const indicatorRef = useRef(null)
  const barRef = useRef(null)

  usePinHorizontal({ enabled: mode === "pin", pages, pinRef, stickyRef, trackRef, indicatorRef, barRef })

  return (
    <section
      id="proyectos"
      data-mode={mode}
      aria-labelledby="proyectos-titulo"
      className="proyectos relative border-t-2 border-eva-line"
    >
      <div className="proyectos-pin" ref={pinRef} style={{ "--pin-vh": pinHeightVh(pages) }}>
        <div className="proyectos-sticky" ref={stickyRef}>
          <header
            ref={revealRef}
            className={`eva-reveal mx-auto w-[min(100%-2rem,72rem)] md:w-[min(100%-3rem,72rem)] ${visible ? "is-visible" : ""}`}
          >
            <div className="flex items-center gap-4">
              <h2 id="proyectos-titulo" className="flex items-baseline gap-3">
                <span aria-hidden="true" className="font-mono text-sm tracking-[0.18em] text-eva-orange">
                  03 //
                </span>
                <span className="font-eva-display text-4xl font-bold uppercase text-eva-paper font-stretch-condensed sm:text-5xl">
                  Proyectos
                </span>
              </h2>
              <span aria-hidden="true" className="eva-stripes h-2 flex-1" />
              <span aria-hidden="true" className="proyectos-indicador-pin items-center gap-3 font-mono text-xs tracking-[0.18em] text-eva-gray">
                <span ref={indicatorRef}>{`01 / ${String(pages).padStart(2, "0")}`}</span>
                <span className="block h-1 w-24 bg-eva-gray-dim">
                  <span ref={barRef} className="proyectos-barra block h-full w-full origin-left bg-eva-orange" />
                </span>
              </span>
              <span aria-hidden="true" className="proyectos-indicador-carrusel font-mono text-xs tracking-[0.18em] text-eva-gray">
                DESLIZÁ →
              </span>
            </div>
          </header>

          <ul className="proyectos-pista" ref={trackRef}>
            {PROYECTOS.map((project, i) => (
              <li key={project.title} data-index={i}>
                <ProyectoCard project={project} index={i} total={total} />
              </li>
            ))}
            {placement === "track" && (
              <li data-index={total}>
                <ProyectosCierre />
              </li>
            )}
          </ul>
        </div>
      </div>
      {placement === "after" && (
        <div className="mx-auto mb-16 w-[min(100%-2rem,72rem)] md:w-[min(100%-3rem,72rem)]">
          <ProyectosCierre variant="strip" />
        </div>
      )}
    </section>
  )
}
