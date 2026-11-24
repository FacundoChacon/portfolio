# Design

## Context

La motivación está en `proposal.md`. Este design parte del **estado final de `limpieza-cyberpunk`** (ver su `design.md`): una sola paleta `eva` en `tailwind.config.js`, `font-sans` = pila de sistema, base global eva (`body`, scrollbar con hover `var(--eva-orange)`, `::selection` naranja con texto negro, `LoadingFallback` con `border-t-eva-orange`, `theme-color` `#050505`) y el guard global `scripts/lib/legacy-guard.mjs`.

Inventario de acentos al proponer (rama `rediseno-evangelion`, `grep` sobre `src/`). El apply lo vuelve a medir (D9):

- **Naranja**: unos 70 usos de `eva-orange` en 17 archivos, más `var(--eva-orange)` en `index.css` (franjas, `.eva-panel-label`, hover de `.eva-neu-module`, `.carrete-enlace` y su hover, hover de `.carrete-github`) y los literales `rgb(255 122 26 / α)` de `.eva-glass` (0.35), `.eva-panel` (0.4) y la grilla hexagonal (0.12). Es el color de la barra, el enlace activo, todos los CTA, las etiquetas de panel, los códigos de sección, los acentos de título y las sombras de las tarjetas.
- **Violeta** (`#8A4FD8`): solo `var(--eva-purple)` como sombra desplazada de dos CTA (hero y configurador) y de la figura del hero.
- **Verde fósforo** (`#3DFF7A`): 9 usos (estado "Operativo", línea `ok` de la ficha, prompt y cursor de testimonios, disponibilidad en "Quién soy", éxito y paso hecho del configurador, badge `live`) y `--eva-focus`.
- **Carrete 3D**: el shader (`src/three/carreteEscena.js`) no usa acentos. Mezcla la textura con el color de panel. Las texturas son capturas de los proyectos. Lo único con acento está en el DOM (`03 //`, "Ver proyecto", "GitHub") y en el CSS del carrete.
- **Tests con el naranja fijo**: `contrast`, `sistema-visual` (`--eva-focus: theme('colors.eva.green')`), `eva-glass` (grilla y estrés naranja), `hero` (pares, regex del alpha `255 122 26`), `site-nav` (naranja sobre la barra), `site-nav-classes`, `stack-neumorfico` (borde hundido `--eva-orange`), `contacto` y `configurador-estilo` (clases de seleccionado/indicador/foco, `alphasReales` con `bg-eva-orange/NN` y `255 122 26`).
- **Rojo de alerta** (`#E8202A`): solo en el configurador. Marca `ERR` (`bg-eva-red text-eva-black`) y borde del campo con error en `FormStep`/`estilos.js` (`claseCampo`), y `.eva-stripes-red` en `ErrorStep`. Como texto normal da 4.53 sobre negro y 4.28 sobre panel, así que hoy solo vale para texto grande. `SuccessStep` usa el verde fósforo (`■ Transmisión OK`), y la etiqueta de los paneles de éxito y de error es la naranja de siempre.
- **Restricción de los guards actuales**: `hero`, `contacto` y `configurador-estilo` prohíben `text-eva-purple`, porque el violeta viejo no llega a 4.5:1.

Gobernanza **MEDIUM**: el cambio se ve en todo el sitio. Lleva checkpoints de capturas antes→después (tareas 1.3 y 9.x), y las decisiones de color no obvias se muestran al usuario antes del commit.

## Goals / Non-Goals

**Goals:**

- Jerarquía violeta > naranja > verde agua, **visible** (proporción de área) y **verificable** (test de jerarquía).
- Todos los pares declarados conformes con WCAG 2.2 AA, incluidos los fondos compuestos (cristal, grilla, barra translúcida, tarjeta seleccionada).
- La jerarquía vive en un solo lugar (`EVA_ROLES`). Cambiar el color de un rol no obliga a tocar componentes.

**Non-Goals:**

- Cambiar la forma, el layout, los textos o la tipografía de cualquier sección.
- Tocar el PDF del presupuesto, `favicon.svg`, `og-image.png` ni `screenshot.png`.
- Un modo claro.

## Decisions

### D1. Paleta: dos violetas, naranja sin cambios, verde agua

