# backend/sync_recintos_mesas.py
# -*- coding: utf-8 -*-
"""
Script para sincronizar recintos y mesas con el archivo basehugofil.xlsx
- Actualiza recintos verificando provincia y municipio correspondiente
- Actualiza mesas con numero_mesa y cantidad_inscritos
- Elimina mesas que no están en el Excel
- Añade mesas faltantes
"""

import pandas as pd
import sys
import os
import io

# Configurar UTF-8 para salida en Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Agregar el path del backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import DatabaseConnection

def cargar_excel(ruta_archivo):
    """Carga el archivo Excel y devuelve los datos únicos"""
    df = pd.read_excel(ruta_archivo, sheet_name='Hoja4')
    
    # Limpieza de datos
    df = df.dropna(subset=['NombreRecinto', 'NumeroMesa'])
    df['NumeroMesa'] = df['NumeroMesa'].astype(int)
    df['InscritosHabilitados'] = df['InscritosHabilitados'].fillna(0).astype(int)
    
    return df

def obtener_jerarquia_completa(df):
    """Obtiene la jerarquía completa desde el Excel"""
    # Obtener departamentos únicos
    departamentos = df['NombreDepartamento'].unique().tolist()
    
    # Obtener provincias únicas por departamento
    provincias = df.groupby('NombreDepartamento')['NombreProvincia'].unique().to_dict()
    
    # Obtener municipios únicos por provincia
    municipios = df.groupby('NombreProvincia')['NombreMunicipio'].unique().to_dict()
    
    # Obtener recintos únicos con su municipio
    recintos_df = df[['NombreMunicipio', 'NombreRecinto']].drop_duplicates()
    recintos = recintos_df.groupby('NombreMunicipio')['NombreRecinto'].unique().to_dict()
    
    return departamentos, provincias, municipios, recintos

def sincronizar_departamentos():
    """Sincroniza la tabla departamentos"""
    with DatabaseConnection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id_departamento, nombre FROM departamentos")
        return {row['nombre'].upper(): row['id_departamento'] for row in cursor.fetchall()}

def sincronizar_provincias(id_departamento):
    """Sincroniza la tabla provincias para un departamento"""
    with DatabaseConnection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id_provincia, nombre, id_departamento FROM provincias WHERE id_departamento = %s", (id_departamento,))
        return {row['nombre'].upper(): row['id_provincia'] for row in cursor.fetchall()}

def sincronizar_municipios(id_provincia):
    """Sincroniza la tabla municipios para una provincia"""
    with DatabaseConnection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id_municipio, nombre, id_provincia FROM municipios WHERE id_provincia = %s", (id_provincia,))
        return {row['nombre'].upper(): row['id_municipio'] for row in cursor.fetchall()}

