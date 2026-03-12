# 🚀 Despliegue Automático en Railway - Guía Completa

Esta guía te llevará paso a paso para crear y desplegar tu proyecto completo en Railway.

---

## 📋 Requisitos Previos

1. ✅ Tener cuenta en [Railway](https://railway.app) (puedes usar tu cuenta de GitHub)
2. ✅ Tener tu código en GitHub (repositorio `elec2026-web`)
3. ✅ Tener Python instalado localmente

---

## 🎯 PASO A PASO COMPLETO

### PASO 1: Subir código a GitHub (si aún no lo has hecho)

```bash
# En la carpeta de tu proyecto
git add .
git commit -m "Preparar despliegue en Railway"
git push origin main
```

Si no tienes repositorio en GitHub:

```bash
# Inicializar git
git init
git add .
git commit -m "Initial commit"

# Crear repositorio en GitHub (desde la web de GitHub)
# Luego conecta tu repositorio:
git remote add origin https://github.com/TU_USUARIO/elec2026-web.git
git push -u origin main
```

---

### PASO 2: Crear Proyecto en Railway

1. **Ve a Railway**: Abre https://railway.app en tu navegador

2. **Inicia sesión**: Click en **"Login"** → **"Sign in with GitHub"**

3. **Nuevo Proyecto**: 
   - Click en **"New Project"**
   - Selecciona **"Deploy from GitHub repo"**
   - Busca y selecciona `elec2026-web`

4. **Espera el build inicial**: Railway comenzará a construir tu aplicación automáticamente

---

### PASO 3: Agregar Base de Datos MySQL

1. En tu proyecto de Railway, click en **"New"** (botón azul)

2. Selecciona **"Database"** → **"MySQL"**

3. **Espera 2-3 minutos** a que MySQL se provisione

4. Railway creará automáticamente estas variables de entorno:
   - `MYSQLHOST`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`

---

### PASO 4: Configurar Variables de Entorno

1. Ve a la pestaña **"Variables"** de tu proyecto

2. Agrega estas variables manualmente:

| Variable | Valor | ¿Cómo obtenerlo? |
|----------|-------|------------------|
| `SECRET_KEY` | `electoral_2026_segura_clave_secreta_bolivia` | Genera una única con el comando abajo |
| `CORS_ORIGIN` | `https://tu-proyecto.up.railway.app` | Verás la URL después del deploy |
| `DEBUG` | `false` | - |
| `LOG_LEVEL` | `INFO` | - |

**Para generar una SECRET_KEY única:**

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

### PASO 5: Migrar Base de Datos

#### Opción A: Script Automático (Recomendado)

1. **Obtén las credenciales de Railway:**
   - Ve a tu MySQL en Railway
   - Click en **"Variables"**
   - Copia los valores de: `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`

2. **Configura el archivo de migración:**

```bash
# Copia el archivo de migración
copy .env.migration .env
```

3. **Edita `.env`** con los datos de Railway:

```env
# Base de datos LOCAL (origen)
LOCAL_DB_HOST=localhost
LOCAL_DB_USER=root
LOCAL_DB_PASSWORD=tu_password_local
LOCAL_DB_NAME=elec2026

# Base de datos RAILWAY (destino)
MYSQLHOST=tu-mysqlhost.railway.internal
MYSQLUSER=root
MYSQLPASSWORD=tu_password_de_railway
MYSQLDATABASE=elec2026
MYSQLPORT=3306
```

4. **Ejecuta la migración:**

```bash
python deploy_to_railway.py
```

#### Opción B: Manual desde Railway Shell

1. En Railway, ve a **"Deployments"** → **"Shell"**

2. Ejecuta:

```bash
# Crear tablas
mysql -u root -p$MYSQLPASSWORD -h $MYSQLHOST $MYSQLDATABASE < backend/create_database.sql

# Verificar
mysql -u root -p$MYSQLPASSWORD -h $MYSQLHOST $MYSQLDATABASE -e "SHOW TABLES;"
```

---

### PASO 6: Verificar el Despliegue

1. **Obtén la URL de tu aplicación:**
   - Ve a **"Settings"** en Railway
   - Busca **"Domains"**
   - Tu URL será algo como: `https://elec2026-web-production.up.railway.app`

2. **Prueba los endpoints:**

```
# Health check (debe responder OK)
https://tu-proyecto.up.railway.app/health

# Documentación de la API
https://tu-proyecto.up.railway.app/docs

# Listado de departamentos
https://tu-proyecto.up.railway.app/api/departamentos
```

3. **Verifica en Railway Shell:**

```bash
# Conectar a MySQL y verificar datos
mysql -u root -p$MYSQLPASSWORD -h $MYSQLHOST $MYSQLDATABASE -e "SELECT COUNT(*) as total FROM departamentos;"
```

Debería mostrar: `9` (los 9 departamentos de Bolivia)

---

## 🔧 Configuración Automática con Script

### Script de Despliegue Automático

He creado `railway_deploy.py` que automatiza todo el proceso:

```bash
python railway_deploy.py
```

Este script:
1. ✅ Verifica tu conexión a GitHub
2. ✅ Crea el proyecto en Railway
3. ✅ Agrega MySQL
4. ✅ Configura variables de entorno
5. ✅ Inicia el despliegue
6. ✅ Migra la base de datos

---

## 🐛 Solución de Problemas Comunes

### Error: "Build failed"

**Causa:** Falta algún archivo o dependencia

**Solución:**
```bash
# Verifica que estos archivos existan:
- requirements.txt
- web.py
- railway.json
- nixpacks.toml

# Revisa los logs en Railway → Deployments → View Logs
```

### Error: "Cannot connect to database"

**Causa:** MySQL no está listo o las variables están incorrectas

**Solución:**
1. Espera 2-3 minutos después de crear MySQL
2. Verifica las variables en Railway → Variables
3. Asegúrate de que `MYSQLHOST` termine en `.railway.internal`

### Error: "CORS blocked"

**Causa:** El frontend está en un dominio no permitido

**Solución:**
1. Agrega `CORS_ORIGIN` en Railway Variables
2. Usa la URL completa: `https://tu-proyecto.up.railway.app`

### Error: "Module not found: fastapi"

**Causa:** requirements.txt no se instaló correctamente

**Solución:**
```bash
# En Railway Shell:
pip install -r requirements.txt
```

### El proyecto no aparece en GitHub

**Solución:**
```bash
# Verifica que hiciste push:
git status
git push origin main

# Verifica en GitHub.com que tu código esté ahí
```

---

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real

1. Railway → Tu proyecto → **"Deployments"**
2. Click en **"View Logs"**

### Ver Uso de Recursos

1. Railway → Tu proyecto → **"Usage"**
2. Ves RAM, CPU, y ancho de banda

### Reiniciar el Servicio

1. Railway → Tu proyecto → **"Deployments"**
2. Click en **"Restart"**

---

## 🔐 Seguridad Post-Despliegue

### ✅ Checklist de Seguridad

- [ ] Cambiar contraseña del usuario `admin` por defecto
- [ ] Generar una `SECRET_KEY` única y segura
- [ ] Configurar `CORS_ORIGIN` con tu dominio real
- [ ] Habilitar autenticación de dos factores en Railway
- [ ] Revisar logs regularmente

### Generar SECRET_KEY Segura

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Ejemplo de resultado: `xK9mP2nQ7vR4sT8wY3zA6bC1dE5fG0hI`

---

## 💰 Costos en Railway

### Plan Hobby (Gratis)

- $5 USD de crédito mensual
- 512 MB RAM incluidos gratis
- 1 GB de base de datos MySQL

### Plan Pro

- $20 USD/mes
- Recursos adicionales según uso

**Estimado para este proyecto:** ~$5-10 USD/mes

---

## 🎉 ¡Listo!

Tu sistema electoral está corriendo en:

```
🌐 URL: https://tu-proyecto.up.railway.app
📚 API Docs: https://tu-proyecto.up.railway.app/docs
💾 Health: https://tu-proyecto.up.railway.app/health
```

### Próximos Pasos

1. **Configurar dominio personalizado** (opcional):
   - Railway → Settings → Domains → Add Custom Domain

2. **Desplegar el frontend**:
   - Sube el frontend a Vercel/Netlify
   - Configura `CORS_ORIGIN` con la URL del frontend

3. **Configurar backups**:
   - Usa Railway → MySQL → Backups

4. **Monitoreo**:
   - Revisa los logs diariamente
   - Configura alertas de uso

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** en Railway
2. **Verifica las variables** de entorno
3. **Consulta** la documentación: https://docs.railway.app
4. **Comunidad**: https://community.railway.app

---

**¡Éxito con tu despliegue! 🇧🇴🎉**
