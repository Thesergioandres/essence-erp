---
name: pos-transactional-core
description: Enforces strict financial data integrity, ACID transactions, and concurrency control for Point of Sale (POS) operations. Use when building or modifying checkout flows, cart management, inventory deduction, or B2B/B2C pricing rules.
---

# POS & Transactional Logic Protocol

Financial and inventory data operations require absolute precision. A failed checkout or negative inventory state is a critical system failure. You MUST follow these strict guidelines when working on any transactional code.

## Strict Execution Rules

### 1. Zero-Trust Backend (Payload Validation)

- **Rule:** NEVER trust financial totals or prices sent from the frontend.
- **Implementation:** The frontend must only send `productId`, `quantity`, and explicit override flags (e.g., `requestedSalePrice`). The backend MUST independently recalculate the total cost, discounts, and commissions by querying the database.

### 2. B2B / B2C Pricing Hierarchy

- **Rule:** Always respect the established business pricing hierarchy before applying generic calculations.
- **Hierarchy Order:** 1. Manual override by authorized roles (`admin`/`god`). 2. Fixed Manual Employee Price (if `isAutomaticEmployeePrice === false`). 3. Automatic Percentage Calculation (e.g., Retail Price - 20%). 4. Base Retail Price.

### 3. ACID Transactions (MongoDB)

- **Rule:** Order creation and inventory deduction MUST succeed or fail together.
- **Implementation:** Always use MongoDB Sessions (`session.startTransaction()`).
- If ANY step fails (e.g., insufficient stock), you MUST `await session.abortTransaction()` and throw a semantic HTTP error.

### 4. Concurrency & Negative Stock Prevention

- **Rule:** Prevent race conditions where two employees sell the last item simultaneously.
- **Implementation:** Do not fetch the stock, check it in memory, and then save. Use atomic database operations.
- Example: `Product.updateOne({ _id: id, stock: { $gte: qty } }, { $inc: { stock: -qty } })`. If `modifiedCount` is 0, throw an "Out of Stock" error and abort the transaction.

### 5. Floating-Point Math Safety

- **Rule:** Prevent JavaScript floating-point errors (e.g., `0.1 + 0.2 = 0.30000000000000004`).
- **Implementation:** Use `Math.round()` after calculations, or handle currency as integers (cents) before dividing by 100 for display.

## Component State Synchronization

When modifying UI forms for pricing or checkout:

- Ensure toggleable boolean checkboxes (e.g., "Automatic Pricing") perfectly match the backend schema.
- If a boolean disables a calculation, the UI input MUST become read-only or visually reflect the locked state.

## QA & Transaction Checklist

Before finalizing your code, silently verify:

- [ ] Is the backend calculating the final total independently?
- [ ] Are MongoDB transactions wrapping the entire checkout process?
- [ ] Is the `$inc` operator used safely with a `$gte` condition to prevent negative stock?
- [ ] Are Catch blocks properly aborting the transaction and releasing the session?

## Reporting Format

If you modified a transactional flow, append this to your response:
**[Transaction Security Audit]**:

- 🔒 **Concurrency:** [How negative stock is prevented]
- 🧮 **Math Safety:** [How the price is validated/calculated]
