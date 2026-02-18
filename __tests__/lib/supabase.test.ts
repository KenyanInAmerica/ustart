jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn().mockReturnValue({}),
}));

import { supabase, createServiceClient } from "@/lib/supabase";

describe("lib/supabase", () => {
  it("exports a supabase browser client", () => {
    expect(supabase).toBeDefined();
  });

  it("exports createServiceClient as a function", () => {
    expect(typeof createServiceClient).toBe("function");
  });

  it("createServiceClient returns a client", () => {
    const client = createServiceClient();
    expect(client).toBeDefined();
  });
});
