## ADDED Requirements

### Requirement: Ritmo vertical común de las secciones

Las secciones de la home, salvo la presentación y Contacto (que tiene su propio encuadre de cierre), SHALL compartir un mismo relleno vertical, más chico en móvil que desde 768 px de ancho y de 56 px como máximo, y todas las secciones salvo la presentación SHALL separar en 32 px como máximo su encabezado (o su texto introductorio) y el contenido, de modo que el espacio entre secciones no domine la pantalla.

#### Scenario: Relleno igual entre secciones
- **WHEN** se miden en 1440×900 los rellenos superior e inferior de Quién soy, Proyectos, Stack y Testimonios
- **THEN** todos tienen el mismo relleno y no supera 56 px

#### Scenario: Móvil más compacto
- **WHEN** se mide el relleno superior de esas secciones en 375×812
- **THEN** es igual en todas y menor que en 1440×900

#### Scenario: Separación encabezado–contenido
- **WHEN** se mide la distancia entre la fila del título (o el texto introductorio, si lo hay) y el primer bloque de contenido de cada sección
- **THEN** no supera 32 px en ninguna sección
