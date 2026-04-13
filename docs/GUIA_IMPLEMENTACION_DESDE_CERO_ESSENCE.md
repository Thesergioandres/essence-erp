# GUIA MAESTRA PARA CONSTRUIR ESSENCE ERP DESDE CERO

Version: Abril 2026
Base: Inventario real del codigo front + back + docs del repositorio actual
Objetivo: Permitir reconstruir el sistema completo sin perder reglas de negocio, seguridad multi-tenant y UX operativa.

---

## 1) Vision del producto

Essence ERP es un SaaS ERP B2B2C multi-tenant para operar distribucion y venta de productos con:

- Inventario multinivel (bodega, sedes, empleados)
- POS para admin y staff
- Creditos (fiados) y recaudos
- Garantias y defectuosos
- Transferencias y despachos
- Gamificacion y comisiones
- Reportes avanzados
- Modo GOD para operacion global

Actores principales:

- GOD: superusuario global
- Admin/Super admin: dueño y operador del negocio
- Employee: vendedor operativo en campo
- Viewer: solo consulta segun permisos
- Cliente final: consume catalogo publico/storefront

---

## 2) Stack tecnologico completo

## Frontend

- React 19
- TypeScript 5
- Vite 6
- Tailwind CSS 4
- React Router 7
- Axios
- Framer Motion + GSAP
- Recharts + Chart.js
- Vite PWA + Workbox
- Vitest + Testing Library
- Playwright (E2E)

## Backend

- Node.js 18+
- Express 4
- MongoDB + Mongoose 8
- JWT (access + refresh)
- Helmet + xss-clean + express-mongo-sanitize
- CORS + rate limiting
- Multer + Cloudinary
- Swagger (OpenAPI)
- BullMQ + Redis (opcional)
- Jest + Supertest

## Infra y despliegue

- Railway (frontend + backend + mongodb)
- Docker Compose local/legacy
- Scripts de backup/sync y herramientas de migracion

---

## 3) Monorepo y estructura base

```text
react-tailwindcss/
├─ client/                         # Frontend React + TS
├─ server/                         # Backend Express + Mongoose
├─ docs/                           # Documentacion funcional/tecnica
├─ deploy/                         # Activos de despliegue legacy
├─ scripts/                        # Utilidades raiz
├─ docker-compose.yml              # Stack local opcional
├─ README.md
└─ package.json                    # scripts globales
```

Scripts raiz clave:

- npm run dev
- npm run build
- npm run install-all
- npm run validate:backend

Scripts backend clave:

- npm run dev:v2
- npm test
- npm run test:coverage
- npm run db:indexes
- npm run migrate:business-slugs
- npm run migrate:employee-role

Scripts frontend clave:

- npm run dev
- npm run build
- npm run test
- npm run test:e2e

---

## 4) Arquitectura objetivo para reconstruccion

## Backend (Hexagonal)

Flujo obligatorio:

- Routes -> Controllers (thin) -> Use Cases (application) -> Repositories (infrastructure) -> Models (db)

Capas:

- server/src/domain/services
- server/src/application/use-cases
- server/src/infrastructure/http
- server/src/infrastructure/database

## Frontend (Clean / Feature based)

- UI por features: client/src/features/\*
- Estado global en providers: AuthContext + BusinessContext
- Capa core limpia para casos de uso (dispatch y sales): client/src/core
- Servicios por modulo en client/src/features/\*/services

---

## 5) Seguridad y reglas duras (debes implementar desde fase 1)

1. Multi-tenant anti-IDOR:

- Toda consulta sensible debe resolver negocio por x-business-id + membership.
- Nunca mezclar datos entre negocios.

2. Roles y estado de cuenta:

- Bloquear usuarios no active (excepto flujos permitidos pending).
- Empleado depende del estado del owner/admin del negocio.

3. Modo GOD:

- Bypass controlado en validaciones de negocio y filtros de tenant cuando aplique.

4. Data scrubbing financiero:

- Ocultar o null/0 campos sensibles cuando no hay permiso view_costs.
- Campos protegidos: purchasePrice, averageCost, supplierId, profit, totalRevenue, etc.

