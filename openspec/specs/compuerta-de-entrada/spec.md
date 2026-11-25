# compuerta-de-entrada Specification

## Purpose
Define la compuerta de entrada de la home: una intro decorativa con el glifo de marca que se abre arriba y abajo antes de la entrada escrita del hero. Cubre cuándo se muestra, cuánto dura, cómo se salta y qué garantías de accesibilidad, carga y seguridad conserva la página real que está debajo.

## Requirements

### Requirement: Composición de la compuerta
La compuerta SHALL cubrir toda la pantalla con dos hojas, una superior y una inferior, que se encuentran en una junta horizontal en el centro de la pantalla. La junta SHALL leerse como una línea de franjas de peligro interrumpida por la variante completa del glifo, centrada sobre ella. El texto "FACU CODE" SHALL ir debajo del glifo, sobre la hoja inferior. Cada hoja SHALL verse como una plancha metálica de relieve sobrio: superficie cepillada, aletas rectas y continuas, un labio elevado en la junta, placas hundidas con remaches dispersos y la misma decoración, espejada, en las dos hojas; todo ello viaja con su hoja al abrirse y NO SHALL usar imágenes, filtros ni formas de dientes de sierra.

#### Scenario: Compuerta cerrada en escritorio
- **WHEN** la compuerta está cerrada en una pantalla de 1440×900
- **THEN** no se ve nada de la página, la junta cruza la pantalla de borde a borde a media altura con el glifo completo en su centro y "FACU CODE" se lee debajo del glifo

#### Scenario: Aspecto metálico con relieves
- **WHEN** la compuerta está cerrada en 1440×900 o en 375×812
- **THEN** ambas hojas muestran la misma decoración metálica espejada, el glifo se ve entero sobre la junta y "FACU CODE" se lee sobre su placa, sin desbordamiento horizontal

#### Scenario: Compuerta cerrada en móvil
- **WHEN** la compuerta está cerrada en una pantalla de 375×812
- **THEN** el glifo, la junta y "FACU CODE" entran completos en la pantalla, sin desplazamiento horizontal ni texto cortado

#### Scenario: Glifo fiel a la definición única
- **WHEN** se compara el glifo de la compuerta con el de la definición única del logotipo
- **THEN** tiene la misma forma y las mismas capas de sombra, filo y relleno, sin costuras visibles entre sus trazos

### Requirement: Secuencia de apertura
Sin preferencia de movimiento reducido, la compuerta SHALL seguir este orden: se traza la junta, aparece el glifo, aparece "FACU CODE", hay una pausa, el glifo se recoge hacia la junta y, por último, la hoja superior sube y la inferior baja hasta salir de la pantalla. La secuencia completa NO SHALL superar 2,2 segundos. Ningún elemento SHALL parpadear ni repetirse en bucle.

#### Scenario: Orden de la secuencia
- **WHEN** el visitante carga la home y la compuerta se muestra
- **THEN** ve, en este orden, la junta, el glifo, "FACU CODE", el glifo que se recoge hacia la junta y las hojas que se separan hacia arriba y hacia abajo

#### Scenario: Texto con la hoja inferior
- **WHEN** las hojas se separan
- **THEN** "FACU CODE" se desplaza junto con la hoja inferior y el glifo ya no está a la vista

#### Scenario: Duración acotada
- **WHEN** se mide desde el primer cuadro de la compuerta hasta que ninguna de sus hojas queda en pantalla
- **THEN** la duración no supera 2,2 segundos

#### Scenario: Sin efectos intermitentes
- **WHEN** la compuerta está en pantalla
- **THEN** ningún elemento parpadea, titila ni repite su animación

### Requirement: Una vez por sesión del navegador
La compuerta SHALL mostrarse como máximo una vez por sesión del almacenamiento de sesión del navegador, que es por pestaña. Recargar o navegar dentro del sitio en la misma pestaña NO SHALL volver a mostrarla. Si el almacenamiento de sesión no se puede leer o escribir, la compuerta NO SHALL mostrarse.

