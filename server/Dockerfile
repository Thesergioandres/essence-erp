# Dockerfile para backend Node.js/Express - Essence API
# Multi-stage build para optimización

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Instalamos todas las dependencias para asegurar que nada falte
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 essence

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=essence:nodejs . .

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=5000

# Cambiar a usuario no-root
USER essence

# Eliminamos el HEALTHCHECK interno de Docker para evitar conflictos con Railway
# Railway tiene su propio sistema de salud que es más robusto para entornos dinámicos
# Si se desea mantener, debe usar process.env.PORT en lugar de 5000 fijo.

EXPOSE 5000

CMD ["node", "server.js"]
