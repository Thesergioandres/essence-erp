---
name: fullstack-tracer
description: Diagnoses and debugs data inconsistencies, save failures, or UI-to-Database mismatches. Use when the user reports a bug where frontend data isn't saving correctly, UI states reset unexpectedly, or the backend enforces incorrect calculations.
---

# Full-Stack Debugging Protocol

When troubleshooting discrepancies between the frontend state and the backend database, DO NOT guess the solution. You MUST perform a forensic trace through the Clean Architecture (Frontend) and Hexagonal Architecture (Backend) layers before proposing any code changes.

## Execution Protocol: The 5-Step Trace

Always read the relevant files in this exact order to locate the data mutation or loss:

1. **Trace the UI Event & State (Frontend `components/` or `pages/`):**
   - Read the React component.
   - Verify how the value is captured (e.g., `onChange`, `onClick`).
   - Check if the local state (e.g., `useState`, form data) is actually holding the correct primitive type (e.g., `false` boolean vs `"false"` string).

2. **Trace the Payload Construction (Frontend `services/`):**
   - Read the Axios/fetch service file triggering the request.
   - Verify if the payload is being stripped, modified, or if fields are missing before transmission.

3. **Trace the Controller/DTO (Backend `controllers/`):**
   - Read the Express/HTTP controller handling the route.
   - Check if `req.body`, `req.params`, or `req.query` is being correctly destructured.
   - Verify if validation middlewares are silently dropping fields.

4. **Trace the Business Logic (Backend `use-cases/` or `services/`):**
   - Read the Application layer orchestrating the logic.
   - **CRITICAL:** Look for overriding logic. Is the Use Case ignoring the incoming payload and forcing a calculation? (e.g., forcing a 20% commission regardless of manual input).

5. **Trace the Persistence & Hooks (Backend `models/` & `repositories/`):**
   - Read the Mongoose Schema or SQL Repository.
   - Check for Mongoose `pre('save')` hooks or default values that might be overwriting the data right before insertion.
   - Verify that the schema actually includes the field you are trying to save.

## Diagnosis Reporting Format

Before outputting the fixed code, you MUST present a brief diagnosis to the user using this format:

- **Point of Failure:** [Name the exact file and layer where the data is lost/mutated]
- **Root Cause:** [Brief explanation of why it fails]
- **Action Plan:** [Summary of the changes you are about to implement]

## Debugging Checklist

- [ ] Have I verified the data type from the UI matches the DB schema?
- [ ] Did I check the Use Case for hardcoded overrides?
- [ ] Did I check the DB Model for lifecycle hooks modifying the data?
