# Proposal

## Why

`/configurador` es el flujo de conversión del sitio (el visitante arma su pedido y deja sus datos), pero su cuerpo sigue en la estética cyberpunk: tarjetas `glass` redondeadas, brillos `box-glow-cyan`, título con `gradient-text`, títulos en Orbitron (`font-display`) y unos 90 usos de tokens viejos (`accent-green` ×52, `dark-border` ×17, `accent-pink` ×7, `text-dark`/`bg-dark`, `text-gray-*`, `text-white`). La cabecera ya es eva (`navbar-brutalista-glass`), así que hoy la página mezcla dos sistemas visuales. Además, mientras el configurador use esos tokens, `limpieza-cyberpunk` no puede borrarlos. Es el último consumidor de la paleta vieja dentro del rediseño Evangelion.

## What Changes

- Rediseño **brutalista** del cuerpo del configurador (`src/pages/Configurador.jsx` fuera del `<header>` y todo `src/components/configurador/`): encabezado en serif condensada pesada sobre una banda con grilla hexagonal, paneles opacos `.eva-panel` con rótulos/códigos (`SYS // RESUMEN`, `REV // 01`…), botones de borde duro con sombra sólida, campos con borde duro. Sin neumorfismo ni cristal en el formulario.
- Tarjetas de tipo de sitio y de extras como **módulos** brutalistas con estado seleccionado expresado por **forma y color**: indicador cuadrado con tilde, sombra sólida desplazada y fondo teñido; nunca solo por color.
- Estados de campo y control verificables: error (borde rojo + marcador `ERR` + mensaje), deshabilitado (bloque legible, sin `opacity`), seleccionado, actual/completado/pendiente en el indicador de progreso.
- Se eliminan del configurador **todos** los usos de `accent-*`, `neon-*`, `dark-*`, `muted-*`, `box-glow-*`/`text-glow-*`/`glow-*`, `gradient-text`, `glass`, `tag` (clase vieja), `font-display` (Orbitron), `text-white`, `text-gray-*` y `rounded*`. Las clases de cadena se centralizan en un módulo puro de estilos del configurador.
- Guard estático nuevo sobre **todos** los archivos de `src/components/configurador/` y la página entera; `scripts/a11y-classes.test.mjs` se extiende (inspecciona también `.js` de la carpeta y prohíbe `disabled:opacity-*` y `text-eva-gray-dim`). Test de contraste de los pares nuevos con `scripts/lib/contrast.mjs`.
- **Sin cambios** en la lógica del wizard (`useConfigurador`, `wizard.js`, `wizardView.js`, `review.js`, `summary.js`), el webhook, las reglas anti-abuso, el honeypot, los textos visibles ni el **PDF** (se mantiene su estilo propio de documento imprimible; ver design D7).

## Capabilities

### New Capabilities
Ninguna.

### Modified Capabilities
- `interfaz-del-configurador`: se agregan requisitos de presentación —sistema visual único del wizard, estados de selección/error/deshabilitado distinguibles sin depender solo del color, contraste de esos estados y movimiento—. Todos los requisitos y escenarios existentes se mantienen sin cambios (ver design, "Escenarios vigentes").
- `sistema-visual` (creada por `tokens-fuentes-texturas-eva`, a archivar antes que este change): el requisito "Coexistencia con la paleta anterior" deja de prometer que el configurador "se ve igual que antes"; los tokens viejos siguen disponibles hasta `limpieza-cyberpunk`, pero ya no para el configurador.

No cambian: `estado-del-configurador`, `catalogo-del-configurador`, `pdf-del-presupuesto`, `webhook-integration`, `navegacion-del-sitio`.

## Impact

- Código: `src/pages/Configurador.jsx` (cuerpo, no la cabecera), `src/components/configurador/*.jsx`, nuevo `src/components/configurador/estilos.js` (clases y códigos, puro). Sin cambios en `src/index.css` (se usan utilidades eva existentes y clases Tailwind `eva-*`).
- Tests: nuevo `scripts/configurador-estilo.test.mjs` (estilos puros, guard, contraste); `scripts/a11y-classes.test.mjs` extendido; reutiliza `scripts/lib/class-guard.mjs` (lo crea el primero de `hero-brutalista`/`contacto-brutalista`/este change que se aplique, con el mismo contrato). Los tests existentes del configurador (`wizard`, `wizard-view`, `review`, `summary`, `webhook`, `pdf-generator`, `service-icons`, `site-nav-classes`) no se tocan y deben seguir en verde.
- Sin dependencias npm nuevas, sin cambios de CSP ni de rutas. Riesgo de conversión: gobernanza MEDIUM; verificación manual completa del wizard sin enviar leads reales.
- Dependencias: `tokens-fuentes-texturas-eva` y `navbar-brutalista-glass` aplicados (lo están). Precede a `limpieza-cyberpunk`.
