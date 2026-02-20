import { render, screen, fireEvent } from "@testing-library/react";
import { MobileTopBar } from "@/components/dashboard/MobileTopBar";

// next/link renders an <a> in test env — no mock needed
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => "/dashboard"),
}));

describe("MobileTopBar", () => {
  it("renders without error", () => {
    const { container } = render(<MobileTopBar onOpen={jest.fn()} />);
    expect(container).toBeTruthy();
  });

  it("renders the UStart wordmark", () => {
    render(<MobileTopBar onOpen={jest.fn()} />);
    expect(screen.getByText("UStart")).toBeInTheDocument();
  });

  it("renders the hamburger button", () => {
    render(<MobileTopBar onOpen={jest.fn()} />);
    expect(
      screen.getByRole("button", { name: /open navigation/i })
    ).toBeInTheDocument();
  });

  it("calls onOpen when hamburger is clicked", () => {
    const onOpen = jest.fn();
    render(<MobileTopBar onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
