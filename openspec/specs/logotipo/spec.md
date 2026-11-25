# logotipo Specification

## Purpose
Define el glifo de marca de facucode.dev: su geometría única con variantes completa y simple, los recursos que se derivan de ella (favicon e ícono táctil) y las reglas para mostrarlo como decoración accesible.

## Requirements

### Requirement: Geometría única del glifo
El glifo SHALL definirse en un único lugar versionado como trazos vectoriales dibujados a mano, sin imágenes rasterizadas embebidas. Cada lugar del sitio que lo muestra (barra, compuerta de entrada, favicon, ícono táctil e imagen para compartir) SHALL obtener su forma de esa definición, de modo que cambiar un trazo cambie todas sus apariciones.

#### Scenario: Cambio de un trazo
- **WHEN** se modifica un trazo en la definición única del glifo y se regeneran los recursos derivados
- **THEN** la barra, la compuerta de entrada, el favicon, el ícono táctil y la imagen para compartir muestran el trazo nuevo sin editar cada uso a mano

#### Scenario: Sin raster embebido
- **WHEN** se inspecciona la definición del glifo o cualquiera de sus SVG derivados
- **THEN** solo contiene trazados vectoriales y no referencia ni incrusta imágenes rasterizadas

#### Scenario: Recurso desincronizado
- **WHEN** el favicon publicado no coincide con lo que produce la definición única
- **THEN** la verificación automática falla nombrando el archivo desincronizado

### Requirement: Variantes completa y simple
El glifo SHALL tener una variante completa, con el círculo, el triángulo alto con su diagonal interior, el reloj de arena de triángulos cruzados con su base y el triángulo chico que apunta a la izquierda, y una variante simple de como máximo 5 trazos (triángulo alto y círculo) pensada para tamaños de 16 a 32 píxeles.

#### Scenario: Variante completa
- **WHEN** se dibuja la variante completa
- **THEN** muestra el círculo, el triángulo alto, el reloj de arena con su base y el triángulo chico, en la disposición vertical del dibujo original

#### Scenario: Variante simple acotada
- **WHEN** se cuenta la cantidad de trazos de la variante simple
- **THEN** es de como máximo 5 y todos pertenecen al triángulo alto o al círculo

### Requirement: Estilo de trazo recto con aletas continuas
Cada trazo del glifo, salvo el círculo, SHALL ser una barra recta de ancho constante. Una barra MAY llevar una sola aleta continua sobre un lado: una rampa recta suave, una meseta paralela a la barra más larga que la rampa y un cierre recto de vuelta a la barra. Cada trazo SHALL pintarse con el relleno del logo, con filo y sombra desplazada abajo a la derecha en el color de filo. Sin degradados iridiscentes, brillos difusos ni animaciones en bucle.

#### Scenario: Barra recta
- **WHEN** se inspecciona cualquier trazo de cualquiera de las dos variantes, salvo el círculo
- **THEN** fuera de su aleta es una barra de ancho constante con lados rectos y paralelos, sin quiebres ni ondulaciones

#### Scenario: Perfil de la aleta
- **WHEN** se inspecciona la aleta de una barra
- **THEN** sube en línea recta con un ángulo de como máximo 25° respecto de la barra, sigue paralela a la barra en una meseta más larga que la rampa y se cierra con un borde recto hasta la línea base de la que partió

#### Scenario: Aleta baja
- **WHEN** se mide el alto de una aleta
- **THEN** está entre 0.3 y 0.7 veces el ancho de su barra

#### Scenario: Sin dientes de sierra
- **WHEN** una barra lleva más de una aleta, o una aleta sin meseta que sube y baja en pico
- **THEN** la verificación automática falla nombrando el trazo

#### Scenario: Ubicación de las aletas
- **WHEN** se inspecciona la variante completa
- **THEN** tiene una aleta en la parte alta del lateral del triángulo alto, en la diagonal interior, en el tramo bajo del lado derecho del triángulo, en la mitad alta del lomo, en el tramo alto de la diagonal superior izquierda del reloj de arena bajo la mitad izquierda de su base, en el lado exterior derecho del triángulo chico y en el borde exterior del aro (arriba a la izquierda), y ninguna barra ni el aro tienen más de una

#### Scenario: Variante simple legible
- **WHEN** se dibuja la variante simple a 16 píxeles
- **THEN** ni sus barras ni su aro llevan aletas y el aro se distingue separado del triángulo

#### Scenario: Círculo
- **WHEN** se inspecciona el círculo de cualquiera de las dos variantes
- **THEN** fuera de su aleta es un anillo cerrado de grosor casi constante

#### Scenario: Sin efectos prohibidos
- **WHEN** se inspecciona el SVG de cualquiera de las variantes
- **THEN** no contiene degradados, filtros de desenfoque ni animaciones

