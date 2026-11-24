# Design

## Context

La motivación está en `proposal.md`. Este es el estado de `rediseno-evangelion` al proponer, después de los merges de `acerca-testimonios-glass` (c6af279) y `configurador-estilo-eva` (b9abc56):

- **Componentes**: ninguna sección usa ya `accent-*`, `neon-*`, `glow`, `font-display`, `.glass`, `.cyber-grid`, `.gradient-text`, `.reveal*` ni `.tag`. `GlitchText.jsx` existe, pero nadie lo importa.
- **Restos fuera de las secciones** (ningún change los cubría): `index.html` (`<body class="bg-dark text-white">` y `<meta name="theme-color" content="#030303">`), `src/App.jsx` (`LoadingFallback`: `bg-dark`, `border-dark-border`, `border-t-accent-green`, `text-gray-400`), `src/pages/Home.jsx` (`<main … bg-dark>`) y, en `src/index.css`, `body { @apply bg-dark text-white }`, el scrollbar (`#0B0B10`, `#00ffc3`, `#ff6eff`) y `::selection` (`rgba(0,255,195,.25)`).
- **CSS heredado en `src/index.css`**: en `@layer components` quedan `.glass`, `.glass-hover`, `.gradient-text`, `.gradient-border`, `.glow-green/pink`, `.section-title/desc`, `.tag`, `.duotone-wrap`, `.cyber-grid`, `.text-glow-cyan/magenta`, `.box-glow-cyan/magenta` y `.animate-scan`. Fuera de capa quedan `@keyframes scan`, `glitch-subtle`, `glitch-rgb`, `glitch-slice-visual` y `glitch-line`, `.reveal*`, `.text-glow-red`, `.box-glow-red` y `.animate-glitch-*`, y el bloque `reduce` nombra varias de esas clases. Varias usan `@apply` con tokens `dark-*`/`accent-*`.
- **`tailwind.config.js`**: colores `dark`, `accent`, `neon`, `muted` y `eva`; familias `sans` (Rajdhani), `display` (Orbitron), `mono` y `eva-display`; animaciones `fade-in`, `slide-up`, `pulse-slow`, `flicker` y `eva-boot`.
- **Fuentes**: `src/styles/fonts.css` declara Noto Serif Display, JetBrains Mono, Orbitron (1 archivo, ~12 KB) y Rajdhani (4 pesos, ~61 KB). La precarga ya es Noto (`PRELOAD_FONT_STEMS`). Como el cuerpo sin clase de familia hereda `font-sans`, hoy los párrafos de biografía, testimonios y configurador salen en Rajdhani.
- **PDF**: `src/utils/pdfDocument.js` usa `#030303` (texto oscuro sobre papel blanco) y `#00ffc3` (una regla). Son literales de `@react-pdf`, no tokens de Tailwind. `configurador-estilo-eva` los dejó como estaban (su D7).
- **Specs**: `texto-animado` está en `openspec/specs/`. `sistema-visual` todavía **no** está, porque vive en los changes sin archivar `tokens-fuentes-texturas-eva` y `configurador-estilo-eva`.
- **Tests**: `scripts/sistema-visual.test.mjs` sigue protegiendo lo viejo ("conserva los tokens anteriores", `sans`/`display` sin cambios, `@font-face` de Rajdhani y Orbitron, "no se tocaron .reveal, .tag, .glass ni .cyber-grid"). `scripts/lib/class-guard.mjs` ya ofrece `findForbiddenTokens(source, rules)`.

Restricción: puede seguir entrando código en paralelo (ajustes del carrete 3D). Este estado es una foto: el apply tiene que volver a medirlo (D1).

Gobernanza: **LOW** para el borrado de CSS, tokens y dependencias sin usos (con tests en verde), y **MEDIUM** para el cambio de `font-sans` y de la base global (fondo, selección, scrollbar). Esos sí se ven en todo el sitio, así que van con un checkpoint de capturas antes→después (tarea 5.3).

## Goals / Non-Goals

**Goals:**

- Borrar solo lo que no tiene usos y comprobarlo con un inventario reproducible.
- Que la ausencia de la estética vieja quede verificada por un guard global y no dependa de la disciplina de cada change.
- Mantener los nombres y el comportamiento de todo lo eva. Ninguna sección cambia de diseño, salvo la familia del texto de cuerpo.

