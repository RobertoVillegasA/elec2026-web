# backend/routes/resultados.py
"""
Rutas para visualización de resultados electorales con filtros geográficos
"""

from fastapi import APIRouter, Query
from db import DatabaseConnection
import os

router = APIRouter(tags=["resultados"])
dashboard_router = APIRouter(tags=["dashboard"])

# Debug flag
DEBUG_MODE = os.getenv('DEBUG_MODE', 'false').lower() == 'true'


@dashboard_router.get("/resultados")
async def obtener_resultados(
    departamento: int = Query(None, description="ID del departamento"),
    provincia: int = Query(None, description="ID de la provincia"),
    municipio: int = Query(None, description="ID del municipio"),
    recinto: int = Query(None, description="ID del recinto"),
    tipo_eleccion: str = Query(None, description="Tipo de elección: 'SUBNACIONAL' o 'MUNICIPAL'")
):
    """
    Obtiene resultados electorales con filtros geográficos y tipo de elección opcional.

    Parámetros:
    - departamento: Filtra por departamento (opcional)
    - provincia: Filtra por provincia (opcional)
    - municipio: Filtra por municipio (opcional)
    - recinto: Filtra por recinto (opcional)
    - tipo_eleccion: Filtra por tipo de elección: 'SUBNACIONAL' o 'MUNICIPAL' (opcional)

    Retorna:
    {
        "candidatos": [...],
        "resumen": {
            "total_votos": int,
            "votos_libre": int,
            "votos_creemos": int,
            "votos_cc": int,
            "votos_blancos": int,
            "votos_nulos": int,
            "total_actas": int,
            "total_inscritos": int
        }
    }
    """
    try:
        with DatabaseConnection() as conn:
            if not conn:
                return {
                    "error": "No se pudo conectar a la base de datos",
                    "candidatos": [],
                    "resumen": {
                        "total_votos": 0,
                        "votos_libre": 0,
                        "votos_creemos": 0,
                        "votos_cc": 0,
                        "votos_blancos": 0,
                        "votos_nulos": 0,
                        "total_actas": 0,
                        "total_inscritos": 0
                    }
                }

            cursor = conn.cursor(dictionary=True)

            # Construir condiciones WHERE
            where_conditions = []
            params = []
            
            if recinto:
                where_conditions.append("r.id_recinto = %s")
                params.append(recinto)
            elif municipio:
                where_conditions.append("r.id_municipio = %s")
                params.append(municipio)
            elif provincia:
                where_conditions.append("mu.id_provincia = %s")
                params.append(provincia)
            elif departamento:
                where_conditions.append("d.id_departamento = %s")
                params.append(departamento)
                
            # Añadir condición para tipo de elección si se especifica
            if tipo_eleccion:
                where_conditions.append("a.tipo_papeleta = %s")
                params.append(tipo_eleccion)
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

            # Consulta para candidatos
            if where_conditions:  # Hay filtro geográfico
                query_candidatos = f"""
                    SELECT op.nombre AS candidato, SUM(vd.votos_cantidad) AS votos, op.id_organizacion
                    FROM votos_detalle vd
                    JOIN actas a ON vd.id_acta = a.id_acta
                    JOIN mesas m ON a.id_mesa = m.id_mesa
                    JOIN recintos r ON m.id_recinto = r.id_recinto
                    JOIN municipios mu ON r.id_municipio = mu.id_municipio
                    JOIN provincias p ON mu.id_provincia = p.id_provincia
                    JOIN departamentos d ON p.id_departamento = d.id_departamento
                    JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
                    WHERE {where_clause}
                    GROUP BY vd.id_organizacion, op.id_organizacion, op.nombre
                    ORDER BY votos DESC
                """
            else:  # Sin filtro geográfico
                query_candidatos = """
                    SELECT op.nombre AS candidato, SUM(vd.votos_cantidad) AS votos, op.id_organizacion
                    FROM votos_detalle vd
                    JOIN actas a ON vd.id_acta = a.id_acta
                    JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
                    WHERE 1=1
                """
                if tipo_eleccion:
                    query_candidatos += " AND a.tipo_papeleta = %s"
                    params.append(tipo_eleccion)
                query_candidatos += " GROUP BY vd.id_organizacion, op.id_organizacion, op.nombre ORDER BY votos DESC"
                
            cursor.execute(query_candidatos, params)
            candidatos = cursor.fetchall()

            # Resumen según filtros
            if where_conditions:  # Hay filtro geográfico
                query_resumen = f"""
                    SELECT COALESCE(SUM(vd.votos_cantidad), 0) AS total_votos,
                           COALESCE(SUM(a.votos_blancos_g), 0) AS votos_blancos,
                           COALESCE(SUM(a.votos_nulos_g), 0) AS votos_nulos,
                           COALESCE(COUNT(DISTINCT a.id_acta), 0) AS total_actas,
                           COALESCE(SUM(m.cantidad_inscritos), 0) AS total_inscritos
                    FROM votos_detalle vd
                    JOIN actas a ON vd.id_acta = a.id_acta
                    JOIN mesas m ON a.id_mesa = m.id_mesa
                    JOIN recintos r ON m.id_recinto = r.id_recinto
                    JOIN municipios mu ON r.id_municipio = mu.id_municipio
                    JOIN provincias p ON mu.id_provincia = p.id_provincia
                    JOIN departamentos d ON p.id_departamento = d.id_departamento
                    WHERE {where_clause}
                """
            else:  # Sin filtro geográfico
                query_resumen = """
                    SELECT COALESCE(SUM(vd.votos_cantidad), 0) AS total_votos,
                           COALESCE(SUM(a.votos_blancos_g), 0) AS votos_blancos,
                           COALESCE(SUM(a.votos_nulos_g), 0) AS votos_nulos,
                           COALESCE(COUNT(DISTINCT a.id_acta), 0) AS total_actas,
                           COALESCE(SUM(m.cantidad_inscritos), 0) AS total_inscritos
                    FROM votos_detalle vd
                    JOIN actas a ON vd.id_acta = a.id_acta
                    JOIN mesas m ON a.id_mesa = m.id_mesa
                    WHERE 1=1
                """
                if tipo_eleccion:
                    query_resumen += " AND a.tipo_papeleta = %s"
                    params.append(tipo_eleccion)
                    
            cursor.execute(query_resumen, params)
            resumen = cursor.fetchone()

            # Si no hay resumen, crear uno por defecto
            if not resumen:
                resumen = {"total_votos": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0, "total_inscritos": 0}

            # Votos por organización
            if where_conditions:  # Hay filtro geográfico
                query_votos = f"""
                    SELECT vd.id_organizacion, SUM(vd.votos_cantidad) AS votos
                    FROM votos_detalle vd
                    JOIN actas a ON vd.id_acta = a.id_acta
                    JOIN mesas m ON a.id_mesa = m.id_mesa
                    JOIN recintos r ON m.id_recinto = r.id_recinto
                    JOIN municipios mu ON r.id_municipio = mu.id_municipio
                    JOIN provincias p ON mu.id_provincia = p.id_provincia
                    JOIN departamentos d ON p.id_departamento = d.id_departamento
                    WHERE {where_clause}
                    GROUP BY vd.id_organizacion
                """
            else:  # Sin filtro geográfico
                query_votos = """
                    SELECT vd.id_organizacion, SUM(vd.votos_cantidad) AS votos
                    FROM votos_detalle vd
                    JOIN actas a ON vd.id_acta = a.id_acta
                    JOIN mesas m ON a.id_mesa = m.id_mesa
                    WHERE 1=1
                """
                if tipo_eleccion:
                    query_votos += " AND a.tipo_papeleta = %s"
                    params.append(tipo_eleccion)
                query_votos += " GROUP BY vd.id_organizacion"
                
            cursor.execute(query_votos, params)
            organizaciones = cursor.fetchall()

            # Agregar votos por organización al resumen
            for org in organizaciones:
                if org['id_organizacion'] == 1:
                    resumen['votos_libre'] = org['votos']
                elif org['id_organizacion'] == 2:
                    resumen['votos_creemos'] = org['votos']
                elif org['id_organizacion'] == 3:
                    resumen['votos_cc'] = org['votos']

            # Asegurar que los campos existan en el resumen
            resumen.setdefault('votos_libre', 0)
            resumen.setdefault('votos_creemos', 0)
            resumen.setdefault('votos_cc', 0)

            cursor.close()

            return {
                "candidatos": candidatos or [],
                "resumen": resumen
            }

    except Exception as e:
        print(f"❌ Error al obtener resultados: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "candidatos": [],
            "resumen": {
                "total_votos": 0,
                "votos_libre": 0,
                "votos_creemos": 0,
                "votos_cc": 0,
                "votos_blancos": 0,
                "votos_nulos": 0,
                "total_actas": 0,
                "total_inscritos": 0
            }
        }


