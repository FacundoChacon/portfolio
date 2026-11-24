# Design: colores-de-marca-hover

## Context

Motivación en `proposal.md` (Why). Estado actual relevante:

- `src/styles/eva-tokens.js` es la única fuente de verdad de color: `EVA_COLORS` (hex), `EVA_ROLES`, `EVA_STATUS_ROLES` y `EVA_THEME_COLORS` (lo que consume `tailwind.config.js` como `colors.eva`). `scripts/contrast.test.mjs` exige que en `EVA_COLORS` no existan nombres retirados (`purple`, `green`, `red`).
- **Stack** (`src/components/Stack.jsx`, `src/data/stack.js`): 12 módulos `.eva-neu-module` dentro de `.eva-neu-surface`, lista semántica no enfocable. El hundido vive en `@media (hover: hover) and (pointer: fine)` con `border-color: var(--eva-secondary)`. La transición solo existe bajo `prefers-reduced-motion: no-preference`. El monograma es un `<span aria-hidden>` con `text-eva-primary-light` sobre `bg-eva-black`.
- **Contacto** (`src/components/Contact.jsx`, `src/data/contacto.js`): 3 canales (`email`, `github`, `linkedin`; no hay WhatsApp en `contacto.js`). Hoy los estados se pintan con utilidades Tailwind en el JSX (`hover:border-eva-secondary`, `hover:shadow-[6px_6px_0_0_var(--eva-secondary)]`, `group-hover:bg-eva-secondary`...). El guard de `scripts/contacto.test.mjs` prohíbe `style={{`, hex literales y nombres de color.
- **CSP** de producción (`vercel.json`): `style-src 'self'` sin `'unsafe-inline'`.
- Superficies reales: negro `#050505` (fondo de sección y caja del monograma), panel `#100E0C` (módulo en relieve, canal). Composiciones del neumorfismo: sombra clara 4 % paper sobre panel, sombra oscura 70 % black sobre panel, sombra interior clara 4 % paper sobre black.
- Helpers de test: `scripts/lib/contrast.mjs` (`contrastRatio`, `checkContrastPairs`, `blendOver`), `scripts/lib/css-rules.mjs` (`ruleBody` con `within`), `scripts/lib/class-guard.mjs` (`findForbiddenTokens`).
- `scripts/lib/color-roles.mjs` (`countRoleUses`) solo cuenta literales de cadena (clases en JSX) en reposo; las variantes de estado no cuentan.

## Goals / Non-Goals

**Goals:**
- Un solo lugar para los hex de marca, consumido por CSS, tests de contraste y datos.
- CSS de estados genérico (`var(--brand)`), idéntico para las 15 marcas.
- Cero estilos inline nuevos y cero hex en componentes.
- Reposo neutral con puntero fino; color permanente en táctil; contraste AA verificado por test para cada marca.

**Non-Goals:**
- No se cambia el catálogo, el orden, los textos ni la semántica (lista no enfocable, nombres accesibles) de Stack ni de Contacto.
- No se agregan canales (no hay WhatsApp que colorear).
- No se cambian los íconos ni se agregan logos de marca.
- No se cambia el gating de la traslación de Contacto (`motion-safe:hover:-translate-*`).
- No se tocan otras secciones ni la jerarquía de roles.

## Decisions

### D1. Mapa central `EVA_BRAND_COLORS` en `eva-tokens.js`, referenciado por clave desde los datos

`src/styles/eva-tokens.js` exporta `EVA_BRAND_COLORS` (clave → hex). Cada ítem de `STACK` agrega `brand: '<clave>'`; cada canal de `buildContactChannels` agrega `brand: '<clave>'` (hoy igual a su `id`, pero desacoplado). El mapa **no** se mezcla con `EVA_COLORS` ni con `EVA_THEME_COLORS`: no genera clases `text-eva-*`, no cuenta en la jerarquía y no choca con el guard de nombres retirados.

- *Alternativa descartada*: `color: '#hex'` directo en `stack.js`/`contacto.js`. Dispersa los hex en dos archivos de datos, rompe la regla "eva-tokens es la única fuente de color" y obliga a otro camino para el contraste.
- *Alternativa descartada*: agregar las marcas a `colors.eva` de Tailwind. Generaría 15 utilidades nuevas (`text-eva-java`...) que invitan a usarlas sueltas y contaminan `EVA_THEME_COLORS`.