#### Scenario: Recarga en la misma pestaña
- **WHEN** el visitante ya vio la compuerta y recarga la home
- **THEN** la página se muestra sin compuerta

#### Scenario: Navegación dentro del sitio
- **WHEN** el visitante ya vio la compuerta, va a `/configurador` y vuelve a la home, con o sin recarga
- **THEN** la compuerta no vuelve a aparecer

#### Scenario: Recarga durante la compuerta
- **WHEN** el visitante recarga la página antes de que la compuerta termine de abrirse
- **THEN** la página recargada se muestra sin compuerta

#### Scenario: Pestaña nueva
- **WHEN** el visitante abre la home en una pestaña nueva, sin almacenamiento de sesión previo
- **THEN** la compuerta se muestra

#### Scenario: Almacenamiento no disponible
- **WHEN** leer o escribir el almacenamiento de sesión falla
- **THEN** la compuerta no se muestra, la página no registra errores y el hero entra como cuando no hay compuerta

### Requirement: Solo al entrar a la home sin ancla
La compuerta SHALL mostrarse solo cuando el documento se carga directamente en la ruta raíz sin un ancla que apunte a una sección. Entrar por un ancla o por otra ruta NO SHALL mostrarla, ni tampoco llegar a la home después por navegación del lado del cliente. Que no se muestre en esos casos NO SHALL gastar la vez de la sesión.

#### Scenario: Entrada por ancla
- **WHEN** el visitante abre `/#proyectos` en una carga nueva
- **THEN** no hay compuerta y la página llega a la sección Proyectos como sin este cambio

#### Scenario: Entrada por el configurador
- **WHEN** el visitante abre `/configurador` y después navega a la home sin recargar
- **THEN** no se muestra la compuerta en ningún momento

#### Scenario: Ancla que no es una sección
- **WHEN** el visitante abre la home con un ancla vacía o que no es un identificador válido
- **THEN** la compuerta se comporta como en una entrada sin ancla

#### Scenario: Recarga sin ancla después de entrar por una
- **WHEN** el visitante entró por `/#contacto` sin ver la compuerta y después carga `/` sin ancla en la misma pestaña
- **THEN** la compuerta se muestra, porque esa sesión todavía no la vio

### Requirement: Salto inmediato
Mientras la compuerta está en pantalla, un clic o un toque sobre ella, cualquier tecla, la rueda del mouse o un gesto de desplazamiento táctil SHALL quitarla en el cuadro siguiente, sin animación de cierre. El gesto que la quita NO SHALL activar el elemento de la página que queda debajo del puntero.

#### Scenario: Clic durante la compuerta
- **WHEN** el visitante hace clic sobre la compuerta en cualquier momento de la secuencia
- **THEN** la compuerta desaparece en el cuadro siguiente y ningún enlace ni botón que estaba debajo del puntero se activa

#### Scenario: Toque en pantalla táctil
- **WHEN** el visitante toca la compuerta en un dispositivo táctil
- **THEN** la compuerta desaparece y el toque no navega ni activa el elemento que estaba debajo

#### Scenario: Tecla durante la compuerta
- **WHEN** el visitante presiona cualquier tecla, incluida Tab
- **THEN** la compuerta desaparece en el cuadro siguiente y, si la tecla mueve el foco, el elemento enfocado se ve con su indicador de foco

#### Scenario: Rueda o gesto de desplazamiento
- **WHEN** el visitante usa la rueda del mouse o arrastra el dedo para desplazarse
- **THEN** la compuerta desaparece en el cuadro siguiente y el desplazamiento queda habilitado

### Requirement: Movimiento reducido sin compuerta
Con preferencia de movimiento reducido, la compuerta NO SHALL mostrarse. Si la preferencia se activa mientras la compuerta está en pantalla, la compuerta SHALL desaparecer en el cuadro siguiente. Si el entorno no permite consultar la preferencia, SHALL comportarse como cuando no hay preferencia.

