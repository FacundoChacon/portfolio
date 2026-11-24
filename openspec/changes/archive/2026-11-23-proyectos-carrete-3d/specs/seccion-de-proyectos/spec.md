# Spec Delta

> Base: `seccion-de-proyectos` la crea el change `proyectos-scroll-horizontal` (implementado, sin archivar). Ese change debe archivarse antes que este para que MODIFIED/REMOVED encuentren sus requisitos.

## MODIFIED Requirements

### Requirement: Contenido de cada proyecto

La sección SHALL presentar los proyectos del portfolio en el orden de los datos. En el carrete 3D, cada proyecto SHALL mostrarse con su imagen de vista previa, y su título, estado (demo, en el mercado o en curso) y descripción SHALL estar disponibles como texto accesible. En el carrusel de respaldo, cada card SHALL mostrar título, descripción, imagen con texto alternativo, etiquetas de tecnología, estado en texto y los enlaces de demo y repositorio que tenga.

#### Scenario: Proyecto con demo y repositorio
- **WHEN** el visitante ve, en el carrusel de respaldo, la card de "Tienda-Electronica"
- **THEN** ve su título, descripción, imagen, etiquetas, el estado "Demo" en texto y los enlaces a la demo y al repositorio

#### Scenario: Proyecto sin repositorio
- **WHEN** el visitante ve, en el carrusel de respaldo, la card de un proyecto que no tiene repositorio público (por ejemplo "3-Esquinas")
- **THEN** la card muestra el enlace a la demo y no muestra un enlace de repositorio

#### Scenario: Proyecto al frente en el carrete
- **WHEN** "CIMMA-Dentistry" está al frente del carrete
- **THEN** se ve su captura en la card central y un lector de pantalla puede leer su título, el estado "En el mercado" y su descripción

#### Scenario: Datos sin cambios
- **WHEN** se compara la sección rediseñada con la anterior
- **THEN** los títulos, descripciones, imágenes, etiquetas, estados y URLs de los cinco proyectos son los mismos, y no aparece ningún proyecto, imagen ni URL ajenos a los datos del portfolio

### Requirement: Card entera como acceso al proyecto

En el carrusel de respaldo, cada card de proyecto SHALL funcionar como un único destino principal (la demo, o el repositorio si no hay demo) que se activa al hacer clic en cualquier parte de la card, y los enlaces secundarios de la card SHALL seguir siendo activables por separado. En toda la sección, los enlaces externos SHALL abrirse en una pestaña nueva y anunciarlo a tecnologías asistivas.

#### Scenario: Clic en la superficie de la card
- **WHEN** en el carrusel de respaldo el visitante hace clic en la imagen o la descripción de una card con demo
- **THEN** se abre la demo del proyecto en una pestaña nueva

#### Scenario: Clic en el enlace de repositorio
- **WHEN** en el carrusel de respaldo el visitante hace clic en el enlace de repositorio de una card
- **THEN** se abre el repositorio y no la demo

#### Scenario: Nombre accesible del destino principal
- **WHEN** un lector de pantalla enfoca el enlace principal de una card o el enlace de un proyecto del carrete
- **THEN** anuncia el título del proyecto, si lleva a la demo o al repositorio, y que se abre en una pestaña nueva

### Requirement: Card de cierre hacia GitHub y contacto

En el carrete 3D, la sección SHALL ofrecer un enlace chico "Más en GitHub" debajo del carrete, que abre el perfil de GitHub en una pestaña nueva. En el carrusel de respaldo, el cierre SHALL ser una card con aspecto de panel de sistema al final del carrusel que enlaza al perfil de GitHub (pestaña nueva) y a la sección de contacto de la home.

#### Scenario: Hueco en la última página
- **WHEN** hay 5 proyectos (no múltiplo de tres)
- **THEN** no existen páginas ni huecos: en el carrete el enlace "Más en GitHub" va debajo del lienzo y en el carrusel de respaldo el cierre es simplemente la card que sigue al quinto proyecto

#### Scenario: Cantidad múltiplo de tres
- **WHEN** hay 6 proyectos
- **THEN** el carrete gira por los seis proyectos y el cierre (enlace o card de respaldo) aparece después de ellos, sin una página adicional