### D2. El color llega como `--brand` vía `[data-brand]` en la capa base (sin estilos inline)

`eva-tokens.js` exporta la función pura `brandBaseStyles(colors = EVA_BRAND_COLORS)` que devuelve `{ '[data-brand="java"]': { '--brand': '#F89820' }, ... }` y valida que cada clave sea `^[a-z][a-z0-9-]*$` (lanza si no). `tailwind.config.js` la registra con un plugin función: `plugins: [({ addBase }) => addBase(brandBaseStyles())]`. `addBase` siempre se emite (no depende del escaneo de contenido). Los componentes solo ponen `data-brand={tech.brand}` / `data-brand={channel.brand}`.

- *Por qué no `style={{ '--brand': hex }}`*: el guard de Contacto prohíbe `style={{` por diseño, la CSP no admite `'unsafe-inline'` (React lo aplica por CSSOM y funcionaría, pero dejaría el color fuera de la hoja de estilos y del pre-render) y obligaría a importar hex en los componentes.
- *Por qué no 15 reglas escritas a mano en `index.css`*: duplicaría los hex fuera de `eva-tokens.js`.

### D3. Clases de estado genéricas en `index.css`

Dentro de `@layer components`:

| Selector | Contexto | Declaraciones |
|---|---|---|
| `.eva-neu-module:hover` | `@media (hover: hover) and (pointer: fine)` | (ya existe) `border-color: var(--brand, var(--eva-secondary))` en lugar de `var(--eva-secondary)` |
| `.eva-neu-module:hover .eva-brand-accent` | misma media | `color: var(--brand)` |
| `.eva-channel:hover`, `.eva-channel:focus-visible` | sin media | `border-color: var(--brand)`, `box-shadow: 6px 6px 0 0 var(--brand)` |
| `.eva-channel:hover .eva-brand-accent`, `.eva-channel:focus-visible .eva-brand-accent` | sin media | `color: var(--brand)` |
| `.eva-channel:hover .eva-channel-cta`, `.eva-channel:focus-visible .eva-channel-cta` | sin media | `background-color: var(--brand)`, `color: var(--eva-black)` |
| `.eva-neu-module[data-brand]`, `.eva-channel[data-brand]` | `@media (hover: none), (pointer: coarse)` | `border-color: var(--brand)` |
| `[data-brand] .eva-brand-accent` | misma media | `color: var(--brand)` |
| `.eva-brand-accent`, `.eva-channel-cta` | `@media (prefers-reduced-motion: no-preference)` | `transition: color 200ms ease-out, background-color 200ms ease-out` |

**Especificidad** (clave para no tocar los colores de reposo del JSX): el reposo sigue en utilidades Tailwind (`text-eva-primary-light`, `border-eva-gray-dim`, especificidad 0,1,0, que Tailwind emite después de `components`). Todas las reglas de marca tienen especificidad ≥ 0,2,0 (`.eva-channel:hover`, `.eva-neu-module[data-brand]`, `[data-brand] .eva-brand-accent`), así que ganan sin `!important`. Se mantiene `active:shadow-none` en el JSX: misma especificidad que `.eva-channel:hover` pero en `utilities` (emitida después), así que al presionar la sombra desaparece como hoy.

Conservar `text-eva-primary-light` en el monograma, el ícono y el indicador también deja intacto el conteo de `countRoleUses` (los usos del primario no bajan) y el test "eyebrow e inicial del módulo en primary-light".

**Qué se colorea y por qué** (sobrio dentro del neumorfismo oscuro): en Stack, borde + monograma; el nombre y la categoría quedan en paper/gray (la lectura no cambia) y **no** se agrega glow de color: el relieve lo dan las sombras neutras paper/black y una sombra de color ensuciaría el material y agregaría pares de contraste sin valor. En Contacto se reemplaza el naranja secundario de los estados por el color de marca (borde, sombra sólida, indicador invertido) y además el ícono toma el color.

**Hover de Contacto sin media query**: hoy los estados de hover del canal no están condicionados al tipo de puntero y la traslación `motion-safe:hover:` tampoco; se mantiene igual para no desincronizar sombra y traslación. En táctil el canal ya está en color, y un hover "pegado" tras un toque solo agrega la sombra y el indicador (el toque además navega). Stack sí queda condicionado porque su spec exige que tocar no cambie el estado.

