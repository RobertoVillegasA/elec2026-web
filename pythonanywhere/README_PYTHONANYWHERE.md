# Configuración para PythonAnywhere

## 📋 Pasos de Configuración

### 1️⃣ Crear el archivo WSGI en PythonAnywhere

1. Ve a [PythonAnywhere → Files](https://www.pythonanywhere.com/files/)
2. Navega a `/var/www/`
3. Crea un archivo llamado: `giovann_pythonanywhere_com_wsgi.py`

**O desde la consola Bash:**
```bash
# Copia el contenido de wsgi_production.py a la ruta de PythonAnywhere
```

---

### 2️⃣ Contenido del archivo WSGI

Copia este contenido en `/var/www/giovann_pythonanywhere_com_wsgi.py`:

```python
# ============================================
# WSGI Configuration for PythonAnywhere
# ============================================
# Sitio: giovann.pythonanywhere.com
# Archivo: /var/www/giovann_pythonanywhere_com_wsgi.py
# ============================================

import sys
import os
import traceback

# ============================================
# CONFIGURACIÓN DE RUTAS
# ============================================
username = 'giovann'
project_home = f'/home/{username}/elec2026-web'

# Agregar el proyecto al path de Python
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Agregar backend al path
backend_path = os.path.join(project_home, 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# ============================================
# VARIABLES DE ENTORNO
# ============================================

# 🔑 SECRET_KEY - Genera una nueva con: python -c "import secrets; print(secrets.token_urlsafe(32))"
os.environ['SECRET_KEY'] = 'electoral_2026_bolivia_segura_clave_temporal_giovann_2026'

# Base de datos PythonAnywhere
os.environ['DB_HOST'] = 'giovann.mysql.pythonanywhere-services.com'
os.environ['DB_NAME'] = 'giovann$elec2026'
os.environ['DB_USER'] = 'giovann'
os.environ['DB_PASSWORD'] = 'TU_CONTRASENA_AQUI'  # ← CAMBIA ESTO
os.environ['DB_PORT'] = '3306'

# CORS - Tu dominio en PythonAnywhere
os.environ['CORS_ORIGIN'] = 'https://giovann.pythonanywhere.com'

# Configuración de la app
os.environ['DEBUG'] = 'False'
os.environ['LOG_LEVEL'] = 'INFO'

# ============================================
# IMPORTAR LA APLICACIÓN
# ============================================
try:
    from web import app as application
    application.title = "Sistema Electoral Bolivia 2026"

except Exception as e:
    from fastapi import FastAPI
    application = FastAPI(title="Error")

    @application.get("/")
    def error_page():
        return {
            "error": "Error al cargar la aplicación",
            "detail": str(e),
            "traceback": traceback.format_exc(),
            "project_home": project_home,
            "sys_path": sys.path[:5]
        }

    @application.get("/health")
    def health_error():
        return {"status": "error", "detail": str(e)}
```

---

### 3️⃣ Configurar la Web App en PythonAnywhere

1. Ve a [PythonAnywhere → Web](https://www.pythonanywhere.com/web/)
2. Haz clic en **"Add a new web app"**
3. Selecciona:
   - **Manual configuration** (no el wizard)
   - **Python 3.10** (o la versión más reciente disponible)
4. Configura:
   - **Source code**: `/home/giovann/elec2026-web`
   - **Working directory**: `/home/giovann/elec2026-web`
   - **Path to your WSGI configuration file**: `/var/www/giovann_pythonanywhere_com_wsgi.py`

---

### 4️⃣ Instalar dependencias

En la consola Bash de PythonAnywhere:

```bash
# Navega al proyecto
cd ~/elec2026-web

# Crea un virtualenv
python3 -m venv venv

# Actívalo
source venv/bin/activate

# Instala las dependencias
pip install -r requirements.txt
```

---

### 5️⃣ Configurar el WSGI file en PythonAnywhere Web

1. Ve a **Web** → tu app
2. En **WSGI configuration file**, haz clic en el enlace para editar
3. Reemplaza TODO el contenido con el contenido del archivo `wsgi_production.py`
4. **Importante:** Cambia `TU_CONTRASENA_AQUI` por tu contraseña real de MySQL

---

### 6️⃣ Reiniciar la aplicación

1. Ve a [PythonAnywhere → Web](https://www.pythonanywhere.com/web/)
2. Haz clic en el botón verde **"Reload"** de tu app

---

### 7️⃣ Verificar que funciona

Abre tu navegador en: `https://giovann.pythonanywhere.com`

Deberías ver la API funcionando.

---

## 🔧 Comandos útiles

### Ver logs de la aplicación:
```bash
# En la consola de PythonAnywhere
cat ~/.var/log/httpd/giovann_pythonanywhere_com_error.log
```

### Probar conexión a la base de datos:
```bash
mysql -u giovann -h giovann.mysql.pythonanywhere-services.com -p 'giovann$elec2026' -e "SELECT 1;"
```

### Verificar tablas:
```bash
mysql -u giovann -h giovann.mysql.pythonanywhere-services.com -p 'giovann$elec2026' -e "SHOW TABLES;"
```

---

## ⚠️ Solución de problemas

### Error: "No module named 'fastapi'"
```bash
source ~/elec2026-web/venv/bin/activate
pip install -r requirements.txt
```

### Error: "Access denied for user"
- Verifica que la contraseña en el archivo WSGI sea correcta
- Asegúrate de usar `giovann$elec2026` como nombre de la base de datos

### Error: "ModuleNotFoundError: No module named 'main'"
- Verifica que el backend path esté correcto en el WSGI file
- Debe ser: `/home/giovann/elec2026-web/backend`

### La página carga pero no muestra datos
- Revisa los logs de error
- Verifica que CORS esté configurado correctamente
- Comprueba que la base de datos tenga datos

---

## 📝 Notas importantes

1. **PythonAnywhere usa WSGI, no ASGI**: FastAPI es ASGI, pero PythonAnywhere solo soporta WSGI nativamente. El archivo WSGI incluye un adapter.

2. **Base de datos**: El nombre interno es `giovann$elec2026`, pero en la conexión usas `giovann$elec2026`.

3. **Archivos estáticos**: Si el frontend está separado, debes:
   - Hacer build del frontend
   - Copiar los archivos estáticos a una carpeta en PythonAnywhere
   - O usar el frontend desde otro hosting

4. **Límites de PythonAnywhere free**:
   - 1 web app
   - 512 MB RAM
   - Procesamiento limitado
   - Debes recargar la app cada 3 meses
