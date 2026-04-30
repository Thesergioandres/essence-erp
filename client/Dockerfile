# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

ARG RAILWAY_GIT_COMMIT_SHA
ARG VITE_APP_VERSION

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Construir aplicación
COPY . .
RUN export APP_VERSION="${VITE_APP_VERSION:-${RAILWAY_GIT_COMMIT_SHA:-unknown}}" && \
	VITE_APP_VERSION="$APP_VERSION" npm run build

# Production stage
FROM nginx:alpine
# Puerto por defecto local (Railway inyecta PORT en runtime)
ENV PORT=8080

# Copiar configuración customizada de Nginx para SPA (React Router)
# usando template para resolver ${PORT} en runtime.
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copiar el build del frontend a la carpeta servida por Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto por el que Nginx atiende
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
