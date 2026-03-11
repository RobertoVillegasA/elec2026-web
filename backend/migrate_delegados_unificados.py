# backend/migrate_delegados_unificados.py
# -*- coding: utf-8 -*-
"""
Script para unificar cord_dist, cord_recinto y delegados en una sola tabla delegados
con campo id_rol que se vincula a la tabla roles
"""

import sys
import os
import io
import mysql.connector

# Configurar UTF-8 para salida en Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mysql_config import MYSQL_CONFIG

def get_connection():
    return mysql.connector.connect(
        host=MYSQL_CONFIG['host'],
        user=MYSQL_CONFIG['user'],
        password=MYSQL_CONFIG['password'],
        database=MYSQL_CONFIG['database']
    )

def migrate():
    print("\n" + "="*80)
    print("MIGRACION: UNIFICAR TABLAS DE DELEGADOS Y COORDINADORES")
    print("="*80)
    
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Paso 1: Verificar que existen los roles
    print("\n[INFO] Verificando roles...")
    cursor.execute("SELECT id_rol, nombre_rol FROM roles WHERE nombre_rol IN ('Coord_distrito', 'Coord_recinto', 'Delegado')")
    roles = {r['nombre_rol']: r['id_rol'] for r in cursor.fetchall()}
    
    print(f"   Roles encontrados: {roles}")
    
    if 'Coord_distrito' not in roles or 'Coord_recinto' not in roles or 'Delegado' not in roles:
        print("[ERROR] Faltan roles necesarios")
        return
    
    id_rol_distrito = roles['Coord_distrito']
    id_rol_recinto = roles['Delegado']  # Para coordinador de recinto usamos el rol base
    id_rol_delegado = roles['Delegado']
    
    # Paso 2: Agregar columna id_rol a delegados si no existe
    print("\n[INFO] Agregando columna id_rol a delegados...")
    try:
        cursor.execute("ALTER TABLE delegados ADD COLUMN id_rol INT(11) DEFAULT 6 AFTER direccion")
        conn.commit()
        print("[OK] Columna id_rol agregada")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("[INFO] La columna id_rol ya existe")
        else:
            print(f"[ERROR] Error agregando columna: {e}")
            conn.rollback()
    
    # Paso 3: Agregar columna id_recinto a delegados si no existe (para coord_recinto)
    print("\n[INFO] Verificando columna id_recinto en delegados...")
    try:
        cursor.execute("ALTER TABLE delegados ADD COLUMN id_recinto INT(11) NULL AFTER id_mesa")
        conn.commit()
        print("[OK] Columna id_recinto agregada")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("[INFO] La columna id_recinto ya existe")
        else:
            print(f"[ERROR] Error agregando columna: {e}")
            conn.rollback()
    
    # Paso 4: Agregar columna nro_dist a delegados si no existe (para coord_distrito)
    print("\n[INFO] Verificando columna nro_dist en delegados...")
    try:
        cursor.execute("ALTER TABLE delegados ADD COLUMN nro_dist VARCHAR(50) NULL AFTER id_recinto")
        conn.commit()
        print("[OK] Columna nro_dist agregada")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("[INFO] La columna nro_dist ya existe")
        else:
            print(f"[ERROR] Error agregando columna: {e}")
            conn.rollback()
    
    # Paso 5: Migrar cord_dist a delegados
    print("\n" + "-"*80)
    print("MIGRANDO CORD_DIST A DELEGADOS...")
    print("-"*80)
    
    cursor.execute("SELECT * FROM cord_dist")
    cord_dist_data = cursor.fetchall()
    
    migrados_dist = 0
    for coord in cord_dist_data:
        # Verificar si ya existe por CI
        cursor.execute("SELECT id_delegado FROM delegados WHERE ci = %s", (coord['ci'],))
        existente = cursor.fetchone()
        
        if existente:
            # Actualizar existente
            cursor.execute("""
                UPDATE delegados SET 
                    nombre = %s, apellido = %s, telefono = %s, direccion = %s,
                    id_rol = %s, nro_dist = %s
                WHERE ci = %s
            """, (coord['nombre'], coord['apellido'], coord['telefono'], 
                  coord['direccion'], id_rol_distrito, coord['nro_dist'], coord['ci']))
        else:
            # Insertar nuevo
            cursor.execute("""
                INSERT INTO delegados (ci, nombre, apellido, telefono, direccion, id_rol, nro_dist)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (coord['ci'], coord['nombre'], coord['apellido'], coord['telefono'],
                  coord['direccion'], id_rol_distrito, coord['nro_dist']))
        
        conn.commit()
        migrados_dist += 1
    
    print(f"[OK] Coordinadores de distrito migrados: {migrados_dist}")
    
    # Paso 6: Migrar cord_recinto a delegados
    print("\n" + "-"*80)
    print("MIGRANDO CORD_RECINTO A DELEGADOS...")
    print("-"*80)
    
    cursor.execute("SELECT * FROM cord_recinto")
    cord_recinto_data = cursor.fetchall()
    
    migrados_recinto = 0
    for coord in cord_recinto_data:
        # Verificar si ya existe por CI
        cursor.execute("SELECT id_delegado FROM delegados WHERE ci = %s", (coord['ci'],))
        existente = cursor.fetchone()
        
        if existente:
            # Actualizar existente
            cursor.execute("""
                UPDATE delegados SET 
                    nombre = %s, apellido = %s, telefono = %s, direccion = %s,
                    id_rol = %s, id_recinto = %s
                WHERE ci = %s
            """, (coord['nombre'], coord['apellido'], coord['telefono'], 
                  coord['direccion'], 5, coord['id_recinto'], coord['ci']))  # 5 = Coord_recinto
        else:
            # Insertar nuevo
            cursor.execute("""
                INSERT INTO delegados (ci, nombre, apellido, telefono, direccion, id_rol, id_recinto)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (coord['ci'], coord['nombre'], coord['apellido'], coord['telefono'],
                  coord['direccion'], 5, coord['id_recinto']))
        
        conn.commit()
        migrados_recinto += 1
    
    print(f"[OK] Coordinadores de recinto migrados: {migrados_recinto}")
    
    # Paso 7: Actualizar delegados existentes con id_rol = 6 (Delegado)
    print("\n" + "-"*80)
    print("ACTUALIZANDO DELEGADOS EXISTENTES...")
    print("-"*80)
    
    cursor.execute("""
        UPDATE delegados 
        SET id_rol = %s 
        WHERE id_rol IS NULL OR id_rol = 6
    """, (id_rol_delegado,))
    conn.commit()
    
    cursor.execute("SELECT COUNT(*) as total FROM delegados WHERE id_rol = 6")
    total_delegados = cursor.fetchone()['total']
    print(f"[OK] Delegados con rol actualizado: {total_delegados}")
    
    # Paso 8: Eliminar columnas antiguas cord_distrito y cord_recinto
    print("\n" + "-"*80)
    print("ELIMINANDO COLUMNAS OBSOLETAS...")
    print("-"*80)
    
    try:
        cursor.execute("ALTER TABLE delegados DROP COLUMN cord_distrito")
        conn.commit()
        print("[OK] Columna cord_distrito eliminada")
    except Exception as e:
        print(f"[INFO] Columna cord_distrito no existe o no se pudo eliminar: {e}")
    
    try:
        cursor.execute("ALTER TABLE delegados DROP COLUMN cord_recinto")
        conn.commit()
        print("[OK] Columna cord_recinto eliminada")
    except Exception as e:
        print(f"[INFO] Columna cord_recinto no existe o no se pudo eliminar: {e}")
    
    # Paso 9: Mostrar resumen final
    print("\n" + "="*80)
    print("RESUMEN FINAL")
    print("="*80)
    
    cursor.execute("""
        SELECT r.nombre_rol, COUNT(d.id_delegado) as cantidad
        FROM delegados d
        JOIN roles r ON d.id_rol = r.id_rol
        GROUP BY r.id_rol, r.nombre_rol
    """)
    
    for row in cursor.fetchall():
        print(f"   {row['nombre_rol']}: {row['cantidad']}")
    
    cursor.execute("SELECT COUNT(*) as total FROM delegados")
    total = cursor.fetchone()['total']
    print(f"\n   TOTAL: {total}")
    
    # Paso 10: Eliminar tablas antiguas (OPCIONAL - comentar si no se quieren eliminar)
    print("\n" + "-"*80)
    print("ELIMINANDO TABLAS OBSOLETAS (en 5 segundos)...")
    print("-"*80)
    
    import time
    for i in range(5, 0, -1):
        print(f"   {i}...")
        time.sleep(1)
    
    try:
        cursor.execute("DROP TABLE IF EXISTS cord_dist")
        conn.commit()
        print("[OK] Tabla cord_dist eliminada")
    except Exception as e:
        print(f"[ERROR] Error eliminando cord_dist: {e}")
    
    try:
        cursor.execute("DROP TABLE IF EXISTS cord_recinto")
        conn.commit()
        print("[OK] Tabla cord_recinto eliminada")
    except Exception as e:
        print(f"[ERROR] Error eliminando cord_recinto: {e}")
    
    cursor.close()
    conn.close()
    
    print("\n" + "="*80)
    print("[OK] MIGRACION COMPLETADA")
    print("="*80)

if __name__ == '__main__':
    migrate()
