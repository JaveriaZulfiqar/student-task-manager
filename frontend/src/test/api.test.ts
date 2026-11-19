import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/services/api";

const jsonResponse = (body: unknown, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);

describe("api service", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
  });

  it("login stores the token and posts credentials to /api/auth/login", async () => {
    fetchMock.mockReturnValue(jsonResponse({ token: "abc", user: { id: "1", name: "J", email: "j@x.com" } }));
    await api.login("j@x.com", "secret123");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/login");
    expect(JSON.parse(init.body)).toEqual({ email: "j@x.com", password: "secret123" });
    expect(localStorage.getItem("token")).toBe("abc");
  });

  it("surfaces the server's error message", async () => {
    fetchMock.mockReturnValue(jsonResponse({ message: "Invalid credentials" }, false));
    await expect(api.login("a@b.com", "wrong")).rejects.toThrow("Invalid credentials");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("register sends name, email and password", async () => {
    fetchMock.mockReturnValue(jsonResponse({ token: "t", user: { id: "1", name: "J", email: "j@x.com" } }));
    await api.register("J", "j@x.com", "secret123");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ name: "J", email: "j@x.com", password: "secret123" });
  });

  it("logout clears the token", () => {
    localStorage.setItem("token", "abc");
    api.logout();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("sends the bearer token when fetching tasks", async () => {
    localStorage.setItem("token", "abc");
    fetchMock.mockReturnValue(jsonResponse([]));
    await api.getTasks();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer abc");
  });

  it("createTask sends the attachment name, not the file", async () => {
    fetchMock.mockReturnValue(jsonResponse({ id: "1" }));
    const file = new File(["x"], "notes.pdf");
    await api.createTask({ title: "t", description: "d", dueDate: "2026-12-01", file });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      title: "t", description: "d", dueDate: "2026-12-01", fileName: "notes.pdf",
    });
  });

  it("updateTask sends only the changed fields and wipes the attachment with an empty string", async () => {
    fetchMock.mockReturnValue(jsonResponse({ id: "1" }));
    await api.updateTask("1", { status: "completed", file: null });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/tasks/1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({ status: "completed", fileName: "" });
  });

  it("deleteTask throws the server message on failure", async () => {
    fetchMock.mockReturnValue(jsonResponse({ message: "Task not found" }, false));
    await expect(api.deleteTask("1")).rejects.toThrow("Task not found");
  });
});