#### Scenario: Enlace a GitHub en el carrete
- **WHEN** el visitante ve el carrete a 1440×900
- **THEN** debajo del carrete hay un enlace "Más en GitHub" que no es una card ni forma parte de la rotación, y abre el perfil en una pestaña nueva

#### Scenario: Cierre en el carrusel de respaldo
- **WHEN** la sección muestra el carrusel de respaldo
- **THEN** la última card del carrusel es el cierre con los enlaces a GitHub y a contacto

#### Scenario: Ir a contacto desde el cierre
- **WHEN** el visitante activa "Contactame" en el cierre del carrusel de respaldo
- **THEN** la página se desplaza a la sección de contacto sin recargar

### Requirement: Estructura accesible de la lista

La sección SHALL exponer los proyectos como una lista en el orden de los datos, con todos sus elementos presentes para tecnologías asistivas (ninguno oculto ni inerte por estar fuera de pantalla o detrás de otra card). En el carrete, la lista SHALL ser de enlaces, uno por proyecto. En el carrusel de respaldo, cada card SHALL incluir el texto para lectores de pantalla "Proyecto X de N", con N igual a la cantidad de proyectos.

#### Scenario: Lector de pantalla en el carrete
- **WHEN** un lector de pantalla recorre la sección con el primer proyecto al frente
- **THEN** encuentra una lista de cinco enlaces, uno por proyecto, en el orden de los datos

#### Scenario: Lector de pantalla en la segunda página
- **WHEN** un lector de pantalla recorre la sección con el cuarto proyecto al frente del carrete
- **THEN** la lista sigue exponiendo los cinco enlaces de proyecto en el orden de los datos, sin ninguno oculto por estar fuera de pantalla

#### Scenario: Lector de pantalla en el carrusel de respaldo
- **WHEN** un lector de pantalla recorre el carrusel de respaldo con la primera card en pantalla
- **THEN** puede leer las cinco cards de proyecto y el cierre, y la cuarta se anuncia como "Proyecto 4 de 5"

### Requirement: Foco de teclado visible

Cuando el foco de teclado llega al enlace de un proyecto del carrete, la sección SHALL llevar ese proyecto al frente desplazando el scroll de la página hasta su posición, y el enlace enfocado SHALL verse con su indicador de foco. Tab SHALL poder salir de la sección hacia adelante y hacia atrás sin quedar atrapado. En el carrusel de respaldo, el elemento enfocado SHALL quedar visible dentro del carrusel.

#### Scenario: Tab hacia el cuarto proyecto
- **WHEN** a 1440×900 el visitante recorre con Tab los enlaces del carrete hasta el de "Odontologia-Carolina"
- **THEN** el carrete gira hasta dejar ese proyecto al frente y su enlace se ve con el contorno de foco

#### Scenario: Shift+Tab de vuelta
- **WHEN** desde el cuarto proyecto el visitante retrocede con Shift+Tab
- **THEN** el carrete vuelve al tercer proyecto y su enlace queda visible y enfocado

#### Scenario: Salida con Tab
- **WHEN** el foco está en el último enlace de proyecto y el visitante pulsa Tab
- **THEN** el foco pasa al enlace "Más en GitHub" y, con otro Tab, a la sección siguiente

#### Scenario: Tab hacia la segunda página
- **WHEN** en el carrusel de respaldo el visitante recorre con Tab los enlaces hasta la cuarta card
- **THEN** el carrusel se desplaza hasta que la cuarta card y su contorno de foco son visibles

#### Scenario: Foco en el carrusel de respaldo
- **WHEN** en el carrusel de respaldo el foco llega a una card fuera de la vista
- **THEN** el carrusel se desplaza hasta que el elemento enfocado y su contorno de foco son visibles

### Requirement: Ancla y restauración de posición

El ancla `#proyectos` SHALL llevar al comienzo de la sección con el primer proyecto al frente y el título visible, sin quedar tapado por la navegación fija. Al cargar, al volver con atrás/adelante o al restaurarse la página desde la caché, el proyecto al frente SHALL corresponder a la posición de scroll actual, sin animar desde el primero. Cambiar de proyecto no SHALL agregar entradas al historial.

