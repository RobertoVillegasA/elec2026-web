# -*- coding: utf-8 -*-
"""
Script para actualizar la tabla recintos con id_distrito
tomando los datos del archivo basehugofil.xlsx

Relaciona los recintos con sus distritos usando:
- NombreRecinto del Excel -> recintos.nombre
- NombreLocalidad del Excel -> distritos.nombre
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
        database=MYSQL_CONFIG['database'],
        buffered=True
    )

def normalize_string(s):
    """Normaliza una cadena para comparación (quita acentos, mayúsculas, espacios extra)"""
    if pd.isna(s) or not s:
        return ''
    s = str(s).strip().upper()
    # Quitar acentos
    replacements = [
        ('Á', 'A'), ('É', 'E'), ('Í', 'I'), ('Ó', 'O'), ('Ú', 'U'),
        ('Ñ', 'NI'), ('Ü', 'U'),
    ]
    for old, new in replacements:
        s = s.replace(old, new)
    # Quitar caracteres especiales y espacios múltiples
    import re
    s = re.sub(r'\s+', ' ', s)
    return s

def update_recintos_distritos():
    print("\n" + "="*80)
    print("ACTUALIZACION: recintos.id_distrito desde Excel")
    print("="*80)

    # Leer Excel
    print(f"\n[INFO] Leyendo archivo Excel: {EXCEL_FILE}")
    if not os.path.exists(EXCEL_FILE):
        print(f"[ERROR] No se encontró el archivo: {EXCEL_FILE}")
        return

    df = pd.read_excel(EXCEL_FILE)
    print(f"[OK] Excel leído: {len(df)} filas")

    # Obtener combinación única de recinto + localidad
    recintos_unique = df[['NombreRecinto', 'NombreLocalidad', 'NombreMunicipio']].drop_duplicates()
    print(f"[OK] Recintos únicos en Excel: {len(recintos_unique)}")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Paso 0: Asegurar que la tabla distritos tenga las columnas necesarias
    print("\n[INFO] Verificando estructura de tabla distritos...")
    cursor.execute("DESCRIBE distritos")
    columns = [col['Field'] for col in cursor.fetchall()]
    
    columns_to_add = {
        'nombre': 'VARCHAR(255) NULL COMMENT "Nombre del distrito (Localidad)"',
        'departamento': 'VARCHAR(100) NULL',
        'provincia': 'VARCHAR(100) NULL',
        'municipio': 'VARCHAR(100) NULL'
    }

    for col_name, col_def in columns_to_add.items():
        if col_name not in columns:
            try:
                cursor.execute(f"ALTER TABLE distritos ADD COLUMN {col_name} {col_def} AFTER nro_distrito")
                conn.commit()
                print(f"[OK] Columna '{col_name}' agregada a distritos")
            except Exception as e:
                print(f"[ERROR] Error agregando columna '{col_name}': {e}")
                conn.rollback()
        else:
            print(f"[INFO] Columna '{col_name}' ya existe en distritos")

    # Crear diccionario de búsqueda: (nombre_recinto_normalizado, nombre_localidad_normalizado) -> id_distrito
    print("\n[INFO] Cargando distritos desde la base de datos...")
    cursor.execute("SELECT id_distrito, nombre, municipio FROM distritos WHERE nombre IS NOT NULL")
    distritos_db = cursor.fetchall()
    
    distritos_map = {}
    for d in distritos_db:
        nombre_norm = normalize_string(d['nombre'])
        municipio_norm = normalize_string(d['municipio']) if d['municipio'] else ''
        distritos_map[(nombre_norm, municipio_norm)] = d['id_distrito']
    
    print(f"[OK] {len(distritos_map)} distritos cargados")

    # Crear diccionario de recintos -> id_distrito
    print("\n[INFO] Mapeando recintos a distritos...")
    recintos_distrito_map = {}
    matched = 0
    not_matched = []
    
    for _, row in recintos_unique.iterrows():
        nombre_recinto = str(row['NombreRecinto']).strip() if pd.notna(row['NombreRecinto']) else None
        nombre_localidad = str(row['NombreLocalidad']).strip() if pd.notna(row['NombreLocalidad']) else None
        nombre_municipio = str(row['NombreMunicipio']).strip() if pd.notna(row['NombreMunicipio']) else None
        
        if not nombre_recinto or not nombre_localidad:
            continue
        
        # Buscar el distrito por localidad (nombre) y municipio
        localidad_norm = normalize_string(nombre_localidad)
        municipio_norm = normalize_string(nombre_municipio) if nombre_municipio else ''
        
        id_distrito = distritos_map.get((localidad_norm, municipio_norm))
        
        if id_distrito:
            recintos_distrito_map[nombre_recinto] = id_distrito
            matched += 1
        else:
            not_matched.append((nombre_recinto, nombre_localidad, nombre_municipio))

    print(f"[OK] Recintos mapeados: {matched}")
    if not_matched:
        print(f"[WARN] Recintos sin coincidencia: {len(not_matched)}")
        if len(not_matched) <= 20:
            for r, l, m in not_matched[:10]:
                print(f"   - {r} (Localidad: {l}, Municipio: {m})")
        else:
            print("   Primeros 10 sin coincidencia:")
            for r, l, m in not_matched[:10]:
                print(f"   - {r} (Localidad: {l}, Municipio: {m})")

    # Actualizar la tabla recintos
    print("\n[INFO] Actualizando tabla recintos...")
    updated = 0
    not_found_in_db = 0
    
    for nombre_recinto, id_distrito in recintos_distrito_map.items():
        # Buscar el recinto en la base de datos por nombre
        cursor.execute("SELECT id_recinto FROM recintos WHERE nombre = %s", (nombre_recinto,))
        recinto = cursor.fetchone()
        
        if recinto:
            cursor.execute("""
                UPDATE recintos 
                SET id_distrito = %s 
                WHERE id_recinto = %s
            """, (id_distrito, recinto['id_recinto']))
            updated += 1
        else:
            not_found_in_db += 1

    conn.commit()
    print(f"\n[RESUMEN]")
    print(f"   Recintos actualizados: {updated}")
    print(f"   Recintos no encontrados en BD: {not_found_in_db}")

    # Verificación final
    print("\n" + "="*80)
    print("VERIFICACION FINAL")
    print("="*80)

    cursor.execute("SELECT COUNT(*) as total FROM recintos")
    total = cursor.fetchone()['total']
    print(f"\nTotal de recintos: {total}")

    cursor.execute("SELECT COUNT(*) as total FROM recintos WHERE id_distrito > 0")
    with_distrito = cursor.fetchone()['total']
    print(f"Recintos con id_distrito asignado: {with_distrito}")
    
    cursor.execute("SELECT COUNT(*) as total FROM recintos WHERE id_distrito = 0 OR id_distrito IS NULL")
    without_distrito = cursor.fetchone()['total']
    print(f"Recintos SIN id_distrito: {without_distrito}")

    # Mostrar algunos ejemplos
    print("\nEjemplos de recintos actualizados:")
    cursor.execute("""
        SELECT r.id_recinto, r.nombre, r.id_distrito, d.nombre as distrito, d.municipio
        FROM recintos r
        LEFT JOIN distritos d ON r.id_distrito = d.id_distrito
        WHERE r.id_distrito > 0
        LIMIT 20
    """)
    for row in cursor.fetchall():
        print(f"   {row['id_recinto']:5d} | {row['nombre'][:40]:<40} | Distrito: {row['distrito'] or 'N/A':<25} | {row['municipio'] or 'N/A'}")

    # Mostrar distribución por distrito
    print("\n" + "="*80)
    print("DISTRIBUCION POR DISTRITO")
    print("="*80)
    cursor.execute("""
        SELECT d.nombre as distrito, d.municipio, COUNT(r.id_recinto) as cantidad
        FROM distritos d
        LEFT JOIN recintos r ON d.id_distrito = r.id_distrito
        WHERE d.nombre IS NOT NULL
        GROUP BY d.id_distrito, d.nombre, d.municipio
        HAVING cantidad > 0
        ORDER BY cantidad DESC
        LIMIT 30
    """)
    for row in cursor.fetchall():
        print(f"   {row['distrito'][:30]:<30} | {row['municipio'] or 'N/A':<20} | {row['cantidad']} recintos")

    cursor.close()
    conn.close()

    print("\n" + "="*80)
    print("[OK] ACTUALIZACION COMPLETADA")
    print("="*80)

if __name__ == '__main__':
    update_recintos_distritos()
