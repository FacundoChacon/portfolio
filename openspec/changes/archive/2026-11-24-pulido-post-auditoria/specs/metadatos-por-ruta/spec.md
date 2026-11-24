## ADDED Requirements

### Requirement: Formato de la imagen para compartir

La imagen que declaran `og:image` y `twitter:image` SHALL publicarse en `https://www.facucode.dev/og-image.png` como un PNG de exactamente 1200×630 píxeles, coherente con `og:image:width`, `og:image:height` y `og:image:type`, y con un peso de archivo de como máximo 300 KB para que las previews de mensajería la acepten.

#### Scenario: Dimensiones y formato
- **WHEN** se valida el archivo `public/og-image.png` del repositorio
- **THEN** es un PNG válido de 1200×630 píxeles

#### Scenario: Peso acotado
- **WHEN** se valida el archivo `public/og-image.png` del repositorio
- **THEN** pesa como máximo 300 KB (307 200 bytes) y la validación falla nombrando el peso real si lo supera

#### Scenario: Misma URL que declaran los metadatos
- **WHEN** se inspecciona el HTML de cualquier página pública después del cambio
- **THEN** `og:image` y `twitter:image` siguen valiendo `https://www.facucode.dev/og-image.png` y esa URL responde la imagen nueva

### Requirement: Imagen para compartir con la identidad visual vigente

La imagen para compartir SHALL mostrar "Facundo Chacón", "Desarrollador Full Stack Java / React" y "facucode.dev" con la paleta y las tipografías del sistema visual vigente, sin elementos de la estética anterior. SHALL poder regenerarse desde una plantilla versionada en el repositorio que tome los colores de la fuente única de la paleta y use solo fuentes del propio repositorio, sin pedir recursos a terceros.

#### Scenario: Textos de la imagen
- **WHEN** se genera la plantilla de la imagen
- **THEN** contiene exactamente una vez el nombre "Facundo Chacón", el rol "Desarrollador Full Stack Java / React" y el dominio "facucode.dev"

#### Scenario: Paleta del sistema visual
- **WHEN** se genera la plantilla de la imagen
- **THEN** sus colores provienen de la paleta vigente (fondo negro del sistema, violeta primario, naranja secundario, agua terciario) y no contiene tokens, familias tipográficas ni efectos de la estética anterior

#### Scenario: Sin recursos de terceros
- **WHEN** se genera la plantilla de la imagen
- **THEN** no referencia hojas de estilo, fuentes ni imágenes de otro origen (por ejemplo `fonts.googleapis.com`) y sus fuentes son las serif de títulos y monoespaciada que usa el sitio

#### Scenario: Cambio en la paleta
- **WHEN** cambia el color de un rol en la fuente única de la paleta y se vuelve a generar la plantilla
- **THEN** la plantilla usa el color nuevo sin editar la plantilla a mano
