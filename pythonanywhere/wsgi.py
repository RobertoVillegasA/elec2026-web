# /var/www/tu_usuario_pythonanywhere_com_wsgi.py
# Este archivo lo copiarás en PythonAnywhere en la ruta que te indiquen (generalmente /var/www/)

import sys
import os

# Agregar el path de tu proyecto
project_home = '/home/tu_usuario/electoral2026/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Configurar variables de entorno
os.environ['DB_HOST'] = 'tu_usuario.mysql.pythonanywhere-services.com'
os.environ['DB_NAME'] = 'tu_usuario$electoral2026'
os.environ['DB_USER'] = 'tu_usuario'
os.environ['DB_PASSWORD'] = 'tu_contraseña'

# Importar la app de FastAPI
from main import app as application

# PythonAnywhere usa WSGI, pero FastAPI es ASGI
# Necesitamos un adapter
import asyncio
from asgiref.wsgi import WsgiToAsgi

application = WsgiToAsgi(application)
