# interfaz-del-configurador Specification

## Purpose

Define la presentación del wizard de solicitud: el layout de la página del configurador, el indicador de progreso de los cuatro pasos, el resumen en vivo de la selección (sin precios) y la navegación entre pasos.

## Requirements

### Requirement: Layout de dos columnas
La página del configurador SHALL mostrar el contenido del paso actual y un panel de resumen; en pantallas grandes SHALL disponerlos en dos columnas con el resumen fijo al costado, y en pantallas chicas SHALL apilar el resumen debajo del contenido.

#### Scenario: Dos columnas en pantallas grandes
- **WHEN** se abre `/configurador` en una pantalla grande
- **THEN** el contenido del paso y el resumen se muestran en columnas separadas

#### Scenario: Apilado en pantallas chicas
- **WHEN** se abre `/configurador` en una pantalla chica
- **THEN** el resumen se muestra debajo del contenido del paso

#### Scenario: Resumen siempre visible
- **WHEN** el visitante recorre los pasos
- **THEN** el resumen de la selección permanece visible en el panel lateral

### Requirement: Indicador de progreso
El sistema SHALL mostrar los cuatro pasos con su estado (completado, actual o pendiente) y SHALL marcar el paso actual de forma accesible.

#### Scenario: Los cuatro pasos
- **WHEN** se muestra el indicador de progreso
- **THEN** se listan los cuatro pasos del wizard

#### Scenario: Paso actual marcado
- **WHEN** el wizard está en un paso determinado
- **THEN** ese paso se marca como actual y se expone con `aria-current`

#### Scenario: Pasos completados distinguibles
- **WHEN** el visitante avanza de paso
- **THEN** los pasos anteriores se distinguen de los pendientes

### Requirement: Resumen en vivo
El panel de resumen SHALL mostrar la selección actual —el tipo de sitio con su cantidad y los extras elegidos— y SHALL actualizarse cuando cambia la configuración. El resumen NO SHALL mostrar importes.

#### Scenario: Servicio con su cantidad
- **WHEN** hay un servicio seleccionado
- **THEN** el resumen muestra su nombre y, si es mayor a uno, la cantidad

#### Scenario: Extras seleccionados
- **WHEN** hay extras seleccionados
- **THEN** el resumen lista cada extra por su nombre

#### Scenario: El resumen se actualiza al alternar un extra
- **WHEN** el visitante marca o desmarca un extra
- **THEN** el resumen refleja la nueva selección

#### Scenario: Sin extras
- **WHEN** no hay extras seleccionados
- **THEN** el resumen lo indica y no lista ninguno

### Requirement: Navegación entre pasos
El sistema SHALL ofrecer un botón para avanzar y otro para retroceder, y NO SHALL mostrar el botón de retroceso en el primer paso.

#### Scenario: Retroceso oculto en el primer paso
- **WHEN** el wizard está en el primer paso
- **THEN** no se muestra el botón de retroceso

#### Scenario: Retroceso visible desde el segundo paso
- **WHEN** el wizard está en un paso posterior al primero
- **THEN** se muestra el botón de retroceso

#### Scenario: Avance sujeto a la validación
- **WHEN** el visitante intenta avanzar desde el paso de contacto con datos inválidos
- **THEN** no avanza y se muestran los errores

### Requirement: Selección del tipo de sitio
El sistema SHALL mostrar los siete tipos de sitio como tarjetas seleccionables, cada una con su nombre, descripción e icono, y SHALL mantener exactamente una tarjeta seleccionada y distinguible del resto.

#### Scenario: Las siete opciones
- **WHEN** el visitante llega al paso de tipo de sitio
- **THEN** se muestran las siete opciones del catálogo

#### Scenario: Contenido de cada tarjeta
- **WHEN** se muestra una tarjeta de tipo de sitio
- **THEN** muestra su nombre, su descripción y su icono
- **AND** no muestra ningún precio

#### Scenario: Una sola tarjeta seleccionada
- **WHEN** el visitante elige una tarjeta
- **THEN** esa pasa a ser la única seleccionada y la anterior deja de estarlo

#### Scenario: La selección se distingue
- **WHEN** una tarjeta está seleccionada
- **THEN** se distingue visualmente de las demás

