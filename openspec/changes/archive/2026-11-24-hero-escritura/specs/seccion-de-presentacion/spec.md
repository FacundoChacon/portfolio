# Spec Delta

## MODIFIED Requirements

### Requirement: Movimiento de entrada según preferencia
Sin preferencia de movimiento reducido, la sección SHALL entrar escrita en tres fases sucesivas. En la fase A, el kicker, el nombre, el subtítulo y la descripción se escriben de izquierda a derecha en orden de lectura y después aparecen las acciones. En la fase B aparece la tarjeta del retrato con el marco del panel de datos. En la fase C las filas del panel se escriben de derecha a izquierda, en orden. La entrada completa NO SHALL superar 3,5 segundos. Con movimiento reducido, nada se anima ni se desplaza.

#### Scenario: Movimiento reducido activo
- **WHEN** el visitante tiene activada la preferencia de movimiento reducido
- **THEN** todos los elementos de la sección se muestran en su estado final desde el primer render, sin escritura, sin animación y sin traslación al hacer hover

#### Scenario: Sin preferencia de movimiento reducido
- **WHEN** el visitante no pidió movimiento reducido y carga la home
- **THEN** el kicker, el nombre, el subtítulo y la descripción se escriben uno después del otro, cada uno de izquierda a derecha, y las acciones aparecen recién cuando terminó la descripción

#### Scenario: Retrato después del texto
- **WHEN** termina la fase A
- **THEN** aparece la tarjeta del retrato junto con el marco del panel de datos, y antes de ese momento el retrato no se ve

#### Scenario: Panel escrito de derecha a izquierda
- **WHEN** termina la fase B
- **THEN** las filas Rol, Stack, Ubicación y Estado se escriben en ese orden; en cada fila los caracteres aparecen desde el extremo derecho hacia la izquierda, primero el valor y después la etiqueta, y cada carácter aparece ya en su posición final

#### Scenario: Duración acotada
- **WHEN** se mide la entrada desde el primer render hasta que el último carácter del panel es visible
- **THEN** la duración no supera 3,5 segundos

#### Scenario: Sin efectos intermitentes
- **WHEN** la sección está en pantalla por cualquier tiempo, durante o después de la entrada
- **THEN** ningún texto ni elemento parpadea, titila ni se revuelve de forma periódica; el indicador de escritura, si se muestra, es fijo y desaparece al terminar cada texto

### Requirement: Carga prioritaria del retrato
El retrato SHALL cargarse con prioridad alta, sin carga diferida, y SHALL reservar su espacio antes de descargarse, de modo que su aparición no desplace contenido. La entrada animada NO SHALL demorar la descarga ni el pintado de la imagen del retrato: su aparición en la fase B SHALL lograrse descubriendo una imagen ya pintada. El rediseño NO SHALL elevar el CLS de la home por encima de 0.1.

#### Scenario: Espacio reservado
- **WHEN** la home se carga con la imagen todavía en descarga
- **THEN** el recuadro del retrato ya ocupa su tamaño final y nada se mueve cuando la imagen llega

#### Scenario: Prioridad de descarga
- **WHEN** el navegador descubre el retrato
- **THEN** lo solicita con prioridad alta y sin esperar a que entre en el viewport ni a que avance la entrada animada

#### Scenario: Métricas no empeoran
- **WHEN** se mide la home construida en escritorio (1440px), sin movimiento reducido, antes y después del cambio en las mismas condiciones
- **THEN** el LCP no supera al de la versión anterior más un margen de 10% y el CLS es menor o igual a 0.1

#### Scenario: Métricas en móvil
- **WHEN** se mide la home construida en móvil (375px), sin movimiento reducido, antes y después del cambio en las mismas condiciones
- **THEN** el LCP no supera al de la versión anterior en más de 1 segundo y el CLS es menor o igual a 0.1

#### Scenario: Métricas con movimiento reducido
- **WHEN** se mide la home construida con movimiento reducido en 1440px y en 375px
- **THEN** el LCP no supera al de la versión anterior más un margen de 10% y el CLS es menor o igual a 0.1

## ADDED Requirements

