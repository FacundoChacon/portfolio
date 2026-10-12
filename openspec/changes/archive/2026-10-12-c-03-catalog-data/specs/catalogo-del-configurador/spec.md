# catalogo-del-configurador Specification

## Purpose

Define el catálogo de productos que el configurador ofrece —tipos de sitio y extras— como una fuente de verdad única y editable, con la semántica de precio que la UI y el motor de cálculo deben respetar.

## ADDED Requirements

### Requirement: Catálogo de tipos de sitio
El sistema SHALL exponer un catálogo de exactamente 7 tipos de sitio, cada uno con un `id` único y estable, `name`, `description`, `priceARS`, `quotable` e `icon`.

#### Scenario: Tipos de sitio disponibles
- **WHEN** se consulta el catálogo de tipos de sitio
- **THEN** incluye exactamente 7 tipos: Landing Page, One Page, E-commerce, Web Corporativa, Blog, Portfolio y Sistema a medida
- **AND** cada uno tiene un `id` único y estable y los campos `name`, `description`, `priceARS`, `quotable` e `icon`

#### Scenario: Precio editable sin tocar la UI
- **WHEN** se modifica el `priceARS` de un tipo de sitio en el catálogo
- **THEN** el catálogo es la única fuente de verdad de ese precio, sin necesidad de cambiar componentes de UI

#### Scenario: Etiqueta promocional opcional
- **WHEN** un tipo de sitio declara un `tag`
- **THEN** el catálogo lo expone como dato opcional (por ejemplo, "Más elegido")

### Requirement: Catálogo de extras
El sistema SHALL exponer un catálogo de exactamente 8 extras, cada uno con un `id` único y estable, `name`, `description`, `priceARS`, `category`, `recurring` y `recommended`.

#### Scenario: Extras disponibles
- **WHEN** se consulta el catálogo de extras
- **THEN** incluye exactamente 8 extras: SEO inicial, Copywriting, CMS / Blog, Multi-idioma, Área de clientes, Integración WhatsApp/CRM, Mantenimiento mensual y Hosting + Dominio
- **AND** cada uno tiene un `id` único y estable y los campos `name`, `description`, `priceARS`, `category`, `recurring` y `recommended`

#### Scenario: Recurrencia mensual
- **WHEN** un extra es de cobro mensual (Mantenimiento mensual)
- **THEN** el catálogo lo marca con `recurring: true`
- **AND** los extras que no son mensuales quedan con `recurring: false`

#### Scenario: Categorías válidas
- **WHEN** se consulta la `category` de un extra
- **THEN** el valor pertenece al conjunto `contenido`, `tecnico`, `crecimiento`, `soporte` o `infra`

### Requirement: Servicio cotizable
El sistema SHALL representar "Sistema a medida" como servicio cotizable, con `priceARS: null` y `quotable: true`, para mostrarse como "A cotizar" y no sumar al total.

#### Scenario: Sistema a medida sin precio numérico
- **WHEN** el catálogo describe "Sistema a medida"
- **THEN** su `priceARS` es `null` y su `quotable` es `true`

#### Scenario: El resto de los tipos tiene precio
- **WHEN** el catálogo describe un tipo de sitio distinto de "Sistema a medida"
- **THEN** su `priceARS` es un número y su `quotable` es `false`

### Requirement: Extra de infraestructura sin costo
El sistema SHALL representar "Hosting + Dominio" con `priceARS: 0` y un `disclaimer` textual que aclare que solo cubre la gestión técnica y que el costo de titular el hosting y el dominio queda a cargo del cliente.

#### Scenario: Hosting + Dominio con precio cero
- **WHEN** el catálogo describe "Hosting + Dominio"
- **THEN** su `priceARS` es `0` y no altera el total

#### Scenario: Disclaimer de titularidad
- **WHEN** se describe "Hosting + Dominio"
- **THEN** el catálogo expone un `disclaimer` que menciona que el costo de hosting y dominio está a cargo del cliente

### Requirement: Extra recomendado
El sistema SHALL marcar con `recommended: true` únicamente al extra "Hosting + Dominio", dejando el resto de los extras con `recommended: false`.

#### Scenario: Único extra recomendado
- **WHEN** se consulta qué extras están marcados como `recommended`
- **THEN** el único resultado es "Hosting + Dominio"

### Requirement: Moneda del catálogo
El sistema SHALL declarar la moneda del catálogo como `ARS`.

#### Scenario: Moneda ARS expuesta
- **WHEN** se consultan los metadatos del catálogo
- **THEN** la moneda declarada es `ARS`
