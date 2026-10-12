import { Minus, Plus } from 'lucide-react'

/**
 * Control de cantidad del servicio principal (C-07).
 *
 * Presentacional: recibe la cantidad y notifica los cambios. El mínimo real lo
 * impone `setQuantity` (C-05); acá se deshabilita "−" en 1 como feedback
 * inmediato.
 */
const buttonClass =
  'flex size-9 items-center justify-center text-gray-400 transition-colors hover:text-accent-green focus-visible:text-accent-green disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-gray-400'

export default function QuantityControl({ quantity = 1, onChange, className = '' }) {
  return (
    <div
      className={`inline-flex items-center rounded-md border border-dark-border bg-dark-card/60 ${className}`}
    >
      <button
        type="button"
        aria-label="Restar una unidad"
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        className={buttonClass}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span
        role="status"
        className="min-w-8 text-center font-mono text-sm text-white"
        aria-label={`Cantidad: ${quantity}`}
      >
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Sumar una unidad"
        onClick={() => onChange(quantity + 1)}
        className={buttonClass}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
