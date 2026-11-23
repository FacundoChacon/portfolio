# Design

## Context

Ver `proposal.md` (Why). Estado actual relevante:

- `src/components/SiteNav.jsx` solo se monta en `src/pages/Home.jsx` (antes del `<main>`). Es `fixed inset-x-0 top-0 z-50`, transparente arriba y `bg-dark/80 backdrop-blur-md` tras 24px de scroll (listener de `scroll`). Enlaces a `#presentacion`, `#quien-soy`, `#proyectos`, `#stack`, `#contacto`; CTA `Link` a `/configurador` (oculto < `sm`), CV (`/cv.pdf`, nueva pestaña) y "Hablemos" (`#contacto`). Menú móvil: botón con `aria-expanded`/`aria-controls="mobile-nav"`/`aria-label` dinámico y panel con `hidden`/`block` (cerrado = `display:none`, fuera del orden de Tab). **No** maneja Escape, no devuelve el foco, no marca la sección actual.
- `/configurador` **no usa `SiteNav`**: `src/pages/Configurador.jsx` tiene un `<header>` estático propio (logo `<FC/>` + `Link` "Volver al inicio"). El cuerpo lo rediseña `configurador-estilo-eva`.
- Las secciones no tienen `scroll-margin`; `Hero` compensa la barra con `pt-24`. No hay enlace de salto al contenido.
- Dependencia `tokens-fuentes-texturas-eva` (design D1–D8): paleta `eva.*` en Tailwind y variables `--eva-*` en `:root`; `--eva-focus` (verde) en `:focus-visible` con `outline-offset: 2px`; `.eva-stripes` decorativa; `font-eva-display` + `.font-stretch-condensed`; `scripts/lib/contrast.mjs` (`relativeLuminance`, `contrastRatio`, `checkContrastPairs`); `src/styles/eva-tokens.js` (`EVA_COLORS`, `EVA_CONTRAST_PAIRS`); `scroll-behavior: smooth` ya condicionado a `no-preference`.
- `postcss.config.js` usa `autoprefixer`: `backdrop-filter` sale también con `-webkit-`.
- Tests: `node --test "scripts/**/*.test.mjs"`, sin DOM; los tests importan `src/utils/*.js` puros (p. ej. `motion.test.mjs`) y existen guards estáticos de clases (`a11y-classes.test.mjs`).

Gobernanza: LOW para la lógica pura y estilos; MEDIUM para el comportamiento de teclado/foco del menú (decisiones expuestas abajo).

## Goals / Non-Goals

**Goals:**
- Barra brutalista + cristal construida **solo** con tokens/utilidades del change de tokens (cero hex nuevos en JSX, cero `accent-*`/`neon-*`/`*-glow-*`/`rounded*` en la barra).
- Lógica de navegación (enlaces, sección activa, teclas) en funciones puras con tests.
- Cumplir 2.4.1 (salto), 2.4.7/2.4.11 (foco visible y no tapado), 1.4.3 (contraste sobre cristal), 2.3.3/`prefers-reduced-motion`.

**Non-Goals:**
- Fijar la cabecera de `/configurador` o cambiar su cuerpo, su barra lateral `lg:sticky` o su manejo de foco por paso.
- Tocar hero, proyectos y demás secciones (salvo el `id` del `<main>` en `Home.jsx`).
- Eliminar `GlitchText`, `text-glow-cyan`, `box-glow-cyan` ni tokens viejos del CSS (`limpieza-cyberpunk`).

## Decisions

### D1. Módulo puro `src/utils/siteNav.js`

```js
export const NAV_HEIGHT_PX = 70            // barra 64px (h-16) + franja 6px (h-1.5)
export const NAV_LINKS = [                 // orden = orden del documento
  { id: 'presentacion', label: 'Inicio',     code: '01' },
  { id: 'quien-soy',    label: 'Quién soy',  code: '02' },
  { id: 'proyectos',    label: 'Proyectos',  code: '03' },
  { id: 'stack',        label: 'Stack',      code: '04' },
  { id: 'contacto',     label: 'Contáctame', code: '05' },
]
export const BRAND_CODE = '00'
export function navHref(id)                       // '#' + id
export function navCode(code)                     // '//' + code  (ej. '//03')
export function pickActiveSection(order, intersectingIds) // último id de `order` presente en el Set; si no, null
export function sectionObserverOptions(navHeightPx)       // { rootMargin: `-${navHeightPx}px 0px -60% 0px`, threshold: 0 }
export function menuKeyAction(key, isOpen)                // 'close' si key === 'Escape' && isOpen; si no, null
```

