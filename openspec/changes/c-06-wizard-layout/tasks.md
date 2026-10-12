# Tasks

## 1. Modelo del resumen (`src/utils/summary.js`)

- [x] 1.1 Crear `buildSummary(state, services, extras)` que resuelva el servicio y los extras seleccionados y componga `computeTotal` (C-04) con `getService`/`getSelectedExtras` (C-05).
- [x] 1.2 Producir el desglose: línea del servicio (nombre, cantidad, importe), líneas de extras (nombre, importe) y el importe mensual separado.
- [x] 1.3 Resolver las etiquetas de precio: `null` → "A cotizar", `0` → "Sin costo", `recurring` → "<importe>/mes"; y exponer `totalLabel`, `recurringLabel` y `hasQuotable`.
- [x] 1.4 Documentar el modelo con JSDoc.

## 2. Componentes del configurador

- [x] 2.1 Crear `src/components/configurador/WizardSteps.jsx`: los 4 pasos con estados (completado / actual / pendiente) y `aria-current="step"` en el actual.
- [x] 2.2 Crear `src/components/configurador/SummarySidebar.jsx`: header "Tu presupuesto", desglose (servicio × cantidad, extras, mensual), aviso de cotizable y total con `aria-live="polite"`; estética `glass` + acentos neón.
- [x] 2.3 Manejar el estado vacío del resumen (sin servicio) sin romper.

## 3. Página `/configurador` (`src/pages/Configurador.jsx`)

- [x] 3.1 Reemplazar el placeholder por el layout: header propio (logo + volver al inicio), `WizardSteps`, `main` de dos columnas (`lg:grid-cols-[...]`) con el cuerpo del paso y `SummarySidebar` sticky.
- [x] 3.2 Conectar `useConfigurador`: resolver el cuerpo del paso con un `switch (step)` y placeholders para los pasos 1-4 (los reemplazan C-07/C-08).
- [x] 3.3 Agregar la navegación Atrás/Continuar: "Atrás" solo si `step > FIRST_STEP`, "Continuar" llama a `nextStep`; deshabilitar la navegación cuando corresponda.
- [x] 3.4 Responsive: dos columnas en `lg`, apilado en mobile, con el total siempre visible.

## 4. Tests (`scripts/summary.test.mjs`)

- [x] 4.1 Cubrir el desglose: servicio × cantidad, lista de extras y total de pago único.
- [x] 4.2 Cubrir las etiquetas: "A cotizar" (servicio cotizable), "Sin costo" (extra de precio 0) y "<importe>/mes" (extra recurrente).
- [x] 4.3 Cubrir `hasQuotable` y que el ítem cotizable no se sume al total.
- [x] 4.4 Cubrir la integración con el estado: alternar un extra (C-05) cambia el total del resumen (C-04).
- [x] 4.5 Cubrir el caso sin extras (total = solo el servicio).

## 5. Verificación

- [x] 5.1 `npm run test` verde y comprobar que un test puede fallar (rojo).
- [x] 5.2 `npm run ci` verde (lint + verify:catalog + test + build) y revisar el chunk `Configurador-*.js`.
