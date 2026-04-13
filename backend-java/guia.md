# 🪪 Biometric Badge System - Backend API

Este proyecto es una API RESTful construida con **Spring Boot** y **Java** para la gestión de credenciales (Badges) e identificación biométrica. Utiliza reconocimiento facial mediante vectores de 128 dimensiones y la extensión **`pgvector`** de PostgreSQL para realizar búsquedas de similitud matemática ultrarrápidas directamente en la base de datos.

## 🚀 Tecnologías Principales

* **Java 17+**
* **Spring Boot 3.x** (Web, Data JPA)
* **PostgreSQL** + Extensión **`pgvector`**
* **Hibernate 6+** (Soporte nativo para vectores)
* **MapStruct** (Mapeo de DTOs con abstracciones avanzadas)
* **Lombok** (Reducción de boilerplate)

---

## 🧠 Arquitectura y Decisiones de Diseño

1. **Búsqueda Vectorial Nativa:** La comparación de rostros (búsqueda de similitud) no se realiza en la memoria de Java para evitar cuellos de botella. Se delega a PostgreSQL utilizando el operador de Distancia Euclidiana (`<->`).
2. **Seguridad por UUID:** Los identificadores internos (Long ID secuenciales) no se exponen al cliente para evitar ataques de enumeración. Todas las consultas públicas utilizan UUIDs.
3. **Patrón DTO Estricto:** Se utilizan `RequestDTO` y `ResponseDTO`. El vector facial de 128 dimensiones **nunca** se devuelve al frontend tras una consulta para optimizar la red y proteger la biometría.
4. **Mappers Genéricos:** Implementación de interfaces `Convert` y `UpdatePatch` con MapStruct para automatizar conversiones y actualizaciones parciales ignorando nulos.
5. **Auditoría Automática:** Fechas de creación y actualización (`createdAt`, `updatedAt`) manejadas automáticamente por `@EntityListeners(AuditingEntityListener.class)`.

---

## 🛠️ Configuración e Instalación

### 1. Base de Datos (PostgreSQL)
Asegúrate de tener PostgreSQL instalado. Antes de levantar la aplicación, es **obligatorio habilitar la extensión vectorial** ejecutando este script en tu base de datos:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Dependencia Clave (Maven)
El proyecto requiere la dependencia oficial de Hibernate para manejar los tipos de datos vectoriales de Postgres:

```xml
<dependency>
    <groupId>org.hibernate.orm</groupId>
    <artifactId>hibernate-vector</artifactId>
    <version>6.4.4.Final</version>
</dependency>
```

---

## 📡 Endpoints de la API y Estructuras JSON
La ruta base de la API es: `/api/v1/badge`

### 1. Registrar un Nuevo Usuario (con Foto Biométrica)

Crea una nueva credencial y almacena su perfil médico junto con su vector facial. Guarda el uuid retornado para generar el Código QR físico. Esta operación soporta la carga de imágenes reales en el sistema de archivos (arquitectura híbrida: procesa datos estructurados y almacenamiento físico de archivos Multipart).

**URL:** `POST /api/v1/badge`

**Content-Type:** `multipart/form-data`

#### 📂 Estructura de Almacenamiento
Las imágenes no se guardan dentro de la carpeta del backend para evitar que se borren. Se almacenan en la raíz del repositorio:
`raiz-del-repo/uploads/badge/`

#### Parámetros de la Petición

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| **`data`** | `String` (JSON) | Objeto `BadgeRequestDTO` serializado. Contiene la información personal y el vector de 128 posiciones. |
| **`file`** | `File` (Binary) | El archivo de imagen (JPG/PNG) capturado por la cámara o seleccionado por el usuario. |

**Ejemplo del JSON interno (`data`):**