- `pickActiveSection` recibe ids ya filtrados por intersección y devuelve el último en orden de documento (desvío del apply: con `scroll-padding` la sección anterior conserva ~16px dentro de la zona de lectura, y "el primero" marcaba la sección previa): resuelve el caso de dos secciones en la zona de lectura sin depender del orden de llegada de las entradas del `IntersectionObserver`. Ignora ids que no estén en `order` (Testimonios no tiene enlace → `null`).
- La "zona de lectura" es la franja entre el borde inferior de la barra y el 40% superior del viewport (`rootMargin` negativo arriba = altura de la barra; `-60%` abajo). Alternativa descartada: elegir la entrada con mayor `intersectionRatio` (inestable con secciones más altas que el viewport, que nunca superan ~0.5).
- Mantener `NAV_LINKS` con `id` en vez de `href` evita duplicar `#` y sirve al observer (`document.getElementById`). Los labels y destinos son exactamente los actuales (spec existente "Las anclas de la home siguen funcionando").

### D2. Scroll-spy en `SiteNav`

- `useEffect` crea **un** `IntersectionObserver` con `sectionObserverOptions(NAV_HEIGHT_PX)`, observa los elementos de `NAV_LINKS` que existan y mantiene un `Set` de ids intersectando (en un `ref`); en cada callback recalcula `pickActiveSection` y hace `setActive` solo si cambió. Desconecta en el cleanup.
- Sin `IntersectionObserver` (`typeof window.IntersectionObserver !== 'function'`) no hace nada: ningún enlace activo, sin errores (spec "Navegador sin observador de intersección").
- Se elimina el listener de `scroll` y el estado `scrolled`: la barra tiene siempre el mismo fondo de cristal (más simple, sin transición de fondo que respetar con movimiento reducido, y legible sobre el hero desde el primer frame).
- El enlace activo recibe `aria-current="location"` (valor indicado por ARIA para la ubicación actual dentro de un conjunto de enlaces de la misma página) y las clases invertidas `bg-eva-orange text-eva-black` (7.81:1, tabla D1 del change de tokens). El resto: `text-eva-gray` (7.47:1 sobre black) con hover `text-eva-paper`.

### D3. Estructura y estilo de la barra

```
<a class="sr-only focus:not-sr-only …" href="#contenido">Saltar al contenido</a>
<header class="fixed inset-x-0 top-0 z-50">
  <div class="eva-nav-glass h-16 border-b-2 border-eva-orange">        ← barra 64px
    <nav aria-label="Principal"> NavBrand · ul enlaces (md+) · botón menú (<md) · CTAs </nav>
  </div>
  <div class="eva-stripes h-1.5" aria-hidden="true" />                ← franja 6px
  <div id="mobile-nav" …>panel móvil</div>
</header>
```

- **Cristal** (`src/index.css`, `@layer components`):
  ```css
  .eva-nav-glass { background-color: rgb(5 5 5 / 0.85); /* eva-black */ backdrop-filter: blur(10px); }
  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .eva-nav-glass { background-color: var(--eva-black); }
  }
  ```
  Blur 10px (dentro del rango 8–12px pedido). Alpha **0.85**: el peor caso es blanco puro detrás de la barra; compuesto en sRGB (como compone el navegador) da ≈ `#2B2B2B` y los textos quedan: naranja 5.43:1, gris 5.19:1, papel 11.39:1 (≥ 4.5). Con 0.72 (`#4B4B4B`) el naranja cae a 3.34:1 y el gris a 3.20:1 (fallan), por eso no se usa un alpha menor. El test lo verifica leyendo el valor real del CSS (D6). Alternativa descartada: `bg-eva-black/85 backdrop-blur-[10px]` en JSX (el fallback `@supports not` no se puede expresar con clases de Tailwind 3 sin plugin).
