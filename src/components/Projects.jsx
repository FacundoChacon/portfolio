import { useRef } from "react"
import { useReveal } from "../hooks/useReveal"
import { useModoProyectos } from "../hooks/useModoProyectos"
import { useCarrete } from "../hooks/useCarrete"
import { PROYECTOS } from "../data/proyectos"
import { pinHeightVh } from "../utils/proyectosScroll"
import Carrete3D from "./proyectos/Carrete3D"
import ProyectoCard from "./proyectos/ProyectoCard"
import ProyectosCierre from "./proyectos/ProyectosCierre"

export default function Projects() {
  const total = PROYECTOS.length
  const { mode, fail } = useModoProyectos()
  const reel = mode === "reel"

  const [revealRef, visible] = useReveal()
  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const stageRef = useRef(null)
  const lienzoRef = useRef(null)
  const linksRef = useRef(null)
  const posterRef = useRef(null)

  useCarrete({
    enabled: reel,
    projects: PROYECTOS,
    onFail: fail,
    sectionRef,
    pinRef,
    stageRef,
    lienzoRef,
    linksRef,
    posterRef,
  })

  return (
    <section
      id="proyectos"
      ref={sectionRef}
      data-mode={mode}
      aria-labelledby="proyectos-titulo"
      className={`proyectos relative border-t-2 border-eva-line ${reel ? "eva-hex-grid" : ""}`}
    >
      {reel ? (
        <div className="proyectos-pin" ref={pinRef} style={{ "--pin-vh": pinHeightVh(total) }}>
          <Carrete3D projects={PROYECTOS} stageRef={stageRef} lienzoRef={lienzoRef} linksRef={linksRef} posterRef={posterRef} />
        </div>
      ) : (
        <div className="proyectos-carrusel">
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
              <span aria-hidden="true" className="font-mono text-xs tracking-[0.18em] text-eva-gray">
                DESLIZÁ →
              </span>
            </div>
          </header>

          <ul className="proyectos-pista">
            {PROYECTOS.map((project, i) => (
              <li key={project.title} data-index={i}>
                <ProyectoCard project={project} index={i} total={total} />
              </li>
            ))}
            <li data-index={total}>
              <ProyectosCierre />
            </li>
          </ul>
        </div>
      )}
    </section>
  )
}
