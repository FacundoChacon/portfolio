# Tasks

> Strict TDD con `node --test "scripts/**/*.test.mjs"` (sin Vitest). Cada tarea de código: RED (test que falla) → GREEN → triangulación → refactor, ejecutando los tests en cada paso. No tocar lógica del wizard, webhook, PDF, honeypot ni textos visibles. Releer `scripts/a11y-classes.test.mjs` y `scripts/lib/` antes de editarlos (otros changes del rediseño los editan en paralelo).

## 1. Red de seguridad y helper compartido

- [x] 1.1 Correr `npm test` y anotar el baseline (cantidad de tests en verde); si algo falla, frenar y reportarlo como falla previa. Verificación: baseline registrado en el resumen del apply.
- [x] 1.2 Si `scripts/lib/class-guard.mjs` existe, leer su contrato y reutilizarlo sin cambios; si no existe, crearlo con el contrato de `hero-brutalista` D10 (`findForbiddenTokens(source, rules)` → `[{ rule, match }]`, puro, reglas regex) junto con `scripts/class-guard.test.mjs` (detección, variantes `hover:`/`md:`, sin falsos positivos con `font-eva-display` ni `motion-safe:animate-x`). Verificación: `node --test scripts/class-guard.test.mjs` en verde.

## 2. Módulo puro de estilos y contraste

- [x] 2.1 RED/GREEN de `src/components/configurador/estilos.js` en `scripts/configurador-estilo.test.mjs`: `codigoModulo` (`'TIPO',0` → `TIPO-01`; `'EXT',9` → `EXT-10`) y `estadoPaso(indice, actual)` (`done`/`current`/`pending`, con al menos dos índices por estado). Verificación: tests nuevos en verde.
- [x] 2.2 RED/GREEN de `claseModulo`, `claseIndicador`, `claseCampo`, `clasePaso` y las constantes `BOTON_PRIMARIO`, `BOTON_SECUNDARIO`, `BOTON_EDITAR`, `PANEL` según design D2–D5: seleccionado con `border-eva-orange` + `shadow-[6px_6px_0_0` y no seleccionado sin esa sombra; indicador relleno vs. vacío; campo con error `border-eva-red` sin `focus:border-eva-orange` y sin error al revés; tres estados de paso distintos; botones con `disabled:bg-eva-line` y sin `disabled:opacity`; toda traslación con `motion-safe:`. Verificación: tests en verde, sin aserciones triviales.
- [x] 2.3 Test de contraste en `scripts/configurador-estilo.test.mjs`: `CONFIGURADOR_CONTRAST_PAIRS` (tabla D6) con `checkContrastPairs` y función pura `evaluarMezclas({ alphaSeleccionado, alphaHex })` con `blendOver`; leer el alpha real de `bg-eva-orange/NN` en `estilos.js` y del respaldo de `--eva-hex-color` en `src/index.css`. Triangulación: `alphaSeleccionado: 0.3` devuelve error del `gray`. Verificación: valores reales → `[]`; caso de estrés → error con par, fondo y valor.

## 3. Guard de estilo del configurador

- [x] 3.1 RED/GREEN de las reglas del guard (design D8) usando `findForbiddenTokens`: casos positivos (`text-accent-green`, `hover:border-dark-border`, `box-glow-cyan`, `gradient-text`, `className="glass p-4"`, `className="tag"`, `font-display`, `text-white`, `text-gray-400`, `rounded-md`, `disabled:opacity-50`, `text-eva-red`, `hover:-translate-y-0.5`, `bg-[#00ffc3]`) y negativos (`font-eva-display`, `eva-nav-glass`, `eva-tag`, `{service.tag}`, `motion-safe:hover:-translate-y-0.5`, `href="#contenido"`, `bg-eva-orange/10`). Verificación: tests unitarios del guard en verde.
- [x] 3.2 Test de archivos con lista `ARCHIVOS_MIGRADOS` (arranca con `estilos.js`) que aplica el guard y los requisitos por archivo; cada tarea de migración de los grupos 4–6 suma su archivo a la lista. Verificación: test en verde con `estilos.js`.

## 4. Módulos de opción (tipo de sitio y extras)

