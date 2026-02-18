/**
 * @jest-environment node
 */
import { POST } from "@/app/api/webhooks/stripe/route";
import { NextRequest } from "next/server";

describe("POST /api/webhooks/stripe", () => {
  it("returns { received: true }", async () => {
    const request = new NextRequest(
      "http://localhost/api/webhooks/stripe",
      { method: "POST" }
    );
    const response = await POST(request);
    const json = await response.json();
    expect(json).toEqual({ received: true });
  });
});
