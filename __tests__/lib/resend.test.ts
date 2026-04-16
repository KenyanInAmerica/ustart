jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({})),
}));

import { resend } from "@/lib/resend/client";

describe("lib/resend/client", () => {
  it("exports a resend client", () => {
    expect(resend).toBeDefined();
  });
});
