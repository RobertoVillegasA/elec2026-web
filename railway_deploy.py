"""
railway_deploy.py - Script de Despliegue Automático en Railway

Este script automatiza el proceso de despliegue en Railway:
1. Verifica la conexión con GitHub
2. Crea el proyecto en Railway
3. Agrega MySQL
4. Configura variables de entorno
5. Migra la base de datos

Uso: python railway_deploy.py
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from dotenv import load_dotenv

# Colores para la consola
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(60)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def check_railway_cli():
    """Verifica si Railway CLI está instalado"""
    try:
        result = subprocess.run(['railway', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print_success(f"Railway CLI instalado: {result.stdout.strip()}")
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    print_warning("Railway CLI no está instalado")
    print_info("Instala Railway CLI con: npm install -g @railway/cli")
    print_info("O usa la interfaz web en https://railway.app")
    return False

def check_github_connection():
    """Verifica conexión con GitHub"""
    try:
        result = subprocess.run(['git', 'remote', '-v'], 
                              capture_output=True, text=True, timeout=10)
        if 'github.com' in result.stdout:
            print_success("Conexión con GitHub verificada")
            return True
        else:
            print_warning("No hay repositorio de GitHub configurado")
            return False
    except (FileNotFoundError, subprocess.TimeoutExpired):
        print_error("Git no está instalado o no está en el PATH")
        return False

def check_files():
    """Verifica que los archivos necesarios existan"""
    required_files = [
        'requirements.txt',
        'web.py',
        'railway.json',
        'nixpacks.toml',
        'backend/main.py',
        'backend/create_database.sql'
    ]
    
    missing_files = []
    for file in required_files:
        if not Path(file).exists():
            missing_files.append(file)
    
    if missing_files:
        print_error("Faltan archivos:")
        for file in missing_files:
            print(f"  - {file}")
        return False
    
    print_success("Todos los archivos necesarios están presentes")
    return True

def login_railway():
    """Inicia sesión en Railway"""
    print_info("Iniciando sesión en Railway...")
    try:
        result = subprocess.run(['railway', 'login'], timeout=120)
        if result.returncode == 0:
            print_success("Sesión iniciada en Railway")
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired, subprocess.CalledProcessError):
        pass
    
    print_warning("No se pudo iniciar sesión automáticamente")
    print_info("Por favor, inicia sesión en https://railway.app")
    return False

def create_project():
    """Crea un nuevo proyecto en Railway"""
    print_info("Creando proyecto en Railway...")
    try:
        # Inicializar proyecto Railway
        result = subprocess.run(['railway', 'init'], 
                              capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            print_success("Proyecto creado exitosamente")
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
        print_error(f"Error al crear proyecto: {e}")
    
    return False

def add_mysql():
    """Agrega MySQL al proyecto"""
    print_info("Agregando MySQL al proyecto...")
    print_warning("MySQL debe agregarse manualmente desde la interfaz web")
    print_info("Ve a: https://railway.app → Tu Proyecto → New → Database → MySQL")
    
    response = input("¿Ya agregaste MySQL? (y/n): ").strip().lower()
    return response == 'y'

def set_environment_variables():
    """Configura las variables de entorno"""
    print_header("Configurar Variables de Entorno")
    
    # Generar SECRET_KEY
    import secrets
    secret_key = secrets.token_urlsafe(32)
    
    print_info(f"SECRET_KEY generada: {secret_key[:20]}...")
    print_warning("¡Guarda esta clave en un lugar seguro!")
    
    # Variables para configurar
    variables = {
        'SECRET_KEY': secret_key,
        'DEBUG': 'false',
        'LOG_LEVEL': 'INFO'
    }
    
    print_info("\nVariables a configurar en Railway:")
    for key, value in variables.items():
        display_value = value if key != 'SECRET_KEY' else f"{value[:20]}..."
        print(f"  {key}={display_value}")
    
    print_warning("\nDebes agregar estas variables manualmente en Railway:")
    print("  1. Ve a Railway → Tu Proyecto → Variables")
    print("  2. Agrega cada variable manualmente")
    
    response = input("¿Ya configuraste las variables? (y/n): ").strip().lower()
    return response == 'y'

def deploy():
    """Inicia el despliegue"""
    print_info("Iniciando despliegue...")
    try:
        result = subprocess.run(['railway', 'up'], timeout=300)
        if result.returncode == 0:
            print_success("Despliegue iniciado exitosamente")
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
        print_error(f"Error en despliegue: {e}")
    
    print_info("Puedes ver el progreso en: https://railway.app")
    return False

def get_project_url():
    """Obtiene la URL del proyecto"""
    try:
        result = subprocess.run(['railway', 'list'], 
                              capture_output=True, text=True, timeout=30)
        # Parsear output para obtener URL
        # Esto es simplificado - Railway CLI puede no dar la URL directamente
        return None
    except:
        return None

def migration_wizard():
    """Asistente para migrar base de datos"""
    print_header("Migración de Base de Datos")
    
    print_info("Para migrar tu base de datos local a Railway:")
    print("\n1. Obtén las credenciales de MySQL en Railway:")
    print("   - Ve a Railway → MySQL → Variables")
    print("   - Copia: MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT")
    
    print("\n2. Copia el archivo de migración:")
    print("   copy .env.migration .env")
    
    print("\n3. Edita .env con los datos de Railway")
    
    print("\n4. Ejecuta la migración:")
    print("   python deploy_to_railway.py")
    
    response = input("\n¿Quieres ejecutar la migración ahora? (y/n): ").strip().lower()
    
    if response == 'y':
        if not Path('.env').exists():
            print_info("Copiando .env.migration a .env...")
            subprocess.run(['copy', '.env.migration', '.env'], shell=True)
        
        print_info("Ejecutando migración...")
        try:
            subprocess.run(['python', 'deploy_to_railway.py'])
            print_success("Migración completada")
        except Exception as e:
            print_error(f"Error en migración: {e}")

def main():
    """Función principal"""
    print_header("🚀 Despliegue Automático en Railway")
    
    # Verificaciones previas
    print_header("Verificaciones Previas")
    
    checks_passed = True
    
    if not check_files():
        checks_passed = False
    
    if not check_github_connection():
        print_warning("Configura tu repositorio de GitHub primero")
        checks_passed = False
    
    use_cli = check_railway_cli()
    
    if not checks_passed:
        print_error("Corrige los problemas anteriores antes de continuar")
        return
    
    # Flujo con CLI
    if use_cli:
        print_header("Autenticación")
        if not login_railway():
            return
        
        print_header("Crear Proyecto")
        if not create_project():
            print_info("Puedes crear el proyecto manualmente en https://railway.app")
        
        print_header("Agregar MySQL")
        if not add_mysql():
            print_warning("Agrega MySQL antes de continuar")
        
        print_header("Variables de Entorno")
        if not set_environment_variables():
            print_warning("Configura las variables de entorno manualmente")
        
        print_header("Despliegue")
        deploy()
    
    # Migración
    migration_wizard()
    
    # Resumen final
    print_header("✅ ¡Despliegue Completado!")
    
    print_info("\nPróximos pasos:")
    print("  1. Espera 2-3 minutos a que Railway termine el build")
    print("  2. Ve a https://railway.app para ver el progreso")
    print("  3. Obtén tu URL en Railway → Settings → Domains")
    print("  4. Prueba tu aplicación: https://tu-proyecto.up.railway.app")
    print("  5. Verifica la API: https://tu-proyecto.up.railway.app/docs")
    
    print_info("\nVariables de entorno requeridas en Railway:")
    print("  - SECRET_KEY: (generada arriba)")
    print("  - CORS_ORIGIN: https://tu-proyecto.up.railway.app")
    print("  - DEBUG: false")
    print("  - LOG_LEVEL: INFO")
    
    print_info("\nMySQL se conecta automáticamente con las variables:")
    print("  - MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT")
    
    print_header("¡Éxito! 🎉")

if __name__ == "__main__":
    main()