5. Atomicidad:

- Ventas, pagos de credito, transferencias y movimientos criticos en transaccion Mongo.

6. Precios confiables:

- Jamas calcular venta con price enviado por frontend.
- El backend toma precio real del producto en BD.

7. Comision fija:

- Si isCommissionFixed=true, customCommissionRate tiene prioridad total.

---

## 6) Backend: inventario total de modulos HTTP (V2)

Prefijo global API: /api/v2

### 6.1 Modulos y prefijos

- /auth
- /demo
- /branches
- /business
- /business-assistant
- /categories
- /credits
- /customers
- /employee
- /employees
- /expenses
- /gamification
- /global-settings
- /inventory
- /products
- /providers
- /public
- /sales
- /stock
- /analytics
- /users
- /advanced-analytics
- /audit
- /branch-transfers
- /defective-products
- /dispatches
- /issues
- /notifications
- /promotions
- /special-sales
- /delivery-methods
- /payment-methods
- /profit-history
- /push
- /segments
- /god
- /upload

### 6.2 Endpoints por modulo

#### /auth

- POST /login
- POST /register
- POST /refresh
- POST /logout
- PATCH /select-plan
- GET /profile
- POST /impersonate/:employeeId
- POST /impersonate/revert

#### /demo

- POST /setup
- DELETE /teardown

#### /business

- POST /
- GET /my-memberships
- GET /export-full-data
- GET /
- GET /:id
- GET /:id/slug-availability
- PUT /:id
- PUT /:id/features
- POST /:id/members
- GET /:id/members
- GET /:id/members/find-user/:email
- PUT /:id/members/:membershipId
- DELETE /:id/members/:membershipId

#### /business-assistant

- GET /analysis/latest
- GET /strategic-analysis
- GET /recommendations
- POST /recommendations/generate
- GET /recommendations/job/:jobId
- POST /ask
- GET /config
- PUT /config

#### /categories

- GET /
- GET /:id
- POST /
- PUT /:id
- DELETE /:id

#### /products

- GET /
- GET /public
- GET /my-catalog
- GET /:id
- GET /:id/history
- POST /
- PUT /:id
- PATCH /:id/prices
- PATCH /:id/stock
- DELETE /:id

#### /inventory

- POST /entry
- PUT /entry/:id
- DELETE /entry/:id
- GET /entries

#### /stock

- POST /assign
- POST /withdraw
- POST /transfer
- POST /transfer-to-branch
- GET /employee/:employeeId
- GET /branch/:branchId?
- GET /my-allowed-branches
- GET /alerts
- GET /global
- GET /transfers
- POST /reconcile
- POST /sync

#### /sales

- GET /
- GET /employee/:employeeId?
- POST /
- POST /standard
- POST /promotion
- PUT /:saleId/confirm-payment
- DELETE /group/:saleGroupId
- DELETE /:saleId

#### /credits

- POST /
- GET /
- GET /metrics
- GET /:id
- POST /:id/payments

#### /employees y /employee (gestion de personal)

- GET /
- GET /:id
- POST /
- PUT /:id
- DELETE /:id
- PUT /:id/toggle-active
- PUT /:id/assign-products
- GET /:id/products
- GET /me/products

#### /expenses

- GET /
- POST /
- PUT /:id
- DELETE /:id
- POST /inventory-withdrawal
- POST /cleanup-orphans

#### /gamification

- GET /commission/:employeeId
- GET /config
- GET /ranking
- GET /stats/:employeeId
- GET /winners
- PUT /config
- PUT /winners/:id/pay
- POST /check-period
- POST /recalculate-points

#### /dispatches

- POST /requests
- GET /requests
- GET /requests/:id
- PATCH /requests/:id/dispatch
- PATCH /requests/:id/receive
- GET /pending-count
- GET /hot-sectors

#### /defective-products

