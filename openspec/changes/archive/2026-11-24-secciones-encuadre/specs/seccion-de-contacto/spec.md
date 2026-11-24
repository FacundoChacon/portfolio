## ADDED Requirements

### Requirement: Contacto como cierre de la página

Contacto es la última sección: desde 768 px de ancho SHALL medir al menos el alto útil de la pantalla (alto menos la barra), con un tope de 52rem, centrando verticalmente el encabezado y los canales y dejando el pie al final. Bajo el pie SHALL quedar como máximo 32 px de relleno. En anchos menores la sección SHALL conservar su alto natural.

#### Scenario: Navegar a Contáctame en una laptop o escritorio
- **WHEN** el visitante activa "Contáctame" en la barra en 1280×800, 1366×768 o 1440×900
- **THEN** el borde superior de Contacto queda pegado a la barra (±2 px), el encabezado, el panel y los canales quedan completos a la vista y el pie queda al final de la pantalla

#### Scenario: Pantalla más alta que el tope
- **WHEN** el visitante activa "Contáctame" en 1920×1080
- **THEN** Contacto mide 52rem (±2 px), todo su contenido queda a la vista y el espacio vacío entre el borde superior de la sección y su encabezado no supera 160 px

#### Scenario: Teléfono
- **WHEN** el visitante abre la home en 375×812
- **THEN** Contacto conserva su alto natural, sin alto mínimo ni centrado

#### Scenario: Sin hueco entre panel y canales
- **WHEN** se muestra Contacto en 1440×900 con el alto mínimo aplicado
- **THEN** el final del último canal sigue coincidiendo con el final del panel (16 px o menos), y el espacio extra queda por encima del encabezado y antes del pie, no entre los canales
