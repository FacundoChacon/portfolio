# Spec Delta: sistema-visual

## ADDED Requirements

### Requirement: Colores de marca fuera de la jerarquía

El sistema SHALL definir en un único lugar los colores de marca de las tecnologías de Stack y de los canales de Contacto, separados de la paleta de roles. Esos colores NO SHALL generar utilidades de color propias, SHALL llegar a los componentes solo como un color de marca genérico por elemento y NO SHALL contar en la jerarquía de roles. Cada uno SHALL alcanzar ≥ 4.5:1 contra los fondos negro y de panel.

#### Scenario: Cambio del color de una marca
- **WHEN** se cambia el color de una marca en su definición central
- **THEN** el módulo o canal que la usa cambia de color sin tocar ningún componente ni hoja de estilos

#### Scenario: Color oficial sin contraste suficiente
- **WHEN** el color oficial de una marca no alcanza 4.5:1 contra el fondo negro o el de panel
- **THEN** la definición central usa una variante más clara de esa marca que sí lo alcanza

#### Scenario: Regresión de contraste de una marca
- **WHEN** un color de marca cambia y queda por debajo de 4.5:1 contra negro o panel, o el texto negro sobre él queda por debajo de 4.5:1
- **THEN** la verificación automática falla nombrando la marca, el fondo y el contraste obtenido

#### Scenario: Marcas fuera del conteo de la jerarquía
- **WHEN** se cuentan los usos en reposo de primario, secundario y terciario
- **THEN** los colores de marca no suman a ningún rol y la jerarquía violeta > naranja > verde agua se mantiene

#### Scenario: Marca sin uso o uso sin marca
- **WHEN** la definición central tiene una marca que ningún módulo ni canal usa, o un módulo o canal referencia una marca inexistente
- **THEN** la verificación automática falla nombrando la marca
