# 🌟 ESSENCE - Sistema de Gestión de Distribuidores...

Sistema completo de gestión para distribuidores de vaporizadores con control de inventario, ventas y analíticas en tiempo real.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-61dafb.svg)
![Node](https://img.shields.io/badge/Node-22.11.0-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Roles y Permisos](#-roles-y-permisos)
- [Casos de Uso](#-casos-de-uso)
- [Sistema de Ganancias](#-sistema-de-ganancias)
- [API Endpoints](#-api-endpoints)
- [Despliegue](#-despliegue)
- [Variables de Entorno](#-variables-de-entorno)

---

## ✨ Características

### Para Administradores

- 📦 **Gestión de Productos**: CRUD completo con imágenes en Cloudinary
- 👥 **Gestión de Distribuidores**: Control de usuarios y permisos
- 📊 **Stock Multi-nivel**: Bodega central + inventarios por distribuidor
- ✅ **Aprobación de Ventas**: Revisión con comprobantes de pago
- 📈 **Dashboard Analítico**: KPIs, gráficos, rankings y reportes
- ⚠️ **Alertas de Stock**: Notificaciones automáticas de stock bajo
- 💰 **Cálculo Automático**: Ganancias por distribuidor y admin
- 📱 **Diseño Responsive**: Optimizado para móvil y desktop

### Para Distribuidores

- 🛒 **Catálogo de Productos**: Ver precios y disponibilidad
- 📝 **Registro de Ventas**: Con foto de comprobante de pago
- 📦 **Mi Inventario**: Control de stock personal en tiempo real
- 💵 **Mis Ganancias**: Historial y comisiones acumuladas
- 🏆 **Sistema de Ranking**: Comisiones variables según desempeño

---

## 🛠 Stack Tecnológico

### Frontend

- **React 19.1.0** + **TypeScript**
- **Vite 6.4.1** - Build tool
- **TailwindCSS 4.1** - Estilos
- **Recharts** - Gráficos y visualizaciones
- **Axios** - Cliente HTTP
- **React Router 7.9** - Navegación
- **date-fns 4.1.0** - Manejo de fechas
- **jsPDF + xlsx** - Exportación de reportes

### Backend

- **Node.js 22.11.0** + **Express**
- **MongoDB + Mongoose** - Base de datos
- **JWT** - Autenticación
- **Multer** - Carga de archivos
- **Cloudinary** - Almacenamiento de imágenes
- **Redis** - Cache (opcional)
- **date-fns 4.1.0** - Zona horaria Colombia

### DevOps

- **Clouding (VM)** - Frontend y Backend desplegados en una VM usando `docker compose`. Ver [deploy/README.md](deploy/README.md) para instrucciones.
- **MongoDB Atlas** - Base de datos en la nube
- **Cloudinary** - CDN de imágenes

---

## 🏗 Arquitectura

```
essence-landing-page/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── api/              # Servicios y configuración Axios
│   │   ├── components/       # Componentes reutilizables
│   │   ├── pages/            # Vistas principales
│   │   ├── routes/           # Configuración de rutas
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utilidades
│   └── public/               # Assets estáticos
│
└── server/                    # Backend Node.js
    ├── config/               # Configuraciones (DB, Cloudinary, Multer)
    ├── controllers/          # Lógica de negocio
    ├── middleware/           # Auth, cache, error handling
    ├── models/               # Schemas de MongoDB
    ├── routes/               # Rutas de API
    ├── services/             # Servicios (audit logs)
    └── tests/                # Tests unitarios
```

---

## 🚀 Instalación

### Prerrequisitos

- Node.js 22.x o superior
- MongoDB (local o Atlas)
- Cuenta de Cloudinary
- Git

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/Thesergioandres/essence-landing-page.git
cd essence-landing-page
```

### Paso 2: Instalar dependencias

#### Backend

```bash
cd server
npm install
```

#### Frontend

```bash
cd client
npm install
```

### Paso 3: Configurar variables de entorno

#### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/essence

# JWT
JWT_SECRET=tu_clave_secreta_super_segura

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Redis (opcional)
REDIS_URL=redis://localhost:6379
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

### Paso 4: Iniciar servidores

#### Backend

```bash
cd server
npm run dev  # Desarrollo con nodemon
# o
npm start    # Producción
```

#### Frontend

```bash
cd client
npm run dev  # http://localhost:5173
```

### Paso 5: Seed de datos (opcional)

```bash
cd server
node seedAdmin.js          # Crea usuario admin
node seedData.js           # Crea categorías y productos
node seedDistributor.js    # Crea distribuidores
```

---

## 👥 Roles y Permisos

### 🔑 Administrador

**Credenciales por defecto:**

- Email: `laura@example.com`
- Password: `admin123`

**Permisos:**

- ✅ CRUD de productos y categorías
- ✅ Gestión de distribuidores
- ✅ Asignar/retirar stock
- ✅ Aprobar/rechazar ventas
- ✅ Ver analíticas completas
- ✅ Auditoría de acciones

### 🚚 Distribuidor

**Permisos:**

- ✅ Ver catálogo de productos
- ✅ Registrar ventas propias
- ✅ Ver su inventario
- ✅ Ver sus ganancias
- ❌ No puede auto-asignarse stock
- ❌ No ve inventario de otros distribuidores

---

## 📚 Casos de Uso

### 1. 📦 **Gestión de Productos (Admin)**

#### Crear Producto

```
1. Admin → "Productos" → "Nuevo producto"
2. Completar formulario:
   - Nombre: "MTRX Pro"
   - Descripción: "Vaporizador premium..."
   - Precio compra: $15,000
   - Precio distribuidor: $22,000
   - Precio cliente: $40,000
   - Stock: 100 unidades
   - Categoría: Vaporizadores
   - Imagen: (sube a Cloudinary)
3. Sistema calcula precio sugerido automáticamente (30%)
4. Stock se registra en "bodega" (warehouseStock)
```

**Resultado:**

- ✅ Producto creado
- ✅ 100 unidades en bodega
- ✅ Imagen en Cloudinary
- ✅ Disponible en catálogo

---

### 2. 📤 **Asignar Stock a Distribuidor (Admin)**

```
1. Admin → "Gestión de Stock"
2. Seleccionar "Asignar Stock"
3. Elegir distribuidor: "María José Rojas"
4. Ver inventario actual de María (si tiene)
5. Agregar productos:
   - MTRX Pro: 20 unidades
   - Flamingo: 15 unidades
6. Sistema valida stock disponible en bodega
7. Confirmar asignación
```

**Resultado:**

```
Bodega:
  MTRX Pro: 100 → 80 unidades
  Flamingo: 50 → 35 unidades

María:
  MTRX Pro: 0 → 20 unidades
  Flamingo: 0 → 15 unidades
```

---

### 3. 💰 **Registrar Venta (Distribuidor)**

```
1. Distribuidor → "Registrar Venta"
2. Seleccionar producto: MTRX Pro
3. Cantidad: 3 unidades
4. Precio: $40,000 (autocompletado, puede modificar)
5. Subir comprobante de transferencia (foto)
6. Registrar venta
```

**Resultado:**

```
Stock María:
  MTRX Pro: 20 → 17 unidades (temporal)

Estado: Pendiente (esperando aprobación admin)

Si admin aprueba:
  - Stock confirmado: 17 unidades
  - Ganancias calculadas:
    * María (20%): $24,000
    * Admin: $51,000
    * Total: $75,000

Si admin rechaza:
  - Stock regresa: 17 → 20 unidades
  - Venta cancelada
```

---

### 4. ✅ **Aprobar Venta (Admin)**

```
1. Admin → "Ventas" → Tab "Pendientes"
2. Ve venta de María: 3 MTRX a $40,000
3. Clic en "Ver comprobante"
4. Revisa imagen de transferencia
5. Opciones:
   - ✅ Aprobar → Confirma venta y ganancias
   - ❌ Rechazar → Devuelve stock a María
```

**Cálculo automático al aprobar:**

```javascript
// Venta: 3 MTRX Pro a $40,000 c/u
Precio Venta: $40,000
Precio Compra Admin: $15,000
Comisión María: 20%

Ganancia María = (40,000 × 20%) × 3 = $24,000
Ganancia Admin = ((40,000 - 8,000 - 15,000) × 3) = $51,000
Total = $75,000
```

---

### 5. 📊 **Dashboard Analítico (Admin)**

```
Admin → "Analítica Avanzada"

📈 KPIs en tiempo real (zona horaria Colombia UTC-5):
  - Ventas Hoy: $120,000 | Ganancia: $75,000
  - Ventas Semana: $850,000 | Ganancia: $420,000
  - Ventas Mes: $3,200,000 | Ganancia: $1,850,000

📊 Gráficos:
  - Timeline de ventas (últimos 7 días)
  - Top 10 productos más vendidos
  - Distribución por categoría (pie chart)
  - Ranking de distribuidores
  - Análisis comparativo (mes actual vs anterior)

⚠️ Alertas:
  - MTRX Pro: 5 unidades en bodega (alerta: 10)
  - María: Flamingo con 3 unidades (alerta: 5)
```

---

### 6. 🔄 **Flujo Completo de Ejemplo**

#### **DÍA 1 - Setup Inicial**

```
1. Admin crea producto "MTRX Pro"
   → Compra: $15,000 | Distribuidor: $22,000 | Cliente: $40,000
   → Stock: 100 unidades en bodega

2. Admin asigna a María: 20 MTRX
   → Bodega: 100 → 80
   → María: 0 → 20
```

#### **DÍA 2 - Primera Venta**

```
3. María vende 3 MTRX a $40,000 c/u
   → Registra con comprobante
   → Stock temporal: 20 → 17
   → Estado: Pendiente

4. Admin aprueba venta
   → Ganancias: María $24,000 | Admin $51,000
   → Stock confirmado: 17
   → Estado: Confirmado
```

#### **DÍA 3 - Analíticas**

```
5. Admin ve en "Analítica Avanzada":
   → Ventas día: $120,000
   → MTRX en "Top Productos"
   → María sube en ranking
```

#### **DÍA 10 - Restock**

```
6. Alerta: María solo tiene 5 MTRX
   → Admin asigna 15 más
   → María: 5 → 20
   → Bodega: 65 → 50
```

---

## 💰 Sistema de Ganancias

### Fórmula Base

#### **Venta con Distribuidor**

```javascript
// Ejemplo: MTRX Pro
Precio Venta = $40,000
Precio Compra Admin = $15,000
Comisión Distribuidor = 20%
Cantidad = 1

// Cálculo
Ganancia Distribuidor = (40,000 × 20%) × 1 = $8,000
Ganancia Admin = (40,000 - 8,000 - 15,000) × 1 = $17,000
Total Ganancia = $25,000
```

#### **Venta Directa (Admin sin distribuidor)**

```javascript
Ganancia Admin = (40,000 - 15,000) × 1 = $25,000
Ganancia Distribuidor = $0
```

### Sistema de Comisiones por Ranking

Los distribuidores pueden tener porcentajes variables según su desempeño:

| Posición     | Comisión | Icono                   |
| ------------ | -------- | ----------------------- |
| 🥇 1er lugar | 25%      | Top vendedor del mes    |
| 🥈 2do lugar | 23%      | Segundo mejor           |
| 🥉 3er lugar | 21%      | Tercer mejor            |
| 👤 Normal    | 20%      | Resto de distribuidores |

**Ejemplo con 25%:**

```javascript
Precio Venta = $40,000
Ganancia Distribuidor = (40,000 × 25%) = $10,000
Ganancia Admin = (40,000 - 10,000 - 15,000) = $15,000
```

### Pre-save Hook (Automático)

El modelo `Sale` calcula automáticamente las ganancias antes de guardar:

```javascript
// server/models/Sale.js
saleSchema.pre("save", function (next) {
  if (!this.distributor) {
    // Venta admin
    this.adminProfit = (this.salePrice - this.purchasePrice) * this.quantity;
    this.distributorProfit = 0;
    this.totalProfit = this.adminProfit;
  } else {
    // Venta distribuidor
    const profitPercentage = this.distributorProfitPercentage || 20;

    this.distributorProfit =
      ((this.salePrice * profitPercentage) / 100) * this.quantity;
    this.adminProfit =
      (this.salePrice -
        (this.salePrice * profitPercentage) / 100 -
        this.purchasePrice) *
      this.quantity;
    this.totalProfit = this.distributorProfit + this.adminProfit;
  }
  next();
});
```

---

## 🌐 API Endpoints

### **Autenticación**

```
POST   /api/auth/login          # Login
POST   /api/auth/register       # Registro (solo admin puede crear)
GET    /api/auth/profile        # Perfil del usuario
```

### **Productos**

```
GET    /api/products            # Listar (paginado)
GET    /api/products/:id        # Ver uno
POST   /api/products            # Crear (admin)
PUT    /api/products/:id        # Actualizar (admin)
DELETE /api/products/:id        # Eliminar (admin)
```

### **Categorías**

```
GET    /api/categories          # Listar todas
POST   /api/categories          # Crear (admin)
PUT    /api/categories/:id      # Actualizar (admin)
DELETE /api/categories/:id      # Eliminar (admin)
```

### **Stock**

```
POST   /api/stock/assign        # Asignar a distribuidor (admin)
POST   /api/stock/withdraw      # Retirar de distribuidor (admin)
GET    /api/stock/distributor/:id # Ver stock distribuidor
GET    /api/stock/alerts        # Alertas de stock bajo
```

### **Ventas**

```
GET    /api/sales               # Listar (filtros: estado, fecha, distribuidor)
POST   /api/sales               # Registrar venta (distribuidor)
PUT    /api/sales/:id/confirm   # Aprobar venta (admin)
PUT    /api/sales/:id/reject    # Rechazar venta (admin)
DELETE /api/sales/:id           # Eliminar (admin)
```

### **Distribuidores**

```
GET    /api/distributors        # Listar (admin)
GET    /api/distributors/:id    # Ver uno (admin)
PUT    /api/distributors/:id    # Actualizar (admin)
```

### **Analíticas**

```
GET    /api/analytics/profit-by-product      # Ganancia por producto
GET    /api/analytics/profit-by-distributor  # Ganancia por distribuidor
GET    /api/analytics/financial-summary      # Resumen financiero
GET    /api/analytics/top-products           # Top productos
GET    /api/analytics/sales-timeline         # Timeline de ventas
GET    /api/analytics/category-distribution  # Distribución por categoría
GET    /api/analytics/distributor-rankings   # Ranking distribuidores
GET    /api/analytics/financial-kpis         # KPIs (día/semana/mes)
GET    /api/analytics/comparative-analysis   # Comparativo mensual
```

---

## 🚀 Despliegue

### **Frontend (Vercel)**

1. **Conectar repositorio:**

   - Ve a [vercel.com](https://vercel.com)
   - Import git repository
   - Selecciona el repositorio

2. **Configurar:**

   ```
   Framework Preset: Vite
   Root Directory: client
   Build Command: npm run build
   Output Directory: dist
   ```

3. **Variables de entorno:**

   ```
   VITE_API_URL=https://tu-backend.railway.app/api
   ```

4. **Deploy:**
   - Auto-deploy en cada push a `main`

### **Backend (Railway)**

1. **Crear proyecto:**

   - Ve a [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Selecciona el repositorio

2. **Configurar:**

   ```
   Root Directory: server
   Start Command: npm start
   ```

3. **Variables de entorno:**

   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=tu_mongodb_uri
   JWT_SECRET=tu_jwt_secret
   FRONTEND_URL=https://tu-app.vercel.app
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
   REDIS_URL=redis://... (opcional)
   ```

4. **Deploy:**
   - Auto-deploy en cada push a `main`

---

## 🔐 Variables de Entorno

### Backend

| Variable                | Descripción           | Ejemplo                      |
| ----------------------- | --------------------- | ---------------------------- |
| `NODE_ENV`              | Entorno               | `production`                 |
| `PORT`                  | Puerto del servidor   | `5000`                       |
| `MONGODB_URI`           | URI de MongoDB        | `mongodb+srv://...`          |
| `JWT_SECRET`            | Clave secreta JWT     | `mi_clave_super_segura`      |
| `FRONTEND_URL`          | URL del frontend      | `https://essence.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `dbcwjghqb`                  |
| `CLOUDINARY_API_KEY`    | Cloudinary API key    | `292249115585871`            |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `N1agNu...`                  |
| `REDIS_URL`             | Redis URL (opcional)  | `redis://...`                |

### Frontend

| Variable       | Descripción     | Ejemplo                       |
| -------------- | --------------- | ----------------------------- |
| `VITE_API_URL` | URL del backend | `https://api.railway.app/api` |

---

## ⚙️ Características Técnicas

### **Zona Horaria Colombia (UTC-5)**

Todo el sistema usa la zona horaria de Colombia:

- Día empieza: `00:00:00 Colombia = 05:00:00 UTC`
- Filtros "Hoy" buscan desde `5 AM UTC`
- KPIs calculan con offset `-5 horas`

```javascript
// Ejemplo de ajuste de zona horaria
const colombiaOffset = -5 * 60; // -5 horas en minutos
const colombiaTime = new Date(now.getTime() + colombiaOffset * 60000);
```

### **Sistema de Stock Multi-nivel**

```
totalStock = warehouseStock + Σ(distributorStock)

- warehouseStock: Stock en bodega central
- distributorStock: Stock asignado a cada distribuidor
```

### **Estados de Venta**

```typescript
enum PaymentStatus {
  PENDIENTE = "pendiente", // Esperando aprobación
  CONFIRMADO = "confirmado", // Aprobada por admin
}
```

### **Caché con Redis**

Opcional para optimizar consultas frecuentes:

```javascript
// Endpoints cacheados:
- GET /api/products
- GET /api/categories
- GET /api/analytics/*
```

---

## 📊 Modelos de Datos

### **User**

```typescript
{
  _id: ObjectId,
  name: string,
  email: string,
  password: string (hashed),
  role: 'admin' | 'distributor',
  active: boolean,
  createdAt: Date
}
```

### **Product**

```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  purchasePrice: number,
  suggestedPrice: number,
  distributorPrice: number,
  clientPrice: number,
  category: ObjectId,
  image: { url: string, publicId: string },
  totalStock: number,
  warehouseStock: number,
  lowStockAlert: number,
  featured: boolean,
  ingredients: string[],
  benefits: string[]
}
```

### **Sale**

```typescript
{
  _id: ObjectId,
  distributor: ObjectId | null,
  product: ObjectId,
  quantity: number,
  salePrice: number,
  purchasePrice: number,
  distributorPrice: number,
  distributorProfit: number,
  adminProfit: number,
  totalProfit: number,
  distributorProfitPercentage: number,
  paymentStatus: 'pendiente' | 'confirmado',
  paymentProof: string (base64),
  saleDate: Date
}
```

### **DistributorStock**

```typescript
{
  _id: ObjectId,
  distributor: ObjectId,
  product: ObjectId,
  quantity: number,
  lastUpdated: Date
}
```

---

## 🧪 Testing

### Ejecutar tests

```bash
cd server
node tests/calculations.test.js
```

### Scripts de verificación

```bash
# Verificar ventas de hoy
node checkTodaySales.js

# Verificar ventas del mes
node checkMonthSales.js

# Verificar filtros de fecha
node testFilters.js

# Buscar ventas con cálculos incorrectos
node findIncorrectSales.js

# Recalcular ventas (modo preview)
node recalculateSales.js
```

---

## 🐛 Troubleshooting

### Error 500 al crear producto

**Causa:** Faltan variables de Cloudinary  
**Solución:** Configurar `CLOUDINARY_*` en Railway

### Las ventas no aparecen en "Hoy"

**Causa:** Zona horaria incorrecta  
**Solución:** Verificar que el backend use UTC-5 para Colombia

### Stock negativo en bodega

**Causa:** Validación insuficiente  
**Solución:** El sistema previene esto, verificar logs

### Imágenes no se cargan

**Causa:** URL de Cloudinary incorrecta o imagen eliminada  
**Solución:** Re-subir imagen del producto

---

## 📝 Licencia

Este proyecto es privado y confidencial.

---

## 👨‍💻 Autor

**Sergio Andrés**

- GitHub: [@Thesergioandres](https://github.com/Thesergioandres)
- Email: info@essenceshop.com

---

## 🙏 Agradecimientos

- **React Team** - Framework
- **Vercel** - Hosting frontend
- **Railway** - Hosting backend
- **MongoDB** - Base de datos
- **Cloudinary** - CDN de imágenes

---

## 📅 Historial de Versiones

### v2.0.0 (Diciembre 2025)

- ✅ Sistema completo de gestión de distribuidores
- ✅ Dashboard analítico avanzado
- ✅ Sistema de ganancias automatizado
- ✅ Multi-nivel de stock
- ✅ Zona horaria Colombia
- ✅ Diseño responsive optimizado para móvil
- ✅ Despliegue en producción

---

**🌟 Sistema en producción:**

- Frontend: https://essence-landing-page.vercel.app
- Backend: https://essence-landing-page-production.up.railway.app
