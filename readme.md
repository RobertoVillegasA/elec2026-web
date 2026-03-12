# 🇧🇴 Sistema Electoral Bolivia 2026

Sistema de gestión electoral para elecciones subnacionales 2026.

## 📁 Estructura

```
elec2026-web/
├── backend/          # API REST con FastAPI
├── frontend/         # Interfaz de usuario con React + Vite
├── web.py            # Punto de entrada para despliegue
├── requirements.txt  # Dependencias de Python
└── railway.json      # Configuración para Railway
```

## 🚀 Despliegue

### Opciones de Servidor

| Plataforma | Estado | Notas |
|------------|--------|-------|
| **Railway** | ✅ Soportado | MySQL incluido, despliegue automático |
| **Render** | ✅ Soportado | MySQL incluido, plan gratis disponible |
| **PythonAnywhere** | ✅ Soportado | **Ver `DEPLOY_PYTHONANYWHERE.md`** |
| **VPS propio** | ✅ Soportado | Requiere configuración manual |

### Guías de Despliegue

- **Railway:** `DEPLOY_RAILWAY.md` o `QUICKSTART_RAILWAY.md`
- **Render:** `DEPLOY_RENDER.md`
- **PythonAnywhere:** `DEPLOY_PYTHONANYWHERE.md` ⭐
- **VPS/Docker:** `SERVER_CONFIG.md`

---

## 📋 Requisitos Previos

- Python 3.11+
- MySQL 8.0+
- Node.js 20+ (para el frontend)
- Git

---

## 🔧 Configuración Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/elec2026-web.git
cd elec2026-web
```

### 2. Crear entorno virtual

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales de MySQL
```

### 5. Ejecutar la aplicación

```bash
# Backend
python web.py

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

Accede a:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

---

## 🌐 Despliegue en Railway (Recomendado)

### Inicio Rápido

**Opción Automática:** Ejecuta `python railway_deploy.py`

**Opción Manual:** Sigue los pasos en `QUICKSTART_RAILWAY.md`

### Paso 1: Crear proyecto

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Selecciona `elec2026-web`

### Paso 2: Agregar MySQL

1. En tu proyecto, click **"New"** → **"Database"** → **"MySQL"**
2. Espera ~2 minutos a que se cree

### Paso 3: Configurar variables

Railway crea automáticamente: `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`

Agrega manualmente:
- `SECRET_KEY`: `tu_clave_secreta_larga`
- `CORS_ORIGIN`: `https://tu-frontend.up.railway.app`

### Paso 4: Migrar base de datos

```bash
# Copiar archivo de migración
cp .env.migration .env

# Editar .env con los datos de Railway

# Ejecutar migración
python deploy_to_railway.py
```

### Paso 5: Verificar

Accede a:
- **URL**: `https://tu-proyecto.up.railway.app`
- **Health**: `https://tu-proyecto.up.railway.app/health`
- **API Docs**: `https://tu-proyecto.up.railway.app/docs`

---

## 🌐 Despliegue en Render

### Paso 1: Subir a GitHub

```bash
git add .
git commit -m "Preparar para Render"
git push origin main
```

### Paso 2: Crear servicio en Render

