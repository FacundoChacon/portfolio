# Design

## Context

Ver `proposal.md` (Why). Estado actual relevante:

- `src/pages/Configurador.jsx`: la cabecera (`<header>`: `NavBrand`, `eva-nav-glass`, `eva-stripes`, salto al contenido) ya es eva y la vigila `scripts/site-nav-classes.test.mjs` (solo el fragmento `<header>…</header>`). El cuerpo usa `bg-dark`, `gradient-text`, `font-display` (Orbitron), `glass` en el bloque de cantidad y dos constantes de clases (`primaryButton` con `box-glow-cyan`/`accent-green`, `secondaryButton` con `dark-border`/`text-gray-400`).
- `src/components/configurador/` (9 `.jsx` + `serviceIcons.js`): `ServiceCards`/`ExtrasCards` (botones `aria-pressed`, `rounded-xl`, seleccionado = borde y fondo `accent-green` + `box-glow-cyan` en servicios: **solo color**), `FormStep` (campos `rounded-md bg-dark-card/60`, error `accent-pink`, asterisco `accent-pink`, honeypot `sr-only`), `QuantityControl` (`disabled:opacity-30`), `ReviewStep` (bloques `glass`, `disabled:opacity-50`), `SummarySidebar` (`glass`), `WizardSteps` (`rounded-full`, `box-glow-cyan`), `SuccessStep`/`ErrorStep` (`glass`, botones con `accent-green`). `ServiceCards` usa la clase global `.tag` (definida con `accent-green` en `src/index.css`).
- Conteo de estilos viejos en el configurador: `accent-green` 52, `text-gray-400` 26, `dark-border` 17, `rounded-md` 13, `text-white` 10, `text-dark` 9, `font-display` 9, `accent-pink` 7, `glass` 6, `box-glow-cyan` 6, `bg-dark` 5, `text-gray-300` 3, otros `rounded*` 5, `gradient-text` 1.
- Base eva disponible: `EVA_COLORS`/`EVA_CONTRAST_PAIRS` (`src/styles/eva-tokens.js`), clases Tailwind `eva-*`, `--eva-*`, `font-eva-display`, `.font-stretch-condensed`, `.eva-panel`, `.eva-panel-label`, `.eva-panel-code`, `.eva-tag`, `.eva-stripes`/`.eva-stripes-red`, `.eva-hex-grid` (`--eva-hex-color` por defecto `rgb(255 122 26 / 0.12)`), foco global `:focus-visible` (2px `--eva-focus` verde, `outline-offset: 2px`). `scripts/lib/contrast.mjs`: `contrastRatio`, `checkContrastPairs`, `blendOver`.
- Patrones de los changes vecinos que se reutilizan: botones/bloques de `hero-brutalista` (D8) y `contacto-brutalista` (D3): `border-2`, sombra sólida sin desenfoque `shadow-[Npx_Npx_0_0_var(--eva-…)]`, traslación solo con `motion-safe:`, sin clases de foco propias. Helper `scripts/lib/class-guard.mjs` (`findForbiddenTokens(source, rules)` → `[{ rule, match }]`, contrato de `hero-brutalista` D10). `.eva-glass` (`acerca-testimonios-glass`) y `scripts/lib/css-rules.mjs` **no** se usan acá (ver D1 y D8).
- Lógica que no se toca: `useConfigurador`, `src/utils/{wizard,wizardView,review,summary,webhook,contact,pdfDocument,pdfGenerator}.js`, `src/data/configurador.js`.

Gobernanza: MEDIUM (flujo de conversión). El cambio es de presentación; las decisiones con impacto perceptible para el visitante (D3 estados, D4 error, D7 PDF) quedan expuestas abajo.

## Goals / Non-Goals

**Goals:**
- Cero estilos de la paleta vieja en `src/components/configurador/**` y en `src/pages/Configurador.jsx`, para que `limpieza-cyberpunk` pueda borrar `accent-*`, `neon-*`, `dark-*`, `muted-*`, `.glass`, `.tag`, `.gradient-text`, `*-glow-*` y Orbitron sin tocar el configurador.
- Paridad funcional y de textos: mismos pasos, mismos textos visibles, mismos atributos ARIA, mismo honeypot, misma navegación de foco.
- Estados visibles por forma (1.4.1), contraste AA verificado por test (1.4.3, 1.4.11), foco visible (2.4.7) sin anularlo.

