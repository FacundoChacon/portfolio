# Design

## Context

Ver `proposal.md` (Why). Estado actual relevante:

- El núcleo `src/utils/wizard.js` es una máquina de estados pura testeada con `node:test`; `useConfigurador` la envuelve y **solo llama a `sendLead` cuando `submit(state)` devuelve `status === 'submitting'`** (si devuelve otro estado, lo aplica y sale). Ese contrato ya existe y es el que aprovecha el honeypot.
- `HONEYPOT_FIELD = 'company'` vive en `wizard.js` (única fuente de verdad), no forma parte de `ContactForm` (el test de C-05 hace `deepEqual` del formulario vacío) y se lee como `form[HONEYPOT_FIELD]`. `FormStep.jsx` lo renderiza dentro de un `div.sr-only[aria-hidden]` con `tabIndex={-1}` y `autoComplete="off"`.
- `buildLeadPayload` arma `contact` campo por campo (name/email/phone/project), así que el honeypot ya queda afuera, pero **no hay test que lo garantice**.
- No hay jsdom ni testing-library; toda lógica testeable debe ser una función pura en `src/utils/` (regla del proyecto, sin dependencias nuevas).
- Node 24 expone `globalThis.navigator` como getter configurable con `userAgent = 'Node.js/24'`: los tests deben reemplazarlo con `Object.defineProperty` y restaurar el descriptor original.
- `src/index.css` ya define un `:focus-visible` global (outline 2 px `#00ffc3`, offset 2 px) que la clase `focus:outline-none` de los inputs pisa por especificidad.
- La app corre en `React.StrictMode` (efectos dobles en desarrollo).
- Contraste medido (WCAG, contra `#030303` / tarjeta `glass` ≈ `#0b0b0d`): `gray-600` 2.73 / 2.60, `gray-500` 4.27 / 4.07 (no llega a 4.5), `gray-400` 8.12 / 7.74, `accent-green/70` 7.67 / 7.31.

## Goals / Non-Goals

**Goals:**
- Cubrir cada comportamiento nuevo con lógica pura testeable en `node:test` y dejar en los componentes solo el cableado.
- Reutilizar estilos y contratos existentes (foco global, contrato hook ↔ `submit`) en vez de crear mecanismos paralelos.

**Non-Goals:**
- Tests de componentes con DOM (no hay jsdom/RTL y no se agregan): la verificación de UI es manual/Playwright.
- `aria-live` en el resumen lateral: las tarjetas ya exponen su estado con `aria-pressed`; anunciar cada alternancia sería ruido.
- Colapsar el resumen en móvil: la spec vigente lo define apilado debajo del contenido.
- Validación server-side dentro del repo (el receptor es Apps Script, fuera del repo).

## Decisions

### D1 — Descarte del honeypot dentro de `submit` (núcleo puro)
Se agrega `isLikelyBot(form)` (puro: `true` si `form[HONEYPOT_FIELD]` es string con contenido tras `trim()`), y `submit` lo evalúa **después** de los guards de envío en curso / ya enviado y **antes** de validar. Si da `true`, devuelve `{ ...state, errors: {}, submitted: true, submitting: false, status: 'success' }`.
- **Por qué**: el hook ya no llama a `sendLead` si `submit` no devuelve `submitting`, así que el descarte no requiere cambios en el hook ni tests con DOM: queda 100 % cubierto por `scripts/wizard.test.mjs`.
- **Antes de validar**: un bot no recibe señal alguna (ni errores ni éxito diferenciado).
- **Alternativa descartada**: `isLikelyBot` + rama en el hook (`if (isLikelyBot) resolveSubmit(SUCCESS)`): duplica el flujo, deja lógica en código no testeable y pasa por un estado `submitting` visible.
- **Alternativa descartada**: flag `discarded` en el estado: nadie lo consume; el éxito debe ser indistinguible.

