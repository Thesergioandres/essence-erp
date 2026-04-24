---
name: fullstack-tracer
description: A debugging methodology to trace data flow from UI interactions down to database persistence. Use when troubleshooting discrepancies between the frontend state and backend data.
---

# Full-Stack Debugging Protocol

When fixing bugs where the UI behavior does not match the expected backend state, follow this strict tracing protocol before proposing a fix:

1. **Trace the UI Event:** Verify how the component captures the value (e.g., `onChange` of a checkbox) and updates the local state.
2. **Trace the Payload:** Examine the exact structure of the data being sent in the network request. Are types correct? (e.g., sending `"0"` vs `0`, or failing to send a boolean flag).
3. **Trace the Controller/DTO:** Verify how the backend receives and validates the incoming payload.
4. **Trace the Persistence:** Check the ORM/ODM query. Is the value being mapped to the database schema correctly, or is it being overwritten/ignored by default values?