| Token | Hex | Rol | Uso permitido |
|---|---|---|---|
| `violet` | `#9B5CF0` | `primary` | Rellenos (CTA, enlace activo, etiqueta de panel, paso actual), bordes de componente (UI ≥ 3:1), texto grande. **No** como texto chico. |
| `violet-light` | `#B08AFF` | `primary-light` | Texto de acento (códigos, eyebrows, acentos de título, enlaces de texto, iniciales, iconos finos). |
| `orange` | `#FF7A1A` | `secondary` | Sombras sólidas desplazadas, hover/foco de contorno, franjas de advertencia, detalles que acompañan al violeta. Texto permitido. |
| `aqua` | `#74F8D4` | `tertiary` y `focus` | Estados OK, punto de estado, prompts, badge `live`, paso hecho, anillo de foco. |
| `sky` | `#7CC8FF` | `success` (estado, fuera de la jerarquía) | Aviso de envío verificado del configurador. Texto normal permitido. Ver D10. |
| `red-light` | `#FF8A9A` | `error` (estado, fuera de la jerarquía) | Errores del configurador: marca `ERR`, borde y mensaje del campo, aviso de envío fallido. Texto normal permitido. Ver D10. |
| ~~`red`~~ `#E8202A` | — | — | **Sale**: lo reemplaza `red-light`. |
| ~~`purple`~~ `#8A4FD8` | — | — | **Sale**: lo reemplaza `violet`. |
| ~~`green`~~ `#3DFF7A` | — | — | **Sale**: lo reemplaza `aqua`. |

Por qué estos valores:

- **`#9B5CF0` como violeta sólido.** Es el violeta más saturado y oscuro que todavía admite **texto negro encima con ≥ 4.5:1** (5.03). El `#8A4FD8` actual da 4.06 con negro y 4.03 con papel, así que no sirve para un CTA con texto chico. Los violetas más profundos que admiten papel encima (`#6D28D9`: 5.71) caen a 2.86 contra el negro: un CTA así se pierde en el fondo y su borde no llega a 3:1 (1.4.11). El texto negro sobre violeta, además, es coherente con el resto del sistema: negro sobre naranja, negro sobre rojo.
- **`#B08AFF` como violeta claro.** Texto ≥ 4.5:1 en **todos** los fondos, incluidos los compuestos: 7.69 sobre negro, 5.65 sobre línea y 4.83 en el peor caso (cristal sobre estrés naranja). Se descartaron `#A880FF`, que cae a 4.38 en el estrés del cristal, y los lilas más claros (`#C3A3FF`), que se acercan al papel y pierden el carácter violeta.
- **Naranja sin cambios y sin naranja claro.** `#FF7A1A` ya pasa como texto (7.81) y bajo texto negro (7.81). Un `orange-light` (`#FFB27A`: 11.55) sería **más luminoso** que el violeta claro y le ganaría la atención, justo lo contrario de lo pedido. El "naranja clarito" del pedido queda cubierto por el mismo naranja usado en áreas chicas.
- **Verde agua `#74F8D4` en lugar del fósforo `#3DFF7A`.** Tono ~165° (el fósforo está en ~138°): se separa claramente del naranja y del violeta, se lee como "detalle de instrumento" y no como neón, y conserva el guiño a la Unidad 01 (violeta, verde y naranja). Se eligió el más oscuro de la familia que llega a **≥ 3:1 contra el relleno violeta** (3.11), por el foco (D3). `#5EF2C8` da 2.89 y no alcanza.

### D2. Roles semánticos: los componentes nombran el rol, nunca el color

```js
// src/styles/eva-tokens.js
export const EVA_COLORS = { black, panel, line, paper, gray, 'gray-dim', violet, 'violet-light', orange, aqua, sky, 'red-light' }
export const EVA_ROLES = { primary: 'violet', 'primary-light': 'violet-light', secondary: 'orange', tertiary: 'aqua', focus: 'aqua' }
export const EVA_STATUS_ROLES = { success: 'sky', error: 'red-light' } // semánticos, fuera de la jerarquía
export const EVA_THEME_COLORS = { ...neutros, ...roles y roles de estado resueltos a hex } // lo consume tailwind.config.js
```

- `tailwind.config.js` expone en `colors.eva` **solo** neutros, roles y roles de estado: `eva-primary`, `eva-primary-light`, `eva-secondary`, `eva-tertiary`, `eva-focus`, `eva-success` y `eva-error`. Los nombres `violet`/`orange`/`aqua`/`sky`/`red-light` no generan clases. Así, el uso de un nombre de color en un componente queda sin estilo, y además lo frena el guard (D6).
- `src/index.css` `:root`: `--eva-primary`, `--eva-primary-light`, `--eva-secondary`, `--eva-tertiary`, `--eva-focus`, `--eva-success` y `--eva-error`, todas con `theme('colors.eva.<rol>')`. Salen `--eva-orange`, `--eva-purple`, `--eva-green` y `--eva-red`.
- Los literales `rgb(r g b / α)` de los materiales (grilla, `.eva-panel` y `.eva-glass`) se mantienen como literales porque los tests de contraste los parsean. Los tests verifican que sus canales coincidan con el hex del rol (`155 92 240` = `primary`), así que si el rol cambia, el test señala el literal.
- `EVA_CONTRAST_PAIRS` se expresa con nombres de color, porque mide la paleta. Un test aparte verifica que cada rol apunte a un color con los pares que su uso exige: `primary` con UI y negro encima, `primary-light`/`secondary`/`tertiary` con texto normal, `focus` con UI contra negro, panel, línea y `primary`, y `success`/`error` con texto normal sobre negro, panel y línea, y negro encima.

