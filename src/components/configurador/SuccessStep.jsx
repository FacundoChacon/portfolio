/**
 * Paso de éxito al enviar el presupuesto (C-10).
 *
 * Muestra confirmación con el nombre del prospecto (US-008 CA-3) y un botón
 * para volver al inicio. Recibe `headingRef` para que la página le dé el foco
 * al aparecer (C-11).
 */
import { Link } from 'react-router-dom'

import { buildSuccessMessage } from '../../utils/wizardView.js'

export default function SuccessStep({ name = '', headingRef = null }) {
  const { title, body } = buildSuccessMessage(name)

  return (
    <div className="glass p-6">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-xl font-bold text-white outline-none"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm text-gray-300">{body}</p>
      <div className="mt-4">
        <Link
          to="/"
          className="box-glow-cyan inline-flex items-center gap-2 rounded-md border border-accent-green/50 px-5 py-2 font-mono text-xs uppercase tracking-widest text-accent-green transition-colors hover:bg-accent-green hover:text-dark focus-visible:bg-accent-green focus-visible:text-dark"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}