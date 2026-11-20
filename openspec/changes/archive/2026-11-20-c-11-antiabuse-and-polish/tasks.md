# Tasks

> Strict TDD: toda lógica nueva vive en funciones puras de `src/utils/` y se escribe primero el test que falla (RED), luego el código mínimo (GREEN) y después casos adicionales (TRIANGULATE) y REFACTOR con tests en verde. Ejecutar con `node --test "scripts/**/*.test.mjs"` (o el archivo puntual). Sin dependencias nuevas (no jsdom/RTL). El cableado de componentes se verifica con `npm run lint`/`npm run build` y en la verificación manual del grupo 9.

## 0. Red de seguridad

- [x] 0.1 Correr `npm test` sobre el estado actual y registrar el baseline (cantidad de tests en verde); si algo falla, detenerse y reportarlo como falla preexistente

## 1. Honeypot activo en el núcleo (estado-del-configurador › Inicio del envío, RN-AB-01)

- [x] 1.1 RED: en `scripts/wizard.test.mjs`, test "submit: campo trampa completo descarta en silencio" — con datos válidos y `form[HONEYPOT_FIELD] = 'http://spam'` exige `status: 'success'`, `submitted: true`, `submitting: false`, `errors` vacío; verificar que falla
- [x] 1.2 GREEN: en `src/utils/wizard.js`, agregar y exportar `isLikelyBot(form)` y evaluarlo en `submit` después de los guards (en curso / ya enviado) y antes de validar (design D1); actualizar el JSDoc de `submit`; verificar en verde
- [x] 1.3 TRIANGULATE: casos (a) honeypot completo + datos inválidos → `success` sin errores; (b) honeypot `''`, `'   '` o ausente → flujo normal (`submitting` con datos válidos, errores con inválidos); (c) honeypot completo con `submitting: true` o `submitted: true` → mismo objeto; (d) tests directos de `isLikelyBot` (valor no string → `false`); verificar en verde
- [x] 1.4 REFACTOR: revisar nombres/JSDoc y sumar el caso honeypot al test "las acciones no mutan el estado previo"; verificar `scripts/wizard.test.mjs` en verde

## 2. Renombre del campo trampa (interfaz-del-configurador › Campo trampa oculto)

- [x] 2.1 RED: test en `scripts/wizard.test.mjs` que exige que `HONEYPOT_FIELD` no pertenezca a la lista de nombres autocompletables (`company`, `organization`, `name`, `email`, `phone`, `tel`, `address`, `given-name`, `family-name`); verificar que falla con `'company'`
- [x] 2.2 GREEN: cambiar `HONEYPOT_FIELD` a `'website'` (design D2) y actualizar su comentario; en `src/components/configurador/FormStep.jsx` mantener `autoComplete="off"`, `tabIndex={-1}`, `aria-hidden`, `sr-only` y actualizar el comentario ("C-11 lo implementa" → descripción vigente); verificar tests en verde y `npm run lint`

## 3. Payload: `userAgent` real y sin honeypot (webhook-integration › Payload del lead)

- [x] 3.1 RED: en `scripts/webhook.test.mjs`, reemplazar la aserción `meta.userAgent === 'node:test'` por un test que stubea `globalThis.navigator` con `Object.defineProperty(..., { value: { userAgent: 'Mozilla/5.0 Test' }, configurable: true })` y exige ese valor; restaurar el descriptor original en `finally`; verificar que falla
- [x] 3.2 GREEN: en `src/utils/webhook.js`, `userAgent: String(globalThis.navigator?.userAgent ?? '')` (design D3); verificar en verde
- [x] 3.3 TRIANGULATE: caso con `navigator` en `undefined` → `''` sin lanzar; test "no incluye el campo trampa": con `form[HONEYPOT_FIELD] = 'spam'` el payload serializado (`JSON.stringify`) no contiene `HONEYPOT_FIELD` ni `'spam'`; verificar `scripts/webhook.test.mjs` en verde

## 4. Helpers de vista del wizard (interfaz › Foco al cambiar de paso / Anuncio del envío; webhook › Pantallas de éxito y error)

