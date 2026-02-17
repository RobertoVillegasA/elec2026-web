import requests
import json

# Probar conexión con el servidor backend
try:
    # Intentar acceder a un endpoint simple para verificar si el servidor está corriendo
    response = requests.get("http://localhost:8000/api/catalog?table=departamentos", timeout=5)
    print(f"Estado del servidor: {response.status_code}")
    if response.status_code == 200:
        print("✅ Servidor backend accesible")
        data = response.json()
        print(f"✅ Catálogo de departamentos recibido, {len(data)} entradas")
    else:
        print(f"❌ Servidor backend respondiendo con código: {response.status_code}")
except requests.exceptions.ConnectionError:
    print("❌ No se puede conectar al servidor backend. ¿Está corriendo?")
    print("💡 Para iniciar el servidor backend, ejecute: uvicorn main:app --reload --port 8000")
except Exception as e:
    print(f"❌ Error al conectar con el servidor backend: {e}")