- POST /
- POST /admin
- POST /branch
- POST /employee
- POST /warranty
- GET /
- GET /stats
- GET /employee/me
- GET /employee/:employeeId
- GET /warranty/sale/:saleId
- GET /:id
- PUT /:id/confirm
- PUT /:id/reject
- PUT /:id/resolve-warranty
- PUT /:id/approve-warranty
- PUT /:id/reject-warranty
- DELETE /:id

#### /advanced-analytics

- GET /financial-kpis
- GET /sales-funnel
- GET /sales-timeline
- GET /comparative-analysis
- GET /comparative
- GET /sales-by-category
- GET /product-rotation
- GET /employee-rankings
- GET /low-stock-visual
- GET /sales-summary
- GET /top-products
- GET /employee-performance
- GET /inventory-status
- GET /credits-summary
- GET /expenses-summary

#### /analytics

- GET /dashboard
- GET /estimated-profit
- GET /employee/estimated-profit

#### /audit

- GET /logs
- GET /logs/:id
- GET /summary/daily
- GET /stats

#### /notifications

- GET /
- POST /
- PUT /:id/read
- PUT /read-all
- DELETE /:id

#### /push

- GET /vapid-key
- POST /subscribe
- POST /unsubscribe
- GET /subscriptions
- PUT /subscriptions/:id/preferences
- DELETE /subscriptions/:id

#### /customers + /segments + /points

- Customers:
  - POST /
  - GET /
  - GET /:id
  - PUT /:id
  - DELETE /:id
- Segments:
  - GET /
  - POST /
  - GET /:id
  - PUT /:id
  - DELETE /:id
- Customer points (prefijo /api/v2):
  - GET /customers/:customerId/points
  - GET /customers/:customerId/points/history
  - POST /customers/:customerId/points/adjust
  - POST /customers/:customerId/points/validate-redemption
  - POST /points/expire
  - GET /points/config

#### /promotions

- POST /
- GET /
- GET /active
- GET /:id
- PUT /:id
- PUT /:id/toggle-status
- DELETE /:id
- POST /:id/evaluate

#### /special-sales

- POST /
- GET /
- GET /:id
- PUT /:id
- DELETE /:id
- GET /stats/overview
- GET /stats/distribution
- GET /stats/top-products

#### /branches + /branch-transfers

- Branches:
  - GET /
  - GET /:id
  - GET /:branchId/stock
  - POST /
  - PUT /:id
  - DELETE /:id
- Branch transfers:
  - POST /
  - GET /
  - GET /:id

#### /delivery-methods

- GET /
- GET /:id
- POST /
- POST /initialize
- PUT /reorder
- PUT /:id
- DELETE /:id

#### /payment-methods

- GET /
- GET /:id
- POST /
- POST /initialize
- PUT /reorder
- PUT /:id
- DELETE /:id

#### /providers

- POST /
- GET /
- GET /:id
- PUT /:id
- DELETE /:id

#### /issues

- POST /
- GET /
- GET /:id
- PUT /:id/status

#### /global-settings

- GET /public
- GET /business-limits
- GET /businesses
- PATCH /businesses/:businessId
- PUT /

#### /users

- GET /
- GET /email/:email
- PUT /:id/activate
- PUT /:id/suspend
- PUT /:id/extend
- PUT /:id/pause
- PUT /:id/resume

#### /profit-history

- GET /user/:userId
- GET /balance/:userId
- GET /summary
- GET /admin/overview
- POST /

#### /god

- GET /metrics
- GET /subscriptions
- GET /users
- GET /users/email/:email
- POST /users/:id/activate
- POST /users/:id/suspend
- DELETE /users/:id
- POST /users/:id/extend
- POST /users/:id/pause
- POST /users/:id/resume
- POST /cron/subscription-checks
- POST /cron/cleanup-subscriptions
- POST /sales/validate-integrity

#### /upload

- POST /
- DELETE /:publicId

#### /public

- GET /storefront/:slug

#### /employee (public catalog)

- GET /:id/catalog

---

## 7) Backend: inventario de controladores y casos de uso

Controladores HTTP principales:

