## MODIFIED Requirements

### Requirement: Acceso al configurador desde el portfolio

El sistema SHALL ofrecer, en la navegación del portfolio, un llamado a la acción que accede a `/configurador` mediante navegación del lado del cliente, sin recargar la página.

#### Scenario: El CTA navega al configurador
- **WHEN** el visitante hace clic en el CTA "Armá tu web"
- **THEN** el sistema navega a `/configurador` sin una recarga completa del documento

#### Scenario: Las anclas de la home siguen funcionando
- **WHEN** el visitante está en `/` y usa los enlaces de sección del nav (Inicio, Quién soy, Proyectos, Stack, Testimonios cuando la sección existe, Contáctame)
- **THEN** el sistema sigue desplazándose a la sección correspondiente de la home

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

## ADDED Requirements

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
