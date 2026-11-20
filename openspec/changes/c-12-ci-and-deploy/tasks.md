# Tasks

> Strict TDD: la lógica nueva (validación de `vercel.json`, CSP, sitemap y robots) vive en el módulo puro `scripts/lib/deploy-config.mjs` y se escribe primero el test que falla (RED), luego el código mínimo (GREEN), casos adicionales (TRIANGULATE) y REFACTOR con tests en verde. Ejecutar con `node --test scripts/deploy-config.test.mjs` (o `npm test`). Sin dependencias nuevas. Nunca leer ni copiar `.env` / `.env.local`. Commits y pushes solo con autorización del usuario.

## 0. Red de seguridad

- [x] 0.1 Correr `npm run ci` sobre el estado actual y registrar el baseline (tests en verde, lint/verificaciones/build OK); si algo falla, detenerse y reportarlo como falla preexistente — _Hecho: baseline 116/116, lint/verificaciones/build OK._

## 1. Validador de la configuración de deploy — CSP (cabeceras-de-seguridad › Política de seguridad de contenido / Configuración verificable)

- [x] 1.1 RED: crear `scripts/deploy-config.test.mjs` con un test de `parseCsp` (la CSP del design D3 → mapa directiva → lista de fuentes, tolerante a espacios y `;` final); verificar que falla (módulo inexistente)
- [x] 1.2 GREEN: crear `scripts/lib/deploy-config.mjs` con `parseCsp`; verificar en verde
- [x] 1.3 RED → GREEN: `checkCsp(value)` con la CSP del design D3 → sin errores; verificar en verde
- [x] 1.4 TRIANGULATE `checkCsp`: errores nombrando la directiva para (a) `script-src` con `'unsafe-inline'`, `'unsafe-eval'`, `*`, `https:` o `data:`; (b) falta `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` o `default-src 'self'`; (c) `connect-src` sin `https://script.googleusercontent.com` o con comodín (`*`, `https://*.google.com`); (d) directiva duplicada; verificar en verde
- [x] 1.5 REFACTOR: constantes exportadas (`REQUIRED_CSP`, `WEBHOOK_HOSTS`, `FORBIDDEN_SCRIPT_SOURCES`) y JSDoc del módulo; verificar `scripts/deploy-config.test.mjs` en verde

## 2. Validador de la configuración de deploy — `vercel.json` (cabeceras-de-seguridad › Cabeceras básicas / Política de permisos / Configuración verificable)

- [x] 2.1 RED: test de `checkVercelConfig(config)` con una config completa (rewrite SPA + bloque `headers` `source: "/(.*)"` con las cabeceras del design D2/D3 y CSP enforcing) → `{ errors: [], warnings: [] }`; verificar que falla
- [x] 2.2 GREEN: implementar `checkVercelConfig` reutilizando `checkCsp`; verificar en verde
- [x] 2.3 TRIANGULATE: (a) falta `X-Content-Type-Options` → error que nombra la cabecera; (b) `Referrer-Policy` o `X-Frame-Options` con otro valor → error; (c) `Permissions-Policy` sin `camera=()` → error; (d) CSP solo como `Content-Security-Policy-Report-Only` → sin errores y con warning "modo reporte"; (e) sin CSP → error; (f) sin el rewrite `/(.*)` → `/index.html` → error; (g) cabeceras bajo otro `source` (p. ej. `/assets/(.*)`) → error; verificar en verde
- [x] 2.4 REFACTOR: nombres, mensajes en es-AR y JSDoc; verificar en verde

## 3. Validador de sitemap y robots (indexacion-del-sitio)

