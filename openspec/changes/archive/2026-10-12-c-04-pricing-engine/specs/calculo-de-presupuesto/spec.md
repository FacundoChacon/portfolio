# calculo-de-presupuesto Specification

## Purpose

Define la aritmética del presupuesto del configurador: cómo se combina el servicio principal (con su cantidad) y los extras en un total de pago único, cómo se separa la recurrencia mensual, cómo se marca un ítem cotizable y cómo se formatean los importes en ARS.

## ADDED Requirements

### Requirement: Cálculo del total de pago único
El sistema SHALL calcular el total de pago único como el precio del servicio multiplicado por la cantidad, más la suma de los precios de los extras seleccionados.

#### Scenario: Servicio con cantidad sin extras
- **WHEN** se calcula el total de un servicio de 100.000 con cantidad 3 y sin extras
- **THEN** el total es 300.000

#### Scenario: Servicio con extras
- **WHEN** se calcula el total de un servicio de 600.000 con cantidad 1 y un extra de 120.000
- **THEN** el total es 720.000

#### Scenario: Sin servicio seleccionado
- **WHEN** se calcula el total sin servicio y con extras
- **THEN** el total es la suma de los precios de los extras

### Requirement: Cantidad aplicada solo al servicio
El sistema SHALL multiplicar por la cantidad únicamente el precio del servicio principal, nunca los extras.

#### Scenario: La cantidad no multiplica los extras
- **WHEN** se calcula el total de un servicio de 100.000 con cantidad 3 y un extra de 50.000
- **THEN** el total es 350.000

#### Scenario: Cantidad ausente o inválida
- **WHEN** la cantidad no es un número finito o es menor que 1
- **THEN** el sistema la trata como 1

### Requirement: Servicio cotizable sin precio
El sistema SHALL tratar un servicio con `priceARS: null` como cotizable: no sumar su precio al total de pago único.

#### Scenario: El servicio cotizable no suma
- **WHEN** se calcula el total de "Sistema a medida" (`priceARS: null`) con cantidad 1
- **THEN** el aporte del servicio al total es 0

#### Scenario: Cotizable con extras
- **WHEN** se calcula el total de un servicio cotizable junto con un extra de 120.000
- **THEN** el total es 120.000

### Requirement: Marca de cotizable
El sistema SHALL exponer si el presupuesto incluye algún ítem cotizable.

#### Scenario: Presupuesto cotizable
- **WHEN** el servicio principal es cotizable
- **THEN** el presupuesto se marca como cotizable (`hasQuotable: true`)

#### Scenario: Presupuesto no cotizable
- **WHEN** el servicio principal no es cotizable y ningún extra lo es
- **THEN** el presupuesto no se marca como cotizable (`hasQuotable: false`)

### Requirement: Extra sin costo
El sistema SHALL tratar un extra con `priceARS: 0` como sin costo: su inclusión no altera el total de pago único.

#### Scenario: Extra sin costo no altera el total
- **WHEN** se calcula el total de un servicio de 250.000 y se incluye un extra de 0
- **THEN** el total sigue siendo 250.000

### Requirement: Separación de extras recurrentes
El sistema SHALL separar los extras de pago único de los de cobro mensual (`recurring: true`) y exponer el importe mensual por separado, sin sumarlo al total de pago único.

#### Scenario: Separación por recurrencia
- **WHEN** se separan un extra de pago único y uno recurrente
- **THEN** cada uno aparece en su grupo (pago único y mensual)

#### Scenario: Importe mensual separado
- **WHEN** hay extras recurrentes seleccionados
- **THEN** el sistema expone su suma como importe mensual ("/mes")

#### Scenario: La recurrencia no infla el total de pago único
- **WHEN** se calcula el total de un servicio de 300.000 con un extra recurrente de 60.000
- **THEN** el total de pago único es 300.000

### Requirement: Formateo de importes en ARS
El sistema SHALL formatear los importes con el locale `es-AR` y la moneda `ARS`.

#### Scenario: Formato de miles
- **WHEN** se formatea el importe 720000
- **THEN** el resultado es "$ 720.000,00"

#### Scenario: Formato de cero
- **WHEN** se formatea el importe 0
- **THEN** el resultado es "$ 0,00"

#### Scenario: Valor no numérico
- **WHEN** se intenta formatear un valor que no es un número finito (por ejemplo `null`)
- **THEN** el sistema devuelve una cadena vacía y no interrumpe la ejecución
