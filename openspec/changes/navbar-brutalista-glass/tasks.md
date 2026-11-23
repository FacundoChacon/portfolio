# Tasks

> Strict TDD: cada RED se ejecuta y se ve fallar antes del GREEN. Runner: `npm test` (`node --test "scripts/**/*.test.mjs"`), sin Vitest ni DOM.

## 1. Red de seguridad y dependencia

- [ ] 1.1 Confirmar que `tokens-fuentes-texturas-eva` está aplicado: existen `src/styles/eva-tokens.js` (`EVA_COLORS`), `scripts/lib/contrast.mjs` (`contrastRatio`), clases `eva-*` en `tailwind.config.js`, `.eva-stripes`, `font-eva-display`, `.font-stretch-condensed`, `--eva-orange` y `--eva-focus` en `src/index.css`. Anotar si `--eva-black` existe (design, Risks). Si falta algo, detenerse y reportar.
- [ ] 1.2 Correr `npm test` y `npm run build` y registrar la línea base (N tests en verde, build OK); si algo falla, detenerse y reportarlo como falla preexistente.

## 2. Lógica pura de navegación (`src/utils/siteNav.js`)

- [ ] 2.1 RED: crear `scripts/site-nav.test.mjs` importando `src/utils/siteNav.js` (inexistente) con casos de `navHref('proyectos') === '#proyectos'`, `navCode('03') === '//03'` y `NAV_LINKS` = los 5 ids/labels actuales en orden (`presentacion`/Inicio … `contacto`/Contáctame) con códigos `01..05` únicos. Ejecutar y ver el fallo.
- [ ] 2.2 GREEN: crear `src/utils/siteNav.js` con `NAV_LINKS`, `BRAND_CODE`, `NAV_HEIGHT_PX = 70`, `navHref`, `navCode` (design D1); `npm test` en verde.
- [ ] 2.3 RED → GREEN: `pickActiveSection(order, intersectingIds)` — `Set` vacío → `null`; un id → ese id; `new Set(['stack','proyectos'])` → `'proyectos'` (orden de documento, no de inserción); `new Set(['testimonios'])` → `null`. Ver fallar, implementar, `npm test` en verde.
- [ ] 2.4 RED → GREEN: `sectionObserverOptions(70)` → `{ rootMargin: '-70px 0px -60% 0px', threshold: 0 }` y un segundo caso con otra altura (triangulación); `menuKeyAction('Escape', true) === 'close'`, `menuKeyAction('Escape', false) === null`, `menuKeyAction('Enter', true) === null`. Ver fallar, implementar, `npm test` en verde.
- [ ] 2.5 REFACTOR: JSDoc en cada export (mismo estilo que `src/utils/motion.js`); `npm test` sigue en verde.

## 3. Cristal legible y altura de la barra (`src/index.css`)

- [ ] 3.1 RED: en `scripts/site-nav.test.mjs`, casos de `blendOver(fgHex, bgHex, alpha)` de `scripts/lib/contrast.mjs` (aún sin exportar): `blendOver('#050505', '#FFFFFF', 0.85) === '#2b2b2b'`, `alpha 1` → el fg, `alpha 0` → el bg. Ver el fallo; GREEN agregando `blendOver` (composición por canal sRGB, redondeo) a `scripts/lib/contrast.mjs` sin tocar sus otros exports; `npm test` en verde.
- [ ] 3.2 RED: test que lee `src/index.css`, extrae el `rgb(r g b / a)` de `.eva-nav-glass` y verifica: `r g b` = `EVA_COLORS.black`; naranja, papel y gris sobre `blendOver(black, '#FFFFFF', a)` ≥ 4.5 con `contrastRatio`; y que con `a = 0.72` el naranja quede < 4.5 (protección contra bajar el alpha). Ver fallar (la clase no existe).
- [ ] 3.3 GREEN: agregar en `src/index.css` (`@layer components`) `.eva-nav-glass` con `rgb(5 5 5 / 0.85)` + `backdrop-filter: blur(10px)` y su bloque `@supports not (…backdrop-filter…)` con fondo opaco `var(--eva-black)` (o literal si no existe); `:root { --eva-nav-h: 70px }` y `html { scroll-padding-top: calc(var(--eva-nav-h) + 1rem) }` (design D3/D5). `npm test` en verde.
- [ ] 3.4 Crear `scripts/site-nav-classes.test.mjs` con las aserciones sobre `src/index.css` del design D6 (`@supports not` con fondo opaco en `.eva-nav-glass`; `scroll-padding-top` usa `--eva-nav-h`; `--eva-nav-h` = `${NAV_HEIGHT_PX}px`, importando la constante). Verificar que fallan cambiando temporalmente el valor de `--eva-nav-h` a `64px` y que vuelven a verde al restaurarlo.

## 4. Marca compartida y barra de la home