- [x] 3.1 RED → GREEN: `checkSitemap(xml, expectedUrls)` con un sitemap válido de `https://www.facucode.dev/` (solo la home; `/configurador` listado → error) → sin errores; verificar que primero falla y después pasa
- [x] 3.2 TRIANGULATE `checkSitemap`: (a) falta una URL esperada; (b) URL extra; (c) `<loc>` duplicado; (d) URL relativa o de otro host; (e) sin `xmlns` de sitemaps.org 0.9 → cada uno con error descriptivo; verificar en verde
- [x] 3.3 RED → GREEN → TRIANGULATE `checkRobots(txt, sitemapUrl)`: válido con `User-agent: *`, `Allow: /` y `Sitemap: https://www.facucode.dev/sitemap.xml` (también con `\r\n`); errores si falta la línea `Sitemap`, si es relativa o si falta `User-agent: *`; verificar en verde

## 4. CLI `verify:deploy` y archivos de configuración

- [x] 4.1 Crear `scripts/verify-deploy.mjs` (estilo de `verify-testimonials.mjs`): lee `vercel.json`, `public/sitemap.xml`, `public/robots.txt`, imprime warnings y sale con código 1 ante errores; agregar `"verify:deploy": "node scripts/verify-deploy.mjs"` en `package.json` e incluirlo en `ci` después de `verify:testimonials`; verificar que `npm run verify:deploy` falla hoy (faltan cabeceras y sitemap) nombrando cada problema
- [x] 4.2 Crear `public/sitemap.xml` (design D6: solo la home, sin `<lastmod>`) y agregar `Sitemap: https://www.facucode.dev/sitemap.xml` a `public/robots.txt`; verificar que `verify:deploy` ya no reporta errores de sitemap/robots
- [x] 4.3 Agregar a `vercel.json` el bloque `headers` con `source: "/(.*)"`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()` y la CSP del design D3 como `Content-Security-Policy-Report-Only` (mantener `$schema` y `rewrites`); verificar `npm run verify:deploy` en verde con el warning de modo reporte

## 5. CI (integracion-continua)

- [x] 5.1 En `.github/workflows/ci.yml` reemplazar los pasos `Lint` y `Build` por un paso que ejecuta `npm run ci`; renombrar el job (`Lint + verificaciones + tests + build`); conservar `permissions: contents: read`, `concurrency`, `timeout-minutes` y las acciones pineadas por SHA (sin cambiar versiones); verificar con lectura del YAML que no hay otros `permissions` ni `uses:` sin SHA
- [x] 5.2 Extender "Verify build artifacts": `sitemap.xml` en la lista de assets; error si `compgen -G 'dist/assets/Configurador-*.js'` no encuentra archivos; error si `dist/index.html` contiene `Configurador-`; verificar corriendo el bloque bash localmente (Git Bash) sobre el `dist/` de `npm run build` → "Artefactos OK"
- [x] 5.3 Prueba en rojo del gate: renombrar temporalmente `dist/assets/Configurador-*.js` (y luego `dist/sitemap.xml`) y correr el bloque → debe fallar con el `::error::` correspondiente; restaurar con un `npm run build` limpio y confirmar verde — _Hecho: demostrada en local sin push: bloque bash del CI contra `dist/` con el chunk renombrado, sin `sitemap.xml` y con `index.html` referenciando el chunk, cada caso con su `::error::` y exit 1; `npm run build` limpio vuelve a "Artefactos OK"._

## 6. `.env.example`

- [x] 6.1 Reescribir `.env.example` (design D7) con `VITE_WEBHOOK_URL`, `VITE_WHATSAPP_NUMBER` (formato `549` + característica + número, sin `+`) y `VITE_CONTACT_EMAIL`, comentarios en es-AR, valores ficticios, nota de que `VITE_*` es público y de que cambiar de proveedor de webhook exige actualizar `connect-src`; eliminar variables que el código no lee; verificar con `grep -rhoE "VITE_[A-Z_]+" src | sort -u` que el conjunto coincide exactamente con las variables del archivo (si el permiso bloquea leer el archivo actual, reescribirlo igual y reportarlo) — _Hecho 2026-11-20: contenido redactado por el orquestador y copiado por Facundo (los permisos bloquean `.env*` para el agente). El código lee exactamente `VITE_CONTACT_EMAIL`, `VITE_WEBHOOK_URL` y `VITE_WHATSAPP_NUMBER`._

## 7. Verificación local de la CSP en navegador (cabeceras-de-seguridad › La CSP no rompe el sitio)

- [x] 7.1 Build local con webhook ficticio: `VITE_WEBHOOK_URL=https://script.google.com/macros/s/TEST/exec npm run build` y `npm run preview`; verificar que el sitio sirve en `http://localhost:4173` — _Hecho: build con webhook ficticio `https://script.google.com/macros/s/TEST/exec` y `vite preview` en el puerto 5180 (no 4173)._
- [x] 7.2 Con Playwright (design D4.1/D5): inyectar en el documento la CSP **enforcing** leída de `vercel.json` vía `page.route` + `route.fetch()`/`route.fulfill`; interceptar `https://script.google.com/**` (302 → `https://script.googleusercontent.com/...` interceptado con `200 {"ok":true}`; si la redirección vía `fulfill` no se sigue, `200` directo y anotarlo); recorrer home → `/configurador` → pasos hasta revisión → enviar; verificar: consola sin `Content Security Policy`/`Refused to`, `document.fonts.check('16px Orbitron')` en `true`, pantalla de éxito visible — _Hecho: CSP enforcing verificada (script inline bloqueado con `script-src-elem`); home y `/configurador` sin mensajes en consola, fuentes Google cargadas, envío hasta "¡Solicitud enviada!"; la redirección 302 no pudo interceptarse (ver desvío en el informe): se respondió 200 directo desde `script.google.com`._
- [x] 7.3 Control negativo: repetir el envío con una CSP inyectada sin `https://script.google.com` en `connect-src`; verificar que aparece la violación en consola y que el handler de la ruta no se invoca. Si NO aparece, registrar que la intercepción no prueba `connect-src` y depender del plan B (tarea 9.3) — _Hecho: control negativo OK: sin `script.google.com` en `connect-src` aparece "violates the following Content Security Policy directive" y el handler de la ruta no se invoca._
- [x] 7.4 Si 7.2 mostró violaciones: corregir la CSP en `vercel.json` (y los tests del grupo 1 si cambia el contrato), sin agregar `'unsafe-inline'`/`'unsafe-eval'` a `script-src`; documentar cualquier relajación en el design; repetir 7.2 — _Hecho: sin violaciones en 7.2: no hizo falta cambiar la CSP._