Alternativa descartada: dejar los nombres de color en los componentes y solo cambiar valores (`orange` → violeta). Es mentir con los nombres, y la próxima vez que se reordene la jerarquía habría que tocar 17 archivos. Otra descartada: clases utilitarias propias (`.eva-accent-1`). Duplican lo que Tailwind ya hace con `colors` y pierden los modificadores (`/10`, `hover:`).

### D3. Foco: verde agua, no violeta claro

El foco es un indicador funcional (2.4.7 / 1.4.11): tiene que distinguirse de **lo que lo rodea**, y en este sitio lo que lo rodea pasa a ser violeta.

| Opción | vs negro | vs panel | vs relleno violeta | vs violeta claro | Veredicto |
|---|---|---|---|---|---|
| Violeta claro `#B08AFF` | 7.69 | 7.26 | **1.52** | 1 | Descartada: alrededor de un CTA violeta, o junto a bordes violeta, el contorno se funde |
| Naranja `#FF7A1A` | 7.81 | 7.38 | 1.55 | — | Descartada: se confunde con el hover (secundario) |
| **Verde agua `#74F8D4`** | **15.64** | **14.78** | **3.11** | 2.03 | **Elegida**: es el único tono que no compite con el primario ni con el hover, y cumple ≥ 3:1 incluso contra el relleno violeta |

El contorno mantiene `outline: 2px solid var(--eva-focus); outline-offset: 2px`. Que sea el color del rol terciario es una excepción explícita (`focus` es un rol propio en `EVA_ROLES`, aunque comparta valor), así que se puede separar más adelante sin tocar componentes.

### D4. Regla de mapeo y tabla por componente

Regla, en orden de prioridad:

1. **Primario (`primary`)**: estructura y estado. Bordes principales de barra, sección y panel; `.eva-panel`/`.eva-glass`; fondo de `.eva-panel-label`; enlace activo; CTA principal (relleno); seleccionado y paso actual; grilla hexagonal; selección de texto; skip link.
2. **Primario claro (`primary-light`)**: texto de acento. Eyebrows y códigos de sección (`//02`, `01 //`, `03 //`), acentos de título ("Chacón", "juntos?"), números de la barra, enlaces de texto, iniciales y flechas, CTA de contorno.
3. **Secundario (`secondary`)**: acompañamiento. **Todas** las sombras sólidas desplazadas (violeta + sombra naranja), hover y foco de contorno (borde, texto, relleno de inversión), franjas `.eva-stripes` (advertencia), iconos de servicio, estrellas, asterisco de obligatorio, badge `demo`, la nota de los extras y el código de la marca.
4. **Terciario (`tertiary`)**: detalle de estado. "Operativo" y su punto, valores `ok`, prompt `>` y cursor, disponibilidad, paso hecho, éxito, badge `live`, foco.

