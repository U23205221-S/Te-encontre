# 🪪 Sync Astra - Biometric Badge & Auth API

Este proyecto es una API RESTful construida con **Spring Boot** y **Java** para la gestión de credenciales (Badges), identificación biométrica, sistema de alertas de geolocalización y autenticación segura. Utiliza reconocimiento facial mediante vectores de 128 dimensiones y la extensión **`pgvector`** de PostgreSQL para realizar búsquedas de similitud matemática ultrarrápidas.

## 🚀 Tecnologías Principales

- **Java 17/21**
- **Spring Boot 3.x** (Web, Data JPA, Security)
- **PostgreSQL** + Extensión **`pgvector`** (Para cálculos de distancia Euclidiana `<->`)
- **Redis** (Gestión de estado de JWT y aniquilador de sesiones)
- **Hibernate 6+** (Soporte nativo vectorial)
- **MapStruct & Lombok** (Mapeo de DTOs y reducción de boilerplate)
- **JavaMailSender** (Envío asíncrono de alertas de ubicación)

---

## 🛠️ Configuración Previa (Para el equipo)

### PostgreSQL
Es **obligatorio** habilitar la extensión vectorial en tu base de datos local antes de levantar el backend:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Redis
Debes tener un servidor Redis corriendo en **`localhost:6379`** (por defecto). Sin esto, el inicio de sesión fallará.

---

## 🧠 Arquitectura y Decisiones de Diseño

1. **Búsqueda Vectorial Nativa:** La comparación de rostros se delega a PostgreSQL utilizando el operador de Distancia Euclidiana (`<->`).
2. **Seguridad por UUID:** Los identificadores internos (Long ID) no se exponen al cliente para evitar ataques de enumeración.
3. **Patrón DTO Estricto:** Se utilizan `RequestDTO` y `ResponseDTO`. El vector facial de 128 dimensiones **nunca** se devuelve tras una consulta para optimizar red y seguridad.
4. **Mappers Genéricos:** Implementación de interfaces `Convert` y `UpdatePatch` con MapStruct para automatizar conversiones.
5. **Auditoría Automática:** Fechas de creación y actualización (`createdAt`, `updatedAt`) manejadas automáticamente.

---

## 🔐 Sistema de Seguridad con JWT

### Flujo de Autenticación
Todos los endpoints privados requieren un token JWT válido en el header `Authorization`:

```
Header: Authorization
Value: Bearer <tu_access_token>
```

**Características:**
- **Access Token:** Válido por 15 minutos (acceso a recursos).
- **Refresh Token:** Válido por 7 días (obtener nuevo access token sin credenciales).
- **Redis Blacklist:** Los tokens invalidados se guardan en Redis durante su tiempo de expiración.

---

## 📡 Endpoints de la API

### 🔓 1. Módulo de Autenticación (`/api/auth`)

#### 1.1 Registrar un Usuario (Auto-Login)

Crea una cuenta nueva y devuelve la sesión iniciada inmediatamente.

- **Método:** `POST`
- **URL:** `/api/auth/register`
- **Acceso:** Público
- **Body:**

```json
{
  "userName": "padre@ejemplo.com",
  "dni": "70000000",
  "passwordHash": "MiPassword123",
  "confirmPasswordHash": "MiPassword123"
}
```

- **Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 1.2 Iniciar Sesión (Login)

- **Método:** `POST`
- **URL:** `/api/auth/login`
- **Acceso:** Público
- **Body:**

```json
{
  "userName": "padre@ejemplo.com",
  "passwordHash": "MiPassword123"
}
```

- **Response (200 OK):** Devuelve `accessToken` y `refreshToken`.

#### 1.3 Refrescar Sesión

Cuando el `accessToken` expira (15 mins), usa este endpoint para obtener uno nuevo sin pedir contraseña.

- **Método:** `POST`
- **URL:** `/api/auth/refresh`
- **Acceso:** Público
- **Body:**

```json
{
  "refreshToken": "<tu_refresh_token_guardado>"
}
```

- **Response (200 OK):** Devuelve nuevo `accessToken` y el mismo `refreshToken`.

#### 1.4 Cerrar Sesión (Logout)

Invalida los tokens en Redis inmediatamente.

- **Método:** `POST`
- **URL:** `/api/auth/logout`
- **Acceso:** Privado (Requiere JWT válido)
- **Body:** Ninguno (El usuario se extrae del token)
- **Response (200 OK):** `"Sesión cerrada exitosamente"`

---

### 🪪 2. Módulo de Gafetes y Escaneo (`/api/v1/badge`)

#### 2.1 Registrar un Nuevo Gafete (Multipart)

Crea la credencial de un familiar y guarda su vector facial. Se asocia automáticamente al usuario logueado.

- **Método:** `POST`
- **URL:** `/api/v1/badge`
- **Acceso:** Privado (Requiere JWT)
- **Content-Type:** `multipart/form-data`

**Parámetros:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `file` | `File` | Imagen/foto capturada (JPG/PNG) |
| `data` | `Text/JSON` | Objeto JSON con la información del gafete |

**JSON en `data`:**

