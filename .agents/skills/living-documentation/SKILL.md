---
name: living-documentation
description: Automatically updates project documentation and inline comments whenever code is modified. Use this as the final step after writing, modifying, or refactoring any code.
---

# Living Documentation Protocol

El código y la documentación deben evolucionar en paralelo. Nunca des por terminada una tarea sin actualizar la documentación correspondiente.

## Reglas de Actualización Estricta

1. **JSDoc / TSDoc (Nivel de Código):**
   - Si alteras una firma (parámetros, tipos de retorno) de una función, interfaz o clase, actualiza inmediatamente su comentario JSDoc/TSDoc.
   - Documenta el "Por qué" (regla de negocio) y los casos extremos, no el "Cómo" obvio.

2. **Capa de Infraestructura (API / Webhooks):**
   - Si modificas un endpoint (controlador) o un webhook de n8n, actualiza el archivo de documentación de la API (ej. `docs/api.md`, `swagger.yaml` o colección de Postman/Bruno).
   - Registra cambios exactos en payloads esperados, query params, headers (ej. `tenantId`) y códigos de estado HTTP.

3. **Capa de Dominio / Casos de Uso (Arquitectura):**
   - Si agregas una nueva entidad, puerto o caso de uso en la Arquitectura Hexagonal/Limpia, actualiza el `README.md` principal o el archivo `docs/architecture.md`.
   - Mantén un registro del flujo de datos si la lógica transaccional o de negocio cambia (ej. reglas de deducción de inventario o precios B2B).

4. **Gestión de Dependencias y Variables de Entorno:**
   - Si instalas una nueva librería o agregas una variable en el `.env`, añádela instantáneamente a la sección de "Instalación/Configuración" del `README.md` y al `.env.example`.

## Flujo de Ejecución (Paso a Paso)

1. Termina de escribir/refactorizar el código y pasa la auditoría de seguridad.
2. Identifica todos los archivos de texto/markdown vinculados a esa parte del sistema.
3. Aplica los cambios en la documentación en el mismo commit o iteración de respuesta.
4. Muestra un resumen ultra-conciso de los archivos de documentación modificados.
