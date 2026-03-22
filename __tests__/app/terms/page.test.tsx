import { render, screen } from "@testing-library/react";
import TermsPage from "@/app/terms/page";

// Navbar is an async Server Component — mock it so this test stays synchronous.
jest.mock("../../../components/ui/Navbar", () => ({
  Navbar: () => <nav />,
}));

// Footer calls useContactForm() — mock it so this test doesn't need the provider.
jest.mock("../../../components/ui/Footer", () => ({
  Footer: () => <footer />,
}));

// ContactTriggerLink calls useContactForm() — mock so page tests stay provider-free.
jest.mock("../../../components/ui/ContactTriggerLink", () => ({
  ContactTriggerLink: () => <button>contact form</button>,
}));

describe("TermsPage", () => {
  it("renders without error", () => {
    const { container } = render(<TermsPage />);
    expect(container).toBeTruthy();
  });

  it("renders the Terms of Service heading", () => {
    render(<TermsPage />);
    expect(
      screen.getByRole("heading", { name: /terms of service/i, level: 1 })
    ).toBeInTheDocument();
  });

  it("shows the last-updated date", () => {
    render(<TermsPage />);
    expect(screen.getByText(/march 20, 2026/i)).toBeInTheDocument();
  });

  it("renders key section headings", () => {
    render(<TermsPage />);
    expect(screen.getByText(/agreement to terms/i)).toBeInTheDocument();
    expect(screen.getByText(/membership and access/i)).toBeInTheDocument();
    expect(screen.getByText(/payments and refunds/i)).toBeInTheDocument();
  });
});