### Requirement: Entrada escrita una sola vez y sin bloquear
La entrada escrita SHALL ejecutarse como máximo una vez por carga de página. Cualquier interacción de teclado o foco dentro de la sección SHALL completarla al instante, igual que activar la preferencia de movimiento reducido durante la entrada. Ninguna acción SHALL quedar inaccesible mientras dura.

#### Scenario: Volver a la home sin recargar
- **WHEN** el visitante ya vio la entrada, navega a otra ruta del sitio y vuelve a la home sin recargar la página
- **THEN** la sección se muestra en su estado final, sin volver a escribirse

#### Scenario: Teclado durante la entrada
- **WHEN** el visitante presiona una tecla o mueve el foco a un elemento de la sección antes de que termine la entrada
- **THEN** todos los textos, el retrato, el panel y las acciones quedan en su estado final en ese mismo momento, y el elemento enfocado muestra su indicador de foco

#### Scenario: Preferencia que cambia en caliente
- **WHEN** el visitante activa la preferencia de movimiento reducido con la entrada en curso
- **THEN** la sección pasa a su estado final sin recargar la página

#### Scenario: Entorno sin soporte de la preferencia
- **WHEN** el entorno no permite consultar la preferencia de movimiento
- **THEN** la sección no falla y se comporta como cuando no hay preferencia

### Requirement: Texto escrito accesible y estable
Durante la entrada escrita, el texto real completo de cada elemento SHALL estar en el contenido de la página desde el primer render, y las tecnologías de asistencia SHALL recibir solo ese texto, nunca fragmentos ni caracteres sueltos. El espacio final de cada texto SHALL estar reservado desde el inicio, de modo que escribirlo no desplace contenido ni cambie sus cortes de línea. La entrada NO SHALL depender de estilos inline.

#### Scenario: Lector de pantalla durante la escritura
- **WHEN** un lector de pantalla recorre la sección mientras un texto se está escribiendo
- **THEN** anuncia el texto real completo de cada elemento (nombre, rol, descripción, filas del panel) una sola vez, sin anunciar los caracteres parciales ni el indicador de escritura

#### Scenario: Texto completo en el contenido inicial
- **WHEN** se inspecciona el contenido de la sección en el primer render, antes de que se escriba ningún carácter
- **THEN** el contenido incluye el texto completo del nombre, el rol, la descripción y las cuatro filas del panel

#### Scenario: Sin desplazamiento al escribir
- **WHEN** se escribe cualquier texto de la sección, en cualquier ancho de pantalla
- **THEN** ningún carácter ya visible cambia de posición, los textos conservan sus líneas finales y el CLS medido de la carga es menor o igual a 0.1

#### Scenario: Compatible con la política de seguridad de contenido
- **WHEN** la home se sirve con la política de seguridad de contenido del sitio, que no permite estilos inline
- **THEN** la entrada se ve completa y no se registra ninguna violación de la política en la consola

### Requirement: Columnas equilibradas en la presentación
Desde 768px de ancho, la columna del retrato NO SHALL terminar más de 96px por debajo del final de las acciones, y el alto de la sección SHALL depender de su contenido, sin forzar el alto de la pantalla. El retrato SHALL conservar su proporción y su ancho, y el panel de datos SHALL quedar superpuesto como máximo al tercio inferior del retrato, sin tapar la cara.

#### Scenario: Escritorio sin hueco bajo las acciones
- **WHEN** la home se muestra a 1024, 1280, 1440 o 1920px de ancho
- **THEN** la distancia entre el final de las acciones y el final del panel de datos es de 96px o menos, y la sección no es más alta que su contenido más sus márgenes

#### Scenario: Tablet
- **WHEN** la home se muestra a 768px de ancho
- **THEN** la distancia entre el final de las acciones y el final del panel de datos es de 96px o menos y el panel cubre como máximo un tercio del alto del retrato

#### Scenario: Retrato sin achicarse
- **WHEN** se compara el retrato antes y después del cambio en 1440px
- **THEN** conserva su proporción 4:5 y su ancho, y la cara queda visible por encima del panel de datos

#### Scenario: Móvil sin regresión
- **WHEN** la home se muestra a 375px de ancho
- **THEN** las columnas siguen apiladas como antes, sin superposición del panel sobre el retrato y sin desplazamiento horizontal
