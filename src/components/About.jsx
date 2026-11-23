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
  const stagger = (index) => ({ transitionDelay: `${index * 80}ms` })
  const shown = visible ? "is-visible" : ""

  return (
    <section
      id="quien-soy"
      aria-labelledby="quien-soy-titulo"
      className="eva-hex-grid relative border-t border-eva-line bg-eva-black py-24"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="font-mono text-sm text-eva-orange">{"//02"}</span>
          <h2
            id="quien-soy-titulo"
            className="font-eva-display text-3xl font-black uppercase text-eva-paper font-stretch-condensed sm:text-4xl"
          >
            Quién soy
          </h2>
          <div aria-hidden="true" className="eva-stripes h-1 flex-1" />
        </div>

        <div ref={ref} className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <article
            className={`eva-glass eva-reveal space-y-5 p-6 pt-8 text-lg leading-relaxed text-eva-gray text-pretty ${shown}`}
            style={stagger(0)}
          >
            <span aria-hidden="true" className="eva-panel-label">EXPEDIENTE // FC</span>
            <span aria-hidden="true" className="eva-panel-code">REV.26</span>
            <p>
              Soy estudiante avanzado de la{" "}
              <span className="text-eva-paper">Tecnicatura en Programación (UTN FRM)</span> y
              desarrollador Full Stack Jr enfocado en construir software real y funcional.
            </p>
            <p>
              He desarrollado proyectos completos con{" "}
              <span className="text-eva-orange">Java, Spring Boot, React, Tailwind CSS, JavaScript y MySQL</span>,
              incluyendo una plataforma de e-commerce funcional con autenticación JWT,
              panel de administración y API REST.
            </p>
            <p>
              Me muevo cómodo en entornos ágiles (Scrum), con control de versiones y
              revisión de código. También automatizo procesos con Python y analizo datos con R.
            </p>
            <p className="font-mono text-sm uppercase tracking-widest text-eva-green">
              {"// Idiomas: Español (nativo) · Inglés B2"}
            </p>
          </article>

          <ul role="list" className="grid gap-4 sm:grid-cols-2">
            {highlights.map((item, i) => (
              <li
                key={item.title}
                className={`eva-glass eva-reveal p-5 pt-7 ${shown}`}
                style={stagger(i + 1)}
              >
                <span aria-hidden="true" className="eva-panel-label">
                  {`CAP-${String(i + 1).padStart(2, "0")}`}
                </span>
                <item.icon aria-hidden="true" className="size-6 text-eva-orange" />
                <h3 className="mt-4 font-eva-display text-lg font-bold uppercase text-eva-paper font-stretch-condensed">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-eva-gray">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
