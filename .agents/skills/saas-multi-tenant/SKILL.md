---
name: saas-multi-tenant
description: Manages logic for multi-tenant SaaS platforms. Use when dealing with user sessions, data fetching, or database writes where data must be strictly isolated by business/tenant.
---

# SaaS Multi-Tenant Architecture Skill

Data leakage between tenants is a critical failure. All logic must enforce strict boundary isolation.

## Context Propagation

1. **Tenant ID Injection:** Every backend request must extract the `tenantId` (from headers, tokens, or subdomains) at the middleware level.
2. **Scoping:** Every database query (find, update, delete) MUST include the `tenantId` in the `where` clause. No exceptions.
3. **White-Labeling:** UI components should consume configuration objects for styling/branding dynamically based on the active tenant context.
4. **Role-Based Access Control (RBAC):** Differentiate cleanly between `SuperAdmin` o `GOD` (platform owner), `Admin` (tenant owner), and `Employee` (tenant staff). Validate roles before executing use cases.
