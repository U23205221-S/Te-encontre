# 📖 Documentación de API - Plataforma "Te Encontré"

**URL Base:** `http://localhost:8080`

Esta documentación detalla los flujos de autenticación y el módulo principal de registro y escaneo de gafetes (Badges) mediante códigos QR y reconocimiento facial.

---

## 🔐 1. Módulo de Autenticación (`/api/auth`)

### 1.1. Registrar Usuario

Crea un nuevo usuario en el sistema con validaciones de seguridad.

- **Método:** `POST`
- **Ruta:** `/api/auth/register`
- **Content-Type:** `application/json`
- **Autenticación:** ❌ No requerida (Público)

**Estructura del Body:**

```json
{
  "dni": "123456718",
  "email": "chungcoelhove070@gmail.com",
  "passwordHash": "SHccVE07.",
  "confirmPasswordHash": "SHccVE07."
}
```

**Validaciones:**

| Campo | Validación | Ejemplo |
|-------|-----------|---------|
| `dni` | Debe ser válido y único en el sistema | `"123456718"` |
| `email` | Formato de correo válido | `"usuario@gmail.com"` |
| `passwordHash` | Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial | `"SHccVE07."` |
| `confirmPasswordHash` | Debe coincidir exactamente con `passwordHash` | `"SHccVE07."` |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| `200 OK` | Usuario registrado exitosamente |
| `400 Bad Request` | Datos inválidos o contraseñas no coinciden |
| `409 Conflict` | El DNI o email ya están registrados |

---

### 1.2. Iniciar Sesión

Autentica al usuario y devuelve los tokens de acceso necesarios.

- **Método:** `POST`
- **Ruta:** `/api/auth/login`
- **Content-Type:** `application/json`
- **Autenticación:** ❌ No requerida (Público)

**Estructura del Body:**

```json
{
  "dni": "60751404",
  "passwordHash": "SHccVE07@"
}
```

