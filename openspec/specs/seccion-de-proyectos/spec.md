# seccion-de-proyectos Specification

## Purpose
Define la sección de proyectos de la home como un panel de comando de cristal plano que muestra los proyectos en una ventana deslizante: 3, 2 o 1 cards rectangulares según el ancho, movidas de a una con las flechas ◀ ▶. Cada card enlaza entera a la demo en vivo, tiene un efecto de lámina cristalina 2.5D y un botón al repositorio de GitHub ("Repo privado" cuando no hay). Detrás, un tanque de líquido naranja LCL llena 2/3 del panel, con respiración suave, burbujas y ondas sutiles al puntero, sin motor 3D.

## Requirements

### Requirement: Rendimiento del recorrido

El panel SHALL desplazar las cards solo con transformaciones de composición (sin recalcular el layout por cuadro), sin bloquear el scroll del navegador, sin volver a renderizar los componentes en cada cuadro del líquido y sin librerías de animación de terceros. La sección SHALL respetar la política de seguridad de contenidos sin ampliarla y SHALL cargar solo recursos del propio sitio.

#### Scenario: Consola limpia
- **WHEN** el visitante recorre la sección y mueve el cursor sobre el líquido en el sitio con la CSP de producción
- **THEN** la consola no muestra violaciones de CSP ni errores, y no hay pedidos de red a otros dominios

#### Scenario: Cambio de tamaño de ventana
- **WHEN** el visitante cambia el ancho o el alto de la ventana con los proyectos 3 a 5 visibles
- **THEN** el panel ajusta la cantidad de cards y el líquido a su nuevo tamaño, sigue mostrando una ventana completa que incluye el quinto proyecto y la página no tiene desplazamiento horizontal

### Requirement: Ciclo de vida de la animación

El líquido SHALL usar un único bucle de animación, que SHALL correr mientras el panel está a la vista, la pestaña visible y sin movimiento reducido (con una tasa de cuadros reducida cuando solo hay ondulación ambiental), SHALL detenerse cuando la pestaña está oculta o el panel está fuera de pantalla, y SHALL reanudarse sin saltos acumulados. Al desmontarse la sección o pasar al cuadro estático de movimiento reducido, SHALL liberar sus bucles, observadores y escuchas.

#### Scenario: Sección fuera de pantalla
- **WHEN** el visitante scrollea hasta la sección de contacto
- **THEN** el líquido deja de pedir cuadros de animación

#### Scenario: Pestaña oculta y regreso
- **WHEN** el visitante cambia de pestaña con el líquido ondulando y vuelve después de unos segundos
- **THEN** el bucle estuvo detenido y el líquido continúa desde donde estaba, sin saltar ni acumular ondas

#### Scenario: Liberación al pasar al respaldo
- **WHEN** el líquido pasa a su cuadro estático (por activar movimiento reducido) o la sección se desmonta
- **THEN** no quedan bucles de animación, observadores ni escuchas del líquido activos

#### Scenario: Reposo sin cuadros
- **WHEN** el visitante deja de mover el cursor y las ondas se calman, con el panel a la vista
- **THEN** el líquido sigue respirando con un único bucle de tasa reducida (no más de ~30 cuadros por segundo) y vuelve a la tasa completa solo cuando una interacción lo excita

### Requirement: Panel de comando con cards planas

La sección SHALL presentar los proyectos dentro de un único panel de cristal estático con marco violeta, claramente translúcido (se distingue la grilla de fondo desenfocada y un reflejo en el borde superior) y con su barra superior también de cristal, a modo de panel de comando, con una barra superior que contiene los controles de navegación y el indicador de posición. Las cards SHALL ser rectángulos planos en reposo (sin curvatura, sin bordes redondeados, sin inclinación ni perspectiva) y todas de la misma altura; solo se inclinan con el efecto "foil" mientras un puntero fino las recorre.

#### Scenario: Tres cards en escritorio
- **WHEN** el visitante ve la sección a 1440×900
- **THEN** ve un panel de cristal con marco violeta y, dentro, tres cards de proyecto lado a lado, alineadas y del mismo tamaño

#### Scenario: Cristal translúcido
- **WHEN** el visitante mira el panel sobre la grilla hexagonal de la sección
- **THEN** ve la grilla desenfocada a través del panel, un reflejo claro en su borde superior y un marco violeta translúcido, y el texto de la barra sigue legible con contraste de al menos 4.5:1; en navegadores sin desenfoque de fondo el panel se ve opaco

