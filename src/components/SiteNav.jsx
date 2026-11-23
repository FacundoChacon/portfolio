import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Download, Menu, X } from "lucide-react"

import NavBrand from "./NavBrand"
import {
  NAV_HEIGHT_PX,
  NAV_LINKS,
  menuKeyAction,
  navCode,
  navHref,
  pickActiveSection,
  sectionObserverOptions,
} from "../utils/siteNav"

const SECTION_ORDER = NAV_LINKS.map((link) => link.id)

/** Hover duro: sombra sólida sin desenfoque y desplazamiento solo con movimiento permitido. */
const hardHover =
  "hover:shadow-[3px_3px_0_0_var(--eva-secondary)] motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5 motion-safe:transition-[transform,color,background-color] motion-safe:duration-150"

const ctaBase = "inline-flex min-h-11 whitespace-nowrap items-center gap-1.5 border-2 px-3 font-mono text-xs uppercase tracking-[0.2em]"
const ctaPrimary = `${ctaBase} ${hardHover} border-eva-primary text-eva-primary-light hover:bg-eva-primary hover:text-eva-black`

/** Clases de un enlace de sección: bloque invertido si está activo. */
function linkClasses(active) {
  return active ? "bg-eva-primary text-eva-black" : "text-eva-gray hover:text-eva-paper"
}

export default function SiteNav() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null)
  const menuButtonRef = useRef(null)

  // Scroll-spy: una sola observación con zona de lectura bajo la barra.
  useEffect(() => {
    if (typeof window.IntersectionObserver !== "function") return undefined
    const visible = new Set()
    const observer = new window.IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id)
        else visible.delete(entry.target.id)
      }
      setActive(pickActiveSection(SECTION_ORDER, visible))
    }, sectionObserverOptions(NAV_HEIGHT_PX))
    for (const id of SECTION_ORDER) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  // Al pasar a escritorio el menú móvil se cierra.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined
    const mq = window.matchMedia("(min-width: 768px)")
    const onChange = (e) => {
      if (e.matches) setOpen(false)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const onKeyDown = (e) => {
    if (menuKeyAction(e.key, open) === "close") {
      setOpen(false)
      menuButtonRef.current?.focus()
    }
  }

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-eva-primary focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.2em] focus:text-eva-black"
      >
        Saltar al contenido
      </a>
      <header className="fixed inset-x-0 top-0 z-50" onKeyDown={onKeyDown}>
        <div className="eva-nav-glass h-16 border-b-2 border-eva-primary">
          <nav
            aria-label="Principal"
            className="mx-auto flex h-full max-w-6xl items-center justify-between gap-2 px-4 md:px-6"
          >
            <NavBrand />
            <ul className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => {
                const isActive = active === link.id
                return (
                  <li key={link.id}>
                    <a
                      href={navHref(link.id)}
                      aria-current={isActive ? "location" : undefined}
                      className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap px-3 font-mono text-xs uppercase tracking-[0.2em] ${linkClasses(isActive)}`}
                    >
                      <span aria-hidden="true" className={isActive ? "text-eva-black" : "text-eva-primary-light"}>
                        {navCode(link.code)}
                      </span>
                      {link.label}
                    </a>
                  </li>
                )
              })}
            </ul>
            <div className="flex items-center gap-2">
              <Link to="/configurador" className={`${ctaPrimary} hidden sm:inline-flex`}>
                Armá tu web
              </Link>
              <a
                href="/cv.pdf"
                target="_blank"
                rel="noreferrer"
                className={`${ctaBase} ${hardHover} border-eva-gray-dim text-eva-paper hover:bg-eva-paper hover:text-eva-black`}
              >
                <Download className="size-3.5" aria-hidden="true" /> CV
              </a>
              <a href="#contacto" className={ctaPrimary}>
                Hablemos
              </a>
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
                className="inline-flex size-11 items-center justify-center border-2 border-eva-primary text-eva-primary-light md:hidden"
              >
                {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
              </button>
            </div>
          </nav>
        </div>
        <div className="eva-stripes h-1.5" aria-hidden="true" />
        <div
          id="mobile-nav"
          className={`md:hidden ${open ? "block" : "hidden"} border-b-2 border-eva-primary bg-eva-black`}
        >
          <ul className="flex flex-col px-4 py-3">
            <li className="sm:hidden">
              <Link
                to="/configurador"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-2 px-3 font-mono text-xs uppercase tracking-[0.2em] text-eva-primary-light"
              >
                Armá tu web
              </Link>
            </li>
            {NAV_LINKS.map((link) => {
              const isActive = active === link.id
              return (
                <li key={link.id}>
                  <a
                    href={navHref(link.id)}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "location" : undefined}
                    className={`flex min-h-11 items-center gap-2 px-3 font-mono text-xs uppercase tracking-[0.2em] ${linkClasses(isActive)}`}
                  >
                    <span aria-hidden="true" className={isActive ? "text-eva-black" : "text-eva-primary-light"}>
                      {navCode(link.code)}
                    </span>
                    {link.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </header>
    </>
  )
}
