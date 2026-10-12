import { AlertCircle } from 'lucide-react'

/**
 * Totales del presupuesto (C-08): aviso de ítem cotizable (RN-CO-02), total de
 * pago único y, si hay recurrentes, el importe mensual (RN-PR-05).
 *
 * Compartido por el panel lateral (C-06) y el paso de revisión (C-08) para que
 * el total tenga una sola fuente. Presentacional: recibe el modelo de
 * `buildSummary`.
 */
export default function BudgetTotals({ summary, className = '' }) {
  const { totalLabel, recurringLabel, hasQuotable } = summary

  return (
    <div className={className}>
      {hasQuotable && (
        <p className="flex items-start gap-2 rounded-md border border-accent-pink/40 bg-accent-pink/10 px-3 py-2 text-xs text-accent-pink">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Incluye un sistema a medida: se cotiza aparte y no está incluido en el total.
        </p>
      )}

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
  )
}