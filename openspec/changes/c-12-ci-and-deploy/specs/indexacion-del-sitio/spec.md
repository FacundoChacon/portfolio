# Spec Delta

## Purpose

Define lo que el sitio expone a los buscadores para su indexación (`robots.txt` y `sitemap.xml`) y garantiza que esos archivos se sirven como estáticos y no como el documento de la SPA.

## ADDED Requirements

### Requirement: Sitemap de las páginas públicas

El sitio SHALL publicar en `https://www.facucode.dev/sitemap.xml` un sitemap XML válido (protocolo sitemaps.org 0.9) que liste exactamente la home canónica: `https://www.facucode.dev/`. `/configurador` NO se lista: la SPA lo sirve con el `canonical` y `og:url` de la home, por lo que Google lo trataría como duplicado; se agregará cuando exista metadata por ruta.

#### Scenario: Contenido del sitemap
- **WHEN** se pide `/sitemap.xml`
- **THEN** la respuesta es XML (no el HTML de la SPA) con un `<urlset>` que contiene exactamente `https://www.facucode.dev/` en `<loc>`

#### Scenario: Rutas sin metadata propia excluidas
- **WHEN** se valida el sitemap
- **THEN** `https://www.facucode.dev/configurador` no figura en él

#### Scenario: Solo URLs canónicas absolutas
- **WHEN** se valida el sitemap
- **THEN** cada `<loc>` es una URL `https://www.facucode.dev/...` absoluta, sin duplicados

### Requirement: robots.txt anuncia el sitemap

El sitio SHALL servir en `/robots.txt` una política que permita el rastreo de todo el sitio y declare la ubicación absoluta del sitemap.

#### Scenario: Línea Sitemap
- **WHEN** se pide `/robots.txt`
- **THEN** la respuesta es texto plano con `User-agent: *`, `Allow: /` y `Sitemap: https://www.facucode.dev/sitemap.xml`

### Requirement: Archivos estáticos antes del fallback SPA

El hosting SHALL servir los archivos existentes en la raíz pública (como `robots.txt` y `sitemap.xml`) con su contenido y tipo propios, aplicando el fallback a `index.html` solo para rutas que no corresponden a un archivo.

#### Scenario: Archivo existente
- **WHEN** se pide `/sitemap.xml`
- **THEN** el `Content-Type` es de XML y el cuerpo no es el `index.html`

#### Scenario: Ruta de la SPA
- **WHEN** se pide `/configurador` (sin archivo correspondiente)
- **THEN** el hosting responde el `index.html` de la SPA
