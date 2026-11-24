## MODIFIED Requirements

### Requirement: Anclas y foco no tapados por la barra fija

Al seguir un enlace a una sección de la home, o al mover el foco a un elemento que obliga a desplazar la página, el destino SHALL quedar completamente visible debajo de la barra fija (incluida su franja decorativa), sin quedar oculto por ella. Al seguir un enlace a una sección de la home (barra, menú móvil, botones internos o entrada directa por `/#id`), el borde superior de la sección SHALL quedar alineado con el borde inferior de la barra y su franja, igual para todas las secciones, salvo cuando el final de la página impide desplazar más; el foco por teclado SHALL conservar un margen extra respecto de la barra.

#### Scenario: Seguir un ancla
- **WHEN** el visitante activa "Proyectos" en la barra
- **THEN** el título de la sección Proyectos queda visible por debajo del borde inferior de la barra

#### Scenario: Desplazamiento uniforme entre secciones
- **WHEN** el visitante activa, uno por vez, los enlaces "Quién soy", "Proyectos" y "Stack" de la barra en una pantalla de 1280×800 o mayor
- **THEN** en cada caso el borde superior de la sección queda a 0 px (±2 px) del borde inferior de la barra con su franja, y el título queda a la misma distancia de la barra en todas (±16 px)

#### Scenario: Entrada directa con la misma posición
- **WHEN** el visitante carga `/#stack` directamente
- **THEN** la sección Stack queda en la misma posición que al activar "Stack" en la barra

#### Scenario: Foco por teclado cerca del borde superior
- **WHEN** el usuario retrocede con Shift+Tab hacia un control que estaba por encima del viewport
- **THEN** el control enfocado y su contorno quedan visibles, no tapados por la barra

## ADDED Requirements

### Requirement: Encuadre de la sección destino

En pantallas de 768 px de alto o más, al navegar a una sección de la home cuyo contenido cabe en el alto útil (alto de la pantalla menos la barra), el encabezado y todo el contenido SHALL quedar a la vista sin cortes, con el título a no más de 64 px de la barra. Si el contenido no cabe, la sección SHALL quedar a la vista desde el título, con la misma alineación superior que el resto.

#### Scenario: Quién soy en una laptop
- **WHEN** el visitante activa "Quién soy" en la barra en una pantalla de 1366×768
- **THEN** el título queda a 64 px o menos de la barra y el final del contenido queda dentro de la pantalla

#### Scenario: Stack en escritorio
- **WHEN** el visitante activa "Stack" en una pantalla de 1440×900
- **THEN** el título y la grilla completa de módulos quedan a la vista sin cortes

#### Scenario: Sección más alta que la pantalla
- **WHEN** el visitante activa un enlace del menú móvil en un teléfono de 375×812
- **THEN** la sección queda alineada bajo la barra con el título a 64 px o menos de ella, aunque el resto del contenido continúe debajo del pliegue
