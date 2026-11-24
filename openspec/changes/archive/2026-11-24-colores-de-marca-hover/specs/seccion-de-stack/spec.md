# Spec Delta: seccion-de-stack

## ADDED Requirements

### Requirement: Color de marca por tecnología

Cada tecnología SHALL tener un color de marca tomado de la definición central del sistema visual y SHALL seguir distinguiéndose por monograma, nombre, categoría y código de módulo correlativo (`MOD-01` a `MOD-12`). Con puntero fino y hover, los módulos en reposo SHALL verse neutrales e iguales entre sí; el color de marca SHALL aparecer solo en el borde y el monograma. Nombre y categoría SHALL conservar sus colores neutros.

#### Scenario: Cada tecnología con su color
- **WHEN** se revisan los datos de la sección
- **THEN** cada una de las 12 tecnologías declara un color de marca que existe en la definición central, y ninguna queda sin color

#### Scenario: Familias de color de cada tecnología
- **WHEN** se encienden los módulos
- **THEN** Java 17 se ve naranja, Spring Boot verde, React 18 cian, Tailwind CSS verde azulado, JavaScript amarillo, MySQL azul acero, Python amarillo dorado, Docker azul, Git rojo anaranjado, REST API verde lima, JWT rosa y HTML5 / CSS3 azul lavanda

#### Scenario: Reposo neutral con mouse
- **WHEN** se comparan los módulos de Java 17 y de Docker en reposo en una computadora con mouse
- **THEN** tienen los mismos colores de fondo, borde, monograma y texto, y se distinguen por monograma, nombre, categoría y código

#### Scenario: Color declarado fuera de la definición central
- **WHEN** el componente de la sección o sus datos declaran un color hexadecimal literal o un estilo de color propio en lugar de referenciar la definición central
- **THEN** la verificación automática falla

### Requirement: Color de marca permanente en pantallas táctiles

En dispositivos sin hover o con puntero grueso, cada módulo SHALL mostrar siempre, en relieve y sin interacción, el borde y el monograma en el color de marca de su tecnología. Tocar un módulo NO SHALL cambiar su estado.

#### Scenario: Stack en un teléfono
- **WHEN** el visitante ve la sección Stack en un teléfono
- **THEN** cada módulo muestra su borde y su monograma en el color de marca de su tecnología, en relieve

#### Scenario: Toque sobre un módulo coloreado
- **WHEN** el visitante toca el módulo de Docker en un teléfono
- **THEN** el módulo conserva el mismo aspecto y no se abre ni enfoca nada

## MODIFIED Requirements

### Requirement: Módulo hundido al pasar el puntero

En dispositivos con puntero fino y capacidad de hover, al pasar el puntero sobre un módulo este SHALL verse hundido (sombra interior y fondo más oscuro en lugar de relieve) y su borde y su monograma SHALL tomar el color de marca de su tecnología; al retirar el puntero SHALL volver al relieve con el borde gris y el monograma en su color neutro. En pantallas táctiles, tocar un módulo NO SHALL cambiar su estado.

#### Scenario: Puntero sobre un módulo
- **WHEN** el visitante pasa el mouse sobre el módulo de React 18
- **THEN** ese módulo se ve hundido con el borde y el monograma en el cian de React, y los demás siguen en relieve con el borde en gris y el monograma en su color neutro

#### Scenario: Puntero fuera del módulo
- **WHEN** el visitante retira el mouse del módulo
- **THEN** el módulo vuelve al relieve con el borde gris y el monograma en su color neutro

#### Scenario: Toque en pantalla táctil
- **WHEN** el visitante toca un módulo en un teléfono
- **THEN** el módulo no cambia de estado (sigue en relieve con su color de marca) y no se abre ni enfoca nada

### Requirement: Contraste de los módulos en todos sus estados

En reposo y hundido, el borde de cada módulo SHALL alcanzar ≥ 3:1 contra la superficie que lo rodea, contra el fondo del propio módulo y contra el color compuesto de sus sombras; el texto del módulo SHALL alcanzar ≥ 4.5:1 contra el fondo del módulo y contra sus sombras interiores. Esto SHALL cumplirse también con el borde en el color de marca de cada tecnología (hundido con puntero fino y en relieve en pantallas táctiles), y el monograma en color de marca SHALL alcanzar ≥ 4.5:1 contra su fondo.

#### Scenario: Módulo en reposo
- **WHEN** se evalúa el borde de un módulo en relieve contra la superficie, el fondo del módulo y sus sombras clara y oscura
- **THEN** cada par alcanza al menos 3:1

#### Scenario: Módulo hundido
- **WHEN** se evalúa el borde de un módulo hundido contra la superficie, su fondo oscuro y su sombra interior clara, y su texto contra ese fondo y esa sombra
- **THEN** el borde alcanza al menos 3:1 y el texto al menos 4.5:1 en cada par

#### Scenario: Regresión de una sombra
- **WHEN** alguien aclara la sombra clara del relieve o cambia un color hasta que un par queda por debajo de su umbral
- **THEN** la verificación automática falla nombrando el estado, el par y el contraste obtenido

#### Scenario: Colores de marca de las 12 tecnologías
- **WHEN** se evalúa el color de marca de cada tecnología como borde (en relieve y hundido, contra superficie, fondo y sombras) y como monograma contra su fondo
- **THEN** cada borde alcanza al menos 3:1 y cada monograma al menos 4.5:1, y si un color baja de su umbral la verificación automática falla nombrando la tecnología y el contraste

### Requirement: Movimiento de la sección Stack

Los módulos SHALL aparecer en cascada con una animación de entrada la primera vez que la lista entra en el viewport y el paso entre relieve y hundido, incluido el cambio al color de marca, SHALL ser una transición breve. Con `prefers-reduced-motion: reduce`, los módulos SHALL estar visibles desde el primer render y el cambio de estado y de color SHALL ser instantáneo.

#### Scenario: Entrada sin preferencia
- **WHEN** no hay preferencia de movimiento reducido y la lista entra en el viewport
- **THEN** los módulos aparecen uno tras otro y quedan visibles

#### Scenario: Movimiento reducido en Stack
- **WHEN** el sistema operativo pide movimiento reducido
- **THEN** los módulos están visibles desde el primer render y al pasar el puntero se hunden y toman su color de marca sin transición

## REMOVED Requirements

### Requirement: Paleta unificada sin colores de marca

**Reason**: El change `colores-de-marca-hover` introduce a propósito un color de marca por tecnología, que este requisito prohibía.
**Migration**: La distinción por monograma, nombre, categoría y código `MOD-01` a `MOD-12` se mantiene (requisito "Catálogo de tecnologías conservado" y datos de la sección). El reposo neutral con mouse pasa a "Color de marca por tecnología"; la prohibición de hex literales o colores propios en el componente y los datos se conserva en su escenario "Color declarado fuera de la definición central".
