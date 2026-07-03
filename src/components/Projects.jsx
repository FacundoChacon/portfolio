import { ExternalLink } from "lucide-react"
import { GithubIcon } from "./BrandIcons"
import { useReveal } from "../hooks/useReveal"

const projects = [
  {
    title: "Tienda-Electronica",
    status: "demo",
    description:
      "E-commerce con roles ADMIN/CLIENT, carrito, checkout, panel de administración y API REST protegida con JWT.",
    tags: ["Java 17", "Spring Boot", "React 18", "Tailwind", "MySQL", "Docker"],
    image: "/project-ecommerce.png",
    repo: "https://github.com/FacundoChacon/Tienda-Electronica",
    live: "https://tiendaecommerce-electronica.netlify.app/",
  },
  {
    title: "CIMMA-Dentistry",
    status: "live",
    description:
      "Landing page responsiva para clínica dental con integración de WhatsApp, formulario de contacto y SEO. En producción.",
    tags: ["HTML5", "CSS3", "SEO", "Responsive"],
    image: "/project-dental.png",
    repo: "https://github.com/FacundoChacon/CIMMA-DENTISTRY",
    live: "https://cimmaodontologia.com",
  },
  {
    title: "Bodega",
    status: "demo",
    description:
      "Aplicación full stack CRUD con backend en Java/Spring Boot, frontend en JavaScript y base de datos MySQL.",
    tags: ["Java", "Spring Boot", "JavaScript", "MySQL"],
    image: "/project-bodega.png",
    repo: "https://github.com/FacundoChacon/Bodega",
    live: "https://bodegamaipu.netlify.app/",
  },
]

function StatusBadge({ status }) {
  const isLive = status === "live"
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${
        isLive
          ? "border-accent-green/50 text-accent-green"
          : "border-accent-pink/50 text-accent-pink"
      }`}
    >
      <span className={`size-1.5 rounded-full ${isLive ? "bg-accent-green" : "bg-accent-pink"} animate-pulse`} />
      {isLive ? "En el mercado" : "Demo"}
    </span>
  )
}

export default function Projects() {
  const [ref, visible] = useReveal()

  const gradientBgs = [
    "from-accent-green via-emerald-500 to-accent-pink",
    "from-accent-pink via-purple-600 to-accent-green",
    "from-accent-green-dark via-teal-800 to-accent-pink-dark",
  ]

  return (
    <section id="proyectos" className="relative border-t border-dark-border py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-accent-green text-glow-cyan">02.</span>
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Proyectos</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-accent-green/50 to-transparent" />
        </div>

          <div
            ref={ref}
            className={`reveal reveal-left mt-12 grid gap-6 transition-all duration-1000 md:grid-cols-2 lg:grid-cols-3 ${
              visible ? "visible" : ""
            }`}
          >
          {projects.map((project, i) => {
            const cardHref = project.live || project.repo
            return (
            <a
              key={project.title}
              href={cardHref}
              target="_blank"
              rel="noreferrer"
              className="group relative flex flex-col overflow-hidden rounded-lg border border-dark-border bg-dark-card/50 transition-all duration-300 hover:-translate-y-2 hover:border-accent-green/60 hover:box-glow-cyan"
            >
              <div className="relative overflow-hidden">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={`Vista previa del proyecto ${project.title}`}
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className={`h-48 w-full bg-gradient-to-br ${gradientBgs[i]} flex items-center justify-center`}>
                    <span className="text-5xl font-black text-white/30 tracking-tight select-none">
                      {project.title.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/20 to-transparent" />
                <div className="absolute right-3 top-3">
                  <StatusBadge status={project.status} />
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-xl font-semibold text-white transition-colors group-hover:text-accent-green">
                  {project.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-400">
                  {project.description}
                </p>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded border border-dark-border bg-dark-secondary/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-400"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>

                {project.repo && project.live && (
                  <div className="mt-5 flex items-center gap-4 border-t border-dark-border pt-4">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-gray-400">
                      <GithubIcon className="size-4" /> Repo
                    </span>
                  </div>
                )}
              </div>
            </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