#### Scenario: Enlace "Proyectos" del nav
- **WHEN** el visitante usa el enlace "Proyectos" de la navegación
- **THEN** ve el título de la sección y el primer proyecto al frente debajo de la barra fija, y el enlace "Proyectos" del nav queda marcado como sección activa

#### Scenario: Entrada directa por el ancla
- **WHEN** el visitante carga la home directamente con `/#proyectos` (o cualquier `#id` de sección de la home) en la URL
- **THEN** una vez montada la página, esta se desplaza a esa sección sin animación y sin quedar tapada por la navegación fija; un hash que no corresponde a ningún elemento no provoca ningún desplazamiento

#### Scenario: Volver atrás a mitad del tramo
- **WHEN** el visitante deja la home con el tercer proyecto al frente, abre otra página y vuelve con Atrás
- **THEN** el carrete muestra el proyecto que corresponde a la posición de scroll restaurada, no el primero

#### Scenario: Historial sin entradas por página
- **WHEN** el visitante recorre los cinco proyectos (el carrete no tiene páginas) y luego usa Atrás
- **THEN** el navegador sale de la home (o vuelve a la entrada anterior) sin pasar por estados intermedios de la sección

### Requirement: Rendimiento del recorrido

El carrete SHALL actualizarse con un único bucle de animación por cuadro, sin bloquear el scroll del navegador, sin volver a renderizar los componentes en cada cuadro y sin librerías de animación de terceros. La sección SHALL respetar la política de seguridad de contenidos sin ampliarla y SHALL cargar solo recursos del propio sitio.

#### Scenario: Consola limpia
- **WHEN** el visitante recorre la sección en el sitio con la CSP de producción
- **THEN** la consola no muestra violaciones de CSP ni errores, y no hay pedidos de red a otros dominios

#### Scenario: Cambio de tamaño de ventana
- **WHEN** el visitante cambia el ancho o el alto de la ventana con el tercer proyecto al frente
- **THEN** el carrete se redimensiona al nuevo escenario, sigue mostrando el proyecto que corresponde a la posición de scroll y la página no tiene desplazamiento horizontal

## REMOVED Requirements

### Requirement: Paginación de a tres

**Reason**: El carrete 3D avanza de a un proyecto; no hay páginas. El carrusel de respaldo desplaza por card con ajuste nativo.
**Migration**: Las paradas pasan a ser por proyecto (requisito "Paradas suaves por proyecto"); el cierre deja de ocupar el hueco de la última página (requisito "Card de cierre hacia GitHub y contacto").

### Requirement: Recorrido horizontal fijado en escritorio

**Reason**: El desplazamiento horizontal de la pista se reemplaza por la rotación del carrete 3D, que también se fija y responde al scroll de la página.
**Migration**: Ver "Carrete 3D fijado manejado por el scroll" y "Composición del carrete".

### Requirement: Paradas suaves por página

**Reason**: La unidad de parada pasa de página (tres cards) a proyecto.
**Migration**: Ver "Paradas suaves por proyecto" (misma mecánica de mesetas y asentamiento cancelable).

### Requirement: Carrusel nativo en táctil, pantallas chicas y movimiento reducido

**Reason**: Teléfonos, pantallas táctiles y movimiento reducido ahora usan el carrete (con sus propias reglas); el carrusel queda solo como respaldo cuando el carrete no puede mostrarse.
**Migration**: Ver "Carrusel de respaldo", "Carrete en teléfonos y pantallas táctiles" y "Movimiento reducido en el carrete".

## ADDED Requirements

### Requirement: Carrete 3D fijado manejado por el scroll

Cuando el carrete puede mostrarse, la sección SHALL quedar fijada bajo la barra de navegación mientras el scroll vertical de la página hace girar el carrete del primer proyecto al último, sin dar la vuelta en los extremos, y SHALL liberarse al terminar. La sección no SHALL capturar ni cancelar la rueda. El tramo fijado SHALL medir entre 300% y 400% del alto visible para cinco proyectos.

#### Scenario: Avance con la rueda
- **WHEN** el visitante a 1440×900 baja con la rueda dentro de la sección
- **THEN** la sección queda fija y el carrete gira llevando al frente el segundo proyecto, después el tercero, y así hasta el quinto