## 8. Documentación (KB y CHANGES.md)

- [x] 8.1 `knowledge-base/10_preguntas_abiertas.md` (design D8): IN-01 y P-01 cerradas por obsoletas (precios eliminados 2026-10-12); P-02 resuelta (Apps Script: hoja "Leads" + email, guard v3 con chequeo de `source`, límites de longitud, rate limit 3/h por email y 30/h global); P-03 resuelta (WhatsApp `5492615799062` vía `VITE_WHATSAPP_NUMBER`, email fallback `chaconfacu2006@gmail.com`); P-07 resuelta (Vercel + `rewrites`, aplicado); "Notas para el roadmap" actualizadas; verificar con `grep -n "P-01\|P-02\|P-03\|P-07"` que cada una indica su estado
- [x] 8.2 KB vigente sin precios: corregir lo que describe el sistema actual en `README.md`, `01`, `02`, `03`, `04` (entidades y `LeadPayload` alineados con `openspec/specs/catalogo-del-configurador` y `openspec/specs/webhook-integration`), `06`, `07` y `08` (patrones, estructura, testing, env vars sin `VITE_APP_URL` ni ejemplo n8n); marcar como "Derogada (2026-10-12)" RN-PR, RN-CO, DD-03, DD-04 y SU-02 sin borrarlas; verificar con `grep -nE "priceARS|subtotal|pricing\.js|total en vivo" knowledge-base/*.md` que toda coincidencia restante está dentro de una sección marcada como derogada/histórica
- [x] 8.3 `knowledge-base/08_arquitectura_propuesta.md` §Seguridad: cabeceras y CSP vigentes, rollout Report-Only → enforcing, y cómo actualizarlas (cambio de proveedor de webhook → `connect-src` + validador; integrar PDF → `'wasm-unsafe-eval'` en `script-src`); §Rendimiento/§CI: `npm run ci` y verificación del chunk; verificar que los valores citados coinciden con `vercel.json`
- [x] 8.4 `CHANGES.md`: "Cómo usar" paso 4 → `npm run ci`; scope de C-12 sin "P-01 precios"; reemplazar "Bloqueantes externos" por un checklist de deploy vigente (env vars en Vercel, cabeceras, sitemap, verificación post-deploy); nota breve (2026-11-20) de los ajustes post-C-10: `fix-reintento-envio`, webhook `text/plain` + timeout de 20 s, rewrite SPA en `vercel.json`, WhatsApp configurado; verificar con `grep -n "npm run lint && npm run build\|P-01" CHANGES.md` que no quedan referencias vigentes — _Hecho: "Cómo usar", scope de C-12, checklist de deploy y nota del 2026-11-20 aplicados; el `[x]` de C-12 se marca al archivar (9.6)._

