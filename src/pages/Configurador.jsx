import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Placeholder del Configurador de Presupuestos Web.
 * El layout real (wizard + resumen en vivo) se implementa en C-06.
 */
export default function Configurador() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-dark px-4 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent-green text-glow-cyan">
        Próximamente
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold gradient-text">
        Configurador de Presupuestos
      </h1>
      <p className="mt-4 max-w-md text-gray-400">
        Acá vas a poder armar el presupuesto de tu página web paso a paso y ver el total en vivo.
      </p>
      <Link
        to="/"
        className="box-glow-cyan mt-8 inline-flex items-center gap-2 rounded-md border border-accent-green/50 px-4 py-2 font-mono text-xs uppercase tracking-widest text-accent-green transition-colors hover:bg-accent-green hover:text-dark focus-visible:bg-accent-green focus-visible:text-dark"
      >
        <ArrowLeft className="size-4" /> Volver al inicio
      </Link>
    </main>
  )
}
