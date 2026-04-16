// Tests for app/invite — the public parent invitation confirmation page.
// Covers the async Server Component (page.tsx) and the AcceptButton client component.

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// ── Service client mock (for page.tsx server component) ─────────────────────
const mockServiceFrom = jest.fn();

jest.mock("../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
  })),
}));

// ── acceptInvitation server action mock (for AcceptButton) ───────────────────
const mockAcceptInvitation = jest.fn();

jest.mock("../../../lib/actions/parentInvitation", () => ({
  acceptInvitation: (...args: unknown[]) => mockAcceptInvitation(...args),
}));

// ── Imports after mocks ───────────────────────────────────────────────────────
import InvitePage from "../../../app/invite/page";
import { AcceptButton } from "../../../app/invite/AcceptButton";

// Builds a chainable service query stub that resolves maybeSingle() with `result`.
function makeQueryChain(result: unknown) {
  const chain: Record<string, jest.Mock> = {} as Record<string, jest.Mock>;
  const linkFn = jest.fn(() => chain);
  chain.select = jest.fn(() => chain);
  chain.eq = linkFn;
  chain.gt = linkFn;
  chain.maybeSingle = jest.fn().mockResolvedValue(result);
  return chain;
}

// ── InvitePage (Server Component) ────────────────────────────────────────────

describe("InvitePage", () => {
  beforeEach(() => {
    mockServiceFrom.mockReset();
  });

  it("renders error state when no token is provided", async () => {
    const jsx = await InvitePage({ searchParams: {} });
    render(jsx);
    expect(screen.getByText("Link expired")).toBeInTheDocument();
    expect(
      screen.getByText(/invitation link has expired or is no longer valid/i)
    ).toBeInTheDocument();
  });

  it("renders error state when token is not found in the database", async () => {
    mockServiceFrom.mockReturnValueOnce(makeQueryChain({ data: null }));

    const jsx = await InvitePage({ searchParams: { token: "expired-token" } });
    render(jsx);
    expect(screen.getByText("Link expired")).toBeInTheDocument();
  });

  it("renders confirmation page with Accept button when token is valid", async () => {
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: { id: "inv-1", parent_email: "parent@example.com" } })
    );

    const jsx = await InvitePage({ searchParams: { token: "valid-token-uuid" } });
    render(jsx);
    expect(screen.getByText(/You've been invited to UStart/i)).toBeInTheDocument();
    expect(screen.getByText(/Click below to accept/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept invitation/i })).toBeInTheDocument();
  });

  it("uses the first value when token is an array", async () => {
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: { id: "inv-1", parent_email: "parent@example.com" } })
    );

    const jsx = await InvitePage({ searchParams: { token: ["valid-token-uuid", "second"] } });
    render(jsx);
    expect(screen.getByText(/You've been invited to UStart/i)).toBeInTheDocument();
  });

  it("renders the UStart wordmark linking back to the home page", async () => {
    mockServiceFrom.mockReturnValueOnce(
      makeQueryChain({ data: { id: "inv-1", parent_email: "parent@example.com" } })
    );

    const jsx = await InvitePage({ searchParams: { token: "valid-token" } });
    render(jsx);
    const wordmark = screen.getByRole("link", { name: /ustart/i });
    expect(wordmark).toHaveAttribute("href", "/");
  });
});

// ── AcceptButton (Client Component) ──────────────────────────────────────────

describe("AcceptButton", () => {
  beforeEach(() => {
    mockAcceptInvitation.mockReset();
  });

  it("renders without error and shows Accept invitation button", () => {
    render(<AcceptButton token="test-token" parentEmail="parent@example.com" />);
    expect(screen.getByRole("button", { name: /accept invitation/i })).toBeInTheDocument();
  });

  it("disables the button and shows Processing while pending", async () => {
    // Never resolves so we can observe the in-flight state indefinitely.
    // Wrap click in act() so React flushes the synchronous setState(isPending=true).
    mockAcceptInvitation.mockReturnValue(new Promise(() => {}));

    render(<AcceptButton token="test-token" parentEmail="parent@example.com" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /accept invitation/i }));
    });

    expect(screen.getByRole("button", { name: /processing/i })).toBeDisabled();
  });

  it("shows error message when acceptInvitation returns an error", async () => {
    mockAcceptInvitation.mockResolvedValue({
      success: false,
      error: "This invitation link has expired or is no longer valid.",
    });

    render(<AcceptButton token="bad-token" parentEmail="parent@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /accept invitation/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/This invitation link has expired or is no longer valid/i)
      ).toBeInTheDocument();
    });
    // Button remains visible so the parent can retry.
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("replaces the button with success message on success", async () => {
    mockAcceptInvitation.mockResolvedValue({ success: true });

    render(<AcceptButton token="test-token" parentEmail="parent@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /accept invitation/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
    // Email address shown so the parent knows which inbox to check.
    expect(screen.getByText(/parent@example\.com/i)).toBeInTheDocument();
    // Button is no longer rendered once success state is shown.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls acceptInvitation with the token on click", async () => {
    mockAcceptInvitation.mockReturnValue(new Promise(() => {}));

    render(<AcceptButton token="my-invite-token" parentEmail="parent@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /accept invitation/i }));

    await waitFor(() => {
      expect(mockAcceptInvitation).toHaveBeenCalledWith("my-invite-token");
    });
  });
});
