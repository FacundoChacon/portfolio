# Tasks

## 1. Páginas

- [x] 1.1 Crear `src/pages/Home.jsx` con el contenido actual de `App.jsx` (`SiteNav` + `<main>` con Hero/About/Projects/Stack/Contact); verificar que `/` renderiza idéntico al estado previo (mismas secciones, sin cambios visuales).
- [x] 1.2 Crear `src/pages/Configurador.jsx` como placeholder mínimo (título visible + enlace/botón "Volver al inicio" a `/`) con `export default`; verificar que el archivo existe, exporta por defecto y compila.

## 2. Rutas

- [x] 2.1 Refactorizar `src/App.jsx` a `<Routes>`: `/` → `Home`, `/configurador` → `Configurador` envuelto en `<Suspense>`, `*` → `<Navigate to="/" replace />`; verificar que `App` ya no renderiza las secciones directamente y que importa `Routes`/`Route`/`Navigate` y usa `React.lazy`.
- [x] 2.2 Definir el `fallback` del `<Suspense>` con estética del tema (fondo `#030303` + indicador/acento); verificar que no rompe el render y que aparece mientras se descarga el chunk (probando con throttling de red o confirmando existencia del fallback).

## 3. Navegación desde el portfolio

- [x] 3.1 En `src/components/SiteNav.jsx`, agregar el CTA "Armá tu web" con `Link to="/configurador"` y convertir el logo a `Link to="/"`; verificar que la navegación ocurre client-side (sin recarga completa del documento).
- [x] 3.2 Verificar en `/` que las anclas de sección (`#presentacion`, `#quien-soy`, `#proyectos`, `#stack`, `#contacto`) y el enlace "Hablemos" siguen desplazando a su sección.

## 4. Redirección y documentación

- [x] 4.1 Verificar que una ruta inexistente (por ejemplo `/foo`) redirige a `/` y muestra el portfolio (usando `npm run preview`).
- [x] 4.2 Documentar el fallback SPA requerido por el hosting para `/configurador` (rewrite de todas las rutas a `/index.html`) actualizando P-07 en `knowledge-base/10_preguntas_abiertas.md`; verificar que la nota queda registrada y referencia el hosting pendiente.
- [x] 4.3 Verificar que recargar `/configurador` directo monta la página usando `npm run preview` (que sirve el fallback SPA).

## 5. Verificación de integración

- [x] 5.1 Ejecutar `npm run lint` y `npm run build` y confirmar que ambos terminan sin errores.
- [x] 5.2 Confirmar que el build emite un **chunk separado** para el configurador (archivo `dist/assets/Configurador-*.js`) y que el bundle inicial de la home NO contiene ese chunk.
