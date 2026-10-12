# Proposal

## Why

Los pasos 3 y 4 del wizard siguen siendo placeholders: el visitante llega al final y no puede dejar sus datos ni confirmar lo que configuró. Sin formulario no hay lead; sin paso de revisión no hay confirmación antes de enviar (US-006, US-007).

## What Changes

- Nuevo `src/components/configurador/FormStep.jsx` (paso 3): nombre y email obligatorios, teléfono y descripción del proyecto opcionales, con validación inline accesible (`aria-invalid` / `aria-describedby`) y campo **honeypot** oculto (base para C-11).
- Nuevo `src/components/configurador/ReviewStep.jsx` (paso 4): bloques de servicio, extras y datos de contacto, con un botón **"Editar"** por bloque que vuelve al paso correspondiente; nota de **estimación no vinculante** y botón de inicio de envío.
- Nuevo `src/components/configurador/BudgetTotals.jsx`: extrae de `SummarySidebar` el bloque de total + importe mensual + aviso de ítem cotizable, para que el paso de revisión y el panel lateral compartan una única fuente.
- Nuevo `src/utils/review.js`: `buildReview(state, services, extras)` — modelo puro del paso de revisión (bloques, paso de edición de cada uno, líneas) reutilizando `buildSummary` y las etiquetas de precio.
- `src/utils/wizard.js`: nueva acción `goToStep(state, target)` (salto a un paso arbitrario, con tope) y constante `HONEYPOT_FIELD`.
- `src/pages/Configurador.jsx`: monta los pasos 3 y 4 y deja de usar el `StepPlaceholder`.
- Tests unitarios de `buildReview` y `goToStep`. El bloqueo de avance sin nombre/email ya está cubierto por `scripts/wizard.test.mjs` (C-05).

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `interfaz-del-configurador`: se agregan los requisitos del formulario de contacto, la validación inline accesible, el campo trampa, la revisión del presupuesto, la edición por bloque y el inicio del envío.

## Impact

- **Código**: nuevos `src/components/configurador/{FormStep,ReviewStep,BudgetTotals}.jsx` y `src/utils/review.js`; `src/utils/wizard.js` suma `goToStep` y `HONEYPOT_FIELD`; `src/components/configurador/SummarySidebar.jsx` pasa a usar `BudgetTotals` (sin cambio de datos); `src/pages/Configurador.jsx` monta los pasos 3-4.
- **Tests**: nuevo `scripts/review.test.mjs`; `scripts/wizard.test.mjs` suma los casos de `goToStep`. Sin dependencias nuevas.
- **Alcance deliberado**: el POST al webhook y los estados de éxito/error son de **C-10**; el bloqueo de doble submit y el honeypot activo, de **C-11**. Acá el botón de envío solo inicia el envío (`submit`, C-05).
- **Consumidores futuros**: C-10 (transporte y pantallas de éxito/error), C-11 (antiabuso y pulido).
