# navegacion-del-sitio Specification

## Purpose

Define el enrutado cliente del sitio: cómo el visitante llega al configurador desde el portfolio, cómo se cargan sus páginas sin recargar y cómo se resuelven las rutas desconocidas.

## Requirements

### Requirement: Ruta raíz del portfolio

El sistema SHALL renderizar las secciones del portfolio en la ruta raíz `/`.

#### Scenario: Home en la raíz
- **WHEN** el visitante abre `/`
- **THEN** el sistema muestra las secciones del portfolio (Hero, About, Projects, Stack, Contact)

#### Scenario: La home no carga el configurador
- **WHEN** el visitante abre `/`
- **THEN** el código de la página del configurador NO se incluye en el bundle inicial

### Requirement: Página propia del configurador

El sistema SHALL exponer `/configurador` como una página propia, cargada de forma diferida (lazy) y separada del resto del sitio.

#### Scenario: Acceso directo a /configurador
- **WHEN** el visitante abre la URL `/configurador`
- **THEN** el sistema muestra la página del configurador y no la home

#### Scenario: Carga diferida con fallback
- **WHEN** el visitante entra a `/configurador` y el chunk todavía se está descargando
- **THEN** el sistema muestra un estado de carga coherente con el tema antes de montar la página

### Requirement: Acceso al configurador desde el portfolio

El sistema SHALL ofrecer, en la navegación del portfolio, un llamado a la acción que accede a `/configurador` mediante navegación del lado del cliente, sin recargar la página.

#### Scenario: El CTA navega al configurador
- **WHEN** el visitante hace clic en el CTA "Armá tu web"
- **THEN** el sistema navega a `/configurador` sin una recarga completa del documento

#### Scenario: Las anclas de la home siguen funcionando
- **WHEN** el visitante está en `/` y usa los enlaces de sección del nav (Inicio, Quién soy, Proyectos, Stack, Testimonios cuando la sección existe, Contáctame)
- **THEN** el sistema sigue desplazándose a la sección correspondiente de la home

### Requirement: Redirección de rutas desconocidas

El sistema SHALL redirigir hacia la raíz `/` cualquier ruta que no reconozca.

#### Scenario: Ruta inexistente
- **WHEN** el visitante abre una ruta inexistente (por ejemplo `/foo`)
- **THEN** el sistema lo redirige a `/` y muestra el portfolio

### Requirement: Indicador de sección actual

En `/`, la barra de navegación SHALL marcar como actual el enlace de la sección de la home que está en pantalla, mostrándolo como bloque sólido invertido (texto negro sobre fondo violeta, el color primario) y exponiéndolo a tecnologías asistivas con `aria-current`. A lo sumo un enlace SHALL estar marcado a la vez; si ninguna sección enlazada está en pantalla, ninguno se marca.

#### Scenario: Sección visible marcada
- **WHEN** el visitante se desplaza hasta que la sección Proyectos ocupa la zona de lectura bajo la barra
- **THEN** el enlace "Proyectos" se muestra invertido, con texto negro sobre violeta, y es el único con `aria-current`

#### Scenario: Dos secciones en pantalla
- **WHEN** el final de una sección enlazada y el comienzo de la siguiente están en pantalla a la vez
- **THEN** se marca solo la que aparece primero en el orden del documento dentro de la zona de lectura

#### Scenario: Sección no enlazada
- **WHEN** en la zona de lectura no hay ninguna sección enlazada en la barra (por ejemplo, un id de sección que no figura entre los enlaces visibles)
- **THEN** ningún enlace queda marcado como actual

#### Scenario: Navegador sin observador de intersección
- **WHEN** el navegador no ofrece una forma de detectar qué sección está en pantalla
- **THEN** la barra funciona igual, sin marcar ningún enlace y sin errores en consola

#### Scenario: Testimonios en pantalla
- **WHEN** hay testimonios cargados y la sección Testimonios ocupa la zona de lectura bajo la barra
- **THEN** el enlace "Testimonios" se muestra invertido y es el único con `aria-current="location"`

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
- **THEN** los textos violeta claro, papel y gris de la barra mantienen al menos 4.5:1 contra el fondo resultante

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