- AuthController / DemoController
- BusinessController / BusinessAssistantController / DataExportController
- CategoryController / ProductController / ProviderController
- RegisterSaleController / ConfirmSaleController / ListSalesController / DeleteSaleController
- StockController / InventoryController / DispatchController
- EmployeeController / UserPermissionController
- CreditController / ExpenseController / ProfitHistoryController
- CustomerController / CustomerPointsController / SegmentController
- PaymentMethodController / DeliveryMethodController
- PromotionController / SpecialSaleController
- DefectiveProductController
- AdvancedAnalyticsController / AnalyticsController / AuditController
- NotificationController / PushSubscriptionController
- BranchController / BranchTransferController
- GlobalSettingsController / GodController / UploadController / IssueController / GetStorefrontController

Casos de uso de aplicacion (inventario real):

- LoginUseCase
- RegisterUserUseCase
- CreateProductUseCase
- UpdateStockUseCase
- GetDashboardStatsUseCase
- SetupDemoTenantUseCase
- TeardownDemoTenantUseCase
- UserPermissionUseCases
- Sales:
  - RegisterSaleUseCase
  - RegisterStandardSaleUseCase
  - RegisterPromotionSaleUseCase
  - ConfirmSalePaymentUseCase
  - ListSalesUseCase
- Dispatch:
  - CreateDispatchRequestUseCase
  - MarkDispatchAsDispatchedUseCase
  - ConfirmDispatchReceptionUseCase
  - GetPendingDispatchCountUseCase
  - GetDispatchHotSectorsUseCase
  - GetDispatchByIdUseCase
  - ListDispatchRequestsUseCase
- Public storefront:
  - GetPublicStorefrontUseCase
- Builders/factories de composicion:
  - buildListSalesUseCase
  - buildDispatchUseCases
- Gateway use cases (uno por agregado): ProductPersistenceUseCase, SalePersistenceUseCase, etc.

Servicios de dominio:

- FinanceService
- CommissionPolicyService
- InventoryService
- AnalyticsService
- AuthService
- GamificationRulesService
- OwnerAccessPolicyService

---

## 8) Modelo de datos completo (colecciones)

### 8.1 Nucleo de identidad y tenancy

- User
- Business
- Membership
- RefreshToken
- GlobalSettings

### 8.2 Catalogo e inventario

- Category
- Product
- Branch
- Stock
- EmployeeStock
- BranchStock
- InventoryEntry
- StockTransfer
- BranchTransfer
- InventoryMovement
- DispatchRequest

### 8.3 Ventas, finanzas y CRM

- Sale
- SpecialSale
- ProfitHistory
- Expense
- Credit
- CreditPayment
- Customer
- Segment
- PointsHistory
- PaymentMethod
- DeliveryMethod
- Promotion
- Provider

### 8.4 Calidad, incidentes y soporte

- DefectiveProduct
- IssueReport
- Notification
- PushSubscription
- AuditLog
- AnalysisLog

### 8.5 Gamificacion

- GamificationConfig
- EmployeeStats
- PeriodWinner

### 8.6 Asistente de negocio

- BusinessAssistantConfig

---

## 9) Modelos clave y campos obligatorios

## User

- name, email, password, role, status
- selectedPlan, selectedPlanAt
- isCommissionFixed, customCommissionRate
- modularPermissions

## Business

- name, slug, landingTemplate
- config.features
- createdBy
- plan, customLimits
- status

## Membership

- user, business, role, status
- allowedBranches
- permissions

## Product

- business, name, category
- purchasePrice, averageCost, clientPrice, employeePrice
- totalStock, warehouseStock, totalInventoryValue
- featured, isDeleted

## Sale

- business, product, quantity
- salePrice, purchasePrice, averageCostAtSale
- employeeProfit/adminProfit/netProfit/totalProfit
- paymentStatus, paymentMethod, deliveryMethod
- sourceLocation
- saleGroupId, saleId

## Credit + CreditPayment

- credit: customer, business, originalAmount, remainingAmount, status, dueDate
- payment: credit, amount, paymentMethod, registeredBy, balanceBefore/After

## DispatchRequest

- business, employee, requestedBy
- items[{product, quantity}], totalUnits
- status (PENDIENTE, DESPACHADO, RECIBIDO, CANCELADO)

