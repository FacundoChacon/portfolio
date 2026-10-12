# interfaz-del-configurador Specification

## Purpose

Define la presentación del wizard de presupuesto: el layout de la página del configurador, el indicador de progreso de los cuatro pasos, el resumen en vivo con su desglose y el total, y la navegación entre pasos.

## Requirements

### Requirement: Layout de dos columnas
La página del configurador SHALL mostrar el contenido del paso actual y un panel de resumen; en pantallas grandes SHALL disponerlos en dos columnas con el resumen fijo al costado, y en pantallas chicas SHALL apilar el resumen debajo del contenido.

#### Scenario: Dos columnas en pantallas grandes
- **WHEN** se abre `/configurador` en una pantalla grande
- **THEN** el contenido del paso y el resumen se muestran en columnas separadas

#### Scenario: Apilado en pantallas chicas
- **WHEN** se abre `/configurador` en una pantalla chica
- **THEN** el resumen se muestra debajo del contenido del paso

#### Scenario: Total siempre visible
- **WHEN** el visitante recorre los pasos
- **THEN** el total permanece visible en el panel de resumen

### Requirement: Indicador de progreso
El sistema SHALL mostrar los cuatro pasos con su estado (completado, actual o pendiente) y SHALL marcar el paso actual de forma accesible.

#### Scenario: Los cuatro pasos
- **WHEN** se muestra el indicador de progreso
- **THEN** se listan los cuatro pasos del wizard

#### Scenario: Paso actual marcado
- **WHEN** el wizard está en un paso determinado
- **THEN** ese paso se marca como actual y se expone con `aria-current`

#### Scenario: Pasos completados distinguibles
- **WHEN** el visitante avanza de paso
- **THEN** los pasos anteriores se distinguen de los pendientes

### Requirement: Resumen en vivo
El panel de resumen SHALL mostrar el desglose de la configuración —el servicio con su cantidad, los extras seleccionados y el importe mensual si hay extras recurrentes— y el total de pago único en ARS, y SHALL actualizarse cuando cambia la configuración.

#### Scenario: Servicio con su cantidad
- **WHEN** hay un servicio seleccionado
- **THEN** el resumen muestra su nombre, la cantidad y su importe

#### Scenario: Extras seleccionados
- **WHEN** hay extras seleccionados
- **THEN** el resumen lista cada extra con su importe

#### Scenario: Importe mensual separado
- **WHEN** hay extras de cobro mensual seleccionados
- **THEN** el resumen muestra su suma como importe mensual (`/mes`), además del total de pago único

#### Scenario: El total se actualiza al alternar un extra
- **WHEN** el visitante marca o desmarca un extra
- **THEN** el total del resumen cambia en consecuencia

#### Scenario: Sin extras
- **WHEN** no hay extras seleccionados
- **THEN** el resumen muestra el total del servicio y ningún extra

### Requirement: Aviso de ítem cotizable
Cuando la configuración incluye un ítem cotizable, el resumen SHALL mostrar un aviso de que ese ítem se cotiza aparte y NO SHALL sumarlo al total.

#### Scenario: Servicio "a cotizar"
- **WHEN** el servicio seleccionado es cotizable
- **THEN** el resumen muestra un aviso de que se cotiza aparte
- **AND** el total no incluye su importe

#### Scenario: Sin ítems cotizables
- **WHEN** ningún ítem es cotizable
- **THEN** el resumen no muestra el aviso de cotizable

### Requirement: Extras sin costo
El resumen SHALL mostrar un extra con precio 0 como "Sin costo".

#### Scenario: Hosting + Dominio
- **WHEN** el extra "Hosting + Dominio" (precio 0) está seleccionado
- **THEN** el resumen lo muestra como "Sin costo"

### Requirement: Navegación entre pasos
El sistema SHALL ofrecer un botón para avanzar y otro para retroceder, y NO SHALL mostrar el botón de retroceso en el primer paso.

#### Scenario: Retroceso oculto en el primer paso
- **WHEN** el wizard está en el primer paso
- **THEN** no se muestra el botón de retroceso

#### Scenario: Retroceso visible desde el segundo paso
- **WHEN** el wizard está en un paso posterior al primero
- **THEN** se muestra el botón de retroceso

#### Scenario: Avance sujeto a la validación
- **WHEN** el visitante intenta avanzar desde el paso de contacto con datos inválidos
- **THEN** no avanza y se muestran los errores
