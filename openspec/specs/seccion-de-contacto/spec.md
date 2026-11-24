# seccion-de-contacto Specification

## Purpose
Define la sección de contacto de la home: qué canales ofrece y cómo se abren, cómo se perciben sus estados con mouse y teclado, y cómo se comportan su motivo visual y su movimiento para todas las personas visitantes.

## Requirements

### Requirement: Canales de contacto
La sección SHALL ofrecer, en este orden, Email, GitHub y LinkedIn, cada uno como un enlace que muestra el nombre del canal y su valor completo. El email SHALL abrir el cliente de correo en la misma pestaña; GitHub y LinkedIn SHALL abrir en una pestaña nueva sin dar a la página destino acceso a la ventana de origen.

#### Scenario: Escribir por email
- **WHEN** el visitante activa el canal Email
- **THEN** se abre su cliente de correo con la dirección de contacto como destinatario y la página no cambia de pestaña

#### Scenario: Perfiles externos
- **WHEN** el visitante activa GitHub o LinkedIn
- **THEN** el perfil correspondiente se abre en una pestaña nueva

#### Scenario: Valor completo en pantallas angostas
- **WHEN** la sección se muestra a 375px de ancho
- **THEN** el valor de cada canal (incluido el email completo) es legible sin recortes ni puntos suspensivos y la página no tiene desplazamiento horizontal

### Requirement: Dirección de email configurable
La dirección de email del canal SHALL ser la configurada para el build del sitio; si no hay una dirección configurada o no es una dirección válida, SHALL usarse la dirección de respaldo del portfolio.

#### Scenario: Dirección configurada
- **WHEN** el build define una dirección de contacto válida
- **THEN** el canal Email muestra y usa esa dirección

#### Scenario: Sin dirección configurada
- **WHEN** el build no define dirección de contacto o la define vacía o inválida
- **THEN** el canal Email muestra y usa la dirección de respaldo

### Requirement: Nombres accesibles de los canales
Cada canal SHALL tener un nombre accesible que empiece con el nombre visible del canal e incluya su valor; los canales que abren una pestaña nueva SHALL avisarlo en su nombre accesible. Los códigos, íconos e indicadores decorativos NO SHALL formar parte del nombre accesible.

#### Scenario: Lectura de un canal externo
- **WHEN** un lector de pantalla enfoca el canal de LinkedIn
- **THEN** anuncia "LinkedIn", el valor del perfil y que se abre en una pestaña nueva, sin leer códigos como "CH-03"

#### Scenario: Lista de canales
- **WHEN** un lector de pantalla llega a los canales
- **THEN** los anuncia como una lista de tres elementos

### Requirement: Estados visibles de los canales
Cada canal SHALL mostrar un estado de hover y uno de foco de teclado que no dependan solo del color (cambio de borde más un elemento de forma, como una sombra sólida o un indicador invertido) y el indicador de foco del sistema visual SHALL quedar visible y sin taparse por la barra fija. El borde, la sombra y el indicador de esos estados SHALL usar el color de marca del canal, y el foco de teclado SHALL conservar además el anillo de foco del sistema, que no se reemplaza por el color de marca.

#### Scenario: Foco con teclado
- **WHEN** el visitante llega a un canal con Tab
- **THEN** el canal muestra el anillo de foco del sistema, cambia su borde al color de marca del canal y muestra un elemento de forma adicional que no estaba en reposo

#### Scenario: Hover con mouse
- **WHEN** el visitante pasa el puntero sobre un canal
- **THEN** el canal muestra el mismo cambio de borde y elemento de forma que con el foco de teclado, en el color de marca del canal

#### Scenario: Ancla de la sección
- **WHEN** el visitante navega a `/#contacto` o usa "Contáctame"/"Hablemos"
- **THEN** el encabezado de la sección queda visible debajo de la barra fija