## DefectiveProduct

- business, product, quantity, reason, status
- hasWarranty, warrantyStatus, lossAmount
- ticketId, originalSaleGroupId, replacementProduct, priceDifference

## Notification

- business, user/targetRole
- type, title, message, priority
- read, readAt, expiresAt

---

## 10) Indices y performance (minimos)

Debes replicar por lo menos:

- User: role+status, status+subscriptionExpiresAt
- Membership: unique(user,business), business+role+status
- Product: business+createdAt, business+sku, text(name,description)
- Sale: business+saleDate, business+paymentStatus+saleDate, unique(business,saleId), business+saleGroupId
- EmployeeStock: unique(business,employee,product)
- BranchStock: unique(business,branch,product)
- Credit: business+status, customer+status, dueDate+status
- AuditLog: negocio+createdAt + TTL
- Notification: negocio+usuario+read+createdAt

---

## 11) Frontend: arquitectura completa

### 11.1 Providers globales

- AuthProvider (AuthContext)
  - bootstrap de sesion
  - refresh token
  - sync de profile
  - eventos auth-changed/session-refresh
- BusinessProvider (BusinessContext)
  - memberships
  - negocio activo
  - auto-select
  - feature flags
  - anti loops de hidratacion

### 11.2 Capa API

- client/src/api/axios.ts
  - baseURL dinamico con VITE_API_URL
  - inject Authorization
  - inject x-business-id
  - bloqueo request sin negocio cuando aplica
  - refresh token queue para evitar carreras

### 11.3 Capa core (clean)

- Domain:
  - dispatch.types + DispatchRepository
  - sales.types + SalesReadRepository + SalesWriteRepository
- Infrastructure:
  - HttpDispatchRepository
  - HttpSalesReadRepository
  - HttpSalesWriteRepository
- Use cases:
  - DispatchUseCases
  - SalesReadUseCases
  - SalesWriteUseCases

### 11.4 Features (inventario real)

- advertising
- analytics
- auth
- branches
- business
- common
- credits
- customers
- demo
- employees
- inventory
- notifications
- public-storefront
- sales
- settings
- warranties

### 11.5 Servicios frontend (por modulo)

- analytics.service
- auth.service
- branch.service
- dispatch.service
- business.service
- common.service
- credit.service
- customer.service
- demo.service
- employee.service
- inventory.service
- notification.service
- pushNotification.service
- publicStorefront.service
- sales.service
- settings.service

---

## 12) Frontend: mapa de paginas y rutas

## Publicas

- /
- /manual
- /demo
- /productos
- /producto/:id
- /categoria/:slug
- /tienda/:slug
- /staff-catalog/:employeeId
- /employee-catalog/:employeeId

## Auth

- /login
- /login/admin
- /login/god
- /login/staff
- /login/employee
- /register
- /account-hold
- /onboarding

## GOD

- /god

## Admin shell (/admin)

- /admin/analytics
- /admin/products
- /admin/products/:id
- /admin/categories
- /admin/add-product
- /admin/products/:id/edit
- /admin/price-list
- /admin/employees
- /admin/employees/add
- /admin/employees/:id
- /admin/employees/:id/edit
- /admin/stock-management
- /admin/global-inventory
- /admin/branches
- /admin/inventory-entries
- /admin/sales
- /admin/payment-methods
- /admin/delivery-methods
- /admin/special-sales
- /admin/expenses
- /admin/profit-history
- /admin/business-assistant
- /admin/business-settings
- /admin/create-business
- /admin/user-settings
- /admin/team
- /admin/audit-logs
- /admin/gamification-config
- /admin/rankings
- /admin/defective-products
- /admin/warranties
- /admin/warrantiess (alias legacy que redirige a /admin/warranties)
- /admin/register-sale
- /admin/register-promotion
- /admin/transfer-history
- /admin/dispatch
- /admin/credits
- /admin/credits/:id
- /admin/notifications
- /admin/providers
- /admin/promotions
- /admin/advertising
- /admin/customers
- /admin/segments
- /admin/test-optimization

## Staff shell (/staff)