**Fallback**: el borde hundido de Stack usa `var(--brand, var(--eva-secondary))` para que un módulo sin marca se comporte como hoy. No se define `--brand` por defecto en `.eva-neu-module`, porque `components` se emite después de `base` y pisaría el valor de `[data-brand]`.

### D4. Foco: se conserva el anillo verde agua del sistema

En `:focus-visible` el canal muestra **el anillo `--eva-focus` (2px, offset 2px) + borde de marca + sombra sólida de marca + indicador invertido**. Justificación:
- El anillo es el indicador de foco del sistema en todo el sitio (spec `sistema-visual`, "Foco visible del sistema"): reemplazarlo por el color de marca rompería esa consistencia, y el rojo de Email podría leerse como error.
- Con el offset de 2px, el anillo queda separado del borde por una franja del fondo negro, contra el que el verde agua da ≥ 3:1 (ya verificado). Solo en la esquina inferior derecha se superpone con la sombra sólida de marca; arriba y a la izquierda el anillo siempre se ve contra el fondo.
- En táctil con teclado (borde ya coloreado en reposo), el foco se sigue distinguiendo por anillo + sombra + indicador invertido, que no dependen del color.

### D5. Paleta de marca y contraste

Regla: se usa el color oficial si alcanza ≥ 4.5:1 contra **negro y panel**; si no, una variante más clara del mismo tono. Exigir 4.5:1 a todas (aunque algunas se usan solo como borde o ícono, donde bastaría 3:1) deja margen para usarlas como texto y simplifica el test a una sola regla. Valores calculados con `scripts/lib/contrast.mjs` (truncados a 2 decimales). "Mín. neu" es el peor par del borde contra superficie, fondo y sombras del neumorfismo (umbral 3:1). "Negro sobre marca" aplica al indicador invertido de Contacto.

| Clave | Ítem | Hex | Origen | vs panel | vs negro | Mín. neu | Negro sobre marca |
|---|---|---|---|---|---|---|---|
| `java` | Java 17 | `#F89820` | oficial | 8.72 | 9.22 | 8.09 | 9.22 |
| `spring` | Spring Boot | `#6DB33F` | oficial | 7.49 | 7.93 | 6.96 | 7.93 |
| `react` | React 18 | `#61DAFB` | oficial | 11.86 | 12.55 | 11.01 | 12.55 |
| `tailwind` | Tailwind CSS | `#2DD4BF` | teal (ver OQ1) | 10.35 | 10.95 | 9.61 | 10.95 |
| `javascript` | JavaScript | `#F7DF1E` | oficial | 14.24 | 15.07 | 13.23 | 15.07 |
| `mysql` | MySQL | `#6FA8DC` | aclarado de `#4479A1` (4.12 ✗) | 7.62 | 8.07 | 7.08 | 8.07 |
| `python` | Python | `#FFD43B` | oficial (amarillo del logo) | 13.51 | 14.30 | 12.55 | 14.30 |
| `docker` | Docker | `#2496ED` | oficial | 6.11 | 6.46 | 5.67 | 6.46 |
| `git` | Git | `#F05032` | oficial | 5.41 | 5.72 | 5.02 | 5.72 |
| `rest` | REST API | `#93D500` | sin marca oficial: verde lima (OQ2) | 10.79 | 11.41 | 10.02 | 11.41 |
| `jwt` | JWT | `#FB015B` | oficial (rosa de jwt.io) | 4.82 | 5.10 | 4.48 | 5.10 |
| `web` | HTML5 / CSS3 | `#6C8BFF` | aclarado del azul CSS3 `#264DE4` (2.99 ✗) (OQ3) | 6.21 | 6.58 | 5.77 | 6.58 |
| `email` | Email | `#EA4335` | oficial (rojo Gmail) | 4.91 | 5.20 | — | 5.20 |
| `github` | GitHub | `#3FB950` | verde de GitHub (Primer, modo oscuro) | 7.58 | 8.02 | — | 8.02 |
| `linkedin` | LinkedIn | `#70B5F9` | aclarado de `#0A66C2` (3.39 ✗) | 8.87 | 9.38 | — | 9.38 |

Márgenes más ajustados: JWT (4.82) y Email (4.91). Pasan; el test los protege ante regresiones.

### D6. Tests (estructura para Strict TDD)

