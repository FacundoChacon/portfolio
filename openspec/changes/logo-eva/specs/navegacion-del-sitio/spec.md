## ADDED Requirements

### Requirement: Glifo en la marca de la barra
La marca de la barra, compartida por la home y por `/configurador`, SHALL mostrar la variante simple del glifo a la izquierda del texto "FC" y de su código de sistema, que se conservan. El enlace SHALL seguir llevando a `/` con navegación del lado del cliente y su nombre accesible NO SHALL cambiar. El glifo SHALL caber en la altura de la barra sin alterarla.

#### Scenario: Marca en la home
- **WHEN** el visitante abre `/`
- **THEN** la barra muestra el glifo simple seguido de "FC" y `//00`, y la altura de la barra no cambia

#### Scenario: Marca en el configurador
- **WHEN** el visitante abre `/configurador`
- **THEN** la cabecera muestra el mismo glifo y el mismo texto que la barra de la home

#### Scenario: Nombre accesible intacto
- **WHEN** un lector de pantalla llega al enlace de la marca
- **THEN** anuncia el mismo nombre que antes del cambio, sin texto adicional por el glifo

#### Scenario: Volver al inicio desde la marca
- **WHEN** el visitante activa la marca desde `/configurador`
- **THEN** el sistema navega a `/` sin una recarga completa del documento
