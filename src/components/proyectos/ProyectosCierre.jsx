import { ArrowRight } from "lucide-react"
import { GithubIcon } from "../BrandIcons"
import { CONTACTO_ANCLA, GITHUB_PERFIL_URL } from "../../data/proyectos"

const action =
  "inline-flex min-h-11 items-center gap-2 border-2 px-3 font-mono text-xs uppercase tracking-[0.18em] hover:shadow-[3px_3px_0_0_var(--eva-paper)] motion-safe:transition-colors"

/**
 * Cierre de la sección: franja debajo del panel (fuera de la ventana de proyectos).
 */
export default function ProyectosCierre() {
  return (
    <div className="eva-panel relative mx-auto mt-6 flex w-[min(100%-2rem,72rem)] flex-col gap-4 border-2 border-eva-gray-dim p-5 pt-7 sm:flex-row sm:items-center sm:justify-between">
      <span className="eva-panel-label">SYS // FIN DEL REGISTRO</span>
      <span aria-hidden="true" className="eva-panel-code">
        EOF
      </span>
      <div>
        <h3 className="font-eva-display text-2xl font-bold uppercase leading-tight text-eva-paper font-stretch-condensed">
          Hay más en el archivo
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-eva-gray">
          Estos son los proyectos destacados. El resto del trabajo, los experimentos y el código viven en GitHub, y si
          tenés algo en mente, hablemos.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={GITHUB_PERFIL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${action} border-eva-primary bg-eva-primary text-eva-black hover:bg-eva-paper hover:border-eva-paper`}
        >
          <GithubIcon aria-hidden="true" className="size-4" />
          Ver GitHub
          <span className="sr-only"> (abre en una pestaña nueva)</span>
        </a>
        <a
          href={CONTACTO_ANCLA}
          className={`${action} border-eva-paper text-eva-paper hover:border-eva-secondary hover:bg-eva-secondary hover:text-eva-black`}
        >
          Contactame
          <ArrowRight aria-hidden="true" className="size-4" />
        </a>
      </div>
      <span aria-hidden="true" className="eva-stripes absolute inset-x-0 bottom-0 h-1.5" />
    </div>
  )
}