**Non-Goals:**

- Restilar el PDF del presupuesto, el `favicon.svg`, `og-image.png` o `screenshot.png` (ver Open Questions).
- Cambiar textos visibles, lógica del wizard, webhook, CSP o la precarga de fuentes.
- Reemplazar `text-gray-*`/`text-white` de Tailwind donde sigan en uso. No son tokens de la paleta vieja, aunque el inventario los informa.

## Decisions

### D1. Inventario primero: se borra solo lo que tiene 0 usos

Antes de tocar código, el apply corre un inventario sobre el estado **real** de la rama y deja la tabla en su resumen:

```bash
# Por cada elemento: usos fuera de su propia definición
grep -rnE "<patrón>" src index.html --include=*.js --include=*.jsx --include=*.css --include=*.html
```

Lo cubre, con estos patrones:

- Componentes: `GlitchText` (importadores).
- Tokens: `accent-`, `neon-`, `(bg|text|border|from|via|to|ring|divide|shadow|outline|placeholder)-dark`, `muted`.
- Familias: la clase `font-display`, `Orbitron`, `Rajdhani`.
- Clases: `glow`, `glitch`, `animate-(scan|flicker|fade-in|slide-up|pulse-slow)`, `cyber-grid`, `gradient-(text|border)`, `duotone`, `glass` (palabra suelta y `glass-hover`, sin contar `eva-glass` ni `eva-nav-glass`), `reveal` (palabra suelta y `reveal-(bottom|left|right)`, sin contar `eva-reveal` ni `useReveal`), `section-(title|desc)` y la clase `tag` (en `className`, sin contar `eva-tag` ni `{x.tag}`).
- Hex de la paleta vieja: `#00ffc3`, `#ff6eff`, `#00cc9a`, `#cc3acc`, `#030303`, `#0a0a0a`, `#111116`, `#1a1a22` y `#0b0b10`, más `rgba(0, 255, 195` y `rgba(255, 110, 255` (sin distinguir mayúsculas).

La regla de decisión por elemento es esta:

| Usos encontrados | Acción |
|---|---|
| 0 (solo su definición) | Se borra en este change. |
| Solo en la base global que este change migra (D4: `index.html`, `App.jsx`, `Home.jsx`, `body`, scrollbar, `::selection`) | Primero se migra y después se borra. |
| En una sección o en el configurador (dominio de otro change) | **No** se migra acá. El elemento queda, se anota en `PENDIENTES` (D2) con archivo, token y motivo, y se reporta al orquestador. |
| `src/utils/pdfDocument.js` | Fuera de alcance (Non-Goals). Va a la excepción declarada `PERMITIDOS` (D2). |

Precondición, que se verifica en el mismo paso: tienen que estar mergeados `acerca-testimonios-glass` (`Testimonials.jsx` no importa `GlitchText`, existe `.eva-glass`) y `configurador-estilo-eva` (existe `scripts/configurador-estilo.test.mjs`). Si falta alguno, el apply se detiene.

Alternativa descartada: borrar la lista cerrada de la propuesta sin medir. Con changes en paralelo es la forma más directa de dejar elementos sin estilo. Una clase que se quita de `index.css` no rompe el build, simplemente deja de aplicarse.

### D2. Guard global con reglas declarativas, permitidos y pendientes explícitos

Módulo puro nuevo `scripts/lib/legacy-guard.mjs` (sin I/O), que reutiliza `findForbiddenTokens`:

- `LEGACY_RULES: { rule, pattern, scope }[]`, con `scope` en `'markup'` (`.js`/`.jsx`/`.html`), `'css'` o `'all'`. Reglas mínimas:
  - `paleta-anterior` (all): `accent-`, `neon-`, `muted-` y tokens `dark` con prefijo de utilidad, con variantes (`hover:`, `md:`) y opacidad (`/60`).
  - `brillo` (all): `glow`.
  - `glitch` (all): `glitch` sin distinguir mayúsculas (incluye `GlitchText`).
  - `animacion-cyberpunk` (all): `animate-scan`, `@keyframes scan`, `flicker`.
  - `familia-retirada` (all): `Orbitron`, `Rajdhani`.
  - `clase-font-display` (markup): el token de clase `font-display`. No aplica a CSS, donde `font-display: swap` es una propiedad legítima.
  - `clase-heredada` (all): `cyber-grid`, `gradient-text`, `gradient-border`, `duotone-wrap`, `section-title`, `section-desc`, `glass`/`glass-hover` como token suelto, `reveal`/`reveal-*` como token suelto y la clase `tag` como token suelto de clase.
  - `hex-paleta-anterior` (all): la lista de D1.
