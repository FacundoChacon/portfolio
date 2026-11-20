# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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

