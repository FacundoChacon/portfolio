import { useReveal } from "../hooks/useReveal"
import { PROYECTOS } from "../data/proyectos"
import PanelProyectos from "./proyectos/PanelProyectos"
import ProyectosCierre from "./proyectos/ProyectosCierre"

export default function Projects() {
  const [revealRef, visible] = useReveal()

  return (
    <section
      id="proyectos"
      aria-labelledby="proyectos-titulo"
      className="proyectos eva-seccion eva-hex-grid relative border-t-2 border-eva-line"
    >
      <header
        ref={revealRef}
        className={`eva-reveal mx-auto w-[min(100%-2rem,72rem)] md:w-[min(100%-3rem,72rem)] ${visible ? "is-visible" : ""}`}
      >
        <div className="flex items-center gap-4">
          <h2 id="proyectos-titulo" className="flex items-baseline gap-3">
            <span aria-hidden="true" className="font-mono text-sm tracking-[0.18em] text-eva-primary-light">
              03 //
            </span>
            <span className="font-eva-display text-4xl font-bold uppercase text-eva-paper font-stretch-condensed sm:text-5xl">
              Proyectos
            </span>
          </h2>
          <span aria-hidden="true" className="eva-stripes h-2 flex-1" />
        </div>
      </header>

      <div className="mt-6">
        <PanelProyectos projects={PROYECTOS} />
      </div>
      <ProyectosCierre />
    </section>
  )
}
