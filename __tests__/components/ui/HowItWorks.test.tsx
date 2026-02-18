import { render, screen } from "@testing-library/react";
import { HowItWorks } from "@/components/ui/HowItWorks";

describe("HowItWorks", () => {
  it("renders without error", () => {
    const { container } = render(<HowItWorks />);
    expect(container).toBeTruthy();
  });

  it("renders the section heading", () => {
    render(<HowItWorks />);
    expect(
      screen.getByRole("heading", { name: /three steps to get started/i })
    ).toBeInTheDocument();
  });

  it("renders all three step titles", () => {
    render(<HowItWorks />);
    expect(screen.getByText("Choose your plan")).toBeInTheDocument();
    expect(screen.getByText("Access your portal")).toBeInTheDocument();
    expect(screen.getByText("Start making progress")).toBeInTheDocument();
  });

  it("renders the decorative step numbers", () => {
    render(<HowItWorks />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
  });
});