- /staff/dashboard
- /staff/products
- /staff/catalog
- /staff/share-catalog
- /staff/advertising
- /staff/transfer-stock
- /staff/request-dispatch
- /staff/my-shipments
- /staff/register-sale
- /staff/register-promotion
- /staff/operativo/stock-management
- /staff/operativo/global-inventory
- /staff/operativo/branches
- /staff/operativo/transfer-history
- /staff/operativo/sales
- /staff/operativo/analytics
- /staff/operativo/expenses
- /staff/operativo/team
- /staff/operativo/promotions
- /staff/operativo/providers
- /staff/operativo/customers
- /staff/sales
- /staff/credits
- /staff/stats
- /staff/level
- /staff/defective-reports
- /staff/warranties

---

## 13) Casos de uso criticos (flujos completos)

## CU-01 Registro y onboarding tenant

1. Usuario se registra (status pending).
2. Selecciona plan.
3. Crea negocio.
4. Backend crea Membership admin activa.
5. Frontend refresca memberships y selecciona negocio.
6. Accede a dashboard admin.

## CU-02 Login y recuperacion de sesion

1. Login con email/password.
2. Guardar access + refresh + user.
3. Sync profile y memberships.
4. Inyectar x-business-id en requests.
5. Si 401, refresh en cola y replay request.

## CU-03 Venta admin (bodega o sede)

1. UI envia items/cantidades.
2. Use case resuelve precio real desde Product.
3. Valida stock origen (warehouse o branch).
4. Crea Sale con paymentStatus segun metodo.
5. Descuenta stock origen + totalStock global.
6. Calcula adminProfit/netProfit.
7. Escribe ProfitHistory (si confirmado).

## CU-04 Venta empleado

1. Valida membership y allowedBranches.
2. Si source=employee descuenta EmployeeStock.
3. Aplica CommissionPolicyService.
4. Si isCommissionFixed=true usa customCommissionRate.
5. Persiste venta y ganancias.

## CU-05 Venta a credito

1. paymentMethodCode=credit.
2. Sale queda pendiente.
3. Crea Credit con remainingAmount.
4. Registra pagos parciales con CreditPayment.
5. Cambia estado a partial/paid.

## CU-06 Garantia / defectuoso

1. Reporte defectuoso con evidencia.
2. Clasificar hasWarranty.
3. Si replacement, movimiento de stock de origen.
4. Si perdida, registrar ajuste negativo en ProfitHistory.
5. Resolver ticket y trazabilidad.

## CU-07 Transferencias y despachos

1. Crear DispatchRequest.
2. Marcar DESPACHADO con guia.
3. Confirmar RECEPCION por actor autorizado.
4. Registrar InventoryMovement con origen/destino.
5. Actualizar inTransitQuantity/quantity segun flujo.

## CU-08 Governance GOD

1. Gestion de usuarios/suscripciones.
2. Activar/suspender/extender.
3. Revisar metricas globales.
4. Ejecutar cron de saneamiento.

---

## 14) Variables de entorno necesarias

## Backend (inventario real)

