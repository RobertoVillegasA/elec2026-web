# -*- coding: utf-8 -*-
"""
Script para actualizar la tabla recintos con id_distrito
tomando los datos del archivo base1.xlsx

Relaciona:
- base1.xlsx campo 'Distrito' (número) -> distritos.nro_distrito
- base1.xlsx campo 'Recinto' -> recintos.nombre
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

EXCEL_FILE = os.path.join(os.path.dirname(__file__), '..', 'base1.xlsx')

def get_connection():
    return mysql.connector.connect(
        host=MYSQL_CONFIG['host'],
        user=MYSQL_CONFIG['user'],
        password=MYSQL_CONFIG['password'],
        database=MYSQL_CONFIG['database'],
        buffered=True
    )

def normalize_string(s):
    """Normaliza una cadena para comparación"""
    if pd.isna(s) or not s:
        return ''
    s = str(s).strip().upper()
    replacements = [
        ('Á', 'A'), ('É', 'E'), ('Í', 'I'), ('Ó', 'O'), ('Ú', 'U'),
        ('Ñ', 'NI'), ('Ü', 'U'),
    ]
    for old, new in replacements:
        s = s.replace(old, new)
    import re
    s = re.sub(r'\s+', ' ', s)
    return s

def update_from_base1():
    print("\n" + "="*80)
    print("ACTUALIZACION: recintos.id_distrito desde base1.xlsx")
    print("="*80)

    # Leer Excel
    print(f"\n[INFO] Leyendo archivo Excel: {EXCEL_FILE}")
    if not os.path.exists(EXCEL_FILE):
        print(f"[ERROR] No se encontró el archivo: {EXCEL_FILE}")
        return

    df = pd.read_excel(EXCEL_FILE)
    print(f"[OK] Excel leído: {len(df)} filas")

    # Obtener combinación única de Distrito + Recinto
    dist_recintos = df[['Distrito', 'Recinto', 'Municipio', 'Localidad']].drop_duplicates()
    dist_recintos = dist_recintos.dropna(subset=['Distrito', 'Recinto'])
    print(f"[OK] Combinaciones únicas Distrito-Recinto: {len(dist_recintos)}")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Paso 1: Actualizar tabla distritos con nombres desde base1.xlsx
    print("\n[INFO] Actualizando tabla distritos con nombres...")
    
    # Obtener distritos únicos del Excel
    distritos_unique = df[['Distrito', 'Localidad']].drop_duplicates()
    distritos_unique = distritos_unique.dropna(subset=['Distrito'])
    
    updated_distritos = 0
    for _, row in distritos_unique.iterrows():
        nro_distrito = int(row['Distrito'])
        nombre_localidad = str(row['Localidad']).strip() if pd.notna(row['Localidad']) else None
        
        # Actualizar el distrito con este nro_distrito
        cursor.execute("""
            UPDATE distritos 
            SET nombre = %s
            WHERE nro_distrito = %s AND (nombre IS NULL OR nombre = '')
        """, (nombre_localidad, nro_distrito))
        if cursor.rowcount > 0:
            updated_distritos += 1

    conn.commit()
    print(f"[OK] Distritos actualizados con nombre: {updated_distritos}")

    # Paso 2: Crear mapeo Distrito (número) -> id_distrito
    print("\n[INFO] Cargando mapeo de distritos...")
    cursor.execute("SELECT id_distrito, nro_distrito, nombre FROM distritos WHERE nro_distrito IS NOT NULL")
    distritos_map = {}
    for row in cursor.fetchall():
        distritos_map[int(row['nro_distrito'])] = {
            'id_distrito': row['id_distrito'],
            'nombre': row['nombre']
        }
    print(f"[OK] {len(distritos_map)} distritos cargados")

    # Paso 3: Crear mapeo Recinto -> id_distrito desde base1.xlsx
    print("\n[INFO] Mapeando recintos a distritos...")
    recintos_distrito_map = {}
    
    for _, row in dist_recintos.iterrows():
        nro_distrito = int(row['Distrito'])
        nombre_recinto = str(row['Recinto']).strip()
        
        if nro_distrito in distritos_map:
            id_distrito = distritos_map[nro_distrito]['id_distrito']
            recintos_distrito_map[nombre_recinto] = id_distrito

    print(f"[OK] {len(recintos_distrito_map)} recintos mapeados a distritos")

    # Paso 4: Actualizar tabla recintos
    print("\n[INFO] Actualizando tabla recintos...")
    updated = 0
    not_found = 0
    
    for nombre_recinto, id_distrito in recintos_distrito_map.items():
        # Buscar el recinto en la BD por nombre
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
            not_found += 1

    conn.commit()
    print(f"\n[RESUMEN]")
    print(f"   Recintos actualizados: {updated}")
    print(f"   Recintos no encontrados en BD: {not_found}")

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
        SELECT r.id_recinto, r.nombre, r.id_distrito, d.nro_distrito, d.nombre as distrito
        FROM recintos r
        LEFT JOIN distritos d ON r.id_distrito = d.id_distrito
        WHERE r.id_distrito > 0
        LIMIT 20
    """)
    for row in cursor.fetchall():
        print(f"   {row['id_recinto']:5d} | {row['nombre'][:35]:<35} | Distrito #{row['nro_distrito']:2d}: {row['distrito'] or 'N/A'}")

    # Mostrar distribución por distrito
    print("\n" + "="*80)
    print("DISTRIBUCION POR DISTRITO (nro_distrito)")
    print("="*80)
    cursor.execute("""
        SELECT d.nro_distrito, d.nombre as distrito, COUNT(r.id_recinto) as cantidad
        FROM distritos d
        LEFT JOIN recintos r ON d.id_distrito = r.id_distrito
        WHERE d.nro_distrito IS NOT NULL AND d.nro_distrito BETWEEN 1 AND 15
        GROUP BY d.id_distrito, d.nro_distrito, d.nombre
        ORDER BY d.nro_distrito
    """)
    for row in cursor.fetchall():
        print(f"   Distrito {row['nro_distrito']:2d}: {row['distrito'] or 'Sin nombre':<30} | {row['cantidad']} recintos")

    cursor.close()
    conn.close()

    print("\n" + "="*80)
    print("[OK] ACTUALIZACION COMPLETADA")
    print("="*80)

if __name__ == '__main__':
    update_from_base1()
