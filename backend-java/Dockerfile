# ETAPA 1: Construcción y Extracción de Capas
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /build

# 1. Cachear dependencias (ya no necesitamos el prefijo porque ya estamos en la carpeta correcta)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 2. Construir el microservicio
COPY src ./src
RUN mvn clean package -DskipTests

# 3. Extraer capas para optimizar el cache de Docker
RUN java -Djarmode=layertools -jar target/*.jar extract --destination extracted

# ETAPA 2: Ejecución (Runtime)
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -g 1001 -S appgroup && adduser -S -u 10001 -G appgroup appuser
USER appuser
WORKDIR /app

# Copiamos las capas extraídas del builder
COPY --from=builder /build/extracted/dependencies/ ./
COPY --from=builder /build/extracted/spring-boot-loader/ ./
COPY --from=builder /build/extracted/snapshot-dependencies/ ./
COPY --from=builder /build/extracted/application/ ./

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]