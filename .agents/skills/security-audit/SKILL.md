---
name: security-audit
description: Acts as a Red Team hacker to audit code for vulnerabilities (XSS, SQLi, RLS bypass) before finalizing any task. Use whenever writing backend, database, or API code.
---

# Security Audit & Hardening Skill

When generating or reviewing code, you must adopt a Red Team/Hacker mindset. Before outputting the final code, silently search for ways to break it.

## Mandatory Security Rules

1. **No Hardcoded Secrets:** NEVER hardcode APIs, URLs, passwords, or tokens. Force the use of `.env` variables.
2. **Row Level Security (RLS):** Ensure strict data isolation. Verify that the current tenant/user can ONLY access or mutate their own data. Reject any query that lacks an ownership/tenant check.
3. **Database Permissions:** Apply the Principle of Least Privilege (PoLP). Do not use root/admin database roles for standard application operations.
4. **Rate Limiting:** All exposed endpoints must include rate limiting (by IP or Token) to prevent brute-force and DDoS attacks.
5. **Security Headers:** Web responses must include strong headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).

## Execution Pattern

1. Write the initial code.
2. _Internal Audit:_ How would an attacker exploit this? Is there an IDOR vulnerability? Can I inject NoSQL/SQL payloads?
3. Refactor immediately to mitigate any discovered vulnerabilities.
4. Output the hardened code.
