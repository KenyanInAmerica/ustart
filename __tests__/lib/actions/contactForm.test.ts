/** @jest-environment node */

const mockInsert = jest.fn();
const mockGetUser = jest.fn();

jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

jest.mock("../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: mockInsert,
    })),
  })),
}));

import { submitContactForm } from "../../../lib/actions/contactForm";

describe("submitContactForm", () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockGetUser.mockReset();
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it("returns success on valid unauthenticated submission", async () => {
    mockInsert.mockResolvedValue({ error: null });
    const result = await submitContactForm({
      name: "Alice",
      email: "alice@example.com",
      message: "Hello there",
    });
    expect(result.success).toBe(true);
  });

  it("returns success when authenticated user submits", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "alice@example.com" } },
    });
    mockInsert.mockResolvedValue({ error: null });
    const result = await submitContactForm({
      name: "Alice",
      email: "alice@example.com",
      message: "Hello",
    });
    expect(result.success).toBe(true);
  });

  it("returns error when any field is blank", async () => {
    const result = await submitContactForm({
      name: "",
      email: "a@b.com",
      message: "hi",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/required/i);
  });

  it("returns error when all fields are blank", async () => {
    const result = await submitContactForm({ name: "", email: "", message: "" });
    expect(result.success).toBe(false);
  });

  it("returns error when insert fails", async () => {
    mockInsert.mockResolvedValue({ error: { message: "DB error" } });
    const result = await submitContactForm({
      name: "Bob",
      email: "bob@example.com",
      message: "Test",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("DB error");
  });

  it("passes user_id when authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-99" } },
    });
    mockInsert.mockResolvedValue({ error: null });
    await submitContactForm({
      name: "Bob",
      email: "bob@example.com",
      message: "Test",
    });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-99" })
    );
  });

  it("passes null user_id when unauthenticated", async () => {
    mockInsert.mockResolvedValue({ error: null });
    await submitContactForm({
      name: "Anon",
      email: "anon@example.com",
      message: "Anonymous message",
    });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: null })
    );
  });
});
