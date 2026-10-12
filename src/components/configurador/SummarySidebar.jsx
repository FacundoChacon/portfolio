import { AlertCircle } from 'lucide-react'

/**
 * Panel de resumen del presupuesto (C-06).
 *
 * Presentacional: recibe el modelo ya armado por `buildSummary` (C-06) y lo
 * pinta. El total se anuncia con `aria-live` para reflejar los cambios en vivo.
 */
export default function SummarySidebar({ summary, className = '' }) {
  const { service, extras, totalLabel, recurringLabel, hasQuotable } = summary

  return (
    <aside className={`glass p-6 ${className}`} aria-label="Resumen del presupuesto">
      <h2 className="font-display text-sm uppercase tracking-widest text-gray-400">
        Tu presupuesto
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
            <span className="shrink-0 font-mono text-sm text-white">{service.amountLabel}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Elegí un tipo de sitio para empezar.</p>
        )}

        {extras.length > 0 && (
          <ul className="space-y-2 border-t border-dark-border pt-3">
            {extras.map((extra) => (
              <li key={extra.id} className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-gray-400">{extra.name}</span>
                <span className="shrink-0 font-mono text-xs text-gray-300">
                  {extra.amountLabel}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasQuotable && (
        <p className="mt-4 flex items-start gap-2 rounded-md border border-accent-pink/40 bg-accent-pink/10 px-3 py-2 text-xs text-accent-pink">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Incluye un sistema a medida: se cotiza aparte y no está incluido en el total.
        </p>
      )}

      <div className="mt-6 border-t border-dark-border pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-gray-400">Total</span>
          <span
            aria-live="polite"
            className="font-display text-2xl font-bold text-accent-green text-glow-cyan"
          >
            {totalLabel}
          </span>
        </div>
        {recurringLabel && (
          <p className="mt-1 text-right font-mono text-xs text-gray-400">+ {recurringLabel}/mes</p>
        )}
      </div>
    </aside>
  )
}
