# integracion-webhook Specification

## ADDED Requirements

### Requirement: Payload del lead
El sistema SHALL construir el `LeadPayload` a partir del estado del wizard, del catálogo de servicios y extras, incluyendo `submittedAt` (ISO 8601), `source` (`facucode.dev/configurador`), servicio con cantidad, extras seleccionados, `hasQuotable`, `subtotal`, `total`, `currency`, `contacto` y `meta`.

#### Scenario: Mapeo de servicio y cantidad
- **WHEN** el visitante envía con un servicio y cantidad > 1
- **THEN** el `LeadPayload` contiene el servicio (id, name, priceARS) y `quantity` correcto

#### Scenario: Mapeo de extras
- **WHEN** hay extras seleccionados
- **THEN** el payload incluye cada uno con sus campos (`id`, `name`, `priceARS`, `recurring`)

#### Scenario: Totales y quotable
- **WHEN** el presupuesto es cotizable
- **THEN** `hasQuotable` es `true` y `subtotal`/`total` reflejan lo calculado

#### Scenario: Contacto y metadatos
- **WHEN** el formulario tiene datos
- **THEN** `contact` (name, email, phone, project) y `meta` (userAgent, referrer) se incluyen

### Requirement: Envío al webhook
El sistema SHALL enviar el lead por HTTP POST al endpoint configurado en `VITE_WEBHOOK_URL`, con cabecera `Content-Type: application/json`.

#### Scenario: Envío exitoso
- **WHEN** el webhook responde 2xx
- **THEN** el estado pasa a `success`

#### Scenario: Configuración ausente
- **WHEN** no hay `VITE_WEBHOOK_URL` definido
- **THEN** el envío falla con un error controlado y se muestra el paso de error

#### Scenario: Respuesta no 2xx o red
- **WHEN** falla la petición
- **THEN** el estado pasa a `error` y se muestra alternativa de contacto (RN-AB-04)

### Requirement: UI durante el envío
El sistema SHALL deshabilitar el botón de envío mientras envía y evitar el doble envío (RN-AB-02).

#### Scenario: Botón deshabilitado
- **WHEN** `submitting` es verdadero
- **THEN** el botón de envío está deshabilitado y muestra "Enviando..."

#### Scenario: Prevención de doble submit
- **WHEN** ya está enviando o ya fue enviado con éxito
- **THEN** no se dispara un nuevo envío

### Requirement: Pantallas de éxito y error
El sistema SHALL mostrar una pantalla de éxito con el nombre del prospecto (US-008 CA-3) y, en caso de error, un mensaje con alternativa mailto o WhatsApp (RN-AB-04).

#### Scenario: Éxito
- **WHEN** el envío es exitoso
- **THEN** se muestra el nombre del contacto y un botón para volver al inicio

#### Scenario: Error con alternativa
- **WHEN** el envío falla
- **THEN** se muestran alternativas de contacto (email/WhatsApp) y un botón para reintentar
