#!/bin/bash
# Script de build para producción en PythonAnywhere
# Ejecutar desde la raíz del proyecto

echo "🚀 Build para PythonAnywhere"

# 1. Build del frontend
echo "📦 Construyendo frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Build completado!"
echo ""
echo "📁 Ahora sube los archivos a PythonAnywhere:"
echo "   - Backend: /home/tu_usuario/electoral2026/backend"
echo "   - Frontend (dist): /home/tu_usuario/electoral2026/frontend/dist"
echo ""
echo "🔗 Sigue la guía en DEPLOY_PYTHONANYWHERE.md para más instrucciones"
