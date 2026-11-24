import { useRef } from "react"
import { GithubIcon } from "../BrandIcons"
import { STATUS_LABELS } from "../../data/proyectos"
import { useFoil } from "../../hooks/useFoil"
import { accesoRepositorio, etiquetasVisibles, projectLabel } from "../../utils/panelProyectos"

const STATUS_CLASSES = {
  demo: "border-eva-secondary text-eva-secondary",
  live: "border-eva-tertiary text-eva-tertiary",
  inprogress: "border-eva-paper text-eva-paper",
}

function StatusBadge({ status }) {
  const key = status in STATUS_LABELS ? status : "demo"
  const text = STATUS_LABELS[key]
  const className = STATUS_CLASSES[key]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] ${className}`}
    >
      {status === "inprogress" && <span aria-hidden="true" className="eva-stripes inline-block h-2.5 w-4" />}
      {text}
    </span>
  )
}

const NEW_TAB_NOTE = "(abre el sitio en una pestaña nueva)"

/** Anillo de foco del botón de repositorio, dentro de la card. */
const focoInterno = "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-eva-focus"

/** Acción de la card: mismo alto para el enlace "Repositorio" y el botón "Repo privado". */
const accion =
  "relative z-10 inline-flex min-h-10 items-center gap-1.5 border-2 px-3 font-mono text-xs uppercase tracking-[0.18em]"

/**
 * Card plana de un proyecto, con foil 2.5D bajo un puntero fino. Toda la card lleva a la demo
 * con un único enlace (el del título, estirado con ::after); el botón de repositorio queda por
 * encima. No es cristal: fondo propio semiopaco.
 */
export default function ProyectoCard({ project, index, total }) {
  const envoltorioRef = useRef(null)
  const caraRef = useRef(null)
  useFoil(envoltorioRef, caraRef)
  const { visibles, resto } = etiquetasVisibles(project.tags)
  const repositorio = accesoRepositorio(project)

  return (
    <div className="proyecto-foil h-full" ref={envoltorioRef}>
      <article
        ref={caraRef}
        className="proyecto-card group relative flex h-full flex-col border-2 border-eva-gray-dim hover:border-eva-primary focus-within:border-eva-primary"
      >
        <p className="sr-only">{projectLabel(index, total)}</p>

        <img
          src={project.image}
          alt=""
          width={project.imageWidth}
          height={project.imageHeight}
          decoding="async"
          className="proyecto-card-img block aspect-video w-full border-b-2 border-eva-gray-dim object-cover"
        />

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-eva-display text-xl font-bold uppercase leading-tight text-eva-paper font-stretch-condensed">
              {project.live ? (
                <a
                  href={project.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="proyecto-enlace after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {project.title}
                  <span className="sr-only"> {NEW_TAB_NOTE}</span>
                </a>
              ) : (
                project.title
              )}
            </h3>
            <StatusBadge status={project.status} />
          </div>

          <p className="line-clamp-3 text-sm leading-relaxed text-eva-gray">{project.description}</p>

          <div aria-hidden="true" className="flex flex-wrap gap-1.5">
            {visibles.map((tag) => (
              <span key={tag} className="eva-tag">
                {tag}
              </span>
            ))}
            {resto > 0 && <span className="eva-tag">+{resto}</span>}
          </div>
          <p className="sr-only">Tecnologías: {project.tags.join(", ")}</p>

          <div className="mt-auto flex flex-wrap items-center gap-3 border-t-2 border-eva-gray-dim pt-3">
            {repositorio.tipo === "enlace" ? (
              <a
                href={repositorio.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${accion} border-eva-gray-dim text-eva-paper hover:border-eva-primary hover:bg-eva-primary hover:text-eva-black motion-safe:transition-colors ${focoInterno}`}
              >
                <GithubIcon aria-hidden="true" className="size-4" />
                Repositorio
                <span className="sr-only">
                  {" "}
                  de {project.title} (abre en una pestaña nueva)
                </span>
              </a>
            ) : (
              <button type="button" disabled className={`${accion} cursor-not-allowed border-eva-gray-dim text-eva-gray`}>
                <GithubIcon aria-hidden="true" className="size-4" />
                Repo privado
              </button>
            )}
          </div>
        </div>

        <span aria-hidden="true" className="foil-brillo" />
        <span aria-hidden="true" className="foil-iris" />
      </article>
    </div>
  )
}
