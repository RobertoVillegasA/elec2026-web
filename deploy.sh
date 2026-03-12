#!/bin/bash

# ============================================
# Script de Despliegue Rápido
# ============================================

set -e

echo "🚀 Sistema Electoral Bolivia 2026 - Despliegue"
echo "=============================================="
echo ""

# Detectar plataforma
if [ -n "$RAILWAY" ]; then
    echo "📍 Detectado: Railway"
    export PORT=${PORT:-8000}
    exec gunicorn web:app --worker-class uvicorn.workers.UvicornWorker --workers 2 --threads 4 --bind 0.0.0.0:$PORT
elif [ -n "$RENDER" ]; then
    echo "📍 Detectado: Render"
    export PORT=${PORT:-8000}
    exec gunicorn web:app --worker-class uvicorn.workers.UvicornWorker --workers 2 --threads 4 --bind 0.0.0.0:$PORT
elif [ -n "$PYTHONANYWHERE" ]; then
    echo "📍 Detectado: PythonAnywhere"
    echo "Usa la configuración WSGI en el panel de control"
else
    echo "📍 Servidor genérico/VPS"
    echo ""
    echo "Opciones:"
    echo "  1. Despliegue con systemd"
    echo "  2. Despliegue con Docker"
    echo "  3. Ejecución directa (desarrollo)"
    echo ""
    read -p "Selecciona una opción [1-3]: " option
    
    case $option in
        1)
            echo "Consulta SERVER_CONFIG.md para configuración systemd"
            ;;
        2)
            echo "Iniciando con Docker Compose..."
            docker-compose up -d
            ;;
        3)
            echo "Iniciando en modo desarrollo..."
            python web.py
            ;;
        *)
            echo "Opción inválida"
            exit 1
            ;;
    esac
fi