- `scanLegacy(files: { path, source }[], { rules, permitidos, pendientes })` devuelve `{ path, rule, match }[]`. Descarta lo que coincide exactamente (archivo, regla y match) con `permitidos` o `pendientes`.
- `PERMITIDOS` (en el mismo módulo): `src/utils/pdfDocument.js` × `hex-paleta-anterior` × `#00ffc3` y `#030303`, cada uno con su `motivo` (pregunta abierta del PDF). `PENDIENTES` arranca vacío, y solo crece por D1 (fila 3) con motivo.

Ejemplos que exige la triangulación:

| Debe detectar | No debe detectar |
|---|---|
| `text-accent-green`, `hover:border-dark-border`, `bg-dark-card/60`, `bg-dark` | `font-eva-display`, `eva-nav-glass`, `eva-glass` |
| `box-glow-cyan`, `<GlitchText`, `animate-glitch-line` | `eva-tag`, `{service.tag}`, `eva-reveal`, `useReveal` |
| `className="glass p-6"`, `className="tag"` | `font-display: swap;` en CSS |
| `font-family: 'Rajdhani'`, `#00FFC3` | `eva-cursor-blink`, `@media (prefers-color-scheme: dark)` |

Test nuevo `scripts/limpieza-cyberpunk.test.mjs`:

1. Tests unitarios de las reglas: tabla de positivos y negativos de arriba, más variantes.
2. Test de archivos: recorre **todo** `src/` (`readdirSync(…, { recursive: true })`: `.js`, `.jsx`, `.css`) más `index.html`, aplica `scanLegacy` y espera `[]`. Si falla, el mensaje lista `path · rule · match`.
3. Un test que verifica que cada entrada de `PERMITIDOS` y `PENDIENTES` **sigue ocurriendo**. Así las excepciones obsoletas no quedan colgadas: si se arregla el PDF, el test pide sacar la excepción.
4. `tailwind.config.js`: `Object.keys(colors)` es `['eva']`; `fontFamily` tiene exactamente `sans`, `mono` y `eva-display`; no existe la animación `flicker` ni su keyframe.
5. `package.json`: no figuran `@fontsource/rajdhani` ni `@fontsource-variable/orbitron`.

Alternativas descartadas:

- Extender cada guard por archivo (hero, contacto, configurador). Cubren solo su archivo, y un componente nuevo quedaría fuera.
- Un grep en CI. No admite excepciones con motivo y no es TDD.

### D3. `font-sans` = pila de fuentes del sistema

`EVA_FONT_SANS` se exporta desde `src/styles/eva-tokens.js` (mismo patrón que `EVA_COLORS`) y `tailwind.config.js` lo importa:

```js
['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif']
```

| Opción | Peso extra | Legibilidad de texto largo | Coherencia eva | Veredicto |
|---|---|---|---|---|
| JetBrains Mono (ya cargada) | 0 KB | Media-baja: el ancho fijo alarga las líneas (~20–25% más ancho que una sans proporcional del mismo cuerpo), se lee más lento en párrafos y el `text-sm` de tarjetas y formularios parte más líneas | Alta, pero borra la jerarquía: hoy la mono **marca** etiquetas y códigos (`.eva-panel-label`, `.eva-tag`) y deja de distinguirse si todo es mono | Descartada |
| Noto Serif Display (ya cargada) | 0 KB | Baja: es un corte *display* de alto contraste; sus trazos finos se degradan a 14–16 px sobre fondo negro | Alta en títulos, no en cuerpo | Descartada |
| Inter / Noto Sans autoalojada | +25–50 KB por archivo variable latin y una petición más | Alta | Neutra | Descartada: suma bytes, un swap (FOUT/CLS en todo el cuerpo) y una dependencia, sin ganancia real frente al sistema |
| **Pila de sistema** | **0 KB** | **Alta**: las fuentes del sistema (SF, Segoe UI Variable, Roboto) tienen el mejor *hinting* a tamaños chicos en cada plataforma | Buena: grotescas cercanas a la Helvetica de la UI de NERV. La identidad la siguen dando la serif condensada y la mono | **Elegida** |

