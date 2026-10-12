import BudgetTotals from './BudgetTotals.jsx'

/**
 * Panel de resumen del presupuesto (C-06).
 *
 * Presentacional: recibe el modelo ya armado por `buildSummary` (C-06) y lo
 * pinta. Los totales (total, /mes, aviso de cotizable) salen de `BudgetTotals`
 * (C-08).
 */
export default function SummarySidebar({ summary, className = '' }) {
  const { service, extras } = summary

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

      <BudgetTotals summary={summary} className="mt-6 border-t border-dark-border pt-4" />
    </aside>
  )
}
