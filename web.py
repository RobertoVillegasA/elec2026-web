# web.py - Punto de entrada para Railway/Producción
import sys
import os
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("Iniciando web.py...")
logger.info(f"Python path: {sys.path}")
logger.info(f"Directorio actual: {os.getcwd()}")

# Agregar el directorio backend al path de Python
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_path)

logger.info(f"Backend path agregado: {backend_path}")

# Verificar variables de entorno críticas
logger.info("Verificando variables de entorno...")
logger.info(f"PORT: {os.environ.get('PORT', '8000 (default)')}")
logger.info(f"SECRET_KEY configurada: {'Sí' if os.environ.get('SECRET_KEY') else 'No'}")
logger.info(f"MYSQLHOST: {os.environ.get('MYSQLHOST', 'No configurado')}")
logger.info(f"DEBUG: {os.environ.get('DEBUG', 'false')}")

try:
    logger.info("Importando app desde backend/main.py...")
    from main import app
    logger.info("App importada exitosamente")
    
    if __name__ == "__main__":
        import uvicorn
        port = int(os.environ.get("PORT", 8000))
        logger.info(f"Iniciando uvicorn en puerto {port}...")
        uvicorn.run(app, host="0.0.0.0", port=port)
        
except Exception as e:
    logger.error(f"Error al importar app: {e}", exc_info=True)
    raise
