#!/usr/bin/env python3
# backend/test_connection.py
"""
Script para probar conexión a MySQL y diagnosticar problemas
"""

import sys
import time
from db import DatabaseConnection, get_connection_pool

def test_basic_connection():
    """Prueba conexión básica"""
    print("=" * 60)
    print("🔍 PRUEBA 1: Conexión Básica")
    print("=" * 60)
    
    try:
        with DatabaseConnection() as conn:
            if conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute("SELECT DATABASE() as db, USER() as user, VERSION() as version")
                result = cursor.fetchone()
                print(f"✅ Base de datos: {result['db']}")
                print(f"✅ Usuario: {result['user']}")
                print(f"✅ Versión MySQL: {result['version']}")
                cursor.close()
                return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_multiple_connections():
    """Prueba múltiples conexiones simultáneas"""
    print("\n" + "=" * 60)
    print("🔍 PRUEBA 2: Múltiples Conexiones")
    print("=" * 60)
    
    try:
        connections = []
        for i in range(3):
            print(f"  Conectando {i+1}/3...", end=" ")
            with DatabaseConnection() as conn:
                if conn:
                    cursor = conn.cursor()
                    cursor.execute("SELECT 1")
                    cursor.fetchone()
                    cursor.close()
                    print("✅")
                    connections.append(True)
        
        if len(connections) == 3:
            print(f"✅ Todas las conexiones exitosas")
            return True
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def test_timeout():
    """Prueba con tiempo de espera"""
    print("\n" + "=" * 60)
    print("🔍 PRUEBA 3: Resistencia a Timeout")
    print("=" * 60)
    
    try:
        print("  Esperando 5 segundos...", end=" ")
        time.sleep(5)
        
        print("\n  Reconectando...", end=" ")
        with DatabaseConnection() as conn:
            if conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.fetchone()
                cursor.close()
                print("✅")
                return True
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def test_query_performance():
    """Prueba rendimiento de consultas"""
    print("\n" + "=" * 60)
    print("🔍 PRUEBA 4: Rendimiento de Consultas")
    print("=" * 60)
    
    try:
        with DatabaseConnection() as conn:
            if conn:
                cursor = conn.cursor()
                
                # Prueba SELECT
                start = time.time()
                cursor.execute("SELECT COUNT(*) FROM organizaciones_politicas")
                count = cursor.fetchone()[0]
                elapsed = time.time() - start
                print(f"✅ SELECT (10ms): {count} registros en {elapsed*1000:.2f}ms")
                
                # Prueba INSERT (si hay tabla de prueba)
                cursor.close()
                return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def show_pool_status():
    """Muestra estado del pool de conexiones"""
    print("\n" + "=" * 60)
    print("📊 Estado del Pool")
    print("=" * 60)
    
    try:
        pool = get_connection_pool()
        if pool:
            print(f"✅ Pool creado: {pool._pool_name}")
            print(f"✅ Tamaño del pool: {pool._pool_size}")
            # Nota: atributos privados pueden variar según versión
        else:
            print("❌ Pool no disponible")
    except Exception as e:
        print(f"⚠️ No se pudo obtener info del pool: {e}")

def main():
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " PRUEBA DE CONEXIÓN MYSQL ".center(58) + "║")
    print("╚" + "=" * 58 + "╝")
    
    results = {
        "Conexión Básica": test_basic_connection(),
        "Múltiples Conexiones": test_multiple_connections(),
        "Resistencia a Timeout": test_timeout(),
        "Rendimiento": test_query_performance(),
    }
    
    show_pool_status()
    
    # Resumen
    print("\n" + "=" * 60)
    print("📋 RESUMEN")
    print("=" * 60)
    
    for test_name, result in results.items():
        status = "✅ PASÓ" if result else "❌ FALLÓ"
        print(f"{test_name:.<40} {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n✅ ¡TODAS LAS PRUEBAS PASARON!")
        print("   La conexión a MySQL está funcionando correctamente.")
        return 0
    else:
        print("\n❌ ALGUNAS PRUEBAS FALLARON")
        print("   Revise los errores arriba y verifique:")
        print("   1. MySQL está corriendo (netstat -an | find 3306)")
        print("   2. Credenciales en mysql_config.py son correctas")
        print("   3. Firewall permite conexión a localhost:3306")
        return 1

if __name__ == "__main__":
    sys.exit(main())
