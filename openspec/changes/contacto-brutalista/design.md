# Design

## Context

Ver `proposal.md` (Why). Estado actual relevante:

- `src/components/Contact.jsx` (≈130 líneas): `section#contacto` con `cyber-grid`, capa `animate-glitch-line` (con `style={{ boxShadow }}` inline) y velo `animate-glitch-slice-visual`; contenedor con `md:animate-glitch-subtle` al ser visible (`useReveal({ threshold: 0.1 })`). Encabezado "05." + `h2` con `GlitchText` "Contáctame"; `h3` con dos `GlitchText` ("¿Construimos algo" / "juntos?"). Párrafo de invitación, ubicación con `MapPin` (sin `aria-hidden`). Canales (array inline `contacts`): Email (`mailto:` con `import.meta.env.VITE_CONTACT_EMAIL || "chaconfacu2006@gmail.com"`), GitHub, LinkedIn; cada uno `<a>` con `rounded-lg`, hover "flotante" `hover:-translate-y-1` sin `motion-safe`, glows por acento y valor con `truncate`. `target/rel` calculados inline (`mailto:` → misma pestaña; resto `_blank` + `noreferrer`). Pie del sitio (`<footer>`) dentro de la sección.
- **No hay formulario** en la sección (el formulario con validación vive en el configurador): `scripts/a11y-classes.test.mjs` no aplica a campos acá, pero sus reglas de foco y contraste de texto sí aplican a los enlaces.
- No hay WhatsApp en la sección (sí en el configurador vía `VITE_WHATSAPP_NUMBER` y `buildWhatsAppUrl` de `src/utils/contact.js`).
- `GlitchText` también se usa hoy en `Testimonials.jsx` (`acerca-testimonios-glass`, en paralelo, lo retira de ahí); las clases/keyframes `glitch-*` están en `src/index.css` y se desactivan con `reduce`. El archivo y los keyframes quedan aunque no tengan usos: los borra `limpieza-cyberpunk`.
- Base disponible (`tokens-fuentes-texturas-eva`): `eva-*`, `--eva-*`, `font-eva-display`, `.font-stretch-condensed`, `.eva-stripes`, `.eva-panel`, `.eva-panel-label`, `.eva-panel-code`, `.eva-tag`, `.eva-reveal`/`.is-visible` (con override en `reduce`), `:focus-visible` con `--eva-focus`; `scripts/lib/contrast.mjs` (`checkContrastPairs`, `blendOver`). `useReveal` ya revela de inmediato con movimiento reducido o sin `IntersectionObserver` (`shouldRevealImmediately`).
- Convenciones vecinas: navbar (`border-2`, sombra sólida sin blur `Npx_Npx_0_0`, `motion-safe:` para traslaciones, sin clases de foco propias), proyectos (códigos `UNIT-0X` `aria-hidden`, `.eva-panel-label` "SYS // …", sin `backdrop-filter`). Código de la sección en la barra: `05` (`NAV_LINKS` de `src/utils/siteNav.js`).

Gobernanza: LOW (estilos, datos puros, guards). La única decisión con impacto funcional es D1 (validación del email configurado), expuesta abajo.

## Goals / Non-Goals

**Goals:**
- Sección brutalista solo con tokens/utilidades `eva`; cero `GlitchText`/`glitch`/`glow`/`rounded*`/sombras con blur en `Contact.jsx`.
- Paridad funcional: mismos canales, destinos, comportamiento de pestaña, textos y pie.
- Estados hover/foco/activo visibles con forma, no solo color (1.4.1, 2.4.7, 2.4.11).

**Non-Goals:**
- Borrar `GlitchText.jsx`, keyframes `glitch-*`, `cyber-grid` o `*-glow-*` del CSS (`limpieza-cyberpunk`).
- Agregar canales (WhatsApp) o un formulario.
- Tocar el spec `texto-animado` (ver proposal).

## Decisions

### D1. Datos y lógica en `src/data/contacto.js` (puro, sin `import.meta.env`)

