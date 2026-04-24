---
name: backend-hexagonal
description: Enforces strict Hexagonal Architecture (Ports and Adapters) for backend development. Use when creating or modifying backend services, APIs, or database interactions.
---

# Backend Hexagonal Architecture Skill

All backend code must strictly adhere to Hexagonal Architecture principles.

## Layer Strictness

1. **Domain Layer:** Contains core business entities and rules. MUST NOT have dependencies on external frameworks, databases (like MongoDB specifics), or HTTP libraries.
2. **Application Layer (Use Cases):** Orchestrates the flow of data to and from the domain entities. Relies on interfaces (Ports) to interact with the outside world.
3. **Infrastructure Layer:** Implements the interfaces (Adapters). This is where MongoDB connections, REST controllers, and external API integrations live.

## Development Checklist

- [ ] Are interfaces defined in the application layer and implemented in the infrastructure layer?
- [ ] Is the domain completely isolated from database schemas?
- [ ] Are unit tests written for the Domain and Application layers without needing a real database?
- [ ] Is Dependency Injection being used to wire adapters to use cases?
