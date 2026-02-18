jest.mock("stripe", () =>
  jest.fn().mockImplementation(() => ({}))
);

import { stripe } from "@/lib/stripe";

describe("lib/stripe", () => {
  it("exports a stripe client", () => {
    expect(stripe).toBeDefined();
  });
});