#### Scenario: Cards planas
- **WHEN** el visitante mira las cards en cualquier ancho sin pasar el puntero por ellas
- **THEN** ninguna card se ve curvada, redondeada, inclinada ni en perspectiva

#### Scenario: Alturas iguales
- **WHEN** en la ventana visible conviven un proyecto con repositorio y uno con "Repo privado", o descripciones de distinto largo
- **THEN** todas las cards visibles tienen la misma altura y sus botones quedan alineados abajo

#### Scenario: Panel estático
- **WHEN** el visitante pasa el puntero por el panel o navega entre proyectos
- **THEN** el panel de cristal no se traslada, no escala y no cambia su desenfoque; solo se desplazan las cards dentro de él

### Requirement: Cantidad de cards según el ancho

El panel SHALL mostrar 1 card en anchos menores a 640 px, 2 cards desde 640 px hasta menos de 1024 px y 3 cards desde 1024 px. La ventana visible SHALL estar siempre completa (sin huecos) y, al cambiar el ancho, SHALL ajustarse sin dejar huecos ni perder el primer proyecto visible cuando sea posible.

#### Scenario: Teléfono
- **WHEN** el visitante ve la sección a 375×667
- **THEN** ve una sola card que ocupa el ancho útil del panel

#### Scenario: Tablet
- **WHEN** el visitante ve la sección a 768×1024
- **THEN** ve dos cards lado a lado

#### Scenario: Escritorio
- **WHEN** el visitante ve la sección a 1280×720 o 1440×900
- **THEN** ve tres cards lado a lado

#### Scenario: Ensanchar la ventana al final
- **WHEN** a 375 px de ancho el quinto proyecto está visible y el visitante ensancha la ventana a 1440 px
- **THEN** el panel muestra los proyectos 3, 4 y 5, sin huecos a la derecha

### Requirement: Navegación de a un proyecto

El panel SHALL ofrecer botones "anterior" y "siguiente" que corren la ventana visible exactamente un proyecto por activación (1-2-3 → 2-3-4 → 3-4-5). En los extremos el botón correspondiente SHALL quedar deshabilitado (sin vuelta al otro extremo) pero enfocable, y activarlo no SHALL hacer nada. Si todos los proyectos entran en la ventana, los botones no SHALL mostrarse.

#### Scenario: Avanzar uno
- **WHEN** a 1440×900 se ven los proyectos 1, 2 y 3 y el visitante activa "siguiente"
- **THEN** pasan a verse los proyectos 2, 3 y 4

#### Scenario: Extremo final
- **WHEN** se ven los proyectos 3, 4 y 5
- **THEN** el botón "siguiente" se anuncia como deshabilitado, se ve atenuado, conserva el foco si lo tenía y activarlo no cambia la ventana

#### Scenario: Extremo inicial
- **WHEN** se ve el primer proyecto al comienzo de la ventana
- **THEN** el botón "anterior" está deshabilitado y "siguiente" está activo

#### Scenario: Teclado
- **WHEN** el foco está en el botón "siguiente" y el visitante pulsa Enter o Espacio
- **THEN** la ventana avanza un proyecto y el foco permanece en el botón

#### Scenario: Nombre accesible de los botones
- **WHEN** un lector de pantalla llega a los botones de navegación
- **THEN** los anuncia como "Proyecto anterior" y "Proyecto siguiente", con su estado deshabilitado cuando corresponde

#### Scenario: Todo entra en la ventana
- **WHEN** la cantidad de proyectos es menor o igual a la cantidad de cards visibles
- **THEN** no se muestran los botones ni el indicador de posición

### Requirement: Indicador de posición y anuncio

El panel SHALL mostrar un indicador de posición con el rango visible y el total (por ejemplo "01–03 / 05", o "03 / 05" con una sola card). Cada cambio de ventana provocado por el visitante SHALL anunciarse de forma cortés a las tecnologías asistivas con el rango visible; cargar la página o cambiar el ancho no SHALL generar anuncios.

#### Scenario: Indicador en escritorio
- **WHEN** a 1440×900 se ven los proyectos 2, 3 y 4
- **THEN** el indicador muestra "02–04 / 05"

#### Scenario: Indicador en teléfono
- **WHEN** a 375×667 se ve el tercer proyecto
- **THEN** el indicador muestra "03 / 05"

