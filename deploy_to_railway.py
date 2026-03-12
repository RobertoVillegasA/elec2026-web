"""
Script automático para crear y migrar base de datos a Railway
Ejecuta todo el proceso de forma automática
"""

import mysql.connector
from mysql.connector import Error
import os
import time
from dotenv import load_dotenv

load_dotenv()

# Colores para output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
RESET = "\033[0m"

def print_step(msg):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}📋 {msg}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_success(msg):
    print(f"{GREEN}✅ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}❌ {msg}{RESET}")

def print_info(msg):
    print(f"{YELLOW}ℹ️  {msg}{RESET}")

# ============================================
# CONFIGURACIÓN
# ============================================

# BD Local
LOCAL_CONFIG = {
    'host': os.getenv('LOCAL_DB_HOST', os.getenv('DB_HOST', 'localhost')),
    'user': os.getenv('LOCAL_DB_USER', os.getenv('DB_USER', 'root')),
    'password': os.getenv('LOCAL_DB_PASSWORD', os.getenv('DB_PASSWORD', '')),
    'database': os.getenv('LOCAL_DB_NAME', os.getenv('DB_NAME', 'elec2026')),
    'port': int(os.getenv('LOCAL_DB_PORT', os.getenv('DB_PORT', '3306'))),
}

# BD Railway
RAILWAY_CONFIG = {
    'host': os.getenv('MYSQLHOST'),
    'user': os.getenv('MYSQLUSER'),
    'password': os.getenv('MYSQLPASSWORD'),
    'database': os.getenv('MYSQLDATABASE'),
    'port': int(os.getenv('MYSQLPORT', '3306')),
}

def get_connection(config, name=""):
    """Obtener conexión a MySQL"""
    try:
        conn = mysql.connector.connect(**config)
        print_success(f"Conectado a {name or config['host']}:{config['port']}")
        return conn
    except Error as e:
        print_error(f"Error conectando: {e}")
        return None

def execute_sql_file(conn, sql_file):
    """Ejecutar archivo SQL completo"""
    try:
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Dividir por statements (separados por ;)
        statements = sql_content.split(';')
        
        cursor = conn.cursor()
        executed = 0
        
        for statement in statements:
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                    executed += 1
                except Error as e:
                    # Ignorar errores de "ya existe"
                    if 'already exists' not in str(e).lower() and 'duplicate' not in str(e).lower():
                        print(f"   ⚠️  Warning en statement: {e}")
        
        conn.commit()
        cursor.close()
        print_success(f"SQL ejecutado: {executed} statements procesados")
        return True
        
    except Exception as e:
        print_error(f"Error ejecutando SQL: {e}")
        return False

def get_table_data(conn, table):
    """Obtener datos de una tabla"""
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(f"SELECT * FROM {table}")
        data = cursor.fetchall()
        cursor.close()
        return data
    except Error as e:
        return []

def insert_data(conn, table, data):
    """Insertar datos con upsert"""
    if not data:
        return 0
    
    cursor = conn.cursor()
    columns = list(data[0].keys())
    columns_str = ', '.join([f"`{col}`" for col in columns])
    placeholders = ', '.join(['%s'] * len(columns))
    
    values = []
    for row in data:
        row_values = []
        for col in columns:
            val = row[col]
            if val is None:
                row_values.append(None)
            elif isinstance(val, bool):
                row_values.append(int(val))
            else:
                row_values.append(val)
        values.append(tuple(row_values))
    
    # Construir update clause (excluyendo IDs)
    update_cols = []
    for col in columns:
        if not col.endswith('_id') and col not in ['id_usuario', 'id_delegado', 'id_acta', 'id_voto_detalle', 'id_candidato']:
            update_cols.append(f"`{col}` = VALUES(`{col}`)")
    
    update_clause = ', '.join(update_cols) if update_cols else columns[0] + ' = VALUES(' + columns[0] + ')'
    
    try:
        query = f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE {update_clause}"
        cursor.executemany(query, values)
        conn.commit()
        cursor.close()
        return len(data)
    except Error as e:
        print_error(f"Error insertando en {table}: {e}")
        conn.rollback()
        cursor.close()
        return 0

def migrate_table(local_conn, railway_conn, table):
    """Migrar una tabla específica"""
    print(f"   📊 Migrando {table}...")
    
    data = get_table_data(local_conn, table)
    if data:
        count = insert_data(railway_conn, table, data)
        print_success(f"{table}: {count} registros migrados")
        return count
    else:
        print_info(f"{table}: Sin datos para migrar")
        return 0

def main():
    """Proceso principal automático"""
    print("\n")
    print_step("🚀 MIGRACIÓN AUTOMÁTICA A RAILWAY")
    
    # Tablas a migrar
    tables = [
        'roles', 'departamentos', 'provincias', 'municipios', 
        'recintos', 'mesas', 'organizaciones_politicas', 'cargos',
        'usuarios', 'candidatos', 'actas', 'votos_detalle', 'delegados'
    ]
    
    # 1. Conectar a BD local
    print_step("1. Conectando a base de datos LOCAL")
    local_conn = get_connection(LOCAL_CONFIG, "Local")
    if not local_conn:
        print_error("No se pudo conectar a la BD local")
        print_info("Verifica que tu BD local esté corriendo")
        return False
    
    # 2. Conectar a Railway
    print_step("2. Conectando a base de datos RAILWAY")
    
    if not RAILWAY_CONFIG['host']:
        print_error("No se encontraron variables de Railway")
        print_info("Configura en tu .env:")
        print("   MYSQLHOST=tu_host_railway")
        print("   MYSQLUSER=root")
        print("   MYSQLPASSWORD=tu_password")
        print("   MYSQLDATABASE=elec2026")
        local_conn.close()
        return False
    
    railway_conn = get_connection(RAILWAY_CONFIG, "Railway")
    if not railway_conn:
        print_error("No se pudo conectar a Railway")
        print_info("Verifica que MySQL esté creado en Railway")
        local_conn.close()
        return False
    
    # 3. Ejecutar script de creación
    print_step("3. Creando estructura de base de datos")
    sql_file = os.path.join(os.path.dirname(__file__), 'create_database.sql')
    
    if os.path.exists(sql_file):
        execute_sql_file(railway_conn, sql_file)
    else:
        print_error(f"No se encontró {sql_file}")
        local_conn.close()
        railway_conn.close()
        return False
    
    # 4. Migrar datos
    print_step("4. Migrando datos desde BD local")
    total = 0
    
    # Desactivar FK
    cursor = railway_conn.cursor()
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    cursor.close()
    
    for table in tables:
        total += migrate_table(local_conn, railway_conn, table)
    
    # Reactivar FK
    cursor = railway_conn.cursor()
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    cursor.close()
    
    # 5. Cerrar conexiones
    local_conn.close()
    railway_conn.close()
    
    # 6. Resumen
    print("\n")
    print_step("✅ MIGRACIÓN COMPLETADA")
    print(f"📊 Total registros migrados: {total}")
    print("\n")
    print_info("Siguientes pasos:")
    print("1. Ve a Railway y verifica las variables de entorno")
    print("2. Agrega SECRET_KEY en Railway → Variables")
    print("3. Agrega CORS_ORIGIN (tu dominio o déjalo vacío)")
    print("4. El deploy se actualizará automáticamente")
    print("\n")
    
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print_success("¡Todo listo! Tu sistema está en Railway 🎉")
    else:
        print_error("Hubo errores. Revisa los mensajes arriba.")
