# Visión y Objetivos

## Propósito del sistema

Portfolio profesional de **Facundo Chacón** (facucode.dev), Full Stack Developer Jr (Java / React), que muestra perfil, proyectos y stack, y que incorpora una nueva capacidad de negocio: un **Configurador de Presupuestos Web** ("tienda de páginas web").

Es una herramienta autoservicio donde un visitante arma su proyecto eligiendo el tipo de sitio y los extras, ve un **total estimado en vivo (ARS)** y solicita el presupuesto sin necesidad de un intercambio manual previo. El objetivo de negocio es convertir visitas en **leads calificados de freelance** con el menor roce posible.

## Objetivos por actor

| Actor | Objetivo principal | Objetivos secundarios |
|-------|--------------------|------------------------|
| Visitante anónimo (prospecto) | Armar y cotizar su proyecto solo, sin esperar respuesta humana | Entender qué incluye cada opción, ver el precio, ajustar el alcance |
| Facundo (freelance / dueño) | Recibir leads calificados con el alcance y estimación ya definidos | Reducir ida y vuelta, profesionalizar la propuesta, clasificar consultas |
| Sistema externo (n8n/Zapier/Make) | Enrutar el lead y disparar notificaciones | Persistir en Sheets/Notion y enviar auto-reply |

## Alcance v1.0

- Página nueva **`/configurador`** (ruta real, página aparte), con estética cyber/neón coherente con el portfolio.
- Flujo **wizard de 4 pasos**: (1) Tipo de sitio → (2) Extras y alcance → (3) Datos de contacto → (4) Resumen y envío.
- **Catálogo de 7 productos**: Landing Page, One Page, E-commerce, Web Corporativa, Blog, Portfolio, Sistema a medida (comodín, "a cotizar").
- **Extras seleccionables**: SEO inicial, Copywriting, CMS/Blog, Multi-idioma, Área de clientes (auth), Integración WhatsApp/CRM, Mantenimiento mensual, Hosting + Dominio (con disclaimer).
- **Resumen lateral en vivo** con desglose y total en ARS (estilo "carrito"/calculadora modular).
- **Envío** por webhook externo → email al dueño + auto-reply al prospecto + **PDF del presupuesto** adjunto.
- Selector de **cantidad** (para equipos/sucursales/líneas de negocio).
- Acceso al configurador desde el portfolio (proyectos / nav / CTA).

## Fuera de alcance (v1.0)

- Login, cuentas de usuario o panel de administración (los visitantes son anónimos).
- Pagos online / checkout real (no se cobra por la web).
- Backend propio, base de datos o API propia.
- Gestión monetaria de hosting/dominio (solo gestión técnica — ver RN-HD).
- Cotización automática de "Sistema a medida" (queda "a cotizar").
- Multi-idioma de la interfaz del propio portfolio.
- Seguimiento/CRM avanzado (se delega al servicio externo).

## Métricas de éxito

- Tasa de finalización del wizard (visitas a `/configurador` → solicitudes enviadas).
- Calidad del lead: % de solicitudes con alcance y rango de precio coherente.
- Reducción del ida y vuelta: primera respuesta con propuesta ya orientada.
- Tiempo medio de armado del presupuesto por el visitante (< 3 minutos objetivo).
