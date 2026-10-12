# Actores y Roles

## Actores del sistema

| Actor | Descripción | Cómo interactúa |
|-------|-------------|-----------------|
| **Visitante anónimo** | Prospecto (pyme, profesional, emprendedor) que necesita una web | Navega el portfolio, entra a `/configurador`, arma el presupuesto y envía la solicitud. Sin registro. |
| **Facundo (freelance / dueño)** | Desarrollador que ofrece los servicios | No usa la UI como usuario logueado; **recibe** los leads por email/notificación y responde. Es el dueño del catálogo y precios. |
| **Sistema externo (webhook)** | Automatización (n8n/Zapier/Make) | Recibe el POST, persiste el lead, envía emails y notificaciones. No es una persona; es integración. |

> **No hay autenticación ni RBAC en v1.0.** Todos los actores humanos son anónimos del lado del sistema. La única "autoridad" es sobre el contenido del catálogo, que se edita en código (`data/configurador.js`).

## RBAC — Matriz de permisos

| Rol | Recurso | Permisos | Notas |
|-----|---------|----------|-------|
| Visitante anónimo | Catálogo (productos/extras) | R (leer) | Read-only desde el bundle público |
| Visitante anónimo | Configuración de presupuesto | C (crear, en memoria) | Estado efímero en el navegador; no se persiste localmente |
| Visitante anónimo | Solicitud de presupuesto | C (crear → enviar vía webhook) | Efecto secundario externo |
| Facundo | Catálogo (productos/precios) | CRUD | Vía edición de código + deploy |
| Sistema externo | Lead recibido | R (leer payload) | Recibe el POST del front |

## Rutas públicas

Todas las rutas son públicas (no hay login):

| Ruta | Descripción | Requiere JS |
|------|-------------|-------------|
| `/` | Portfolio actual (Hero, About, Projects, Stack, Contact) | Sí |
| `/configurador` | Configurador de presupuestos web (NUEVO) | Sí |
| `/configurador?step=N` | (Opcional) deep-link a un paso del wizard | Sí |
| `*` | Fallback → redirige a `/` (404 amistoso) | Sí |

## Restricciones de acceso

- **RN-AC-01**: no existe panel de administración; el catálogo es código versionado en Git.
- **RN-AC-02**: el visitante nunca ve datos de otros leads (no hay listado ni backend propio).
- **RN-AC-03**: el envío no requiere cuenta; se protege con medidas anti-abuso (ver `05_reglas_de_negocio.md` §Anti-abuso).