def sincronizar_recintos_y_mesas(df):
    """Sincroniza recintos y mesas con el Excel"""
    print("\n" + "="*80)
    print("SINCRONIZACIÓN DE RECINTOS Y MESAS")
    print("="*80)
    
    # Obtener datos actuales de la BD
    with DatabaseConnection() as conn:
        cursor = conn.cursor(dictionary=True)
        
        # Obtener todos los municipios con su jerarquía
        cursor.execute("""
            SELECT m.id_municipio, m.nombre as municipio, 
                   p.id_provincia, p.nombre as provincia,
                   d.id_departamento, d.nombre as departamento
            FROM municipios m
            JOIN provincias p ON m.id_provincia = p.id_provincia
            JOIN departamentos d ON p.id_departamento = d.id_departamento
        """)
        municipios_bd = cursor.fetchall()
        
        # Crear diccionario para búsqueda
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
        
        # Obtener mesas actuales
        cursor.execute("SELECT id_mesa, numero_mesa, id_recinto, cantidad_inscritos FROM mesas")
        mesas_bd = cursor.fetchall()
        
    print(f"\n[INFO] Datos actuales en BD:")
    print(f"   Municipios: {len(municipios_bd)}")
    print(f"   Recintos: {len(recintos_bd)}")
    print(f"   Mesas: {len(mesas_bd)}")
    
    # Procesar Excel
    print(f"\n[INFO] Datos en Excel:")
    print(f"   Total registros: {len(df)}")
    
    # Agrupar por recinto para obtener información única
    recintos_excel = df.groupby(['NombreDepartamento', 'NombreProvincia', 'NombreMunicipio', 'NombreRecinto']).agg({
        'NumeroMesa': 'count',  # Cantidad de mesas por recinto
        'InscritosHabilitados': 'sum'  # Total de inscritos por recinto
    }).reset_index()
    
    print(f"\n[INFO] Recintos únicos en Excel: {len(recintos_excel)}")
    
    # Agrupar por mesa (puede haber múltiples registros por mesa si hay múltiples recintos)
    mesas_excel = df.groupby(['NombreDepartamento', 'NombreProvincia', 'NombreMunicipio', 'NombreRecinto', 'NumeroMesa']).agg({
        'InscritosHabilitados': 'first'
    }).reset_index()
    
    print(f"[INFO] Mesas únicas en Excel: {len(mesas_excel)}")
    
    # Sincronizar recintos
    print("\n" + "-"*80)
    print("SINCRONIZANDO RECINTOS...")
    print("-"*80)
    
    recintos_creados = 0
    recintos_verificados = 0
    recintos_sin_municipio = 0
    
    with DatabaseConnection() as conn:
        cursor = conn.cursor(dictionary=True)
        
        for _, row in recintos_excel.iterrows():
            depto = row['NombreDepartamento'].upper()
            provincia = row['NombreProvincia'].upper()
            municipio = row['NombreMunicipio'].upper()
            recinto = row['NombreRecinto'].upper()
            
            # Buscar municipio en la BD
            key = (depto, provincia, municipio)
            if key not in municipios_map:
                # Intentar solo con municipio
                for k in municipios_map.keys():
                    if k[2] == municipio:
                        key = k
                        break
            
            if key not in municipios_map:
                print(f"   [WARN] Municipio no encontrado: {depto} - {provincia} - {municipio}")
                recintos_sin_municipio += 1
                continue
            
            id_municipio = municipios_map[key]['id_municipio']
            
            # Verificar si el recinto existe
            if recinto in recintos_map:
                recinto_bd = recintos_map[recinto]
                # Verificar que pertenezca al municipio correcto
                if recinto_bd['id_municipio'] != id_municipio:
                    print(f"   [WARN] Recinto '{recinto}' está en municipio incorrecto. Actualizando...")
                    cursor.execute("""
                        UPDATE recintos SET id_municipio = %s WHERE id_recinto = %s
                    """, (id_municipio, recinto_bd['id_recinto']))
                    recintos_map[recinto]['id_municipio'] = id_municipio
                recintos_verificados += 1
            else:
                # Crear recinto
                try:
                    cursor.execute("""
                        INSERT INTO recintos (nombre, id_municipio) VALUES (%s, %s)
                    """, (row['NombreRecinto'], id_municipio))
                    conn.commit()
                    nuevo_id = cursor.lastrowid
                    recintos_map[recinto] = {'id_recinto': nuevo_id, 'id_municipio': id_municipio}
                    recintos_creados += 1
                    print(f"   [OK] Recinto creado: {row['NombreRecinto']} ({municipio})")
                except Exception as e:
                    print(f"   [ERROR] Error creando recinto {row['NombreRecinto']}: {e}")
                    conn.rollback()
    
    print(f"\n[INFO] Resumen de recintos:")
    print(f"   Verificados: {recintos_verificados}")
    print(f"   Creados: {recintos_creados}")
    print(f"   Sin municipio: {recintos_sin_municipio}")
    
    # Sincronizar mesas
    print("\n" + "-"*80)
    print("SINCRONIZANDO MESAS...")
    print("-"*80)
    
    # Recargar recintos actualizados
    with DatabaseConnection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id_recinto, nombre, id_municipio FROM recintos")
        recintos_bd = cursor.fetchall()
        recintos_map = {r['nombre'].upper(): r for r in recintos_bd}
    
    mesas_creadas = 0
    mesas_actualizadas = 0
    mesas_eliminadas = 0
    mesas_sin_recinto = 0
    
    # Crear conjunto de mesas en Excel
    mesas_excel_set = set()
    for _, row in mesas_excel.iterrows():
        recinto_key = row['NombreRecinto'].upper()
        numero_mesa = int(row['NumeroMesa'])
        mesas_excel_set.add((recinto_key, numero_mesa))
    
    # Eliminar mesas que no están en el Excel
    print("\n[INFO] Eliminando mesas que no están en el Excel...")
    with DatabaseConnection() as conn:
        cursor = conn.cursor(dictionary=True)
        
        for mesa in mesas_bd:
            # Buscar el recinto de esta mesa
            cursor.execute("SELECT nombre FROM recintos WHERE id_recinto = %s", (mesa['id_recinto'],))
            recinto_row = cursor.fetchone()
            if recinto_row:
                recinto_key = recinto_row['nombre'].upper()
                mesa_key = (recinto_key, mesa['numero_mesa'])
                
                if mesa_key not in mesas_excel_set:
                    cursor.execute("DELETE FROM mesas WHERE id_mesa = %s", (mesa['id_mesa'],))
                    conn.commit()
                    mesas_eliminadas += 1
                    if mesas_eliminadas <= 10:  # Mostrar solo las primeras 10
                        print(f"   [DELETE] Mesa eliminada: {mesa['numero_mesa']} ({recinto_row['nombre']})")
    
    if mesas_eliminadas > 10:
        print(f"   ... y {mesas_eliminadas - 10} mesas más eliminadas")
    
    # Añadir/Actualizar mesas del Excel
    print("\n[INFO] Añadiendo/Actualizando mesas del Excel...")
    with DatabaseConnection() as conn:
        cursor = conn.cursor()
        
        for _, row in mesas_excel.iterrows():
            recinto_key = row['NombreRecinto'].upper()
            numero_mesa = int(row['NumeroMesa'])
            inscritos = int(row['InscritosHabilitados'])
            
            if recinto_key not in recintos_map:
                mesas_sin_recinto += 1
                continue
            
            id_recinto = recintos_map[recinto_key]['id_recinto']
            
            # Verificar si la mesa existe
            cursor.execute("""
                SELECT id_mesa, cantidad_inscritos FROM mesas 
                WHERE numero_mesa = %s AND id_recinto = %s
            """, (numero_mesa, id_recinto))
            mesa_existente = cursor.fetchone()
            
            if mesa_existente:
                # Actualizar si es necesario
                if mesa_existente[1] != inscritos:
                    cursor.execute("""
                        UPDATE mesas SET cantidad_inscritos = %s WHERE id_mesa = %s
                    """, (inscritos, mesa_existente[0]))
                    conn.commit()
                    mesas_actualizadas += 1
            else:
                # Insertar nueva mesa
                try:
                    cursor.execute("""
                        INSERT INTO mesas (numero_mesa, id_recinto, cantidad_inscritos) 
                        VALUES (%s, %s, %s)
                    """, (numero_mesa, id_recinto, inscritos))
                    conn.commit()
                    mesas_creadas += 1
                    if mesas_creadas <= 10:  # Mostrar solo las primeras 10
                        print(f"   [OK] Mesa creada: {numero_mesa} - {row['NombreRecinto']} ({inscritos} inscritos)")
                except Exception as e:
                    print(f"   [ERROR] Error creando mesa {numero_mesa}: {e}")
                    conn.rollback()
    
    if mesas_creadas > 10:
        print(f"   ... y {mesas_creadas - 10} mesas más creadas")
    
    print(f"\n[INFO] Resumen de mesas:")
    print(f"   Creadas: {mesas_creadas}")
    print(f"   Actualizadas: {mesas_actualizadas}")
    print(f"   Eliminadas: {mesas_eliminadas}")
    print(f"   Sin recinto: {mesas_sin_recinto}")
    
    # Verificación final
    print("\n" + "="*80)
    print("VERIFICACIÓN FINAL")
    print("="*80)
    
    with DatabaseConnection() as conn:
        cursor = conn.cursor(dictionary=True)
        
        # Total de mesas en BD
        cursor.execute("SELECT COUNT(*) as total FROM mesas")
        total_mesas_bd = cursor.fetchone()['total']
        
        # Total de mesas en Excel
        total_mesas_excel = len(mesas_excel)
        
        # Total de inscritos en BD
        cursor.execute("SELECT SUM(cantidad_inscritos) as total FROM mesas")
        total_inscritos_bd = cursor.fetchone()['total'] or 0
        
        # Total de inscritos en Excel
        total_inscritos_excel = mesas_excel['InscritosHabilitados'].sum()
        
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

def main():
    ruta_excel = os.path.join(os.path.dirname(__file__), '..', 'basehugofil.xlsx')
    
    if not os.path.exists(ruta_excel):
        print(f"[ERROR] No se encontró el archivo: {ruta_excel}")
        return
    
    print("Cargando archivo Excel...")
    df = cargar_excel(ruta_excel)
    
    print("Sincronizando recintos y mesas...")
    sincronizar_recintos_y_mesas(df)
    
    print("\n" + "="*80)
    print("[OK] SINCRONIZACIÓN COMPLETADA")
    print("="*80)

if __name__ == '__main__':
    main()
