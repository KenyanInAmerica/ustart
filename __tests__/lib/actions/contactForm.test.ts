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

// Resend notification is best-effort — mock it so the import resolves and
// tests can verify it was called or simulate failures.
// jest.fn() must be called inside the factory (not referencing outer const vars)
// to avoid the Jest hoisting TDZ error.
jest.mock("../../../lib/resend/client", () => ({
  resend: { emails: { send: jest.fn() } },
}));

import { resend } from "../../../lib/resend/client";
import { submitContactForm } from "../../../lib/actions/contactForm";

// Typed alias — resend is already the mock object after jest.mock() above.
const mockResendEmailsSend = resend.emails.send as jest.Mock;

describe("submitContactForm", () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockGetUser.mockReset();
    mockResendEmailsSend.mockReset();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    // Default: Resend succeeds. Individual tests can override to simulate failure.
    mockResendEmailsSend.mockResolvedValue({ error: null });
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

  it("sends Resend notification after successful insert", async () => {
    mockInsert.mockResolvedValue({ error: null });
    await submitContactForm({
      name: "Alice",
      email: "alice@example.com",
      message: "Hello",
    });
    expect(mockResendEmailsSend).toHaveBeenCalledTimes(1);
    expect(mockResendEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("contact form") })
    );
  });

  it("returns success even when Resend notification fails", async () => {
    mockInsert.mockResolvedValue({ error: null });
    mockResendEmailsSend.mockRejectedValue(new Error("Resend unavailable"));
    const result = await submitContactForm({
      name: "Alice",
      email: "alice@example.com",
      message: "Hello",
    });
    // Notification failure must not bubble up — submission is already stored.
    expect(result.success).toBe(true);
  });
});
