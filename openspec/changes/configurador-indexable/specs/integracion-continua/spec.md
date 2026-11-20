## MODIFIED Requirements

### Requirement: Pipeline único equivalente al chequeo local

El pipeline de CI SHALL ejecutar, en cada push y pull request a `main`, la misma secuencia que el script `npm run ci` del repositorio (lint, verificación del catálogo, verificación de testimonios, verificación de la configuración de deploy, tests, build y verificación del build), de modo que un resultado verde local y uno verde en CI signifiquen lo mismo.

#### Scenario: Falla un test
- **WHEN** un cambio rompe cualquier test de `node:test` del repositorio
- **THEN** el pipeline termina en rojo aunque lint y build pasen

#### Scenario: Falla una verificación de datos o de deploy
- **WHEN** un cambio deja el catálogo, los testimonios o la configuración de deploy en un estado inválido
- **THEN** el pipeline termina en rojo

#### Scenario: Falla la verificación del build
- **WHEN** el build termina pero alguna página pública no tiene su HTML con los metadatos esperados
- **THEN** `npm run ci` y el pipeline terminan en rojo

#### Scenario: Todo en verde
- **WHEN** lint, verificaciones, tests, build y verificación del build pasan
- **THEN** el pipeline continúa con la verificación de artefactos del build

### Requirement: Verificación de artefactos del build

El pipeline SHALL verificar, después del build, que `dist/` contiene `index.html`, el HTML propio de cada página pública del sitemap, los assets públicos imprescindibles (`og-image.png`, `robots.txt`, `sitemap.xml` e imágenes del portfolio) y que `og:image` es una URL absoluta de `https://www.facucode.dev`. Para cada URL del sitemap, el HTML construido correspondiente SHALL declarar `canonical` y `og:url` iguales a esa URL.

#### Scenario: Falta un asset público
- **WHEN** el build no incluye `dist/sitemap.xml` o `dist/robots.txt`
- **THEN** el pipeline termina en rojo con un mensaje que nombra el archivo faltante

#### Scenario: og:image relativo
- **WHEN** `dist/index.html` (o el HTML de otra página pública) declara `og:image` con una ruta relativa
- **THEN** el pipeline termina en rojo

#### Scenario: Falta el HTML del configurador
- **WHEN** el build no genera el HTML propio de `/configurador`
- **THEN** el pipeline termina en rojo nombrando la URL y el archivo esperado

#### Scenario: Canonical incorrecto
- **WHEN** el HTML construido de una URL del sitemap declara un `canonical` u `og:url` distinto de esa URL
- **THEN** el pipeline termina en rojo nombrando la URL y el valor encontrado
