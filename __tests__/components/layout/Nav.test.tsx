import { render } from "@testing-library/react";
import { Nav } from "@/components/layout/Nav";

describe("Nav", () => {
  it("renders without error", () => {
    const { container } = render(<Nav />);
    expect(container).toBeTruthy();
  });

  it("renders a nav element", () => {
    const { container } = render(<Nav />);
    expect(container.querySelector("nav")).toBeInTheDocument();
  });
});