### D2 — Renombrar el honeypot a `website` con `autocomplete="off"`
`company` coincide con las heurísticas de autocompletado de Chrome/Edge/Safari (tipo *organization*), que pueden ignorar `autocomplete="off"` en formularios de dirección/contacto: un visitante real con perfil de autocompletado quedaría **descartado en silencio** (lead perdido sin aviso). `website` sigue siendo atractivo para bots (nombre semántico) pero no corresponde a ningún dato de perfil de autocompletado de los navegadores. Se mantiene `autocomplete="off"`, `tabIndex={-1}`, `aria-hidden` y `sr-only`, y la etiqueta "No completar este campo".
- **Alternativa descartada**: nombre sin semántica (`fc_hp_x`): menos falsos positivos pero muchos bots solo llenan campos con nombres reconocibles.
- **Test**: `HONEYPOT_FIELD` no pertenece a una lista de nombres autocompletables (`company`, `organization`, `name`, `email`, `phone`, `tel`, `address`, …).

### D3 — `meta.userAgent` desde `globalThis.navigator`
`userAgent: globalThis.navigator?.userAgent ?? ''` (coerción a string). Tests: stub con `Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'X' }, configurable: true })`, caso sin navigator (`value: undefined`) y restauración del descriptor original en `finally`/`after`. El test existente que espera `'node:test'` se reescribe.

### D4 — Foco al cambiar de vista: helpers puros + `useRef` en la página
Nuevo `src/utils/wizardView.js` con:
- `getViewKey(state)` → `'success'` | `'error'` | `` `step-${step}` ``.
- `shouldMoveFocus(prevKey, nextKey)` → `true` solo si ambos existen y difieren.
- `getLiveMessage(state)` → `'Enviando tu solicitud…'` si `submitting`, `''` en otro caso.

En `Configurador.jsx`: `prevKeyRef = useRef(getViewKey(wizard))`; un `useEffect` sobre la clave calcula `shouldMoveFocus(prev, key)`, y si corresponde hace `headingRef.current?.focus()`; luego actualiza la ref. Inicializar la ref con la clave actual evita mover el foco en la carga inicial (y también en el doble montaje de StrictMode). El `h2` del paso y los `h2` de `SuccessStep`/`ErrorStep` llevan `tabIndex={-1}`, `ref` (vía prop `headingRef`) y `outline-none` (no son controles interactivos; el foco programático es para lectores de pantalla y para el scroll). `focus()` sin `preventScroll` hace que en móvil el título del nuevo paso quede a la vista tras tocar "Continuar" al pie (mejora responsive concreta, sin rediseño).
- **Foco + sin `aria-live` para pasos**: mover el foco ya hace que el lector anuncie el título; sumar una región viva duplicaría el anuncio.
- **Región viva solo para el envío**: un `<p role="status" aria-live="polite" className="sr-only">` siempre montado con `getLiveMessage(wizard)`. El botón deshabilitado durante el envío puede perder el foco; la región garantiza el anuncio.

### D5 — `GlitchText`: texto real accesible + movimiento reducido
- Render: `<Tag className=…><span className="sr-only">{text}</span><span aria-hidden="true">{display}</span></Tag>` (`aria-label` en un `span` genérico no es fiable).
- Nuevo `src/utils/motion.js`: `REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'` y `prefersReducedMotion(matchMediaImpl = globalThis.matchMedia)` puro (sin `matchMedia` o si lanza → `false`). En el componente, un estado inicializado con esa función y un listener `change` del `MediaQueryList` (con guarda si no existe `addEventListener`); con `reduced === true` el efecto no programa el revuelto y no aplica `text-glow-magenta`.
- Alternativa descartada: resolverlo solo con CSS (la animación es JS, el CSS de `index.css` no la alcanza).

### D6 — Foco visible en inputs: quitar `focus:outline-none`
Se elimina `focus:outline-none` de `inputClass` en `FormStep.jsx` para que aplique el `:focus-visible` global (outline `#00ffc3`, contraste ≈ 15:1 sobre el fondo), conservando el cambio de color de borde. Con error, el outline verde convive con el borde rosa. Alternativa descartada: `ring-*` propio por input (un segundo estilo de foco distinto del resto del sitio).