```json
{
  "fullName": "Victor Chung",
  "age": 20,
  "gender": "MALE",
  "bloodType": "O+",
  "allergies": "Ninguna",
  "emergencyContactName": "Madre",
  "mainEmergencyPhone": "+51900000000",
  "statusBadge": "ACTIVE",
  "faceVector": [
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0
  ]
}
```

- **Response (201 Created):**

```json
{
  "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "fullName": "Victor Chung",
  "age": 20,
  "gender": "MALE",
  "bloodType": "O+",
  "allergies": "Ninguna",
  "emergencyContactName": "Madre",
  "mainEmergencyPhone": "+51900000000",
  "photo": "/api/v1/uploads/badges/uuid-generado.jpg",
  "statusBadge": "ACTIVE",
  "createdAt": "2024-05-20T10:30:00Z",
  "updatedAt": "2024-05-20T10:30:00Z"
}
```

📂 **Almacenamiento:** Las imágenes se guardan en `raiz-del-repo/uploads/badge/`

#### 2.2 Escaneo por Reconocimiento Facial (Auditoría + Alerta)

Compara el rostro capturado con la BD. Si hay coincidencia (< 0.6 distancia), envía email de ubicación al familiar y guarda auditoría.

- **Método:** `POST`
- **URL:** `/api/v1/badge/scan/face`
- **Acceso:** Privado (Requiere JWT del escaneador/policía/serenazgo)
- **Body:**

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
  "latitude": -6.77137,
  "longitude": -79.84088
}
```

- **Response (200 OK):** Devuelve la ficha pública médica para mostrar en pantalla.
- **Response (401 Unauthorized):** Si el rostro no coincide o la distancia > 0.6.

#### 2.3 Escaneo por Código QR (Auditoría + Alerta)

Busca el gafete por UUID. Genera alerta, envía email con Google Maps y guarda auditoría.

- **Método:** `GET`
- **URL:** `/api/v1/badge/scan/qr`
- **Acceso:** Privado (Requiere JWT del escaneador)
- **Body:**

```json
{
  "qrCodeUuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "latitude": -6.77137,
  "longitude": -79.84088
}
```

⚠️ **Aviso para Frontend:** Este endpoint es `GET` pero requiere `@RequestBody`. Librerías como `fetch` o `axios` bloquean el body en GET. **Soluciones:**
- Cambiar Backend a `POST` (recomendado)
- Enviar datos como Query Parameters
- Usar Postman/Insomnia para testing (sí permite body en GET)

#### 2.4 Consulta por Código QR (Pública)

Recupera información de una credencial usando UUID (ideal para lectores QR simples).

- **Método:** `GET`
- **URL:** `/api/v1/badge/uuid/{uuid}`
- **Acceso:** Privado (Requiere JWT)
- **Ejemplo:** `GET /api/v1/badge/uuid/f47ac10b-58cc-4372-a567-0e02b2c3d479`
- **Response (200 OK):**

```json
{
  "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "fullName": "Juan Carlos Pérez",
  "age": 35,
  "gender": "MALE",
  "bloodType": "O+",
  "allergies": "Penicilina",
  "emergencyContactName": "María Gómez",
  "mainEmergencyPhone": "+51987654321",
  "photo": "http://localhost:8080/uploads/badge/juan-perez.jpg",
  "statusBadge": "ACTIVE"
}
```

---

## 📊 Respuesta Exitosa Unificada (Endpoints 2.2 y 2.3)

Cuando un escaneo (facial o QR) es exitoso, se devuelve:

```json
{
  "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "fullName": "Juan Carlos Pérez",
  "age": 35,
  "gender": "MALE",
  "bloodType": "O+",
  "allergies": "Penicilina",
  "emergencyContactName": "María Gómez",
  "mainEmergencyPhone": "+51987654321",
  "photo": "http://localhost:8080/uploads/badge/juan-perez.jpg",
  "statusBadge": "ACTIVE"
}
```

**Acciones Automáticas en Background:**
- ✅ Se guarda auditoría con IP, ubicación y escaneador
- 📧 Se envía email al contacto de emergencia con enlace de Google Maps
- 📍 Se registra geolocalización en la base de datos

---

## 📐 Lógica Matemática de Similitud

El repositorio JPA utiliza consulta SQL nativa respaldada por índices vectoriales:

```sql
SELECT id, (face_vector <-> CAST(:embedding AS vector)) as distance
FROM badge 
ORDER BY distance LIMIT 1
```

- El operador `<->` calcula **Distancia Euclidiana**
- Valores cercanos a `0.0` = caras idénticas
- **Umbral del sistema:** `0.6` (valores superiores se rechazan)

---

## 📝 Tablas de Referencia Rápida

### Headers Requeridos (Endpoints Privados)
```
Authorization: Bearer <access_token>
```

### Estados de Badge
- `ACTIVE` - Persona autorizada
- `INACTIVE` - Persona desactivada
- `NEUTRAL` - Sin clasificar

### Códigos HTTP Comunes
| Código | Significado |
|--------|-------------|
| 200 | Éxito |
| 201 | Recurso creado |
| 400 | Error en solicitud |
| 401 | Token inválido/expirado o rostro no encontrado |
| 403 | Acceso denegado |
| 500 | Error del servidor |
