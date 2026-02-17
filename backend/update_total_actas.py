#!/usr/bin/env python3
"""
Script para actualizar el campo total_actas basado en los votos registrados
"""
from db import DatabaseConnection

def update_total_actas():
    """Actualiza total_actas para actas que no lo tienen registrado"""
    with DatabaseConnection() as conn:
        if not conn:
            print("❌ No se pudo conectar a la base de datos")
            return False
        
        try:
            cursor = conn.cursor()
            
            # Obtener todas las actas de gobernación sin total_actas o con total_actas = 0
            cursor.execute("""
                SELECT a.id_acta, a.votos_blancos, a.votos_nulos,
                       COALESCE(SUM(vd.votos_cantidad), 0) as votos_cantidad
                FROM actas a
                LEFT JOIN votos_detalle vd ON a.id_acta = vd.id_acta
                WHERE a.tipo_papeleta = 'SUBNACIONAL' 
                AND (a.total_actas IS NULL OR a.total_actas = 0)
                GROUP BY a.id_acta
            """)
            
            actas = cursor.fetchall()
            
            if not actas:
                print("✅ Todas las actas tienen total_actas registrado")
                cursor.close()
                return True
            
            print(f"⏳ Actualizando {len(actas)} actas de gobernación...")
            
            updated = 0
            for acta in actas:
                id_acta, blancos, nulos, votos_cantidad = acta
                # El total es la suma de todos los votos
                total = votos_cantidad + (blancos or 0) + (nulos or 0)
                
                if total > 0:
                    cursor.execute("""
                        UPDATE actas 
                        SET total_actas = %s
                        WHERE id_acta = %s
                    """, (total, id_acta))
                    updated += 1
            
            conn.commit()
            print(f"✅ {updated} actas actualizadas correctamente")
            
            # Ahora actualizar municipales
            print("⏳ Actualizando actas municipales...")
            cursor.execute("""
                SELECT a.id_acta, a.votos_blancos, a.votos_nulos,
                       COALESCE(SUM(vd.votos_cantidad), 0) as votos_cantidad
                FROM actas a
                LEFT JOIN votos_detalle vd ON a.id_acta = vd.id_acta
                WHERE a.tipo_papeleta = 'MUNICIPAL' 
                AND (a.total_actas IS NULL OR a.total_actas = 0)
                GROUP BY a.id_acta
            """)
            
            actas_mun = cursor.fetchall()
            
            if not actas_mun:
                print("✅ Todas las actas municipales tienen total_actas registrado")
                cursor.close()
                return True
            
            print(f"⏳ Actualizando {len(actas_mun)} actas municipales...")
            
            updated_mun = 0
            for acta in actas_mun:
                id_acta, blancos, nulos, votos_cantidad = acta
                # El total es la suma de todos los votos
                total = votos_cantidad + (blancos or 0) + (nulos or 0)
                
                if total > 0:
                    cursor.execute("""
                        UPDATE actas 
                        SET total_actas = %s
                        WHERE id_acta = %s
                    """, (total, id_acta))
                    updated_mun += 1
            
            conn.commit()
            print(f"✅ {updated_mun} actas municipales actualizadas correctamente")
            cursor.close()
            return True
            
        except Exception as e:
            print(f"❌ Error durante la actualización: {e}")
            return False

if __name__ == '__main__':
    update_total_actas()
