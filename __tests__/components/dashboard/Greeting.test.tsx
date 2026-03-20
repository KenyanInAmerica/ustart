import { render, screen } from "@testing-library/react";
import { Greeting } from "@/components/dashboard/Greeting";

const mockGetUser = jest.fn();
const mockMaybeSingle = jest.fn();

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
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

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

const mockUser = { id: "u1", email: "randy.smith@example.com" };

describe("Greeting", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockMaybeSingle.mockReset();
    // Default: authenticated user with a Lite membership
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockMaybeSingle.mockResolvedValue({
      data: { membership_tier: "lite", first_name: null },
      error: null,
    });
  });

  it("renders without error", async () => {
    const { container } = render(await Greeting());
    expect(container).toBeTruthy();
  });

  it("renders a time-aware greeting with the stored first name", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { membership_tier: "lite", first_name: "Randy" },
      error: null,
    });
    render(await Greeting());
    const heading = screen.getByRole("heading");
    expect(heading.textContent).toMatch(/Randy/);
    // Must contain one of the four time-of-day strings
    expect(heading.textContent).toMatch(
      /Good morning|Good afternoon|Good evening|Working late/
    );
  });

  it("renders a greeting without a name when first_name is null", async () => {
    render(await Greeting());
    const heading = screen.getByRole("heading");
    // No name — just the time-of-day string plus punctuation
    expect(heading.textContent).toMatch(
      /Good morning\.|Good afternoon\.|Good evening\.|Working late\?/
    );
    expect(heading.textContent).not.toMatch(/,/);
  });

  it("renders the plan name in the subheading when the user has a membership", async () => {
    render(await Greeting());
    expect(
      screen.getByText(/you're on the lite plan/i)
    ).toBeInTheDocument();
    // No "View Plans" CTA when the user already has a plan
    expect(screen.queryByRole("link", { name: /view plans/i })).not.toBeInTheDocument();
  });

  it("renders the no-plan fallback when membership_tier is null", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    render(await Greeting());
    expect(
      screen.getByText(/choose a plan to get started/i)
    ).toBeInTheDocument();
  });

  it("renders the View Plans link when the user has no membership", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    render(await Greeting());
    const link = screen.getByRole("link", { name: /view plans/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/pricing");
  });

  it("uses first_name from the DB when available, over email-derived name", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { membership_tier: "lite", first_name: "Kai" },
      error: null,
    });
    render(await Greeting());
    expect(screen.getByRole("heading").textContent).toMatch(/Kai/);
  });

  it("renders 'Good morning' for hours 5–11", async () => {
    jest.spyOn(global, "Date").mockImplementation(
      () => ({ getHours: () => 8 }) as unknown as Date
    );
    render(await Greeting());
    expect(screen.getByRole("heading").textContent).toMatch(/Good morning/);
    jest.restoreAllMocks();
  });

  it("renders 'Good afternoon' for hours 12–16", async () => {
    jest.spyOn(global, "Date").mockImplementation(
      () => ({ getHours: () => 14 }) as unknown as Date
    );
    render(await Greeting());
    expect(screen.getByRole("heading").textContent).toMatch(/Good afternoon/);
    jest.restoreAllMocks();
  });

  it("renders 'Good evening' for hours 17–23", async () => {
    jest.spyOn(global, "Date").mockImplementation(
      () => ({ getHours: () => 20 }) as unknown as Date
    );
    render(await Greeting());
    expect(screen.getByRole("heading").textContent).toMatch(/Good evening/);
    jest.restoreAllMocks();
  });

  it("renders 'Working late?' for hours 0–4 when no first_name", async () => {
    jest.spyOn(global, "Date").mockImplementation(
      () => ({ getHours: () => 2 }) as unknown as Date
    );
    render(await Greeting());
    expect(screen.getByRole("heading").textContent).toMatch(/Working late\?/);
    jest.restoreAllMocks();
  });
});
