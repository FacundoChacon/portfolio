# Tasks

> Strict TDD: cada tarea de código empieza con el test en rojo (`node --test "scripts/**/*.test.mjs"`), luego el mínimo para verde, triangulación y refactor. Gobernanza LOW; la decisión D1 (validar el email configurado) se expone en el resumen del apply.

## 1. Precondiciones

- [ ] 1.1 Verificar que existen `eva-*`, `font-eva-display`, `.font-stretch-condensed`, `.eva-stripes`, `.eva-panel(-label|-code)`, `.eva-reveal`, `checkContrastPairs` y `blendOver` en `scripts/lib/contrast.mjs`, y que `src/components/GlitchText.jsx` existe (puede estar importado por `Testimonials.jsx` o ya no, según se haya aplicado `acerca-testimonios-glass`; en ningún caso se borra); `npm test` verde como red de seguridad (anotar N tests).

## 2. Helper de guards estáticos

- [ ] 2.1 Si no existe `scripts/lib/class-guard.mjs` (lo crea el primero de `hero-brutalista`/`contacto-brutalista`): escribir `scripts/class-guard.test.mjs` en rojo y luego `findForbiddenTokens(source, rules)` puro → `[{ rule, match }]`; triangular: detección con variantes (`hover:`, `md:`, `group-hover:`), sin falso positivo de `font-display` dentro de `font-eva-display` ni de traslaciones con `motion-safe:`. Si ya existe, solo verificar que sus tests pasan. Verificación: `node --test scripts/class-guard.test.mjs` verde.

## 3. Datos y lógica de canales

- [ ] 3.1 Escribir en `scripts/contacto.test.mjs` los tests de datos de design D5 en rojo: `resolveContactEmail` (válido, trim, `undefined`, vacío, espacios, inválido, `fallback` inyectado), `buildContactChannels` (orden/ids, `mailto:` con el email recibido, externos `https://`, triangulación con otro email), `isExternalHref`/`channelLinkProps` (`https`, `http`, `mailto:`, `tel:`, `#contacto`) y `channelCode` (0 → `CH-01`, 9 → `CH-10`).
- [ ] 3.2 Crear `src/data/contacto.js` (sin React ni `import.meta.env`) hasta que 3.1 pase. Verificación: `node --test scripts/contacto.test.mjs` verde.

## 4. Contraste

- [ ] 4.1 Escribir el test de contraste de design D4 (`CONTACTO_CONTRAST_PAIRS` con `checkContrastPairs` → `[]`) y triangular con un par inválido inyectado (`purple/black` como `normal` → error nombrado). Verificación: verde con los pares reales.

## 5. Rediseño del componente

- [ ] 5.1 Escribir en `scripts/contacto.test.mjs` el guard de `src/components/Contact.jsx` (prohibidos y requeridos de design D5 con `findForbiddenTokens`) y verlo fallar contra el componente actual (debe nombrar `GlitchText`, `glitch`, `glow`, `rounded`, `truncate`, `style={{`, `accent-`, etc.).
- [ ] 5.2 Reescribir `Contact.jsx` según design D2–D3: franjas y códigos `aria-hidden`, `h2` "Contáctame" en serif condensada, panel estático "Canal de comunicación abierto", `h3` e invitación con los textos actuales, ubicación con ícono `aria-hidden`, `<ul>` de canales desde `buildContactChannels(resolveContactEmail(import.meta.env.VITE_CONTACT_EMAIL))` con `channelLinkProps`, `channelCode`, `sr-only` de pestaña nueva, estados `hover`/`focus-visible`/`active` de D3 y traslaciones solo `motion-safe:`; `useReveal` + `.eva-reveal` en el contenido; pie con el texto actual. Sin tocar `GlitchText.jsx` ni `src/index.css`. Verificación: 5.1 verde.
- [ ] 5.3 Sumar `src/components/Contact.jsx` a los archivos de `scripts/a11y-classes.test.mjs` (sin quitar los agregados por otros changes). Verificación: test verde.
- [ ] 5.4 `npm run ci` completo verde (lint, tests, build, verify:build); `git diff --stat` no lista `src/components/GlitchText.jsx` ni cambios en los keyframes `glitch-*` de `src/index.css`. Refactor final con tests verdes tras cada paso.

## 6. Verificación manual con Playwright (integración)

- [ ] 6.1 Escritorio 1440×900 y móvil 375×812 sobre `npm run preview`: composición brutalista (panel + lista de canales), email completo visible a 375px sin recorte, sin scroll horizontal (`scrollWidth === innerWidth`), sin capas animadas ni texto que se revuelva tras 10 s en pantalla; capturas de ambos anchos.
- [ ] 6.2 Teclado: Tab recorre Email → GitHub → LinkedIn con anillo verde + borde naranja + sombra + indicador invertido; `/#contacto` y "Hablemos" dejan el `h2` visible bajo la barra; Email abre `mailto:` en la misma pestaña y los externos abren pestaña nueva (`rel` con `noopener noreferrer`). Hover con mouse: mismo estado visual que el foco.
- [ ] 6.3 Árbol de accesibilidad: lista de 3 elementos, nombres "Email chaconfacu2006@gmail.com", "GitHub github.com/FacundoChacon (se abre en una pestaña nueva)", "LinkedIn … (se abre en una pestaña nueva)"; sin "CH-0X", franjas ni indicadores expuestos; `h2` "Contáctame" con su texto real.
- [ ] 6.4 `prefers-reduced-motion: reduce` (`browser_emulate_media`): contenido visible desde el primer render, sin traslación en hover/foco. Sin `reduce`: aparición breve al entrar en pantalla, sin animación en bucle.
- [ ] 6.5 Consola de `/` (preview y, si está disponible, preview de Vercel con la CSP de producción): sin violaciones de CSP ni errores; Testimonios se ve como antes de este change (fuera de alcance, sin regresión).
