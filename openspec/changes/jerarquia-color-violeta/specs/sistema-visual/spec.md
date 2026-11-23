# Spec Delta

## MODIFIED Requirements

### Requirement: Paleta con contraste verificado

El sitio SHALL disponer de una paleta de tokens de color propia del sistema visual: negro, panel, línea, papel, grises, violeta, violeta claro, naranja, verde agua, y los colores de estado celeste y rojo claro. Cada combinación texto/fondo que el sistema declare apta para texto normal SHALL alcanzar contraste WCAG ≥ 4.5:1; las declaradas solo para texto grande o componentes de interfaz SHALL alcanzar ≥ 3:1. El violeta sólido SHALL usarse como relleno, borde o texto grande, y el texto de acento violeta SHALL usar el violeta claro.

#### Scenario: Par de texto normal conforme
- **WHEN** se evalúa el contraste del texto papel, gris, violeta claro, naranja, verde agua, celeste o rojo claro sobre el fondo negro, de panel o de línea
- **THEN** cada par alcanza al menos 4.5:1

#### Scenario: Texto sobre el relleno violeta
- **WHEN** un control usa el violeta sólido como relleno con texto encima
- **THEN** el texto es negro y alcanza al menos 4.5:1

#### Scenario: Violeta sólido restringido
- **WHEN** se evalúa el violeta sólido sobre el fondo de línea
- **THEN** el par queda declarado solo para texto grande o componentes de interfaz y alcanza al menos 3:1

#### Scenario: Regresión de contraste
- **WHEN** un token cambia de valor y un par declarado queda por debajo de su umbral
- **THEN** la verificación automática falla nombrando el par y el contraste obtenido

### Requirement: Foco visible del sistema

Todo elemento interactivo SHALL mostrar, al recibir foco por teclado, un contorno visible con el color de foco del sistema, separado del elemento y con contraste ≥ 3:1 respecto de los fondos negro y de panel. El color de foco SHALL ser distinto del color primario y SHALL alcanzar también ≥ 3:1 contra el relleno primario, para que no se funda con los controles y bordes violeta.

#### Scenario: Navegación con teclado
- **WHEN** el usuario recorre la home y `/configurador` con Tab
- **THEN** cada control enfocado muestra el contorno de foco del sistema

#### Scenario: Contraste del indicador
- **WHEN** se evalúa el color de foco contra los fondos negro y de panel
- **THEN** alcanza al menos 3:1 en ambos

#### Scenario: Foco junto a un control primario
- **WHEN** el usuario enfoca el botón principal del hero, que tiene relleno violeta
- **THEN** el contorno de foco se distingue del relleno con al menos 3:1 y no usa el color primario

## ADDED Requirements

### Requirement: Jerarquía de color por roles

El sistema SHALL asignar los acentos por rol: primario violeta (estructura, estado activo y acción principal), secundario naranja (sombras, hover y franjas de advertencia) y terciario verde agua (detalles de estado). Los componentes SHALL nombrar el rol, nunca el color, y en reposo SHALL haber más usos del primario que del secundario, y más del secundario que del terciario. Foco y colores de estado no cuentan en la jerarquía.

#### Scenario: Cambio de color de un rol
- **WHEN** se cambia el color asignado al rol primario en la definición de la paleta
- **THEN** todos los elementos primarios del sitio cambian de color sin tocar ningún componente

#### Scenario: Nombre de color en un componente
- **WHEN** un componente usa directamente un color de acento (por ejemplo el naranja) en lugar de su rol
- **THEN** la verificación automática falla nombrando el archivo y la clase

#### Scenario: Jerarquía invertida
- **WHEN** los usos en reposo del secundario igualan o superan a los del primario
- **THEN** la verificación automática falla informando el conteo de cada rol

#### Scenario: Hover y estados fuera del conteo
- **WHEN** un componente usa el naranja solo al pasar el puntero, o usa los colores de éxito o error del configurador
- **THEN** esos usos no se cuentan en la jerarquía

#### Scenario: Proporción visible en la home
- **WHEN** se captura la home y el configurador en escritorio y en móvil
- **THEN** el área pintada en violeta supera a la naranja y la naranja supera a la verde agua
