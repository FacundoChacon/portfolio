# Spec Delta

## ADDED Requirements

### Requirement: Verificación de fuentes en el build

El pipeline SHALL verificar, después del build, que el HTML construido de cada página pública del sitemap precarga la fuente principal como `woff2` del propio origen (ruta absoluta, `crossorigin`, archivo presente en `dist/`) y que no referencia orígenes de fuentes de terceros.

#### Scenario: Falta la precarga
- **WHEN** el HTML construido de una página pública no contiene la precarga de la fuente principal
- **THEN** el pipeline termina en rojo nombrando la URL y la fuente esperada

#### Scenario: Precarga a un archivo inexistente
- **WHEN** la precarga apunta a un archivo que no existe en `dist/`
- **THEN** el pipeline termina en rojo nombrando la ruta referenciada

#### Scenario: Vuelve Google Fonts
- **WHEN** el HTML construido referencia `fonts.googleapis.com` o `fonts.gstatic.com`
- **THEN** el pipeline termina en rojo nombrando la URL de la página y el origen externo
