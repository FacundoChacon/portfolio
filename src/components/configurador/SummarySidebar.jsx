import { PANEL } from './estilos.js'

/**
 * Panel de resumen de la solicitud (C-06).
 *
 * Presentacional: recibe el modelo ya armado por `buildSummary` y lo pinta.
 * Muestra el tipo de sitio elegido y los extras seleccionados, sin importes.
 */
export default function SummarySidebar({ summary, className = '' }) {
  const { service, extras } = summary

  return (
    <aside className={`${PANEL} ${className}`} aria-label="Resumen de la solicitud">
      <span aria-hidden="true" className="eva-panel-label">
        SYS {'//'} RESUMEN
      </span>
      <span aria-hidden="true" className="eva-panel-code">
        EXT-{String(extras.length).padStart(2, '0')}
      </span>

      <h2 className="font-mono text-sm uppercase tracking-widest text-eva-gray">Tu solicitud</h2>

      <div className="mt-4 space-y-3">
        {service ? (
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-eva-paper">
              {service.name}
              {service.quantity > 1 && <span className="text-eva-gray"> × {service.quantity}</span>}
            </span>
          </div>
        ) : (
          <p className="text-sm text-eva-gray">Elegí un tipo de sitio para empezar.</p>
        )}

        {extras.length > 0 ? (
          <ul className="space-y-2 border-t-2 border-eva-line pt-3">
            {extras.map((extra) => (
              <li key={extra.id} className="text-sm text-eva-gray">
                {extra.name}
              </li>
            ))}
          </ul>
        ) : (
          service && <p className="border-t-2 border-eva-line pt-3 text-xs text-eva-gray">Sin extras</p>
        )}
      </div>

      <p className="mt-6 border-t-2 border-eva-line pt-4 text-xs text-eva-gray">
        Te respondo por email con el presupuesto a medida, sin cargo.
      </p>
    </aside>
  )
}
