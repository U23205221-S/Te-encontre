# PRD v2 — Alineación Frontend/Backend del nuevo flujo

## 1) Objetivo

Alinear completamente el frontend con los contratos actuales del backend para autenticación, registro de credenciales (badge) y flujo de escaneo/alerta en 2 pasos, eliminando inconsistencias de payload, validaciones y formato de envío.

---

## 2) Alcance

Incluye:
- Flujos de autenticación (`register`, `login`, `refresh`, `logout`)
- Formulario de registro de hijo/a (badge)
- Escaneo por QR y reconocimiento facial
- Flujo de alerta en 2 pasos (`scan/*` + `scan/{alertUuid}`)
- Adaptación de formularios y validaciones frontend al contrato backend

No incluye:
- Cambios de lógica de negocio del backend
- Nuevos endpoints
- Rediseño visual adicional fuera de lo ya aprobado

---

## 3) Contrato backend confirmado (fuente de verdad)

Referencia: `backend-java/endpoints.md`

### 3.1 Auth
- `POST /api/auth/register`
  - Body requerido: `dni`, `email`, `passwordHash`, `confirmPasswordHash`
- `POST /api/auth/login`
  - Body requerido: `dni`, `passwordHash`
- `POST /api/auth/logout` (Bearer token)
- `POST /api/auth/refresh`

### 3.2 Scan (público)
- `POST /api/v1/badge/scan/face` (**multipart/form-data**)
  - `data` (JSON Blob): `faceVector`, `latitude`, `longitude`, `nameDevice`, `ipAddress`
  - `file` (File): foto capturada en el momento del hallazgo
- `POST /api/v1/badge/scan/qr` (**multipart/form-data**)
  - `data` (JSON Blob): `qrCodeUuid`, `latitude`, `longitude`, `nameDevice`, `ipAddress`
  - `file` (File): foto capturada en el momento del hallazgo

### 3.3 Scan paso 2
- `POST /api/v1/badge/scan/{uuid_alerta}`
  - Body: `dniReporter`, `phoneReporter`
  - Regla: opcionales individualmente, pero **al menos uno obligatorio**

### 3.4 Badge
- `POST /api/v1/badge` (**multipart/form-data**, con Bearer)
  - `data` (JSON Blob)
  - `file` (File)

---

## 4) Reglas funcionales confirmadas

## 4.1 Login/registro
- Login será por `dni` + `passwordHash` (NO email como credencial)
- Register usará exactamente claves backend (`dni`, `email`, `passwordHash`, `confirmPasswordHash`)

## 4.2 Registro de hijo/a (badge)
- Política de obligatoriedad:
  - Obligatorio: todos los campos
  - Excepciones: `bloodType` y `allergies` (opcionales)

## 4.3 Guardianes
- `guardians[]`:
  - Guardián 1: obligatorio
  - Guardián 2: obligatorio
  - Guardián 3: opcional
- Cada guardián incluye: `dni`, `name`, `email`, `phone`, `relationship`

## 4.4 Catálogos (enums backend)
- `Gender` (selector frontend):
  - `MASCULINO`, `FEMENINO`
- `RelationShip` (selector frontend):
  - `PADRE`, `MADRE`, `HERMANO`, `HERMANA`, `ABUELO`, `ABUELA`, `TIO`, `TIA`, `OTRO`

---

## 5) Flujo objetivo (end-to-end)

## 5.1 Reconocimiento facial (público)
1. Usuario abre scanner facial.
2. Frontend captura imagen actual del video (`canvas -> blob -> File`).
3. Frontend genera vector facial.
4. Frontend envía `multipart/form-data` a `/scan/face` con:
   - `data` (JSON Blob)
   - `file` (foto)
5. Backend responde `alertUuid`.
6. Frontend solicita datos del reportante (`dniReporter` y/o `phoneReporter`).
7. Frontend llama `/scan/{alertUuid}` con al menos un campo.
8. Backend responde `BadgeResponseDTO` para mostrar datos públicos.