- **Nuevo** `scripts/colores-de-marca.test.mjs`: forma del mapa (15 claves, hex válidos, claves seguras), contraste de cada marca (pares generados: marca vs `black`/`panel` normal, `black` vs marca normal, borde de marca vs composiciones del neumorfismo ui), triangulación con los oficiales que fallan (`#4479A1`, `#0A66C2`, `#264DE4`), `brandBaseStyles` (selector y propiedad por clave, mapa inyectado, clave inválida lanza), plugin de `tailwind.config.js` (llama a `addBase` con `brandBaseStyles()`), cobertura de datos (cada `STACK[i].brand` y cada `channel.brand` existen; cada marca del mapa se usa exactamente en Stack o Contacto), guards de CSS (D3) y guards de JSX (`data-brand`, `eva-brand-accent`, `eva-channel`, sin `var(--brand)` arbitrario ni `style={{` con color).
- **Se actualizan** (sus aserciones actuales contradicen la spec nueva): `stack-neumorfico.test.mjs` (claves permitidas incluyen `brand`; borde hundido `var(--brand, var(--eva-secondary))`; `evaluateNeu` recibe el color de borde y se corre por marca), `stack-classes.test.mjs` (requeridos `data-brand=` y `eva-brand-accent`; `--tech` y hex siguen prohibidos), `contacto.test.mjs` (`buildContactChannels` con `brand`; requeridos `eva-channel`, `eva-channel-cta`, `eva-brand-accent`, `data-brand=`; se retiran `hover:border-eva-secondary`, `focus-visible:border-eva-secondary` y `group-*:bg-eva-secondary` de la lista de tokens esperados).

## Risks / Trade-offs

- [Tailwind 3 no emite el plugin si `plugins` se rompe en silencio] → test unitario del plugin + verificación en navegador (`getComputedStyle(el).getPropertyValue('--brand')`) en la integración.
- [Especificidad: una utilidad futura con variante (`hover:text-*`) en el monograma o el ícono podría pisar la marca] → guard de JSX: el monograma, el ícono y el indicador no llevan variantes `hover:`/`group-*:` de color.
- [Colores parecidos: JavaScript/Python (amarillos), MySQL/Docker (azules), Git/Java (naranjas)] → el color es decorativo (la identificación la dan nombre, monograma y código); se distinguen por saturación y luminosidad. Ver OQ.
- [Rojo de Email vs rojo de error del configurador] → el rojo de marca vive solo en Contacto y fuera de `EVA_STATUS_ROLES`; no se usa como estado.
- [Anillo de foco verde agua sobre la sombra verde de GitHub en la esquina inferior derecha (bajo contraste entre sí)] → el anillo arriba/izquierda queda sobre el fondo negro (≥ 3:1) y el foco además tiene sombra + indicador invertido.
- [El hover "pegado" en táctil en Contacto] → comportamiento igual al actual; aceptado (D3).
- [`countRoleUses` y jerarquía] → los colores de reposo siguen en clases de rol; los de marca no son roles ni literales de clase. Se corre `jerarquia-color.test.mjs` en la integración.

## Migration Plan

Cambio solo de presentación, sin datos persistidos. Despliegue normal (Vercel). Rollback: revertir el commit; no hay migraciones.

## Open Questions

- **OQ1 Tailwind CSS**: el pedido dice "teal"; el color oficial actual del logo es `#38BDF8` (celeste, muy cercano al cian de React). Se propone teal `#2DD4BF`. ¿Preferís el oficial `#38BDF8`? (ambos pasan: 8.99 / 10.35 vs panel).
- **OQ2 REST API**: no tiene marca. Se propone verde lima `#93D500` (ecosistema OpenAPI/Swagger). Alternativa: un tono neutro del sistema.
- **OQ3 HTML5 / CSS3**: se propone el azul de CSS3 aclarado (`#6C8BFF`, lavanda) para no repetir el rojo anaranjado de Git; la alternativa es el naranja de HTML5 `#E34F26` (pasa con 4.96 vs panel).
- **OQ4 Python**: se usa el amarillo del logo `#FFD43B` (cercano al de JavaScript); la alternativa es el azul de Python aclarado `#5A9FD4` (cercano a MySQL/Docker).
- **OQ5 WhatsApp**: `src/data/contacto.js` no tiene WhatsApp ni otros canales (existe `buildWhatsAppUrl` en `src/utils/contact.js`, que usa solo el configurador). Si se agrega a Contacto en el futuro, se propone `#25D366` (verde oficial; 9.71 vs panel, 10.27 vs negro) con la clave `whatsapp`. Fuera de alcance de este change.
