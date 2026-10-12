# Tasks

## 1. Núcleo puro (`src/utils/wizard.js`)

- [x] 1.1 Crear el módulo con constantes de pasos (`STEPS`, `FIRST_STEP = 0`, `LAST_STEP = 3`, `TOTAL_STEPS = 4`) y estados (`STATUS`), documentadas con JSDoc.
- [x] 1.2 Implementar `createInitialState(services, extras)`: primer servicio, extras `recommended` preseleccionados, cantidad 1, paso 0, formulario vacío, `errors: {}`, `submitted: false`, `status: 'idle'`.
- [x] 1.3 Implementar las acciones puras `setService`, `toggleExtra`, `setQuantity`, `setForm`, `nextStep`, `prevStep`, `submit`, `setStatus` devolviendo un estado nuevo sin mutar el anterior.
- [x] 1.4 Implementar `validateForm(form)` (nombre no vacío, email con formato válido, mensajes es-AR) y los selectores `getService(state, services)` y `getSelectedExtras(state, extras)`.

## 2. Hook (`src/hooks/useConfigurador.js`)

- [x] 2.1 Crear el hook que inicializa el núcleo con el catálogo (`services`/`extras` de `src/data/configurador.js`, inyectables) y expone las acciones envueltas con `setState`.
- [x] 2.2 Exponer el estado, el servicio resuelto y los extras seleccionados resueltos, las acciones y `setStatus`.

## 3. Tests (`scripts/wizard.test.mjs`)

- [x] 3.1 Cubrir el estado inicial: primer servicio seleccionado, extras `recommended` preseleccionados, cantidad 1, paso 0, formulario vacío, `status: 'idle'`.
- [x] 3.2 Cubrir la selección: `setService` cambia el servicio y **conserva** los extras (RN-PR-06); `toggleExtra` agrega, quita y no duplica.
- [x] 3.3 Cubrir la cantidad: 0/negativo → 1, no numérico → 1, decimal → entero; `setForm` actualiza un campo sin pisar el resto.
- [x] 3.4 Cubrir la validación y pasos: `nextStep` avanza sin validar en los pasos 0 y 1, bloquea en el paso 2 con nombre vacío o email inválido exponiendo `errors`, avanza con datos válidos limpiando errores; `prevStep` no baja de 0 y el estado persiste.
- [x] 3.5 Cubrir el envío: `submit` con datos válidos marca `submitted` y pasa a `submitting`; con datos inválidos no envía y expone errores; `setStatus('success' | 'error')` actualiza el estado.

## 4. Documentación y verificación

- [x] 4.1 Corregir `knowledge-base/07_flujos_principales.md` (Flujo 1, paso 2) para reflejar la preselección de extras `recommended`.
- [x] 4.2 Verificar: `npm run test` verde, comprobar que un test puede fallar (rojo) y `npm run ci` verde.
