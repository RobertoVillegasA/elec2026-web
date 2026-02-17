#!/usr/bin/env python3
"""
Script para probar la conexión y el funcionamiento del endpoint municipal
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from mysql_config import MYSQL_CONFIG
    import mysql.connector
    
    # Conectar a la base de datos
    connection = mysql.connector.connect(**MYSQL_CONFIG)
    
    if connection.is_connected():
        cursor = connection.cursor()
        
        # Verificar si existen las columnas necesarias
        print("[INFO] Verificando columnas en tabla actas...")
        cursor.execute("DESCRIBE actas")
        columns = [col[0] for col in cursor.fetchall()]
        
        required_cols = ['id_cargo_alca', 'id_cargo_cons', 'votos_blancos_a', 'votos_nulos_a', 'votos_blancos_c', 'votos_nulos_c']
        missing_cols = [col for col in required_cols if col not in columns]
        
        if missing_cols:
            print(f"[ERROR] Columnas faltantes en actas: {missing_cols}")
        else:
            print("[OK] Todas las columnas requeridas existen en actas")
        
        print("\n[INFO] Verificando columnas en tabla votos_detalle...")
        cursor.execute("DESCRIBE votos_detalle")
        columns = [col[0] for col in cursor.fetchall()]
        
        if 'tipo_voto' not in columns:
            print("[ERROR] Columna tipo_voto no encontrada en votos_detalle")
        else:
            print("[OK] Columna tipo_voto existe en votos_detalle")
            
        # Verificar el tipo de dato de tipo_voto
        cursor.execute("SHOW COLUMNS FROM votos_detalle LIKE 'tipo_voto'")
        col_info = cursor.fetchone()
        if col_info:
            print(f"[OK] tipo_voto existe con tipo: {col_info[1]}")
        
        cursor.close()
        connection.close()
        print("\n[SUCCESS] Conexion a base de datos exitosa y verificaciones completadas")
        
except Exception as e:
    print(f"[ERROR] Error al conectar con la base de datos: {e}")