```js
export const DEFAULT_CONTACT_EMAIL = 'chaconfacu2006@gmail.com'
export function resolveContactEmail(value, fallback = DEFAULT_CONTACT_EMAIL)
  // string con trim, válida según /^[^\s@]+@[^\s@]+\.[^\s@]+$/ → valor trimmeado; si no → fallback
export function buildContactChannels(email)
  // [{ id: 'email', label: 'Email', value: email, href: `mailto:${email}` },
  //  { id: 'github', label: 'GitHub', value: 'github.com/FacundoChacon', href: 'https://github.com/FacundoChacon' },
  //  { id: 'linkedin', label: 'LinkedIn', value: 'in/facundo-chacon-61362735a', href: 'https://www.linkedin.com/in/facundo-chacon-61362735a' }]
export function isExternalHref(href)     // true solo para http(s)://
export function channelLinkProps(href)   // externo → { target: '_blank', rel: 'noopener noreferrer' }; si no → {}
export function channelCode(index)       // 0 → 'CH-01' (dos dígitos)
```

- `Contact.jsx` hace `buildContactChannels(resolveContactEmail(import.meta.env.VITE_CONTACT_EMAIL))` y mapea íconos por `id` (`{ email: Mail, github: GithubIcon, linkedin: LinkedinIcon }`): el módulo de datos no importa React ni `import.meta.env`, así lo importa `node --test` sin Vite.
- Cambio de comportamiento menor (MEDIUM, expuesto): hoy un `VITE_CONTACT_EMAIL` con espacios o inválido se usaría tal cual; ahora cae al respaldo. Es estrictamente más seguro (un `mailto:` roto es un canal perdido) y no cambia el caso configurado correctamente.
- Alternativa descartada: reutilizar `src/utils/contact.js` (es del configurador, otro dominio) o compartir datos con `hero-brutalista` (pueden aplicarse en paralelo; la unificación de URLs queda para `limpieza-cyberpunk`).

### D2. Estructura

```
section#contacto.bg-eva-black.border-t-2.border-eva-orange (relative, py-24, overflow-x-clip)
├ div.eva-stripes.h-3 aria-hidden                          ← franja superior de advertencia
└ div.max-w-6xl
  ├ header de sección: p aria-hidden "05 //" (mono, eva-orange)
  │   h2 "Contáctame" (font-eva-display font-stretch-condensed font-black uppercase)
  │   div.eva-stripes.h-2.flex-1 aria-hidden (divisor)
  ├ div ref={revealRef} .eva-reveal(.is-visible) grid lg:grid-cols-12 gap-10
  │  ├ div lg:col-span-5  → panel motivo (.eva-panel, label "COM // ENLACE", code "CH-05", ambos aria-hidden)
  │  │    p estado: ■ (aria-hidden) "Canal de comunicación abierto" (mono uppercase, eva-green)
  │  │    h3 "¿Construimos algo <span text-eva-orange>juntos?</span>" (serif condensada)
  │  │    p invitación (texto actual, eva-gray)
  │  │    p ubicación con MapPin aria-hidden (mono, eva-gray)
  │  │    div.eva-stripes.h-2 aria-hidden (borde inferior del panel)
  │  └ ul lg:col-span-7 (lista nativa: 3 elementos)
  │       li > a canal (D3)
  └ footer (texto actual; mono, eva-gray, border-t-2 border-eva-line)
```

- El motivo eva sustituye al glitch con elementos **estáticos**: franjas, panel con rótulos y un indicador cuadrado fijo (sin `animate-pulse`). El texto de estado es texto real (no `role="status"`: no cambia, no es región viva).
- `useReveal` + `.eva-reveal` en el contenedor del contenido (no en el `h2`: el ancla `#contacto` siempre muestra el título). Con `reduce` o sin `IntersectionObserver`, visible desde el primer render (CSS + hook existentes).
- `bg-eva-black` explícito: los pares de contraste se calculan contra `eva-black`/`eva-panel`, no contra `bg-dark` del `<main>`.
- `overflow-x-clip` (no `hidden`) para contener sombras desplazadas sin crear contenedor de scroll.

### D3. Canal como bloque duro (sin neumorfismo)

