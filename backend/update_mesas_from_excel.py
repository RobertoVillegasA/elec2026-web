"""
Script para actualizar la tabla mesas según los recintos del archivo baseHugo.xlsx
"""
import pandas as pd
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos LOCAL
DB_CONFIG = {
    'host': os.getenv('LOCAL_DB_HOST', 'localhost'),
    'user': os.getenv('LOCAL_DB_USER', 'root'),
    'password': os.getenv('LOCAL_DB_PASSWORD', ''),
    'database': os.getenv('LOCAL_DB_NAME', 'elec2026'),
    'port': int(os.getenv('LOCAL_DB_PORT', 3306)),
    'buffered': True,  # Importante para evitar "Unread result found"
}

def connect_to_db():
    """Conectar a la base de datos"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        print("✅ Conexión exitosa a la base de datos")
        return connection
    except Error as e:
        print(f"❌ Error al conectar: {e}")
        return None

def get_or_create_recinto(cursor, nombre_recinto, id_municipio, id_distrito=None):
    """Obtener o crear un recinto"""
    try:
        # Buscar recinto existente
        query = "SELECT id_recinto FROM recintos WHERE LOWER(nombre) = LOWER(%s) AND id_municipio = %s"
        cursor.execute(query, (nombre_recinto, id_municipio))
        result = cursor.fetchone()
        
        if result:
            return result[0]
        
        # Crear nuevo recinto (sin id_localidad para evitar error de FK)
        insert_query = """
        INSERT INTO recintos (nombre, id_municipio, id_distrito)
        VALUES (%s, %s, %s)
        """
        cursor.execute(insert_query, (nombre_recinto, id_municipio, id_distrito))
        return cursor.lastrowid
        
    except Error as e:
        print(f"Error con recinto {nombre_recinto}: {e}")
        return None

def get_municipio(cursor, nombre_municipio, nombre_provincia=None):
    """Obtener un municipio por nombre"""
    try:
        if nombre_provincia:
            query = """
            SELECT m.id_municipio 
            FROM municipios m
            JOIN provincias p ON m.id_provincia = p.id_provincia
            WHERE LOWER(m.nombre) = LOWER(%s) AND LOWER(p.nombre) = LOWER(%s)
            """
            cursor.execute(query, (nombre_municipio, nombre_provincia))
        else:
            query = "SELECT id_municipio FROM municipios WHERE LOWER(nombre) = LOWER(%s)"
            cursor.execute(query, (nombre_municipio,))
        
        result = cursor.fetchone()
        return result[0] if result else None
        
    except Error as e:
        print(f"Error buscando municipio {nombre_municipio}: {e}")
        return None

def mesa_exists(cursor, numero_mesa, id_recinto):
    """Verificar si una mesa ya existe"""
    query = "SELECT id_mesa FROM mesas WHERE numero_mesa = %s AND id_recinto = %s"
    cursor.execute(query, (numero_mesa, id_recinto))
    return cursor.fetchone() is not None

def create_mesa(cursor, numero_mesa, id_recinto):
    """Crear una nueva mesa"""
    try:
        query = """
        INSERT INTO mesas (numero_mesa, id_recinto)
        VALUES (%s, %s)
        """
        cursor.execute(query, (numero_mesa, id_recinto))
        return True
    except Error as e:
        print(f"Error creando mesa {numero_mesa} en recinto {id_recinto}: {e}")
        return False

def process_excel(file_path):
    """Procesar el archivo Excel y actualizar la base de datos"""
    print(f"📖 Leyendo archivo: {file_path}")
    
    try:
        df = pd.read_excel(file_path)
        print(f"✅ Archivo leído: {len(df)} filas encontradas")
    except Exception as e:
        print(f"❌ Error leyendo el Excel: {e}")
        return
    
    # Conexión a la base de datos
    connection = connect_to_db()
    if not connection:
        return
    
    cursor = connection.cursor()
    
    # Estadísticas
    total_mesas = 0
    mesas_creadas = 0
    mesas_existentes = 0
    errores = 0
    
    # Recintos únicos por crear
    recintos_procesados = set()
    
    print("\n🔄 Procesando datos...")
    
    for index, row in df.iterrows():
        nombre_recinto = row['NombreRecinto']
        numero_mesa = int(row['NumeroMesa'])
        nombre_municipio = row['NombreMunicipio']
        nombre_provincia = row['NombreProvincia']
        id_distrito = row.get('Distritos Municipales', None)
        
        # Obtener municipio
        id_municipio = get_municipio(cursor, nombre_municipio, nombre_provincia)
        
        if not id_municipio:
            print(f"⚠️  Municipio no encontrado: {nombre_municipio}, {nombre_provincia}")
            errores += 1
            continue
        
        # Obtener o crear recinto
        key_recinto = f"{nombre_recinto}_{id_municipio}"
        if key_recinto not in recintos_procesados:
            id_recinto = get_or_create_recinto(cursor, nombre_recinto, id_municipio, id_distrito)
            if id_recinto:
                recintos_procesados.add(key_recinto)
                print(f"📍 Recinto: {nombre_recinto} (ID: {id_recinto})")
            else:
                print(f"❌ No se pudo crear recinto: {nombre_recinto}")
                errores += 1
                continue
        else:
            # Obtener ID del recinto existente
            cursor.execute(
                "SELECT id_recinto FROM recintos WHERE LOWER(nombre) = LOWER(%s) AND id_municipio = %s",
                (nombre_recinto, id_municipio)
            )
            result = cursor.fetchone()
            if result:
                id_recinto = result[0]
            else:
                print(f"❌ No se encontró recinto: {nombre_recinto}")
                errores += 1
                continue
        
        # Verificar si la mesa ya existe
        if mesa_exists(cursor, numero_mesa, id_recinto):
            mesas_existentes += 1
        else:
            # Crear mesa
            if create_mesa(cursor, numero_mesa, id_recinto):
                mesas_creadas += 1
                total_mesas += 1
                if total_mesas % 100 == 0:
                    print(f"  → {total_mesas} mesas procesadas...")
    
    # Commit de cambios
    connection.commit()
    
    # Estadísticas finales
    print("\n" + "="*60)
    print("📊 ESTADÍSTICAS FINALES")
    print("="*60)
    print(f"✅ Mesas creadas: {mesas_creadas}")
    print(f"⏭️  Mesas existentes (saltadas): {mesas_existentes}")
    print(f"❌ Errores: {errores}")
    print(f"📍 Recintos procesados: {len(recintos_procesados)}")
    print("="*60)
    
    # Cerrar conexión
    cursor.close()
    connection.close()
    print("\n✅ Proceso completado!")

if __name__ == "__main__":
    # Ruta al archivo Excel
    excel_path = os.path.join(os.path.dirname(__file__), '..', 'baseHugo.xlsx')
    
    if not os.path.exists(excel_path):
        print(f"❌ No se encontró el archivo: {excel_path}")
        print("Asegúrate de que baseHugo.xlsx esté en la carpeta raíz del proyecto")
    else:
        process_excel(excel_path)
