# interfaz-del-configurador Specification

## ADDED Requirements

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
