# Spec Delta

## MODIFIED Requirements

### Requirement: Geometría única del glifo
El glifo SHALL definirse en un único lugar versionado como trazos vectoriales dibujados a mano, sin imágenes rasterizadas embebidas. Cada lugar del sitio que lo muestra (barra, compuerta de entrada, favicon, ícono táctil e imagen para compartir) SHALL obtener su forma de esa definición, de modo que cambiar un trazo cambie todas sus apariciones.

#### Scenario: Cambio de un trazo
- **WHEN** se modifica un trazo en la definición única del glifo y se regeneran los recursos derivados
- **THEN** la barra, la compuerta de entrada, el favicon, el ícono táctil y la imagen para compartir muestran el trazo nuevo sin editar cada uso a mano

#### Scenario: Sin raster embebido
- **WHEN** se inspecciona la definición del glifo o cualquiera de sus SVG derivados
- **THEN** solo contiene trazados vectoriales y no referencia ni incrusta imágenes rasterizadas

#### Scenario: Recurso desincronizado
- **WHEN** el favicon publicado no coincide con lo que produce la definición única
- **THEN** la verificación automática falla nombrando el archivo desincronizado
