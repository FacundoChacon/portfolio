# Flujos Principales

Cada flujo se documenta extremo a extremo, mostrando interacciones entre componentes.

## Flujo 1: Armado y envío de un presupuesto (principal)

**Disparador**: el visitante entra a `/configurador` y completa el wizard.
**Actor**: visitante anónimo.

**Pasos**:
1. El router carga la página `Configurador` (chunk lazy).
2. `useConfigurador` inicializa el estado: `step = 0`, `serviceId = services[0].id`, `extras = []`, `quantity = 1`.
3. **Paso 1** — el visitante elige el tipo de sitio (`ServiceCards`). Se actualiza `serviceId`.
4. **Paso 2** — marca extras (`ExtrasCards`) y ajusta cantidad. `pricing.js` recalcula el total; `SummarySidebar` lo muestra en vivo.
5. **Paso 3** — completa `name`, `email` (y opcionalmente `phone`, `project`). Validación inline.
6. **Paso 4** — revisa el resumen. Al confirmar, se arma el `LeadPayload`.
7. Se genera el **PDF** (best-effort) con `pdfGenerator.js`.
8. `webhook.js` hace `POST` del payload (+ PDF) a `VITE_WEBHOOK_URL`.
9. En 2xx → `status = "success"` → pantalla de confirmación. En error → `status = "error"` + alternativa mailto/WhatsApp.

**Diagrama de secuencia**:
```
Visitante → Wizard(React) → pricing.js → (total en vivo)
Visitante → FormStep      → validación
Visitante → ReviewStep    → confirmar
                          → pdfGenerator.js  (blob PDF)
                          → webhook.js ──POST──► [n8n/Zapier/Make]
                                                    ├─ Sheets/Notion
                                                    ├─ Email a Facundo (+PDF)
                                                    └─ Auto-reply (+PDF)
                          ← 2xx / error
            SuccessStep / ErrorStep
```

**Casos de error**:
- Webhook caído / 5xx → `ErrorStep` con `mailto:` y WhatsApp de respaldo.
- `VITE_WEBHOOK_URL` ausente → se cae a `mailto:` con el resumen serializado.
- Generación de PDF falla → se envía igual, con `pdf: false`.
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

## Flujo 3: Generación del PDF del presupuesto

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

## Flujo 4: Notificación y auto-reply (externo)

**Disparador**: el webhook recibe el POST.
**Actor**: sistema externo (n8n/Zapier/Make).

**Pasos**:
1. Valida el payload (y rate-limita por IP).
2. Persiste el lead en Google Sheets / Notion / Airtable.
3. Envía email a Facundo con datos + PDF adjunto.
4. Envía auto-reply al prospecto con el PDF y expectativa de respuesta.
5. (Opcional) notifica por Telegram/Slack.

**Casos de error**:
- Payload inválido → responde 4xx (el front muestra error).
- Falla el email pero persiste el lead → responde 2xx y alerta internamente (para no perder el lead del lado del visitante).

---

## Flujo 5: Manejo del "Sistema a medida" (comodín)

**Disparador**: el visitante elige "Sistema a medida".
**Actor**: visitante.

**Pasos**:
1. `custom` tiene `priceARS: null` → la card muestra "A cotizar" y el total agrega el aviso "+ Sistema a medida (a cotizar)".
2. `hasQuotable: true` en el payload.
3. El PDF incluye la línea "Sistema a medida — a cotizar".
4. Facundo cierra el precio manualmente tras la conversación.

**Casos de error**:
- Ninguno bloqueante; es un caso de negocio, no un error.
