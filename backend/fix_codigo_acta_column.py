#!/usr/bin/env python3
# backend/fix_codigo_acta_column.py
"""
Script para arreglar la columna 'codigo_acta' en la tabla 'actas'
"""

from db import DatabaseConnection
from datetime import datetime

print("🔧 Arreglando columna 'codigo_acta' en la tabla 'actas'...\n")

try:
    with DatabaseConnection() as conn:
        cursor = conn.cursor(dictionary=True)
        
        # Verificar si la columna ya existe pero sin valores
        cursor.execute("""
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'actas' AND COLUMN_NAME = 'codigo_acta'
        """)
        
        result = cursor.fetchone()
        
        if result['count'] == 0:
            print("  1️⃣ Agregando columna 'codigo_acta'...")
            cursor.execute("ALTER TABLE actas ADD COLUMN codigo_acta VARCHAR(100) NULLABLE")
            print("     ✅ Columna agregada")
        else:
            print("  ℹ️ Columna 'codigo_acta' ya existe")
        
        # Obtener actas sin codigo_acta
        print("\n  2️⃣ Generando códigos de acta para registros existentes...")
        cursor.execute("SELECT id_acta, id_mesa FROM actas WHERE codigo_acta IS NULL OR codigo_acta = ''")
        actas = cursor.fetchall()
        
        if actas:
            print(f"     Encontradas {len(actas)} actas sin código")
            for acta in actas:
                # Generar código único basado en id y fecha
                codigo = f"ACTA-{acta['id_mesa']}-{acta['id_acta']:04d}"
                print(f"     Actualizando acta {acta['id_acta']} → {codigo}")
                cursor.execute(
                    "UPDATE actas SET codigo_acta = %s WHERE id_acta = %s",
                    (codigo, acta['id_acta'])
                )
        else:
            print("     ℹ️ Todas las actas ya tienen código")
        
        # Ahora hacer la columna NOT NULL y UNIQUE
        print("\n  3️⃣ Configurando restricciones...")
        cursor.execute("ALTER TABLE actas MODIFY COLUMN codigo_acta VARCHAR(100) NOT NULL UNIQUE")
        print("     ✅ Columna configurada como NOT NULL y UNIQUE")
        
        conn.commit()
        print("\n✅ ¡ARREGLO COMPLETADO!")
        
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
