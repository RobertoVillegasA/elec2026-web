# =============================================================================
# WSGI Configuration for PythonAnywhere
# =============================================================================
# INSTRUCCIONES:
# 1. Copia este archivo a: /var/www/tu_usuario_pythonanywhere_com_wsgi.py
# 2. Reemplaza 'tu_usuario' con tu usuario de PythonAnywhere
# 3. Reemplaza 'tu_contraseña' con tu contraseña de MySQL
# =============================================================================

import sys
import os

# -----------------------------------------------------------------------------
# CONFIGURACIÓN - MODIFICA ESTOS VALORES
# -----------------------------------------------------------------------------
USERNAME = 'tu_usuario'              # Tu usuario de PythonAnywhere
PASSWORD = 'tu_contraseña'           # Tu contraseña de MySQL
DB_NAME = 'electoral2026'            # Nombre de tu base de datos
# -----------------------------------------------------------------------------

# Project paths
project_home = f'/home/{USERNAME}/electoral2026/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Environment variables for database
os.environ['DB_HOST'] = f'{USERNAME}.mysql.pythonanywhere-services.com'
os.environ['DB_NAME'] = f'{USERNAME}${DB_NAME}'
os.environ['DB_USER'] = USERNAME
os.environ['DB_PASSWORD'] = PASSWORD

# Import FastAPI app
from main import app as application

# Convert ASGI to WSGI for PythonAnywhere compatibility
from asgiref.wsgi import WsgiToAsgi
application = WsgiToAsgi(application)

# Debug (opcional - comentar en producción)
# print(f"✅ WSGI loaded for user: {USERNAME}")
# print(f"✅ DB Host: {os.environ['DB_HOST']}")
# print(f"✅ DB Name: {os.environ['DB_NAME']}")
