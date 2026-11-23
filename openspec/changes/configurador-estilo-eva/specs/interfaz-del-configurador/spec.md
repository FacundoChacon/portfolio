# Spec Delta

## ADDED Requirements

### Requirement: Sistema visual único del configurador
El cuerpo del configurador (indicador de progreso, pasos, tarjetas, campos, resumen, revisión, éxito y error) SHALL usar solo el sistema visual del sitio (paleta, tipografías y paneles eva) y NO SHALL usar estilos de la paleta anterior, brillos, degradados de texto, cristal ni la tipografía de títulos anterior. Una verificación automática SHALL fallar si alguno de esos estilos vuelve a aparecer.

#### Scenario: Página coherente con la cabecera
- **WHEN** se abre `/configurador`
- **THEN** la cabecera y el cuerpo del wizard comparten la misma paleta, tipografía de títulos y tratamiento de paneles

#### Scenario: Estilo anterior reintroducido
- **WHEN** un componente del configurador vuelve a usar un color, brillo, degradado, cristal o tipografía de la paleta anterior
- **THEN** la verificación automática falla nombrando el archivo y el estilo encontrado

#### Scenario: Paneles opacos detrás del formulario
- **WHEN** se muestran los campos de contacto, el resumen o los bloques de revisión
- **THEN** su fondo es opaco y no deja ver ni desenfocar contenido de atrás

### Requirement: Selección distinguible sin depender del color
Una tarjeta de tipo de sitio o de extra seleccionada SHALL diferenciarse de una no seleccionada por al menos una señal de forma (indicador con tilde y sombra sólida desplazada), además del color. El estado seleccionado SHALL seguir expuesto con `aria-pressed`.

#### Scenario: Tarjeta seleccionada en escala de grises
- **WHEN** se observa el paso de tipo de sitio o de extras sin percibir colores
- **THEN** la tarjeta seleccionada se reconoce por su indicador con tilde y su sombra desplazada

#### Scenario: Tarjeta no seleccionada
- **WHEN** una tarjeta no está seleccionada
- **THEN** muestra el indicador vacío, sin tilde y sin sombra desplazada

#### Scenario: Selección y foco a la vez
- **WHEN** la tarjeta seleccionada recibe el foco con el teclado
- **THEN** el contorno de foco se distingue del borde y de la sombra del estado seleccionado

### Requirement: Estado de error del campo distinguible sin depender del color
Un campo con error de validación SHALL mostrar, además de un borde de color de alerta, una marca textual de error junto al mensaje, de modo que el error se perciba sin depender del color. El mensaje y su asociación accesible al campo SHALL mantenerse.

#### Scenario: Campo obligatorio vacío
- **WHEN** el visitante intenta continuar con el nombre vacío
- **THEN** el campo muestra el borde de alerta y, debajo, una marca de error seguida del mensaje en español

#### Scenario: Campo corregido
- **WHEN** el visitante corrige el campo y vuelve a intentar continuar con datos válidos
- **THEN** el borde de alerta y la marca de error desaparecen

### Requirement: Controles deshabilitados legibles
Un control deshabilitado del configurador (restar cantidad en 1, botones de edición y de envío durante el envío) SHALL verse distinto del habilitado por su fondo y su borde, SHALL mantener su texto legible y NO SHALL atenuarse con transparencia general. Un control deshabilitado NO SHALL mostrar sombra ni desplazamiento al pasar el puntero.

#### Scenario: Restar con cantidad 1
- **WHEN** la cantidad es 1
- **THEN** el control de restar se ve deshabilitado, su icono es visible y no reacciona al puntero

#### Scenario: Envío en curso
- **WHEN** el envío está en curso
- **THEN** el botón de envío muestra "Enviando..." legible y los botones "Editar" se ven deshabilitados

### Requirement: Contraste de los estados del configurador
Los textos del configurador SHALL tener contraste de al menos 4.5:1 contra su fondo en todos los estados (reposo, seleccionado, error, deshabilitado, paso actual); los bordes que identifican un control (tarjetas, campos, control de cantidad, borde de error) y el contorno de foco SHALL tener al menos 3:1 contra el fondo adyacente. Una verificación automática SHALL fallar si un color o una opacidad de fondo cambia y un par queda por debajo de su umbral.

#### Scenario: Texto sobre tarjeta seleccionada
- **WHEN** una tarjeta está seleccionada y su fondo se tiñe
- **THEN** su nombre, descripción y etiqueta mantienen al menos 4.5:1

#### Scenario: Marca de error y botón deshabilitado
- **WHEN** se muestra la marca de error o un botón deshabilitado
- **THEN** su texto alcanza al menos 4.5:1 contra su fondo

#### Scenario: Fondo del seleccionado más intenso
- **WHEN** la opacidad del tinte de la tarjeta seleccionada sube hasta dejar un texto por debajo de 4.5:1
- **THEN** la verificación automática falla nombrando el par y el contraste obtenido

### Requirement: Movimiento del configurador
El configurador NO SHALL tener animaciones en bucle. Los desplazamientos de tarjetas y botones al pasar el puntero o enfocar SHALL ocurrir solo si el visitante no pidió reducir el movimiento; con movimiento reducido los estados SHALL cambiar igual de borde, sombra y color, sin desplazamiento ni transición.

#### Scenario: Movimiento reducido
- **WHEN** el visitante tiene activada la preferencia de reducir el movimiento y pasa el puntero o el foco por una tarjeta o un botón
- **THEN** el estado cambia sin desplazarse ni animarse

#### Scenario: Sin preferencia de movimiento
- **WHEN** el visitante no pidió reducir el movimiento y pasa el puntero por una tarjeta no seleccionada
- **THEN** la tarjeta puede desplazarse levemente y mostrar su sombra sólida
