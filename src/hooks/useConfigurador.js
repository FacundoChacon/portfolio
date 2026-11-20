import { useLayoutEffect, useRef, useState } from 'react'

import { extras as catalogExtras, services as catalogServices } from '../data/configurador.js'
import { buildLeadPayload, sendLead } from '../utils/webhook.js'
import {
  STATUS,
  clearSubmitError,
  createInitialState,
  getSelectedExtras,
  getService,
  goToStep,
  nextStep,
  prevStep,
  resolveSubmit,
  setForm,
  setQuantity,
  setService,
  submit,
  toggleExtra,
} from '../utils/wizard.js'

/**
 * Hook del wizard de presupuesto (C-05 → extendido C-10).
 *
 * Envuelve el núcleo puro `src/utils/wizard.js` con `useState` y le inyecta el
 * catálogo. Añade envío real al webhook con prevención de doble submit (RN-AB-02)
 * y estados `submitting`/`status` (RN-NT-03).
 *
 * @param {{services?: object[], extras?: object[]}} [catalog]
 */
export function useConfigurador({
  services = catalogServices,
  extras = catalogExtras,
} = {}) {
  const [state, setState] = useState(() => createInitialState(services, extras))

  // Bloqueo síncrono contra doble activación antes del re-render, y espejo del
  // estado vigente para decidir el envío fuera del updater de setState.
  const inFlightRef = useRef(false)
  const stateRef = useRef(state)
  useLayoutEffect(() => {
    stateRef.current = state
  }, [state])

  const submitReal = async () => {
    if (inFlightRef.current) return

    const current = stateRef.current
    const next = submit(current)
    if (next === current) return
    if (next.status !== STATUS.SUBMITTING) {
      stateRef.current = next
      setState(next)
      return
    }

    inFlightRef.current = true
    stateRef.current = next
    setState(next)

    try {
      const payload = buildLeadPayload(next, services, extras)
      await sendLead(payload, { pdf: null })
      setState((c) => resolveSubmit(c, STATUS.SUCCESS))
    } catch (error) {
      console.error('Error enviando lead:', error)
      setState((c) => resolveSubmit(c, STATUS.ERROR))
    } finally {
      inFlightRef.current = false
    }
  }

  return {
    ...state,
    service: getService(state, services),
    selectedExtras: getSelectedExtras(state, extras),
    setService: (serviceId) => setState((current) => setService(current, serviceId)),
    toggleExtra: (extraId) => setState((current) => toggleExtra(current, extraId)),
    setQuantity: (quantity) => setState((current) => setQuantity(current, quantity)),
    setForm: (patch) => setState((current) => setForm(current, patch)),
    nextStep: () => setState((current) => nextStep(current)),
    prevStep: () => setState((current) => prevStep(current)),
    goToStep: (step) => setState((current) => goToStep(current, step)),
    submit: submitReal,
    clearSubmitError: () => setState((current) => clearSubmitError(current)),
  }
}

export default useConfigurador