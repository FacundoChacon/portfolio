# Proposal

## Why

El estado del wizard (C-05) y el cálculo (C-04) existen, pero `/configurador` sigue siendo un placeholder "Próximamente": no hay layout, ni indicador de pasos, ni resumen en vivo. Sin ese andamiaje visual, los pasos concretos (C-07/C-08) no tienen dónde montarse ni cómo mostrar el total.

## What Changes

- Reemplaza el placeholder de `src/pages/Configurador.jsx` por el layout real: header propio, dos columnas (contenido + resumen) y navegación Atrás/Continuar conectada a `useConfigurador`.
- Nuevo `src/components/configurador/WizardSteps.jsx`: indicador de los 4 pasos con estados (completado / actual / pendiente) y `aria-current`.
- Nuevo `src/components/configurador/SummarySidebar.jsx`: "carrito" con el desglose en vivo (servicio × cantidad, extras, importe mensual) y el total en ARS.
- Nuevo `src/utils/summary.js` (puro): arma el modelo de presentación del resumen combinando el catálogo (C-03), el estado (C-05) y el cálculo (C-04), incluyendo las etiquetas de precio ("A cotizar", "Sin costo", "/mes") y el aviso de ítem cotizable.
- Tests unitarios de `summary.js` con `node:test`, incluyendo la integración "el total cambia al alternar un extra".
- El cuerpo de cada paso queda como placeholder hasta C-07 (pasos 1-2) y C-08 (pasos 3-4).

## Capabilities

### New Capabilities
- `interfaz-del-configurador`: la presentación del wizard — layout, indicador de progreso, resumen en vivo y navegación entre pasos.

### Modified Capabilities
<!-- Ninguna: no cambian requisitos de capacidades existentes. C-05 sigue siendo dueño de las reglas de estado. -->

## Impact

- **Código**: `src/pages/Configurador.jsx` (reemplazo), nuevos `src/components/configurador/{WizardSteps,SummarySidebar}.jsx` y `src/utils/summary.js`.
- **Tests**: nuevo `scripts/summary.test.mjs`; el script `test` (C-04) ya lo levanta.
- **Dependencias**: ninguna nueva. El proyecto **no** incorpora testing-library ni jsdom: la lógica del resumen se testea como función pura.
- **Consumidores futuros**: C-07 (pasos 1-2), C-08 (pasos 3-4), C-11 (pulido visual).
- **Bundle**: `/configurador` sigue en su chunk lazy; el resumen entra ahí, no en la home.
