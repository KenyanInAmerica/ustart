import { render, screen } from "@testing-library/react";

const mockGetUser = jest.fn();
const mockMaybeSingle = jest.fn();

jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  })),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("../../../app/intake/IntakeForm", () => ({
  IntakeForm: () => <div data-testid="intake-form-stub" />,
}));

import IntakePage from "../../../app/intake/page";
import { redirect } from "next/navigation";

describe("IntakePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@example.com" } },
    });
    mockMaybeSingle.mockResolvedValue({
      data: { intake_completed_at: null },
    });
  });

  it("renders without error for an authenticated user without completed intake", async () => {
    const { container } = render(await IntakePage());
    expect(container).toBeTruthy();
  });

  it("renders the intake form without the step progress copy", async () => {
    render(await IntakePage());
    expect(screen.getByTestId("intake-form-stub")).toBeInTheDocument();
    expect(screen.queryByText(/step 1 of 1/i)).not.toBeInTheDocument();
  });

  it("redirects signed-out users to /sign-in", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    await IntakePage();

    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("redirects users with completed intake to /dashboard", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { intake_completed_at: "2026-04-21T00:00:00.000Z" },
    });

    await IntakePage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
