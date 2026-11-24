# Proposal

## Why

El rediseño Eva quedó encerrado en el naranja. Hoy el naranja `#FF7A1A` es la barra, el enlace activo, los CTA, los bordes de los paneles, las etiquetas, los códigos, la grilla hexagonal, las franjas y los acentos de título. El violeta solo aparece como sombra de dos CTA y el verde fósforo en un par de estados. El dueño del sitio pidió otra jerarquía, explícita: **1.º violeta** (primario, lo que más se ve), **2.º naranja** (secundario, acompaña al violeta) y **3.º verde agua** (terciario, detalles). Conviene hacerlo ahora, cuando `limpieza-cyberpunk` deja una sola paleta (`eva`) y antes de que se sumen más secciones que repitan el naranja a mano.

## What Changes

- **Paleta (`src/styles/eva-tokens.js`)**: se agregan `violet` `#9B5CF0` (relleno, bordes, texto grande) y `violet-light` `#B08AFF` (texto y elementos finos). El verde fósforo `#3DFF7A` se reemplaza por `aqua` `#74F8D4`. El naranja `#FF7A1A` queda como está. **BREAKING (tokens)**: salen `purple` (`#8A4FD8`), `green` (`#3DFF7A`) y `red` (`#E8202A`), junto con las clases `eva-purple`/`eva-green`/`eva-red`, las variables `--eva-purple`/`--eva-green`/`--eva-red`/`--eva-orange` y la franja `.eva-stripes-red`.
- **Roles semánticos**: un mapa `EVA_ROLES` (`primary` → violet, `primary-light` → violet-light, `secondary` → orange, `tertiary` → aqua, `focus` → aqua) alimenta Tailwind (`eva-primary`, `eva-primary-light`, `eva-secondary`, `eva-tertiary`, `eva-focus`) y las variables CSS `--eva-<rol>`. La jerarquía queda definida en un solo lugar: los componentes usan **solo roles** y nunca nombres de color de acento.
- **Remapeo de usos** en todas las secciones, la barra, el configurador, el carrete 3D (DOM y CSS; el shader no usa acentos) y la base global. Primario: estructura, estado activo y CTA principal. Secundario: sombras sólidas, hover y franjas de advertencia. Terciario: estados OK, prompts y foco. La tabla por componente está en el design (D4).
- **Colores de estado del configurador (pedido del usuario, fuera de la jerarquía)**: el envío exitoso y verificado (`SuccessStep`) se avisa en **celeste** (`sky` `#7CC8FF`, rol `success`), y todo error (`ErrorStep`, la marca `ERR`, el borde y el mensaje de error de cada campo de `FormStep`) se avisa en **rojo claro** (`red-light` `#FF8A9A`, rol `error`). Los dos llegan a ≥ 4.5:1 como **texto normal** sobre los fondos oscuros. El rojo actual solo llegaba a 4.53 como texto grande, así que sale. Ninguno de los dos estados depende solo del color: siempre hay marca textual o icono y texto. Son semánticos: el test de jerarquía no los cuenta y solo se pueden usar en el configurador.
- **Foco**: pasa de verde fósforo a verde agua (`--eva-focus` → `aqua`). Alcanza ≥ 3:1 contra los fondos y también contra el relleno violeta.
- **Materiales**: la grilla hexagonal, el borde de `.eva-panel` y de `.eva-glass`, la etiqueta `.eva-panel-label`, el subrayado del carrete, la selección de texto y el spinner de carga pasan a violeta. Se suma el modificador `.eva-stripes-primary` para las dos franjas anchas que enmarcan secciones.
- **Tests**: se actualizan a la nueva paleta los guards y las tablas de contraste que hoy fijan el naranja (hero, barra, contacto, stack, cristal, configurador, sistema visual, contraste). Se suman un guard que impide usar nombres de color de acento en los componentes (y los roles de estado fuera del configurador) y un test de **jerarquía**: cuenta los usos en reposo por rol y exige primario > secundario > terciario, sin contar `success` ni `error`.
- Cierre con verificación visual en Playwright de `/` y `/configurador/` (1440 y 375 px): capturas antes→después, contraste medido, proporción de área por rol, éxito y error del envío forzados interceptando el webhook con `page.route`, y consola sin violaciones de CSP.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `sistema-visual`: se modifican "Paleta con contraste verificado" (violeta primario con dos tonos, verde agua, sin violeta ni verde viejos) y "Foco visible del sistema" (verde agua, ≥ 3:1 también contra el relleno primario). Se agrega "Jerarquía de color por roles". La capability la crean y la modifican changes sin archivar (`tokens-fuentes-texturas-eva`, `configurador-estilo-eva`, `limpieza-cyberpunk`), así que este change se archiva **después** de esos tres.
- `navegacion-del-sitio`: el enlace actual pasa a ser texto negro sobre violeta, la legibilidad de la barra se evalúa con violeta claro, papel y gris, y la cabecera del configurador lleva bordes violeta. Se modifican "Indicador de sección actual", "Legibilidad del fondo translúcido" y "Cabecera coherente en el configurador". La sombra naranja del hover se mantiene, porque es el rol secundario.
- `interfaz-del-configurador`: se agregan "Aviso de envío verificado en celeste" y "Avisos de error en rojo claro": colores semánticos de estado, contraste de texto normal y señal no cromática. Son ADDED, así que no dependen de los requisitos que `configurador-estilo-eva` todavía no archivó.
- `paneles-de-cristal`: el contraste sobre el cristal se exige para papel, gris, violeta claro, naranja y verde agua, contra la grilla violeta y contra dos fondos de estrés (violeta y naranja sólidos). Se modifica "Texto legible sobre el cristal en el peor caso".

## Impact

- **Código**: `src/styles/eva-tokens.js`, `tailwind.config.js`, `src/index.css` (variables, materiales, carrete, base global), `src/App.jsx`, todos los componentes de `src/components/` que usan acentos (SiteNav, NavBrand, Hero, About, Stack, Projects, Carrete3D, ProyectoCard, ProyectosCierre, Testimonials, Contact) y el configurador (`src/pages/Configurador.jsx`, `src/components/configurador/*`, sobre todo `estilos.js`, `SuccessStep`, `ErrorStep` y `FormStep`).
- **Tests**: `scripts/contrast.test.mjs`, `sistema-visual`, `eva-glass`, `hero`, `site-nav`, `site-nav-classes`, `stack-neumorfico`, `contacto`, `configurador-estilo`, más los guards por sección que nombren colores. Nuevo `scripts/jerarquia-color.test.mjs` con helper puro `scripts/lib/color-roles.mjs`.
- **Fuera de alcance**: el PDF del presupuesto (`src/utils/pdfDocument.js`), `favicon.svg`, `og-image.png` y `screenshot.png`, el shader y las texturas del carrete 3D (son capturas de proyectos), los textos visibles y la lógica.
- **Orden**: se aplica **después** de `limpieza-cyberpunk`, porque parte de su estado final (base global eva, sin tokens viejos, `font-sans` de sistema). Si al empezar el apply `limpieza-cyberpunk` no está mergeado, el apply se detiene.
- **Dependencias, CSP y build**: sin cambios. El CSS cambia de valores, no de tamaño de forma apreciable.
