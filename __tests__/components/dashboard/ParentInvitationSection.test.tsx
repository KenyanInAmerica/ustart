import { render } from "@testing-library/react";
import { ParentInvitationSection } from "@/components/dashboard/ParentInvitationSection";

jest.mock("../../../lib/actions/parentInvitation", () => ({
  sendParentInvitation: jest.fn(),
  resendParentInvitation: jest.fn(),
  cancelParentInvitation: jest.fn(),
  unlinkParent: jest.fn(),
}));

describe("ParentInvitationSection", () => {
  it("renders nothing when the feature flag is disabled", () => {
    const { container } = render(
      <ParentInvitationSection
        initialStatus={null}
        initialParentEmail={null}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
