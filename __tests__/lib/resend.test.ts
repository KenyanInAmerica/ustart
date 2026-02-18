jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({})),
}));

import { resend } from "@/lib/resend";

describe("lib/resend", () => {
  it("exports a resend client", () => {
    expect(resend).toBeDefined();
  });
});
