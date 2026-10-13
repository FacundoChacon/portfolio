# catalogo-del-configurador Specification

## Purpose

Define el catálogo de productos que el configurador ofrece —tipos de sitio y extras— como una fuente de verdad única y editable. El catálogo describe qué se ofrece; **no expone precios**: el presupuesto se confirma a medida por email.

## Requirements

### Requirement: Catálogo de tipos de sitio
El sistema SHALL exponer un catálogo de exactamente 7 tipos de sitio, cada uno con un `id` único y estable, `name`, `description` e `icon`.

#### Scenario: Tipos de sitio disponibles
- **WHEN** se consulta el catálogo de tipos de sitio
- **THEN** incluye exactamente 7 tipos: Landing Page, One Page, E-commerce, Web Corporativa, Blog, Portfolio y Sistema a medida
- **AND** cada uno tiene un `id` único y estable y los campos `name`, `description` e `icon`

#### Scenario: Texto editable sin tocar la UI
- **WHEN** se modifica el `name` o la `description` de un tipo de sitio en el catálogo
- **THEN** el catálogo es la única fuente de verdad de ese texto, sin necesidad de cambiar componentes de UI

#### Scenario: Etiqueta promocional opcional
- **WHEN** un tipo de sitio declara un `tag`
- **THEN** el catálogo lo expone como dato opcional (por ejemplo, "Más elegido")

#### Scenario: Sin precios en el catálogo
- **WHEN** se inspecciona un tipo de sitio del catálogo
- **THEN** no expone ningún campo de precio

### Requirement: Catálogo de extras
El sistema SHALL exponer un catálogo de exactamente 8 extras, cada uno con un `id` único y estable, `name`, `description`, `category` y `recommended`.

#### Scenario: Extras disponibles
- **WHEN** se consulta el catálogo de extras
- **THEN** incluye exactamente 8 extras: SEO inicial, Copywriting, CMS / Blog, Multi-idioma, Área de clientes, Integración WhatsApp/CRM, Mantenimiento mensual y Hosting + Dominio
- **AND** cada uno tiene un `id` único y estable y los campos `name`, `description`, `category` y `recommended`

#### Scenario: Sin precios en el catálogo
- **WHEN** se inspecciona un extra del catálogo
- **THEN** no expone ningún campo de precio ni de recurrencia

#### Scenario: Categorías válidas
- **WHEN** se consulta la `category` de un extra
- **THEN** el valor pertenece al conjunto `contenido`, `tecnico`, `crecimiento`, `soporte` o `infra`

### Requirement: Extra de infraestructura con disclaimer
El sistema SHALL representar "Hosting + Dominio" con un `disclaimer` textual que aclare que solo cubre la gestión técnica y que el costo de titular el hosting y el dominio queda a cargo del cliente.

#### Scenario: Disclaimer de titularidad
- **WHEN** se describe "Hosting + Dominio"
- **THEN** el catálogo expone un `disclaimer` que menciona que el costo de hosting y dominio está a cargo del cliente

### Requirement: Extra recomendado
El sistema SHALL marcar con `recommended: true` únicamente al extra "Hosting + Dominio", dejando el resto de los extras con `recommended: false`.

#### Scenario: Único extra recomendado
- **WHEN** se consulta qué extras están marcados como `recommended`
- **THEN** el único resultado es "Hosting + Dominio"