### Requirement: Selección de extras
El sistema SHALL mostrar los ocho extras como opciones activables y SHALL permitir marcarlos y desmarcarlos de forma independiente.

#### Scenario: Las ocho opciones
- **WHEN** el visitante llega al paso de extras
- **THEN** se muestran los ocho extras del catálogo

#### Scenario: Marcar y desmarcar
- **WHEN** el visitante activa una opción de extra
- **THEN** el extra queda seleccionado, y al volver a activarla queda desmarcado

#### Scenario: Estado visual del extra
- **WHEN** un extra está seleccionado
- **THEN** su tarjeta se distingue visualmente de las no seleccionadas

### Requirement: Disclaimer de hosting visible
El sistema SHALL mostrar el disclaimer de "Hosting + Dominio" de forma visible dentro de su tarjeta, sin requerir interacción.

#### Scenario: Disclaimer siempre visible
- **WHEN** se muestra la tarjeta de "Hosting + Dominio"
- **THEN** su disclaimer se lee directamente en la tarjeta, sin tooltip ni interacción

### Requirement: Control de cantidad
El sistema SHALL ofrecer un control para sumar y restar unidades del servicio principal, con un mínimo de 1.

#### Scenario: Sumar una unidad
- **WHEN** el visitante activa el control de suma
- **THEN** la cantidad aumenta en uno

#### Scenario: Restar una unidad
- **WHEN** el visitante activa el control de resta con cantidad mayor que 1
- **THEN** la cantidad disminuye en uno

#### Scenario: La cantidad no baja de 1
- **WHEN** la cantidad es 1
- **THEN** no se puede restar por debajo de 1

### Requirement: Robustez de los iconos del catálogo
El sistema SHALL resolver el icono de cada tipo de sitio desde el catálogo y NO SHALL romper cuando el nombre de icono es desconocido.

#### Scenario: Todos los iconos del catálogo resuelven
- **WHEN** se resuelve el icono de cada tipo de sitio del catálogo
- **THEN** todos resuelven a un icono válido

#### Scenario: Nombre de icono desconocido
- **WHEN** se resuelve un nombre de icono que no existe
- **THEN** el sistema devuelve un icono de reemplazo y no falla

### Requirement: Operación por teclado y accesibilidad
El sistema SHALL permitir operar las tarjetas de servicio, las de extras y el control de cantidad con el teclado, y SHALL exponer su estado a las tecnologías de asistencia.

#### Scenario: Selección con el teclado
- **WHEN** el visitante enfoca una tarjeta y la activa con Enter o Espacio
- **THEN** la tarjeta se selecciona o se alterna según corresponda

#### Scenario: Estado expuesto
- **WHEN** una tarjeta de servicio o un extra está seleccionado
- **THEN** su estado se expone con `aria-pressed` y el foco visible en la tarjeta activa

#### Scenario: Foco visible
- **WHEN** el visitante navega con el teclado
- **THEN** el elemento enfocado se distingue visualmente

### Requirement: Formulario de contacto
El sistema SHALL ofrecer en el paso de contacto un formulario con nombre y email obligatorios y teléfono y descripción del proyecto opcionales, con toda la copia en español (es-AR).

#### Scenario: Los cuatro campos
- **WHEN** el visitante llega al paso de contacto
- **THEN** ve un campo para el nombre, uno para el email, uno para el teléfono y uno para la descripción del proyecto

#### Scenario: Obligatorios señalados
- **WHEN** se muestra un campo obligatorio
- **THEN** se indica visualmente que es obligatorio, y los opcionales no

#### Scenario: Los datos quedan en el estado
- **WHEN** el visitante escribe en un campo
- **THEN** ese valor se guarda en los datos de contacto sin borrar los otros campos

### Requirement: Validación inline accesible
El sistema SHALL mostrar los errores de validación junto al campo que los origina, en español, y SHALL exponerlos a las tecnologías de asistencia.

#### Scenario: Error junto al campo
- **WHEN** un campo obligatorio tiene un error
- **THEN** el mensaje de error se muestra junto a ese campo y no en un aviso genérico

#### Scenario: Estado inválido expuesto
- **WHEN** un campo tiene un error
- **THEN** el campo se marca con `aria-invalid` y queda asociado a su mensaje con `aria-describedby`

#### Scenario: Sin error no hay aviso
- **WHEN** un campo no tiene error
- **THEN** no se muestra ningún mensaje ni se marca como inválido

