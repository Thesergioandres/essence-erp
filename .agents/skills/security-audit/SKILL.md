---
name: security-audit
description: Acts as an automated Red Team security auditor. Enforces strict vulnerability mitigation (IDOR, NoSQLi, XSS, CSRF) and hardens code. Use MANDATORILY whenever generating or modifying backend routes, database queries, authentication flows, or API responses.
---

# Security Audit & Hardening Protocol

When generating, modifying, or reviewing backend/API code, you MUST adopt a Red Team / Hacker mindset. Before outputting any code, you must silently attempt to "break" your own logic and immediately refactor it to patch the discovered vulnerabilities.

## Mandatory Security Rules (Node.js / Express / MongoDB)

### 1. IDOR & Tenant Isolation (Data Leaks)

- **Attack Vector:** An attacker changes `req.params.id` to access an invoice or employee from another tenant.
- **Defense:** Never fetch by `_id` alone. ALWAYS append the ownership check: `Model.findOne({ _id: req.params.id, businessId: req.businessId })`.

### 2. NoSQL Injection Prevention

- **Attack Vector:** An attacker sends MongoDB operators in the JSON payload (e.g., `{"email": {"$gt": ""}, "password": {"$gt": ""}}`) to bypass login.
- **Defense:** Never pass `req.body` directly into a Mongoose query. Explicitly destructure only the allowed fields or use a strict sanitization/validation layer (like Zod or express-validator).

### 3. Session & Authentication Hardening

- **Attack Vector:** Token theft via XSS or CSRF.
- **Defense:** Ensure JWTs are handled securely. If using cookies, they MUST be configured as `httpOnly: true`, `secure: true` (in production), and `sameSite: 'strict'` (or 'none' if cross-domain is required, but properly validated via CORS).

### 4. API Shielding (Headers & Rate Limits)

- **Defense:** Ensure exposed endpoints use rate limiting (`express-rate-limit`) to prevent brute force attacks on logins or massive data scraping on product catalogs.
- **Headers:** Ensure `helmet` is configured correctly, applying strong CSP, X-Frame-Options, and HSTS, while allowing legitimate cross-origin resources (like Cloudinary images).

### 5. Zero Hardcoded Secrets

- **Defense:** NEVER hardcode API keys, JWT secrets, database URIs, or passwords in the code. Always use `process.env.VARIABLE_NAME` and add the mock variable to `.env.example`.

## Execution Pattern (The Internal Audit)

1. Write the initial logic.
2. **Internal Silent Audit:** Ask yourself: "How would I exploit this endpoint?" / "What happens if a user sends an array instead of a string?" / "Can an `employee` role hit this route and elevate privileges?"
3. Refactor immediately to mitigate.
4. Output the hardened code.

## Reporting Format

If this skill is triggered, you MUST append this security clearance block at the end of your response:
**[Red Team Security Audit]**:

- 🛡️ **Threat Mitigated:** [Name the vulnerability you prevented, e.g., NoSQLi, IDOR]
- 🔐 **Defense Applied:** [Briefly explain the code mechanism used, e.g., Explicit object destructuring]

## QA Checklist

- [ ] Are we vulnerable to NoSQL injection from `req.body` or `req.query`?
- [ ] Is the `businessId` explicitly checked to prevent IDOR?
- [ ] Are sensitive fields (like passwords or internal costs) stripped before returning the HTTP response?
