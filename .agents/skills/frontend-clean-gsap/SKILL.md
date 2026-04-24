---
name: frontend-clean-gsap
description: Guides frontend development using Clean Architecture, Tailwind, and GSAP for animations. Use for React, Next.js, and UI tasks.
---

# Frontend Architecture & Animation Skill

When building UI components, follow Clean Architecture principles and use modern animation techniques.

## Structural Rules

- **Separation of Concerns:** Keep UI components "dumb". Network calls, state management, and complex business logic must be abstracted into custom hooks or external services.
- **Styling:** Use Tailwind CSS for all layout, spacing, and responsive design.

## GSAP Animation Rules

- **Performance First:** Animate only `transform` and `opacity` properties to prevent layout thrashing and maintain 60fps.
- **Lifecycle Management:** In React/Next.js, ALWAYS clean up GSAP animations and ScrollTriggers on component unmount using `gsap.context()` or `@gsap/react` `useGSAP()` hook to prevent memory leaks.
- **ScrollTrigger:** Ensure the DOM is fully loaded and layout is stable before initializing ScrollTrigger calculations.

## Quality Assurance

- [ ] Are UI components decoupled from data fetching?
- [ ] Do animations run smoothly without causing layout shifts?
- [ ] Are all GSAP instances properly killed on unmount?
