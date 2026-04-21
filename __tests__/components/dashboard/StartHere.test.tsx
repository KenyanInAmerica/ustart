import { render, screen } from "@testing-library/react";
import { StartHere } from "@/components/dashboard/StartHere";

// Shared default props — role defaults to "student" across all existing tests.
const defaultProps = {
  hasMembership: false,
  hasAccessedContent: false,
  hasAgreedToCommunity: false,
  role: "student",
};

describe("StartHere", () => {
  it("renders without error", () => {
    const { container } = render(<StartHere {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders the 'Start Here' eyebrow", () => {
    render(<StartHere {...defaultProps} />);
    expect(screen.getByText(/start here/i)).toBeInTheDocument();
  });

  it("renders all 4 step labels", () => {
    render(<StartHere {...defaultProps} />);
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    expect(screen.getByText(/choose your plan/i)).toBeInTheDocument();
    expect(screen.getByText(/access your content/i)).toBeInTheDocument();
    expect(screen.getByText(/join the community/i)).toBeInTheDocument();
  });

  it("marks step 1 as complete regardless of membership", () => {
    render(<StartHere {...defaultProps} />);
    // Only step 1 is done — steps 2, 3, 4 are pending
    expect(screen.getAllByLabelText("Step complete").length).toBe(1);
    expect(screen.getAllByLabelText("Step pending").length).toBe(3);
  });

  it("marks step 2 as complete when hasMembership is true", () => {
    render(<StartHere {...defaultProps} hasMembership={true} />);
    // Steps 1 and 2 done; steps 3 and 4 pending
    expect(screen.getAllByLabelText("Step complete").length).toBe(2);
    expect(screen.getAllByLabelText("Step pending").length).toBe(2);
  });

  it("marks step 3 as complete when hasAccessedContent is true (independent of hasMembership)", () => {
    render(<StartHere {...defaultProps} hasAccessedContent={true} />);
    // Steps 1 and 3 done; steps 2 and 4 pending
    expect(screen.getAllByLabelText("Step complete").length).toBe(2);
    expect(screen.getAllByLabelText("Step pending").length).toBe(2);
  });

  it("marks steps 2 and 3 as complete when both hasMembership and hasAccessedContent are true", () => {
    render(<StartHere {...defaultProps} hasMembership={true} hasAccessedContent={true} />);
    // Steps 1, 2, 3 done; step 4 pending
    expect(screen.getAllByLabelText("Step complete").length).toBe(3);
    expect(screen.getAllByLabelText("Step pending").length).toBe(1);
  });

  it("renders nothing when all steps are complete", () => {
    // Component returns null when all props are true — card collapses entirely.
    const { container } = render(
      <StartHere {...defaultProps} hasMembership={true} hasAccessedContent={true} hasAgreedToCommunity={true} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when role is parent", () => {
    // Parent accounts skip onboarding — component returns null regardless of step state.
    const { container } = render(<StartHere {...defaultProps} role="parent" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the progress bar track", () => {
    const { container } = render(<StartHere {...defaultProps} />);
    const progressBar = container.querySelector(".bg-\\[var\\(--bg-subtle\\)\\]");
    expect(progressBar).toBeInTheDocument();
  });
});
