# backend/mysql_config.py
"""
Configuración optimizada de MySQL para evitar desconexiones


Soluciones implementadas:
1. Timeout de conexión más altos
2. Reintentos automáticos
3. Keep-alive para conexiones
4. Pool de conexiones con reset de sesión
5. Soporte para Railway, Render, PythonAnywhere y otros
"""

import os

# Detección de entorno
is_railway = 'RAILWAY_ENVIRONMENT' in os.environ or 'RAILWAY_PROJECT_ID' in os.environ
is_render = 'RENDER' in os.environ
is_pythonanywhere = 'PYTHONANYWHERE' in os.environ

# Configuración de variables de entorno con soporte multi-plataforma
if is_railway:
    # Railway MySQL usa variables diferentes
    DB_HOST = os.getenv('MYSQLHOST', os.getenv('DB_HOST', 'localhost'))
    DB_USER = os.getenv('MYSQLUSER', os.getenv('DB_USER', 'root'))
    DB_PASSWORD = os.getenv('MYSQLPASSWORD', os.getenv('DB_PASSWORD', ''))
    DB_NAME = os.getenv('MYSQLDATABASE', os.getenv('DB_NAME', 'elec2026'))
    DB_PORT = int(os.getenv('MYSQLPORT', os.getenv('DB_PORT', '3306')))
elif is_render:
    # Render usa DATABASE_URL
    DATABASE_URL = os.getenv('DATABASE_URL', '')
    if DATABASE_URL:
        # Parsear DATABASE_URL: mysql://user:pass@host:port/db
        from urllib.parse import urlparse
        parsed = urlparse(DATABASE_URL)
        DB_HOST = parsed.hostname
        DB_USER = parsed.username
        DB_PASSWORD = parsed.password
        DB_NAME = parsed.path.lstrip('/')
        DB_PORT = parsed.port or 3306
    else:
        DB_HOST = os.getenv('DB_HOST', 'localhost')
        DB_USER = os.getenv('DB_USER', 'root')
        DB_PASSWORD = os.getenv('DB_PASSWORD', '')
        DB_NAME = os.getenv('DB_NAME', 'elec2026')
        DB_PORT = int(os.getenv('DB_PORT', '3306'))
elif is_pythonanywhere:
    # PythonAnywhere - Configuración HARDCODEADA para giovann
    DB_HOST = 'giovann.mysql.pythonanywhere-services.com'
    DB_USER = 'giovann'
    DB_PASSWORD = 'libre2026!!'  # Contraseña de PythonAnywhere
    DB_NAME = 'giovann$elec2026'
    DB_PORT = 3306
else:
    # Desarrollo local
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'elec2026')
    DB_PORT = int(os.getenv('DB_PORT', '3306'))

# Configuración de MySQL mejorada
MYSQL_CONFIG = {
    'host': DB_HOST,
    'user': DB_USER,
    'password': DB_PASSWORD,
    'database': DB_NAME,
    'port': DB_PORT if 'DB_PORT' in globals() else 3306,

    # Codificación
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'use_unicode': True,

    # Timeouts (en segundos)
    'connect_timeout': 10,      # Tiempo para conectarse
    'read_timeout': 30,         # Tiempo para leer datos
    'write_timeout': 30,        # Tiempo para escribir datos

    # Opciones de conexión
    'autocommit': False,        # Control manual de transacciones
    'use_pure': True,           # Usar implementación pura de MySQL Connector
    'allow_local_infile': True,
    'get_warnings': False,      # No obtener warnings (mejor rendimiento)
    'raise_on_warnings': False,

    # Pool de conexiones
    'pool_size': 5,             # Cantidad máxima de conexiones simultáneas
    'pool_reset_session': True, # Resetear sesión al obtener conexión
}

# Configuración de reintentos
RETRY_CONFIG = {
    'max_retries': 3,           # Máximo de intentos
    'retry_delay': 1,           # Segundos entre intentos
}

# Comandos para mantener conexión viva
KEEP_ALIVE_QUERY = "SELECT 1"

def print_config():
    """Función para debugging - muestra configuración sin passwords"""
    safe_config = MYSQL_CONFIG.copy()
    safe_config['password'] = '****'
    print("📋 Configuración MySQL:", safe_config)
