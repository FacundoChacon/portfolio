# Portfolio + Configurador — Base de Conocimiento

Base de conocimiento del portfolio profesional de **Facundo Chacón** (facucode.dev) y del nuevo **Configurador de Presupuestos Web** ("tienda de páginas web") que se incorpora como página aparte `/configurador`.

## Índice de Archivos

| Archivo | Contenido |
|---------|-----------|
| [01_vision_y_objetivos.md](01_vision_y_objetivos.md) | Propósito, objetivos por actor, alcance v1.0, fuera de alcance |
| [02_descripcion_general.md](02_descripcion_general.md) | Stack, arquitectura general, integraciones externas |
| [03_actores_y_roles.md](03_actores_y_roles.md) | Actores, matriz de permisos, rutas públicas |
| [04_modelo_de_datos.md](04_modelo_de_datos.md) | Entidades (catálogo, estado del wizard, payload del lead) |
| [05_reglas_de_negocio.md](05_reglas_de_negocio.md) | Reglas RN-XX por dominio (precios, cotización, hosting, validación, anti-abuso, PDF) |
| [06_funcionalidades.md](06_funcionalidades.md) | 4 épicas, 12 historias de usuario con criterios de aceptación |
| [07_flujos_principales.md](07_flujos_principales.md) | 5 flujos extremo a extremo |
| [08_arquitectura_propuesta.md](08_arquitectura_propuesta.md) | Patrones, estructura de directorios, seguridad, env vars |
| [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md) | 7 decisiones (DD) + 5 supuestos (SU) |
| [10_preguntas_abiertas.md](10_preguntas_abiertas.md) | 2 inconsistencias + 10 preguntas priorizadas |

## Quick Start para Desarrolladores

1. Entender el dominio → [01](01_vision_y_objetivos.md), [03](03_actores_y_roles.md)
2. Entender los datos → [04](04_modelo_de_datos.md)
3. Entender las reglas → [05](05_reglas_de_negocio.md)
4. Entender la arquitectura → [02](02_descripcion_general.md), [08](08_arquitectura_propuesta.md)
5. Implementar → [07](07_flujos_principales.md), [06](06_funcionalidades.md)
6. Antes de codificar → [10](10_preguntas_abiertas.md)

## Resumen Ejecutivo

El proyecto es el **portfolio estático** (React 18 + Vite + Tailwind 3) de Facundo Chacón, al que se le suma un **configurador autoservicio de presupuestos** en `/configurador`. El visitante elige uno de 7 tipos de sitio y suma extras, viendo un total en ARS en vivo, y envía la solicitud. No hay backend: el lead se despacha por un **webhook externo** (n8n/Zapier/Make) que persiste en Sheets/Notion, notifica por email y responde con un **PDF** generado en el cliente. Se incorporan `react-router-dom` (routing) y `@react-pdf/renderer` (PDF). El comodín "Sistema a medida" queda **a cotizar** y el hosting/dominio es **gestión técnica sin costo monetario** (titularidad del cliente).

> El plan de implementación operativo está en [`../CHANGES.md`](../CHANGES.md).
