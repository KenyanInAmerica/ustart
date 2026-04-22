/** @jest-environment node */

const mockGetUser = jest.fn();
const mockServiceFrom = jest.fn();

jest.mock("../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

jest.mock("../../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
  })),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("../../../../lib/audit/log", () => ({
  logAction: jest.fn(),
}));

import {
  createPlanTemplate,
  deletePlanTemplate,
  savePlanTemplateOrder,
  updatePlanTemplate,
} from "../../../../lib/actions/admin/planTemplates";

function makeChain(returnValue: unknown): Record<string, unknown> {
  const promise = Promise.resolve(returnValue);
  const chain: Record<string, unknown> = {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };
  const fn: jest.Mock = jest.fn(() => chain);
  chain.select = fn;
  chain.insert = fn;
  chain.update = fn;
  chain.delete = fn;
  chain.eq = fn;
  chain.single = jest.fn().mockResolvedValue(returnValue);
  chain.maybeSingle = jest.fn().mockResolvedValue(returnValue);
  return chain;
}

const ADMIN_USER = { id: "admin-id", email: "admin@test.com" };

describe("planTemplates actions", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockServiceFrom.mockReset();
  });

  it("rejects unauthenticated create requests", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await createPlanTemplate({
      title: "Task",
      phase: "before_arrival",
      days_from_arrival: 0,
      tier_required: "lite",
    });

    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("creates a template for admins", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
      .mockReturnValueOnce(makeChain({ count: 1, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: "template-1" }, error: null }));

    const result = await createPlanTemplate({
      title: "Task",
      description: "Description",
      phase: "before_arrival",
      days_from_arrival: 0,
      content_url: "https://notion.so/task",
      tier_required: "lite",
    });

    expect(result).toEqual({ success: true });
  });

  it("updates a template for admins", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }));

    const result = await updatePlanTemplate("template-1", {
      title: "Updated",
      display_order: 2,
    });

    expect(result).toEqual({ success: true });
  });

  it("accepts negative day offsets", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
      .mockReturnValueOnce(makeChain({ count: 2, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: "template-1" }, error: null }));

    const result = await createPlanTemplate({
      title: "Pre-arrival task",
      phase: "before_arrival",
      days_from_arrival: -7,
      tier_required: "lite",
    });

    expect(result).toEqual({ success: true });
  });

  it("deletes an existing template", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
      .mockReturnValueOnce(
        makeChain({
          data: {
            id: "template-1",
            title: "Task",
            description: null,
            phase: "before_arrival",
            days_from_arrival: 0,
            content_url: null,
            tier_required: "lite",
            display_order: 1,
            created_at: "2026-04-21T12:00:00.000Z",
            updated_at: "2026-04-21T12:00:00.000Z",
          },
          error: null,
        })
      )
      .mockReturnValueOnce(makeChain({ error: null }));

    const result = await deletePlanTemplate("template-1");

    expect(result).toEqual({ success: true });
  });

  it("saves a reordered template list for admins", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }))
      .mockReturnValueOnce(makeChain({ error: null }));

    const result = await savePlanTemplateOrder([
      { id: "template-2", display_order: 99 },
      { id: "template-1", display_order: 42 },
    ]);

    expect(result).toEqual({ success: true });
  });
});
