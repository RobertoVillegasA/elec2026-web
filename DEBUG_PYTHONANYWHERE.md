# 🐛 Debugging - Error en PythonAnywhere

## 🔍 Pasos para Diagnosticar el Error

### PASO 1: Revisar los Logs de Error

1. **Ve a PythonAnywhere**
2. **Click en "Files"**
3. **Navega a:** `/var/log/`
4. **Busca el archivo:** `tu_usuario_pythonanywhere_com.error.log`
5. **Click para verlo**

**O desde la pestaña Web:**
- Ve a **"Web"**
- Baja hasta **"Error log"**
- Click en el enlace para ver los logs

---

### PASO 2: Errores Comunes y Soluciones

#### ❌ Error: `ModuleNotFoundError: No module named 'fastapi'`

**Causa:** Dependencias no instaladas

**Solución:**
```bash
# En la consola Bash de PythonAnywhere
cd elec2026-web

# Si usas venv:
source venv/bin/activate
pip install -r requirements.txt

# Si NO usas venv:
pip install --user -r requirements.txt
```

---

#### ❌ Error: `No module named 'web'`

**Causa:** La ruta al proyecto es incorrecta

**Solución:**

1. **Verifica la ruta en la consola:**
   ```bash
   ls /home/tu_usuario/
   ```
   Deberías ver `elec2026-web`

2. **Si la carpeta tiene otro nombre:**
   - O la renombras: `mv elec2026-web-old elec2026-web`
   - O actualiza el WSGI con el nombre correcto

3. **En el WSGI, verifica:**
   ```python
   project_home = '/home/tu_usuario/elec2026-web'  # ← Debe coincidir
   ```

---

#### ❌ Error: `ImportError: cannot import name 'app' from 'web'`

**Causa:** El archivo `web.py` no exporta `app`

**Solución:**

1. **Verifica que `web.py` existe:**
   ```bash
   ls /home/tu_usuario/elec2026-web/web.py
   ```

2. **Verifica el contenido de `web.py`:**
   ```bash
   cat /home/tu_usuario/elec2026-web/web.py
   ```
   Debe tener: `from main import app`

3. **En el WSGI, usa:**
   ```python
   from web import app as application
   ```

---

#### ❌ Error: `pymysql.err.OperationalError: (2003, "Can't connect to MySQL server")`

**Causa:** No puede conectar a la base de datos

**Solución:**

1. **Verifica las credenciales en el WSGI:**
   ```python
   os.environ['DB_HOST'] = 'tu_usuario.mysql.pythonanywhere-services.com'
   os.environ['DB_USER'] = 'tu_usuario'
   os.environ['DB_PASSWORD'] = 'tu_password'
   ```

2. **Verifica que la base de datos existe:**
   - Ve a **"Databases"**
   - Deberías ver `elec2026` en la lista

3. **Prueba la conexión desde la consola:**
   ```bash
   mysql -u tu_usuario -h tu_usuario.mysql.pythonanywhere-services.com elec2026 -p
   ```

---

#### ❌ Error: `SECRET_KEY is not set`

**Causa:** Falta la variable SECRET_KEY

**Solución:**

En el WSGI, asegúrate de tener:
```python
os.environ['SECRET_KEY'] = 'una_clave_larga_y_segura_de_al_menos_32_caracteres'
```

---

#### ❌ Error: `Permission denied` o `Access denied`

**Causa:** Problemas de permisos en los archivos

**Solución:**

```bash
# En la consola Bash
cd /home/tu_usuario/elec2026-web
chmod -R 755 .
chmod -R 644 backend/routes/*.py
```

---

### PASO 3: Verificar la Estructura de Archivos

**En la consola Bash, ejecuta:**
```bash
cd /home/tu_usuario/elec2026-web
tree -L 2
```

**Deberías ver:**
```
elec2026-web/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── web.py  ← ¡Debe estar aquí!
│   └── routes/
├── venv/  (opcional)
├── .env
├── web.py  ← ¡IMPORTANTE!
└── requirements.txt
```

