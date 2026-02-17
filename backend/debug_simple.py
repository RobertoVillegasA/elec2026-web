#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Debug votos LIBRE"""
import sys
sys.path.insert(0, '.')

from db import DatabaseConnection

with DatabaseConnection() as conn:
    cursor = conn.cursor(dictionary=True)
    
    # Check actas count
    cursor.execute("SELECT COUNT(*) as count FROM actas WHERE tipo_papeleta = 'SUBNACIONAL'")
    print("Actas SUBNACIONAL:", cursor.fetchone()['count'])
    
    # Check votos_detalle count
    cursor.execute("SELECT COUNT(*) as count FROM votos_detalle vd JOIN actas a ON vd.id_acta = a.id_acta WHERE a.tipo_papeleta = 'SUBNACIONAL'")
    print("Votos detalle SUBNACIONAL:", cursor.fetchone()['count'])
    
    # Check what votos are there
    cursor.execute("""
        SELECT op.sigla, op.nombre, SUM(vd.votos_cantidad) as total 
        FROM votos_detalle vd 
        JOIN actas a ON vd.id_acta = a.id_acta 
        JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion 
        WHERE a.tipo_papeleta = 'SUBNACIONAL'
        GROUP BY op.id_organizacion, op.sigla, op.nombre
    """)
    print("\nVotos por organización en SUBNACIONAL:")
    for row in cursor.fetchall():
        print(f"  {row['sigla']:15} - {row['nombre']:30} = {row['total']}")
    
    # Check LIBRE_GOB votos
    cursor.execute("SELECT COALESCE(SUM(vd.votos_cantidad), 0) as total FROM votos_detalle vd JOIN actas a ON vd.id_acta = a.id_acta JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion WHERE op.sigla = 'LIBRE_GOB' AND a.tipo_papeleta = 'SUBNACIONAL'")
    print("\nVotos LIBRE_GOB:", cursor.fetchone()['total'])
    
    # List all orgs
    cursor.execute("SELECT id_organizacion, nombre, sigla FROM organizaciones_politicas")
    print("\nTodas las Organizaciones:")
    for org in cursor.fetchall():
        print(f"  {org['sigla']:15} - {org['nombre']}")
    
    cursor.close()