**Respuesta (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Respuestas de Error:**

| Código | Descripción |
|--------|-------------|
| `401 Unauthorized` | DNI o contraseña incorrectos |
| `404 Not Found` | El usuario no existe |

---

### 1.3. Refrescar Token

Genera un nuevo token de acceso utilizando un Refresh Token válido.

- **Método:** `POST`
- **Ruta:** `/api/auth/refresh`
- **Content-Type:** `application/json`
- **Autenticación:** ❌ No requerida

**Estructura del Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2MDc1MTQwNCIsInV1YWlkIjoiYmJkZDQyM2ItZDM5ZC00ODE4LTkyNmUtMDA0ZTMyNGY4MzEwIiwiaWF0IjoxNzc3MTUwOTE5LCJleHAiOjE3Nzc3NTU3MTl9.4givfokvRuqLaAsZwdgxWjYQL2Fq-Zf2dZ12wvARBhc"
}
```

**Respuesta (200 OK):**

```json
{
   "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
   "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Respuestas de Error:**

| Código | Descripción |
|--------|-------------|
| `401 Unauthorized` | Refresh token inválido o expirado |
| `400 Bad Request` | Token no proporcionado |

---

### 1.4. Cerrar Sesión

Invalida el token actual del usuario.

- **Método:** `POST`
- **Ruta:** `/api/auth/logout`
- **Content-Type:** `application/json`
- **Autenticación:** ✅ Requerida (`Authorization: Bearer <token>`)

**Body:** No requiere cuerpo

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| `200 OK` | Sesión cerrada exitosamente |
| `401 Unauthorized` | Token inválido o expirado |

---

## 🪪 2. Módulo de Gafetes (Badges) (`/api/v1/badge`)

### 2.1. Registrar Nuevo Badge

Registra el perfil completo de un Badge, sube la imagen a la nube (Cloudinary) y vincula a los tutores legales.

- **Método:** `POST`
- **Ruta:** `/api/v1/badge`
- **Content-Type:** `multipart/form-data`
- **Autenticación:** ✅ Requerida (`Authorization: Bearer <token>`)

**Parámetros Form-Data:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|----------|-------------|
| `file` | `File (Imagen)` | ✅ Sí | Fotografía del perfil del usuario (JPEG, PNG) |
| `data` | `JSON (Blob)` | ✅ Sí | Objeto JSON con los datos del badge y tutores |

**Estructura del campo `data`:**

```json
{
  "dni": "05371954",
  "fullName": "Victor Elias Chung Coelho",
  "dateOfBirth": "2006-03-07T10:00:00Z",
  "gender": "MASCULINO",
  "faceVector": [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0
  ],
  "guardians": [
    {
      "dni": "60751404",
      "name": "victor elias chung",
      "email": "chungcoelhove070@gmail.com",
      "phone": "987654321",
      "relationship": "PADRE"
    },
    {
      "dni": "12345678",
      "name": "Italo Fabian Vasquez Valderrama",
      "email": "italofvv1028@gmail.com",
      "phone": "912345678",
      "relationship": "MADRE"
    }
  ]
}
```

**Validaciones Críticas:**

| Validación | Descripción | Notas |
|-----------|-------------|-------|
| `faceVector` | Debe contener exactamente **128** elementos numéricos | Array de puntos biométricos faciales |
| `guardians` | Mínimo **2** registros obligatorios, máximo **3** | Posición [0]: Tutor legal principal; [1]: Tutor auxiliar; [2]: Opcional |
| `dni` | Validado contra registros externos | Debe ser válido y único |
| `guardians[*].dni` | Todos los DNIs de tutores son validados | Deben ser válidos |
| `gender` | Valores permitidos: `MASCULINO`, `FEMENINO`, `OTRO` | |

**Respuesta (200 OK):**

```json
{
   "uuid": "87031864-7bbd-4a98-832d-9427c1878427",
   "dni": "71276626",
   "fullName": "Victor Elias Chung Coelho",
   "dateOfBirth": "2006-03-07T10:00:00Z",
   "gender": "MASCULINO",
   "photoUrl": "http://res.cloudinary.com/dhfa49vfa/image/upload/v1777247795/syncastra/badges/caxmf4ejmigg8dxpbukc.png",
   "statusBadge": "NEUTRAL",
   "createdAt": "2026-04-26T23:56:35.324706200Z",
   "updatedAt": "2026-04-26T23:56:35.324706200Z",
   "guardians": [
      {
         "dni": "60751404",
         "name": "victor elias chung",
         "email": "chungcoelhove070@gmail.com",
         "phone": "987654321",
         "relationship": "PADRE"
      },
      {
         "dni": "60751404",
         "name": "Italo Fabian Vasquez Valderrama",
         "email": "italofvv1028@gmail.com",
         "phone": "912345678",
         "relationship": "MADRE"
      }
   ]
}
```

**Respuestas de Error:**

| Código | Descripción |
|--------|-------------|
| `400 Bad Request` | Validaciones fallidas (vector facial inválido, tutores insuficientes, etc.) |
| `401 Unauthorized` | Token inválido o expirado |
| `409 Conflict` | DNI ya tiene un badge registrado |

---

## 🔍 3. Módulo de Escaneo y Alertas (`/api/v1/badge/scan`)

⚠️ **IMPORTANTE PARA FRONTEND:**

Los endpoints de escaneo utilizan `multipart/form-data`. Debes enviar dos partes:
1. **`file`**: Archivo binario de imagen (JPEG, PNG)
2. **`data`**: Objeto JSON convertido a Blob

---

### 3.1. Escaneo por Reconocimiento Facial

Registra un intento de escaneo basado en un vector facial capturado por el dispositivo, cruzándolo con los datos biométricos de la base de datos.

- **Método:** `POST`
- **Ruta:** `/api/v1/badge/scan/face`
- **Content-Type:** `multipart/form-data`
- **Autenticación:** ❌ No requerida (Público)

**Parámetros Form-Data:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|----------|-------------|
| `file` | `File (Imagen)` | ✅ Sí | Fotografía del entorno o del usuario capturada durante el escaneo |
| `data` | `JSON (Blob)` | ✅ Sí | Metadatos del dispositivo, ubicación y vector facial |

**Estructura del campo `data`:**

```json
{
  "faceVector": [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0
  ],
  "latitude": -6.77137,
  "longitude": -79.84088,
  "nameDevice": "iPhone 14 Pro",
  "ipAddress": "190.235.12.34"
}
```

**Validaciones:**

| Campo | Validación |
|-------|-----------|
| `faceVector` | Array de exactamente **128** números decimales o enteros |
| `latitude` | Número entre -90 y 90 (opcional pero recomendado) |
| `longitude` | Número entre -180 y 180 (opcional pero recomendado) |
| `nameDevice` | String con identificación del dispositivo |
| `ipAddress` | Formato de dirección IPv4 válida |

**Respuesta (200 OK):**

```json
"0ff1a1c4-31bf-4e52-b475-e3450ee34081"
```

El endpoint devuelve el **UUID del reporte generado**. Este UUID es necesario para confirmar los datos del informante en el siguiente paso.

**Respuestas de Error:**

| Código | Descripción |
|--------|-------------|
| `400 Bad Request` | Vector facial inválido o datos incompletos |
| `401 Unauthorized` | No se encontró coincidencia facial que supere el umbral mínimo |
| `500 Internal Server Error` | Error al procesar el vector biométrico |

---

### 3.2. Escaneo por Código QR

Registra un escaneo directo de la tarjeta física/digital mediante su identificador único (UUID).

- **Método:** `POST`
- **Ruta:** `/api/v1/badge/scan/qr`
- **Content-Type:** `multipart/form-data`
- **Autenticación:** ❌ No requerida (Público)

**Parámetros Form-Data:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|----------|-------------|
| `file` | `File (Imagen)` | ✅ Sí | Evidencia fotográfica del lugar o del código QR escaneado |
| `data` | `JSON (Blob)` | ✅ Sí | Metadatos del dispositivo y el identificador del QR |

**Estructura del campo `data`:**

```json
{
  "qrCodeUuid": "917ae991-37b8-48fb-a0d0-d39c16dc6a36",
  "latitude": -6.77137,
  "longitude": -79.84088,
  "nameDevice": "iPhone 14 Pro",
  "ipAddress": "190.235.12.34"
}
```

**Validaciones:**

| Campo | Validación |
|-------|-----------|
| `qrCodeUuid` | UUID válido en formato estándar (debe existir en BD) |
| `latitude` | Número entre -90 y 90 (opcional pero recomendado) |
| `longitude` | Número entre -180 y 180 (opcional pero recomendado) |
| `nameDevice` | String con identificación del dispositivo |
| `ipAddress` | Formato de dirección IPv4 válida |

**Respuesta (200 OK):**

```json
"917ae991-37b8-48fb-a0d0-d39c16dc6a36"
```

El endpoint devuelve el **UUID del reporte generado**. Este UUID es necesario para confirmar los datos del informante en el siguiente paso.

**Respuestas de Error:**

| Código | Descripción |
|--------|-------------|
| `400 Bad Request` | Datos incompletos o formato inválido |
| `404 Not Found` | El UUID del QR no existe en la base de datos |
| `500 Internal Server Error` | Error al procesar la solicitud |

---

### 3.3. Confirmar Datos del Informante

Actualiza el reporte de escaneo (generado por `/scan/face` o `/scan/qr`) con la información de contacto de la persona que encontró a la persona extraviada.

- **Método:** `POST`
- **Ruta:** `/api/v1/badge/scan/{reportUuid}`
- **Content-Type:** `application/json`
- **Autenticación:** ❌ No requerida

**Variables de Ruta (Path Variable):**

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `reportUuid` | `UUID` | El UUID del reporte devuelto por `/scan/face` o `/scan/qr` |

**Estructura del Body:**

```json
{
  "dniReporter": "60751404",
  "phoneReporter": "987654321"
}
```

**Validaciones:**

| Campo | Validación | Requerido |
|-------|-----------|----------|
| `dniReporter` | DNI válido (8 dígitos típicamente) | Opcional* |
| `phoneReporter` | Número de teléfono válido | Opcional* |

> \* **Nota Crítica:** Al menos UNO de estos dos campos debe estar presente. Si ambos están vacíos, la solicitud será rechazada.

**Respuesta (200 OK):**

```json
{
  "badgeUuid": "0ff1a1c4-31bf-4e52-b475-e3450ee34081",
  "dni": "05371954",
  "fullName": "Victor Elias Chung Coelho",
  "photoUrl": "https://cloudinary.com/...",
  "gender": "MASCULINO",
  "dateOfBirth": "2006-03-07",
  "guardians": [
    {
      "dni": "60751404",
      "name": "victor elias chung",
      "email": "chungcoelhove070@gmail.com",
      "phone": "987654321",
      "relationship": "PADRE"
    },
    {
      "dni": "12345678",
      "name": "Italo Fabian Vasquez Valderrama",
      "email": "italofvv1028@gmail.com",
      "phone": "912345678",
      "relationship": "MADRE"
    }
  ]
}
```

**Respuestas de Error:**

| Código | Descripción |
|--------|-------------|
| `400 Bad Request` | Ambos campos están vacíos o datos inválidos |
| `404 Not Found` | El UUID del reporte no existe en la base de datos |
| `500 Internal Server Error` | Error al actualizar los datos |

**⚠️ Flujo Importante:**

1. Cuando se genera una alerta con `/scan/face` o `/scan/qr`, el sistema devuelve un **UUID del reporte**.
2. Este endpoint (`/scan/{reportUuid}`) **complementa** la información del reporte anterior.
3. La respuesta devuelve los **datos completos del Badge** (credencial escaneada) para que el informante pueda verificar que reportó al contacto correcto.
4. Los guardianes reciben una notificación por correo con la información de contacto del reportante (si fue proporcionada).

---

## 📝 Guía de Implementación Frontend

### Cómo Enviar multipart/form-data Correctamente

Para los endpoints que requieren `multipart/form-data`, debes usar el objeto `FormData`. Aquí te mostramos cómo hacerlo con **Fetch API** y **Axios**:

#### Opción 1: Usando Fetch API

```javascript
async function crearBadge(fileInput, datosJson, accessToken) {
  const formData = new FormData();

  // 1. Agregar archivo de imagen
  formData.append("file", fileInput.files[0]);

  // 2. Agregar datos JSON como Blob
  formData.append("data", new Blob([JSON.stringify(datosJson)], {
    type: "application/json"
  }));

  const response = await fetch('http://localhost:8080/api/v1/badge', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
      // NO incluyas 'Content-Type' aquí - el navegador lo añadirá automáticamente
    },
    body: formData
  });

  return await response.json();
}

// Uso:
const datosJson = {
  dni: "05371954",
  fullName: "Victor Elias Chung Coelho",
  // ... resto de campos ...
};

const resultado = await crearBadge(fileInputElement, datosJson, miAccessToken);
console.log(resultado);
```

#### Opción 2: Usando Axios

```javascript
async function escaneoFacial(fileInput, datosJson) {
  const formData = new FormData();

  // 1. Agregar archivo de imagen
  formData.append("file", fileInput.files[0]);

  // 2. Agregar datos JSON como Blob
  formData.append("data", new Blob([JSON.stringify(datosJson)], {
    type: "application/json"
  }));

  const response = await axios.post(
    'http://localhost:8080/api/v1/badge/scan/face',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
        // Axios configurará automáticamente el boundary
      }
    }
  );

  return response.data;
}

// Uso:
const datosEscaneo = {
   faceVector: [
      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0
   ],
  latitude: -6.77137,
  longitude: -79.84088,
  nameDevice: "iPhone 14 Pro",
  ipAddress: "190.235.12.34"
};

const reporteUuid = await escaneoFacial(fileInputElement, datosEscaneo);
console.log("Reporte creado:", reporteUuid);
```

### Notas Importantes de Implementación

1. **No establezcas `Content-Type` manualmente en headers** - El navegador/Axios lo añadirá automáticamente con el boundary correcto.
2. **Usa `Blob` para el JSON** - Esto asegura que Spring Boot lo interprete como `application/json`.
3. **El orden no importa** - Puedes agregar primero `data` y luego `file` a FormData.
4. **Valida los datos antes de enviar** - Especialmente el `faceVector` (debe tener exactamente 128 elementos) y los DNIs.
5. **Maneja errores correctamente** - Los códigos `4xx` y `5xx` indican problemas que debes reportar al usuario.

---

## 🔒 Notas Globales de Seguridad

✅ **Todos los tokens deben incluirse en las cabeceras:**

```
Authorization: Bearer <tu_access_token_aqui>
```

✅ **Validaciones de datos:**
- Los DNIs son validados contra registros externos.
- Los vectores faciales deben tener exactamente 128 elementos.
- Las contraseñas requieren 8+ caracteres, mayúsculas, minúsculas, números y caracteres especiales.

✅ **Tiempos de expiración:**
- Access Token: 1 hora (3600 segundos)
- Refresh Token: 7 días
- Usa el endpoint `/api/auth/refresh` para obtener nuevos tokens antes de que expiren.

---

## 📞 Soporte y Contacto

Para dudas sobre la implementación, contacta al equipo backend o revisa los ejemplos en esta documentación.

