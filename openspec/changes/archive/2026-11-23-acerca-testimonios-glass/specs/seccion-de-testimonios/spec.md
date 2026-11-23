# Spec Delta

## Purpose

Define la sección "Testimonios" de la home: cuándo se muestra, qué información presenta de cada testimonio, cómo se presenta como consola de mensajes entrantes sin texto animado en el título y cómo limita su movimiento.

## ADDED Requirements

### Requirement: Sección oculta sin testimonios

Si la fuente de datos de testimonios está vacía, la home NO SHALL renderizar la sección "Testimonios" (ni su título, ni su ancla, ni un contenedor vacío). Con al menos un testimonio, la sección SHALL mostrarse con el ancla `#testimonios`.

#### Scenario: Datos vacíos
- **WHEN** la fuente de testimonios es un array vacío
- **THEN** la home no contiene el título "Testimonios" ni un elemento con id `testimonios`

#### Scenario: Datos cargados
- **WHEN** la fuente de testimonios tiene tres testimonios válidos
- **THEN** la home muestra la sección "Testimonios" con los tres, en el orden de los datos

### Requirement: Contenido de cada testimonio

Cada testimonio SHALL mostrar su comentario como cita, el nombre y el rol de quien lo dio y, solo si la calificación es un entero de 1 a 5, una representación gráfica de la calificación con el texto alternativo "Calificación: N de 5". El avatar de iniciales SHALL ser decorativo.

#### Scenario: Calificación válida
- **WHEN** un testimonio tiene calificación 4
- **THEN** se muestran cuatro estrellas llenas y una vacía, y un lector de pantalla anuncia "Calificación: 4 de 5" una sola vez

#### Scenario: Calificación inválida
- **WHEN** un testimonio tiene calificación 0, 6, 3.5 o no la tiene
- **THEN** no se muestra ninguna calificación para ese testimonio

#### Scenario: Iniciales del avatar
- **WHEN** el nombre es "Ana María Pérez"
- **THEN** el avatar muestra "AM" y no se anuncia a tecnologías asistivas

### Requirement: Testimonios como mensajes entrantes

Cada testimonio SHALL presentarse como un mensaje entrante de consola con un código correlativo según su posición (`MSG-001`, `MSG-002`…). Los códigos y los símbolos de consola SHALL ser decorativos y NO SHALL anunciarse a tecnologías asistivas.

#### Scenario: Códigos correlativos
- **WHEN** la sección muestra tres testimonios
- **THEN** sus códigos visibles son `MSG-001`, `MSG-002` y `MSG-003` en ese orden

#### Scenario: Lectura sin decoración de consola
- **WHEN** un lector de pantalla lee un testimonio
- **THEN** anuncia la calificación, la cita, el nombre y el rol, sin leer el código ni el prompt de consola

### Requirement: Título estático

El título de la sección SHALL mostrar el texto real "Testimonios" de forma estática: NO SHALL revolver caracteres ni animarse periódicamente.

#### Scenario: Título durante la visita
- **WHEN** el visitante mira el título de la sección durante varios segundos
- **THEN** el texto "Testimonios" no cambia de caracteres ni parpadea

### Requirement: Movimiento acotado de la sección

Los testimonios SHALL aparecer con una animación de entrada la primera vez que entran en el viewport y el cursor decorativo de consola NO SHALL parpadear más de 5 segundos. Con `prefers-reduced-motion: reduce`, las cards SHALL estar visibles desde el primer render y el cursor NO SHALL parpadear.

#### Scenario: Cursor de consola sin preferencia
- **WHEN** no hay preferencia de movimiento reducido y una card de testimonio se muestra
- **THEN** el cursor decorativo parpadea a lo sumo durante 5 segundos y luego queda fijo

#### Scenario: Movimiento reducido en Testimonios
- **WHEN** el sistema operativo pide movimiento reducido
- **THEN** las cards están visibles desde el primer render y el cursor no parpadea

### Requirement: Contrato de datos de testimonios

La forma de los datos de testimonios (nombre, rol, comentario y calificación entera de 1 a 5; entre 3 y 6 testimonios cuando no está vacío; nombres únicos) SHALL seguir validándose con la verificación de testimonios del proyecto, usando la misma regla de calificación que la sección.

#### Scenario: Array vacío
- **WHEN** se ejecuta la verificación de testimonios con el array vacío
- **THEN** avisa que la sección está inactiva y termina sin error

#### Scenario: Calificación fuera de rango
- **WHEN** un testimonio cargado tiene calificación 6
- **THEN** la verificación de testimonios falla nombrando ese testimonio

### Requirement: Paleta del sistema visual en Testimonios

La sección SHALL usar solo colores, tipografías y texturas del sistema visual eva: sin colores de la estética anterior, sin brillos, sin efectos glitch, sin el componente de texto glitch y sin colores hexadecimales literales en el componente.

#### Scenario: Componente glitch reintroducido
- **WHEN** el componente de Testimonios vuelve a importar el componente de texto glitch o a usar una clase `accent-*`, `neon-*`, `dark-*` o `*-glow-*`
- **THEN** la verificación automática falla nombrando el uso
