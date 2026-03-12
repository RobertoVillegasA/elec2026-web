# ⚡ Inicio Rápido - Despliegue en Railway

## 🚀 Opción 1: Automático (Recomendado)

Ejecuta este comando y sigue las instrucciones:

```bash
python railway_deploy.py
```

Este script te guiará paso a paso.

---

## 🚀 Opción 2: Manual (Más control)

### 1. Ir a Railway
Abre: https://railway.app/new

### 2. Conectar GitHub
- Click en **"Login"** → **"Sign in with GitHub"**
- Autoriza Railway a acceder a tu repositorio

### 3. Crear Proyecto
- Click en **"New Project"**
- **"Deploy from GitHub repo"**
- Selecciona `elec2026-web`

### 4. Agregar MySQL
- Click en **"New"** → **"Database"** → **"MySQL"**
- Espera 2-3 minutos

### 5. Configurar Variables
Ve a **Variables** y agrega:

```
SECRET_KEY=electoral_2026_clave_segura_cambiar_en_produccion
CORS_ORIGIN=https://tu-proyecto.up.railway.app
DEBUG=false
LOG_LEVEL=INFO
```

### 6. Migrar Datos
```bash
# Copiar archivo
copy .env.migration .env

# Editar .env con datos de Railway (de MySQL → Variables)

# Ejecutar migración
python deploy_to_railway.py
```

---

## ✅ Verificar

```
https://tu-proyecto.up.railway.app/health
https://tu-proyecto.up.railway.app/docs
```

---

## 📚 Guías Completas

| Archivo | Descripción |
|---------|-------------|
| `DEPLOY_RAILWAY.md` | Guía completa paso a paso |
| `RAILWAY_CHECKLIST.md` | Checklist para no olvidar nada |
| `railway_deploy.py` | Script automático |

---

## 🆘 Problemas Comunes

| Problema | Solución |
|----------|----------|
| Build falla | Revisa logs en Railway → Deployments → View Logs |
| Error MySQL | Espera 2-3 min después de crear MySQL |
| CORS error | Configura `CORS_ORIGIN` en Variables |

---

**¿Listo? ¡Empieza por `python railway_deploy.py`!** 🎉