## 9. Deploy y verificación en producción (requiere autorización del usuario para cada push)

- [ ] 9.1 `npm run ci` completo en verde; pedir autorización y hacer commit + push a `main` (Deploy 1, CSP Report-Only); verificar en GitHub Actions que el workflow pasa y en Vercel que el deploy terminó — _PENDIENTE (orquestador)._
- [ ] 9.2 Verificación HTTP de producción: `curl -sI https://www.facucode.dev/`, `/configurador`, `/robots.txt`, `/sitemap.xml` y un `/assets/*.js` → cada respuesta trae las cuatro cabeceras simples y `Content-Security-Policy-Report-Only`; `/sitemap.xml` con `Content-Type` XML y cuerpo `<urlset>`; `/robots.txt` con la línea `Sitemap` — _PENDIENTE (orquestador)._
- [ ] 9.3 Verificación en navegador de producción (Playwright, sin leads reales): recorrer home → `/configurador` → pasos → envío con `page.route('https://script.google.com/**')` respondiendo `200 {"ok":true}`; consola sin mensajes `[Report Only]`/`Content Security Policy`, fuentes aplicadas y pantalla de éxito. Plan B solo con OK explícito del usuario: un único `fetch` POST `text/plain` real al webhook con `{"payload":{"contact":{}}}` desde `browser_evaluate` y verificar que no hay violaciones CSP (el guard lo descarta sin escribir) — _PENDIENTE (orquestador)._
- [ ] 9.4 Pasar la CSP a enforcing: renombrar la clave a `Content-Security-Policy` en `vercel.json`; `npm run verify:deploy` sin warning de modo reporte y `npm run ci` en verde; pedir autorización y commit + push (Deploy 2) — _PENDIENTE (orquestador)._
- [ ] 9.5 Re-verificar producción como en 9.2 (ahora `Content-Security-Policy` enforcing, sin `-Report-Only`) y 9.3 (consola sin violaciones, envío interceptado OK); si algo se rompe, rollback (revertir `vercel.json` o *Instant Rollback*) y reportar — _PENDIENTE (orquestador)._
- [ ] 9.6 Al archivar: marcar C-12 `[x] completado (<fecha>)` en `CHANGES.md` y actualizar el resumen final; verificar con `grep -n "C-12" CHANGES.md` — _PENDIENTE (orquestador)._

## 10. Ajustes de la revisión independiente (design D9)

- [x] 10.1 RED → GREEN → TRIANGULATE: `checkCsp` rechaza esquemas desnudos en `connect-src`, `blob:`/`'unsafe-hashes'` en `script-src` y fuentes inseguras en `style-src`/`img-src`/`font-src` (`data:` solo en `img-src`); `checkVercelConfig` compara claves de cabecera sin distinguir mayúsculas
- [x] 10.2 Sitemap solo con la home: `public/sitemap.xml`, `scripts/verify-deploy.mjs`, tests y spec `indexacion-del-sitio`