@dashboard_router.get("/resultados-completos")
async def obtener_resultados_completos(
    departamento: int = Query(None, description="ID del departamento"),
    provincia: int = Query(None, description="ID de la provincia"),
    municipio: int = Query(None, description="ID del municipio"),
    recinto: int = Query(None, description="ID del recinto")
):
    """
    Obtiene resultados electorales completos separados por tipo de elección.

    Parámetros:
    - departamento: Filtra por departamento (opcional)
    - provincia: Filtra por provincia (opcional)
    - municipio: Filtra por municipio (opcional)
    - recinto: Filtra por recinto (opcional)

    Retorna:
    {
        "gobernador": {"candidatos": [...], "resumen": {...}},
        "asambleistas_territorio": {"candidatos": [...], "resumen": {...}},
        "asambleistas_poblacion": {"candidatos": [...], "resumen": {...}},
        "alcalde": {"candidatos": [...], "resumen": {...}},
        "concejal": {"candidatos": [...], "resumen": {...}}
    }
    """
    try:
        # Logging para debug
        print(f"📊 Resultados completos - dept:{departamento}, prov:{provincia}, muni:{municipio}, reci:{recinto}")
        
        with DatabaseConnection() as conn:
            if not conn:
                print("❌ No se pudo conectar a la base de datos")
                return {
                    "error": "No se pudo conectar a la base de datos",
                    "gobernador": {"candidatos": [], "resumen": {"total_votos": 0, "votos_libre": 0, "votos_creemos": 0, "votos_cc": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0, "total_inscritos": 0}},
                    "asambleistas_territorio": {"candidatos": [], "resumen": {"total_votos": 0, "votos_libre": 0, "votos_creemos": 0, "votos_cc": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0, "total_inscritos": 0}},
                    "asambleistas_poblacion": {"candidatos": [], "resumen": {"total_votos": 0, "votos_libre": 0, "votos_creemos": 0, "votos_cc": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0, "total_inscritos": 0}},
                    "alcalde": {"candidatos": [], "resumen": {"total_votos": 0, "votos_libre": 0, "votos_creemos": 0, "votos_cc": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0, "total_inscritos": 0}},
                    "concejal": {"candidatos": [], "resumen": {"total_votos": 0, "votos_libre": 0, "votos_creemos": 0, "votos_cc": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0, "total_inscritos": 0}}
                }

            cursor = conn.cursor(dictionary=True)

            # Construir condiciones WHERE
            where_conditions = []
            params = []
            
            if recinto:
                where_conditions.append("r.id_recinto = %s")
                params.extend([recinto])
            elif municipio:
                where_conditions.append("r.id_municipio = %s")
                params.extend([municipio])
            elif provincia:
                where_conditions.append("mu.id_provincia = %s")
                params.extend([provincia])
            elif departamento:
                where_conditions.append("d.id_departamento = %s")
                params.extend([departamento])
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

            # Obtener total_inscritos para todos los filtros
            total_inscritos = await obtener_total_inscritos_filtrado(departamento, provincia, municipio, recinto)
            
            # Obtener totales por nivel geográfico
            total_inscritos_departamento = await obtener_total_inscritos_filtrado(departamento=departamento, provincia=None, municipio=None, recinto=None)
            total_inscritos_provincia = await obtener_total_inscritos_filtrado(departamento=departamento, provincia=provincia, municipio=None, recinto=None)
            total_inscritos_municipio = await obtener_total_inscritos_filtrado(departamento=departamento, provincia=provincia, municipio=municipio, recinto=None)
            total_inscritos_recinto = await obtener_total_inscritos_filtrado(departamento=departamento, provincia=provincia, municipio=municipio, recinto=recinto)

            # Consultas específicas para cada categoría electoral
            # Gobernador (SUBNACIONAL - votos_blancos_g, votos_nulos_g)
            query_gobernador = f"""
                SELECT 
                    COALESCE(SUM(a.total_actas), 0) AS total_votos,
                    COALESCE(SUM(a.votos_blancos_g), 0) AS votos_blancos,
                    COALESCE(SUM(a.votos_nulos_g), 0) AS votos_nulos,
                    COALESCE(COUNT(DISTINCT a.id_acta), 0) AS total_actas
                FROM actas a
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                WHERE a.tipo_papeleta = 'SUBNACIONAL' AND {where_clause}
            """
            cursor.execute(query_gobernador, params)
            gobernador_resumen = cursor.fetchone() or {"total_votos": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0}

            # Candidatos para gobernador
            query_gobernador_cand = f"""
                SELECT op.nombre AS candidato, SUM(vd.votos_cantidad) AS votos, op.id_organizacion
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
                WHERE a.tipo_papeleta = 'SUBNACIONAL' AND {where_clause} AND vd.tipo_voto = 'GOBERNADOR'
                GROUP BY vd.id_organizacion, op.id_organizacion, op.nombre
                ORDER BY votos DESC
            """
            cursor.execute(query_gobernador_cand, params)
            gobernador_candidatos = cursor.fetchall()

            # Votos por organización para gobernador
            query_gobernador_org = f"""
                SELECT vd.id_organizacion, SUM(vd.votos_cantidad) AS votos
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                WHERE a.tipo_papeleta = 'SUBNACIONAL' AND {where_clause} AND vd.tipo_voto = 'GOBERNADOR'
                GROUP BY vd.id_organizacion
            """
            cursor.execute(query_gobernador_org, params)
            gobernador_org = cursor.fetchall()

            # Procesar votos por organización para gobernador
            gobernador_votos_libre = 0
            gobernador_votos_creemos = 0
            gobernador_votos_cc = 0
            for org in gobernador_org:
                if org['id_organizacion'] == 1:
                    gobernador_votos_libre = org['votos']
                elif org['id_organizacion'] == 2:
                    gobernador_votos_creemos = org['votos']
                elif org['id_organizacion'] == 3:
                    gobernador_votos_cc = org['votos']

            # Asambleista por Territorio (SUBNACIONAL - votos_blancos_t, votos_nulos_t)
            query_asam_territorio = f"""
                SELECT 
                    COALESCE(SUM(a.total_actas), 0) AS total_votos,
                    COALESCE(SUM(a.votos_blancos_t), 0) AS votos_blancos,
                    COALESCE(SUM(a.votos_nulos_t), 0) AS votos_nulos,
                    COALESCE(COUNT(DISTINCT a.id_acta), 0) AS total_actas
                FROM actas a
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                WHERE a.tipo_papeleta = 'SUBNACIONAL' AND {where_clause}
            """
            cursor.execute(query_asam_territorio, params)
            asam_territorio_resumen = cursor.fetchone() or {"total_votos": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0}

            # Candidatos para asambleista por territorio
            query_asam_territorio_cand = f"""
                SELECT op.nombre AS candidato, SUM(vd.votos_cantidad) AS votos, op.id_organizacion
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
                WHERE a.tipo_papeleta = 'SUBNACIONAL' AND {where_clause} AND vd.tipo_voto = 'ASAMBLEISTA_TERRITORIO'
                GROUP BY vd.id_organizacion, op.id_organizacion, op.nombre
                ORDER BY votos DESC
            """
            cursor.execute(query_asam_territorio_cand, params)
            asam_territorio_candidatos = cursor.fetchall()

            # Votos por organización para asambleista por territorio
            query_asam_territorio_org = f"""
                SELECT vd.id_organizacion, SUM(vd.votos_cantidad) AS votos
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                WHERE a.tipo_papeleta = 'SUBNACIONAL' AND {where_clause} AND vd.tipo_voto = 'ASAMBLEISTA_TERRITORIO'
                GROUP BY vd.id_organizacion
            """
            cursor.execute(query_asam_territorio_org, params)
            asam_territorio_org = cursor.fetchall()

            # Procesar votos por organización para asambleista por territorio
            asam_territorio_votos_libre = 0
            asam_territorio_votos_creemos = 0
            asam_territorio_votos_cc = 0
            for org in asam_territorio_org:
                if org['id_organizacion'] == 1:
                    asam_territorio_votos_libre = org['votos']
                elif org['id_organizacion'] == 2:
                    asam_territorio_votos_creemos = org['votos']
                elif org['id_organizacion'] == 3:
                    asam_territorio_votos_cc = org['votos']

            # Asambleista por Población (SUBNACIONAL - votos_blancos_p, votos_nulos_p)
            query_asam_poblacion = f"""
                SELECT 
                    COALESCE(SUM(a.total_actas), 0) AS total_votos,
                    COALESCE(SUM(a.votos_blancos_p), 0) AS votos_blancos,
                    COALESCE(SUM(a.votos_nulos_p), 0) AS votos_nulos,
                    COALESCE(COUNT(DISTINCT a.id_acta), 0) AS total_actas
                FROM actas a
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                WHERE a.tipo_papeleta = 'SUBNACIONAL' AND {where_clause}
            """
            cursor.execute(query_asam_poblacion, params)
            asam_poblacion_resumen = cursor.fetchone() or {"total_votos": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0}

            # Candidatos para asambleista por población
            query_asam_poblacion_cand = f"""
                SELECT op.nombre AS candidato, SUM(vd.votos_cantidad) AS votos, op.id_organizacion
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
                WHERE a.tipo_papeleta = 'SUBNACIONAL' AND {where_clause} AND vd.tipo_voto = 'ASAMBLEISTA_POBLACION'
                GROUP BY vd.id_organizacion, op.id_organizacion, op.nombre
                ORDER BY votos DESC
            """
            cursor.execute(query_asam_poblacion_cand, params)
            asam_poblacion_candidatos = cursor.fetchall()

            # Votos por organización para asambleista por población
            query_asam_poblacion_org = f"""
                SELECT vd.id_organizacion, SUM(vd.votos_cantidad) AS votos
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                WHERE a.tipo_papeleta = 'SUBNACIONAL' AND {where_clause} AND vd.tipo_voto = 'ASAMBLEISTA_POBLACION'
                GROUP BY vd.id_organizacion
            """
            cursor.execute(query_asam_poblacion_org, params)
            asam_poblacion_org = cursor.fetchall()

            # Procesar votos por organización para asambleista por población
            asam_poblacion_votos_libre = 0
            asam_poblacion_votos_creemos = 0
            asam_poblacion_votos_cc = 0
            for org in asam_poblacion_org:
                if org['id_organizacion'] == 1:
                    asam_poblacion_votos_libre = org['votos']
                elif org['id_organizacion'] == 2:
                    asam_poblacion_votos_creemos = org['votos']
                elif org['id_organizacion'] == 3:
                    asam_poblacion_votos_cc = org['votos']

            # Alcalde (MUNICIPAL - votos_blancos_a, votos_nulos_a)
            query_alcalde = f"""
                SELECT 
                    COALESCE(SUM(a.total_actas), 0) AS total_votos,
                    COALESCE(SUM(a.votos_blancos_a), 0) AS votos_blancos,
                    COALESCE(SUM(a.votos_nulos_a), 0) AS votos_nulos,
                    COALESCE(COUNT(DISTINCT a.id_acta), 0) AS total_actas
                FROM actas a
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                WHERE a.tipo_papeleta = 'MUNICIPAL' AND {where_clause}
            """
            cursor.execute(query_alcalde, params)
            alcalde_resumen = cursor.fetchone() or {"total_votos": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0}

            # Candidatos para alcalde
            query_alcalde_cand = f"""
                SELECT op.nombre AS candidato, SUM(vd.votos_cantidad) AS votos, op.id_organizacion
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
                WHERE a.tipo_papeleta = 'MUNICIPAL' AND {where_clause} AND vd.tipo_voto = 'ALCALDE'
                GROUP BY vd.id_organizacion, op.id_organizacion, op.nombre
                ORDER BY votos DESC
            """
            cursor.execute(query_alcalde_cand, params)
            alcalde_candidatos = cursor.fetchall()

            # Votos por organización para alcalde
            query_alcalde_org = f"""
                SELECT vd.id_organizacion, SUM(vd.votos_cantidad) AS votos
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                WHERE a.tipo_papeleta = 'MUNICIPAL' AND {where_clause} AND vd.tipo_voto = 'ALCALDE'
                GROUP BY vd.id_organizacion
            """
            cursor.execute(query_alcalde_org, params)
            alcalde_org = cursor.fetchall()

            # Procesar votos por organización para alcalde
            alcalde_votos_libre = 0
            alcalde_votos_creemos = 0
            alcalde_votos_cc = 0
            for org in alcalde_org:
                if org['id_organizacion'] == 1:
                    alcalde_votos_libre = org['votos']
                elif org['id_organizacion'] == 2:
                    alcalde_votos_creemos = org['votos']
                elif org['id_organizacion'] == 3:
                    alcalde_votos_cc = org['votos']

            # Concejal (MUNICIPAL - votos_blancos_c, votos_nulos_c)
            query_concejal = f"""
                SELECT 
                    COALESCE(SUM(a.total_actas), 0) AS total_votos,
                    COALESCE(SUM(a.votos_blancos_c), 0) AS votos_blancos,
                    COALESCE(SUM(a.votos_nulos_c), 0) AS votos_nulos,
                    COALESCE(COUNT(DISTINCT a.id_acta), 0) AS total_actas
                FROM actas a
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                WHERE a.tipo_papeleta = 'MUNICIPAL' AND {where_clause}
            """
            cursor.execute(query_concejal, params)
            concejal_resumen = cursor.fetchone() or {"total_votos": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0}

            # Candidatos para concejal
            query_concejal_cand = f"""
                SELECT op.nombre AS candidato, SUM(vd.votos_cantidad) AS votos, op.id_organizacion
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
                WHERE a.tipo_papeleta = 'MUNICIPAL' AND {where_clause} AND vd.tipo_voto = 'CONCEJAL'
                GROUP BY vd.id_organizacion, op.id_organizacion, op.nombre
                ORDER BY votos DESC
            """
            cursor.execute(query_concejal_cand, params)
            concejal_candidatos = cursor.fetchall()

            # Votos por organización para concejal
            query_concejal_org = f"""
                SELECT vd.id_organizacion, SUM(vd.votos_cantidad) AS votos
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                JOIN mesas m ON a.id_mesa = m.id_mesa
                JOIN recintos r ON m.id_recinto = r.id_recinto
                JOIN municipios mu ON r.id_municipio = mu.id_municipio
                JOIN provincias p ON mu.id_provincia = p.id_provincia
                JOIN departamentos d ON p.id_departamento = d.id_departamento
                WHERE a.tipo_papeleta = 'MUNICIPAL' AND {where_clause} AND vd.tipo_voto = 'CONCEJAL'
                GROUP BY vd.id_organizacion
            """
            cursor.execute(query_concejal_org, params)
            concejal_org = cursor.fetchall()

            # Procesar votos por organización para concejal
            concejal_votos_libre = 0
            concejal_votos_creemos = 0
            concejal_votos_cc = 0
            for org in concejal_org:
                if org['id_organizacion'] == 1:
                    concejal_votos_libre = org['votos']
                elif org['id_organizacion'] == 2:
                    concejal_votos_creemos = org['votos']
                elif org['id_organizacion'] == 3:
                    concejal_votos_cc = org['votos']

            cursor.close()

            return {
                "gobernador": {
                    "candidatos": gobernador_candidatos,
                    "resumen": {
                        "total_votos": int(gobernador_resumen["total_votos"]),
                        "votos_blancos": int(gobernador_resumen["votos_blancos"]),
                        "votos_nulos": int(gobernador_resumen["votos_nulos"]),
                        "total_actas": int(gobernador_resumen["total_actas"]),
                        "total_inscritos": total_inscritos,
                        "total_inscritos_departamento": total_inscritos_departamento,
                        "total_inscritos_provincia": total_inscritos_provincia,
                        "total_inscritos_municipio": total_inscritos_municipio,
                        "total_inscritos_recinto": total_inscritos_recinto,
                        "votos_libre": gobernador_votos_libre,
                        "votos_creemos": gobernador_votos_creemos,
                        "votos_cc": gobernador_votos_cc
                    }
                },
                "asambleistas_territorio": {
                    "candidatos": asam_territorio_candidatos,
                    "resumen": {
                        "total_votos": int(asam_territorio_resumen["total_votos"]),
                        "votos_blancos": int(asam_territorio_resumen["votos_blancos"]),
                        "votos_nulos": int(asam_territorio_resumen["votos_nulos"]),
                        "total_actas": int(asam_territorio_resumen["total_actas"]),
                        "total_inscritos": total_inscritos,
                        "total_inscritos_departamento": total_inscritos_departamento,
                        "total_inscritos_provincia": total_inscritos_provincia,
                        "total_inscritos_municipio": total_inscritos_municipio,
                        "total_inscritos_recinto": total_inscritos_recinto,
                        "votos_libre": asam_territorio_votos_libre,
                        "votos_creemos": asam_territorio_votos_creemos,
                        "votos_cc": asam_territorio_votos_cc
                    }
                },
                "asambleistas_poblacion": {
                    "candidatos": asam_poblacion_candidatos,
                    "resumen": {
                        "total_votos": int(asam_poblacion_resumen["total_votos"]),
                        "votos_blancos": int(asam_poblacion_resumen["votos_blancos"]),
                        "votos_nulos": int(asam_poblacion_resumen["votos_nulos"]),
                        "total_actas": int(asam_poblacion_resumen["total_actas"]),
                        "total_inscritos": total_inscritos,
                        "total_inscritos_departamento": total_inscritos_departamento,
                        "total_inscritos_provincia": total_inscritos_provincia,
                        "total_inscritos_municipio": total_inscritos_municipio,
                        "total_inscritos_recinto": total_inscritos_recinto,
                        "votos_libre": asam_poblacion_votos_libre,
                        "votos_creemos": asam_poblacion_votos_creemos,
                        "votos_cc": asam_poblacion_votos_cc
                    }
                },
                "alcalde": {
                    "candidatos": alcalde_candidatos,
                    "resumen": {
                        "total_votos": int(alcalde_resumen["total_votos"]),
                        "votos_blancos": int(alcalde_resumen["votos_blancos"]),
                        "votos_nulos": int(alcalde_resumen["votos_nulos"]),
                        "total_actas": int(alcalde_resumen["total_actas"]),
                        "total_inscritos": total_inscritos,
                        "total_inscritos_departamento": total_inscritos_departamento,
                        "total_inscritos_provincia": total_inscritos_provincia,
                        "total_inscritos_municipio": total_inscritos_municipio,
                        "total_inscritos_recinto": total_inscritos_recinto,
                        "votos_libre": alcalde_votos_libre,
                        "votos_creemos": alcalde_votos_creemos,
                        "votos_cc": alcalde_votos_cc
                    }
                },
                "concejal": {
                    "candidatos": concejal_candidatos,
                    "resumen": {
                        "total_votos": int(concejal_resumen["total_votos"]),
                        "votos_blancos": int(concejal_resumen["votos_blancos"]),
                        "votos_nulos": int(concejal_resumen["votos_nulos"]),
                        "total_actas": int(concejal_resumen["total_actas"]),
                        "total_inscritos": total_inscritos,
                        "total_inscritos_departamento": total_inscritos_departamento,
                        "total_inscritos_provincia": total_inscritos_provincia,
                        "total_inscritos_municipio": total_inscritos_municipio,
                        "total_inscritos_recinto": total_inscritos_recinto,
                        "votos_libre": concejal_votos_libre,
                        "votos_creemos": concejal_votos_creemos,
                        "votos_cc": concejal_votos_cc
                    }
                }
            }
    
    except Exception as e:
        print(f"❌ Error al obtener resultados completos: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "gobernador": {"candidatos": [], "resumen": {"total_votos": 0, "votos_libre": 0, "votos_creemos": 0, "votos_cc": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0, "total_inscritos": 0}},
            "asambleistas_territorio": {"candidatos": [], "resumen": {"total_votos": 0, "votos_libre": 0, "votos_creemos": 0, "votos_cc": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0, "total_inscritos": 0}},
            "asambleistas_poblacion": {"candidatos": [], "resumen": {"total_votos": 0, "votos_libre": 0, "votos_creemos": 0, "votos_cc": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0, "total_inscritos": 0}},
            "alcalde": {"candidatos": [], "resumen": {"total_votos": 0, "votos_libre": 0, "votos_creemos": 0, "votos_cc": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0, "total_inscritos": 0}},
            "concejal": {"candidatos": [], "resumen": {"total_votos": 0, "votos_libre": 0, "votos_creemos": 0, "votos_cc": 0, "votos_blancos": 0, "votos_nulos": 0, "total_actas": 0, "total_inscritos": 0}}
        }