- NODE_ENV
- PORT
- JWT_SECRET
- JWT_REFRESH_SECRET
- JWT_EXPIRE
- JWT_REFRESH_EXPIRE
- MONGODB_URI
- MONGODB_URI_TEST
- MONGO_URI
- MONGO_URL
- MONGO_URI_PROD
- MONGODB_URI_PROD
- MONGO_URI_PROD_READ
- MONGODB_URI_PROD_READ
- MONGO_URI_DEV
- MONGO_URI_DEV_LOCAL
- MONGODB_URI_DEV_LOCAL
- MONGO_PUBLIC_URL
- RAILWAY_MONGO_PUBLIC_URL
- MONGO_AUTO_INDEX
- MONGO_DB_NAME
- MONGODB_DB_NAME
- DEFAULT_BUSINESS_NAME
- ALLOWED_ORIGINS
- FRONTEND_URL
- REDIS_URL
- ENABLE_REDIS_CACHE
- ENABLE_CLOUDINARY
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- VAPID_PUBLIC_KEY
- BA_ENABLE_WORKER
- DEBT_WORKER_ENABLED
- BACKUP_WORKER_DISABLED
- PRODUCTION_BACKUP_WORKER_DISABLED
- DEMO_SANDBOX_ENABLED
- DEMO_TTL_HOURS
- DEMO_TTL_SWEEP_MS
- RATE_LIMIT_AUTH_WINDOW_MS
- RATE_LIMIT_AUTH_MAX
- RATE_LIMIT_API_WINDOW_MS
- RATE_LIMIT_API_MAX
- RATE_LIMIT_UPLOAD_WINDOW_MS
- RATE_LIMIT_UPLOAD_MAX
- RATE_LIMIT_REGISTER_WINDOW_MS
- RATE_LIMIT_REGISTER_MAX
- RATE_LIMIT_SENSITIVE_WINDOW_MS
- RATE_LIMIT_SENSITIVE_MAX
- GEMINI_API_KEY
- GOD_NAME
- GOD_EMAIL
- GOD_PASS
- GOD_PASSWORD
- GOD_BUSINESS_ID
- DEV_SKIP_SYNC
- DEV_FORCE_SYNC
- DEV_FAST_START_MINUTES
- DEV_SKIP_VALIDATION
- DEV_ALLOW_DANGEROUS_PROD_CREDENTIALS
- SYNC_DRY_RUN
- SYNC_FORCE_FULL
- SYNC_BATCH_SIZE
- SYNC_PARALLEL
- SYNC_LOG_LEVEL
- SYNC_LOG_FILE
- SYNC_SKIP_VALIDATION
- SYNC_ALLOW_DANGEROUS_PROD_CREDENTIALS
- VERIFY_BUSINESS_ID
- VERIFY_EMPLOYEE_ID
- TARGET_BUSINESS_ID

## Frontend (inventario real)

- VITE_API_URL
- VITE_APP_VERSION
- VITE_NAME
- VITE_PUBLIC_BUSINESS_ID
- VITE_VAPID_PUBLIC_KEY
- MODE
- DEV
- PROD
- SSR

---

## 15) Testing actual y estrategia de reconstruccion

## Backend tests presentes

- **tests**/application/use-cases/createProduct.use-case.test.js
- **tests**/application/use-cases/registerSale.use-case.test.js
- **tests**/application/use-cases/updateStock.use-case.test.js
- **tests**/infrastructure/controllers/auth.controller.test.js
- **tests**/infrastructure/controllers/registerSale.controller.test.js
- **tests**/middleware/auth.middleware.test.js
- **tests**/middleware/requirePermission.test.js
- **tests**/models/Product.test.js
- **tests**/models/Sale.test.js
- **tests**/models/User.test.js
- **tests**/utils/business-logic.test.js

## Frontend unit tests presentes

- client/src/**tests**/axios.test.ts
- client/src/**tests**/useSession.test.tsx

## Frontend e2e (Playwright)

- client/e2e/01-authentication.spec.ts
- client/e2e/02-employees.spec.ts
- client/e2e/03-inventory.spec.ts
- client/e2e/04-sales.spec.ts
- client/e2e/05-credits.spec.ts
- client/e2e/06-dashboard.spec.ts
- client/e2e/07-golden-flow.spec.ts
- client/e2e/08-branches-bug.spec.ts
- client/e2e/09-master-regression.spec.ts

## Estrategia recomendada al rehacer desde cero

1. Unit tests en domain services (finanzas/comisiones/permisos).
2. Integration tests en use cases con mongodb-memory-server.
3. Contract tests API (success/error wrappers).
4. E2E por sprint (auth, ventas, inventario, creditos, tenant, permisos).

---

## 16) Roadmap de implementacion desde cero (orden recomendado)

## Fase 0 - Base tecnica

- Crear monorepo client/server/docs
- Configurar lint, format, test runner
- Configurar Vite + React + Tailwind
- Configurar Express + Mongoose + swagger

## Fase 1 - Identidad y tenancy

- User/Business/Membership
- Login/register/refresh/logout
- middleware protect + businessContext
- seleccionar negocio en frontend

