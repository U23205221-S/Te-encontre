#!/bin/bash

echo "🚀 Iniciando el entorno de desarrollo..."

# 1. Verificar si el archivo .env existe antes de continuar
if [ ! -f .env ]; then
    echo "❌ Error: No se encontró el archivo .env."
    echo "Por favor, crea el archivo .env con las credenciales necesarias antes de ejecutar este script."
    exit 1
fi

# 2. Limpiar saltos de línea de Windows (CRLF a LF) para evitar errores en Docker/Arch Linux
echo "🧹 Normalizando el archivo .env..."
sed -i 's/\r$//' .env

# 3. Construir y levantar los contenedores de Docker
echo "🐳 Levantando la infraestructura (Base de datos, Caché, Backend)..."
docker compose up --build