| Componente | Primario / primario claro | Secundario (naranja) | Terciario (agua) |
|---|---|---|---|
| `SiteNav` | Borde inferior de la barra y del menú móvil; enlace activo `bg-eva-primary text-eva-black`; números inactivos `text-eva-primary-light`; CTA "Configurador" `border-eva-primary text-eva-primary-light`, hover `bg-eva-primary text-eva-black`; botón del menú móvil; skip link `focus:bg-eva-primary` | `hardHover`: sombra `var(--eva-secondary)`; franja móvil `.eva-stripes` | — |
| `NavBrand` | — | Código `//00` `text-eva-secondary` (acompaña al borde violeta) | — |
| `Hero` | Eyebrow; apellido "Chacón" `text-eva-primary-light`; CTA principal `border/bg-eva-primary text-eva-black`; borde de la figura; `.eva-panel` + etiquetas; grilla; franja inferior ancha `.eva-stripes-primary` | Sombra del CTA y de la figura `var(--eva-secondary)` (antes `--eva-purple`); hover de los enlaces secundarios; franja vertical de la figura | Valor `ok` de la ficha |
| `About` | `//02`; resaltado del stack `text-eva-primary-light`; `.eva-glass` + etiquetas; grilla | Iconos de servicio `text-eva-secondary`; franja del encabezado | Línea de disponibilidad |
| `Stack` | Eyebrow; inicial del módulo `text-eva-primary-light`; etiqueta del panel | Borde hundido del hover `.eva-neu-module:hover` (`--eva-secondary`, la spec de Stack ya dice naranja); franja del encabezado | — |
| `Projects` / `Carrete3D` | Eyebrow; `03 //`; subrayado de "Ver proyecto" (`.carrete-enlace` `border-bottom: var(--eva-primary)`); grilla | Hover de "Ver proyecto" (`bg` secundario + negro) y de "GitHub"; franjas | — |
| `ProyectoCard` | `.eva-panel` | Sombra desplazada `theme(colors.eva.secondary)`, hover/`focus-within` de borde y sombra; badge `demo`; hover del título y del enlace secundario; franja `inprogress` | Badge `live` |
| `ProyectosCierre` | `.eva-panel` + etiqueta; CTA principal `bg/border-eva-primary text-eva-black` | Hover del CTA de contorno (`bg-eva-secondary text-eva-black`); franja inferior | — |
| `Testimonials` | `//RX`; iniciales `text-eva-primary-light`; `.eva-glass` + etiquetas; grilla | Estrellas llenas; franja del encabezado | Prompt `>` y cursor |
| `Contact` | Borde superior de la sección; eyebrow; "juntos?"; flechas de las tarjetas y rótulo "ABRIR" `text-eva-primary-light`; `.eva-panel` + etiqueta; franja superior ancha `.eva-stripes-primary` | Hover/foco de la tarjeta (borde, sombra, relleno del rótulo); `MapPin`; franjas finas | "Operativo" + punto |
| `Configurador.jsx` (página) | Borde de la cabecera; "Volver al inicio" `border-eva-primary text-eva-primary-light`, hover `bg-eva-primary`; eyebrow; etiqueta; skip link | Sombra de hover del enlace; franjas | — |
| `configurador/estilos.js` | `BOTON_PRIMARIO` `border/bg-eva-primary text-eva-black`; paso actual; módulo seleccionado `border-eva-primary bg-eva-primary/10`; indicador seleccionado; foco del input `focus:border-eva-primary` | Sombra de `BOTON_PRIMARIO` y del módulo seleccionado `var(--eva-secondary)`; hover de `BOTON_SECUNDARIO`/`BOTON_EDITAR` y de módulos no seleccionados | Paso hecho `border/text-eva-tertiary` |
| `ServiceCards` / `ExtrasCards` / `FormStep` / `QuantityControl` / `ReviewStep` | Servicio seleccionado `border-eva-primary text-eva-primary-light`; enlace de edición en revisión `text-eva-primary-light` | Nota de extras `border-l-4 border-eva-secondary`; asterisco de obligatorio; hover de cantidad | — (los errores de `FormStep` van a `error`: D10) |
| `SuccessStep` (estado `success`, fuera de la jerarquía) | — | — | — (pasa a `success`: ver D10) |
| `ErrorStep` / `FormStep` / `claseCampo` (estado `error`) | — | — | — (pasa a `error`: ver D10) |
| `index.css` (materiales y base) | `.eva-panel-label` fondo; `.eva-panel` borde `rgb(155 92 240 / 0.55)`; `.eva-glass` borde `/ 0.45`; grilla `--eva-hex-color` `/ 0.14`; `::selection` `var(--eva-primary)` + negro; scrollbar hover `var(--eva-primary)`; `.eva-stripes-primary` (nuevo) | `.eva-stripes` (por defecto); hover de `.eva-neu-module`, `.carrete-enlace` y `.carrete-github` | `--eva-focus` |
| `App.jsx` (`LoadingFallback`) | Aro `border-t-eva-primary` (violeta sobre línea: 3.69 ≥ 3) | — | — |

Los alphas de los bordes suben porque el violeta es más oscuro que el naranja. Se igualó el peso visual medido como contraste contra el panel: naranja 0.4 → 2.09 y violeta 0.55 → 2.20; naranja 0.35 → 1.87 y violeta 0.45 → 1.85. La grilla pasa de 0.12 a 0.14. Siguen siendo **decorativos**: los bordes que comunican estado usan el violeta sólido.

`.eva-stripes-primary` es un modificador del mismo tipo que `.eva-stripes-red` (`--eva-stripe-a: var(--eva-primary)`). Se usa solo en las dos franjas anchas de ancho completo que enmarcan secciones (base del hero y tope de contacto). Las franjas son el elemento naranja de más área, y estas dos son estructura, no advertencia.

### D5. Tabla de contraste (calculada con `scripts/lib/contrast.mjs`, truncada a 2 decimales)

Texto y componentes sobre fondos planos:

| fg \ bg | black `#050505` | panel `#100E0C` | line `#2B2620` |
|---|---|---|---|
| paper | 16.39 | 15.49 | 12.05 |
| gray | 7.47 | 7.06 | 5.49 |
| **violet** (UI / grande) | 5.03 | 4.75 | 3.69 |
| **violet-light** | 7.69 | 7.26 | 5.65 |
| **orange** | 7.81 | 7.38 | 5.74 |
| **aqua** | 15.64 | 14.78 | 11.50 |
| **sky** (`success`) | 11.22 | 10.60 | 8.25 |
| **red-light** (`error`) | 9.07 | 8.58 | 6.67 |
| ~~red~~ (sale; solo valía grande) | 4.53 | 4.28 | 3.33 |
| gray-dim (UI) | 3.53 | 3.33 | 2.59 (no declarado) |

