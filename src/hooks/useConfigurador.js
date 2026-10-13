import { useState } from 'react'

import { extras as catalogExtras, services as catalogServices } from '../data/configurador.js'
import { buildLeadPayload, sendLead } from '../utils/webhook.js'
import {
  createInitialState,
  getSelectedExtras,
  getService,
  goToStep,
  nextStep,
  prevStep,
  setForm,
  setQuantity,
  setService,
  setStatus,
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

  const submitReal = async () => {
    let pending = false
    setState((current) => {
      if (current.submitted || current.submitting) {
        return current
      }
      const validated = submit(current)
      if (Object.keys(validated.errors ?? {}).length > 0) {
        return validated
      }
      pending = true
      return { ...validated, submitting: true, status: 'submitting' }
    })

    if (!pending) return

    try {
      const payload = buildLeadPayload(state, services, extras)
      await sendLead(payload, { pdf: null })
      setState((current) => ({ ...current, submitted: true, submitting: false, status: 'success' }))
    } catch (error) {
      console.error('Error enviando lead:', error)
      setState((current) => ({ ...current, submitting: false, status: 'error' }))
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
    setStatus: (status) => setState((current) => setStatus(current, status)),
  }
}

export default useConfigurador