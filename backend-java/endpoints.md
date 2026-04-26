# Documentación de API - TE ENCONTRÉ

**URL Base:** `http://localhost:8080`

---

## 🔑 Notas Globales de Autenticación

Los endpoints que requieren autenticación deben incluir el Access Token en las cabeceras (Headers) de la petición HTTP usando el esquema Bearer:

```
Authorization: Bearer <tu_access_token_aqui>
```

---

## 1. Autenticación (Auth)

### 1.1. Registrar Usuario

Crea una nueva cuenta en el sistema.

- **Método:** `POST`
- **Ruta:** `/api/auth/register`
- **Content-Type:** `application/json`
- **Autenticación:** No requerida

**Body:**

```json
{
  "dni": "60751404",
  "email": "chungcoelhove070@gmail.com",
  "passwordHash": "SHccVE07@",
  "confirmPasswordHash": "SHccVE07@"
}
```

---

### 1.2. Iniciar Sesión

Autentica al usuario y devuelve los tokens de acceso.

- **Método:** `POST`
- **Ruta:** `/api/auth/login`
- **Content-Type:** `application/json`
- **Autenticación:** No requerida

**Body:**

```json
{
  "dni": "60751404",
  "passwordHash": "SHccVE07@"
}
```

---

### 1.3. Cerrar Sesión (Logout)

Invalida el token actual del usuario.

- **Método:** `POST`
- **Ruta:** `/api/auth/logout`
- **Autenticación:** Requerida (`Authorization: Bearer <token>`)
- **Body:** No requiere cuerpo (el backend identifica la sesión mediante el token en la cabecera)

---

### 1.4. Refrescar Token

Obtiene un nuevo Access Token válido utilizando un Refresh Token activo.

- **Método:** `POST`
- **Ruta:** `/api/auth/refresh`
- **Content-Type:** `application/json`
- **Autenticación:** No requerida

**Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2MDc1MTQwNCIsInV1aWQiOiJiYmRkNDIzYi1kMzlkLTQ4MTgtOTI2ZS0wMDRlMzI0ZjgzMTAiLCJpYXQiOjE3NzcxNTA5MTksImV4cCI6MTc3Nzc1NTcxOX0.4givfokvRuqLaAsZwdgxWjYQL2Fq-Zf2dZ12wvARBhc"
}
```

---

## 2. Escaneo y Alertas (Badge Scan)

⚠️ **IMPORTANTE PARA FRONTEND (Multipart/form-data):**

Para los siguientes 3 endpoints, no se envía un JSON plano. Se debe usar un objeto `FormData` en JavaScript. La parte `data` debe enviarse como un Blob de tipo `application/json` (o un string JSON parseable, dependiendo de la configuración exacta de Spring Boot), y la parte `file` es el archivo binario de la imagen.

---

### 2.1. Escaneo por Reconocimiento Facial

Recibe un vector biométrico facial y una fotografía para intentar identificar a la persona encontrada. Si la similitud supera el umbral establecido, se registra la alerta de ubicación y se notifica a los guardianes asignados.

- **Método:** `POST`
- **Ruta:** `/api/v1/badge/scan/face`
- **Content-Type:** `multipart/form-data`
- **Autenticación:** No requerida (Pública)

**FormData (Parámetros):**

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `data` | `application/json` | Objeto ScanAlertRequestDTO con los datos del vector biométrico y ubicación. |
| `file` | File (Imagen) | Fotografía tomada en el lugar del hallazgo (JPEG, PNG, etc). |

**Estructura del campo `data` (ScanAlertRequestDTO):**

```json
{
  "faceVector": [
    0.1543, -0.8765, 0.4321, 0.9876, -0.1234, ...
  ],
  "latitude": -6.77137,
  "longitude": -79.84088,
  "nameDevice": "iPhone 14 Pro",
  "ipAddress": "190.235.12.34"
}
```

**Notas Importantes:**

- El `faceVector` es un array numérico que representa la extracción biométrica facial (típicamente 128 o 512 dimensiones).
- `latitude` y `longitude` son opcionales pero recomendados para establecer el punto de geolocalización del reporte.
- `nameDevice` e `ipAddress` ayudan a rastrear desde qué dispositivo se generó la alerta.

**Respuestas:**

| Código | Descripción | Body |
|--------|-------------|------|
| `200 OK` | El rostro coincidió con un Badge registrado. Alerta disparada. | `"3a2daae0-dd34-4857-b146-5c0405dda911"` (UUID de la alerta generada) |
| `401 Unauthorized` | No se encontró ninguna coincidencia biométrica que supere el umbral mínimo establecido. | Mensaje de error |

**⚠️ Flujo Importante:**

1. Este endpoint **devuelve solo el UUID de la alerta generada** en la respuesta `200 OK`.
2. Los datos completos del Badge (credencial escaneada) **no se devuelven en esta primera petición**.
3. Para obtener los datos del Badge, el cliente debe:
   - Llamar al endpoint `2.3` (Actualizar Datos del Reportante) con el UUID de la alerta
   - En la respuesta del endpoint `2.3` recibirá el `BadgeResponseDTO` con los datos completos de la credencial

---

### 2.2. Escaneo por Código QR

Se activa cuando alguien escanea físicamente el código QR de la credencial. Busca la credencial por su UUID, registra la ubicación y envía la alerta de emergencia a los guardianes.

- **Método:** `POST`
- **Ruta:** `/api/v1/badge/scan/qr`
- **Content-Type:** `multipart/form-data`
- **Autenticación:** No requerida (Pública)

**FormData (Parámetros):**

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `data` | `application/json` | Objeto ScanAlertRequestDTO con el UUID del QR y ubicación. |
| `file` | File (Imagen) | Fotografía tomada en el lugar del hallazgo (JPEG, PNG, etc). |

**Estructura del campo `data` (ScanAlertRequestDTO):**

```json
{
  "qrCodeUuid": "3c2160f8-8c1a-4556-a901-1a3400a79125",
  "latitude": -6.77137,
  "longitude": -79.84088,
  "nameDevice": "iPhone 14 Pro",
  "ipAddress": "190.235.12.34"
}
```

**Notas Importantes:**

- El `qrCodeUuid` es el identificador único extraído del código QR que se escanea.
- `latitude` y `longitude` registran la ubicación geográfica donde se encontró la credencial.
- Este endpoint es directo: si el UUID existe en la base de datos, la alerta se dispara automáticamente.

**Respuestas:**

| Código | Descripción | Body |
|--------|-------------|------|
| `200 OK` | El QR es válido y la alerta se ha enviado a los guardianes. | `"3a2daae0-dd34-4857-b146-5c0405dda911"` (UUID de la alerta generada) |
| `404 Not Found` | El UUID proporcionado no existe en la base de datos de credenciales. | Mensaje de error |

**⚠️ Flujo Importante:**

1. Este endpoint **devuelve solo el UUID de la alerta generada** en la respuesta `200 OK`.
2. Los datos completos del Badge (credencial escaneada) **no se devuelven en esta primera petición**.
3. Para obtener los datos del Badge, el cliente debe:
   - Llamar al endpoint `2.3` (Actualizar Datos del Reportante) con el UUID de la alerta
   - En la respuesta del endpoint `2.3` recibirá el `BadgeResponseDTO` con los datos completos de la credencial

---

### 2.3. Actualizar Datos del Reportante

Permite a la persona que encontró al familiar (y que generó la alerta previa) proporcionar sus datos de contacto. Si se proporciona al menos uno de los dos datos (DNI o Teléfono), el sistema enviará un correo adicional a los guardianes con esta información de contacto.

- **Método:** `POST`
- **Ruta:** `/api/v1/badge/scan/{uuid_de_la_alerta}`
- **Content-Type:** `application/json`
- **Autenticación:** No requerida

**Parámetros de la URL (Path Variable):**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `uuid_de_la_alerta` | `UUID` | El identificador de la alerta generada en `/scan/face` o `/scan/qr`. |

**Body de la Petición (ScanAlertPart2RequestDTO):**

```json
{
  "dniReporter": "60751404",
  "phoneReporter": "924781609"
}
```

**Notas Importantes:**

- Ambos campos (`dniReporter` y `phoneReporter`) son **opcionales**, pero al menos uno debe estar presente.
- El correo de notificación solo se enviará si se proporciona información válida en al menos uno de los campos.
- Este endpoint se utiliza como un segundo paso después de generar una alerta (ya sea por cara o QR).

**Respuestas:**

| Código | Descripción | Body |
|--------|-------------|------|
| `200 OK` | Los datos se actualizaron correctamente. | `BadgeResponseDTO` (Datos públicos de la credencial escaneada) |
| `404 Not Found` | El UUID de la alerta no existe en la base de datos. | Mensaje de error |

---

## 3. Gestión de Credenciales (Badge)

### 3.1. Registrar Nuevo Badge

Crea una nueva credencial de seguridad (Badge) y la asocia al usuario autenticado y a sus tutores legales.

- **Método:** `POST`
- **Ruta:** `/api/v1/badge`
- **Content-Type:** `multipart/form-data`
- **Autenticación:** Requerida (`Authorization: Bearer <token>`)

**FormData (Parámetros):**

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `data` | `application/json` | Datos médicos, personales, vector biométrico y tutores. |
| `file` | File (Imagen) | Fotografía de perfil para la credencial. |

**Estructura del campo `data` (JSON):**

```json
{
  "dni": "78945632",
  "fullName": "Victor Elias Chung Coelho",
  "dateOfBirth": "2006-03-07T10:00:00Z",
  "gender": "MASCULINO",
  "bloodType": "O+",
  "allergies": "Penicilina",
  "statusBadge": "NEUTRAL",
  "faceVector": [
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0
  ],
  "guardians": [
    {
      "dni": "12345678",
      "name": "israel cubas gastulo",
      "email": "u23271982@gmail.com",
      "phone": "+51987654321",
      "relationship": "PADRE"
    },
    {
      "dni": "98765432",
      "name": "Italo Fabian Vasquez Valderrama",
      "email": "italofvv1028@gmail.com",
      "phone": "+51912345678",
      "relationship": "MADRE"
    },
    {
      "dni": "42345678",
      "name": "Renzo Sandoval Mio",
      "email": "renzosa1906@gmail.com",
      "phone": "+51999888777",
      "relationship": "TIO"
    }
  ]
}
```

**Notas sobre Tutores Legales:**

| Posición | Requerido | Descripción |
|----------|-----------|-------------|
| `guardians[0]` | ✅ Sí | Tutor legal principal (representante legal). |
| `guardians[1]` | ✅ Sí | Segundo tutor legal (contacto auxiliar obligatorio). |
| `guardians[2]` | ❌ No | Tercer contacto auxiliar (opcional). |

---

## 💡 Tip para el equipo Frontend

Para enviar correctamente los endpoints de tipo `multipart/form-data` usando la API fetch o Axios, el código debe verse similar a esto:

```javascript
const formData = new FormData();

// 1. Agregar el archivo (imagen)
formData.append("file", inputFoto.files[0]);

// 2. Agregar el JSON como un Blob para que Spring Boot lo lea como application/json
const dataJson = {
  // ... tu objeto json aquí ...
};
formData.append("data", new Blob([JSON.stringify(dataJson)], {
  type: "application/json"
}));

// 3. Enviar (NO establecer Content-Type manualmente, el navegador lo hará añadiendo el boundary)
fetch('http://localhost:8080/api/v1/badge', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});
```

