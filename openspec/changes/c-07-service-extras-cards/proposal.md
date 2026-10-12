# Proposal

## Why

El layout del configurador (C-06) muestra el andamiaje y el resumen en vivo, pero los pasos 1 y 2 son placeholders: el visitante todavía no puede elegir su tipo de sitio, marcar extras ni ajustar la cantidad. Sin eso el wizard no tiene nada que configurar.

## What Changes

- Nuevo `src/components/configurador/ServiceCards.jsx` (paso 1): las 7 cards de tipo de sitio con nombre, descripción, precio en ARS o "A cotizar", icono y estado de selección (exactamente una).
- Nuevo `src/components/configurador/ExtrasCards.jsx` (paso 2): los 8 extras como toggles, con el sufijo `/mes` en "Mantenimiento mensual" y el disclaimer visible en "Hosting + Dominio".
- Nuevo `src/components/configurador/QuantityControl.jsx`: control `+` / `−` con mínimo 1.
- Nuevo `src/components/configurador/serviceIcons.js`: resuelve el nombre de icono del catálogo (`service.icon`) al componente de `lucide-react`, con fallback para nombres desconocidos.
- Nuevo `src/utils/priceLabels.js`: se extraen las etiquetas de precio (`A cotizar`, `Sin costo`, `<importe>/mes`) que hoy viven privadas dentro de `summary.js`, para reutilizarlas sin duplicar.
- `src/pages/Configurador.jsx` monta `ServiceCards`/`QuantityControl` en el paso 1 y `ExtrasCards` en el paso 2, conectados a `useConfigurador`.
- Tests unitarios (Node) de las etiquetas de precio y de la resolución de iconos contra el catálogo real. La selección única, el toggle y el mínimo de cantidad ya están cubiertos por `scripts/wizard.test.mjs` (C-05).

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `interfaz-del-configurador`: se agregan los requisitos de presentación de las cards de servicio y extras, el control de cantidad, el disclaimer de hosting y la operación por teclado.

## Impact

- **Código**: nuevos `src/components/configurador/{ServiceCards,ExtrasCards,QuantityControl}.jsx` y `src/components/configurador/serviceIcons.js`; nuevo `src/utils/priceLabels.js`; `src/utils/summary.js` pasa a importar las etiquetas (sin cambio de comportamiento); `src/pages/Configurador.jsx` monta los pasos 1 y 2.
- **Tests**: nuevos `scripts/price-labels.test.mjs` y `scripts/service-icons.test.mjs`; el script `test` ya los levanta.
- **Dependencias**: ninguna nueva (`lucide-react` ya está instalado).
- **Riesgo mitigado**: C-03 advirtió que el build no valida los nombres de icono; ahora un test verifica que los 7 iconos del catálogo resuelven.
- **Consumidores futuros**: C-08 (pasos 3-4), C-11 (pulido visual).
