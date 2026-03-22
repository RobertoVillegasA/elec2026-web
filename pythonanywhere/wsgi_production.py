# ============================================
# WSGI Configuration for PythonAnywhere
# ============================================
# Sitio: giovann.pythonanywhere.com
# Archivo: /var/www/giovann_pythonanywhere_com_wsgi.py
# ============================================

import sys
import os
import traceback

# ============================================
# CONFIGURACIÓN DE RUTAS
# ============================================
username = 'giovann'
project_home = f'/home/{username}/elec2026-web'

# Agregar el proyecto al path de Python
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Agregar backend al path
backend_path = os.path.join(project_home, 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# ============================================
# VARIABLES DE ENTORNO
# ============================================

# 🔑 SECRET_KEY - Genera una nueva con: python -c "import secrets; print(secrets.token_urlsafe(32))"
os.environ['SECRET_KEY'] = 'electoral_2026_bolivia_segura_clave_temporal_giovann_2026'

# Base de datos PythonAnywhere
os.environ['DB_HOST'] = 'giovann.mysql.pythonanywhere-services.com'
os.environ['DB_NAME'] = 'giovann$elec2026'
os.environ['DB_USER'] = 'giovann'
os.environ['DB_PASSWORD'] = 'TU_CONTRASENA_AQUI'  # ← CAMBIA ESTO por tu contraseña real
os.environ['DB_PORT'] = '3306'

# CORS - Tu dominio en PythonAnywhere
os.environ['CORS_ORIGIN'] = 'https://giovann.pythonanywhere.com'

# Configuración de la app
os.environ['DEBUG'] = 'False'
os.environ['LOG_LEVEL'] = 'INFO'

# ============================================
# IMPORTAR LA APLICACIÓN
# ============================================
# Nota: Importar desde web.py (no main.py) porque web.py es el entry point
try:
    from web import app as application  # web.py contiene el punto de entrada principal
    application.title = "Sistema Electoral Bolivia 2026"

except Exception as e:
    from fastapi import FastAPI
    application = FastAPI(title="Error")

    @application.get("/")
    def error_page():
        return {
            "error": "Error al cargar la aplicación",
            "detail": str(e),
            "traceback": traceback.format_exc(),
            "project_home": project_home,
            "sys_path": sys.path[:5]
        }

    @application.get("/health")
    def health_error():
        return {"status": "error", "detail": str(e)}