### Requirement: Campo trampa oculto
El sistema SHALL incluir en el formulario un campo trampa (honeypot) que no sea visible, no sea enfocable y no se anuncie a las tecnologías de asistencia. El campo SHALL tener un nombre que el autocompletado del navegador no asocie a datos personales del visitante y SHALL pedir explícitamente que no se autocomplete, para no descartar solicitudes reales.

#### Scenario: El campo trampa no se ve
- **WHEN** el visitante recorre el formulario
- **THEN** el campo trampa no es visible ni recibe el foco al navegar con el teclado

#### Scenario: El campo trampa está presente en el formulario
- **WHEN** se envía el formulario
- **THEN** el valor del campo trampa forma parte de los datos del formulario que evalúa el envío

#### Scenario: El campo trampa no se autocompleta
- **WHEN** el visitante usa el autocompletado del navegador para llenar sus datos de contacto
- **THEN** el campo trampa no tiene un nombre de dato personal (como empresa, organización, nombre, email o teléfono) y declara que no debe autocompletarse

#### Scenario: El campo trampa no viaja al webhook
- **WHEN** se construye el lead para enviarlo
- **THEN** el valor del campo trampa no forma parte del lead

### Requirement: Revisión de la solicitud
El sistema SHALL mostrar en el paso de revisión la configuración completa agrupada en bloques —tipo de sitio con su cantidad, extras y datos de contacto— y la aclaración de que el presupuesto se confirma por email. El paso de revisión NO SHALL mostrar importes.

#### Scenario: Bloques de la configuración
- **WHEN** el visitante llega al paso de revisión
- **THEN** ve un bloque para el tipo de sitio, uno para los extras y uno para sus datos de contacto

#### Scenario: Cantidad solo cuando es mayor a uno
- **WHEN** el servicio tiene cantidad mayor a uno
- **THEN** el bloque del tipo de sitio muestra la cantidad

#### Scenario: Sin extras seleccionados
- **WHEN** no hay extras seleccionados
- **THEN** el bloque de extras lo indica explícitamente en vez de quedar vacío

#### Scenario: Aclaración de presupuesto por email
- **WHEN** se muestra la revisión
- **THEN** se aclara que el presupuesto se envía por email y no se muestra ningún importe

### Requirement: Edición por bloque desde la revisión
El sistema SHALL ofrecer en cada bloque de la revisión una acción de edición que devuelva al paso correspondiente conservando lo ya cargado.

#### Scenario: Editar el tipo de sitio
- **WHEN** el visitante activa la edición del bloque de tipo de sitio
- **THEN** vuelve al paso de tipo de sitio con su selección y cantidad intactas

#### Scenario: Editar los extras
- **WHEN** el visitante activa la edición del bloque de extras
- **THEN** vuelve al paso de extras con su selección intacta

#### Scenario: Editar los datos de contacto
- **WHEN** el visitante activa la edición del bloque de datos de contacto
- **THEN** vuelve al paso de contacto con los datos ya cargados

### Requirement: Inicio del envío desde la revisión
El sistema SHALL ofrecer en el paso de revisión una acción para enviar la solicitud, que inicie el envío sin realizar todavía la llamada de red.

#### Scenario: Iniciar el envío
- **WHEN** el visitante activa el envío con datos válidos
- **THEN** el envío queda iniciado a la espera de la respuesta del transporte

#### Scenario: No enviar con datos inválidos
- **WHEN** el visitante activa el envío con datos de contacto inválidos
- **THEN** el envío no se inicia y se muestran los errores correspondientes

### Requirement: Foco visible en los campos del formulario
El sistema SHALL mostrar un indicador de foco claramente visible en cada campo del formulario de contacto cuando recibe el foco, con contraste suficiente contra el fondo, incluso cuando el campo tiene un error.

#### Scenario: Campo enfocado con el teclado
- **WHEN** el visitante llega con Tab a un campo del formulario de contacto
- **THEN** el campo muestra un anillo o contorno de foco visible, distinto del borde en reposo

#### Scenario: Campo con error enfocado
- **WHEN** un campo con error de validación recibe el foco
- **THEN** el indicador de foco sigue siendo visible además del estado de error

