import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import { AuthProvider } from "@/contexts/AuthContext";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({ api: { login: vi.fn(), register: vi.fn(), logout: vi.fn() } }));

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<p>dashboard reached</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

describe("LoginPage", () => {
  beforeEach(() => {
    vi.mocked(api.login).mockReset();
    localStorage.clear();
  });

  it("shows the form and a link to register", () => {
    renderLogin();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /register|sign up|create/i })).toHaveAttribute("href", "/register");
  });

  it("navigates to the dashboard after a successful login", async () => {
    vi.mocked(api.login).mockResolvedValue({ token: "t", user: { id: "1", name: "Jane", email: "j@x.com" } });
    renderLogin();
    await userEvent.type(screen.getByLabelText("Email"), "j@x.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret123");
    await userEvent.click(screen.getByRole("button", { name: /sign in|log in|login/i }));

    await waitFor(() => expect(screen.getByText("dashboard reached")).toBeInTheDocument());
    expect(api.login).toHaveBeenCalledWith("j@x.com", "secret123");
    expect(JSON.parse(localStorage.getItem("user")!).name).toBe("Jane");
  });

  it("shows the error and stays on the page when login fails", async () => {
    vi.mocked(api.login).mockRejectedValue(new Error("Invalid credentials"));
    renderLogin();
    await userEvent.type(screen.getByLabelText("Email"), "j@x.com");
    await userEvent.type(screen.getByLabelText("Password"), "bad");
    await userEvent.click(screen.getByRole("button", { name: /sign in|log in|login/i }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(screen.queryByText("dashboard reached")).not.toBeInTheDocument();
  });
});
