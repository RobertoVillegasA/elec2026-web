# web.py - Punto de entrada para Railway
# Este archivo está en la raíz del proyecto
import sys
import os

# Agregar el directorio backend al path de Python
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_path)

# Ahora importar la app desde main (que está dentro de backend/)
from main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
