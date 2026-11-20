# Flujos Principales

Cada flujo se documenta extremo a extremo, mostrando interacciones entre componentes.

## Flujo 1: Armado y envío de un presupuesto (principal)

**Disparador**: el visitante entra a `/configurador` y completa el wizard.
**Actor**: visitante anónimo.

**Pasos**:
1. El router carga la página `Configurador` (chunk lazy).
2. `useConfigurador` inicializa el estado: `step = 0`, `serviceId = services[0].id`, `extras` = los marcados como `recommended` en el catálogo (hoy `hosting`), `quantity = 1`.
3. **Paso 1** — el visitante elige el tipo de sitio (`ServiceCards`). Se actualiza `serviceId`.
4. **Paso 2** — marca extras (`ExtrasCards`) y ajusta cantidad. `SummarySidebar` refleja la selección en vivo (sin importes).
5. **Paso 3** — completa `name`, `email` (y opcionalmente `phone`, `project`). Validación inline.
6. **Paso 4** — revisa el resumen. Al confirmar, se arma el `LeadPayload`.
7. El **PDF** no se genera en el envío (generador existente, no integrado; `pdf: null`).
8. `webhook.js` hace `POST` (`text/plain`, timeout de 20 s) del payload a `VITE_WEBHOOK_URL`.
9. En 2xx → `status = "success"` → pantalla de confirmación. En error → `status = "error"` + alternativa mailto/WhatsApp.

**Diagrama de secuencia**:
```
Visitante → Wizard(React) → summary.js → (selección en vivo)
Visitante → FormStep      → validación
Visitante → ReviewStep    → confirmar
                          → webhook.js ──POST──► [Google Apps Script]
                                                    ├─ Hoja "Leads"
                                                    └─ Email a Facundo
                          ← 2xx / error
            SuccessStep / ErrorStep
```

**Casos de error**:
- Webhook caído / 5xx → `ErrorStep` con `mailto:` y WhatsApp de respaldo.
- `VITE_WEBHOOK_URL` ausente → se cae a `mailto:` con el resumen serializado.
- Doble click en enviar → bloqueado por `status === "submitting"`.

---

## Flujo 2: Acceso al configurador desde el portfolio

**Disparador**: el visitante hace click en el CTA.
**Actor**: visitante.

**Pasos**:
1. En `/` (Hero o sección Proyectos) el visitante ve el CTA "Armá tu web".
2. `react-router-dom` navega a `/configurador` (client-side, sin recargar).
3. Si el visitante recarga directo `/configurador`, el hosting resuelve el **fallback SPA** a `index.html` y el router monta la página.

**Casos de error**:
- Ruta desconocida `/foo` → redirige a `/` (404 amistoso).

---

## Flujo 3: Generación del PDF del presupuesto (no integrado)

> Estado: el generador existe pero no se invoca en el envío. Flujo previsto para cuando se integre (requiere `'wasm-unsafe-eval'` en la CSP).

**Disparador**: el visitante confirma el envío en el paso 4.
**Actor**: visitante (en su navegador).

**Pasos**:
1. Se construye el documento con `@react-pdf/renderer` a partir del `LeadPayload`.
2. Se renderiza a `blob`.
3. El blob se convierte a base64 (o multipart) para adjuntarse en el POST al webhook.
4. (Opcional) se ofrece "Descargar PDF" en la pantalla de éxito.

**Casos de error**:
- Falla de render → se registra y continúa sin PDF (`pdf: false`).

---

## Flujo 4: Registro y notificación (externo)

**Disparador**: el webhook recibe el POST.
**Actor**: sistema externo (Google Apps Script).

**Pasos**:
1. Valida el payload: guard v3 (descarta por `source`), límites de longitud y rate limit (3/h por email, 30/h global).
2. Persiste el lead en la hoja "Leads".
3. Envía email a Facundo con los datos.

**Casos de error**:
- Payload inválido → responde 4xx (el front muestra error).
- Falla el email pero persiste el lead → responde 2xx y alerta internamente (para no perder el lead del lado del visitante).

---

## Flujo 5: Manejo del "Sistema a medida" (comodín)

**Disparador**: el visitante elige "Sistema a medida".
**Actor**: visitante.

**Pasos**:
1. `custom` es un tipo de sitio más del catálogo (sin precio, como todos).
2. El payload lleva `service.id = "custom"`.
3. Facundo cotiza por email tras la conversación (todos los servicios se cotizan así).

**Casos de error**:
- Ninguno bloqueante; es un caso de negocio, no un error.