**Non-Goals:**
- Cambiar lógica, validación, textos, el webhook, las reglas anti-abuso o el honeypot.
- Restilar el PDF (D7).
- Borrar clases/tokens globales o editar `src/index.css` (los borra `limpieza-cyberpunk`).
- Tocar la cabecera de la página (es de `navbar-brutalista-glass`).

## Decisions

### D1. Brutalismo con paneles opacos (sin cristal ni neumorfismo)

- Paneles con `.eva-panel` (fondo `eva-panel` opaco, borde naranja 40% decorativo) + `.eva-panel-label`/`.eva-panel-code` `aria-hidden`. Página `bg-eva-black`.
- **Sin `.eva-glass` ni `backdrop-filter`** en el cuerpo: el formulario tiene campos y texto chico; un fondo translúcido hace depender el contraste de lo que haya detrás y `backdrop-filter` es costoso en móviles. El configurador no tiene "textura controlada" detrás de sus paneles que justifique el cristal.
- **Sin neumorfismo**: relieves con sombras claras/oscuras dejan bordes de campos y estados por debajo de 3:1 (misma conclusión que `contacto-brutalista`).
- Grilla hexagonal **solo** en la banda de introducción (`h1` + bajada), con el `--eva-hex-color` por defecto (sin redefinirlo): ahí solo hay texto grande/medio y el test verifica el peor caso (D6). Los paneles opacos cubren la grilla en el resto.
- Alternativa descartada: `.eva-glass` en el resumen lateral (coherente con "Sobre mí") → descartada por lo anterior y para no depender de `acerca-testimonios-glass`.

### D2. Módulo puro de estilos `src/components/configurador/estilos.js`

Centraliza las cadenas de clases (literales completos, para que Tailwind las detecte) y funciones puras sin React:

```js
export const BOTON_PRIMARIO      // orange relleno, texto black, border-2, sombra sólida violeta 4px; hover/foco 6px; motion-safe:hover:-translate; disabled: bg-eva-line text-eva-gray border-eva-gray-dim shadow-none sin traslación
export const BOTON_SECUNDARIO    // bg-eva-black, border-2 border-eva-gray-dim, text-eva-paper; hover/foco border-eva-orange text-eva-orange + sombra sólida naranja 3px; mismo disabled
export const BOTON_EDITAR        // variante chica de BOTON_SECUNDARIO (px-2.5 py-1)
export const PANEL               // 'eva-panel …' (padding y espaciado del rótulo)
export function claseCampo(conError)          // input/textarea
export function claseModulo(seleccionado)     // tarjeta de tipo de sitio / extra
export function claseIndicador(seleccionado)  // cuadrado del estado (vacío / relleno con tilde)
export function clasePaso(estado)             // 'done' | 'current' | 'pending'
export function estadoPaso(indice, actual)    // 'done' | 'current' | 'pending' (extraído de WizardSteps)
export function codigoModulo(prefijo, indice) // ('TIPO', 0) → 'TIPO-01'; ('EXT', 9) → 'EXT-10'
```

- Por qué: hoy las clases viven repetidas en 6 archivos (el botón primario está copiado 4 veces); centralizarlas reduce la superficie del guard y permite tests de estado sin DOM (`node --test` no renderiza JSX).
- Vive **dentro** de `src/components/configurador/` para que el guard de carpeta (D8) lo cubra sin listas extra. `serviceIcons.js` queda igual.
- `estadoPaso` reemplaza la expresión inline de `WizardSteps` con el mismo resultado (no es lógica del wizard: solo deriva la presentación del índice).
- Alternativa descartada: clases nuevas en `src/index.css` (`.eva-cfg-*`): obliga a editar un archivo que hoy editan en paralelo otros changes y los tests tendrían que parsear CSS.

### D3. Tarjetas como módulos brutalistas (estado por forma + color)

```
button[aria-pressed] (claseModulo)
├ fila superior: span aria-hidden código TIPO-0X / EXT-0X (mono, text-eva-gray)  ·  span aria-hidden indicador (claseIndicador)
├ [servicios] ícono en recuadro border-2 + .eva-tag (si hay tag)
├ h3 nombre (font-eva-display font-stretch-condensed uppercase text-eva-paper)
├ p descripción (text-eva-gray)
└ [extra con disclaimer] p disclaimer (border-l-4 border-eva-orange bg-eva-black text-eva-paper text-xs)
```

