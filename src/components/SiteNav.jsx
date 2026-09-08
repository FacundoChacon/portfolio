import { useEffect, useState } from "react"
import { Download, Menu, X } from "lucide-react"

const links = [
  { href: "#presentacion", label: "Inicio" },
  { href: "#quien-soy", label: "Quién soy" },
  { href: "#proyectos", label: "Proyectos" },
  { href: "#stack", label: "Stack" },
  { href: "#contacto", label: "Contáctame" },
]

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-dark-border bg-dark/80 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <a href="#presentacion" className="font-mono text-sm font-bold tracking-widest text-accent-green text-glow-cyan">
          {"<FC/>"}
        </a>
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-mono text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-accent-green focus-visible:text-accent-green"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
          className="rounded-md border border-dark-border p-2 text-gray-400 transition-colors hover:text-accent-green focus-visible:text-accent-green md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <div className="flex items-center gap-3">
          <a
            href="/cv.pdf"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-accent-pink/50 px-3 py-2 font-mono text-xs uppercase tracking-widest text-accent-pink transition-colors hover:bg-accent-pink hover:text-dark focus-visible:bg-accent-pink focus-visible:text-dark"
          >
            <Download className="size-3.5" /> CV
          </a>
          <a
            href="#contacto"
            className="box-glow-cyan rounded-md border border-accent-green/50 px-4 py-2 font-mono text-xs uppercase tracking-widest text-accent-green transition-colors hover:bg-accent-green hover:text-dark focus-visible:bg-accent-green focus-visible:text-dark"
          >
            Hablemos
          </a>
        </div>
      </nav>
      <div
        id="mobile-nav"
        aria-hidden={!open}
        className={`md:hidden ${
          open ? "block" : "hidden"
        } border-t border-dark-border bg-dark/95 backdrop-blur-md`}
      >
        <ul className="flex flex-col gap-1 px-4 py-4">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 font-mono text-xs uppercase tracking-widest text-gray-400 transition-colors hover:bg-dark-secondary hover:text-accent-green focus-visible:bg-dark-secondary focus-visible:text-accent-green"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