#### Scenario: Anuncio al avanzar
- **WHEN** a 1440×900 el visitante activa "siguiente" desde la primera ventana
- **THEN** un lector de pantalla anuncia, sin interrumpir, "Proyectos 2 a 4 de 5"

#### Scenario: Sin anuncio al cargar
- **WHEN** la página se carga o cambia de ancho sin que el visitante navegue el panel
- **THEN** no se anuncia ningún cambio de ventana

### Requirement: Deslizar en pantallas táctiles

En pantallas táctiles, deslizar el dedo en horizontal sobre las cards SHALL correr la ventana un proyecto (hacia la izquierda avanza, hacia la derecha retrocede), con los mismos límites que los botones. Deslizar en vertical SHALL desplazar la página de forma nativa, sin bloquearse.

#### Scenario: Deslizar a la izquierda
- **WHEN** a 375×667 el visitante desliza el dedo hacia la izquierda sobre la primera card
- **THEN** pasa a verse el segundo proyecto y el indicador muestra "02 / 05"

#### Scenario: Deslizar en vertical
- **WHEN** a 375×667 el visitante desliza el dedo hacia arriba sobre una card
- **THEN** la página se desplaza normalmente y la ventana del panel no cambia

#### Scenario: Gesto corto
- **WHEN** el visitante toca una card y mueve el dedo apenas unos píxeles
- **THEN** la ventana no cambia

### Requirement: Contenido de cada card del panel

Cada card SHALL mostrar, en el orden de los datos, la foto del proyecto, su título, su estado en texto (Demo, En el mercado o En curso), su descripción recortada visualmente a 3 líneas y hasta 3 etiquetas de tecnología seguidas de "+N" cuando hay más. El texto completo de la descripción y de las etiquetas SHALL seguir disponible para tecnologías asistivas.

#### Scenario: Card con muchas etiquetas
- **WHEN** el visitante ve la card de "Tienda-Electronica" (6 etiquetas)
- **THEN** ve su foto, su título, el estado "Demo", la descripción en no más de 3 líneas, las etiquetas "Java 17", "Spring Boot" y "React 18" y una marca "+3"

#### Scenario: Card con pocas etiquetas
- **WHEN** el visitante ve la card de "Odontologia-Carolina" (3 etiquetas)
- **THEN** ve las tres etiquetas y ninguna marca "+N"

#### Scenario: Texto completo para lectores de pantalla
- **WHEN** un lector de pantalla recorre la card de "3-Esquinas"
- **THEN** lee la descripción completa y las seis tecnologías, aunque visualmente se vean recortadas

#### Scenario: Datos sin cambios
- **WHEN** se compara la sección rediseñada con la anterior
- **THEN** los títulos, descripciones, imágenes, etiquetas, estados y URLs de los cinco proyectos son los mismos, y no aparece ningún proyecto, imagen ni URL ajenos a los datos del portfolio

### Requirement: Card entera hacia la demo y botón de repositorio

Toda la superficie de cada card SHALL ser un único enlace a la demo del proyecto que se abre en una pestaña nueva sin dar acceso a la página de origen, con un nombre accesible que incluye el título y que se abre en una pestaña nueva; la card no SHALL contener enlaces anidados ni un segundo enlace a la demo. Cada card SHALL tener además un botón "Repositorio", por encima del enlace de la card, que abre el repositorio en una pestaña nueva o, si el proyecto no tiene repositorio público, un botón gris "Repo privado" que no es un enlace ni se puede activar.

#### Scenario: Clic en la card
- **WHEN** el visitante hace clic en la foto, en el texto o en cualquier parte de la card de "Bodega" fuera del botón de repositorio
- **THEN** se abre la demo de "Bodega" en una pestaña nueva

#### Scenario: Nombre accesible de la card
- **WHEN** un lector de pantalla enfoca el enlace de la card de "CIMMA-Dentistry"
- **THEN** anuncia un enlace que nombra "CIMMA-Dentistry", que lleva a su sitio y que se abre en una pestaña nueva, y la card contiene un solo enlace a la demo

#### Scenario: Botón de repositorio
- **WHEN** el visitante activa "Repositorio" en la card de "Tienda-Electronica"
- **THEN** se abre su repositorio en GitHub en una pestaña nueva y no la demo

