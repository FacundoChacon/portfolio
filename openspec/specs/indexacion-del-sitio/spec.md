# indexacion-del-sitio Specification

## Purpose
Define lo que el sitio expone a los buscadores para su indexación (`robots.txt` y `sitemap.xml`) y garantiza que esos archivos se sirven como estáticos y no como el documento de la SPA.

## Requirements

### Requirement: Sitemap de las páginas públicas

El sitio SHALL publicar en `https://www.facucode.dev/sitemap.xml` un sitemap XML válido (protocolo sitemaps.org 0.9) que liste exactamente las páginas públicas: `https://www.facucode.dev/` y `https://www.facucode.dev/configurador`. Cada URL listada SHALL servirse con un HTML cuyo `canonical` sea esa misma URL; una página que comparta el canonical de otra no se lista.

#### Scenario: Contenido del sitemap
- **WHEN** se pide `/sitemap.xml`
- **THEN** la respuesta es XML (no el HTML de la SPA) con un `<urlset>` que contiene exactamente `https://www.facucode.dev/` y `https://www.facucode.dev/configurador` en `<loc>`

#### Scenario: Cada URL listada declara su propio canonical
- **WHEN** se valida el sitemap contra los HTML construidos
- **THEN** para cada `<loc>` existe un HTML construido cuyo `canonical` es exactamente esa URL

#### Scenario: Rutas sin metadata propia excluidas
- **WHEN** el sitemap lista una URL cuyo HTML declara el canonical de otra página (o no tiene HTML propio)
- **THEN** la validación falla nombrando esa URL

#### Scenario: Solo URLs canónicas absolutas
- **WHEN** se valida el sitemap
- **THEN** cada `<loc>` es una URL `https://www.facucode.dev/...` absoluta, sin duplicados

### Requirement: robots.txt anuncia el sitemap

El sitio SHALL servir en `/robots.txt` una política que permita el rastreo de todo el sitio y declare la ubicación absoluta del sitemap.

#### Scenario: Línea Sitemap
- **WHEN** se pide `/robots.txt`
- **THEN** la respuesta es texto plano con `User-agent: *`, `Allow: /` y `Sitemap: https://www.facucode.dev/sitemap.xml`

### Requirement: Archivos estáticos antes del fallback SPA

El hosting SHALL servir los archivos existentes en la raíz pública (como `robots.txt`, `sitemap.xml` y los HTML propios de cada página pública) con su contenido y tipo propios, aplicando el fallback a `index.html` solo para rutas que no corresponden a un archivo.

#### Scenario: Archivo existente
- **WHEN** se pide `/sitemap.xml`
- **THEN** el `Content-Type` es de XML y el cuerpo no es el `index.html`

#### Scenario: Página pública con HTML propio
- **WHEN** se pide `/configurador`
- **THEN** el hosting responde el HTML propio del configurador (con su canonical) y no el `index.html` de la home

#### Scenario: Ruta de la SPA
- **WHEN** se pide una ruta sin archivo correspondiente (por ejemplo `/foo`)
- **THEN** el hosting responde el `index.html` de la SPA
