#!/usr/bin/env python3
"""
Script para importar datos de mesas y recintos desde Excel a la base de datos
Archivo: base1.xlsx
Version simplificada sin db.py
"""

import pandas as pd
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# Configuracion de MySQL
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'elec2026')

def obtener_id_departamento(cursor, nombre):
    """Obtiene o crea un departamento"""
    cursor.execute("SELECT id_departamento FROM departamentos WHERE nombre = %s", (nombre,))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        cursor.execute("INSERT INTO departamentos (nombre) VALUES (%s)", (nombre,))
        return cursor.lastrowid

def obtener_id_provincia(cursor, nombre, id_departamento):
    """Obtiene o crea una provincia"""
    cursor.execute("SELECT id_provincia FROM provincias WHERE nombre = %s AND id_departamento = %s", (nombre, id_departamento))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        cursor.execute("INSERT INTO provincias (nombre, id_departamento) VALUES (%s, %s)", (nombre, id_departamento))
        return cursor.lastrowid

def obtener_id_municipio(cursor, nombre, id_provincia):
    """Obtiene o crea un municipio"""
    cursor.execute("SELECT id_municipio FROM municipios WHERE nombre = %s AND id_provincia = %s", (nombre, id_provincia))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        cursor.execute("INSERT INTO municipios (nombre, id_provincia) VALUES (%s, %s)", (nombre, id_provincia))
        return cursor.lastrowid

def obtener_id_localidad(cursor, nombre, id_municipio):
    """Obtiene o crea una localidad"""
    cursor.execute("SELECT id_localidad FROM localidades WHERE nombre = %s AND id_municipio = %s", (nombre, id_municipio))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        cursor.execute("INSERT INTO localidades (nombre, id_municipio) VALUES (%s, %s)", (nombre, id_municipio))
        return cursor.lastrowid

def obtener_id_recinto(cursor, nombre, id_municipio, id_localidad):
    """Obtiene o crea un recinto"""
    cursor.execute("SELECT id_recinto FROM recintos WHERE nombre = %s AND id_municipio = %s AND id_localidad = %s", (nombre, id_municipio, id_localidad))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        cursor.execute("INSERT INTO recintos (nombre, id_municipio, id_localidad) VALUES (%s, %s, %s)", (nombre, id_municipio, id_localidad))
        return cursor.lastrowid

def obtener_id_mesa(cursor, numero_mesa, id_recinto):
    """Obtiene o crea una mesa"""
    cursor.execute("SELECT id_mesa FROM mesas WHERE numero_mesa = %s AND id_recinto = %s", (numero_mesa, id_recinto))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        cursor.execute("INSERT INTO mesas (numero_mesa, id_recinto, cantidad_inscritos) VALUES (%s, %s, 0)", (numero_mesa, id_recinto))
        return cursor.lastrowid

def actualizar_cantidad_inscritos(cursor, id_mesa, cantidad):
    """Actualiza la cantidad de inscritos en una mesa"""
    cursor.execute("UPDATE mesas SET cantidad_inscritos = %s WHERE id_mesa = %s", (cantidad, id_mesa))

def importar_datos_excel(archivo_excel):
    """Importa datos desde Excel a la base de datos"""
    
    print("=" * 80)
    print("IMPORTACION DE DATOS - MESAS Y RECINTOS")
    print("=" * 80)
    print(f"\nArchivo: {archivo_excel}")
    
    # Leer Excel
    print("\nLeyendo archivo Excel...")
    df = pd.read_excel(archivo_excel)
    print(f"   Total de filas: {len(df)}")
    
    # Contadores
    total_municipios = 0
    total_localidades = 0
    total_recintos = 0
    total_mesas = 0
    total_actualizados = 0
    
    # Conectar a la base de datos
    print("\nConectando a la base de datos...")
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    cursor = conn.cursor()
    
    print("Procesando datos...")
    
    try:
        # Procesar cada fila del Excel
        for index, row in df.iterrows():
            if (index + 1) % 100 == 0:
                print(f"   Procesando fila {index + 1} de {len(df)}...")
            
            # Obtener datos de la fila
            departamento = row['Departamento']
            provincia = row['Provincia']
            municipio = row['Municipio']
            localidad = row['Localidad']
            recinto = row['Recinto']
            numero_mesa = int(row['Numero de Mesas'])
            inscritos_habilitados = int(row['Inscritos Habilitados'])
            
            # Obtener o crear departamento
            id_departamento = obtener_id_departamento(cursor, departamento)
            
            # Obtener o crear provincia
            id_provincia = obtener_id_provincia(cursor, provincia, id_departamento)
            
            # Obtener o crear municipio
            id_municipio = obtener_id_municipio(cursor, municipio, id_provincia)
            total_municipios += 1
            
            # Obtener o crear localidad
            id_localidad = obtener_id_localidad(cursor, localidad, id_municipio)
            total_localidades += 1
            
            # Obtener o crear recinto
            id_recinto = obtener_id_recinto(cursor, recinto, id_municipio, id_localidad)
            total_recintos += 1
            
            # Obtener o crear mesa
            id_mesa = obtener_id_mesa(cursor, numero_mesa, id_recinto)
            
            # Actualizar cantidad de inscritos
            actualizar_cantidad_inscritos(cursor, id_mesa, inscritos_habilitados)
            total_mesas += 1
            total_actualizados += 1
        
        conn.commit()
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\nERROR durante la importacion: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 80)
    print("IMPORTACION COMPLETADA EXITOSAMENTE")
    print("=" * 80)
    print(f"\nResumen:")
    print(f"   Total de filas procesadas: {len(df)}")
    print(f"   Municipios: {total_municipios}")
    print(f"   Localidades: {total_localidades}")
    print(f"   Recintos: {total_recintos}")
    print(f"   Mesas procesadas: {total_mesas}")
    print(f"   Inscritos actualizados: {total_actualizados}")
    
    return True

if __name__ == "__main__":
    # Archivo Excel
    archivo_excel = "base1.xlsx"
    
    # Verificar que el archivo existe
    if not os.path.exists(archivo_excel):
        print(f"ERROR: El archivo '{archivo_excel}' no existe")
        exit(1)
    
    # Importar datos
    exito = importar_datos_excel(archivo_excel)
    
    if exito:
        print("\nDatos importados correctamente")
        exit(0)
    else:
        print("\nError al importar datos")
        exit(1)
