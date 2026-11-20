# estado-del-configurador Specification

## Purpose

Define el estado del wizard de presupuesto del configurador: cómo se inicializa, cómo cambia la selección de servicio, extras y cantidad, cómo se cargan y validan los datos de contacto, cómo se navega entre los cuatro pasos y cómo se inicia el envío.

## Requirements

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
El sistema SHALL iniciar el envío solo con datos válidos: pasar el estado a `submitting` sin marcar todavía el presupuesto como enviado; con datos inválidos NO SHALL enviarlo y SHALL exponer los errores. Si ya hay un envío en curso o el presupuesto ya fue enviado con éxito, iniciar el envío NO SHALL tener efecto (RN-AB-02).

#### Scenario: Envío con datos válidos
- **WHEN** se inicia el envío con nombre y email válidos
- **THEN** el estado pasa a `submitting`, queda un envío en curso y los errores se limpian
- **AND** el presupuesto todavía no queda marcado como enviado

#### Scenario: Envío con datos inválidos
- **WHEN** se inicia el envío con datos inválidos
- **THEN** el sistema no lo marca como enviado, no deja un envío en curso y expone los errores

#### Scenario: Resolución del envío
- **WHEN** la capa de transporte informa el resultado del envío
- **THEN** el estado pasa a `success` o a `error` según corresponda, como define el requisito "Resolución del envío"

#### Scenario: Envío ya en curso
- **WHEN** se inicia el envío mientras otro envío está en curso
- **THEN** el estado no cambia

#### Scenario: Envío ya exitoso
- **WHEN** se inicia el envío de un presupuesto que ya fue enviado con éxito
- **THEN** el estado no cambia

### Requirement: Resolución del envío
El sistema SHALL cerrar el envío en curso según el resultado que informe la capa de transporte: con éxito SHALL marcar el presupuesto como enviado; con error SHALL liberar el envío dejándolo reintentable, sin marcarlo como enviado y conservando los datos cargados. Un resultado desconocido NO SHALL alterar el estado.

#### Scenario: Envío exitoso
- **WHEN** la capa de transporte informa éxito para el envío en curso
- **THEN** el estado pasa a `success`, el presupuesto queda marcado como enviado y no queda un envío en curso

#### Scenario: Envío fallido
- **WHEN** la capa de transporte informa error para el envío en curso
- **THEN** el estado pasa a `error`, no queda un envío en curso y el presupuesto no queda marcado como enviado
- **AND** el servicio, los extras, la cantidad y los datos de contacto se conservan

#### Scenario: Reintento tras un error
- **WHEN** el envío falló y se vuelve a iniciar el envío con datos válidos
- **THEN** el estado pasa nuevamente a `submitting` con un envío en curso

#### Scenario: Resultado desconocido
- **WHEN** la capa de transporte informa un resultado que no es éxito ni error
- **THEN** el estado no cambia

### Requirement: Volver a revisar tras un error
El sistema SHALL permitir, desde el estado `error`, volver al estado `idle` en el paso de revisión conservando todos los datos cargados, para que el visitante pueda revisar o editar antes de reenviar. Fuera del estado `error` esta acción NO SHALL tener efecto.

#### Scenario: Volver a revisar desde el error
- **WHEN** el envío falló y el visitante elige volver a revisar sus datos
- **THEN** el estado pasa a `idle`, el paso actual es el de revisión y los datos cargados se conservan
- **AND** el presupuesto no queda marcado como enviado

#### Scenario: Sin efecto fuera del error
- **WHEN** se elige volver a revisar estando en `idle`, `submitting` o `success`
- **THEN** el estado no cambia

### Requirement: Navegación y edición bloqueadas durante el envío
Mientras hay un envío en curso (`submitting`), el sistema SHALL ignorar toda navegación y edición del presupuesto —avanzar, retroceder, saltar de paso, editar los datos de contacto, cambiar el tipo de sitio, marcar o desmarcar extras y cambiar la cantidad— de modo que el visitante no quede en otro paso ni con datos distintos a los enviados. Al resolverse el envío (éxito o error) la navegación y la edición SHALL volver a estar disponibles.

#### Scenario: Navegación ignorada durante el envío
- **WHEN** hay un envío en curso y se intenta avanzar, retroceder o saltar a otro paso
- **THEN** el estado no cambia

#### Scenario: Edición ignorada durante el envío
- **WHEN** hay un envío en curso y se intenta editar los datos de contacto, cambiar el tipo de sitio, alternar un extra o cambiar la cantidad
- **THEN** el estado no cambia

#### Scenario: Navegación y edición disponibles tras resolverse el envío
- **WHEN** el envío en curso se resolvió con error y se intenta navegar o editar
- **THEN** la acción se aplica con normalidad
