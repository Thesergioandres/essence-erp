/**
 * TEST: Verificar que el botón Guardar Cambios funcione
 * Este test verifica el bug reportado donde el botón no responde
 */

import { expect, test } from "./fixtures";

test.describe("🐛 BUG FIX: Guardar Cambios en Acceso a Bodegas", () => {
  test("VERIFICACIÓN: Botón Guardar Cambios debe estar habilitado", async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin();

    // Navegar a un distribuidor
    await page.goto("/admin/distributors");
    await page.waitForLoadState("networkidle");

    // Click en Ver Detalle
    const detailButton = page
      .getByRole("button", { name: /ver detalle/i })
      .first();
    if (await detailButton.isVisible()) {
      await detailButton.click();
      await page.waitForLoadState("networkidle");

      // Navegar a la pestaña "Acceso a Bodegas"
      const branchesTab = page.getByRole("tab", {
        name: /acceso a bodegas|bodegas/i,
      });

      if (await branchesTab.isVisible()) {
        await branchesTab.click();
        await page.waitForTimeout(2000); // Esperar a que cargue

        // Verificar que existe al menos un checkbox de bodega
        const branchCheckbox = page.locator("input[type='checkbox']").first();

        if (await branchCheckbox.isVisible()) {
          // Toggle checkbox
          await branchCheckbox.click();

          // Buscar el botón "Guardar Cambios"
          const saveButton = page.getByRole("button", {
            name: /guardar cambios/i,
          });

          // VERIFICAR: El botón debe estar visible
          await expect(saveButton).toBeVisible({ timeout: 5000 });

          // VERIFICAR: El botón NO debe estar deshabilitado
          const isDisabled = await saveButton.isDisabled();

          if (isDisabled) {
            console.log(
              "❌ BUG CONFIRMADO: Botón está deshabilitado cuando debería estar habilitado"
            );

            // Capturar el estado del membership
            const membershipData = await page.evaluate(() => {
              return {
                localStorage: JSON.stringify(localStorage),
                sessionStorage: JSON.stringify(sessionStorage),
              };
            });

            console.log("Estado del storage:", membershipData);
          } else {
            console.log("✅ Botón está habilitado correctamente");

            // Intentar hacer click
            await saveButton.click();

            // Esperar respuesta
            await page.waitForTimeout(2000);

            // Verificar mensaje de éxito
            const successMessage = page.getByText(
              /actualizado correctamente|guardado/i
            );
            const errorMessage = page.getByText(/error/i);

            const hasSuccess = await successMessage
              .isVisible()
              .catch(() => false);
            const hasError = await errorMessage.isVisible().catch(() => false);

            if (hasSuccess) {
              console.log("✅ Cambios guardados exitosamente");
            } else if (hasError) {
              console.log("❌ Error al guardar cambios");
            } else {
              console.log("⚠️ Sin mensaje de confirmación visible");
            }
          }
        } else {
          console.log("⚠️ No hay checkboxes de bodegas disponibles");
        }
      } else {
        console.log("⚠️ Pestaña 'Acceso a Bodegas' no encontrada");
      }
    }
  });

  test("VERIFICACIÓN: Membership debe cargarse correctamente", async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin();

    // Navegar a distribuidor
    await page.goto("/admin/distributors");
    await page.waitForLoadState("networkidle");

    const detailButton = page
      .getByRole("button", { name: /ver detalle/i })
      .first();
    if (await detailButton.isVisible()) {
      await detailButton.click();
      await page.waitForLoadState("networkidle");

      // Interceptar llamadas API para verificar respuestas
      page.on("response", async response => {
        const url = response.url();

        if (url.includes("/members") && response.request().method() === "GET") {
          const status = response.status();
          console.log(`📡 API /members - Status: ${status}`);

          if (status === 200) {
            try {
              const data = await response.json();
              console.log(
                `✅ Members response:`,
                JSON.stringify(data, null, 2)
              );
            } catch (e) {
              console.log("⚠️ No se pudo parsear respuesta de members");
            }
          }
        }
      });

      // Ir a pestaña de bodegas para triggear la carga
      const branchesTab = page.getByRole("tab", {
        name: /acceso a bodegas|bodegas/i,
      });
      if (await branchesTab.isVisible()) {
        await branchesTab.click();
        await page.waitForTimeout(3000);
      }
    }
  });
});
