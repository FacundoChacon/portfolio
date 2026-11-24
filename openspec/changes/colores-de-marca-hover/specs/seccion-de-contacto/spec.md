# Spec Delta: seccion-de-contacto

## ADDED Requirements

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

## MODIFIED Requirements

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
