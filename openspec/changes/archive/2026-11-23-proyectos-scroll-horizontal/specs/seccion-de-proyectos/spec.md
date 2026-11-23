# Spec Delta

## Purpose

Define cómo la home presenta los proyectos del portfolio: paginados de a tres, recorridos horizontalmente mientras la sección queda fijada en pantallas de escritorio, como carrusel nativo en pantallas táctiles o con movimiento reducido, y siempre accesibles por teclado y lector de pantalla.

## ADDED Requirements

### Requirement: Contenido de cada proyecto

La sección SHALL mostrar, para cada proyecto del portfolio y en el orden de los datos, su título, descripción, imagen de vista previa con texto alternativo, etiquetas de tecnología, estado (demo, en el mercado o en curso) expresado con texto, y los enlaces de demo y de repositorio que el proyecto tenga.

#### Scenario: Proyecto con demo y repositorio
- **WHEN** el visitante ve la card de "Tienda-Electronica"
- **THEN** ve su título, descripción, imagen, etiquetas, el estado "Demo" en texto y los enlaces a la demo y al repositorio

#### Scenario: Proyecto sin repositorio
- **WHEN** el visitante ve la card de un proyecto que no tiene repositorio público (por ejemplo "3-Esquinas")
- **THEN** la card muestra el enlace a la demo y no muestra un enlace de repositorio

#### Scenario: Datos sin cambios
- **WHEN** se compara la sección rediseñada con la anterior
- **THEN** los títulos, descripciones, imágenes, etiquetas, estados y URLs de los cinco proyectos son los mismos

### Requirement: Card entera como acceso al proyecto

Cada card de proyecto SHALL funcionar como un único destino principal (la demo, o el repositorio si no hay demo) que se activa al hacer clic en cualquier parte de la card, y los enlaces secundarios de la card SHALL seguir siendo activables por separado. Los enlaces externos SHALL abrirse en una pestaña nueva y anunciarlo a tecnologías asistivas.

#### Scenario: Clic en la superficie de la card
- **WHEN** el visitante hace clic en la imagen o la descripción de una card con demo
- **THEN** se abre la demo del proyecto en una pestaña nueva

#### Scenario: Clic en el enlace de repositorio
- **WHEN** el visitante hace clic en el enlace de repositorio de una card
- **THEN** se abre el repositorio y no la demo

#### Scenario: Nombre accesible del destino principal
- **WHEN** un lector de pantalla enfoca el enlace principal de una card
- **THEN** anuncia el título del proyecto, si lleva a la demo o al repositorio, y que se abre en una pestaña nueva

### Requirement: Paginación de a tres

La sección SHALL agrupar los elementos de la pista en páginas de tres, en el orden de los datos. La cantidad de páginas SHALL ser el cociente redondeado hacia arriba entre la cantidad de elementos y tres (0 elementos → 0 páginas).

#### Scenario: Cinco proyectos más la card de cierre
- **WHEN** hay 5 proyectos y la card de cierre ocupa el hueco
- **THEN** la pista tiene 6 elementos en 2 páginas: proyectos 1–3 en la primera y proyectos 4–5 más la card de cierre en la segunda

#### Scenario: Siete elementos
- **WHEN** la pista tiene 7 elementos
- **THEN** se arman 3 páginas

### Requirement: Card de cierre hacia GitHub y contacto

La sección SHALL ofrecer un cierre con aspecto de panel de sistema que enlaza al perfil de GitHub (pestaña nueva) y a la sección de contacto de la home. Si la cantidad de proyectos no es múltiplo de tres (o es cero), el cierre SHALL ocupar el siguiente lugar de la pista; si es múltiplo de tres, SHALL mostrarse a continuación de la pista sin agregar una página.

#### Scenario: Hueco en la última página
- **WHEN** hay 5 proyectos
- **THEN** la card de cierre ocupa el tercer lugar de la segunda página

#### Scenario: Cantidad múltiplo de tres
- **WHEN** hay 6 proyectos
- **THEN** la pista tiene 2 páginas completas de proyectos y el cierre aparece después de la pista, sin una tercera página

#### Scenario: Ir a contacto desde el cierre
- **WHEN** el visitante activa "Contactame" en el cierre
- **THEN** la página se desplaza a la sección de contacto sin recargar

### Requirement: Recorrido horizontal fijado en escritorio

En pantallas de escritorio con puntero fino, sin preferencia de movimiento reducido y con al menos dos páginas, la sección SHALL quedar fijada ocupando el alto visible mientras el scroll vertical desplaza las páginas horizontalmente, de la primera a la última, y SHALL liberarse al terminar. El tramo fijado SHALL medir entre 200% y 250% del alto visible para dos páginas.

#### Scenario: Avance con la rueda
- **WHEN** el visitante a 1440×900 baja con la rueda dentro de la sección
- **THEN** la sección queda fija y las cards se desplazan hacia la izquierda hasta mostrar la segunda página

#### Scenario: Salida del tramo fijado
- **WHEN** el visitante sigue bajando después de la última página
- **THEN** la sección se libera y aparece la sección siguiente con el scroll normal

#### Scenario: Subir dentro del tramo
- **WHEN** el visitante sube con la rueda dentro del tramo fijado
- **THEN** las páginas se desplazan en sentido inverso hasta la primera

#### Scenario: Una sola página
- **WHEN** la pista tiene tres elementos o menos
- **THEN** la sección no se fija y muestra las cards en una fila sin desplazamiento

### Requirement: Paradas suaves por página