- [x] 4.1 Sumar `ServiceCards.jsx` a `ARCHIVOS_MIGRADOS` con requisitos `aria-pressed`, `claseModulo`, `claseIndicador`, `codigoModulo`, `eva-tag` (RED) y migrarlo según D3: código `TIPO-0X` e indicador `aria-hidden`, ícono en recuadro sin `rounded`, `.eva-tag` en lugar de `.tag`, nombre en `font-eva-display`. Verificación: guard en verde y `scripts/service-icons.test.mjs` sin cambios en verde.
- [x] 4.2 Ídem para `ExtrasCards.jsx` (código `EXT-0X`, indicador con `Check` solo si está seleccionado, disclaimer `border-l-4 border-eva-orange bg-eva-black text-eva-paper` dentro de la tarjeta). Verificación: guard en verde; el disclaimer sigue en el mismo `<p>` sin interacción.

## 5. Formulario y cantidad

- [x] 5.1 Sumar `FormStep.jsx` a `ARCHIVOS_MIGRADOS` con requisitos `aria-invalid`, `aria-describedby`, `role="alert"`, `HONEYPOT_FIELD`, `tabIndex={-1}`, `autoComplete="off"`, `maxLength`, `claseCampo` y `ERR` (RED); migrar según D4 (marca `ERR` `aria-hidden` `bg-eva-red text-eva-black`, mensaje `text-eva-paper`, asterisco `text-eva-orange`, etiquetas mono `text-eva-gray`, placeholder `text-eva-gray`). El bloque del honeypot no cambia salvo que no tiene clases viejas. Verificación: guard y `npm test` en verde.
- [x] 5.2 Sumar `QuantityControl.jsx` (requisitos `aria-label="Restar una unidad"`, `aria-label="Sumar una unidad"`, `role="status"`) y migrarlo: `border-2 border-eva-gray-dim bg-eva-black`, botones `size-11`, deshabilitado `disabled:bg-eva-line disabled:text-eva-gray` sin opacidad. Verificación: guard en verde.

## 6. Progreso, resumen, revisión, éxito y error

- [x] 6.1 Sumar `WizardSteps.jsx` (requisitos `aria-current`, `estadoPaso`, `clasePaso`) y migrarlo usando `estadoPaso` en lugar de la expresión inline; número en cuadrado, tilde en completados. Verificación: guard en verde.
- [x] 6.2 Sumar `SummarySidebar.jsx` (requisitos `aria-label="Resumen de la solicitud"`, `eva-panel`, `eva-panel-label`) y migrarlo según D5. Verificación: guard y `scripts/summary.test.mjs` en verde.
- [x] 6.3 Sumar `ReviewStep.jsx` (requisitos `eva-panel`, `BOTON_EDITAR`, `BOTON_PRIMARIO`, `mailto:`) y migrarlo según D5 (labels `REV // 0N` `aria-hidden`, enlace de privacidad subrayado `text-eva-orange`). Verificación: guard y `scripts/review.test.mjs` en verde.
- [x] 6.4 Sumar `SuccessStep.jsx` y `ErrorStep.jsx` (requisitos `headingRef`, `tabIndex={-1}`, `eva-panel`; en error `eva-stripes-red`, `mailto:`, `whatsappUrl`) y migrarlos según D5. Verificación: guard y `scripts/wizard-view.test.mjs` en verde.

## 7. Página y cierre del guard

