# /var/www/tu_usuario_pythonanywhere_com_wsgi.py
# Archivo WSGI para PythonAnywhere - Backend FastAPI

import sys
import os

# Agregar el path de tu proyecto
project_home = '/home/tu_usuario/electoral2026/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Configurar variables de entorno para la base de datos
# REEMPLAZA ESTOS VALORES con los de tu cuenta de PythonAnywhere
os.environ['DB_HOST'] = 'tu_usuario.mysql.pythonanywhere-services.com'
os.environ['DB_NAME'] = 'tu_usuario$electoral2026'
os.environ['DB_USER'] = 'tu_usuario'
os.environ['DB_PASSWORD'] = 'tu_contraseña'

# Para usar Flask como intermediario WSGI
from flask import Flask, request, Response
from werkzeug.middleware.dispatcher import DispatcherMiddleware
import asyncio

# Crear app Flask
flask_app = Flask(__name__)

# Importar la app de FastAPI
from main import app as fastapi_app

@flask_app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def api_proxy(path):
    """Proxy para rutas de la API"""
    # Esto es un placeholder - necesitas usar asgiref o uvicorn
    pass

# WSGI application
application = flask_app