#### Scenario: Foco sobre un canal ya coloreado en táctil
- **WHEN** en un dispositivo táctil con teclado el visitante enfoca un canal cuyo borde ya está en color de marca
- **THEN** el foco se distingue igual por el anillo de foco del sistema, la sombra sólida y el indicador invertido

### Requirement: Motivo visual estático
La sección SHALL presentar su motivo visual (franjas de advertencia y panel de canal abierto) de forma estática: ningún texto de la sección SHALL revolverse, parpadear ni cambiar periódicamente, y el texto expuesto a tecnologías de asistencia SHALL ser siempre el texto real. Las franjas y códigos decorativos SHALL estar ocultos para tecnologías de asistencia.

#### Scenario: Sección en pantalla durante un tiempo
- **WHEN** la sección permanece visible varios segundos
- **THEN** el título, el subtítulo y el resto de los textos no cambian ni se revuelven, y no hay capas animadas en bucle

#### Scenario: Lectura del motivo
- **WHEN** un lector de pantalla recorre la sección
- **THEN** anuncia el título "Contáctame", el texto de estado del canal, la invitación, la ubicación y los canales, y no anuncia franjas ni códigos decorativos

### Requirement: Contraste de la sección
Todo texto de la sección SHALL cumplir contraste WCAG 2.x AA contra su fondo efectivo (4.5:1 texto normal, 3:1 texto grande) en reposo, hover y foco, y los bordes que delimitan cada canal SHALL cumplir 3:1 contra el fondo. Cada color de marca de canal SHALL alcanzar ≥ 4.5:1 contra los fondos negro y de panel, y el texto del indicador invertido SHALL alcanzar ≥ 4.5:1 contra el color de marca que lo rellena.

#### Scenario: Canal en reposo
- **WHEN** se muestra un canal sin interacción
- **THEN** su etiqueta y su valor cumplen 4.5:1 y su borde cumple 3:1 contra el fondo de la sección

#### Scenario: Indicador invertido
- **WHEN** un canal está en hover o foco y su indicador se invierte al color de marca del canal
- **THEN** el texto del indicador cumple 4.5:1 contra ese fondo

#### Scenario: Colores de marca de los canales
- **WHEN** se evalúa el rojo de Email, el verde de GitHub y el celeste de LinkedIn contra los fondos negro y de panel
- **THEN** cada uno alcanza al menos 4.5:1, y si alguno baja del umbral la verificación automática falla nombrando el canal y el contraste

### Requirement: Movimiento de la sección según preferencia
Sin preferencia de movimiento reducido, el contenido de la sección MAY aparecer con una transición breve al entrar en pantalla y los canales MAY desplazarse levemente y cambiar de color con una transición breve en hover o foco. Con movimiento reducido, el contenido SHALL mostrarse visible desde el primer render, los canales NO SHALL desplazarse y el cambio al color de marca SHALL ser instantáneo.

#### Scenario: Movimiento reducido activo
- **WHEN** el visitante tiene activada la preferencia de movimiento reducido
- **THEN** el contenido de la sección se ve sin transición de entrada y los canales cambian de estado y de color sin traslación ni transición

#### Scenario: Sin observador de intersección
- **WHEN** el navegador no ofrece observación de intersección
- **THEN** el contenido de la sección se muestra visible sin esperar al scroll

### Requirement: Pie del sitio
La sección SHALL cerrar con el pie del sitio que muestra la autoría del portfolio y el año en curso.

#### Scenario: Año vigente
- **WHEN** se renderiza la home en cualquier año
- **THEN** el pie muestra el nombre del autor y el año actual

### Requirement: Color de marca por canal

Cada canal SHALL tener un color de marca tomado de la definición central del sistema visual: Email rojo, GitHub verde y LinkedIn celeste. Con puntero fino y hover, los canales en reposo SHALL verse neutrales e iguales entre sí y SHALL encenderse en su color de marca en hover y en foco de teclado. En dispositivos sin hover o con puntero grueso, el borde y el ícono de cada canal SHALL verse siempre en su color de marca.

