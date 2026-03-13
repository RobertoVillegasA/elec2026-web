# 🐍 PythonAnywhere SIN Virtual Environment (venv)

## ⚠️ Advertencia

**No usar virtualenv no es recomendado** porque:
- Puede haber conflictos de versiones
- Otros proyectos pueden verse afectados
- Más difícil de mantener

**Pero si necesitas hacerlo, sigue esta guía:**

---

## 📋 Requisitos

- Cuenta en PythonAnywhere (Hacker o superior para consolas privadas)
- En plan **Beginner (gratis)**: Solo tienes 1 consola pública

---

## 🚀 Pasos para Desplegar SIN venv

### PASO 1: Instalar Dependencias Globalmente

1. **Abre una consola Bash** en PythonAnywhere

2. **Instalar dependencias con --user:**
   ```bash
   pip install --user -r requirements.txt
   ```

   **O instalar una por una:**
   ```bash
   pip install --user fastapi uvicorn gunicorn
   pip install --user mysql-connector-python sqlalchemy
   pip install --user python-jose passlib bcrypt
   pip install --user python-multipart python-dotenv
   pip install --user google-auth google-api-python-client
   pip install --user Pillow requests httpx pymysql
   ```

   **Nota:** `--user` instala en tu directorio home sin necesitar root

---

### PASO 2: Subir Código

**Opción A - Git:**
```bash
git clone https://github.com/RobertoVillegasA/elec2026-web.git
cd elec2026-web
```

**Opción B - Upload manual:**
- Ve a **Files**
- Click **Upload**
- Sube todos los archivos

---

### PASO 3: Configurar Web App

1. **Ve a la pestaña "Web"**
2. Click **"Add a new web app"**
3. Selecciona:
   - **Manual configuration**
   - **Python 3.10**

4. **Configurar WSGI:**

Click en el enlace del **WSGI configuration file** y reemplaza TODO con:

```python
import sys
import os

# Agregar el proyecto al path
project_home = '/home/tu_usuario/elec2026-web'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Agregar backend al path
backend_path = os.path.join(project_home, 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Configurar variables de entorno
os.environ['SECRET_KEY'] = 'tu_clave_secreta_generada_con_python_secrets_token_urlsafe_32'
os.environ['DB_HOST'] = 'tu_usuario.mysql.pythonanywhere-services.com'
os.environ['DB_NAME'] = 'elec2026'
os.environ['DB_USER'] = 'tu_usuario'
os.environ['DB_PASSWORD'] = 'tu_password_de_pythonanywhere'
os.environ['CORS_ORIGIN'] = 'https://tu_usuario.pythonanywhere.com'
os.environ['DEBUG'] = 'False'
os.environ['LOG_LEVEL'] = 'INFO'

# Importar la app
from web import app as application
```

5. **Guardar** el archivo WSGI

---

### PASO 4: Configurar Variables de Entorno (Alternativa)

En lugar de ponerlas en el WSGI, puedes usar `.env`:

1. **Crear archivo `.env`:**
   ```bash
   cd elec2026-web
   nano .env
   ```

2. **Contenido:**
   ```env
   SECRET_KEY=tu_clave_secreta
   DB_HOST=tu_usuario.mysql.pythonanywhere-services.com
   DB_NAME=elec2026
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password
   CORS_ORIGIN=https://tu_usuario.pythonanywhere.com
   DEBUG=False
   LOG_LEVEL=INFO
   ```

---

### PASO 5: Configurar Archivos Estáticos

1. **En la pestaña "Web":**
2. Baja a **"Static files"**
3. Click **"Add another static file"**

| URL | Directory |
|-----|-----------|
| `/static/` | `/home/tu_usuario/elec2026-web/backend/static` |

---

### PASO 6: Reiniciar la Aplicación

1. **En la pestaña "Web":**
2. Click en el botón verde **"Reload"**

---

### PASO 7: Verificar

```
https://tu_usuario.pythonanywhere.com/health
https://tu_usuario.pythonanywhere.com/docs
```

---

## 🔧 Comandos Útiles

### Ver paquetes instalados
```bash
pip list --user
```

### Actualizar paquetes
```bash
pip install --user --upgrade fastapi uvicorn
```

### Ver ruta de Python
```bash
which python
python --version
```

---

## 🐛 Solución de Problemas

### Error: "No module named 'fastapi'"

**Causa:** Los paquetes no están instalados

**Solución:**
```bash
pip install --user fastapi uvicorn[standard]
```

### Error: "ModuleNotFoundError: No module named 'main'"

**Causa:** El WSGI no encuentra la app

**Solución:**
1. Verifica las rutas en el WSGI
2. Asegúrate que `web.py` está en `/home/tu_usuario/elec2026-web/`

### Error 500 Internal Server Error

**Causa:** Error en el código

**Solución:**
1. Ve a **"Web"** → **"Error log"**
2. Revisa los errores específicos

### Los paquetes no se encuentran

**Causa:** Python no encuentra los paquetes de user

**Solución:**
```bash
# Agregar al .bashrc
echo 'export PYTHONUSERBASE=/home/tu_usuario/.local' >> ~/.bashrc
source ~/.bashrc
```

---

## 📊 Comparación: Con vs Sin venv

| Característica | Con venv | Sin venv |
|---------------|----------|----------|
| **Aislamiento** | ✅ Completo | ❌ Ninguno |
| **Espacio en disco** | ~200 MB | ~50 MB (compartido) |
| **Facilidad** | ✅ Más fácil | ⚠️ Más complejo |
| **Recomendado** | ✅ SÍ | ❌ NO |
| **Plan Beginner** | ✅ Funciona | ⚠️ Limitado |

---

## ✅ Checklist Sin venv

- [ ] Paquetes instalados con `pip install --user`
- [ ] Código subido a PythonAnywhere
- [ ] WSGI configurado correctamente
- [ ] Variables de entorno configuradas
- [ ] Archivos estáticos configurados
- [ ] App recargada
- [ ] Health check responde

---

## 💡 Recomendación

**Usa virtualenv siempre que sea posible:**

```bash
# Crear venv
python3.10 -m venv venv

# Activar
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

En el plan **Beginner (gratis)** tienes 1 consola pública, pero el venv persiste entre sesiones.

---

## 📞 Recursos

| Recurso | URL |
|---------|-----|
| PythonAnywhere | https://www.pythonanywhere.com |
| Documentación | https://help.pythonanywhere.com/ |
| Foros | https://www.pythonanywhere.com/forums/ |

---

**¡Éxito! 🎉**
