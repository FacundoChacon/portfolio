# Tasks

## 1. Dependencias

- [x] 1.1 Instalar `react-router-dom` y `@react-pdf/renderer` con `npm install`, y verificar que `package.json` liste ambas en `dependencies` y que `package-lock.json` se actualice.
- [x] 1.2 Verificar que la instalación no requiera `--force` (sin conflictos de peer deps con React 18) y que `node_modules` quede consistente ejecutando `npm install` de nuevo sin errores.

## 2. Contrato de entorno

- [x] 2.1 Crear `.env.example` con `VITE_WEBHOOK_URL`, `VITE_WHATSAPP_NUMBER`, `VITE_CONTACT_EMAIL`, `VITE_APP_URL`, cada una con un valor de ejemplo y un comentario *"variable pública (se embebe en el bundle); no poner secretos"*; verificar que el archivo existe y documenta las 4 variables.
- [x] 2.2 Verificar que `.env` está excluido del control de versiones (revisar `.gitignore`) y que `.env.example` sí queda versionado.

## 3. Estructura de carpetas

- [x] 3.1 Crear `src/pages/`, `src/components/configurador/`, `src/utils/` y `src/data/`, cada una con un `.gitkeep`; verificar que las 4 carpetas y sus `.gitkeep` existen.
- [x] 3.2 Verificar que la creación de carpetas no altera el build (`npm run build` sigue generando `dist/index.html`).

## 4. Provider de router

- [x] 4.1 Envolver la app en `BrowserRouter` dentro de `src/main.jsx` (sin definir rutas todavía); verificar que el archivo importa `BrowserRouter` desde `react-router-dom` y envuelve `<App />`.
- [x] 4.2 Verificar que el portfolio renderiza igual que antes (mismas secciones Hero/About/Projects/Stack/Contact) levantando `npm run dev` o `npm run preview` y confirmando que no hay errores en consola ni cambios visuales.

## 5. Verificación de integración

- [x] 5.1 Ejecutar `npm run lint` y `npm run build` y confirmar que ambos terminan sin errores (línea base verde del CI).
- [x] 5.2 Confirmar que no hay comportamiento nuevo visible para el usuario: `/configurador` todavía NO existe como ruta y el bundle inicial no importa `@react-pdf/renderer`.
