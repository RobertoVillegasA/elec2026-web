# WSGI configuration file for PythonAnywhere
# Save this as: /var/www/tu_usuario_pythonanywhere_com_wsgi.py

import sys
import os

# Add your project directory to Python path
project_home = '/home/tu_usuario/electoral2026/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set environment variables for database connection
# Replace with your actual PythonAnywhere MySQL credentials
os.environ['DB_HOST'] = 'tu_usuario.mysql.pythonanywhere-services.com'
os.environ['DB_NAME'] = 'tu_usuario$electoral2026'
os.environ['DB_USER'] = 'tu_usuario'
os.environ['DB_PASSWORD'] = 'tu_password'

# For PythonAnywhere, we need to use a WSGI-compatible approach
# FastAPI is ASGI, so we need to use asgiref or run with uvicorn/gunicorn

# Option 1: Use asgiref (recommended for PythonAnywhere)
# Install: pip install asgiref
from main import app as application
from asgiref.wsgi import WsgiToAsgi

application = WsgiToAsgi(application)
