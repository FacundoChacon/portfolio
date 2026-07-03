import { useReveal } from "../hooks/useReveal"

const stack = [
  { name: "Java 17", color: "#f89820", glyph: "Jv", category: "Lenguaje" },
  { name: "Spring Boot", color: "#6db33f", glyph: "Sp", category: "Backend" },
  { name: "React 18", color: "#61dafb", glyph: "Re", category: "Frontend" },
  { name: "Tailwind CSS", color: "#38bdf8", glyph: "Tw", category: "Frontend" },
  { name: "JavaScript", color: "#f7df1e", glyph: "Js", category: "Lenguaje" },
  { name: "MySQL", color: "#00758f", glyph: "Sql", category: "Base de datos" },
  { name: "Python", color: "#4b8bbe", glyph: "Py", category: "Lenguaje" },
  { name: "Docker", color: "#2496ed", glyph: "Dk", category: "DevOps" },
  { name: "Git", color: "#f05032", glyph: "Git", category: "Herramienta" },
  { name: "REST API", color: "#22d3ee", glyph: "Api", category: "Backend" },
  { name: "JWT", color: "#d63aff", glyph: "Jwt", category: "Seguridad" },
  { name: "HTML5 / CSS3", color: "#e34f26", glyph: "Web", category: "Frontend" },
]

export default function Stack() {
  const [ref, visible] = useReveal()

  return (
    <section id="stack" className="relative border-t border-dark-border py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-accent-green text-glow-cyan">03.</span>
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Stack</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-accent-green/50 to-transparent" />
        </div>

        <p className="mt-6 max-w-xl text-gray-400 text-pretty">
          Las tecnologías que uso con frecuencia. Pasá el cursor por encima para
          verlas cobrar vida.
        </p>

          <div
            ref={ref}
            className={`reveal reveal-right mt-12 grid grid-cols-2 gap-4 transition-all duration-1000 sm:grid-cols-3 lg:grid-cols-4 ${
              visible ? "visible" : ""
            }`}
          >
          {stack.map((tech) => (
            <div
              key={tech.name}
              style={{ "--tech": tech.color }}
              className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-dark-border bg-dark-card/50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--tech)] hover:shadow-[0_0_24px_-4px_var(--tech)]"
            >
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-md border border-dark-border font-mono text-sm font-bold text-gray-400 transition-all duration-300 group-hover:border-[var(--tech)] group-hover:text-[var(--tech)]"
              >
                {tech.glyph}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display font-semibold text-white transition-colors group-hover:text-[var(--tech)]">
                  {tech.name}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                  {tech.category}
                </p>
              </div>
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-[var(--tech)] transition-transform duration-300 group-hover:scale-x-100"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
