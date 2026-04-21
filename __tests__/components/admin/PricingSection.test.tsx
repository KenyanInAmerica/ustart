import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { PricingSection } from "@/components/admin/PricingSection";
import type { PricingItem } from "@/lib/config/pricing";

// Use relative path — jest.mock() doesn't always resolve @/ path aliases.
jest.mock("../../../lib/actions/admin/updatePricing", () => ({
  updatePricing: jest.fn(),
}));

const { updatePricing } = jest.requireMock(
  "../../../lib/actions/admin/updatePricing"
) as { updatePricing: jest.Mock };

const mockItems: PricingItem[] = [
  {
    id: "lite",
    name: "Lite",
    description: "Core library",
    price: 49,
    billing: "one-time",
    features: ["Core content", "PDF downloads"],
    is_public: true,
    display_order: 1,
    stripe_product_id: null,
    stripe_price_id: null,
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "explore",
    name: "Explore",
    description: "Deeper guidance",
    price: 9.99,
    billing: "monthly",
    features: ["Everything in Lite"],
    is_public: true,
    display_order: 2,
    stripe_product_id: null,
    stripe_price_id: null,
    updated_at: "2026-01-01T00:00:00Z",
  },
];

beforeEach(() => {
  updatePricing.mockResolvedValue({ success: true });
});

afterEach(() => jest.clearAllMocks());

describe("PricingSection", () => {
  it("renders without error", () => {
    const { container } = render(<PricingSection items={mockItems} />);
    expect(container).toBeTruthy();
  });

  it("renders all item names in the table", () => {
    render(<PricingSection items={mockItems} />);
    expect(screen.getAllByText("Lite").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Explore").length).toBeGreaterThan(0);
  });

  it("renders prices for each row", () => {
    render(<PricingSection items={mockItems} />);
    expect(screen.getAllByText("$49").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$9.99").length).toBeGreaterThan(0);
  });

  it("renders Edit buttons for each row", () => {
    render(<PricingSection items={mockItems} />);
    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    expect(editButtons.length).toBe(mockItems.length);
  });

  it("shows the edit form when Edit is clicked", () => {
    render(<PricingSection items={mockItems} />);
    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("hides the edit form when Cancel is clicked", () => {
    render(<PricingSection items={mockItems} />);
    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });

  it("calls updatePricing when Save is clicked", async () => {
    render(<PricingSection items={mockItems} />);
    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    // Dirty the form so Save is enabled.
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(updatePricing).toHaveBeenCalledTimes(1));
    expect(updatePricing).toHaveBeenCalledWith(
      "lite",
      expect.objectContaining({ name: "Lite", price: 50 })
    );
  });

  it("shows error message when save fails", async () => {
    updatePricing.mockResolvedValue({ success: false, error: "DB error" });
    render(<PricingSection items={mockItems} />);
    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    // Dirty the form so Save is enabled.
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(screen.getByText("DB error")).toBeInTheDocument());
  });

  it("renders the 'Pricing' section heading", () => {
    render(<PricingSection items={mockItems} />);
    expect(screen.getByText("Pricing")).toBeInTheDocument();
  });

  // Fix 3: success auto-dismiss.
  it("auto-dismisses the 'Saved.' message after 3 seconds", async () => {
    jest.useFakeTimers();
    render(<PricingSection items={mockItems} />);
    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    // Dirty the form so Save is enabled.
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(screen.getByText("Saved.")).toBeInTheDocument());
    act(() => { jest.advanceTimersByTime(3000); });
    expect(screen.queryByText("Saved.")).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  // Fix 4: name and billing are read-only.
  it("shows name as read-only text in the edit form (no input)", () => {
    render(<PricingSection items={mockItems} />);
    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    // Name should not be an editable input — it renders as a paragraph.
    const nameInputs = screen
      .getAllByRole("textbox")
      .filter((el) => (el as HTMLInputElement).value === "Lite");
    expect(nameInputs.length).toBe(0);
  });

  // Fix 2: Save button disabled until a change is made.
  it("disables the Save button when no fields have changed", () => {
    render(<PricingSection items={mockItems} />);
    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  it("enables the Save button after editing the price field", () => {
    render(<PricingSection items={mockItems} />);
    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    const priceInput = screen.getByRole("spinbutton");
    fireEvent.change(priceInput, { target: { value: "59" } });
    expect(screen.getByRole("button", { name: /save/i })).not.toBeDisabled();
  });

  it("passes the original item.name to updatePricing even though name is read-only", async () => {
    render(<PricingSection items={mockItems} />);
    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    // Dirty the form so Save is enabled.
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(updatePricing).toHaveBeenCalledTimes(1));
    // name and billing are always the original item values.
    expect(updatePricing).toHaveBeenCalledWith(
      "lite",
      expect.objectContaining({ name: "Lite", billing: "one-time" })
    );
  });
});
