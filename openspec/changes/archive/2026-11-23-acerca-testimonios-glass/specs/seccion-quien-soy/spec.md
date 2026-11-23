# Spec Delta

## Purpose

Define la sección "Quién soy" de la home: qué contenido presenta, cómo se estructura para tecnologías asistivas, cómo se muestran sus códigos de sistema decorativos y cómo aparece al entrar en pantalla con y sin movimiento reducido.

## ADDED Requirements

### Requirement: Contenido de la presentación

La sección "Quién soy" SHALL mostrar la biografía (formación en la Tecnicatura en Programación de la UTN FRM, perfil Full Stack Jr, tecnologías y proyectos, metodologías y automatización), la línea de idiomas (Español nativo, Inglés B2) y los cuatro puntos fuertes (Backend sólido, Frontend reactivo, Bases de datos, Metodología Ágil) con su título y su descripción, con los mismos textos que antes del rediseño.

#### Scenario: Textos sin cambios
- **WHEN** se compara el texto visible de la sección rediseñada con el anterior
- **THEN** los párrafos de la biografía, la línea de idiomas y los títulos y descripciones de los cuatro puntos fuertes son los mismos

#### Scenario: Orden de los puntos fuertes
- **WHEN** el visitante recorre los puntos fuertes
- **THEN** aparecen en el orden Backend sólido, Frontend reactivo, Bases de datos, Metodología Ágil

### Requirement: Estructura accesible de la sección

La sección SHALL conservar el ancla `#quien-soy`, SHALL estar rotulada por un encabezado de nivel 2 cuyo nombre accesible es "Quién soy" y cada punto fuerte SHALL tener un encabezado de nivel 3 con su título. Los íconos SHALL ser decorativos.

#### Scenario: Navegación por encabezados
- **WHEN** un lector de pantalla lista los encabezados de la home
- **THEN** encuentra "Quién soy" como nivel 2 y, debajo, los cuatro puntos fuertes como nivel 3

#### Scenario: Enlace de la barra a la sección
- **WHEN** el visitante activa "Quién soy" en la barra de navegación
- **THEN** la página lleva a la sección `#quien-soy`

### Requirement: Códigos de sistema decorativos

La sección SHALL mostrar códigos de sistema estilo expediente (código de sección igual al de la barra de navegación, etiqueta y código del panel de biografía, código de cada punto fuerte) en tipografía monoespaciada, y esos códigos NO SHALL anunciarse a tecnologías asistivas ni interrumpir la lectura del contenido.

#### Scenario: Código de sección coherente con la barra
- **WHEN** se compara el código mostrado junto al título "Quién soy" con el código del enlace "Quién soy" de la barra
- **THEN** ambos son el mismo código

#### Scenario: Lectura sin códigos
- **WHEN** un lector de pantalla lee el panel de biografía y los puntos fuertes
- **THEN** anuncia los encabezados y textos sin leer etiquetas ni códigos de sistema

### Requirement: Revelado de entrada de la sección

Los paneles de la sección SHALL aparecer con una animación de entrada la primera vez que entran en el viewport. Con `prefers-reduced-motion: reduce`, o sin `IntersectionObserver`, SHALL mostrarse visibles desde el primer render y sin transición.

#### Scenario: Entrada con animación
- **WHEN** no hay preferencia de movimiento reducido y la sección entra en el viewport
- **THEN** los paneles pasan de ocultos a visibles con su animación y quedan visibles

#### Scenario: Movimiento reducido
- **WHEN** el sistema operativo pide movimiento reducido
- **THEN** los paneles están visibles desde el primer render, sin desplazamiento ni transición de opacidad

### Requirement: Paleta del sistema visual en Quién soy

La sección SHALL usar solo colores, tipografías y texturas del sistema visual eva: sin colores de la estética anterior, sin brillos (`glow`), sin efectos glitch y sin colores hexadecimales literales en el componente.

#### Scenario: Clase de la estética anterior
- **WHEN** el componente de la sección vuelve a usar una clase `accent-*`, `neon-*`, `dark-*`, `*-glow-*` o un efecto glitch
- **THEN** la verificación automática falla nombrando la clase
