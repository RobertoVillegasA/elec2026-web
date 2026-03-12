@echo off
REM ============================================
REM Script de migración a Railway para Windows
REM ============================================

echo.
echo ============================================================
echo   🚀 MIGRACIÓN DE BASE DE DATOS A RAILWAY
echo ============================================================
echo.

REM Verificar si tiene Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no encontrado. Instala Python 3.8+
    pause
    exit /b 1
)

echo [INFO] Verificando dependencias...
python -c "import mysql.connector" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Instalando mysql-connector-python...
    pip install mysql-connector-python python-dotenv
)

echo.
echo [INFO] Paso 1: Copia el archivo .env.migration a .env
echo.
echo     Copia esto en tu terminal:
echo     copy .env.migration .env
echo.
echo     Luego edita .env con tus datos de Railway
echo.
pause

echo.
echo [INFO] Paso 2: Asegúrate de tener MySQL creado en Railway
echo.
echo     1. Ve a railway.app
echo     2. Abre tu proyecto
echo     3. Click New → Database → MySQL
echo     4. Espera a que esté listo
echo.
pause

echo.
echo [INFO] Paso 3: Obtén las variables de Railway
echo.
echo     1. En Railway, ve a tu MySQL
echo     2. Copia las variables: MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE
echo     3. Pégalas en el archivo .env
echo.
pause

echo.
echo [INFO] Paso 4: Ejecutando migración...
echo.

python deploy_to_railway.py

echo.
echo ============================================================
echo   Migración completada
echo ============================================================
echo.
pause