- [x] 4.1 RED: crear `scripts/wizard-view.test.mjs` con test de `getViewKey` (paso 2 en `idle` → `'step-2'`); verificar que falla (módulo inexistente)
- [x] 4.2 GREEN: crear `src/utils/wizardView.js` con `getViewKey(state)` (design D4); verificar en verde
- [x] 4.3 TRIANGULATE `getViewKey`: `status: 'success'` → `'success'`, `'error'` → `'error'`, `'submitting'` en paso 3 → `'step-3'`; verificar en verde
- [x] 4.4 RED → GREEN → TRIANGULATE `shouldMoveFocus(prev, next)`: `('step-0','step-1')` → `true`; mismo valor → `false`; `prev` nulo/indefinido (carga inicial) → `false`; `('step-3','success')` y `('error','step-3')` → `true`; verificar en verde
- [x] 4.5 RED → GREEN → TRIANGULATE `getLiveMessage(state)`: con `submitting: true` → `'Enviando tu solicitud…'`; en `idle`, `success` y `error` → `''`; verificar en verde
- [x] 4.6 RED → GREEN → TRIANGULATE `buildSuccessMessage(name)` (design D9): `'Martina'` → cuerpo `'¡Gracias, Martina! Te respondo por email a la brevedad.'`; `'  Ana  '` → recortado; `''`, `'   '`, `undefined`, `42` → `'¡Gracias! Te respondo por email a la brevedad.'` y nunca contiene `'el equipo'`; verificar en verde
- [x] 4.7 REFACTOR: JSDoc del módulo, constantes de copy nombradas; verificar `scripts/wizard-view.test.mjs` en verde

## 5. Cableado de foco, región viva y éxito/error (sin tests de DOM)

- [x] 5.1 En `src/pages/Configurador.jsx`: `headingRef` + `prevKeyRef = useRef(getViewKey(wizard))` y `useEffect` que enfoca el título cuando `shouldMoveFocus` da `true` (design D4); el `h2` del paso con `tabIndex={-1}`, `ref` y `outline-none`; verificar con `npm run lint` y `npm run build`
- [x] 5.2 Agregar en `Configurador.jsx` un `<p role="status" aria-live="polite" className="sr-only">` siempre montado con `getLiveMessage(wizard)`; verificar con `npm run lint`
- [x] 5.3 `SuccessStep.jsx` y `ErrorStep.jsx`: aceptar `headingRef`, `h2` con `tabIndex={-1}` y `outline-none`; `SuccessStep` usa `buildSuccessMessage(name)` (sin fallback `'el equipo'`, primera persona); la página pasa el `headingRef`; verificar con `npm run lint` y `npm run build`

## 6. Foco visible y contraste AA (interfaz › Foco visible en campos / Contraste del texto)

- [x] 6.1 RED: crear `scripts/a11y-classes.test.mjs` que lee los `.jsx` de `src/components/configurador/` (con `node:fs`) y falla si encuentra `focus:outline-none`, `text-gray-500`, `text-gray-600`, `placeholder:text-gray-500` o `placeholder:text-gray-600` (design D7); verificar que falla sobre el código actual
- [x] 6.2 GREEN: quitar `focus:outline-none` de `inputClass` en `FormStep.jsx` (design D6) y pasar a `gray-400` el placeholder de `FormStep`, la aclaración de `ReviewStep`, los textos de `SummarySidebar` y el texto/número de pasos pendientes de `WizardSteps`; verificar `scripts/a11y-classes.test.mjs` en verde
- [x] 6.3 TRIANGULATE: agregar al guard un caso que confirme que el test detecta una clase prohibida en un string de ejemplo (la función de detección se extrae y se prueba con un positivo y un negativo, para que el guard no pase en vacío); verificar en verde

## 7. GlitchText accesible (texto-animado)

- [x] 7.1 RED: crear `scripts/motion.test.mjs`: `prefersReducedMotion(() => ({ matches: true }))` → `true`; verificar que falla (módulo inexistente)
- [x] 7.2 GREEN: crear `src/utils/motion.js` con `REDUCED_MOTION_QUERY` y `prefersReducedMotion(matchMediaImpl = globalThis.matchMedia)` (design D5); verificar en verde
- [x] 7.3 TRIANGULATE: `matches: false` → `false`; `matchMediaImpl` ausente/no función → `false`; `matchMediaImpl` que lanza → `false`; se consulta con `REDUCED_MOTION_QUERY`; verificar en verde
- [x] 7.4 En `src/components/GlitchText.jsx`: renderizar `<span className="sr-only">{text}</span>` + `<span aria-hidden="true">{display}</span>`; estado `reduced` inicializado con `prefersReducedMotion()` y actualizado por el evento `change` del `MediaQueryList` (con guarda si falta `matchMedia`/`addEventListener`); con `reduced` no programar el revuelto ni aplicar `text-glow-magenta`; verificar con `npm run lint` y `npm run build`

## 8. Aviso de privacidad (interfaz › Aviso de privacidad junto al envío)