#### Scenario: Proyecto sin repositorio
- **WHEN** el visitante ve la card de "Odontologia-Carolina" o de "3-Esquinas"
- **THEN** en lugar de "Repositorio" ve un botón gris "Repo privado" del mismo tamaño, que no lleva a ningún lado

#### Scenario: Repo privado no activable
- **WHEN** el visitante hace clic en "Repo privado" o lo recorre con Tab
- **THEN** no se abre nada, no recibe el foco de Tab y un lector de pantalla que lo lee lo anuncia como no disponible

### Requirement: Foil 2.5D de las cards

Con un puntero fino (ratón) y sin movimiento reducido, la card bajo el puntero SHALL levantarse (translateZ y escala) e inclinarse en perspectiva según la posición del puntero respecto del centro de la pantalla (hasta 13° en horizontal y 9° en vertical), con un brillo blanco y un velo cristalino sin tonos de color que acompañan al puntero por encima de la foto y del texto, sombra reactiva y filo cristalino, y SHALL volver al reposo al salir el puntero, perder el foco, cancelarse el gesto o pulsar Escape. Con foco de teclado en la card, SHALL quedar levantada y estática, sin inclinarse, con un indicador de foco visible. En pantallas táctiles el efecto SHALL estar apagado y el deslizamiento horizontal SHALL seguir moviendo la ventana. Con movimiento reducido no SHALL haber inclinación, transiciones ni brillos.

#### Scenario: Inclinación con el puntero
- **WHEN** a 1440×1000 el visitante mueve el ratón sobre una card cerca de su borde derecho y luego de su borde izquierdo
- **THEN** la card se levanta, se inclina hacia un lado y luego hacia el otro, el brillo blanco se desplaza con el puntero y la sombra se acentúa, sin que aparezca ningún arcoíris

#### Scenario: Reposo al salir
- **WHEN** el puntero sale de la card
- **THEN** la card vuelve plana a su posición, sin brillo ni sombra reforzada

#### Scenario: Foco de teclado
- **WHEN** el visitante llega con Tab al enlace de una card
- **THEN** la card se ve levantada, sin inclinación, con su anillo de foco, y Escape la devuelve al reposo

#### Scenario: Táctil sin inclinación
- **WHEN** a 390×844 el visitante toca o desliza sobre una card
- **THEN** la card no se inclina, el deslizamiento horizontal sigue moviendo la ventana y el scroll vertical es libre

#### Scenario: Movimiento reducido en el foil
- **WHEN** con movimiento reducido el visitante pasa el puntero por una card
- **THEN** la card no se mueve ni muestra brillos

### Requirement: Lista accesible de proyectos

La sección SHALL exponer los proyectos como una lista en el orden de los datos, con los cinco elementos presentes para tecnologías asistivas aunque estén fuera de la ventana visible (ninguno oculto ni inerte). Cada card SHALL incluir el texto para lectores de pantalla "Proyecto X de N", con N igual a la cantidad de proyectos.

#### Scenario: Lector de pantalla con la primera ventana
- **WHEN** a 1440×900 un lector de pantalla recorre la sección con los proyectos 1 a 3 visibles
- **THEN** encuentra una lista de cinco elementos en el orden de los datos, y el cuarto se anuncia como "Proyecto 4 de 5"

#### Scenario: Elementos fuera de la ventana
- **WHEN** a 375×667 solo se ve el primer proyecto
- **THEN** los otros cuatro siguen en la lista, legibles por un lector de pantalla y alcanzables con Tab

### Requirement: Foco de teclado dentro del panel

Cuando el foco de teclado llega a un elemento de una card fuera de la ventana visible, el panel SHALL correr la ventana lo mínimo necesario para que esa card quede visible, y el elemento enfocado SHALL verse con su indicador de foco completo dentro de la card. Tab SHALL poder entrar y salir del panel hacia adelante y hacia atrás sin quedar atrapado.

#### Scenario: Tab hacia el cuarto proyecto
- **WHEN** a 1440×900, con los proyectos 1 a 3 visibles, el visitante avanza con Tab hasta la foto de "Odontologia-Carolina"
- **THEN** la ventana pasa a los proyectos 2 a 4 y la foto se ve con el contorno de foco

#### Scenario: Shift+Tab de vuelta
- **WHEN** con los proyectos 3 a 5 visibles el visitante retrocede con Shift+Tab hasta un elemento del segundo proyecto
- **THEN** la ventana pasa a los proyectos 2 a 4

