# Spec Delta

## ADDED Requirements

### Requirement: Aviso de envío verificado en celeste

Cuando el presupuesto se envía con éxito y el receptor lo confirma, el aviso de éxito del configurador SHALL destacarse con el color de estado celeste (línea de aviso, etiqueta del panel y barra de acento), con contraste ≥ 4.5:1 para su texto y ≥ 3:1 para sus gráficos. El aviso SHALL comunicar el éxito también sin color: título textual e icono.

#### Scenario: Envío confirmado
- **WHEN** el visitante envía la solicitud y el receptor responde con éxito
- **THEN** el panel de éxito muestra el aviso en celeste, con su título "¡Solicitud enviada!" y un icono de confirmación

#### Scenario: Contraste del aviso de éxito
- **WHEN** se evalúa el texto celeste del aviso contra el fondo de panel, y el texto negro de su etiqueta contra el celeste
- **THEN** ambos pares alcanzan al menos 4.5:1

#### Scenario: Éxito sin percibir colores
- **WHEN** el panel de éxito se observa en escala de grises
- **THEN** el título y el icono siguen indicando que la solicitud se envió

#### Scenario: Celeste fuera del configurador
- **WHEN** un componente de la home usa el color de estado de éxito
- **THEN** la verificación automática falla nombrando el archivo

### Requirement: Avisos de error en rojo claro

Todo aviso de error del configurador (envío fallido, marca `ERR`, borde y mensaje de un campo con error de validación) SHALL usar el color de estado rojo claro, con contraste ≥ 4.5:1 como texto normal y ≥ 3:1 en bordes e iconos. Cada error SHALL comunicarse también sin color, con marca textual o icono y un mensaje.

#### Scenario: Envío fallido
- **WHEN** el envío de la solicitud falla por un error del receptor o de la red
- **THEN** el panel de error muestra la franja, la etiqueta y la línea de aviso en rojo claro, con el título "No se pudo enviar" y las alternativas de contacto

#### Scenario: Error de validación de un campo
- **WHEN** un campo obligatorio del formulario de contacto queda con error
- **THEN** el campo muestra el borde en rojo claro y, debajo, la marca `ERR` en negro sobre rojo claro seguida del mensaje en rojo claro

#### Scenario: Contraste del error como texto normal
- **WHEN** se evalúa el mensaje de error en rojo claro contra el fondo negro del campo y contra el panel
- **THEN** alcanza al menos 4.5:1 en ambos, sin depender de un tamaño de texto grande

#### Scenario: Error sin percibir colores
- **WHEN** el formulario con errores se observa en escala de grises
- **THEN** la marca `ERR` y el mensaje siguen indicando qué campo tiene error

#### Scenario: Colores de estado fuera de la jerarquía
- **WHEN** se cuentan los usos de los colores de acento para verificar la jerarquía violeta, naranja y verde agua
- **THEN** los usos del celeste de éxito y del rojo claro de error no se cuentan