- [x] 8.1 Confirmar con Facundo el texto del aviso (borrador en design D8) antes de implementarlo; registrar el texto aprobado en este ítem. CONFIRMADO: «Uso tus datos solo para responder esta solicitud. No los comparto ni los uso para publicidad. Si querés que los borre, escribime a {email}.» (sin checkbox; `{email}` = `VITE_CONTACT_EMAIL` o `chaconfacu2006@gmail.com`)
- [x] 8.2 En `src/pages/Configurador.jsx`, calcular una sola vez `contactEmail` (`VITE_CONTACT_EMAIL` o fallback actual) y pasarlo a `ReviewStep` y `ErrorStep`; en `ReviewStep.jsx`, mostrar el aviso en `text-xs text-gray-400` inmediatamente antes del botón "Enviar solicitud", con el email como `mailto:`, sin checkbox; verificar con `npm run lint`, `npm run build` y que `scripts/a11y-classes.test.mjs` siga en verde

## 9. Integración y verificación

- [x] 9.1 Correr `npm run ci` (lint + verify:catalog + verify:testimonials + test + build) y verificar que termina en verde
- [x] 9.2 Verificación manual o con Playwright sobre `npm run dev` / `npm run preview`: (a) teclado: Tab por el formulario muestra contorno de foco en cada campo, incluido uno con error; (b) "Continuar"/"Atrás"/"Editar" mueven el foco al título del paso y en viewport móvil (375 px) el título queda a la vista; la carga inicial no mueve el foco; (c) con el honeypot completado vía DevTools (`#website`), "Enviar solicitud" muestra la pantalla de éxito y la pestaña Network no registra POST al webhook; (d) envío real: el lead llega con `meta.userAgent` del navegador y sin `website`; (e) éxito y error reciben el foco en su título; (f) `prefers-reduced-motion: reduce` emulado → `GlitchText` estático en Home; el árbol de accesibilidad expone el texto real; (g) el aviso de privacidad se ve junto al botón; (h) autocompletado de Chrome sobre el formulario no llena `#website`. Registrar el resultado de cada punto
  - Resultado (Playwright, 375 px, webhook interceptado): foco en título al Continuar (pasos 2, 3, 4) y no en la carga inicial; outline 2px #00ffc3 en input; aviso de privacidad con mailto visible; honeypot completo → éxito con 0 peticiones; envío normal → 1 petición con userAgent real y sin `website`; éxito recibe foco; GlitchText con `sr-only` estable + `aria-hidden` y estático con reduced-motion. No verificado: (a) Tab con campo en error, (h) autocompletado real de Chrome, estado de error con foco (no simulado)

## 10. Receptor Apps Script (manual del usuario, fuera del repo)

- [x] 10.1 (Manual — Facundo) El guard v2 (design D10) ya está desplegado en producción. Falta pegar el script v3 (`webhook-leads-v3.gs`, ver grupo 11) en el proyecto de Apps Script y redeployar como Nueva versión en la implementación existente (la URL no cambia); verificar enviando una solicitud real desde el configurador (llega a la planilla y el email), un teléfono que empiece con `+` (queda como texto en la celda) y un POST con `source` distinto (no llega) — hecho 2026-11-20: v3 desplegado por Facundo; verificado por POST: lead válido con fórmula y teléfono + → ok, source distinto → ok:false, project de 2001 caracteres → ok:false, 4.º envío del mismo email en la hora → ok:false

## 11. Límites de largo y script v3 (design D11)

- [x] 11.1 Safety net: `npm test` en 108/108 antes de empezar
- [x] 11.2 RED → GREEN → TRIANGULATE `FIELD_MAX_LENGTH` + `validateForm` (`scripts/wizard.test.mjs`): test que fija `{ name: 120, email: 254, phone: 40, project: 2000 }`; por campo, en el límite sin error y pasado del límite con `Máximo N caracteres.`; el largo se mide sobre el valor recortado
- [x] 11.3 `FormStep.jsx`: `maxLength={FIELD_MAX_LENGTH.x}` en nombre, email, teléfono y descripción, y `error` en teléfono y descripción; verificar con `npm run lint` y `npm run build`
- [x] 11.4 RED → GREEN: `scripts/a11y-classes.test.mjs` detecta además `focus-visible:outline-none`, `focus:outline-0`, `focus-visible:outline-0`, `focus:ring-0`, `focus-visible:ring-0`, permite `outline-none` sin prefijo de foco (títulos `tabIndex=-1`) y barre también `src/pages/Configurador.jsx`
- [x] 11.5 Escribir el Apps Script v3 (`webhook-leads-v3.gs`, fuera del repo): ventanas fijas por hora, conteo solo tras guardar bajo un único lock, neutralización de fórmulas, `LIMITES` iguales a `FIELD_MAX_LENGTH`
- [x] 11.6 Correr `npm run ci` y verificar que termina en verde
