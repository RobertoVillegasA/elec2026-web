# 🚀 Guía de Despliegue en Railway

Esta guía te ayudará a subir tu sistema electoral a Railway de forma automática.

---

## 📋 Requisitos Previos

1. Tener cuenta en [Railway](https://railway.app)
2. Tener tu código en GitHub (ya está en `elec2026-web`)
3. Tener una base de datos MySQL local con datos

---

## 🎯 Proceso Automático (Recomendado)

### Paso 1: Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Click **"New Project"**
4. **"Deploy from GitHub repo"** → Selecciona `elec2026-web`

### Paso 2: Agregar MySQL

1. En tu proyecto Railway, click **"New"**
2. Selecciona **"Database"** → **"MySQL"**
3. Espera ~2 minutos a que se cree

### Paso 3: Configurar variables en Railway

1. Ve a tu proyecto → **Variables**
2. Agrega estas variables:

| Variable | Valor |
|----------|-------|
| `SECRET_KEY` | `cualquier_clave_secreta_larga_123456` |
| `CORS_ORIGIN` | (déjalo vacío por ahora) |

Railway automáticamente agrega: `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`

### Paso 4: Migrar tu base de datos local

**Opción A - Desde Windows (Automático):**

1. Abre PowerShell o CMD en la carpeta del proyecto
2. Ejecuta:
```bash
migrate_to_railway.bat
```

3. Sigue las instrucciones:
   - Copia `.env.migration` a `.env`
   - Edita `.env` con los datos de Railway
   - El script hará todo automáticamente

**Opción B - Manual (Más control):**

1. Copia `.env.migration` a `.env`
2. Edita `.env` con:
   - Tus datos locales
   - Los datos de Railway (los ves en Railway → MySQL → Variables)

3. Ejecuta:
```bash
python deploy_to_railway.py
```

### Paso 5: Verificar

1. En Railway, ve a **Deployments**
2. Click **"Open Deployments"** → **"Shell"**
3. Ejecuta:
```bash
mysql -u root -p$MYSQLPASSWORD -h $MYSQLHOST $MYSQLDATABASE -e "SELECT COUNT(*) FROM departamentos;"
```

Deberías ver: `9` (los 9 departamentos de Bolivia)

---

## 🔧 Proceso Manual (Alternativo)

Si prefieres hacer todo manualmente:

### 1. Crear la estructura

En Railway Shell:
```bash
mysql -u root -p$MYSQLPASSWORD -h $MYSQLHOST $MYSQLDATABASE < backend/create_database.sql
```

### 2. Migrar datos

Desde tu máquina:
```bash
python backend/migrate_to_railway.py
```

---

## ⚙️ Variables de Entorno en Railway

Después de migrar, verifica en Railway → **Variables**:

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `MYSQLHOST` | ✅ Auto | Host de MySQL (Railway la crea) |
| `MYSQLUSER` | ✅ Auto | Usuario (Railway la crea) |
| `MYSQLPASSWORD` | ✅ Auto | Password (Railway la crea) |
| `MYSQLDATABASE` | ✅ Auto | Nombre de la BD (Railway la crea) |
| `MYSQLPORT` | ✅ Auto | Puerto (Railway la crea) |
| `SECRET_KEY` | ❌ Manual | Clave para JWT |
| `CORS_ORIGIN` | ❌ Manual | Dominio del frontend |

---

## 🎉 ¡Listo!

Tu sistema debería estar corriendo en:
```
https://tu-proyecto.up.railway.app
```

El endpoint de health check:
```
https://tu-proyecto.up.railway.app/health
```

La documentación de la API:
```
https://tu-proyecto.up.railway.app/docs
```

---

## 🐛 Solución de Problemas

### Error: "No se pudo conectar a Railway"

- Verifica que MySQL esté creado en Railway
- Espera 2-3 minutos después de crear MySQL
- Revisa las variables en Railway → MySQL → Variables

### Error: "Foreign key constraint fails"

Ejecuta en Railway Shell:
```bash
mysql -u root -p$MYSQLPASSWORD -h $MYSQLHOST $MYSQLDATABASE -e "SET FOREIGN_KEY_CHECKS = 0;"
```

Luego vuelve a correr la migración.

### Error: "Access denied"

- Verifica que `MYSQLPASSWORD` sea correcto
- Asegúrate de usar `MYSQLHOST` y no `host`

### El deploy falla

1. Ve a Railway → Deployments → Ver logs
2. Revisa errores comunes:
   - Falta `SECRET_KEY`
   - Error de conexión a MySQL
   - Puerto incorrecto

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Railway
2. Verifica las variables de entorno
3. Asegúrate de que MySQL esté activo

---

## 🔐 Seguridad

**IMPORTANTE:** Después del despliegue:

1. Cambia la contraseña del usuario `admin` por defecto
2. Genera una `SECRET_KEY` única y segura
3. Configura `CORS_ORIGIN` con tu dominio real

---

## 📊 Monitoreo

En Railway puedes ver:

- **Usage**: Uso de recursos
- **Deployments**: Historial de despliegues
- **Logs**: Logs en tiempo real
- **Settings**: Configuración del proyecto

---

**¡Éxito con tu despliegue! 🎉**
