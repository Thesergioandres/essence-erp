# Dockerfile para backend Node.js/Express - Essence API
# Multi-stage build para optimización

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
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

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

EXPOSE 5000

CMD ["node", "server.js"]
