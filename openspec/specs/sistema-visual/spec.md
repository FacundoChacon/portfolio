# sistema-visual Specification

## Purpose
Define la base visual compartida por todas las secciones del sitio: paleta con contraste verificado, tipografías servidas desde el propio origen, texturas y paneles reutilizables, foco visible y respeto por la preferencia de movimiento reducido.

## Requirements

### Requirement: Paleta con contraste verificado

El sitio SHALL disponer de una paleta de tokens de color propia del sistema visual: negro, panel, línea, papel, grises, violeta, violeta claro, naranja, verde agua, y los colores de estado celeste y rojo claro. Cada combinación texto/fondo que el sistema declare apta para texto normal SHALL alcanzar contraste WCAG ≥ 4.5:1; las declaradas solo para texto grande o componentes de interfaz SHALL alcanzar ≥ 3:1. El violeta sólido SHALL usarse como relleno, borde o texto grande, y el texto de acento violeta SHALL usar el violeta claro.

#### Scenario: Par de texto normal conforme
- **WHEN** se evalúa el contraste del texto papel, gris, violeta claro, naranja, verde agua, celeste o rojo claro sobre el fondo negro, de panel o de línea
- **THEN** cada par alcanza al menos 4.5:1

#### Scenario: Texto sobre el relleno violeta
- **WHEN** un control usa el violeta sólido como relleno con texto encima
- **THEN** el texto es negro y alcanza al menos 4.5:1

#### Scenario: Rojo y violeta restringidos
- **WHEN** se evalúa el violeta sólido sobre el fondo de línea, o se busca un rojo sólido en la paleta
- **THEN** el par violeta queda declarado solo para texto grande o componentes de interfaz y alcanza al menos 3:1, y la paleta ya no incluye un rojo sólido: el rojo claro es solo color de estado y cumple 4.5:1 como texto

#### Scenario: Regresión de contraste
- **WHEN** un token cambia de valor y un par declarado queda por debajo de su umbral
- **THEN** la verificación automática falla nombrando el par y el contraste obtenido

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

### Requirement: Precarga de la fuente principal

El HTML de cada página pública SHALL precargar el archivo de la fuente principal del primer render como fuente `woff2` del propio origen, con ruta absoluta y modo CORS anónimo, sin manejadores de eventos inline.

#### Scenario: Precarga presente en cada página
- **WHEN** se inspecciona el HTML servido de `/` y de `/configurador`
- **THEN** cada uno contiene una precarga `as="font"` `type="font/woff2"` con `crossorigin` cuyo `href` es una ruta absoluta a un archivo existente del propio origen

#### Scenario: Sin advertencia de precarga ociosa
- **WHEN** la home termina de cargar en un navegador real
- **THEN** la consola no advierte que la fuente precargada no se usó

### Requirement: Texturas y paneles reutilizables

El sistema SHALL ofrecer utilidades reutilizables para grilla hexagonal, franjas de advertencia, paneles de sistema con etiqueta y código, y etiquetas. Las texturas SHALL ser decorativas: no se anuncian a tecnologías asistivas, no capturan eventos de puntero y no reducen el contraste del contenido por debajo de los umbrales de la paleta.

#### Scenario: Grilla hexagonal decorativa
- **WHEN** un contenedor aplica la utilidad de grilla hexagonal y contiene texto
- **THEN** la grilla se dibuja detrás del texto, no intercepta clics y el texto mantiene el contraste de su par declarado

#### Scenario: Panel con etiqueta y código
- **WHEN** un contenedor aplica la utilidad de panel con su etiqueta y su código
- **THEN** la etiqueta y el código se muestran en tipografía monoespaciada sobre el borde del panel sin tapar el contenido

#### Scenario: Textura sin peticiones externas
- **WHEN** se usa cualquier textura del sistema
- **THEN** no genera peticiones a otros orígenes ni viola la CSP

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

### Requirement: Movimiento reducido

Con `prefers-reduced-motion: reduce`, el sitio SHALL desplazarse sin animación al seguir anclas y SHALL mostrar de inmediato, sin transición, el contenido de las utilidades de revelado. Sin esa preferencia, el desplazamiento por anclas SHALL ser suave y el revelado SHALL animarse al entrar en el viewport.

#### Scenario: Ancla con movimiento reducido
- **WHEN** el sistema operativo pide movimiento reducido y el usuario sigue un enlace a una sección
- **THEN** la página salta a la sección sin desplazamiento animado

#### Scenario: Revelado con movimiento reducido
- **WHEN** el sistema operativo pide movimiento reducido y un elemento con utilidad de revelado está en la página
- **THEN** el elemento se muestra visible desde el primer render, sin transición

#### Scenario: Revelado sin preferencia
- **WHEN** no hay preferencia de movimiento reducido y el elemento entra en el viewport
- **THEN** el elemento pasa de oculto a visible con su animación

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