Durante el recorrido fijado, cada página SHALL mantenerse quieta durante un tramo del scroll antes de pasar a la siguiente. Si el scroll se detiene a mitad de una transición, la sección SHALL completar el desplazamiento hasta la página más cercana; cualquier nueva entrada del usuario (rueda, toque, tecla o arrastre) SHALL cancelar ese asentamiento. El scroll vertical de la página no SHALL usar ajuste obligatorio.

#### Scenario: Meseta de página
- **WHEN** el visitante baja un poco al comenzar el tramo fijado
- **THEN** la primera página permanece completa en pantalla sin desplazarse

#### Scenario: Asentamiento al soltar
- **WHEN** el visitante deja de scrollear con dos páginas a medio desplazar
- **THEN** la sección se asienta suavemente en la página más cercana

#### Scenario: Cancelación por el usuario
- **WHEN** durante un asentamiento el visitante vuelve a mover la rueda
- **THEN** el asentamiento se interrumpe y manda el scroll del visitante

### Requirement: Carrusel nativo en táctil, pantallas chicas y movimiento reducido

Con viewport de menos de 768 px de ancho, puntero principal grueso, alto visible insuficiente para el recorrido fijado, sin soporte de recorte de desbordamiento, o con `prefers-reduced-motion: reduce`, la sección no SHALL fijarse: SHALL mostrar las cards en un carrusel horizontal desplazable de forma nativa con ajuste por card y la siguiente card asomando (en teléfonos, cards de aproximadamente 85% del ancho). El modo SHALL actualizarse en vivo si cambian esas condiciones.

#### Scenario: Deslizar en mobile
- **WHEN** el visitante a 375 px de ancho desliza horizontalmente sobre las cards
- **THEN** el carrusel avanza y se ajusta a la card siguiente, y el scroll vertical de la página sigue siendo normal

#### Scenario: Movimiento reducido
- **WHEN** el sistema pide movimiento reducido en una pantalla de escritorio
- **THEN** la sección no se fija ni se anima con el scroll vertical y muestra el carrusel nativo

#### Scenario: Cambio de preferencia en vivo
- **WHEN** el visitante activa movimiento reducido con la página abierta
- **THEN** la sección pasa a carrusel sin recargar y sin dejar las cards desplazadas fuera de vista

### Requirement: Estructura accesible de la lista

Los elementos de la pista SHALL exponerse como una lista en el orden de los datos, con todas las cards siempre presentes y accesibles (ninguna oculta a tecnologías asistivas ni inerte por estar fuera de pantalla). Cada card de proyecto SHALL incluir un texto para lectores de pantalla "Proyecto X de N", con N igual a la cantidad de proyectos.

#### Scenario: Lector de pantalla en la segunda página
- **WHEN** un lector de pantalla recorre la sección con la primera página en pantalla
- **THEN** puede leer las cinco cards de proyecto y el cierre, y la cuarta se anuncia como "Proyecto 4 de 5"

### Requirement: Foco de teclado visible

Cuando el foco de teclado llega a un elemento de una card que está fuera de la vista durante el recorrido fijado, la sección SHALL desplazar el scroll de la página hasta la página que contiene esa card, de modo que el elemento enfocado y su indicador de foco queden visibles. En el carrusel, el elemento enfocado SHALL quedar visible dentro del carrusel.

#### Scenario: Tab hacia la segunda página
- **WHEN** a 1440×900 el visitante recorre con Tab los enlaces de la primera página y continúa a la cuarta card
- **THEN** la sección muestra la segunda página y el enlace enfocado se ve con su contorno de foco

#### Scenario: Shift+Tab de vuelta
- **WHEN** desde la segunda página el visitante retrocede con Shift+Tab a la tercera card
- **THEN** la sección vuelve a mostrar la primera página

### Requirement: Ancla y restauración de posición

El ancla `#proyectos` SHALL llevar al comienzo de la sección mostrando su encabezado y la primera página sin quedar tapado por la navegación fija. Al cargar, al volver con atrás/adelante o al restaurarse la página desde la caché, el desplazamiento horizontal SHALL corresponder a la posición de scroll actual. Avanzar de página no SHALL agregar entradas al historial.

#### Scenario: Enlace "Proyectos" del nav
- **WHEN** el visitante usa el enlace "Proyectos" de la navegación
- **THEN** ve el encabezado de la sección y la primera página completas debajo de la barra fija

#### Scenario: Volver atrás a mitad del tramo
- **WHEN** el visitante deja la home con la segunda página en pantalla, abre otra página y vuelve con Atrás
- **THEN** la sección muestra la página que corresponde a la posición de scroll restaurada, no la primera desplazada

#### Scenario: Historial sin entradas por página
- **WHEN** el visitante recorre las dos páginas y luego usa Atrás
- **THEN** el navegador sale de la home (o vuelve a la entrada anterior) sin pasar por estados intermedios de la sección

### Requirement: Rendimiento del recorrido

El desplazamiento horizontal SHALL actualizarse a lo sumo una vez por cuadro de animación, sin bloquear el scroll del navegador, sin volver a renderizar los componentes en cada cuadro y sin efectos de desenfoque de fondo dentro de la pista animada. La sección SHALL hacerlo sin librerías de animación de terceros y sin violar la política de seguridad de contenidos.

#### Scenario: Consola limpia
- **WHEN** el visitante recorre la sección en el sitio con la CSP de producción
- **THEN** la consola no muestra violaciones de CSP ni errores

#### Scenario: Cambio de tamaño de ventana
- **WHEN** el visitante cambia el ancho o el alto de la ventana con la sección fijada en la segunda página
- **THEN** la sección recalcula su tramo y sigue mostrando la página que corresponde a la posición de scroll, alineada y sin desplazamiento horizontal de la página