### D7 — Contraste: `gray-500`/`gray-600` → `gray-400` en el configurador
Afecta `ReviewStep` (aclaración), `SummarySidebar` (cantidad, vacío, "Sin extras", pie), `WizardSteps` (pasos pendientes, texto y número) y `placeholder:` de `FormStep`. Guard estático en `scripts/a11y-classes.test.mjs`: lee los `.jsx` de `src/components/configurador/` y falla si encuentra `text-gray-500`, `text-gray-600`, `placeholder:text-gray-500/600` o `focus:outline-none`. Las estrellas vacías de `Testimonials` (gráfico, umbral 3:1 de 1.4.11) quedan fuera.

### D8 — Aviso de privacidad (texto confirmado por Facundo)
Una línea en `ReviewStep`, inmediatamente antes del botón "Enviar solicitud", en `text-xs text-gray-400`. Texto confirmado: *"Uso tus datos solo para responder esta solicitud. No los comparto ni los uso para publicidad. Si querés que los borre, escribime a {email}."* con `{email}` como `mailto:`. La página calcula una sola vez `contactEmail` (`VITE_CONTACT_EMAIL` o el fallback actual) y lo pasa a `ReviewStep` y a `ErrorStep`.
- **Sin checkbox**: el visitante entrega los datos para pedir un presupuesto (la finalidad es la solicitud misma); la casilla agrega fricción sin cambiar la base. Si Facundo quisiera respaldo formal de consentimiento (Ley 25.326), se cambia a checkbox en otro change.
- El texto es copy, no lógica: no lleva test unitario (sería tautológico); se verifica a mano.

### D9 — Copy de éxito en primera persona
`buildSuccessMessage(name)` en `wizardView.js`: con nombre → `{ title: '¡Solicitud enviada!', body: '¡Gracias, {nombre}! Te respondo por email a la brevedad.' }`; sin nombre (vacío/espacios/no string) → `'¡Gracias! Te respondo por email a la brevedad.'`. Reemplaza el fallback `'el equipo'` de `SuccessStep`.

### D10 — Anti-spam del receptor Apps Script (fuera del repo, manual del usuario)
Como `VITE_WEBHOOK_URL` viaja en el bundle, cualquiera puede hacer POST directo: el honeypot solo frena bots que llenan el formulario. Se entrega este guard para pegar al inicio de `doPost` del Apps Script y redeployar (nueva versión de la implementación web). Apps Script no permite devolver códigos HTTP distintos de 200, así que el rechazo responde `{ ok: false }` en silencio (el cliente lo trata como éxito; el spammer no recibe señal).