- [x] 7.1 Sumar `src/pages/Configurador.jsx` **completo** al guard (requisitos `font-eva-display`, `eva-hex-grid`, `role="status"`, `aria-live="polite"`, `BOTON_PRIMARIO`, `BOTON_SECUNDARIO`, `NavBrand`) y migrar el cuerpo según D5: `bg-eva-black`, banda intro con `eva-hex-grid` sin redefinir `--eva-hex-color`, `h1` sin `gradient-text`, `h2` de paso en `font-eva-display`, bloque de cantidad con `PANEL`, botones desde `estilos.js` (se borran `primaryButton`/`secondaryButton` locales). No tocar el `<header>`. Verificación: guard, `scripts/site-nav-classes.test.mjs` y `npm test` en verde.
- [x] 7.2 Reemplazar `ARCHIVOS_MIGRADOS` por la lectura de **todos** los archivos `.js`/`.jsx` de `src/components/configurador/` (con aserción de que hay al menos 10) más la página. Verificación: test en verde; un `text-accent-green` agregado a mano en cualquier archivo de la carpeta lo hace fallar nombrando archivo y clase (probar y revertir).
- [x] 7.3 Extender `scripts/a11y-classes.test.mjs`: inspeccionar `.js` además de `.jsx` en la carpeta del configurador y sumar `disabled:opacity-*` (por prefijo) y `text-eva-gray-dim` a las clases prohibidas, con casos unitarios positivos y negativos. Verificación: `node --test scripts/a11y-classes.test.mjs` en verde.
- [x] 7.4 `grep` final sin resultados de `accent-|neon-|dark-|muted-|glow|gradient-text|font-display\b|text-white|text-gray-|rounded|\bglass\b` en `src/components/configurador/` y `src/pages/Configurador.jsx` (fuera de `font-eva-display`/`eva-nav-glass`). Verificación: salida vacía documentada en el resumen.

## 8. Verificación integral (manual + CI)

- [x] 8.1 `npm run ci` en verde (lint, verificaciones, tests, build y `verify:build`). Verificación: salida del comando sin errores y cantidad de tests ≥ baseline de 1.1.
- [x] 8.2 Playwright en `vite preview` a 1440px y 375px: **antes de navegar**, `page.route('https://script.google.com/**', …)` (fulfill con la respuesta que `webhook.js` considera éxito, y en una segunda corrida `abort()` para ver `ErrorStep`); recorrer tipo de sitio → cantidad (restar deshabilitado en 1) → extras (marcar/desmarcar, disclaimer visible) → contacto (errores con marca `ERR`, corregir) → revisión (editar cada bloque y volver) → envío interceptado → éxito / error. Confirmar en `browser_network_requests` que ninguna petición salió al webhook real. Verificación: capturas de cada paso en ambos anchos, sin desplazamiento horizontal a 375px (`scrollWidth <= clientWidth`).
- [x] 8.3 Teclado y movimiento: recorrer con Tab/Shift+Tab y activar tarjetas con Enter/Espacio; el anillo verde es visible en tarjetas (seleccionada y no), campos (con y sin error), botones y cantidad; el foco pasa al título al cambiar de paso. Repetir con `emulateMedia({ reducedMotion: 'reduce' })`: sin traslaciones ni transiciones, estados igual de visibles. Verificación: capturas con foco y con movimiento reducido.
- [x] 8.4 Consola sin errores ni violaciones de CSP (`style-src 'self'`, `font-src 'self'`) en `/configurador` con el build de producción; sin advertencia de precarga ociosa. Verificación: `browser_console_messages` vacío de errores/advertencias de CSP.
- [x] 8.5 Preview de Vercel: recorrido rápido del wizard hasta la revisión (sin enviar); el envío de prueba real lo hace el dueño del sitio si lo decide. Verificación: URL de preview y capturas en el resumen. — Verificado 2026-11-24: wizard recorrido hasta Resumen en build local (validación con errores en rojo claro); en el preview de Vercel (https://portfolio-k1d66d3tf-facundochacons-projects.vercel.app) el dueño envió un lead real y llegó por email.
- [x] 8.6 Antes de archivar: confirmar que `tokens-fuentes-texturas-eva` ya está archivado (`openspec list --json`), porque el delta MODIFIED de `sistema-visual` requiere la spec principal. Verificación: `openspec/specs/sistema-visual/spec.md` existe antes de `openspec archive configurador-estilo-eva`. — Nota 2026-11-24: el archive falló porque el MODIFIED de "Coexistencia con la paleta anterior" reemplazaba el escenario "Configurador sin cambios visuales" (OpenSpec no deja quitar escenarios en un MODIFIED). Como `limpieza-cyberpunk` elimina ese requisito completo (REMOVED), se quitó el delta `specs/sistema-visual/` de este change: la spec final queda idéntica y no se usó `--no-validate`.
