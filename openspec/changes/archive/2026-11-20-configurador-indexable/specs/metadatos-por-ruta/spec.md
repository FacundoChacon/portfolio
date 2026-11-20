# Spec Delta

## Purpose

Garantiza que cada página pública del sitio expone sus propios metadatos (título, descripción, canonical, Open Graph y Twitter) en el HTML que entrega el hosting, sin depender de JavaScript, y que esos metadatos acompañan la navegación dentro de la SPA.

## ADDED Requirements

### Requirement: Documento HTML propio por página pública

El hosting SHALL responder cada página pública (`/` y `/configurador`) con un documento HTML cuyo `<head>` ya contiene los metadatos de esa página, sin redirecciones y sin requerir JavaScript para leerlos. El documento carga la misma aplicación que el resto del sitio.

#### Scenario: Scraper sin JavaScript pide el configurador
- **WHEN** un cliente que no ejecuta JavaScript (crawler o scraper de previews) pide `https://www.facucode.dev/configurador`
- **THEN** recibe un 200 sin redirección y el HTML declara el título, la descripción, el canonical y las etiquetas Open Graph y Twitter del configurador, no los de la home

#### Scenario: La home conserva sus metadatos
- **WHEN** un cliente sin JavaScript pide `https://www.facucode.dev/`
- **THEN** el HTML declara el título, la descripción, el canonical y las etiquetas Open Graph y Twitter de la home

#### Scenario: La página funciona igual
- **WHEN** un navegador abre `/configurador` directamente
- **THEN** la aplicación se monta y muestra el configurador como antes del cambio

### Requirement: Conjunto de metadatos de cada página

Cada página pública SHALL declarar exactamente una vez: `<title>`, `meta name="description"`, `link rel="canonical"` y `og:url` iguales a su propia URL absoluta, `og:title`, `og:description`, `og:image` absoluta (`https://www.facucode.dev/og-image.png`), `twitter:card` = `summary_large_image`, `twitter:title`, `twitter:description` y `twitter:image` absoluta.

#### Scenario: Canonical propio del configurador
- **WHEN** se inspecciona el HTML servido para `/configurador`
- **THEN** `canonical` y `og:url` valen `https://www.facucode.dev/configurador`

#### Scenario: Canonical propio de la home
- **WHEN** se inspecciona el HTML servido para `/`
- **THEN** `canonical` y `og:url` valen `https://www.facucode.dev/`

#### Scenario: Etiquetas de Twitter presentes
- **WHEN** se inspecciona el HTML de cualquier página pública
- **THEN** contiene `twitter:card` = `summary_large_image`, `twitter:title`, `twitter:description` y `twitter:image` con URL absoluta

#### Scenario: Sin duplicados
- **WHEN** se inspecciona el HTML de cualquier página pública
- **THEN** cada una de esas etiquetas aparece una sola vez

### Requirement: Textos de metadatos acotados y distintos

El título de cada página pública SHALL tener como máximo 60 caracteres y su descripción como máximo 155; título y canonical SHALL ser distintos entre páginas.

#### Scenario: Longitudes
- **WHEN** se validan los metadatos declarados
- **THEN** ningún título supera 60 caracteres y ninguna descripción supera 155

#### Scenario: Páginas distinguibles
- **WHEN** se comparan los metadatos de la home y del configurador
- **THEN** sus títulos y sus canonical son distintos

### Requirement: Generación verificada de los metadatos

La generación de los documentos por página SHALL fallar (y con ella el build) si en la plantilla HTML falta, o está repetida, alguna de las etiquetas que debe completar, en lugar de publicar un documento con metadatos incompletos.

#### Scenario: Etiqueta faltante en la plantilla
- **WHEN** la plantilla no contiene `link rel="canonical"` (o cualquier otra etiqueta gestionada)
- **THEN** la generación falla con un mensaje que nombra la etiqueta faltante

#### Scenario: Etiqueta repetida en la plantilla
- **WHEN** la plantilla contiene dos `meta name="description"`
- **THEN** la generación falla con un mensaje que nombra la etiqueta repetida

#### Scenario: Valores con caracteres especiales
- **WHEN** un título o descripción contiene `&`, `"`, `<` o `>`
- **THEN** el valor se escapa en el HTML generado y el documento sigue siendo válido

### Requirement: Documentos compatibles con la CSP

Los documentos HTML de las páginas públicas SHALL NOT contener scripts inline ni manejadores de eventos inline: solo cargan scripts y estilos por URL del propio origen, de modo que la CSP vigente (`script-src 'self'`) no cambia.

#### Scenario: Sin scripts inline
- **WHEN** se inspecciona el HTML construido de cualquier página pública
- **THEN** todo `<script>` tiene atributo `src` y no hay atributos `on*`

#### Scenario: Apertura directa sin violaciones
- **WHEN** un navegador abre `/configurador` directamente con la CSP en modo enforcing
- **THEN** la consola no registra violaciones de CSP

### Requirement: Metadatos sincronizados al navegar en la SPA

Al cambiar de ruta del lado del cliente, el sistema SHALL actualizar el título del documento, la meta description y el canonical con los de la página de destino.

#### Scenario: De la home al configurador
- **WHEN** el visitante está en `/` y usa el CTA "Armá tu web"
- **THEN** el título de la pestaña pasa a ser el del configurador y el canonical apunta a `https://www.facucode.dev/configurador`

#### Scenario: Del configurador a la home
- **WHEN** el visitante vuelve a `/` desde el configurador (navegación del cliente o botón atrás)
- **THEN** el título, la descripción y el canonical vuelven a ser los de la home

#### Scenario: Ruta desconocida
- **WHEN** el visitante abre una ruta inexistente y es redirigido a `/`
- **THEN** quedan aplicados los metadatos de la home

### Requirement: Variante con barra final

Una página pública pedida con barra final (por ejemplo `/configurador/`) SHALL mostrar la misma página y declarar el canonical de la URL sin barra final, para que los buscadores no la traten como una página distinta.

#### Scenario: Configurador con barra final
- **WHEN** se pide `https://www.facucode.dev/configurador/`
- **THEN** la respuesta es la página del configurador (directamente o tras una redirección permanente a `/configurador`) y su canonical es `https://www.facucode.dev/configurador`
