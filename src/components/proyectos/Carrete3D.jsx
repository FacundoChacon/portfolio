import { GITHUB_PERFIL_URL } from "../../data/proyectos"
import { canvasLabel } from "../../utils/carrete3d"

const NEW_TAB_NOTE = "(abre en una pestaña nueva)"

/**
 * Escenario del carrete 3D. El lienzo WebGL lo inserta el adaptador dentro de
 * `.carrete-lienzo`; todo lo demás (título, enlaces, pista) es DOM accesible.
 * Capas: título (0) < lienzo (10) < enlaces y pista (20).
 */
export default function Carrete3D({ projects, stageRef, lienzoRef, linksRef, posterRef }) {
  const total = projects.length
  const first = projects[0]

  return (
    <div className="carrete-escenario" ref={stageRef}>
      <h2 id="proyectos-titulo" className="carrete-titulo font-eva-display font-bold uppercase font-stretch-condensed">
        <span aria-hidden="true" className="carrete-titulo-linea text-eva-primary-light">
          03 //
        </span>
        <span className="carrete-titulo-linea text-eva-paper">Proyectos</span>
      </h2>

      <div className="carrete-lienzo" ref={lienzoRef} role="img" aria-label={canvasLabel(first, 0, total)}>
        <img
          ref={posterRef}
          className="carrete-poster"
          src={first.image}
          alt=""
          aria-hidden="true"
          width={first.imageWidth}
          height={first.imageHeight}
          draggable={false}
        />
      </div>

      <ul className="carrete-enlaces" aria-label="Proyectos" ref={linksRef}>
        {projects.map((project, i) => {
          const destination = project.live ?? project.repo
          const kind = project.live ? "demo" : "repositorio"
          return (
            <li key={project.title}>
              <a
                className="carrete-enlace"
                href={destination}
                target="_blank"
                rel="noreferrer"
                data-index={i}
                data-activo={i === 0 ? "" : undefined}
              >
                Ver proyecto
                <span className="sr-only">
                  {" "}
                  {project.title}: {kind} {NEW_TAB_NOTE}
                </span>
                <span aria-hidden="true"> ↗</span>
              </a>
            </li>
          )
        })}
      </ul>

      <a className="carrete-github" href={GITHUB_PERFIL_URL} target="_blank" rel="noreferrer">
        Más en GitHub
        <span className="sr-only"> {NEW_TAB_NOTE}</span>
        <span aria-hidden="true"> ↗</span>
      </a>

      <p className="carrete-pista" aria-hidden="true">
        Scrolleá o arrastrá para explorar
      </p>
    </div>
  )
}