Consecuencias:

- No hay swap ni CLS en el cuerpo, y no cambian ni la precarga ni la CSP.
- Los pesos 400–700 son reales en las tres plataformas.
- Rajdhani es condensada y tiene poca altura x, así que el mismo `text-sm` se ve más grande y ancho. Puede partir más líneas o desbordar en elementos con `truncate` o anchos fijos: lo controla la regresión de D7.

### D4. Base global en la paleta eva (la que este change migra)

- `index.html`: `<body class="bg-eva-black text-eva-paper antialiased">` y `<meta name="theme-color" content="#050505">`. Un test verifica que el `theme-color` es igual a `EVA_COLORS.black`.
- `src/index.css`:
  - `body { @apply bg-eva-black text-eva-paper; }`.
  - Scrollbar: track `var(--eva-black)`, thumb `var(--eva-gray-dim)` (sin `border-radius`, por el brutalismo), hover `var(--eva-orange)`. Se suma `scrollbar-color` en `html` para Firefox.
  - `::selection`: fondo `var(--eva-orange)` y texto `var(--eva-black)`. El negro sobre naranja da 7.81:1; el par se agrega al test de contraste (`checkContrastPairs`).
- `src/pages/Home.jsx`: `bg-dark` → `bg-eva-black`. Es solo ese token: el resto del `<main>` (`overflow-x-clip`, `id`, `tabIndex`) no se toca.
- `src/App.jsx` (`LoadingFallback`): `bg-eva-black`, aro `border-eva-line border-t-eva-orange` y texto `text-eva-gray` (7.48:1 sobre black). No cambian ni la forma ni el texto.

### D5. Orden de borrado: primero los consumidores de `@apply`, después los tokens

Tailwind **falla el build** si un `@apply` nombra un token inexistente: `.glass` usa `bg-dark-card`, `.gradient-text` usa `from-accent-green` y `body` usa `bg-dark`. En cambio, una clase sin regla en el markup **no** falla, solo deja de aplicarse. Por eso el orden es:

1. Migrar la base global (D4).
2. Borrar las clases y los keyframes de `index.css`, y limpiar el bloque `reduce` para que solo nombre clases que existen (`.eva-reveal` y lo que el inventario conserve).
3. Recién ahí, quitar `dark`, `accent`, `neon`, `muted`, `display` y las animaciones sin uso de `tailwind.config.js`.
4. Borrar los `@font-face` de Orbitron y Rajdhani y correr `npm uninstall @fontsource-variable/orbitron @fontsource/rajdhani`.
5. Borrar `GlitchText.jsx`.

Cada paso deja `npm test` y `npm run build` en verde.

### D6. Tests que se invierten o se ajustan

- `scripts/sistema-visual.test.mjs`:
  - "conserva los tokens anteriores" pasa a ser "solo expone la paleta eva".
  - El test de familias pasa a verificar `sans` = `EVA_FONT_SANS`, que no exista `display` y que `mono`/`eva-display` no cambien.
  - El de `fonts.css` pasa a pedir exactamente Noto Serif Display y JetBrains Mono, y a prohibir `rajdhani`/`orbitron`.
  - "no se tocaron .reveal, .tag, .glass ni .cyber-grid" pasa a ser "no quedan selectores heredados" (salvo `PENDIENTES`).
- Los fixtures de `scripts/font-preload.test.mjs` y `scripts/deploy-config.test.mjs` usan `rajdhani-latin-*` solo como dato. Se cambian a stems de familias vivas (`jetbrains-mono-latin-wght-normal`, etc.) sin cambiar qué verifica cada test. Se actualiza el comentario del plan B en `scripts/lib/font-preload.mjs`: ya no se vuelve a Rajdhani, el plan B es `[]` (sin precarga).
- Los guards existentes (hero, contacto, acerca-testimonios, configurador) no cambian.

### D7. Verificación final: regresión visual, CSP y pesos

