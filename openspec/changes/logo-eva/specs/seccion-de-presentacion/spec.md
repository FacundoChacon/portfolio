## ADDED Requirements

### Requirement: Glifo decorativo en la presentación
La sección de presentación SHALL mostrar la variante completa del glifo en gran tamaño como decoración. Su espacio SHALL estar reservado desde el primer render, NO SHALL tapar el nombre, el retrato ni las acciones en ningún ancho desde 320 píxeles y NO SHALL provocar desplazamiento horizontal de la página.

#### Scenario: Escritorio
- **WHEN** la home se muestra a 1440 píxeles de ancho
- **THEN** el glifo completo se ve junto al retrato, sin cubrir el nombre ni las acciones

#### Scenario: Móvil
- **WHEN** la home se muestra a 375 píxeles de ancho
- **THEN** el glifo se ve a menor tamaño sin superponerse al nombre y la página no tiene desplazamiento horizontal

#### Scenario: Sin desplazamiento de diseño
- **WHEN** se mide la home construida en escritorio y en móvil
- **THEN** el CLS sigue siendo menor o igual a 0.1 y ningún desplazamiento es atribuible al glifo

#### Scenario: Movimiento reducido
- **WHEN** el visitante tiene activada la preferencia de movimiento reducido
- **THEN** el glifo se muestra en su estado final desde el primer render, sin animación

#### Scenario: Entrada única sin preferencia
- **WHEN** el visitante no pidió movimiento reducido
- **THEN** el glifo aparece con una entrada única de menos de un segundo y después queda quieto, sin parpadear ni repetirse
