# Spec Delta

## Purpose

Define la sección de presentación (hero) de la home: qué información muestra, cómo se carga su retrato sin perjudicar las métricas de carga, cómo se accede a sus acciones y cómo se comporta su movimiento según la preferencia del visitante.

## ADDED Requirements

### Requirement: Identidad y datos del perfil
La sección de presentación SHALL mostrar, en este orden de lectura, el nombre completo como único encabezado de nivel 1 de la página, el rol profesional, una descripción breve y un panel de datos con rol, stack principal, ubicación y estado de disponibilidad. El texto accesible del nombre SHALL ser "Facundo Chacón" aunque visualmente se muestre en mayúsculas.

#### Scenario: Encabezado principal único
- **WHEN** se carga la home
- **THEN** existe un único encabezado de nivel 1 y su texto accesible es "Facundo Chacón"

#### Scenario: Panel de datos completo
- **WHEN** se renderiza la sección de presentación
- **THEN** el panel muestra pares etiqueta/valor para rol, stack, ubicación y estado, y el estado indica que está operativo/disponible con texto (no solo con color)

#### Scenario: Ancla de la sección
- **WHEN** el visitante navega a `/#presentacion` o usa el enlace "Inicio" de la barra
- **THEN** el destino es la sección de presentación

### Requirement: Decoración sin ruido para tecnologías de asistencia
Los elementos puramente decorativos de la sección (franjas de advertencia, grilla, códigos y etiquetas que duplican información) SHALL quedar ocultos para las tecnologías de asistencia y NO SHALL recibir foco.

#### Scenario: Franja y códigos ocultos
- **WHEN** un lector de pantalla recorre la sección
- **THEN** no anuncia la franja de advertencia ni los códigos decorativos, y sí anuncia el nombre, el rol, la descripción, los datos del panel y las acciones

#### Scenario: Retrato con texto alternativo
- **WHEN** un lector de pantalla llega al retrato
- **THEN** anuncia un texto alternativo que identifica a la persona retratada

### Requirement: Acciones de la presentación
La sección SHALL ofrecer una acción principal que lleva a la sección de proyectos de la misma página y accesos a GitHub y LinkedIn que abren en una pestaña nueva. Cada acción SHALL tener un nombre accesible que describa su destino y, si abre una pestaña nueva, SHALL indicarlo en su nombre accesible.

#### Scenario: Acción principal
- **WHEN** el visitante activa "Ver proyectos" con mouse o teclado
- **THEN** la página se desplaza a la sección de proyectos sin cambiar de pestaña

#### Scenario: Accesos externos
- **WHEN** el visitante activa el acceso a GitHub o a LinkedIn
- **THEN** el perfil correspondiente se abre en una pestaña nueva, sin dar a la página destino acceso a la ventana de origen, y el nombre accesible del enlace avisa que abre una pestaña nueva

#### Scenario: Foco visible en las acciones
- **WHEN** el visitante recorre las acciones con Tab
- **THEN** cada acción muestra el indicador de foco del sistema visual sin quedar tapado por la barra fija

### Requirement: Contraste de la sección
Todo texto de la sección SHALL cumplir contraste WCAG 2.x AA contra su fondo efectivo (4.5:1 texto normal, 3:1 texto grande) y los bordes que identifican acciones SHALL cumplir 3:1, incluido el texto apoyado sobre la grilla decorativa.

#### Scenario: Texto sobre la grilla decorativa
- **WHEN** un texto de la sección se superpone a la grilla decorativa
- **THEN** su contraste contra la mezcla de la grilla con el fondo cumple el umbral de su nivel

#### Scenario: Acción principal invertida
- **WHEN** se muestra la acción principal con fondo de acento
- **THEN** su texto cumple 4.5:1 contra ese fondo

### Requirement: Carga prioritaria del retrato
El retrato SHALL cargarse con prioridad alta, sin carga diferida, y SHALL reservar su espacio antes de descargarse, de modo que su aparición no desplace contenido. El rediseño NO SHALL empeorar el LCP de la home respecto de la versión anterior ni elevar su CLS por encima de 0.1.

#### Scenario: Espacio reservado
- **WHEN** la home se carga con la imagen todavía en descarga
- **THEN** el recuadro del retrato ya ocupa su tamaño final y nada se mueve cuando la imagen llega

#### Scenario: Prioridad de descarga
- **WHEN** el navegador descubre el retrato
- **THEN** lo solicita con prioridad alta y sin esperar a que entre en el viewport

#### Scenario: Métricas no empeoran
- **WHEN** se mide la home construida en escritorio (1440px) y en móvil (375px) antes y después del rediseño en las mismas condiciones
- **THEN** el LCP no supera al de la versión anterior más un margen de 10% y el CLS es menor o igual a 0.1

### Requirement: Título estable ante el cambio de fuente
El nombre SHALL ocupar la misma cantidad de líneas y el mismo alto mientras se muestra con la fuente de respaldo y después de cargarse la tipografía de títulos, de modo que el intercambio de fuente no desplace el contenido de la sección.

#### Scenario: Intercambio de fuente
- **WHEN** la tipografía de títulos termina de cargar después del primer render
- **THEN** el nombre conserva sus líneas y su alto y no se registra desplazamiento de diseño atribuible al título

#### Scenario: Ancho angosto
- **WHEN** la sección se muestra a 375px de ancho con cualquiera de las dos fuentes
- **THEN** el nombre no provoca desplazamiento horizontal de la página

### Requirement: Movimiento de entrada según preferencia
Sin preferencia de movimiento reducido, los elementos secundarios de la sección MAY aparecer con una animación de entrada breve; el retrato y el nombre SHALL ser visibles desde el primer render en todos los casos. Con movimiento reducido, la sección NO SHALL animar ni desplazar ningún elemento y las acciones NO SHALL trasladarse al recibir hover.

#### Scenario: Movimiento reducido activo
- **WHEN** el visitante tiene activada la preferencia de movimiento reducido
- **THEN** todos los elementos de la sección se muestran en su estado final desde el primer render, sin animación ni traslación al hacer hover

#### Scenario: Sin preferencia de movimiento reducido
- **WHEN** el visitante no pidió movimiento reducido
- **THEN** la franja, el panel de datos y las acciones aparecen con una animación de entrada que no supera un segundo en total, y el retrato y el nombre no se animan

#### Scenario: Sin efectos intermitentes
- **WHEN** la sección está en pantalla por cualquier tiempo
- **THEN** ningún texto ni elemento parpadea, titila ni se revuelve de forma periódica
