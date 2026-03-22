# ============================================
# WSGI Configuration for PythonAnywhere
# Sitio: giovann.pythonanywhere.com
# Archivo: /var/www/giovann_pythonanywhere_com_wsgi.py
# ============================================

import sys
import os

# ============================================
# CONFIGURACIÓN DE RUTAS
# ============================================
username = 'giovann'
project_home = f'/home/{username}/elec2026-web'

if project_home not in sys.path:
    sys.path.insert(0, project_home)

backend_path = os.path.join(project_home, 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# ============================================
# VARIABLES DE ENTORNO
# ============================================
os.environ['PYTHONANYWHERE'] = 'true'
os.environ['SECRET_KEY'] = 'elecciones2026-secreto-muy-seguro'
os.environ['DB_HOST'] = 'giovann.mysql.pythonanywhere-services.com'
os.environ['DB_NAME'] = 'giovann$elec2026'
os.environ['DB_USER'] = 'giovann'
os.environ['DB_PASSWORD'] = 'libre2026!!'
os.environ['DB_PORT'] = '3306'
os.environ['CORS_ORIGIN'] = 'https://giovann.pythonanywhere.com'
os.environ['DEBUG'] = 'False'

# ============================================
# IMPORTAR LA APLICACIÓN
# ============================================
from web import app as fastapi_app

# asgiref convierte ASGI (FastAPI) a WSGI (PythonAnywhere)
from asgiref.wsgi import WsgiToAsgi

application = WsgiToAsgi(fastapi_app)
