---
name: pos-transactional-core
description: Ensures strict data integrity for Point of Sale (POS) operations, inventory deduction, and price calculations. Use for checkout logic, cart management, and B2B/B2C pricing rules.
---

# POS & Transactional Logic Skill

When handling financial data, stock, or cart operations, precision and consistency are mandatory.

## Core Rules

1. **ACID Transactions:** Always use database transactions (e.g., `$transaction` in Prisma or MongoDB sessions) for checkout flows. Inventory deduction and order creation MUST succeed or fail together.
2. **Race Conditions:** Implement optimistic concurrency control or row-level locking when deducting stock to prevent negative inventory during simultaneous sales.
3. **Price Math:** Never trust floating-point math for money. Calculate percentages (e.g., 20% automatic discounts) carefully. Ensure the backend independently calculates and verifies final prices; never trust totals sent from the frontend.
4. **State Consistency:** Ensure UI state (like toggleable boolean checkboxes for automatic pricing) perfectly matches the payload sent to the API and the schema saved in the database.
