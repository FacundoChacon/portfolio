# Spec Delta

## MODIFIED Requirements

### Requirement: UI durante el envío
El sistema SHALL deshabilitar el botón de envío mientras envía y evitar el doble envío (RN-AB-02). Tras un envío fallido SHALL permitir reintentarlo, y cada envío SHALL construir el lead con los datos vigentes al momento de iniciarlo.

#### Scenario: Botón deshabilitado
- **WHEN** `submitting` es verdadero
- **THEN** el botón de envío está deshabilitado y muestra "Enviando..."

#### Scenario: Prevención de doble submit
- **WHEN** ya está enviando o ya fue enviado con éxito
- **THEN** no se dispara un nuevo envío

#### Scenario: Doble activación rápida
- **WHEN** el visitante activa el envío dos veces antes de que la interfaz refleje el envío en curso
- **THEN** se dispara una única petición al webhook

#### Scenario: Reintento tras error
- **WHEN** el envío falló y el visitante activa "Reintentar"
- **THEN** se dispara una nueva petición al webhook y el estado pasa a `submitting`

#### Scenario: Payload con los datos vigentes
- **WHEN** se inicia un envío
- **THEN** el lead enviado refleja el servicio, los extras, la cantidad y los datos de contacto vigentes en ese momento

### Requirement: Pantallas de éxito y error
El sistema SHALL mostrar una pantalla de éxito con el nombre del prospecto (US-008 CA-3) y, en caso de error, un mensaje con alternativa mailto o WhatsApp (RN-AB-04), un botón para reintentar y una acción para volver a revisar los datos.

#### Scenario: Éxito
- **WHEN** el envío es exitoso
- **THEN** se muestra el nombre del contacto y un botón para volver al inicio

#### Scenario: Error con alternativa
- **WHEN** el envío falla
- **THEN** se muestran alternativas de contacto (email/WhatsApp) y un botón para reintentar

#### Scenario: Volver a revisar desde el error
- **WHEN** el envío falló y el visitante activa la acción de volver a revisar sus datos
- **THEN** se muestra el paso de revisión con los datos cargados y el botón de envío habilitado