- **Pesos**: helper puro `scripts/lib/asset-weights.mjs` → `resumirPesos([{ name, bytes, gzipBytes }])` devuelve `{ css, fuentes, js }` con sumas cruda y gzip. Lo usa un CLI chico `scripts/pesos-build.mjs`, que lee `dist/assets`. La línea de base se toma **antes** de borrar nada (tarea 1.3) y se compara al final. Esperado: CSS menor y hasta 5 `.woff2` menos (4 de Rajdhani + 1 de Orbitron, ~73 KB).
- **Playwright** sobre `npm run build && npm run preview`:
  - `page.route('https://script.google.com/**')` mockeado **antes** de navegar.
  - Inyectar la CSP real: leer `vercel.json` y sumar el header `Content-Security-Policy` a la respuesta del documento con `route.fetch()` + `route.fulfill()`, porque `vite preview` no aplica los headers de Vercel.
  - Rutas `/` y `/configurador/`, en 1440×900 y 375×812.
  - En la home, recorrer las secciones (incluido el pin del carrete) con capturas. En el configurador, recorrer los pasos hasta revisión y forzar éxito y error con el mock.
- **Nada sin estilo**: un `page.evaluate` junta todas las clases del DOM y todos los selectores de clase de `document.styleSheets` (recorriendo `@media`, `@supports` y `@layer`) e informa las clases **huérfanas**, es decir, usadas en el DOM y sin ninguna regla. El objetivo es `[]`, salvo los hooks sin estilo documentados que existan.
- **Consola**: 0 errores, 0 `securitypolicyviolation` (listener registrado con `addInitScript`) y ninguna advertencia de precarga ociosa.
- **Red**: ninguna petición a `orbitron`/`rajdhani` ni a orígenes externos de fuentes. `getComputedStyle` de un párrafo de la biografía tiene que empezar con `system-ui`.

## Risks / Trade-offs

- [Un change en paralelo vuelve a usar una clase borrada y queda sin estilo, sin romper el build] → El guard global falla en `npm test` y la detección de clases huérfanas de D7 la encuentra. D1 se vuelve a correr justo antes del commit si la rama se movió.
- [El cambio a la fuente del sistema parte más líneas o desborda (`truncate`, nav, chips del stack, tarjetas del configurador)] → Capturas antes→después en los 2 anchos (tarea 5.3, checkpoint MEDIUM). Si algo desborda, se ajusta con utilidades eva en el archivo del componente y se informa. No se vuelve a Rajdhani.
- [La fuente del sistema varía entre plataformas] → Es aceptado. La identidad la dan la serif condensada y la mono, que son autoalojadas.
- [El orden de borrado mal hecho rompe el build por un `@apply`] → D5 y build en verde por paso.
- [Archivar `texto-animado` con todos sus requisitos REMOVED puede dejar una spec vacía] → El archive lo verifica. Si queda vacía, se borra `openspec/specs/texto-animado/` y se corre `openspec validate --strict` (tarea 8.3).
- [El archive de este change falla porque `sistema-visual` aún no está en `openspec/specs/`] → Se archivan antes `tokens-fuentes-texturas-eva` y `configurador-estilo-eva` (tarea 8.2).
- [Las excepciones del PDF se vuelven permanentes por olvido] → Se declaran con motivo en `PERMITIDOS`, el test 3 de D2 las mantiene vivas y quedan como pregunta abierta en la KB.

## Migration Plan

1. Inventario y línea de base (D1, D7), sobre la rama ya mergeada.
2. Implementar por pasos según D5, con commits locales por paso y tests y build en verde en cada uno.
3. Regresión visual final y comparación de pesos.
4. Documentación (KB y `CHANGES.md`).
5. `revision-independiente` antes del push, según la política del proyecto.

Rollback: revertir los commits del change. No hay estado persistente. `npm install` restaura los paquetes de fuentes desde el lock revertido.

## Open Questions

- ¿El acento `#00ffc3` del PDF del presupuesto pasa al naranja eva (`#FF7A1A`, 2.61:1 sobre blanco, solo decorativo) y el `#030303` al negro eva? Es una decisión de marca que no cambia esta spec: solo se quitarían entradas de `PERMITIDOS`.
- ¿Se rediseñan `favicon.svg` (`#0D1117`/`#00FF88`), `og-image.png` y `screenshot.png` con la estética eva? Son assets de `public/`, fuera de `src/`, y no los cubre el guard.
