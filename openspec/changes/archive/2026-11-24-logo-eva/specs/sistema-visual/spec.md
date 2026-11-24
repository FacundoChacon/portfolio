## ADDED Requirements

### Requirement: Colores del logotipo fuera de la jerarquía
El sistema SHALL definir en un único lugar los dos colores del logotipo (relleno amarillo y filo rojo anaranjado), separados de la paleta de roles. NO SHALL generar utilidades de color propias, SHALL llegar a los estilos solo como variables del logotipo y NO SHALL contar en la jerarquía de roles. El relleno SHALL alcanzar ≥ 4.5:1 y el filo ≥ 3:1 contra los fondos negro y de panel.

#### Scenario: Cambio de un color del logotipo
- **WHEN** se cambia el color de relleno o de filo en su definición central y se regeneran los recursos derivados
- **THEN** el glifo de la barra, del favicon y de la imagen para compartir cambia de color sin tocar ningún componente ni hoja de estilos

#### Scenario: Regresión de contraste del logotipo
- **WHEN** un color del logotipo cambia y queda por debajo de su umbral contra el fondo negro o el de panel
- **THEN** la verificación automática falla nombrando el color, el fondo y el contraste obtenido

#### Scenario: Logotipo fuera del conteo de la jerarquía
- **WHEN** se cuentan los usos en reposo de primario, secundario y terciario
- **THEN** los colores del logotipo no suman a ningún rol y la jerarquía violeta > naranja > verde agua se mantiene

#### Scenario: Color del logotipo escrito a mano en un componente
- **WHEN** un componente o una hoja de estilos usa el hex de un color del logotipo en lugar de su variable
- **THEN** la verificación automática falla nombrando el archivo
