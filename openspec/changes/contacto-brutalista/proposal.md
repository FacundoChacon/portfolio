# Proposal

## Why

La sección de contacto es el cierre de la home y el punto de conversión del portfolio, pero todavía usa la estética cyberpunk: título y subtítulo con `GlitchText` (texto que se revuelve cada pocos segundos), una línea y un velo animados en bucle (`animate-glitch-line`, `animate-glitch-slice-visual`, `md:animate-glitch-subtle`), brillos `*-glow-*` y tarjetas con hover "flotante". Además el valor de cada canal se trunca (`truncate`), así que en 375px el email no se lee completo. El rediseño Evangelion asigna a Contacto la tendencia **brutalista** (no neumorfismo: los relieves suaves no dan contraste suficiente en bordes y estados).

## What Changes

- Rediseño brutalista de `src/components/Contact.jsx`: encabezado en serif condensada pesada, franjas de advertencia, panel estático "CANAL DE COMUNICACIÓN ABIERTO" como motivo eva (sustituye al glitch), canales como bloques de borde duro con estados hover/foco/activo visibles y sin depender solo del color.
- Se conservan exactamente los canales actuales —Email (`mailto:`, con `VITE_CONTACT_EMAIL` y respaldo), GitHub y LinkedIn—, la ubicación, el texto de invitación y el pie del sitio. El valor de cada canal se muestra completo (sin truncar).
- Se quitan de `Contact.jsx`: `GlitchText`, `animate-glitch-line`, `animate-glitch-slice-visual`, `md:animate-glitch-subtle`, el `style` inline con `boxShadow`, `cyber-grid`, `text-glow-*`/`box-glow-*`, tokens `accent-*`/`dark-*`/`red-*` y `rounded*`. **No** se borran `GlitchText.jsx` ni los keyframes/clases globales: hoy `Testimonials.jsx` los usa (`acerca-testimonios-glass`, en paralelo, también deja de usarlos) y su borrado es de `limpieza-cyberpunk`.
- Datos y lógica de enlaces en `src/data/contacto.js` (puro): resolución del email configurado, lista de canales, propiedades de enlace interno/externo y códigos `CH-0X`.
- Aparición al entrar en pantalla con `useReveal` + `.eva-reveal` (ya respeta movimiento reducido); sin animaciones en bucle.
- Guards estáticos, tests de datos y de contraste nuevos (`node --test`); `Contact.jsx` se suma a `scripts/a11y-classes.test.mjs`.

## Capabilities

### New Capabilities
- `seccion-de-contacto`: canales de contacto de la home, su accesibilidad y estados visibles, el motivo visual estático y el movimiento de la sección.

### Modified Capabilities
Ninguna.
- `texto-animado` **no cambia**: especifica el comportamiento del componente de texto con efecto glitch (texto estable para lectores, movimiento reducido), no en qué secciones se usa. Tras este change el componente sigue existiendo en el repo (y en uso en Testimonios hasta que se aplique `acerca-testimonios-glass`, que también lo retira); mientras exista, sus requisitos siguen siendo verdaderos y verificables. Aunque ambos changes dejen el componente sin usos, el delta `REMOVED` corresponde a `limpieza-cyberpunk`, que es el change que borra el archivo y sus keyframes: retirar la spec antes dejaría código sin contrato.
- `navegacion-del-sitio` no cambia: el ancla `#contacto` y los enlaces "Contáctame"/"Hablemos" siguen apuntando a la sección.

## Impact

- Código: `src/components/Contact.jsx` (reescritura visual), `src/data/contacto.js` (nuevo), `scripts/lib/class-guard.mjs` (helper compartido con `hero-brutalista`; lo crea el primero que se aplique).
- Tests: `scripts/contacto.test.mjs` (nuevo: datos, guard de clases, contraste), `scripts/a11y-classes.test.mjs` (lista de archivos). El test existente `scripts/contact.test.mjs` (WhatsApp del configurador) no se toca.
- Sin dependencias npm nuevas, sin cambios de CSP (se elimina un `style` inline, nada se agrega), sin cambios de rutas.
- Dependencias: `tokens-fuentes-texturas-eva` aplicado; convive con `navbar-brutalista-glass` (`scroll-padding-top` cubre el ancla `#contacto`). Independiente de `hero-brutalista` salvo el helper de guards.
