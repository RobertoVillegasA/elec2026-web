# ============================================
# WSGI Configuration for PythonAnywhere
# ============================================
# Archivo: /var/www/tu_usuario_pythonanywhere_com_wsgi.py
# ============================================

import sys
import os

# ============================================
# CONFIGURACIÓN DE RUTAS
# ============================================
# ⚠️ REEMPLAZA 'tu_usuario' CON TU USUARIO REAL DE PYTHONANYWHERE
# Ejemplo: si tu URL es 'roby_.pythonanywhere.com', usa 'roby_'
username = 'tu_usuario'  # ← CAMBIA ESTO POR TU USUARIO

project_home = f'/home/{username}/elec2026-web'
backend_path = os.path.join(project_home, 'backend')

# Agregar rutas al path de Python
for path in [project_home, backend_path]:
    if path not in sys.path:
        sys.path.insert(0, path)

# ============================================
# VARIABLES DE ENTORNO
# ============================================

# 🔑 SECRET_KEY (usa una generada con: python -c "import secrets; print(secrets.token_urlsafe(32))")
os.environ['SECRET_KEY'] = 'electoral_2026_bolivia_segura_clave_temporal_1234567890'

# 🗄️ Base de datos PythonAnywhere
os.environ['DB_HOST'] = f'{username}.mysql.pythonanywhere-services.com'
os.environ['DB_NAME'] = 'elec2026'
os.environ['DB_USER'] = username
os.environ['DB_PASSWORD'] = 'tu_password_de_pythonanywhere'  # ← CAMBIA ESTO
os.environ['DB_PORT'] = '3306'

# 🌐 CORS
os.environ['CORS_ORIGIN'] = f'https://{username}.pythonanywhere.com'

# ⚙️ Configuración
os.environ['DEBUG'] = 'False'
os.environ['LOG_LEVEL'] = 'INFO'
os.environ['PYTHONUNBUFFERED'] = '1'

# ============================================
# IMPORTAR LA APLICACIÓN
# ============================================
from web import app as application
