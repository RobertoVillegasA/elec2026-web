#!/usr/bin/env python3
# backend/check_table_structure.py
"""
Script para verificar la estructura de la tabla 'actas'
"""

from db import DatabaseConnection

print("🔍 Verificando estructura de tabla 'actas'...\n")

try:
    with DatabaseConnection() as conn:
        cursor = conn.cursor(dictionary=True)
        
        # Obtener estructura de la tabla
        cursor.execute("DESCRIBE actas")
        columns = cursor.fetchall()
        
        print("=" * 80)
        print("COLUMNAS EN LA TABLA 'ACTAS':")
        print("=" * 80)
        
        for col in columns:
            print(f"  {col['Field']:.<30} {col['Type']:.<30} {col['Null']}")
        
        print("\n" + "=" * 80)
        print("INFORMACIÓN ADICIONAL:")
        print("=" * 80)
        
        # Contar filas
        cursor.execute("SELECT COUNT(*) as count FROM actas")
        result = cursor.fetchone()
        print(f"  Total de actas: {result['count']}")
        
        # Verificar si existe la columna codigo_acta
        cursor.execute("""
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'actas' AND COLUMN_NAME = 'codigo_acta'
        """)
        result = cursor.fetchone()
        
        if result['count'] > 0:
            print("  ✅ Columna 'codigo_acta' EXISTE")
        else:
            print("  ❌ Columna 'codigo_acta' NO EXISTE")
            print("\n  💡 Solución: Agregar columna con:")
            print("     ALTER TABLE actas ADD COLUMN codigo_acta VARCHAR(100) UNIQUE NOT NULL;")
        
        cursor.close()
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