#### Scenario: Subir dentro del tramo
- **WHEN** el visitante sube con la rueda dentro del tramo fijado
- **THEN** el carrete gira en sentido inverso hasta el primer proyecto

#### Scenario: Sin vuelta en los extremos
- **WHEN** el quinto proyecto está al frente y el visitante sigue bajando
- **THEN** el carrete no vuelve al primero: la sección se libera y aparece la sección siguiente con el scroll normal

#### Scenario: Rueda sin bloquear
- **WHEN** el visitante usa la rueda o el trackpad sobre el lienzo
- **THEN** la página se desplaza con el comportamiento nativo del navegador (inercia incluida)

### Requirement: Paradas suaves por proyecto

Durante el tramo fijado, cada proyecto SHALL quedar al frente y quieto durante un tramo del scroll antes de pasar al siguiente. Si el scroll se detiene a mitad de un giro, la sección SHALL completar el giro hacia el proyecto más cercano o, si el scroll salió de la meseta en más de una fracción mínima de la transición, hacia el proyecto en el sentido del último movimiento; cualquier nueva entrada del usuario (rueda, toque, tecla o arrastre) SHALL cancelar ese asentamiento. El scroll vertical de la página no SHALL usar ajuste obligatorio.

#### Scenario: Meseta del primer proyecto
- **WHEN** el visitante baja un poco al comenzar el tramo fijado
- **THEN** el primer proyecto permanece al frente sin girar

#### Scenario: Asentamiento al quedar quieto
- **WHEN** el visitante deja de scrollear (unos 300 ms sin entradas) con el carrete entre el segundo y el tercer proyecto, más cerca del tercero
- **THEN** el carrete se asienta suavemente con el tercer proyecto al frente

#### Scenario: Asentamiento en el sentido del movimiento
- **WHEN** el visitante avanza con la rueda a intervalos largos (más de 150 ms entre muescas) y una muesca saca al carrete de la meseta del proyecto actual en una fracción mínima del giro (más de 0,05 de la transición), aunque no llegue a la mitad
- **THEN** el asentamiento completa el giro hacia el proyecto siguiente en lugar de volver al anterior, de modo que scrollear despacio avanza proyecto por proyecto

#### Scenario: Cancelación por el usuario
- **WHEN** durante un asentamiento el visitante vuelve a mover la rueda
- **THEN** el asentamiento se interrumpe y manda el scroll del visitante

### Requirement: Composición del carrete

El carrete SHALL mostrar las capturas de los proyectos como superficies curvas reales con esquinas redondeadas y profundidad, con la card del frente centrada, sobre el fondo de la sección y delante de un título grande "03 // Proyectos" que las cards tapan en parte. En escritorio SHALL verse tres proyectos a la vez. Las caras que miran hacia atrás no SHALL verse. Las capturas SHALL verse sin deformar su proporción y legibles.

#### Scenario: Tres proyectos en escritorio
- **WHEN** el visitante ve el carrete a 1440×900 o 1280×720 con el primer proyecto al frente
- **THEN** ve una card grande al frente de aproximadamente 37% del ancho, otra más alta a la derecha y una tercera girando a la izquierda, todas curvadas

#### Scenario: Título detrás de las cards
- **WHEN** el carrete gira
- **THEN** el título "03 // Proyectos" permanece detrás y queda parcialmente tapado por las cards que pasan por delante

#### Scenario: Captura sin deformar
- **WHEN** el visitante mira la captura de un proyecto cuya imagen tiene una proporción distinta de la card
- **THEN** la captura se recorta para cubrir la card sin estirarse ni aplastarse

#### Scenario: Escenario despojado
- **WHEN** el visitante mira la sección
- **THEN** no hay captions, categorías, contadores, flechas de navegación ni botones de pausa; los únicos textos visibles además del título son el enlace "Ver proyecto ↗", el enlace "Más en GitHub ↗" y la pista "Scrolleá o arrastrá para explorar" abajo al centro

#### Scenario: Sin desbordamiento horizontal
- **WHEN** el visitante ve la sección a 375, 1280 o 1440 px de ancho
- **THEN** la página no tiene desplazamiento horizontal aunque las cards vecinas se corten en los bordes

