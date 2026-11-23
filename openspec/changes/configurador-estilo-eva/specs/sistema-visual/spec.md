# Spec Delta

## MODIFIED Requirements

### Requirement: Coexistencia con la paleta anterior

Mientras las secciones migran, los tokens de color existentes (`accent-*`, `neon-*`, `dark-*`, `muted-*`) SHALL seguir disponibles con sus valores actuales, de modo que las partes del sitio que aún los usan se vean igual que antes. El configurador ya no forma parte de esas partes: usa solo la paleta del sistema visual.

#### Scenario: Parte del sitio aún no migrada sin cambios visuales
- **WHEN** se abre una sección que todavía usa la paleta anterior después de incorporar la nueva paleta
- **THEN** sus colores, bordes y estados se ven igual que antes del cambio

#### Scenario: Configurador migrado
- **WHEN** se abre `/configurador`
- **THEN** su cuerpo no usa ningún token de la paleta anterior y la verificación automática lo controla

#### Scenario: Token anterior eliminado por error
- **WHEN** la configuración de estilos pierde un token `accent-*` o `neon-*`
- **THEN** la verificación automática falla nombrando el token faltante
