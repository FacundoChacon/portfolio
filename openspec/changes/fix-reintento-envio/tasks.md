# Tasks

> Strict TDD: en cada grupo del núcleo puro se escribe primero el test que falla (RED) en `scripts/wizard.test.mjs`, luego el código mínimo (GREEN) y después casos adicionales (TRIANGULATE). Ejecutar con `node --test scripts/wizard.test.mjs`. Sin dependencias nuevas.

## 0. Red de seguridad

- [x] 0.1 Correr `npm test` sobre HEAD y registrar el baseline (cantidad de tests en verde); si algo falla, detenerse y reportarlo como falla preexistente

## 1. `submit` no marca enviado al iniciar (estado-del-configurador › Inicio del envío)

- [x] 1.1 RED: reescribir el test "submit: con datos válidos..." para exigir `submitted === false`, `submitting === true`, `status === STATUS.SUBMITTING` y `errors` vacío; verificar que falla con `node --test scripts/wizard.test.mjs`
- [x] 1.2 GREEN: en `src/utils/wizard.js`, `submit` con datos válidos devuelve `submitted: false`; actualizar su JSDoc; verificar que el test pasa
- [x] 1.3 TRIANGULATE: confirmar que el test de datos inválidos sigue verde (`submitted: false`, `submitting: false`, `status: 'idle'`, errores expuestos) y agregar un caso donde el envío limpia errores previos; verificar en verde

## 2. Guard de doble envío en el núcleo (RN-AB-02)

- [x] 2.1 RED: test "submit: no-op si ya hay un envío en curso" — con `{ ...validState, submitting: true, status: 'submitting' }` exige `submit(s) === s` (identidad); verificar que falla
- [x] 2.2 GREEN: `submit` devuelve `state` sin cambios si `state.submitting || state.submitted`; verificar en verde
- [x] 2.3 TRIANGULATE: test "submit: no-op si ya fue enviado con éxito" (`submitted: true, status: 'success'` → mismo objeto) y caso con datos inválidos + `submitting: true` (sigue siendo no-op, no expone errores); verificar en verde

## 3. `resolveSubmit` (estado-del-configurador › Resolución del envío)

- [x] 3.1 RED: importar `resolveSubmit` y testear `'success'` sobre un estado en `submitting` → `status: 'success'`, `submitted: true`, `submitting: false`; verificar que falla
- [x] 3.2 GREEN: implementar y exportar `resolveSubmit(state, outcome)` en `src/utils/wizard.js` con JSDoc (D2); verificar en verde
- [x] 3.3 TRIANGULATE: `'error'` → `status: 'error'`, `submitted: false`, `submitting: false` y servicio/extras/cantidad/form intactos (`deepEqual`); outcome desconocido (`'nope'`, `undefined`) → mismo objeto; verificar en verde
- [x] 3.4 TRIANGULATE: test "reintento tras error" — `submit(resolveSubmit(submit(valid), 'error'))` vuelve a `status: 'submitting'`, `submitting: true`; y `submit(resolveSubmit(submit(valid), 'success'))` es no-op; verificar en verde

## 4. `clearSubmitError` (estado-del-configurador › Volver a revisar tras un error)

- [x] 4.1 RED: importar `clearSubmitError` y testear que desde un estado en `error` devuelve `status: 'idle'`, `step: STEPS.REVIEW`, `submitted: false` y datos conservados; verificar que falla
- [x] 4.2 GREEN: implementar y exportar `clearSubmitError(state)` en `src/utils/wizard.js` con JSDoc (D3); verificar en verde
- [x] 4.3 TRIANGULATE: en `idle`, `submitting` y `success` devuelve el mismo objeto; verificar en verde
- [x] 4.4 REFACTOR: sumar `resolveSubmit(state, 'error')` y `clearSubmitError(state)` al test "las acciones no mutan el estado previo"; revisar nombres/JSDoc del bloque de envío; verificar que todo `scripts/wizard.test.mjs` sigue en verde

## 5. Hook `useConfigurador` (decisión fuera del updater)

- [x] 5.1 Reescribir `submitReal` en `src/hooks/useConfigurador.js` según D4: `inFlightRef` + `stateRef` (sincronizado con `useEffect`), `next = submit(stateRef.current)` fuera de `setState`, retorno temprano si `next === current`, `setState(next)` sin enviar si `next.status !== STATUS.SUBMITTING`, payload con `buildLeadPayload(next, ...)`, resolución con `resolveSubmit` y liberación del bloqueo en `finally`; eliminar la variable `pending` y los literales `'submitting'`/`'success'`/`'error'`; verificar con `npm run lint` y `npm test` en verde
- [x] 5.2 Exponer `clearSubmitError` en el objeto que devuelve el hook (`setState((c) => clearSubmitError(c))`); verificar con `npm run lint`

## 6. UI de la pantalla de error

- [x] 6.1 `src/components/configurador/ErrorStep.jsx`: agregar prop opcional `onEdit` que, si está presente, renderiza un botón secundario "Revisar mis datos" (mismo estilo que los enlaces secundarios); actualizar el comentario del componente; verificar con `npm run lint` y `npm run build`
- [x] 6.2 `src/pages/Configurador.jsx`: pasar `onEdit={wizard.clearSubmitError}` a `ErrorStep` (mantener `onRetry={wizard.submit}`); verificar con `npm run build`

## 7. Verificación de integración

- [x] 7.1 Verificación manual con `npm run dev` y `VITE_WEBHOOK_URL` ausente o apuntando a un endpoint que falla: (a) enviar → pantalla de error; (b) "Reintentar" dispara una nueva petición (pestaña Network) y vuelve a mostrar el error; (c) "Revisar mis datos" vuelve al resumen con los datos y el botón "Enviar solicitud" habilitado; (d) doble clic rápido en "Enviar solicitud" produce una sola petición; (e) con un endpoint 2xx, el éxito muestra la pantalla de éxito y no permite reenviar — verificado 2026-11-20 con Playwright (webhook interceptado, 5/5 casos OK, más bloqueo de Atrás/Editar durante el envío)
- [x] 7.2 Correr `npm run ci` (lint + verify:catalog + verify:testimonials + node --test + build) y verificar que termina en verde

## 8. Ronda 2: bloqueo de navegación/edición durante el envío (D6)

- [x] 8.1 RED/GREEN/TRIANGULATE: en `scripts/wizard.test.mjs` tests de `nextStep`/`prevStep`/`goToStep` (mismo objeto con `submitting: true`; siguen funcionando con `false`) y luego de `setForm`/`setService`/`toggleExtra`/`setQuantity`, más un caso "tras `resolveSubmit(…, 'error')` la navegación y edición vuelven a funcionar"; ver fallar cada grupo antes de implementar `guardSubmitting` en `src/utils/wizard.js`
- [x] 8.2 REFACTOR: confirmar que `submit`, `resolveSubmit`, `clearSubmitError` y `setStatus` no se ven afectados; JSDoc; `node --test scripts/wizard.test.mjs` en verde
- [x] 8.3 UI: deshabilitar "Atrás" (`Configurador.jsx`) y los botones "Editar" (`ReviewStep.jsx`, prop `submitting`) mientras `submitting`
- [x] 8.4 Hook: `stateRef` con `useLayoutEffect` en `src/hooks/useConfigurador.js`
- [x] 8.5 Hook: quitar `setStatus` del objeto devuelto (verificar con grep que no hay consumidores en `src/`)
- [x] 8.6 Correr `npm run ci` y verificar que termina en verde