```
<a class="group relative flex min-h-[4.5rem] items-stretch border-2 border-eva-gray-dim bg-eva-panel
          hover:border-eva-orange hover:shadow-[6px_6px_0_0_var(--eva-orange)]
          focus-visible:border-eva-orange focus-visible:shadow-[6px_6px_0_0_var(--eva-orange)]
          motion-safe:transition-[transform,box-shadow,border-color] motion-safe:duration-150
          motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5
          motion-safe:focus-visible:-translate-x-0.5 motion-safe:focus-visible:-translate-y-0.5
          active:shadow-none motion-safe:active:translate-x-0 motion-safe:active:translate-y-0">
  <span aria-hidden class="… border-r-2 border-eva-gray-dim font-mono text-xs text-eva-gray">CH-01</span>
  <span aria-hidden><Icon/></span>
  <span class="min-w-0 flex-1">
    <span class="block font-mono text-[11px] uppercase tracking-[0.2em] text-eva-gray">Email</span>
    <span class="block font-mono text-sm sm:text-base text-eva-paper [overflow-wrap:anywhere]">chaconfacu2006@gmail.com</span>
  </span>
  <span aria-hidden class="… border-l-2 border-eva-gray-dim font-mono text-xs uppercase text-eva-orange
                            group-hover:bg-eva-orange group-hover:text-eva-black
                            group-focus-visible:bg-eva-orange group-focus-visible:text-eva-black">Escribir →|Abrir ↗</span>
  {externo && <span class="sr-only"> (se abre en una pestaña nueva)</span>}
</a>
```

- Estados con **forma**, no solo color: en hover/foco aparece una sombra sólida desplazada y el indicador de la derecha se invierte (bloque naranja); el anillo verde global (`:focus-visible`, offset 2px) se suma con teclado. `active` "hunde" el bloque (sin sombra). Con `reduce`: mismos cambios de borde/sombra/indicador, sin traslación ni transición.
- Nombre accesible: "Email chaconfacu2006@gmail.com" / "GitHub github.com/FacundoChacon (se abre en una pestaña nueva)": empieza con la etiqueta visible (2.5.3); el código `CH-0X`, el ícono y el indicador son `aria-hidden`.
- Valor completo con `overflow-wrap:anywhere` en lugar de `truncate` (el email largo parte línea a 375px en vez de recortarse).
- `min-h-[4.5rem]` y bloque completo clickeable: objetivo táctil holgado.
- Sin `rounded*`, sin sombras con blur (`shadow-sm…2xl`, `shadow-inner`, `shadow-[…_Npx_…]` con desenfoque ≠ 0), sin `backdrop-filter`: el guard lo exige.
- Alternativa descartada: tarjetas neumórficas (relieve con sombras claras/oscuras): bordes por debajo de 3:1 y estados de foco ambiguos; explícitamente fuera del estilo de la sección.

### D4. Contraste

Pares usados (en el test como `CONTACTO_CONTRAST_PAIRS`, evaluados con `checkContrastPairs`): `paper/black`, `gray/black`, `orange/black`, `green/black`; `paper/panel`, `gray/panel`, `orange/panel`, `green/panel` (normal); `black/orange` (indicador invertido, normal); `gray-dim/black`, `gray-dim/panel`, `orange/panel` (bordes de canal en reposo y hover, `ui`); `green/panel` (anillo de foco sobre el bloque, `ui`). Todos existen en la tabla del change de tokens; el test documenta cuáles usa la sección y falla si un token cambia. Prohibidos como color de texto en `Contact.jsx`: `text-eva-red`, `text-eva-purple`, `text-eva-gray-dim`.

### D5. Tests (Strict TDD, `node --test`)