- Reposo: `border-2 border-eva-gray-dim bg-eva-panel`; indicador vacío `border-2 border-eva-gray-dim` (sin tilde).
- Hover/foco (no seleccionado): `border-eva-orange` + sombra sólida `4px_4px_0_0` naranja; traslación `-0.5` solo con `motion-safe:`.
- **Seleccionado**: `border-eva-orange bg-eva-orange/10` + sombra sólida `6px_6px_0_0_var(--eva-orange)` + indicador relleno `bg-eva-orange text-eva-black` con `Check`. Señales de forma: tilde y sombra desplazada (spec "Selección distinguible sin depender del color").
- Foco: el anillo global verde (offset 2px) se dibuja por fuera del borde naranja y de la sombra; no se agregan clases de foco que lo anulen.
- `.eva-tag` reemplaza a la clase vieja `.tag`. Su borde `gray-dim` es decorativo (la etiqueta no es interactiva y su texto `paper` la identifica): sobre el fondo seleccionado queda en 2.95:1 y no se exige 3:1 (ver D6).
- El código `TIPO-0X`/`EXT-0X` es `aria-hidden`: el nombre accesible del botón sigue siendo su contenido de texto actual (nombre + descripción [+ disclaimer]).
- Alternativa descartada: `role="radio"`/`radiogroup` para los servicios. Más correcto semánticamente, pero cambia la interacción de teclado (flechas) y los escenarios `aria-pressed` vigentes; fuera de alcance de un change visual.

### D4. Campos, error, deshabilitado y cantidad

- Campo (`claseCampo(false)`): `w-full border-2 border-eva-gray-dim bg-eva-black px-3 py-2 text-sm text-eva-paper placeholder:text-eva-gray focus:border-eva-orange`; anillo global verde además del borde (escenario "Campo enfocado con el teclado"). Sin `rounded`.
- Error (`claseCampo(true)`): `border-eva-red focus:border-eva-red`. El mensaje (`role="alert"`, mismo `id`) pasa a `flex gap-2 font-mono text-xs text-eva-paper` precedido por `<span aria-hidden="true" class="bg-eva-red px-1 text-eva-black">ERR</span>`. El texto del mensaje no cambia y la marca es `aria-hidden` (el lector sigue leyendo solo el mensaje).
- Rojo nunca como color de texto normal (`text-eva-red` prohibido; `red` es solo texto grande en la tabla de tokens). `black` sobre `red` = 4.53 (pasa justo; el test lo vigila).
- Asterisco de obligatorio: `text-eva-orange` (hoy `accent-pink`); etiquetas `font-mono text-xs uppercase tracking-widest text-eva-gray`.
- Deshabilitado (botones y cantidad): `disabled:cursor-not-allowed disabled:border-eva-gray-dim disabled:bg-eva-line disabled:text-eva-gray disabled:shadow-none` y sin traslación. **Se prohíbe `disabled:opacity-*`**: la transparencia general vuelve el texto ilegible y el contraste incalculable.
- `QuantityControl`: `border-2 border-eva-gray-dim bg-eva-black`; botones `size-11` (44px; hoy 36px), hover/foco `text-eva-orange`; el número `font-mono text-eva-paper`. Lógica (`quantity <= 1`) igual.

### D5. Página, progreso, revisión, resumen, éxito y error

