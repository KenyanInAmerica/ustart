import { render, screen } from "@testing-library/react";
import PrivacyPage from "@/app/privacy/page";

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

describe("PrivacyPage", () => {
  it("renders without error", () => {
    const { container } = render(<PrivacyPage />);
    expect(container).toBeTruthy();
  });

  it("renders the Privacy Policy heading", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { name: /privacy policy/i, level: 1 })
    ).toBeInTheDocument();
  });

  it("shows the last-updated date", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/march 20, 2026/i)).toBeInTheDocument();
  });

  it("renders key section headings", () => {
    render(<PrivacyPage />);
    expect(screen.getAllByText(/who we are/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/information we collect/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/your rights/i).length).toBeGreaterThan(0);
  });
});
