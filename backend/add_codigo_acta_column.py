#!/usr/bin/env python3
# backend/add_codigo_acta_column.py
"""
Script para agregar la columna 'codigo_acta' a la tabla 'actas'
"""

from db import DatabaseConnection

print("🔧 Agregando columna 'codigo_acta' a la tabla 'actas'...\n")

try:
    with DatabaseConnection() as conn:
        cursor = conn.cursor()
        
        # Verificar si la columna ya existe
        cursor.execute("""
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'actas' AND COLUMN_NAME = 'codigo_acta'
        """)
        
        result = cursor.fetchone()
        if result[0] > 0:
            print("⚠️ La columna 'codigo_acta' ya existe")
        else:
            print("  Ejecutando: ALTER TABLE actas ADD COLUMN codigo_acta VARCHAR(100) UNIQUE NOT NULL DEFAULT ''")
            
            # Primero agregamos con valor por defecto
            cursor.execute("ALTER TABLE actas ADD COLUMN codigo_acta VARCHAR(100) DEFAULT ''")
            print("  ✅ Columna agregada con valor por defecto")
            
            # Hacer la columna UNIQUE
            cursor.execute("ALTER TABLE actas ADD UNIQUE KEY unique_codigo_acta (codigo_acta)")
            print("  ✅ Restricción UNIQUE agregada")
            
            conn.commit()
            print("\n✅ ¡COLUMNA AGREGADA EXITOSAMENTE!")
        
        cursor.close()
        
        # Verificar la nueva estructura
        print("\n" + "=" * 80)
        print("NUEVA ESTRUCTURA DE TABLA 'ACTAS':")
        print("=" * 80)
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("DESCRIBE actas")
        columns = cursor.fetchall()
        
        for col in columns:
            print(f"  {col['Field']:.<30} {col['Type']:.<30} {col['Null']}")
        
        cursor.close()
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
