# UStart — Git Workflow

## Branch Model

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production-ready code | Vercel production |
| `develop` | Integration branch — staging QA | Vercel staging preview |
| `feature/*` | Feature and bugfix work | Local only → PR into develop |

- **Always cut feature branches from `develop`**
- Never push directly to `develop` or `main` — GitHub branch protection blocks it
- After a feature PR merges to `develop`, promote to production via a `develop → main` PR

## One commit per branch

Each feature or bugfix branch must land as **a single commit** when merged to `develop`. Before pushing or opening a PR, squash any in-progress commits down to one:

```bash
git reset --soft HEAD~N   # N = number of commits to squash
# re-stage everything, then:
git commit -m "..."
```

This keeps `develop` and `main` history linear and easy to bisect. The only exception is a branch that deliberately contains multiple independent logical changes that must be reviewed separately — confirm with the team before breaking the rule.

## Branch Naming

```
feature/short-description
bugfix/short-description
devops/short-description
```

---

## Before Every Commit

Run all three and fix any failures before staging:

```bash
npm run typecheck
npm run lint
npm run test
```

Zero failures required. A single failing test or type error is a hard blocker.

---

## Commit Message Format

Subject line: imperative verb + short noun phrase. 50 characters max. No period.

Body: **3–4 short paragraphs maximum** covering what changed and why. If a branch touches many files, summarise the theme — do not enumerate every file. Mention a specific new file or component only when naming it materially helps a future reader. No bullet lists, no markdown — plain prose only. No co-author trailer.

Pass the message via heredoc to avoid shell quoting issues:

```bash
git commit -m "$(cat <<'EOF'
add parent invitation flow

Introduces the invite token pattern for parent onboarding. Students
send an invite from the Parent Pack page; the parent receives a plain
confirmation URL (/invite?token=UUID) rather than a magic link, so
Gmail's pre-fetch bot cannot consume the token.

acceptInvitation() in lib/actions/parentInvitation.ts creates the
parent user via admin.createUser() then sends a PKCE magic link via
signInWithOtp(). The /auth/callback handles the parent-linking step
once the magic link is clicked.
EOF
)"
```

---

## PR Requirements

- CI must pass (typecheck + lint + test) — enforced by GitHub Actions
- Snapshot (`docs/ustart-project-snapshot.md`) must be updated in the same PR if any of the following changed: new files/directories, database schema, environment variables, new conventions, feature status
- A PR without an updated snapshot when one is required is not mergeable

### What requires a snapshot update

- New files or directories added
- Database tables or columns added/modified
- Environment variables added or changed
- New code conventions introduced
- A feature completed (mark ✅ Built in the build plan table)
- Known issues resolved or new TODOs added

---

## Migration Workflow

Every PR that includes a schema change must update `docs/migrations/001_initial_schema.sql` to reflect the new state. That file is the canonical living schema — not an append-only log. Run the SQL on staging first, verify, then run on production, then update the file and include it in the same PR. See `docs/migrations/README.md` for the full workflow.

---

## Hard Rules

- **Never push directly to `develop` or `main`** — always use a feature branch and PR
- **Never force-push** to shared branches
- **Never skip hooks** (`--no-verify`)
- Do not amend commits that have already been pushed — create a new commit instead