Texto sobre rellenos: negro sobre `violet` **5.03**, sobre `violet-light` 7.69, sobre `orange` 7.81, sobre `aqua` 15.64, sobre `sky` 11.22 y sobre `red-light` 9.07. Papel sobre `violet` da 3.25 (solo grande, no se usa).

Foco `aqua`: 15.64 (negro), 14.78 (panel), 11.50 (línea), **3.11 (violet)**, 4.43 (gray-dim). El foco no tiene que contrastar con el borde rojo claro de un campo con error, porque el `outline-offset: 2px` lo separa con el fondo de por medio (negro o panel).

Fondos compuestos (`blendOver`):

| Fondo | Hex | paper | gray | violet-light | orange | aqua | gray-dim |
|---|---|---|---|---|---|---|---|
| Grilla violeta α 0.14 sobre negro | `#1a1126` | 14.66 | 6.68 | 6.87 | 6.98 | 13.99 | 3.15 |
| Cristal (panel 0.8 + brillo 0.04) sobre grilla | `#1b1819` | 14.17 | 6.46 | 6.65 | 6.75 | 13.53 | 3.05 |
| Cristal sobre estrés violeta sólido | `#342640` | 11.28 | 5.14 | 5.29 | 5.37 | 10.76 | — |
| Cristal sobre estrés naranja sólido | `#472c17` | 10.29 | 4.69 | 4.83 | 4.90 | 9.82 | — |
| Módulo seleccionado (`primary/10` sobre panel) | `#1e1623` | 14.14 | 6.45 | 6.63 | 6.74 | 13.49 | 3.04 |
| Barra, peor caso (negro 0.85 sobre blanco) | `#2b2b2b` | 11.38 | 5.19 | 5.34 | 5.42 | 10.86 | — |
| Stack hundido (luz interior 0.04) | `#0e0e0d` | 15.53 | 7.08 | 7.28 | 7.40 | 14.82 | 3.34 |

Estados sobre fondos compuestos: `red-light` sobre el cristal en estrés naranja da 5.45 y `sky` 7.04. El papel sobre un tinte `red-light`/`sky` al 10 % sobre el panel da 13.48/13.09 (por si el apply tiñe el panel del aviso).

Bordes decorativos contra el panel: `.eva-panel` (violeta 0.55) 2.20 y `.eva-glass` (0.45) 1.85. No son componentes de UI, igual que hoy.

Protecciones (triangulación): con la barra en α 0.72, el violeta claro cae a 3.29 (< 4.5), y con la grilla en α 0.6 el gris cae a 3.09. Esos casos fallan a propósito en los tests.

### D6. Test de jerarquía y guard de roles

Módulo puro `scripts/lib/color-roles.mjs`:

- `findAccentColorNames(source)`: detecta nombres de color de acento en lugar de roles (`eva-(violet|violet-light|orange|aqua|purple|green)` con cualquier prefijo de utilidad o variante, `--eva-(orange|purple|green|violet|aqua)`, `colors.eva.(orange|…)`) y los hex retirados `#8A4FD8`/`#3DFF7A`. Debe detectar `hover:border-eva-orange`, `shadow-[4px_4px_0_0_var(--eva-orange)]`, `theme(colors.eva.orange)` y `text-eva-green`. No debe detectar `eva-primary-light`, `eva-panel` ni `eva-stripes-red`.
- `countRoleUses(source, { componentClasses })` devuelve `{ primary, secondary, tertiary }`, con este criterio:
  - **Uso** = un token de clase que contiene `eva-<rol>` o `--eva-<rol>` (`primary-light` cuenta como `primary`). `focus`, `success` y `error` **no cuentan**: son funcionales o semánticos y quedan fuera de la jerarquía, como pidió el usuario.
  - **Solo en reposo**: si el token lleva una variante (`hover:`, `focus:`, `focus-visible:`, `focus-within:`, `group-hover:`, `group-focus-visible:`, `active:`, `disabled:`), no cuenta. Lo que manda en la percepción es la página quieta. El hover naranja es transitorio y está bien que sea frecuente.
  - **Clases de componente**: `componentClasses` asigna rol a las clases de `index.css`: `eva-panel`, `eva-glass`, `eva-panel-label`, `eva-hex-grid` y `eva-stripes-primary` → `primary`; `eva-stripes` → `secondary` (salvo que el mismo `className` tenga `eva-stripes-primary` o `eva-stripes-red`). Las variantes de estado (`eva-panel-label-success`, `eva-panel-label-error`, `eva-stripes-error`) no cuentan, y cuando aparecen en el mismo `className` anulan el conteo de la clase base (`eva-panel-label`, `eva-stripes`). Un test valida esa tabla contra `index.css`: la regla de cada clase tiene que nombrar `--eva-<rol>` o el literal rgb del rol.
