"""
Script para migrar base de datos local a Railway MySQL

Uso:
1. Configura las variables de entorno para tu BD local
2. Configura las variables de Railway
3. Ejecuta: python migrate_to_railway.py
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

# ============================================
# CONFIGURACIÓN - AJUSTA ESTO
# ============================================

# Base de datos LOCAL (origen)
LOCAL_DB_CONFIG = {
    'host': os.getenv('LOCAL_DB_HOST', 'localhost'),
    'user': os.getenv('LOCAL_DB_USER', 'root'),
    'password': os.getenv('LOCAL_DB_PASSWORD', ''),
    'database': os.getenv('LOCAL_DB_NAME', 'elec2026'),
    'port': int(os.getenv('LOCAL_DB_PORT', '3306')),
}

# Base de datos RAILWAY (destino)
RAILWAY_DB_CONFIG = {
    'host': os.getenv('MYSQLHOST', os.getenv('RAILWAY_DB_HOST')),
    'user': os.getenv('MYSQLUSER', os.getenv('RAILWAY_DB_USER')),
    'password': os.getenv('MYSQLPASSWORD', os.getenv('RAILWAY_DB_PASSWORD')),
    'database': os.getenv('MYSQLDATABASE', os.getenv('RAILWAY_DB_NAME')),
    'port': int(os.getenv('MYSQLPORT', os.getenv('RAILWAY_DB_PORT', '3306'))),
}

# Tablas a migrar (en orden para respetar foreign keys)
TABLES_TO_MIGRATE = [
    'roles',
    'departamentos',
    'provincias',
    'municipios',
    'recintos',
    'mesas',
    'organizaciones_politicas',
    'cargos',
    'usuarios',
    'candidatos',
    'actas',
    'votos_detalle',
    'delegados',
]

# Tablas que se pueden truncar de forma segura
TABLES_WITH_FK = ['votos_detalle', 'actas', 'candidatos', 'delegados', 'usuarios']


def get_connection(config):
    """Obtener conexión a MySQL"""
    try:
        conn = mysql.connector.connect(**config)
        print(f"✅ Conectado a {config['host']}:{config['port']} - {config['database']}")
        return conn
    except Error as e:
        print(f"❌ Error conectando: {e}")
        return None


def get_table_data(conn, table):
    """Obtener todos los datos de una tabla"""
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(f"SELECT * FROM {table}")
        data = cursor.fetchall()
        cursor.close()
        print(f"   📊 {table}: {len(data)} registros")
        return data
    except Error as e:
        print(f"   ❌ Error leyendo {table}: {e}")
        return []


def insert_data(conn, table, data):
    """Insertar datos en una tabla"""
    if not data:
        return 0
    
    cursor = conn.cursor()
    
    # Obtener columnas
    columns = list(data[0].keys())
    columns_str = ', '.join([f"`{col}`" for col in columns])
    placeholders = ', '.join(['%s'] * len(columns))
    
    # Preparar valores
    values = []
    for row in data:
        row_values = []
        for col in columns:
            val = row[col]
            # Manejar None y booleanos
            if val is None:
                row_values.append(None)
            elif isinstance(val, bool):
                row_values.append(int(val))
            else:
                row_values.append(val)
        values.append(tuple(row_values))
    
    # Insertar con ON DUPLICATE KEY UPDATE
    update_cols = ', '.join([f"`{col}` = VALUES(`{col}`)" for col in columns if col != 'id_delegado'])
    
    try:
        query = f"""
            INSERT INTO {table} ({columns_str}) 
            VALUES ({placeholders})
            ON DUPLICATE KEY UPDATE {update_cols}
        """
        cursor.executemany(query, values)
        conn.commit()
        cursor.close()
        return len(data)
    except Error as e:
        print(f"   ❌ Error insertando en {table}: {e}")
        conn.rollback()
        cursor.close()
        return 0


def truncate_table(conn, table):
    """Truncar una tabla"""
    try:
        cursor = conn.cursor()
        cursor.execute(f"TRUNCATE TABLE {table}")
        conn.commit()
        cursor.close()
        print(f"   🗑️ {table} truncada")
    except Error as e:
        print(f"   ⚠️ Error truncando {table}: {e}")


def disable_foreign_keys(conn):
    """Desactivar foreign keys temporalmente"""
    try:
        cursor = conn.cursor()
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        cursor.close()
    except Error as e:
        print(f"   ⚠️ Error desactivando FK: {e}")


def enable_foreign_keys(conn):
    """Activar foreign keys"""
    try:
        cursor = conn.cursor()
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        cursor.close()
    except Error as e:
        print(f"   ⚠️ Error activando FK: {e}")


def migrate_all():
    """Migrar todas las tablas"""
    print("\n" + "="*60)
    print("🔄 MIGRACIÓN DE BASE DE DATOS A RAILWAY")
    print("="*60 + "\n")
    
    # Conectar a BD local
    print("1️⃣ Conectando a base de datos LOCAL...")
    local_conn = get_connection(LOCAL_DB_CONFIG)
    if not local_conn:
        print("❌ No se pudo conectar a la BD local. Verifica las variables de entorno.")
        return
    
    # Conectar a BD Railway
    print("\n2️⃣ Conectando a base de datos RAILWAY...")
    railway_conn = get_connection(RAILWAY_DB_CONFIG)
    if not railway_conn:
        print("❌ No se pudo conectar a la BD de Railway.")
        print("   Asegúrate de tener MySQL creado en Railway y las variables configuradas.")
        local_conn.close()
        return
    
    # Desactivar foreign keys en Railway
    print("\n3️⃣ Preparando base de datos Railway...")
    disable_foreign_keys(railway_conn)
    
    # Migrar cada tabla
    print("\n4️⃣ Migrando tablas...")
    total_migrated = 0
    
    for table in TABLES_TO_MIGRATE:
        print(f"\n   📋 Migrando {table}...")
        
        # Obtener datos de local
        data = get_table_data(local_conn, table)
        
        if data:
            # Insertar en Railway
            count = insert_data(railway_conn, table, data)
            total_migrated += count
            print(f"   ✅ {table}: {count} registros migrados")
        else:
            print(f"   ⚠️ {table}: Sin datos")
    
    # Reactivar foreign keys
    print("\n5️⃣ Finalizando...")
    enable_foreign_keys(railway_conn)
    
    # Cerrar conexiones
    local_conn.close()
    railway_conn.close()
    
    print("\n" + "="*60)
    print(f"✅ MIGRACIÓN COMPLETADA")
    print(f"📊 Total registros migrados: {total_migrated}")
    print("="*60 + "\n")
    
    print("⚠️ IMPORTANTE:")
    print("1. Verifica que los datos se migraron correctamente")
    print("2. Cambia la contraseña del usuario admin")
    print("3. Configura las variables de entorno en Railway:")
    print("   - SECRET_KEY")
    print("   - CORS_ORIGIN")
    print("")


if __name__ == "__main__":
    migrate_all()