1. Ve a [render.com](https://render.com)
2. Click **"New +"** → **"Blueprint"**
3. Conecta tu repositorio de GitHub
4. Render leerá el `render.yaml` automáticamente

### Paso 3: Configurar variables

Las variables de la base de datos se autocompletan. Agrega:
- `SECRET_KEY`: `tu_clave_secreta_larga`
- `CORS_ORIGIN`: `https://tu-frontend.onrender.com`

### Paso 4: Migrar base de datos

```bash
# Exportar DB local
mysqldump -u root -p elec2026 > backup.sql

# Importar en Render (desde dashboard)
mysql -h <host> -u <user> -p < backup.sql
```

---

## 🌐 Despliegue en PythonAnywhere

### Paso 1: Crear cuenta

1. Ve a [pythonanywhere.com](https://www.pythonanywhere.com)
2. Crea una cuenta gratuita

### Paso 2: Subir código

```bash
# Usar git en la consola de PythonAnywhere
git clone https://github.com/tu-usuario/elec2026-web.git
cd elec2026-web
```

### Paso 3: Configurar

```bash
# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar .env
cp .env.example .env
# Editar con tus credenciales
```

### Paso 4: Configurar Web App

1. Ve a la pestaña **"Web"**
2. Click **"Add a new web app"**
3. Selecciona **"Manual configuration"**
4. Python 3.10
5. Configura:
   - **Source code**: `/home/tu-usuario/elec2026-web`
   - **Working directory**: `/home/tu-usuario/elec2026-web`
   - **Virtualenv**: `/home/tu-usuario/elec2026-web/venv`

### Paso 5: Configurar WSGI

Edita el archivo WSGI:

```python
import sys
path = '/home/tu-usuario/elec2026-web'
if path not in sys.path:
    sys.path.insert(0, path)

from web import app as application
```

### Paso 6: Base de datos

1. Ve a la pestaña **"Databases"**
2. Crea una base de datos MySQL
3. Importa tu backup

---

## 🌐 Despliegue en VPS propio (Ubuntu/Debian)

### Paso 1: Instalar dependencias del sistema

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv mysql-server nginx git
```

### Paso 2: Configurar MySQL

```bash
sudo mysql
CREATE DATABASE sistema_electoral;
CREATE USER 'electoral'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON sistema_electoral.* TO 'electoral'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Paso 3: Clonar y configurar

```bash
cd /var/www
git clone https://github.com/tu-usuario/elec2026-web.git
cd elec2026-web

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Editar .env con tus credenciales
```

### Paso 4: Crear servicio systemd

```bash
sudo nano /etc/systemd/system/elec2026.service
```

```ini
[Unit]
Description=Sistema Electoral Bolivia 2026
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/elec2026-web
ExecStart=/var/www/elec2026-web/venv/bin/gunicorn web:app --workers 4 --bind 0.0.0.0:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable elec2026
sudo systemctl start elec2026
```

### Paso 5: Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/elec2026
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/elec2026 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Paso 6: SSL con Let's Encrypt (Opcional)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

## 🔐 Seguridad

### Variables de entorno críticas

| Variable | Descripción |
|----------|-------------|
| `SECRET_KEY` | Clave para JWT - **debe ser única y segura** |
| `DB_PASSWORD` | Contraseña de la base de datos |
| `CORS_ORIGIN` | Dominios permitidos para CORS |

### Generar SECRET_KEY segura

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Después del despliegue

1. ✅ Cambiar la contraseña del usuario `admin` por defecto
2. ✅ Generar una `SECRET_KEY` única
3. ✅ Configurar `CORS_ORIGIN` con tu dominio real
4. ✅ Habilitar HTTPS/SSL
5. ✅ Configurar firewall (puertos 80, 443)

---

## 📊 Endpoints útiles

| Endpoint | Descripción |
|----------|-------------|
| `/` | Página de inicio |
| `/health` | Health check |
| `/docs` | Documentación de la API (Swagger) |
| `/api/auth/login` | Login de usuarios |
| `/api/departamentos` | Listado de departamentos |
| `/api/municipios` | Listado de municipios |
| `/api/recintos` | Listado de recintos |

---

## 🐛 Solución de Problemas

### Error: "No se pudo conectar a la base de datos"

- Verifica las variables de entorno
- Asegúrate de que MySQL esté corriendo
- Revisa que el usuario tenga permisos

### Error: "CORS blocked"

- Configura `CORS_ORIGIN` con la URL correcta
- Para desarrollo: `http://localhost:5173`

### Error: "Module not found"

```bash
pip install -r requirements.txt
```

### El deploy falla en Railway/Render

1. Revisa los logs
2. Verifica que `web.py` esté en la raíz
3. Asegúrate de que `requirements.txt` esté actualizado

---

## 📚 Recursos adicionales

- [Documentación de FastAPI](https://fastapi.tiangolo.com/)
- [Documentación de Railway](https://docs.railway.app/)
- [Documentación de Render](https://render.com/docs)
- [Documentación de PythonAnywhere](https://help.pythonanywhere.com/)

---

## 📄 Licencia

Este proyecto es de uso interno para el sistema electoral de Bolivia 2026.

---

## 🆘 Soporte

Para problemas o consultas, revisa los logs del servidor o contacta al equipo de desarrollo.
