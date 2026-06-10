import { render, screen, fireEvent } from "@testing-library/react";
import { Footer } from "@/components/ui/Footer";

// Footer calls useContactForm() — mock the context hook.
const mockOpen = jest.fn();
jest.mock("../../../components/ui/ContactFormProvider", () => ({
  useContactForm: jest.fn(() => ({ open: mockOpen, close: jest.fn() })),
}));

const mockFetchFooterConfig = jest.fn();
jest.mock("../../../lib/config/footer", () => ({
  fetchFooterConfig: () => mockFetchFooterConfig(),
}));

beforeEach(() => {
  mockOpen.mockReset();
  mockFetchFooterConfig.mockResolvedValue({
    instagramUrl: "https://instagram.com/ustart.us",
    tiktokUrl: "https://www.tiktok.com/@ustart",
    affiliateDisclosureEnabled: false,
  });
});

describe("Footer", () => {
  it("renders without error", async () => {
    const { container } = render(await Footer());
    expect(container).toBeTruthy();
  });

  it("renders a footer element", async () => {
    const { container } = render(await Footer());
    expect(container.querySelector("footer")).toBeInTheDocument();
  });

  it("renders the UStart logo linking to /", async () => {
    render(await Footer());
    const wordmark = screen.getByRole("link", { name: "UStart" });
    expect(wordmark).toBeInTheDocument();
    expect(wordmark).toHaveAttribute("href", "/");
  });

  it("renders the Privacy Policy link", async () => {
    render(await Footer());
    const link = screen.getByRole("link", { name: "Privacy Policy" });
    expect(link).toHaveAttribute("href", "/privacy");
  });

  it("renders the Terms link", async () => {
    render(await Footer());
    const link = screen.getByRole("link", { name: "Terms" });
    expect(link).toHaveAttribute("href", "/terms");
  });

  it("renders a Contact button (not a link) that opens the panel", async () => {
    render(await Footer());
    // Contact is now a button that triggers the panel, not a <Link>
    const contactBtn = screen.getByRole("button", { name: /contact/i });
    expect(contactBtn).toBeInTheDocument();
    fireEvent.click(contactBtn);
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  it("renders the copyright notice", async () => {
    render(await Footer());
    expect(screen.getByText(/2026 UStart/)).toBeInTheDocument();
  });

  it("renders configured Instagram and TikTok links", async () => {
    render(await Footer());
    expect(screen.getByLabelText("UStart on Instagram").closest("a")).toHaveAttribute(
      "href",
      "https://instagram.com/ustart.us"
    );
    expect(screen.getByLabelText("UStart on TikTok").closest("a")).toHaveAttribute(
      "href",
      "https://www.tiktok.com/@ustart"
    );
  });

  it("hides social links when configured URLs are empty", async () => {
    mockFetchFooterConfig.mockResolvedValueOnce({
      instagramUrl: "",
      tiktokUrl: "",
      affiliateDisclosureEnabled: false,
    });
    render(await Footer());
    expect(screen.queryByLabelText("UStart on Instagram")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("UStart on TikTok")).not.toBeInTheDocument();
  });

  it("hides placeholder social URLs", async () => {
    mockFetchFooterConfig.mockResolvedValueOnce({
      instagramUrl: "https://instagram.com/placeholder",
      tiktokUrl: "https://tiktok.com/placeholder",
      affiliateDisclosureEnabled: false,
    });
    render(await Footer());
    expect(screen.queryByLabelText("UStart on Instagram")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("UStart on TikTok")).not.toBeInTheDocument();
  });

  it("renders affiliate disclosure when enabled", async () => {
    mockFetchFooterConfig.mockResolvedValueOnce({
      instagramUrl: "",
      tiktokUrl: "",
      affiliateDisclosureEnabled: true,
    });
    render(await Footer());
    expect(screen.getByText(/referral fee at no cost to you/i)).toBeInTheDocument();
  });
});