- Intro: `div.eva-hex-grid` con prefijo `aria-hidden` "SYS // PRESUPUESTO" (mono, naranja), `h1` "Armá tu presupuesto" en `font-eva-display font-stretch-condensed font-black uppercase text-eva-paper` (sin `gradient-text`), bajada `text-eva-gray`; debajo `div.eva-stripes h-1.5 aria-hidden`.
- `WizardSteps` (`clasePaso`): actual `border-2 border-eva-orange bg-eva-orange text-eva-black` + `aria-current="step"`; completado `border-2 border-eva-green text-eva-green` con `Check`; pendiente `border-2 border-eva-gray-dim text-eva-gray` con número. Número en cuadrado (sin `rounded-full`). Los tres estados difieren por forma (relleno / tilde / número).
- Título de paso `h2` (ref de foco, `tabIndex={-1}`, `outline-none` sin prefijo de foco, permitido por `a11y-classes`): `font-eva-display font-stretch-condensed uppercase text-eva-paper`. Textos de `stepTitle` sin cambios.
- Bloque de cantidad: `PANEL` con `.eva-panel-label` "CANT // UNIDADES".
- `SummarySidebar`: `PANEL` + `.eva-panel-label` "SYS // RESUMEN" + `.eva-panel-code` con el número de extras (`aria-hidden`), `h2` "Tu solicitud" mono; textos `text-eva-paper`/`text-eva-gray`; divisores `border-eva-line`. Sigue `lg:sticky`.
- `ReviewStep`: cada bloque `PANEL` + `.eva-panel-label` `REV // 0N` (`aria-hidden`); `dt` mono `text-eva-gray`, `dd` `text-eva-paper`; botón Editar `BOTON_EDITAR`; enlace de privacidad `text-eva-orange underline` (subrayado = señal no cromática). Envío `BOTON_PRIMARIO`.
- `SuccessStep`: `PANEL` + label "COM // RECIBIDO" y marca `aria-hidden` "■ TRANSMISIÓN OK" en `text-eva-green`; botón "Volver al inicio" `BOTON_PRIMARIO`.
- `ErrorStep`: `PANEL` con banda `eva-stripes eva-stripes-red h-2` `aria-hidden` arriba y label "ERR // ENVÍO"; "Reintentar" `BOTON_PRIMARIO`, el resto `BOTON_SECUNDARIO`. `mailto`/WhatsApp idénticos.
- Navegación Atrás/Continuar: `BOTON_SECUNDARIO`/`BOTON_PRIMARIO`.
- Sin animaciones en bucle; traslaciones solo con `motion-safe:`; transiciones con `motion-safe:transition-[…]`.

### D6. Contraste (test `CONFIGURADOR_CONTRAST_PAIRS` + mezclas)

| Uso | Par | Nivel | Valor |
|---|---|---|---|
| Texto en página/panel/campo | `paper`, `gray`, `orange`, `green` sobre `black`/`panel` | normal | ≥ 7.07 |
| Botón primario, paso actual, indicador | `black`/`orange` | normal | 7.81 |
| Marca ERR | `black`/`red` | normal | 4.53 |
| Deshabilitado | `gray`/`line` | normal | 5.50 |
| Bordes de tarjeta, campo, cantidad, indicador vacío | `gray-dim`/`black`, `gray-dim`/`panel` | ui | 3.53 / 3.34 |
| Borde seleccionado / foco de campo | `orange`/`panel`, `orange`/`black` | ui | 7.38 / 7.81 |
| Borde de error | `red`/`black`, `red`/`panel` | ui | 4.53 / 4.28 |
| Anillo de foco | `green`/`black`, `green`/`panel` | ui | 15.32 / 14.48 |

Mezclas calculadas con `blendOver` (el test lee el valor real, no lo copia):
- Fondo seleccionado: alpha leído de `bg-eva-orange/(\d+)` en `estilos.js` → `blendOver(orange, panel, 0.10) = #28190d`: `paper` 13.68, `gray` 6.24, `orange` 6.52 (≥ 4.5). Triangulación: con alpha 0.30 el `gray` cae a 4.25 → la función de evaluación devuelve error.
- Banda hex: alpha leído del respaldo de `--eva-hex-color` en `src/index.css` → `#231308`: `paper`, `gray` (6.59), `orange` (6.89) ≥ 4.5.
- Prohibidos como color de texto: `text-eva-red`, `text-eva-purple`, `text-eva-gray-dim`.

### D7. El PDF queda como está

`src/utils/pdfDocument.js` (`@react-pdf/renderer`) define su propio `StyleSheet`: fondo blanco, Helvetica, texto oscuro, una regla `#00ffc3`. Se mantiene:
- Es un documento para leer, imprimir y adjuntar en un email: la paleta eva está pensada para fondo negro (`orange` sobre blanco 2.61:1, `green` 1.33:1); invertir a fondo negro gasta tinta y empeora la impresión.
- Llevar la serif condensada exigiría `Font.register` con TTF (react-pdf no carga woff2), sumar peso al chunk diferido y riesgos de CSP/carga, en un artefacto best-effort cuyo fallo no debe romper el envío (`pdf-del-presupuesto`).
- No bloquea la limpieza: el `#00ffc3` es un literal del PDF, no un token de Tailwind; `limpieza-cyberpunk` puede borrar `accent-*` sin tocarlo. Cambiar ese acento a naranja es una decisión de marca menor (Open Questions).

### D8. Tests (Strict TDD, `node --test`)