- Test de archivos (`scripts/jerarquia-color.test.mjs`) sobre `src/components/**`, `src/pages/**` y `src/App.jsx`:
  1. `findAccentColorNames` = `[]`, y también en `src/index.css` fuera de `:root`. Si falla, el mensaje lista archivo y token. La función también detecta `eva-(sky|red-light|red)` y `#E8202A`.
  1b. `findStatusOutsideConfigurador(files)`: `eva-success`/`eva-error` (y sus variantes de etiqueta y franja) solo pueden aparecer en `src/components/configurador/**`, `src/pages/Configurador.jsx` y la definición en `index.css`. Así un color de estado no se usa como decoración en la home.
  2. `primary > secondary > tertiary ≥ 1` y `primary ≥ 1.5 × secondary`. Con la tabla de D4, la estimación es ~70 : ~21 : ~11.
  3. Triangulación con fixtures: un fixture con más naranja que violeta falla, uno con usos solo en `hover:` no cuenta, y uno sin terciario falla.

Por qué un conteo y no algo más fino: es determinista, corre en `npm test` sin navegador y el mensaje se entiende ("primario 18, secundario 25"). Su límite es que cuenta usos, no área: un relleno de CTA vale lo mismo que un borde de 1px. Por eso la verificación final (D8) **mide el área en píxeles** sobre las capturas, como evidencia para el checkpoint, sin bloquear CI. El umbral 1.5× deja margen para que un ajuste chico no lo rompa, pero no permite un empate.

Alternativas descartadas: medir el área por píxeles en CI (lento, depende del navegador, del viewport y de las imágenes de los proyectos) y no tener test (la jerarquía volvería a degradarse en el próximo change).

### D7. Tests existentes: qué cambia en cada uno (RED primero)

| Test | Cambio |
|---|---|
| `contrast.test.mjs` | Pares nuevos (D5); `focus` (`aqua`) ≥ 3 contra negro, panel, línea y `violet`; `violet` restringido a UI/grande con texto negro encima; desaparecen `purple`/`green` |
| `sistema-visual.test.mjs` | `--eva-focus: theme('colors.eva.focus')`; variables `--eva-<rol>`; `colors.eva` expone exactamente neutros + `red` + roles; `::selection` usa `--eva-primary` con negro (5.03) |
| `eva-glass.test.mjs` | `TEXT_TOKENS` = paper, gray, violet-light, orange, aqua; grilla con el hex de `primary`; estrés violeta y naranja; borde de `.eva-glass` con los canales de `primary` |
| `hero.test.mjs` | Pares (violet-light, aqua, negro sobre violet); regex del alpha de la grilla con `155 92 240`; la regla "texto eva-red/purple/gray-dim" pasa a "texto eva-red/primary/gray-dim" (el violeta sólido no es texto chico); fixtures `ok` con clases de rol |
| `hero.test.mjs` y `contacto.test.mjs` (regla de texto) | La regla "texto eva-red/…" deja de nombrar `red` (ya no existe). El uso de los roles de estado fuera del configurador lo cubre la regla 1b de D6 |
| `site-nav.test.mjs` | Textos sobre la barra: `violet-light`, paper y gray; protección α 0.72 con `violet-light` |
| `site-nav-classes.test.mjs` | Ejemplos y clases esperadas con roles (`border-eva-primary`, `bg-eva-primary`) |
| `stack-neumorfico.test.mjs` | Texto `violet-light` en reposo y hundido; el borde hundido sigue `orange` vía `var(--eva-secondary)` |
| `contacto.test.mjs` | Pares y fixtures con roles; `aqua` para el estado; el "purple no llega a 4.5" pasa a "`violet` no se declara como texto normal sobre línea" |
| `configurador-estilo.test.mjs` | `claseModulo`/`claseIndicador`/`clasePaso`/foco de input con roles; `claseCampo(true)` → `border-eva-error focus:border-eva-error`; pares `red`/`black sobre red` → `red-light`/`sky` (normal) y negro sobre ambos; guard de `ErrorStep`/`SuccessStep`/`FormStep` (D10); `alphasReales` lee `bg-eva-primary/NN` y `155 92 240`; pares y mezclas con `violet-light` |
| `proyectos-guard`, `acerca-testimonios-classes`, `stack-classes`, `a11y-classes` | Se revisan: si fijan una clase `eva-orange`/`eva-green` en un fixture o una lista de esperadas, pasan a rol |

