# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