- `scripts/configurador-estilo.test.mjs` (nuevo):
  - Estilos puros (`estilos.js`): `codigoModulo` (`'TIPO',0` → `TIPO-01`; `'EXT',9` → `EXT-10`); `estadoPaso` (antes/igual/después); `claseModulo(true)` contiene `shadow-[6px_6px_0_0` y `border-eva-orange` y `claseModulo(false)` no contiene la sombra de seleccionado; `claseIndicador(true)` contiene `bg-eva-orange` y `claseIndicador(false)` no; `claseCampo(true)` contiene `border-eva-red` y no `focus:border-eva-orange`, `claseCampo(false)` al revés; `clasePaso` distingue los tres estados; todo `hover:`/`focus-visible:` con `translate` va con `motion-safe:`; los botones no contienen `disabled:opacity` y sí `disabled:bg-eva-line`.
  - Guard de carpeta: todos los archivos (`.js` y `.jsx`) de `src/components/configurador/` y `src/pages/Configurador.jsx` completo, con `findForbiddenTokens` de `scripts/lib/class-guard.mjs`. Prohíbe por token (con variantes `hover:`, `md:`…, sin falsos positivos con `font-eva-display`, `eva-nav-glass`, `eva-tag` o `service.tag`): `accent-`, `neon-`, `muted-`, tokens `dark`/`dark-*` (`bg-dark`, `text-dark`, `border-dark-border`…), `glow`, `gradient-text`, `gradient-border`, clases `glass`/`glass-hover`/`tag`/`section-title`/`cyber-grid`, clase `font-display`, `text-white`, `text-gray-\d`, `rounded`, `blur-`, `backdrop-`, `disabled:opacity-`, hex literales en clases o `style`, `text-eva-(red|purple|gray-dim)`, `animate-` y `hover:`/`focus-visible:` con `translate` sin `motion-safe:`. Exige: `aria-pressed` en `ServiceCards`/`ExtrasCards`, `aria-current` en `WizardSteps`, `aria-invalid` + `aria-describedby` + `role="alert"` + `HONEYPOT_FIELD` + `tabIndex={-1}` + `autoComplete="off"` + `maxLength` en `FormStep`, `aria-label="Resumen de la solicitud"` en `SummarySidebar`, `role="status"` en la página, `eva-panel` en los paneles, `font-eva-display` en la página.
  - Contraste: D6 con `checkContrastPairs` + función pura `evaluarMezclas({ alphaSeleccionado, alphaHex })` → errores legibles (par, fondo, valor); casos: valores reales → `[]`; `alphaSeleccionado: 0.3` → error del `gray` (triangulación).
- `scripts/lib/class-guard.mjs`: **reutilizar** si existe (lo crea `hero-brutalista` o `contacto-brutalista`). Si al aplicar no existe, crearlo con el mismo contrato (`findForbiddenTokens(source, rules)` → `[{ rule, match }]`, puro, reglas regex) y su `scripts/class-guard.test.mjs` (detección, no falsos positivos `font-eva-display`/`motion-safe:animate-x`, variantes); el change que llegue después lo reutiliza sin redefinirlo.
- `scripts/a11y-classes.test.mjs` (extender, no reescribir): inspecciona `.js` además de `.jsx` en `src/components/configurador/` (las clases pasan a `estilos.js`) y suma a `FORBIDDEN` `disabled:opacity-*` (detectado por prefijo, como `text-gray-*` con opacidad) y `text-eva-gray-dim` (incluye `placeholder:`). Triangulación con casos positivos/negativos en sus tests unitarios.
- Tests existentes que deben seguir en verde sin edición: `wizard`, `wizard-view`, `review`, `summary`, `webhook`, `contact`, `pdf-generator`, `service-icons`, `site-nav-classes`, `sistema-visual`.
- Lo que no ve `node --test` (render real, estados de hover/foco, 375px, reduced-motion, CSP) se verifica a mano con Playwright (tareas finales), sin enviar leads reales: las peticiones a `https://script.google.com/**` (destino de `VITE_WEBHOOK_URL`, únicas permitidas por `connect-src`) se interceptan con `page.route`.

### D9. Delta de `sistema-visual` y orden de archivo

`sistema-visual` la crea `tokens-fuentes-texturas-eva` (28/29 tareas, sin archivar). Su escenario "Configurador sin cambios visuales" deja de ser verdadero con este change, así que el delta lo modifica (MODIFIED de "Coexistencia con la paleta anterior"). `openspec validate --strict` lo acepta, pero **archive rechaza un MODIFIED sobre una spec inexistente**: `tokens-fuentes-texturas-eva` debe archivarse antes que este change (tarea de cierre).

