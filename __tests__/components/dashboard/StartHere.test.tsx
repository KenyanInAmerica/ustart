import { render, screen } from "@testing-library/react";
import { StartHere } from "@/components/dashboard/StartHere";

describe("StartHere", () => {
  it("renders without error", () => {
    const { container } = render(
      <StartHere hasMembership={false} hasAccessedContent={false} hasAgreedToCommunity={false} />
    );
    expect(container).toBeTruthy();
  });

  it("renders the 'Start Here' eyebrow", () => {
    render(<StartHere hasMembership={false} hasAccessedContent={false} hasAgreedToCommunity={false} />);
    expect(screen.getByText(/start here/i)).toBeInTheDocument();
  });

  it("renders all 4 step labels", () => {
    render(<StartHere hasMembership={false} hasAccessedContent={false} hasAgreedToCommunity={false} />);
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    expect(screen.getByText(/choose your plan/i)).toBeInTheDocument();
    expect(screen.getByText(/access your content/i)).toBeInTheDocument();
    expect(screen.getByText(/join the community/i)).toBeInTheDocument();
  });

  it("marks step 1 as complete regardless of membership", () => {
    render(<StartHere hasMembership={false} hasAccessedContent={false} hasAgreedToCommunity={false} />);
    // Only step 1 is done — steps 2, 3, 4 are pending
    expect(screen.getAllByLabelText("Step complete").length).toBe(1);
    expect(screen.getAllByLabelText("Step pending").length).toBe(3);
  });

  it("marks step 2 as complete when hasMembership is true", () => {
    render(<StartHere hasMembership={true} hasAccessedContent={false} hasAgreedToCommunity={false} />);
    // Steps 1 and 2 done; steps 3 and 4 pending
    expect(screen.getAllByLabelText("Step complete").length).toBe(2);
    expect(screen.getAllByLabelText("Step pending").length).toBe(2);
  });

  it("marks step 3 as complete when hasAccessedContent is true (independent of hasMembership)", () => {
    render(<StartHere hasMembership={false} hasAccessedContent={true} hasAgreedToCommunity={false} />);
    // Steps 1 and 3 done; steps 2 and 4 pending
    expect(screen.getAllByLabelText("Step complete").length).toBe(2);
    expect(screen.getAllByLabelText("Step pending").length).toBe(2);
  });

  it("marks steps 2 and 3 as complete when both hasMembership and hasAccessedContent are true", () => {
    render(<StartHere hasMembership={true} hasAccessedContent={true} hasAgreedToCommunity={false} />);
    // Steps 1, 2, 3 done; step 4 pending
    expect(screen.getAllByLabelText("Step complete").length).toBe(3);
    expect(screen.getAllByLabelText("Step pending").length).toBe(1);
  });

  it("renders nothing when all steps are complete", () => {
    // Component returns null when all props are true — card collapses entirely.
    const { container } = render(
      <StartHere hasMembership={true} hasAccessedContent={true} hasAgreedToCommunity={true} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the top gradient accent line", () => {
    const { container } = render(
      <StartHere hasMembership={false} hasAccessedContent={false} hasAgreedToCommunity={false} />
    );
    // The gradient line is an absolutely-positioned div inside the card
    const gradientLine = container.querySelector(".bg-gradient-to-r");
    expect(gradientLine).toBeInTheDocument();
  });
});
