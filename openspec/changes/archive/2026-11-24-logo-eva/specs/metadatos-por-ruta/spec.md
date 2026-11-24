## MODIFIED Requirements

### Requirement: Imagen para compartir con la identidad visual vigente

La imagen para compartir SHALL mostrar "Facundo Chacón", "Desarrollador Full Stack Java / React" y "facucode.dev" con la paleta y las tipografías del sistema visual vigente, sin elementos de la estética anterior, y SHALL mostrar la variante completa del glifo de marca con los colores del logotipo. SHALL poder regenerarse desde una plantilla versionada en el repositorio que tome los colores de la fuente única de la paleta, la forma del glifo de su definición única y use solo fuentes del propio repositorio, sin pedir recursos a terceros.

#### Scenario: Textos de la imagen
- **WHEN** se genera la plantilla de la imagen
- **THEN** contiene exactamente una vez el nombre "Facundo Chacón", el rol "Desarrollador Full Stack Java / React" y el dominio "facucode.dev"

#### Scenario: Paleta del sistema visual
- **WHEN** se genera la plantilla de la imagen
- **THEN** sus colores provienen de la paleta vigente (fondo negro del sistema, violeta primario, naranja secundario, agua terciario y los colores del logotipo para el glifo) y no contiene tokens, familias tipográficas ni efectos de la estética anterior

#### Scenario: Glifo de marca presente
- **WHEN** se genera la plantilla de la imagen
- **THEN** contiene exactamente una vez el glifo completo, con la misma geometría que su definición única y sin tapar el nombre, el rol ni el dominio

#### Scenario: Sin recursos de terceros
- **WHEN** se genera la plantilla de la imagen
- **THEN** no referencia hojas de estilo, fuentes ni imágenes de otro origen (por ejemplo `fonts.googleapis.com`) y sus fuentes son las serif de títulos y monoespaciada que usa el sitio

#### Scenario: Cambio en la paleta
- **WHEN** cambia el color de un rol o del logotipo en la fuente única de la paleta y se vuelve a generar la plantilla
- **THEN** la plantilla usa el color nuevo sin editar la plantilla a mano
