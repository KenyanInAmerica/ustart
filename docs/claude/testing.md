# UStart — Testing

## Setup

- **Framework**: Jest + React Testing Library
- **Config**: `jest.config.js` (uses `nextJest({ dir: "./" })`)
- **Setup file**: `jest.setup.ts` — imports `@testing-library/jest-dom`
- **Default environment**: `jest-environment-jsdom` (browser-like, for component tests)

---

## File Naming & Location

Test files mirror the source path under `__tests__/`:

```
components/ui/Foo.tsx           → __tests__/components/ui/Foo.test.tsx
lib/actions/myAction.ts         → __tests__/lib/actions/myAction.test.ts
app/dashboard/page.tsx          → __tests__/app/dashboard/page.test.tsx
app/api/pdf/route.ts            → __tests__/app/api/pdf/route.test.ts
```

Every source file with non-trivial logic gets a corresponding test file.

---

## Jest Environment

**jsdom** (default) — for all component and hook tests.

**node** — required for API route handlers. Add this docblock as the first line:

```typescript
/** @jest-environment node */
```

Reason: `NextRequest`/`NextResponse` rely on the web `Request` global, which is native in Node 18+ but unavailable in jsdom.

---

## Required Coverage Per Test File

Every test file must cover at minimum:

1. **Renders without error** — basic smoke test
2. **Key content is present** — visible text, headings, labels
3. **Interactive elements** — links have correct `href`, buttons trigger correct behaviour
4. **Auth-gated behaviour** — if the component shows different UI for authenticated vs unauthenticated state, test both branches
5. **Server actions** (for action test files) — success path and error path; auth check rejects unauthenticated calls

---

## Running Tests

```bash
npm run test                          # Run full suite (no coverage)
npm run test -- --watch              # Watch mode
npm run test -- path/to/file         # Single file
npm run test -- --coverage           # Full suite + coverage report
```

`npm run test` does **not** report coverage by default — the `--coverage` flag must be passed explicitly. Coverage is not enforced in CI; it is used for manual auditing only.

**Coverage baseline** (as of May 17, 2026 — post-HubSpot integration):

| Metric     | Overall |
|------------|---------|
| Statements | 83.69%  |
| Branches   | 84.36%  |
| Functions  | 80.39%  |
| Lines      | 84.72%  |

Test count: 837 tests across 105 suites.

Notable gaps: `lib/actions/admin/users.ts` (~57% — `setUserAddon`, `assignContentToUser`, `revokeContentFromUser` are pre-existing untested functions; `setUserMembershipTier` is fully covered), `lib/dashboard/access.ts` (~63% — parent cross-user branch).

`lib/hubspot/contacts.ts` has two uncovered lines (the `.catch()` callbacks in `trackHubSpotContact` and `trackHubSpotNote`). These are unreachable by design — the underlying async functions are fully wrapped in try/catch and will never reject. All other branches and statements in the HubSpot modules are at 100%.

---

## Hard Rules

- **Zero failures before any commit** — a single failing test is a hard blocker. Fix it before committing.
- **≥90% coverage before committing** — every branch must achieve ≥90% statement coverage (ideally 100%) for all new and modified files. Pre-existing untested code in a file that was only partially modified is exempt, but the new code added in the branch must be fully covered. Run `npm run test -- --coverage --collectCoverageFrom="path/to/file.ts"` to check specific files.
- Run `npm run test` AND `npm run typecheck` after adding or modifying tests — both must pass.
- Do not skip tests with `.skip` or `.todo` unless accompanied by a comment explaining when they'll be addressed.
- Mocking: mock Supabase clients and Resend in unit tests. For integration-style tests that hit real infrastructure, note it clearly in the test file.
