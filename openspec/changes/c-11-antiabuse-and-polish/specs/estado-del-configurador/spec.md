# Spec Delta

## MODIFIED Requirements

### Requirement: Inicio del envío
El sistema SHALL iniciar el envío solo con datos válidos: pasar el estado a `submitting` sin marcar todavía el presupuesto como enviado; con datos inválidos NO SHALL enviarlo y SHALL exponer los errores. Si ya hay un envío en curso o el presupuesto ya fue enviado con éxito, iniciar el envío NO SHALL tener efecto (RN-AB-02). Si el campo trampa (honeypot) tiene contenido, el sistema SHALL descartar el envío en silencio: NO SHALL quedar un envío en curso y el estado SHALL pasar directamente a `success`, igual que un envío exitoso (RN-AB-01).

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

#### Scenario: Campo trampa completo
- **WHEN** se inicia el envío y el campo trampa tiene texto (aunque el resto de los datos sea válido o inválido)
- **THEN** el estado pasa a `success` y el presupuesto queda marcado como enviado sin que quede un envío en curso
- **AND** no se exponen errores de validación

#### Scenario: Campo trampa vacío o solo con espacios
- **WHEN** se inicia el envío y el campo trampa está ausente, vacío o contiene solo espacios
- **THEN** el envío sigue el flujo normal de validación y `submitting`

#### Scenario: Campo trampa completo con envío en curso o ya exitoso
- **WHEN** el campo trampa tiene texto pero ya hay un envío en curso o el presupuesto ya fue enviado con éxito
- **THEN** el estado no cambia