```json
{
  "fullName": "Victor Elias Chung Coelho",
  "age": 20,
  "gender": "MALE",
  "bloodType": "B+",
  "allergies": "Ninguna",
  "emergencyContactName": "Contacto de Emergencia",
  "mainEmergencyPhone": "+51900000000",
  "statusBadge": "NEUTRAL",
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

**Response (201 Created):**

```json
{
  "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "fullName": "Victor Elias Chung Coelho",
  "age": 20,
  "gender": "MALE",
  "bloodType": "O+",
  "allergies": "Ninguna",
  "emergencyContactName": "Madre",
  "mainEmergencyPhone": "+51 9XX XXX XXX",
  "photo": "/api/v1/uploads/badges/uuid-generado.jpg",
  "statusBadge": "ACTIVE",
  "createdAt": "2024-05-20T10:30:00Z",
  "updatedAt": "2024-05-20T10:30:00Z"
}
```

### 🛠️ Configuración de Almacenamiento
* **application.yml**: Configurado `max-file-size` a `10MB`.
* **Resource Handler (`WebConfig.java`)**: Configurado para servir los recursos subidos.
* **Consumo Frontend**: La URL lógica devuelta por el backend puede ser consumida directamente en el frontend.

### 2. Identificación por Rostro (Cámara Biométrica)
Recibe un vector de 128 dimensiones desde la cámara y busca el rostro más similar en la BD.

**URL:** `POST /api/v1/badge/identify`

**Request Body:**

```json
[
  0.12349, -0.09870, 0.45680, -0.11120, 0.33440,
  "...",
  "Nota: Enviar directamente el array de 128 floats."
]
```

**Response (200 OK):** Devuelve la ficha médica completa (`BadgeResponseDTO`) idéntica a la del registro, si la coincidencia es segura.

**Response (401 Unauthorized):** Si el rostro es desconocido o la distancia supera el límite de seguridad (0.6).

### 3. Consulta por Código QR (UUID)
Recupera la información pública de una credencial de forma instantánea usando el escáner de QR (sin necesidad de enviar JSON en el Body).

**URL:** `GET /api/v1/badge/uuid/{uuid}`

**Ejemplo:** `GET /api/v1/badge/uuid/f47ac10b-58cc-4372-a567-0e02b2c3d479`

**Response (200 OK):**

```json
{
  "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "fullName": "Juan Carlos Pérez",
  "age": 35,
  "gender": "MALE",
  "bloodType": "O+",
  "allergies": "Penicilina, Nueces",
  "emergencyContactName": "María Gómez",
  "mainEmergencyPhone": "+51987654321",
  "alternativeEmergencyPhone": "+51912345678",
  "photo": "https://mi-storage.com/fotos/juan-perez.jpg",
  "statusBadge": "ACTIVE",
  "createdAt": "2024-05-20T10:30:00Z",
  "updatedAt": "2024-05-20T10:30:00Z"
}
```

---

## 🧩 Estructura de MapStruct
El proyecto utiliza una configuración global estricta (`GlobalMapperConfig`) y abstracciones para simplificar los mappers:

- `Convert<M, DRQ, DRE>`: Interfaz base para `toModel` y `toDTO`.
- `UpdatePatch<DRQ, T>`: Permite actualizaciones parciales ignorando valores nulos en el `RequestDTO`.

El `BadgeMapper` funciona de manera completamente automática gracias a la convención de nombres (camelCase) y la configuración que ignora atributos no mapeados (como el `faceVector` al responder).

---

## 📐 Lógica Matemática de Similitud
El repositorio JPA utiliza una consulta SQL nativa respaldada por índices vectoriales para garantizar tiempos de respuesta de milisegundos:

```sql
SELECT id, (face_vector <-> CAST(:embedding AS vector)) as distance
FROM badge 
ORDER BY distance LIMIT 1
```

- El operador `<->` calcula la **Distancia Euclidiana**.
- Valores cercanos a `0.0` indican que las caras son idénticas.
- El límite predeterminado del sistema (`MATCH_THRESHOLD`) es `0.6`. Todo valor superior se rechaza asumiendo que no es la misma persona.
