# backend/mysql_config.py
"""
Configuración optimizada de MySQL para evitar desconexiones


Soluciones implementadas:
1. Timeout de conexión más altos
2. Reintentos automáticos
3. Keep-alive para conexiones
4. Pool de conexiones con reset de sesión
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de variables de entorno
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'elec2026')

# Configuración de MySQL mejorada
MYSQL_CONFIG = {
    'host': DB_HOST,
    'user': DB_USER,
    'password': DB_PASSWORD,
    'database': DB_NAME,
    
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
