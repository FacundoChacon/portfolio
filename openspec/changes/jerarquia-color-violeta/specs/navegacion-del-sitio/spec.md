# Spec Delta

## MODIFIED Requirements

### Requirement: Indicador de sección actual

En `/`, la barra de navegación SHALL marcar como actual el enlace de la sección de la home que está en pantalla, mostrándolo como bloque sólido invertido (texto negro sobre fondo violeta, el color primario) y exponiéndolo a tecnologías asistivas con `aria-current`. A lo sumo un enlace SHALL estar marcado a la vez; si ninguna sección enlazada está en pantalla, ninguno se marca.

#### Scenario: Sección visible marcada
- **WHEN** el visitante se desplaza hasta que la sección Proyectos ocupa la zona de lectura bajo la barra
- **THEN** el enlace "Proyectos" se muestra invertido, con texto negro sobre violeta, y es el único con `aria-current`

#### Scenario: Dos secciones en pantalla
- **WHEN** el final de una sección enlazada y el comienzo de la siguiente están en pantalla a la vez
- **THEN** se marca solo la que aparece primero en el orden del documento dentro de la zona de lectura

#### Scenario: Sección no enlazada
- **WHEN** en pantalla solo está una sección que no tiene enlace en la barra (por ejemplo Testimonios)
- **THEN** ningún enlace queda marcado como actual

#### Scenario: Navegador sin observador de intersección
- **WHEN** el navegador no ofrece una forma de detectar qué sección está en pantalla
- **THEN** la barra funciona igual, sin marcar ningún enlace y sin errores en consola

### Requirement: Legibilidad del fondo translúcido

La barra SHALL usar un fondo negro translúcido con desenfoque del contenido que pasa por detrás, con la opacidad suficiente para que sus textos cumplan el contraste declarado por la paleta del sistema aun sobre el contenido más claro del sitio. Si el navegador no soporta desenfoque de fondo, la barra SHALL usar un fondo negro opaco.

#### Scenario: Contenido claro detrás de la barra
- **WHEN** pasa por detrás de la barra la zona más clara posible del sitio (blanco)
- **THEN** los textos violeta claro, papel y gris de la barra mantienen al menos 4.5:1 contra el fondo resultante

#### Scenario: Navegador sin desenfoque de fondo
- **WHEN** el navegador no soporta `backdrop-filter`
- **THEN** la barra se muestra con fondo negro opaco y el mismo contraste que sobre el fondo principal

### Requirement: Cabecera coherente en el configurador

La cabecera de `/configurador` SHALL mostrar la misma marca y el mismo cromado que la barra de la home (bordes violeta duros, fondo negro translúcido con respaldo opaco) y SHALL conservar su enlace "Volver al inicio" con navegación del lado del cliente, sin volverse fija ni alterar el contenido del configurador.

#### Scenario: Marca y estilo compartidos
- **WHEN** el visitante abre `/configurador`
- **THEN** la cabecera muestra la misma marca que la barra de la home con bordes violeta y fondo negro

#### Scenario: Volver al inicio
- **WHEN** el visitante activa "Volver al inicio" en la cabecera del configurador
- **THEN** el sistema navega a `/` sin una recarga completa del documento