#### Scenario: Preferencia activa al cargar
- **WHEN** el visitante tiene activado el movimiento reducido y carga la home por primera vez en la sesión
- **THEN** no aparece ninguna compuerta y el hero se muestra en su estado final desde el primer render

#### Scenario: Preferencia que cambia en caliente
- **WHEN** el visitante activa el movimiento reducido con la compuerta en pantalla
- **THEN** la compuerta desaparece sin recargar la página

#### Scenario: Entorno sin soporte de la preferencia
- **WHEN** el entorno no permite consultar la preferencia de movimiento
- **THEN** la página no falla y la compuerta se comporta como cuando no hay preferencia

### Requirement: Compuerta accesible y sin trampa de foco
La compuerta SHALL quedar oculta para las tecnologías de asistencia, NO SHALL contener elementos enfocables y NO SHALL retener ni mover el foco. Mientras está en pantalla, el contenido real de la página SHALL seguir disponible para las tecnologías de asistencia.

#### Scenario: Lector de pantalla
- **WHEN** un lector de pantalla recorre la página con la compuerta en pantalla
- **THEN** no anuncia la compuerta, el glifo ni "FACU CODE" y sí anuncia el contenido de la página

#### Scenario: Recorrido con teclado
- **WHEN** el visitante recorre la página con Tab, con la compuerta en pantalla o después
- **THEN** ningún elemento de la compuerta recibe el foco y el foco sigue el orden normal de la página

### Requirement: Desplazamiento bloqueado solo con la compuerta cerrada
Mientras la compuerta está cerrada, la página NO SHALL desplazarse. Cuando la compuerta se abre o se salta, el desplazamiento SHALL quedar habilitado de inmediato. Bloquear y liberar el desplazamiento NO SHALL cambiar el ancho del contenido ni mover la página.

#### Scenario: Intento de desplazamiento con la compuerta cerrada
- **WHEN** algo intenta desplazar la página con la compuerta cerrada, sin un gesto del visitante que la salte
- **THEN** la página sigue en su posición inicial

#### Scenario: Liberación sin salto de diseño
- **WHEN** la compuerta se abre o se salta en una pantalla con barra de desplazamiento visible
- **THEN** el contenido conserva su ancho y su posición y no se registra un desplazamiento de diseño atribuible al bloqueo

#### Scenario: Desplazamiento después de abrir
- **WHEN** la compuerta terminó de abrirse
- **THEN** la página se desplaza normalmente con la rueda, el teclado y los gestos táctiles

### Requirement: La página real carga debajo sin costo
La página SHALL renderizarse completa debajo de la compuerta desde el primer cuadro: la compuerta es una capa encima, no una condición para mostrar el contenido. La compuerta NO SHALL elevar el CLS de la home por encima de 0,1, NO SHALL empeorar el LCP más allá de los límites de la sección de presentación y NO SHALL requerir scripts ni estilos inline ni dependencias nuevas.

#### Scenario: Contenido presente desde el inicio
- **WHEN** se inspecciona el contenido de la home en el primer render con la compuerta cerrada
- **THEN** el contenido de todas las secciones ya está presente y sus imágenes prioritarias ya se solicitaron

#### Scenario: Sin JavaScript
- **WHEN** la home se carga sin JavaScript
- **THEN** el documento no contiene ninguna compuerta ni ningún script inline que la dibuje

#### Scenario: Política de seguridad de contenido
- **WHEN** la home se sirve con la política de seguridad de contenido del sitio
- **THEN** la compuerta se ve y se abre completa y no se registra ninguna violación de la política en la consola

#### Scenario: Estabilidad visual
- **WHEN** se mide la carga de la home con la compuerta en 1440×900 y en 375×812
- **THEN** el CLS es menor o igual a 0,1
