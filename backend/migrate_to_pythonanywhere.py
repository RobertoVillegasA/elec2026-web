"""
Script para migrar datos de la base de datos local a PythonAnywhere
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración LOCAL
LOCAL_DB_CONFIG = {
    'host': os.getenv('LOCAL_DB_HOST', 'localhost'),
    'user': os.getenv('LOCAL_DB_USER', 'root'),
    'password': os.getenv('LOCAL_DB_PASSWORD', ''),
    'database': os.getenv('LOCAL_DB_NAME', 'elec2026'),
    'port': int(os.getenv('LOCAL_DB_PORT', 3306)),
    'buffered': True,
}

# Configuración PYTHONANYWHERE
PA_DB_CONFIG = {
    'host': 'giovann.mysql.pythonanywhere-services.com',
    'user': 'giovann',
    'password': os.getenv('PA_DB_PASSWORD', 'TU_CONTRASENA_AQUI'),  # ← CAMBIAR
    'database': 'giovann$elec2026',
    'port': 3306,
    'buffered': True,
}

def connect_to_db(config, name):
    """Conectar a una base de datos"""
    try:
        connection = mysql.connector.connect(**config)
        print(f"✅ Conexión exitosa a {name}")
        return connection
    except Error as e:
        print(f"❌ Error al conectar a {name}: {e}")
        return None

def get_all_tables(cursor):
    """Obtener todas las tablas"""
    cursor.execute("SHOW TABLES")
    return [row[0] for row in cursor.fetchall()]

def get_table_data(cursor, table):
    """Obtener todos los datos de una tabla"""
    cursor.execute(f"SELECT * FROM {table}")
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    return columns, rows

def insert_data(cursor, table, columns, rows):
    """Insertar datos en una tabla"""
    if not rows:
        return 0, 0
    
    placeholders = ', '.join(['%s'] * len(columns))
    columns_str = ', '.join(columns)
    
    inserted = 0
    errors = 0
    
    for row in rows:
        try:
            # Verificar si el registro ya existe (por ID)
            if 'id_' in columns[0]:  # Asumimos que la primera columna es el ID
                check_query = f"SELECT {columns[0]} FROM {table} WHERE {columns[0]} = %s"
                cursor.execute(check_query, (row[0],))
                if cursor.fetchone():
                    continue  # Ya existe, saltar
            
            insert_query = f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders})"
            cursor.execute(insert_query, row)
            inserted += 1
        except Error as e:
            errors += 1
            if errors <= 3:  # Mostrar solo los primeros 3 errores
                print(f"  ⚠️ Error en {table}: {e}")
    
    return inserted, errors

def migrate_database():
    """Migrar toda la base de datos"""
    print("="*60)
    print("🔄 MIGRACIÓN DE BASE DE DATOS A PYTHONANYWHERE")
    print("="*60)
    
    # Conectar a ambas bases de datos
    local_conn = connect_to_db(LOCAL_DB_CONFIG, "LOCAL")
    if not local_conn:
        return
    
    pa_conn = connect_to_db(PA_DB_CONFIG, "PYTHONANYWHERE")
    if not pa_conn:
        local_conn.close()
        return
    
    local_cursor = local_conn.cursor()
    pa_cursor = pa_conn.cursor()
    
    # Deshabilitar checks de claves foráneas temporalmente
    pa_cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    
    # Obtener todas las tablas
    tables = get_all_tables(local_cursor)
    print(f"\n📋 Tablas encontradas: {len(tables)}")
    
    total_inserted = 0
    total_errors = 0
    
    # Migrar cada tabla
    for table in tables:
        print(f"\n📊 Migrando tabla: {table}")
        
        try:
            columns, rows = get_table_data(local_cursor, table)
            inserted, errors = insert_data(pa_cursor, table, columns, rows)
            
            print(f"  ✅ Insertados: {inserted}")
            if errors > 0:
                print(f"  ❌ Errores: {errors}")
            
            total_inserted += inserted
            total_errors += errors
            
        except Error as e:
            print(f"  ❌ Error grave en {table}: {e}")
            total_errors += 1
    
    # Restaurar checks de claves foráneas
    pa_cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    
    # Commit de cambios
    pa_conn.commit()
    
    # Estadísticas finales
    print("\n" + "="*60)
    print("📊 ESTADÍSTICAS FINALES")
    print("="*60)
    print(f"✅ Registros insertados: {total_inserted}")
    print(f"❌ Errores: {total_errors}")
    print("="*60)
    
    # Cerrar conexiones
    local_cursor.close()
    local_conn.close()
    pa_cursor.close()
    pa_conn.close()
    
    print("\n✅ ¡Migración completada!")

if __name__ == "__main__":
    print("\n⚠️ ADVERTENCIA: Este script sobrescribirá datos en PythonAnywhere")
    print("Asegurate de tener un backup antes de continuar.\n")
    
    response = input("¿Continuar con la migración? (yes/no): ")
    if response.lower() == 'yes':
        migrate_database()
    else:
        print("❌ Migración cancelada")
