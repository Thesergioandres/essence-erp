---
name: living-documentation
description: Synchronizes project documentation, inline comments, and API specs with code changes. Use this as the MANDATORY final step after implementing, modifying, or refactoring any feature, endpoint, or environment configuration.
---

# Living Documentation Protocol

Code and documentation must evolve synchronously. You MUST NEVER consider a coding task complete without updating its corresponding documentation.

## Execution Triggers & Rules

### 1. Code-Level (JSDoc / TSDoc)

- **Trigger:** Changing a function signature, interface, or class.
- **Rule:** Immediately update its JSDoc/TSDoc comment.
- **Content:** Document the "Why" (business rule, edge cases, e.g., B2B pricing overrides) and the "What" (parameters/returns). Do not document the obvious "How".

### 2. Infrastructure Layer (API / Webhooks)

- **Trigger:** Modifying an Express controller, route, or external integration (e.g., n8n webhooks).
- **Rule:** Update the API documentation files (e.g., `docs/api.md`, `swagger.yaml`, or API collection files).
- **Content:** Precisely record changes in expected payloads, query params, specific HTTP status codes, and mandatory headers (e.g., `businessId`, authorization tokens).

### 3. Domain Layer & Architecture

- **Trigger:** Adding a new Domain Entity, Use Case, or shifting logic in the Hexagonal/Clean Architecture.
- **Rule:** Update the main `README.md` or specific `docs/architecture.md`.
- **Content:** Maintain a log of data flows, specially if transactional logic or multi-tenant business rules change.

### 4. Dependencies & Environment

- **Trigger:** Installing a new npm package or adding a new variable to `.env`.
- **Rule:** Instantaneously append the new requirement to the "Installation/Setup" section of `README.md` and add the mock key to `.env.example`.

## Mandatory Execution Protocol (Step-by-Step)

Whenever you finish writing or refactoring code:

1. Identify all documentation artifacts linked to the modified system area.
2. Apply the documentation updates in the SAME commit or response iteration.
3. You MUST output a `Documentation Sync Report` at the very end of your response.

## Reporting Format

End your responses with:
**[Living Docs Sync]**:

- 📝 `file_name.ts`: Updated JSDoc for `functionName`.
- 📖 `docs/api.md`: Added `newField` to payload spec.
- ⚙️ `.env.example`: Added `NEW_VAR_NAME`.

## QA Checklist

- [ ] Is the `.env.example` perfectly synced with `.env`?
- [ ] Are API changes reflected in the markdown/YAML specs?
- [ ] Did I explain the business logic in the TSDoc?
