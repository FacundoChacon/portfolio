# Proposal

## Why

En escritorio el hero tiene un hueco vacío de ~250 px debajo de "Ver proyectos | GitHub | LinkedIn". La columna derecha (retrato 4:5 desplazado 64 px hacia abajo, más la ficha apilada debajo) mide 702 px y la izquierda termina en 513 px. Eso estira la sección a 938 px en 1440×900, más alta que la pantalla. Contáctame tiene el mismo patrón invertido: el panel "COM // ENLACE" mide 406 px y los tres canales terminan en 256 px, así que quedan ~150 px vacíos debajo de los links (227 px en 1024). Además, el usuario quiere que el hero "aparezca siendo escrito": la columna izquierda de izquierda a derecha, después la tarjeta con la foto y, por último, la ficha escrita de derecha a izquierda.

## What Changes

- **Hueco del hero (escritorio y tablet, ≥ 768 px)**: la columna derecha deja de arrancar 64 px más abajo (`md:mt-16` sale) y la ficha se superpone a la parte baja del retrato (cubre ~26 % del retrato, la camisa, y no la cara) en vez de apilarse debajo. La sección deja de forzar `min-h-screen`: su alto lo da el contenido. El retrato conserva su tamaño (440×549 en escritorio) y su proporción 4:5. Medido con estilos inyectados en 1440: la sección pasa de 938 a 770 px y el hueco bajo las acciones de 253 a 85 px (lo que queda es el voladizo de la ficha). En móvil (apilado) no cambia nada.
- **Hueco de Contáctame (≥ 1024 px)**: los tres canales se estiran en filas iguales hasta el alto del panel de la izquierda (pasan de 72 a 122 px de alto en 1440), y desaparece el hueco bajo los links (de 150 a 0 px). En móvil y tablet (apilado) no cambia nada. Contáctame **no** participa de la animación de escritura.
- **Entrada "escrita" del hero** (solo sin `prefers-reduced-motion`, una vez por carga de página):
  - Fase A: el kicker, el nombre, el subtítulo y el párrafo se escriben de izquierda a derecha, en orden de lectura. Después aparecen las acciones con la entrada `eva-boot` que ya existe.
  - Fase B: aparece la tarjeta del retrato (un obturador decorativo se retira) junto con el marco de la ficha.
  - Fase C: las filas de la ficha (ROL, STACK, UBICACIÓN, ESTADO) se escriben de derecha a izquierda, etiqueta y valor, con cada carácter ya en su posición final.
  - Duración total de ~3,3 s, ajustable por constantes. Lleva un cursor sólido que no parpadea.
- **Garantías de la animación**:
  - El texto real completo está en el DOM desde el primer render.
  - Los lectores de pantalla leen el texto real (capas visuales con `aria-hidden` y copia `sr-only`).
  - El espacio final se reserva desde el inicio (CLS ≤ 0,1, medido).
  - Sin estilos inline (CSP `style-src 'self'`) y sin dependencias nuevas: CSS más un hook con `requestAnimationFrame` y helpers puros testeables.
  - Cualquier tecla o foco dentro del hero completa la animación al instante.
  - Con movimiento reducido todo está en su estado final desde el primer render.
- **Historia de `texto-animado`**: esa capability (C-11) cubría el texto con efecto *glitch*. `limpieza-cyberpunk` la retiró porque el rediseño Evangelion eliminó el glitch, no por un problema de accesibilidad o de rendimiento de los efectos de texto en general. Este change **no** la revive. La escritura no revuelve caracteres ni anima en bucle, y vive como requisito de `seccion-de-presentacion`. Hereda de `texto-animado` la regla de exponer siempre el texto real a tecnologías de asistencia y de respetar el movimiento reducido. El guard global de `sistema-visual` (sin `glitch`, `flicker` ni `scan`) sigue en pie.
- **Cambio deliberado de un requisito vigente**: `seccion-de-presentacion` hoy exige que el retrato y el nombre sean "visibles desde el primer render" y que la entrada dure ≤ 1 s. Lo pidió el usuario, así que se reemplaza por la secuencia escrita. El LCP queda protegido así:
  - En escritorio y tablet el candidato es el retrato. Se pinta desde el primer frame debajo del obturador, sin tocar la `<img>`.
  - En móvil el candidato es el párrafo. Su LCP pasa al instante en que empieza a escribirse (≤ 1 s, acotado en la spec).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `seccion-de-presentacion`:
  - Se reemplaza "Movimiento de entrada según preferencia" por la entrada escrita en tres fases, con movimiento reducido, una sola vez por carga, finalización por interacción y sin parpadeos periódicos.
  - Se modifica "Carga prioritaria del retrato": la animación no puede demorar el pintado del retrato y el LCP móvil tiene un límite explícito.
  - Se agregan dos requisitos: "Texto escrito accesible y estable" (DOM completo, lectores de pantalla, CLS, CSP) y "Columnas equilibradas en la presentación" (sin hueco bajo las acciones).
- `seccion-de-contacto`: se agrega "Columnas equilibradas en el contacto". En escritorio, los canales llegan al alto del panel y no queda espacio vacío debajo de los links.

## Impact

- **Código**:
  - `src/components/Hero.jsx`: layout, capas de escritura y obturador.
  - `src/components/Contact.jsx`: grilla de canales.
  - Nuevo `src/utils/escritura.js`: helpers puros de línea de tiempo y partición de texto.
  - Nuevo `src/hooks/useEscrituraHero.js`: hook con rAF, una sola vez por carga.
  - `src/index.css`: cursor y obturador por clases y `data-*`.
  - `tailwind.config.js`: keyframe del obturador si no alcanza `eva-boot`.
- **Tests**:
  - Nuevo `scripts/escritura.test.mjs`, con node:test sobre los helpers puros.
  - `scripts/hero.test.mjs`: se actualiza el guard "el retrato y el h1 no se animan" al nuevo contrato y se suman guards de layout, `sr-only`/`aria-hidden`, ausencia de `style=` y de dependencias nuevas.
  - `scripts/contacto.test.mjs`: guard de la grilla de canales.
- **Verificación manual medida**: Playwright sobre `npm run build` más `preview`.
  - Huecos en 375, 768, 1024, 1280, 1440 y 1920.
  - CLS y LCP en 1440 y 375.
  - Video `.webm` de la entrada en 1440 y 375.
- **Dependencias**: ninguna nueva. **Prerender**: el sitio es CSR puro. `route-html` solo reescribe metadatos y `dist/index.html` no trae el cuerpo, así que el requisito de SEO se cumple con el texto completo en el DOM desde el primer render de React, que es lo que indexa Google al renderizar.
- **Gobernanza**: MEDIUM (cambio visual visible en la primera pantalla). Hay un checkpoint con video y capturas antes de cerrar.
