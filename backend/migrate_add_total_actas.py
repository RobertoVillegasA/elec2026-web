#!/usr/bin/env python3
"""
Script para añadir la columna total_actas a la tabla actas
"""
from db import DatabaseConnection

def migrate():
    """Agrega la columna total_actas a la tabla actas"""
    with DatabaseConnection() as conn:
        if not conn:
            print("❌ No se pudo conectar a la base de datos")
            return False
        
        try:
            cursor = conn.cursor()
            
            # Verificar si la columna ya existe
            cursor.execute("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'actas' AND COLUMN_NAME = 'total_actas'
            """)
            
            if cursor.fetchone():
                print("✅ La columna total_actas ya existe en la tabla actas")
                cursor.close()
                return True
            
            # Agregar la columna
            print("⏳ Añadiendo columna total_actas a la tabla actas...")
            cursor.execute("""
                ALTER TABLE actas 
                ADD COLUMN total_actas INT DEFAULT 0 AFTER votos_nulos
            """)
            
            conn.commit()
            print("✅ Columna total_actas agregada correctamente")
            cursor.close()
            return True
            
        except Exception as e:
            print(f"❌ Error durante la migración: {e}")
            return False

if __name__ == '__main__':
    migrate()
