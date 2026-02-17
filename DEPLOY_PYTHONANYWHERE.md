# Guía de Despliegue en PythonAnywhere

## 📋 Resumen

Esta guía te ayudará a desplegar tu sistema electoral en **PythonAnywhere**, incluyendo:
- Backend FastAPI
- Frontend React (como archivos estáticos)
- Base de datos MySQL

---

## 🚀 Paso 1: Crear cuenta en PythonAnywhere

1. Ve a [https://www.pythonanywhere.com](https://www.pythonanywhere.com)
2. Regístrate para una cuenta **gratuita** o **pagada**
   - **Gratis**: 1 web app, 512 MB de almacenamiento, MySQL limitado
   - **Pagada** ($5/mes): Más recursos, acceso a dominios personalizados

---

## 🗄️ Paso 2: Configurar Base de Datos MySQL

### 2.1 Crear la base de datos

1. Inicia sesión en PythonAnywhere
2. Ve a la pestaña **"Databases"**
3. En **"Create a new database"**, ingresa el nombre: `electoral2026`
4. Haz clic en **Create**

### 2.2 Configurar usuario y contraseña

- **Username**: `tu_usuario` (tu usuario de PythonAnywhere)
- **Password**: La que definas en la sección de Databases
- **Host**: `tu_usuario.mysql.pythonanywhere-services.com`
- **Database name**: `tu_usuario$electoral2026`

### 2.3 Importar tu base de datos local

**Opción A: Usando phpMyAdmin (recomendado)**

1. En la sección **Databases**, haz clic en **"Open phpMyAdmin"**
2. Exporta tu base de datos local:
   ```bash
   # En tu máquina local
   mysqldump -u root -p elec2026 > electoral2026.sql
   ```
3. En phpMyAdmin, ve a **Import** y sube el archivo `electoral2026.sql`

**Opción B: Usando consola MySQL**

1. En la consola de PythonAnywhere:
   ```bash
   mysql -u tu_usuario -h tu_usuario.mysql.pythonanywhere-services.com "tu_usuario$electoral2026" -p
   ```
2. Dentro de MySQL:
   ```sql
   source /home/tu_usuario/electoral2026.sql
   ```

---

## 🐍 Paso 3: Subir el Backend

### 3.1 Subir archivos vía Git o FTP

**Usando Git (recomendado):**

```bash
# En la consola de PythonAnywhere
git clone https://github.com/tu_usuario/tu_repositorio.git /home/tu_usuario/electoral2026
```

**Usando FTP:**

1. Conéctate a `ftp.pythonanywhere.com` con tu usuario y contraseña
2. Sube la carpeta `backend` a `/home/tu_usuario/electoral2026/backend`

### 3.2 Crear entorno virtual

```bash
# En la consola de PythonAnywhere
cd /home/tu_usuario/electoral2026
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r backend/requirements.txt

# Instalar asgiref para WSGI
pip install asgiref gunicorn
```

### 3.3 Configurar archivo .env

Crea `/home/tu_usuario/electoral2026/backend/.env`:

```env
DB_HOST=tu_usuario.mysql.pythonanywhere-services.com
DB_NAME=tu_usuario$electoral2026
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
```

---

## 🌐 Paso 4: Configurar Web App

### 4.1 Ir a la pestaña "Web"

1. Haz clic en **"Add a new web app"**
2. Selecciona **"Manual configuration"** (no la automática)
3. Elige **Python 3.10** (o la versión más reciente)

### 4.2 Configurar WSGI

1. En la sección **"WSGI configuration file"**, verás una ruta como:
   ```
   /var/www/tu_usuario_pythonanywhere_com_wsgi.py
   ```
2. Haz clic en ese enlace para editar el archivo

3. Reemplaza TODO el contenido con:

```python
# /var/www/tu_usuario_pythonanywhere_com_wsgi.py
import sys
import os

# Agregar el path del proyecto
project_home = '/home/tu_usuario/electoral2026/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Configurar variables de entorno
os.environ['DB_HOST'] = 'tu_usuario.mysql.pythonanywhere-services.com'
os.environ['DB_NAME'] = 'tu_usuario$electoral2026'
os.environ['DB_USER'] = 'tu_usuario'
os.environ['DB_PASSWORD'] = 'tu_contraseña'

# Importar la app de FastAPI
from main import app as application

# Convertir ASGI a WSGI para PythonAnywhere
from asgiref.wsgi import WsgiToAsgi
application = WsgiToAsgi(application)
```

### 4.3 Configurar archivos estáticos (Frontend)

1. En la sección **"Static files"**:
   - **URL**: `/`
   - **Directory**: `/home/tu_usuario/electoral2026/frontend/dist`

2. Haz clic en **Add**

### 4.4 Configurar CORS (importante)

En `backend/main.py`, actualiza el CORS para permitir tu dominio:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tu_usuario.pythonanywhere.com",
        "http://localhost:5173",  # Para desarrollo local
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🎨 Paso 5: Build del Frontend

### 5.1 Build local (recomendado)

En tu máquina local:

```bash
cd g:\elec2026-web\frontend

# Actualizar la URL de la API en el frontend
# Edita frontend/src/services/api.js y cambia:
# const API_URL = "https://tu_usuario.pythonanywhere.com";

npm run build

# Subir la carpeta dist a PythonAnywhere
# Usa FTP o SCP para subir frontend/dist a /home/tu_usuario/electoral2026/frontend/dist
```

### 5.2 Subir el build

```bash
# Opción 1: Usando scp desde tu máquina local
scp -r dist/* tu_usuario@ssh.pythonanywhere.com:/home/tu_usuario/electoral2026/frontend/dist/

# Opción 2: Usando la consola de PythonAnywhere
cd /home/tu_usuario/electoral2026/frontend
git clone https://github.com/tu_usuario/tu_repositorio.git temp_frontend
mv temp_frontend/frontend/dist/* dist/
rm -rf temp_frontend
```

---

## ⚙️ Paso 6: Configuración Final

### 6.1 Reload de la aplicación

1. Ve a la pestaña **Web**
2. Haz clic en el botón verde **"Reload"** para tu aplicación

### 6.2 Verificar logs

1. Ve a la pestaña **Files**
2. Navega a `.logs/`
3. Revisa `error.log` y `server.log` para debugging

---

## 🔧 Paso 7: Solución de Problemas

### Error: "No module named 'main'"

**Solución:** Verifica que el path en el archivo WSGI sea correcto:
```python
project_home = '/home/tu_usuario/electoral2026/backend'
```

### Error: "Can't connect to MySQL server"

**Solución:**
1. Verifica las credenciales en `.env`
2. Asegúrate de que la base de datos existe: `tu_usuario$electoral2026`
3. El host debe ser: `tu_usuario.mysql.pythonanywhere-services.com`

### Error: CORS policy

**Solución:** Agrega tu dominio al CORS en `backend/main.py`:
```python
allow_origins=["https://tu_usuario.pythonanywhere.com"]
```

### Error: 404 en el frontend

**Solución:**
1. Verifica que la carpeta `dist` existe en `/home/tu_usuario/electoral2026/frontend/dist`
2. Revisa que la configuración de static files apunte a esa carpeta

---

## 📝 Archivos Importantes a Modificar

### 1. `frontend/src/services/api.js`

```javascript
// Cambiar la URL base para producción
const API_URL = import.meta.env.VITE_API_URL || 
  "https://tu_usuario.pythonanywhere.com";
```

### 2. `backend/.env` (en PythonAnywhere)

```env
DB_HOST=tu_usuario.mysql.pythonanywhere-services.com
DB_NAME=tu_usuario$electoral2026
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
```

### 3. `backend/main.py` (CORS)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tu_usuario.pythonanywhere.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ✅ Checklist Final

- [ ] Cuenta de PythonAnywhere creada
- [ ] Base de datos `tu_usuario$electoral2026` creada
- [ ] Datos importados a la base de datos
- [ ] Archivos del backend subidos a `/home/tu_usuario/electoral2026/backend`
- [ ] Entorno virtual creado y dependencias instaladas
- [ ] Archivo `.env` configurado con credenciales de PythonAnywhere
- [ ] Archivo WSGI configurado correctamente
- [ ] Frontend builded y subido a `/home/tu_usuario/electoral2026/frontend/dist`
- [ ] Static files configurados en la pestaña Web
- [ ] CORS configurado para tu dominio
- [ ] Aplicación recargada (Reload)
- [ ] Pruebas realizadas en `https://tu_usuario.pythonanywhere.com`

---

## 🎉 ¡Listo!

Tu sistema debería estar accesible en:
- **Frontend**: `https://tu_usuario.pythonanywhere.com`
- **API**: `https://tu_usuario.pythonanywhere.com/api/*`

---

## 📞 Soporte

- Documentación oficial: [https://help.pythonanywhere.com/](https://help.pythonanywhere.com/)
- Foros: [https://www.pythonanywhere.com/forums/](https://www.pythonanywhere.com/forums/)
