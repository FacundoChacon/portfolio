import { Link } from "react-router-dom"

import { BRAND_CODE, navCode } from "../utils/siteNav"

/** Marca `FC//00` con enlace al inicio; compartida por la home y el configurador. */
export default function NavBrand() {
  return (
    <Link
      to="/"
      className="font-eva-display font-stretch-condensed text-lg font-black uppercase tracking-wide text-eva-paper"
    >
      FC
      <span aria-hidden="true" className="ml-1 font-mono text-xs font-normal tracking-[0.2em] text-eva-secondary">
        {navCode(BRAND_CODE)}
      </span>
      <span className="sr-only">, ir al inicio</span>
    </Link>
  )
}
