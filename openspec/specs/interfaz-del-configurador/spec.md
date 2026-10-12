# interfaz-del-configurador Specification

## Purpose

Define la presentación del wizard de presupuesto: el layout de la página del configurador, el indicador de progreso de los cuatro pasos, el resumen en vivo con su desglose y el total, y la navegación entre pasos.

## Requirements

### Requirement: Layout de dos columnas
La página del configurador SHALL mostrar el contenido del paso actual y un panel de resumen; en pantallas grandes SHALL disponerlos en dos columnas con el resumen fijo al costado, y en pantallas chicas SHALL apilar el resumen debajo del contenido.

#### Scenario: Dos columnas en pantallas grandes
- **WHEN** se abre `/configurador` en una pantalla grande
- **THEN** el contenido del paso y el resumen se muestran en columnas separadas

#### Scenario: Apilado en pantallas chicas
- **WHEN** se abre `/configurador` en una pantalla chica
- **THEN** el resumen se muestra debajo del contenido del paso

#### Scenario: Total siempre visible
- **WHEN** el visitante recorre los pasos
- **THEN** el total permanece visible en el panel de resumen

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
El panel de resumen SHALL mostrar el desglose de la configuración —el servicio con su cantidad, los extras seleccionados y el importe mensual si hay extras recurrentes— y el total de pago único en ARS, y SHALL actualizarse cuando cambia la configuración.

#### Scenario: Servicio con su cantidad
- **WHEN** hay un servicio seleccionado
- **THEN** el resumen muestra su nombre, la cantidad y su importe

#### Scenario: Extras seleccionados
- **WHEN** hay extras seleccionados
- **THEN** el resumen lista cada extra con su importe

#### Scenario: Importe mensual separado
- **WHEN** hay extras de cobro mensual seleccionados
- **THEN** el resumen muestra su suma como importe mensual (`/mes`), además del total de pago único

#### Scenario: El total se actualiza al alternar un extra
- **WHEN** el visitante marca o desmarca un extra
- **THEN** el total del resumen cambia en consecuencia

#### Scenario: Sin extras
- **WHEN** no hay extras seleccionados
- **THEN** el resumen muestra el total del servicio y ningún extra

### Requirement: Aviso de ítem cotizable
Cuando la configuración incluye un ítem cotizable, el resumen SHALL mostrar un aviso de que ese ítem se cotiza aparte y NO SHALL sumarlo al total.

#### Scenario: Servicio "a cotizar"
- **WHEN** el servicio seleccionado es cotizable
- **THEN** el resumen muestra un aviso de que se cotiza aparte
- **AND** el total no incluye su importe

#### Scenario: Sin ítems cotizables
- **WHEN** ningún ítem es cotizable
- **THEN** el resumen no muestra el aviso de cotizable

### Requirement: Extras sin costo
El resumen SHALL mostrar un extra con precio 0 como "Sin costo".

#### Scenario: Hosting + Dominio
- **WHEN** el extra "Hosting + Dominio" (precio 0) está seleccionado
- **THEN** el resumen lo muestra como "Sin costo"

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
El sistema SHALL mostrar los siete tipos de sitio como tarjetas seleccionables, cada una con su nombre, descripción, icono y precio, y SHALL mantener exactamente una tarjeta seleccionada y distinguible del resto.

#### Scenario: Las siete opciones
- **WHEN** el visitante llega al paso de tipo de sitio
- **THEN** se muestran las siete opciones del catálogo

#### Scenario: Contenido de cada tarjeta
- **WHEN** se muestra una tarjeta de tipo de sitio
- **THEN** muestra su nombre, su descripción, su icono y su precio en ARS

#### Scenario: Sistema a medida sin precio
- **WHEN** se muestra la tarjeta de "Sistema a medida"
- **THEN** su precio se muestra como "A cotizar" y nunca como un número

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

### Requirement: Sufijo mensual en extras recurrentes
El sistema SHALL mostrar los extras de cobro mensual con el sufijo `/mes`.

#### Scenario: Mantenimiento mensual
- **WHEN** se muestra el extra "Mantenimiento mensual"
- **THEN** su precio se muestra con el sufijo `/mes`

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
El sistema SHALL incluir en el formulario un campo trampa (honeypot) que no sea visible, no sea enfocable y no se anuncie a las tecnologías de asistencia.

#### Scenario: El campo trampa no se ve
- **WHEN** el visitante recorre el formulario
- **THEN** el campo trampa no es visible ni recibe el foco al navegar con el teclado

#### Scenario: El campo trampa está presente en el formulario
- **WHEN** se envía el formulario
- **THEN** el campo trampa viaja junto con los demás campos

### Requirement: Revisión del presupuesto
El sistema SHALL mostrar en el paso de revisión la configuración completa agrupada en bloques —tipo de sitio con su cantidad, extras y datos de contacto—, el total con el aviso de ítem cotizable si corresponde, y la aclaración de que es una estimación no vinculante.

#### Scenario: Bloques de la configuración
- **WHEN** el visitante llega al paso de revisión
- **THEN** ve un bloque para el tipo de sitio, uno para los extras y uno para sus datos de contacto

#### Scenario: Cantidad solo cuando es mayor a uno
- **WHEN** el servicio tiene cantidad mayor a uno
- **THEN** el bloque del tipo de sitio muestra la cantidad

#### Scenario: Sin extras seleccionados
- **WHEN** no hay extras seleccionados
- **THEN** el bloque de extras lo indica explícitamente en vez de quedar vacío

#### Scenario: Total y aviso de cotizable
- **WHEN** se muestra la revisión
- **THEN** el total del presupuesto está visible y, si hay un sistema a medida, se muestra el aviso de que se cotiza aparte

#### Scenario: Aclaración de no vinculante
- **WHEN** se muestra la revisión
- **THEN** se aclara que el presupuesto es una estimación no vinculante

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
