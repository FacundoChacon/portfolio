# Spec Delta

## Purpose

Define el glifo de marca de facucode.dev: su geometría única con variantes completa y simple, los recursos que se derivan de ella (favicon e ícono táctil) y las reglas para mostrarlo como decoración accesible.

## ADDED Requirements

### Requirement: Geometría única del glifo
El glifo SHALL definirse en un único lugar versionado como trazos vectoriales dibujados a mano, sin imágenes rasterizadas embebidas. Cada lugar del sitio que lo muestra (barra, presentación, favicon, ícono táctil e imagen para compartir) SHALL obtener su forma de esa definición, de modo que cambiar un trazo cambie todas sus apariciones.

#### Scenario: Cambio de un trazo
- **WHEN** se modifica un trazo en la definición única del glifo y se regeneran los recursos derivados
- **THEN** la barra, la presentación, el favicon, el ícono táctil y la imagen para compartir muestran el trazo nuevo sin editar cada uso a mano

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

### Requirement: Estilo de trazo recto
Cada trazo del glifo, salvo el círculo, SHALL ser una barra recta rellena con extremos cortados en escuadra (sin puntas) y ancho casi constante: a lo largo del trazo el ancho mínimo SHALL ser al menos el 75 % del máximo, y solo algunos trazos MAY engrosar de forma lineal en un tramo. Cada trazo SHALL pintarse con el color de relleno del logo, con un filo y una sombra desplazada hacia abajo y a la derecha en el color de filo del logo. El glifo NO SHALL usar degradados iridiscentes, brillos difusos ni animaciones en bucle.

#### Scenario: Barra recta sin puntas
- **WHEN** se inspecciona cualquier trazo de cualquiera de las dos variantes, salvo el círculo
- **THEN** es una forma cerrada rellena sin ningún ángulo interior menor a 60° y su ancho mínimo es al menos el 75 % del máximo

#### Scenario: Relieve lineal mínimo
- **WHEN** se comparan los anchos de los trazos de cada variante
- **THEN** al menos uno engrosa de forma lineal en un tramo y ninguno supera un 25 % de aumento

#### Scenario: Círculo
- **WHEN** se inspecciona el círculo de cualquiera de las dos variantes
- **THEN** es un anillo cerrado de grosor casi constante

#### Scenario: Sin efectos prohibidos
- **WHEN** se inspecciona el SVG de cualquiera de las variantes
- **THEN** no contiene degradados, filtros de desenfoque ni animaciones

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
