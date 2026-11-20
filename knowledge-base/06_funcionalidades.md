# Funcionalidades

Organizadas por **épica** y luego por **historia de usuario** (formato US-NNN).

## Épica 1: Acceso y navegación al configurador

### US-001 — Entrar al configurador desde el portfolio
**Como** visitante anónimo
**Quiero** acceder a la "tienda de páginas web" desde el portfolio
**Para** empezar a armar mi presupuesto sin buscar la URL

**Criterios de aceptación**:
- [ ] CA-1: existe un CTA visible ("Armá tu web" / "Presupuestá tu proyecto") en el portfolio que navega a `/configurador`.
- [ ] CA-2: la ruta `/configurador` carga como página propia con la estética del portfolio.
- [ ] CA-3: el nav mantiene coherencia (logo, botón volver al inicio).

**Reglas relacionadas**: RN-EX-02

### US-002 — Navegación entre pasos y retorno
**Como** visitante
**Quiero** poder volver al paso anterior sin perder lo cargado
**Para** corregir mi selección

**Criterios de aceptación**:
- [ ] CA-1: hay botón "Atrás" en pasos 2-4.
- [ ] CA-2: el estado (servicio, extras, cantidad, datos) persiste al retroceder.
- [ ] CA-3: el paso 1 no muestra "Atrás".

**Reglas relacionadas**: RN-EX-03

## Épica 2: Configuración del presupuesto (wizard)

### US-003 — Elegir el tipo de sitio
**Como** visitante
**Quiero** elegir entre los 7 tipos de sitio
**Para** partir de una base clara

**Criterios de aceptación**:
- [ ] CA-1: se listan Landing, One Page, E-commerce, Web Corporativa, Blog, Portfolio y Sistema a medida.
- [ ] CA-2: cada card muestra nombre y descripción (sin precio).
- [ ] CA-3: hay exactamente un servicio seleccionado; por defecto el primero.
- [ ] CA-4: la card seleccionada se distingue visualmente (borde/acento).

**Reglas relacionadas**: ninguna vigente (RN-PR-01 y RN-CO-01 derogadas)

### US-004 — Sumar extras y ver la selección en vivo
**Como** visitante
**Quiero** marcar extras y ver mi selección reflejada al instante
**Para** entender el alcance de mi pedido

**Criterios de aceptación**:
- [ ] CA-1: se pueden marcar/desmarcar los 8 extras (toggle).
- [ ] CA-2: el resumen lateral muestra la selección (tipo de sitio, cantidad y extras) en vivo, sin importes.
- [ ] CA-3: "Hosting + Dominio" muestra su disclaimer.

**Reglas relacionadas**: RN-HD-01, RN-HD-03 (RN-PR-03 a RN-PR-05 derogadas)

### US-005 — Ajustar la cantidad
**Como** visitante (empresa con varias sucursales)
**Quiero** indicar cuántas unidades necesito
**Para** presupuestar varios sitios o líneas de negocio

**Criterios de aceptación**:
- [ ] CA-1: control "+" / "−" con mínimo 1.
- [ ] CA-2: la cantidad solo multiplica el servicio principal.
- [ ] CA-3: el resumen refleja la cantidad del servicio.

**Reglas relacionadas**: RN-QT-01, RN-QT-02, RN-QT-03

### US-006 — Dejar mis datos de contacto
**Como** visitante
**Quiero** ingresar mis datos para recibir el presupuesto
**Para** que me contacten

**Criterios de aceptación**:
- [ ] CA-1: campos nombre (obligatorio), email (obligatorio, formato válido), teléfono (opcional), descripción (opcional).
- [ ] CA-2: no se avanza al resumen si faltan nombre/email.
- [ ] CA-3: los errores se muestran inline y accesibles.

**Reglas relacionadas**: RN-VL-01, RN-VL-02, RN-VL-04

## Épica 3: Revisión, envío y entrega

### US-007 — Revisar el resumen antes de enviar
**Como** visitante
**Quiero** ver un resumen completo de mi configuración
**Para** confirmar antes de enviar

**Criterios de aceptación**:
- [ ] CA-1: el paso 4 lista servicio, cantidad y extras (sin total).
- [ ] CA-2: hay "Editar" que retorna al paso correspondiente.
- [ ] CA-3: se aclara que es una estimación no vinculante.

**Reglas relacionadas**: ninguna vigente (RN-PR-07 y RN-CO-02 derogadas)

### US-008 — Enviar la solicitud y recibir confirmación
**Como** visitante
**Quiero** enviar mi solicitud y ver confirmación
**Para** saber que llegó

**Criterios de aceptación**:
- [ ] CA-1: el envío hace POST del `LeadPayload` al webhook.
- [ ] CA-2: el botón se deshabilita durante el envío.
- [ ] CA-3: en éxito, pantalla de confirmación con nombre del prospecto.
- [ ] CA-4: en error, mensaje + alternativa (mailto/WhatsApp).

**Reglas relacionadas**: RN-NT-03, RN-AB-02, RN-AB-04

### US-009 — Recibir el PDF del presupuesto (no integrado)

> Estado: el generador existe pero no está integrado al envío; los criterios aplican cuando se integre.
**Como** visitante
**Quiero** descargar/recibir un PDF de mi presupuesto
**Para** guardarlo o compartirlo

**Criterios de aceptación**:
- [ ] CA-1: el PDF se genera en el cliente a partir del payload.
- [ ] CA-2: incluye servicio, extras, disclaimer de hosting y nota "no vinculante".
- [ ] CA-3: si el PDF falla, el envío igual procede.

**Reglas relacionadas**: RN-PD-01, RN-PD-02, RN-PD-03

### US-010 — Notificación al dueño (externo)
**Como** Facundo
**Quiero** recibir el lead por email y en la hoja "Leads"
**Para** responder rápido

**Criterios de aceptación**:
- [ ] CA-1: email a Facundo con los datos del lead.
- [ ] CA-2: el lead queda registrado en la hoja "Leads".
- [ ] CA-3: la pantalla de éxito confirma la recepción al prospecto (sin auto-reply por correo).

**Reglas relacionadas**: RN-NT-01, RN-NT-02

## Épica 4: Calidad e infraestructura

### US-011 — CI verde con el configurador
**Como** Facundo
**Quiero** que el pipeline siga en verde
**Para** no romper el portfolio al agregar el configurador

**Criterios de aceptación**:
- [ ] CA-1: `npm run ci` (lint, verificaciones, tests y build) pasa en local y en CI.
- [ ] CA-2: el CI verifica que el build emita `dist/assets/Configurador-*.js` y que `dist/index.html` no lo referencie.
- [ ] CA-3: se mantiene la verificación de `og:image` y artefactos (incluye `sitemap.xml`).

**Reglas relacionadas**: —

### US-012 — Anti-abuso básico
**Como** Facundo
**Quiero** que el formulario tenga protecciones mínimas
**Para** evitar spam

**Criterios de aceptación**:
- [ ] CA-1: honeypot oculto presente.
- [ ] CA-2: doble submit bloqueado.
- [ ] CA-3: rate limiting delegado al webhook.

**Reglas relacionadas**: RN-AB-01, RN-AB-02, RN-AB-03
