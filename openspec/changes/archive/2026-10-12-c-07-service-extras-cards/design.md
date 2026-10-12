# Design

## Context

- **Insumos**: catálogo de C-03 (`src/data/configurador.js`), estado de C-05 (`useConfigurador`), layout de C-06 (`Configurador.jsx`, `SummarySidebar`, `WizardSteps`).
- **Reglas**: RN-CO-01 (Sistema a medida → "A cotizar"), RN-HD-03 (disclaimer visible en la card), RN-PR-05 (`/mes` en recurrentes), RN-QT-01/02/03 (cantidad entera ≥ 1, solo al servicio), RN-EX-04 (responsive y operable por teclado).
- **CA**: US-003 (elegir tipo de sitio), US-004 (extras + total en vivo), US-005 (cantidad).
- **Restricciones**: JavaScript puro (sin TS); sin testing-library ni jsdom, y `node --test` no transforma JSX → los componentes no se testean; la lógica testeable se aísla en módulos puros.
- **Riesgo heredado de C-03**: los iconos son **strings** (`service.icon`) y el build no valida que existan en `lucide-react`.

## Goals / Non-Goals

**Goals**: los pasos 1 y 2 operativos — 7 cards de tipo de sitio, 8 toggles de extras (con disclaimer y `/mes`) y el control de cantidad, conectados al estado y reflejados en el resumen en vivo.

**Non-Goals**: los pasos 3-4 (`FormStep`, `ReviewStep`: C-08); el envío, el PDF y el webhook (C-09/C-10); el pulido visual fino y las animaciones (C-11).

## Decisions

- **D1 — Extraer las etiquetas de precio.** `servicePriceLabel` y `extraPriceLabel` dejan de ser privadas de `summary.js` y pasan a `src/utils/priceLabels.js`, que consumen tanto `summary.js` como las cards. Evita duplicar las reglas "A cotizar" / "Sin costo" / `/mes` y las hace testeables en aislamiento. `summary.js` no cambia de comportamiento.
- **D2 — Iconos con mapa explícito.** `src/components/configurador/serviceIcons.js` mapea los nombres del catálogo a los componentes de `lucide-react` **importados explícitamente** (nada de `import * as icons`, que arrastraría toda la librería al bundle) y expone `resolveServiceIcon(name)` con un icono de reemplazo (`Sparkles`) para nombres desconocidos.
- **D3 — El test cierra el riesgo de C-03.** `scripts/service-icons.test.mjs` recorre los 7 servicios del catálogo real y verifica que cada `icon` resuelve; además cubre el fallback. Es verificable en Node porque `lucide-react` importa y exporta objetos sin DOM.
- **D4 — Los componentes son presentacionales.** Reciben datos y callbacks (`services`, `selectedId`, `onSelect`; `extras`, `selectedIds`, `onToggle`; `quantity`, `onChange`) y no conocen el hook ni el pricing. La página es el único punto que los conecta.
- **D5 — Selección única garantizada por el núcleo.** Las cards solo emiten el `id` elegido; la unicidad la garantiza `setService` (C-05). No se duplica la regla en la UI.
- **D6 — Cantidad: clamp en el núcleo, `disabled` en la UI.** El botón `−` se deshabilita con `quantity === 1` (feedback inmediato), pero el mínimo real lo impone `setQuantity` (C-05); la UI no reimplementa el clamp.
- **D7 — Accesibilidad.** Las cards y los extras son `<button>` con `aria-pressed`, por lo que ya son operables con Enter/Espacio y reciben el `:focus-visible` global del proyecto. El control de cantidad usa botones con `aria-label` ("Restar"/"Sumar") y anuncia el valor.
- **D8 — Sin tests de componentes.** Igual que C-06 (D2): la verificación automática cubre las etiquetas de precio y la resolución de iconos; el resto se valida con `npm run build` y revisión visual. La selección única, el toggle y el mínimo de cantidad **ya** están cubiertos por `scripts/wizard.test.mjs`, así que no se duplican.

## Risks / Trade-offs

- **Sin tests de componentes** (D8): la interacción real (click, teclado, responsive) no se verifica automáticamente. Se mitiga con `build` + revisión manual.
- **Iconos por nombre en el catálogo**: si se agrega un servicio con un icono fuera del mapa, cae al reemplazo `Sparkles`. El test avisa solo si se actualiza el mapa; es una limitación aceptada (el fallback evita el crash).
- **`priceLabels.js` toca un archivo entregado en C-06**: el refactor es de comportamiento nulo y los tests de `summary` deben seguir verdes.

## Migration Plan

No aplica: se completan pasos que eran placeholders.

## Open Questions

Ninguna para implementar. P-01 (precios definitivos) sigue siendo un bloqueante de deploy, no de este change.