**Si falta `web.py` en la raíz:**
```bash
# Copiar desde backend
cp backend/web.py .
```

---

### PASO 4: Probar la Aplicación Manualmente

**En la consola Bash:**

```bash
cd /home/tu_usuario/elec2026-web

# Si usas venv:
source venv/bin/activate

# Establecer variables de entorno
export SECRET_KEY='test_secret_key_1234567890'
export DB_HOST='tu_usuario.mysql.pythonanywhere-services.com'
export DB_NAME='elec2026'
export DB_USER='tu_usuario'
export DB_PASSWORD='tu_password'
export CORS_ORIGIN='https://tu_usuario.pythonanywhere.com'

# Probar importación
python -c "from web import app; print('OK:', app)"
```

**Si esto falla, el error está en el código.**

---

### PASO 5: WSGI de Debugging

**Reemplaza temporalmente tu WSGI con esto:**

```python
import sys
import os
import traceback

# Configuración básica
username = 'tu_usuario'  # ← CAMBIA ESTO
project_home = f'/home/{username}/elec2026-web'

# Agregar al path
for path in [project_home, os.path.join(project_home, 'backend')]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Variables de entorno
os.environ['SECRET_KEY'] = 'debug_key_1234567890'
os.environ['DB_HOST'] = f'{username}.mysql.pythonanywhere-services.com'
os.environ['DB_NAME'] = 'elec2026'
os.environ['DB_USER'] = username
os.environ['DB_PASSWORD'] = 'tu_password'
os.environ['CORS_ORIGIN'] = f'https://{username}.pythonanywhere.com'

try:
    from web import app as application
    application.title = "Sistema Electoral Bolivia 2026"
except Exception as e:
    # App de emergencia para mostrar el error
    from fastapi import FastAPI
    
    application = FastAPI(title="Debug Error")
    
    @application.get("/")
    def debug_root():
        return {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "project_home": project_home,
            "python_path": sys.path[:3],
            "python_version": sys.version
        }
    
    @application.get("/health")
    def debug_health():
        return {"status": "error", "detail": str(e)}
```

**Esto mostrará el error en el navegador en lugar de una página 500.**

---

## ✅ Checklist de Debugging

- [ ] Revisar `/var/log/tu_usuario_pythonanywhere_com.error.log`
- [ ] Verificar que `web.py` está en `/home/tu_usuario/elec2026-web/`
- [ ] Verificar que `backend/main.py` existe
- [ ] Verificar dependencias instaladas (`pip list`)
- [ ] Verificar credenciales de MySQL en Databases tab
- [ ] Probar importación manual en consola
- [ ] Revisar WSGI configuration file
- [ ] Click en Reload después de cada cambio

---

## 📞 Contactar Soporte

Si después de seguir estos pasos el error persiste:

1. **Prepara esta información:**
   - Tu usuario de PythonAnywhere
   - El contenido del error log
   - El contenido de tu WSGI file
   - El resultado de `pip list`

2. **Envía a:**
   - Email: `support@pythonanywhere.com`
   - O usa el formulario: https://www.pythonanywhere.com/feedback/

3. **Incluye:**
   ```
   Asunto: ImportError - Sistema Electoral Bolivia 2026
   
   Hola,
   
   Tengo un error al desplegar mi aplicación FastAPI en PythonAnywhere.
   
   Mi usuario: tu_usuario
   Mi app: tu_usuario.pythonanywhere.com
   
   Error del log:
   [PEGA EL ERROR COMPLETO AQUÍ]
   
   Mi WSGI:
   [PEGA TU WSGI AQUÍ]
   
   ¿Podrían ayudarme?
   
   Gracias.
   ```

---

## 🎯 Próximos Pasos

1. **Revisa los logs** (Paso 1)
2. **Identifica el error** (Paso 2)
3. **Aplica la solución** correspondiente
4. **Click en Reload** en la pestaña Web
5. **Prueba** `https://tu_usuario.pythonanywhere.com/health`

---

**¿Qué error específico ves en los logs? ¡Compártelo para ayudarte mejor!**