- **Bordes**: `border-2` / `border-b-2` en `eva-orange` para barra, CTAs y botón de menú; `rounded-none` implícito (no se usa ninguna clase `rounded*`).
- **Tipografía**: marca en `font-eva-display font-stretch-condensed font-black uppercase`; enlaces, códigos y CTAs en `font-mono text-xs uppercase tracking-[0.2em]`. Los códigos (`//01`) van en `<span aria-hidden="true">` con `text-eva-orange`: el nombre accesible del enlace es solo el label ("Proyectos"), que además es el texto visible principal (2.5.3 Label in Name).
- **Marca** `src/components/NavBrand.jsx`: `Link to="/"` con texto visible `FC` + `<span aria-hidden>//00</span>` + `<span class="sr-only">, ir al inicio</span>`. Reutilizada por la home y el configurador.
- **CTAs** (mismos destinos y visibilidad responsive que hoy): "Armá tu web" (`Link`, `border-2 border-eva-orange text-eva-orange`, hover invierte a `bg-eva-orange text-eva-black`), "CV" (`border-2 border-eva-gray-dim text-eva-paper`; `gray-dim` es token `ui` ≥ 3:1), "Hablemos" (igual que "Armá tu web"). Íconos `lucide-react` con `aria-hidden`.
- **Hover duro**: `hover:shadow-[3px_3px_0_0_var(--eva-orange)]` (sombra sin blur) + `motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5` + `motion-safe:transition-[transform,color,background-color] motion-safe:duration-150`. Con `reduce` no hay traslación ni transición: solo cambio instantáneo de color/sombra. Alternativa descartada: `transition` + `motion-reduce:transition-none` (seguiría habiendo traslación instantánea, que es movimiento).
- **Foco**: no se agrega ninguna clase de foco propia; rige `:focus-visible` global (`--eva-focus`, `outline-offset: 2px`). Sobre el bloque activo naranja el anillo verde se dibuja por fuera, sobre el negro de la barra (≥ 14:1).

### D4. Menú móvil

- Panel: `bg-eva-black` **opaco** (no cristal: el texto chico sobre contenido en movimiento se lee peor), `border-b-2 border-eva-orange`, ítems a ancho completo `min-h-11` (44px, objetivo táctil) con código + label; el activo, invertido como en escritorio. Mantiene `hidden`/`block` (cerrado = fuera del orden de Tab) y `id="mobile-nav"`. Se quita el `aria-hidden` redundante (con `display:none` ya está oculto para AT).
- Teclado: `onKeyDown` en el `<header>` → `menuKeyAction(e.key, open) === 'close'` ⇒ `setOpen(false)` y `menuButtonRef.current.focus()`. Escuchar en el `header` (y no en `document`) limita el cierre a cuando el foco está en la barra o el menú, sin interferir con Escape de otros componentes.
- Cierre al pasar a escritorio: `matchMedia('(min-width: 768px)')` con listener `change` → `setOpen(false)` (evita que el panel quede abierto/oculto con `aria-expanded="true"` en escritorio). Protegido con `typeof window.matchMedia === 'function'`.
- No es modal: no hay trampa de foco ni `inert` en el resto de la página (patrón *disclosure navigation* de la APG). Alternativa descartada: diálogo modal a pantalla completa (más código y semántica que el caso no necesita).
- Al elegir un enlace se cierra (comportamiento actual).

### D5. Anclas no tapadas y salto al contenido

- `src/index.css`: `:root { --eva-nav-h: 70px }` y `html { scroll-padding-top: calc(var(--eva-nav-h) + 1rem) }`. `scroll-padding` del contenedor de scroll aplica a la navegación por ancla, a `scrollIntoView` y al desplazamiento por foco secuencial en los navegadores actuales, con una sola regla y sin tocar las secciones. Alternativa descartada: `scroll-margin-top` en cada `<section>` (obliga a editar 6 componentes de otros changes y a recordar la clase en cada sección nueva). En `/configurador` la cabecera no es fija: el padding extra solo agrega 86px de aire al saltar a `#contenido`, inocuo.
- `NAV_HEIGHT_PX` (JS) y `--eva-nav-h` (CSS) deben coincidir: un guard estático lo compara (D6).
- Salto: `<a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] … bg-eva-orange text-eva-black">Saltar al contenido</a>` como primer hijo renderizado en `Home` (dentro de `SiteNav`, antes del `<header>`) y en la cabecera del configurador. `<main id="contenido" tabIndex={-1} className="… outline-none">` en `Home.jsx` y `Configurador.jsx` para que el foco se mueva realmente al `main` (Chrome/Safari no mueven el foco secuencial a un destino no enfocable). `outline-none` sin prefijo de foco está permitido por `a11y-classes.test.mjs` (mismo patrón que los títulos `tabIndex=-1`).

### D6. Tests

