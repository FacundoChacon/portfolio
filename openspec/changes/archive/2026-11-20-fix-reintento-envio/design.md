# Design

## Context

Ver `proposal.md` — Why. Estado actual relevante (HEAD 12fd2be):

- `src/utils/wizard.js` es el núcleo puro del wizard (sin React ni DOM) y `src/hooks/useConfigurador.js` es un hook delgado que lo envuelve con `useState`. Las reglas se testean con `node --test` en `scripts/wizard.test.mjs`; el proyecto **no** tiene Vitest, Testing Library ni jsdom, por lo que el hook no es testeable de forma automatizada sin agregar dependencias.
- `submit(state)` con datos válidos devuelve `submitted: true, submitting: true, status: 'submitting'`. `setStatus(state, status)` solo cambia `status`.
- `submitReal` (hook) decide el envío dentro del updater de `setState` (variable `pending`), arma el payload con el `state` del render y, en el `catch`, deja `submitted: true` → el guard `current.submitted || current.submitting` bloquea el reintento.
- `ReviewStep` deshabilita el botón con `submitting || submitted`. `Configurador.jsx` muestra `ErrorStep` cuando `status === 'error'` (oculta la navegación) y le pasa `onRetry={wizard.submit}`.

## Goals / Non-Goals

**Goals:**
- Que todo el ciclo de vida del envío (iniciar, bloquear duplicados, resolver éxito/error, volver a revisar) sea lógica pura cubierta por tests en `scripts/wizard.test.mjs`.
- Que la decisión de enviar no dependa de cuándo React ejecuta un updater.
- Cambio mínimo y coherente con la API existente (`submit`, `setStatus`, `goToStep`).

**Non-Goals:**
- Tests automatizados del hook o de componentes (requerirían jsdom/RTL; se descarta agregar dependencias). El hook se verifica con build + verificación manual.
- Timeout/abort de la petición, honeypot, rate limit, a11y del paso de error (C-11/C-12).
- Cambiar `sendLead`/`buildLeadPayload` (`src/utils/webhook.js`).

## Decisions

### D1 — `submit` no marca enviado al iniciar e incorpora el guard RN-AB-02

```js
submit(state) → WizardState
```
- Si `state.submitting || state.submitted` → devuelve **el mismo objeto** `state` (no-op; identidad preservada).
- Datos inválidos → igual que hoy: `{ errors, submitted: false, submitting: false, status: 'idle' }`.
- Datos válidos → `{ errors: {}, submitted: false, submitting: true, status: 'submitting' }`.

`submitted` pasa a significar "enviado con éxito", que es lo que ya asumen el guard y el escenario "Prevención de doble submit" de `webhook-integration`.

*Alternativa descartada*: mantener `submit` y agregar `markSubmitFailed(state)` que restaure `submitted: false`. Funciona, pero conserva un estado intermedio incoherente (`submitted: true` sin éxito) y obliga a recordar "deshacer" en cada camino de error. Mover el guard al núcleo además lo vuelve testeable (hoy vive solo en el hook).

### D2 — Nueva `resolveSubmit(state, outcome)` en lugar de reusar `setStatus`

```js
resolveSubmit(state, 'success' | 'error') → WizardState
```
- `'success'` → `{ submitted: true, submitting: false, status: 'success' }`.
- `'error'` → `{ submitted: false, submitting: false, status: 'error' }` (datos intactos).
- Cualquier otro valor → devuelve `state` sin cambios (mismo criterio que `setStatus` con valores desconocidos).
- Acepta `STATUS.SUCCESS`/`STATUS.ERROR` (mismos literales), así que el hook la llama con las constantes existentes.

*Alternativa descartada*: extender `setStatus` para que ajuste `submitted`/`submitting`. `setStatus` es un setter genérico expuesto por el hook (`wizard.setStatus`) y cambiar su semántica tiene más radio de impacto; una función con nombre de dominio deja explícito el cierre del ciclo. `setStatus` queda sin cambios.

### D3 — "Volver a revisar" entra en scope, de forma mínima: `clearSubmitError(state)`

```js
clearSubmitError(state) → WizardState
```
- Si `state.status === 'error'` → `{ ...state, status: 'idle', step: STEPS.REVIEW }` (forzar `REVIEW` es defensivo: el envío solo se inicia desde ahí).
- En cualquier otro estado → devuelve `state` sin cambios.

Como tras D2 el error ya deja `submitted: false`, al volver a `idle` `Configurador.jsx` muestra de nuevo `ReviewStep` con el botón habilitado y sus botones "Editar" (que usan `goToStep`). No hace falta tocar `ReviewStep` ni la navegación.

**Por qué entra**: hoy, tras un error, el visitante queda atrapado en `ErrorStep` (solo reintentar o canales externos); si quiere corregir un dato no tiene salida sin recargar y perder todo. El costo es una función pura de 3 líneas + un botón y una prop opcional. **Lo que queda fuera**: foco/anuncio accesible al cambiar de pantalla y rediseño de `ErrorStep` (C-11).

