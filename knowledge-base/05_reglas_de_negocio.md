# Reglas de Negocio

Cada regla tiene un código único `RN-{DOMINIO}-{NN}` para trazabilidad.

## Dominio: Precios (RN-PR)

- **RN-PR-01**: todos los precios se expresan y muestran en **ARS** (`Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`).
- **RN-PR-02**: el total del servicio = `service.priceARS × quantity`.
- **RN-PR-03**: el total de extras = suma de `priceARS` de los extras seleccionados (los de precio `0` no alteran el total).
- **RN-PR-04**: `total = servicio×cantidad + extras`. Se muestra **siempre visible** en el resumen lateral (patrón "carrito").
- **RN-PR-05**: los extras `recurring: true` (Mantenimiento) se muestran con sufijo **"/mes"** y se listan separados del pago único en el resumen y el PDF.
- **RN-PR-06**: cambiar de servicio **no** limpia los extras seleccionados (persisten entre pasos).
- **RN-PR-07**: los precios son valores de referencia editables en `data/configurador.js`; no son vinculantes hasta que Facundo confirma por email.

## Dominio: Cotización especial (RN-CO)

- **RN-CO-01**: "Sistema a medida" tiene `priceARS: null` y `quotable: true` → se muestra como **"A cotizar"**, nunca como un número.
- **RN-CO-02**: si el visitante incluye "Sistema a medida", el total mostrado incluye el aviso **"+ Sistema a medida (a cotizar)"** y `hasQuotable: true` en el payload.
- **RN-CO-03**: "Sistema a medida" **no suma** al total numérico; el cierre del precio es manual (post-conversación).
- **RN-CO-04**: "Sistema a medida" es excluyente como servicio principal (no se combina con otro tipo de sitio como base; es el "comodín").

## Dominio: Hosting y Dominio (RN-HD)

- **RN-HD-01**: el extra **Hosting + Dominio** tiene `priceARS: 0` y **no** altera el total.
- **RN-HD-02**: se muestra con el disclaimer textual: *"Me encargo de la **gestión técnica** (configuración, deploy, SSL, DNS). El **costo del hosting y el dominio está a cargo del cliente** y se contrata a su nombre (por una cuestión de propiedad)."*
- **RN-HD-03**: el disclaimer debe ser visible en la card del extra **y** en el PDF del presupuesto; nunca se oculta detrás de un tooltip únicamente.
- **RN-HD-04**: el sistema **no** procesa pagos ni factura el hosting/dominio; solo se documenta la gestión técnica.
- **RN-HD-05**: la titularidad de la cuenta de hosting/dominio recae siempre en el cliente.

## Dominio: Cantidad (RN-QT)

- **RN-QT-01**: `quantity` entero, mínimo 1, sin máximo duro (orientativo).
- **RN-QT-02**: la cantidad aplica **solo al servicio principal**, no a los extras.
- **RN-QT-03**: el resumen refleja `servicio × cantidad` cuando `quantity > 1`.

## Dominio: Validación del formulario (RN-VL)

- **RN-VL-01**: `name` (no vacío) y `email` (formato válido) son **obligatorios** para avanzar del paso 3 al 4.
- **RN-VL-02**: `phone` y `project` (descripción breve) son **opcionales**.
- **RN-VL-03**: no se puede enviar sin servicio seleccionado (paso 1 obliga una selección; por defecto el primero).
- **RN-VL-04**: los mensajes de error son inline, en español, y accesibles (`aria-invalid`, `aria-describedby`).

## Dominio: Anti-abuso (RN-AB)

- **RN-AB-01**: incluir un campo **honeypot** oculto; si viene completo, se descarta el envío silenciosamente.
- **RN-AB-02**: el botón "Enviar" se deshabilita mientras `status === "submitting"` (evita doble submit).
- **RN-AB-03**: el rate limiting por IP se delega al webhook externo (no se implementa en el front).
- **RN-AB-04**: no exponer la URL del webhook de forma explotable más allá de `VITE_WEBHOOK_URL` (es pública por naturaleza en un sitio estático; el webhook debe validar).

## Dominio: PDF y entrega (RN-PD)

- **RN-PD-01**: el PDF se genera **en el cliente** con `@react-pdf/renderer` a partir del `LeadPayload`.
- **RN-PD-02**: el PDF incluye: encabezado (Facundo Chacón), fecha, servicio, extras, totales, disclaimer de hosting y nota "estimación no vinculante".
- **RN-PD-03**: si la generación de PDF falla, el envío al webhook **igual procede** (el PDF es best-effort; se marca `pdf: false` en el payload).
- **RN-PD-04**: el PDF nunca expone datos de otros leads (se genera 100% en el navegador del visitante).

## Dominio: Notificaciones (RN-NT)

- **RN-NT-01**: al enviar, el webhook dispara un email a Facundo con los datos y (si existe) el PDF adjunto.
- **RN-NT-02**: el webhook dispara un **auto-reply** al prospecto confirmando recepción y prometiendo respuesta.
- **RN-NT-03**: la UI muestra un estado de éxito **solo** si el POST al webhook responde OK (HTTP 2xx); si falla, muestra estado de error con alternativa (`mailto:`/WhatsApp de respaldo).

## Dominio: Excepciones globales

- **RN-EX-01**: toda la copia de UI es en **español (es-AR)**.
- **RN-EX-02**: el configurador respeta la estética del portfolio (fondo `#030303`, acentos verde `#00ffc3` y magenta `#ff6eff`) pero adopta el patrón "tarjetas modulares" del concepto calculadora.
- **RN-EX-03**: el wizard es navegable hacia atrás sin perder el estado ya cargado.
- **RN-EX-04**: el sitio es **responsive** y operable por teclado (focus visible, contraste AA).
