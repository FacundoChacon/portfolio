# Spec Delta

## Purpose

Define el material de cristal translúcido de los paneles estáticos del sitio: texto legible sobre el peor fondo decorativo que pueda quedar detrás, respaldo opaco cuando el navegador no soporta desenfoque de fondo y uso acotado a paneles que no se desplazan respecto de su fondo.

## ADDED Requirements

### Requirement: Texto legible sobre el cristal en el peor caso

Todo texto de tamaño normal apoyado sobre un panel de cristal SHALL alcanzar contraste WCAG ≥ 4.5:1 contra el color compuesto del panel sobre el fondo más claro que su sección pueda poner detrás (la línea de la grilla hexagonal) y también contra un fondo de estrés de naranja sólido del sistema. Los gráficos que transmiten información (estrellas vacías, bordes de avatar) SHALL alcanzar ≥ 3:1 sobre el fondo real de la sección.

#### Scenario: Texto sobre una línea de la grilla hexagonal
- **WHEN** un párrafo en papel, gris, naranja o verde del sistema queda justo encima de una línea de la grilla hexagonal, debajo de un panel de cristal
- **THEN** su contraste contra el color compuesto del panel en ese punto es de al menos 4.5:1

#### Scenario: Textura decorativa más intensa detrás del panel
- **WHEN** detrás del panel de cristal hubiera una superficie naranja sólida del sistema (caso de estrés)
- **THEN** el texto papel, gris, naranja y verde del panel sigue alcanzando al menos 4.5:1

#### Scenario: Regresión al bajar la opacidad del tinte
- **WHEN** alguien reduce la opacidad del tinte del cristal o aumenta su brillo superficial hasta que algún par queda por debajo de su umbral
- **THEN** la verificación automática falla nombrando el par, el fondo evaluado y el contraste obtenido

### Requirement: Respaldo opaco sin desenfoque de fondo

Cuando el navegador no soporta `backdrop-filter` (con o sin prefijo), cada panel de cristal SHALL mostrarse con el color de panel del sistema totalmente opaco, con el mismo borde, tamaño y contenido que con soporte.

#### Scenario: Navegador sin soporte de desenfoque
- **WHEN** la home se abre en un navegador que no soporta `backdrop-filter`
- **THEN** los paneles de cristal se ven con fondo de panel opaco, la grilla hexagonal no se ve a través de ellos y el texto mantiene el contraste de sus pares sobre panel

#### Scenario: Navegador con soporte
- **WHEN** la home se abre en un navegador que soporta `backdrop-filter`
- **THEN** los paneles de cristal dejan entrever la grilla hexagonal desenfocada detrás de su tinte translúcido

### Requirement: Cristal solo en paneles estáticos

El material de cristal SHALL aplicarse solo a paneles que no se mueven respecto de su fondo: no SHALL tener transformaciones ni animaciones continuas al pasar el puntero o al enfocar, ni usarse dentro de pistas o carruseles desplazables. Su desenfoque SHALL ser de 12px como máximo.

#### Scenario: Puntero sobre un panel de cristal
- **WHEN** el visitante pasa el puntero sobre un panel de cristal de "Quién soy" o de "Testimonios"
- **THEN** el panel no se traslada, no escala y no cambia su desenfoque

#### Scenario: Regla del material fuera de rango
- **WHEN** la regla del material de cristal declara un desenfoque mayor a 12px, una transición o una transformación
- **THEN** la verificación automática falla
