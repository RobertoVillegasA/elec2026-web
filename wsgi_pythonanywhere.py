# ============================================
# WSGI Configuration for PythonAnywhere
# ============================================
# Copia este contenido en tu archivo WSGI en:
# /var/www/tu_usuario_pythonanywhere_com_wsgi.py
# ============================================

import sys
import os

# Agregar el proyecto al path
project_home = '/home/tu_usuario/elec2026-web'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Agregar backend al path
backend_path = os.path.join(project_home, 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Configurar variables de entorno
# IMPORTANTE: Reemplaza con tus valores reales
os.environ['SECRET_KEY'] = 'tu_clave_secreta_generada_con_python_secrets_token_urlsafe_32'
os.environ['DB_HOST'] = 'tu_usuario.mysql.pythonanywhere-services.com'
os.environ['DB_NAME'] = 'elec2026'
os.environ['DB_USER'] = 'tu_usuario'
os.environ['DB_PASSWORD'] = 'tu_password_de_pythonanywhere'
os.environ['CORS_ORIGIN'] = 'https://tu_usuario.pythonanywhere.com'
os.environ['DEBUG'] = 'False'
os.environ['LOG_LEVEL'] = 'INFO'

# Importar la app
from web import app as application