### D8. Verificación final (Playwright)

Sobre `npm run build && npm run preview`, con el mock de `script.google.com` y la CSP real de `vercel.json` inyectada (igual que en `limpieza-cyberpunk` D7):

- `/` y `/configurador/` en 1440×900 y 375×812: capturas **antes** (tarea 1.3, sobre el estado de partida) y **después**, por sección (incluido el carrete) y por paso del configurador (con un módulo seleccionado, el paso actual, uno hecho y el éxito).
- **Proporción de área**: un `page.evaluate` o un script sobre las capturas cuenta los píxeles cuya distancia (ΔE aproximada en sRGB) al violeta (sólido o claro), al naranja o al agua queda por debajo de un umbral, sin contar la zona del lienzo del carrete. Se informa el % por rol. Para el checkpoint, el objetivo es violeta > naranja > agua en las cuatro vistas.
- **Contraste medido**: `getComputedStyle` de muestras (enlace activo, CTA, eyebrow, código, estado "Operativo", texto sobre cristal) → `contrastRatio` contra el fondo resuelto, con los mismos umbrales.
- **Estados del envío**: en `/configurador/`, `page.route('https://script.google.com/**')` responde éxito en una corrida y error (HTTP 500 o red caída con `route.abort()`) en otra. En cada caso: captura a 1440 y 375; `getComputedStyle` de la línea de aviso y de la etiqueta del panel (celeste en el éxito, rojo claro en el error) con `contrastRatio` ≥ 4.5 contra el fondo resuelto; y el texto del título y la marca o icono presentes (con colores forzados o en escala de grises, el estado se sigue entendiendo). También se fuerza un error de validación en el formulario (enviar vacío) y se mide la marca `ERR`, el borde (≥ 3:1) y el mensaje (≥ 4.5:1).
- **Foco**: Tab sobre el CTA del hero, el enlace activo y un módulo seleccionado, con captura del contorno verde agua.
- **Consola**: 0 errores y 0 `securitypolicyviolation`.

### D10. Colores de estado del configurador: celeste para éxito, rojo claro para error

Pedido del usuario: el aviso de envío **exitoso y verificado** en **celeste** y todo lo que esté **mal** (error de envío, errores de campo, marca `ERR`, mensajes) en **rojo claro**. Son colores **semánticos**: no forman parte de la jerarquía violeta > naranja > agua y el test de jerarquía no los cuenta (D6).

| Rol | Token | Hex | sobre negro | sobre panel | sobre línea | negro encima | Por qué este valor |
|---|---|---|---|---|---|---|---|
| `success` | `sky` | `#7CC8FF` | 11.22 | 10.60 | 8.25 | 11.22 | Celeste (~207°), bien separado del agua (~165°) de los detalles: no se confunde con el "Operativo" de la home ni con el foco. Se descartó `#5CB8FF`, más saturado pero con menos margen sobre el cristal (5.94), y `#93D2FF`, que tira a blanco |
| `error` | `red-light` | `#FF8A9A` | 9.07 | 8.58 | 6.67 | 9.07 | Rojo claro hacia el rosado (~353°): se aleja del naranja secundario (~25°) más que un rojo puro claro (`#FF8585`, ~0°). Pasa como **texto normal**, a diferencia de `#E8202A` (4.53/4.28, solo grande) |

Aplicación (el apply puede ajustar detalles de forma, no de color):

- **`SuccessStep`**: la línea de aviso pasa de `text-eva-green` a `text-eva-success` con un icono de tilde (`aria-hidden`) en lugar de `■`. La etiqueta del panel pasa a `.eva-panel-label-success` (fondo `success`, texto negro: 11.22) y se agrega una barra superior `bg-eva-success` (`h-2`, `aria-hidden`), como la franja del error. El título "¡Solicitud enviada!" y el cuerpo quedan en papel y gris: el texto ya dice qué pasó (no depende del color).
- **`ErrorStep`**: `.eva-stripes-red` → `.eva-stripes-error` (`--eva-stripe-a: var(--eva-error)`), la etiqueta pasa a `.eva-panel-label-error` (fondo `error`, texto negro: 9.07) y se suma una línea de aviso `text-eva-error` con un icono de alerta y el texto "■ Transmisión fallida" (o equivalente, `aria-hidden` como su par de éxito). El título "No se pudo enviar" ya lo dice en texto. El botón "Reintentar" sigue siendo `BOTON_PRIMARIO` (violeta): es la acción principal, no el estado.
- **`FormStep`**: la marca `ERR` pasa a `bg-eva-error text-eva-black` (9.07) y el mensaje a `text-eva-error` (texto normal, 9.07 sobre el fondo negro del campo y 8.58 sobre el panel). Siguen el `role="alert"`, `aria-invalid` y `aria-describedby`.
- **`claseCampo(true)`**: `border-eva-error focus:border-eva-error` (UI 8.58 sobre panel). El contorno de foco verde agua sigue apareciendo encima del estado de error.
- **`index.css`**: `.eva-panel-label-success` y `.eva-panel-label-error` (solo cambian `background-color`), y `.eva-stripes-error` reemplaza a `.eva-stripes-red`.

