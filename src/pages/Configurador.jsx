import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react'

import NavBrand from '../components/NavBrand.jsx'
import ExtrasCards from '../components/configurador/ExtrasCards.jsx'
import FormStep from '../components/configurador/FormStep.jsx'
import QuantityControl from '../components/configurador/QuantityControl.jsx'
import ReviewStep from '../components/configurador/ReviewStep.jsx'
import ServiceCards from '../components/configurador/ServiceCards.jsx'
import SummarySidebar from '../components/configurador/SummarySidebar.jsx'
import SuccessStep from '../components/configurador/SuccessStep.jsx'
import ErrorStep from '../components/configurador/ErrorStep.jsx'
import WizardSteps from '../components/configurador/WizardSteps.jsx'
import { extras, services } from '../data/configurador.js'
import { useConfigurador } from '../hooks/useConfigurador.js'
import { buildWhatsAppUrl } from '../utils/contact.js'
import { buildReview } from '../utils/review.js'
import { buildSummary } from '../utils/summary.js'
import { FIRST_STEP, LAST_STEP, STEPS } from '../utils/wizard.js'
import { getLiveMessage, getViewKey, shouldMoveFocus } from '../utils/wizardView.js'

/** Email de contacto: variable de entorno o el de respaldo. */
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'chaconfacu2006@gmail.com'

const stepTitle = {
  [STEPS.SERVICE]: '1. Elegí el tipo de sitio',
  [STEPS.EXTRAS]: '2. Sumá extras',
  [STEPS.CONTACT]: '3. Dejame tus datos',
  [STEPS.REVIEW]: '4. Revisá tu presupuesto',
}

/** Cuerpo del paso actual del wizard. */
function StepBody({ step, wizard, contactEmail }) {
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

  if (step === STEPS.CONTACT) {
    return <FormStep form={wizard.form} errors={wizard.errors} onChange={wizard.setForm} />
  }

  const review = buildReview(wizard, services, extras)
  return (
    <ReviewStep
      review={review}
      onEdit={wizard.goToStep}
      onSubmit={wizard.submit}
      submitting={wizard.submitting}
      submitted={wizard.submitted}
      contactEmail={contactEmail}
    />
  )
}

const secondaryButton =
  'inline-flex items-center gap-2 rounded-md border border-dark-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-gray-400 transition-colors hover:border-accent-green/50 hover:text-accent-green focus-visible:text-accent-green disabled:cursor-not-allowed disabled:opacity-50'

const primaryButton =
  'box-glow-cyan inline-flex items-center gap-2 rounded-md border border-accent-green/50 px-4 py-2 font-mono text-xs uppercase tracking-widest text-accent-green transition-colors hover:bg-accent-green hover:text-dark focus-visible:bg-accent-green focus-visible:text-dark'

/**
 * Página `/configurador`: layout de dos columnas con el wizard y el resumen en
 * vivo. Los cuatro pasos quedan operativos tras C-08; el envío se termina de
 * cablear en C-10.
 */
export default function Configurador() {
  const wizard = useConfigurador({ services, extras })
  const summary = buildSummary(wizard, services, extras)

  // Al cambiar de vista (paso, éxito o error) el foco va al título; la carga
  // inicial no lo mueve porque la ref arranca con la clave actual.
  const headingRef = useRef(null)
  const viewKey = getViewKey(wizard)
  const prevKeyRef = useRef(viewKey)
  useEffect(() => {
    if (shouldMoveFocus(prevKeyRef.current, viewKey)) headingRef.current?.focus()
    prevKeyRef.current = viewKey
  }, [viewKey])

  return (
    <div className="min-h-screen bg-dark">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-eva-orange focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.2em] focus:text-eva-black"
      >
        Saltar al contenido
      </a>
      <header>
        <div className="eva-nav-glass border-b-2 border-eva-orange">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 md:px-6">
            <NavBrand />
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 border-2 border-eva-orange px-3 font-mono text-xs uppercase tracking-[0.2em] text-eva-orange hover:bg-eva-orange hover:text-eva-black hover:shadow-[3px_3px_0_0_var(--eva-orange)] motion-safe:transition-[transform,color,background-color] motion-safe:duration-150 motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" /> Volver al inicio
            </Link>
          </div>
        </div>
        <div className="eva-stripes h-1.5" aria-hidden="true" />
      </header>

      <main id="contenido" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 outline-none md:px-6 md:py-10">
        <h1 className="font-display text-3xl font-bold gradient-text md:text-4xl">
          Armá tu presupuesto
        </h1>
        <p className="mt-2 text-gray-400">Elegí tu sitio, sumá extras y dejame tus datos.</p>

        <div className="mt-8">
          <WizardSteps current={wizard.step} />
        </div>

        <p role="status" aria-live="polite" className="sr-only">
          {getLiveMessage(wizard)}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="min-w-0">
            {wizard.status === 'success' ? (
              <SuccessStep name={wizard.form?.name} headingRef={headingRef} />
            ) : wizard.status === 'error' ? (
              <ErrorStep
                onRetry={wizard.submit}
                onEdit={wizard.clearSubmitError}
                contactEmail={CONTACT_EMAIL}
                headingRef={headingRef}
                whatsappUrl={buildWhatsAppUrl(
                  import.meta.env.VITE_WHATSAPP_NUMBER,
                  'Hola Facundo, te quería consultar por el presupuesto del configurador',
                )}
              />
            ) : (
              <>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="mb-4 font-display text-lg font-bold text-white outline-none"
                >
                  {stepTitle[wizard.step]}
                </h2>
                <StepBody step={wizard.step} wizard={wizard} contactEmail={CONTACT_EMAIL} />
              </>
            )}

            {wizard.status !== 'success' && wizard.status !== 'error' && (
              <div className="mt-6 flex items-center justify-between gap-3">
                {wizard.step > FIRST_STEP ? (
                  <button
                    type="button"
                    onClick={wizard.prevStep}
                    className={secondaryButton}
                    disabled={wizard.submitting}
                  >
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
            )}
          </section>

          <SummarySidebar summary={summary} className="lg:sticky lg:top-8 lg:self-start" />
        </div>
      </main>
    </div>
  )
}