## Fase 2 - Catalogo e inventario

- Category/Product
- Branch + BranchStock + EmployeeStock
- InventoryEntry + costo promedio ponderado

## Fase 3 - Ventas y finanzas

- RegisterSaleUseCase con transaccion
- ConfirmSalePayment
- ProfitHistory
- analytics dashboard base

## Fase 4 - Creditos y cobranza

- Credit + CreditPayment
- estados pending/partial/paid/overdue
- exclusion de creditos pendientes en KPIs de caja

## Fase 5 - Garantias y defectuosos

- DefectiveProduct
- warranty ticket
- resoluciones y ajustes financieros

## Fase 6 - Logistica y despachos

- DispatchRequest
- InventoryMovement
- recepcion y trazabilidad extremo a extremo

## Fase 7 - Configuracion negocio y growth

- PaymentMethod
- DeliveryMethod
- Promotion
- SpecialSale
- Providers
- Segment/Points

## Fase 8 - Observabilidad y soporte

- AuditLog + Notification + PushSubscription
- IssueReport
- exportaciones

## Fase 9 - GOD y operaciones SaaS

- GlobalSettings
- gestion de suscripciones
- tools de mantenimiento

## Fase 10 - Pulido UX y PWA

- feature gates en UI
- control de permisos por modulo
- offline/pwa + rendimiento

---

## 17) Contratos y convenciones obligatorias

1. Respuesta exito:

- { success: true, data, message? }

2. Respuesta error:

- { success: false, message, details? }

3. Headers:

- Authorization: Bearer <token>
- x-business-id: <businessId> (cuando aplica)

4. Nunca confiar en precio del body para calculos financieros.

5. En controladores:

- sin reglas de negocio complejas
- solo adaptacion HTTP

---

## 18) Riesgos ya detectados en el sistema actual (y como evitarlos al reconstruir)

1. Drift de contratos API front/back

- Definir contrato unico por modulo y validarlo con tests.

2. Rutas legacy aun llamadas en frontend

- Crear capa de compatibilidad temporal y eliminarla por fases.

3. Carreras de cache en memberships/sesion

- Implementar request dedupe + TTL + invalidacion forzada post-create.

4. Loops de hidratacion en contextos

- Bloquear reentradas con flags inFlight/debounce.

5. Fugas de campos financieros

- Mantener scrub global y por endpoint.

---

## 19) Checklist de completitud para decir "mismo proyecto"

Backend:

- [ ] 38 modulos de ruta V2 activos
- [ ] middleware de auth + businessContext + requirePermission + requireFeature
- [ ] transacciones en ventas/creditos/stock/dispatch
- [ ] auditoria y notificaciones
- [ ] data scrubbing financiero

Frontend:

- [ ] providers Auth + Business estables
- [ ] rutas public/admin/staff completas
- [ ] servicios por feature
- [ ] core clean para dispatch/sales
- [ ] pwa habilitada

Dominio:

- [ ] modelos y indices replicados
- [ ] reglas financieras (comisiones, net profit, creditos)
- [ ] garantias + defectuosos + trazabilidad
- [ ] multi-tenant sin cruces

Calidad:

- [ ] unit/integration/e2e verdes
- [ ] smoke test de onboarding y primera venta
- [ ] smoke test de create business -> selector listo

---

## 20) Plantilla minima de arranque sugerida

```text
server/
  src/
    domain/services/
    application/use-cases/
    infrastructure/
      http/routes/
      http/controllers/
      database/models/
      database/repositories/
  middleware/
  config/
  __tests__/

client/
  src/
    api/
    context/
    core/
      domain/
      use-cases/
      infrastructure/
    features/
      auth/
      business/
      inventory/
      sales/
      ...
    components/
    routes/
    shared/
```

---

## 21) Cierre

Si construyes el sistema siguiendo este documento en el orden de fases, con los contratos API, los modelos e indices, y las reglas de seguridad/finanzas aqui listadas, obtienes una replica funcional de Essence ERP con arquitectura moderna y operacion multi-tenant de nivel productivo.
