# 🐍 Despliegue en PythonAnywhere - Guía Completa

## 📋 Requisitos Previos

1. Tener cuenta en [PythonAnywhere](https://www.pythonanywhere.com) (puedes crear una gratis)
2. Tener tu código en GitHub
3. Tener MySQL en PythonAnywhere configurado

---

## 🚀 PASO A PASO

### PASO 1: Crear Cuenta en PythonAnywhere

1. Ve a https://www.pythonanywhere.com
2. Click en **"Sign up"**
3. Elige el plan **Beginner** (gratis) o uno superior
4. Completa el registro

---

### PASO 2: Configurar Base de Datos MySQL

1. **Ve a la pestaña "Databases"**
2. En **"MySQL"**, verás:
   - **Username**: `tu_usuario`
   - **Password**: (la que creaste al registrarte)
   - **Host**: `tu_usuario.mysql.pythonanywhere-services.com`

3. **Crear base de datos:**
   - En "Create a new database"
   - Database name: `elec2026`
   - Click **"Create"**

4. **Acceder a phpMyAdmin:**
   - Click en el botón **"Go to phpMyAdmin"**
   - Inicia sesión con tus credenciales

5. **Importar estructura y datos:**
   - Ve a la pestaña **"Import"**
   - Selecciona el archivo `backend/create_database.sql`
   - Click **"Go"**
   
   O ejecuta el SQL manualmente:
   ```sql
   -- Copia y pega el contenido de backend/create_database.sql
   ```

6. **Importar datos desde tu MySQL local:**
   - Exporta tu base de datos local:
     ```bash
     mysqldump -u root -p elec2026 > backup.sql
     ```
   - En phpMyAdmin → Import → Selecciona `backup.sql`

---

### PASO 3: Subir Código a PythonAnywhere

#### Opción A: Usando Git (Recomendado)

1. **Abre una consola Bash** en PythonAnywhere:
   - Ve a **"Consoles"**
   - Click **"Start a new console"** → **"Bash"**

2. **Clona tu repositorio:**
   ```bash
   git clone https://github.com/RobertoVillegasA/elec2026-web.git
   cd elec2026-web
   ```

3. **Crear entorno virtual:**
   ```bash
   python3.10 -m venv venv
   source venv/bin/activate
   ```

4. **Instalar dependencias:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

#### Opción B: Subir Archivos Manualmente

1. **Ve a la pestaña "Files"**
2. Click **"Upload"**
3. Sube todos los archivos del proyecto
4. Luego crea una consola y ejecuta:
   ```bash
   cd elec2026-web
   python3.10 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

---

### PASO 4: Configurar Variables de Entorno

1. **En la consola Bash:**
   ```bash
   cd elec2026-web
   cp .env.example .env
   nano .env
   ```

2. **Edita `.env` con:**
   ```env
   # Base de datos PythonAnywhere
   DB_HOST=tu_usuario.mysql.pythonanywhere-services.com
   DB_PORT=3306
   DB_NAME=elec2026
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password_de_pythonanywhere
   
   # Seguridad
   SECRET_KEY=tu_clave_secreta_generada
   
   # CORS
   CORS_ORIGIN=https://tu_usuario.pythonanywhere.com
   
   # Configuración
   DEBUG=false
   LOG_LEVEL=INFO
   ```

3. **Guardar y salir:**
   - `Ctrl + O` → Enter → `Ctrl + X`

---

### PASO 5: Configurar Web App

1. **Ve a la pestaña "Web"**
2. Click **"Add a new web app"**
3. Selecciona:
   - **Manual configuration** (importante!)
   - **Python 3.10**

4. **Configura el WSGI file:**

   Click en el enlace del **WSGI configuration file** (algo como `/var/www/tu_usuario_pythonanywhere_com_wsgi.py`)

   Reemplaza TODO el contenido con:

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
   os.environ['SECRET_KEY'] = 'tu_clave_secreta'
   os.environ['DB_HOST'] = 'tu_usuario.mysql.pythonanywhere-services.com'
   os.environ['DB_NAME'] = 'elec2026'
   os.environ['DB_USER'] = 'tu_usuario'
   os.environ['DB_PASSWORD'] = 'tu_password'
   os.environ['CORS_ORIGIN'] = 'https://tu_usuario.pythonanywhere.com'
   os.environ['DEBUG'] = 'False'

   # Importar la app
   from web import app as application
   ```

5. **Guardar** el archivo WSGI

---

### PASO 6: Configurar Archivos Estáticos

1. **En la pestaña "Web":**
2. Baja a **"Static files"**
3. Click **"Add another static file"**

| URL | Directory |
|-----|-----------|
| `/static/` | `/home/tu_usuario/elec2026-web/backend/static` |

---

### PASO 7: Configurar el Virtual Environment

1. **En la pestaña "Web":**
2. Baja a **"Virtualenv"**
3. En **"Path to your virtualenv"**, pon:
   ```
   /home/tu_usuario/elec2026-web/venv
   ```
4. Click **"Save"**

---

### PASO 8: Reiniciar la Aplicación

1. **En la pestaña "Web":**
2. Click en el botón verde **"Reload"**

---

### PASO 9: Verificar

1. **Abre tu navegador:**
   ```
   https://tu_usuario.pythonanywhere.com
   ```

2. **Prueba los endpoints:**
   ```
   https://tu_usuario.pythonanywhere.com/health
   https://tu_usuario.pythonanywhere.com/docs
   ```

---

## 🔧 Configuración de la Base de Datos

### Conectar MySQL desde Python

```python
# El archivo database.py ya está configurado para PythonAnywhere
# Detecta automáticamente el host de PythonAnywhere

from database import get_db

# La conexión usa:
# DB_HOST = tu_usuario.mysql.pythonanywhere-services.com
```

### Acceder a MySQL desde la consola

```bash
mysql -u tu_usuario -h tu_usuario.mysql.pythonanywhere-services.com elec2026 -p
```

---

## 📊 Estructura de Directorios en PythonAnywhere

```
/home/tu_usuario/
├── elec2026-web/
│   ├── backend/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── routes/
│   │   └── static/
│   ├── venv/
│   ├── .env
│   ├── web.py
│   └── requirements.txt
└── .bashrc
```

---

## 🐛 Solución de Problemas

### Error 500 Internal Server Error

**Causa:** Error en el código o configuración

**Solución:**
1. Ve a **"Web"** → **"Error log"**
2. Revisa los errores
3. Comúnmente es:
   - Ruta incorrecta en el WSGI
   - Falta SECRET_KEY
   - Error de importación

### Error de Base de Datos

**Causa:** Credenciales incorrectas

**Solución:**
1. Verifica en **"Databases"** tus credenciales
2. Asegúrate de que la base de datos existe
3. Verifica que el usuario tiene permisos

### Error: "No module named 'fastapi'"

**Causa:** Dependencias no instaladas

**Solución:**
```bash
cd elec2026-web
source venv/bin/activate
pip install -r requirements.txt
```

### Error: "ImportError: cannot import name 'app'"

**Causa:** El archivo WSGI no encuentra la app

**Solución:**
1. Verifica la ruta en el WSGI
2. Asegúrate de que `web.py` está en la raíz
3. Revisa que `backend/main.py` tenga `app`

### Error de CORS

**Solución:**
```env
CORS_ORIGIN=https://tu_usuario.pythonanywhere.com
```

---

## 💰 Planes de PythonAnywhere

| Plan | Precio | Características |
|------|--------|----------------|
| **Beginner** | Gratis | 1 web app, 512 MB, MySQL incluido |
| **Hacker** | $5/mes | 5 web apps, 1 GB, consolas privadas |
| **Web Developer** | $12/mes | 10 web apps, 5 GB, soporte prioritario |

**Recomendación:** Empieza con el plan gratis, luego actualiza si necesitas más recursos.

---

## 🔐 Seguridad

### Generar SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Variables de Entorno Recomendadas

```env
SECRET_KEY=xK9mP2nQ7vR4sT8wY3zA6bC1dE5fG0hI...
DB_PASSWORD=tu_password_seguro
CORS_ORIGIN=https://tu_usuario.pythonanywhere.com
DEBUG=False
```

---

## 📝 Checklist de Despliegue

- [ ] Cuenta en PythonAnywhere creada
- [ ] Base de datos MySQL creada
- [ ] Tablas importadas (create_database.sql)
- [ ] Datos migrados
- [ ] Código subido (Git o manual)
- [ ] Entorno virtual creado
- [ ] Dependencias instaladas
- [ ] Archivo `.env` configurado
- [ ] WSGI configurado correctamente
- [ ] Virtualenv configurado en Web tab
- [ ] Archivos estáticos configurados
- [ ] App recargada
- [ ] Health check responde
- [ ] API docs carga

---

## 🎉 ¡Listo!

Tu sistema estará disponible en:

```
https://tu_usuario.pythonanywhere.com
```

**Próximos pasos:**
1. Configurar dominio personalizado (opcional)
2. Subir el frontend a Vercel/Netlify
3. Configurar backups de MySQL

---

## 📞 Recursos

| Recurso | URL |
|---------|-----|
| PythonAnywhere Dashboard | https://www.pythonanywhere.com |
| Documentación | https://help.pythonanywhere.com/ |
| Foros | https://www.pythonanywhere.com/forums/ |

---

**¡Éxito con tu despliegue! 🇧🇴🎉**
