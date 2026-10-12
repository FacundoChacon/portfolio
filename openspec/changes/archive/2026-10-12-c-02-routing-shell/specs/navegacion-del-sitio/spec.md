# Spec Delta

## Purpose

Define el enrutado cliente del sitio: cómo el visitante llega al configurador desde el portfolio, cómo se cargan sus páginas sin recargar y cómo se resuelven las rutas desconocidas.

## ADDED Requirements

### Requirement: Ruta raíz del portfolio

El sistema SHALL renderizar las secciones del portfolio en la ruta raíz `/`.

#### Scenario: Home en la raíz
- **WHEN** el visitante abre `/`
- **THEN** el sistema muestra las secciones del portfolio (Hero, About, Projects, Stack, Contact)

#### Scenario: La home no carga el configurador
- **WHEN** el visitante abre `/`
- **THEN** el código de la página del configurador NO se incluye en el bundle inicial

### Requirement: Página propia del configurador

El sistema SHALL exponer `/configurador` como una página propia, cargada de forma diferida (lazy) y separada del resto del sitio.

#### Scenario: Acceso directo a /configurador
- **WHEN** el visitante abre la URL `/configurador`
- **THEN** el sistema muestra la página del configurador y no la home

#### Scenario: Carga diferida con fallback
- **WHEN** el visitante entra a `/configurador` y el chunk todavía se está descargando
- **THEN** el sistema muestra un estado de carga coherente con el tema antes de montar la página

### Requirement: Acceso al configurador desde el portfolio

El sistema SHALL ofrecer, en la navegación del portfolio, un llamado a la acción que accede a `/configurador` mediante navegación del lado del cliente, sin recargar la página.

#### Scenario: El CTA navega al configurador
- **WHEN** el visitante hace clic en el CTA "Armá tu web"
- **THEN** el sistema navega a `/configurador` sin una recarga completa del documento

#### Scenario: Las anclas de la home siguen funcionando
- **WHEN** el visitante está en `/` y usa los enlaces de sección del nav (Inicio, Quién soy, Proyectos, Stack, Contáctame)
- **THEN** el sistema sigue desplazándose a la sección correspondiente de la home

### Requirement: Redirección de rutas desconocidas

El sistema SHALL redirigir hacia la raíz `/` cualquier ruta que no reconozca.

#### Scenario: Ruta inexistente
- **WHEN** el visitante abre una ruta inexistente (por ejemplo `/foo`)
- **THEN** el sistema lo redirige a `/` y muestra el portfolio