async def obtener_total_inscritos_filtrado(departamento: int = None, provincia: int = None, municipio: int = None, recinto: int = None):
    """
    Obtiene el total de inscritos para los filtros dados, independientemente del tipo de acta.
    """
    try:
        with DatabaseConnection() as conn:
            if not conn:
                return 0
                
            cursor = conn.cursor(dictionary=True)

            # Construir consulta para total inscritos
            params = []
            if recinto:
                query = """
                    SELECT COALESCE(SUM(m.cantidad_inscritos), 0) AS total_inscritos
                    FROM mesas m
                    JOIN recintos r ON m.id_recinto = r.id_recinto
                    WHERE r.id_recinto = %s
                """
                params = [recinto]
            elif municipio:
                query = """
                    SELECT COALESCE(SUM(m.cantidad_inscritos), 0) AS total_inscritos
                    FROM mesas m
                    JOIN recintos r ON m.id_recinto = r.id_recinto
                    WHERE r.id_municipio = %s
                """
                params = [municipio]
            elif provincia:
                query = """
                    SELECT COALESCE(SUM(m.cantidad_inscritos), 0) AS total_inscritos
                    FROM mesas m
                    JOIN recintos r ON m.id_recinto = r.id_recinto
                    JOIN municipios mu ON r.id_municipio = mu.id_municipio
                    WHERE mu.id_provincia = %s
                """
                params = [provincia]
            elif departamento:
                query = """
                    SELECT COALESCE(SUM(m.cantidad_inscritos), 0) AS total_inscritos
                    FROM mesas m
                    JOIN recintos r ON m.id_recinto = r.id_recinto
                    JOIN municipios mu ON r.id_municipio = mu.id_municipio
                    JOIN provincias p ON mu.id_provincia = p.id_provincia
                    WHERE p.id_departamento = %s
                """
                params = [departamento]
            else:
                query = """
                    SELECT COALESCE(SUM(m.cantidad_inscritos), 0) AS total_inscritos
                    FROM mesas m
                """
                params = []

            cursor.execute(query, params)
            result = cursor.fetchone()
            cursor.close()

            return int(result['total_inscritos']) if result and 'total_inscritos' in result else 0

    except Exception as e:
        print(f"❌ Error al obtener total inscritos filtrado: {str(e)}")
        return 0


