import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "../api/axios";

describe("axios interceptor owner_inactive", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "", assign: vi.fn() },
    });
    localStorage.clear();
  });

  it("redirige a account-hold si el backend responde owner_inactive", async () => {
    const handler = (api as any).interceptors.response.handlers.at(-1);
    const rejected = handler.rejected as (err: unknown) => Promise<unknown>;

    const error = {
      response: {
        status: 403,
        data: { code: "owner_inactive" },
      },
    } as unknown;

    await expect(rejected(error)).rejects.toBe(error);
    expect(localStorage.getItem("accessHoldReason")).toBe("owner_inactive");
    expect(window.location.href).toContain(
      "/account-hold?reason=owner_inactive"
    );
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });
});