- `scripts/site-nav.test.mjs` (unitarios sobre `src/utils/siteNav.js`): `navCode`/`navHref`; `NAV_LINKS` con los 5 ids/labels actuales en orden y códigos `01..05` únicos; `pickActiveSection` (vacío → `null`; uno; dos → el último en orden aunque el `Set` se haya llenado al revés; id fuera de `order` ignorado); `sectionObserverOptions(70)` → `rootMargin: '-70px 0px -60% 0px'`; `menuKeyAction` (`Escape`+abierto → `'close'`; `Escape`+cerrado → `null`; `Enter`+abierto → `null`).
- Contraste del cristal (mismo archivo): helper `blendOver(fgHex, bgHex, alpha)` en `scripts/lib/contrast.mjs` (composición por canal sRGB, redondeo a entero) — se agrega al módulo creado por el change de tokens. El test lee `src/index.css`, extrae el `rgb(r g b / a)` de `.eva-nav-glass`, verifica que `r g b` = `EVA_COLORS.black` y que naranja, papel y gris sobre `blendOver(black, '#FFFFFF', a)` ≥ 4.5; caso de triangulación: con `a = 0.72` el naranja falla (protege contra bajar el alpha).
- `scripts/site-nav-classes.test.mjs` (guard estático sobre `SiteNav.jsx` y `NavBrand.jsx`): prohíbe tokens `accent-*`, `neon-*`, `*-glow-*`, `rounded*`, hex literales y `hover:*translate*` sin `motion-safe:`; exige `aria-current`, `aria-expanded`, `aria-controls="mobile-nav"`, `menuKeyAction`, `eva-nav-glass`, `eva-stripes`; sobre `src/index.css`: `.eva-nav-glass` tiene bloque `@supports not` con fondo opaco, `scroll-padding-top` usa `--eva-nav-h` y `--eva-nav-h` = `${NAV_HEIGHT_PX}px`. Sobre `Home.jsx`/`Configurador.jsx`: `id="contenido"` presente y enlace `#contenido`.
- `scripts/a11y-classes.test.mjs`: la lista de archivos inspeccionados suma `src/components/SiteNav.jsx` y `src/components/NavBrand.jsx` (reglas de foco y `text-gray-500/600` ya existentes).
- El comportamiento en navegador (Escape, foco, scroll-spy, blur, 375px, CSP) se verifica a mano con Playwright (no hay DOM en el runner).

## Risks / Trade-offs

- [El change de tokens aún no está aplicado: nombres de clases/variables pueden variar] → la tarea 1.1 verifica que existan `eva-*`, `--eva-orange`, `--eva-black`, `.eva-stripes`, `font-eva-display`, `.font-stretch-condensed` y `scripts/lib/contrast.mjs`; si algo cambió, se ajusta este design antes de seguir.
- [`--eva-black` puede no existir como variable (D1 de tokens lista `--eva-orange, …`)] → si falta, el fallback usa el literal `rgb(5 5 5)`; el guard compara contra `EVA_COLORS.black` igual.
- [`scroll-padding-top` y foco secuencial: soporte desigual en navegadores viejos] → navegadores actuales lo aplican; se verifica con Playwright (Shift+Tab hacia arriba). Si falla en Chromium, plan B: `scroll-margin-top` vía selector `main section[id]` en `index.css` (sin tocar componentes).
- [Scroll-spy y el scroll horizontal fijado de `proyectos-scroll-horizontal` (change 3)] → la sección `#proyectos` sigue siendo un elemento alto en el flujo; la zona de lectura la detecta igual. Se revisa en ese change.
- [Barra siempre opaca-cristal tapa más el hero que la versión transparente actual] → el hero ya tiene `pt-24` (96px > 70px).
- [Ancho a 375px: marca + CV + "Hablemos" + botón con `border-2` y tracking amplio podrían desbordar] → verificación de `document.documentElement.scrollWidth <= 375`; si desborda, "Hablemos" pasa a `hidden sm:inline-flex` (sigue accesible como "Contáctame" en el menú).
- [`backdrop-filter` en un elemento `fixed` cuesta en GPUs modestas] → un solo elemento de 64px de alto; sin animarlo.

## Migration Plan

1. Aplicar después de mergear/aplicar `tokens-fuentes-texturas-eva` en la rama `rediseno-evangelion`.
2. Preview de Vercel: recorrido con Playwright de `/` y `/configurador/` (escritorio y 375px), consola sin violaciones de CSP.
3. Rollback: revertir el commit (no hay estado persistente ni cambios de CSP).