## 5.2 Escaneo QR (público)
1. Usuario escanea QR y obtiene `qrCodeUuid`.
2. Frontend captura foto actual del contexto/hallazgo.
3. Frontend envía `multipart/form-data` a `/scan/qr` con:
   - `data` (JSON Blob)
   - `file` (foto)
4. Backend responde `alertUuid`.
5. Frontend ejecuta segundo paso `/scan/{alertUuid}` con datos del reportante.
6. Backend responde `BadgeResponseDTO`.

## 5.3 Registro de badge (autenticado)
1. Tutor autenticado completa formulario del menor y guardianes.
2. Frontend valida obligatoriedad (excepto `bloodType` y `allergies`).
3. Frontend envía `multipart/form-data` a `/api/v1/badge` (`data` + `file`).
4. Backend crea badge y devuelve respuesta correspondiente.

---

## 6) Adaptaciones frontend requeridas

## 6.1 Auth pages
- `LoginPage`: cambiar payload a `dni` + `passwordHash`.
- `RegistroPage`: cambiar payload a `dni`, `email`, `passwordHash`, `confirmPasswordHash`.
- Ajustar labels/placeholders/validaciones al nuevo contrato.

## 6.2 Formulario de hijo/a
- Usar listas de enums backend para `gender` y `relationship`.
- Validar guardianes con cardinalidad 2 obligatorios + 1 opcional.
- Mantener `bloodType` y `allergies` como opcionales.

## 6.3 Scanner facial
- Reemplazar request JSON actual por `multipart/form-data`.
- Implementar captura de frame y envío como `file`.
- Mantener geolocalización + metadata de dispositivo/IP en `data`.

## 6.4 Scanner QR
- Confirmar que también envía foto (`file`) junto con `data`.
- Asegurar segundo paso obligatorio con `alertUuid`.

## 6.5 Paso 2 de alerta
- Crear/ajustar UI de “datos del reportante” con validación:
  - `dniReporter || phoneReporter` debe cumplirse.

---

## 7) Criterios de aceptación

1. Ningún endpoint recibe payload con claves distintas a las documentadas.
2. Login funciona con `dni` + `passwordHash`.
3. Register funciona con `dni`, `email`, `passwordHash`, `confirmPasswordHash`.
4. `/scan/face` y `/scan/qr` reciben correctamente `multipart` con `data` + `file`.
5. El frontend siempre ejecuta el segundo paso `/scan/{alertUuid}` tras `200 OK` en scan inicial.
6. Validación de reportante exige al menos un dato (`dniReporter` o `phoneReporter`).
7. Formulario de badge exige todo salvo `bloodType` y `allergies`.
8. Selectores usan enums backend (`Gender`, `RelationShip`) sin valores hardcodeados fuera de contrato.

---

## 8) Plan de implementación (fases)

### Fase 1 — Contratos Auth y formularios
- Ajuste de payloads login/register
- Ajuste de validaciones y labels

### Fase 2 — Badge form y guardianes
- Reglas de obligatoriedad
- Enums backend en selects
- Cardinalidad de guardianes

### Fase 3 — Scan multipart
- `scan/face` con foto + data
- `scan/qr` con foto + data

### Fase 4 — Flujo 2-step y UX
- Pantalla de datos del reportante
- Consumo de `/scan/{alertUuid}` y render final

### Fase 5 — Hardening
- Manejo de errores backend
- Validaciones edge cases
- QA funcional de extremo a extremo

---

## 9) Riesgos y mitigación

- Riesgo: divergencia de nombres de campos entre frontend y backend.
  - Mitigación: centralizar DTO mappers y tests de contrato.

- Riesgo: fallos de cámara/permisos al capturar foto en scan.
  - Mitigación: fallback UX, mensajes claros, reintento.

- Riesgo: olvido del segundo paso en scan.
  - Mitigación: encapsular flujo scan en un servicio único transaccional de frontend.

---

## 10) Entregables

- PR de adaptación frontend por fases
- Checklist de contrato backend cumplido
- QA de flujos: login/register, badge, scan face, scan qr, reporter step
