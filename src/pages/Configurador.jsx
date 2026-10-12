import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react'

import ExtrasCards from '../components/configurador/ExtrasCards.jsx'
import QuantityControl from '../components/configurador/QuantityControl.jsx'
import ServiceCards from '../components/configurador/ServiceCards.jsx'
import SummarySidebar from '../components/configurador/SummarySidebar.jsx'
import WizardSteps from '../components/configurador/WizardSteps.jsx'
import { extras, services } from '../data/configurador.js'
import { useConfigurador } from '../hooks/useConfigurador.js'
import { buildSummary } from '../utils/summary.js'
import { FIRST_STEP, LAST_STEP, STEPS } from '../utils/wizard.js'

/**
 * Cuerpo temporal de un paso todavía no implementado.
 * C-08 (pasos 3-4) lo reemplaza por el contenido real.
 */
function StepPlaceholder({ step }) {
  return (
    <div className="glass flex min-h-48 flex-col items-center justify-center p-8 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent-green text-glow-cyan">
        Paso {step + 1}
      </p>
      <p className="mt-3 max-w-sm text-sm text-gray-400">
        Este paso se completa en los próximos cambios del roadmap.
      </p>
    </div>
  )
}

const stepTitle = {
  [STEPS.SERVICE]: '1. Elegí el tipo de sitio',
  [STEPS.EXTRAS]: '2. Sumá extras',
  [STEPS.CONTACT]: '3. Dejame tus datos',
  [STEPS.REVIEW]: '4. Revisá tu presupuesto',
}

/** Cuerpo del paso actual del wizard. */
function StepBody({ step, wizard }) {
  if (step === STEPS.SERVICE) {
    return (
      <div className="space-y-6">
        <ServiceCards
          services={services}
          selectedId={wizard.serviceId}
          onSelect={wizard.setService}
        />
        <div className="glass flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-display text-sm text-white">Cantidad</p>
            <p className="text-xs text-gray-400">¿Cuántos sitios o líneas de negocio?</p>
          </div>
          <QuantityControl quantity={wizard.quantity} onChange={wizard.setQuantity} />
        </div>
      </div>
    )
  }

  if (step === STEPS.EXTRAS) {
    return (
      <ExtrasCards extras={extras} selectedIds={wizard.extras} onToggle={wizard.toggleExtra} />
    )
  }

  return <StepPlaceholder step={step} />
}

const secondaryButton =
  'inline-flex items-center gap-2 rounded-md border border-dark-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-gray-400 transition-colors hover:border-accent-green/50 hover:text-accent-green focus-visible:text-accent-green'

const primaryButton =
  'box-glow-cyan inline-flex items-center gap-2 rounded-md border border-accent-green/50 px-4 py-2 font-mono text-xs uppercase tracking-widest text-accent-green transition-colors hover:bg-accent-green hover:text-dark focus-visible:bg-accent-green focus-visible:text-dark'

/**
 * Página `/configurador`: layout de dos columnas con el wizard y el resumen en
 * vivo. Pasos 1-2 (C-07); pasos 3-4 pendientes (C-08).
 */
export default function Configurador() {
  const wizard = useConfigurador({ services, extras })
  const summary = buildSummary(wizard, services, extras)

  return (
    <div className="min-h-screen bg-dark">
      <header className="border-b border-dark-border bg-dark/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link
            to="/"
            className="font-mono text-sm font-bold tracking-widest text-accent-green text-glow-cyan"
          >
            {"<FC/>"}
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-accent-green focus-visible:text-accent-green"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" /> Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <h1 className="font-display text-3xl font-bold gradient-text md:text-4xl">
          Armá tu presupuesto
        </h1>
        <p className="mt-2 text-gray-400">Elegí tu sitio, sumá extras y dejame tus datos.</p>

        <div className="mt-8">
          <WizardSteps current={wizard.step} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="min-w-0">
            <h2 className="mb-4 font-display text-lg font-bold text-white">
              {stepTitle[wizard.step]}
            </h2>

            <StepBody step={wizard.step} wizard={wizard} />

            <div className="mt-6 flex items-center justify-between gap-3">
              {wizard.step > FIRST_STEP ? (
                <button type="button" onClick={wizard.prevStep} className={secondaryButton}>
                  <ChevronLeft className="size-4" aria-hidden="true" /> Atrás
                </button>
              ) : (
                <span />
              )}

              {wizard.step < LAST_STEP && (
                <button type="button" onClick={wizard.nextStep} className={primaryButton}>
                  Continuar <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </section>

          <SummarySidebar summary={summary} className="lg:sticky lg:top-8 lg:self-start" />
        </div>
      </main>
    </div>
  )
}
