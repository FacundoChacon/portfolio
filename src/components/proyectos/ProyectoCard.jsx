import { ExternalLink } from "lucide-react"
import { GithubIcon } from "../BrandIcons"
import { projectLabel } from "../../utils/proyectosScroll"

const STATUS = {
  demo: { text: "Demo", className: "border-eva-orange text-eva-orange" },
  live: { text: "En el mercado", className: "border-eva-green text-eva-green" },
  inprogress: { text: "En curso", className: "border-eva-paper text-eva-paper" },
}

function StatusBadge({ status }) {
  const { text, className } = STATUS[status] ?? STATUS.demo
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] ${className}`}
    >
      {status === "inprogress" && <span aria-hidden="true" className="eva-stripes inline-block h-2.5 w-4" />}
      {text}
    </span>
  )
}

const NEW_TAB_NOTE = "(abre en una pestaña nueva)"

/** Enlace secundario con inversión de color en hover/foco, sin estado ni timers. */
const secondaryLink =
  "relative z-10 inline-flex min-h-8 items-center gap-1.5 border-2 border-eva-gray-dim px-2.5 font-mono text-xs uppercase tracking-[0.18em] text-eva-paper hover:border-eva-orange hover:bg-eva-orange hover:text-eva-black hover:shadow-[3px_3px_0_0_var(--eva-paper)] focus-visible:bg-eva-orange focus-visible:text-eva-black motion-safe:transition-colors"

/**
 * Card de un proyecto. Toda la superficie lleva al destino principal (demo o,
 * si no hay, repositorio) mediante el pseudo-elemento del enlace del título.
 */
export default function ProyectoCard({ project, index, total }) {
  const destination = project.live ?? project.repo
  const destinationName = project.live ? "ver demo" : "ver repositorio"
  const code = String(index + 1).padStart(2, "0")

  return (
    <article className="proyecto-card eva-panel group relative flex h-full flex-col border-2 border-eva-gray-dim shadow-[6px_6px_0_0_theme(colors.eva.orange)] focus-within:border-eva-orange focus-within:shadow-[8px_8px_0_0_theme(colors.eva.orange)] hover:border-eva-orange hover:shadow-[8px_8px_0_0_theme(colors.eva.orange)] motion-safe:transition-[transform,box-shadow,border-color] motion-safe:duration-150 motion-safe:focus-within:-translate-x-0.5 motion-safe:focus-within:-translate-y-0.5 motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5">
      <p className="sr-only">{projectLabel(index, total)}</p>

      <div className="flex items-center justify-between gap-3 border-b-2 border-eva-gray-dim px-4 py-2">
        <span aria-hidden="true" className="font-mono text-[11px] uppercase tracking-[0.18em] text-eva-gray">
          UNIT-{code}
        </span>
        <StatusBadge status={project.status} />
      </div>

      <img
        src={project.image}
        alt={`Vista previa del proyecto ${project.title}`}
        width={project.imageWidth}
        height={project.imageHeight}
        decoding="async"
        className="proyecto-card-img w-full border-b-2 border-eva-gray-dim object-cover"
      />

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-eva-display text-2xl font-bold uppercase leading-tight text-eva-paper font-stretch-condensed">
          <a
            href={destination}
            target="_blank"
            rel="noreferrer"
            className="after:absolute after:inset-0 group-hover:text-eva-orange"
          >
            {project.title}
            <span className="sr-only">
              : {destinationName} {NEW_TAB_NOTE}
            </span>
          </a>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-eva-gray">{project.description}</p>

        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tecnologías">
          {project.tags.map((tag) => (
            <li key={tag} className="eva-tag">
              {tag}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t-2 border-eva-gray-dim pt-3">
          {project.live && (
            <a href={project.live} target="_blank" rel="noreferrer" className={secondaryLink}>
              <ExternalLink aria-hidden="true" className="size-4" />
              Demo
              <span className="sr-only"> de {project.title} {NEW_TAB_NOTE}</span>
            </a>
          )}
          {project.repo && (
            <a href={project.repo} target="_blank" rel="noreferrer" className={secondaryLink}>
              <GithubIcon aria-hidden="true" className="size-4" />
              Repo
              <span className="sr-only"> de {project.title} {NEW_TAB_NOTE}</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
