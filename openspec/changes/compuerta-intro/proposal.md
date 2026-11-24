# Proposal

## Why

El glifo de marca (change `logo-eva`) hoy solo aparece chico en la barra, el favicon y la imagen para compartir. Se dejó afuera del hero a propósito. Ahora el usuario pide que el logo tenga su momento propio al entrar al sitio: una compuerta que tapa la pantalla con la junta horizontal y el símbolo en el medio, "FACU CODE" debajo, y que al final se abra. Lo pidió así:

```
------------ símbolo --------------
            FACU CODE
```

Es una intro separada del hero, en una capa encima de la página real. No reemplaza la entrada escrita del hero (`hero-escritura`): la precede, y la escritura arranca cuando la compuerta termina de abrirse.

## What Changes

- **Compuerta de entrada (nueva).** Al entrar a la home se ve una compuerta de dos hojas que cubre la pantalla:
  - La junta es una línea horizontal en el centro, hecha con franjas de peligro y cortada por el glifo completo (el mismo de `src/data/logo.js`, con sus tres capas sombra, filo y relleno).
  - "FACU CODE" va justo debajo del símbolo, impreso en la hoja inferior.
- **Secuencia de ~2 s** (constantes ajustables):
  1. La junta se traza desde el símbolo hacia los bordes. Después aparece el símbolo y después "FACU CODE".
  2. Pausa breve de lectura.
  3. El símbolo se recoge hacia la junta, como un cerrojo que se suelta.
  4. La hoja superior sube y la inferior baja, como una compuerta blindada. "FACU CODE" se va con la hoja inferior.
- **Saltable al instante.** Un clic o un toque, cualquier tecla, la rueda del mouse o un gesto de desplazamiento táctil abren la compuerta en el mismo cuadro, sin activar lo que hay debajo.
- **Una vez por sesión de navegador**, con un flag en `sessionStorage`. Recargar o navegar dentro de la pestaña no la repite. Una pestaña nueva es una sesión nueva: así funciona `sessionStorage` y lo aceptó el usuario. Si el almacenamiento falla, la compuerta no se muestra: sin poder recordarla, se repetiría en cada recarga.
- **Cuándo no se muestra:**
  - Con movimiento reducido. Si la preferencia se activa durante la intro, la compuerta se abre al instante.
  - Al entrar por un ancla (`/#proyectos`), porque el visitante vino a una sección concreta.
  - Al entrar por `/configurador`, ni aunque después se navegue a la home sin recargar.
- **Hero después de la compuerta.** La entrada escrita del hero (~3,2 s) empieza cuando las hojas terminan de abrirse, no detrás de ellas. La tecla que abre la compuerta no completa la escritura.
- **Sin costo para la página real:**
  - La compuerta es una capa fija y la página se renderiza debajo desde el primer cuadro. No bloquea el render.
  - El desplazamiento se bloquea solo mientras está cerrada y sin mover el layout (CLS ≤ 0,1).
  - El LCP de escritorio y de móvil queda dentro de los límites vigentes de `seccion-de-presentacion` (design D5, con un spike que lo mide antes de integrar).
  - La compuerta es decorativa (`aria-hidden`), no recibe foco y no atrapa el foco.
  - Sin JavaScript no hay compuerta: el sitio es CSR y la compuerta la renderiza React.
  - Sin scripts ni estilos inline (CSP intacta) y sin dependencias nuevas.

## Capabilities

### New Capabilities

- `compuerta-de-entrada`: la intro de la home con el glifo. Cubre la composición, la secuencia y su duración, la frecuencia por sesión, los casos en que no se muestra (movimiento reducido, ancla, otra ruta de entrada, almacenamiento no disponible), el salto inmediato, la accesibilidad y el bloqueo de desplazamiento, y que la intro no le cueste carga, estabilidad ni seguridad a la página real.

### Modified Capabilities

- `seccion-de-presentacion`:
  - "Movimiento de entrada según preferencia": la duración de la entrada escrita se mide desde que empieza, sea el primer render o el final de la compuerta.
  - "Entrada escrita una sola vez y sin bloquear": se agregan escenarios para que la escritura no avance con la compuerta cerrada, arranque al abrirse y no se complete con la tecla que abrió la compuerta.
  - "Carga prioritaria del retrato": las métricas también se miden en la primera visita de la sesión, con la compuerta.
- `logotipo`: "Geometría única del glifo" suma la compuerta de entrada a los lugares que obtienen su forma de la definición única.

## Impact

- **Código**:
  - Nuevo `src/utils/compuerta.js`: funciones puras para la línea de tiempo y las fases, la decisión de mostrar, el flag de sesión con almacenamiento inyectable y la transición al saltar.
  - Nuevo `src/hooks/useCompuerta.js`: rAF, listeners de salto, bloqueo de desplazamiento y proveedor de contexto.
  - Nuevo `src/components/CompuertaIntro.jsx`: hojas, junta, `LogoEva` completo y "FACU CODE".
  - `src/pages/Home.jsx`: monta el proveedor y la compuerta.
  - `src/components/Hero.jsx` y `src/hooks/useEscrituraHero.js`: la escritura espera a la compuerta.
  - `src/utils/escritura.js`: estado del hero según la compuerta.
  - `src/index.css` y `tailwind.config.js`: keyframes y regla de bloqueo.
- **Tests**:
  - Nuevo `scripts/compuerta.test.mjs`, con node:test sobre las funciones puras y guards estáticos del componente, el CSS, `index.html`, la CSP y las dependencias.
  - `scripts/hero.test.mjs`: se actualiza el guard del hook.
  - Comportamiento real, métricas, cuadros PNG y video `.webm` con Playwright desde el scratchpad, nunca en el repo.
- **Sin cambios** en `index.html`, `vercel.json` (CSP), rutas, datos del perfil, geometría ni colores del logo, ni en la fuente precargada (la intro usa solo Noto Serif Display, que ya se precarga).
- **Gobernanza**: MEDIUM. Es lo primero que ve cada visitante en su primera visita de la sesión. Hay un checkpoint visual del usuario con cuadros y video antes de cerrar.
