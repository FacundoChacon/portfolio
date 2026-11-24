## MODIFIED Requirements

### Requirement: Ancla de la sección

El ancla `#proyectos` SHALL llevar al comienzo de la sección con el título visible, sin quedar tapado por la navegación fija. En pantallas de 768 px de alto o más, al llegar por el ancla SHALL quedar a la vista el título y las cards completas del panel. La sección SHALL desplazarse con el scroll normal de la página, sin fijarse. Navegar el panel no SHALL agregar entradas al historial ni cambiar la posición de scroll de la página.

#### Scenario: Enlace "Proyectos" del nav
- **WHEN** el visitante usa el enlace "Proyectos" de la navegación
- **THEN** ve el título de la sección y el panel debajo de la barra fija, y el enlace "Proyectos" del nav queda marcado como sección activa

#### Scenario: Cards completas en una laptop
- **WHEN** el visitante usa el enlace "Proyectos" de la navegación en 1366×768, 1280×800 o 1440×900
- **THEN** el final de las cards visibles (incluido su botón "Repositorio") queda dentro de la pantalla

#### Scenario: Entrada directa por el ancla
- **WHEN** el visitante carga la home directamente con `/#proyectos` (o cualquier `#id` de sección de la home) en la URL
- **THEN** una vez montada la página, esta se desplaza a esa sección sin animación y sin quedar tapada por la navegación fija; un hash que no corresponde a ningún elemento no provoca ningún desplazamiento

#### Scenario: Scroll sin tramo fijado
- **WHEN** el visitante baja con la rueda a través de la sección
- **THEN** la sección pasa como cualquier otra, sin quedar fija ni cambiar de proyecto por el scroll

#### Scenario: Historial sin entradas por navegación
- **WHEN** el visitante recorre los cinco proyectos con los botones y luego usa Atrás
- **THEN** el navegador sale de la home (o vuelve a la entrada anterior) sin pasar por estados intermedios del panel
