---
name: frontend-clean-gsap
description: Generates, refactors, or reviews frontend React/Next.js code. Enforces Clean Architecture, Tailwind CSS styling, and high-performance GSAP animations. Use when the user asks to build UI components, custom hooks, API integrations, or complex animated interfaces.
---

# Frontend Clean Architecture & GSAP Skill

This skill ensures all frontend code strictly adheres to Clean Architecture principles, decoupling UI components from business logic, and guarantees memory-safe, performant GSAP animations.

## Directory Structure Enforcement

When creating new frontend features, strictly distribute the code within the `client/src/` (or equivalent) directory using a feature-based architecture:

- `features/<feature-name>/types/`: TypeScript interfaces and types.
- `features/<feature-name>/services/`: API calls (e.g., Axios). NO UI components here.
- `features/<feature-name>/hooks/`: Custom React hooks orchestrating state and services.
- `features/<feature-name>/components/`: "Dumb" UI components specific to the feature.
- `features/<feature-name>/pages/`: Smart components/views that assemble the UI and inject data.

## Clean Architecture Rules (Frontend)

1. **Separation of Concerns:** Components must be "dumb" whenever possible. They receive data via props.
2. **Data Fetching:** Never use `axios.get()` or `fetch()` directly inside a `useEffect` of a UI component. Abstract it into a `service` file, and consume it via a custom hook (or a library like React Query).
3. **Styling:** Use Tailwind CSS exclusively for layout, spacing, and responsive design. Avoid inline `style={{}}` unless dynamically calculating values that Tailwind cannot handle.

## GSAP Animation Standards

1. **Memory Safety (CRITICAL):** ALWAYS use the `@gsap/react` library and its `useGSAP()` hook. Never use a raw `useEffect` for GSAP. This ensures automatic cleanup on component unmount and prevents memory leaks.
2. **Performance:** Only animate `transform` (x, y, scale, rotation) and `opacity`. DO NOT animate properties that trigger layout thrashing (like `width`, `height`, `top`, `left`, `margin`).
3. **ScrollTrigger:** If using ScrollTrigger, ensure the DOM is fully loaded. Use `useGSAP()` scope to target elements safely without global class name collisions.

## How to implement a new UI feature (Step-by-Step)

1. **Define Types:** Create the TS interfaces for the data model.
2. **Create the Service:** Write the API integration functions.
3. **Create the Hook:** Build a custom hook to manage loading, error, and data states.
4. **Build the UI Component:** Build the stateless visual component with Tailwind.
5. **Apply Animations (Optional):** Wrap the component logic in `useGSAP()`, passing the `ref` scope.
6. **Assemble the Page:** Connect the hook to the UI component in the Page/View.

## Code Review & Quality Checklist

Before finalizing your response, silently verify:

- [ ] Are the UI components completely decoupled from Axios/fetch calls?
- [ ] Is `useGSAP()` being used instead of `useEffect` for animations?
- [ ] Are animations strictly limited to hardware-accelerated properties (`transform`/`opacity`)?
- [ ] Are all styles handled via Tailwind utility classes?
