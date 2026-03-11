# backend/migrate_nro_dist_to_id_distrito.py
# -*- coding: utf-8 -*-
"""
Script para migrar campo nro_dist a id_distrito en delegados
y agregar la clave foránea a la tabla distritos
"""

import sys
import os
import io
import mysql.connector

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
    print("MIGRACION: nro_dist -> id_distrito con FK a distritos")
    print("="*80)
    
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Paso 1: Verificar datos actuales
    print("\n[INFO] Verificando datos actuales...")
    cursor.execute("SELECT COUNT(*) as total FROM delegados WHERE nro_dist IS NOT NULL")
    total = cursor.fetchone()['total']
    print(f"   Delegados con nro_dist: {total}")
    
    cursor.execute("SELECT DISTINCT nro_dist FROM delegados WHERE nro_dist IS NOT NULL")
    nro_dists = [r['nro_dist'] for r in cursor.fetchall()]
    print(f"   Valores únicos de nro_dist: {nro_dists}")
    
    cursor.execute("SELECT * FROM distritos ORDER BY nro_distrito")
    distritos = cursor.fetchall()
    print(f"   Distritos en BD: {[(d['id_distrito'], d['nro_distrito']) for d in distritos]}")
    
    # Paso 2: Agregar columna id_distrito
    print("\n[INFO] Agregando columna id_distrito...")
    try:
        cursor.execute("ALTER TABLE delegados ADD COLUMN id_distrito INT(11) NULL AFTER id_recinto")
        conn.commit()
        print("[OK] Columna id_distrito agregada")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("[INFO] La columna id_distrito ya existe")
        else:
            print(f"[ERROR] Error agregando columna: {e}")
            conn.rollback()
    
    # Paso 3: Mapear nro_dist a id_distrito
    print("\n[INFO] Mapeando nro_dist a id_distrito...")
    cursor.execute("SELECT DISTINCT nro_dist FROM delegados WHERE nro_dist IS NOT NULL")
    nro_dists = [r['nro_dist'] for r in cursor.fetchall()]
    
    for nro_dist in nro_dists:
        try:
            nro_int = int(nro_dist)
            cursor.execute("SELECT id_distrito FROM distritos WHERE nro_distrito = %s", (nro_int,))
            result = cursor.fetchone()
            if result:
                print(f"   nro_dist '{nro_dist}' -> id_distrito {result['id_distrito']}")
            else:
                print(f"   [WARN] No se encontró distrito con nro_distrito = {nro_int}")
        except ValueError:
            print(f"   [WARN] nro_dist '{nro_dist}' no es un número válido")
    
    # Paso 4: Actualizar id_distrito basado en nro_dist
    print("\n[INFO] Actualizando id_distrito desde nro_dist...")
    cursor.execute("""
        UPDATE delegados d
        INNER JOIN distritos dt ON d.nro_dist = dt.nro_distrito
        SET d.id_distrito = dt.id_distrito
        WHERE d.nro_dist IS NOT NULL
    """)
    conn.commit()
    print(f"[OK] Filas actualizadas: {cursor.rowcount}")
    
    # Paso 5: Eliminar columna nro_dist
    print("\n[INFO] Eliminando columna nro_dist...")
    try:
        cursor.execute("ALTER TABLE delegados DROP COLUMN nro_dist")
        conn.commit()
        print("[OK] Columna nro_dist eliminada")
    except Exception as e:
        print(f"[ERROR] Error eliminando nro_dist: {e}")
        conn.rollback()
    
    # Paso 6: Agregar clave foránea
    print("\n[INFO] Agregando clave foránea a distritos...")
    try:
        cursor.execute("""
            ALTER TABLE delegados 
            ADD CONSTRAINT fk_delegados_distrito 
            FOREIGN KEY (id_distrito) REFERENCES distritos(id_distrito)
            ON DELETE SET NULL ON UPDATE CASCADE
        """)
        conn.commit()
        print("[OK] Clave foránea agregada")
    except Exception as e:
        print(f"[ERROR] Error agregando FK: {e}")
        conn.rollback()
    
    # Paso 7: Verificación final
    print("\n" + "="*80)
    print("VERIFICACION FINAL")
    print("="*80)
    
    cursor.execute("DESCRIBE delegados")
    print("\nEstructura de delegados:")
    for row in cursor.fetchall():
        print(f"   {row['Field']}: {row['Type']}")
    
    cursor.execute("""
        SELECT d.id_delegado, d.nombre, d.apellido, d.id_distrito, dt.nro_distrito
        FROM delegados d
        LEFT JOIN distritos dt ON d.id_distrito = dt.id_distrito
        WHERE d.id_distrito IS NOT NULL
        LIMIT 10
    """)
    print("\nDelegados con distrito asignado:")
    for row in cursor.fetchall():
        print(f"   {row['nombre']} {row['apellido']} - id_distrito: {row['id_distrito']} (nro: {row['nro_distrito']})")
    
    cursor.close()
    conn.close()
    
    print("\n" + "="*80)
    print("[OK] MIGRACION COMPLETADA")
    print("="*80)

if __name__ == '__main__':
    migrate()