#### Scenario: Salida con Tab
- **WHEN** el foco está en el último elemento enfocable del quinto proyecto y el visitante pulsa Tab
- **THEN** el foco pasa al cierre debajo del panel y, después, a la sección siguiente

### Requirement: Cierre hacia GitHub y contacto

Debajo del panel, la sección SHALL ofrecer un cierre que no forma parte de la ventana de proyectos, con un enlace "Ver GitHub" que abre el perfil en una pestaña nueva y un enlace "Contactame" que lleva a la sección de contacto de la home sin recargar.

#### Scenario: Ver GitHub
- **WHEN** el visitante activa "Ver GitHub" en el cierre
- **THEN** se abre el perfil de GitHub en una pestaña nueva

#### Scenario: Ir a contacto
- **WHEN** el visitante activa "Contactame" en el cierre
- **THEN** la página se desplaza a la sección de contacto sin recargar

#### Scenario: Fuera de la navegación
- **WHEN** el visitante recorre todos los proyectos con los botones
- **THEN** el cierre nunca aparece como una card ni cuenta en el indicador de posición

### Requirement: Tanque de LCL

El líquido SHALL llenar el panel hasta 2/3 de su alto en calma, sin que ninguna cresta supere ~9% del alto del panel sobre ese nivel ni llegue a la barra superior, y SHALL mostrar un líquido naranja (LCL) translúcido (se ve a través, más denso hacia el fondo) detrás de las cards, con unas pocas burbujas que suben lentamente y desaparecen al llegar a la superficie, como decoración oculta a tecnologías asistivas. Mover el cursor sobre el panel SHALL generar ondas en la superficie proporcionales a su velocidad y con amplitud acotada; las ondas SHALL ser sutiles (viscosas, de baja amplitud) y calmarse pronto; en pantallas táctiles, tocar el panel SHALL generar una onda suave. Sin interacción, el líquido SHALL respirar: una ondulación suave, lenta y de baja amplitud, presente mientras el panel está a la vista (pestaña visible y sin movimiento reducido).

#### Scenario: Líquido en reposo
- **WHEN** el visitante ve el panel sin mover el cursor
- **THEN** ve el líquido naranja llenando aproximadamente 2/3 del alto del panel, detrás de las cards, con la superficie ondulando suave y lentamente

#### Scenario: Burbujas
- **WHEN** el visitante mira el líquido durante unos segundos
- **THEN** ve entre 8 y 14 burbujas pequeñas, translúcidas y con un brillo, que suben despacio con un leve vaivén lateral, siguen la altura de la superficie y reaparecen abajo al llegar a ella, sin salirse del tanque

#### Scenario: Ondas con el cursor
- **WHEN** a 1440×900 el visitante mueve el cursor horizontalmente sobre el panel
- **THEN** la superficie del líquido forma ondas cerca de la posición del cursor que se propagan a los costados y se calman solas al dejar de moverlo, volviendo a la respiración suave

#### Scenario: Movimiento brusco
- **WHEN** el visitante sacude el cursor muy rápido sobre el panel
- **THEN** las ondas no superan su altura máxima ni tapan la parte superior de las cards

#### Scenario: Toque en táctil
- **WHEN** a 375×667 el visitante toca el panel
- **THEN** se forma una onda en el punto tocado y el gesto de scroll de la página no se bloquea

#### Scenario: Decorativo para tecnologías asistivas
- **WHEN** un lector de pantalla recorre el panel
- **THEN** no anuncia el líquido ni el lienzo donde se dibuja

### Requirement: Legibilidad sobre el LCL

Todo texto de las cards en reposo o con foco de teclado SHALL alcanzar contraste WCAG ≥ 4.5:1 (el brillo del foil lo reduce solo de forma transitoria mientras el puntero está sobre la card) contra el fondo semiopaco propio de la card compuesto sobre los peores casos del líquido (naranja sólido y el brillo más claro de su cresta), y ese fondo SHALL contrastar ≥ 3:1 con el líquido que lo rodea. Las cards no SHALL usar desenfoque de fondo. Ningún texto ni control SHALL quedar apoyado directamente sobre el líquido fuera de una card (la barra superior queda por encima de la cresta más alta), y los indicadores de foco SHALL dibujarse dentro de la card.

