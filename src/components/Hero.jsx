import { ArrowDown } from "lucide-react"
import { GithubIcon, LinkedinIcon } from "./BrandIcons"

export default function Hero() {
  return (
    <section
      id="presentacion"
      className="relative flex min-h-screen items-center overflow-hidden pt-24"
    >
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-accent-green/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-accent-pink/20 blur-[120px]" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 md:grid-cols-2 md:px-6">
        <div className="order-2 flex justify-center md:order-1">
          <div className="group relative">
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-tr from-accent-green/60 to-accent-pink/60 opacity-70 blur-sm transition-opacity group-hover:opacity-100" />
            <div className="box-glow-cyan relative overflow-hidden rounded-lg border border-accent-green/40">
              <img
                src="/profile.jpeg"
                alt="Retrato de Facundo Chacón"
                className="h-[420px] w-[340px] object-cover md:h-[520px] md:w-[440px]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent" />
              <span className="absolute bottom-4 left-4 font-mono text-xs uppercase tracking-widest text-accent-green text-glow-cyan">
                {"// online"}
              </span>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <h1 className="font-display text-4xl font-bold leading-tight text-balance text-white sm:text-5xl lg:text-6xl">
            Facundo
            <br />
            <span className="text-accent-green text-glow-cyan animate-flicker">Chacón</span>
          </h1>
          <p className="mt-4 font-mono text-base uppercase tracking-widest text-gray-400">
            Full Stack Developer{" · "}Java / React
          </p>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-gray-400 text-pretty">
            Construyo experiencias full stack de punta a punta: APIs robustas con
            Java 17 y Spring Boot, interfaces reactivas con React y Tailwind CSS. Actualmente
            buscando mi primera oportunidad profesional.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#proyectos"
              className="box-glow-cyan inline-flex items-center gap-2 rounded-md bg-accent-green px-6 py-3 font-mono text-sm font-semibold uppercase tracking-widest text-dark transition-transform hover:-translate-y-0.5"
            >
              Ver proyectos <ArrowDown className="size-4" />
            </a>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/FacundoChacon"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="rounded-md border border-dark-border p-3 text-gray-400 transition-colors hover:border-accent-green hover:text-accent-green"
              >
                <GithubIcon className="size-5" />
              </a>
              <a
                href="https://linkedin.com/in/facundo-chacón-catalán"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="rounded-md border border-dark-border p-3 text-gray-400 transition-colors hover:border-accent-pink hover:text-accent-pink"
              >
                <LinkedinIcon className="size-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
