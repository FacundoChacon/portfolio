# Spec Delta

## ADDED Requirements

### Requirement: Columnas equilibradas en el contacto
Cuando el panel de invitación y la lista de canales se muestran lado a lado (desde 1024px de ancho), la lista de canales SHALL ocupar el mismo alto que el panel, repartido en partes iguales entre los canales, sin dejar espacio vacío debajo del último canal. En anchos donde se apilan, los canales SHALL conservar su alto natural.

#### Scenario: Escritorio sin hueco bajo los canales
- **WHEN** la sección se muestra a 1024, 1280, 1440 o 1920px de ancho
- **THEN** el final del último canal coincide con el final del panel de invitación (diferencia de 16px o menos) y los tres canales tienen el mismo alto

#### Scenario: Pantallas apiladas sin cambios
- **WHEN** la sección se muestra a 375 o 768px de ancho
- **THEN** el panel y los canales siguen apilados y cada canal conserva su alto natural, igual que antes del cambio

#### Scenario: Contenido del canal estirado
- **WHEN** un canal se estira para ocupar su parte del alto
- **THEN** el ícono, la etiqueta, el valor y el indicador quedan centrados verticalmente, y toda el área del canal es clickeable y muestra los estados de hover y foco