#### Scenario: Cada canal con su color
- **WHEN** se revisan los datos de los canales
- **THEN** Email, GitHub y LinkedIn declaran cada uno un color de marca que existe en la definición central, y ninguno queda sin color

#### Scenario: Reposo neutral con mouse
- **WHEN** se comparan los tres canales sin interacción en una computadora con mouse
- **THEN** tienen los mismos colores de borde, ícono e indicador

#### Scenario: GitHub encendido
- **WHEN** el visitante pasa el puntero sobre GitHub o llega a él con Tab
- **THEN** el borde, la sombra sólida, el ícono y el indicador invertido de ese canal se ven en verde, y los otros canales siguen neutrales

#### Scenario: Canales en un teléfono
- **WHEN** el visitante ve la sección en un teléfono
- **THEN** el borde y el ícono de Email se ven en rojo, los de GitHub en verde y los de LinkedIn en celeste sin necesidad de tocarlos

#### Scenario: Color declarado fuera de la definición central
- **WHEN** el componente de la sección declara un color hexadecimal literal, un estilo inline o un color arbitrario para un canal en lugar de referenciar la definición central
- **THEN** la verificación automática falla

### Requirement: Columnas equilibradas en el contacto
Cuando el panel de invitación y la lista de canales se muestran lado a lado (desde 1024px de ancho), la lista de canales SHALL ocupar el mismo alto que el panel, repartido en partes iguales entre los canales, sin dejar espacio vacío debajo del último canal. En anchos donde se apilan, los canales SHALL conservar su alto natural.

#### Scenario: Escritorio sin hueco bajo los canales
- **WHEN** la sección se muestra a 1024, 1280, 1440 o 1920px de ancho
- **THEN** el final del último canal coincide con el final del panel de invitación (diferencia de 16px o menos) y los tres canales tienen el mismo alto

#### Scenario: Pantallas apiladas sin cambios
- **WHEN** la sección se muestra a 375 o 768px de ancho
- **THEN** el panel y los canales siguen apilados y cada canal conserva su alto natural, igual que antes del cambio

#### Scenario: Contenido del canal estirado
- **WHEN** un canal se estira para ocupar su parte del alto
- **THEN** el ícono, la etiqueta, el valor y el indicador quedan centrados verticalmente, y toda el área del canal es clickeable y muestra los estados de hover y foco

### Requirement: Contacto como cierre de la página

Contacto es la última sección: desde 768 px de ancho SHALL medir al menos el alto útil de la pantalla (alto menos la barra), con un tope de 52rem, centrando verticalmente el encabezado y los canales y dejando el pie al final. Bajo el pie SHALL quedar como máximo 32 px de relleno. En anchos menores la sección SHALL conservar su alto natural.

#### Scenario: Navegar a Contáctame en una laptop o escritorio
- **WHEN** el visitante activa "Contáctame" en la barra en 1280×800, 1366×768 o 1440×900
- **THEN** el borde superior de Contacto queda pegado a la barra (±2 px), el encabezado, el panel y los canales quedan completos a la vista y el pie queda al final de la pantalla

#### Scenario: Pantalla más alta que el tope
- **WHEN** el visitante activa "Contáctame" en 1920×1080
- **THEN** Contacto mide 52rem (±2 px), todo su contenido queda a la vista y el espacio vacío entre el borde superior de la sección y su encabezado no supera 160 px

#### Scenario: Teléfono
- **WHEN** el visitante abre la home en 375×812
- **THEN** Contacto conserva su alto natural, sin alto mínimo ni centrado

#### Scenario: Sin hueco entre panel y canales
- **WHEN** se muestra Contacto en 1440×900 con el alto mínimo aplicado
- **THEN** el final del último canal sigue coincidiendo con el final del panel (16 px o menos), y el espacio extra queda por encima del encabezado y antes del pie, no entre los canales