- [ ] 4.1 RED: extender `scripts/site-nav-classes.test.mjs` con el guard sobre `src/components/SiteNav.jsx` y `src/components/NavBrand.jsx` (design D6): prohibidos `accent-*`, `neon-*`, `*-glow-*`, `rounded*`, hex literales y `hover:*translate*` sin `motion-safe:`; exigidos `aria-current`, `aria-expanded`, `aria-controls="mobile-nav"`, `menuKeyAction`, `eva-nav-glass`, `eva-stripes`. Probar el detector con fuentes de ejemplo (positivo y negativo) como en `a11y-classes.test.mjs`. Ver fallar sobre el `SiteNav.jsx` actual.
- [ ] 4.2 En `scripts/a11y-classes.test.mjs`, sumar `src/components/SiteNav.jsx` y `src/components/NavBrand.jsx` a los archivos inspeccionados; `npm test` (debe seguir en verde: hoy no usan clases prohibidas).
- [ ] 4.3 GREEN: crear `src/components/NavBrand.jsx` (`Link to="/"`, `FC` visible + `//00` `aria-hidden` + `sr-only` ", ir al inicio"; `font-eva-display font-stretch-condensed`) y reescribir el render de `SiteNav.jsx` según design D3: `NAV_LINKS` de `siteNav.js`, códigos `aria-hidden`, `eva-nav-glass h-16 border-b-2 border-eva-orange`, franja `eva-stripes h-1.5 aria-hidden`, `<nav aria-label="Principal">`, CTAs con mismos destinos/visibilidad, hover duro con `motion-safe:`, sin estado `scrolled` ni listener de scroll. `npm test` en verde.
- [ ] 4.4 Scroll-spy (design D2): `IntersectionObserver` con `sectionObserverOptions(NAV_HEIGHT_PX)` + `pickActiveSection`, `aria-current="location"` y `bg-eva-orange text-eva-black` en el activo; sin `IntersectionObserver` no hace nada. Verificar con `npm run dev`: al desplazarse, el enlace de la sección visible se invierte y es el único con `aria-current` (inspector), y en Testimonios ninguno.
- [ ] 4.5 Enlace "Saltar al contenido" (design D5) como primer elemento de `SiteNav` y `<main id="contenido" tabIndex={-1} className="… outline-none">` en `src/pages/Home.jsx` (solo ese atributo/clase). Agregar al guard que `Home.jsx` tiene `id="contenido"` y `SiteNav.jsx` el `href="#contenido"`; `npm test` en verde.

## 5. Menú móvil

- [ ] 5.1 Implementar en `SiteNav.jsx` (design D4): panel `bg-eva-black` opaco con `border-b-2 border-eva-orange`, ítems `min-h-11` con código + label y activo invertido; `onKeyDown` en el `<header>` con `menuKeyAction` → cerrar y `menuButtonRef.current.focus()`; `matchMedia('(min-width: 768px)')` `change` → cerrar (con guarda de existencia); cierre al elegir enlace; quitar el `aria-hidden` redundante del panel. `npm test` en verde (el guard de 4.1 ya exige `menuKeyAction`).
- [ ] 5.2 Verificar en `npm run dev` a 375px: Tab con menú cerrado no entra al panel; abrir, Tab a un enlace, Escape → cierra y el foco vuelve al botón con `aria-expanded="false"`; abrir y redimensionar a ≥ 768px → cerrado.

## 6. Cabecera de `/configurador`

- [ ] 6.1 En `src/pages/Configurador.jsx`, solo el `<header>` y el `<main>`: usar `NavBrand`, `eva-nav-glass border-b-2 border-eva-orange` + franja `eva-stripes h-1.5 aria-hidden` (estática, no `fixed`), "Volver al inicio" como `Link to="/"` brutalista (mono, borde naranja, hover duro con `motion-safe:`), enlace "Saltar al contenido" antes del header y `<main id="contenido" tabIndex={-1} … outline-none>`. Extender el guard: `Configurador.jsx` tiene `id="contenido"`, `href="#contenido"` y `NavBrand`. `npm test` en verde (incluido `a11y-classes.test.mjs`).
- [ ] 6.2 `npm run build` y `npm run verify:build` en verde (sin scripts inline ni `on*`; las dos páginas siguen generándose).

## 7. Verificación integral

- [ ] 7.1 `npm test` completo en verde comparado con la línea base de 1.2 (mismos tests previos + los nuevos).
- [ ] 7.2 Verificación manual con Playwright sobre `npm run build && npx vite preview` en `/` y `/configurador/`, escritorio (1280×800) y móvil (375×812): (a) Tab desde el inicio → primero "Saltar al contenido" visible con contorno verde, activarlo y el siguiente Tab cae en el contenido; (b) clic en "Proyectos" → el título de la sección queda por debajo de los 70px de la barra (comparar `getBoundingClientRect().top`); (c) Shift+Tab hacia arriba desde mitad de página → el control enfocado no queda bajo la barra; (d) enlace activo invertido con `aria-current` al recorrer las secciones; (e) menú móvil: Escape cierra y devuelve el foco, enlaces cierran el menú; (f) `document.documentElement.scrollWidth <= 375` a 375px; (g) `emulateMedia({ reducedMotion: 'reduce' })` → hover sin traslación (`getComputedStyle(el).transform === 'none'` tras hover); (h) "Armá tu web" y "Volver al inicio" navegan sin recarga; (i) consola sin errores ni violaciones de CSP en ambas rutas. Capturas de escritorio y móvil.
- [ ] 7.3 Verificar el respaldo opaco en el build: el CSS de `dist/assets/*.css` contiene el bloque `@supports not` de `.eva-nav-glass` con fondo opaco y `backdrop-filter` también con prefijo `-webkit-` (autoprefixer). En Playwright, comprobar `getComputedStyle(barra).backdropFilter` = `blur(10px)` en Chromium.
