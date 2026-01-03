import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AccountHold from "../pages/AccountHold";

describe("AccountHold", () => {
  it("muestra mensaje de owner inactivo", () => {
    render(
      <MemoryRouter initialEntries={["/account-hold?reason=owner_inactive"]}>
        <Routes>
          <Route path="/account-hold" element={<AccountHold />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Acceso deshabilitado/i)).toBeInTheDocument();
    expect(
      screen.getByText(/El administrador de tu empresa no tiene acceso activo/i)
    ).toBeInTheDocument();
  });
});
