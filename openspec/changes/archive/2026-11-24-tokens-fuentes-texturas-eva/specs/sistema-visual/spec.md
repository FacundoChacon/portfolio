# Spec Delta

## Purpose

Define la base visual compartida por todas las secciones del sitio: paleta con contraste verificado, tipografías servidas desde el propio origen, texturas y paneles reutilizables, foco visible y respeto por la preferencia de movimiento reducido.

## ADDED Requirements

### Requirement: Paleta con contraste verificado

El sitio SHALL disponer de una paleta de tokens de color propia del sistema visual (negro, panel, línea, papel, grises, naranja, rojo, violeta y verde fósforo). Cada combinación texto/fondo que el sistema declare apta para texto normal SHALL alcanzar contraste WCAG ≥ 4.5:1; las declaradas solo para texto grande o componentes de interfaz SHALL alcanzar ≥ 3:1. Rojo y violeta SHALL usarse solo como texto grande o decoración.

#### Scenario: Par de texto normal conforme
- **WHEN** se evalúa el contraste del texto papel, gris, naranja o verde sobre el fondo negro o de panel
- **THEN** cada par alcanza al menos 4.5:1

#### Scenario: Rojo y violeta restringidos
- **WHEN** se evalúa rojo o violeta sobre el fondo de panel
- **THEN** el par queda declarado solo para texto grande o decoración y alcanza al menos 3:1

#### Scenario: Regresión de contraste
- **WHEN** un token cambia de valor y un par declarado queda por debajo de su umbral
- **THEN** la verificación automática falla nombrando el par y el contraste obtenido

### Requirement: Coexistencia con la paleta anterior

Mientras las secciones migran, los tokens de color existentes (`accent-*`, `neon-*`, `dark-*`, `muted-*`) SHALL seguir disponibles con sus valores actuales, de modo que las secciones y el configurador que aún los usan se vean igual que antes.

#### Scenario: Configurador sin cambios visuales
- **WHEN** se abre `/configurador` después de incorporar la nueva paleta
- **THEN** sus colores, bordes y estados se ven igual que antes del cambio

#### Scenario: Token anterior eliminado por error
- **WHEN** la configuración de estilos pierde un token `accent-*` o `neon-*`
- **THEN** la verificación automática falla nombrando el token faltante

### Requirement: Tipografías servidas desde el propio origen

El sitio SHALL servir todas sus tipografías desde su propio origen, sin pedir hojas de estilo ni archivos de fuente a terceros. El sistema SHALL ofrecer una serif de títulos con licencia libre capaz de mostrarse condensada y pesada, y una monoespaciada para etiquetas y códigos; las familias que el sitio todavía usa SHALL seguir aplicándose con sus pesos actuales. Solo se SHALL servir el subset latino y los pesos o rangos en uso.

#### Scenario: Sin pedidos a terceros
- **WHEN** un navegador carga la home o `/configurador`
- **THEN** ninguna petición de red va a `fonts.googleapis.com`, `fonts.gstatic.com` ni a otro origen externo de fuentes

#### Scenario: Familias actuales conservadas
- **WHEN** se carga una sección que todavía no migró al nuevo estilo
- **THEN** su texto se renderiza con la misma familia y peso que antes del cambio

#### Scenario: Título condensado disponible
- **WHEN** un elemento usa la familia de títulos con un ancho condensado y peso alto
- **THEN** se renderiza con la serif de títulos estrechada, sin síntesis de negrita ni fuente de respaldo

### Requirement: Precarga de la fuente principal

El HTML de cada página pública SHALL precargar el archivo de la fuente principal del primer render como fuente `woff2` del propio origen, con ruta absoluta y modo CORS anónimo, sin manejadores de eventos inline.

#### Scenario: Precarga presente en cada página
- **WHEN** se inspecciona el HTML servido de `/` y de `/configurador`
- **THEN** cada uno contiene una precarga `as="font"` `type="font/woff2"` con `crossorigin` cuyo `href` es una ruta absoluta a un archivo existente del propio origen

#### Scenario: Sin advertencia de precarga ociosa
- **WHEN** la home termina de cargar en un navegador real
- **THEN** la consola no advierte que la fuente precargada no se usó

### Requirement: Texturas y paneles reutilizables

El sistema SHALL ofrecer utilidades reutilizables para grilla hexagonal, franjas de advertencia, paneles de sistema con etiqueta y código, y etiquetas. Las texturas SHALL ser decorativas: no se anuncian a tecnologías asistivas, no capturan eventos de puntero y no reducen el contraste del contenido por debajo de los umbrales de la paleta.

#### Scenario: Grilla hexagonal decorativa
- **WHEN** un contenedor aplica la utilidad de grilla hexagonal y contiene texto
- **THEN** la grilla se dibuja detrás del texto, no intercepta clics y el texto mantiene el contraste de su par declarado

#### Scenario: Panel con etiqueta y código
- **WHEN** un contenedor aplica la utilidad de panel con su etiqueta y su código
- **THEN** la etiqueta y el código se muestran en tipografía monoespaciada sobre el borde del panel sin tapar el contenido

#### Scenario: Textura sin peticiones externas
- **WHEN** se usa cualquier textura del sistema
- **THEN** no genera peticiones a otros orígenes ni viola la CSP

### Requirement: Foco visible del sistema

Todo elemento interactivo SHALL mostrar, al recibir foco por teclado, un contorno visible con el color de foco del sistema, separado del elemento y con contraste ≥ 3:1 respecto de los fondos negro y de panel.

#### Scenario: Navegación con teclado
- **WHEN** el usuario recorre la home y `/configurador` con Tab
- **THEN** cada control enfocado muestra el contorno de foco del sistema

#### Scenario: Contraste del indicador
- **WHEN** se evalúa el color de foco contra los fondos negro y de panel
- **THEN** alcanza al menos 3:1 en ambos

### Requirement: Movimiento reducido

Con `prefers-reduced-motion: reduce`, el sitio SHALL desplazarse sin animación al seguir anclas y SHALL mostrar de inmediato, sin transición, el contenido de las utilidades de revelado. Sin esa preferencia, el desplazamiento por anclas SHALL ser suave y el revelado SHALL animarse al entrar en el viewport.

#### Scenario: Ancla con movimiento reducido
- **WHEN** el sistema operativo pide movimiento reducido y el usuario sigue un enlace a una sección
- **THEN** la página salta a la sección sin desplazamiento animado

#### Scenario: Revelado con movimiento reducido
- **WHEN** el sistema operativo pide movimiento reducido y un elemento con utilidad de revelado está en la página
- **THEN** el elemento se muestra visible desde el primer render, sin transición

#### Scenario: Revelado sin preferencia
- **WHEN** no hay preferencia de movimiento reducido y el elemento entra en el viewport
- **THEN** el elemento pasa de oculto a visible con su animación