@dashboard_router.get("/resultados/nacional")
async def obtener_resultados_nacional():
    """
    Obtiene resultados a nivel nacional (sin filtros geográficos).
    """
    try:
        with DatabaseConnection() as conn:
            if not conn:
                return {
                    "error": "No se pudo conectar a la base de datos",
                    "candidatos": [],
                    "resumen": {
                        "total_votos": 0,
                        "votos_libre": 0,
                        "votos_creemos": 0,
                        "votos_cc": 0,
                        "votos_blancos": 0,
                        "votos_nulos": 0,
                        "total_actas": 0
                    }
                }
            
            cursor = conn.cursor(dictionary=True)
            
            # Resultados por organización a nivel nacional
            query_nacional = """
                SELECT 
                    op.nombre AS candidato,
                    SUM(vd.votos_cantidad) AS votos,
                    op.id_organizacion
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                JOIN organizaciones_politicas op ON vd.id_organizacion = op.id_organizacion
                GROUP BY vd.id_organizacion, op.nombre, op.id_organizacion
                ORDER BY votos DESC
            """
            
            cursor.execute(query_nacional)
            candidatos = cursor.fetchall()
            
            # Resumen nacional
            query_resumen = """
                SELECT
                    COALESCE(SUM(vd.votos_cantidad), 0) AS total_votos,
                    COALESCE(SUM(a.votos_blancos_g), 0) AS votos_blancos,
                    COALESCE(SUM(a.votos_nulos_g), 0) AS votos_nulos,
                    COALESCE(COUNT(DISTINCT a.id_acta), 0) AS total_actas,
                    COALESCE(SUM(m.cantidad_inscritos), 0) AS total_inscritos
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                JOIN mesas m ON a.id_mesa = m.id_mesa
            """

            cursor.execute(query_resumen)
            resumen = cursor.fetchone()

            # Si no hay resumen, crear uno por defecto
            if not resumen:
                resumen = {
                    "total_votos": 0,
                    "votos_blancos": 0,
                    "votos_nulos": 0,
                    "total_actas": 0,
                    "total_inscritos": 0
                }
            
            # Votos por organización
            votos_por_organizacion = """
                SELECT 
                    vd.id_organizacion,
                    SUM(vd.votos_cantidad) AS votos
                FROM votos_detalle vd
                JOIN actas a ON vd.id_acta = a.id_acta
                GROUP BY vd.id_organizacion
            """
            
            cursor.execute(votos_por_organizacion)
            organizaciones = cursor.fetchall()
            
            # Agregar votos por organización al resumen
            for org in organizaciones:
                if org['id_organizacion'] == 1:
                    resumen['votos_libre'] = org['votos']
                elif org['id_organizacion'] == 2:
                    resumen['votos_creemos'] = org['votos']
                elif org['id_organizacion'] == 3:
                    resumen['votos_cc'] = org['votos']
            
            # Asegurar que los campos existan en el resumen
            resumen.setdefault('votos_libre', 0)
            resumen.setdefault('votos_creemos', 0)
            resumen.setdefault('votos_cc', 0)
            
            cursor.close()
            
            return {
                "candidatos": candidatos or [],
                "resumen": resumen
            }
    
    except Exception as e:
        print(f"❌ Error al obtener resultados nacionales: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "candidatos": [],
            "resumen": {
                "total_votos": 0,
                "votos_libre": 0,
                "votos_creemos": 0,
                "votos_cc": 0,
                "votos_blancos": 0,
                "votos_nulos": 0,
                "total_actas": 0,
                "total_inscritos": 0
            }
        }


