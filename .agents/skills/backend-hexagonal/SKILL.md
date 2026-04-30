---
name: backend-hexagonal
description: Generates, refactors, or reviews backend code enforcing strict Hexagonal Architecture (Ports and Adapters). Use when the user asks to create an API endpoint, database model, repository, use case, or backend business logic.
---

# Backend Hexagonal Architecture Skill

This skill ensures all backend code strictly adheres to Hexagonal Architecture principles, maintaining absolute isolation between business logic and external frameworks.

## When to use this skill

- Creating a new backend feature, entity, or API endpoint.
- Refactoring legacy code to decouple it from the database or HTTP layer.
- Implementing new repositories, services, or controllers in the `server/` directory.

## Directory Structure Enforcement

You MUST place files strictly in the following directories under `server/src/`:

- `domain/`: Core business models, entities, and interface definitions (Ports).
- `application/use-cases/`: Application logic orchestrating domain entities.
- `infrastructure/database/models/`: Database schemas (e.g., Mongoose, Prisma).
- `infrastructure/database/repositories/`: Database adapters implementing domain interfaces.
- `infrastructure/http/controllers/`: Express/HTTP controllers (Adapters).
- `infrastructure/http/routes/`: API route definitions.

## Layer Strictness Rules

1. **Domain Layer (The Core):** - MUST NOT import any external libraries (No Express, No Mongoose, No Axios).
   - Contains pure JS/TS classes or objects containing business rules.
2. **Application Layer (Use Cases):**
   - Orchestrates the flow. It takes DTOs, calls repositories (via injected dependencies), and applies domain logic.
   - MUST NOT depend on HTTP request/response objects (`req`, `res`).
3. **Infrastructure Layer (Adapters):**
   - This is the ONLY place where external libraries (Mongoose, Express, etc.) are allowed.
   - Controllers handle HTTP requests, extract data, call Use Cases, and return formatted HTTP responses.
   - Repositories handle the exact database queries and map DB documents back to Domain Entities.

## How to implement a new feature (Step-by-Step)

When asked to create a new feature, follow this exact execution order:

1. **Define the Domain Entity:** Create the core entity first.
2. **Define the Interface (Port):** Define what the application needs from the outside world (e.g., `UserRepository` interface).
3. **Create the Use Case:** Write the application logic using dependency injection for the repository.
4. **Implement the Repository (Adapter):** Write the database-specific code (Mongoose/SQL) that fulfills the interface.
5. **Create the Controller & Route:** Expose the Use Case via HTTP.

## Code Review & Development Checklist

Before finalizing your response, silently verify:

- [ ] Is the domain completely isolated from database schemas?
- [ ] Are controllers completely free of business logic? (They should only parse requests and format responses).
- [ ] Is Dependency Injection being used to wire adapters to use cases?
- [ ] Are transactions being managed correctly in the infrastructure layer if multiple operations are involved?
