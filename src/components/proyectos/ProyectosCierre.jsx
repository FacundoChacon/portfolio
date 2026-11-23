import { ArrowRight } from "lucide-react"
import { GithubIcon } from "../BrandIcons"
import { CONTACTO_ANCLA, GITHUB_PERFIL_URL } from "../../data/proyectos"

const action =
  "inline-flex min-h-11 items-center gap-2 border-2 px-3 font-mono text-xs uppercase tracking-[0.18em] hover:shadow-[3px_3px_0_0_var(--eva-paper)] motion-safe:transition-colors"

/**
 * Cierre del carrusel de respaldo, con aspecto de panel de sistema.
 */
export default function ProyectosCierre() {
  return (
    <div className="eva-panel relative flex h-full flex-col border-2 border-eva-gray-dim p-5 pt-7">
      <span className="eva-panel-label">SYS // FIN DEL REGISTRO</span>
      <span aria-hidden="true" className="eva-panel-code">
        EOF
      </span>
      <div className="flex-1">
        <h3 className="font-eva-display text-2xl font-bold uppercase leading-tight text-eva-paper font-stretch-condensed">
          Hay más en el archivo
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-eva-gray">
          Estos son los proyectos destacados. El resto del trabajo, los experimentos y el código viven en GitHub, y si
          tenés algo en mente, hablemos.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={GITHUB_PERFIL_URL}
          target="_blank"
          rel="noreferrer"
          className={`${action} border-eva-orange bg-eva-orange text-eva-black hover:bg-eva-paper hover:border-eva-paper`}
        >
          <GithubIcon aria-hidden="true" className="size-4" />
          Ver GitHub
          <span className="sr-only"> (abre en una pestaña nueva)</span>
        </a>
        <a
          href={CONTACTO_ANCLA}
          className={`${action} border-eva-paper text-eva-paper hover:border-eva-orange hover:bg-eva-orange hover:text-eva-black`}
        >
          Contactame
          <ArrowRight aria-hidden="true" className="size-4" />
        </a>
      </div>
      <span aria-hidden="true" className="eva-stripes absolute inset-x-0 bottom-0 h-1.5" />
    </div>
  )
}
