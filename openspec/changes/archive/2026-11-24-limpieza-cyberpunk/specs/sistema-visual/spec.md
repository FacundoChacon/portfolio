# Spec Delta

## MODIFIED Requirements

### Requirement: Tipografías servidas desde el propio origen

El sitio SHALL servir todas sus tipografías desde su propio origen, sin pedir hojas de estilo ni archivos de fuente a terceros. El sistema SHALL ofrecer una serif de títulos con licencia libre, que pueda mostrarse condensada y pesada, y una monoespaciada para etiquetas y códigos. El texto de cuerpo SHALL usar la sans-serif del sistema operativo y no descargar archivos de fuente. Solo se SHALL servir el subset latino de las familias en uso.

#### Scenario: Sin pedidos a terceros
- **WHEN** un navegador carga la home o `/configurador`
- **THEN** ninguna petición de red va a `fonts.googleapis.com`, `fonts.gstatic.com` ni a otro origen externo de fuentes

#### Scenario: Familias actuales conservadas
- **WHEN** se carga cualquier sección de la home o `/configurador` (todas ya migraron al sistema visual)
- **THEN** los títulos se renderizan con la serif del sistema y las etiquetas con la monoespaciada, cada una con sus pesos actuales, sin fuentes de la estética anterior

#### Scenario: Título condensado disponible
- **WHEN** un elemento usa la familia de títulos con un ancho condensado y peso alto
- **THEN** se renderiza con la serif de títulos estrechada, sin síntesis de negrita ni fuente de respaldo

#### Scenario: Cuerpo con la fuente del sistema
- **WHEN** se renderiza un párrafo que no pide una familia específica (biografía, testimonios, descripciones del configurador)
- **THEN** usa la sans-serif del sistema operativo y no se descarga ningún archivo de fuente para él

#### Scenario: Familias retiradas fuera del build
- **WHEN** se compila el sitio y se carga cualquier página pública
- **THEN** no se declara ni se empaqueta ninguna fuente de la estética anterior y no se pide ningún archivo de esas familias

## ADDED Requirements

### Requirement: Sin restos de la estética anterior

El código fuente del sitio y su HTML de entrada SHALL estar libres de la estética anterior: sin tokens de color de la paleta vieja, sin brillos, sin animaciones de glitch, escaneo o parpadeo, sin las familias tipográficas retiradas y sin las clases heredadas. La única excepción permitida es el color de acento del PDF del presupuesto, y debe estar declarada. La verificación automática SHALL fallar nombrando el archivo y el token encontrado.

#### Scenario: Token viejo reintroducido
- **WHEN** un componente vuelve a usar una clase de la paleta anterior o un brillo
- **THEN** la verificación automática falla nombrando el archivo y la clase

#### Scenario: Familia retirada reintroducida
- **WHEN** una hoja de estilos o el HTML de entrada vuelve a nombrar una de las familias tipográficas retiradas
- **THEN** la verificación automática falla nombrando el archivo y la familia

#### Scenario: Excepción declarada del PDF
- **WHEN** se verifica el código fuente y el único color de la paleta anterior está en el documento PDF del presupuesto
- **THEN** la verificación pasa, y esa excepción figura con nombre en la lista de permitidos

#### Scenario: Configuración de estilos sin tokens viejos
- **WHEN** se inspecciona la configuración de estilos
- **THEN** solo expone la paleta del sistema visual y las familias de títulos, etiquetas y cuerpo, sin tokens ni familias de la estética anterior

### Requirement: Base del documento en la paleta del sistema

El fondo y el color de texto del documento, la barra de desplazamiento, el resaltado de selección, el indicador de carga de las páginas diferidas y el color de tema del navegador SHALL usar la paleta del sistema visual. El texto seleccionado y el indicador de carga SHALL mantener contraste ≥ 3:1 contra sus fondos.

#### Scenario: Fondo de página antes de montar la aplicación
- **WHEN** el navegador pinta el HTML de una página pública antes de que cargue el JavaScript
- **THEN** el fondo es el negro del sistema visual y el color de tema declarado coincide con él

#### Scenario: Selección de texto
- **WHEN** el visitante selecciona texto en cualquier sección
- **THEN** el resaltado usa un color de la paleta del sistema visual y el texto seleccionado se lee con contraste ≥ 3:1

#### Scenario: Carga de una página diferida
- **WHEN** se navega a una ruta que se carga de forma diferida y aparece el indicador de carga
- **THEN** el indicador usa colores de la paleta del sistema visual

## REMOVED Requirements

### Requirement: Coexistencia con la paleta anterior
**Reason**: Todas las secciones de la home y el configurador migraron a la paleta del sistema visual. Mantener los tokens anteriores solo sumaba CSS muerto y dejaba abierta la puerta a que la estética vieja volviera.
**Migration**: Usar los tokens de la paleta del sistema visual (negro, panel, línea, papel, grises, naranja, rojo, violeta, verde). El requisito "Sin restos de la estética anterior" toma el lugar de la verificación que protegía los tokens viejos y ahora prohíbe usarlos.
