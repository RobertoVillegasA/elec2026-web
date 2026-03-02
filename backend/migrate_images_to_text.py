#!/usr/bin/env python3
"""
Script para migrar las columnas de imágenes de la tabla actas a tipo TEXT
Ejecuta el ALTER TABLE necesario y verifica los cambios
"""

from db import DatabaseConnection

print("🔧 Migrando columnas de imágenes a tipo TEXT...")

try:
    with DatabaseConnection() as conn:
        cursor = conn.cursor(dictionary=True)
        
        # Paso 1: Modificar f_acta
        print("\n📝 Modificando columna f_acta...")
        cursor.execute("""
            ALTER TABLE actas 
            MODIFY COLUMN f_acta TEXT NULL 
            COMMENT 'Nombres de archivos de acta separados por coma (ej: a_001,a_001_1,a_001_2)'
        """)
        print("   ✅ Columna f_acta modificada")
        
        # Paso 2: Modificar f_h_trabajo
        print("\n📝 Modificando columna f_h_trabajo...")
        cursor.execute("""
            ALTER TABLE actas 
            MODIFY COLUMN f_h_trabajo TEXT NULL 
            COMMENT 'Nombres de archivos de hoja de trabajo separados por coma (ej: h_001,h_001_1,h_001_2)'
        """)
        print("   ✅ Columna f_h_trabajo modificada")
        
        # Paso 3: Verificar cambios
        print("\n🔍 Verificando estructura actualizada...")
        cursor.execute("DESCRIBE actas")
        columns = cursor.fetchall()
        
        print("\n" + "=" * 70)
        print("ESTRUCTURA ACTUAL DE LA TABLA 'ACTAS':")
        print("=" * 70)
        for col in columns:
            print(f"  {col['Field']:<25} {col['Type']:<25} {col['Null']}")
        
        # Verificar columnas específicas
        cursor.execute("""
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'actas'
            AND COLUMN_NAME IN ('f_acta', 'f_h_trabajo')
        """)
        image_columns = cursor.fetchall()
        
        print("\n" + "=" * 70)
        print("COLUMNAS DE IMÁGENES ACTUALIZADAS:")
        print("=" * 70)
        for col in image_columns:
            print(f"  {col['COLUMN_NAME']}: {col['COLUMN_TYPE']} (NULL: {col['IS_NULLABLE']})")
            if col['COLUMN_COMMENT']:
                print(f"    Comentario: {col['COLUMN_COMMENT']}")
        
        print("\n" + "=" * 70)
        print("✅ MIGRACIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 70)
        print("\nLas columnas f_acta y f_h_trabajo ahora pueden almacenar:")
        print("  - Nombres de archivos de Google Drive separados por coma")
        print("  - Ejemplo: 'a_001,a_001_1,a_001_2' para actas")
        print("  - Ejemplo: 'h_001,h_001_1' para hojas de trabajo")
        
        cursor.close()
        
except Exception as e:
    print(f"\n❌ ERROR durante la migración: {e}")
    import traceback
    traceback.print_exc()
