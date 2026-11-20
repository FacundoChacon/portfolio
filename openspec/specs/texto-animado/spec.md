# texto-animado Specification

## Purpose
Define el comportamiento del texto con efecto glitch del portfolio: cómo se anima el revuelto periódico de caracteres sin perjudicar a las tecnologías de asistencia ni a quienes piden movimiento reducido.

## Requirements

### Requirement: Texto estable para tecnologías de asistencia
El sistema SHALL exponer a las tecnologías de asistencia únicamente el texto real del elemento con efecto glitch; los caracteres revueltos de la animación NO SHALL anunciarse.

#### Scenario: Lectura durante el revuelto
- **WHEN** un lector de pantalla lee el texto mientras la animación muestra caracteres revueltos
- **THEN** se anuncia el texto real completo y no los caracteres revueltos

#### Scenario: Texto real en el contenido
- **WHEN** se renderiza un texto con efecto glitch
- **THEN** el texto real está presente en el contenido accesible del elemento en todo momento

### Requirement: Respeto del movimiento reducido
Cuando el sistema operativo o el navegador indican preferencia de movimiento reducido, el sistema NO SHALL revolver el texto ni aplicar el destello asociado: SHALL mostrar el texto real de forma estática. Si la preferencia no puede determinarse, el sistema SHALL animar como hasta ahora.

#### Scenario: Movimiento reducido activo
- **WHEN** el visitante tiene activada la preferencia de movimiento reducido
- **THEN** el texto se muestra estático, sin revuelto de caracteres ni destello

#### Scenario: Sin preferencia de movimiento reducido
- **WHEN** el visitante no pidió movimiento reducido
- **THEN** el texto se revuelve periódicamente como antes

#### Scenario: Preferencia que cambia en caliente
- **WHEN** el visitante activa la preferencia de movimiento reducido con la página abierta
- **THEN** el texto deja de revolverse sin recargar la página

#### Scenario: Entorno sin soporte de la preferencia
- **WHEN** el entorno no permite consultar la preferencia de movimiento
- **THEN** el sistema no falla y anima el texto como cuando no hay preferencia
