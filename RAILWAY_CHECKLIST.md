# ✅ Checklist para Desplegar en Railway

## 📋 Antes de Empezar

- [ ] Tener cuenta en GitHub
- [ ] Tener cuenta en Railway (https://railway.app)
- [ ] Código subido a GitHub
- [ ] Python instalado localmente

---

## 🚀 Pasos para el Despliegue

### Paso 1: Subir a GitHub
```bash
git add .
git commit -m "Preparar despliegue"
git push origin main
```
- [ ] Código subido a GitHub

### Paso 2: Crear Proyecto en Railway
- [ ] Ir a https://railway.app
- [ ] Login con GitHub
- [ ] Click en "New Project"
- [ ] "Deploy from GitHub repo"
- [ ] Seleccionar `elec2026-web`

### Paso 3: Agregar MySQL
- [ ] En Railway, click "New"
- [ ] Seleccionar "Database" → "MySQL"
- [ ] Esperar 2-3 minutos

### Paso 4: Configurar Variables
- [ ] Ir a Variables en Railway
- [ ] Agregar `SECRET_KEY` (usar comando Python abajo)
- [ ] Agregar `CORS_ORIGIN` (URL del proyecto)
- [ ] Agregar `DEBUG` = `false`
- [ ] Agregar `LOG_LEVEL` = `INFO`

Generar SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Paso 5: Migrar Base de Datos
- [ ] Copiar `.env.migration` a `.env`
- [ ] Obtener credenciales de MySQL en Railway
- [ ] Editar `.env` con datos de Railway
- [ ] Ejecutar: `python deploy_to_railway.py`

### Paso 6: Verificar
- [ ] Obtener URL en Railway → Settings → Domains
- [ ] Probar: `https://tu-proyecto.up.railway.app/health`
- [ ] Probar: `https://tu-proyecto.up.railway.app/docs`
- [ ] Verificar datos en MySQL desde Railway Shell

---

## 🔧 Comandos Útiles

### Generar SECRET_KEY
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Script de Despliegue Automático
```bash
python railway_deploy.py
```

### Migrar Base de Datos
```bash
copy .env.migration .env
# Editar .env con datos de Railway
python deploy_to_railway.py
```

### Ver Logs (Railway CLI)
```bash
railway login
railway logs
```

---

## 📊 Variables de Entorno en Railway

### Automáticas (MySQL)
| Variable | Descripción |
|----------|-------------|
| `MYSQLHOST` | Host de MySQL |
| `MYSQLUSER` | Usuario de MySQL |
| `MYSQLPASSWORD` | Contraseña de MySQL |
| `MYSQLDATABASE` | Nombre de la base de datos |
| `MYSQLPORT` | Puerto de MySQL |

### Manuales
| Variable | Valor | Descripción |
|----------|-------|-------------|
| `SECRET_KEY` | (generar) | Clave para JWT |
| `CORS_ORIGIN` | URL del proyecto | Dominio permitido |
| `DEBUG` | `false` | Modo debug |
| `LOG_LEVEL` | `INFO` | Nivel de logs |

---

## 🐛 Solución de Problemas

### Build falla
- [ ] Verificar que `requirements.txt` existe
- [ ] Verificar que `web.py` está en la raíz
- [ ] Revisar logs en Railway → Deployments → View Logs

### Error de base de datos
- [ ] Esperar 2-3 minutos después de crear MySQL
- [ ] Verificar variables en Railway → Variables
- [ ] Probar conexión desde Railway Shell

### Error de CORS
- [ ] Configurar `CORS_ORIGIN` con la URL correcta
- [ ] Incluir `https://` en la URL

---

## 🎉 Verificación Final

- [ ] Health check responde: `/health`
- [ ] API docs carga: `/docs`
- [ ] Login funciona
- [ ] Datos de departamentos cargan (9 departamentos)
- [ ] Frontend puede conectarse al backend

---

## 📞 Recursos

- Documentación Railway: https://docs.railway.app
- Soporte: https://community.railway.app
- Guía completa: `DEPLOY_RAILWAY.md`

---

**¡Marca todos los checkboxes y tu despliegue estará completo! ✅**
