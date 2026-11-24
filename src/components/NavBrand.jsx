import { Link } from "react-router-dom"

import { BRAND_CODE, navCode } from "../utils/siteNav"
import LogoEva from "./LogoEva"

/** Marca `[glifo] FC//00` con enlace al inicio; compartida por la home y el configurador. */
export default function NavBrand() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 font-eva-display font-stretch-condensed text-lg font-black uppercase tracking-wide text-eva-paper"
    >
      <LogoEva variante="simple" className="hidden h-7 w-auto min-[360px]:block" />
      <span>
        FC
        <span aria-hidden="true" className="ml-1 font-mono text-xs font-normal tracking-[0.2em] text-eva-secondary">
          {navCode(BRAND_CODE)}
        </span>
        <span className="sr-only">, ir al inicio</span>
      </span>
    </Link>
  )
}
