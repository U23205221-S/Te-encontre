# Ejecutar la aplicación (backend-java)

Este documento explica, de forma breve y práctica, cómo iniciar la aplicación del backend localizada en este directorio.

## Requisitos previos

- Tener instalado Java (JDK) compatible con el proyecto.
- Maven está incluido como wrapper (`mvnw` / `mvnw.cmd`) en el repositorio; no es obligatorio tener Maven globalmente.
- Opcional: Docker y Docker Compose si prefieres ejecutar con contenedores.
- En Windows, puedes usar PowerShell, Git Bash o WSL para ejecutar scripts tipo Unix.

## Opciones para ejecutar

### 1) Linux / macOS

- Dar permiso de ejecución al script y lanzarlo:

  ```bash
  chmod +x start.sh
  ./start.sh
  ```

- Alternativa si no quieres cambiar permisos:

  ```bash
  sh start.sh
  ```

### 2) Windows (PowerShell)

- Usar el wrapper de Maven incluido:

  ```powershell
  .\mvnw.cmd spring-boot:run
  ```

- También puedes ejecutar el script `start.sh` desde Git Bash o WSL:

  ```bash
  ./start.sh
  ```

### 3) Con Docker Compose

- Si prefieres levantar la aplicación con Docker (requiere Docker instalado):

  ```bash
  docker-compose up --build
  ```

## Solución de problemas comunes

- Permiso denegado al ejecutar `./start.sh`: usa `chmod +x start.sh` o ejecuta `sh start.sh`.
- Java no encontrado / versión incorrecta: instala o selecciona un JDK compatible.
- Puerto en uso: revisa que el puerto configurado en `application.yaml` esté libre o cámbialo.
- Docker: asegúrate de que el demonio de Docker esté en ejecución antes de `docker-compose up`.

## Notas

- El script `start.sh` normalmente usa el wrapper de Maven (`./mvnw`) para compilar y arrancar la aplicación; por eso no es necesario tener Maven instalado globalmente.
- Si necesitas pasos más específicos (variables de entorno, base de datos, credenciales), indica qué entorno (desarrollo/producción) y preparo instrucciones adicionales.
