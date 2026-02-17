#!/usr/bin/env python3
# backend/test_connection_simple.py
"""
Script simple para probar conexión a MySQL
"""

from db import DatabaseConnection

print("🔍 Probando conexión a MySQL...")

try:
    print("\n1. Obteniendo conexión...")
    with DatabaseConnection() as conn:
        print("   ✅ Conexión exitosa")
        
        cursor = conn.cursor(dictionary=True)
        
        print("\n2. Información del servidor...")
        cursor.execute("SELECT DATABASE() as db, USER() as user, VERSION() as version")
        result = cursor.fetchone()
        print(f"   Base de datos: {result['db']}")
        print(f"   Usuario: {result['user']}")
        print(f"   Versión: {result['version']}")
        
        print("\n3. Contando tablas...")
        cursor.execute("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'elec2026'")
        result = cursor.fetchone()
        print(f"   Tablas: {result['count']}")
        
        cursor.close()
    
    print("\n✅ ¡CONEXIÓN EXITOSA!")
    print("   Todas las pruebas pasaron correctamente.")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
