import { useState } from 'react'

import { extras as catalogExtras, services as catalogServices } from '../data/configurador.js'
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
 * Hook del wizard de presupuesto (C-05).
 *
 * Envuelve el núcleo puro `src/utils/wizard.js` con `useState` y le inyecta el
 * catálogo. Devuelve el estado del wizard, el servicio y los extras resueltos
 * (objetos del catálogo) y las acciones para mutarlo.
 *
 * @param {{services?: object[], extras?: object[]}} [catalog]
 */
export function useConfigurador({
  services = catalogServices,
  extras = catalogExtras,
} = {}) {
  const [state, setState] = useState(() => createInitialState(services, extras))

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
    submit: () => setState((current) => submit(current)),
    setStatus: (status) => setState((current) => setStatus(current, status)),
  }
}

export default useConfigurador
