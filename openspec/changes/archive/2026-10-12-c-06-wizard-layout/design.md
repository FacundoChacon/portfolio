# Design

## Context

- **Insumos**: catálogo de C-03 (`src/data/configurador.js`), cálculo de C-04 (`src/utils/pricing.js`) y estado de C-05 (`src/utils/wizard.js` + `src/hooks/useConfigurador.js`).
- **Estética**: base cyber/neón del portfolio (DD-07): fondo `#030303`, verde `#00ffc3`, magenta `#ff6eff`; clases ya existentes `.glass`, `.gradient-text`, `.box-glow-cyan`, `.text-glow-cyan`, `.tag`.
- **Estructura objetivo**: `knowledge-base/08_arquitectura_propuesta.md` §Estructura (componentes en `components/configurador/`) y §Patrones ("presentational vs container").
- **Restricciones**: JavaScript puro (sin TS); el proyecto **no** tiene testing-library ni jsdom, y `node --test` **no** transforma JSX, así que no se pueden testear componentes React.

## Goals / Non-Goals

**Goals**: el andamiaje visual del configurador — layout responsivo de dos columnas, header propio, indicador de 4 pasos, resumen en vivo con desglose y total, y navegación Atrás/Continuar conectada al hook; con la lógica del resumen testeable.

**Non-Goals**: el contenido de los pasos 1-2 (`ServiceCards`, `ExtrasCards`, `QuantityControl`: C-07); los pasos 3-4 y los estados de éxito/error (`FormStep`, `ReviewStep`, `SuccessStep`, `ErrorStep`: C-08/C-10); el envío, el PDF y el webhook (C-09/C-10); el pulido fino (C-11).

## Decisions

- **D1 — Derivación pura del resumen.** El "modelo de presentación" del resumen vive en `src/utils/summary.js` (`buildSummary(state, services, extras)`), no dentro del componente. Compone `getService`/`getSelectedExtras` (C-05) con `computeTotal`/`formatARS` (C-04) y produce las etiquetas listas para pintar. Así el requisito "el total cambia al alternar un extra" se testea con `node:test` sin DOM; `SummarySidebar` queda presentacional.
- **D2 — Sin dependencias de testing nuevas.** No se agregan testing-library ni jsdom (el proyecto las evitó deliberadamente en C-04/C-05). La lógica testeable es `summary.js`; los componentes `.jsx` se validan con `npm run build` y revisión visual.
- **D3 — Etiquetas de precio en el modelo.** `buildSummary` resuelve los casos especiales una sola vez: `priceARS: null` → `"A cotizar"`, `priceARS: 0` → `"Sin costo"`, `recurring: true` → `"<importe>/mes"`. La UI solo pinta `amountLabel`.
- **D4 — `hasQuotable` sin sumar.** El aviso de cotizable se expone como `hasQuotable`; el total sale de `computeTotal`, que ya excluye los ítems cotizables (C-04). No se recalcula en la UI.
- **D5 — Navegación en la página.** Los botones Atrás/Continuar viven en `Configurador.jsx` y llaman a `prevStep`/`nextStep` del hook; "Atrás" solo se renderiza cuando `step > FIRST_STEP` (US-002 CA-1/CA-3). La validación del avance es la del hook (C-05), no se duplica.
- **D6 — Cuerpo de paso como placeholder.** `Configurador.jsx` resuelve el contenido con un `switch (step)` que hoy devuelve paneles placeholder; C-07/C-08 los reemplazan por los componentes reales. Evita bloquear el andamiaje y mantiene el change acotado.
- **D7 — Total siempre visible (DD-07).** El panel de resumen es `sticky` en pantallas grandes y queda apilado debajo en chicas; el total nunca se va de vista.
- **D8 — Accesibilidad.** El indicador marca el paso actual con `aria-current="step"`; el total del resumen usa `aria-live="polite"` para anunciar cambios.

## Risks / Trade-offs

- **Sin test de componentes**: la interactividad visual (sticky, responsive, foco) no se verifica automáticamente; se mitiga con `npm run build` + revisión manual. Documentado (D2).
- **Placeholders temporales**: el cuerpo de pasos queda vacío hasta C-07/C-08; es intencional para mantener C-06 chico.
- **`$ 0,00` con servicio cotizable**: si se elige "Sistema a medida" sin extras, el total de pago único es 0 y se acompaña del aviso de cotizable (RN-CO-03). Es el comportamiento buscado.

## Migration Plan

No aplica: se reemplaza un placeholder sin consumidores previos.

## Open Questions

Ninguna para implementar. Los bloqueantes P-01 (precios) y P-02 (webhook) siguen fuera de este change.
