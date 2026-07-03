import { Code2, Database, Layers, GitBranch } from "lucide-react"
import { useReveal } from "../hooks/useReveal"

const highlights = [
  {
    icon: Code2,
    title: "Backend sólido",
    text: "REST APIs, lógica de negocio, autenticación JWT y gestión de dependencias con Maven.",
  },
  {
    icon: Layers,
    title: "Frontend reactivo",
    text: "UI interactivas y responsivas con React 18, componentes reutilizables y Tailwind CSS.",
  },
  {
    icon: Database,
    title: "Bases de datos",
    text: "Diseño de esquemas relacionales, consultas avanzadas y operaciones CRUD con MySQL.",
  },
  {
    icon: GitBranch,
    title: "Metodología Ágil",
    text: "Scrum, control de versiones con Git, code review y modelado UML.",
  },
]

export default function About() {
  const [ref, visible] = useReveal()

  return (
    <section id="quien-soy" className="relative border-t border-dark-border py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-accent-green text-glow-cyan">01.</span>
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Quién soy</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-accent-green/50 to-transparent" />
        </div>

          <div
            ref={ref}
            className={`reveal reveal-bottom mt-12 grid gap-12 transition-all duration-1000 lg:grid-cols-[1.2fr_1fr] ${
              visible ? "visible" : ""
            }`}
          >
          <div className="space-y-5 text-lg leading-relaxed text-gray-400 text-pretty">
            <p>
              Soy estudiante avanzado de la{" "}
              <span className="text-white">Tecnicatura en Programación (UTN FRM)</span> y
              desarrollador Full Stack Jr enfocado en construir software real y funcional.
            </p>
            <p>
              He desarrollado proyectos completos con{" "}
              <span className="text-accent-green">Java, Spring Boot, React, Tailwind CSS, JavaScript y MySQL</span>,
              incluyendo una plataforma de e-commerce funcional con autenticación JWT,
              panel de administración y API REST.
            </p>
            <p>
              Me muevo cómodo en entornos ágiles (Scrum), con control de versiones y
              revisión de código. También automatizo procesos con Python y analizo datos con R.
            </p>
            <p className="font-mono text-sm uppercase tracking-widest text-accent-pink text-glow-magenta">
              {"// Idiomas: Español (nativo) · Inglés B1"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="group rounded-lg border border-dark-border bg-dark-card/50 p-5 transition-all hover:-translate-y-1 hover:border-accent-green/60 hover:box-glow-cyan"
              >
                <item.icon className="size-6 text-accent-green transition-colors group-hover:text-glow-cyan" />
                <h3 className="mt-4 font-display text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
