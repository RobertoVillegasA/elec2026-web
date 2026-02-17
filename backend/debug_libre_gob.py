#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para debug: Verificar datos de votos LIBRE en SUBNACIONAL
"""

import sys
import os

os.chdir(os.path.join(os.path.dirname(__file__), 'backend'))
sys.path.insert(0, os.path.dirname(__file__) + '/backend')

from db import DatabaseConnection

print("=" * 80)
print("🔍 DEBUG: Verificando datos de votos LIBRE (Gobernador)")
print("=" * 80)

try:
    with DatabaseConnection() as conn:
        cursor = conn.cursor(dictionary=True)
        
        # 1. Verificar organizaciones
        print("\n1️⃣ Organizaciones Políticas disponibles:")
        print("-" * 80)
        cursor.execute("SELECT id_organizacion, nombre, sigla FROM organizaciones_politicas ORDER BY nombre")
        orgs = cursor.fetchall()
        for org in orgs:
            print(f"  {org['id_organizacion']:3} | {org['nombre']:30} | {org['sigla']}")
        
        # 2. Verificar actas SUBNACIONAL
        print("\n2️⃣ Actas de tipo SUBNACIONAL:")
        print("-" * 80)
        cursor.execute("SELECT COUNT(*) as count FROM actas WHERE tipo_papeleta = 'SUBNACIONAL'")
        result = cursor.fetchone()
        print(f"  Total actas SUBNACIONAL: {result['count']}")
        
        cursor.execute("""
            SELECT id_acta, codigo_acta, tipo_papeleta, votos_blancos, votos_nulos 
            FROM actas 
            WHERE tipo_papeleta = 'SUBNACIONAL' 
            LIMIT 5
        """)
        actas = cursor.fetchall()
        if actas:
            print(f"  Ejemplos:")
            for acta in actas:
                print(f"    ID: {acta['id_acta']}, Código: {acta['codigo_acta']}, Tipo: {acta['tipo_papeleta']}")
        else:
            print(f"  ⚠️ No hay actas SUBNACIONAL registradas")
        
        # 3. Verificar votos detalle para SUBNACIONAL
        print("\n3️⃣ Votos Detalle en actas SUBNACIONAL:")
        print("-" * 80)
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM votos_detalle vd
            JOIN actas a ON vd.id_acta = a.id_acta
            WHERE a.tipo_papeleta = 'SUBNACIONAL'
        """)
        result = cursor.fetchone()
        print(f"  Total registros votos_detalle: {result['count']}")
        
        # 4. Verificar votos específicamente para LIBRE
        print("\n4️⃣ Votos para LIBRE en SUBNACIONAL:")
        print("-" * 80)
        cursor.execute("""
            SELECT 
                op.nombre, op.sigla,
                SUM(vd.votos_cantidad) as total_votos
            FROM votos_detalle vd
            JOIN actas a ON vd.id_acta = a.id_acta
            JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
            WHERE a.tipo_papeleta = 'SUBNACIONAL'
            GROUP BY op.id_organizacion, op.nombre, op.sigla
            ORDER BY total_votos DESC
        """)
        votos = cursor.fetchall()
        if votos:
            for voto in votos:
                print(f"  {voto['nombre']:30} ({voto['sigla']:5}) = {voto['total_votos']} votos")
        else:
            print(f"  ⚠️ No hay votos registrados para SUBNACIONAL")
        
        # 5. Verificar específicamente LIBRE
        print("\n5️⃣ Búsqueda específica de LIBRE:")
        print("-" * 80)
        cursor.execute("""
            SELECT 
                op.id_organizacion,
                op.nombre, 
                op.sigla,
                COUNT(*) as total_registros,
                SUM(vd.votos_cantidad) as total_votos
            FROM votos_detalle vd
            JOIN actas a ON vd.id_acta = a.id_acta
            JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
            WHERE op.sigla = 'LIBRE' AND a.tipo_papeleta = 'SUBNACIONAL'
            GROUP BY op.id_organizacion, op.nombre, op.sigla
        """)
        result = cursor.fetchone()
        if result:
            print(f"  Organización: {result['nombre']}")
            print(f"  Sigla: {result['sigla']}")
            print(f"  Total registros: {result['total_registros']}")
            print(f"  Total votos: {result['total_votos']}")
        else:
            print(f"  ❌ No se encontraron votos para LIBRE en SUBNACIONAL")
        
        # 6. Ver un ejemplo de votos detalle
        print("\n6️⃣ Ejemplo de votos_detalle (primeros 10):")
        print("-" * 80)
        cursor.execute("""
            SELECT 
                vd.id_voto, vd.id_acta, a.codigo_acta, a.tipo_papeleta,
                op.nombre, op.sigla,
                vd.votos_cantidad
            FROM votos_detalle vd
            JOIN actas a ON vd.id_acta = a.id_acta
            JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
            LIMIT 10
        """)
        detalles = cursor.fetchall()
        if detalles:
            for detalle in detalles:
                print(f"  Acta: {detalle['codigo_acta']:20} Tipo: {detalle['tipo_papeleta']:15} | {detalle['nombre']:30} = {detalle['votos_cantidad']}")
        
        cursor.close()
        
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
