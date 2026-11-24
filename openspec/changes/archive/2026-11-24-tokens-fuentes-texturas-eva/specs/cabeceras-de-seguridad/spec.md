# Spec Delta

## MODIFIED Requirements

### Requirement: Política de seguridad de contenido

El hosting SHALL servir una `Content-Security-Policy` que solo permita los orígenes que el sitio usa: scripts, estilos, fuentes, imágenes y conexiones del propio origen; imágenes `data:`; y conexiones a `https://script.google.com` y `https://script.googleusercontent.com` para el envío del lead y su redirección. Estilos y fuentes SHALL limitarse al propio origen (`'self'`), sin orígenes de terceros.

#### Scenario: Sin ejecución de código no confiable
- **WHEN** se inspecciona la CSP vigente
- **THEN** `script-src` no incluye `'unsafe-inline'`, `'unsafe-eval'` ni comodines, y `object-src` es `'none'`

#### Scenario: Directivas de endurecimiento
- **WHEN** se inspecciona la CSP vigente
- **THEN** incluye `default-src 'self'`, `base-uri 'self'`, `form-action 'self'` y `frame-ancestors 'none'`

#### Scenario: Orígenes de conexión acotados
- **WHEN** se inspecciona `connect-src`
- **THEN** contiene `'self'`, `https://script.google.com` y `https://script.googleusercontent.com` y ningún comodín

#### Scenario: Estilos y fuentes solo del propio origen
- **WHEN** se inspecciona la CSP vigente
- **THEN** `style-src` es exactamente `'self'` y `font-src` es exactamente `'self'`, sin `https://fonts.googleapis.com` ni `https://fonts.gstatic.com`

### Requirement: La CSP no rompe el sitio

Con la CSP aplicada, el sitio SHALL funcionar igual que sin ella: la home y el configurador cargan con sus fuentes autoalojadas y estilos, y el envío del lead llega al webhook siguiendo la redirección, sin violaciones de CSP en la consola del navegador.

#### Scenario: Recorrido sin violaciones
- **WHEN** un navegador real recorre la home, abre `/configurador` y completa los pasos hasta la revisión
- **THEN** la consola no registra violaciones de CSP (ni en modo Report-Only ni en modo enforcing) y las fuentes autoalojadas se aplican

#### Scenario: Envío del lead permitido
- **WHEN** el configurador envía el lead al webhook de Apps Script y este redirige a `script.googleusercontent.com`
- **THEN** ninguna de las dos conexiones es bloqueada ni reportada por la CSP y la UI muestra el resultado del envío

#### Scenario: Origen no declarado
- **WHEN** el sitio intenta conectarse a un origen que no está en `connect-src`
- **THEN** el navegador bloquea (enforcing) o reporta (Report-Only) la conexión

### Requirement: Configuración de cabeceras verificable

El repositorio SHALL incluir una verificación automática, ejecutada en CI, que falle si la configuración del hosting pierde alguna cabecera requerida, si la CSP no cumple las directivas exigidas o si se pierde el fallback SPA.

#### Scenario: Cabecera eliminada
- **WHEN** se elimina `X-Content-Type-Options` de la configuración del hosting
- **THEN** la verificación falla nombrando la cabecera faltante

#### Scenario: CSP debilitada
- **WHEN** se agrega `'unsafe-inline'` a `script-src` o se quita `frame-ancestors`
- **THEN** la verificación falla nombrando la directiva

#### Scenario: CSP solo en modo reporte
- **WHEN** la CSP está declarada únicamente como `Content-Security-Policy-Report-Only`
- **THEN** la verificación pasa con una advertencia visible de que la política no se aplica

#### Scenario: Origen externo en estilos o fuentes
- **WHEN** se agrega `https://fonts.googleapis.com` a `style-src` o `https://fonts.gstatic.com` a `font-src`, o se quita alguna de esas dos directivas
- **THEN** la verificación falla nombrando la directiva y su valor
