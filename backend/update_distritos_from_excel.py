# -*- coding: utf-8 -*-
"""
Script para actualizar la tabla distritos con datos de ubicación
tomados del archivo basehugofil.xlsx

El campo NombreLocalidad del Excel se usará para poblar la tabla distritos
"""

import sys
import os
import io
import pandas as pd
import mysql.connector

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mysql_config import MYSQL_CONFIG

EXCEL_FILE = os.path.join(os.path.dirname(__file__), '..', 'basehugofil.xlsx')

def get_connection():
    return mysql.connector.connect(
        host=MYSQL_CONFIG['host'],
        user=MYSQL_CONFIG['user'],
        password=MYSQL_CONFIG['password'],
        database=MYSQL_CONFIG['database']
    )

def update_distritos():
    print("\n" + "="*80)
    print("ACTUALIZACION: Tabla distritos con datos del Excel")
    print("="*80)

    # Leer Excel
    print(f"\n[INFO] Leyendo archivo Excel: {EXCEL_FILE}")
    if not os.path.exists(EXCEL_FILE):
        print(f"[ERROR] No se encontró el archivo: {EXCEL_FILE}")
        return

    df = pd.read_excel(EXCEL_FILE)
    print(f"[OK] Excel leído: {len(df)} filas")

    # Obtener localidades únicas (distritos) con su contexto geográfico
    distritos_unique = df[['NombreDepartamento', 'NombreProvincia', 
                           'NombreMunicipio', 'NombreLocalidad']].drop_duplicates()
    print(f"[OK] Distritos únicos encontrados: {len(distritos_unique)}")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Paso 1: Agregar columnas de ubicación si no existen
    print("\n[INFO] Verificando columnas en tabla distritos...")
    cursor.execute("DESCRIBE distritos")
    columns = [col['Field'] for col in cursor.fetchall()]
    
    columns_to_add = {
        'nombre': 'VARCHAR(255) NULL COMMENT \"Nombre del distrito (Localidad)\"',
        'departamento': 'VARCHAR(100) NULL',
        'provincia': 'VARCHAR(100) NULL',
        'municipio': 'VARCHAR(100) NULL'
    }

    for col_name, col_def in columns_to_add.items():
        if col_name not in columns:
            try:
                cursor.execute(f"ALTER TABLE distritos ADD COLUMN {col_name} {col_def} AFTER nro_distrito")
                conn.commit()
                print(f"[OK] Columna '{col_name}' agregada")
            except Exception as e:
                print(f"[ERROR] Error agregando columna '{col_name}': {e}")
                conn.rollback()
        else:
            print(f"[INFO] Columna '{col_name}' ya existe")

    # Paso 2: Crear índice único para búsqueda eficiente
    print("\n[INFO] Creando índice para búsqueda...")
    try:
        cursor.execute("CREATE UNIQUE INDEX idx_distritos_nombre ON distritos(nombre)")
        conn.commit()
        print("[OK] Índice creado")
    except Exception as e:
        if "Duplicate key name" in str(e):
            print("[INFO] El índice ya existe")
        else:
            print(f"[INFO] Índice no creado (puede haber duplicados): {e}")

    # Paso 3: Insertar/Actualizar distritos desde el Excel
    print("\n[INFO] Procesando distritos...")
    inserted = 0
    updated = 0
    skipped = 0

    for _, row in distritos_unique.iterrows():
        nombre_localidad = str(row['NombreLocalidad']).strip() if pd.notna(row['NombreLocalidad']) else None
        departamento = str(row['NombreDepartamento']).strip() if pd.notna(row['NombreDepartamento']) else None
        provincia = str(row['NombreProvincia']).strip() if pd.notna(row['NombreProvincia']) else None
        municipio = str(row['NombreMunicipio']).strip() if pd.notna(row['NombreMunicipio']) else None

        if not nombre_localidad:
            skipped += 1
            continue

        # Verificar si ya existe el distrito por nombre
        cursor.execute("SELECT id_distrito FROM distritos WHERE nombre = %s", (nombre_localidad,))
        existing = cursor.fetchone()

        if existing:
            # Actualizar información geográfica
            cursor.execute("""
                UPDATE distritos 
                SET departamento = %s, provincia = %s, municipio = %s
                WHERE nombre = %s
            """, (departamento, provincia, municipio, nombre_localidad))
            updated += 1
        else:
            # Insertar nuevo distrito
            # Obtener el siguiente nro_distrito
            cursor.execute("SELECT MAX(nro_distrito) as max_nro FROM distritos")
            result = cursor.fetchone()
            next_nro = (result['max_nro'] or 0) + 1

            cursor.execute("""
                INSERT INTO distritos (nro_distrito, nombre, departamento, provincia, municipio)
                VALUES (%s, %s, %s, %s, %s)
            """, (next_nro, nombre_localidad, departamento, provincia, municipio))
            inserted += 1

        conn.commit()

    print(f"\n[RESUMEN]")
    print(f"   Distritos insertados: {inserted}")
    print(f"   Distritos actualizados: {updated}")
    print(f"   Registros saltados: {skipped}")

    # Paso 4: Verificación final
    print("\n" + "="*80)
    print("VERIFICACION FINAL")
    print("="*80)

    cursor.execute("SELECT COUNT(*) as total FROM distritos")
    total = cursor.fetchone()['total']
    print(f"\nTotal de distritos en BD: {total}")

    cursor.execute("""
        SELECT id_distrito, nro_distrito, nombre, departamento, municipio
        FROM distritos
        WHERE nombre IS NOT NULL
        ORDER BY id_distrito
        LIMIT 30
    """)
    print("\nPrimeros 30 distritos con nombre:")
    for row in cursor.fetchall():
        print(f"   {row['id_distrito']:3d} | {row['nro_distrito']:3d} | {row['nombre'][:40]:<40} | {row['municipio'] or 'N/A':<20}")

    # Mostrar distribución por municipio
    print("\n" + "="*80)
    print("DISTRIBUCION POR MUNICIPIO")
    print("="*80)
    cursor.execute("""
        SELECT municipio, COUNT(*) as cantidad
        FROM distritos
        WHERE municipio IS NOT NULL
        GROUP BY municipio
        ORDER BY cantidad DESC
    """)
    for row in cursor.fetchall():
        print(f"   {row['municipio']:<30} : {row['cantidad']} distritos")

    cursor.close()
    conn.close()

    print("\n" + "="*80)
    print("[OK] ACTUALIZACION COMPLETADA")
    print("="*80)

if __name__ == '__main__':
    update_distritos()
