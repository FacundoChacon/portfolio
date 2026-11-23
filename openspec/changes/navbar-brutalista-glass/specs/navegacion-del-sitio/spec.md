# Spec Delta

## ADDED Requirements

### Requirement: Indicador de sección actual

En `/`, la barra de navegación SHALL marcar como actual el enlace de la sección de la home que está en pantalla, mostrándolo como bloque sólido invertido (texto negro sobre fondo naranja) y exponiéndolo a tecnologías asistivas con `aria-current`. A lo sumo un enlace SHALL estar marcado a la vez; si ninguna sección enlazada está en pantalla, ninguno se marca.

#### Scenario: Sección visible marcada
- **WHEN** el visitante se desplaza hasta que la sección Proyectos ocupa la zona de lectura bajo la barra
- **THEN** el enlace "Proyectos" se muestra invertido y es el único con `aria-current`

#### Scenario: Dos secciones en pantalla
- **WHEN** el final de una sección enlazada y el comienzo de la siguiente están en pantalla a la vez
- **THEN** se marca solo la que aparece primero en el orden del documento dentro de la zona de lectura

#### Scenario: Sección no enlazada
- **WHEN** en pantalla solo está una sección que no tiene enlace en la barra (por ejemplo Testimonios)
- **THEN** ningún enlace queda marcado como actual

#### Scenario: Navegador sin observador de intersección
- **WHEN** el navegador no ofrece una forma de detectar qué sección está en pantalla
- **THEN** la barra funciona igual, sin marcar ningún enlace y sin errores en consola

### Requirement: Menú móvil operable por teclado

En anchos menores al punto de quiebre de escritorio, el menú de navegación SHALL abrirse y cerrarse con un botón que expone su estado (`aria-expanded`) y el panel que controla. Con el menú abierto, Escape SHALL cerrarlo y devolver el foco al botón; elegir un destino SHALL cerrarlo; pasar a ancho de escritorio SHALL cerrarlo. Cerrado, sus enlaces no SHALL ser enfocables.

#### Scenario: Cerrar con Escape
- **WHEN** el menú está abierto y el foco está en el botón o en un enlace del menú y el usuario presiona Escape
- **THEN** el menú se cierra, el botón indica `aria-expanded="false"` y el foco queda en el botón

#### Scenario: Elegir un destino
- **WHEN** el usuario activa un enlace del menú móvil
- **THEN** el menú se cierra y la navegación al destino ocurre igual que antes del rediseño

#### Scenario: Menú cerrado fuera del orden de tabulación
- **WHEN** el menú está cerrado y el usuario recorre la página con Tab
- **THEN** ningún enlace del panel móvil recibe el foco

#### Scenario: Cambio a escritorio
- **WHEN** el menú está abierto y el viewport pasa a ancho de escritorio
- **THEN** el menú queda cerrado y la barra muestra los enlaces de escritorio

### Requirement: Salto al contenido

Cada página pública (`/` y `/configurador`) SHALL ofrecer, como primer elemento enfocable, un enlace "Saltar al contenido" que solo se hace visible al recibir foco y que lleva el foco al contenido principal, salteando la navegación.

#### Scenario: Primer Tab
- **WHEN** el usuario carga `/` o `/configurador` y presiona Tab una vez
- **THEN** aparece visible el enlace "Saltar al contenido" con el contorno de foco del sistema

#### Scenario: Activar el salto
- **WHEN** el usuario activa "Saltar al contenido"
- **THEN** el siguiente Tab enfoca el primer control del contenido principal y no uno de la barra

### Requirement: Anclas y foco no tapados por la barra fija

Al seguir un enlace a una sección de la home, o al mover el foco a un elemento que obliga a desplazar la página, el destino SHALL quedar completamente visible debajo de la barra fija (incluida su franja decorativa), sin quedar oculto por ella.

#### Scenario: Seguir un ancla
- **WHEN** el visitante activa "Proyectos" en la barra
- **THEN** el título de la sección Proyectos queda visible por debajo del borde inferior de la barra

#### Scenario: Foco por teclado cerca del borde superior
- **WHEN** el usuario retrocede con Shift+Tab hacia un control que estaba por encima del viewport
- **THEN** el control enfocado y su contorno quedan visibles, no tapados por la barra

### Requirement: Legibilidad del fondo translúcido

La barra SHALL usar un fondo negro translúcido con desenfoque del contenido que pasa por detrás, con la opacidad suficiente para que sus textos cumplan el contraste declarado por la paleta del sistema aun sobre el contenido más claro del sitio. Si el navegador no soporta desenfoque de fondo, la barra SHALL usar un fondo negro opaco.

#### Scenario: Contenido claro detrás de la barra
- **WHEN** pasa por detrás de la barra la zona más clara posible del sitio (blanco)
- **THEN** los textos naranja, papel y gris de la barra mantienen al menos 4.5:1 contra el fondo resultante

#### Scenario: Navegador sin desenfoque de fondo
- **WHEN** el navegador no soporta `backdrop-filter`
- **THEN** la barra se muestra con fondo negro opaco y el mismo contraste que sobre el fondo principal

### Requirement: Movimiento de la barra según preferencia

Los estados de hover de la barra SHALL usar un desplazamiento duro (sombra sólida sin desenfoque). Con `prefers-reduced-motion: reduce`, la barra y su menú SHALL no desplazar ni animar elementos: los cambios de estado son instantáneos y sin traslación.

#### Scenario: Hover sin preferencia
- **WHEN** no hay preferencia de movimiento reducido y el puntero pasa sobre un enlace de la barra
- **THEN** el enlace se desplaza levemente y muestra una sombra sólida naranja sin desenfoque

#### Scenario: Hover con movimiento reducido
- **WHEN** el sistema pide movimiento reducido y el puntero pasa sobre un enlace de la barra
- **THEN** el enlace cambia de estado sin trasladarse ni animarse

### Requirement: Cabecera coherente en el configurador

La cabecera de `/configurador` SHALL mostrar la misma marca y el mismo cromado que la barra de la home (bordes naranja duros, fondo negro translúcido con respaldo opaco) y SHALL conservar su enlace "Volver al inicio" con navegación del lado del cliente, sin volverse fija ni alterar el contenido del configurador.

#### Scenario: Marca y estilo compartidos
- **WHEN** el visitante abre `/configurador`
- **THEN** la cabecera muestra la misma marca que la barra de la home con bordes naranja y fondo negro

#### Scenario: Volver al inicio
- **WHEN** el visitante activa "Volver al inicio" en la cabecera del configurador
- **THEN** el sistema navega a `/` sin una recarga completa del documento
