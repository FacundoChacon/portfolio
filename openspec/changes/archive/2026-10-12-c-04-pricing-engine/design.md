# Design

## Context

C-03 entregó el catálogo (`services`, `extras`, `CURRENCY`, `CATEGORIES`, `HOSTING_DISCLAIMER`) en `src/data/configurador.js`. C-04 consume ese contrato y produce el desglose numérico del presupuesto.

Restricciones del proyecto: **JavaScript puro** (sin TypeScript), **sin backend**, precios en **ARS**. La carpeta `src/utils/` ya existe (vacía) desde C-01.

## Goals / Non-Goals

**Goals**
- Centralizar la aritmética del presupuesto en funciones puras, sin React, fáciles de testear.
- Resolver los casos borde una sola vez: cotizable (`null`), sin costo (`0`) y recurrencia mensual.
- No agregar dependencias (tests con el runner nativo de Node).

**Non-Goals**
- Estado del wizard y acciones → C-05 (`wizard-state`).
- Render del resumen lateral y de las tarjetas → C-06/C-07.
- Construcción del payload del webhook → C-10.
- Generación del PDF → C-09.

## Decisions

### D1 — Funciones puras en un módulo sin React
`src/utils/pricing.js` no importa React ni el DOM: recibe datos y devuelve datos. Eso lo hace testeable en Node y reutilizable por la UI, el payload y el PDF.

### D2 — `computeTotal` devuelve un desglose, no un número
Devuelve un objeto para que cada consumidor tome lo que necesita sin recalcular:
```
{
  currency,             // 'ARS'
  serviceTotal,         // service.priceARS × quantity (0 si es cotizable o no hay servicio)
  extrasOneTimeTotal,   // suma de extras no recurrentes
  subtotal,             // serviceTotal + extrasOneTimeTotal
  total,                // total de pago único (ver D3)
  recurringMonthly,     // suma de extras recurrentes (importe "/mes")
  hasQuotable           // true si algún ítem es cotizable
}
```

### D3 — `subtotal` y `total` coinciden en v1
No hay descuentos, impuestos ni recargos, así que `total === subtotal`. Se mantienen ambos campos porque el contrato del `LeadPayload` de la KB (`04_modelo_de_datos.md`) los distingue y porque el `total` es el punto donde a futuro entrarían ajustes. Se documenta para que no sorprenda.

### D4 — `null` suma 0 y marca; `0` no altera
Un servicio con `priceARS: null` aporta 0 al `serviceTotal` y hace `hasQuotable: true`. Un extra con `priceARS: 0` suma 0 (el total no cambia). Ninguno de los dos se trata como error.

### D5 — `splitRecurring(extras)` particiona por `recurring`
Devuelve `{ oneTime: Extra[], recurring: Extra[] }`, clasificando por `recurring === true`. Es la primitiva que usa `computeTotal` y que la UI reutiliza para listar los dos bloques del resumen (RN-PR-05).

### D6 — `hasQuotable(service, extras = [])`
Devuelve `true` si `service?.quotable === true` o si algún extra tiene `quotable === true`. Hoy solo el servicio puede ser cotizable (el catálogo no define extras cotizables), pero la firma con `extras` deja el cálculo listo si eso cambia; no inventa una regla de negocio nueva.

### D7 — `formatARS(value)`
Usa `new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` (RN-PR-01). Si `value` no es un número finito (por ejemplo `null`, cuando el ítem es "a cotizar"), devuelve **cadena vacía** en lugar de lanzar: la UI decide mostrar "A cotizar". Así el formateador nunca rompe un render.

### D8 — La cantidad se normaliza de forma defensiva
`computeTotal` usa `quantity` tal cual si es un entero ≥ 1; si es ausente, no finita o < 1, la trata como `1`. El clamp "real" del botón "−" es responsabilidad de C-05; acá solo se evita un total sin sentido.

### D9 — Tests con el runner nativo de Node
`scripts/pricing.test.mjs` usa `node:test` + `node:assert/strict` (sin dependencias). `package.json` gana `"test": "node --test \"scripts/**/*.test.mjs\""` y `ci` pasa a `lint && verify:catalog && test && build`. Se usa el glob explícito (Node lo expande) porque en este Windows `node --test <directorio>` no resuelve el directorio como entrada.

## Risks / Trade-offs

- **Formato dependiente de ICU**: la salida de `Intl` para `es-AR`/`ARS` es "$ 720.000,00" en el Node del proyecto; en runtimes con ICU reducido el símbolo podría variar. Los tests fijan la salida esperada de este entorno.
- **`subtotal === total`**: puede leerse como redundancia; se documenta (D3) y se cubre con un test explícito.
- **Normalización silenciosa de la cantidad** (D8): oculta un bug de la UI en vez de exponerlo. Se acepta porque C-05 garantiza `quantity ≥ 1` y el clamp es su responsabilidad.

## Migration Plan

No aplica: módulo nuevo, sin datos persistidos ni consumidores previos.

## Open Questions

- ¿Precios ARS definitivos? (P-01, bloquea el deploy; no afecta el cálculo).