Ninguno de los dos depende solo del color: el éxito tiene título, texto e icono, y el error tiene título, marca `ERR`/icono y mensaje. Esto lo verifica un guard estático (`SuccessStep` contiene el título de `buildSuccessMessage` y un icono; `FieldError` contiene `ERR` y el mensaje) y la captura en escala de grises de D8.

Alternativas descartadas: verde agua para el éxito (lo pidió celeste, y además chocaría con el terciario, que es decoración de la home) y conservar `#E8202A` con un borde más grueso (no resuelve el texto normal, que el usuario pidió en rojo claro).

### D9. Orden de implementación

1. Precondición: `limpieza-cyberpunk` mergeado (`scripts/limpieza-cyberpunk.test.mjs` existe, no quedan `bg-dark` ni `accent-`). Si falta, el apply se detiene. Se re-corre el inventario con `grep` y se compara con el Context.
2. **Agregar** tokens y roles **sin quitar** los viejos (`orange`, `purple` y `green` siguen generando clases) para que nada quede sin estilo a mitad de camino.
3. Materiales de `index.css`, después la barra, las secciones y el configurador, con sus tests RED→GREEN en cada paso.
4. Recién entonces se quitan de Tailwind los nombres de color (`orange`, `purple`, `green`) y las variables viejas, y se activa el guard global con el test de jerarquía.

## Risks / Trade-offs

- [El naranja es perceptivamente más saliente que el violeta (más luminoso y cálido), así que con menos área todavía puede "ganar"] → Se limita a áreas chicas (sombras de 3–10 px, hover, franjas finas), las dos franjas anchas pasan a violeta y la medición de área de D8 lo controla. Si el naranja sigue dominando en una vista, en el checkpoint se baja algún uso a `primary-light` o se pasa la sombra de la figura del hero a `primary`.
- [Un violeta claro de texto junto a un violeta sólido de borde se puede leer como "dos colores distintos" y no como uno] → Mismo tono (~264°) y salto de luminancia acotado (1.52:1). Se verifica en las capturas.
- [Cambiar la paleta rompe en silencio las clases que siguen usando `eva-orange` cuando se quitan los nombres (Tailwind no falla el build por una clase sin regla)] → Orden de D9 (agregar → migrar → quitar), guard global de D6 y verificación de clases huérfanas de la regresión visual.
- [Los literales rgb de los materiales se desincronizan del rol] → Los tests comparan los canales con el hex del rol (D2).
- [El test de jerarquía es un proxy por conteo] → Explicado en D6. Se complementa con la medición de área de D8. Si en el futuro estorba, el umbral 1.5× es una constante con nombre.
- [`sistema-visual` todavía no está en `openspec/specs/`] → Se archiva después de `tokens-fuentes-texturas-eva`, `configurador-estilo-eva` y `limpieza-cyberpunk`. El MODIFIED copia los textos que deja `tokens-fuentes-texturas-eva` (paleta y foco). Si un change anterior los modificara antes del archive, se reconcilia en el archive.
- [El celeste de éxito y el agua de los detalles se pueden confundir] → Hay 1.39:1 de luminancia entre ellos, pero 40° de tono, y los contextos no se cruzan: los estados solo existen en el configurador (regla 1b de D6) y el éxito siempre lleva texto e icono.
- [El rojo claro se parece al naranja secundario (1.16:1 de luminancia)] → Se eligió un tono rosado (~353°). Además, el error siempre lleva marca `ERR`, icono y mensaje, y en el formulario el naranja solo marca el asterisco de obligatorio.
- [Choque con el apply de `limpieza-cyberpunk` en curso] → Este change no se aplica hasta que aquel esté mergeado (D9.1).

## Migration Plan

1. Inventario, precondición y capturas "antes" (D9.1, D8).
2. Implementación por grupos con TDD (`tasks.md`), con `npm test` y `npm run build` en verde en cada grupo y commits locales por grupo.
3. Quitar los nombres viejos y activar el guard y la jerarquía.
4. Verificación visual y checkpoint MEDIUM con el usuario (capturas y % de área).
5. Documentación (KB `09_decisiones_y_supuestos.md` y `08_arquitectura_propuesta.md`, `CHANGES.md`).
6. Sugerir `revision-independiente` antes del push, según la política del proyecto.

Rollback: revertir los commits del change. No hay estado persistente ni dependencias nuevas.