### Requirement: Carrete en teléfonos y pantallas táctiles

En pantallas angostas y táctiles el carrete SHALL mantenerse fijado y manejado por el scroll de la página, con la card del frente de aproximadamente 77% del ancho y las vecinas recortadas a los costados (sin apilarse en vertical). Deslizar en vertical sobre el lienzo SHALL desplazar la página de forma nativa; el arrastre táctil del carrete SHALL ser solo horizontal.

#### Scenario: Composición en teléfono
- **WHEN** el visitante ve el carrete a 375×812
- **THEN** la card del frente ocupa cerca del 77% del ancho y las vecinas asoman recortadas a los costados

#### Scenario: Deslizar en vertical sobre el lienzo
- **WHEN** a 375×812 el visitante desliza el dedo hacia arriba sobre el lienzo
- **THEN** la página se desplaza normalmente y el carrete gira por el scroll, sin que el gesto quede bloqueado

#### Scenario: Arrastre horizontal en táctil
- **WHEN** a 375×812 el visitante arrastra el dedo hacia la izquierda sobre el lienzo y lo suelta
- **THEN** el carrete avanza y se asienta en el proyecto más cercano

### Requirement: Arrastre y teclado

Arrastrar el carrete hacia la izquierda (o, con mouse, hacia abajo) SHALL avanzar y en sentido contrario retroceder; al soltar, SHALL asentarse en el proyecto más cercano, y una cancelación del gesto SHALL liberar el puntero. Con el foco en la sección, las flechas SHALL mover un proyecto, Inicio llevar al primero y Fin al último; en los extremos, la tecla SHALL conservar su comportamiento nativo. Hacer clic en una card no SHALL abrir nada.

#### Scenario: Arrastre con mouse
- **WHEN** a 1440×900 el visitante arrastra el carrete con el mouse hacia la izquierda y suelta a mitad de camino
- **THEN** el carrete sigue al puntero mientras arrastra y al soltar se asienta en el proyecto más cercano

#### Scenario: Flecha derecha
- **WHEN** el foco está en el enlace del primer proyecto y el visitante pulsa Flecha derecha
- **THEN** el segundo proyecto pasa al frente y el foco queda en su enlace

#### Scenario: Inicio
- **WHEN** con el foco en la sección y el cuarto proyecto al frente el visitante pulsa Inicio
- **THEN** el primer proyecto vuelve al frente

#### Scenario: Flecha en el extremo
- **WHEN** el quinto proyecto está al frente y el visitante pulsa Flecha abajo
- **THEN** la sección no intercepta la tecla y la página se desplaza como siempre

#### Scenario: Clic en una card
- **WHEN** el visitante hace clic (sin arrastrar) sobre una card del carrete
- **THEN** no se abre ningún enlace, modal ni página

### Requirement: Enlace del proyecto al frente

En el carrete SHALL verse un único enlace discreto "Ver proyecto ↗" que lleva al destino principal del proyecto al frente (la demo, o el repositorio si no hay demo) y se actualiza cuando cambia el proyecto al frente. Los enlaces de los demás proyectos SHALL permanecer en la lista accesible, no visibles hasta que reciben el foco.

#### Scenario: Enlace actualizado
- **WHEN** el visitante scrollea hasta dejar "Bodega" al frente y activa "Ver proyecto ↗"
- **THEN** se abre la demo de "Bodega" en una pestaña nueva

#### Scenario: Un solo enlace visible
- **WHEN** el visitante mira el carrete con cualquier proyecto al frente
- **THEN** ve un único enlace "Ver proyecto ↗" y no ve los enlaces de los otros proyectos

### Requirement: Descripción accesible del lienzo

El lienzo del carrete SHALL exponerse como una imagen con un nombre accesible que describe el proyecto al frente (título, estado, descripción y su posición entre los proyectos) y se actualiza cuando cambia el proyecto al frente, sin anunciar cada cuadro.

#### Scenario: Descripción del proyecto al frente
- **WHEN** "Tienda-Electronica" está al frente y un lector de pantalla llega al lienzo
- **THEN** anuncia una imagen cuyo nombre incluye "Tienda-Electronica", "Demo", su descripción y "proyecto 1 de 5"

