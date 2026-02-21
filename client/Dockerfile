# Build stage
FROM node:18-alpine as build
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Construir aplicación
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
# Copiar configuración customizada de Nginx para SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el build del frontend a la carpeta servida por Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto por el que Nginx atiende
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