La cabecera de `/configurador` SHALL mostrar la misma marca y el mismo cromado que la barra de la home (bordes violeta duros, fondo negro translúcido con respaldo opaco) y SHALL conservar su enlace "Volver al inicio" con navegación del lado del cliente, sin volverse fija ni alterar el contenido del configurador.

#### Scenario: Marca y estilo compartidos
- **WHEN** el visitante abre `/configurador`
- **THEN** la cabecera muestra la misma marca que la barra de la home con bordes violeta y fondo negro

#### Scenario: Volver al inicio
- **WHEN** el visitante activa "Volver al inicio" en la cabecera del configurador
- **THEN** el sistema navega a `/` sin una recarga completa del documento

### Requirement: Enlace a Testimonios según disponibilidad

Cuando la home muestra la sección Testimonios, la barra (escritorio y menú móvil) SHALL incluir el enlace "Testimonios" a `#testimonios`, entre "Stack" y "Contáctame", siguiendo el orden del documento. Si no hay testimonios, la barra NO SHALL mostrar ese enlace. Los códigos de sistema visibles de los enlaces SHALL ser correlativos desde `//01`, sin huecos, y el código del encabezado de la sección Contacto SHALL coincidir con el de su enlace.

#### Scenario: Con testimonios cargados
- **WHEN** la fuente de testimonios tiene al menos un testimonio y el visitante abre `/`
- **THEN** la barra muestra, en orden, Inicio `//01`, Quién soy `//02`, Proyectos `//03`, Stack `//04`, Testimonios `//05` y Contáctame `//06`, y el encabezado de Contacto muestra `06`

#### Scenario: Sin testimonios
- **WHEN** la fuente de testimonios está vacía y el visitante abre `/`
- **THEN** la barra no muestra "Testimonios", muestra Contáctame con `//05`, el encabezado de Contacto muestra `05` y ningún enlace de la barra apunta a un ancla que no existe en la página

#### Scenario: Seguir el enlace
- **WHEN** hay testimonios cargados y el visitante activa "Testimonios" en la barra o en el menú móvil
- **THEN** la página se desplaza a la sección Testimonios, con su título visible por debajo de la barra fija

### Requirement: Panel móvil alcanzable en pantallas bajas

Con el menú móvil abierto, su panel SHALL ocupar como máximo la altura visible por debajo de la barra fija y SHALL desplazarse cuando sus destinos no entran, de modo que todos los destinos sean alcanzables con el dedo y con el teclado aun en pantallas bajas.

#### Scenario: Teléfono en horizontal
- **WHEN** el menú móvil está abierto en un viewport de 568×320 (sus destinos suman más alto que el espacio bajo la barra)
- **THEN** el panel no sobrepasa el borde inferior del viewport y el último destino ("Contáctame") se alcanza desplazando el panel

#### Scenario: Teléfono en vertical
- **WHEN** el menú móvil está abierto en un viewport de 375×667
- **THEN** todos los destinos se muestran sin necesidad de desplazar el panel y cada uno conserva un área táctil de al menos 44px de alto

#### Scenario: Recorrido con teclado
- **WHEN** el menú está abierto en un viewport bajo y el usuario avanza con Tab hasta el último destino
- **THEN** el destino enfocado queda visible dentro del panel, no tapado ni fuera de la pantalla

### Requirement: Glifo en la marca de la barra
La marca de la barra, compartida por la home y por `/configurador`, SHALL mostrar la variante simple del glifo a la izquierda del texto "FC" y de su código de sistema, que se conservan. El enlace SHALL seguir llevando a `/` con navegación del lado del cliente y su nombre accesible NO SHALL cambiar. El glifo SHALL caber en la altura de la barra sin alterarla.

#### Scenario: Marca en la home
- **WHEN** el visitante abre `/`
- **THEN** la barra muestra el glifo simple seguido de "FC" y `//00`, y la altura de la barra no cambia

#### Scenario: Marca en el configurador
- **WHEN** el visitante abre `/configurador`
- **THEN** la cabecera muestra el mismo glifo y el mismo texto que la barra de la home

#### Scenario: Nombre accesible intacto
- **WHEN** un lector de pantalla llega al enlace de la marca
- **THEN** anuncia el mismo nombre que antes del cambio, sin texto adicional por el glifo

#### Scenario: Volver al inicio desde la marca
- **WHEN** el visitante activa la marca desde `/configurador`
- **THEN** el sistema navega a `/` sin una recarga completa del documento
