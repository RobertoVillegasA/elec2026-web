# backend/sync_recintos_mesas_completo.py
# -*- coding: utf-8 -*-
"""
Script para sincronizar recintos y mesas con el archivo basehugofil.xlsx
Versión COMPLETA - Elimina y recrea todo para que coincida exactamente
"""

import pandas as pd
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
    """Obtiene conexión directa a la BD"""
    return mysql.connector.connect(
        host=MYSQL_CONFIG['host'],
        user=MYSQL_CONFIG['user'],
        password=MYSQL_CONFIG['password'],
        database=MYSQL_CONFIG['database']
    )

def cargar_excel(ruta_archivo):
    """Carga el archivo Excel"""
    df = pd.read_excel(ruta_archivo, sheet_name='Hoja4')
    df = df.dropna(subset=['NombreRecinto', 'NumeroMesa'])
    df['NumeroMesa'] = df['NumeroMesa'].astype(int)
    df['InscritosHabilitados'] = df['InscritosHabilitados'].fillna(0).astype(int)
    return df

def sincronizar_todo(df):
    """Sincroniza recintos y mesas - Versión completa"""
    print("\n" + "="*80)
    print("SINCRONIZACION COMPLETA DE RECINTOS Y MESAS")
    print("="*80)
    
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Obtener municipios
    cursor.execute("""
        SELECT m.id_municipio, m.nombre as municipio, 
               p.id_provincia, p.nombre as provincia,
               d.id_departamento, d.nombre as departamento
        FROM municipios m
        JOIN provincias p ON m.id_provincia = p.id_provincia
        JOIN departamentos d ON p.id_departamento = d.id_departamento
    """)
    municipios_bd = cursor.fetchall()
    
    municipios_map = {}
    for m in municipios_bd:
        key = (m['departamento'].upper(), m['provincia'].upper(), m['municipio'].upper())
        municipios_map[key] = {
            'id_municipio': m['id_municipio'],
            'id_provincia': m['id_provincia'],
            'id_departamento': m['id_departamento']
        }
    
    # Obtener recintos actuales
    cursor.execute("SELECT id_recinto, nombre, id_municipio FROM recintos")
    recintos_bd = cursor.fetchall()
    recintos_map = {r['nombre'].upper(): r for r in recintos_bd}
    
    print(f"\n[INFO] Datos actuales en BD:")
    print(f"   Recintos: {len(recintos_bd)}")
    
    # Datos del Excel
    print(f"\n[INFO] Datos en Excel:")
    print(f"   Total registros: {len(df)}")
    
    # Agrupar por recinto
    recintos_excel = df.groupby(['NombreDepartamento', 'NombreProvincia', 'NombreMunicipio', 'NombreRecinto']).agg({
        'NumeroMesa': 'count',
        'InscritosHabilitados': 'sum'
    }).reset_index()
    print(f"   Recintos unicos: {len(recintos_excel)}")
    
    # Agrupar por mesa
    mesas_excel = df.groupby(['NombreDepartamento', 'NombreProvincia', 'NombreMunicipio', 'NombreRecinto', 'NumeroMesa']).agg({
        'InscritosHabilitados': 'first'
    }).reset_index()
    print(f"   Mesas unicas: {len(mesas_excel)}")
    
    # PASO 1: Eliminar TODAS las mesas actuales
    print("\n" + "-"*80)
    print("ELIMINANDO TODAS LAS MESAS ACTUALES...")
    print("-"*80)
    cursor.execute("DELETE FROM mesas")
    conn.commit()
    print(f"[OK] Todas las mesas fueron eliminadas")
    
    # PASO 2: Eliminar recintos que no están en el Excel
    print("\n" + "-"*80)
    print("ELIMINANDO RECINTOS QUE NO ESTAN EN EL EXCEL...")
    print("-"*80)
    
    recintos_excel_set = set(row['NombreRecinto'].upper() for _, row in recintos_excel.iterrows())
    recintos_a_eliminar = [r for r in recintos_bd if r['nombre'].upper() not in recintos_excel_set]
    
    for recinto in recintos_a_eliminar[:10]:
        print(f"   [DELETE] Recinto eliminado: {recinto['nombre']}")
    
    if len(recintos_a_eliminar) > 10:
        print(f"   ... y {len(recintos_a_eliminar) - 10} recintos mas eliminados")
    
    for recinto in recintos_a_eliminar:
        cursor.execute("DELETE FROM recintos WHERE id_recinto = %s", (recinto['id_recinto'],))
    conn.commit()
    
    print(f"\n[INFO] Recintos eliminados: {len(recintos_a_eliminar)}")
    
    # Recargar recintos
    cursor.execute("SELECT id_recinto, nombre, id_municipio FROM recintos")
    recintos_bd = cursor.fetchall()
    recintos_map = {r['nombre'].upper(): r for r in recintos_bd}
    print(f"[INFO] Recintos restantes: {len(recintos_bd)}")
    
    # PASO 3: Crear/Verificar recintos
    print("\n" + "-"*80)
    print("CREANDO/VERIFICANDO RECINTOS...")
    print("-"*80)
    
    recintos_creados = 0
    recintos_verificados = 0
    
    for _, row in recintos_excel.iterrows():
        depto = row['NombreDepartamento'].upper()
        provincia = row['NombreProvincia'].upper()
        municipio = row['NombreMunicipio'].upper()
        recinto = row['NombreRecinto'].upper()
        
        key = (depto, provincia, municipio)
        if key not in municipios_map:
            for k in municipios_map.keys():
                if k[2] == municipio:
                    key = k
                    break
        
        if key not in municipios_map:
            continue
        
        id_municipio = municipios_map[key]['id_municipio']
        
        if recinto in recintos_map:
            recinto_bd = recintos_map[recinto]
            if recinto_bd['id_municipio'] != id_municipio:
                cursor.execute("""
                    UPDATE recintos SET id_municipio = %s WHERE id_recinto = %s
                """, (id_municipio, recinto_bd['id_recinto']))
                conn.commit()
                recintos_map[recinto]['id_municipio'] = id_municipio
            recintos_verificados += 1
        else:
            try:
                cursor.execute("""
                    INSERT INTO recintos (nombre, id_municipio) VALUES (%s, %s)
                """, (row['NombreRecinto'], id_municipio))
                conn.commit()
                nuevo_id = cursor.lastrowid
                recintos_map[recinto] = {'id_recinto': nuevo_id, 'id_municipio': id_municipio}
                recintos_creados += 1
            except Exception as e:
                conn.rollback()
    
    print(f"[INFO] Recintos verificados: {recintos_verificados}")
    print(f"[INFO] Recintos creados: {recintos_creados}")
    
    # Recargar recintos actualizados
    cursor.execute("SELECT id_recinto, nombre, id_municipio FROM recintos")
    recintos_bd = cursor.fetchall()
    recintos_map = {r['nombre'].upper(): r for r in recintos_bd}
    
    # PASO 4: Crear TODAS las mesas del Excel
    print("\n" + "-"*80)
    print("CREANDO TODAS LAS MESAS DEL EXCEL...")
    print("-"*80)
    
    mesas_creadas = 0
    mesas_sin_recinto = 0
    
    for _, row in mesas_excel.iterrows():
        recinto_key = row['NombreRecinto'].upper()
        numero_mesa = int(row['NumeroMesa'])
        inscritos = int(row['InscritosHabilitados'])
        
        if recinto_key not in recintos_map:
            mesas_sin_recinto += 1
            continue
        
        id_recinto = recintos_map[recinto_key]['id_recinto']
        
        try:
            cursor.execute("""
                INSERT INTO mesas (numero_mesa, id_recinto, cantidad_inscritos) 
                VALUES (%s, %s, %s)
            """, (numero_mesa, id_recinto, inscritos))
            conn.commit()
            mesas_creadas += 1
        except Exception as e:
            conn.rollback()
    
    print(f"[INFO] Mesas creadas: {mesas_creadas}")
    print(f"[INFO] Mesas sin recinto: {mesas_sin_recinto}")
    
    # VERIFICACION FINAL
    print("\n" + "="*80)
    print("VERIFICACION FINAL")
    print("="*80)
    
    cursor.execute("SELECT COUNT(*) as total FROM mesas")
    total_mesas_bd = int(cursor.fetchone()['total'])
    
    total_mesas_excel = len(mesas_excel)
    
    cursor.execute("SELECT SUM(cantidad_inscritos) as total FROM mesas")
    result = cursor.fetchone()['total']
    total_inscritos_bd = int(result) if result else 0
    
    total_inscritos_excel = int(mesas_excel['InscritosHabilitados'].sum())
    
    estado_mesas = "[OK]" if total_mesas_bd == total_mesas_excel else "[WARN]"
    estado_inscritos = "[OK]" if total_inscritos_bd == total_inscritos_excel else "[WARN]"
    
    print(f"\n{estado_mesas} Mesas en BD: {total_mesas_bd}")
    print(f"{estado_mesas} Mesas en Excel: {total_mesas_excel}")
    print(f"{estado_mesas} Diferencia: {total_mesas_bd - total_mesas_excel}")
    
    print(f"\n{estado_inscritos} Inscritos en BD: {total_inscritos_bd:,}")
    print(f"{estado_inscritos} Inscritos en Excel: {total_inscritos_excel:,}")
    print(f"{estado_inscritos} Diferencia: {total_inscritos_bd - total_inscritos_excel:,}")
    
    # Verificar recintos por municipio
    print("\n[INFO] Recintos por municipio:")
    cursor.execute("""
        SELECT m.nombre as municipio, COUNT(r.id_recinto) as recintos
        FROM municipios m
        LEFT JOIN recintos r ON m.id_municipio = r.id_municipio
        GROUP BY m.id_municipio, m.nombre
        ORDER BY recintos DESC
    """)
    for row in cursor.fetchall():
        print(f"   {row['municipio']}: {row['recintos']} recintos")
    
    cursor.close()
    conn.close()

def main():
    ruta_excel = os.path.join(os.path.dirname(__file__), '..', 'basehugofil.xlsx')
    
    if not os.path.exists(ruta_excel):
        print(f"[ERROR] No se encontro el archivo: {ruta_excel}")
        return
    
    print("Cargando archivo Excel...")
    df = cargar_excel(ruta_excel)
    
    print("Iniciando sincronización completa...")
    sincronizar_todo(df)
    
    print("\n" + "="*80)
    print("[OK] SINCRONIZACION COMPLETADA")
    print("="*80)

if __name__ == '__main__':
    main()
