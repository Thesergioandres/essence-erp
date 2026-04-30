---
name: saas-multi-tenant
description: Enforces strict data isolation, Business Context (`businessId`) propagation, and Role-Based Access Control (RBAC) in a multi-tenant SaaS. Use when creating endpoints, database queries, authentication flows, or UI components that depend on the active business.
---

# SaaS Multi-Tenant & RBAC Protocol

Data leakage between tenants (businesses) is a critical, zero-tolerance failure. All logic must enforce strict boundary isolation using the `businessId` and respect the platform's Role-Based Access Control (RBAC).

## 1. The RBAC Hierarchy (Strict Definitions)

Always validate roles before executing use cases. The system uses these specific roles:

- **`god` (Platform Owner / Developer):** Has absolute access. Bypasses all paywalls, subscription checks, and onboarding limits. Does not earn commissions.
- **`super_admin` / `admin` (Tenant Owners):** Owns a specific `businessId`. Has full access to their business data. Does not earn commissions. Cannot see other businesses' data.
- **`employee` / `operativo` (Tenant Staff):** Restricted access within a `businessId`. Subject to commission structures (B2B pricing, fixed/variable commissions).

## 2. Backend Scoping & Data Isolation (CRITICAL)

- **Tenant ID Injection:** Every authenticated backend request must extract the `businessId` at the middleware level (from headers like `X-Business-ID` or the JWT token).
- **Query Scoping:** EVERY database query (find, update, delete) MUST include `{ businessId: req.businessId }` in its filter object.
- **Exception:** Only the `god` role is permitted to execute cross-tenant queries (e.g., global analytics), and only if explicitly requested.

## 3. Frontend Context Propagation

- **State Hydration:** The frontend MUST NEVER lose the business context. If navigating between pages, ensure the `businessId` is preserved in the global state, AuthContext, or localStorage.
- **API Interceptors:** Axios or fetch services must automatically attach the active `businessId` to the headers of outgoing requests to prevent "Business not selected" errors.
- **White-Labeling:** UI components (like dashboards or receipts) should dynamically consume configuration objects based on the active `businessId` context.

## 4. Execution Protocol for New Features

When creating a new route or component:

1. Identify if the data belongs to the platform (global) or a specific business (tenant).
2. Inject the `requirePermission` or role-checking middleware in the router.
3. Write the Repository/Mongoose query explicitly passing the `businessId`.

## QA & Tenant Isolation Checklist

Before finalizing your response, silently verify:

- [ ] Is `businessId` included in the MongoDB query filter?
- [ ] Is the frontend injecting the business context into the service call?
- [ ] Are we checking if the user is `god` before applying subscription locks?

## Reporting Format

If you modified a query, route, or context provider, append this to your response:
**[Multi-Tenant Audit]**:

- 🏢 **Data Isolation:** [How `businessId` was enforced in the query]
- 🔐 **RBAC:** [Which roles are permitted to run this action]
