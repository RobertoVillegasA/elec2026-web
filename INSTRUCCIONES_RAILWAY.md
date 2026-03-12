# 🚀 DESPLIEGUE EN RAILWAY - INSTRUCCIONES FINALES

## ✅ Estado Actual

- [x] Código actualizado en GitHub: https://github.com/RobertoVillegasA/elec2026-web
- [x] Archivos de configuración listos (railway.json, nixpacks.toml, requirements.txt)
- [x] Documentación completa creada
- [ ] **Falta: Crear proyecto en Railway**

---

## 📋 PASOS PARA CREAR EL PROYECTO EN RAILWAY

### Paso 1: Ir a Railway

**URL:** https://railway.app/new

### Paso 2: Iniciar Sesión

1. Click en **"Login"**
2. Selecciona **"Sign in with GitHub"**
3. Autoriza Railway

### Paso 3: Crear Proyecto desde GitHub

1. Click en **"New Project"**
2. Click en **"Deploy from GitHub repo"**
3. Busca y selecciona: **`elec2026-web`**
4. Railway comenzará el build automáticamente

### Paso 4: Agregar MySQL

1. En tu proyecto Railway, click en **"New"** (botón azul)
2. Selecciona **"Database"** → **"MySQL"**
3. Espera 2-3 minutos a que se cree

### Paso 5: Configurar Variables de Entorno

1. Ve a la pestaña **"Variables"** de tu proyecto
2. Agrega estas variables manualmente:

| Variable | Valor |
|----------|-------|
| `SECRET_KEY` | (generar con Python - ver abajo) |
| `CORS_ORIGIN` | `https://elec2026-web-production.up.railway.app` |
| `DEBUG` | `false` |
| `LOG_LEVEL` | `INFO` |

**Para generar SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Paso 6: Migrar Base de Datos

1. **Obtén las credenciales de MySQL:**
   - Ve a tu MySQL en Railway
   - Click en **"Variables"**
   - Copia: `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`

2. **Configura archivo `.env`:**
   ```bash
   # En tu proyecto local
   copy .env.migration .env
   ```

3. **Edita `.env`** con los datos de Railway:
   ```env
   # Datos de Railway (MySQL → Variables)
   MYSQLHOST=tu-host.railway.internal
   MYSQLUSER=root
   MYSQLPASSWORD=tu-password
   MYSQLDATABASE=elec2026
   MYSQLPORT=3306
   ```

4. **Ejecuta la migración:**
   ```bash
   python deploy_to_railway.py
   ```

### Paso 7: Verificar

1. **Obtén tu URL:**
   - Railway → Settings → Domains
   - URL: `https://elec2026-web-production.up.railway.app`

2. **Prueba los endpoints:**
   ```
   https://elec2026-web-production.up.railway.app/health
   https://elec2026-web-production.up.railway.app/docs
   ```

---

## 🎯 RESUMEN RÁPIDO

### En la web de Railway (https://railway.app):

1. **New Project** → **Deploy from GitHub repo** → `elec2026-web`
2. **New** → **Database** → **MySQL**
3. **Variables** → Agregar:
   - `SECRET_KEY` = (generar con Python)
   - `CORS_ORIGIN` = `https://elec2026-web-production.up.railway.app`
   - `DEBUG` = `false`
   - `LOG_LEVEL` = `INFO`

### En tu computadora:

```bash
# 1. Configurar migración
copy .env.migration .env
# Editar .env con datos de Railway

# 2. Ejecutar migración
python deploy_to_railway.py
```

---

## 🔗 Enlaces Importantes

| Recurso | URL |
|---------|-----|
| Railway Dashboard | https://railway.app |
| Tu Repositorio | https://github.com/RobertoVillegasA/elec2026-web |
| Documentación Railway | https://docs.railway.app |

---

## 📊 Variables Automáticas de MySQL

Railway crea automáticamente estas variables cuando agregas MySQL:

- `MYSQLHOST`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLDATABASE`
- `MYSQLPORT`

**No necesitas crearlas manualmente.**

---

## 🐛 Solución de Problemas

### El build falla

1. Ve a Railway → Deployments → View Logs
2. Revisa errores comunes:
   - Falta `requirements.txt` ✅ Está creado
   - Falta `web.py` ✅ Está creado
   - Error de dependencias ✅ `requirements.txt` actualizado

### MySQL no conecta

1. Espera 2-3 minutos después de crear MySQL
2. Verifica las variables en Railway → MySQL → Variables
3. Revisa que `MYSQLHOST` termine en `.railway.internal`

### CORS error

Agrega en Variables:
```
CORS_ORIGIN=https://elec2026-web-production.up.railway.app
```

---

## ✅ Checklist Final

- [ ] Proyecto creado en Railway
- [ ] MySQL agregado al proyecto
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] Health check responde
- [ ] API docs carga correctamente

---

## 🎉 ¡Listo!

Una vez completados los pasos, tu sistema estará disponible en:

```
https://elec2026-web-production.up.railway.app
```

**Próximos pasos:**
1. Configurar dominio personalizado (opcional)
2. Desplegar frontend (Vercel/Netlify)
3. Configurar backups de MySQL

---

**¿Necesitas ayuda? Revisa:**
- `QUICKSTART_RAILWAY.md` - Guía rápida
- `DEPLOY_RAILWAY.md` - Guía completa
- `RAILWAY_CHECKLIST.md` - Checklist detallado
