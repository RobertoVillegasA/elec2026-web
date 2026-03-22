# 🚀 Despliegue en PythonAnywhere

Guía completa para desplegar el Sistema Electoral Bolivia 2026 en PythonAnywhere.

---

## 📋 Índice

1. [Crear Cuenta](#1-crear-cuenta)
2. [Preparar el Código](#2-preparar-el-código)
3. [Configurar Base de Datos](#3-configurar-base-de-datos)
4. [Configurar Entorno Virtual](#4-configurar-entorno-virtual)
5. [Configurar Web App](#5-configurar-web-app)
6. [Configurar WSGI](#6-configurar-wsgi)
7. [Variables de Entorno](#7-variables-de-entorno)
8. [Migrar Base de Datos](#8-migrar-base-de-datos)
9. [Verificar Despliegue](#9-verificar-despliegue)
10. [Solución de Problemas](#10-solución-de-problemas)

---password myseql libre2026!giovan

## 1. Crear Cuenta

### Paso 1.1: Registrarse

1. Ve a [pythonanywhere.com](https://www.pythonanywhere.com)
2. Click en **"Create a beginner account"**
3. Completa el formulario:
   - **Username**: `tu-usuario` (será parte de tu URL: `tu-usuario.pythonanywhere.com`)
   - **Email**: tu correo electrónico
   - **Password**: contraseña segura
4. Verifica tu correo electrónico

### Paso 1.2: Plan Gratuito vs Pago

| Característica | Plan Gratuito | Plan Pago |
|----------------|---------------|-----------|
| CPU time | Limitado | Más recursos |
| Almacenamiento | 512 MB | 10 GB+ |
| Dominio | `usuario.pythonanywhere.com` | Dominio personalizado |
| HTTPS | ✅ Incluido | ✅ Incluido |
| MySQL | ✅ 1 base de datos | ✅ Múltiples |

---

## 2. Preparar el Código

### Opción A: Usar Git (Recomendado)

```bash
# En la consola de PythonAnywhere
git clone https://github.com/RobertoVillegasA/elec2026-web.git
cd elec2026-web
```

### Opción B: Subir Manualmente

1. En el dashboard, ve a la pestaña **"Files"**
2. Click en **"Upload a file"**
3. Sube un archivo ZIP con todo el código
4. En la consola, descomprime:

```bash
cd /home/tu-usuario
unzip elec2026-web.zip
cd elec2026-web
```

---

## 3. Configurar Base de Datos

### Paso 3.1: Crear Base de Datos

1. Ve a la pestaña **"Databases"** en el dashboard
2. En **"MySQL"**, crea:
   - **Password**: contraseña segura (guárdala)
   - **Database name**: `tu-usuario$default` (automático)

### Paso 3.2: Importar Datos

```bash
# En la consola de PythonAnywhere
mysql -u tu-usuario -p < backend/create_database.sql
```

O usa el interfaz web:
1. Click en **"Go to mysql command-line client"**
2. Ingresa tu contraseña
3. Ejecuta:

```sql
USE tu-usuario$default;
SOURCE /home/tu-usuario/elec2026-web/backend/create_database.sql;
```

### Paso 3.3: Verificar Conexión

```bash
mysql -u tu-usuario -p
```

```sql
USE tu-usuario$default;
SHOW TABLES;
SELECT * FROM departamentos LIMIT 5;
```

---

## 4. Configurar Entorno Virtual

### Paso 4.1: Crear Entorno Virtual

```bash
cd /home/tu-usuario/elec2026-web
python3 -m venv venv
```

### Paso 4.2: Activar Entorno

```bash
source venv/bin/activate
```

### Paso 4.3: Instalar Dependencias

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Paso 4.4: Verificar Instalación

```bash
pip list | grep -i fastapi
pip list | grep -i mysql
pip list | grep -i gunicorn
```

---

## 5. Configurar Web App

### Paso 5.1: Crear Web App

1. Ve a la pestaña **"Web"**
2. Click en **"Add a new web app"**
3. Selecciona:
   - **Manual configuration** (importante!)
   - **Python 3.10** (o la versión más reciente disponible)

### Paso 5.2: Configurar Ruta del Código

En la sección **"Code"**:

| Campo | Valor |
|-------|-------|
| **Source code** | `/home/tu-usuario/elec2026-web` |
| **Working directory** | `/home/tu-usuario/elec2026-web` |

### Paso 5.3: Configurar Entorno Virtual

En la sección **"Virtualenv"**:

| Campo | Valor |
|-------|-------|
| **Virtualenv** | `/home/tu-usuario/elec2026-web/venv` |

---

## 6. Configurar WSGI

### Paso 6.1: Editar Archivo WSGI

1. En la pestaña **"Web"**, busca **"WSGI configuration file"**
2. Click en el enlace (ej: `/var/www/tu-usuario_pythonanywhere_com_wsgi.py`)
3. Reemplaza TODO el contenido con:

```python
# /var/www/tu-usuario_pythonanywhere_com_wsgi.py
import sys
import os

# Agregar el proyecto al path
path = '/home/tu-usuario/elec2026-web'
if path not in sys.path:
    sys.path.insert(0, path)

# Establecer el directorio de trabajo
os.chdir(path)

# Activar variables de entorno (opcional, si usas .env)
from dotenv import load_dotenv
load_dotenv(os.path.join(path, '.env'))

# Importar la aplicación Flask/FastAPI
from web import app as application
```

### Paso 6.2: Guardar y Recargar

1. Click en **"Save"**
2. Vuelve a la pestaña **"Web"**
3. Click en el botón verde **"Reload"**

---

## 7. Variables de Entorno

### Opción A: Usar Archivo .env

```bash
cd /home/tu-usuario/elec2026-web
cp .env.example .env
nano .env
```

Contenido de `.env`:

```env
# Base de datos MySQL (PythonAnywhere)
DB_HOST=tu-usuario.mysql.pythonanywhere-services.com
DB_USER=tu-usuario
DB_PASSWORD=tu-contraseña-segura
DB_NAME=tu-usuario$default
DB_PORT=3306

# Configuración de la aplicación
SECRET_KEY=tu-clave-secreta-muy-larga-y-segura
CORS_ORIGIN=https://tu-usuario.pythonanywhere.com
DEBUG=false
```

### Opción B: Configurar en PythonAnywhere

1. Ve a la pestaña **"Web"**
2. En **"WSGI configuration file"**, agrega al inicio:

```python
import os
os.environ['DB_HOST'] = 'tu-usuario.mysql.pythonanywhere-services.com'
os.environ['DB_USER'] = 'tu-usuario'
os.environ['DB_PASSWORD'] = 'tu-contraseña'
os.environ['DB_NAME'] = 'tu-usuario$default'
os.environ['SECRET_KEY'] = 'tu-clave-secreta'
os.environ['CORS_ORIGIN'] = 'https://tu-usuario.pythonanywhere.com'
```

---

## 8. Migrar Base de Datos

### Paso 8.1: Crear Tablas

```bash
cd /home/tu-usuario/elec2026-web
source venv/bin/activate
python backend/create_database.sql
```

O desde MySQL:

```bash
mysql -u tu-usuario -p tu-usuario\$default < /home/tu-usuario/elec2026-web/backend/create_database.sql
```

### Paso 8.2: Cargar Datos Iniciales

```sql
USE tu-usuario$default;
SOURCE /home/tu-usuario/elec2026-web/backend/create_database.sql;
```

### Paso 8.3: Verificar Datos

```sql
SELECT COUNT(*) FROM departamentos;
SELECT COUNT(*) FROM municipios;
SELECT COUNT(*) FROM provincias;
SELECT * FROM usuarios WHERE username = 'admin';
```

---

## 9. Verificar Despliegue

### Paso 9.1: Health Check

Abre en tu navegador:
```
https://tu-usuario.pythonanywhere.com/health
```

Deberías ver:
```json
{"status": "healthy", "database": "connected"}
```

### Paso 9.2: API Docs

```
https://tu-usuario.pythonanywhere.com/docs
```

### Paso 9.3: Endpoints Principales

| Endpoint | Descripción |
|----------|-------------|
| `/` | Página de inicio |
| `/health` | Health check |
| `/docs` | Documentación Swagger |
| `/api/auth/login` | Login de usuarios |
| `/api/departamentos` | Lista de departamentos |
| `/api/municipios` | Lista de municipios |

### Paso 9.4: Probar Login

1. Ve a `/docs`
2. Busca `POST /api/auth/login`
3. Click en **"Try it out"**
4. Ingresa credenciales:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
5. Click **"Execute"**

---

## 10. Solución de Problemas

### Error: "No module named 'web'"

**Causa:** El archivo WSGI no encuentra el módulo.

**Solución:**
```bash
cd /home/tu-usuario/elec2026-web
ls -la web.py
```

Verifica que el path en el WSGI sea correcto.

---

### Error: "Can't connect to MySQL server"

**Causa:** Credenciales incorrectas o host mal configurado.

**Solución:**
1. Verifica `.env`:
   ```env
   DB_HOST=tu-usuario.mysql.pythonanywhere-services.com
   DB_USER=tu-usuario
   DB_PASSWORD=correcta
   DB_NAME=tu-usuario$default
   ```

2. Prueba conexión manual:
   ```bash
   mysql -u tu-usuario -p -h tu-usuario.mysql.pythonanywhere-services.com
   ```

---

### Error: "CORS blocked"

**Causa:** El frontend está en otro dominio.

**Solución:**
```env
CORS_ORIGIN=https://tu-usuario.pythonanywhere.com
```

Para desarrollo local con frontend en PythonAnywhere:
```env
CORS_ORIGIN=https://tu-usuario.pythonanywhere.com,http://localhost:5173
```

---

### Error: "ImportError: No module named 'dotenv'"

**Solución:**
```bash
source venv/bin/activate
pip install python-dotenv
```

Luego recarga la web app.

---

### Error: "Permission denied"

**Causa:** Problemas de permisos en archivos.

**Solución:**
```bash
cd /home/tu-usuario/elec2026-web
chmod -R 755 .
chmod -R 777 backend/static  # Si usas uploads
```

---

### Error: "CPU time limit exceeded"

**Causa:** El plan gratuito tiene límite de CPU.

**Soluciones:**
1. Optimiza consultas a la base de datos
2. Reduce el número de workers en WSGI
3. Considera actualizar al plan pago

---

### Logs y Debugging

#### Ver Logs de la Web App

1. Ve a la pestaña **"Web"**
2. Click en **"Error log"**
3. Revisa los errores recientes

#### Ver Logs de la Consola

```bash
cd /home/tu-usuario/elec2026-web
cat web.log
```

#### Habilitar Debug Mode

En `.env`:
```env
DEBUG=true
```

⚠️ **Importante:** Desactiva `DEBUG` en producción.

---

## 📁 Estructura de Archivos en PythonAnywhere

```
/home/tu-usuario/
├── elec2026-web/
│   ├── .env                      # Variables de entorno
│   ├── .gitignore
│   ├── readme.md
│   ├── requirements.txt
│   ├── web.py                    # Entry point
│   ├── wsgi_pythonanywhere.py    # WSGI config (local)
│   ├── backend/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── database.py
│   │   ├── security.py
│   │   ├── mysql_config.py
│   │   ├── create_database.sql
│   │   └── routes/
│   └── frontend/
│       ├── dist/                 # Build del frontend
│       └── src/
└── venv/                         # Entorno virtual
```

---

## 🔐 Seguridad

### Checklist de Seguridad

- [ ] Cambiar contraseña de admin por defecto
- [ ] Generar `SECRET_KEY` única y segura
- [ ] Configurar `CORS_ORIGIN` correctamente
- [ ] Usar HTTPS (automático en PythonAnywhere)
- [ ] No exponer archivos `.env` en el repositorio
- [ ] Usar contraseñas fuertes para MySQL

### Generar SECRET_KEY Segura

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🔄 Actualizar el Código

### Usando Git

```bash
cd /home/tu-usuario/elec2026-web
source venv/bin/activate
git pull origin main
pip install -r requirements.txt
```

Luego recarga la web app desde la pestaña **"Web"**.

### Subida Manual

1. Sube los archivos nuevos desde la pestaña **"Files"**
2. Sobrescribe los existentes
3. Recarga la web app

---

## 📊 Monitoreo

### Dashboard de PythonAnywhere

1. **Web**: Estado de la aplicación
2. **Databases**: Uso de la base de datos
3. **Files**: Espacio de almacenamiento
4. **Tasks**: Tareas programadas (cron)

### Comandos Útiles

```bash
# Ver espacio usado
du -sh /home/tu-usuario/elec2026-web

# Ver logs en tiempo real
tail -f /var/log/tu-usuario.pythonanywhere.com.error.log

# Ver procesos
ps aux | grep python
```

---

## 🆘 Soporte

### Recursos Oficiales

- [Documentación PythonAnywhere](https://help.pythonanywhere.com/)
- [Foro de la Comunidad](https://www.pythonanywhere.com/forums/)
- [FAQ](https://www.pythonanywhere.com/help/)

### Problemas Comunes

| Problema | Solución |
|----------|----------|
| Web app no carga | Revisar error log |
| MySQL no conecta | Verificar credenciales |
| CORS error | Configurar CORS_ORIGIN |
| CPU limit | Optimizar código o upgrade |

---

## ✅ Checklist Final

### Antes de Ir a Producción

- [ ] Código actualizado en el repositorio
- [ ] `.env` configurado correctamente
- [ ] Base de datos creada y migrada
- [ ] Entorno virtual activo
- [ ] WSGI configurado correctamente
- [ ] Health check responde
- [ ] API docs accesible
- [ ] Login funciona
- [ ] Frontend conectado al backend
- [ ] `DEBUG=false` en producción
- [ ] `SECRET_KEY` única generada
- [ ] Contraseña de admin cambiada

---

## 🎉 ¡Despliegue Completado!

Tu aplicación está ahora disponible en:
```
https://tu-usuario.pythonanywhere.com
```

**Próximos pasos:**
1. Configurar dominio personalizado (plan pago)
2. Implementar backups automáticos
3. Configurar tareas programadas (cron)
4. Monitorear logs regularmente

---

**Última actualización:** Marzo 2026  
**Versión del sistema:** 1.0