- `scripts/contacto.test.mjs` (nombre distinto del existente `contact.test.mjs`, que prueba el WhatsApp del configurador):
  - Datos: `resolveContactEmail` (válido, con espacios → trim, `undefined`, `''`, `'   '`, `'no-es-email'`, `'a@b'` → respaldo; `fallback` inyectado); `buildContactChannels` (ids/orden `email, github, linkedin`, `href` `mailto:` con el email recibido, externos `https://`, valores no vacíos; triangulación con otro email); `isExternalHref`/`channelLinkProps` (`https`, `http`, `mailto:`, `tel:`, `#contacto`); `channelCode(0) === 'CH-01'`, `channelCode(9) === 'CH-10'`.
  - Guard de `src/components/Contact.jsx` (helper `findForbiddenTokens` de `scripts/lib/class-guard.mjs`): prohíbe `GlitchText`, `glitch`, `glow`, `cyber-grid`, `accent-`, `neon-`, tokens `dark-*`/`*-dark`, `red-\d`, `rounded`, `truncate`, `style={{`, `blur-`, `backdrop-`, sombras con blur o predefinidas (`shadow-(sm|md|lg|xl|2xl|inner)\b`, `shadow-[` cuyo tercer valor no sea `0`), clase `font-display`, `text-white`, `text-gray-\d`, hex literales, `text-eva-(red|purple|gray-dim)`, `animate-` (la sección no anima en bucle) y `hover:`/`focus-visible:` con `translate` sin `motion-safe:`. Exige `id="contacto"`, `<h2`, `<ul`, `font-eva-display`, `eva-stripes`, `eva-panel`, `aria-hidden`, `sr-only`, `group-hover:` y `group-focus-visible:`, `focus-visible:border-eva-orange`, `useReveal`, `eva-reveal`, `buildContactChannels`, `resolveContactEmail`, `channelLinkProps`, `VITE_CONTACT_EMAIL`.
  - Contraste (D4).
- `scripts/lib/class-guard.mjs` + `scripts/class-guard.test.mjs`: `findForbiddenTokens(source, rules)` puro (ver `hero-brutalista` D10). Lo crea el primero de los dos changes que se aplique; el otro lo reutiliza sin redefinirlo.
- `scripts/a11y-classes.test.mjs`: suma `src/components/Contact.jsx` a los archivos inspeccionados (reglas de foco y `text-gray-500/600`). No hay formulario: no se agregan reglas de campos.
- El resto (hover real, foco, lector, 375px, CSP) se verifica a mano con Playwright: no hay DOM en el runner.

## Risks / Trade-offs

- [`resolveContactEmail` descarta un valor de entorno que antes se usaba] → solo si es inválido; el caso válido no cambia. Tarea de verificación con el `.env` real del build (sin imprimir secretos: el email ya es público en la página).
- [Ocultar `GlitchText` solo en Contacto deja la home con estilos mezclados si Testimonios aún no migró] → transitorio y planificado (`acerca-testimonios-glass`, `limpieza-cyberpunk`).
- [Con este change y `acerca-testimonios-glass` aplicados, `GlitchText.jsx` queda sin usos (código muerto) y `texto-animado` describe un componente no montado] → aceptado de forma explícita hasta `limpieza-cyberpunk`, que borra el archivo, los keyframes y retira la spec en un solo paso. Vite no incluye en el bundle un módulo que nadie importa.
- [`overflow-wrap:anywhere` corta la URL/email en un punto arbitrario] → aceptable frente a truncar; fuente mono hace el corte predecible. Verificar a 320–375px.
- [Conflictos en `scripts/a11y-classes.test.mjs` y en la creación de `scripts/lib/class-guard.mjs` con `hero-brutalista`/`navbar-brutalista-glass`] → cambios aditivos; la tarea 2.1 verifica si el helper ya existe antes de crearlo.
- [`.eva-reveal` deja el contenido con `opacity:0` hasta que el observer dispara; un salto directo a `#contacto` con umbral alto podría demorarlo] → `useReveal({ threshold: 0.1 })` (como hoy) y el título fuera del contenedor revelado.

## Migration Plan

1. Aplicar después de `tokens-fuentes-texturas-eva` en `rediseno-evangelion` (independiente del orden respecto de `hero-brutalista`).
2. `npm run ci` verde; verificación Playwright (tareas finales); preview de Vercel con CSP de producción.
3. Rollback: revertir el commit (sin estado persistente; `GlitchText` y keyframes siguen en el repo).

## Open Questions

- ¿Sumar WhatsApp como cuarto canal (reutilizando `buildWhatsAppUrl` y `VITE_WHATSAPP_NUMBER` del configurador)? Hoy la sección no lo tiene; agregarlo es un requisito nuevo, para un change posterior si se quiere.
- Copy de rótulos ("COM // ENLACE", "Canal de comunicación abierto", "Escribir →"/"Abrir ↗"): ajustable en la verificación visual sin tocar la spec.
