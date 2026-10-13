# pdf-del-presupuesto Specification

## Purpose
Define la generación client-side de un PDF que resume la solicitud del configurador, con carga diferida de la librería de renderizado y tolerancia al fallo. El documento no incluye importes.

## Requirements

### Requirement: Documento de la solicitud
El sistema SHALL construir el documento a partir del `LeadPayload` con un encabezado (Facundo Chacón, fecha, fuente), el servicio con su cantidad, los extras seleccionados, el disclaimer de hosting cuando se haya incluido y la nota de que el presupuesto se confirma por email. El documento NO SHALL incluir importes.

#### Scenario: Encabezado del documento
- **WHEN** se construye el documento
- **THEN** muestra el nombre del emisor, el tipo de documento, la fecha de envío y la página de origen

#### Scenario: Servicio con su cantidad
- **WHEN** la solicitud tiene cantidad mayor a uno
- **THEN** el bloque del servicio lo muestra

#### Scenario: Extras listados por nombre
- **WHEN** hay extras seleccionados
- **THEN** se listan por su nombre, sin importes ni separación por recurrencia

#### Scenario: Sin importes
- **WHEN** se construye el documento
- **THEN** no se muestran totales, subtotales ni precios

#### Scenario: Disclaimer de hosting
- **WHEN** la solicitud incluye el extra de hosting
- **THEN** el documento muestra el disclaimer de gestión técnica y contratación a nombre del cliente

#### Scenario: Presupuesto por email
- **WHEN** se muestra el documento
- **THEN** se aclara que el presupuesto se confirma por email

### Requirement: Generación en el cliente con carga diferida
El sistema SHALL generar el PDF en el navegador del visitante y SHALL cargar `@react-pdf/renderer` solo bajo demanda, sin incorporarlo al bundle inicial del configurador.

#### Scenario: Sin servidor
- **WHEN** se genera el PDF
- **THEN** la generación ocurre íntegramente en el cliente, sin llamadas a un servicio

#### Scenario: Carga bajo demanda
- **WHEN** se usa el generador por primera vez
- **THEN** la librería de renderizado se carga recién en ese momento, en un chunk separado del bundle inicial

### Requirement: Conversión a base64
El sistema SHALL exponer una función que convierta el buffer del PDF a una cadena base64 para poder adjuntarlo.

#### Scenario: Buffer a base64
- **WHEN** se convierte el buffer del PDF
- **THEN** se obtiene una cadena base64 que decodifica al mismo contenido

### Requirement: Best-effort del PDF
El sistema SHALL tolerar el fallo en la generación del PDF: si algo falla, devuelve un resultado que indica la ausencia del PDF sin lanzar una excepción hacia el flujo de envío.

#### Scenario: Generación exitosa
- **WHEN** el payload es válido
- **THEN** se obtiene el buffer del PDF

#### Scenario: Fallo tolerado
- **WHEN** la generación falla o el payload es inválido
- **THEN** no se propaga el error y el resultado indica que no hay PDF (el envío procede igual, RN-PD-03)
