/**
 * Panel de resumen de la solicitud (C-06).
 *
 * Presentacional: recibe el modelo ya armado por `buildSummary` y lo pinta.
 * Muestra el tipo de sitio elegido y los extras seleccionados, sin importes.
 */
export default function SummarySidebar({ summary, className = '' }) {
  const { service, extras } = summary

  return (
    <aside className={`glass p-6 ${className}`} aria-label="Resumen de la solicitud">
      <h2 className="font-display text-sm uppercase tracking-widest text-gray-400">
        Tu solicitud
      </h2>

      <div className="mt-4 space-y-3">
        {service ? (
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-gray-300">
              {service.name}
              {service.quantity > 1 && (
                <span className="text-gray-500"> × {service.quantity}</span>
              )}
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Elegí un tipo de sitio para empezar.</p>
        )}

        {extras.length > 0 ? (
          <ul className="space-y-2 border-t border-dark-border pt-3">
            {extras.map((extra) => (
              <li key={extra.id} className="text-sm text-gray-400">
                {extra.name}
              </li>
            ))}
          </ul>
        ) : (
          service && <p className="border-t border-dark-border pt-3 text-xs text-gray-500">Sin extras</p>
        )}
      </div>

      <p className="mt-6 border-t border-dark-border pt-4 text-xs text-gray-500">
        Te respondo por email con el presupuesto a medida, sin cargo.
      </p>
    </aside>
  )
}