#### Scenario: Texto de la card sobre el líquido
- **WHEN** la parte inferior de una card (descripción, etiquetas, botones) queda delante de la cresta más clara del líquido
- **THEN** el texto en papel, gris, violeta claro, naranja y verde agua de la card alcanza al menos 4.5:1 contra el fondo de la card en ese punto

#### Scenario: Límite de la card sobre el líquido
- **WHEN** una card queda delante del líquido naranja
- **THEN** su fondo se distingue del líquido con un contraste de al menos 3:1, sin depender de un desenfoque

#### Scenario: Regresión al bajar la opacidad de la card
- **WHEN** alguien reduce la opacidad del fondo de la card hasta que algún par queda por debajo de su umbral
- **THEN** la verificación automática falla nombrando el par y el contraste obtenido

#### Scenario: Controles fuera del líquido
- **WHEN** el visitante mira el panel en cualquier ancho
- **THEN** los botones de navegación, el indicador y la etiqueta del panel están en la barra superior, por encima del líquido

### Requirement: Movimiento reducido en el panel

Con `prefers-reduced-motion: reduce`, el cambio de ventana SHALL ser instantáneo y el líquido SHALL dibujarse como un único cuadro estático, sin ondas ni animación, aunque se mueva el cursor o se toque el panel. La preferencia SHALL aplicarse en vivo, sin recargar.

#### Scenario: Navegar con movimiento reducido
- **WHEN** con movimiento reducido el visitante activa "siguiente"
- **THEN** la ventana cambia por corte, sin deslizamiento animado

#### Scenario: Líquido estático
- **WHEN** con movimiento reducido el visitante mueve el cursor sobre el panel
- **THEN** el líquido se ve quieto, con la superficie calma, y no se piden cuadros de animación

#### Scenario: Cambio de preferencia en vivo
- **WHEN** el visitante activa movimiento reducido con la página abierta y el líquido ondulando
- **THEN** el líquido queda en un cuadro estático y el panel conserva la ventana visible, sin recargar

### Requirement: Ancla de la sección

El ancla `#proyectos` SHALL llevar al comienzo de la sección con el título visible, sin quedar tapado por la navegación fija. La sección SHALL desplazarse con el scroll normal de la página, sin fijarse. Navegar el panel no SHALL agregar entradas al historial ni cambiar la posición de scroll de la página.

#### Scenario: Enlace "Proyectos" del nav
- **WHEN** el visitante usa el enlace "Proyectos" de la navegación
- **THEN** ve el título de la sección y el panel debajo de la barra fija, y el enlace "Proyectos" del nav queda marcado como sección activa

#### Scenario: Entrada directa por el ancla
- **WHEN** el visitante carga la home directamente con `/#proyectos` (o cualquier `#id` de sección de la home) en la URL
- **THEN** una vez montada la página, esta se desplaza a esa sección sin animación y sin quedar tapada por la navegación fija; un hash que no corresponde a ningún elemento no provoca ningún desplazamiento

#### Scenario: Scroll sin tramo fijado
- **WHEN** el visitante baja con la rueda a través de la sección
- **THEN** la sección pasa como cualquier otra, sin quedar fija ni cambiar de proyecto por el scroll

#### Scenario: Historial sin entradas por navegación
- **WHEN** el visitante recorre los cinco proyectos con los botones y luego usa Atrás
- **THEN** el navegador sale de la home (o vuelve a la entrada anterior) sin pasar por estados intermedios del panel

### Requirement: Sin motor 3D

La sección no SHALL depender de WebGL ni de un motor 3D: el sitio no SHALL incluir esa dependencia ni descargar código 3D, y la sección SHALL verse completa en cualquier navegador que dibuje HTML, CSS y Canvas 2D. Si el lienzo del líquido no puede crearse, el panel SHALL mostrar un líquido estático equivalente sin errores.

#### Scenario: Navegador sin WebGL
- **WHEN** el visitante abre la home con WebGL deshabilitado
- **THEN** ve el panel completo con sus cards, la navegación y el líquido, sin errores en la consola

#### Scenario: Sin código 3D en el build
- **WHEN** se inspecciona el build de producción
- **THEN** ningún archivo JavaScript contiene el motor 3D y el proyecto no lo declara como dependencia

#### Scenario: Lienzo no disponible
- **WHEN** el navegador no puede crear el contexto de dibujo 2D del líquido
- **THEN** el tercio inferior del panel muestra un líquido naranja estático y la consola no muestra errores
