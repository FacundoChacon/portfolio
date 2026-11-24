/**
 * Paso de éxito al enviar el presupuesto (C-10).
 *
 * Muestra confirmación con el nombre del prospecto (US-008 CA-3) y un botón
 * para volver al inicio. Recibe `headingRef` para que la página le dé el foco
 * al aparecer (C-11).
 */
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'

import { buildSuccessMessage } from '../../utils/wizardView.js'
import { BOTON_PRIMARIO, PANEL } from './estilos.js'

export default function SuccessStep({ name = '', headingRef = null }) {
  const { title, body } = buildSuccessMessage(name)

  return (
    <div className={PANEL}>
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-eva-success" />
      <span aria-hidden="true" className="eva-panel-label eva-panel-label-success">
        COM {'//'} RECIBIDO
      </span>
      <p
        aria-hidden="true"
        className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-eva-success"
      >
        <Check className="size-4" aria-hidden="true" /> Transmisión OK
      </p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 font-eva-display text-2xl font-black uppercase text-eva-paper outline-none font-stretch-condensed"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm text-eva-gray">{body}</p>
      <div className="mt-4">
        <Link to="/" className={BOTON_PRIMARIO}>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
