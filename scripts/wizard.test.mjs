/**
 * Tests unitarios del núcleo de estado del wizard (C-05).
 * Runner nativo de Node (`node:test`); sin dependencias.
 *
 * Uso: npm run test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  FIRST_STEP,
  LAST_STEP,
  STATUS,
  STEPS,
  TOTAL_STEPS,
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
  validateForm,
} from '../src/utils/wizard.js'

const SERVICES = [{ id: 'landing' }, { id: 'custom' }]
const EXTRAS = [
  { id: 'seo', recommended: false },
  { id: 'hosting', recommended: true },
  { id: 'maintenance', recommended: false },
]

const withContact = (form, patch = {}) =>
  setForm({ ...createInitialState(SERVICES, EXTRAS), step: STEPS.CONTACT, ...patch }, form)

// --- 3.1 Estado inicial -----------------------------------------------------

test('createInitialState: primer servicio, extras recommended, cantidad 1, paso 0', () => {
  const state = createInitialState(SERVICES, EXTRAS)
  assert.equal(state.serviceId, 'landing')
  assert.deepEqual(state.extras, ['hosting'])
  assert.equal(state.quantity, 1)
  assert.equal(state.step, FIRST_STEP)
  assert.deepEqual(state.form, { name: '', email: '', phone: '', project: '' })
  assert.equal(state.submitted, false)
  assert.equal(state.status, STATUS.IDLE)
})

test('createInitialState: sin catálogo no falla', () => {
  const state = createInitialState()
  assert.equal(state.serviceId, '')
  assert.deepEqual(state.extras, [])
})

test('constantes de pasos', () => {
  assert.equal(FIRST_STEP, 0)
  assert.equal(LAST_STEP, 3)
  assert.equal(TOTAL_STEPS, 4)
})

// --- 3.2 Selección y extras -------------------------------------------------

test('setService: cambia el servicio y conserva los extras (RN-PR-06)', () => {
  const before = createInitialState(SERVICES, EXTRAS)
  const after = setService(before, 'custom')
  assert.equal(after.serviceId, 'custom')
  assert.deepEqual(after.extras, before.extras)
})

test('setService: ignora un id inválido', () => {
  const state = createInitialState(SERVICES, EXTRAS)
  assert.equal(setService(state, '').serviceId, 'landing')
  assert.equal(setService(state, null).serviceId, 'landing')
})

test('toggleExtra: agrega, quita y no duplica', () => {
  const base = createInitialState(SERVICES, EXTRAS) // ['hosting']
  const added = toggleExtra(base, 'seo')
  assert.deepEqual(added.extras, ['hosting', 'seo'])

  const removed = toggleExtra(added, 'seo')
  assert.deepEqual(removed.extras, ['hosting'])

  const twice = toggleExtra(toggleExtra(base, 'seo'), 'seo')
  assert.deepEqual(twice.extras, ['hosting'])
})

// --- 3.3 Cantidad y formulario ----------------------------------------------

test('setQuantity: normaliza a entero ≥ 1', () => {
  const base = createInitialState(SERVICES, EXTRAS)
  assert.equal(setQuantity(base, 0).quantity, 1)
  assert.equal(setQuantity(base, -3).quantity, 1)
  assert.equal(setQuantity(base, 'abc').quantity, 1)
  assert.equal(setQuantity(base, null).quantity, 1)
  assert.equal(setQuantity(base, 2.7).quantity, 2)
  assert.equal(setQuantity(base, 5).quantity, 5)
})

test('setForm: actualiza un campo sin pisar el resto', () => {
  const base = createInitialState(SERVICES, EXTRAS)
  const withName = setForm(base, { name: 'Ana' })
  assert.equal(withName.form.name, 'Ana')
  assert.equal(withName.form.email, '')

  const withEmail = setForm(withName, { email: 'ana@example.com' })
  assert.deepEqual(withEmail.form, {
    name: 'Ana',
    email: 'ana@example.com',
    phone: '',
    project: '',
  })
})

// --- 3.4 Validación y navegación --------------------------------------------

test('validateForm: nombre vacío y email inválido', () => {
  assert.ok(validateForm({ name: '   ', email: 'a@b.com' }).name)
  assert.equal(validateForm({ name: '   ', email: 'a@b.com' }).email, undefined)
  assert.ok(validateForm({ name: 'Ana', email: 'no-es-email' }).email)
  assert.deepEqual(validateForm({ name: 'Ana', email: 'ana@b.com' }), {})
})

test('nextStep: avanza sin validar en los pasos de servicio y extras', () => {
  const service = createInitialState(SERVICES, EXTRAS)
  const extras = nextStep(service)
  assert.equal(extras.step, STEPS.EXTRAS)
  assert.equal(nextStep(extras).step, STEPS.CONTACT)
})

test('nextStep: bloquea en el paso de contacto con nombre vacío', () => {
  const state = withContact({ name: '', email: 'ana@example.com' })
  const result = nextStep(state)
  assert.equal(result.step, STEPS.CONTACT)
  assert.ok(result.errors.name)
})

test('nextStep: bloquea en el paso de contacto con email inválido', () => {
  const state = withContact({ name: 'Ana', email: 'no-es-email' })
  const result = nextStep(state)
  assert.equal(result.step, STEPS.CONTACT)
  assert.ok(result.errors.email)
  assert.equal(result.errors.name, undefined)
})

test('nextStep: avanza con datos válidos y limpia errores previos', () => {
  const state = withContact(
    { name: 'Ana', email: 'ana@example.com' },
    { errors: { name: 'Ingresá tu nombre.' } },
  )
  const result = nextStep(state)
  assert.equal(result.step, STEPS.REVIEW)
  assert.deepEqual(result.errors, {})
})

test('nextStep: no avanza más allá del último paso', () => {
  const state = { ...createInitialState(SERVICES, EXTRAS), step: LAST_STEP }
  assert.equal(nextStep(state).step, LAST_STEP)
})

test('prevStep: retrocede y no baja del primer paso (RN-EX-03)', () => {
  const state = { ...createInitialState(SERVICES, EXTRAS), step: STEPS.CONTACT }
  assert.equal(prevStep(state).step, STEPS.EXTRAS)
  assert.equal(prevStep({ ...state, step: FIRST_STEP }).step, FIRST_STEP)
})

test('prevStep: conserva el estado cargado', () => {
  let state = { ...createInitialState(SERVICES, EXTRAS), step: STEPS.REVIEW }
  state = setQuantity(state, 4)
  state = toggleExtra(state, 'seo')
  state = setForm(state, { name: 'Ana' })

  const back = prevStep(state)
  assert.equal(back.quantity, 4)
  assert.deepEqual(back.extras, ['hosting', 'seo'])
  assert.equal(back.form.name, 'Ana')
  assert.equal(back.serviceId, 'landing')
})

// --- Salto de paso (C-08) ---------------------------------------------------

test('goToStep: salta al paso pedido (Editar)', () => {
  const state = createInitialState(SERVICES, EXTRAS)
  assert.equal(goToStep(state, STEPS.EXTRAS).step, STEPS.EXTRAS)
  assert.equal(goToStep(state, STEPS.CONTACT).step, STEPS.CONTACT)
  assert.equal(goToStep(state, STEPS.REVIEW).step, STEPS.REVIEW)
})

test('goToStep: acota fuera de rango (RN-EX-03)', () => {
  const state = createInitialState(SERVICES, EXTRAS)
  assert.equal(goToStep(state, -5).step, FIRST_STEP)
  assert.equal(goToStep(state, 99).step, LAST_STEP)
})

test('goToStep: ignora valores no numéricos', () => {
  const state = { ...createInitialState(SERVICES, EXTRAS), step: STEPS.CONTACT }
  assert.equal(goToStep(state, 'abc').step, STEPS.CONTACT)
  assert.equal(goToStep(state, null).step, STEPS.CONTACT)
  assert.equal(goToStep(state, undefined).step, STEPS.CONTACT)
})

// --- 3.5 Envío --------------------------------------------------------------

test('submit: con datos válidos marca enviado y pasa a submitting', () => {
  const state = setForm(createInitialState(SERVICES, EXTRAS), {
    name: 'Ana',
    email: 'ana@example.com',
  })
  const result = submit(state)
  assert.equal(result.submitted, true)
  assert.equal(result.status, STATUS.SUBMITTING)
  assert.deepEqual(result.errors, {})
})

test('submit: con datos inválidos no envía y expone errores', () => {
  const result = submit(createInitialState(SERVICES, EXTRAS))
  assert.equal(result.submitted, false)
  assert.equal(result.status, STATUS.IDLE)
  assert.ok(result.errors.name)
  assert.ok(result.errors.email)
})

test('setStatus: resuelve el envío a success o error e ignora valores inválidos', () => {
  const state = submit(
    setForm(createInitialState(SERVICES, EXTRAS), { name: 'Ana', email: 'ana@example.com' }),
  )
  assert.equal(setStatus(state, STATUS.SUCCESS).status, STATUS.SUCCESS)
  assert.equal(setStatus(state, STATUS.ERROR).status, STATUS.ERROR)
  assert.equal(setStatus(state, 'nope').status, STATUS.SUBMITTING)
})

// --- Selectores y pureza ----------------------------------------------------

test('selectores: resuelven servicio y extras desde el catálogo', () => {
  const state = createInitialState(SERVICES, EXTRAS)
  assert.deepEqual(getService(state, SERVICES), { id: 'landing' })
  assert.deepEqual(getSelectedExtras(state, EXTRAS), [{ id: 'hosting', recommended: true }])
})

test('selectores: devuelven null/[] si el catálogo está vacío', () => {
  const state = createInitialState()
  assert.equal(getService(state, SERVICES), null)
  assert.deepEqual(getSelectedExtras(state, EXTRAS), [])
})

test('las acciones no mutan el estado previo', () => {
  const state = createInitialState(SERVICES, EXTRAS)
  const snapshot = structuredClone(state)

  setService(state, 'custom')
  toggleExtra(state, 'seo')
  setQuantity(state, 5)
  setForm(state, { name: 'Ana' })
  nextStep(state)
  prevStep(state)
  goToStep(state, STEPS.REVIEW)
  submit(state)

  assert.deepEqual(state, snapshot)
})