UI: `ErrorStep` recibe `onEdit` opcional; si está presente renderiza un botón secundario "Revisar mis datos" con el mismo estilo que los enlaces secundarios existentes. `Configurador.jsx` pasa `onEdit={wizard.clearSubmitError}`.

### D4 — El hook decide el envío fuera del updater

Estructura de `submitReal`:

1. `inFlightRef` (`useRef(false)`): bloqueo síncrono. Si está en `true`, retorna. Cubre la doble activación rápida antes de que React vuelva a renderizar (el estado no se actualiza síncronamente).
2. `stateRef` (`useRef(state)`), sincronizado con el estado confirmado (`useEffect(() => { stateRef.current = state }, [state])`): fuente del estado vigente, independiente del closure del render en que se creó el handler.
3. `const current = stateRef.current; const next = submit(current)` — cálculo puro, fuera de `setState`.
4. Si `next === current` (guard del núcleo) → retorna. Si `next.status !== STATUS.SUBMITTING` (datos inválidos) → `setState(next)` y retorna.
5. `inFlightRef.current = true; stateRef.current = next; setState(next)`.
6. `buildLeadPayload(next, services, extras)` → `await sendLead(...)`.
7. Éxito → `setState((c) => resolveSubmit(c, STATUS.SUCCESS))`; error → `console.error` + `setState((c) => resolveSubmit(c, STATUS.ERROR))`; `finally` → `inFlightRef.current = false`.

El hook expone además `clearSubmitError: () => setState((c) => clearSubmitError(c))`. `setState(next)` con valor (no updater) es seguro aquí: entre el evento y esta llamada no hay otras actualizaciones encoladas, y `next` deriva del estado vigente.

*Alternativas descartadas*: (a) seguir con la variable dentro del updater — es justamente el bug A2; (b) usar solo el `state` del closure — funciona en el caso común pero no cubre la doble activación previa al re-render ni handlers con closures viejos; (c) `useReducer` + efecto que dispare el envío al entrar en `submitting` — más cambio estructural y el efecto corre dos veces en StrictMode (doble POST en desarrollo).

### D5 — Tests solo sobre el núcleo puro

Todos los escenarios de `estado-del-configurador` se cubren en `scripts/wizard.test.mjs`. El test existente "submit: con datos válidos marca enviado y pasa a submitting" se **reescribe** (ahora `submitted === false`, `submitting === true`). El test de inmutabilidad suma `resolveSubmit` y `clearSubmitError`. Los escenarios de UI de `webhook-integration` (doble activación, reintento, volver a revisar) se verifican manualmente con `npm run dev` y un `VITE_WEBHOOK_URL` inválido/ausente.

### D6 — Navegación y edición bloqueadas mientras `submitting` (revisión independiente)

Hallazgo: con el POST en vuelo seguían activos "Atrás" y los botones "Editar", así que el visitante podía moverse o editar y, al resolverse el envío, quedar en otro paso con datos distintos a los enviados.

- Núcleo puro: `nextStep`, `prevStep`, `goToStep`, `setForm`, `setService`, `toggleExtra` y `setQuantity` devuelven **el mismo objeto** (no-op) si `state.submitting === true`. Un helper interno `guardSubmitting(state, apply)` concentra la condición. `submit`, `resolveSubmit`, `clearSubmitError` y `setStatus` NO se ven afectados (necesarios para cerrar el ciclo).
- UI (refuerzo visual mínimo): "Atrás" y los botones "Editar" de `ReviewStep` se deshabilitan (`disabled` + `disabled:cursor-not-allowed disabled:opacity-50`) cuando `submitting`. La garantía real vive en el núcleo; el `disabled` solo comunica el bloqueo.
- Hook: `stateRef` se sincroniza con `useLayoutEffect` en lugar de `useEffect` (cierra la ventana teórica de estado viejo entre commit y efecto pasivo) y se quita `setStatus` del objeto que devuelve el hook (sin consumidores en `src/`; la función pura y su test se conservan).

*Alternativa descartada*: bloquear solo en la UI. Los handlers del hook seguirían aceptando cambios por cualquier otra vía y la regla no sería testeable.

## Risks / Trade-offs

- [El hook queda sin test automatizado] → Toda decisión de negocio vive en funciones puras testeadas; el hook solo orquesta. Verificación manual documentada en tasks.
- [Cambio de contrato de `submit` (`submitted` al iniciar)] → Único consumidor: `useConfigurador`. `ReviewStep` usa `submitting || submitted`, que sigue deshabilitando durante el envío gracias a `submitting`.
- [`stateRef` sincronizado por efecto va un commit detrás del estado] → Los clics son eventos discretos y React vacía los efectos pasivos pendientes antes de procesarlos; además `inFlightRef` cubre la ventana de doble clic.
- [Petición colgada deja `inFlightRef` en `true` indefinidamente] → Sin timeout hoy (igual que antes); el timeout con `AbortController` es alcance de C-11.

## Migration Plan

Sin migración de datos ni configuración. Rollback: revertir el commit del change.