### Escenarios vigentes (spec `interfaz-del-configurador`)

| Requisito | Cómo se mantiene |
|---|---|
| Layout de dos columnas | Misma grilla `lg:grid-cols-[minmax(0,1fr)_20rem]`, resumen `lg:sticky`; apilado en móvil |
| Indicador de progreso | 4 pasos, `aria-current="step"`, completados con tilde (forma) |
| Resumen en vivo | Mismo `buildSummary`, mismos textos, sin importes |
| Navegación entre pasos | Misma condición `step > FIRST_STEP` / `< LAST_STEP`; solo cambian clases |
| Selección del tipo de sitio / de extras | Mismos `aria-pressed` y callbacks; la distinción se refuerza (D3) |
| Disclaimer de hosting visible | Sigue dentro de la tarjeta, sin interacción (D3) |
| Control de cantidad | Misma lógica; botones más grandes (D4) |
| Robustez de los iconos | `serviceIcons.js` sin cambios |
| Operación por teclado | Siguen siendo `button`; foco global sin anular |
| Formulario de contacto / Validación inline / Límite de largo | Mismos campos, `maxLength`, `aria-invalid`, `aria-describedby`, `role="alert"` (guard D8) |
| Campo trampa oculto | Mismo bloque `sr-only aria-hidden`, `tabIndex={-1}`, `autoComplete="off"`, mismo nombre (guard D8) |
| Revisión / Edición por bloque / Inicio del envío / Aviso de privacidad | Mismo `buildReview`, mismos textos y callbacks; deshabilitado sin opacidad |
| Foco visible en los campos | Borde naranja + anillo global verde; con error, borde rojo + anillo verde |
| Contraste del texto | Placeholders `eva-gray` (7.48), pendientes `eva-gray`; tabla D6 |
| Foco al cambiar de paso / Anuncio del envío | `headingRef`, `getViewKey`, `role="status"` sin cambios |

## Risks / Trade-offs

- [Regresión en el flujo de conversión (un botón invisible, un estado que no se ve)] → guard + contraste automáticos, recorrido Playwright completo en 1440 y 375 con teclado y movimiento reducido; preview de Vercel antes de merge.
- [`black` sobre `red` (4.53) pasa por 0.03] → el test lo vigila; si `eva-red` cambia, la alternativa es la marca con `text-eva-paper` sobre `bg-eva-black` y borde rojo (decorativo).
- [Botones de cantidad de 36 → 44px desplazan el bloque] → cambio menor; verificar a 375px que el bloque "Cantidad" no se rompa.
- [Edición concurrente de `scripts/a11y-classes.test.mjs` y creación de `scripts/lib/class-guard.mjs` con otros changes del rediseño] → cambios aditivos; releer el archivo antes de editar y respetar el contrato del helper si ya existe.
- [`.eva-tag` con borde 2.95:1 sobre la tarjeta seleccionada] → aceptado: borde decorativo de un elemento no interactivo con texto 13.68:1.
- [El PDF conserva un acento cian de la marca anterior] → aceptado (D7); no depende de tokens.
- [Archivar este change antes que `tokens-fuentes-texturas-eva`] → falla el archive (D9); tarea explícita de orden.

## Migration Plan

1. Aplicar en `rediseno-evangelion` después de `tokens-fuentes-texturas-eva` y `navbar-brutalista-glass` (ya aplicados); independiente del orden respecto de las secciones de la home salvo el helper `class-guard.mjs`.
2. `npm run ci` verde; recorrido Playwright (tareas finales) con el webhook interceptado; preview de Vercel con la CSP de producción y un único envío de prueba controlado por el dueño del sitio (no por el agente).
3. Archivar `tokens-fuentes-texturas-eva` antes que este change.
4. Rollback: revertir el commit (sin estado persistente; los tokens viejos siguen en el repo hasta `limpieza-cyberpunk`).

## Open Questions

- ¿Cambiar la regla `#00ffc3` del PDF al naranja eva (`#FF7A1A`) para alinear la marca? No cambia specs ni tareas de este change; puede ir en `limpieza-cyberpunk`.
- Copy de los rótulos decorativos ("SYS // PRESUPUESTO", "CANT // UNIDADES", "TRANSMISIÓN OK", códigos `TIPO-0X`/`EXT-0X`): ajustable en la verificación visual sin tocar la spec.
