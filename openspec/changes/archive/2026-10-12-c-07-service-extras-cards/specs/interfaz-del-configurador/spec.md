# interfaz-del-configurador Specification

## ADDED Requirements

### Requirement: Selección del tipo de sitio
El sistema SHALL mostrar los siete tipos de sitio como tarjetas seleccionables, cada una con su nombre, descripción, icono y precio, y SHALL mantener exactamente una tarjeta seleccionada y distinguible del resto.

#### Scenario: Las siete opciones
- **WHEN** el visitante llega al paso de tipo de sitio
- **THEN** se muestran las siete opciones del catálogo

#### Scenario: Contenido de cada tarjeta
- **WHEN** se muestra una tarjeta de tipo de sitio
- **THEN** muestra su nombre, su descripción, su icono y su precio en ARS

#### Scenario: Sistema a medida sin precio
- **WHEN** se muestra la tarjeta de "Sistema a medida"
- **THEN** su precio se muestra como "A cotizar" y nunca como un número

#### Scenario: Una sola tarjeta seleccionada
- **WHEN** el visitante elige una tarjeta
- **THEN** esa pasa a ser la única seleccionada y la anterior deja de estarlo

#### Scenario: La selección se distingue
- **WHEN** una tarjeta está seleccionada
- **THEN** se distingue visualmente de las demás

### Requirement: Selección de extras
El sistema SHALL mostrar los ocho extras como opciones activables y SHALL permitir marcarlos y desmarcarlos de forma independiente.

#### Scenario: Las ocho opciones
- **WHEN** el visitante llega al paso de extras
- **THEN** se muestran los ocho extras del catálogo

#### Scenario: Marcar y desmarcar
- **WHEN** el visitante activa una opción de extra
- **THEN** el extra queda seleccionado, y al volver a activarla queda desmarcado

#### Scenario: Estado visual del extra
- **WHEN** un extra está seleccionado
- **THEN** su tarjeta se distingue visualmente de las no seleccionadas

### Requirement: Disclaimer de hosting visible
El sistema SHALL mostrar el disclaimer de "Hosting + Dominio" de forma visible dentro de su tarjeta, sin requerir interacción.

#### Scenario: Disclaimer siempre visible
- **WHEN** se muestra la tarjeta de "Hosting + Dominio"
- **THEN** su disclaimer se lee directamente en la tarjeta, sin tooltip ni interacción

### Requirement: Sufijo mensual en extras recurrentes
El sistema SHALL mostrar los extras de cobro mensual con el sufijo `/mes`.

#### Scenario: Mantenimiento mensual
- **WHEN** se muestra el extra "Mantenimiento mensual"
- **THEN** su precio se muestra con el sufijo `/mes`

### Requirement: Control de cantidad
El sistema SHALL ofrecer un control para sumar y restar unidades del servicio principal, con un mínimo de 1.

#### Scenario: Sumar una unidad
- **WHEN** el visitante activa el control de suma
- **THEN** la cantidad aumenta en uno

#### Scenario: Restar una unidad
- **WHEN** el visitante activa el control de resta con cantidad mayor que 1
- **THEN** la cantidad disminuye en uno

#### Scenario: La cantidad no baja de 1
- **WHEN** la cantidad es 1
- **THEN** no se puede restar por debajo de 1

### Requirement: Robustez de los iconos del catálogo
El sistema SHALL resolver el icono de cada tipo de sitio desde el catálogo y NO SHALL romper cuando el nombre de icono es desconocido.

#### Scenario: Todos los iconos del catálogo resuelven
- **WHEN** se resuelve el icono de cada tipo de sitio del catálogo
- **THEN** todos resuelven a un icono válido

#### Scenario: Nombre de icono desconocido
- **WHEN** se resuelve un nombre de icono que no existe
- **THEN** el sistema devuelve un icono de reemplazo y no falla

### Requirement: Operación por teclado y accesibilidad
El sistema SHALL permitir operar las tarjetas de servicio, las de extras y el control de cantidad con el teclado, y SHALL exponer su estado a las tecnologías de asistencia.

#### Scenario: Selección con el teclado
- **WHEN** el visitante enfoca una tarjeta y la activa con Enter o Espacio
- **THEN** la tarjeta se selecciona o se alterna según corresponda

#### Scenario: Estado expuesto
- **WHEN** una tarjeta de servicio o un extra está seleccionado
- **THEN** su estado se expone con `aria-pressed` y el foco visible en la tarjeta activa

#### Scenario: Foco visible
- **WHEN** el visitante navega con el teclado
- **THEN** el elemento enfocado se distingue visualmente