@router.get("/departamentos")
async def listar_departamentos():
    """
    Lista todos los departamentos disponibles.
    
    Retorna:
    [
        { "id_departamento": 1, "nombre_departamento": "La Paz" },
        ...
    ]
    """
    try:
        with DatabaseConnection() as conn:
            if not conn:
                return []
            
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT id_departamento, nombre FROM departamentos ORDER BY nombre"
            )
            result = cursor.fetchall()
            cursor.close()
            return result or []
    except Exception as e:
        print(f"❌ Error al listar departamentos: {str(e)}")
        return []


@router.get("/provincias/{id_departamento}")
async def listar_provincias(id_departamento: int):
    """
    Lista todas las provincias de un departamento específico.
    
    Parámetro:
    - id_departamento: ID del departamento
    
    Retorna:
    [
        { "id_provincia": 1, "nombre_provincia": "Murillo" },
        ...
    ]
    """
    try:
        with DatabaseConnection() as conn:
            if not conn:
                return []
            
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT id_provincia, nombre FROM provincias WHERE id_departamento = %s ORDER BY nombre",
                (id_departamento,)
            )
            result = cursor.fetchall()
            cursor.close()
            return result or []
    except Exception as e:
        print(f"❌ Error al listar provincias: {str(e)}")
        return []


@router.get("/municipios/{id_provincia}")
async def listar_municipios(id_provincia: int):
    """
    Lista todos los municipios de una provincia específica.
    
    Parámetro:
    - id_provincia: ID de la provincia
    
    Retorna:
    [
        { "id_municipio": 1, "nombre_municipio": "La Paz" },
        ...
    ]
    """
    try:
        with DatabaseConnection() as conn:
            if not conn:
                return []
            
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT id_municipio, nombre FROM municipios WHERE id_provincia = %s ORDER BY nombre",
                (id_provincia,)
            )
            result = cursor.fetchall()
            cursor.close()
            return result or []
    except Exception as e:
        print(f"❌ Error al listar municipios: {str(e)}")
        return []
