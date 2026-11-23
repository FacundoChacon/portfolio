# Spec Delta

## MODIFIED Requirements

### Requirement: Texto legible sobre el cristal en el peor caso

Todo texto de tamaño normal apoyado sobre un panel de cristal SHALL alcanzar contraste WCAG ≥ 4.5:1 contra el color compuesto del panel sobre el fondo más claro que su sección pueda poner detrás (la línea de la grilla hexagonal violeta) y también contra fondos de estrés de violeta sólido y de naranja sólido del sistema. Los gráficos que transmiten información (estrellas vacías, bordes de avatar) SHALL alcanzar ≥ 3:1 sobre el fondo real de la sección.

#### Scenario: Texto sobre una línea de la grilla hexagonal
- **WHEN** un párrafo en papel, gris, violeta claro, naranja o verde agua del sistema queda justo encima de una línea de la grilla hexagonal, debajo de un panel de cristal
- **THEN** su contraste contra el color compuesto del panel en ese punto es de al menos 4.5:1

#### Scenario: Textura decorativa más intensa detrás del panel
- **WHEN** detrás del panel de cristal hubiera una superficie violeta sólida o naranja sólida del sistema (casos de estrés)
- **THEN** el texto papel, gris, violeta claro, naranja y verde agua del panel sigue alcanzando al menos 4.5:1 en ambos casos

#### Scenario: Regresión al bajar la opacidad del tinte
- **WHEN** alguien reduce la opacidad del tinte del cristal o aumenta su brillo superficial hasta que algún par queda por debajo de su umbral
- **THEN** la verificación automática falla nombrando el par, el fondo evaluado y el contraste obtenido
