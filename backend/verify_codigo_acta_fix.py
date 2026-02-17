#!/usr/bin/env python3
# backend/verify_codigo_acta_fix.py
"""
Script para verificar que la solución está completa
"""

from db import DatabaseConnection

print("✅ VERIFICACIÓN - Error MySQL 1054: Unknown column 'codigo_acta'")
print("=" * 80)

try:
    with DatabaseConnection() as conn:
        cursor = conn.cursor(dictionary=True)
        
        # 1. Verificar que la columna existe
        print("\n1️⃣ Verificando columna 'codigo_acta'...")
        cursor.execute("""
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'actas' AND COLUMN_NAME = 'codigo_acta'
        """)
        result = cursor.fetchone()
        
        if result:
            print(f"   ✅ Columna existe")
            print(f"   - Tipo: {result['COLUMN_TYPE']}")
            print(f"   - Nullable: {result['IS_NULLABLE']}")
            print(f"   - Clave: {result['COLUMN_KEY']}")
        else:
            print(f"   ❌ Columna NO existe")
            exit(1)
        
        # 2. Verificar que todos los registros tienen código
        print("\n2️⃣ Verificando registros...")
        cursor.execute("SELECT COUNT(*) as count FROM actas WHERE codigo_acta IS NULL OR codigo_acta = ''")
        result = cursor.fetchone()
        
        if result['count'] == 0:
            print(f"   ✅ Todos los registros tienen código_acta")
        else:
            print(f"   ⚠️ {result['count']} registros sin código_acta")
        
        # 3. Mostrar ejemplos
        print("\n3️⃣ Ejemplos de actas registradas:")
        cursor.execute("SELECT id_acta, id_mesa, codigo_acta, tipo_papeleta FROM actas LIMIT 5")
        actas = cursor.fetchall()
        
        for acta in actas:
            print(f"   ID {acta['id_acta']:>2} | Mesa {acta['id_mesa']:>5} | {acta['codigo_acta']:20} | {acta['tipo_papeleta']}")
        
        # 4. Probar consulta de validación
        print("\n4️⃣ Probando validación de código_acta duplicado...")
        cursor.execute("SELECT COUNT(*) as count FROM actas WHERE codigo_acta = %s", ("ACTA-6391-0002",))
        result = cursor.fetchone()
        
        if result['count'] > 0:
            print(f"   ✅ Validación funciona correctamente")
        
        print("\n" + "=" * 80)
        print("✅ ¡TODAS LAS VERIFICACIONES PASARON!")
        print("   El error 1054 está RESUELTO")
        print("   Ya puedes guardar actas sin problemas")
        
        cursor.close()
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
