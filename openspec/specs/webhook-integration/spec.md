# webhook-integration Specification

## Purpose
Define la construcción y el envío del lead del configurador a un webhook externo, con los estados de envío y las pantallas de éxito/error. El payload describe la selección y el contacto; no incluye importes.

## Requirements

### Requirement: Payload del lead
El sistema SHALL construir el `LeadPayload` a partir del estado del wizard, del catálogo de servicios y extras, incluyendo `submittedAt` (ISO 8601), `source` (`facucode.dev/configurador`), servicio con cantidad, extras seleccionados, `contacto` y `meta`. El payload NO SHALL incluir importes. `meta.userAgent` SHALL ser el identificador real del navegador del visitante (vacío si no está disponible) y el payload NO SHALL incluir el campo trampa.

#### Scenario: Mapeo de servicio y cantidad
- **WHEN** el visitante envía con un servicio y cantidad > 1
- **THEN** el `LeadPayload` contiene el servicio (id, name) y `quantity` correcto

#### Scenario: Mapeo de extras
- **WHEN** hay extras seleccionados
- **THEN** el payload incluye cada uno con sus campos (`id`, `name`)

#### Scenario: Sin importes
- **WHEN** se construye el payload
- **THEN** no incluye `priceARS`, `recurring`, `hasQuotable`, `subtotal`, `total` ni `currency`

#### Scenario: Contacto y metadatos
- **WHEN** el formulario tiene datos
- **THEN** `contact` (name, email, phone, project) y `meta` (userAgent, referrer) se incluyen

#### Scenario: User agent real
- **WHEN** se construye el payload en un navegador
- **THEN** `meta.userAgent` es el identificador de ese navegador y no un valor fijo

#### Scenario: Sin navegador disponible
- **WHEN** se construye el payload en un entorno sin información del navegador
- **THEN** `meta.userAgent` es una cadena vacía y la construcción no falla

#### Scenario: Sin campo trampa
- **WHEN** el formulario tiene el campo trampa con un valor
- **THEN** ni `contact` ni ninguna otra parte del payload incluye ese campo ni su valor

### Requirement: Envío al webhook
El sistema SHALL enviar el lead por HTTP POST al endpoint configurado en `VITE_WEBHOOK_URL`, con cuerpo JSON y cabecera `Content-Type: text/plain;charset=utf-8`, de modo que sea una petición simple del navegador (sin preflight CORS): receptores como Google Apps Script no responden `OPTIONS`. El sistema SHALL abortar la petición si el webhook no responde en 20 segundos y tratar ese caso como un envío fallido.

#### Scenario: Envío exitoso
- **WHEN** el webhook responde 2xx
- **THEN** el estado pasa a `success`

#### Scenario: Petición simple sin preflight
- **WHEN** se arma la petición de envío
- **THEN** usa el método POST con `Content-Type: text/plain;charset=utf-8` y el cuerpo es el lead serializado como JSON

#### Scenario: Configuración ausente
- **WHEN** no hay `VITE_WEBHOOK_URL` definido
- **THEN** el envío falla con un error controlado y se muestra el paso de error

#### Scenario: Respuesta no 2xx o red
- **WHEN** falla la petición
- **THEN** el estado pasa a `error` y se muestra alternativa de contacto (RN-AB-04)

#### Scenario: Webhook que no responde
- **WHEN** el webhook no responde dentro de 20 segundos
- **THEN** la petición se aborta, el estado pasa a `error` y el visitante puede reintentar

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
El sistema SHALL mostrar una pantalla de éxito con el nombre del prospecto (US-008 CA-3) y, en caso de error, un mensaje con alternativa mailto o WhatsApp (RN-AB-04), un botón para reintentar y una acción para volver a revisar los datos. La copia SHALL estar en español (es-AR) y en primera persona, y al aparecer cada pantalla SHALL recibir el foco en su título.

#### Scenario: Éxito
- **WHEN** el envío es exitoso
- **THEN** se muestra el nombre del contacto y un botón para volver al inicio

#### Scenario: Saludo sin nombre
- **WHEN** el envío es exitoso y el nombre está vacío o solo tiene espacios
- **THEN** el saludo agradece sin nombre y sin texto de relleno (como "el equipo")

#### Scenario: Copia en primera persona
- **WHEN** se muestra la pantalla de éxito
- **THEN** el mensaje indica que Facundo responde por email en primera persona del singular (por ejemplo, "Te respondo")

#### Scenario: Error con alternativa
- **WHEN** el envío falla
- **THEN** se muestran alternativas de contacto (email/WhatsApp) y un botón para reintentar

#### Scenario: Volver a revisar desde el error
- **WHEN** el envío falló y el visitante activa la acción de volver a revisar sus datos
- **THEN** se muestra el paso de revisión con los datos cargados y el botón de envío habilitado

#### Scenario: Foco en la pantalla de resultado
- **WHEN** aparece la pantalla de éxito o la de error
- **THEN** el foco queda en su título, de modo que las tecnologías de asistencia anuncian el resultado

### Requirement: Envío descartado por el campo trampa
Cuando el envío se descarta porque el campo trampa vino completo (RN-AB-01), el sistema NO SHALL realizar ninguna petición al webhook y SHALL mostrar la misma pantalla de éxito que un envío real, sin ningún indicio de que fue descartado.

#### Scenario: Sin petición al webhook
- **WHEN** el visitante activa "Enviar solicitud" con el campo trampa completo
- **THEN** no se realiza ninguna petición HTTP al webhook

#### Scenario: Éxito indistinguible
- **WHEN** el envío se descarta por el campo trampa
- **THEN** se muestra la pantalla de éxito habitual, sin mensajes de error ni avisos de descarte
