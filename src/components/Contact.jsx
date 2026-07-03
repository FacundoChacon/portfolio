import { Mail, MapPin } from "lucide-react"
import { GithubIcon, LinkedinIcon } from "./BrandIcons"
import { useReveal } from "../hooks/useReveal"

const contacts = [
  {
    icon: Mail,
    label: "Email",
    value: "chaconfacu2006@gmail.com",
    href: "mailto:chaconfacu2006@gmail.com",
    accent: "red",
  },
  {
    icon: GithubIcon,
    label: "GitHub",
    value: "github.com/FacundoChacon",
    href: "https://github.com/FacundoChacon",
    accent: "primary",
  },
  {
    icon: LinkedinIcon,
    label: "LinkedIn",
    value: "in/facundo-chacón-catalán",
    href: "https://linkedin.com/in/facundo-chacón-catalán",
    accent: "accent",
  },
]

export default function Contact() {
  const [ref, visible] = useReveal({ threshold: 0.1 })

  return (
    <section id="contacto" className="relative border-t border-dark-border py-24">
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-center gap-4">
          <span className={`font-mono text-sm text-accent-green text-glow-cyan ${visible ? "animate-glitch" : ""}`}>04.</span>
          <h2 className={`font-display text-3xl font-bold text-white sm:text-4xl ${visible ? "animate-glitch" : ""}`}
            style={{ animationDelay: "0.15s" }}
          >
            Contáctame
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-accent-green/50 to-transparent" />
        </div>

        <div ref={ref} className="mt-12 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className={`font-display text-2xl font-bold text-balance text-white sm:text-3xl ${visible ? "animate-glitch" : ""}`}
              style={{ animationDelay: "0.3s" }}
            >
              ¿Construimos algo <span className="text-accent-pink text-glow-magenta">juntos</span>?
            </h3>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-gray-400 text-pretty">
              Estoy en búsqueda de mi primera oportunidad profesional. Si tenés un
              proyecto o una vacante, escribime — respondo rápido.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 font-mono text-sm text-gray-400">
              <MapPin className="size-4 text-accent-green" /> Maipú, Mendoza, Argentina
            </p>
          </div>

          <div className="grid gap-4">
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className={`group flex items-center gap-4 rounded-lg border border-dark-border bg-dark-card/50 p-5 transition-all hover:-translate-y-1 ${
                  c.accent === "primary"
                    ? "hover:border-accent-green/60 hover:box-glow-cyan"
                    : c.accent === "red"
                    ? "hover:border-red-500/60 hover:box-glow-red"
                    : "hover:border-accent-pink/60 hover:box-glow-magenta"
                }`}
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-md border border-dark-border transition-colors ${
                    c.accent === "primary"
                      ? "text-accent-green group-hover:border-accent-green"
                      : c.accent === "red"
                      ? "text-red-500 text-glow-red group-hover:border-red-500"
                      : "text-accent-pink group-hover:border-accent-pink"
                  }`}
                >
                  <c.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                    {c.label}
                  </p>
                  <p className={`truncate font-display text-lg font-medium ${
                    c.accent === "red" ? "text-red-400 text-glow-red" : "text-white"
                  }`}>
                    {c.value}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <footer className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-dark-border pt-8 sm:flex-row">
          <p className="font-mono text-xs uppercase tracking-widest text-gray-400">
            {"<FC/>"} — Facundo Chacón
          </p>
          <p className="font-mono text-xs text-gray-400">
            © {new Date().getFullYear()} · Built with React + Vite
          </p>
        </footer>
      </div>
    </section>
  )
}
