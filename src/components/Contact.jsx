import { Mail, MapPin } from "lucide-react"
import { GithubIcon, LinkedinIcon } from "./BrandIcons"
import { useReveal } from "../hooks/useReveal"
import { HOME_NAV_LINKS } from "../utils/homeNav"
import {
  buildContactChannels,
  channelCode,
  channelLinkProps,
  isExternalHref,
  resolveContactEmail,
} from "../data/contacto"

const CHANNELS = buildContactChannels(resolveContactEmail(import.meta.env.VITE_CONTACT_EMAIL))
const ICONS = { email: Mail, github: GithubIcon, linkedin: LinkedinIcon }

/** Estados de hover/foco/activo con forma (sombra sólida + indicador invertido), traslación solo con movimiento permitido. */
const CHANNEL_CLASSES =
  "group relative flex min-h-[4.5rem] items-stretch border-2 border-eva-gray-dim bg-eva-panel hover:border-eva-secondary hover:shadow-[6px_6px_0_0_var(--eva-secondary)] focus-visible:border-eva-secondary focus-visible:shadow-[6px_6px_0_0_var(--eva-secondary)] active:shadow-none motion-safe:transition-[transform,box-shadow,border-color] motion-safe:duration-150 motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5 motion-safe:focus-visible:-translate-x-0.5 motion-safe:focus-visible:-translate-y-0.5 motion-safe:active:translate-x-0 motion-safe:active:translate-y-0"

export default function Contact() {
  const { code } = HOME_NAV_LINKS.find((link) => link.id === "contacto")
  const [ref, visible] = useReveal({ threshold: 0.1 })

  return (
    <section id="contacto" className="relative overflow-x-clip border-t-2 border-eva-primary bg-eva-black pb-24">
      <div aria-hidden="true" className="eva-stripes eva-stripes-primary h-3" />
      <div className="mx-auto max-w-6xl px-4 pt-20 md:px-6">
        <div className="flex items-center gap-4">
          <p aria-hidden="true" className="font-mono text-sm uppercase tracking-[0.3em] text-eva-primary-light">
            {code} {"//"}
          </p>
          <h2 className="font-eva-display text-4xl font-black uppercase leading-none tracking-tight text-eva-paper font-stretch-condensed sm:text-6xl">
            Contáctame
          </h2>
          <div aria-hidden="true" className="eva-stripes h-2 flex-1" />
        </div>

        <div
          ref={ref}
          className={`eva-reveal mt-14 grid gap-12 lg:grid-cols-12 lg:gap-10 ${visible ? "is-visible" : ""}`}
        >
          <div className="eva-panel p-6 pb-8 sm:p-8 lg:col-span-5">
            <span aria-hidden="true" className="eva-panel-label">COM {"//"} ENLACE</span>
            <span aria-hidden="true" className="eva-panel-code">CH-05</span>
            <p className="mt-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-eva-tertiary">
              <span aria-hidden="true" className="inline-block size-2.5 bg-eva-tertiary" />
              Canal de comunicación abierto
            </p>
            <h3 className="mt-6 font-eva-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-eva-paper font-stretch-condensed text-balance sm:text-5xl">
              ¿Construimos algo <span className="text-eva-primary-light">juntos?</span>
            </h3>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-eva-gray text-pretty">
              Estoy en búsqueda de mi primera oportunidad profesional. Si tenés un
              proyecto o una vacante, escribime — respondo rápido.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 font-mono text-sm text-eva-gray">
              <MapPin className="size-4 text-eva-secondary" aria-hidden="true" /> Maipú, Mendoza, Argentina
            </p>
            <div aria-hidden="true" className="eva-stripes mt-8 h-2" />
          </div>

          <ul className="grid content-start gap-5 lg:col-span-7">
            {CHANNELS.map((channel, index) => {
              const Icon = ICONS[channel.id]
              const external = isExternalHref(channel.href)
              return (
                <li key={channel.id}>
                  <a href={channel.href} {...channelLinkProps(channel.href)} className={CHANNEL_CLASSES}>
                    <span
                      aria-hidden="true"
                      className="hidden items-center border-r-2 border-eva-gray-dim px-3 font-mono text-xs text-eva-gray sm:flex"
                    >
                      {channelCode(index)}
                    </span>
                    <span aria-hidden="true" className="flex items-center px-3 text-eva-primary-light sm:px-4">
                      <Icon className="size-6" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col justify-center py-3">
                      <span className="block font-mono text-[11px] uppercase tracking-[0.2em] text-eva-gray">
                        {channel.label}
                      </span>
                      <span className="block font-mono text-sm text-eva-paper [overflow-wrap:anywhere] sm:text-base">
                        {channel.value}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex items-center border-l-2 border-eva-gray-dim px-3 font-mono text-xs font-bold uppercase tracking-[0.15em] text-eva-primary-light group-hover:bg-eva-secondary group-hover:text-eva-black group-focus-visible:bg-eva-secondary group-focus-visible:text-eva-black"
                    >
                      <span className="hidden sm:inline">{external ? "Abrir " : "Escribir "}</span>
                      {external ? "↗" : "→"}
                    </span>
                    {external && <span className="sr-only"> (se abre en una pestaña nueva)</span>}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>

        <footer className="mt-20 flex flex-col items-center justify-between gap-4 border-t-2 border-eva-line pt-8 sm:flex-row">
          <p className="font-mono text-xs uppercase tracking-widest text-eva-gray">
            {"<FC/>"} — Facundo Chacón
          </p>
          <p className="font-mono text-xs text-eva-gray">
            © {new Date().getFullYear()} · Built with React + Vite
          </p>
        </footer>
      </div>
    </section>
  )
}
