# 📋 Checklist de Deploy - Essence API

## Pre-Deploy

### 1. Build Frontend

```bash
cd client
npm run build
```

Verificar que se genera `client/dist/` correctamente.

### 2. Tests Backend

```bash
cd server
npm test
```

Todos los tests deben pasar.

### 3. Índices de Base de Datos

```bash
cd server
npm run db:indexes
```

Crear índices optimizados en MongoDB.

### 4. Variables de Entorno

- [ ] Copiar `.env.example` a `.env`
- [ ] Configurar `JWT_SECRET` (mínimo 32 caracteres)
- [ ] Configurar `MONGODB_URI` (producción)
- [ ] Configurar credenciales Cloudinary
- [ ] Configurar `FRONTEND_URL`

---

## Deploy con Docker

### 1. Iniciar servicios

```bash
# Desarrollo (con mongo-express)
docker-compose --profile dev up -d

# Producción
docker-compose up -d
```

### 2. Verificar servicios

```bash
docker-compose ps
docker-compose logs -f backend
```

### 3. Verificar endpoints

```bash
# Health check
curl http://localhost:5000/

# Swagger docs
curl http://localhost:5000/api-docs.json
```

---

## Deploy Manual (sin Docker)

### 1. Backend

```bash
cd server
npm install --production
NODE_ENV=production node server.js
```

### 2. Frontend (Nginx)

```bash
# Copiar dist a nginx
cp -r client/dist/* /var/www/html/

# Configurar nginx
cp deploy/nginx.conf /etc/nginx/conf.d/default.conf
nginx -t && systemctl reload nginx
```

---

## Verificaciones Post-Deploy

### Endpoints Críticos

- [ ] `GET /` → Responde 200
- [ ] `GET /api-docs` → Swagger carga
- [ ] `POST /api/auth/login` → Valida credenciales
- [ ] `GET /api/products` → Lista productos

### Seguridad

- [ ] Headers de seguridad presentes (X-Frame-Options, CSP, etc.)
- [ ] Rate limiting activo
- [ ] CORS configurado correctamente

### Logs

```bash
# Docker
docker-compose logs -f backend

# Systemd
journalctl -u essence-backend -f
```

---

## Rollback

### Docker

```bash
docker-compose down
docker-compose up -d --build
```

### Manual

```bash
# Restaurar versión anterior
git checkout <commit-anterior>
npm install --production
pm2 restart essence-backend
```

---

## Contacto

- **Docs API:** http://localhost:5000/api-docs
- **Health:** http://localhost:5000/
