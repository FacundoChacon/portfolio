# estado-del-configurador Specification

## Purpose

Define el estado del wizard de presupuesto del configurador: cómo se inicializa, cómo cambia la selección de servicio, extras y cantidad, cómo se cargan y validan los datos de contacto, cómo se navega entre los cuatro pasos y cómo se inicia el envío.

## ADDED Requirements

### Requirement: Estado inicial del configurador
El sistema SHALL inicializar el wizard con el primer tipo de sitio seleccionado, los extras marcados como `recommended`, cantidad 1, en el primer paso, con el formulario vacío y estado `idle`.

#### Scenario: Servicio por defecto
- **WHEN** se inicializa el wizard con el catálogo
- **THEN** el tipo de sitio seleccionado es el primero del catálogo
- **AND** hay exactamente un servicio seleccionado

#### Scenario: Extras recomendados preseleccionados
- **WHEN** se inicializa el wizard
- **THEN** los extras marcados como `recommended` en el catálogo quedan seleccionados

#### Scenario: Estado de arranque
- **WHEN** se inicializa el wizard
- **THEN** la cantidad es 1, el paso actual es el primero, el formulario está vacío y el estado es `idle`

### Requirement: Selección del tipo de sitio
El sistema SHALL mantener exactamente un tipo de sitio seleccionado y cambiar de servicio NO SHALL alterar los extras ya seleccionados.

#### Scenario: Cambiar el servicio seleccionado
- **WHEN** se selecciona otro tipo de sitio
- **THEN** pasa a ser el único servicio seleccionado

#### Scenario: Cambiar de servicio conserva los extras
- **WHEN** hay extras seleccionados y se cambia el tipo de sitio
- **THEN** los extras seleccionados se mantienen

### Requirement: Alternar extras
El sistema SHALL permitir seleccionar y quitar extras por alternancia, sin admitir duplicados.

#### Scenario: Marcar un extra
- **WHEN** se alterna un extra que no estaba seleccionado
- **THEN** el extra queda seleccionado

#### Scenario: Desmarcar un extra
- **WHEN** se alterna un extra ya seleccionado
- **THEN** el extra deja de estar seleccionado

#### Scenario: Sin duplicados
- **WHEN** se alterna dos veces el mismo extra
- **THEN** el extra aparece una sola vez y vuelve a su estado inicial

### Requirement: Cantidad mínima y entera
El sistema SHALL mantener la cantidad como un número entero mayor o igual a 1.

#### Scenario: Cantidad por debajo del mínimo
- **WHEN** se intenta fijar la cantidad en 0 o un valor negativo
- **THEN** la cantidad queda en 1

#### Scenario: Cantidad no numérica
- **WHEN** se intenta fijar la cantidad con un valor no numérico
- **THEN** la cantidad queda en 1

#### Scenario: Cantidad con decimales
- **WHEN** se fija la cantidad en un valor decimal
- **THEN** la cantidad queda como el entero correspondiente

### Requirement: Datos de contacto
El sistema SHALL registrar nombre, email, teléfono y descripción del proyecto, donde nombre y email son obligatorios y teléfono y descripción son opcionales.

#### Scenario: Actualización parcial de los datos
- **WHEN** se actualiza un campo del formulario
- **THEN** el resto de los campos se conserva

#### Scenario: Campos opcionales vacíos
- **WHEN** se dejan el teléfono y la descripción sin completar
- **THEN** el sistema los considera válidos

### Requirement: Validación para avanzar al resumen
El sistema SHALL impedir avanzar del paso de datos al resumen si el nombre está vacío o el email no tiene un formato válido, y SHALL exponer los errores correspondientes.

#### Scenario: Nombre vacío
- **WHEN** se intenta avanzar del paso de datos con el nombre vacío
- **THEN** el sistema no avanza al resumen y expone un error de nombre

#### Scenario: Email con formato inválido
- **WHEN** se intenta avanzar del paso de datos con un email sin formato válido
- **THEN** el sistema no avanza al resumen y expone un error de email

#### Scenario: Datos válidos
- **WHEN** se intenta avanzar del paso de datos con nombre y email válidos
- **THEN** el sistema avanza al resumen y limpia los errores previos

### Requirement: Navegación entre pasos
El sistema SHALL permitir avanzar y retroceder entre los cuatro pasos sin perder el estado cargado y sin retroceder por debajo del primer paso.

#### Scenario: Retroceder un paso
- **WHEN** se retrocede desde un paso posterior al primero
- **THEN** el paso actual disminuye en uno

#### Scenario: Retroceder en el primer paso
- **WHEN** se retrocede estando en el primer paso
- **THEN** el paso actual se mantiene en el primero

#### Scenario: El estado persiste al retroceder
- **WHEN** se retrocede de paso
- **THEN** el servicio, los extras, la cantidad y los datos de contacto se conservan

#### Scenario: Avanzar en pasos sin validación
- **WHEN** se avanza desde el paso de servicio o el de extras
- **THEN** el paso actual aumenta en uno sin exigir validación

### Requirement: Inicio del envío
El sistema SHALL iniciar el envío solo con datos válidos: marcar el presupuesto como enviado y pasar el estado a `submitting`; con datos inválidos NO SHALL enviarlo y SHALL exponer los errores.

#### Scenario: Envío con datos válidos
- **WHEN** se inicia el envío con nombre y email válidos
- **THEN** el presupuesto queda marcado como enviado y el estado pasa a `submitting`

#### Scenario: Envío con datos inválidos
- **WHEN** se inicia el envío con datos inválidos
- **THEN** el sistema no lo marca como enviado y expone los errores

#### Scenario: Resolución del envío
- **WHEN** la capa de transporte informa el resultado del envío
- **THEN** el estado pasa a `success` o a `error` según corresponda
