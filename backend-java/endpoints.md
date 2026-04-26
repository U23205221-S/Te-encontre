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

Dispara una alerta basada en el vector biométrico del rostro detectado.

- **Método:** `POST`
- **Ruta:** `/api/v1/badge/scan/face`
- **Content-Type:** `multipart/form-data`
- **Autenticación:** No requerida (Pública)

**FormData (Parámetros):**

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `data` | `application/json` | Objeto JSON con los datos del vector y el reporte. |
| `file` | File (Imagen) | Fotografía tomada en el momento del reporte. |

**Estructura del campo `data` (JSON):**

```json
{
  "faceVector": [
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0
  ],
  "dniReporter": "76543210",
  "fullNameReporter": "Luis Angel Anampa",
  "phoneReporter": "+51987654321",
  "nameDevice": "iPhone 14 Pro",
  "ipAddress": "190.235.12.34"
}
```

---

### 2.2. Escaneo por Código QR

Dispara una alerta basada en el UUID contenido en el código QR escaneado.

- **Método:** `POST`
- **Ruta:** `/api/v1/badge/scan/qr`
- **Content-Type:** `multipart/form-data`
- **Autenticación:** No requerida (Pública)

**FormData (Parámetros):**

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `data` | `application/json` | Objeto JSON con el UUID y la ubicación. |
| `file` | File (Imagen) | Fotografía tomada en el momento del reporte. |

**Estructura del campo `data` (JSON):**

```json
{
  "qrCodeUuid": "6a593901-9386-402e-b1bf-d93a736ffb0f",
  "latitude": -6.77137,
  "longitude": -79.84088,
  "dniReporter": "76543210",
  "fullNameReporter": "Luis Angel Anampa",
  "phoneReporter": "+51987654321",
  "nameDevice": "iPhone 14 Pro",
  "ipAddress": "190.235.12.34"
}
```

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