### Requirement: Contraste del texto del configurador
El sistema SHALL mostrar todo el texto informativo del configurador —incluidos los textos chicos de ayuda, los pasos pendientes del indicador de progreso, los textos del resumen y los placeholders de los campos— con una relación de contraste de al menos 4.5:1 contra su fondo (WCAG 2.2 AA).

#### Scenario: Texto chico de ayuda
- **WHEN** se muestran las aclaraciones del paso de revisión o del resumen
- **THEN** su contraste contra el fondo es de al menos 4.5:1

#### Scenario: Pasos pendientes del indicador
- **WHEN** el indicador de progreso muestra un paso pendiente
- **THEN** su texto y su número tienen un contraste de al menos 4.5:1

#### Scenario: Placeholders
- **WHEN** un campo vacío muestra su texto de ejemplo
- **THEN** el texto de ejemplo tiene un contraste de al menos 4.5:1

### Requirement: Foco al cambiar de paso
Cuando el visitante cambia de paso del wizard, el sistema SHALL mover el foco al título del nuevo paso, de modo que las tecnologías de asistencia lo anuncien y la vista lo muestre. Al cargar la página por primera vez el sistema NO SHALL mover el foco.

#### Scenario: Avanzar de paso
- **WHEN** el visitante activa "Continuar" y el paso cambia
- **THEN** el foco queda en el título del nuevo paso y el título queda visible en pantalla

#### Scenario: Retroceder o editar desde la revisión
- **WHEN** el visitante activa "Atrás" o una acción "Editar" y el paso cambia
- **THEN** el foco queda en el título del paso de destino

#### Scenario: Sin cambio de paso
- **WHEN** el visitante activa "Continuar" en el paso de contacto con datos inválidos y el paso no cambia
- **THEN** el foco no se mueve al título

#### Scenario: Carga inicial
- **WHEN** se abre `/configurador`
- **THEN** el foco no se mueve automáticamente a ningún título

### Requirement: Anuncio del envío en curso
El sistema SHALL anunciar a las tecnologías de asistencia, mediante una región de anuncios no intrusiva, que la solicitud se está enviando mientras hay un envío en curso.

#### Scenario: Envío en curso anunciado
- **WHEN** el envío pasa a `submitting`
- **THEN** una región de anuncios cortés comunica que la solicitud se está enviando

#### Scenario: Sin envío no hay anuncio
- **WHEN** no hay un envío en curso
- **THEN** la región de anuncios no contiene el aviso de envío

### Requirement: Aviso de privacidad junto al envío
El sistema SHALL mostrar, junto a la acción "Enviar solicitud", un aviso breve en español (es-AR) que indique para qué se usan los datos de contacto, que no se usan para otros fines y cómo pedir su borrado. El aviso SHALL ser solo texto: enviar la solicitud NO SHALL requerir marcar una casilla de consentimiento.

#### Scenario: Aviso visible antes de enviar
- **WHEN** el visitante llega al paso de revisión
- **THEN** ve, cerca del botón "Enviar solicitud", el aviso sobre el uso de sus datos y un medio de contacto para pedir su borrado

#### Scenario: Envío sin casilla de consentimiento
- **WHEN** el visitante activa "Enviar solicitud" con datos válidos
- **THEN** el envío se inicia sin exigir marcar ninguna casilla

### Requirement: Límite de largo de los campos del formulario
El formulario de contacto SHALL limitar el largo de cada campo a los valores que acepta el receptor del lead: nombre 120, email 254, teléfono 40 y descripción 2000 caracteres. Un valor que supere su límite NO SHALL enviarse: el sistema SHALL mostrar un error por campo y bloquear el avance. Además, cada campo SHALL declarar su límite en la interfaz para que el navegador trunque el texto pegado.

#### Scenario: Campo pasado del límite
- **WHEN** el visitante intenta continuar con un campo (recortado) que supera su límite, por ejemplo una descripción de 2001 caracteres
- **THEN** el sistema muestra "Máximo 2000 caracteres." en ese campo y no avanza ni envía el lead

#### Scenario: Campo exactamente en el límite
- **WHEN** un campo tiene exactamente su largo máximo
- **THEN** el sistema no muestra error por largo en ese campo

#### Scenario: Límite declarado en la interfaz
- **WHEN** el visitante pega en un campo más texto que su límite
- **THEN** el navegador trunca el valor al límite del campo