### Requirement: Aleta del aro
El aro de la variante completa SHALL llevar una sola aleta continua en su borde exterior: una rampa recta que lleva el borde desde el radio exterior hasta un radio elevado a lo largo de un arco de 25° a 35°, una meseta concéntrica al aro en ese radio elevado a lo largo de 90° a 120° y un cierre radial recto de vuelta al radio exterior. La elevación SHALL estar entre 0.3 y 0.7 veces el grosor del aro.

#### Scenario: Perfil de la aleta del aro
- **WHEN** se inspecciona el contorno exterior del aro
- **THEN** tiene un único tramo elevado formado por una rampa recta, un arco concéntrico de radio constante y un cierre radial, y fuera de ese tramo sigue el radio exterior

#### Scenario: Aleta del aro inválida
- **WHEN** el aro tiene más de una aleta, una meseta que no es concéntrica o una elevación fuera de 0.3 a 0.7 veces su grosor
- **THEN** la verificación automática falla nombrando el aro

#### Scenario: Aro sin costura
- **WHEN** se mira el aro en cualquier tamaño
- **THEN** la aleta y el aro forman una sola forma, con el filo solo en el contorno exterior

### Requirement: Silueta única sin uniones visibles
El glifo SHALL leerse como una sola forma continua: las barras que se encuentran en un vértice SHALL unirse en inglete (los bordes exteriores en un único vértice agudo y los interiores en otro), una barra que llega a otra SHALL terminar dentro de ella, y ninguna barra SHALL sobresalir de una unión. El filo SHALL contornear solo la silueta exterior de la unión de todos los trazos y sus huecos, y la sombra SHALL ser una sola para toda la silueta.

#### Scenario: Unión en inglete
- **WHEN** se inspecciona un vértice donde terminan dos barras
- **THEN** las dos barras comparten el corte del inglete y no queda ningún extremo de barra asomando fuera de la unión

#### Scenario: Barra que llega a otra
- **WHEN** una barra termina sobre otra barra
- **THEN** su extremo queda dentro del cuerpo de la barra anfitriona y no se ve su corte

#### Scenario: Sin costuras internas
- **WHEN** se mira el glifo en cualquier tamaño, incluidos los cruces y las uniones
- **THEN** no se ve ninguna línea de filo ni de sombra dentro de la silueta y la aleta no muestra separación con su barra

#### Scenario: Barra que sobresale
- **WHEN** la geometría tiene una barra cuyo extremo no está en un vértice compartido ni sobre el eje de otra barra
- **THEN** la verificación automática falla nombrando el trazo

### Requirement: Ejes rectos
Toda barra cuyo eje esté a menos de 4° de la vertical o de la horizontal SHALL quedar exactamente vertical u horizontal; las barras claramente diagonales SHALL conservar el ángulo del dibujo original.

#### Scenario: Barra casi vertical
- **WHEN** el eje de una barra está a menos de 4° de la vertical
- **THEN** sus dos extremos tienen exactamente la misma coordenada horizontal

#### Scenario: Barra casi horizontal
- **WHEN** el eje de una barra está a menos de 4° de la horizontal
- **THEN** sus dos extremos tienen exactamente la misma coordenada vertical

### Requirement: Favicon con la variante simple
El sitio SHALL declarar un favicon SVG que muestra la variante simple del glifo sobre el fondo negro del sistema visual, legible a 16 píxeles, y un ícono táctil PNG de 180×180 píxeles derivado de la misma variante para dispositivos que no usan favicons SVG. Ambos SHALL declararse en el documento de cada página pública.

#### Scenario: Pestaña del navegador
- **WHEN** se abre cualquier página pública
- **THEN** la pestaña muestra el glifo simple en amarillo sobre negro y no el texto "FC" verde anterior

#### Scenario: Ícono táctil
- **WHEN** se valida `public/apple-touch-icon.png`
- **THEN** es un PNG válido de 180×180 píxeles y cada página pública lo declara como ícono táctil

#### Scenario: Pestaña con tema claro
- **WHEN** el navegador muestra la pestaña sobre un fondo claro
- **THEN** el glifo conserva su fondo negro propio y sigue siendo distinguible

### Requirement: Glifo decorativo y accesible
Toda aparición del glifo dentro de la página SHALL quedar oculta para las tecnologías de asistencia, NO SHALL recibir foco y NO SHALL aportar texto al nombre accesible del elemento que lo contiene. El glifo NO SHALL usar estilos en línea, para respetar la política de seguridad de contenido.

#### Scenario: Lector de pantalla
- **WHEN** un lector de pantalla recorre una página que muestra el glifo
- **THEN** no anuncia el glifo ni ninguno de sus trazos

#### Scenario: Recorrido con teclado
- **WHEN** el visitante recorre la página con Tab
- **THEN** el glifo nunca recibe el foco

#### Scenario: Política de seguridad de contenido
- **WHEN** se abre la página construida con la CSP de producción
- **THEN** el glifo se pinta con sus colores sin registrar violaciones de la política