#### Scenario: Descripción tras girar
- **WHEN** el carrete gira hasta dejar "3-Esquinas" al frente
- **THEN** el nombre accesible del lienzo pasa a describir "3-Esquinas" como "proyecto 5 de 5"

### Requirement: Movimiento reducido en el carrete

Con `prefers-reduced-motion: reduce`, el carrete SHALL mantenerse sin movimiento autónomo: sin ondulación, sin flexión ni inclinación por velocidad y sin giro continuo; el cambio de proyecto (por scroll, arrastre, teclado o foco) SHALL ser instantáneo. La preferencia SHALL aplicarse en vivo.

#### Scenario: Scroll con movimiento reducido
- **WHEN** con movimiento reducido el visitante baja dentro del tramo fijado
- **THEN** el proyecto al frente cambia por corte, sin giro animado, y entre cambios el carrete está completamente quieto

#### Scenario: Cambio de preferencia en vivo
- **WHEN** el visitante activa movimiento reducido con la página abierta
- **THEN** el carrete deja de ondular y de animar sin recargar ni perder el proyecto al frente

### Requirement: Carrusel de respaldo

Si el navegador no ofrece WebGL 2, el contexto gráfico no se puede crear o se pierde, el motor 3D no carga, el alto visible es insuficiente o no hay soporte de recorte de desbordamiento, la sección SHALL mostrar las cards de los proyectos en un carrusel horizontal nativo con ajuste por card, sin fijarse y con el contenido completo de cada proyecto. El modo SHALL actualizarse en vivo si cambian esas condiciones.

#### Scenario: Sin WebGL
- **WHEN** el visitante abre la home en un navegador con WebGL deshabilitado
- **THEN** la sección muestra el carrusel de cards con los cinco proyectos y el cierre, sin tramo fijado y sin errores en la consola

#### Scenario: Falla de carga del motor 3D
- **WHEN** el recurso del motor 3D no se puede descargar
- **THEN** la sección pasa al carrusel de respaldo sin dejar un escenario vacío

#### Scenario: Ventana baja
- **WHEN** el alto visible baja de 600 px con el carrete en pantalla
- **THEN** la sección pasa al carrusel sin recargar y sin dejar al visitante varias pantallas más abajo

### Requirement: Ciclo de vida de la animación

El carrete SHALL usar un único bucle de animación, que SHALL detenerse cuando la pestaña está oculta o la sección está fuera de pantalla y reanudarse sin saltos acumulados. Al desmontarse la sección o pasar al respaldo, SHALL liberar todos sus recursos gráficos, observadores y escuchas.

#### Scenario: Sección fuera de pantalla
- **WHEN** el visitante scrollea hasta la sección de contacto
- **THEN** el carrete deja de pedir cuadros de animación

#### Scenario: Pestaña oculta y regreso
- **WHEN** el visitante cambia de pestaña durante un giro y vuelve después de unos segundos
- **THEN** el bucle estuvo detenido y el carrete continúa desde donde estaba, sin saltar

#### Scenario: Liberación al pasar al respaldo
- **WHEN** el carrete pasa al carrusel de respaldo (por ejemplo, al achicar el alto de la ventana)
- **THEN** se liberan el contexto gráfico, las texturas, las geometrías y los materiales, y no quedan bucles ni escuchas activos

### Requirement: Carga diferida del motor 3D

El motor 3D y las texturas del carrete no SHALL formar parte de la carga inicial de la página: SHALL descargarse cuando la sección se acerca a la vista, y nunca en el modo de respaldo.

#### Scenario: Carga inicial liviana
- **WHEN** el visitante abre la home y no scrollea
- **THEN** el motor 3D no se descargó

#### Scenario: Acercarse a la sección
- **WHEN** el visitante scrollea hacia la sección de proyectos
- **THEN** el motor 3D se descarga antes de que la sección llegue a la vista y el carrete está listo al entrar

#### Scenario: Entrada directa por el ancla
- **WHEN** el visitante abre la home con `#proyectos` en la URL
- **THEN** el carrete se carga y muestra el primer proyecto al frente; mientras carga, la sección no queda vacía