```javascript
// Guard anti-spam del receptor (C-11). Pegar en el proyecto de Apps Script
// y llamar al inicio de doPost: `if (!aceptarLead_(e)) return respuestaJson_({ ok: false })`.
var LIMITES = { name: 120, email: 254, phone: 40, project: 2000 };
var SOURCE_ESPERADO = 'facucode.dev/configurador';
var MAX_POR_EMAIL_POR_HORA = 3;
var MAX_GLOBAL_POR_HORA = 30;

function aceptarLead_(e) {
  try {
    if (!e || !e.postData || e.postData.length > 50000) return false;
    var body = JSON.parse(e.postData.contents);
    var p = body && body.payload;
    if (!p || p.source !== SOURCE_ESPERADO) return false;
    var c = p.contact || {};
    for (var campo in LIMITES) {
      var v = c[campo] == null ? '' : String(c[campo]);
      if (v.length > LIMITES[campo]) return false;
    }
    if (!String(c.name || '').trim()) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c.email || '').trim())) return false;
    return dentroDelLimite_('email:' + String(c.email).trim().toLowerCase(), MAX_POR_EMAIL_POR_HORA)
        && dentroDelLimite_('global', MAX_GLOBAL_POR_HORA);
  } catch (err) {
    return false;
  }
}

function dentroDelLimite_(clave, maximo) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var cache = CacheService.getScriptCache();
    var actual = Number(cache.get(clave) || 0);
    if (actual >= maximo) return false;
    cache.put(clave, String(actual + 1), 3600); // ventana de 1 h
    return true;
  } finally {
    lock.releaseLock();
  }
}

function respuestaJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Notas: la ventana es "1 h desde el primer envío" (el TTL no se renueva al incrementar; suficiente para spam casero). El límite por email además deduplica los reintentos tras un timeout de 20 s que sí llegaron a correr. `CacheService` es best-effort (puede expirar antes): aceptable para este volumen.

### D11 — Límites de largo alineados con el receptor; Apps Script v3
El Apps Script v2 ya desplegado rechaza en silencio (`{ ok: false }`, HTTP 200, que el sitio muestra como éxito) todo lead con nombre > 120, email > 254, teléfono > 40 o descripción > 2000: un lead real largo se perdía sin aviso. Se exporta `FIELD_MAX_LENGTH` desde `src/utils/wizard.js` (valores idénticos a `LIMITES` del script, fijados por un test) y `validateForm` devuelve `Máximo N caracteres.` cuando el valor **recortado** lo supera (el payload se envía recortado, así que se mide lo que viaja). `FormStep` pone `maxLength` en los 4 campos (el navegador trunca lo pegado; la validación es la red de seguridad). Sin contador de caracteres (mínimo).

Script v3 (fuera del repo, manual del usuario; basado en v2): (1) rate limit con ventanas fijas por hora (la clave incluye `Math.floor(Date.now()/3600000)`, TTL 3600) en lugar de la ventana que se renovaba al incrementar; (2) los contadores se incrementan solo después de guardar, bajo un único `LockService` (chequeo de ambos límites, `appendRow`, `sendEmail`, incremento), de modo que un fallo al guardar no consume cupo y un límite global lleno no incrementa el del email; (3) anti inyección de fórmulas: texto que empieza con `= + - @` (o tab/CR) se guarda con `'` delante. `doPost` sigue devolviendo siempre JSON.

## Risks / Trade-offs

- [Falso positivo del honeypot: un gestor de contraseñas o extensión llena `website` → lead perdido sin aviso] → Nombre no autocompletable + `autocomplete="off"` + campo fuera del orden de tabulación; el éxito silencioso es el costo aceptado de RN-AB-01. Verificación manual con autocompletado de Chrome en la tarea de QA.
- [Mover el foco puede desorientar a usuarios de mouse si aparece un contorno en el título] → `outline-none` en los títulos (no son interactivos) y `:focus-visible` del navegador no se activa tras un clic.
- [El guard estático de clases es frágil ante clases construidas dinámicamente] → Las clases del configurador son literales; el guard es una red de regresión, no una prueba de contraste en runtime.
- [Rate limit del Apps Script mal configurado bloquea leads reales] → Límites holgados (3/h por email, 30/h global) y el cambio es opcional, reversible redeployando la versión anterior.
- [El texto de privacidad no validado legalmente] → El texto fue confirmado por Facundo; la validación legal formal queda fuera de este change (ver el trade-off de checkbox en D8).

## Migration Plan

1. Implementar y pasar `npm run ci`; deploy normal en Vercel (sin cambios de entorno ni de payload: el honeypot nunca viajó en el lead).
2. Texto de privacidad confirmado por Facundo (hecho).
3. Opcional/recomendado: Facundo pega el guard en Apps Script, prueba con un POST real del configurador y redeploya la implementación web. Rollback: volver a la versión anterior del deployment de Apps Script.

## Open Questions

- ¿Facundo prefiere otro email de contacto para pedidos de borrado distinto de `VITE_CONTACT_EMAIL`? (no cambia el approach: es una variable).
- Resuelto: Facundo confirmó el campo trampa `website` y los límites del guard (3/h por email, 30/h global).
